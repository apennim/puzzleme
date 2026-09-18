import { useEffect, useState } from 'react';
import { isStreetViewEnabled, resolveStreetViewImage } from '../lib/streetView';
import type { SwipeCardData } from '../components/SwipeDeck';

interface CardPhoto {
  src: string;
  credit?: string;
}

/**
 * 卡片要顯示的照片：預設用 cardData.json 裡策展好的真實照片；
 * 如果有設定 VITE_GOOGLE_STREETVIEW_KEY，會非同步查該座標是否有 Google 街景，
 * 有的話換成街景（更精準的實景），沒有就維持原本的照片，不會出現破圖或空白。
 */
export function useCardPhoto(card: SwipeCardData | undefined): CardPhoto {
  const [photo, setPhoto] = useState<CardPhoto>({ src: card?.image ?? '', credit: card?.photoCredit });

  useEffect(() => {
    if (!card) {
      setPhoto({ src: '', credit: undefined });
      return;
    }

    // 先立刻顯示策展照片，街景查詢是漸進增強
    setPhoto({ src: card.image, credit: card.photoCredit });

    if (!isStreetViewEnabled()) return;

    let cancelled = false;
    resolveStreetViewImage(card.lat, card.lng).then((url) => {
      if (!cancelled && url) {
        setPhoto({ src: url, credit: '© Google 街景（實際店面景觀）' });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [card?.id, card?.lat, card?.lng, card?.image, card?.photoCredit]);

  return photo;
}
