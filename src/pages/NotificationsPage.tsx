import { useState, useEffect } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, Repeat2, Send, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';
import { getNotifications, markAllNotificationsRead } from '@/lib/api';
import type { Notification, NotificationType } from '@/types';
import { displayName, timeAgo } from '@/lib/helpers';
import type { Page } from '@/App';

interface NotificationsProps {
  onOpenProfile: (userId: string) => void;
  onNavigate: (page: Page) => void;
}

const typeConfig: Record<NotificationType, { icon: typeof Heart; color: string; bg: string; text: (name: string) => string }> = {
  friend_request: { icon: UserPlus, color: 'text-violet-600', bg: 'bg-violet-100', text: (n) => `${n} sent you a friend request` },
  friend_accept: { icon: CheckCheck, color: 'text-accent-600', bg: 'bg-accent-100', text: (n) => `${n} accepted your friend request` },
  like: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-100', text: (n) => `${n} liked your post` },
  comment: { icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-100', text: (n) => `${n} commented on your post` },
  share: { icon: Repeat2, color: 'text-accent-600', bg: 'bg-accent-100', text: (n) => `${n} reposted your post` },
  message: { icon: Send, color: 'text-brand-600', bg: 'bg-brand-100', text: (n) => `${n} sent you a message` },
};

export default function NotificationsPage({ onOpenProfile, onNavigate }: NotificationsProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getNotifications(user.id).then((n) => {
      setNotifications(n);
      setLoading(false);
    });
    markAllNotificationsRead(user.id);
  }, [user]);

  function handleClick(notif: Notification) {
    if (notif.type === 'friend_request' || notif.type === 'friend_accept') {
      onNavigate('friends');
    } else if (notif.type === 'message') {
      onNavigate('messenger');
    } else if (notif.actor_id) {
      onOpenProfile(notif.actor_id);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
        {notifications.some((n) => !n.read) && (
          <button
            onClick={() => {
              if (user) markAllNotificationsRead(user.id);
              setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            }}
            className="text-sm text-brand-600 font-medium hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-slate-400 animate-fade-in">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-50 animate-float" />
          <p className="font-medium text-slate-500">No notifications</p>
          <p className="text-sm mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2 stagger">
          {notifications.map((notif) => {
            const config = typeConfig[notif.type];
            const Icon = config.icon;
            return (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                  notif.read ? 'bg-white border-slate-200' : 'bg-brand-50/50 border-brand-100'
                } hover:bg-slate-50`}
              >
                <div className="relative shrink-0">
                  <Avatar profile={notif.actor} size="md" onClick={() => notif.actor_id && onOpenProfile(notif.actor_id)} />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${config.bg} flex items-center justify-center border-2 border-white`}>
                    <Icon className={`w-3 h-3 ${config.color}`} fill={notif.type === 'like' ? 'currentColor' : 'none'} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">
                    {config.text(displayName(notif.actor))}
                  </p>
                  {notif.post?.content && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">"{notif.post.content}"</p>
                  )}
                  <span className="text-xs text-slate-300 mt-0.5 block">{timeAgo(notif.created_at)}</span>
                </div>
                {!notif.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
