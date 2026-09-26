import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import { PUBLIC_ENV_VARS, missingEnvMessage, readEnv } from "@/lib/env";

/**
 * Server client for Server Components and Server Actions. Reads the session
 * from the request cookies; writes refreshed cookies when Next.js allows it
 * (inside Server Actions / Route Handlers). RLS is the single enforcement
 * boundary, so this client always uses the caller's JWT.
 */
export async function createClient() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !anonKey) {
    throw new Error(missingEnvMessage(PUBLIC_ENV_VARS.filter((n) => readEnv(n) === undefined)));
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: the middleware refreshes the session.
        }
      },
    },
  });
}
