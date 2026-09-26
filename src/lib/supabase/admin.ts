import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { assertEnv, readEnv } from "@/lib/env";

/**
 * Service-role client. SERVER ONLY. Never import this from a Client Component
 * or anything bundled for the browser. It bypasses RLS, so it is reserved for
 * admin tasks (inviting users, seeding) and must never be on a user request
 * path that trusts user input.
 */
export function createAdminClient() {
  assertEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  return createSupabaseClient<Database>(
    readEnv("NEXT_PUBLIC_SUPABASE_URL")!,
    readEnv("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
