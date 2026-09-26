import { AppShell } from "@/components/app-shell";
import { OemCreateForm } from "@/app/oems/oem-forms";

export const dynamic = "force-dynamic";

export default function NewOemPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">New OEM</h1>
      <p className="mt-1 text-sm opacity-70">
        OEM approval status comes from the government agency&apos;s own vendor list; record the status and its source.
      </p>
      <OemCreateForm />
    </AppShell>
  );
}
