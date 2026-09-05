import { useLocalImage } from '../hooks/useLocalImage';
import type { UserPost } from '../hooks/usePosts';
import EditableImage from './EditableImage';

const CAPTION_PREVIEW_LIMIT = 15;

function truncateCaption(text: string) {
  if (text.length <= CAPTION_PREVIEW_LIMIT) return text;
  return `${text.slice(0, CAPTION_PREVIEW_LIMIT)}…`;
}

function DynamicFeedPost({ post, onOpen }: { post: UserPost; onOpen: () => void }) {
  return (
    <article className="feed-post" onClick={onOpen} role="button" tabIndex={0}>
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
              <span className="feed-post-caption-text">{truncateCaption(post.caption)}</span>
            </div>
          )}
        </div>
      ) : (
        post.caption && (
          <div className="feed-post-caption feed-post-caption-standalone">
            <span className="feed-post-caption-text">{truncateCaption(post.caption)}</span>
          </div>
        )
      )}

      {post.taggedFriends.length > 0 && (
        <p className="feed-post-tags">與 {post.taggedFriends.join('、')} 一起</p>
      )}
    </article>
  );
}

interface HomeFeedProps {
  posts: UserPost[];
  userAvatarKey?: string;
  onOpenFavorites?: () => void;
  onOpenPost?: (id: string) => void;
}

function HomeFeed({ posts: dynamicPosts, userAvatarKey = 'home-my-avatar', onOpenFavorites, onOpenPost }: HomeFeedProps) {
  const [myAvatar, setMyAvatar] = useLocalImage(userAvatarKey);

  return (
    <section className="card home-feed">
      <div className="home-feed-header">
        <EditableImage value={myAvatar} onChange={setMyAvatar} alt="我的頭像" className="home-feed-avatar" compact />
        <p className="home-feed-prompt">Where you wanna go today?</p>
        <button className="home-feed-search" aria-label="收藏盒" onClick={onOpenFavorites}>🔖</button>
      </div>

      <div className="home-feed-list">
        {dynamicPosts.length === 0 && (
          <p className="home-feed-empty">尚無行程貼文，點擊右下角「＋ 新增行程貼文」發布第一篇吧！</p>
        )}
        {dynamicPosts.map((post) => (
          <DynamicFeedPost key={post.id} post={post} onOpen={() => onOpenPost?.(post.id)} />
        ))}
      </div>
    </section>
  );
}

export default HomeFeed;
