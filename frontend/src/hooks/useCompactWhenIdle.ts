import { useEffect, useState } from 'react';

/** 停止滑動多久之後算「停下來」 */
const IDLE_MS = 600;

/**
 * 頁面停止滑動時回傳 true（工具列縮小），滑動中回傳 false（工具列恢復原本大小）。
 * 只有手機寬度才會套用縮小的樣式（見 styles.css 的 @media (max-width: 720px)），
 * 電腦版雖然也會切換這個值，但畫面不會變。
 */
export function useCompactWhenIdle(): boolean {
  const [compact, setCompact] = useState(true);

  useEffect(() => {
    let timer: number | undefined;
    const handleScroll = () => {
      setCompact(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setCompact(true), IDLE_MS);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.clearTimeout(timer);
    };
  }, []);

  return compact;
}
