import { useState, useEffect, useCallback } from 'react';
import { ImagePlus, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';
import PostCard from '@/components/PostCard';
import ShareModal from '@/components/ShareModal';
import CommentsModal from '@/components/CommentsModal';
import { getFeedPosts, createPost } from '@/lib/api';
import type { Post } from '@/types';
import type { Page } from '@/App';

interface FeedProps {
  onOpenProfile: (userId: string) => void;
  onNavigate: (page: Page) => void;
}

export default function Feed({ onOpenProfile, onNavigate }: FeedProps) {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [posting, setPosting] = useState(false);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);
  const [commentsAuthorId, setCommentsAuthorId] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFeedPosts();
      setPosts(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  async function handlePost() {
    if (!text.trim() && !imageUrl.trim()) return;
    setPosting(true);
    try {
      const newPost = await createPost(text.trim(), imageUrl.trim() || null);
      if (newPost) {
        setPosts((prev) => [newPost!, ...prev]);
      }
      setText('');
      setImageUrl('');
      setShowImageInput(false);
    } catch {
      // ignore
    } finally {
      setPosting(false);
    }
  }

  async function handleRepost(post: Post) {
    if (!user) return;
    setSharePost(null);
    try {
      const repost = await createPost('', null, post.id);
      if (repost) {
        setPosts((prev) => [repost!, ...prev]);
      }
    } catch {
      // ignore
    }
  }

  function handleOpenComments(postId: string) {
    const post = posts.find((p) => p.id === postId);
    setCommentsAuthorId(post?.author_id ?? null);
    setCommentsPostId(postId);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Composer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 animate-fade-in-down">
        <div className="flex gap-3">
          <Avatar profile={profile} size="md" />
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              rows={2}
              className="w-full resize-none outline-none text-slate-700 placeholder-slate-400 text-sm bg-transparent"
            />
            {showImageInput && (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL..."
                className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-500"
              />
            )}
            {imageUrl && (
              <img src={imageUrl} alt="" className="mt-2 w-full max-h-48 rounded-lg object-cover" />
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setShowImageInput((s) => !s)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-brand-50"
          >
            <ImagePlus className="w-5 h-5" />
            <span>Photo</span>
          </button>
          <button
            onClick={handlePost}
            disabled={posting || (!text.trim() && !imageUrl.trim())}
            className="px-5 py-2 rounded-full bg-gradient-to-r from-brand-500 via-blue-500 to-accent-500 text-white text-sm font-semibold shadow-md shadow-brand/30 hover:shadow-brand-lg/40 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Post
          </button>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center animate-scale-in">
          <Sparkles className="w-10 h-10 text-brand-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700">Your feed is empty</h3>
          <p className="text-sm text-slate-400 mt-1">Create a post or add friends to see their posts here.</p>
          <button
            onClick={() => onNavigate('search')}
            className="mt-4 px-5 py-2 rounded-full bg-brand-50 text-brand-600 text-sm font-semibold hover:bg-brand-100 transition-colors"
          >
            Find Friends
          </button>
        </div>
      ) : (
        <div className="space-y-4 stagger">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onOpenProfile={onOpenProfile}
              onOpenComments={handleOpenComments}
              onSharePost={setSharePost}
              onRepost={handleRepost}
              onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            />
          ))}
        </div>
      )}

      <ShareModal post={sharePost} onClose={() => setSharePost(null)} onRepost={handleRepost} onNavigate={onNavigate} />
      <CommentsModal postId={commentsPostId} postAuthorId={commentsAuthorId} onClose={() => setCommentsPostId(null)} />
    </div>
  );
}
