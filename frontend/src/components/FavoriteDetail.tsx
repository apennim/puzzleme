import { useState } from 'react';
import type { FavoriteCard } from '../hooks/useFavorites';
import { useFriends } from '../hooks/useFriends';
import { useProfile } from '../hooks/useProfile';
import { createTrip } from '../hooks/useTrips';

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

/** 選好友、送出行程邀請。好友在「好友」分頁的「行程邀請」會看到，按 Join! 就加入 */
function InviteFriendsModal({ place, onClose }: { place: FavoriteCard; onClose: () => void }) {
  const { userId } = useProfile();
  const { friends, loading } = useFriends(userId);
  const [selected, setSelected] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSend = async () => {
    setSending(true);
    setMessage('');
    try {
      const result = await createTrip(place, selected);
      setMessage(result.message);
      if (result.ok) setTimeout(onClose, 1200);
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
            <p className="new-post-label">選擇好友</p>
            {loading ? (
              <p className="friend-trip-empty">載入中…</p>
            ) : friends.length === 0 ? (
              <p className="friend-trip-empty">還沒有好友，先到「好友」分頁用好友代碼加朋友吧！</p>
            ) : (
              <div className="new-post-friend-chips">
                {friends.map((f) => (
                  <button
                    type="button"
                    key={f.userId}
                    className={selected.includes(f.userId) ? 'friend-chip active' : 'friend-chip'}
                    onClick={() => toggle(f.userId)}
                  >
                    {f.nickname}
                  </button>
                ))}
              </div>
            )}
          </div>
          {message && <p className="friend-add-message">{message}</p>}
        </div>

        <button type="button" className="new-post-submit" onClick={handleSend} disabled={sending || selected.length === 0}>
          {sending ? '送出中…' : `送出行程邀請${selected.length ? `（${selected.length} 人）` : ''}`}
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
