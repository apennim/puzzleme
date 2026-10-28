import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import EditableImage from './EditableImage';
import EditableText from './EditableText';

// 狀態改成按鈕，點開從固定選項挑一個，不再自由打字
const STATUS_OPTIONS = ['搜尋咖啡廳中...', '找旅伴中...', '規劃行程中...', '旅行中...', '休息中...'];

function StatusButton({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // 點選單外面或按 Esc 就關閉
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="profile-status" ref={wrapRef}>
      <button
        type="button"
        className={value ? 'profile-status-btn' : 'profile-status-btn is-empty'}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {value || '設定狀態'}
        <span className="profile-status-caret" aria-hidden="true">
          ▼
        </span>
      </button>
      {open && (
        <ul className="profile-status-menu" role="menu">
          {STATUS_OPTIONS.map((option) => (
            <li key={option} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={option === value}
                className="profile-status-option"
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProfilePage() {
  // 個人資料存在 Supabase profiles 表，跟著帳號走：重新登入、換裝置都還在
  const { avatarUrl: avatar, setAvatar, nickname: name, status, updateProfile } = useProfile();
  const setName = (value: string) => updateProfile({ nickname: value });
  const setStatus = (value: string) => updateProfile({ status: value });

  return (
    <section className="card profile-page">
      <div className="profile-header">
        <EditableImage value={avatar} onChange={setAvatar} alt="個人頭像" className="profile-avatar" compact />
        <div className="profile-header-text">
          <EditableText value={name} onChange={setName} placeholder="你的名字" className="profile-name" />
          <StatusButton value={status} onChange={setStatus} />
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
