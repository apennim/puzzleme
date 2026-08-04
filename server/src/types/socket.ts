/**
 * Socket.IO 事件類型定義（後端）
 */

import type { Pin, Route } from './common';

export interface SocketEvents {
  'join_room': (data: { userId: string; roomId: string }) => void;
  'submit_theme': (data: { theme: string; userId: string }) => void;
  'vote_route': (data: { routeId: string; userId: string }) => void;
  'update_vote_count': (data: {
    votes: Record<string, number>;
    totalMembers: number;
  }) => void;
  'unlock_route': (data: { routes: Route[]; pins: Pin[] }) => void;
  'error': (data: { code: string; message: string }) => void;
}

/** 房間參與者 */
export interface RoomMember {
  userId: string;
  socketId: string;
  vote?: string;
}

/** 房間狀態 */
export interface RoomState {
  roomId: string;
  members: Map<string, RoomMember>;
  selectedTheme?: string;
  votingPhase: boolean;
  votes: Map<string, number>;
  unlockedRoute?: Route;
}
