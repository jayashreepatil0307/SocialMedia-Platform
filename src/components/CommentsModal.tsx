import { useState, useEffect, useRef } from 'react';
import { X, Send, Trash2 } from 'lucide-react';
import type { Comment } from '@/types';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';
import { displayName, timeAgo } from '@/lib/helpers';
import { getComments, addComment, deleteComment, createNotification } from '@/lib/api';

interface CommentsModalProps {
  postId: string | null;
  postAuthorId: string | null;
  onClose: () => void;
}

export default function CommentsModal({ postId, postAuthorId, onClose }: CommentsModalProps) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    getComments(postId).then((c) => {
      setComments(c);
      setLoading(false);
    });
  }, [postId]);

  async function handleSend() {
    if (!text.trim() || !user || !postId) return;
    setSending(true);
    const content = text.trim();
    setText('');
    try {
      const comment = await addComment(postId, content);
      if (comment) {
        setComments((prev) => [...prev, comment]);
        if (postAuthorId && postAuthorId !== user.id) {
          await createNotification({
            user_id: postAuthorId,
            actor_id: user.id,
            type: 'comment',
            post_id: postId,
          });
        }
      }
    } catch {
      setText(content);
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // ignore
    }
  }

  if (!postId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm backdrop-enter" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[80vh] flex flex-col modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Comments</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center text-slate-400 py-8 text-sm">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <p className="text-sm">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 animate-fade-in-up">
                <Avatar profile={comment.author} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="bg-slate-100 rounded-2xl px-3.5 py-2.5">
                    <p className="font-semibold text-sm text-slate-800">{displayName(comment.author)}</p>
                    <p className="text-sm text-slate-600 mt-0.5 break-words">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 px-2">
                    <span className="text-xs text-slate-400">{timeAgo(comment.created_at)}</span>
                    {user?.id === comment.author_id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-100 flex items-center gap-3">
          <Avatar profile={profile} size="sm" />
          <div className="flex-1 flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2.5">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sending && handleSend()}
              placeholder="Write a comment..."
              className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="text-brand-500 disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
