import { useLocalImage } from '../hooks/useLocalImage';
import type { UserPost } from '../hooks/usePosts';
import EditableImage from './EditableImage';
import EditableText from './EditableText';

export interface FeedPostMeta {
  id: string;
  username: string;
}

const posts: FeedPostMeta[] = [
  { id: 'post-1', username: 'J0anna' },
  { id: 'post-2', username: 'Muoooo1' },
];

function DynamicFeedPost({ post }: { post: UserPost }) {
  return (
    <article className="feed-post">
      <div className="feed-post-user">
        {post.authorAvatar ? (
          <img className="feed-post-avatar" src={post.authorAvatar} alt={post.authorName} />
        ) : (
          <div className="feed-post-avatar editable-image-empty" />
        )}
        <strong>{post.authorName}</strong>
        {post.location && <span className="feed-post-location">📍 {post.location}</span>}
      </div>

      {post.media ? (
        <div
          className="feed-post-media"
          style={post.mediaType === 'image' ? { backgroundImage: `url(${post.media})` } : undefined}
        >
          {post.mediaType === 'video' && <video src={post.media} controls className="feed-post-video" />}
          {post.caption && (
            <div className="feed-post-caption">
              <span className="feed-post-caption-text">{post.caption}</span>
            </div>
          )}
        </div>
      ) : (
        post.caption && (
          <div className="feed-post-caption feed-post-caption-standalone">
            <span className="feed-post-caption-text">{post.caption}</span>
          </div>
        )
      )}

      {post.taggedFriends.length > 0 && (
        <p className="feed-post-tags">與 {post.taggedFriends.join('、')} 一起</p>
      )}
    </article>
  );
}

function FeedPost({ post }: { post: FeedPostMeta }) {
  const [avatar, setAvatar] = useLocalImage(`home-avatar-${post.id}`);
  const [image, setImage] = useLocalImage(`home-photo-${post.id}`);
  const [caption, setCaption] = useLocalImage(`home-caption-${post.id}`);

  return (
    <article className="feed-post">
      <div className="feed-post-user">
        <EditableImage
          value={avatar}
          onChange={setAvatar}
          alt={`${post.username} 頭像`}
          className="feed-post-avatar"
          compact
        />
        <strong>{post.username}</strong>
      </div>
      <EditableImage value={image} onChange={setImage} alt="貼文照片" className="feed-post-media">
        <div
          className="feed-post-caption"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <EditableText
            value={caption}
            onChange={setCaption}
            placeholder="輸入介紹文案"
            className="feed-post-caption-text"
          />
        </div>
      </EditableImage>
    </article>
  );
}

interface HomeFeedProps {
  posts: UserPost[];
  userAvatarKey?: string;
}

function HomeFeed({ posts: dynamicPosts, userAvatarKey = 'home-my-avatar' }: HomeFeedProps) {
  const [myAvatar, setMyAvatar] = useLocalImage(userAvatarKey);

  return (
    <section className="card home-feed">
      <div className="home-feed-header">
        <EditableImage value={myAvatar} onChange={setMyAvatar} alt="我的頭像" className="home-feed-avatar" compact />
        <p className="home-feed-prompt">Where you wanna go today?</p>
        <button className="home-feed-search" aria-label="搜尋景點">🔖</button>
      </div>

      <div className="home-feed-list">
        {dynamicPosts.map((post) => (
          <DynamicFeedPost key={post.id} post={post} />
        ))}
        {posts.map((post) => (
          <FeedPost key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

export default HomeFeed;
