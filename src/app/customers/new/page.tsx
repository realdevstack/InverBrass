import { AppShell } from "@/components/app-shell";
import { CustomerCreateForm } from "@/app/master/master-forms";

export const dynamic = "force-dynamic";

export default function NewCustomerPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">New customer</h1>
      <p className="mt-1 text-sm text-muted-ink">Customer master: agency, division, GST, GeM and portal details.</p>
      <CustomerCreateForm />
    </AppShell>
  );
}
