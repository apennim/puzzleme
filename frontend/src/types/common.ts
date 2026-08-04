/**
 * 公共類型定義
 */

/** 應用標籤頁類型 */
export type Tab = 'match' | 'map' | 'vote';

/** Pin 點資料結構 */
export interface Pin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  distance?: number;
  isSP?: boolean;
}

/** 卡片項目資料結構 */
export interface CardItem {
  id: string;
  title: string;
  image: string;
  lat: number;
  lng: number;
  description?: string;
  isSP?: boolean;
}

/** 路線資料結構 */
export interface Route {
  id: string;
  name: string;
  pins: Pin[];
  description: string;
}

/** 通知資料結構 */
export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}
