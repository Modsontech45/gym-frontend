import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Sun, Moon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import i18n from '../../i18n';

export default function TopBar() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifs = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then(r => r.data),
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
  });

  const { theme, toggleTheme } = useThemeStore();
  const unread = notifs.filter(n => !n.isRead).length;
  const changeLanguage = (lang) => { i18n.changeLanguage(lang); };

  return (
    <header className="bg-dark-800 border-b border-dark-700 px-4 md:px-6 h-16 flex items-center justify-between">
      <div className="md:hidden">
        <h1 className="text-xl font-extrabold text-primary-500">GymPro</h1>
      </div>
      <div className="hidden md:block">
        <h2 className="text-lg font-semibold text-white">
          {t('dashboard')} — <span className="text-primary-400">{user?.firstName}</span>
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-dark-700 hover:bg-dark-600 transition-colors"
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? <Sun size={18} className="text-primary-400" /> : <Moon size={18} className="text-primary-400" />}
        </button>

        <div className="flex items-center gap-1 bg-dark-700 rounded-lg p-1">
          <button onClick={() => changeLanguage('fr')} className={`text-xs px-2 py-1 rounded ${i18n.language === 'fr' ? 'bg-primary-500 text-white' : 'text-dark-500'}`}>FR</button>
          <button onClick={() => changeLanguage('en')} className={`text-xs px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-primary-500 text-white' : 'text-dark-500'}`}>EN</button>
        </div>

        <div className="relative">
          <button onClick={() => { setShowNotifs(!showNotifs); markRead.mutate(); }}
            className="relative p-2 rounded-xl bg-dark-700 hover:bg-dark-600 transition-colors">
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-dark-700">
                <h3 className="font-semibold">{t('notifications')}</h3>
              </div>
              {notifs.length === 0 ? (
                <p className="p-4 text-dark-500 text-sm text-center">Aucune notification</p>
              ) : notifs.slice(0, 10).map(n => (
                <div key={n.id} className={`p-4 border-b border-dark-700/50 ${!n.isRead ? 'bg-primary-500/5' : ''}`}>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-dark-500 mt-0.5">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
