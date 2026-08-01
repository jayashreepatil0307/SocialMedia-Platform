import { useState, useEffect } from 'react';
import { Search as SearchIcon, Loader2, Hash, UserPlus, X, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';
import PostCard from '@/components/PostCard';
import { searchProfiles, searchPosts, searchHashtags, sendFriendRequest, cancelFriendRequest, getFriendshipStatus, getFriends } from '@/lib/api';
import type { Profile, Post } from '@/types';
import { displayName, displayHandle } from '@/lib/helpers';
import type { Page } from '@/App';

interface SearchProps {
  onOpenProfile: (userId: string) => void;
  onNavigate: (page: Page) => void;
}

type Tab = 'people' | 'posts' | 'hashtags';

export default function SearchPage({ onOpenProfile }: SearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('people');
  const [people, setPeople] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtags, setHashtags] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, string>>({});
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    getFriends(user.id).then((friends) => {
      setFriendIds(new Set(friends.map((f) => f.id)));
    });
  }, [user]);

  useEffect(() => {
    if (!query.trim()) {
      setPeople([]);
      setPosts([]);
      setHashtags([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      const q = query.trim();
      if (tab === 'people') {
        searchProfiles(q).then(async (results) => {
          setPeople(results.filter((p) => p.id !== user?.id));
          const statuses: Record<string, string> = {};
          for (const p of results) {
            if (p.id !== user?.id) {
              const { status } = await getFriendshipStatus(user!.id, p.id);
              if (status) statuses[p.id] = status;
            }
          }
          setFriendStatuses(statuses);
          setLoading(false);
        });
      } else if (tab === 'posts') {
        searchPosts(q).then((r) => {
          setPosts(r);
          setLoading(false);
        });
      } else {
        const tag = q.replace(/^#/, '');
        searchHashtags(tag).then((r) => {
          setHashtags(r);
          setLoading(false);
        });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [query, tab, user]);

  async function handleFriendAction(profile: Profile) {
    if (!user) return;
    const status = friendStatuses[profile.id];
    const isFriend = friendIds.has(profile.id);

    if (isFriend) return;

    if (status === 'pending') {
      // Cancel request
      await cancelFriendRequest(user.id, profile.id);
      setFriendStatuses((prev) => {
        const next = { ...prev };
        delete next[profile.id];
        return next;
      });
    } else {
      // Send request
      await sendFriendRequest(user.id, profile.id);
      setFriendStatuses((prev) => ({ ...prev, [profile.id]: 'pending' }));
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'people', label: 'People' },
    { id: 'posts', label: 'Posts' },
    { id: 'hashtags', label: 'Hashtags' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Search</h1>

      {/* Search bar */}
      <div className="relative mb-4 animate-fade-in-down">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tab === 'hashtags' ? 'Search hashtags (e.g. travel)' : 'Search...'}
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-700 placeholder-slate-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 p-1 bg-white rounded-xl border border-slate-200 animate-fade-in">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.id ? 'bg-brand-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {!query.trim() ? (
        <div className="text-center py-16 text-slate-400 animate-fade-in">
          <SearchIcon className="w-10 h-10 mx-auto mb-3 opacity-50 animate-float" />
          <p>Search for people, posts, or hashtags</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : tab === 'people' ? (
        <div className="space-y-2 stagger">
          {people.length === 0 ? (
            <p className="text-center text-slate-400 py-12 text-sm">No people found</p>
          ) : (
            people.map((p) => {
              const isFriend = friendIds.has(p.id);
              const status = friendStatuses[p.id];
              return (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                  <Avatar profile={p} size="md" onClick={() => onOpenProfile(p.id)} />
                  <div className="flex-1 min-w-0">
                    <button onClick={() => onOpenProfile(p.id)} className="font-semibold text-slate-800 hover:underline truncate block">
                      {displayName(p)}
                    </button>
                    <p className="text-sm text-slate-400">{displayHandle(p.username)}</p>
                  </div>
                  {isFriend ? (
                    <span className="flex items-center gap-1.5 text-sm text-accent-600 font-medium px-3 py-2">
                      <UserCheck className="w-4 h-4" /> Friends
                    </span>
                  ) : status === 'pending' ? (
                    <button
                      onClick={() => handleFriendAction(p)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFriendAction(p)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" /> Add
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : tab === 'posts' ? (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <p className="text-center text-slate-400 py-12 text-sm">No posts found</p>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} onOpenProfile={onOpenProfile} />)
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {hashtags.length === 0 ? (
            <p className="text-center text-slate-400 py-12 text-sm">No hashtags found</p>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Hash className="w-4 h-4" />
                <span>Posts containing #{query.replace(/^#/, '')}</span>
              </div>
              {hashtags.map((post) => <PostCard key={post.id} post={post} onOpenProfile={onOpenProfile} />)}
            </>
          )}
        </div>
      )}
    </div>
  );
}
