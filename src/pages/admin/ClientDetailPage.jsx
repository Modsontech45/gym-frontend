import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, subsApi, workoutsApi, followUpsApi } from '../../services/api';
import { ArrowLeft, MessageCircle, CreditCard, Dumbbell, Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showSubForm, setShowSubForm] = useState(false);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const { register: regSub, handleSubmit: submitSub, reset: resetSub } = useForm();
  const { register: regProg, handleSubmit: submitProg, reset: resetProg } = useForm();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => usersApi.getClient(id).then(r => r.data),
  });

  const createSub = useMutation({
    mutationFn: (data) => subsApi.create({ ...data, userId: id }),
    onSuccess: () => { queryClient.invalidateQueries(['client', id]); setShowSubForm(false); resetSub(); toast.success('Abonnement créé !'); },
    onError: () => toast.error(t('error')),
  });

  const createProgram = useMutation({
    mutationFn: (data) => workoutsApi.createProgram({ ...data, clientId: id }),
    onSuccess: () => { queryClient.invalidateQueries(['client', id]); setShowProgramForm(false); resetProg(); toast.success('Programme créé !'); },
    onError: () => toast.error(t('error')),
  });

  if (isLoading) return <div className="text-center py-12 text-dark-500">{t('loading')}</div>;
  if (!client) return <div className="text-center py-12 text-dark-500">Client introuvable</div>;

  return (
    <div className="space-y-4 pb-20 md:pb-0 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clients')} className="p-2 rounded-xl hover:bg-dark-700 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{client.firstName} {client.lastName}</h1>
      </div>

      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-2xl">
          {client.firstName?.[0]}{client.lastName?.[0]}
        </div>
        <div className="flex-1">
          <p className="text-lg font-semibold">{client.firstName} {client.lastName}</p>
          <p className="text-dark-500 text-sm">{client.email}</p>
          {client.phone && <p className="text-dark-500 text-sm">{client.phone}</p>}
          {client.fitnessGoal && <p className="text-primary-400 text-sm mt-1">🎯 {client.fitnessGoal}</p>}
        </div>
        <Link to={`/messages/${client.id}`} className="btn-secondary flex items-center gap-2">
          <MessageCircle size={16} /> Message
        </Link>
      </div>

      {/* Subscriptions */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold flex items-center gap-2"><CreditCard size={18} className="text-primary-400" /> Abonnements</h2>
          <button onClick={() => setShowSubForm(!showSubForm)} className="btn-primary text-sm flex items-center gap-1"><Plus size={14} /> Ajouter</button>
        </div>

        {showSubForm && (
          <form onSubmit={submitSub(d => createSub.mutate(d))} className="space-y-3 mb-4 p-3 bg-dark-700 rounded-xl">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nom du plan</label>
                <input {...regSub('planName', { required: true })} className="input" placeholder="Mensuel Standard" />
              </div>
              <div>
                <label className="label">Type</label>
                <select {...regSub('planType')} className="input">
                  <option value="mensuel">Mensuel</option>
                  <option value="trimestriel">Trimestriel</option>
                  <option value="semestriel">Semestriel</option>
                  <option value="annuel">Annuel</option>
                </select>
              </div>
              <div>
                <label className="label">Prix (FCFA)</label>
                <input {...regSub('price', { required: true })} type="number" step="0.01" className="input" />
              </div>
              <div>
                <label className="label">Séances incluses</label>
                <input {...regSub('sessionsIncluded')} type="number" className="input" defaultValue={12} />
              </div>
              <div>
                <label className="label">Date début</label>
                <input {...regSub('startDate', { required: true })} type="date" className="input" />
              </div>
              <div>
                <label className="label">Date fin</label>
                <input {...regSub('endDate', { required: true })} type="date" className="input" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1 text-sm">{t('create')}</button>
              <button type="button" onClick={() => setShowSubForm(false)} className="btn-secondary flex-1 text-sm">{t('cancel')}</button>
            </div>
          </form>
        )}

        {client.subscriptions?.length === 0 ? (
          <p className="text-dark-500 text-sm">Aucun abonnement</p>
        ) : client.subscriptions?.map(sub => (
          <div key={sub.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-xl mb-2">
            <div>
              <p className="font-medium text-sm">{sub.planName}</p>
              <p className="text-xs text-dark-500">{sub.startDate} → {sub.endDate}</p>
              <p className="text-xs text-dark-500">{sub.sessionsUsed}/{sub.sessionsIncluded} séances</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-primary-400">{Math.round(sub.balance).toLocaleString('fr-FR')} FCFA</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${sub.status === 'actif' ? 'bg-green-500/20 text-green-400' : 'bg-dark-600 text-dark-400'}`}>
                {sub.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Programs */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold flex items-center gap-2"><Dumbbell size={18} className="text-primary-400" /> Programmes</h2>
          <button onClick={() => setShowProgramForm(!showProgramForm)} className="btn-primary text-sm flex items-center gap-1"><Plus size={14} /> Créer</button>
        </div>

        {showProgramForm && (
          <form onSubmit={submitProg(d => createProgram.mutate(d))} className="space-y-3 mb-4 p-3 bg-dark-700 rounded-xl">
            <div>
              <label className="label">Nom du programme</label>
              <input {...regProg('name', { required: true })} className="input" placeholder="Programme Prise de masse 4 semaines" />
            </div>
            <div>
              <label className="label">Objectif</label>
              <input {...regProg('goal')} className="input" placeholder="Ex: Prise de masse musculaire" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Fréquence/semaine</label>
                <input {...regProg('frequencyPerWeek')} type="number" min="1" max="7" className="input" defaultValue={3} />
              </div>
              <div>
                <label className="label">Durée (semaines)</label>
                <input {...regProg('durationWeeks')} type="number" className="input" defaultValue={4} />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea {...regProg('description')} className="input resize-none" rows={2} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex-1 text-sm">{t('create')}</button>
              <button type="button" onClick={() => setShowProgramForm(false)} className="btn-secondary flex-1 text-sm">{t('cancel')}</button>
            </div>
          </form>
        )}

        {client.programs?.length === 0 ? (
          <p className="text-dark-500 text-sm">Aucun programme</p>
        ) : client.programs?.map(p => (
          <div key={p.id} className="p-3 bg-dark-700 rounded-xl mb-2">
            <div className="flex justify-between">
              <p className="font-medium text-sm">{p.name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-500/20 text-green-400' : 'bg-dark-600 text-dark-400'}`}>
                {p.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="text-xs text-dark-500 mt-1">{p.frequencyPerWeek}x/sem · {p.sessions?.length || 0} séances</p>
          </div>
        ))}
      </div>
    </div>
  );
}
