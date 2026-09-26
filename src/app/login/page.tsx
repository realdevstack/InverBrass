"use client";

import { useActionState } from "react";

import { signInAction, type AuthState } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand";

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <BrandLogo className="h-14 w-auto" />
      <h1 className="mt-6 text-2xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-muted-ink">Sign in with your Inverbras account.</p>

      <form action={formAction} className="panel mt-6 space-y-4 p-5">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
        </div>
        {state.error && (
          <p role="alert" className="rounded border border-risk/40 bg-risk/10 p-2 text-sm text-risk">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn-primary w-full justify-center disabled:opacity-60">
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-xs text-muted-ink">
        Accounts are invite-only. Ask an administrator to create yours.
      </p>
    </main>
  );
}
