import { useState } from 'react';

const SUBMITTED_KEY = 'pintu-lead-submitted';
const SKIPPED_KEY = 'pintu-lead-skipped';

export function hasSeenLeadCapture(): boolean {
  try {
    return localStorage.getItem(SUBMITTED_KEY) === '1' || localStorage.getItem(SKIPPED_KEY) === '1';
  } catch {
    return true;
  }
}

interface LeadCaptureModalProps {
  onClose: () => void;
}

function LeadCaptureModal({ onClose }: LeadCaptureModalProps) {
  const [nickname, setNickname] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const skip = () => {
    try {
      localStorage.setItem(SKIPPED_KEY, '1');
    } catch {
      // localStorage 被封鎖時，直接關閉即可
    }
    onClose();
  };

  const handleSubmit = async () => {
    if (!nickname.trim() || !contact.trim()) {
      alert('請填寫暱稱與聯絡方式');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim(), contact: contact.trim() }),
      });

      if (!res.ok) {
        console.error('留資失敗', await res.text());
        alert('送出失敗，請檢查網路連線後再試一次。');
        return;
      }

      try {
        localStorage.setItem(SUBMITTED_KEY, '1');
      } catch {
        // 忽略 localStorage 寫入失敗
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-panel new-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>歡迎試用「拼途」</h3>
          <button type="button" className="modal-close" onClick={skip} aria-label="略過">
            ✕
          </button>
        </div>

        <div className="new-post-body">
          <div className="new-post-section">
            <p className="new-post-label">留下你的暱稱與聯絡方式，讓我們後續與你聯繫試用意見</p>
          </div>

          <div className="new-post-section">
            <p className="new-post-label">暱稱</p>
            <input
              className="new-post-input"
              type="text"
              placeholder="你想被怎麼稱呼？"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <div className="new-post-section">
            <p className="new-post-label">聯絡方式</p>
            <input
              className="new-post-input"
              type="text"
              placeholder="Email / LINE ID / 電話"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>
        </div>

        <button type="button" className="new-post-submit" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '送出中…' : '送出'}
        </button>
        <button type="button" className="lead-capture-skip" onClick={skip}>
          略過，直接體驗
        </button>
      </div>
    </div>
  );
}

export default LeadCaptureModal;
