'use server'

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { contactIdSchema, contactSchema } from "@/lib/validations/contact";
import type { ContactActionState, ContactRole } from "@/types/contact";

function formValues(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    company_name: String(formData.get("company_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    country: String(formData.get("country") ?? ""),
    preferred_currency: String(formData.get("preferred_currency") ?? ""),
    roles: formData.getAll("roles").map(String),
    notes: String(formData.get("notes") ?? ""),
    is_active: String(formData.get("is_active") ?? "inactive"),
  };
}

function nullable(value: string) {
  return value || null;
}

function databaseMessage(error: PostgrestError, operation: "save" | "delete") {
  if (error.code === "23505") {
    return "A contact with these details already exists.";
  }
  if (error.code === "23503") {
    return operation === "delete"
      ? "This contact is linked to other records and cannot be deleted."
      : "One of the selected values is no longer available.";
  }
  if (error.code === "42501") {
    return "You do not have permission to change this contact.";
  }
  return operation === "delete"
    ? "We could not delete this contact. Please try again."
    : "We could not save this contact. Please try again.";
}

type MutationFailureContext = {
  mode: "create" | "update" | "delete";
  stage: string;
  authenticatedUserId: string | null;
  contactId: string | null;
  ownershipValidationInvoked: boolean;
  error: PostgrestError;
};

function logMutationFailure({
  mode,
  stage,
  authenticatedUserId,
  contactId,
  ownershipValidationInvoked,
  error,
}: MutationFailureContext) {
  console.error("[contacts mutation failed]", {
    mode,
    stage,
    authenticatedUserId,
    contactId,
    ownershipValidationInvoked,
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

  return {
    supabase,
    user: error ? null : user,
  };
}

function invalidState(
  values: ReturnType<typeof formValues>,
  fieldErrors: Record<string, string[] | undefined>
): ContactActionState {
  return { fieldErrors, values };
}

export async function createContact(
  _previousState: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const values = formValues(formData);
  const parsed = contactSchema.safeParse(values);

  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) {
    return {
      error: "Your session has expired. Please sign in again.",
      values,
    };
  }

  const input = parsed.data;
  const { data: contact, error } = await supabase
    .from("contacts")
    .insert({
      owner_id: user.id,
      name: input.name,
      company_name: nullable(input.company_name),
      email: nullable(input.email),
      phone: nullable(input.phone),
      whatsapp: nullable(input.whatsapp),
      country: nullable(input.country),
      preferred_currency: input.preferred_currency,
      notes: nullable(input.notes),
      is_active: input.is_active,
    })
    .select("id")
    .single();

  if (error || !contact) {
    if (error) {
      logMutationFailure({
        mode: "create",
        stage: "contacts.insert.select",
        authenticatedUserId: user.id,
        contactId: null,
        ownershipValidationInvoked: false,
        error,
      });
    }

    return { error: error ? databaseMessage(error, "save") : "We could not save this contact.", values };
  }

  const { error: roleError } = await supabase.from("contact_roles").insert(
    input.roles.map((role) => ({
      owner_id: user.id,
      contact_id: contact.id,
      role,
    }))
  );

  if (roleError) {
    logMutationFailure({
      mode: "create",
      stage: "contact_roles.insert",
      authenticatedUserId: user.id,
      contactId: contact.id,
      ownershipValidationInvoked: false,
      error: roleError,
    });

    await supabase
      .from("contacts")
      .delete()
      .eq("id", contact.id)
      .eq("owner_id", user.id);

    return { error: databaseMessage(roleError, "save"), values };
  }

  revalidatePath("/contacts");
  redirect("/contacts/" + contact.id);
}

export async function updateContact(
  contactId: string,
  _previousState: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const idResult = contactIdSchema.safeParse(contactId);
  if (!idResult.success) {
    return { error: "This contact link is invalid." };
  }

  const values = formValues(formData);
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) {
    return invalidState(values, parsed.error.flatten().fieldErrors);
  }

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) {
    return {
      error: "Your session has expired. Please sign in again.",
      values,
    };
  }

  const ownerId = user.id;
  const { data: existingContact, error: contactLookupError } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", idResult.data)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (contactLookupError) {
    return { error: databaseMessage(contactLookupError, "save"), values };
  }
  if (!existingContact) {
    return { error: "This contact no longer exists." };
  }

  const input = parsed.data;
  const { error: updateError } = await supabase
    .from("contacts")
    .update({
      name: input.name,
      company_name: nullable(input.company_name),
      email: nullable(input.email),
      phone: nullable(input.phone),
      whatsapp: nullable(input.whatsapp),
      country: nullable(input.country),
      preferred_currency: input.preferred_currency,
      notes: nullable(input.notes),
      is_active: input.is_active,
    })
    .eq("id", idResult.data)
    .eq("owner_id", ownerId);

  if (updateError) {
    return { error: databaseMessage(updateError, "save"), values };
  }

  const { data: currentRoleRows, error: roleLookupError } = await supabase
    .from("contact_roles")
    .select("role")
    .eq("contact_id", idResult.data)
    .eq("owner_id", ownerId);

  if (roleLookupError) {
    return { error: databaseMessage(roleLookupError, "save"), values };
  }

  const currentRoles = new Set(
    (currentRoleRows ?? []).map((row) => row.role as ContactRole)
  );
  const selectedRoles = new Set(input.roles);
  const rolesToAdd = input.roles.filter((role) => !currentRoles.has(role));
  const rolesToRemove = [...currentRoles].filter((role) => !selectedRoles.has(role));

  if (rolesToAdd.length > 0) {
    const { error: addRolesError } = await supabase.from("contact_roles").insert(
      rolesToAdd.map((role) => ({
        owner_id: ownerId,
        contact_id: idResult.data,
        role,
      }))
    );
    if (addRolesError) {
      return { error: databaseMessage(addRolesError, "save"), values };
    }
  }

  if (rolesToRemove.length > 0) {
    const { error: removeRolesError } = await supabase
      .from("contact_roles")
      .delete()
      .eq("contact_id", idResult.data)
      .eq("owner_id", ownerId)
      .in("role", rolesToRemove);

    if (removeRolesError) {
      return { error: databaseMessage(removeRolesError, "save"), values };
    }
  }

  revalidatePath("/contacts");
  revalidatePath("/contacts/" + idResult.data);
  redirect("/contacts/" + idResult.data);
}

export async function deleteContact(
  contactId: string,
  _previousState: ContactActionState,
  _formData: FormData
): Promise<ContactActionState> {
  void _previousState;
  void _formData;

  const idResult = contactIdSchema.safeParse(contactId);
  if (!idResult.success) {
    return { error: "This contact link is invalid." };
  }

  const { supabase, user } = await authenticatedMutationContext();
  if (!user) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const ownerId = user.id;
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", idResult.data)
    .eq("owner_id", ownerId);

  if (error) {
    return { error: databaseMessage(error, "delete") };
  }

  revalidatePath("/contacts");
  redirect("/contacts");
}
