import { useState, type ReactNode } from 'react';
import { useProfile } from '../hooks/useProfile';
import { useFriends } from '../hooks/useFriends';

function FriendTrip() {
  const { userId, friendCode } = useProfile();
  const { friends, incoming, outgoing, loading, sendRequest, respondToRequest, cancelRequest, removeFriend } =
    useFriends(userId);

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

function FriendSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="friend-section">
      <h3 className="friend-section-title">{title}</h3>
      {children}
    </div>
  );
}

export default FriendTrip;
