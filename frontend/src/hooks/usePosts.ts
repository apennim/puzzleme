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
  /** 發文者的 auth.uid()；舊貼文對不回作者時為空字串 */
  authorId: string;
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
  author_id: string | null;
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
    authorId: row.author_id ?? '',
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

  /**
   * 只能改自己的貼文（RLS 限制 author_id = auth.uid()）。
   * 權限不符時 Supabase 不會回錯誤、只是改到 0 筆，所以用 .select() 檢查有沒有真的改到。
   */
  const updatePost = async (id: string, patch: { caption: string; location: string }): Promise<boolean> => {
    const { data, error } = await supabase
      .from('trip_posts')
      .update({ caption: patch.caption, location: patch.location })
      .eq('id', id)
      .select();

    if (error || !data?.length) {
      console.error('編輯貼文失敗', error);
      alert('編輯失敗：只能編輯自己發的貼文，或請檢查網路連線後再試一次。');
      return false;
    }

    const updated = fromRow(data[0] as TripPostRow);
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return true;
  };

  const deletePost = async (id: string): Promise<boolean> => {
    const { data, error } = await supabase.from('trip_posts').delete().eq('id', id).select('id');

    if (error || !data?.length) {
      console.error('刪除貼文失敗', error);
      alert('刪除失敗：只能刪除自己發的貼文，或請檢查網路連線後再試一次。');
      return false;
    }

    setPosts((prev) => prev.filter((p) => p.id !== id));
    return true;
  };

  return { posts, addPost, updatePost, deletePost, loading };
}
