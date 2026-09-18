/**
 * Google Street View Static API 整合。
 *
 * 只有在設定 VITE_GOOGLE_STREETVIEW_KEY 時才會啟用；沒設定的話所有函式
 * 都直接回傳「沒有街景可用」，呼叫端會照舊使用 cardData.json 裡策展好的
 * 真實照片，不影響現有行為。
 *
 * 費用：
 * - metadata 端點（查某座標有沒有街景）完全免費、不計入配額，可以放心大量查。
 * - 實際圖片請求才計費，Google 帳號每月有免費額度，詳見 docs/DEPLOY.md。
 */

const KEY = import.meta.env.VITE_GOOGLE_STREETVIEW_KEY as string | undefined;

export function isStreetViewEnabled(): boolean {
  return Boolean(KEY);
}

export function streetViewImageUrl(
  lat: number,
  lng: number,
  opts?: { size?: string; fov?: number }
): string {
  const params = new URLSearchParams({
    size: opts?.size ?? '640x480',
    location: `${lat},${lng}`,
    fov: String(opts?.fov ?? 80),
    key: KEY ?? '',
  });
  return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
}

// 座標 → 是否有街景涵蓋，查過的結果快取起來（同一輪滑卡、甚至重新整理後的
// 記憶體快取），避免重複打 metadata API。
const coverageCache = new Map<string, boolean>();

async function hasStreetViewCoverage(lat: number, lng: number): Promise<boolean> {
  if (!KEY) return false;
  const cacheKey = `${lat},${lng}`;
  const cached = coverageCache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const params = new URLSearchParams({ location: cacheKey, key: KEY });
    const res = await fetch(`https://maps.googleapis.com/maps/api/streetview/metadata?${params.toString()}`);
    const data = await res.json();
    const ok = data.status === 'OK';
    coverageCache.set(cacheKey, ok);
    return ok;
  } catch {
    // 網路異常時不快取，下次再試
    return false;
  }
}

/** 有街景就回傳圖片網址，沒有（或沒設 key）回傳 null，呼叫端 fallback 回原本的照片 */
export async function resolveStreetViewImage(lat: number, lng: number): Promise<string | null> {
  if (!isStreetViewEnabled()) return null;
  const covered = await hasStreetViewCoverage(lat, lng);
  return covered ? streetViewImageUrl(lat, lng) : null;
}
