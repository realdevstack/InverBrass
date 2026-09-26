import { AppShell } from "@/components/app-shell";
import { PUBLIC_ENV_VARS, missingEnv, missingEnvMessage } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SchemaPage() {
  const missing = missingEnv(PUBLIC_ENV_VARS);

  if (missing.length > 0) {
    return (
      <AppShell>
        <h1 className="text-2xl font-semibold">Schema</h1>
        <div role="alert" className="mt-4 rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-900">
          {missingEnvMessage(missing)}
        </div>
      </AppShell>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("schema_overview");

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Schema</h1>
      <p className="mt-1 text-sm opacity-70">Read-only: table names and row counts only.</p>

      {error && (
        <div role="alert" className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Could not read the schema overview: {error.message}
        </div>
      )}

      {data && (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/10">
              <th className="py-1 pr-4">Table</th>
              <th className="py-1">Rows</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.table_name} className="border-b border-black/5">
                <td className="py-1 pr-4 font-mono text-xs">{row.table_name}</td>
                <td className="py-1">{row.row_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  );
}
