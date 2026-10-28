import { useEffect, useRef, useState } from 'react';
import type { UserPost } from '../hooks/usePosts';

interface PostDetailProps {
  post: UserPost;
  onClose: () => void;
  /** 是自己發的貼文才會顯示右上角 ☰ 的「編輯／刪除」選單 */
  isOwner?: boolean;
  onUpdate?: (patch: { caption: string; location: string }) => Promise<boolean>;
  onDelete?: () => Promise<boolean>;
}

/** 編輯貼文視窗：可以改文案和行程地點（照片不能換，要換請刪掉重發） */
function EditPostModal({
  post,
  onCancel,
  onSave,
}: {
  post: UserPost;
  onCancel: () => void;
  onSave: (patch: { caption: string; location: string }) => Promise<boolean>;
}) {
  const [caption, setCaption] = useState(post.caption);
  const [location, setLocation] = useState(post.location);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!caption.trim() && !post.media) {
      alert('沒有照片的貼文至少要有文案');
      return;
    }
    setSaving(true);
    try {
      const ok = await onSave({ caption: caption.trim(), location: location.trim() });
      if (ok) onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-panel new-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>編輯貼文</h3>
          <button type="button" className="modal-close" onClick={onCancel} aria-label="關閉">
            ✕
          </button>
        </div>

        <div className="new-post-body">
          <div className="new-post-section">
            <p className="new-post-label">文案</p>
            <textarea
              className="new-post-textarea"
              placeholder="輸入這篇貼文的介紹文案…"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
            />
          </div>

          <div className="new-post-section">
            <p className="new-post-label">行程地點</p>
            <input
              className="new-post-input"
              type="text"
              placeholder="輸入地點名稱"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <button type="button" className="new-post-submit" onClick={handleSave} disabled={saving}>
          {saving ? '儲存中…' : '儲存變更'}
        </button>
      </div>
    </div>
  );
}

/** 右上角 ☰ 選單：點外面或按 Esc 關閉（跟個人主頁的狀態選單同樣做法） */
function PostMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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
    <div className="post-detail-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="post-detail-menu"
        aria-label="貼文選項"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        ☰
      </button>
      {open && (
        <ul className="post-detail-menu-list" role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              ✎ 編輯貼文
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="is-danger"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
            >
              🗑 刪除貼文
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

function PostDetail({ post, onClose, isOwner, onUpdate, onDelete }: PostDetailProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete || deleting) return;
    if (!confirm('確定要刪除這篇貼文嗎？刪除後無法復原。')) return;
    setDeleting(true);
    try {
      const ok = await onDelete();
      if (ok) onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="card post-detail">
      <div className="post-detail-header">
        <button type="button" className="back-btn" onClick={onClose} aria-label="返回">
          ‹
        </button>
        {isOwner && onUpdate && onDelete && (
          <PostMenu onEdit={() => setEditing(true)} onDelete={handleDelete} />
        )}
      </div>

      <div className="post-detail-author">
        {post.authorAvatar ? (
          <img className="post-detail-avatar" src={post.authorAvatar} alt={post.authorName} />
        ) : (
          <div className="post-detail-avatar editable-image-empty" />
        )}
        <div className="post-detail-author-text">
          <strong>{post.authorName || '匿名旅人'}</strong>
        </div>
      </div>

      {/* 貼文內頁顯示完整照片（不裁切），首頁卡片才用固定比例 */}
      {post.media && (
        <div className="post-detail-media">
          {post.mediaType === 'video' ? (
            <video src={post.media} controls className="post-detail-video" />
          ) : (
            <img src={post.media} alt={post.caption || '貼文照片'} className="post-detail-image" />
          )}
        </div>
      )}

      {post.taggedFriends.length > 0 && (
        <div className="tag-row post-detail-tags">
          {post.taggedFriends.map((name, i) => (
            <span key={name} className={`tag-pill tag-pill-${i % 3}`}>
              {name}
            </span>
          ))}
        </div>
      )}

      <div className="post-detail-location">
        <p className="post-detail-location-text">{post.authorName || '匿名旅人'}</p>
      </div>

      {post.location && (
        <p className="post-detail-caption-label">{post.location}</p>
      )}

      {post.caption && (
        <div className="post-detail-caption">
          <p className="post-detail-caption-text">{post.caption}</p>
        </div>
      )}

      {editing && onUpdate && (
        <EditPostModal post={post} onCancel={() => setEditing(false)} onSave={onUpdate} />
      )}
    </section>
  );
}

export default PostDetail;
