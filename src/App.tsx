import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import AuthPage from '@/pages/AuthPage';
import Sidebar from '@/components/Sidebar';
import Feed from '@/pages/Feed';
import SearchPage from '@/pages/SearchPage';
import FriendsPage from '@/pages/FriendsPage';
import Messenger from '@/pages/Messenger';
import NotificationsPage from '@/pages/NotificationsPage';
import ProfilePage from '@/pages/ProfilePage';

export type Page = 'feed' | 'search' | 'friends' | 'messenger' | 'notifications' | 'profile';

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('feed');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [messengerPartnerId, setMessengerPartnerId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="flex justify-center mb-4"><Logo size={56} withText={false} /></div>
          <Loader2 className="w-6 h-6 animate-spin text-brand-500 mx-auto" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  function handleNavigate(p: Page) {
    if (p === 'profile') {
      setProfileUserId(user!.id);
    }
    setPage(p);
  }

  function handleOpenProfile(userId: string) {
    setProfileUserId(userId);
    setPage('profile');
  }

  function handleNavigateFromMessenger(p: Page) {
    setMessengerPartnerId(null);
    handleNavigate(p);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar currentPage={page} onNavigate={handleNavigate} />

      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        <div key={page} className="animate-fade-in-up">
          {page === 'feed' && <Feed onOpenProfile={handleOpenProfile} onNavigate={handleNavigate} />}
          {page === 'search' && <SearchPage onOpenProfile={handleOpenProfile} onNavigate={handleNavigate} />}
          {page === 'friends' && <FriendsPage onOpenProfile={handleOpenProfile} />}
          {page === 'messenger' && (
            <Messenger
              onOpenProfile={handleOpenProfile}
              onNavigate={handleNavigateFromMessenger}
              initialPartnerId={messengerPartnerId}
            />
          )}
          {page === 'notifications' && <NotificationsPage onOpenProfile={handleOpenProfile} onNavigate={handleNavigate} />}
          {page === 'profile' && profileUserId && (
            <ProfilePage userId={profileUserId} onOpenProfile={handleOpenProfile} onNavigate={handleNavigate} />
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
