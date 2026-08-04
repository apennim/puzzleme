/**
 * 地圖相關類型定義
 */

import type { Pin } from './common';

/** Leaflet 座標格式 */
export interface LatLng {
  lat: number;
  lng: number;
}

/** Turf 座標格式（[經度, 緯度]） */
export type GeoCoord = [number, number];

/** 地理圍欄檢測結果 */
export interface GeofenceResult {
  isSP: boolean;
  distance: number;
  message: string;
}

/** 地圖繪製配置 */
export interface MapDrawOptions {
  markerColor?: string;
  polylineColor?: string;
  polylineWeight?: number;
  bufferColor?: string;
}
