'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  assignmentIdSchema,
  assignmentSchema,
  type AssignmentInput,
} from "@/lib/validations/assignment";
import type { AssignmentActionState } from "@/types/assignment";

function formValues(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    assessment_name: String(formData.get("assessment_name") ?? ""),
    received_from_id: String(formData.get("received_from_id") ?? ""),
    received_date: String(formData.get("received_date") ?? ""),
    client_deadline: String(formData.get("client_deadline") ?? ""),
    timezone_offset: String(formData.get("timezone_offset") ?? "0"),
    pricing_type: String(formData.get("pricing_type") ?? ""),
    number_of_copies: String(formData.get("number_of_copies") ?? ""),
    price_per_copy: String(formData.get("price_per_copy") ?? ""),
    selling_price: String(formData.get("selling_price") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    status: String(formData.get("status") ?? ""),
    priority: String(formData.get("priority") ?? ""),
    work_mode: String(formData.get("work_mode") ?? ""),
    description: String(formData.get("description") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
}

function nullable(value: string) {
  return value || null;
}

function localDateTimeToIso(value: string, timezoneOffset: number) {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const utcMilliseconds =
    Date.UTC(year, month - 1, day, hour, minute) +
    timezoneOffset * 60 * 1000;

  return new Date(utcMilliseconds).toISOString();
}

function assignmentPayload(input: AssignmentInput) {
  const sellingPrice =
    input.pricing_type === "per_copy"
      ? Math.round(
          (input.number_of_copies * input.price_per_copy + Number.EPSILON) * 100
        ) / 100
      : input.selling_price;

  return {
    title: input.title,
    subject: nullable(input.subject),
    assessment_name: nullable(input.assessment_name),
    received_from_id: input.received_from_id,
    received_date: input.received_date,
    client_deadline: localDateTimeToIso(
      input.client_deadline,
      input.timezone_offset
    ),
    number_of_copies: input.number_of_copies,
    price_per_copy: input.price_per_copy,
    selling_price: sellingPrice,
    currency: input.currency,
    status: input.status,
    priority: input.priority,
    work_mode: input.work_mode,
    description: nullable(input.description),
    notes: nullable(input.notes),
  };
}

function databaseMessage(error: PostgrestError, operation: "save" | "delete") {
  if (error.code === "23503") {
    return operation === "delete"
      ? "This assignment is linked to other records and cannot be deleted."
      : "The selected contact is no longer available.";
  }
  if (error.code === "23505") {
    return "An assignment with these details already exists.";
  }
  if (error.code === "42501") {
    return "You do not have permission to change this assignment.";
  }
  return operation === "delete"
    ? "We could not delete this assignment. Please try again."
    : "We could not save this assignment. Please try again.";
}

function logDatabaseError(
  mode: "create" | "update" | "delete",
  stage: string,
  userId: string,
  assignmentId: string | null,
  error: PostgrestError
) {
  console.error("[assignment mutation failed]", {
    mode,
    stage,
    authenticatedUserId: userId,
    assignmentId,
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

async function ownedContactExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  contactId: string
) {
  const { data, error } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  return { exists: Boolean(data), error };
}

function invalidState(
  values: ReturnType<typeof formValues>,
  fieldErrors: Record<string, string[] | undefined>
): AssignmentActionState {
  return { values, fieldErrors };
}

export async function createAssignment(
  _previousState: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  const values = formValues(formData);
  const parsed = assignmentSchema.safeParse(values);
  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again.", values };
  }

  const contactCheck = await ownedContactExists(
    supabase,
    user.id,
    parsed.data.received_from_id
  );
  if (contactCheck.error) {
    return {
      error: "We could not verify the selected contact. Please try again.",
      values,
    };
  }
  if (!contactCheck.exists) {
    return invalidState(values, {
      received_from_id: ["Select one of your own contacts."],
    });
  }

  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert({
      owner_id: user.id,
      ...assignmentPayload(parsed.data),
    })
    .select("id, task_code")
    .single();

  if (error || !assignment) {
    if (error) {
      logDatabaseError("create", "assignments.insert.select", user.id, null, error);
    }
    return {
      error: error
        ? databaseMessage(error, "save")
        : "We could not save this assignment.",
      values,
    };
  }

  revalidatePath("/assignments");
  redirect("/assignments/" + assignment.id);
}

export async function updateAssignment(
  assignmentId: string,
  _previousState: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  const idResult = assignmentIdSchema.safeParse(assignmentId);
  if (!idResult.success) {
    return { error: "This assignment link is invalid." };
  }

  const values = formValues(formData);
  const parsed = assignmentSchema.safeParse(values);
  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again.", values };
  }

  const { data: existingAssignment, error: lookupError } = await supabase
    .from("assignments")
    .select("id")
    .eq("id", idResult.data)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (lookupError) {
    logDatabaseError("update", "assignments.ownership.select", user.id, idResult.data, lookupError);
    return { error: databaseMessage(lookupError, "save"), values };
  }
  if (!existingAssignment) {
    return { error: "This assignment no longer exists." };
  }

  const contactCheck = await ownedContactExists(
    supabase,
    user.id,
    parsed.data.received_from_id
  );
  if (contactCheck.error) {
    return {
      error: "We could not verify the selected contact. Please try again.",
      values,
    };
  }
  if (!contactCheck.exists) {
    return invalidState(values, {
      received_from_id: ["Select one of your own contacts."],
    });
  }

  const { error } = await supabase
    .from("assignments")
    .update(assignmentPayload(parsed.data))
    .eq("id", idResult.data)
    .eq("owner_id", user.id);

  if (error) {
    logDatabaseError("update", "assignments.update", user.id, idResult.data, error);
    return { error: databaseMessage(error, "save"), values };
  }

  revalidatePath("/assignments");
  revalidatePath("/assignments/" + idResult.data);
  redirect("/assignments/" + idResult.data);
}

export async function deleteAssignment(
  assignmentId: string,
  previousState: AssignmentActionState,
  formData: FormData
): Promise<AssignmentActionState> {
  void previousState;
  void formData;

  const idResult = assignmentIdSchema.safeParse(assignmentId);
  if (!idResult.success) {
    return { error: "This assignment link is invalid." };
  }

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const { data: existingAssignment, error: lookupError } = await supabase
    .from("assignments")
    .select("id")
    .eq("id", idResult.data)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (lookupError) {
    logDatabaseError("delete", "assignments.ownership.select", user.id, idResult.data, lookupError);
    return { error: databaseMessage(lookupError, "delete") };
  }
  if (!existingAssignment) {
    return { error: "This assignment no longer exists." };
  }

  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", idResult.data)
    .eq("owner_id", user.id);

  if (error) {
    logDatabaseError("delete", "assignments.delete", user.id, idResult.data, error);
    return { error: databaseMessage(error, "delete") };
  }

  revalidatePath("/assignments");
  redirect("/assignments");
}
