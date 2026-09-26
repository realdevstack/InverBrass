-- Deny-by-default Row Level Security for every table.
--
-- Enabling RLS with no policy denies everything. Each table then gets exactly
-- two permissive policies: read for the roles that may read the area, and
-- write (insert/update/delete) for the roles that may change it. A user with no
-- role matches nothing.

-- requirements / line_items
alter table public.requirements enable row level security;
create policy requirements_select on public.requirements for select to authenticated
  using (public.role_can_read('requirements'));
create policy requirements_write on public.requirements for all to authenticated
  using (public.role_can_write('requirements')) with check (public.role_can_write('requirements'));

alter table public.line_items enable row level security;
create policy line_items_select on public.line_items for select to authenticated
  using (public.role_can_read('requirements'));
create policy line_items_write on public.line_items for all to authenticated
  using (public.role_can_write('requirements')) with check (public.role_can_write('requirements'));

-- oems / contacts / certifications
alter table public.oems enable row level security;
create policy oems_select on public.oems for select to authenticated
  using (public.role_can_read('oem'));
create policy oems_write on public.oems for all to authenticated
  using (public.role_can_write('oem')) with check (public.role_can_write('oem'));

alter table public.oem_contacts enable row level security;
create policy oem_contacts_select on public.oem_contacts for select to authenticated
  using (public.role_can_read('oem'));
create policy oem_contacts_write on public.oem_contacts for all to authenticated
  using (public.role_can_write('oem')) with check (public.role_can_write('oem'));

alter table public.oem_certifications enable row level security;
create policy oem_certifications_select on public.oem_certifications for select to authenticated
  using (public.role_can_read('oem'));
create policy oem_certifications_write on public.oem_certifications for all to authenticated
  using (public.role_can_write('oem')) with check (public.role_can_write('oem'));

-- sourcing and quantity commitments
alter table public.sourcing_requests enable row level security;
create policy sourcing_requests_select on public.sourcing_requests for select to authenticated
  using (public.role_can_read('sourcing'));
create policy sourcing_requests_write on public.sourcing_requests for all to authenticated
  using (public.role_can_write('sourcing')) with check (public.role_can_write('sourcing'));

alter table public.sourcing_responses enable row level security;
create policy sourcing_responses_select on public.sourcing_responses for select to authenticated
  using (public.role_can_read('sourcing'));
create policy sourcing_responses_write on public.sourcing_responses for all to authenticated
  using (public.role_can_write('sourcing')) with check (public.role_can_write('sourcing'));

alter table public.quantity_commitments enable row level security;
create policy quantity_commitments_select on public.quantity_commitments for select to authenticated
  using (public.role_can_read('sourcing'));
create policy quantity_commitments_write on public.quantity_commitments for all to authenticated
  using (public.role_can_write('sourcing')) with check (public.role_can_write('sourcing'));

-- quotations and versions
alter table public.quotations enable row level security;
create policy quotations_select on public.quotations for select to authenticated
  using (public.role_can_read('quotation'));
create policy quotations_write on public.quotations for all to authenticated
  using (public.role_can_write('quotation')) with check (public.role_can_write('quotation'));

alter table public.quotation_versions enable row level security;
create policy quotation_versions_select on public.quotation_versions for select to authenticated
  using (public.role_can_read('quotation'));
create policy quotation_versions_write on public.quotation_versions for all to authenticated
  using (public.role_can_write('quotation')) with check (public.role_can_write('quotation'));

-- purchase orders
alter table public.purchase_orders enable row level security;
create policy purchase_orders_select on public.purchase_orders for select to authenticated
  using (public.role_can_read('order'));
create policy purchase_orders_write on public.purchase_orders for all to authenticated
  using (public.role_can_write('order')) with check (public.role_can_write('order'));

-- fulfilment: material readiness, PDI, delivery
alter table public.material_readiness enable row level security;
create policy material_readiness_select on public.material_readiness for select to authenticated
  using (public.role_can_read('fulfilment'));
create policy material_readiness_write on public.material_readiness for all to authenticated
  using (public.role_can_write('fulfilment')) with check (public.role_can_write('fulfilment'));

alter table public.pdis enable row level security;
create policy pdis_select on public.pdis for select to authenticated
  using (public.role_can_read('fulfilment'));
create policy pdis_write on public.pdis for all to authenticated
  using (public.role_can_write('fulfilment')) with check (public.role_can_write('fulfilment'));

alter table public.deliveries enable row level security;
create policy deliveries_select on public.deliveries for select to authenticated
  using (public.role_can_read('fulfilment'));
create policy deliveries_write on public.deliveries for all to authenticated
  using (public.role_can_write('fulfilment')) with check (public.role_can_write('fulfilment'));

-- finance: invoices, payments, commission
alter table public.oem_invoices enable row level security;
create policy oem_invoices_select on public.oem_invoices for select to authenticated
  using (public.role_can_read('finance'));
create policy oem_invoices_write on public.oem_invoices for all to authenticated
  using (public.role_can_write('finance')) with check (public.role_can_write('finance'));

alter table public.payments enable row level security;
create policy payments_select on public.payments for select to authenticated
  using (public.role_can_read('finance'));
create policy payments_write on public.payments for all to authenticated
  using (public.role_can_write('finance')) with check (public.role_can_write('finance'));

alter table public.commission_invoices enable row level security;
create policy commission_invoices_select on public.commission_invoices for select to authenticated
  using (public.role_can_read('finance'));
create policy commission_invoices_write on public.commission_invoices for all to authenticated
  using (public.role_can_write('finance')) with check (public.role_can_write('finance'));

-- documents
alter table public.documents enable row level security;
create policy documents_select on public.documents for select to authenticated
  using (public.role_can_read('documents'));
create policy documents_write on public.documents for all to authenticated
  using (public.role_can_write('documents')) with check (public.role_can_write('documents'));

-- approvals: readable by signed-in users, writable only through record_approval().
alter table public.approvals enable row level security;
create policy approvals_select on public.approvals for select to authenticated using (true);

-- audit log: readable by privileged roles, written only by definer triggers.
alter table public.audit_log enable row level security;
create policy audit_log_select on public.audit_log for select to authenticated
  using (public.auth_is_privileged());
