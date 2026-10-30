import { useEffect, useState } from 'react';
// @ts-ignore
import * as turf from '@turf/turf';
import { useProfile } from '../hooks/useProfile';
import type { Trip, TripPerson } from '../hooks/useTrips';

interface TripInviteProps {
  trip: Trip;
  onClose: () => void;
  /** 被邀請的人按 Join!（true）或 ✕（false），成功回傳 true */
  onRespond: (join: boolean) => Promise<boolean>;
}

/** 右上角最多顯示幾個頭像，超過的人數用「+N」表示 */
const MAX_AVATARS = 3;

/** pending = 還沒回覆邀請的人，頭像半透明 */
function Avatar({ person, pending }: { person: TripPerson; pending?: boolean }) {
  const className = pending ? 'trip-invite-avatar is-pending' : 'trip-invite-avatar';
  const title = pending ? `${person.nickname}（還沒回覆）` : person.nickname;
  return person.avatarUrl ? (
    <img className={className} src={person.avatarUrl} alt={person.nickname} title={title} />
  ) : (
    <span className={`${className} trip-invite-avatar-initial`} title={title}>
      {person.nickname.slice(0, 1)}
    </span>
  );
}

/** 用瀏覽器定位算「距離你 X km」；使用者拒絕定位或景點沒有座標時就不顯示 */
function useDistanceKm(lat: number | null, lng: number | null): number | null {
  const [km, setKm] = useState<number | null>(null);
  useEffect(() => {
    if (lat == null || lng == null || !navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        // turf 的座標順序是 [經度, 緯度]
        const d = turf.distance(turf.point([pos.coords.longitude, pos.coords.latitude]), turf.point([lng, lat]), {
          units: 'kilometers',
        });
        setKm(d);
      },
      () => {
        // 拒絕定位：不顯示距離
      },
      { maximumAge: 5 * 60 * 1000, timeout: 10000 },
    );
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);
  return km;
}

/**
 * 好友行程邀請畫面（依 Figma 設計稿）：上方景點照片往下淡出，
 * 疊上景點名稱、地址、標籤、「由 OOO 發起的行程」，下方 Join! 和紅色 ✕ 按鈕。
 */
function TripInvite({ trip, onClose, onRespond }: TripInviteProps) {
  const [busy, setBusy] = useState(false);
  const { userId } = useProfile();
  const distanceKm = useDistanceKm(trip.placeLat, trip.placeLng);

  const joinedPeople: TripPerson[] = [trip.organizer, ...trip.members.filter((m) => m.status === 'joined')];
  // 頭像框數量 = 實際參與的人數：發起人＋已加入＋其他還沒回覆的（半透明）。
  // 自己還沒按 Join! 前不顯示自己，婉拒的人也不顯示，不再補空的灰色圓
  const avatarPeople = [
    ...joinedPeople.map((p) => ({ person: p, pending: false })),
    ...trip.members
      .filter((m) => m.status === 'invited' && m.userId !== userId)
      .map((m) => ({ person: m as TripPerson, pending: true })),
  ];
  const shown = avatarPeople.slice(0, MAX_AVATARS);
  const moreCount = avatarPeople.length - shown.length;
  const waitingCount = trip.members.filter((m) => m.status === 'invited').length;

  const handleRespond = async (join: boolean) => {
    setBusy(true);
    try {
      const ok = await onRespond(join);
      if (ok && !join) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="trip-invite">
      <div className="trip-invite-top">
        <button type="button" className="trip-invite-back" onClick={onClose} aria-label="返回">
          <svg width="21" height="24" viewBox="0 0 21 24" aria-hidden="true">
            <path d="M17 2 5 12l12 10" fill="none" stroke="#424242" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="trip-invite-avatars" aria-label={`已加入：${joinedPeople.map((p) => p.nickname).join('、')}`}>
          {shown.map(({ person, pending }) => (
            <Avatar key={person.userId} person={person} pending={pending} />
          ))}
          {moreCount > 0 && <span className="trip-invite-avatar trip-invite-avatar-more">+{moreCount}</span>}
        </div>
      </div>

      <div className="trip-invite-media">
        {trip.placeImage && <img src={trip.placeImage} alt={trip.placeTitle} />}
        <div className="trip-invite-fade" />
        {distanceKm != null && <span className="trip-invite-distance">距離你{distanceKm.toFixed(1)}km</span>}
        {/* 名稱和地址貼齊照片底部（疊在淡出的區域上），標籤固定在照片下方 */}
        <div className="trip-invite-info">
          <h2 className="trip-invite-title">{trip.placeTitle}</h2>
          {trip.placeAddress && <p className="trip-invite-address">{trip.placeAddress}</p>}
        </div>
      </div>

      {trip.placeTags.length > 0 && (
        <div className="trip-invite-tags">
          {trip.placeTags.map((tag, i) => (
            <span key={tag} className={`trip-invite-tag trip-invite-tag-${i % 3}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="trip-invite-organizer">
        {trip.myRole === 'organizer' ? (
          <>由 <strong>你</strong> 發起的行程</>
        ) : (
          <>由 <strong>{trip.organizer.nickname}</strong> 發起的行程</>
        )}
      </div>

      <div className="trip-invite-actions">
        {trip.myRole === 'organizer' ? (
          <p className="trip-invite-status">
            {joinedPeople.length - 1} 人已加入{waitingCount > 0 && `，${waitingCount} 人還沒回覆`}
          </p>
        ) : trip.myRole === 'joined' ? (
          <p className="trip-invite-status">🎉 你已加入這個行程！</p>
        ) : (
          <>
            <button type="button" className="trip-invite-join" onClick={() => handleRespond(true)} disabled={busy}>
              Join!
            </button>
            {trip.myRole === 'invited' && (
              <button
                type="button"
                className="trip-invite-decline"
                onClick={() => handleRespond(false)}
                disabled={busy}
                aria-label="婉拒邀請"
              >
                ✕
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default TripInvite;
