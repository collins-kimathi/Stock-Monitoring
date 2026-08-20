-- Incremental migration: run this if you already applied the ORIGINAL
-- database/schema.sql (products/services/sales) and want the new
-- suppliers + stock_movements features without recreating the database.
-- Safe to run more than once.

create extension if not exists pgcrypto;

-- 1. Suppliers ---------------------------------------------------------------
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  contact_person text,
  phone text,
  email text,
  location text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Extend products ---------------------------------------------------------
alter table products
  add column if not exists supplier_id uuid references suppliers (id) on delete set null,
  add column if not exists is_active boolean not null default true;

-- 3. stock_movements audit trail ---------------------------------------------
-- `quantity` is signed: positive adds stock, negative removes it. This keeps
-- direction explicit so products.quantity can be treated as the running total.
create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products (id) on delete cascade,
  type text not null check (type in ('stock_in', 'stock_out', 'adjustment')),
  quantity numeric not null check (quantity <> 0),
  reason text not null default '',
  reference_type text,
  reference_id uuid,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_movements_product on stock_movements (product_id);
create index if not exists idx_movements_type on stock_movements (type);
create index if not exists idx_movements_created on stock_movements (created_at desc);

-- 4. Seed suppliers (safe if already inserted) --------------------------------
insert into suppliers (name, category, contact_person, phone, email, location)
select * from (values
  ('Kenya Book & Paper Supply', 'Books', 'Main Office', '0700 000 111', 'orders@kbps.co.ke', 'Nairobi'),
  ('Stationery Wholesalers Ltd', 'Stationery', 'Sales Team', '0711 222 333', 'sales@swl.co.ke', 'Mombasa'),
  ('Toner & Ink Suppliers', 'Printing', 'Accounts', '0722 333 444', 'orders@tisd.ke', 'Nairobi')
) as seed(name, category, contact_person, phone, email, location)
where not exists (select 1 from suppliers);