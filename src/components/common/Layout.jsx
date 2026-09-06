import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';

export default function Layout() {
  const { user } = useAuthStore();

  // Clients must complete the onboarding survey before accessing the app
  if (user?.role === 'client' && user?.surveyCompleted === false) {
    return <Navigate to="/survey" replace />;
  }

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
