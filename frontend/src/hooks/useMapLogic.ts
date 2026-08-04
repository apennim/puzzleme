/**
 * 地圖邏輯 Custom Hook
 * 管理 Pin 點、路線、地理圍欄檢測
 */

import { useState, useCallback } from 'react';
import type { Pin } from '../types/common';

interface UseMapLogicReturn {
  pins: Pin[];
  addPin: (pin: Pin) => void;
  removePin: (id: string) => void;
  updatePin: (id: string, updates: Partial<Pin>) => void;
  clearPins: () => void;
}

/**
 * Hook: 地圖邏輯管理
 * @returns 地圖狀態和操作方法
 */
export function useMapLogic(): UseMapLogicReturn {
  const [pins, setPins] = useState<Pin[]>([]);

  const addPin = useCallback((pin: Pin) => {
    setPins((prev) => [...prev, pin]);
  }, []);

  const removePin = useCallback((id: string) => {
    setPins((prev) => prev.filter((pin) => pin.id !== id));
  }, []);

  const updatePin = useCallback((id: string, updates: Partial<Pin>) => {
    setPins((prev) =>
      prev.map((pin) => (pin.id === id ? { ...pin, ...updates } : pin))
    );
  }, []);

  const clearPins = useCallback(() => {
    setPins([]);
  }, []);

  return { pins, addPin, removePin, updatePin, clearPins };
}
