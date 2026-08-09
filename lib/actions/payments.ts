'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  clientPaymentSchema,
  paymentIdSchema,
  workerPaymentSchema,
  type ClientPaymentInput,
  type WorkerPaymentInput,
} from "@/lib/validations/payment";
import type { PaymentActionState } from "@/types/payment";

function clientFormValues(formData: FormData) {
  return {
    assignment_id: String(formData.get("assignment_id") ?? ""),
    payer_id: String(formData.get("payer_id") ?? ""),
    payment_date: String(formData.get("payment_date") ?? ""),
    amount_original: String(formData.get("amount_original") ?? ""),
    currency_original: String(formData.get("currency_original") ?? ""),
    exchange_rate: String(formData.get("exchange_rate") ?? ""),
    amount_inr: String(formData.get("amount_inr") ?? ""),
    payment_method: String(formData.get("payment_method") ?? ""),
    payment_account_id: String(formData.get("payment_account_id") ?? ""),
    transaction_reference: String(
      formData.get("transaction_reference") ?? ""
    ),
    notes: String(formData.get("notes") ?? ""),
  };
}

function workerFormValues(formData: FormData) {
  return {
    assignment_worker_id: String(
      formData.get("assignment_worker_id") ?? ""
    ),
    payment_date: String(formData.get("payment_date") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    payment_method: String(formData.get("payment_method") ?? ""),
    payment_account_id: String(formData.get("payment_account_id") ?? ""),
    transaction_reference: String(
      formData.get("transaction_reference") ?? ""
    ),
    notes: String(formData.get("notes") ?? ""),
  };
}

function clientPayload(input: ClientPaymentInput) {
  return {
    assignment_id: input.assignment_id,
    payer_id: input.payer_id,
    payment_date: input.payment_date,
    amount_original: input.amount_original,
    currency_original: input.currency_original,
    exchange_rate: input.exchange_rate === "" ? null : input.exchange_rate,
    amount_inr: input.amount_inr,
    payment_method: input.payment_method,
    payment_account_id: input.payment_account_id || null,
    transaction_reference: input.transaction_reference || null,
    notes: input.notes || null,
  };
}

function workerPayload(input: WorkerPaymentInput, workerId: string) {
  return {
    assignment_worker_id: input.assignment_worker_id,
    worker_id: workerId,
    payment_date: input.payment_date,
    amount: input.amount,
    currency: input.currency,
    payment_method: input.payment_method,
    payment_account_id: input.payment_account_id || null,
    transaction_reference: input.transaction_reference || null,
    notes: input.notes || null,
  };
}

function databaseMessage(error: PostgrestError, operation: "save" | "delete") {
  if (error.code === "23503") {
    return operation === "delete"
      ? "This payment is linked to other records and cannot be deleted."
      : "The selected assignment, contact, allocation, or account is unavailable.";
  }
  if (error.code === "23505") {
    return "This payment transaction already exists.";
  }
  if (error.code === "42501") {
    return "You do not have permission to change this payment.";
  }
  return operation === "delete"
    ? "We could not delete this payment. Please try again."
    : "We could not save this payment. Please try again.";
}

function logDatabaseError(
  direction: "received" | "paid",
  mode: "create" | "update" | "delete",
  stage: string,
  userId: string,
  paymentId: string | null,
  error: PostgrestError
) {
  console.error("[payment mutation failed]", {
    direction,
    mode,
    stage,
    authenticatedUserId: userId,
    paymentId,
    errorCode: error.code,
    errorMessage: error.message,
    errorDetails: error.details,
    errorHint: error.hint,
  });
}

async function authenticatedMutationContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return { supabase, user: error ? null : user };
}

async function verifyAssignment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  assignmentId: string
) {
  const { data, error } = await supabase
    .from("assignments")
    .select("id")
    .eq("id", assignmentId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  return { valid: Boolean(data), error };
}

async function verifyPayer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  payerId: string
) {
  const [contactResult, roleResult] = await Promise.all([
    supabase
      .from("contacts")
      .select("id")
      .eq("id", payerId)
      .eq("owner_id", ownerId)
      .maybeSingle(),
    supabase
      .from("contact_roles")
      .select("contact_id")
      .eq("contact_id", payerId)
      .eq("owner_id", ownerId)
      .in("role", ["student", "vendor", "freelancer"])
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    valid: Boolean(contactResult.data && roleResult.data),
    error: contactResult.error ?? roleResult.error,
  };
}

async function verifyPaymentAccount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  accountId: string
) {
  if (!accountId) return { valid: true, error: null };

  const { data, error } = await supabase
    .from("payment_accounts")
    .select("id")
    .eq("id", accountId)
    .eq("owner_id", ownerId)
    .maybeSingle();
  return { valid: Boolean(data), error };
}

async function verifyAllocation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  allocationId: string
) {
  const { data, error } = await supabase
    .from("assignment_workers")
    .select("id, assignment_id, worker_id")
    .eq("id", allocationId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error || !data) {
    return { allocation: null, error };
  }

  const assignmentCheck = await verifyAssignment(
    supabase,
    ownerId,
    data.assignment_id
  );
  return {
    allocation: assignmentCheck.valid ? data : null,
    error: assignmentCheck.error,
  };
}

function invalidState(
  values: Record<string, string>,
  fieldErrors: Record<string, string[] | undefined>
): PaymentActionState {
  return { values, fieldErrors };
}

function refreshPaymentPaths(assignmentIds: Array<string | null | undefined>) {
  revalidatePath("/payments");
  for (const assignmentId of new Set(assignmentIds.filter(Boolean))) {
    revalidatePath("/assignments/" + assignmentId);
  }
}

export async function createClientPayment(
  _previousState: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const values = clientFormValues(formData);
  const parsed = clientPaymentSchema.safeParse(values);
  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again.", values };
  }

  const [assignmentCheck, payerCheck, accountCheck] = await Promise.all([
    verifyAssignment(supabase, user.id, parsed.data.assignment_id),
    verifyPayer(supabase, user.id, parsed.data.payer_id),
    verifyPaymentAccount(
      supabase,
      user.id,
      parsed.data.payment_account_id
    ),
  ]);
  if (assignmentCheck.error || payerCheck.error || accountCheck.error) {
    return { error: "We could not verify the payment relationships.", values };
  }
  if (!assignmentCheck.valid) {
    return invalidState(values, {
      assignment_id: ["Select one of your assignments."],
    });
  }
  if (!payerCheck.valid) {
    return invalidState(values, {
      payer_id: ["Select one of your student, vendor, or freelancer contacts."],
    });
  }
  if (!accountCheck.valid) {
    return invalidState(values, {
      payment_account_id: ["Select one of your payment accounts."],
    });
  }

  const { error } = await supabase.from("client_payments").insert({
    owner_id: user.id,
    ...clientPayload(parsed.data),
  });
  if (error) {
    logDatabaseError("received", "create", "client_payments.insert", user.id, null, error);
    return { error: databaseMessage(error, "save"), values };
  }

  refreshPaymentPaths([parsed.data.assignment_id]);
  redirect("/assignments/" + parsed.data.assignment_id);
}

export async function updateClientPayment(
  paymentId: string,
  _previousState: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const idResult = paymentIdSchema.safeParse(paymentId);
  if (!idResult.success) return { error: "This payment link is invalid." };

  const values = clientFormValues(formData);
  const parsed = clientPaymentSchema.safeParse(values);
  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again.", values };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("client_payments")
    .select("id, assignment_id")
    .eq("id", idResult.data)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (lookupError) {
    return { error: databaseMessage(lookupError, "save"), values };
  }
  if (!existing) return { error: "This payment no longer exists.", values };

  const [assignmentCheck, payerCheck, accountCheck] = await Promise.all([
    verifyAssignment(supabase, user.id, parsed.data.assignment_id),
    verifyPayer(supabase, user.id, parsed.data.payer_id),
    verifyPaymentAccount(
      supabase,
      user.id,
      parsed.data.payment_account_id
    ),
  ]);
  if (assignmentCheck.error || payerCheck.error || accountCheck.error) {
    return { error: "We could not verify the payment relationships.", values };
  }
  if (!assignmentCheck.valid || !payerCheck.valid || !accountCheck.valid) {
    return { error: "Select an assignment, payer, and account that belong to you.", values };
  }

  const { error } = await supabase
    .from("client_payments")
    .update(clientPayload(parsed.data))
    .eq("id", idResult.data)
    .eq("owner_id", user.id);
  if (error) {
    logDatabaseError("received", "update", "client_payments.update", user.id, idResult.data, error);
    return { error: databaseMessage(error, "save"), values };
  }

  refreshPaymentPaths([existing.assignment_id, parsed.data.assignment_id]);
  redirect("/assignments/" + parsed.data.assignment_id);
}

export async function createWorkerPayment(
  _previousState: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const values = workerFormValues(formData);
  const parsed = workerPaymentSchema.safeParse(values);
  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again.", values };
  }

  const [allocationCheck, accountCheck] = await Promise.all([
    verifyAllocation(supabase, user.id, parsed.data.assignment_worker_id),
    verifyPaymentAccount(
      supabase,
      user.id,
      parsed.data.payment_account_id
    ),
  ]);
  if (allocationCheck.error || accountCheck.error) {
    return { error: "We could not verify the payment relationships.", values };
  }
  if (!allocationCheck.allocation) {
    return invalidState(values, {
      assignment_worker_id: ["Select one of your writer allocations."],
    });
  }
  if (!accountCheck.valid) {
    return invalidState(values, {
      payment_account_id: ["Select one of your payment accounts."],
    });
  }

  const allocation = allocationCheck.allocation;
  const { error } = await supabase.from("worker_payments").insert({
    owner_id: user.id,
    ...workerPayload(parsed.data, allocation.worker_id),
  });
  if (error) {
    logDatabaseError("paid", "create", "worker_payments.insert", user.id, null, error);
    return { error: databaseMessage(error, "save"), values };
  }

  refreshPaymentPaths([allocation.assignment_id]);
  redirect("/assignments/" + allocation.assignment_id);
}

export async function updateWorkerPayment(
  paymentId: string,
  _previousState: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const idResult = paymentIdSchema.safeParse(paymentId);
  if (!idResult.success) return { error: "This payment link is invalid." };

  const values = workerFormValues(formData);
  const parsed = workerPaymentSchema.safeParse(values);
  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again.", values };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("worker_payments")
    .select("id, assignment_worker_id")
    .eq("id", idResult.data)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (lookupError) {
    return { error: databaseMessage(lookupError, "save"), values };
  }
  if (!existing) return { error: "This payment no longer exists.", values };

  const [oldAllocation, allocationCheck, accountCheck] = await Promise.all([
    verifyAllocation(supabase, user.id, existing.assignment_worker_id),
    verifyAllocation(supabase, user.id, parsed.data.assignment_worker_id),
    verifyPaymentAccount(
      supabase,
      user.id,
      parsed.data.payment_account_id
    ),
  ]);
  if (
    oldAllocation.error ||
    allocationCheck.error ||
    accountCheck.error
  ) {
    return { error: "We could not verify the payment relationships.", values };
  }
  if (!allocationCheck.allocation || !accountCheck.valid) {
    return { error: "Select an allocation and account that belong to you.", values };
  }

  const allocation = allocationCheck.allocation;
  const { error } = await supabase
    .from("worker_payments")
    .update(workerPayload(parsed.data, allocation.worker_id))
    .eq("id", idResult.data)
    .eq("owner_id", user.id);
  if (error) {
    logDatabaseError("paid", "update", "worker_payments.update", user.id, idResult.data, error);
    return { error: databaseMessage(error, "save"), values };
  }

  refreshPaymentPaths([
    oldAllocation.allocation?.assignment_id,
    allocation.assignment_id,
  ]);
  redirect("/assignments/" + allocation.assignment_id);
}

export async function deleteClientPayment(
  paymentId: string,
  previousState: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  void previousState;
  void formData;
  return deletePayment("received", paymentId);
}

export async function deleteWorkerPayment(
  paymentId: string,
  previousState: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  void previousState;
  void formData;
  return deletePayment("paid", paymentId);
}

async function deletePayment(
  direction: "received" | "paid",
  paymentId: string
): Promise<PaymentActionState> {
  const idResult = paymentIdSchema.safeParse(paymentId);
  if (!idResult.success) return { error: "This payment link is invalid." };

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) return { error: "Your session has expired. Please sign in again." };
  let assignmentId: string;

  if (direction === "received") {
    const { data: payment, error: lookupError } = await supabase
      .from("client_payments")
      .select("id, assignment_id")
      .eq("id", idResult.data)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (lookupError) return { error: databaseMessage(lookupError, "delete") };
    if (!payment) return { error: "This payment no longer exists." };

    const { error } = await supabase
      .from("client_payments")
      .delete()
      .eq("id", idResult.data)
      .eq("owner_id", user.id);
    if (error) {
      logDatabaseError(direction, "delete", "client_payments.delete", user.id, idResult.data, error);
      return { error: databaseMessage(error, "delete") };
    }
    refreshPaymentPaths([payment.assignment_id]);
    assignmentId = payment.assignment_id;
  } else {
    const { data: payment, error: lookupError } = await supabase
      .from("worker_payments")
      .select("id, assignment_worker_id")
      .eq("id", idResult.data)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (lookupError) return { error: databaseMessage(lookupError, "delete") };
    if (!payment) return { error: "This payment no longer exists." };

    const allocation = await verifyAllocation(
      supabase,
      user.id,
      payment.assignment_worker_id
    );
    if (allocation.error || !allocation.allocation) {
      return { error: "We could not verify this payment allocation." };
    }
    const { error } = await supabase
      .from("worker_payments")
      .delete()
      .eq("id", idResult.data)
      .eq("owner_id", user.id);
    if (error) {
      logDatabaseError(direction, "delete", "worker_payments.delete", user.id, idResult.data, error);
      return { error: databaseMessage(error, "delete") };
    }
    refreshPaymentPaths([allocation.allocation.assignment_id]);
    assignmentId = allocation.allocation.assignment_id;
  }

  redirect("/assignments/" + assignmentId);
}
