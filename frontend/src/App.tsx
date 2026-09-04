import { useEffect, useState } from 'react';
// @ts-ignore
import * as turf from '@turf/turf';
import MapCanvas from './components/MapCanvas';
import SwipeDeck from './components/SwipeDeck';
import Notification from './components/Notification';
import Timeline from './components/Timeline';
import HomeFeed from './components/HomeFeed';
import FriendTrip from './components/FriendTrip';
import BottomNav, { type NavTab } from './components/BottomNav';
import SettingsPanel from './components/SettingsPanel';
import NewPostModal from './components/NewPostModal';
import LeadCaptureModal, { hasSeenLeadCapture } from './components/LeadCaptureModal';
import { usePosts } from './hooks/usePosts';
import { useFavorites } from './hooks/useFavorites';
import ProfilePage from './components/ProfilePage';
import FavoritesBox from './components/FavoritesBox';
import FavoriteDetail from './components/FavoriteDetail';

const secondaryTabs = ['Map'] as const;
type Tab = NavTab | typeof secondaryTabs[number];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [matchedPins, setMatchedPins] = useState<Array<{ id: string; lat: number; lng: number; title: string }>>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [favoriteDetailId, setFavoriteDetailId] = useState<string | null>(null);
  const { posts, addPost } = usePosts();
  const { favorites, addFavorite } = useFavorites();

  useEffect(() => {
    if (!hasSeenLeadCapture()) {
      setShowLeadCapture(true);
    }
  }, []);

  const SP = { lat: 25.0541, lng: 121.5097, name: '幻猻家珈琲' };
  const START = { lat: 25.0552, lng: 121.5201, name: '北風社' };
  const END = { lat: 25.0563, lng: 121.5076, name: '大稻埕碼頭' };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-right">
          <button
            type="button"
            className="settings-btn"
            aria-label="個人資料（暫時測試入口）"
            onClick={() => setShowProfile((v) => !v)}
          >
            👤
          </button>
          <SettingsPanel />
        </div>
      </header>

      <main className="app-main">
        {showProfile && <ProfilePage />}
        {!showProfile && activeTab === 'Favorites' && favoriteDetailId && (() => {
          const index = favorites.findIndex((f) => f.id === favoriteDetailId);
          const favorite = favorites[index];
          if (!favorite) return null;
          return (
            <FavoriteDetail
              favorite={favorite}
              previous={favorites[index + 1]}
              onClose={() => setFavoriteDetailId(null)}
              onOpenDetail={(id) => setFavoriteDetailId(id)}
            />
          );
        })()}
        {!showProfile && activeTab === 'Favorites' && !favoriteDetailId && (
          <FavoritesBox
            favorites={favorites}
            onClose={() => setActiveTab('Home')}
            onOpenDetail={(id) => setFavoriteDetailId(id)}
          />
        )}
        {!showProfile && activeTab === 'Home' && (
          <HomeFeed posts={posts} onOpenFavorites={() => setActiveTab('Favorites')} />
        )}
        {activeTab === 'Friend' && <FriendTrip />}
        {activeTab === 'Match' && (
          <SwipeDeck
            onMatch={(card) => {
              // turf expects [lng, lat]
              const pt = turf.point([card.lng, card.lat]);
              const spPt = turf.point([SP.lng, SP.lat]);

              const distToSP = turf.distance(pt, spPt, { units: 'kilometers' });

              setMatchedPins((prev) => [...prev, { id: card.id, lat: card.lat, lng: card.lng, title: card.title }]);
              addFavorite({
                id: card.id,
                title: card.title,
                image: card.image,
                description: card.description,
                address: card.address,
                tags: card.tags,
                lat: card.lat,
                lng: card.lng,
              });

              // Business trigger: within 0.3 km of SP
              if (distToSP <= 0.3) {
                setNotice(`⭐ 已收入收藏盒！偵測到鄰近 SP 據點：${SP.name}，加入行程可解鎖稀有碎片！`);
              } else {
                setNotice(`⭐ 已收入收藏盒：${card.title}`);
              }
            }}
          />
        )}
        {activeTab === 'Map' && (
          <MapCanvas
            matchedPins={matchedPins}
            onAddPin={(pin) => {
              const pt = turf.point([pin.lng, pin.lat]);
              const spPt = turf.point([SP.lng, SP.lat]);
              const startPt = turf.point([START.lng, START.lat]);
              const endPt = turf.point([END.lng, END.lat]);

              const distToSP = turf.distance(pt, spPt, { units: 'kilometers' });
              const distToStart = turf.distance(pt, startPt, { units: 'kilometers' });
              const distToEnd = turf.distance(pt, endPt, { units: 'kilometers' });

              setMatchedPins((prev) => [...prev, pin]);

              if (distToSP <= 0.3) {
                setNotice(`偵測到鄰近 SP 據點：${SP.name}，加入行程可解鎖稀有碎片！`);
              } else {
                setNotice(`${pin.title} 已加入行程（距離起點 ${Math.round(distToStart*1000)}m，距離終點 ${Math.round(distToEnd*1000)}m）`);
              }
            }}
          />
        )}
      </main>
      <div style={{ position: 'fixed', right: 20, bottom: 90, zIndex: 80 }}>
        <button className="new-post-fab" onClick={() => setShowNewPost(true)}>
          ＋ 新增行程貼文
        </button>
      </div>

      {showNewPost && <NewPostModal onClose={() => setShowNewPost(false)} onSubmit={addPost} />}
      {showLeadCapture && <LeadCaptureModal onClose={() => setShowLeadCapture(false)} />}
      {notice && <Notification message={notice} onClose={() => setNotice(null)} />}
      <Timeline pins={matchedPins} visible={showTimeline} onClose={() => setShowTimeline(false)} />

      <BottomNav
        active={
          (['Home', 'Match', 'Friend', 'Favorites'] as const).includes(activeTab as NavTab)
            ? (activeTab as NavTab)
            : 'Match'
        }
        onChange={(tab) => {
          setActiveTab(tab);
          setFavoriteDetailId(null);
        }}
      />
    </div>
  );
}

export default App;
