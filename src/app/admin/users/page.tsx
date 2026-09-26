import { AppShell } from "@/components/app-shell";
import { CreateUserForm, DeleteUserButton } from "@/app/admin/users/user-forms";
import { setUserActiveAction, updateUserRoleAction } from "@/app/admin/actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ROLES = ["owner", "group_head", "management", "sales", "operations", "finance"] as const;

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    role = data?.role ?? null;
  }

  if (role !== "owner") {
    return (
      <AppShell>
        <h1 className="text-2xl font-semibold">Users &amp; roles</h1>
        <p role="alert" className="mt-4 rounded border border-alert/40 bg-alert/10 p-3 text-sm">
          Only the Owner can manage users and roles.
        </p>
      </AppShell>
    );
  }

  const admin = createAdminClient();
  const [list, roleRows] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    admin.from("user_roles").select("user_id, role, full_name, is_active"),
  ]);

  const byId = new Map((roleRows.data ?? []).map((r) => [r.user_id, r]));
  const users = (list.data?.users ?? []).slice().sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));

  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Users &amp; roles</h1>
      <p className="mt-1 text-sm text-muted-ink">
        Invite-only accounts. The menu each person sees is set by their role.
      </p>

      {list.error && (
        <p role="alert" className="mt-4 rounded border border-risk/40 bg-risk/10 p-3 text-sm text-risk">
          {list.error.message}
        </p>
      )}

      <section className="panel mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-hairline text-muted-ink">
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Last sign-in</th>
              <th className="px-3 py-2 text-right">Remove</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const row = byId.get(u.id);
              const active = row?.is_active ?? false;
              const isSelf = u.id === user?.id;
              return (
                <tr key={u.id} className="status-row border-b border-hairline" data-status={active ? "clear" : "risk"}>
                  <td className="px-3 py-2">{u.email}{isSelf ? " (you)" : ""}</td>
                  <td className="px-3 py-2">{row?.full_name ?? u.user_metadata?.full_name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <form action={updateUserRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="user_id" value={u.id} />
                      <select name="role" defaultValue={row?.role ?? "sales"} className="rounded border border-hairline bg-panel px-2 py-1 text-sm">
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                      <button type="submit" className="rounded border border-hairline px-2 py-1 text-xs hover:border-teal">Save</button>
                    </form>
                  </td>
                  <td className="px-3 py-2">
                    <span className={active ? "text-clear" : "text-muted-ink"}>{active ? "active" : "inactive"}</span>
                    <form action={setUserActiveAction} className="mt-1">
                      <input type="hidden" name="user_id" value={u.id} />
                      <input type="hidden" name="is_active" value={active ? "false" : "true"} />
                      <button
                        type="submit"
                        disabled={isSelf && active}
                        className="rounded border border-hairline px-2 py-1 text-xs hover:border-teal disabled:opacity-40"
                      >
                        {active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-ink">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toISOString().slice(0, 10) : "never"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {!isSelf && <DeleteUserButton userId={u.id} email={u.email ?? u.id} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="panel mt-6 p-4">
        <h2 className="font-medium">Add a user</h2>
        <CreateUserForm />
      </section>
    </AppShell>
  );
}
