-- The recovered client workbook added a "vendor registration" field to the
-- Customer Master. It was created as `inverbrass_vendor_registration` (old
-- spelling, lower case), while the app read and wrote
-- `Inverbras_vendor_registration` (new spelling, mixed case). Postgres folds
-- unquoted identifiers to lower case, so the app's mixed-case name matched
-- neither spelling and the customer create/detail path was broken at runtime.
--
-- Rename to the current company spelling in lower case so app, seed and
-- database all agree, and regenerated types carry the exact column name.
alter table public.customers
  rename column inverbrass_vendor_registration to inverbras_vendor_registration;
