import Link from "next/link";

import { signOutAction } from "@/app/actions/auth";
import { BrandMark } from "@/components/brand";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { createClient } from "@/lib/supabase/server";
import { canRead, type AppRole } from "@/lib/rules/access";

type NavDef = {
  href: string;
  label: string;
  icon: string;
  area: Parameters<typeof canRead>[1];
  ownerOnly?: boolean;
};

const NAV: NavDef[] = [
  { href: "/", label: "Dashboard", icon: "dashboard", area: "requirements" },
  { href: "/requirements", label: "RFIs", icon: "file", area: "requirements" },
  { href: "/oems", label: "OEMs", icon: "factory", area: "oem" },
  { href: "/customers", label: "Customers", icon: "customers", area: "master" },
  { href: "/products", label: "Parts", icon: "products", area: "master" },
  { href: "/sourcing", label: "Sourcing & coverage", icon: "network", area: "sourcing" },
  { href: "/quotations", label: "Quotations", icon: "quote", area: "quotation" },
  { href: "/orders", label: "Orders", icon: "order", area: "order" },
  { href: "/delivery", label: "PDI & risk", icon: "pdi", area: "fulfilment" },
  { href: "/finance", label: "Finance", icon: "finance", area: "finance" },
  { href: "/documents", label: "Documents", icon: "documents", area: "documents" },
  { href: "/reports", label: "Reports", icon: "reports", area: "finance" },
  { href: "/process", label: "Process flow", icon: "network", area: "requirements" },
  { href: "/assistant", label: "Assistant", icon: "assistant", area: "requirements" },
  { href: "/notifications", label: "Reminders & emails", icon: "email", area: "requirements" },
  { href: "/admin/audit", label: "Audit log", icon: "documents", area: "admin" },
  { href: "/schema", label: "Schema", icon: "schema", area: "admin" },
  { href: "/admin/users", label: "Users & roles", icon: "users", area: "admin", ownerOnly: true },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: AppRole | null = null;
  let fullName: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("user_roles")
      .select("role, full_name")
      .eq("user_id", user.id)
      .maybeSingle();
    role = (data?.role as AppRole | undefined) ?? null;
    fullName = data?.full_name ?? null;
  }

  const items: NavItem[] = NAV.filter(
    (item) => canRead(role, item.area) && (!item.ownerOnly || role === "owner"),
  ).map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <div className="flex min-h-screen">
      <aside className="rail flex w-14 shrink-0 flex-col md:w-52">
        <div className="flex h-12 items-center gap-2 border-b border-hairline px-3">
          <BrandMark className="h-8 w-8 shrink-0" />
          <span className="hidden font-display text-sm font-bold tracking-tight text-ink md:inline">
            Inverbras
          </span>
        </div>
        <NavLinks items={items} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center gap-3 border-b border-hairline bg-panel px-4">
          <form action="/requirements" className="hidden min-w-0 flex-1 sm:block">
            <input
              type="search"
              name="q"
              placeholder="Search part number, agency, project…"
              className="w-full max-w-md rounded-md border border-hairline bg-content px-3 py-1.5 text-sm"
            />
          </form>
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <Link href="/requirements/new" className="btn-primary whitespace-nowrap">
              + New RFI
            </Link>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-hairline px-3 py-1.5 text-sm">
                <span className="hidden sm:inline">{fullName ?? user?.email ?? "—"}</span>
                <span className="rounded bg-content px-1.5 py-0.5 text-xs text-muted-ink">
                  {role ? role.replace("_", " ") : "no role"}
                </span>
              </summary>
              <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-hairline bg-panel p-2 shadow-lg">
                <p className="px-2 py-1 text-xs text-muted-ink">{user?.email}</p>
                <form action={signOutAction}>
                  <button type="submit" className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-content">
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          </div>
        </header>
        <main className="min-w-0 flex-1 bg-content px-4 py-4">{children}</main>
      </div>
    </div>
  );
}
