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

-- 角色要同時列 anon 與 authenticated：App 改用 Supabase 匿名登入後，登入者的角色是
-- authenticated（不是 anon），只寫 anon 會讓登入後讀不到貼文、也發不了文。
drop policy if exists "trip_posts public insert" on trip_posts;
create policy "trip_posts public insert"
  on trip_posts for insert
  to anon, authenticated
  with check (true);

drop policy if exists "trip_posts public read" on trip_posts;
create policy "trip_posts public read"
  on trip_posts for select
  to anon, authenticated
  using (true);

-- 貼文作者：個人主頁要列出「我發的貼文」。新貼文由資料庫自動帶入發文者的 auth.uid()，
-- 前端不用另外傳。
alter table trip_posts
  add column if not exists author_id uuid default auth.uid() references auth.users(id) on delete set null;

-- 舊貼文補上作者：頭像網址裡有 profiles/<uid>/ 的（帳密登入後發的文），就能對回是誰發的。
-- 更早、沒有頭像網址的貼文對不回作者，維持空值，只會出現在首頁、不會出現在個人主頁。
update trip_posts t
set author_id = u.id
from auth.users u
where t.author_id is null
  and u.id::text = substring(t.author_avatar from '/profiles/([0-9a-f-]{36})/');

-- 編輯／刪除貼文：只有作者本人（author_id = 自己的 auth.uid()）可以改或刪自己的貼文。
-- 對不回作者的舊貼文（author_id 是空值）沒有人能改，維持原樣。
drop policy if exists "trip_posts author update" on trip_posts;
create policy "trip_posts author update"
  on trip_posts for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists "trip_posts author delete" on trip_posts;
create policy "trip_posts author delete"
  on trip_posts for delete
  to authenticated
  using (author_id = auth.uid());

-- 個人資料表單（暱稱 + 聯絡方式，用於後續聯繫試用者）
create table if not exists profile_leads (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  contact text not null,
  created_at timestamptz default now()
);

alter table profile_leads enable row level security;

drop policy if exists "profile_leads public insert" on profile_leads;
create policy "profile_leads public insert"
  on profile_leads for insert
  to anon
  with check (true);

-- 刻意不開放 anon 讀取權限：留資表單資料只能在 Supabase 後台（Table Editor）查看，避免外洩給任何拿到 anon key 的人


-- ============================================================
-- 使用者個人資料（對應 Supabase Auth 的使用者，含匿名登入 signInAnonymously）
-- 前置作業：Dashboard → Authentication → Sign In / Providers → Anonymous，
-- 打開「Enable Anonymous Sign-ins」，這步只能在網頁上點，SQL 做不到。
-- ============================================================

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profiles enable row level security;

-- 所有登入者（含匿名登入）都能讀，之後「搜尋暱稱加好友」要用
drop policy if exists "profiles read for authenticated" on profiles;
create policy "profiles read for authenticated"
  on profiles for select
  to authenticated
  using (true);

-- 只能新增自己的那一筆
drop policy if exists "profiles insert own" on profiles;
create policy "profiles insert own"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 只能改自己的那一筆
drop policy if exists "profiles update own" on profiles;
create policy "profiles update own"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 好友代碼：每個人一組短代碼，面對面或線上都能用它加好友，比搜尋暱稱更精準
-- （暱稱可能重複，代碼不會）
alter table profiles add column if not exists friend_code text;
create unique index if not exists profiles_friend_code_key on profiles (friend_code);

-- 個人資料頁（頭像、狀態、3 張貼文）改存雲端，跟著帳號走：重新登入、換裝置都還在
-- 圖片本身傳到 trip-media bucket 的 profiles/<uid>/ 底下，這裡只存網址
alter table profiles add column if not exists status text;
alter table profiles add column if not exists profile_posts jsonb not null default '[]'::jsonb;

-- 登入後的「建立個人資料」頁：所在地點（縣市），空值代表還沒填完這一頁
alter table profiles add column if not exists location text;


-- ============================================================
-- 好友關係
-- 一筆代表一段「邀請／好友」關係：requester 發出邀請給 addressee，
-- status 從 pending 變成 accepted。查詢「我的好友」時要同時看
-- requester_id 和 addressee_id 兩個欄位（見 useFriends.ts）。
-- ============================================================

create table if not exists friendships (
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

alter table friendships enable row level security;

-- 只能看到跟自己有關的關係（我發出的、或別人發給我的）
drop policy if exists "friendships select involved" on friendships;
create policy "friendships select involved"
  on friendships for select
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- 只能以自己的身分發出邀請
drop policy if exists "friendships insert own" on friendships;
create policy "friendships insert own"
  on friendships for insert
  to authenticated
  with check (auth.uid() = requester_id);

-- 邀請雙方都能更新狀態（接受邀請）
drop policy if exists "friendships update involved" on friendships;
create policy "friendships update involved"
  on friendships for update
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id)
  with check (auth.uid() = requester_id or auth.uid() = addressee_id);

-- 雙方都能刪除（取消邀請／拒絕／解除好友）
drop policy if exists "friendships delete involved" on friendships;
create policy "friendships delete involved"
  on friendships for delete
  to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);


-- ============================================================
-- Storage：trip-media bucket 的存取權限
-- 先到 Dashboard → Storage → New bucket，建立一個名為 "trip-media" 的 Public bucket，
-- 再回到 SQL Editor 執行下面兩個 policy
-- （同樣要列 anon 與 authenticated，原因見上方 trip_posts 的說明）
-- ============================================================

drop policy if exists "trip-media public insert" on storage.objects;
create policy "trip-media public insert"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'trip-media');

drop policy if exists "trip-media public read" on storage.objects;
create policy "trip-media public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'trip-media');
