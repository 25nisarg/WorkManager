'use server'

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { emailSchema } from "@/lib/validations/settings";
import type { SettingsActionState } from "@/types/settings";

function safeOrigin(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

export async function requestPasswordReset(
  _previousState: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  const values = { email: String(formData.get("email") ?? "") };
  const parsed = emailSchema.safeParse(values);
  if (!parsed.success) {
    return { values, fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const origin = safeOrigin((await headers()).get("origin"));
  if (!origin) {
    return { error: "We could not start password recovery. Please try again.", values };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  if (error) {
    console.error("[password reset request failed]", {
      errorCode: error.code,
      errorMessage: error.message,
    });
  }
  return { success: "If an account exists for that email, a password reset link is on its way." };
}
