import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { FavoriteCard } from './useFavorites';

export type TripMemberStatus = 'invited' | 'joined' | 'declined';

export interface TripPerson {
  userId: string;
  nickname: string;
  avatarUrl: string;
}

export interface TripMember extends TripPerson {
  status: TripMemberStatus;
}

export interface Trip {
  id: string;
  organizer: TripPerson;
  placeTitle: string;
  placeAddress: string;
  placeImage: string;
  placeTags: string[];
  placeLat: number | null;
  placeLng: number | null;
  members: TripMember[];
  /** 目前登入者在這個行程裡的身分 */
  myRole: 'organizer' | TripMemberStatus;
  createdAt: number;
}

interface TripRow {
  id: string;
  organizer_id: string;
  place_title: string;
  place_address: string | null;
  place_image: string | null;
  place_tags: string[] | null;
  place_lat: number | null;
  place_lng: number | null;
  created_at: string;
  trip_members: { user_id: string; status: TripMemberStatus }[] | null;
}

interface ProfileRow {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
}

/**
 * 發起行程：把收藏的景點複製一份存進 trips，再替每位被邀請的好友建一筆 trip_members（狀態 invited）。
 * 回傳一句可以直接顯示的結果訊息。
 */
export async function createTrip(place: FavoriteCard, friendIds: string[]): Promise<{ ok: boolean; message: string }> {
  if (friendIds.length === 0) return { ok: false, message: '請至少選一位好友' };

  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      place_title: place.title,
      place_address: place.address ?? '',
      place_image: place.image,
      place_tags: place.tags ?? [],
      place_lat: place.lat,
      place_lng: place.lng,
    })
    .select('id')
    .single();

  if (error || !trip) {
    console.error('建立行程失敗', error);
    return { ok: false, message: '建立行程失敗，請確認已執行最新的資料庫設定（docs/supabase-schema.sql）。' };
  }

  const { error: memberError } = await supabase
    .from('trip_members')
    .insert(friendIds.map((userId) => ({ trip_id: trip.id, user_id: userId })));

  if (memberError) {
    console.error('邀請好友失敗', memberError);
    // 邀請失敗就把空行程刪掉，避免留下沒人能看到的行程
    await supabase.from('trips').delete().eq('id', trip.id);
    return { ok: false, message: '邀請好友失敗，請稍後再試。' };
  }

  return { ok: true, message: `已送出行程邀請給 ${friendIds.length} 位好友！` };
}

/**
 * 讀取「我發起的」和「我被邀請的」行程。RLS 只會回傳跟自己有關的行程，所以直接 select 全部即可。
 * 成員的暱稱、頭像另外從 profiles 查一次。
 */
export function useTrips(userId: string | null) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setTrips([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('trips')
      .select('*, trip_members(user_id, status)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('讀取行程失敗', error);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as TripRow[];
    const personIds = Array.from(
      new Set(rows.flatMap((r) => [r.organizer_id, ...(r.trip_members ?? []).map((m) => m.user_id)])),
    );

    const people = new Map<string, TripPerson>();
    if (personIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .in('id', personIds);
      if (profileError) console.error('讀取成員資料失敗', profileError);
      for (const p of (profiles ?? []) as ProfileRow[]) {
        people.set(p.id, { userId: p.id, nickname: p.nickname ?? '', avatarUrl: p.avatar_url ?? '' });
      }
    }
    const personOf = (id: string): TripPerson => people.get(id) ?? { userId: id, nickname: '（未知使用者）', avatarUrl: '' };

    setTrips(
      rows.map((r) => {
        const members = (r.trip_members ?? []).map((m) => ({ ...personOf(m.user_id), status: m.status }));
        const mine = members.find((m) => m.userId === userId);
        return {
          id: r.id,
          organizer: personOf(r.organizer_id),
          placeTitle: r.place_title,
          placeAddress: r.place_address ?? '',
          placeImage: r.place_image ?? '',
          placeTags: r.place_tags ?? [],
          placeLat: r.place_lat,
          placeLng: r.place_lng,
          members,
          myRole: r.organizer_id === userId ? 'organizer' : (mine?.status ?? 'invited'),
          createdAt: new Date(r.created_at).getTime(),
        };
      }),
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** 被邀請的人按 Join!（join = true）或 ✕（join = false） */
  const respond = useCallback(
    async (tripId: string, join: boolean): Promise<boolean> => {
      if (!userId) return false;
      const { data, error } = await supabase
        .from('trip_members')
        .update({ status: join ? 'joined' : 'declined', updated_at: new Date().toISOString() })
        .eq('trip_id', tripId)
        .eq('user_id', userId)
        .select();
      if (error || !data?.length) {
        console.error('回應行程邀請失敗', error);
        alert('操作失敗，請稍後再試。');
        return false;
      }
      await refresh();
      return true;
    },
    [userId, refresh],
  );

  return { trips, loading, refresh, respond };
}
