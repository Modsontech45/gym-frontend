import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { usersApi, workoutsApi, subsApi, followUpsApi } from '../services/api';
import { Users, CreditCard, TrendingUp, UserPlus, Dumbbell, Calendar, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ icon: Icon, label, value, sub, color = 'primary' }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl bg-${color}-500/20 flex items-center justify-center flex-shrink-0`}>
      <Icon size={22} className={`text-${color}-400`} />
    </div>
    <div>
      <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
      <p className="text-sm text-dark-500">{label}</p>
      {sub && <p className="text-xs text-primary-400">{sub}</p>}
    </div>
  </div>
);

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'coach';

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => usersApi.getStats().then(r => r.data),
    enabled: isAdmin,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['my-programs'],
    queryFn: () => workoutsApi.getMy().then(r => r.data),
    enabled: !isAdmin,
  });

  const { data: subs = [] } = useQuery({
    queryKey: ['my-subs'],
    queryFn: () => subsApi.getMy().then(r => r.data),
    enabled: !isAdmin,
  });

  const { data: followUps = [] } = useQuery({
    queryKey: ['followups'],
    queryFn: () => followUpsApi.getAll({ status: 'planifie' }).then(r => r.data),
  });

  const activeSub = subs.find(s => s.status === 'actif');
  const activeProgram = programs.find(p => p.isActive);

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">
          Bonjour, <span className="text-primary-400">{user?.firstName}</span> 👋
        </h1>
        <p className="text-dark-500 mt-1">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {isAdmin ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label={t('total_clients')} value={stats?.totalClients} />
            <StatCard icon={CreditCard} label={t('active_subscriptions')} value={stats?.activeSubscriptions} />
            <StatCard icon={TrendingUp} label={t('total_revenue')} value={stats?.totalRevenue ? `${Math.round(stats.totalRevenue).toLocaleString('fr-FR')} FCFA` : '0 FCFA'} />
            <StatCard icon={UserPlus} label={t('new_clients')} value={stats?.newClientsThisMonth} sub={t('this_month')} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Calendar size={18} className="text-primary-400" /> Suivis à venir</h2>
              {followUps.length === 0 ? (
                <p className="text-dark-500 text-sm">Aucun suivi planifié</p>
              ) : followUps.slice(0, 5).map(fu => (
                <div key={fu.id} className="flex items-center gap-3 py-2 border-b border-dark-700/50 last:border-0">
                  <div className={`w-2 h-2 rounded-full ${fu.priority === 'haute' ? 'bg-red-400' : fu.priority === 'normale' ? 'bg-primary-400' : 'bg-dark-500'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{fu.title}</p>
                    <p className="text-xs text-dark-500">{fu.client?.firstName} {fu.client?.lastName}</p>
                  </div>
                  <p className="text-xs text-dark-500">{fu.scheduledDate ? new Date(fu.scheduledDate).toLocaleDateString('fr-FR') : '—'}</p>
                </div>
              ))}
              <Link to="/followups" className="text-primary-400 text-sm mt-3 block hover:text-primary-300">Voir tous les suivis →</Link>
            </div>

            <div className="card">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Users size={18} className="text-primary-400" /> Accès rapide</h2>
              <div className="space-y-2">
                <Link to="/clients" className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl hover:bg-dark-600 transition-colors">
                  <Users size={18} className="text-primary-400" />
                  <span className="text-sm">Gérer les clients</span>
                </Link>
                <Link to="/subscriptions" className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl hover:bg-dark-600 transition-colors">
                  <CreditCard size={18} className="text-primary-400" />
                  <span className="text-sm">Abonnements</span>
                </Link>
                <Link to="/feed" className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl hover:bg-dark-600 transition-colors">
                  <TrendingUp size={18} className="text-primary-400" />
                  <span className="text-sm">Fil d'actualité</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {activeSub ? (
            <div className="card bg-gradient-to-r from-primary-500/20 to-primary-600/10 border-primary-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-400 font-medium uppercase tracking-wide">{t('subscriptions')}</p>
                  <p className="text-xl font-bold mt-1">{activeSub.planName}</p>
                  <p className="text-dark-500 text-sm mt-1">
                    {activeSub.sessionsIncluded - activeSub.sessionsUsed} {t('sessions_remaining')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-extrabold text-primary-400">{Math.round(activeSub.balance).toLocaleString('fr-FR')} FCFA</p>
                  <p className="text-xs text-dark-500">{t('subscription_balance')}</p>
                </div>
              </div>
              <div className="mt-3 bg-dark-800/50 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (activeSub.sessionsUsed / activeSub.sessionsIncluded) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="card border-dashed border-2 border-dark-600 text-center py-8">
              <CreditCard size={36} className="text-dark-500 mx-auto mb-3" />
              <p className="text-dark-500">Aucun abonnement actif</p>
              <p className="text-sm text-dark-600 mt-1">{t('contact_coach')}</p>
            </div>
          )}

          {activeProgram ? (
            <div className="card">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Dumbbell size={18} className="text-primary-400" /> {t('today_session')}
              </h2>
              <p className="font-medium text-lg">{activeProgram.name}</p>
              <p className="text-dark-500 text-sm mt-1">{activeProgram.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {activeProgram.sessions?.slice(0, 2).map(s => (
                  <div key={s.id} className="bg-dark-700 rounded-xl p-3">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-dark-500 mt-1">{s.durationMinutes} min</p>
                    <p className="text-xs text-primary-400 mt-1">{s.exercises?.length} exercices</p>
                  </div>
                ))}
              </div>
              <Link to="/workouts" className="btn-primary w-full text-center mt-4 block py-2.5">
                Voir mon programme
              </Link>
            </div>
          ) : (
            <div className="card text-center py-8">
              <Dumbbell size={36} className="text-dark-500 mx-auto mb-3" />
              <p className="text-dark-500">{t('no_program')}</p>
            </div>
          )}

          <div className="card">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Calendar size={18} className="text-primary-400" /> Mes suivis</h2>
            {followUps.length === 0 ? (
              <p className="text-dark-500 text-sm">Aucun suivi planifié</p>
            ) : followUps.slice(0, 3).map(fu => (
              <div key={fu.id} className="flex items-center gap-3 py-2.5 border-b border-dark-700/50 last:border-0">
                <CheckCircle size={16} className="text-primary-400" />
                <div>
                  <p className="text-sm font-medium">{fu.title}</p>
                  <p className="text-xs text-dark-500">{fu.scheduledDate ? new Date(fu.scheduledDate).toLocaleDateString('fr-FR') : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
