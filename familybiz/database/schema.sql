-- FamilyBiz starter schema for PostgreSQL / Supabase.
-- Review policies and auth integration before production use.

create extension if not exists pgcrypto;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'manager', 'viewer')),
  joined_at timestamptz not null default now(),
  primary key (family_id, user_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  phone text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  code text,
  name text not null,
  unit text,
  cost_price numeric(14,2) not null default 0 check (cost_price >= 0),
  selling_price numeric(14,2) not null default 0 check (selling_price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id uuid primary key, -- Client-generated UUID supports safe retries / idempotency.
  family_id uuid not null references public.families(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  type text not null check (type in ('SALE', 'EXPENSE', 'PAYMENT_RECEIVED', 'ADJUSTMENT')),
  amount numeric(14,2) not null check (amount >= 0),
  paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
  occurred_at date not null default current_date,
  note text,
  created_by uuid references auth.users(id),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (paid_amount <= amount or type <> 'SALE')
);

create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name_snapshot text not null,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  cost_price numeric(14,2) not null default 0 check (cost_price >= 0)
);

create table if not exists public.product_price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  old_price numeric(14,2),
  new_price numeric(14,2) not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

create index if not exists customers_family_name_idx on public.customers(family_id, name);
create index if not exists products_family_name_idx on public.products(family_id, name);
create index if not exists transactions_family_date_idx on public.transactions(family_id, occurred_at desc);
create index if not exists transactions_customer_idx on public.transactions(customer_id);

-- SECURITY TODO before production:
-- 1. Enable RLS on every table.
-- 2. Add policies using family_members and auth.uid().
-- 3. Enforce role rules (viewer read-only; member/manager permissions).
-- 4. Never expose service-role keys to the browser.
-- 5. Add RPC/transaction logic for safe, atomic multi-row sync.
