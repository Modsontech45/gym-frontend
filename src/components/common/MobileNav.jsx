import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Rss, Dumbbell, MessageCircle, User, LogOut } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/dashboard', Icon: LayoutDashboard },
  { to: '/feed',      Icon: Rss },
  { to: '/workouts',  Icon: Dumbbell },
  { to: '/messages',  Icon: MessageCircle },
  { to: '/profile',   Icon: User },
];

export default function MobileNav() {
  const { logout } = useAuthStore();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 flex z-50">
      {NAV_ITEMS.map(({ to, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx('flex-1 flex items-center justify-center py-4 transition-colors',
              isActive ? 'text-primary-400' : 'text-dark-500')
          }
        >
          <Icon size={22} />
        </NavLink>
      ))}
      <button
        onClick={logout}
        className="flex-1 flex items-center justify-center py-4 text-dark-500 hover:text-red-400 transition-colors"
      >
        <LogOut size={22} />
      </button>
    </nav>
  );
}
