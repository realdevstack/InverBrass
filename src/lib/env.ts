/**
 * Environment plumbing that names a missing variable.
 *
 * Rule (TECH-STACK "Failure modes"): a missing or wrong Supabase env var must
 * fail loudly, naming the variable, never a blank screen. This module is the
 * single place that decides what is missing, so the health page and the
 * Supabase clients agree.
 *
 * Only NEXT_PUBLIC_* values may reach the browser. The service-role key is
 * server-only and is never referenced from a Client Component.
 */

export const PUBLIC_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export const SERVER_ENV_VARS = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

export const ASSISTANT_ENV_VARS = [
  "AI_ASSISTANT_API_KEY",
  "AI_ASSISTANT_BASE_URL",
  "AI_ASSISTANT_MODEL",
] as const;

export type PublicEnvVar = (typeof PUBLIC_ENV_VARS)[number];
export type ServerEnvVar = (typeof SERVER_ENV_VARS)[number];
export type AssistantEnvVar = (typeof ASSISTANT_ENV_VARS)[number];
export type KnownEnvVar = PublicEnvVar | ServerEnvVar | AssistantEnvVar;

export function readEnv(name: KnownEnvVar): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function missingEnv(names: readonly KnownEnvVar[]): KnownEnvVar[] {
  return names.filter((name) => readEnv(name) === undefined);
}

export function missingEnvMessage(names: readonly KnownEnvVar[]): string {
  const list = names.join(", ");
  return `Missing environment variable${names.length > 1 ? "s" : ""}: ${list}. Set ${names.length > 1 ? "them" : "it"} in .env.local (see .env.example).`;
}

/** Throws with the exact missing variable names. Use on server paths. */
export function assertEnv(names: readonly KnownEnvVar[]): void {
  const missing = missingEnv(names);
  if (missing.length > 0) throw new Error(missingEnvMessage(missing));
}

export type EnvStatus = {
  name: KnownEnvVar;
  scope: "public" | "server" | "assistant";
  present: boolean;
};

export function envStatus(): EnvStatus[] {
  const scopes: Array<[EnvStatus["scope"], readonly KnownEnvVar[]]> = [
    ["public", PUBLIC_ENV_VARS],
    ["server", SERVER_ENV_VARS],
    ["assistant", ASSISTANT_ENV_VARS],
  ];
  return scopes.flatMap(([scope, names]) =>
    names.map((name) => ({ name, scope, present: readEnv(name) !== undefined })),
  );
}

/** The optional AI assistant is off unless a provider key is configured. */
export function isAssistantConfigured(): boolean {
  return readEnv("AI_ASSISTANT_API_KEY") !== undefined;
}
