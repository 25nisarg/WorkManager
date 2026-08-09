'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  assignmentWorkerIdSchema,
  assignmentWorkerSchema,
  type AssignmentWorkerInput,
} from "@/lib/validations/assignment-worker";
import { assignmentIdSchema } from "@/lib/validations/assignment";
import type { AssignmentWorkerActionState } from "@/types/assignment-worker";

function formValues(formData: FormData) {
  return {
    worker_id: String(formData.get("worker_id") ?? ""),
    work_description: String(formData.get("work_description") ?? ""),
    assigned_date: String(formData.get("assigned_date") ?? ""),
    worker_deadline: String(formData.get("worker_deadline") ?? ""),
    agreed_cost: String(formData.get("agreed_cost") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    status: String(formData.get("status") ?? ""),
    delivered_at: String(formData.get("delivered_at") ?? ""),
    timezone_offset: String(formData.get("timezone_offset") ?? "0"),
    notes: String(formData.get("notes") ?? ""),
  };
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

function allocationPayload(input: AssignmentWorkerInput) {
  return {
    worker_id: input.worker_id,
    work_description: input.work_description,
    assigned_date: input.assigned_date,
    worker_deadline: localDateTimeToIso(
      input.worker_deadline,
      input.timezone_offset
    ),
    agreed_cost: input.agreed_cost,
    currency: input.currency,
    status: input.status,
    delivered_at: input.delivered_at
      ? localDateTimeToIso(input.delivered_at, input.timezone_offset)
      : null,
    notes: input.notes || null,
  };
}

function databaseMessage(error: PostgrestError, operation: "save" | "delete") {
  if (error.code === "23503") {
    return operation === "delete"
      ? "This writer allocation has linked payments and cannot be removed."
      : "The assignment or writer is no longer available.";
  }
  if (error.code === "23505") {
    return "This writer is already allocated to the assignment.";
  }
  if (error.code === "42501") {
    return "You do not have permission to change this writer allocation.";
  }
  return operation === "delete"
    ? "We could not remove this writer allocation. Please try again."
    : "We could not save this writer allocation. Please try again.";
}

function logDatabaseError(
  mode: "create" | "update" | "delete",
  stage: string,
  userId: string,
  assignmentId: string,
  allocationId: string | null,
  error: PostgrestError
) {
  console.error("[assignment worker mutation failed]", {
    mode,
    stage,
    authenticatedUserId: userId,
    assignmentId,
    allocationId,
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

async function verifyOwnedAssignment(
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

async function verifyEligibleWriter(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  writerId: string
) {
  const [contactResult, roleResult] = await Promise.all([
    supabase
      .from("contacts")
      .select("id")
      .eq("id", writerId)
      .eq("owner_id", ownerId)
      .maybeSingle(),
    supabase
      .from("contact_roles")
      .select("contact_id")
      .eq("contact_id", writerId)
      .eq("owner_id", ownerId)
      .in("role", ["writer", "freelancer"])
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    valid: Boolean(contactResult.data && roleResult.data),
    error: contactResult.error ?? roleResult.error,
  };
}

function invalidState(
  values: ReturnType<typeof formValues>,
  fieldErrors: Record<string, string[] | undefined>
): AssignmentWorkerActionState {
  return { values, fieldErrors };
}

export async function createAssignmentWorker(
  assignmentId: string,
  _previousState: AssignmentWorkerActionState,
  formData: FormData
): Promise<AssignmentWorkerActionState> {
  const assignmentIdResult = assignmentIdSchema.safeParse(assignmentId);
  if (!assignmentIdResult.success) {
    return { error: "This assignment link is invalid." };
  }

  const values = formValues(formData);
  const parsed = assignmentWorkerSchema.safeParse(values);
  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again.", values };
  }

  const [assignmentCheck, writerCheck] = await Promise.all([
    verifyOwnedAssignment(supabase, user.id, assignmentIdResult.data),
    verifyEligibleWriter(supabase, user.id, parsed.data.worker_id),
  ]);

  if (assignmentCheck.error || writerCheck.error) {
    return {
      error: "We could not verify the assignment and writer. Please try again.",
      values,
    };
  }
  if (!assignmentCheck.valid) {
    return { error: "This assignment does not exist or is not yours.", values };
  }
  if (!writerCheck.valid) {
    return invalidState(values, {
      worker_id: ["Select one of your writer or freelancer contacts."],
    });
  }

  const { data: duplicate, error: duplicateError } = await supabase
    .from("assignment_workers")
    .select("id")
    .eq("owner_id", user.id)
    .eq("assignment_id", assignmentIdResult.data)
    .eq("worker_id", parsed.data.worker_id)
    .maybeSingle();

  if (duplicateError) {
    return { error: databaseMessage(duplicateError, "save"), values };
  }
  if (duplicate) {
    return invalidState(values, {
      worker_id: ["This writer is already allocated to the assignment."],
    });
  }

  const { error } = await supabase.from("assignment_workers").insert({
    owner_id: user.id,
    assignment_id: assignmentIdResult.data,
    ...allocationPayload(parsed.data),
  });

  if (error) {
    logDatabaseError(
      "create",
      "assignment_workers.insert",
      user.id,
      assignmentIdResult.data,
      null,
      error
    );
    return { error: databaseMessage(error, "save"), values };
  }

  revalidatePath("/assignments/" + assignmentIdResult.data);
  redirect("/assignments/" + assignmentIdResult.data);
}

export async function updateAssignmentWorker(
  assignmentId: string,
  allocationId: string,
  _previousState: AssignmentWorkerActionState,
  formData: FormData
): Promise<AssignmentWorkerActionState> {
  const assignmentIdResult = assignmentIdSchema.safeParse(assignmentId);
  const allocationIdResult = assignmentWorkerIdSchema.safeParse(allocationId);
  if (!assignmentIdResult.success || !allocationIdResult.success) {
    return { error: "This writer allocation link is invalid." };
  }

  const values = formValues(formData);
  const parsed = assignmentWorkerSchema.safeParse(values);
  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again.", values };
  }

  const [assignmentCheck, writerCheck, allocationResult] = await Promise.all([
    verifyOwnedAssignment(supabase, user.id, assignmentIdResult.data),
    verifyEligibleWriter(supabase, user.id, parsed.data.worker_id),
    supabase
      .from("assignment_workers")
      .select("id")
      .eq("id", allocationIdResult.data)
      .eq("assignment_id", assignmentIdResult.data)
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  if (
    assignmentCheck.error ||
    writerCheck.error ||
    allocationResult.error
  ) {
    return { error: "We could not verify this writer allocation.", values };
  }
  if (!assignmentCheck.valid || !allocationResult.data) {
    return { error: "This writer allocation no longer exists.", values };
  }
  if (!writerCheck.valid) {
    return invalidState(values, {
      worker_id: ["Select one of your writer or freelancer contacts."],
    });
  }

  const { data: duplicate, error: duplicateError } = await supabase
    .from("assignment_workers")
    .select("id")
    .eq("owner_id", user.id)
    .eq("assignment_id", assignmentIdResult.data)
    .eq("worker_id", parsed.data.worker_id)
    .neq("id", allocationIdResult.data)
    .maybeSingle();

  if (duplicateError) {
    return { error: databaseMessage(duplicateError, "save"), values };
  }
  if (duplicate) {
    return invalidState(values, {
      worker_id: ["This writer is already allocated to the assignment."],
    });
  }

  const { error } = await supabase
    .from("assignment_workers")
    .update(allocationPayload(parsed.data))
    .eq("id", allocationIdResult.data)
    .eq("assignment_id", assignmentIdResult.data)
    .eq("owner_id", user.id);

  if (error) {
    logDatabaseError(
      "update",
      "assignment_workers.update",
      user.id,
      assignmentIdResult.data,
      allocationIdResult.data,
      error
    );
    return { error: databaseMessage(error, "save"), values };
  }

  revalidatePath("/assignments/" + assignmentIdResult.data);
  redirect("/assignments/" + assignmentIdResult.data);
}

export async function deleteAssignmentWorker(
  assignmentId: string,
  allocationId: string,
  previousState: AssignmentWorkerActionState,
  formData: FormData
): Promise<AssignmentWorkerActionState> {
  void previousState;
  void formData;

  const assignmentIdResult = assignmentIdSchema.safeParse(assignmentId);
  const allocationIdResult = assignmentWorkerIdSchema.safeParse(allocationId);
  if (!assignmentIdResult.success || !allocationIdResult.success) {
    return { error: "This writer allocation link is invalid." };
  }

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const [assignmentCheck, allocationResult] = await Promise.all([
    verifyOwnedAssignment(supabase, user.id, assignmentIdResult.data),
    supabase
      .from("assignment_workers")
      .select("id")
      .eq("id", allocationIdResult.data)
      .eq("assignment_id", assignmentIdResult.data)
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  if (assignmentCheck.error || allocationResult.error) {
    return { error: "We could not verify this writer allocation." };
  }
  if (!assignmentCheck.valid || !allocationResult.data) {
    return { error: "This writer allocation no longer exists." };
  }

  const { error } = await supabase
    .from("assignment_workers")
    .delete()
    .eq("id", allocationIdResult.data)
    .eq("assignment_id", assignmentIdResult.data)
    .eq("owner_id", user.id);

  if (error) {
    logDatabaseError(
      "delete",
      "assignment_workers.delete",
      user.id,
      assignmentIdResult.data,
      allocationIdResult.data,
      error
    );
    return { error: databaseMessage(error, "delete") };
  }

  revalidatePath("/assignments/" + assignmentIdResult.data);
  redirect("/assignments/" + assignmentIdResult.data);
}
