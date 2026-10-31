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
-- 好友行程邀請：從「收藏」的景點發起行程、邀請好友，好友在「好友」分頁按 Join! 加入
-- trips 存行程（景點資訊複製一份，因為收藏只存在發起人的瀏覽器裡），
-- trip_members 存「誰被邀請、目前狀態」。發起人不放進 trip_members，用 trips.organizer_id 判斷。
-- ============================================================
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  place_title text not null,
  place_address text,
  place_image text,
  place_tags text[] not null default '{}',
  place_lat double precision,
  place_lng double precision,
  created_at timestamptz not null default now()
);

create table if not exists trip_members (
  trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'joined', 'declined')),
  updated_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

alter table trips enable row level security;
alter table trip_members enable row level security;

-- 兩張表的權限會互相參照（看得到行程 ⇔ 是成員），直接寫在 policy 裡會無限遞迴，
-- 所以用 security definer 函式（以建立者身分執行、略過 RLS）來判斷。
create or replace function is_trip_organizer(t uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from trips where id = t and organizer_id = auth.uid());
$$;

create or replace function is_trip_participant(t uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select is_trip_organizer(t)
      or exists (select 1 from trip_members where trip_id = t and user_id = auth.uid());
$$;

-- 行程：只有發起人和被邀請的人看得到；只能用自己的身分發起；只有發起人能刪除
-- （發起人直接比對 organizer_id：剛 insert 完馬上讀回來時，函式裡的查詢還看不到這筆新資料）
drop policy if exists "trips select participant" on trips;
create policy "trips select participant"
  on trips for select
  to authenticated
  using (organizer_id = auth.uid() or is_trip_participant(id));

drop policy if exists "trips insert own" on trips;
create policy "trips insert own"
  on trips for insert
  to authenticated
  with check (organizer_id = auth.uid());

drop policy if exists "trips delete organizer" on trips;
create policy "trips delete organizer"
  on trips for delete
  to authenticated
  using (organizer_id = auth.uid());

-- 成員：同一個行程的人互相看得到；只有發起人能邀請，而且只能邀請已經是好友的人；
-- 被邀請的人只能改自己那一筆的狀態（加入／婉拒）
drop policy if exists "trip_members select participant" on trip_members;
create policy "trip_members select participant"
  on trip_members for select
  to authenticated
  using (is_trip_participant(trip_id));

drop policy if exists "trip_members insert by organizer" on trip_members;
create policy "trip_members insert by organizer"
  on trip_members for insert
  to authenticated
  with check (
    is_trip_organizer(trip_id)
    and exists (
      select 1 from friendships f
      where f.status = 'accepted'
        and ((f.requester_id = auth.uid() and f.addressee_id = user_id)
          or (f.addressee_id = auth.uid() and f.requester_id = user_id))
    )
  );

drop policy if exists "trip_members update self" on trip_members;
create policy "trip_members update self"
  on trip_members for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- 行程設定（發起人在送出邀請時決定）
--   visibility        ：'friends' 僅限受邀的好友看得到；'public' 所有用戶都看得到、可以直接加入
--   max_members       ：人數上限（含發起人）
--   max_stops         ：景點數上限（含發起時的第一個景點）
--   allow_member_stops：已加入的人可不可以新增下一個景點
-- ============================================================
alter table trips add column if not exists visibility text not null default 'friends';
alter table trips add column if not exists max_members int not null default 4;
alter table trips add column if not exists max_stops int not null default 3;
alter table trips add column if not exists allow_member_stops boolean not null default false;

alter table trips drop constraint if exists trips_visibility_check;
alter table trips add constraint trips_visibility_check check (visibility in ('friends', 'public'));
alter table trips drop constraint if exists trips_limits_check;
alter table trips add constraint trips_limits_check check (max_members between 2 and 20 and max_stops between 1 and 20);

-- 行程的第 2 個以後的景點（第 1 個是 trips 上的 place_*）
create table if not exists trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  added_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  place_title text not null,
  place_address text,
  place_image text,
  place_tags text[] not null default '{}',
  place_lat double precision,
  place_lng double precision,
  created_at timestamptz not null default now()
);

alter table trip_stops enable row level security;

create or replace function is_trip_public(t uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from trips where id = t and visibility = 'public');
$$;

-- 誰可以新增景點：發起人；或「已加入」的成員且發起人有開放
create or replace function can_add_trip_stop(t uuid) returns boolean
language sql security definer stable set search_path = public as $$
  select is_trip_organizer(t)
      or exists (
        select 1 from trips tr
        join trip_members m on m.trip_id = tr.id
        where tr.id = t and tr.allow_member_stops and m.user_id = auth.uid() and m.status = 'joined'
      );
$$;

-- 公開行程：所有登入的用戶都看得到行程和成員
drop policy if exists "trips select participant" on trips;
create policy "trips select participant"
  on trips for select
  to authenticated
  using (organizer_id = auth.uid() or visibility = 'public' or is_trip_participant(id));

drop policy if exists "trip_members select participant" on trip_members;
create policy "trip_members select participant"
  on trip_members for select
  to authenticated
  using (is_trip_participant(trip_id) or is_trip_public(trip_id));

-- 加入成員的兩種方式：發起人邀請好友（invited），或自己加入公開行程（joined）
drop policy if exists "trip_members insert by organizer" on trip_members;
create policy "trip_members insert by organizer"
  on trip_members for insert
  to authenticated
  with check (
    (
      is_trip_organizer(trip_id)
      and status = 'invited'
      and exists (
        select 1 from friendships f
        where f.status = 'accepted'
          and ((f.requester_id = auth.uid() and f.addressee_id = user_id)
            or (f.addressee_id = auth.uid() and f.requester_id = user_id))
      )
    )
    or (user_id = auth.uid() and status = 'joined' and is_trip_public(trip_id))
  );

drop policy if exists "trip_stops select participant" on trip_stops;
create policy "trip_stops select participant"
  on trip_stops for select
  to authenticated
  using (is_trip_participant(trip_id) or is_trip_public(trip_id));

drop policy if exists "trip_stops insert allowed" on trip_stops;
create policy "trip_stops insert allowed"
  on trip_stops for insert
  to authenticated
  with check (added_by = auth.uid() and can_add_trip_stop(trip_id));

drop policy if exists "trip_stops delete own or organizer" on trip_stops;
create policy "trip_stops delete own or organizer"
  on trip_stops for delete
  to authenticated
  using (added_by = auth.uid() or is_trip_organizer(trip_id));

-- 人數上限：邀請中＋已加入＋發起人 不能超過 max_members（婉拒的人會讓出名額）
-- 用 trigger 在資料庫端擋，不管前端怎麼送都不會超過
create or replace function enforce_trip_capacity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cap int;
  taken int;
begin
  if new.status = 'declined' then
    return new;
  end if;
  select max_members into cap from trips where id = new.trip_id;
  select count(*) into taken from trip_members
    where trip_id = new.trip_id and status in ('invited', 'joined') and user_id <> new.user_id;
  if taken + 2 > cap then  -- +1 自己、+1 發起人
    raise exception 'trip_full';
  end if;
  return new;
end;
$$;

drop trigger if exists trip_members_capacity on trip_members;
create trigger trip_members_capacity
  before insert or update of status on trip_members
  for each row execute function enforce_trip_capacity();

-- 景點上限：trip_stops 的數量＋第 1 個景點 不能超過 max_stops
create or replace function enforce_trip_stop_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cap int;
  taken int;
begin
  select max_stops into cap from trips where id = new.trip_id;
  select count(*) into taken from trip_stops where trip_id = new.trip_id;
  if taken + 2 > cap then  -- +1 這次新增的、+1 第一個景點
    raise exception 'stops_full';
  end if;
  return new;
end;
$$;

drop trigger if exists trip_stops_limit on trip_stops;
create trigger trip_stops_limit
  before insert on trip_stops
  for each row execute function enforce_trip_stop_limit();

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
