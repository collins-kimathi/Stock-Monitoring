-- Enterprise Inventory Migration v2
-- Adds rich product fields, indexes, and full-text search capabilities

alter table products
  add column if not exists barcode text,
  add column if not exists location text,
  add column if not exists brand text,
  add column if not exists wholesale_price numeric not null default 0 check (wholesale_price >= 0),
  add column if not exists max_level numeric not null default 0 check (max_level >= 0),
  add column if not exists notes text;

-- Indexes for lightning-fast lookups on large catalogs
create index if not exists idx_products_barcode on products (barcode);
create index if not exists idx_products_location on products (location);
create index if not exists idx_products_brand on products (brand);
create index if not exists idx_products_sku on products (sku);
create index if not exists idx_products_name on products (name);
create index if not exists idx_products_supplier on products (supplier_id);
create index if not exists idx_products_created_at on products (created_at desc);

-- Stock movements enhanced indexes
create index if not exists idx_movements_prod_created on stock_movements (product_id, created_at desc);
