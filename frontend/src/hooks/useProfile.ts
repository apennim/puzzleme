import { useSyncExternalStore } from 'react';
import { supabase, TRIP_MEDIA_BUCKET } from '../lib/supabaseClient';

/**
 * 使用者身分＋個人資料，底層是 Supabase Auth 的「帳號密碼登入」。
 *
 * 登入畫面輸入的「Gmail/電話 + 密碼」就是帳號：先打 /api/account（伺服器端用
 * secret key 建立帳號，已存在就略過），再用 signInWithPassword 登入。同一組帳密
 * 不管換瀏覽器、清資料、換裝置，都會回到同一個 auth.uid()，個人資料也就跟著回來。
 *
 * 個人資料頁的頭像、名字、狀態都存在 profiles 表（頭像傳到 Storage），
 * 不再存瀏覽器 localStorage。
 *
 * 這裡用「模組層級的 store + useSyncExternalStore」，讓 App、個人資料頁、首頁、
 * 發文視窗共用同一份資料：在個人資料頁換頭像，其他畫面會同步更新。
 *
 * 舊版用匿名登入（signInAnonymously）建立的帳號仍然可以繼續用，只是登出後就找不回來。
 */
export interface LoginInput {
  nickname: string;
  contact: string;
  password: string;
}

interface ProfileState {
  userId: string | null;
  nickname: string;
  friendCode: string | null;
  avatarUrl: string;
  status: string;
  /** 所在地點（縣市）；空字串代表還沒填完「建立個人資料」頁 */
  location: string;
  /** 剛載入、還在確認有沒有既有 session 時為 true，避免閃一下登入畫面 */
  loading: boolean;
}

export interface Profile extends ProfileState {
  hasIdentity: boolean;
  /** 登入畫面送出時呼叫：帳號不存在就建立，存在就用密碼登入 */
  signIn: (input: LoginInput) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (patch: Partial<Pick<ProfileState, 'nickname' | 'status' | 'location'>>) => Promise<boolean>;
  /** 傳入 EditableImage 給的 data URL，上傳到 Storage 後存成頭像 */
  setAvatar: (dataUrl: string) => Promise<void>;
}

const EMPTY_STATE: ProfileState = {
  userId: null,
  nickname: '',
  friendCode: null,
  avatarUrl: '',
  status: '',
  location: '',
  loading: true,
};

let state: ProfileState = EMPTY_STATE;
const listeners = new Set<() => void>();

function setState(patch: Partial<ProfileState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
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

interface ProfileRow {
  nickname: string | null;
  friend_code: string | null;
  avatar_url: string | null;
  status: string | null;
  location: string | null;
}

/** 讀取 profiles 那一筆；沒有資料（新帳號）就用 fallbackNickname 建一筆 */
async function loadProfile(userId: string, fallbackNickname?: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('nickname, friend_code, avatar_url, status, location')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;

  let row = data as ProfileRow | null;
  if (!row && fallbackNickname) {
    const { data: created, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: userId, nickname: fallbackNickname })
      .select('nickname, friend_code, avatar_url, status, location')
      .single();
    if (insertError) throw insertError;
    row = created as ProfileRow;
  }

  setState({
    userId,
    nickname: row?.nickname ?? '',
    friendCode: row?.friend_code ?? null,
    avatarUrl: row?.avatar_url ?? '',
    status: row?.status ?? '',
    location: row?.location ?? '',
  });

  // 舊帳號在加好友代碼欄位之前就建立過、或剛建立的新帳號，這裡補生成一組
  if (row && !row.friend_code) {
    const code = await ensureFriendCode(userId);
    if (code) setState({ friendCode: code });
  }
}

let initStarted = false;

/** 只在第一次有元件使用時執行：沿用瀏覽器裡既有的 session，不用重新登入 */
function init() {
  if (initStarted) return;
  initStarted = true;
  (async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error('讀取登入狀態失敗', error);
      const user = data?.session?.user;
      if (user) await loadProfile(user.id);
    } catch (err) {
      console.error('讀取個人資料失敗', err);
    } finally {
      setState({ loading: false });
    }
  })();
}

async function signIn({ nickname, contact, password }: LoginInput) {
  const res = await fetch('/api/account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, contact, password }),
  });
  const body = (await res.json().catch(() => ({}))) as { email?: string; error?: string };
  if (!res.ok || !body.email) {
    throw new Error(body.error ?? '登入失敗，請檢查網路連線後再試一次。');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email: body.email, password });
  if (error || !data.user) {
    if (error?.code === 'invalid_credentials') {
      throw new Error('密碼錯誤：這個 Gmail／電話已經註冊過，請輸入當初設定的密碼。');
    }
    throw error ?? new Error('登入失敗');
  }

  // 既有帳號沿用雲端上的暱稱與個人資料，暱稱欄位只在第一次建立帳號時使用
  await loadProfile(data.user.id, nickname);
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('登出失敗', error);
  setState({ ...EMPTY_STATE, loading: false });
}

/** 回傳是否儲存成功，讓「建立個人資料」頁可以決定要不要進入 App */
async function saveColumns(columns: Record<string, unknown>): Promise<boolean> {
  if (!state.userId) return false;
  const { error } = await supabase
    .from('profiles')
    .update({ ...columns, updated_at: new Date().toISOString() })
    .eq('id', state.userId);
  if (error) {
    console.error('儲存個人資料失敗', error);
    alert('個人資料儲存失敗，請檢查網路連線後再試一次。');
    return false;
  }
  return true;
}

async function updateProfile(patch: Partial<Pick<ProfileState, 'nickname' | 'status' | 'location'>>): Promise<boolean> {
  const columns: Record<string, unknown> = {};
  if (patch.nickname !== undefined) {
    const trimmed = patch.nickname.trim();
    // 暱稱是必填欄位（發文、加好友都會顯示），清空時維持原本的
    if (trimmed && trimmed !== state.nickname) {
      columns.nickname = trimmed;
      setState({ nickname: trimmed });
    }
  }
  if (patch.status !== undefined) {
    columns.status = patch.status.trim();
    setState({ status: patch.status.trim() });
  }
  if (patch.location !== undefined) columns.location = patch.location;
  if (Object.keys(columns).length === 0) return true;
  const ok = await saveColumns(columns);
  // 地點決定要不要顯示「建立個人資料」頁，所以等雲端存好才更新，避免存失敗卻已進入 App
  if (ok && patch.location !== undefined) setState({ location: patch.location });
  return ok;
}

/** data URL → 上傳到 trip-media bucket 的 profiles/<uid>/ 底下，回傳公開網址 */
async function uploadImage(dataUrl: string, name: string): Promise<string | null> {
  if (!state.userId) return null;
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type.split('/')[1] || 'jpg';
  const path = `profiles/${state.userId}/${name}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(TRIP_MEDIA_BUCKET).upload(path, blob, { contentType: blob.type });
  if (error) {
    console.error('照片上傳失敗', error);
    alert('照片上傳失敗，請檢查網路連線後再試一次。');
    return null;
  }
  return supabase.storage.from(TRIP_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

async function setAvatar(dataUrl: string) {
  const previous = state.avatarUrl;
  setState({ avatarUrl: dataUrl }); // 先顯示預覽，上傳完再換成雲端網址
  const url = await uploadImage(dataUrl, 'avatar');
  if (!url) {
    setState({ avatarUrl: previous });
    return;
  }
  setState({ avatarUrl: url });
  await saveColumns({ avatar_url: url });
}

export function useProfile(): Profile {
  init();
  const snapshot = useSyncExternalStore(subscribe, () => state);
  return {
    ...snapshot,
    hasIdentity: !!snapshot.nickname,
    signIn,
    signOut,
    updateProfile,
    setAvatar,
  };
}
