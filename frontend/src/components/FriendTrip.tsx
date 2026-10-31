import { useState, type ReactNode } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useFriends } from '../hooks/useFriends';
import { useTrips, type Trip } from '../hooks/useTrips';
import TripInvite from './TripInvite';

function FriendTrip() {
  const { userId, friendCode } = useProfile();
  const { friends, incoming, outgoing, loading, sendRequest, respondToRequest, cancelRequest, removeFriend } =
    useFriends(userId);
  const { trips, respond, addStop } = useTrips(userId);
  const [openTripId, setOpenTripId] = useState<string | null>(null);

  const [codeInput, setCodeInput] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAdd = async () => {
    if (!codeInput.trim() || submitting) return;
    setSubmitting(true);
    setMessage('');
    try {
      const result = await sendRequest(codeInput);
      setMessage(result);
      setCodeInput('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!friendCode) return;
    try {
      await navigator.clipboard.writeText(friendCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard 權限被擋時就不做事，使用者仍可以自己選取文字複製
    }
  };

  const invites = trips.filter((t) => t.myRole === 'invited');
  const myTrips = trips.filter((t) => t.myRole === 'organizer' || t.myRole === 'joined');
  // 別人發起、自己還沒參與的公開行程
  const publicTrips = trips.filter((t) => t.myRole === 'viewer');
  const openTrip = trips.find((t) => t.id === openTripId);

  if (openTrip) {
    return (
      <TripInvite
        trip={openTrip}
        onClose={() => setOpenTripId(null)}
        onRespond={(join) => respond(openTrip, join)}
        onAddStop={(place) => addStop(openTrip, place)}
      />
    );
  }

  return (
    <section className="card friend-trip">
      <div className="card-header">
        <h2>好友</h2>
        <p>交換好友代碼，跟朋友一起規劃大稻埕行程</p>
      </div>

      <div className="friend-trip-list">
        <div className="friend-code-box">
          <span className="friend-code-label">我的好友代碼</span>
          <div className="friend-code-value">
            <span>{friendCode ?? '產生中…'}</span>
            <button type="button" onClick={handleCopy} disabled={!friendCode}>
              {copied ? '已複製' : '複製'}
            </button>
          </div>
        </div>

        <div className="friend-add-box">
          <input
            type="text"
            className="friend-add-input"
            placeholder="輸入朋友的 6 碼好友代碼"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button type="button" className="friend-add-submit" onClick={handleAdd} disabled={submitting || !codeInput.trim()}>
            {submitting ? '送出中…' : '加好友'}
          </button>
        </div>
        {message && <p className="friend-add-message">{message}</p>}

        {invites.length > 0 && (
          <FriendSection title={`行程邀請（${invites.length}）`}>
            {invites.map((trip) => (
              <TripRow key={trip.id} trip={trip} onOpen={() => setOpenTripId(trip.id)} />
            ))}
          </FriendSection>
        )}

        {myTrips.length > 0 && (
          <FriendSection title={`我的行程（${myTrips.length}）`}>
            {myTrips.map((trip) => (
              <TripRow key={trip.id} trip={trip} onOpen={() => setOpenTripId(trip.id)} />
            ))}
          </FriendSection>
        )}

        {publicTrips.length > 0 && (
          <FriendSection title={`公開行程（${publicTrips.length}）`}>
            {publicTrips.map((trip) => (
              <TripRow key={trip.id} trip={trip} onOpen={() => setOpenTripId(trip.id)} />
            ))}
          </FriendSection>
        )}

        {incoming.length > 0 && (
          <FriendSection title={`好友邀請（${incoming.length}）`}>
            {incoming.map((req) => (
              <div className="friend-row" key={req.userId}>
                <span className="friend-row-name">{req.nickname}</span>
                <div className="friend-row-actions">
                  <button type="button" className="friend-accept" onClick={() => respondToRequest(req, true)}>
                    接受
                  </button>
                  <button type="button" className="friend-decline" onClick={() => respondToRequest(req, false)}>
                    婉拒
                  </button>
                </div>
              </div>
            ))}
          </FriendSection>
        )}

        {outgoing.length > 0 && (
          <FriendSection title={`等待對方接受（${outgoing.length}）`}>
            {outgoing.map((req) => (
              <div className="friend-row" key={req.userId}>
                <span className="friend-row-name">{req.nickname}</span>
                <button type="button" className="friend-decline" onClick={() => cancelRequest(req)}>
                  取消邀請
                </button>
              </div>
            ))}
          </FriendSection>
        )}

        <FriendSection title={`好友（${friends.length}）`}>
          {loading ? (
            <p className="friend-trip-empty">載入中…</p>
          ) : friends.length === 0 ? (
            <p className="friend-trip-empty">尚無好友，跟朋友交換代碼加起來吧！</p>
          ) : (
            friends.map((f) => (
              <div className="friend-row" key={f.userId}>
                <span className="friend-row-name">{f.nickname}</span>
                <button type="button" className="friend-decline" onClick={() => removeFriend(f)}>
                  移除
                </button>
              </div>
            ))
          )}
        </FriendSection>
      </div>
    </section>
  );
}

/** 行程列表的一列：景點小圖＋名稱＋發起人，點了打開行程邀請畫面 */
function TripRow({ trip, onOpen }: { trip: Trip; onOpen: () => void }) {
  const joined = trip.members.filter((m) => m.status === 'joined').length;
  const stops = 1 + trip.stops.length;
  return (
    <button type="button" className="friend-row trip-row" onClick={onOpen}>
      {trip.placeImage ? <img className="trip-row-thumb" src={trip.placeImage} alt="" /> : <span className="trip-row-thumb" />}
      <span className="trip-row-text">
        <strong>{trip.placeTitle}</strong>
        <span>
          {trip.visibility === 'public' ? '🌏' : '🔒'} {trip.myRole === 'organizer' ? '你發起的' : `由 ${trip.organizer.nickname} 發起`}・
          {joined + 1}/{trip.maxMembers} 人・{stops} 個景點
        </span>
      </span>
      <span className="trip-row-arrow" aria-hidden="true">
        ›
      </span>
    </button>
  );
}

function FriendSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="friend-section">
      <h3 className="friend-section-title">{title}</h3>
      {children}
    </div>
  );
}

export default FriendTrip;
