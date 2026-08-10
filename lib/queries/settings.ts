import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/settings";

const profileColumns =
  "id, full_name, business_name, phone, default_currency, timezone, created_at, updated_at";

export async function getProfile(ownerId: string): Promise<{
  profile: Profile | null;
  error?: string;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(profileColumns)
    .eq("id", ownerId)
    .maybeSingle();

  if (error) {
    console.error("[profile query failed]", {
      authenticatedUserId: ownerId,
      errorCode: error.code,
      errorMessage: error.message,
    });
    return {
      profile: null,
      error: "We could not load your profile. Please refresh and try again.",
    };
  }

  if (!data) {
    return {
      profile: null,
      error: "Your profile record is unavailable. Please contact support.",
    };
  }

  return { profile: data as Profile };
}
