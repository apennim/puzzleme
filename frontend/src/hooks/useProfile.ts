import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * 使用者身分：底層是 Supabase Auth 的「匿名登入」（signInAnonymously），
 * 取代原本 useDeviceId 的假裝置 ID。使用者體感完全不變（一樣只要打暱稱），
 * 但背後拿到的是真正的 auth.uid()，之後加好友、留言等功能都能直接用
 * RLS 的 auth.uid() 判斷權限，不用再繞去伺服器端函式。
 *
 * 沿用同一支瀏覽器時，Supabase 的 session 會存在 localStorage，重新整理
 * 也不用重新輸入暱稱；換裝置／清瀏覽器資料則跟以前一樣要重新輸入一次。
 */
export interface Profile {
  userId: string | null;
  nickname: string;
  hasIdentity: boolean;
  /** 剛載入、還在確認有沒有既有 session 時為 true，避免閃一下登入畫面 */
  loading: boolean;
  /** 登入畫面送出暱稱時呼叫：沒有帳號就先匿名建立一個，再把暱稱存進 profiles */
  setNickname: (nickname: string) => Promise<void>;
}

export function useProfile(): Profile {
  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNicknameState] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('讀取登入狀態失敗', error);
      }
      const user = data?.session?.user;
      if (user && !cancelled) {
        setUserId(user.id);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', user.id)
          .maybeSingle();
        if (profileError) {
          console.error('讀取個人資料失敗', profileError);
        } else if (profile?.nickname && !cancelled) {
          setNicknameState(profile.nickname);
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setNickname = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    let uid = userId;
    if (!uid) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) {
        throw error ?? new Error('匿名登入失敗');
      }
      uid = data.user.id;
      setUserId(uid);
    }

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: uid, nickname: trimmed }, { onConflict: 'id' });
    if (upsertError) {
      throw upsertError;
    }

    setNicknameState(trimmed);
  };

  return { userId, nickname, hasIdentity: !!nickname, loading, setNickname };
}
