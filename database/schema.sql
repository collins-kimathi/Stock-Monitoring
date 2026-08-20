-- Dekar SmartPOS + Inventory System
-- Run this in the Supabase SQL editor (or any Postgres 13+ instance) to provision the schema.
-- Tables here match the shape the existing React frontend already expects
-- (frontend/src/App.jsx, pages/Inventory.jsx, pages/Sales.jsx, pages/Services.jsx).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- suppliers: organisations/people you buy stock from.
-- ---------------------------------------------------------------------------
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

create index if not exists idx_suppliers_category on suppliers (category);

-- ---------------------------------------------------------------------------
-- products: physical stock items sold across any category (Books, Stationery,
-- Printing, Cyber, Office, ...). Adding categories needs no schema change.
-- ---------------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  category text not null default 'Stationery',
  unit text not null default 'pcs',
  quantity numeric not null default 0 check (quantity >= 0),
  reorder_level numeric not null default 0 check (reorder_level >= 0),
  buying_price numeric not null default 0 check (buying_price >= 0),
  selling_price numeric not null default 0 check (selling_price >= 0),
  supplier_id uuid references suppliers (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_quantity on products (quantity);
create index if not exists idx_products_category on products (category);
create index if not exists idx_products_is_active on products (is_active);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- stock_movements: the audit trail. `quantity` is signed — positive = stock
-- in / correction up, negative = stock out / write-off. products.quantity is
-- effectively a running balance over these rows. Nothing is ever edited in
-- place; you always know what moved, why, and who authorised it.
--   type          : stock_in (received) | stock_out (sold/used) | adjustment (manual correction)
--   quantity      : signed magnitude (positive adds, negative removes)
--   reference_type: what caused it (sale / purchase / manual adjustment)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- services: non-stock sellable items (cyber cafe services, printing, etc.)
-- ---------------------------------------------------------------------------
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Cyber',
  unit text not null default 'each',
  price numeric not null default 0 check (price >= 0),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- sales: single audit trail for both product sales and service sales.
-- Stock decrements happen alongside the insert (see server/src/services/stockService.js)
-- inside one DB transaction so quantity never goes negative.
-- ---------------------------------------------------------------------------
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'product' check (type in ('product', 'service')),
  product_id uuid references products (id) on delete set null,
  item_name text not null,
  quantity numeric not null check (quantity > 0),
  unit_price numeric not null default 0 check (unit_price >= 0),
  cost_price numeric not null default 0 check (cost_price >= 0),
  total numeric generated always as (quantity * unit_price) stored,
  payment_method text not null default 'Cash',
  staff_id uuid, -- will reference auth.users once Supabase Auth is wired in (phase 6)
  created_at timestamptz not null default now()
);

create index if not exists idx_sales_created_at on sales (created_at desc);
create index if not exists idx_sales_product_id on sales (product_id);

-- ---------------------------------------------------------------------------
-- Seed data: a few starter suppliers + services so the app is usable out of
-- the box. Edit/delete freely.
-- ---------------------------------------------------------------------------
insert into suppliers (name, category, contact_person, phone, email, location)
select * from (values
  ('Kenya Book & Paper Supply', 'Books', 'Main Office', '0700 000 111', 'orders@kbps.co.ke', 'Nairobi'),
  ('Stationery Wholesalers Ltd', 'Stationery', 'Sales Team', '0711 222 333', 'sales@swl.co.ke', 'Mombasa'),
  ('Toner & Ink Suppliers', 'Printing', 'Accounts', '0722 333 444', 'orders@tisd.ke', 'Nairobi')
) as seed(name, category, contact_person, phone, email, location)
where not exists (select 1 from suppliers);

insert into services (name, category, unit, price)
select * from (values
  ('Black & White Printing', 'Printing', 'page', 5),
  ('Colour Printing', 'Printing', 'page', 20),
  ('Photocopying', 'Printing', 'page', 5),
  ('Lamination', 'Cyber', 'page', 30),
  ('Internet Browsing', 'Cyber', 'hour', 50),
  ('Document Scanning', 'Cyber', 'page', 10)
) as seed(name, category, unit, price)
where not exists (select 1 from services);

-- ---------------------------------------------------------------------------
-- Row Level Security: left disabled for now because the Express backend talks
-- to Postgres directly using a trusted connection (server/.env DATABASE_URL).
-- Enable + add policies here once the frontend calls Supabase directly with
-- the anon key (e.g. for Supabase Auth session-aware reads).
-- ---------------------------------------------------------------------------
-- alter table products enable row level security;
-- alter table services enable row level security;
-- alter table sales enable row level security;
