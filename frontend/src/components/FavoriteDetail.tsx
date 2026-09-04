import type { FavoriteCard } from '../hooks/useFavorites';

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

function FavoriteDetail({ favorite, previous, onClose, onOpenDetail }: FavoriteDetailProps) {
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
    </section>
  );
}

export default FavoriteDetail;
