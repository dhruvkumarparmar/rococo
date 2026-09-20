-- ROCOCO secure content manager — run once in Supabase SQL Editor.
-- Authentication is restricted to the business email below.

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  collection text not null check (collection in ('client_work','seasonal')),
  title_fr text not null,
  title_en text default '',
  subtitle_fr text default '',
  subtitle_en text default '',
  image_url text not null,
  storage_path text,
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(collection, title_fr)
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name_fr text not null unique,
  name_en text default '',
  price_fr text not null,
  price_en text default '',
  category text not null check (category in ('manucure','extension','extra','autre')),
  display_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.gallery_items enable row level security;
alter table public.services enable row level security;

drop policy if exists "Public can view visible gallery items" on public.gallery_items;
create policy "Public can view visible gallery items" on public.gallery_items for select using (is_visible = true or (auth.jwt() ->> 'email') = 'onglesrococo@gmail.com');
drop policy if exists "Owner manages gallery items" on public.gallery_items;
create policy "Owner manages gallery items" on public.gallery_items for all to authenticated using ((auth.jwt() ->> 'email') = 'onglesrococo@gmail.com') with check ((auth.jwt() ->> 'email') = 'onglesrococo@gmail.com');

drop policy if exists "Public can view visible services" on public.services;
create policy "Public can view visible services" on public.services for select using (is_visible = true or (auth.jwt() ->> 'email') = 'onglesrococo@gmail.com');
drop policy if exists "Owner manages services" on public.services;
create policy "Owner manages services" on public.services for all to authenticated using ((auth.jwt() ->> 'email') = 'onglesrococo@gmail.com') with check ((auth.jwt() ->> 'email') = 'onglesrococo@gmail.com');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nail-images','nail-images',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true, file_size_limit=8388608, allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "Public reads nail images" on storage.objects;
create policy "Public reads nail images" on storage.objects for select using (bucket_id = 'nail-images');
drop policy if exists "Owner uploads nail images" on storage.objects;
create policy "Owner uploads nail images" on storage.objects for insert to authenticated with check (bucket_id = 'nail-images' and (auth.jwt() ->> 'email') = 'onglesrococo@gmail.com');
drop policy if exists "Owner updates nail images" on storage.objects;
create policy "Owner updates nail images" on storage.objects for update to authenticated using (bucket_id = 'nail-images' and (auth.jwt() ->> 'email') = 'onglesrococo@gmail.com') with check (bucket_id = 'nail-images' and (auth.jwt() ->> 'email') = 'onglesrococo@gmail.com');
drop policy if exists "Owner deletes nail images" on storage.objects;
create policy "Owner deletes nail images" on storage.objects for delete to authenticated using (bucket_id = 'nail-images' and (auth.jwt() ->> 'email') = 'onglesrococo@gmail.com');

insert into public.gallery_items (collection,title_fr,title_en,subtitle_fr,subtitle_en,image_url,display_order) values
('client_work','Cat-Eye Rouge','Red Cat-Eye','','','assets/gallery-cat-eye.jpg',1),
('client_work','Rose & Or','Pink & Gold','','','assets/gallery-pink-gold.jpg',2),
('client_work','Floral Bleu','Blue Floral','','','assets/gallery-blue-floral.jpg',3),
('client_work','French Signature','Signature French','','','assets/gallery-french.jpg',4),
('seasonal','Collection automne','Fall Collection','Taupe · Or','Taupe · Gold','assets/fall-collection.png',1)
on conflict (collection,title_fr) do nothing;

insert into public.services (name_fr,name_en,price_fr,price_en,category,display_order) values
('Dépose avec manucure sèche','Removal with dry manicure','À partir de 40 $','Starting at $40','manucure',1),
('Manucure sèche avec vernis gel couleur','Dry manicure with colour gel polish','À partir de 45 $','Starting at $45','manucure',2),
('Manucure sèche avec vernis renforcé','Dry manicure with reinforced polish','À partir de 50 $','Starting at $50','manucure',3),
('Renforcement au gel','Gel reinforcement','55 $','$55','extension',4),
('Pose d’extensions','Extension set','70 $','$70','extension',5),
('Remplissage','Refill','55 $','$55','extension',6),
('Vernis gel','Gel polish','10 $','$10','extra',7),
('Nail art · par ongle','Nail art · per nail','5 $','$5','extra',8),
('French ou Babyboomer','French or Babyboomer','20 $','$20','extra',9),
('Nail art complet · 10 ongles','Full nail art · 10 nails','Sur devis','By quote','extra',10),
('Beauté des pieds','Pedicure','45 $','$45','autre',11),
('Duo manucure et beauté des pieds','Manicure and pedicure duo','80 $','$80','autre',12),
('Dépose d’un autre salon','Removal from another salon','20 $','$20','autre',13),
('Réparations','Repairs','Gratuit','Free','autre',14)
on conflict (name_fr) do nothing;

