import { useProfile, type ProfilePost as ProfilePostData } from '../hooks/useProfile';
import EditableImage from './EditableImage';
import EditableText from './EditableText';

const PROFILE_POST_COUNT = 3;

interface ProfilePostProps {
  post: ProfilePostData | undefined;
  onChange: (patch: Partial<ProfilePostData>) => void;
}

function ProfilePost({ post, onChange }: ProfilePostProps) {
  const image = post?.image ?? '';
  const caption = post?.caption ?? '';
  const badge = post?.badge ?? '';
  const setImage = (value: string) => onChange({ image: value });
  const setCaption = (value: string) => onChange({ caption: value });
  const setBadge = (value: string) => onChange({ badge: value });

  return (
    <EditableImage value={image} onChange={setImage} alt="貼文照片" className="profile-post">
      <div className="profile-post-gradient" />
      <div className="profile-post-caption-wrap" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <EditableText
          value={caption}
          onChange={setCaption}
          placeholder="Interview Texts"
          className="profile-post-caption"
        />
      </div>
      <div className="profile-post-badge" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
        <EditableText value={badge} onChange={setBadge} placeholder="日期" className="profile-post-badge-text" />
      </div>
    </EditableImage>
  );
}

function ProfilePage() {
  // 個人資料存在 Supabase profiles 表，跟著帳號走：重新登入、換裝置都還在
  const { avatarUrl: avatar, setAvatar, nickname: name, status, updateProfile, profilePosts, setProfilePost } =
    useProfile();
  const setName = (value: string) => updateProfile({ nickname: value });
  const setStatus = (value: string) => updateProfile({ status: value });

  return (
    <section className="card profile-page">
      <div className="profile-header">
        <EditableImage value={avatar} onChange={setAvatar} alt="個人頭像" className="profile-avatar" compact />
        <div className="profile-header-text">
          <EditableText value={name} onChange={setName} placeholder="你的名字" className="profile-name" />
          <div className="profile-status">
            <EditableText value={status} onChange={setStatus} placeholder="搜尋咖啡廳中..." className="profile-status-text" />
          </div>
        </div>
      </div>

      <div className="profile-post-list">
        {Array.from({ length: PROFILE_POST_COUNT }, (_, i) => (
          <ProfilePost key={i} post={profilePosts[i]} onChange={(patch) => setProfilePost(i, patch)} />
        ))}
      </div>
    </section>
  );
}

export default ProfilePage;
