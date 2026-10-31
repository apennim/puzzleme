import { useState } from 'react';
import type { FavoriteCard } from '../hooks/useFavorites';
import { useFriends } from '../hooks/useFriends';
import { useProfile } from '../hooks/useProfile';
import { createTrip, DEFAULT_TRIP_SETTINGS, type TripSettings } from '../hooks/useTrips';

interface FavoriteDetailProps {
  favorite: FavoriteCard;
  previous?: FavoriteCard;
  onClose: () => void;
  onOpenDetail: (id: string) => void;
}

function formatSavedDate(savedAt: number) {
  return new Date(savedAt).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** 數字加減按鈕（人數上限、景點數上限用） */
function Stepper({
  id,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="trip-stepper" role="group" aria-labelledby={`${id}-label`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="減少">
        －
      </button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="增加">
        ＋
      </button>
    </div>
  );
}

/**
 * 發起行程：選好友＋行程設定（公開範圍、人數上限、景點數上限、受邀者能否新增景點）。
 * 好友在「好友」分頁的「行程邀請」會看到；公開行程其他用戶會在「公開行程」看到。
 */
function InviteFriendsModal({ place, onClose }: { place: FavoriteCard; onClose: () => void }) {
  const { userId } = useProfile();
  const { friends, loading } = useFriends(userId);
  const [selected, setSelected] = useState<string[]>([]);
  const [settings, setSettings] = useState<TripSettings>(DEFAULT_TRIP_SETTINGS);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const update = (patch: Partial<TripSettings>) => setSettings((prev) => ({ ...prev, ...patch }));
  // 可以邀請的好友數 = 人數上限 − 發起人自己
  const inviteLimit = settings.maxMembers - 1;
  const canSend = settings.visibility === 'public' || selected.length > 0;

  const toggle = (id: string) =>
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= inviteLimit) return prev; // 已達人數上限
      return [...prev, id];
    });

  const changeMaxMembers = (next: number) => {
    update({ maxMembers: next });
    // 調低上限時，多選的好友從後面移除
    setSelected((prev) => prev.slice(0, next - 1));
  };

  const handleSend = async () => {
    setSending(true);
    setMessage('');
    try {
      const result = await createTrip(place, selected, settings);
      setMessage(result.message);
      if (result.ok) setTimeout(onClose, 1500);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel new-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>邀請好友一起去「{place.title}」</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="關閉">
            ✕
          </button>
        </div>

        <div className="new-post-body">
          <div className="new-post-section">
            <p className="new-post-label">誰可以看到這個行程</p>
            <div className="trip-visibility" role="radiogroup" aria-label="行程公開範圍">
              <button
                type="button"
                role="radio"
                aria-checked={settings.visibility === 'friends'}
                className={settings.visibility === 'friends' ? 'trip-visibility-option active' : 'trip-visibility-option'}
                onClick={() => update({ visibility: 'friends' })}
              >
                <strong>🔒 僅限好友</strong>
                <span>只有你邀請的好友看得到、能加入</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={settings.visibility === 'public'}
                className={settings.visibility === 'public' ? 'trip-visibility-option active' : 'trip-visibility-option'}
                onClick={() => update({ visibility: 'public' })}
              >
                <strong>🌏 公開</strong>
                <span>其他用戶也能在「公開行程」看到並加入</span>
              </button>
            </div>
          </div>

          <div className="new-post-section trip-settings-grid">
            <div className="trip-setting-row">
              <span id="trip-max-members-label">人數上限（含你）</span>
              <Stepper id="trip-max-members" value={settings.maxMembers} min={2} max={10} onChange={changeMaxMembers} />
            </div>
            <div className="trip-setting-row">
              <span id="trip-max-stops-label">景點數上限</span>
              <Stepper
                id="trip-max-stops"
                value={settings.maxStops}
                min={1}
                max={10}
                onChange={(next) => update({ maxStops: next })}
              />
            </div>
            <label className="trip-setting-row trip-setting-toggle">
              <span>
                讓受邀者新增下一個景點
                <small>{settings.maxStops <= 1 ? '景點上限只有 1 個，無法新增' : '已加入的人可以從自己的收藏加景點'}</small>
              </span>
              <input
                type="checkbox"
                checked={settings.allowMemberStops && settings.maxStops > 1}
                disabled={settings.maxStops <= 1}
                onChange={(e) => update({ allowMemberStops: e.target.checked })}
              />
            </label>
          </div>

          <div className="new-post-section">
            <p className="new-post-label">
              選擇好友（{selected.length}/{inviteLimit}）{settings.visibility === 'public' && '・公開行程可以不邀請'}
            </p>
            {loading ? (
              <p className="friend-trip-empty">載入中…</p>
            ) : friends.length === 0 ? (
              <p className="friend-trip-empty">還沒有好友，先到「好友」分頁用好友代碼加朋友吧！</p>
            ) : (
              <div className="new-post-friend-chips">
                {friends.map((f) => {
                  const active = selected.includes(f.userId);
                  return (
                    <button
                      type="button"
                      key={f.userId}
                      className={active ? 'friend-chip active' : 'friend-chip'}
                      onClick={() => toggle(f.userId)}
                      disabled={!active && selected.length >= inviteLimit}
                    >
                      {f.nickname}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {message && <p className="friend-add-message">{message}</p>}
        </div>

        <button type="button" className="new-post-submit" onClick={handleSend} disabled={sending || !canSend}>
          {sending
            ? '送出中…'
            : selected.length > 0
              ? `送出行程邀請（${selected.length} 人）`
              : settings.visibility === 'public'
                ? '建立公開行程'
                : '送出行程邀請'}
        </button>
      </div>
    </div>
  );
}

function FavoriteDetail({ favorite, previous, onClose, onOpenDetail }: FavoriteDetailProps) {
  const [inviting, setInviting] = useState(false);

  return (
    <section className="card favorite-detail">
      <div className="card-header favorite-detail-header">
        <button type="button" className="back-btn" onClick={onClose} aria-label="返回">
          ‹
        </button>
        <h2>{favorite.title}</h2>
      </div>

      <div className="favorite-detail-media" style={{ backgroundImage: `url(${favorite.image})` }} />

      <div className="favorite-detail-info">
        {favorite.address && <p className="card-address">{favorite.address}</p>}
      </div>

      {favorite.tags && favorite.tags.length > 0 && (
        <div className="tag-row favorite-detail-tags">
          {favorite.tags.map((tag, i) => (
            <span key={tag} className={`tag-pill tag-pill-${i % 3}`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="favorite-detail-saved">
        <span className="favorite-detail-saved-text">你於 {formatSavedDate(favorite.savedAt)} 收藏</span>
      </div>

      <button type="button" className="favorite-detail-invite" onClick={() => setInviting(true)}>
        👥 邀請好友同行
      </button>

      {previous && (
        <div className="favorite-detail-related">
          <p className="favorite-detail-related-label">在這之前你還去了……</p>
          <button
            type="button"
            className="favorite-list-item"
            style={{ backgroundImage: `url(${previous.image})` }}
            onClick={() => onOpenDetail(previous.id)}
          >
            <div className="favorite-list-item-info">
              <strong>{previous.title}</strong>
              {previous.address && <p>{previous.address}</p>}
            </div>
          </button>
        </div>
      )}
      {inviting && <InviteFriendsModal place={favorite} onClose={() => setInviting(false)} />}
    </section>
  );
}

export default FavoriteDetail;
