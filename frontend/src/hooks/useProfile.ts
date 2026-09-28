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
 *
 * 同時會生成一組「好友代碼」（friend_code），給 useFriends 用來加好友——
 * 暱稱可能重複，代碼不會。
 */
export interface Profile {
  userId: string | null;
  nickname: string;
  friendCode: string | null;
  hasIdentity: boolean;
  /** 剛載入、還在確認有沒有既有 session 時為 true，避免閃一下登入畫面 */
  loading: boolean;
  /** 登入畫面送出暱稱時呼叫：沒有帳號就先匿名建立一個，再把暱稱存進 profiles */
  setNickname: (nickname: string) => Promise<void>;
}

// 排除容易看錯/打錯的字元（0/O、1/I/L），方便當面唸出來或手動輸入
const FRIEND_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateFriendCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += FRIEND_CODE_ALPHABET[Math.floor(Math.random() * FRIEND_CODE_ALPHABET.length)];
  }
  return code;
}

/** 產生代碼並存進 profiles.friend_code；萬一撞號（unique 衝突）就重試幾次 */
async function ensureFriendCode(userId: string): Promise<string | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateFriendCode();
    const { error } = await supabase.from('profiles').update({ friend_code: code }).eq('id', userId);
    if (!error) return code;
    if (error.code !== '23505') {
      // 不是「代碼撞號」的錯誤，不用重試
      console.error('產生好友代碼失敗', error);
      return null;
    }
  }
  console.error('產生好友代碼失敗：重試多次仍撞號');
  return null;
}

export function useProfile(): Profile {
  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNicknameState] = useState('');
  const [friendCode, setFriendCode] = useState<string | null>(null);
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
          .select('nickname, friend_code')
          .eq('id', user.id)
          .maybeSingle();
        if (profileError) {
          console.error('讀取個人資料失敗', profileError);
        } else if (profile && !cancelled) {
          if (profile.nickname) setNicknameState(profile.nickname);
          if (profile.friend_code) {
            setFriendCode(profile.friend_code);
          } else {
            // 舊帳號在加好友代碼欄位之前就建立過，這裡補生成一組
            const code = await ensureFriendCode(user.id);
            if (!cancelled && code) setFriendCode(code);
          }
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

    const { data: saved, error: upsertError } = await supabase
      .from('profiles')
      .upsert({ id: uid, nickname: trimmed }, { onConflict: 'id' })
      .select('friend_code')
      .single();
    if (upsertError) {
      throw upsertError;
    }
    setNicknameState(trimmed);

    // 只有還沒有代碼（第一次建立帳號）才生成，避免之後改暱稱時不小心洗掉舊代碼
    if (saved?.friend_code) {
      setFriendCode(saved.friend_code);
    } else {
      const code = await ensureFriendCode(uid);
      if (code) setFriendCode(code);
    }
  };

  return { userId, nickname, friendCode, hasIdentity: !!nickname, loading, setNickname };
}
