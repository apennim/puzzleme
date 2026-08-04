/**
 * 房間管理服務
 */

import type { RoomState, RoomMember } from '../types/socket';

/**
 * 房間管理器
 */
export class RoomManager {
  private rooms: Map<string, RoomState> = new Map();

  /**
   * 建立房間
   */
  createRoom(roomId: string): RoomState {
    if (!this.rooms.has(roomId)) {
      const room: RoomState = {
        roomId,
        members: new Map(),
        votingPhase: false,
        votes: new Map(),
      };
      this.rooms.set(roomId, room);
    }
    return this.rooms.get(roomId)!;
  }

  /**
   * 取得房間
   */
  getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * 新增成員
   */
  addMember(roomId: string, member: RoomMember): void {
    const room = this.getRoom(roomId);
    if (room) {
      room.members.set(member.userId, member);
    }
  }

  /**
   * 移除成員
   */
  removeMember(roomId: string, userId: string): void {
    const room = this.getRoom(roomId);
    if (room) {
      room.members.delete(userId);
    }
  }

  /**
   * 取得房間成員數
   */
  getMemberCount(roomId: string): number {
    const room = this.getRoom(roomId);
    return room ? room.members.size : 0;
  }

  /**
   * 刪除房間
   */
  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }
}
