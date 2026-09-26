"use client";

import { useActionState } from "react";

import { createUserAction, deleteUserAction, type AdminState } from "@/app/admin/actions";

const initial: AdminState = {};
const field = "mt-1 w-full rounded border border-black/20 bg-white px-2 py-1.5 text-sm";
const label = "block text-xs font-medium text-muted-ink";

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, initial);
  return (
    <form action={formAction} className="mt-3 grid gap-3 sm:grid-cols-4">
      <div>
        <label className={label} htmlFor="email">Email *</label>
        <input id="email" name="email" type="email" required className={field} />
      </div>
      <div>
        <label className={label} htmlFor="full_name">Full name *</label>
        <input id="full_name" name="full_name" required className={field} />
      </div>
      <div>
        <label className={label} htmlFor="role">Role</label>
        <select id="role" name="role" defaultValue="sales" className={field}>
          <option value="owner">Owner</option>
          <option value="group_head">Group Head</option>
          <option value="management">Management</option>
          <option value="sales">Sales</option>
          <option value="operations">Operations</option>
          <option value="finance">Finance</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className="btn-primary self-end disabled:opacity-60">
        {pending ? "Creating…" : "Add user"}
      </button>
      {state.error && <p className="text-xs text-risk sm:col-span-4">{state.error}</p>}
      {state.ok && state.createdEmail && (
        <div className="rounded border border-clear/40 bg-clear/10 p-3 text-sm sm:col-span-4">
          <p>
            Created <strong>{state.createdEmail}</strong>. Share this temporary password once; they can change it later.
          </p>
          <p className="mono mt-1 select-all text-base">{state.temporaryPassword}</p>
        </div>
      )}
      <p className="text-xs text-muted-ink sm:col-span-4">
        Public signup stays disabled; this is the only way an account is created. The service-role key is used server-side only.
      </p>
    </form>
  );
}

export function DeleteUserButton({ userId, email }: { userId: string; email: string }) {
  return (
    <form
      action={deleteUserAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${email}? This removes the account and its role.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="user_id" value={userId} />
      <button type="submit" className="rounded border border-risk/40 px-2 py-1 text-xs text-risk hover:bg-risk/10">
        Delete
      </button>
    </form>
  );
}
