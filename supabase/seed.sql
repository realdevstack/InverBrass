-- Demo dataset (no real client data). Idempotent: safe to run more than once.
-- Applied to the hosted project by `npm run db:seed`, and to a local stack by
-- `supabase db reset` (config.toml: db.seed.sql_paths).

-- ---------------------------------------------------------------------------
-- OEMs
-- ---------------------------------------------------------------------------
insert into public.oems (id, name, brand_product_category, country_of_origin, product_portfolio, moq_rules, lead_time_days, pricing_validity, freight_terms, warranty_terms, payment_terms, commission_percentage, nda_status, capacity, govt_vendor_list_status, govt_vendor_list_source)
values
  ('11111111-1111-1111-1111-111111111111', 'Bharat Dynamics Ltd', 'Defence electronics', 'India', 'Radios, night vision, avionics', 'MOQ 10 units', 45, '90 days', 'Ex-works', '24 months', '30% advance, 70% on delivery', 5.00, 'signed', 1000, 'approved', 'DGQA approved vendor list 2026'),
  ('11111111-1111-1111-1111-000000000002', 'L&T Defence', 'Naval and land systems', 'India', 'Optronics, launchers', 'MOQ 5 units', 60, '60 days', 'FOR destination', '18 months', '50% advance, 50% on delivery', 4.00, 'pending', 500, 'approved', 'MoD vendor list'),
  ('11111111-1111-1111-1111-000000000003', 'Tata Advanced Systems', 'Aerospace structures', 'India', 'Aerostructures, UAV parts', 'MOQ 1 unit', 90, '45 days', 'Ex-works', '12 months', '100% against delivery', 4.50, 'not_signed', 800, 'pending', 'Awaiting renewal')
on conflict (id) do nothing;

insert into public.oem_contacts (id, oem_id, name, designation, email, phone, is_primary)
values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'R. Nair', 'Key Account Manager', 'r.nair@example.invalid', '+91-90000-00001', true),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-000000000002', 'S. Iyer', 'Sales Head', 's.iyer@example.invalid', '+91-90000-00002', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Requirements and line items
-- ---------------------------------------------------------------------------
insert into public.requirements (id, project_name, customer_agency, customer_division, customer_sub_division, source, gem_tender_number, bid_type, submission_type, special_remarks, submission_deadline, status, pursue_decision)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'Airborne Radio Set', 'HAL', 'Avionics', 'Radio Unit', 'gem_portal', 'GEM/2026/DR/1001', 'double', 'both', 'rcma', now() + interval '10 days', 'quoted', 'pursued'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'Night Vision Goggles', 'DRDO', 'Optronics', 'NVG Division', 'direct_customer', null, 'single', 'soft_copy', 'none', now() + interval '21 days', 'received', 'undecided')
on conflict (id) do nothing;

insert into public.line_items (id, requirement_id, line_no, part_number, description, quantity, uom, required_delivery_date)
values
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 1, 'PN-AR-100', 'Airborne VHF radio set', 1000, 'nos', (now() + interval '90 days')::date),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 2, 'PN-AR-200', 'Antenna tuning unit', 500, 'nos', (now() + interval '90 days')::date),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 1, 'PN-NVG-10', 'Night vision goggle, Gen III', 200, 'nos', (now() + interval '120 days')::date)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Quantity commitments: 600 + 400 firm = 1000 of 1000 covered.
-- ---------------------------------------------------------------------------
insert into public.quantity_commitments (id, oem_id, requirement_id, line_item_id, quantity, firm, source, notes)
values
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 600, true, 'firm_quote', 'Quotation BD/2026/77'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '11111111-1111-1111-1111-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 400, true, 'written_confirmation', 'Email confirmation'),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc3', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 300, false, 'availability_indication', 'Indicative only, not firm')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Quotation, taken through the two approval levels, then a PO from it.
-- ---------------------------------------------------------------------------
insert into public.quotations (id, requirement_id, oem_id, line_item_id, version, status, oem_price, freight_amount, gst_amount, target_margin_percentage, recommended_price, final_price, delivery_terms, lead_time_days, payment_terms, pnc_status, technical_compliance, commercial_compliance)
values
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 1, 'draft', 10000000, 500000, 1890000, 12.50, 12500000, 12500000, 'FOR destination', 45, '30% advance, 70% on delivery', 'not_applicable', true, true)
on conflict (id) do nothing;

insert into public.approvals (id, stage, entity_type, entity_id, level, decision, note, decided_at)
values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'quotation_submitted', 'quotation', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'group_head', 'approved', 'Margin acceptable', now()),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'quotation_submitted', 'quotation', 'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'management', 'approved', 'Proceed', now())
on conflict (id) do nothing;

update public.quotations
set status = 'approved'
where id = 'dddddddd-dddd-dddd-dddd-ddddddddddd1'
  and status = 'draft'
  and public.has_two_level_approval('quotation', id, 'quotation_submitted');

insert into public.purchase_orders (id, po_number, po_date, quotation_id, requirement_id, customer, oem_id, line_item_id, part_number, quantity_ordered, unit_price, po_value, taxes_gst, delivery_schedule, partial_delivery_allowed, pdi_required, pdi_mode, documentation_required, warranty_terms, payment_terms, status, verification_spec_match, verification_price_match, verification_feasibility, verification_documents_complete, verified_at, group_head_signoff_at)
values
  ('ffffffff-ffff-ffff-ffff-fffffffffff1', 'PO/HAL/2026/001', (now())::date, 'dddddddd-dddd-dddd-dddd-ddddddddddd1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'HAL', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'PN-AR-100', 1000, 12500, 12500000, 2250000, 'Lots of 250', true, true, 'physical', 'Test certificate, LR copy', '24 months', '30% advance, 70% on delivery', 'processing', true, true, true, true, now(), now())
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- PDI cleared, invoice, full payment, then commission.
-- ---------------------------------------------------------------------------
insert into public.pdis (id, purchase_order_id, inspection_type, inspection_agency, scheduled_date, conducted_date, quantity_offered, quantity_cleared, quantity_rejected, result)
values
  ('99999999-9999-9999-9999-999999999991', 'ffffffff-ffff-ffff-ffff-fffffffffff1', 'physical', 'dgqa', (now() - interval '5 days')::date, (now() - interval '3 days')::date, 1000, 1000, 0, 'cleared')
on conflict (id) do nothing;

insert into public.oem_invoices (id, invoice_number, invoice_date, purchase_order_id, pdi_id, quantity_invoiced, is_full_invoice, balance_quantity, net_amount, gst_amount, gross_amount, dispatch_date, lr_awb_number, payment_due_date, status)
values
  ('88888888-8888-8888-8888-888888888881', 'BD/INV/2026/501', (now() - interval '2 days')::date, 'ffffffff-ffff-ffff-ffff-fffffffffff1', '99999999-9999-9999-9999-999999999991', 1000, true, 0, 12500000, 2250000, 14750000, (now() - interval '2 days')::date, 'LR-445566', (now() + interval '28 days')::date, 'submitted')
on conflict (id) do nothing;

insert into public.payments (id, payment_reference, oem_invoice_id, customer, oem_id, invoice_amount, amount_received, balance_outstanding, payment_date, terms, mode, status)
values
  ('77777777-7777-7777-7777-777777777771', 'RTGS/2026/9911', '88888888-8888-8888-8888-888888888881', 'HAL', '11111111-1111-1111-1111-111111111111', 14750000, 14750000, 0, (now())::date, 'Net 30', 'rtgs', 'paid')
on conflict (id) do nothing;

insert into public.commission_invoices (id, commission_invoice_number, oem_invoice_id, oem_id, customer_name, commission_percentage, base_invoice_amount, commission_amount, gst_amount, tds_amount, payment_status, outstanding_amount)
values
  ('66666666-6666-6666-6666-666666666661', 'IB/COM/2026/001', '88888888-8888-8888-8888-888888888881', '11111111-1111-1111-1111-111111111111', 'HAL', 5.00, 14750000, 737500, 132750, 73750, 'raised', 796500)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Documents: PO copy (traced to the PO) and an OEM certification.
-- ---------------------------------------------------------------------------
insert into public.documents (id, document_type, title, supplier, issue_date, expiry_date, purchase_order_id, oem_id, storage_bucket, storage_path, file_name, mime_type)
values
  ('55555555-5555-5555-5555-555555555551', 'po_copy', 'Signed PO copy', 'HAL', (now())::date, null, 'ffffffff-ffff-ffff-ffff-fffffffffff1', null, 'documents', 'demo/po-hal-2026-001.pdf', 'po-hal-2026-001.pdf', 'application/pdf'),
  ('55555555-5555-5555-5555-555555555552', 'dgqa', 'DGQA approval certificate', 'Bharat Dynamics Ltd', (now() - interval '2 years')::date, (now() + interval '60 days')::date, null, '11111111-1111-1111-1111-111111111111', 'documents', 'demo/dgqa-bdl.pdf', 'dgqa-bdl.pdf', 'application/pdf')
on conflict (id) do nothing;

update public.purchase_orders
set po_copy_document_id = '55555555-5555-5555-5555-555555555551'
where id = 'ffffffff-ffff-ffff-ffff-fffffffffff1' and po_copy_document_id is null;

insert into public.oem_certifications (id, oem_id, certification_type, reference_number, issued_by, issue_date, expiry_date, document_id)
values
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'DGQA', 'DGQA/BDL/2024/88', 'DGQA', (now() - interval '2 years')::date, (now() + interval '60 days')::date, '55555555-5555-5555-5555-555555555552')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Master data: Customer Master and Product / Part Master (workbook tabs).
-- These are the "who" and the "what" that every stage record links back to.
-- ---------------------------------------------------------------------------
insert into public.customers (id, name, division, sub_division, gst_number, gem_registration, inverbras_vendor_registration, portal_login_mapping, payment_terms, approval_requirements, billing_address, delivery_address)
values
  ('33333333-3333-3333-3333-333333333331', 'HAL', 'Avionics', 'Radio Unit', '29AAACH1234C1Z5', 'GEM/HAL/AVI/2026', 'IB-VEND-0007', 'hal-portal/inverbrass', '30% advance, 70% on delivery', 'RCMA', 'HAL Avionics, Bengaluru 560017', 'HAL Avionics stores, Bengaluru 560017'),
  ('33333333-3333-3333-3333-333333333332', 'DRDO', 'Optronics', 'NVG Division', '07AAAGD5678L1Z2', 'GEM/DRDO/OPT/2026', 'IB-VEND-0011', 'drdo-portal/inverbrass', 'Net 45', 'MIL', 'DRDO Optronics, Dehradun 248001', 'DRDO Optronics stores, Dehradun 248001'),
  ('33333333-3333-3333-3333-333333333333', 'IAF', 'Sensors', 'Radar Wing', null, 'GEM/IAF/SEN/2026', 'IB-VEND-0014', null, 'Net 30', 'CEMILAC', 'IAF Radar Wing, Pune 411032', 'IAF Radar Wing stores, Pune 411032')
on conflict (id) do nothing;

insert into public.customer_contacts (id, customer_id, name, designation, email, phone, is_primary)
values
  ('34343434-3434-3434-3434-343434343431', '33333333-3333-3333-3333-333333333331', 'A. Sharma', 'Project Director', 'a.sharma@example.invalid', '+91-90000-10001', true),
  ('34343434-3434-3434-3434-343434343432', '33333333-3333-3333-3333-333333333332', 'V. Rao', 'Division Head', 'v.rao@example.invalid', '+91-90000-10002', true)
on conflict (id) do nothing;

insert into public.products (id, part_number, client_part_number, description, hsn_code, oem_id, uom, product_category, technical_specifications, compliance_certifications, shelf_life, export_restriction, lead_time_days, moq, standard_price, currency)
values
  ('12121212-1212-1212-1212-121212121211', 'PN-AR-100', 'HAL-PN-77', 'Airborne VHF radio set', '8525', '11111111-1111-1111-1111-111111111111', 'nos', 'Defence electronics', 'VHF 30-88 MHz, secure voice', '{RCMA}', '5 years', 'No export without DGFT licence', 45, 10, 12500.00, 'INR'),
  ('12121212-1212-1212-1212-121212121212', 'PN-AR-200', 'HAL-PN-78', 'Antenna tuning unit', '8529', '11111111-1111-1111-1111-111111111111', 'nos', 'Defence electronics', 'Companion ATU for PN-AR-100', '{RCMA}', '5 years', 'No export without DGFT licence', 45, 5, 6200.00, 'INR'),
  ('12121212-1212-1212-1212-121212121213', 'PN-NVG-10', 'DRDO-PN-31', 'Night vision goggle, Gen III', '9005', '11111111-1111-1111-1111-111111111111', 'nos', 'Optronics', 'Gen III image intensifier', '{MIL}', '3 years', 'Restricted', 120, 1, 210000.00, 'INR'),
  ('12121212-1212-1212-1212-121212121214', 'PN-RAD-01', 'HAL-PN-90', 'Radar module', '8526', '11111111-1111-1111-1111-111111111111', 'nos', 'Radar', 'X-band module, long range', '{CEMILAC}', '5 years', 'Restricted', 90, 1, 1150000.00, 'INR')
on conflict (id) do nothing;

-- Link the stage records to the master data (idempotent: only fills the link).
update public.requirements r
set customer_id = c.id
from public.customers c
where r.customer_id is null and c.name = r.customer_agency;

update public.purchase_orders po
set customer_id = c.id
from public.customers c
where po.customer_id is null and c.name = po.customer;

update public.line_items li
set product_id = p.id
from public.products p
where li.product_id is null and p.part_number = li.part_number;
