import { useState } from 'react';

const KEY = 'pintu-favorites';

export interface FavoriteCard {
  id: string;
  title: string;
  image: string;
  description?: string;
  address?: string;
  tags?: string[];
  lat: number;
  lng: number;
  savedAt: number;
}

function readFavorites(): FavoriteCard[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FavoriteCard[]) : [];
  } catch {
    return [];
  }
}

/** 滑卡右滑收藏的景點，存在瀏覽器 localStorage，最新收藏排最前面 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteCard[]>(() => readFavorites());

  const addFavorite = (card: Omit<FavoriteCard, 'savedAt'>) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === card.id)) return prev;
      const next = [{ ...card, savedAt: Date.now() }, ...prev];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // localStorage 空間不足時，僅維持記憶體內狀態
      }
      return next;
    });
  };

  return { favorites, addFavorite };
}
