import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, subsApi } from '../../services/api';
import { CreditCard, TrendingUp, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [creditId, setCreditId] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => usersApi.getClients().then(r => r.data),
  });

  const credit = useMutation({
    mutationFn: ({ id, amount }) => subsApi.credit(id, amount),
    onSuccess: () => { queryClient.invalidateQueries(['clients']); setCreditId(null); setCreditAmount(''); toast.success('Solde crédité !'); },
    onError: () => toast.error(t('error')),
  });

  const allSubs = clients.flatMap(c => (c.subscriptions || []).map(s => ({ ...s, client: c })));
  const totalBalance = allSubs.reduce((sum, s) => sum + parseFloat(s.balance || 0), 0);
  const activeSubs = allSubs.filter(s => s.status === 'actif').length;

  return (
    <div className="space-y-4 pb-20 md:pb-0 animate-fade-in">
      <h1 className="text-2xl font-bold">{t('subscriptions')}</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-400">{activeSubs}</p>
          <p className="text-sm text-dark-500 mt-1">{t('active_subscriptions')}</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-400">{Math.round(totalBalance).toLocaleString('fr-FR')} FCFA</p>
          <p className="text-sm text-dark-500 mt-1">Solde total</p>
        </div>
        <div className="card text-center md:col-span-1 col-span-2">
          <p className="text-3xl font-bold text-primary-400">{allSubs.length}</p>
          <p className="text-sm text-dark-500 mt-1">Total abonnements</p>
        </div>
      </div>

      <div className="space-y-3">
        {allSubs.map(sub => (
          <div key={sub.id} className="card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm">
                  {sub.client?.firstName?.[0]}{sub.client?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold">{sub.client?.firstName} {sub.client?.lastName}</p>
                  <p className="text-sm text-dark-500">{sub.planName} · {sub.planType}</p>
                  <p className="text-xs text-dark-500">{sub.startDate} → {sub.endDate}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-400">{Math.round(sub.balance).toLocaleString('fr-FR')} FCFA</p>
                <p className="text-xs text-dark-500">{sub.sessionsUsed}/{sub.sessionsIncluded} séances</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${sub.status === 'actif' ? 'bg-green-500/20 text-green-400' : 'bg-dark-600 text-dark-400'}`}>
                  {sub.status}
                </span>
              </div>
            </div>

            <div className="mt-3 bg-dark-700 rounded-full h-1.5">
              <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (sub.sessionsUsed / (sub.sessionsIncluded || 1)) * 100)}%` }} />
            </div>

            {creditId === sub.id ? (
              <div className="flex gap-2 mt-3">
                <input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                  className="input flex-1 py-2 text-sm" placeholder="Montant à créditer (FCFA)" />
                <button onClick={() => credit.mutate({ id: sub.id, amount: creditAmount })}
                  className="btn-primary text-sm px-4">Créditer</button>
                <button onClick={() => setCreditId(null)} className="btn-secondary text-sm px-3">Annuler</button>
              </div>
            ) : (
              <button onClick={() => setCreditId(sub.id)} className="mt-3 text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                <Plus size={14} /> Créditer le solde
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
