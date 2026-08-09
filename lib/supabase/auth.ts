import { redirect } from "next/navigation";
import { createClient } from "./server";

export async function requireAuthenticatedOwnerId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const ownerId = data?.claims?.sub;

  if (error || typeof ownerId !== "string") {
    redirect("/login");
  }

  return ownerId;
}
