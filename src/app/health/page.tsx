import { APP_NAME, APP_VERSION } from "@/lib/app-info";
import { envStatus, missingEnv, PUBLIC_ENV_VARS, readEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

type Reachability = { reachable: boolean; authorized: boolean; detail: string };

async function checkSupabase(): Promise<Reachability> {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  if (!url) {
    return {
      reachable: false,
      authorized: false,
      detail: "NEXT_PUBLIC_SUPABASE_URL is missing, so Supabase was not contacted.",
    };
  }
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      cache: "no-store",
      headers: anonKey ? { apikey: anonKey } : undefined,
      signal: AbortSignal.timeout(8000),
    });
    // Any HTTP response means the project is reachable; 401 just means the
    // publishable key is missing or wrong.
    return {
      reachable: true,
      authorized: res.ok,
      detail: `GET ${url}/auth/v1/health -> ${res.status} ${res.statusText}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { reachable: false, authorized: false, detail: `GET ${url}/auth/v1/health failed: ${message}` };
  }
}

export default async function HealthPage() {
  const status = envStatus();
  const reachability = await checkSupabase();
  const missingPublic = missingEnv(PUBLIC_ENV_VARS);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold">{APP_NAME} — health</h1>
      <p className="mt-1 text-sm opacity-70">
        App version <code className="font-mono">{APP_VERSION}</code> · checked{" "}
        {new Date().toISOString()}
      </p>

      {missingPublic.length > 0 && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900"
        >
          <strong>Configuration incomplete.</strong> Missing environment variable
          {missingPublic.length > 1 ? "s" : ""}:{" "}
          <code className="font-mono">{missingPublic.join(", ")}</code>. Set{" "}
          {missingPublic.length > 1 ? "them" : "it"} in <code>.env.local</code> (see{" "}
          <code>.env.example</code>) and restart the dev server.
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-medium">Supabase</h2>
        <p className="mt-1">
          <span
            className={`inline-block rounded px-2 py-0.5 text-sm font-medium ${
              reachability.authorized
                ? "bg-green-100 text-green-900"
                : reachability.reachable
                  ? "bg-amber-100 text-amber-900"
                  : "bg-red-100 text-red-900"
            }`}
          >
            {reachability.authorized
              ? "reachable and authenticated"
              : reachability.reachable
                ? "reachable, but the publishable key is missing or invalid"
                : "not reachable"}
          </span>
        </p>
        <p className="mt-1 font-mono text-xs opacity-80">{reachability.detail}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Environment variables</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-1 pr-4">Name</th>
              <th className="py-1 pr-4">Scope</th>
              <th className="py-1">Present</th>
            </tr>
          </thead>
          <tbody>
            {status.map((row) => (
              <tr key={row.name} className="border-b border-black/5">
                <td className="py-1 pr-4 font-mono text-xs">{row.name}</td>
                <td className="py-1 pr-4">{row.scope}</td>
                <td className="py-1">
                  {row.present ? (
                    <span className="text-green-800">yes</span>
                  ) : (
                    <span className="text-amber-800">no</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs opacity-70">
          Values are never shown here, only whether each variable is set.
        </p>
      </section>
    </main>
  );
}
