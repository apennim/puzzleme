/**
 * 全域常量與配置
 */

import type { Pin } from '../types/common';

/** 特殊位置坐標（台北大稻埕、中山區） */
export const LOCATIONS = {
  SP: {
    name: '幻猻家珈琲',
    lat: 25.0541,
    lng: 121.5097,
    description: '特色咖啡館',
  },
  START: {
    name: '北風社',
    lat: 25.0552,
    lng: 121.5201,
    description: '起點',
  },
  END: {
    name: '大稻埕碼頭',
    lat: 25.0563,
    lng: 121.5076,
    description: '終點',
  },
};

/** 地理圍欄距離（公尺） */
export const GEOFENCE_BUFFER_METERS = 300;

/** 抵達終點距離閾值（公尺） */
export const ARRIVAL_THRESHOLD_METERS = 50;

/** 地圖預設縮放級別 */
export const MAP_DEFAULT_ZOOM = 15;

/** 地圖中心座標（大稻埕） */
export const MAP_CENTER: [number, number] = [25.0552, 121.5130];
