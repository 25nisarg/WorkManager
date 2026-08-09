'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  expenseIdSchema,
  expenseSchema,
  paymentAccountSchema,
  type ExpenseInput,
  type PaymentAccountInput,
} from "@/lib/validations/expense";
import type { ExpenseActionState } from "@/types/expense";

function expenseFormValues(formData: FormData) {
  return {
    assignment_id: String(formData.get("assignment_id") ?? ""),
    payment_account_id: String(formData.get("payment_account_id") ?? ""),
    category: String(formData.get("category") ?? ""),
    description: String(formData.get("description") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    expense_date: String(formData.get("expense_date") ?? ""),
    payment_method: String(formData.get("payment_method") ?? ""),
    transaction_reference: String(
      formData.get("transaction_reference") ?? ""
    ),
    notes: String(formData.get("notes") ?? ""),
    return_to_assignment: String(
      formData.get("return_to_assignment") ?? ""
    ),
  };
}

function accountFormValues(formData: FormData) {
  return {
    account_name: String(formData.get("account_name") ?? ""),
    account_type: String(formData.get("account_type") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    is_active: formData.get("is_active") === "on" ? "active" : "inactive",
  };
}

function expensePayload(input: ExpenseInput) {
  return {
    assignment_id: input.assignment_id || null,
    payment_account_id: input.payment_account_id || null,
    category: input.category,
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    expense_date: input.expense_date,
    payment_method: input.payment_method,
    transaction_reference: input.transaction_reference || null,
    notes: input.notes || null,
  };
}

function accountPayload(input: PaymentAccountInput) {
  return {
    account_name: input.account_name,
    account_type: input.account_type,
    currency: input.currency,
    notes: input.notes || null,
    is_active: input.is_active === "active",
  };
}

function databaseMessage(
  error: PostgrestError,
  entity: "expense" | "account",
  operation: "save" | "delete"
) {
  if (error.code === "23503") {
    return entity === "account" && operation === "delete"
      ? "This account is used by a payment or expense and cannot be deleted. Deactivate it instead."
      : operation === "delete"
        ? "This expense is linked to another record and cannot be deleted."
        : "A selected assignment or payment account is no longer available.";
  }
  if (error.code === "23505") {
    return entity === "account"
      ? "A payment account with this name already exists."
      : "This expense already exists.";
  }
  if (error.code === "42501") {
    return `You do not have permission to change this ${entity}.`;
  }
  return operation === "delete"
    ? `We could not delete this ${entity}. Please try again.`
    : `We could not save this ${entity}. Please try again.`;
}

function logDatabaseError(
  entity: "expense" | "account",
  mode: "create" | "update" | "delete",
  userId: string,
  recordId: string | null,
  error: PostgrestError
) {
  console.error("[expense mutation failed]", {
    entity,
    mode,
    authenticatedUserId: userId,
    recordId,
    errorCode: error.code,
    errorMessage: error.message,
    errorDetails: error.details,
    errorHint: error.hint,
  });
}

async function authenticatedContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}

async function verifyOptionalRelationship(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "assignments" | "payment_accounts",
  ownerId: string,
  recordId: string
) {
  if (!recordId) return { valid: true, error: null };
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("id", recordId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  return { valid: Boolean(data), error };
}

function invalidState(
  values: Record<string, string>,
  fieldErrors: Record<string, string[] | undefined>
): ExpenseActionState {
  return { values, fieldErrors };
}

function refreshExpensePaths(...assignmentIds: Array<string | null | undefined>) {
  revalidatePath("/expenses");
  revalidatePath("/payments");
  for (const id of new Set(assignmentIds.filter(Boolean))) {
    revalidatePath("/assignments/" + id);
  }
}

function redirectAfterExpense(
  values: Record<string, string>,
  assignmentId: string
): never {
  if (assignmentId && values.return_to_assignment === assignmentId) {
    redirect("/assignments/" + assignmentId);
  }
  redirect("/expenses");
}

export async function createExpense(
  _previousState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const values = expenseFormValues(formData);
  const parsed = expenseSchema.safeParse(values);
  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }

  const { supabase, user } = await authenticatedContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again.", values };
  }

  const [assignmentCheck, accountCheck] = await Promise.all([
    verifyOptionalRelationship(
      supabase,
      "assignments",
      user.id,
      parsed.data.assignment_id
    ),
    verifyOptionalRelationship(
      supabase,
      "payment_accounts",
      user.id,
      parsed.data.payment_account_id
    ),
  ]);
  if (assignmentCheck.error || accountCheck.error) {
    return { error: "We could not verify the expense relationships.", values };
  }
  if (!assignmentCheck.valid) {
    return invalidState(values, {
      assignment_id: ["Select one of your assignments."],
    });
  }
  if (!accountCheck.valid) {
    return invalidState(values, {
      payment_account_id: ["Select one of your payment accounts."],
    });
  }

  const { error } = await supabase.from("expenses").insert({
    owner_id: user.id,
    ...expensePayload(parsed.data),
  });
  if (error) {
    logDatabaseError("expense", "create", user.id, null, error);
    return { error: databaseMessage(error, "expense", "save"), values };
  }

  refreshExpensePaths(parsed.data.assignment_id);
  redirectAfterExpense(values, parsed.data.assignment_id);
}

export async function updateExpense(
  expenseId: string,
  _previousState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const idResult = expenseIdSchema.safeParse(expenseId);
  if (!idResult.success) return { error: "This expense link is invalid." };
  const values = expenseFormValues(formData);
  const parsed = expenseSchema.safeParse(values);
  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }

  const { supabase, user } = await authenticatedContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again.", values };
  }
  const { data: existing, error: lookupError } = await supabase
    .from("expenses")
    .select("id, assignment_id")
    .eq("id", idResult.data)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (lookupError) {
    return { error: databaseMessage(lookupError, "expense", "save"), values };
  }
  if (!existing) return { error: "This expense no longer exists.", values };

  const [assignmentCheck, accountCheck] = await Promise.all([
    verifyOptionalRelationship(
      supabase,
      "assignments",
      user.id,
      parsed.data.assignment_id
    ),
    verifyOptionalRelationship(
      supabase,
      "payment_accounts",
      user.id,
      parsed.data.payment_account_id
    ),
  ]);
  if (assignmentCheck.error || accountCheck.error) {
    return { error: "We could not verify the expense relationships.", values };
  }
  if (!assignmentCheck.valid || !accountCheck.valid) {
    return { error: "Select an assignment and account that belong to you.", values };
  }

  const { error } = await supabase
    .from("expenses")
    .update(expensePayload(parsed.data))
    .eq("id", idResult.data)
    .eq("owner_id", user.id);
  if (error) {
    logDatabaseError("expense", "update", user.id, idResult.data, error);
    return { error: databaseMessage(error, "expense", "save"), values };
  }

  refreshExpensePaths(existing.assignment_id, parsed.data.assignment_id);
  redirectAfterExpense(values, parsed.data.assignment_id);
}

export async function deleteExpense(
  expenseId: string,
  returnAssignmentId: string | null,
  _previousState: ExpenseActionState,
  _formData: FormData
): Promise<ExpenseActionState> {
  void _previousState;
  void _formData;
  const idResult = expenseIdSchema.safeParse(expenseId);
  if (!idResult.success) return { error: "This expense link is invalid." };
  const { supabase, user } = await authenticatedContext();
  if (!user) return { error: "Your session has expired. Please sign in again." };

  const { data: existing, error: lookupError } = await supabase
    .from("expenses")
    .select("id, assignment_id")
    .eq("id", idResult.data)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (lookupError) {
    return { error: databaseMessage(lookupError, "expense", "delete") };
  }
  if (!existing) return { error: "This expense no longer exists." };

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", idResult.data)
    .eq("owner_id", user.id);
  if (error) {
    logDatabaseError("expense", "delete", user.id, idResult.data, error);
    return { error: databaseMessage(error, "expense", "delete") };
  }
  refreshExpensePaths(existing.assignment_id);
  if (
    existing.assignment_id &&
    returnAssignmentId === existing.assignment_id
  ) {
    redirect("/assignments/" + existing.assignment_id);
  }
  redirect("/expenses");
}

export async function createPaymentAccount(
  _previousState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const values = accountFormValues(formData);
  const parsed = paymentAccountSchema.safeParse(values);
  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }
  const { supabase, user } = await authenticatedContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again.", values };
  }
  const { error } = await supabase.from("payment_accounts").insert({
    owner_id: user.id,
    ...accountPayload(parsed.data),
  });
  if (error) {
    logDatabaseError("account", "create", user.id, null, error);
    return { error: databaseMessage(error, "account", "save"), values };
  }
  revalidatePath("/settings");
  revalidatePath("/payments");
  revalidatePath("/expenses");
  redirect("/settings");
}

export async function updatePaymentAccount(
  accountId: string,
  _previousState: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const idResult = expenseIdSchema.safeParse(accountId);
  if (!idResult.success) return { error: "This account link is invalid." };
  const values = accountFormValues(formData);
  const parsed = paymentAccountSchema.safeParse(values);
  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }
  const { supabase, user } = await authenticatedContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again.", values };
  }
  const { data: existing, error: lookupError } = await supabase
    .from("payment_accounts")
    .select("id")
    .eq("id", idResult.data)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (lookupError) {
    return { error: databaseMessage(lookupError, "account", "save"), values };
  }
  if (!existing) return { error: "This payment account no longer exists.", values };

  const { error } = await supabase
    .from("payment_accounts")
    .update(accountPayload(parsed.data))
    .eq("id", idResult.data)
    .eq("owner_id", user.id);
  if (error) {
    logDatabaseError("account", "update", user.id, idResult.data, error);
    return { error: databaseMessage(error, "account", "save"), values };
  }
  revalidatePath("/settings");
  revalidatePath("/payments");
  revalidatePath("/expenses");
  redirect("/settings");
}

export async function deletePaymentAccount(
  accountId: string,
  _previousState: ExpenseActionState,
  _formData: FormData
): Promise<ExpenseActionState> {
  void _previousState;
  void _formData;
  const idResult = expenseIdSchema.safeParse(accountId);
  if (!idResult.success) return { error: "This account link is invalid." };
  const { supabase, user } = await authenticatedContext();
  if (!user) return { error: "Your session has expired. Please sign in again." };

  const { data: account, error: lookupError } = await supabase
    .from("payment_accounts")
    .select("id")
    .eq("id", idResult.data)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (lookupError) {
    return { error: databaseMessage(lookupError, "account", "delete") };
  }
  if (!account) return { error: "This payment account no longer exists." };

  const referenceChecks = await Promise.all([
    supabase
      .from("client_payments")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("payment_account_id", idResult.data),
    supabase
      .from("worker_payments")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("payment_account_id", idResult.data),
    supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("payment_account_id", idResult.data),
  ]);
  const referenceError = referenceChecks.find((check) => check.error)?.error;
  if (referenceError) {
    return { error: "We could not verify whether this account is in use." };
  }
  if (referenceChecks.some((check) => (check.count ?? 0) > 0)) {
    return {
      error:
        "This account is used by a payment or expense. Deactivate it instead of deleting it.",
    };
  }

  const { error } = await supabase
    .from("payment_accounts")
    .delete()
    .eq("id", idResult.data)
    .eq("owner_id", user.id);
  if (error) {
    logDatabaseError("account", "delete", user.id, idResult.data, error);
    return { error: databaseMessage(error, "account", "delete") };
  }
  revalidatePath("/settings");
  revalidatePath("/payments");
  revalidatePath("/expenses");
  redirect("/settings");
}
