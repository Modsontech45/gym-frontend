import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Rss, Dumbbell, MessageCircle, User } from 'lucide-react';
import clsx from 'clsx';

export default function MobileNav() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const items = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'dashboard' },
    { to: '/feed', icon: Rss, label: 'feed' },
    { to: '/workouts', icon: Dumbbell, label: 'workouts' },
    { to: '/messages', icon: MessageCircle, label: 'messages' },
    { to: '/profile', icon: User, label: 'profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 flex z-50">
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            clsx('flex-1 flex flex-col items-center justify-center py-3 text-xs gap-1 transition-colors',
              isActive ? 'text-primary-400' : 'text-dark-500')
          }
        >
          <Icon size={20} />
          <span>{t(label)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
