import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface UserPost {
  id: string;
  caption: string;
  location: string;
  taggedFriends: string[];
  media: string;
  mediaType: 'image' | 'video' | '';
  authorName: string;
  authorAvatar: string;
  createdAt: number;
}

interface TripPostRow {
  id: string;
  caption: string | null;
  location: string | null;
  tagged_friends: string[] | null;
  media_url: string | null;
  media_type: string | null;
  author_name: string | null;
  author_avatar: string | null;
  created_at: string;
}

function fromRow(row: TripPostRow): UserPost {
  return {
    id: row.id,
    caption: row.caption ?? '',
    location: row.location ?? '',
    taggedFriends: row.tagged_friends ?? [],
    media: row.media_url ?? '',
    mediaType: (row.media_type as UserPost['mediaType']) ?? '',
    authorName: row.author_name ?? '',
    authorAvatar: row.author_avatar ?? '',
    createdAt: new Date(row.created_at).getTime(),
  };
}

/** 行程貼文，集中存在 Supabase（trip_posts），所有試用者共用同一份雲端資料 */
export function usePosts() {
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('trip_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('讀取行程貼文失敗', error);
        } else if (data) {
          setPosts((data as TripPostRow[]).map(fromRow));
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const addPost = async (post: UserPost) => {
    const { data, error } = await supabase
      .from('trip_posts')
      .insert({
        caption: post.caption,
        location: post.location,
        tagged_friends: post.taggedFriends,
        media_url: post.media,
        media_type: post.mediaType,
        author_name: post.authorName,
        author_avatar: post.authorAvatar,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('發布行程貼文失敗', error);
      alert('發布失敗，請檢查網路連線後再試一次。');
      return;
    }

    setPosts((prev) => [fromRow(data as TripPostRow), ...prev]);
  };

  return { posts, addPost, loading };
}
