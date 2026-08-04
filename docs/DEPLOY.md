# 「拼途」試用 DEMO 部署指南

把專案從「只能本機終端機跑」變成「開連結就能用、資料集中收集」的三個雲端服務：

- **Supabase**：資料庫（行程貼文、留資表單）+ 媒體檔案儲存
- **Vercel**：前端（React/Vite）靜態站
- **Render**：後端（Express + Socket.IO，配對/投票即時功能）

以下每一步都需要你自己動手（帳號註冊、按鈕點擊），因為 Claude 不能替你建立帳號。凡是需要你回填給我的值，我都會用「**→ 回填**」標出來，貼給我之後我幫你接上程式碼設定。

## 1. Supabase（資料庫）

1. 到 https://supabase.com 註冊帳號，建立一個新專案（New Project），資料庫密碼自己保管好。
2. 專案建好後，左側選單 **SQL Editor**，貼上 [docs/supabase-schema.sql](supabase-schema.sql) 整段內容並執行（會建立 `trip_posts`、`profile_leads` 兩張表與對應權限）。
3. 左側選單 **Storage** → New bucket → 名稱填 `trip-media`，勾選 **Public bucket** → 建立。
4. 回到 **SQL Editor**，把 `docs/supabase-schema.sql` 檔案最下面「Storage：trip-media bucket」那兩段 policy SQL 再執行一次（bucket 建立後才能設定它的 policy）。
5. 左側選單 **Settings → API**，複製：
   - Project URL → 回填 `VITE_SUPABASE_URL`
   - `anon` `public` key → 回填 `VITE_SUPABASE_ANON_KEY`

## 2. Render（Socket.IO 後端）

1. 到 https://render.com 註冊帳號。
2. 建議先把這個資料夾推上 GitHub（見下方「4. Git / GitHub」），Render 用 GitHub repo 自動部署最省事。
3. Dashboard → New → Web Service → 選你的 repo。
4. 設定：
   - **Root Directory**：`server`
   - **Build Command**：`npm install && npm run build`
   - **Start Command**：`npm run start`
   - **Instance Type**：Free 即可（demo 用途）
5. Environment 分頁加變數：
   - `CORS_ORIGIN` = 你的 Vercel 網址（第 3 步部署完才會知道，可以先留空，之後回來補）
6. 部署完成後會拿到一個網址，例如 `https://pintu-server.onrender.com` → 回填 `VITE_SOCKET_URL`

## 3. Vercel（前端）

1. 到 https://vercel.com 註冊帳號。
2. New Project → 選同一個 GitHub repo，Root Directory 選 `frontend`（Vercel 會自動偵測是 Vite 專案）。
3. Environment Variables 加三個（用上面回填的值）：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SOCKET_URL`
4. Deploy。完成後會拿到一個網址，例如 `https://pintu-demo.vercel.app`，這就是你可以直接分享給試用者的 DEMO 連結。
5. 回到 Render，把第 2 步留空的 `CORS_ORIGIN` 補上這個 Vercel 網址，儲存後 Render 會自動重新部署。

## 4. Git / GitHub

目前資料夾已經在本機做了 `git init` 並完成第一次 commit（只包含 `frontend/`、`server/`、`docs/` 等專案相關檔案，`node_modules`、`.env` 等已排除）。

若要讓 Vercel / Render 接 GitHub 自動部署，需要：
1. 你在 GitHub 建立一個新的空 repo（public 或 private 皆可，Vercel/Render 免費方案兩者都支援）。
2. 把本機 repo push 上去。

**這一步屬於「公開發布內容」，需要你明確同意後我才會執行 push**（或者你也可以自己執行）：

```bash
git remote add origin <你的 GitHub repo 網址>
git branch -M main
git push -u origin main
```

## 5. 本機測試（正式部署前先確認）

在 `frontend/` 建立 `.env.local`（複製 `.env.example` 改真實的值），執行：

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

打開瀏覽器測試：進站應跳出留資表單、發一篇行程貼文（含照片）、重新整理後貼文仍在（代表資料真的存進 Supabase，不是只存在瀏覽器）。

## 已知限制

- `profile_leads` 與 `trip_posts` 的新增權限對所有人開放（demo 階段的合理取捨），任何拿到 anon key 的人理論上都能塞資料進去。若之後要防灌水，可以加 Supabase Edge Function 驗證或簡單的 rate limit。
- Render 免費方案的服務閒置一段時間會休眠，第一個請求可能要等 30~60 秒喚醒，示範前建議先手動連一次熱身。
