-- 趴走咪（拼途）試用 DEMO 用的 Supabase 資料表
-- 使用方式：Supabase Dashboard → SQL Editor → 貼上整段執行一次

create extension if not exists pgcrypto;

-- 行程貼文（對應 NewPostModal 送出的內容）
create table if not exists trip_posts (
  id uuid primary key default gen_random_uuid(),
  caption text,
  location text,
  tagged_friends text[] default '{}',
  media_url text,
  media_type text,
  author_name text,
  author_avatar text,
  created_at timestamptz default now()
);

alter table trip_posts enable row level security;

create policy "trip_posts public insert"
  on trip_posts for insert
  to anon
  with check (true);

create policy "trip_posts public read"
  on trip_posts for select
  to anon
  using (true);

-- 個人資料表單（暱稱 + 聯絡方式，用於後續聯繫試用者）
create table if not exists profile_leads (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  contact text not null,
  created_at timestamptz default now()
);

alter table profile_leads enable row level security;

create policy "profile_leads public insert"
  on profile_leads for insert
  to anon
  with check (true);

-- 刻意不開放 anon 讀取權限：留資表單資料只能在 Supabase 後台（Table Editor）查看，避免外洩給任何拿到 anon key 的人


-- ============================================================
-- Storage：trip-media bucket 的存取權限
-- 先到 Dashboard → Storage → New bucket，建立一個名為 "trip-media" 的 Public bucket，
-- 再回到 SQL Editor 執行下面兩個 policy
-- ============================================================

create policy "trip-media public insert"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'trip-media');

create policy "trip-media public read"
  on storage.objects for select
  to anon
  using (bucket_id = 'trip-media');
