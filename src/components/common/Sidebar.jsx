import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, Users, Rss, Dumbbell, MessageCircle,
  ClipboardCheck, User, CreditCard, Ruler, LogOut, ShieldCheck,
} from 'lucide-react';
import clsx from 'clsx';

const navItem = (to, icon, label, roles) => ({ to, icon, label, roles });

const navItems = [
  navItem('/dashboard', LayoutDashboard, 'dashboard'),
  navItem('/feed', Rss, 'feed'),
  navItem('/workouts', Dumbbell, 'workouts'),
  navItem('/messages', MessageCircle, 'messages'),
  navItem('/followups', ClipboardCheck, 'follow_ups'),
  navItem('/measurements', Ruler, 'measurements'),
  navItem('/clients', Users, 'clients', ['admin', 'coach']),
  navItem('/subscriptions', CreditCard, 'subscriptions', ['admin', 'coach']),
  navItem('/team', ShieldCheck, 'team', ['admin', 'coach']),
  navItem('/profile', User, 'profile'),
];

export default function Sidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-dark-800 border-r border-dark-700 py-6">
      <div className="px-6 mb-8">
        <h1 className="text-2xl font-extrabold text-primary-500">GymPro</h1>
        <p className="text-xs text-dark-500 mt-1">{t('tagline')}</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label, roles }) => {
          if (roles && !roles.includes(user?.role)) return null;
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive ? 'bg-primary-500/20 text-primary-400' : 'text-dark-500 hover:bg-dark-700 hover:text-white')
              }
            >
              <Icon size={18} />
              {t(label)}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 mt-4 border-t border-dark-700 pt-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-dark-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm text-dark-500 hover:text-red-400 hover:bg-red-400/10 transition-all">
          <LogOut size={18} />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
