"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; icon: string };

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`nav-item ${active ? "nav-item-active" : ""}`}
          >
            <NavIcon name={item.icon} />
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Small inline icon set, keyed by name, so the shell needs no icon registry. */
export function NavIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    dashboard: "M3 12h7V3H3v9Zm0 9h7v-6H3v6Zm11 0h7V12h-7v9Zm0-18v6h7V3h-7Z",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 2 4 4h-4V4ZM8 13h8v2H8v-2Zm0 4h8v2H8v-2Z",
    factory: "M2 20h20V9l-6 4V9l-6 4V4H2v16Zm4-3h3v3H6v-3Zm5 0h3v3h-3v-3Zm5 0h3v3h-3v-3Z",
    network: "M12 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM5 16a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm14 0a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM12 8v4M5 16l5-4m4 0 5 4",
    quote: "M7 7h4v4H9v6H5V9a2 2 0 0 1 2-2Zm10 0h4v4h-2v6h-4V9a2 2 0 0 1 2-2Z",
    order: "M9 2h6l1 3h3v17H5V5h3l1-3Zm-1 8h8V8H8v2Zm0 4h8v-2H8v2Zm0 4h5v-2H8v2Z",
    pdi: "M12 2 2 7l10 5 10-5-10-5Zm0 9L2 16l10 5 10-5-10-5Zm0 3.2 6.2-3.1L22 13l-10 5-10-5 3.8-1.9L12 14.2Z",
    finance: "M12 1v3a5 5 0 0 1 5 5h-3a2 2 0 0 0-2-2V9a5 5 0 0 1 0 10v3h-2v-3a5 5 0 0 1-5-5h3a2 2 0 0 0 2 2v-2a5 5 0 0 1 0-10V1h2Zm-1 5a2 2 0 1 0 0 4V6Zm2 8a2 2 0 1 0 0-4v4Z",
    documents: "M4 2h11l5 5v15H4V2Zm2 2v16h12V8h-4V4H6Zm2 8h8v2H8v-2Zm0 4h8v2H8v-2Z",
    reports: "M4 20V4h2v14h14v2H4Zm4-3V9h2v8H8Zm4 0V5h2v12h-2Zm4 0v-6h2v6h-2Z",
    assistant: "M12 2 9.5 8.5 3 11l6.5 2.5L12 20l2.5-6.5L21 11l-6.5-2.5L12 2Z",
    schema: "M12 2C7 2 3 3.8 3 6s4 4 9 4 9-1.8 9-4-4-4-9-4ZM3 9v4c0 2.2 4 4 9 4s9-1.8 9-4V9c-1.7 1.3-5 2-9 2s-7.3-.7-9-2Zm0 7v3c0 2.2 4 4 9 4s9-1.8 9-4v-3c-1.7 1.3-5 2-9 2s-7.3-.7-9-2Z",
    users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-7 1.7-7 4v3h14v-3c0-2.3-3.7-4-7-4Zm8-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-.5 2c2.6.3 5.5 1.6 5.5 3.8V20h-4v-3c0-1.2-.5-2.2-1.5-3Z",
    customers: "M12 2 4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4Zm0 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 12.9c-1.9-.6-3.5-1.8-4.6-3.4.6-1 2.3-1.5 4.6-1.5s4 .5 4.6 1.5c-1.1 1.6-2.7 2.8-4.6 3.4Z",
    products: "M3 7 12 2l9 5v10l-9 5-9-5V7Zm9 4.2 6.5-3.6L12 4 5.5 7.6 12 11.2Zm-7-2v7.8l6 3.3V12.9l-6-3.7Zm8 11.1 6-3.3V9.2l-6 3.7v7.4Z",
  };
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor" aria-hidden="true">
      <path d={paths[name] ?? paths.file} />
    </svg>
  );
}
