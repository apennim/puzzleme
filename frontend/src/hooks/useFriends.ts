import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface FriendEntry {
  userId: string;
  nickname: string;
}

export interface FriendRequest extends FriendEntry {
  /** 這筆關係在資料庫裡的方向鍵，回應／取消要用 */
  requesterId: string;
  addresseeId: string;
}

interface FriendshipRow {
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
}

/**
 * 好友關係：讀 Supabase 的 friendships 表，依 auth.uid() 分成「好友列表」
 * 「別人邀請我（incoming）」「我邀請別人（outgoing）」三組。
 * 加好友走「好友代碼」（profiles.friend_code），不開放搜尋所有暱稱，
 * 避免任何登入者可以隨意翻看別人的暱稱清單。
 */
export function useFriends(userId: string | null) {
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setFriends([]);
      setIncoming([]);
      setOutgoing([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: rows, error } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id, status')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    if (error) {
      console.error('讀取好友關係失敗', error);
      setLoading(false);
      return;
    }

    const relevant = (rows ?? []) as FriendshipRow[];
    const otherIds = Array.from(
      new Set(relevant.map((r) => (r.requester_id === userId ? r.addressee_id : r.requester_id)))
    );

    const nicknameOf = new Map<string, string>();
    if (otherIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, nickname')
        .in('id', otherIds);
      if (profileError) {
        console.error('讀取好友暱稱失敗', profileError);
      } else {
        for (const p of profiles ?? []) nicknameOf.set(p.id, p.nickname);
      }
    }

    const nextFriends: FriendEntry[] = [];
    const nextIncoming: FriendRequest[] = [];
    const nextOutgoing: FriendRequest[] = [];

    for (const row of relevant) {
      const otherId = row.requester_id === userId ? row.addressee_id : row.requester_id;
      const nickname = nicknameOf.get(otherId) ?? '（未知使用者）';
      if (row.status === 'accepted') {
        nextFriends.push({ userId: otherId, nickname });
      } else {
        const entry: FriendRequest = {
          userId: otherId,
          nickname,
          requesterId: row.requester_id,
          addresseeId: row.addressee_id,
        };
        if (row.addressee_id === userId) nextIncoming.push(entry);
        else nextOutgoing.push(entry);
      }
    }

    setFriends(nextFriends);
    setIncoming(nextIncoming);
    setOutgoing(nextOutgoing);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** 用好友代碼加人。回傳一句可以直接顯示的結果訊息（成功或失敗都是） */
  const sendRequest = useCallback(
    async (code: string): Promise<string> => {
      if (!userId) return '請先登入';
      const normalized = code.trim().toUpperCase();
      if (!normalized) return '請輸入好友代碼';

      const { data: target, error: findError } = await supabase
        .from('profiles')
        .select('id, nickname')
        .eq('friend_code', normalized)
        .maybeSingle();

      if (findError) {
        console.error('查詢好友代碼失敗', findError);
        return '查詢失敗，請稍後再試';
      }
      if (!target) return '找不到這組代碼，請確認拼字';
      if (target.id === userId) return '不能加自己好友';

      const { data: existing, error: existingError } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id, status')
        .or(
          `and(requester_id.eq.${userId},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${userId})`
        )
        .maybeSingle();

      if (existingError) {
        console.error('檢查好友關係失敗', existingError);
        return '查詢失敗，請稍後再試';
      }

      if (existing) {
        if (existing.status === 'accepted') return `你們已經是好友了`;
        if (existing.requester_id === userId) return '已經送出邀請，等對方接受';

        // 對方已經先邀請過我了：直接接受，體感比再送一次邀請更好
        const { error: acceptError } = await supabase
          .from('friendships')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('requester_id', existing.requester_id)
          .eq('addressee_id', existing.addressee_id);
        if (acceptError) {
          console.error('接受好友邀請失敗', acceptError);
          return '操作失敗，請稍後再試';
        }
        await refresh();
        return `對方已經邀請過你，現在你們是好友了！`;
      }

      const { error: insertError } = await supabase
        .from('friendships')
        .insert({ requester_id: userId, addressee_id: target.id });
      if (insertError) {
        console.error('送出好友邀請失敗', insertError);
        return '送出失敗，請稍後再試';
      }
      await refresh();
      return `已送出好友邀請給「${target.nickname}」`;
    },
    [userId, refresh]
  );

  const respondToRequest = useCallback(
    async (request: FriendRequest, accept: boolean) => {
      const query = accept
        ? supabase
            .from('friendships')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
        : supabase.from('friendships').delete();

      const { error } = await query
        .eq('requester_id', request.requesterId)
        .eq('addressee_id', request.addresseeId);

      if (error) {
        console.error('回應好友邀請失敗', error);
        alert('操作失敗，請稍後再試。');
        return;
      }
      await refresh();
    },
    [refresh]
  );

  const cancelRequest = useCallback(
    async (request: FriendRequest) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('requester_id', request.requesterId)
        .eq('addressee_id', request.addresseeId);
      if (error) {
        console.error('取消邀請失敗', error);
        alert('操作失敗，請稍後再試。');
        return;
      }
      await refresh();
    },
    [refresh]
  );

  const removeFriend = useCallback(
    async (friend: FriendEntry) => {
      if (!userId) return;
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(
          `and(requester_id.eq.${userId},addressee_id.eq.${friend.userId}),and(requester_id.eq.${friend.userId},addressee_id.eq.${userId})`
        );
      if (error) {
        console.error('刪除好友失敗', error);
        alert('操作失敗，請稍後再試。');
        return;
      }
      await refresh();
    },
    [userId, refresh]
  );

  return { friends, incoming, outgoing, loading, sendRequest, respondToRequest, cancelRequest, removeFriend };
}
