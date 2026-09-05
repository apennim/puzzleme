import type { UserPost } from '../hooks/usePosts';

interface PostDetailProps {
  post: UserPost;
  onClose: () => void;
}

function PostDetail({ post, onClose }: PostDetailProps) {
  return (
    <section className="card post-detail">
      <div className="post-detail-header">
        <button type="button" className="back-btn" onClick={onClose} aria-label="返回">
          ‹
        </button>
        <button type="button" className="post-detail-menu" aria-label="更多選項">
          ☰
        </button>
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

      {post.media && (
        <div
          className="post-detail-media"
          style={post.mediaType === 'image' ? { backgroundImage: `url(${post.media})` } : undefined}
        >
          {post.mediaType === 'video' && (
            <video src={post.media} controls className="post-detail-video" />
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
    </section>
  );
}

export default PostDetail;
