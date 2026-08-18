# 「拼途」試用 DEMO 部署指南

把專案從「只能本機終端機跑」變成「開連結就能用、資料集中收集」的兩個雲端服務：

- **Supabase**：資料庫（行程貼文、留資表單）+ 媒體檔案儲存
- **Vercel**：前端（React/Vite）靜態站

> 原本規劃的 Socket.IO 後端（配對/投票即時功能）已經整個移除——投票房功能已下架，`server/` 資料夾不存在了，DEMO 只需要前端 + Supabase 兩個服務。
>
> **留資表單的寫入路徑跟行程貼文不一樣**：行程貼文（`trip_posts`）由瀏覽器直接用 anon key 寫入 Supabase，靠 RLS policy 限制權限；留資表單（`profile_leads`）改成先送到 [`frontend/api/submit-lead.ts`](../frontend/api/submit-lead.ts) 這個 Vercel 伺服器端函式，由它用 secret key 寫入（繞過 RLS）。這是因為除錯 `profile_leads` 的 RLS policy 時遇到 Supabase Studio 介面跟資料庫狀態卡住不同步的問題，改用伺服器端寫入更穩定，也更安全（secret key 完全不會出現在瀏覽器端）。

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
   - `SUPABASE_SECRET_KEY`（留資表單 `/api/submit-lead` 這個伺服器端函式專用，前端程式碼完全不會碰到它）
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

## 已知限制

- `trip_posts` 的新增權限對所有人開放（demo 階段的合理取捨），任何拿到 anon key 的人理論上都能塞資料進去。`profile_leads` 因為改走伺服器端 API，前端不再直接握有寫入權限，相對安全一些，但 `/api/submit-lead` 本身仍是公開端點，沒有做防灌水驗證。若之後要防灌水，可以加簡單的 rate limit 或驗證碼。
