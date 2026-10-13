import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/**
 * 登入畫面的「Gmail/電話 + 密碼」→ Supabase Auth 帳號。
 *
 * - 帳號不存在：用 secret key 建立（email_confirm: true，不寄驗證信），並寫一筆 profile_leads 留資
 * - 帳號已存在：什麼都不改（不會用新密碼覆蓋舊密碼），交給前端 signInWithPassword 驗證密碼
 *
 * 回傳登入用的 email。電話號碼沒有 email，所以換算成一個固定的內部 email，
 * 同一支電話不管怎麼輸入（有無 -、+886）都會對到同一個帳號。
 */
function toAuthEmail(contact: string): string | null {
  const trimmed = contact.trim().toLowerCase();
  if (trimmed.includes('@')) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? trimmed : null;
  }
  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('886')) digits = `0${digits.slice(3)}`;
  return digits.length >= 8 ? `phone-${digits}@phone.puzzleme.local` : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { nickname, contact, password } = (req.body ?? {}) as {
    nickname?: string;
    contact?: string;
    password?: string;
  };

  if (!nickname?.trim() || !contact?.trim() || !password) {
    res.status(400).json({ error: '請輸入暱稱、Gmail 或電話號碼，以及密碼' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: '密碼至少需要 6 個字元' });
    return;
  }

  const email = toAuthEmail(contact);
  if (!email) {
    res.status(400).json({ error: 'Gmail 或電話號碼格式不正確' });
    return;
  }

  const url = process.env.VITE_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    console.error('缺少 VITE_SUPABASE_URL 或 SUPABASE_SECRET_KEY 環境變數');
    res.status(500).json({ error: '伺服器設定不完整' });
    return;
  }

  // 用 secret key 走伺服器端，才能建立「免信箱驗證」的帳號、寫入 profile_leads
  const supabaseAdmin = createClient(url, secretKey, { auth: { persistSession: false } });

  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.code === 'email_exists' || /already been registered/i.test(createError.message)) {
      res.status(200).json({ email, created: false });
      return;
    }
    console.error('建立帳號失敗', createError);
    res.status(500).json({ error: '建立帳號失敗，請稍後再試一次' });
    return;
  }

  // 只有第一次建立帳號才留資，避免同一個人每次登入都多一筆
  const { error: leadError } = await supabaseAdmin.from('profile_leads').insert({
    nickname: nickname.trim(),
    contact: contact.trim(),
  });
  if (leadError) {
    // 留資失敗不影響登入，只記錄下來
    console.error('寫入 profile_leads 失敗', leadError);
  }

  res.status(200).json({ email, created: true });
}
