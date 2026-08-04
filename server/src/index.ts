/**
 * Pinto 後端伺服器 - Express + Socket.IO
 */

import express from 'express';
import { createServer } from 'http';
import { Server, type Socket } from 'socket.io';
import cors from 'cors';
import { SERVER_CONFIG } from './config';
import { RoomManager } from './services/RoomManager';
import { VoteCounter } from './services/VoteCounter';
import { RouteGenerator } from './services/RouteGenerator';
import type { RoomMember } from './types/socket';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: SERVER_CONFIG.CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

// 中介軟體
app.use(cors());
app.use(express.json());

// 服務實例
const roomManager = new RoomManager();
const voteCounter = new VoteCounter();
const routeGenerator = new RouteGenerator();

/**
 * Socket.IO 連線事件
 */
io.on('connection', (socket: Socket) => {
  console.log(`✅ 客戶端已連線: ${socket.id}`);

  /**
   * join_room 事件 - 加入房間
   */
  socket.on('join_room', (data: { userId: string; roomId: string }) => {
    const { userId, roomId } = data;

    // 建立房間（若不存在）
    roomManager.createRoom(roomId);

    // 加入 Socket 房間
    socket.join(roomId);

    // 新增成員
    const member: RoomMember = {
      userId,
      socketId: socket.id,
    };
    roomManager.addMember(roomId, member);

    console.log(`👤 ${userId} 加入房間 ${roomId}`);

    // 廣播房間更新
    io.to(roomId).emit('room_updated', {
      memberCount: roomManager.getMemberCount(roomId),
      members: Array.from(roomManager.getRoom(roomId)?.members.values() || []),
    });
  });

  /**
   * submit_theme 事件 - 提交主題並生成路線
   */
  socket.on('submit_theme', (data: { theme: string; userId: string; roomId: string }) => {
    const { theme, roomId } = data;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', message: '房間不存在' });
      return;
    }

    // 更新房間主題
    room.selectedTheme = theme;
    room.votingPhase = true;

    // 生成路線
    const routes = routeGenerator.generateRoutes(theme);

    console.log(`🎯 房間 ${roomId} 選擇主題: ${theme}`);

    // 廣播給房間內所有客戶端
    io.to(roomId).emit('routes_generated', {
      routes,
      theme,
      votingPhase: true,
    });
  });

  /**
   * vote_route 事件 - 投票選擇路線
   */
  socket.on('vote_route', (data: { routeId: string; userId: string; roomId: string }) => {
    const { routeId, userId, roomId } = data;
    const room = roomManager.getRoom(roomId);

    if (!room) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', message: '房間不存在' });
      return;
    }

    // 記錄投票
    const member = room.members.get(userId);
    if (member) {
      member.vote = routeId;
    }

    voteCounter.addVote(routeId);

    const votes = voteCounter.getVotes();
    const totalMembers = roomManager.getMemberCount(roomId);

    console.log(`🗳️ ${userId} 投票選擇 ${routeId}，房間 ${roomId}`);

    // 廣播投票更新
    io.to(roomId).emit('update_vote_count', {
      votes,
      totalMembers,
    });

    // 檢查是否超過 50%
    if (voteCounter.isPassThreshold(totalMembers, 0.5)) {
      const winner = voteCounter.getWinnerRoute();
      if (winner) {
        const routes = routeGenerator.generateRoutes(room.selectedTheme || '');
        const unlockedRoute = routes.find((r) => r.id === winner);

        room.votingPhase = false;
        room.unlockedRoute = unlockedRoute;

        console.log(`🎉 路線 ${winner} 已解鎖！`);

        io.to(roomId).emit('unlock_route', {
          route: unlockedRoute,
          pins: unlockedRoute?.pins,
        });
      }
    }
  });

  /**
   * TODO: add_pin 事件 - 對應前端 SwipeDeck 的「Add」按鈕
   * 目前前端 Add 按鈕僅在本地把景點加入行程（等同右滑），尚未通知後端。
   * 若之後行程需要跨裝置同步，應在此接收 { pin, roomId }，
   * 並透過 roomManager 寫入房間共享行程後 emit 'pin_added' 廣播。
   */

  /**
   * TODO: share_pin 事件 / REST endpoint - 對應前端 SwipeDeck 的「Share」按鈕
   * 目前前端 Share 按鈕僅呼叫瀏覽器 Web Share API，沒有後端支援。
   * 若要提供短連結分享，應在此（或新增 REST route）接收 { pinId }，
   * 產生可分享的短連結或預覽圖後回傳給前端。
   */

  /**
   * disconnect 事件
   */
  socket.on('disconnect', () => {
    console.log(`❌ 客戶端已斷開連線: ${socket.id}`);
  });

  /**
   * error 事件處理
   */
  socket.on('error', (error) => {
    console.error(`⚠️ Socket 錯誤:`, error);
  });
});

/**
 * REST API 健康檢查
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/**
 * 啟動伺服器
 */
httpServer.listen(SERVER_CONFIG.PORT, () => {
  console.log(`🚀 Pinto 伺服器運行於 http://localhost:${SERVER_CONFIG.PORT}`);
  console.log(`📡 Socket.IO 已準備就緒`);
});
