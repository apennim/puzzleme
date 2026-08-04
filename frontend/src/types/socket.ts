/**
 * Socket.IO 事件類型定義
 */

import type { Pin, Route } from './common';

/** Socket.IO 事件映射 */
export interface SocketEventMap {
  'join_room': {
    userId: string;
    roomId: string;
  };
  'submit_theme': {
    theme: string;
    userId: string;
  };
  'vote_route': {
    routeId: string;
    userId: string;
  };
  'update_vote_count': {
    votes: Record<string, number>;
    totalMembers: number;
  };
  'unlock_route': {
    routes: Route[];
    pins: Pin[];
  };
  'error': {
    code: string;
    message: string;
  };
}

/** 房間狀態 */
export interface RoomState {
  roomId: string;
  members: string[];
  selectedTheme?: string;
  votingPhase: boolean;
  votes: Record<string, number>;
  unlockedRoute?: Route;
}
