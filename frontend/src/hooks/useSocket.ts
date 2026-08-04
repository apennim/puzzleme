/**
 * Socket.IO 連線 Custom Hook
 * 管理 Socket.IO 客戶端連線與事件
 */

import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SOCKET_SERVER_URL } from '../utils/constants';
import type { SocketEventMap } from '../types/socket';

interface UseSocketReturn {
  isConnected: boolean;
  emit: <K extends keyof SocketEventMap>(event: K, data: SocketEventMap[K]) => void;
  on: <K extends keyof SocketEventMap>(
    event: K,
    callback: (data: SocketEventMap[K]) => void
  ) => void;
  off: <K extends keyof SocketEventMap>(event: K) => void;
  socket: Socket | null;
}

/**
 * Hook: Socket.IO 連線管理
 * @returns Socket 狀態和操作方法
 */
export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const isConnected = socketRef.current?.connected || false;

  useEffect(() => {
    // 建立連線
    socketRef.current = io(SOCKET_SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current.on('connect', () => {
      console.log('✅ Socket.IO 已連線');
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ Socket.IO 已斷開連線');
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const emit = useCallback(
    <K extends keyof SocketEventMap>(event: K, data: SocketEventMap[K]) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(event, data);
      } else {
        console.warn(`⚠️ Socket 未連線，無法發送 ${String(event)}`);
      }
    },
    []
  );

  const on = useCallback(<K extends keyof SocketEventMap>(
    event: K,
    callback: (data: SocketEventMap[K]) => void
  ) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback as any);
    }
  }, []);

  const off = useCallback(<K extends keyof SocketEventMap>(event: K) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  }, []);

  return {
    isConnected,
    emit,
    on,
    off,
    socket: socketRef.current,
  };
}
