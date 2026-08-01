import { useState, useEffect } from 'react';
import { UserPlus, Check, X, UserCheck, Loader2, Users, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';
import { getIncomingRequests, getOutgoingRequests, getFriends, acceptFriendRequest, rejectFriendRequest, cancelFriendRequest } from '@/lib/api';
import type { Profile, Friendship } from '@/types';
import { displayName, displayHandle, timeAgo } from '@/lib/helpers';

interface FriendsProps {
  onOpenProfile: (userId: string) => void;
}

type Tab = 'friends' | 'requests' | 'sent';

export default function FriendsPage({ onOpenProfile }: FriendsProps) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<Friendship[]>([]);
  const [outgoing, setOutgoing] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    if (!user) return;
    setLoading(true);
    try {
      const [f, inc, out] = await Promise.all([
        getFriends(user.id),
        getIncomingRequests(user.id),
        getOutgoingRequests(user.id),
      ]);
      setFriends(f);
      setIncoming(inc);
      setOutgoing(out);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [user]);

  async function handleAccept(f: Friendship) {
    if (!user) return;
    try {
      await acceptFriendRequest(f.id, user.id, f.requester_id);
      await loadAll();
    } catch {
      // ignore
    }
  }

  async function handleReject(f: Friendship) {
    try {
      await rejectFriendRequest(f.id);
      setIncoming((prev) => prev.filter((r) => r.id !== f.id));
    } catch {
      // ignore
    }
  }

  async function handleCancel(f: Friendship) {
    if (!user) return;
    try {
      await cancelFriendRequest(user.id, f.addressee_id);
      setOutgoing((prev) => prev.filter((r) => r.id !== f.id));
    } catch {
      // ignore
    }
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'friends', label: 'Friends', count: friends.length },
    { id: 'requests', label: 'Requests', count: incoming.length },
    { id: 'sent', label: 'Sent', count: outgoing.length },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Friends</h1>

      <div className="flex gap-2 mb-5 p-1 bg-white rounded-xl border border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === t.id ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {t.label}
            {t.count ? (
              <span className={`text-xs px-1.5 rounded-full ${tab === t.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                {t.count}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : tab === 'friends' ? (
        friends.length === 0 ? (
          <EmptyState icon={Users} title="No friends yet" subtitle="Search for people and send friend requests to build your network." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
            {friends.map((f) => (
              <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                <Avatar profile={f} size="lg" onClick={() => onOpenProfile(f.id)} />
                <div className="flex-1 min-w-0">
                  <button onClick={() => onOpenProfile(f.id)} className="font-semibold text-slate-800 hover:underline truncate block">
                    {displayName(f)}
                  </button>
                  <p className="text-sm text-slate-400 truncate">{displayHandle(f.username)}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-accent-600 mt-1">
                    <UserCheck className="w-3 h-3" /> Friends
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : tab === 'requests' ? (
        incoming.length === 0 ? (
          <EmptyState icon={UserPlus} title="No friend requests" subtitle="When someone sends you a friend request, it will appear here." />
        ) : (
          <div className="space-y-3 stagger">
            {incoming.map((f) => (
              <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                <Avatar profile={f.requester} size="lg" onClick={() => onOpenProfile(f.requester_id)} />
                <div className="flex-1 min-w-0">
                  <button onClick={() => onOpenProfile(f.requester_id)} className="font-semibold text-slate-800 hover:underline truncate block">
                    {displayName(f.requester)}
                  </button>
                  <p className="text-sm text-slate-400">{displayHandle(f.requester?.username ?? null)}</p>
                  <p className="text-xs text-slate-300 mt-0.5">{timeAgo(f.created_at)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(f)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                  >
                    <Check className="w-4 h-4" /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(f)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : outgoing.length === 0 ? (
          <EmptyState icon={Clock} title="No sent requests" subtitle="Friend requests you send will appear here until they're accepted." />
        ) : (
          <div className="space-y-3 stagger">
            {outgoing.map((f) => (
              <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                <Avatar profile={f.addressee} size="lg" onClick={() => onOpenProfile(f.addressee_id)} />
                <div className="flex-1 min-w-0">
                  <button onClick={() => onOpenProfile(f.addressee_id)} className="font-semibold text-slate-800 hover:underline truncate block">
                    {displayName(f.addressee)}
                  </button>
                  <p className="text-sm text-slate-400">{displayHandle(f.addressee?.username ?? null)}</p>
                  <p className="text-xs text-amber-500 mt-0.5">Pending · {timeAgo(f.created_at)}</p>
                </div>
                <button
                  onClick={() => handleCancel(f)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: typeof Users; title: string; subtitle: string }) {
  return (
    <div className="text-center py-16 text-slate-400 animate-fade-in">
      <Icon className="w-10 h-10 mx-auto mb-3 opacity-50 animate-float" />
      <h3 className="font-semibold text-slate-600">{title}</h3>
      <p className="text-sm mt-1 max-w-xs mx-auto">{subtitle}</p>
    </div>
  );
}
