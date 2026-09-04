import type { FavoriteCard } from '../hooks/useFavorites';

interface FavoritesBoxProps {
  favorites: FavoriteCard[];
  onClose: () => void;
  onOpenDetail: (id: string) => void;
}

function FavoritesBox({ favorites, onClose, onOpenDetail }: FavoritesBoxProps) {
  return (
    <section className="card favorites-box">
      <div className="favorites-box-header">
        <button type="button" className="back-btn" onClick={onClose} aria-label="返回">
          ‹
        </button>
        <button type="button" className="favorites-box-menu" aria-label="更多選項">
          ☰
        </button>
      </div>

      <div className="favorites-list">
        {favorites.length === 0 && (
          <p className="favorites-empty">尚未收藏任何景點，去「滑卡」右滑喜歡的地方吧！</p>
        )}
        {favorites.map((f) => (
          <button
            key={f.id}
            type="button"
            className="favorite-list-item"
            style={{ backgroundImage: `url(${f.image})` }}
            onClick={() => onOpenDetail(f.id)}
          >
            <div className="favorite-list-item-info">
              <strong>{f.title}</strong>
              {f.address && <p>{f.address}</p>}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default FavoritesBox;
