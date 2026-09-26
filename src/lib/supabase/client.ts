"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";
import { PUBLIC_ENV_VARS, missingEnvMessage, readEnv } from "@/lib/env";

/**
 * Browser client. Only NEXT_PUBLIC_* values are read here, so the service-role
 * key can never reach the browser bundle.
 */
export function createClient() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !anonKey) {
    throw new Error(missingEnvMessage(PUBLIC_ENV_VARS.filter((n) => readEnv(n) === undefined)));
  }
  return createBrowserClient<Database>(url, anonKey);
}
