import { useLocalImage } from '../hooks/useLocalImage';
import EditableImage from './EditableImage';
import EditableText from './EditableText';

const BLANK_POSTS = ['profile-post-1', 'profile-post-2', 'profile-post-3'];

function ProfilePost({ postKey }: { postKey: string }) {
  const [image, setImage] = useLocalImage(`${postKey}-image`);
  const [caption, setCaption] = useLocalImage(`${postKey}-caption`);
  const [badge, setBadge] = useLocalImage(`${postKey}-badge`);

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
  const [avatar, setAvatar] = useLocalImage('profile-avatar');
  const [name, setName] = useLocalImage('profile-name');
  const [status, setStatus] = useLocalImage('profile-status');

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
        {BLANK_POSTS.map((key) => (
          <ProfilePost key={key} postKey={key} />
        ))}
      </div>
    </section>
  );
}

export default ProfilePage;
