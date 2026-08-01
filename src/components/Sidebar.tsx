import { useState, useEffect } from 'react';
import { Home, Search, MessageCircle, Bell, User, Users, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';
import Logo from '@/components/Logo';
import { getUnreadNotificationCount, getUnreadMessageCount } from '@/lib/api';
import type { Page } from '@/App';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMsgs, setUnreadMsgs] = useState(0);

  useEffect(() => {
    if (!profile) return;
    const poll = () => {
      getUnreadNotificationCount(profile.id).then(setUnreadNotifs).catch(() => {});
      getUnreadMessageCount(profile.id).then(setUnreadMsgs).catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [profile, currentPage]);

  const navItems: { id: Page; label: string; icon: typeof Home; badge?: number }[] = [
    { id: 'feed', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'friends', label: 'Friends', icon: Users, badge: unreadNotifs || undefined },
    { id: 'messenger', label: 'Messenger', icon: MessageCircle, badge: unreadMsgs || undefined },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifs || undefined },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 border-r border-slate-200 bg-white px-4 py-6 z-30">
        <div className="px-2 mb-8 animate-fade-in-down">
          <Logo size={40} />
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                style={{ animationDelay: `${0.05 * idx + 0.1}s` }}
                className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all relative animate-fade-in-up hover-lift ${
                  active
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'text-brand-600 scale-110' : ''}`} />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-badge-pop">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <button
          onClick={signOut}
          className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 flex items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all ${
                active ? 'text-brand-600' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5.5 h-5.5" style={{ width: 22, height: 22 }} />
              {item.badge && (
                <span className="absolute top-0 right-0.5 w-4 h-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 bg-white border-b border-slate-200 z-20 flex items-center justify-between px-4 py-3">
        <Logo size={32} />
        <Avatar profile={profile} size="sm" onClick={() => onNavigate('profile')} />
      </header>
    </>
  );
}
