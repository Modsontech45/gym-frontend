import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followUpsApi, usersApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { ClipboardCheck, Plus, CheckCircle, Clock, AlertCircle, X, Pencil, Trash2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const STATUS_COLORS = { planifie: 'text-primary-400 bg-primary-500/20', complete: 'text-green-400 bg-green-500/20', reporte: 'text-yellow-400 bg-yellow-500/20', annule: 'text-red-400 bg-red-500/20' };
const PRIORITY_ICONS = { haute: <AlertCircle size={14} className="text-red-400" />, normale: <Clock size={14} className="text-primary-400" />, basse: <Clock size={14} className="text-dark-500" /> };

function EditForm({ fu, clients, onSave, onCancel, isPending }) {
  const [form, setForm] = useState({
    title: fu.title || '',
    note: fu.note || '',
    status: fu.status || 'planifie',
    priority: fu.priority || 'normale',
    scheduledDate: fu.scheduledDate ? fu.scheduledDate.slice(0, 16) : '',
    clientId: fu.clientId || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="mt-3 border-t border-dark-700 pt-3 space-y-2">
      <input
        className="input w-full text-sm"
        value={form.title}
        onChange={e => set('title', e.target.value)}
        placeholder="Titre"
      />
      <textarea
        className="input w-full text-sm resize-none"
        rows={2}
        value={form.note}
        onChange={e => set('note', e.target.value)}
        placeholder="Note"
      />
      <div className="grid grid-cols-2 gap-2">
        <select className="input text-sm" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="planifie">Planifié</option>
          <option value="complete">Complété</option>
          <option value="reporte">Reporté</option>
          <option value="annule">Annulé</option>
        </select>
        <select className="input text-sm" value={form.priority} onChange={e => set('priority', e.target.value)}>
          <option value="normale">Normale</option>
          <option value="haute">Haute</option>
          <option value="basse">Basse</option>
        </select>
      </div>
      <input type="datetime-local" className="input w-full text-sm" value={form.scheduledDate} onChange={e => set('scheduledDate', e.target.value)} />
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(form)} disabled={isPending} className="btn-primary flex-1 text-sm flex items-center justify-center gap-1">
          <Save size={13} /> Enregistrer
        </button>
        <button onClick={onCancel} className="btn-secondary flex-1 text-sm">Annuler</button>
      </div>
    </div>
  );
}

export default function FollowUpsPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isCoach = user?.role === 'admin' || user?.role === 'coach';
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const { data: followUps = [] } = useQuery({
    queryKey: ['followups', filter],
    queryFn: () => followUpsApi.getAll(filter ? { status: filter } : {}).then(r => r.data),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => usersApi.getClients().then(r => r.data),
    enabled: isCoach,
  });

  const create = useMutation({
    mutationFn: followUpsApi.create,
    onSuccess: () => { queryClient.invalidateQueries(['followups']); setShowForm(false); reset(); toast.success('Suivi créé !'); },
    onError: () => toast.error(t('error')),
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => followUpsApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['followups']); setEditingId(null); toast.success('Suivi mis à jour !'); },
    onError: () => toast.error(t('error')),
  });

  const remove = useMutation({
    mutationFn: (id) => followUpsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['followups']); toast.success('Suivi supprimé'); },
    onError: () => toast.error(t('error')),
  });

  const handleDelete = (id) => {
    if (!confirm('Supprimer ce suivi ?')) return;
    remove.mutate(id);
  };

  return (
    <div className="space-y-4 pb-20 md:pb-0 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('follow_ups')}</h1>
        {isCoach && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Nouveau suivi
          </button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {['', 'planifie', 'complete', 'reporte', 'annule'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full transition-all ${filter === s ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-500 hover:bg-dark-600'}`}>
            {s === '' ? 'Tous' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {showForm && isCoach && (
        <div className="card border border-primary-500/30">
          <div className="flex justify-between mb-4">
            <h2 className="font-bold">Nouveau suivi</h2>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-dark-500" /></button>
          </div>
          <form onSubmit={handleSubmit(d => create.mutate(d))} className="space-y-3">
            <div>
              <label className="label">Client</label>
              <select {...register('clientId', { required: true })} className="input">
                <option value="">Sélectionner un client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Titre</label>
              <input {...register('title', { required: true })} className="input" placeholder="Ex: Bilan mensuel" />
            </div>
            <div>
              <label className="label">Note</label>
              <textarea {...register('note')} className="input resize-none" rows={3} placeholder="Observations, points à discuter..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date planifiée</label>
                <input {...register('scheduledDate')} type="datetime-local" className="input" />
              </div>
              <div>
                <label className="label">{t('priority')}</label>
                <select {...register('priority')} className="input">
                  <option value="normale">{t('normal')}</option>
                  <option value="haute">{t('high')}</option>
                  <option value="basse">{t('low')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={create.isPending} className="btn-primary flex-1">{t('create')}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {followUps.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardCheck size={48} className="text-dark-600 mx-auto mb-4" />
          <p className="text-dark-500">Aucun suivi trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {followUps.map(fu => (
            <div key={fu.id} className="card hover:border-primary-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {PRIORITY_ICONS[fu.priority]}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{fu.title}</p>
                    <p className="text-sm text-dark-500 mt-0.5">
                      {isCoach ? `${fu.client?.firstName} ${fu.client?.lastName}` : `Coach: ${fu.coach?.firstName} ${fu.coach?.lastName}`}
                    </p>
                    {fu.note && <p className="text-sm text-dark-500 mt-2">{fu.note}</p>}
                    {fu.scheduledDate && (
                      <p className="text-xs text-primary-400 mt-2">
                        📅 {new Date(fu.scheduledDate).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[fu.status]}`}>
                    {fu.status}
                  </span>
                  {isCoach && (
                    <div className="flex items-center gap-1">
                      {fu.status === 'planifie' && (
                        <button onClick={() => update.mutate({ id: fu.id, data: { status: 'complete' } })}
                          className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 p-1">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingId(editingId === fu.id ? null : fu.id)}
                        className="p-1 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(fu.id)}
                        disabled={remove.isPending}
                        className="p-1 rounded-lg hover:bg-red-500/10 text-dark-400 hover:text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {editingId === fu.id && isCoach && (
                <EditForm
                  fu={fu}
                  clients={clients}
                  onSave={(data) => update.mutate({ id: fu.id, data })}
                  onCancel={() => setEditingId(null)}
                  isPending={update.isPending}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
