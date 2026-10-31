import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { FavoriteCard } from './useFavorites';

export type TripMemberStatus = 'invited' | 'joined' | 'declined';
export type TripVisibility = 'friends' | 'public';

export interface TripPerson {
  userId: string;
  nickname: string;
  avatarUrl: string;
}

export interface TripMember extends TripPerson {
  status: TripMemberStatus;
}

export interface TripPlace {
  title: string;
  address: string;
  image: string;
  tags: string[];
  lat: number | null;
  lng: number | null;
}

export interface TripStop extends TripPlace {
  id: string;
  addedBy: TripPerson;
}

/** 發起人在送出邀請時決定的行程設定 */
export interface TripSettings {
  visibility: TripVisibility;
  /** 人數上限（含發起人） */
  maxMembers: number;
  /** 景點數上限（含第一個景點） */
  maxStops: number;
  /** 已加入的人能不能新增下一個景點 */
  allowMemberStops: boolean;
}

export const DEFAULT_TRIP_SETTINGS: TripSettings = {
  visibility: 'friends',
  maxMembers: 4,
  maxStops: 3,
  allowMemberStops: true,
};

export interface Trip extends TripSettings {
  id: string;
  organizer: TripPerson;
  placeTitle: string;
  placeAddress: string;
  placeImage: string;
  placeTags: string[];
  placeLat: number | null;
  placeLng: number | null;
  members: TripMember[];
  /** 第 2 個以後的景點，依新增時間排序 */
  stops: TripStop[];
  /** 目前登入者在這個行程裡的身分；viewer = 公開行程，還沒加入 */
  myRole: 'organizer' | TripMemberStatus | 'viewer';
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
  visibility: TripVisibility | null;
  max_members: number | null;
  max_stops: number | null;
  allow_member_stops: boolean | null;
  created_at: string;
  trip_members: { user_id: string; status: TripMemberStatus }[] | null;
  trip_stops:
    | {
        id: string;
        added_by: string;
        place_title: string;
        place_address: string | null;
        place_image: string | null;
        place_tags: string[] | null;
        place_lat: number | null;
        place_lng: number | null;
        created_at: string;
      }[]
    | null;
}

interface ProfileRow {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
}

/** 名額：發起人＋邀請中＋已加入（婉拒的人讓出名額） */
export function seatsTaken(trip: Trip): number {
  return 1 + trip.members.filter((m) => m.status !== 'declined').length;
}

/** 景點數：第一個景點＋後來新增的 */
export function stopCount(trip: Trip): number {
  return 1 + trip.stops.length;
}

/** 目前登入者能不能在這個行程新增景點 */
export function canAddStop(trip: Trip): boolean {
  if (stopCount(trip) >= trip.maxStops) return false;
  return trip.myRole === 'organizer' || (trip.myRole === 'joined' && trip.allowMemberStops);
}

/** 資料庫 trigger 擋下時的錯誤訊息轉成看得懂的中文 */
function friendlyError(message: string | undefined, fallback: string): string {
  if (message?.includes('trip_full')) return '這個行程人數已滿。';
  if (message?.includes('stops_full')) return '這個行程的景點已經到上限了。';
  return fallback;
}

/**
 * 發起行程：把收藏的景點複製一份存進 trips（連同行程設定），
 * 再替每位被邀請的好友建一筆 trip_members（狀態 invited）。回傳一句可以直接顯示的結果訊息。
 */
export async function createTrip(
  place: FavoriteCard,
  friendIds: string[],
  settings: TripSettings,
): Promise<{ ok: boolean; message: string }> {
  if (settings.visibility === 'friends' && friendIds.length === 0) {
    return { ok: false, message: '「僅限好友」的行程請至少邀請一位好友' };
  }
  if (friendIds.length + 1 > settings.maxMembers) {
    return { ok: false, message: `邀請人數超過上限（含你共 ${settings.maxMembers} 人）` };
  }

  const { data: trip, error } = await supabase
    .from('trips')
    .insert({
      place_title: place.title,
      place_address: place.address ?? '',
      place_image: place.image,
      place_tags: place.tags ?? [],
      place_lat: place.lat,
      place_lng: place.lng,
      visibility: settings.visibility,
      max_members: settings.maxMembers,
      max_stops: settings.maxStops,
      allow_member_stops: settings.allowMemberStops,
    })
    .select('id')
    .single();

  if (error || !trip) {
    console.error('建立行程失敗', error);
    return { ok: false, message: '建立行程失敗，請確認已執行最新的資料庫設定（docs/supabase-schema.sql）。' };
  }

  if (friendIds.length > 0) {
    const { error: memberError } = await supabase
      .from('trip_members')
      .insert(friendIds.map((userId) => ({ trip_id: trip.id, user_id: userId })));

    if (memberError) {
      console.error('邀請好友失敗', memberError);
      // 邀請失敗就把行程刪掉，避免留下半套的資料
      await supabase.from('trips').delete().eq('id', trip.id);
      return { ok: false, message: friendlyError(memberError.message, '邀請好友失敗，請稍後再試。') };
    }
  }

  const who = friendIds.length > 0 ? `已送出行程邀請給 ${friendIds.length} 位好友` : '已建立行程';
  return { ok: true, message: settings.visibility === 'public' ? `${who}，其他用戶也能在「公開行程」加入！` : `${who}！` };
}

/**
 * 讀取跟自己有關的行程（發起的、被邀請的）以及所有公開行程。RLS 只會回傳看得到的行程，
 * 所以直接 select 全部即可。成員和新增景點的人的暱稱、頭像另外從 profiles 查一次。
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
      .select('*, trip_members(user_id, status), trip_stops(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('讀取行程失敗', error);
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as TripRow[];
    const personIds = Array.from(
      new Set(
        rows.flatMap((r) => [
          r.organizer_id,
          ...(r.trip_members ?? []).map((m) => m.user_id),
          ...(r.trip_stops ?? []).map((s) => s.added_by),
        ]),
      ),
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
        const stops = (r.trip_stops ?? [])
          .slice()
          .sort((a, b) => a.created_at.localeCompare(b.created_at))
          .map((s) => ({
            id: s.id,
            addedBy: personOf(s.added_by),
            title: s.place_title,
            address: s.place_address ?? '',
            image: s.place_image ?? '',
            tags: s.place_tags ?? [],
            lat: s.place_lat,
            lng: s.place_lng,
          }));
        return {
          id: r.id,
          organizer: personOf(r.organizer_id),
          placeTitle: r.place_title,
          placeAddress: r.place_address ?? '',
          placeImage: r.place_image ?? '',
          placeTags: r.place_tags ?? [],
          placeLat: r.place_lat,
          placeLng: r.place_lng,
          visibility: r.visibility ?? 'friends',
          maxMembers: r.max_members ?? DEFAULT_TRIP_SETTINGS.maxMembers,
          maxStops: r.max_stops ?? DEFAULT_TRIP_SETTINGS.maxStops,
          allowMemberStops: r.allow_member_stops ?? false,
          members,
          stops,
          myRole: r.organizer_id === userId ? 'organizer' : (mine?.status ?? 'viewer'),
          createdAt: new Date(r.created_at).getTime(),
        };
      }),
    );
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * 按 Join!（join = true）或 ✕（join = false）。
   * 被邀請的人是更新自己那筆的狀態；公開行程還沒有資料的人，是新增一筆 joined。
   */
  const respond = useCallback(
    async (trip: Trip, join: boolean): Promise<boolean> => {
      if (!userId) return false;

      if (trip.myRole === 'viewer') {
        if (!join) return true; // 公開行程按 ✕ 只是關掉，不用寫資料庫
        const { error } = await supabase
          .from('trip_members')
          .insert({ trip_id: trip.id, user_id: userId, status: 'joined' });
        if (error) {
          console.error('加入公開行程失敗', error);
          alert(friendlyError(error.message, '加入失敗，請稍後再試。'));
          return false;
        }
        await refresh();
        return true;
      }

      const { data, error } = await supabase
        .from('trip_members')
        .update({ status: join ? 'joined' : 'declined', updated_at: new Date().toISOString() })
        .eq('trip_id', trip.id)
        .eq('user_id', userId)
        .select();
      if (error || !data?.length) {
        console.error('回應行程邀請失敗', error);
        alert(friendlyError(error?.message, '操作失敗，請稍後再試。'));
        return false;
      }
      await refresh();
      return true;
    },
    [userId, refresh],
  );

  /** 從自己的收藏挑一個景點，加到行程的下一站 */
  const addStop = useCallback(
    async (trip: Trip, place: FavoriteCard): Promise<boolean> => {
      const { error } = await supabase.from('trip_stops').insert({
        trip_id: trip.id,
        place_title: place.title,
        place_address: place.address ?? '',
        place_image: place.image,
        place_tags: place.tags ?? [],
        place_lat: place.lat,
        place_lng: place.lng,
      });
      if (error) {
        console.error('新增景點失敗', error);
        alert(friendlyError(error.message, '新增景點失敗：可能沒有新增權限，或請稍後再試。'));
        return false;
      }
      await refresh();
      return true;
    },
    [refresh],
  );

  return { trips, loading, refresh, respond, addStop };
}
