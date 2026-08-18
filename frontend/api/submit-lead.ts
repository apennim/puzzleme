import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { nickname, contact } = (req.body ?? {}) as { nickname?: string; contact?: string };

  if (!nickname?.trim() || !contact?.trim()) {
    res.status(400).json({ error: '缺少暱稱或聯絡方式' });
    return;
  }

  const url = process.env.VITE_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    console.error('缺少 VITE_SUPABASE_URL 或 SUPABASE_SECRET_KEY 環境變數');
    res.status(500).json({ error: '伺服器設定不完整' });
    return;
  }

  // 用 secret key 走伺服器端寫入，繞過前端 anon key 的 RLS 限制
  const supabaseAdmin = createClient(url, secretKey);

  const { error } = await supabaseAdmin.from('profile_leads').insert({
    nickname: nickname.trim(),
    contact: contact.trim(),
  });

  if (error) {
    console.error('寫入 profile_leads 失敗', error);
    res.status(500).json({ error: '寫入失敗' });
    return;
  }

  res.status(200).json({ ok: true });
}
