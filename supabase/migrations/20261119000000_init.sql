-- Rose Patisserie: şema, RLS ve depolama.

create schema if not exists private;

-- Tablolar ------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  slug text not null unique,
  description text not null default '' check (char_length(description) <= 5000),
  category_id uuid not null references public.categories (id) on delete restrict,
  status text not null default 'draft' check (status in ('published', 'draft')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_status_published_at_idx on public.products (status, published_at desc);
create index products_category_id_idx on public.products (category_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  path_thumb text not null,
  path_full text not null,
  width int not null check (width > 0),
  height int not null check (height > 0),
  sort_order int not null
);
create index product_images_product_id_sort_idx on public.product_images (product_id, sort_order);

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  whatsapp_number text check (whatsapp_number is null or whatsapp_number ~ '^905[0-9]{9}$'),
  instagram_username text default 'rose.patisserie.tr',
  tagline text not null default 'Her tatlıda küçük bir mutluluk',
  about_text text not null default ''
);
insert into public.site_settings (id) values (1);

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- Yardımcılar ---------------------------------------------------------------

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_admin() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger products_touch_updated_at
before update on public.products
for each row execute function private.touch_updated_at();

-- Yetkiler ------------------------------------------------------------------

grant select on public.categories, public.products, public.product_images, public.site_settings
  to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images
  to authenticated;
grant update on public.site_settings to authenticated;
grant select on public.admins to authenticated;

-- RLS -----------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.site_settings enable row level security;
alter table public.admins enable row level security;

create policy categories_read on public.categories
  for select to anon, authenticated using (true);
create policy categories_admin_insert on public.categories
  for insert to authenticated with check ((select private.is_admin()));
create policy categories_admin_update on public.categories
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy categories_admin_delete on public.categories
  for delete to authenticated using ((select private.is_admin()));

create policy products_read on public.products
  for select to anon, authenticated using (status = 'published' or (select private.is_admin()));
create policy products_admin_insert on public.products
  for insert to authenticated with check ((select private.is_admin()));
create policy products_admin_update on public.products
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy products_admin_delete on public.products
  for delete to authenticated using ((select private.is_admin()));

create policy product_images_read on public.product_images
  for select to anon, authenticated using (
    (select private.is_admin())
    or exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.status = 'published'
    )
  );
create policy product_images_admin_insert on public.product_images
  for insert to authenticated with check ((select private.is_admin()));
create policy product_images_admin_update on public.product_images
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy product_images_admin_delete on public.product_images
  for delete to authenticated using ((select private.is_admin()));

create policy site_settings_read on public.site_settings
  for select to anon, authenticated using (true);
create policy site_settings_admin_update on public.site_settings
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy admins_read_self on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Depolama --------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/webp']);

-- Silme işlemi Storage API'de select yetkisi de ister.
create policy product_images_storage_select on storage.objects
  for select to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));
create policy product_images_storage_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and (select private.is_admin()));
create policy product_images_storage_update on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()))
  with check (bucket_id = 'product-images' and (select private.is_admin()));
create policy product_images_storage_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and (select private.is_admin()));
