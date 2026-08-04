/**
 * 地理圍欄檢測 Custom Hook
 * 檢測點位是否接近 SP 據點
 */

import { useMemo } from 'react';
import type { Pin } from '../types/common';
import type { GeoCoord } from '../types/map';
import { checkSPGeofence, latLngToGeoCoord } from '../utils/geoHelper';

interface UseGeofenceReturn {
  result: ReturnType<typeof checkSPGeofence>;
  isSP: boolean;
  distance: number;
  message: string;
}

/**
 * Hook: 地理圍欄檢測
 * @param pin Pin 點資料
 * @returns 檢測結果
 */
export function useGeofence(pin: Pin | null): UseGeofenceReturn {
  const result = useMemo(() => {
    if (!pin) {
      return { isSP: false, distance: Infinity, message: '' };
    }
    const coord = latLngToGeoCoord({ lat: pin.lat, lng: pin.lng }) as GeoCoord;
    return checkSPGeofence(coord);
  }, [pin]);

  return {
    result,
    isSP: result.isSP,
    distance: result.distance,
    message: result.message,
  };
}
