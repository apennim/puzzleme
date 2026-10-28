import { useEffect, useRef, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import type { UserPost } from '../hooks/usePosts';
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

function formatPostDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 個人主頁的貼文卡：照片滿版、下方漸層，中間是文案，左下角粉紅日期標籤 */
function ProfilePostCard({ post, onOpen }: { post: UserPost; onOpen: () => void }) {
  return (
    <button type="button" className="profile-post" onClick={onOpen} aria-label={`查看貼文：${post.caption || post.location || '行程貼文'}`}>
      {post.media && post.mediaType === 'video' ? (
        <video className="profile-post-media" src={post.media} muted playsInline preload="metadata" />
      ) : post.media ? (
        <img className="profile-post-media" src={post.media} alt="" loading="lazy" />
      ) : null}
      <div className="profile-post-gradient" />
      {post.caption && <p className="profile-post-caption">{post.caption}</p>}
      <span className="profile-post-badge">{formatPostDate(post.createdAt)}</span>
    </button>
  );
}

interface ProfilePageProps {
  /** 自己發的行程貼文（App 依 authorId 篩好），最新的在最上面 */
  posts: UserPost[];
  onOpenPost: (id: string) => void;
}

function ProfilePage({ posts, onOpenPost }: ProfilePageProps) {
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

      <div className="profile-post-list">
        {posts.length === 0 && <p className="profile-post-empty">還沒有發布過行程貼文，點右下角「＋ 新增行程貼文」發布第一篇吧！</p>}
        {posts.map((post) => (
          <ProfilePostCard key={post.id} post={post} onOpen={() => onOpenPost(post.id)} />
        ))}
      </div>
    </section>
  );
}

export default ProfilePage;
