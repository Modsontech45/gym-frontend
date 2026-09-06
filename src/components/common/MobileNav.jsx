import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { subsApi, messagesApi, notificationsApi } from '../../services/api';
import {
  LayoutDashboard, Rss, Dumbbell, MessageCircle, User,
  Menu, LogOut, CreditCard, Clock, Settings, X, ChevronRight, Bell,
} from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/dashboard', Icon: LayoutDashboard, key: 'dashboard' },
  { to: '/feed',      Icon: Rss,             key: 'feed' },
  { to: '/workouts',  Icon: Dumbbell,        key: 'workouts' },
  { to: '/messages',  Icon: MessageCircle,   key: 'messages' },
  { to: '/profile',   Icon: User,            key: 'profile' },
];

function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function daysLeft(endDate) {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
}

export default function MobileNav() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const drawerRef = useRef(null);

  // Unread counts — poll every 30s
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.getConversations().then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: notifs = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then(r => r.data),
    refetchInterval: 30000,
  });

  const unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const unreadNotifs = notifs.filter(n => !n.isRead).length;

  // Subscription (lazy — only when drawer opens)
  const { data: subs = [] } = useQuery({
    queryKey: ['my-subs'],
    queryFn: () => subsApi.getMy().then(r => r.data),
    enabled: open,
  });

  const activeSub = subs.find(s => s.status === 'actif');
  const days = daysLeft(activeSub?.endDate);

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close); };
  }, [open]);

  const go = (path) => { setOpen(false); navigate(path); };

  const totalMenuBadge = unreadNotifs; // shown on menu icon when drawer is closed

  return (
    <>
      {/* Bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 flex z-50">
        {NAV_ITEMS.map(({ to, Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx('flex-1 flex items-center justify-center py-4 transition-colors relative',
                isActive ? 'text-primary-400' : 'text-dark-500')
            }
          >
            <span className="relative">
              <Icon size={22} />
              {key === 'messages' && <Badge count={unreadMessages} />}
            </span>
          </NavLink>
        ))}

        {/* Menu button with notification badge */}
        <button
          onClick={() => setOpen(true)}
          className="flex-1 flex items-center justify-center py-4 text-dark-500 hover:text-white transition-colors"
        >
          <span className="relative">
            <Menu size={22} />
            <Badge count={totalMenuBadge} />
          </span>
        </button>
      </nav>

      {/* Backdrop */}
      {open && <div className="md:hidden fixed inset-0 bg-black/60 z-[60]" aria-hidden="true" />}

      {/* Slide-up drawer */}
      <div
        ref={drawerRef}
        className={clsx(
          'md:hidden fixed left-0 right-0 bottom-0 z-[70] bg-dark-800 rounded-t-2xl shadow-2xl transition-transform duration-300',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-dark-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <p className="font-semibold text-sm text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-dark-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-dark-500 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        {/* Subscription card */}
        {activeSub ? (
          <div className="mx-4 mt-4 rounded-xl bg-primary-500/10 border border-primary-500/20 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-dark-500 mb-0.5">Abonnement actif</p>
                <p className="font-semibold text-sm text-white">{activeSub.planName}</p>
              </div>
              <CreditCard size={18} className="text-primary-400 shrink-0 mt-0.5" />
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div>
                <p className="text-xs text-dark-500">Solde</p>
                <p className="font-bold text-primary-400">{Math.round(activeSub.balance).toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div className="w-px h-8 bg-dark-700" />
              <div>
                <p className="text-xs text-dark-500 flex items-center gap-1"><Clock size={10} /> Jours restants</p>
                <p className={clsx('font-bold',
                  days !== null && days <= 0 ? 'text-red-400' :
                  days !== null && days <= 3 ? 'text-red-400' :
                  days !== null && days <= 7 ? 'text-amber-400' : 'text-white'
                )}>
                  {days === null ? '—' : days <= 0 ? 'Expiré' : `${days} j`}
                </p>
              </div>
              <div className="w-px h-8 bg-dark-700" />
              <div>
                <p className="text-xs text-dark-500">Séances</p>
                <p className="font-bold text-white">{activeSub.sessionsUsed}/{activeSub.sessionsIncluded}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-4 mt-4 rounded-xl bg-dark-700/50 border border-dark-700 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-dark-400">Aucun abonnement actif</p>
              <p className="text-xs text-dark-600 mt-0.5">Contactez votre coach</p>
            </div>
            <CreditCard size={18} className="text-dark-600" />
          </div>
        )}

        {/* Menu items */}
        <div className="px-4 mt-3 space-y-1 pb-2">
          <button onClick={() => go('/messages')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-dark-700 transition-colors text-sm text-dark-300 hover:text-white">
            <span className="flex items-center gap-3">
              <MessageCircle size={18} /> Messages
              {unreadMessages > 0 && (
                <span className="ml-1 min-w-[20px] h-5 px-1.5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </span>
            <ChevronRight size={16} className="text-dark-600" />
          </button>

          <button onClick={() => { setOpen(false); queryClient.invalidateQueries(['notifications']); go('/dashboard'); }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-dark-700 transition-colors text-sm text-dark-300 hover:text-white">
            <span className="flex items-center gap-3">
              <Bell size={18} /> Notifications
              {unreadNotifs > 0 && (
                <span className="ml-1 min-w-[20px] h-5 px-1.5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadNotifs > 99 ? '99+' : unreadNotifs}
                </span>
              )}
            </span>
            <ChevronRight size={16} className="text-dark-600" />
          </button>

          <button onClick={() => go('/profile')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-dark-700 transition-colors text-sm text-dark-300 hover:text-white">
            <span className="flex items-center gap-3"><User size={18} /> Mon profil</span>
            <ChevronRight size={16} className="text-dark-600" />
          </button>

          <button onClick={() => go('/profile?tab=settings')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-dark-700 transition-colors text-sm text-dark-300 hover:text-white">
            <span className="flex items-center gap-3"><Settings size={18} /> Paramètres</span>
            <ChevronRight size={16} className="text-dark-600" />
          </button>
        </div>

        {/* Logout */}
        <div className="px-4 pb-8 pt-2 border-t border-dark-700 mt-1">
          <button
            onClick={() => { setOpen(false); logout(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors text-sm font-medium"
          >
            <LogOut size={18} /> Se déconnecter
          </button>
        </div>
      </div>
    </>
  );
}
