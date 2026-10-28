import { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import type { UserPost } from '../hooks/usePosts';
import { supabase, TRIP_MEDIA_BUCKET } from '../lib/supabaseClient';
import EditableImage from './EditableImage';
import ImageCropper from './ImageCropper';

const FRIEND_OPTIONS = ['J0anna', 'Muoooo1', '北風社小編', 'Mitty'];

interface NewPostModalProps {
  onClose: () => void;
  onSubmit: (post: UserPost) => void | Promise<void>;
}

function NewPostModal({ onClose, onSubmit }: NewPostModalProps) {
  const { nickname: myName, avatarUrl: myAvatar, setAvatar: setMyAvatar } = useProfile();

  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [taggedFriends, setTaggedFriends] = useState<string[]>([]);
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaFile, setMediaFile] = useState<File | undefined>(undefined);
  const [mediaType, setMediaType] = useState<'image' | 'video' | ''>('');
  const [submitting, setSubmitting] = useState(false);
  /** 有值時顯示裁切視窗；originalImage 保留原圖，讓使用者可以「重新裁切」 */
  const [cropSource, setCropSource] = useState('');
  const [originalImage, setOriginalImage] = useState('');

  const toggleFriend = (name: string) => {
    setTaggedFriends((prev) => (prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]));
  };

  const handleMediaFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    if (file.type.startsWith('video')) {
      setMediaFile(file);
      setMediaType('video');
      reader.onload = () => setMediaPreview(String(reader.result));
    } else {
      // 照片先打開裁切視窗，確認裁切後才當成要上傳的檔案
      reader.onload = () => setCropSource(String(reader.result));
    }
    reader.readAsDataURL(file);
  };

  const handleCropped = (blob: Blob) => {
    setMediaFile(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
    setMediaType('image');
    setMediaPreview(URL.createObjectURL(blob));
    setOriginalImage(cropSource);
    setCropSource('');
  };

  const handleSubmit = async () => {
    if (!caption.trim() && !mediaFile) {
      alert('請至少輸入文案，或上傳一張照片／影片');
      return;
    }

    setSubmitting(true);
    try {
      let mediaUrl = '';
      if (mediaFile) {
        const path = `${Date.now()}-${mediaFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from(TRIP_MEDIA_BUCKET)
          .upload(path, mediaFile);

        if (uploadError) {
          console.error('媒體上傳失敗', uploadError);
          alert('照片／影片上傳失敗，請檢查網路連線後再試一次。');
          return;
        }

        mediaUrl = supabase.storage.from(TRIP_MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
      }

      await onSubmit({
        id: `post-${Date.now()}`,
        caption: caption.trim(),
        location: location.trim(),
        taggedFriends,
        media: mediaUrl,
        mediaType,
        authorName: myName.trim() || '匿名旅人',
        authorAvatar: myAvatar,
        authorId: '', // 由資料庫的預設值 auth.uid() 自動帶入
        createdAt: Date.now(),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel new-post-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>新增行程貼文</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="關閉">
            ✕
          </button>
        </div>

        <div className="new-post-body">
          <div className="new-post-section">
            <p className="new-post-label">個人資料</p>
            <div className="new-post-profile">
              <EditableImage
                value={myAvatar}
                onChange={setMyAvatar}
                alt="我的頭像"
                className="feed-post-avatar"
                compact
              />
              <span className="new-post-author-name">{myName || '匿名旅人'}</span>
            </div>
          </div>

          <div className="new-post-section">
            <p className="new-post-label">上傳照片與影音</p>
            <label className="new-post-media">
              {mediaPreview ? (
                mediaType === 'video' ? (
                  <video src={mediaPreview} controls className="new-post-media-preview" />
                ) : (
                  <img src={mediaPreview} alt="貼文預覽" className="new-post-media-preview" />
                )
              ) : (
                <span className="new-post-media-placeholder">
                  <span className="editable-image-plus">＋</span>
                  點擊上傳照片或影片
                </span>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={(e) => {
                  handleMediaFile(e.target.files?.[0]);
                  e.target.value = ''; // 讓同一張照片可以再選一次
                }}
              />
            </label>
            {mediaType === 'image' && originalImage && (
              <button type="button" className="new-post-recrop" onClick={() => setCropSource(originalImage)}>
                ✂ 重新裁切
              </button>
            )}
          </div>

          <div className="new-post-section">
            <p className="new-post-label">文案</p>
            <textarea
              className="new-post-textarea"
              placeholder="輸入這篇貼文的介紹文案…"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
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

          <div className="new-post-section">
            <p className="new-post-label">標記好友</p>
            <div className="new-post-friend-chips">
              {FRIEND_OPTIONS.map((name) => (
                <button
                  type="button"
                  key={name}
                  className={taggedFriends.includes(name) ? 'friend-chip active' : 'friend-chip'}
                  onClick={() => toggleFriend(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="button" className="new-post-submit" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '發布中…' : '發布貼文'}
        </button>
      </div>

      {cropSource && (
        <ImageCropper src={cropSource} onCancel={() => setCropSource('')} onConfirm={handleCropped} />
      )}
    </div>
  );
}

export default NewPostModal;
