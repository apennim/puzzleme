# 「拼途」試用 DEMO 部署指南

把專案從「只能本機終端機跑」變成「開連結就能用、資料集中收集」的兩個雲端服務：

- **Supabase**：資料庫（行程貼文、留資表單）+ 媒體檔案儲存
- **Vercel**：前端（React/Vite）靜態站

> 原本規劃的 Socket.IO 後端（配對/投票即時功能）已經整個移除——投票房功能已下架，`server/` 資料夾不存在了，DEMO 只需要前端 + Supabase 兩個服務。
>
> **留資表單的寫入路徑跟行程貼文不一樣**：行程貼文（`trip_posts`）由瀏覽器直接用 anon key 寫入 Supabase，靠 RLS policy 限制權限；留資表單（`profile_leads`）改成先送到 [`frontend/api/account.ts`](../frontend/api/account.ts) 這個 Vercel 伺服器端函式（第 8 步之後，它同時負責建立登入帳號），由它用 secret key 寫入（繞過 RLS）。這是因為除錯 `profile_leads` 的 RLS policy 時遇到 Supabase Studio 介面跟資料庫狀態卡住不同步的問題，改用伺服器端寫入更穩定，也更安全（secret key 完全不會出現在瀏覽器端）。

以下每一步都需要你自己動手（帳號註冊、按鈕點擊），因為 Claude 不能替你建立帳號。凡是需要你回填給我的值，我都會用「**→ 回填**」標出來，貼給我之後我幫你接上程式碼設定。

## 1. Supabase（資料庫）

1. 到 https://supabase.com 註冊帳號，建立一個新專案（New Project），資料庫密碼自己保管好。
2. 專案建好後，左側選單 **SQL Editor**，貼上 [docs/supabase-schema.sql](supabase-schema.sql) 整段內容並執行（會建立 `trip_posts`、`profile_leads` 兩張表與對應權限）。
3. 左側選單 **Storage** → New bucket → 名稱填 `trip-media`，勾選 **Public bucket** → 建立。
4. 回到 **SQL Editor**，把 `docs/supabase-schema.sql` 檔案最下面「Storage：trip-media bucket」那兩段 policy SQL 再執行一次（bucket 建立後才能設定它的 policy）。
5. 左側選單 **Settings → API**，複製：
   - Project URL → 回填 `VITE_SUPABASE_URL`
   - `anon` / `publishable` key → 回填 `VITE_SUPABASE_ANON_KEY`
   - `secret` key（`sb_secret_...`）→ 回填 `SUPABASE_SECRET_KEY`（**這把絕對不能加 `VITE_` 前綴**，只會在 Vercel 的伺服器端函式使用，不會被打包進瀏覽器）

## 2. Vercel（前端）

1. 到 https://vercel.com 註冊帳號。
2. New Project → 選 GitHub repo（見下方「3. Git / GitHub」），Root Directory 選 `frontend`（Vercel 會自動偵測是 Vite 專案）。
3. Environment Variables 加三個（用上面回填的值，記得 **Environment 要勾 Production**）：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SECRET_KEY`（`/api/account` 這個伺服器端函式專用：建立登入帳號＋留資表單，前端程式碼完全不會碰到它）
4. Deploy。完成後會拿到一個網址，例如 `https://pintu-demo.vercel.app`，這就是你可以直接分享給試用者的 DEMO 連結。

## 3. Git / GitHub

目前資料夾已經在本機做了 `git init` 並完成 commit（只包含 `frontend/`、`docs/` 等專案相關檔案，`node_modules`、`.env` 等已排除）。

若要讓 Vercel 接 GitHub 自動部署，需要：
1. 你在 GitHub 建立一個新的空 repo（public 或 private 皆可，Vercel 免費方案兩者都支援）。
2. 把本機 repo push 上去。

**這一步屬於「公開發布內容」，需要你明確同意後我才會執行 push**（或者你也可以自己執行）：

```bash
git remote add origin <你的 GitHub repo 網址>
git branch -M main
git push -u origin main
```

## 4. 本機測試（正式部署前先確認）

在 `frontend/` 建立 `.env.local`（複製 `.env.example` 改真實的值），執行：

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

打開瀏覽器測試：進站應跳出留資表單、發一篇行程貼文（含照片）、重新整理後貼文仍在（代表資料真的存進 Supabase，不是只存在瀏覽器）。

## 5. Street View 街景照片（選用，可跳過）

滑卡目前用的是 `cardData.json` 裡策展好的 Wikimedia Commons 真實照片，不接這個也完全正常。想再進一步換成「該座標真正的 Google 街景」才需要做這步——這一步全部要在你自己的 Google 帳號操作（含綁信用卡），Claude 沒辦法替你建立帳號或輸入卡號。

1. 到 https://console.cloud.google.com/ 用你的 Google 帳號登入，右上角建立一個新專案（或選現有的）。
2. 左側選單 **Billing**，綁一張信用卡啟用帳單（沒綁卡 API 打不通；Demo 用量落在每月免費額度內，正常不會被扣款，但**建議順手在 Billing → Budgets & alerts 設一個小額預算警報**，例如 5 美元，超過會寄信通知你）。
3. 左側選單 **APIs & Services → Library**，搜尋 **Street View Static API**，點進去按 **Enable**。
4. 左側選單 **APIs & Services → Credentials** → **Create Credentials → API key**，會產生一組金鑰。
5. 產生後點進去該金鑰設定：
   - **Application restrictions** 選 **HTTP referrers**，加入：
     - `https://puzzleme-swart.vercel.app/*`（正式站）
     - `https://*.vercel.app/*`（Vercel 預覽部署）
     - `http://localhost:5173/*`（本機開發）
   - **API restrictions** 選 **Restrict key**，只勾 **Street View Static API**（避免這把金鑰被拿去打別的付費 API）
6. 複製這把金鑰 → **回填** `VITE_GOOGLE_STREETVIEW_KEY`（本機 `frontend/.env.local` 和 Vercel 的 Environment Variables 都要加，跟 `VITE_SUPABASE_ANON_KEY` 一樣是可以放前端的 key，因為已經用 referrer 限制過了）。

接上以後行為：程式會先查該座標有沒有街景涵蓋（`metadata` 端點完全免費、不計費），有的話换成真實街景並在卡片標「© Google 街景」，沒有涵蓋就維持原本策展的照片，不會出現破圖。程式碼在 [`frontend/src/lib/streetView.ts`](../frontend/src/lib/streetView.ts)、[`frontend/src/hooks/useCardPhoto.ts`](../frontend/src/hooks/useCardPhoto.ts)。

## 6. 好友系統的地基：Supabase Auth 匿名登入（必做，好友功能的前提）

原本的登入只是把暱稱存在瀏覽器 `localStorage`，換裝置就是另一個人、任何人都能打一樣的暱稱冒充，沒辦法在這之上蓋好友、聊天這種需要「穩定指認出同一個人」的功能。現在改成呼叫 Supabase Auth 的**匿名登入**（`signInAnonymously`）：畫面上使用者體感完全不變（一樣只要打暱稱），但背後會拿到一個真正的帳號 `auth.uid()`，之後加好友、貼文按讚都能直接用它做權限判斷。

這一步只有一個地方要你去 Supabase Dashboard 點開關，其餘我都寫好了：

1. 到你的 Supabase 專案 → 左側選單 **Authentication → Sign In / Providers**，找到 **Anonymous**，打開 **Enable Anonymous Sign-ins**。
2. 左側選單 **SQL Editor**，重新貼上整份 [docs/supabase-schema.sql](supabase-schema.sql) 執行一次（新增了 `profiles` 表，其餘表用 `create table if not exists` / `drop policy if exists` 包過，重複執行不會出錯）。

做完這兩步，正式站重新整理後：新使用者打暱稱送出即可（背後自動建立匿名帳號），**先前只用舊版裝置 ID 登入過的使用者，這次會需要重新輸入一次暱稱**（帳號機制整個換掉了，這是一次性的，之後就會持續記住）。

程式碼在 [`frontend/src/hooks/useProfile.ts`](../frontend/src/hooks/useProfile.ts)（取代原本的 `useDeviceId`）。

## 7. 好友關係（加好友、接受邀請）

在第 6 步的帳號基礎上，新增了「好友代碼加好友」的完整功能：**好友**分頁現在會顯示自己的 6 碼代碼，輸入朋友的代碼即可送出邀請，對方在同一個分頁接受後就會出現在雙方的好友列表。用代碼而不是搜尋暱稱，是因為暱稱可能重複、也不想讓任何登入者能翻看所有人的暱稱清單。

只需要**再重新執行一次** [docs/supabase-schema.sql](supabase-schema.sql)（新增了 `profiles.friend_code` 欄位和 `friendships` 表，一樣是重複執行也不會壞掉既有資料的寫法）。不用再動 Dashboard 的任何開關。

程式碼在 [`frontend/src/hooks/useFriends.ts`](../frontend/src/hooks/useFriends.ts)、[`frontend/src/components/FriendTrip.tsx`](../frontend/src/components/FriendTrip.tsx)。

**目前的範圍**：好友列表本身還沒接回行程貼文動態（「好友」分頁不會顯示好友發的貼文），純粹是加好友／管理好友關係。要接上「看得到好友動態」是下一步。

## 8. 帳號密碼登入＋個人資料上雲（重新登入後資料還在）

第 6 步的匿名帳號只要換瀏覽器、清資料、開無痕視窗就會變成另一個新帳號，個人資料頁的內容也只存在該瀏覽器的 `localStorage`，所以「重新登入」後資料都不見。現在改成：

- **登入畫面的「Gmail/Phone number + Password」就是帳號**。第一次登入會建立帳號（並留資一次），之後用同一組帳密登入（不管哪台裝置）都會回到同一個 `auth.uid()`；密碼打錯會提示。暱稱欄位只在第一次建立帳號時使用，之後以雲端上的暱稱為準。
- 帳號由 [`frontend/api/account.ts`](../frontend/api/account.ts)（取代原本的 `submit-lead.ts`）用 secret key 建立，設定 `email_confirm: true`，**不會寄驗證信**，所以 Supabase 的「Confirm email」開關不用動。電話號碼會換算成固定的內部 email（`phone-09xxxxxxxx@phone.puzzleme.local`），`0912-345-678`、`+886912345678` 都算同一支。
- **個人資料頁（頭像、名字、狀態、3 張貼文）改存 `profiles` 表**，圖片上傳到既有的 `trip-media` bucket 底下 `profiles/<uid>/`。首頁與發文視窗的「我的頭像」也統一用同一個頭像。
- 右上角 ⚙ 設定新增 **登出**，方便測試「登出 → 再登入 → 資料還在」。

你要做的只有一件事：**再重新執行一次** [docs/supabase-schema.sql](supabase-schema.sql)（新增 `profiles.status`、`profiles.profile_posts` 兩個欄位，重複執行不會壞掉既有資料）。Vercel 環境變數沿用第 2 步的 `SUPABASE_SECRET_KEY`，不用新增。

**注意**：
- 先前用匿名帳號登入的試用者，在同一個瀏覽器仍可繼續使用，但匿名帳號沒有帳密，**登出後就找不回來**；請他們登出後用帳密重新登入一次（會是新帳號）。舊版存在 `localStorage` 的個人資料頁內容不會自動搬到雲端。
- `/api/account` 是 Vercel 伺服器端函式，`npm run dev`（純 Vite）不會跑它，本機要測登入請用 `vercel dev`，或直接在 Vercel 預覽部署上測。

程式碼在 [`frontend/src/hooks/useProfile.ts`](../frontend/src/hooks/useProfile.ts)、[`frontend/src/components/ProfilePage.tsx`](../frontend/src/components/ProfilePage.tsx)。

## 9. 登入後的「建立個人資料」頁

登入後，還沒填過所在地點的帳號會先看到「建立個人資料」頁（依 Figma 設計稿）：上傳大頭貼、輸入名字（預設帶入登入時的暱稱）、選擇所在地點（台灣 22 縣市＋海外），三項都填好按 **Done!** 才會進入 App。這個功能上線前就建立的帳號，下次登入也會看到一次。

你要做的：**再重新執行一次** [docs/supabase-schema.sql](supabase-schema.sql)（新增 `profiles.location` 欄位）。

程式碼在 [`frontend/src/components/ProfileSetup.tsx`](../frontend/src/components/ProfileSetup.tsx)。

## 已知限制

- `trip_posts` 的新增權限對所有人開放（demo 階段的合理取捨），任何拿到 anon key 的人理論上都能塞資料進去。`profile_leads` 因為改走伺服器端 API，前端不再直接握有寫入權限，相對安全一些，但 `/api/account` 本身仍是公開端點，沒有做防灌水驗證。若之後要防灌水，可以加簡單的 rate limit 或驗證碼。
