import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Search, ChevronRight, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function ClientsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => usersApi.getClients().then(r => r.data),
  });

  const create = useMutation({
    mutationFn: usersApi.createClient,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['clients']);
      setShowForm(false); reset();
      toast.success(`Client créé ! Mot de passe temporaire: ${res.data.tempPassword}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || t('error')),
  });

  const filtered = clients.filter(c =>
    `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20 md:pb-0 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('clients')}</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nouveau client
        </button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-10" placeholder="Rechercher un client..." />
      </div>

      {showForm && (
        <div className="card border border-primary-500/30">
          <div className="flex justify-between mb-4">
            <h2 className="font-bold">Nouveau client</h2>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-dark-500" /></button>
          </div>
          <form onSubmit={handleSubmit(d => create.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('first_name')}</label>
                <input {...register('firstName', { required: true })} className="input" />
              </div>
              <div>
                <label className="label">{t('last_name')}</label>
                <input {...register('lastName', { required: true })} className="input" />
              </div>
            </div>
            <div>
              <label className="label">{t('email')}</label>
              <input {...register('email', { required: true })} type="email" className="input" />
            </div>
            <div>
              <label className="label">{t('phone')}</label>
              <input {...register('phone')} type="tel" className="input" />
            </div>
            <div>
              <label className="label">{t('fitness_goal')}</label>
              <input {...register('fitnessGoal')} className="input" placeholder="Prise de masse, perte de poids..." />
            </div>
            <div>
              <label className="label">{t('experience')}</label>
              <select {...register('experienceLevel')} className="input">
                <option value="debutant">{t('beginner')}</option>
                <option value="intermediaire">{t('intermediate')}</option>
                <option value="avance">{t('advanced')}</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={create.isPending} className="btn-primary flex-1">{t('create')}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12 text-dark-500">{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={48} className="text-dark-600 mx-auto mb-4" />
          <p className="text-dark-500">Aucun client trouvé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => {
            const activeSub = client.subscriptions?.[0];
            return (
              <button key={client.id} onClick={() => navigate(`/clients/${client.id}`)}
                className="card w-full flex items-center gap-4 hover:border-primary-500/30 transition-all text-left">
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold">
                  {client.firstName?.[0]}{client.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{client.firstName} {client.lastName}</p>
                  <p className="text-sm text-dark-500 truncate">{client.email}</p>
                  <div className="flex gap-2 mt-1">
                    {activeSub && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                        {activeSub.planName} · {Math.round(activeSub.balance).toLocaleString('fr-FR')} FCFA
                      </span>
                    )}
                    {client.fitnessGoal && (
                      <span className="text-xs bg-dark-600 text-dark-400 px-2 py-0.5 rounded-full truncate max-w-32">
                        {client.fitnessGoal}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={18} className="text-dark-500 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
