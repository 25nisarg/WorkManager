'use server'

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { passwordSchema, profileSchema } from "@/lib/validations/settings";
import type { SettingsActionState } from "@/types/settings";

function profileValues(formData: FormData) {
  return {
    full_name: String(formData.get("full_name") ?? ""),
    business_name: String(formData.get("business_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    default_currency: String(formData.get("default_currency") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
  };
}

function passwordValues(formData: FormData) {
  return {
    new_password: String(formData.get("new_password") ?? ""),
    confirm_password: String(formData.get("confirm_password") ?? ""),
  };
}

export async function updateProfile(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const values = profileValues(formData);
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { values, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Your session has expired. Please sign in again.", values };
  }

  const input = parsed.data;
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name || null,
      business_name: input.business_name || null,
      phone: input.phone || null,
      default_currency: input.default_currency,
      timezone: input.timezone,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[profile update failed]", {
      authenticatedUserId: user.id,
      errorCode: error.code,
      errorMessage: error.message,
    });
    return {
      error:
        error.code === "42501"
          ? "You do not have permission to update this profile."
          : "We could not save your profile. Please try again.",
      values,
    };
  }
  if (!data) {
    return { error: "Your profile record is unavailable.", values };
  }

  revalidatePath("/settings");
  return { success: "Profile saved successfully.", values };
}

export async function changePassword(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const values = passwordValues(formData);
  const parsed = passwordSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Your session has expired. Please sign in again." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });
  if (error) {
    console.error("[password update failed]", {
      authenticatedUserId: user.id,
      errorCode: error.code,
      errorMessage: error.message,
    });
    return {
      error:
        error.code === "same_password"
          ? "Choose a password you have not used for this account."
          : "We could not update your password. Please sign in again and retry.",
    };
  }

  return { success: "Password updated successfully." };
}
