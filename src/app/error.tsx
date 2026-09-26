"use client";

import Link from "next/link";

/**
 * Friendly server-error screen. A fresh deployment that is missing the Supabase
 * env vars fails every data page; pointing at /health (which names the missing
 * variables) turns a blank "server error" into an actionable message.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-ink">
        This page needs the database connection, so a configuration or server problem can stop it loading.
      </p>

      <div className="panel mt-6 p-4 text-sm">
        <p className="font-medium">If this is a fresh deployment, check the environment</p>
        <p className="mt-1 text-muted-ink">
          Open <Link href="/health" className="hover:underline">/health</Link> — it names any missing variable.
          On Vercel the required variables are <span className="mono">NEXT_PUBLIC_SUPABASE_URL</span>,{" "}
          <span className="mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> and{" "}
          <span className="mono">SUPABASE_SERVICE_ROLE_KEY</span>. After adding them you must redeploy, because
          <span className="mono"> NEXT_PUBLIC_</span> values are baked in at build time.
        </p>
      </div>

      {error.digest && <p className="mono mt-4 text-xs text-muted-ink">error digest: {error.digest}</p>}

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        <Link href="/health" className="btn-outline">Open /health</Link>
      </div>
    </div>
  );
}
