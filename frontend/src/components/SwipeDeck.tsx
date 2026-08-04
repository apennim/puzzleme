import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import cardDataRaw from '../assets/cardData.json';

export interface SwipeCardData {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  image: string;
  address?: string;
  tags?: string[];
  isSP?: boolean;
}

interface SwipeDeckProps {
  onMatch: (pin: { id: string; lat: number; lng: number; title: string }) => void;
}

function SwipeDeck({ onMatch }: SwipeDeckProps) {
  const [deck, setDeck] = useState<SwipeCardData[]>([]);
  const [history, setHistory] = useState<{ card: SwipeCardData; action: 'left' | 'right' }[]>([]);
  const [lastAction, setLastAction] = useState<string>('');
  const [matchCount, setMatchCount] = useState(0);

  // 初始化卡片資料
  useEffect(() => {
    const allCards = (cardDataRaw.cards as SwipeCardData[]).map((card) => ({
      ...card,
      isSP: card.isSP || false,
    }));
    
    // 隨機打亂卡片順序
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setLastAction('準備好開始滑卡了！');
  }, []);

  const topCard = deck[0];
  const nextCard = deck[1];
  const totalCards = deck.length;

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!topCard) return;

    if (direction === 'right') {
      onMatch({
        id: topCard.id,
        lat: topCard.lat,
        lng: topCard.lng,
        title: topCard.title,
      });

      // SP 卡片特殊提示
      if (topCard.isSP) {
        setLastAction(`✨ 稀有 SP！${topCard.title} 已加入行程！`);
      } else {
        setLastAction(`✅ Match: ${topCard.title}`);
      }
      setMatchCount((prev) => prev + 1);
    } else {
      setLastAction(`❌ Discard: ${topCard.title}`);
    }

    setHistory((prev) => [...prev, { card: topCard, action: direction }]);

    // 移除已處理的卡片
    setDeck((prev) => prev.slice(1));
  };

  // 復原上一個滑卡動作
  const handleBack = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setDeck((d) => [last.card, ...d]);
      if (last.action === 'right') {
        setMatchCount((c) => Math.max(0, c - 1));
      }
      setLastAction(`↩️ 已復原：${last.card.title}`);
      return prev.slice(0, -1);
    });
  };

  return (
    <section className="card">
      <div className="card-body swipe-board">
        <div className="swipe-status" style={{ minHeight: '24px' }}>
          {lastAction && <span>{lastAction}</span>}
        </div>
        <div className="deck-frame">
          <AnimatePresence mode="popLayout">
            {/* 後景卡片（隱約可見） */}
            {nextCard && (
              <motion.div
                key={`next-${nextCard.id}`}
                className={`swipe-card ${nextCard.isSP ? 'special-card' : ''}`}
                initial={{ scale: 0.95, y: 12, opacity: 0.6 }}
                animate={{ scale: 0.95, y: 12, opacity: 0.6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="card-image" style={{ backgroundImage: `url(${nextCard.image})` }} />
                <div className="card-content">
                  <strong>{nextCard.title}</strong>
                  <p>{nextCard.description}</p>
                </div>
              </motion.div>
            )}

            {/* 主卡片 */}
            {topCard && (
              <motion.div
                key={topCard.id}
                className={`swipe-card ${topCard.isSP ? 'special-card' : ''}`}
                drag="x"
                dragConstraints={{ left: -500, right: 500 }}
                dragElastic={0.2}
                dragTransition={{ power: 0.2, timeConstant: 150 }}
                onDragEnd={(_, info) => {
                  const threshold = 120;
                  const velocity = info.velocity.x;

                  if (info.offset.x > threshold || velocity > 500) {
                    handleSwipe('right');
                  } else if (info.offset.x < -threshold || velocity < -500) {
                    handleSwipe('left');
                  }
                }}
                initial={{ opacity: 1, y: 0, rotate: 0 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0, x: 500, rotate: 20 }}
                whileDrag={{
                  boxShadow: '0 30px 60px rgba(0, 0, 0, 0.16)',
                }}
              >
                <div className="swipe-card-media">
                  <button
                    type="button"
                    className="back-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBack();
                    }}
                    disabled={history.length === 0}
                    aria-label="復原上一張"
                  >
                    ‹
                  </button>
                  <div className="card-image" style={{ backgroundImage: `url(${topCard.image})` }} />
                  <div className="swipe-card-gradient" />
                </div>
                <div className="swipe-card-info">
                  <h3 className="card-title">{topCard.title}</h3>
                  {topCard.address && <p className="card-address">{topCard.address}</p>}
                  {topCard.tags && topCard.tags.length > 0 && (
                    <div className="tag-row">
                      {topCard.tags.map((tag, i) => (
                        <span key={tag} className={`tag-pill tag-pill-${i % 3}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="card-actions swipe-actions">
                    <button
                      type="button"
                      className="btn-like"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwipe('right');
                      }}
                      aria-label="喜歡"
                    >
                      ♥
                    </button>
                    <button
                      type="button"
                      className="btn-dislike"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSwipe('left');
                      }}
                      aria-label="不喜歡"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 完成提示 */}
            {!topCard && totalCards === 0 && (
              <motion.div
                key="empty"
                className="swipe-card"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <div style={{ padding: '40px 20px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #8f5c69 0%, #c29c8f 100%)' }}>
                  <p style={{ fontSize: '2rem', margin: '0 0 12px 0' }}>🎉</p>
                  <h3 style={{ color: '#fff', margin: '0 0 8px 0' }}>已 Match 所有景點！</h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>前往 Map 頁籤查看完整路線</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default SwipeDeck;
