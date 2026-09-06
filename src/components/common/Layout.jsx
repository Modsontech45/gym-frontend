import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import PostComposeModal from './PostComposeModal';
import { WifiOff, Wifi } from 'lucide-react';

export default function Layout() {
  const { user } = useAuthStore();
  const online = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [prevOnline, setPrevOnline] = useState(online);

  useEffect(() => {
    if (!prevOnline && online) {
      setShowRestored(true);
      const t = setTimeout(() => setShowRestored(false), 3000);
      return () => clearTimeout(t);
    }
    setPrevOnline(online);
  }, [online]);

  if (user?.role === 'client' && user?.surveyCompleted === false) {
    return <Navigate to="/survey" replace />;
  }

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />

        {/* Offline banner */}
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-red-500/90 text-white text-sm py-2 px-4 font-medium">
            <WifiOff size={15} /> Pas de connexion internet
          </div>
        )}
        {showRestored && (
          <div className="flex items-center justify-center gap-2 bg-green-500/90 text-white text-sm py-2 px-4 font-medium">
            <Wifi size={15} /> Connexion rétablie
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
      <PostComposeModal />
    </div>
  );
}
