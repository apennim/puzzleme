import { useEffect, useState } from 'react';

const PREFIX = 'pintu-image:';

function readStored(key: string): string {
  try {
    return localStorage.getItem(PREFIX + key) ?? '';
  } catch {
    return '';
  }
}

/** 圖片以 data URL 存在瀏覽器 localStorage，重新整理後仍保留使用者上傳的照片 */
export function useLocalImage(key: string) {
  const [value, setValue] = useState<string>(() => readStored(key));

  useEffect(() => {
    setValue(readStored(key));
  }, [key]);

  const update = (next: string) => {
    setValue(next);
    try {
      if (next) {
        localStorage.setItem(PREFIX + key, next);
      } else {
        localStorage.removeItem(PREFIX + key);
      }
    } catch {
      // localStorage 空間不足或被封鎖時，僅維持記憶體內狀態
    }
  };

  return [value, update] as const;
}
