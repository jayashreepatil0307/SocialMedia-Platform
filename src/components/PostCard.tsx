import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Repeat2, Share2, MoreHorizontal, Trash2 } from 'lucide-react';
import type { Post } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';
import { displayName, displayHandle, timeAgo } from '@/lib/helpers';
import { toggleLike, deletePost, createNotification, getLikeCounts, getCommentCounts, getLikedPostIds } from '@/lib/api';
import type { Page } from '@/App';

interface PostCardProps {
  post: Post;
  onOpenProfile?: (userId: string) => void;
  onOpenComments?: (postId: string) => void;
  onSharePost?: (post: Post) => void;
  onRepost?: (post: Post) => void;
  onDeleted?: (postId: string) => void;
  onNavigate?: (page: Page) => void;
}

export default function PostCard({ post, onOpenProfile, onOpenComments, onSharePost, onRepost, onDeleted }: PostCardProps) {
  const { user, profile } = useAuth();
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0);
  const [commentCount, setCommentCount] = useState(post.comment_count ?? 0);
  const [liked, setLiked] = useState(post.liked_by_me ?? false);
  const [showMenu, setShowMenu] = useState(false);
  const [animatingLike, setAnimatingLike] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const [likeMap, commentMap, likedSet] = await Promise.all([
        getLikeCounts([post.id]),
        getCommentCounts([post.id]),
        user ? getLikedPostIds([post.id], user.id) : Promise.resolve(new Set<string>()),
      ]);
      if (!active) return;
      setLikeCount(likeMap.get(post.id) ?? 0);
      setCommentCount(commentMap.get(post.id) ?? 0);
      setLiked(likedSet.has(post.id));
    })();
    return () => { active = false; };
  }, [post.id, user]);

  async function handleLike() {
    if (!user) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    if (!wasLiked) {
      setAnimatingLike(true);
      setTimeout(() => setAnimatingLike(false), 600);
    }
    try {
      await toggleLike(post.id, user.id);
      if (!wasLiked && post.author_id !== user.id) {
        await createNotification({
          user_id: post.author_id,
          actor_id: user.id,
          type: 'like',
          post_id: post.id,
        });
      }
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    }
  }

  async function handleDelete() {
    setShowMenu(false);
    try {
      await deletePost(post.id);
      onDeleted?.(post.id);
    } catch {
      // ignore
    }
  }

  async function handleRepost() {
    if (!user) return;
    onRepost?.(post);
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard?.writeText(url);
    setShowMenu(false);
  }

  const isOwn = user?.id === post.author_id;
  const author = post.author;

  return (
    <article className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 hover-lift animate-fade-in-up">
      {/* Repost indicator */}
      {post.repost_of_id && (
        <div className="flex items-center gap-2 px-4 pt-3 text-sm text-slate-400">
          <Repeat2 className="w-4 h-4" />
          <span>Reposted</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        <Avatar profile={author} size="md" onClick={() => onOpenProfile?.(post.author_id)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onOpenProfile?.(post.author_id)}
              className="font-semibold text-slate-800 hover:underline truncate"
            >
              {displayName(author)}
            </button>
            <span className="text-slate-400 text-sm shrink-0">{displayHandle(author?.username ?? null)}</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-400 text-sm">{timeAgo(post.created_at)}</span>
          </div>
          {author?.location && (
            <p className="text-xs text-slate-400 mt-0.5">{author.location}</p>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu((s) => !s)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 w-44 animate-scale-in">
                <button onClick={handleCopyLink} className="w-full px-4 py-2 text-sm text-left text-slate-600 hover:bg-slate-50">
                  Copy link
                </button>
                {isOwn && (
                  <button onClick={handleDelete} className="w-full px-4 py-2 text-sm text-left text-rose-600 hover:bg-rose-50">
                    Delete post
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-slate-700 whitespace-pre-wrap break-words leading-relaxed">{post.content}</p>
        </div>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="px-4 pb-3">
          <img src={post.image_url} alt="" className="w-full rounded-xl max-h-[500px] object-cover" />
        </div>
      )}

      {/* Reposted original post */}
      {post.repost_of && (
        <div className="mx-4 mb-3 border border-slate-200 rounded-xl p-3 bg-slate-50">
          <div className="flex items-center gap-2 mb-2">
            <Avatar profile={post.repost_of.author} size="xs" onClick={() => onOpenProfile?.(post.repost_of!.author_id)} />
            <span className="font-semibold text-sm text-slate-700">{displayName(post.repost_of.author)}</span>
            <span className="text-xs text-slate-400">{timeAgo(post.repost_of.created_at)}</span>
          </div>
          {post.repost_of.content && <p className="text-sm text-slate-600 mb-2">{post.repost_of.content}</p>}
          {post.repost_of.image_url && <img src={post.repost_of.image_url} alt="" className="w-full rounded-lg max-h-64 object-cover" />}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-2 py-2 border-t border-slate-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-rose-50 ${
            liked ? 'text-rose-500' : 'text-slate-500'
          }`}
        >
          <Heart className={`w-4.5 h-4.5 transition-transform ${animatingLike ? 'animate-heart-pop' : ''}`} style={{ width: 18, height: 18 }} fill={liked ? 'currentColor' : 'none'} />
          <span>{likeCount > 0 && likeCount}</span>
        </button>

        <button
          onClick={() => onOpenComments?.(post.id)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-blue-50 transition-all"
        >
          <MessageCircle className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          <span>{commentCount > 0 && commentCount}</span>
        </button>

        <button
          onClick={handleRepost}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-accent-50 transition-all"
        >
          <Repeat2 className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
        </button>

        <button
          onClick={() => onSharePost?.(post)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-violet-50 transition-all"
        >
          <Share2 className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
        </button>

        {profile && (
          <div className="ml-auto">
            <Avatar profile={profile} size="xs" />
          </div>
        )}
      </div>
    </article>
  );
}
