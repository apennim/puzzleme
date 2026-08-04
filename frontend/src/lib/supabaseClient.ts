import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn('缺少 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，行程貼文與留資表單將無法寫入雲端資料庫。');
}

// createClient 會在網址為空字串時直接 throw，改用一個語法合法但打不通的假網址，
// 讓沒設定環境變數時整個 App 仍能載入，只有實際呼叫 Supabase 時才會失敗（並被個別 try/catch 攔下）。
export const supabase = createClient(url || 'https://missing-supabase-config.invalid', anonKey || 'missing-anon-key');

export const TRIP_MEDIA_BUCKET = 'trip-media';
