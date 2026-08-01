import { useState, useEffect, useCallback } from 'react';
import { Camera, Edit3, MapPin, Calendar, UserPlus, UserCheck, X, Loader2, MessageCircle, Grid3x3, Users as UsersIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';
import PostCard from '@/components/PostCard';
import ShareModal from '@/components/ShareModal';
import CommentsModal from '@/components/CommentsModal';
import { getProfile, getPostsByAuthor, getFriends, getMutualFriends, getFriendshipStatus, sendFriendRequest, cancelFriendRequest, acceptFriendRequest, updateProfile, createPost } from '@/lib/api';
import type { Profile, Post, Friendship } from '@/types';
import { displayName, displayHandle, timeAgo } from '@/lib/helpers';
import type { Page } from '@/App';

interface ProfilePageProps {
  userId: string;
  onOpenProfile: (userId: string) => void;
  onNavigate: (page: Page) => void;
}

type Tab = 'posts' | 'photos' | 'friends';

export default function ProfilePage({ userId, onOpenProfile, onNavigate }: ProfilePageProps) {
  const { user: currentUser, profile: myProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);
  const [mutualFriends, setMutualFriends] = useState<Profile[]>([]);
  const [friendship, setFriendship] = useState<Friendship | null>(  null);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('posts');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', username: '', bio: '', location: '', avatar_url: '', cover_url: '' });
  const [saving, setSaving] = useState(false);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const isOwn = currentUser?.id === userId;

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [p, userPosts] = await Promise.all([
        getProfile(userId),
        getPostsByAuthor(userId),
      ]);
      setProfile(p);
      setPosts(userPosts);

      const f = await getFriends(userId);
      setFriends(f);

      if (!isOwn && currentUser) {
        const { status, friendship: fs } = await getFriendshipStatus(currentUser.id, userId);
        setFriendshipStatus(status);
        setFriendship(fs);
        const mutual = await getMutualFriends(currentUser.id, userId);
        setMutualFriends(mutual);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser, isOwn]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function startEdit() {
    if (!profile) return;
    setEditForm({
      full_name: profile.full_name ?? '',
      username: profile.username ?? '',
      bio: profile.bio ?? '',
      location: profile.location ?? '',
      avatar_url: profile.avatar_url ?? '',
      cover_url: profile.cover_url ?? '',
    });
    setEditing(true);
  }

  async function handleSave() {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateProfile(currentUser.id, editForm);
      await refreshProfile();
      await loadProfile();
      setEditing(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleFriendAction() {
    if (!currentUser || !profile) return;

    if (friendshipStatus === 'accepted') return;

    if (friendshipStatus === 'pending') {
      // Check if we sent or received
      if (friendship?.requester_id === currentUser.id) {
        // Cancel
        await cancelFriendRequest(currentUser.id, userId);
        setFriendshipStatus(null);
        setFriendship(null);
      } else {
        // Accept incoming
        if (friendship) {
          await acceptFriendRequest(friendship.id, currentUser.id, friendship.requester_id);
          setFriendshipStatus('accepted');
        }
      }
    } else {
      // Send request
      await sendFriendRequest(currentUser.id, userId);
      setFriendshipStatus('pending');
    }
  }

  function handleOpenComments(postId: string) {
    setCommentsPostId(postId);
  }

  async function handleRepost(post: Post) {
    if (!currentUser) return;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-24 text-slate-400">Profile not found</div>;
  }

  const photos = posts.filter((p) => p.image_url).map((p) => p.image_url!);

  const tabs: { id: Tab; label: string; icon: typeof Grid3x3; count: number }[] = [
    { id: 'posts', label: 'Posts', icon: Grid3x3, count: posts.length },
    { id: 'photos', label: 'Photos', icon: Camera, count: photos.length },
    { id: 'friends', label: 'Friends', icon: UsersIcon, count: friends.length },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-6">
      {/* Cover */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-brand-400 via-blue-500 to-accent-500 rounded-b-2xl overflow-hidden gradient-animated">
        {profile.cover_url && (
          <img src={profile.cover_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>

      {/* Profile header */}
      <div className="px-4 md:px-6 -mt-16 md:-mt-20 relative animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="relative">
            <div className="rounded-full border-4 border-white overflow-hidden shadow-lg">
              <Avatar profile={profile} size="2xl" />
            </div>
          </div>

          <div className="flex-1 md:pb-2">
            <h1 className="text-2xl font-bold text-slate-800">{displayName(profile)}</h1>
            <p className="text-slate-400">{displayHandle(profile.username)}</p>
          </div>

          {isOwn ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              {friendshipStatus === 'accepted' ? (
                <button
                  onClick={() => onNavigate('messenger')}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Message
                </button>
              ) : friendshipStatus === 'pending' && friendship?.requester_id === currentUser?.id ? (
                <button
                  onClick={handleFriendAction}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" /> Cancel Request
                </button>
              ) : friendshipStatus === 'pending' && friendship?.addressee_id === currentUser?.id ? (
                <button
                  onClick={handleFriendAction}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
                >
                  <UserCheck className="w-4 h-4" /> Accept
                </button>
              ) : (
                <button
                  onClick={handleFriendAction}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
                >
                  <UserPlus className="w-4 h-4" /> Add Friend
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bio & info */}
        <div className="mt-4 space-y-1.5">
          {profile.bio && <p className="text-slate-600 text-sm">{profile.bio}</p>}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {profile.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          {!isOwn && mutualFriends.length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-2">
                {mutualFriends.slice(0, 3).map((f) => (
                  <div key={f.id} className="rounded-full border-2 border-white overflow-hidden">
                    <Avatar profile={f} size="xs" />
                  </div>
                ))}
              </div>
              <span className="text-sm text-slate-500">{mutualFriends.length} mutual friend{mutualFriends.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 md:px-6 mt-6 border-b border-slate-200">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
              <span className="text-xs text-slate-300">{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="px-4 md:px-6 mt-4">
        {tab === 'posts' ? (
          posts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Grid3x3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No posts yet</p>
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
          )
        ) : tab === 'photos' ? (
          photos.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No photos yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 stagger">
              {photos.map((url, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                  <img src={url} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer" />
                </div>
              ))}
            </div>
          )
        ) : friends.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{isOwn ? 'You have no friends yet' : 'No friends yet'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger">
            {friends.map((f) => (
              <div key={f.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
                <Avatar profile={f} size="md" onClick={() => onOpenProfile(f.id)} />
                <div className="flex-1 min-w-0">
                  <button onClick={() => onOpenProfile(f.id)} className="font-semibold text-slate-800 hover:underline truncate block text-sm">
                    {displayName(f)}
                  </button>
                  <p className="text-xs text-slate-400">{displayHandle(f.username)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm backdrop-enter" onClick={() => setEditing(false)}>
          <div className="bg-white w-full md:max-w-lg rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto modal-enter" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-slate-800">Edit Profile</h2>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
                <input type="text" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Username</label>
                <input type="text" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Bio</label>
                <textarea value={editForm.bio} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Location</label>
                <input type="text" value={editForm.location} onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Avatar Photo URL</label>
                <input type="url" value={editForm.avatar_url} onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Cover Photo URL</label>
                <input type="url" value={editForm.cover_url} onChange={(e) => setEditForm({ ...editForm, cover_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all" />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-500 via-blue-500 to-accent-500 text-white font-semibold shadow-lg shadow-brand/30 hover:shadow-brand-lg/40 transition-all disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ShareModal post={sharePost} onClose={() => setSharePost(null)} onRepost={handleRepost} onNavigate={onNavigate} />
      <CommentsModal postId={commentsPostId} postAuthorId={userId} onClose={() => setCommentsPostId(null)} />
    </div>
  );
}
