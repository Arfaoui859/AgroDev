-- Agricultural input reference prices and regulated pesticide seller offers.
-- Seller-submitted pesticide offers remain private until a human admin reviews
-- the product registration evidence and the seller's distribution authorization.

create table if not exists public.agricultural_input_price_observations (
  id uuid primary key default gen_random_uuid(),
  product_name text not null check (char_length(btrim(product_name)) between 2 and 180),
  product_type text not null default 'pesticide'
    check (product_type in ('pesticide','fertilizer','seed','seedling','soil_amendment','animal_input','other')),
  active_ingredient text,
  package_size numeric(14,3) check (package_size is null or package_size > 0),
  package_unit text,
  price numeric(14,3) not null check (price > 0),
  currency char(3) not null default 'TND',
  source_name text not null,
  source_url text not null,
  source_type text not null default 'official_open_data',
  source_key text not null,
  external_id text not null,
  observed_on date not null,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','source-checked','official-source','rejected')),
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source_key, external_id)
);

create index if not exists agricultural_input_prices_latest_idx
  on public.agricultural_input_price_observations (observed_on desc, product_name);

alter table public.agricultural_input_price_observations enable row level security;
drop policy if exists "public can read agricultural input price references"
  on public.agricultural_input_price_observations;
create policy "public can read agricultural input price references"
  on public.agricultural_input_price_observations for select to anon, authenticated
  using (true);
grant select on public.agricultural_input_price_observations to anon, authenticated;

create table if not exists public.pesticide_seller_offers (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  trade_name text not null check (char_length(btrim(trade_name)) between 2 and 180),
  active_ingredient text,
  registration_number text not null,
  product_registration_evidence_url text not null,
  seller_authorization_number text not null,
  seller_authorization_document_url text not null,
  package_size numeric(14,3) not null check (package_size > 0),
  package_unit text not null,
  price numeric(14,3) not null check (price > 0),
  currency char(3) not null default 'TND',
  quantity numeric(14,3) not null check (quantity > 0),
  quantity_unit text not null default 'packages',
  location text,
  governorate text,
  image_urls text[] not null default '{}',
  status text not null default 'pending_review'
    check (status in ('pending_review','approved','rejected','archived')),
  review_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(image_urls) <= 8)
);

create index if not exists pesticide_seller_offers_public_idx
  on public.pesticide_seller_offers (created_at desc) where status = 'approved';
create index if not exists pesticide_seller_offers_seller_idx
  on public.pesticide_seller_offers (seller_id, created_at desc);
create index if not exists pesticide_seller_offers_review_idx
  on public.pesticide_seller_offers (created_at asc) where status = 'pending_review';

alter table public.pesticide_seller_offers enable row level security;
drop policy if exists "public can read approved pesticide offers" on public.pesticide_seller_offers;
create policy "public can read approved pesticide offers"
  on public.pesticide_seller_offers for select to anon, authenticated
  using (status = 'approved');

drop policy if exists "sellers can read their own pesticide offers" on public.pesticide_seller_offers;
create policy "sellers can read their own pesticide offers"
  on public.pesticide_seller_offers for select to authenticated
  using (seller_id = auth.uid());

drop policy if exists "verified sellers can submit pending pesticide offers" on public.pesticide_seller_offers;
create policy "verified sellers can submit pending pesticide offers"
  on public.pesticide_seller_offers for insert to authenticated
  with check (seller_id = auth.uid() and status = 'pending_review' and reviewed_by is null and reviewed_at is null);

grant select, insert on public.pesticide_seller_offers to authenticated;
grant select on public.pesticide_seller_offers to anon;
-- Admin moderation and price ingestion are performed by the server's service-role client.
