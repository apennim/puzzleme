# 拼途 前端原型（Frontend prototype）

快速說明：此資料夾內包含使用 React + Vite 建立的前端原型，使用 Leaflet、Turf、Framer Motion 與 socket.io-client。由於開發主機可能沒有 Node/npm，請依照下列方式在本地或容器中啟動。

本機啟動（需要 Node.js 與 npm）：

```bash
cd frontend
npm install
npm run dev
```

本地 mock Socket.IO server（開發用）：

```bash
node ../server/mock_socket_server.js
```

容器化提示：專案根目錄含 `docker-compose.yml` 與 `Dockerfile`，可建立一個 dev 容器再在容器內執行 `npm install`。

主要檔案：

- `src/App.tsx` — 三大玩法路由與主要狀態管理
- `src/components/MapCanvas.tsx` — Leaflet 地圖
- `src/components/SwipeDeck.tsx` — 卡片滑動（Framer Motion）
- `src/components/VoteRoom.tsx` — Socket.IO 投票房
