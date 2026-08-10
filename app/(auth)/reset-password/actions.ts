'use server'

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { passwordSchema } from "@/lib/validations/settings";
import type { SettingsActionState } from "@/types/settings";

export async function resetPassword(_previousState: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const parsed = passwordSchema.safeParse({ new_password: String(formData.get("new_password") ?? ""), confirm_password: String(formData.get("confirm_password") ?? "") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { error: "This reset link is invalid or has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });
  if (error) {
    console.error("[password recovery update failed]", { authenticatedUserId: user.id, errorCode: error.code, errorMessage: error.message });
    return { error: "We could not reset your password. Request a new recovery link." };
  }
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?password_reset=success");
}
