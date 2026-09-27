import { pickPrimaryContact, sanitizeEmailAddress } from "@/lib/rules/contacts";
import { createClient } from "@/lib/supabase/server";

export type Reach = { email: string | null; phone: string | null };

export type ReachIndex = {
  /** The customer master's primary contact, by the authoritative customer id. */
  forCustomerId(customerId: string | null | undefined): Reach | null;
  /** Fallback: the customer master's primary contact, matched by name. */
  forCustomer(name: string | null | undefined): Reach | null;
  /** The OEM's primary contact, matched by id. */
  forOem(oemId: string | null | undefined): Reach | null;
};

/** The ids/names the caller actually needs, so master data is read in a bound, not in full. */
export type ReachScope = {
  customerIds?: Array<string | null | undefined>;
  customerNames?: Array<string | null | undefined>;
  oemIds?: Array<string | null | undefined>;
};

type CustomerRow = { id: string; name: string };
type ContactRow = { email: string | null; phone: string | null; is_primary: boolean | null };

function unique(values: Array<string | null | undefined> | undefined): string[] {
  return [...new Set((values ?? []).map((v) => v?.trim()).filter((v): v is string => Boolean(v)))];
}

function toReach(picked: ContactRow | null): Reach | null {
  if (!picked) return null;
  return { email: sanitizeEmailAddress(picked.email), phone: picked.phone };
}

const EMPTY_INDEX: ReachIndex = {
  forCustomerId: () => null,
  forCustomer: () => null,
  forOem: () => null,
};

/**
 * Contact lookup for the communication placeholders. Reads only the master rows
 * the caller asked for (customer ids/names and OEM ids), so a page that shows a
 * handful of invoices does not scan the whole master data. RLS scopes what each
 * role can see. No message is sent — the links are `mailto:`, `wa.me`, `tel:`.
 */
export async function buildReachIndex(scope: ReachScope = {}): Promise<ReachIndex> {
  const customerIds = unique(scope.customerIds);
  const customerNames = unique(scope.customerNames);
  const oemIds = unique(scope.oemIds);

  if (customerIds.length === 0 && customerNames.length === 0 && oemIds.length === 0) {
    return EMPTY_INDEX;
  }

  const supabase = await createClient();

  const [byId, byName, oemContactRows] = await Promise.all([
    customerIds.length
      ? supabase.from("customers").select("id, name").in("id", customerIds).then((r) => (r.data ?? []) as CustomerRow[])
      : Promise.resolve([] as CustomerRow[]),
    customerNames.length
      ? supabase.from("customers").select("id, name").in("name", customerNames).then((r) => (r.data ?? []) as CustomerRow[])
      : Promise.resolve([] as CustomerRow[]),
    oemIds.length
      ? supabase
          .from("oem_contacts")
          .select("oem_id, email, phone, is_primary")
          .in("oem_id", oemIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([] as Array<ContactRow & { oem_id: string }>),
  ]);

  const resolvedCustomers = new Map<string, CustomerRow>();
  for (const customer of [...byId, ...byName]) resolvedCustomers.set(customer.id, customer);

  const customerContactRows = resolvedCustomers.size
    ? await supabase
        .from("customer_contacts")
        .select("customer_id, email, phone, is_primary")
        .in("customer_id", [...resolvedCustomers.keys()])
        .then((r) => r.data ?? [])
    : [];

  const contactsByCustomer = new Map<string, ContactRow[]>();
  for (const c of customerContactRows) {
    const list = contactsByCustomer.get(c.customer_id) ?? [];
    list.push({ email: c.email, phone: c.phone, is_primary: c.is_primary });
    contactsByCustomer.set(c.customer_id, list);
  }

  const reachByCustomerId = new Map<string, Reach | null>();
  const reachByCustomerName = new Map<string, Reach | null>();
  for (const customer of resolvedCustomers.values()) {
    const value = toReach(pickPrimaryContact(contactsByCustomer.get(customer.id) ?? []));
    reachByCustomerId.set(customer.id, value);
    const key = customer.name.trim().toLowerCase();
    if (!reachByCustomerName.has(key) || value) reachByCustomerName.set(key, value);
  }

  const contactsByOem = new Map<string, ContactRow[]>();
  for (const c of oemContactRows) {
    const list = contactsByOem.get(c.oem_id) ?? [];
    list.push({ email: c.email, phone: c.phone, is_primary: c.is_primary });
    contactsByOem.set(c.oem_id, list);
  }
  const reachByOemId = new Map<string, Reach | null>();
  for (const oemId of oemIds) {
    reachByOemId.set(oemId, toReach(pickPrimaryContact(contactsByOem.get(oemId) ?? [])));
  }

  return {
    forCustomerId(customerId) {
      if (!customerId) return null;
      return reachByCustomerId.get(customerId) ?? null;
    },
    forCustomer(name) {
      if (!name) return null;
      return reachByCustomerName.get(name.trim().toLowerCase()) ?? null;
    },
    forOem(oemId) {
      if (!oemId) return null;
      return reachByOemId.get(oemId) ?? null;
    },
  };
}
