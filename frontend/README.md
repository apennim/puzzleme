# 拼途 前端原型（Frontend prototype）

快速說明：此資料夾內包含使用 React + Vite 建立的前端原型，使用 Leaflet、Turf、Framer Motion，資料層為 Supabase（Postgres + Storage）。由於開發主機可能沒有 Node/npm，請依照下列方式在本地或容器中啟動。

本機啟動（需要 Node.js 與 npm）：

```bash
cd frontend
npm install
npm run dev
```

`.env.local` 需要 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（見 `.env.example`），部署細節見 [docs/DEPLOY.md](../docs/DEPLOY.md)。

容器化提示：專案根目錄含 `docker-compose.yml` 與 `Dockerfile`，可建立一個 dev 容器再在容器內執行 `npm install`。

主要檔案：

- `src/App.tsx` — 玩法路由與主要狀態管理
- `src/components/MapCanvas.tsx` — Leaflet 地圖
- `src/components/SwipeDeck.tsx` — 卡片滑動（Framer Motion）
- `src/hooks/usePosts.ts` — 行程貼文讀寫 Supabase
- `src/components/LeadCaptureModal.tsx` — 留資表單
