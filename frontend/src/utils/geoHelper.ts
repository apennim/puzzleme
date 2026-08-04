/**
 * 地理空間計算工具函數（Turf.js 封裝）
 */

// @ts-ignore
import * as turf from '@turf/turf';
import type { GeoCoord, LatLng, GeofenceResult } from '../types/map';
import { LOCATIONS, GEOFENCE_BUFFER_METERS } from './constants';

/**
 * 計算兩點之間的距離（公里）
 * @param point1 起點 [經度, 緯度]
 * @param point2 終點 [經度, 緯度]
 * @returns 距離（公里）
 */
export function calculateDistance(point1: GeoCoord, point2: GeoCoord): number {
  return turf.distance(point1, point2);
}

/**
 * 計算距離（公尺）
 */
export function calculateDistanceMeters(point1: GeoCoord, point2: GeoCoord): number {
  return turf.distance(point1, point2, { units: 'meters' });
}

/**
 * 檢測點是否在 SP 據點的地理圍欄內
 * @param point 檢測點 [經度, 緯度]
 * @returns 地理圍欄檢測結果
 */
export function checkSPGeofence(point: GeoCoord): GeofenceResult {
  const spPoint = turf.point([LOCATIONS.SP.lng, LOCATIONS.SP.lat]);
  const testPoint = turf.point(point);

  const distance = turf.distance(spPoint, testPoint, { units: 'meters' });
  const isSP = distance <= GEOFENCE_BUFFER_METERS;

  return {
    isSP,
    distance,
    message: isSP
      ? `偵測到鄰近 SP 據點：${LOCATIONS.SP.name}，加入行程可解鎖稀有碎片！`
      : `距離 ${LOCATIONS.SP.name} ${Math.round(distance)} 公尺`,
  };
}

/**
 * 建立地理圍欄 Buffer（多邊形）
 * @param center 中心點 [經度, 緯度]
 * @param radiusKm 半徑（公里）
 * @returns Turf 多邊形物件
 */
export function createBuffer(center: GeoCoord, radiusKm: number) {
  const point = turf.point(center);
  return turf.buffer(point, radiusKm, { units: 'kilometers' });
}

/**
 * 將 LatLng 格式轉換為 GeoCoord 格式
 */
export function latLngToGeoCoord(latLng: LatLng): GeoCoord {
  return [latLng.lng, latLng.lat];
}

/**
 * 將 GeoCoord 格式轉換為 LatLng 格式
 */
export function geoCoordToLatLng(coord: GeoCoord): LatLng {
  return { lat: coord[1], lng: coord[0] };
}
