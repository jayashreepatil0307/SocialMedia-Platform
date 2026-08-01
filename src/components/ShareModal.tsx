import { useState, useEffect } from 'react';
import { X, Repeat2, Link2, Send } from 'lucide-react';
import type { Post, Profile } from '@/types';
import Avatar from '@/components/Avatar';
import { displayName } from '@/lib/helpers';
import { getFriends, sendMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Page } from '@/App';

interface ShareModalProps {
  post: Post | null;
  onClose: () => void;
  onRepost: (post: Post) => void;
  onNavigate?: (page: Page) => void;
}

export default function ShareModal({ post, onClose, onRepost }: ShareModalProps) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (post && user) {
      getFriends(user.id).then((f) => {
        setFriends(f);
        setLoading(false);
      });
    }
  }, [post, user]);

  if (!post) return null;

  async function handleShareToFriend(friend: Profile) {
    if (!user) return;
    setSending(friend.id);
    try {
      await sendMessage(user.id, friend.id, '', null, post!.id);
      setCopied(true);
      setSending(null);
      setTimeout(onClose, 1000);
    } catch {
      setSending(null);
    }
  }

  function handleCopyLink() {
    const url = `${window.location.origin}/post/${post!.id}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm backdrop-enter" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[80vh] flex flex-col modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Share Post</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {copied && (
          <div className="mx-4 mt-3 bg-accent-50 text-accent-700 text-sm rounded-lg px-4 py-2 animate-fade-in-down">
            Shared successfully!
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 p-4">
          <button
            onClick={() => onRepost(post!)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-accent-50 hover:bg-accent-100 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-accent-500 flex items-center justify-center">
              <Repeat2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700">Repost</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700">Copy Link</span>
          </button>
        </div>

        <div className="px-4 pb-2">
          <h3 className="text-sm font-semibold text-slate-500 mb-2">Send to friends</h3>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="text-center text-slate-400 py-8 text-sm">Loading friends...</div>
          ) : friends.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">
              No friends yet. Add friends to share posts with them.
            </div>
          ) : (
            <div className="space-y-1">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => handleShareToFriend(friend)}
                  disabled={sending !== null}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <Avatar profile={friend} size="sm" />
                  <span className="flex-1 text-left font-medium text-slate-700 text-sm">{displayName(friend)}</span>
                  {sending === friend.id ? (
                    <span className="text-xs text-slate-400">Sending...</span>
                  ) : (
                    <Send className="w-4 h-4 text-brand-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
