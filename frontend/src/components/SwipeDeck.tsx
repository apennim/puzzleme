import { motion, useAnimationControls } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import cardDataRaw from '../assets/cardData.json';

export interface SwipeCardData {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  image: string;
  photoCredit?: string;
  address?: string;
  tags?: string[];
  isSP?: boolean;
}

interface SwipeDeckProps {
  onMatch: (card: SwipeCardData) => void;
}

function SwipeDeck({ onMatch }: SwipeDeckProps) {
  const [deck, setDeck] = useState<SwipeCardData[]>([]);
  const [lastAction, setLastAction] = useState<string>('');

  // 主卡片是「同一個」DOM 節點，靠 controls 播放離場動畫後直接換內容，
  // 不做掛載／卸載，因此不會有離場節點殘留在 DOM 裡。
  const controls = useAnimationControls();
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const swipeTimer = useRef<number | undefined>(undefined);

  // 卸載時清掉尚未觸發的換卡計時器
  useEffect(() => () => window.clearTimeout(swipeTimer.current), []);

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

  // 真正把卡片處理掉（不含動畫）
  const commitSwipe = (card: SwipeCardData, direction: 'left' | 'right') => {
    if (direction === 'right') {
      onMatch(card);
      setLastAction(card.isSP ? `✨ 稀有 SP！${card.title} 已加入行程！` : `✅ Match: ${card.title}`);
    } else {
      setLastAction(`❌ Discard: ${card.title}`);
    }
    setDeck((prev) => prev.slice(1));
  };

  // 播放離場動畫，並在固定時間後換卡 + 復位。
  // 不 await 動畫 Promise：即使動畫驅動被瀏覽器背景節流，換卡邏輯仍會如期完成。
  const SWIPE_MS = 270;
  const flyOut = (direction: 'left' | 'right') => {
    if (busyRef.current) return;
    const card = deck[0];
    if (!card) return;

    busyRef.current = true;
    setBusy(true);

    const dir = direction === 'right' ? 1 : -1;
    void controls.start({
      x: dir * 460,
      rotate: dir * 18,
      opacity: 0,
      transition: { duration: SWIPE_MS / 1000, ease: 'easeOut' },
    });

    swipeTimer.current = window.setTimeout(() => {
      commitSwipe(card, direction);
      // 先停掉可能還在跑的離場動畫，再強制歸位，避免動畫殘值把卡片留在畫面外
      controls.stop();
      controls.set({ x: 0, rotate: 0, opacity: 1 });
      busyRef.current = false;
      setBusy(false);
    }, SWIPE_MS);
  };

  return (
    <section className="card">
      <div className="card-body swipe-board">
        <div className="swipe-status" style={{ minHeight: '24px' }}>
          {lastAction && <span>{lastAction}</span>}
        </div>
        <div className="deck-frame">
          {/* 後景卡片（隱約可見）：靜態掛載，內容隨牌堆更新 */}
          {nextCard && (
            <div
              className={`swipe-card swipe-card-bg ${nextCard.isSP ? 'special-card' : ''}`}
              aria-hidden="true"
            >
              <div className="card-image" style={{ backgroundImage: `url(${nextCard.image})` }} />
              <div className="card-content">
                <strong>{nextCard.title}</strong>
                <p>{nextCard.description}</p>
              </div>
            </div>
          )}

          {/* 全部滑完的提示 */}
          {totalCards === 0 && (
            <div className="swipe-card swipe-card-empty">
              <div style={{ padding: '40px 20px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #8f5c69 0%, #c29c8f 100%)' }}>
                <p style={{ fontSize: '2rem', margin: '0 0 12px 0' }}>🎉</p>
                <h3 style={{ color: '#fff', margin: '0 0 8px 0' }}>已 Match 所有景點！</h3>
                <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>前往 Map 頁籤查看完整路線</p>
              </div>
            </div>
          )}

          {/* 主卡片：單一持久節點，不隨換卡掛載／卸載 */}
          {topCard && (
            <motion.div
              className={`swipe-card ${topCard.isSP ? 'special-card' : ''}`}
              drag="x"
              dragSnapToOrigin
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.6}
              onDragEnd={(_, info) => {
                const threshold = 120;
                const velocity = info.velocity.x;
                if (info.offset.x > threshold || velocity > 500) {
                  void flyOut('right');
                } else if (info.offset.x < -threshold || velocity < -500) {
                  void flyOut('left');
                }
              }}
              initial={{ x: 0, rotate: 0, opacity: 1 }}
              animate={controls}
              whileDrag={{ boxShadow: '0 30px 60px rgba(0, 0, 0, 0.16)' }}
            >
              <div className="swipe-card-media">
                <div className="card-image" style={{ backgroundImage: `url(${topCard.image})` }} />
                <div className="swipe-card-gradient" />
                {topCard.photoCredit && (
                  <span className="photo-credit">{topCard.photoCredit}</span>
                )}
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
                      void flyOut('right');
                    }}
                    disabled={busy}
                    aria-label="喜歡"
                  >
                    ♥
                  </button>
                  <button
                    type="button"
                    className="btn-dislike"
                    onClick={(e) => {
                      e.stopPropagation();
                      void flyOut('left');
                    }}
                    disabled={busy}
                    aria-label="不喜歡"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}

export default SwipeDeck;
