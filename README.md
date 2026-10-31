# 拼途 PUZZLE ME

早安晚安is Apennim! aka. PUZZLE ME的製作者，為了更好的介紹與試用體驗，如有需要試用DEMO請幫我從以下聯絡方式取得聯繫
Gmail: abby931117@gmail.com/ 124A038@ntub.edu.tw
Instagram: im24601____

2026/9/4 Fri.已更新Demo1.0 歡迎試用!!
如有任何合作與指正也歡迎來信聯絡^_^Y

🔗 **試用 DEMO**：https://puzzleme-swart.vercel.app

---

## 💡 專案動機（為什麼做）

出門走走時，常常不知道附近有哪些值得去的地方，找到之後又很難約到朋友一起去。
「拼途」想把**探索景點**、**記錄行程**和**揪朋友出遊**放在同一個 App 裡：
像拼拼圖一樣，一片一片把喜歡的景點拼成一趟旅程，再邀請好友一起完成。

## 📱 使用方法（怎麼用）

1. **登入**：輸入暱稱、Gmail 或電話號碼、密碼。同一組帳密在任何裝置登入，資料都會保留。
2. **建立個人資料**：第一次登入時上傳大頭貼、輸入名字、選擇所在地點。
3. **滑卡探索（Match）**：右滑收藏喜歡的景點，左滑略過。
4. **收藏**：查看收藏的景點，按「👥 邀請好友同行」發起行程，並設定：
   - 誰可以看到：🔒 僅限好友，或 🌏 公開（其他用戶也能加入）
   - 人數上限、景點數上限
   - 是否讓受邀者新增下一個景點
5. **好友**：交換 6 碼好友代碼加好友；在「行程邀請」按 **Join!** 加入好友的行程，或在「公開行程」加入其他用戶的行程。
6. **首頁**：瀏覽所有人的行程貼文；按右下角「＋ 新增行程貼文」發文，上傳照片時可以自己裁切畫面。
7. **個人主頁**：右上角 👤 查看自己發過的貼文，點進貼文可以編輯文案、地點或刪除。

## 🏆 成果展示（做了什麼）

| 功能 | 說明 |
|---|---|
| 帳號系統 | Gmail／電話＋密碼登入，個人資料存在雲端資料庫 |
| 滑卡探索 | 卡片滑動收藏景點，可選用 Google 街景照片 |
| 行程貼文 | 一欄下滑的動態牆、4:5 照片、上傳時裁切、編輯與刪除 |
| 個人主頁 | 大頭貼、名字、狀態選單、自己的貼文列表 |
| 好友系統 | 好友代碼、送出／接受／婉拒好友邀請 |
| 好友行程邀請 | 依 Figma 設計稿製作的邀請畫面，Join! 加入、顯示已加入成員與距離 |
| 行程設定 | 公開範圍、人數上限、景點數上限、成員新增景點（資料庫端強制上限） |
| 手機體驗 | 停止滑動時底部工具列自動縮小，不擋住畫面按鈕 |

每週進度詳見 [docs/WEEKLY_LOG.md](docs/WEEKLY_LOG.md)。

### 使用技術

- **前端**：React、TypeScript、Vite
- **地圖與地理運算**：Leaflet、Turf
- **動畫**：Framer Motion
- **後端與資料庫**：Supabase（PostgreSQL、Auth、Storage、Row Level Security）
- **部署**：Vercel（前端與 Serverless Function）
- **字型**：英文 Inter、手寫風 Caveat（Google Fonts）；中文 PuzzleMe Sans TC，由 LY Corporation 的 [LINE Seed TW](https://seed.line.me/index_tw.html) 分片轉成網頁字型，依 SIL Open Font License 1.1 授權（授權全文見 `frontend/public/fonts/puzzleme-sans-tc/OFL.txt`）

部署與資料庫設定步驟見 [docs/DEPLOY.md](docs/DEPLOY.md)，本機開發見 [frontend/README.md](frontend/README.md)。

## 👥 組員分工（誰做的）

| 成員 | 負責項目 |
|---|---|
| Apennim | 企劃、Figma 介面設計、前端與資料庫開發、測試 |

> 本專案開發過程中使用 AI 程式助理（Claude Code）協助撰寫程式碼與除錯，關鍵協助內容記錄在 [docs/WEEKLY_LOG.md](docs/WEEKLY_LOG.md) 的「AI 協助紀錄」。
