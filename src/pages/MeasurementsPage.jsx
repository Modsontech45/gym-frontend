import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { measurementsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Ruler, Plus, TrendingUp, X, Pencil, Trash2, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function MeasurementsPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const { register, handleSubmit, reset, setValue } = useForm();

  const { data: measurements = [] } = useQuery({
    queryKey: ['measurements'],
    queryFn: () => measurementsApi.getMy().then(r => r.data),
  });

  const add = useMutation({
    mutationFn: measurementsApi.add,
    onSuccess: () => { queryClient.invalidateQueries(['measurements']); setShowForm(false); reset(); toast.success('Mesures enregistrées !'); },
    onError: () => toast.error(t('error')),
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => measurementsApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['measurements']); setEditingId(null); reset(); toast.success('Mesures mises à jour !'); },
    onError: () => toast.error(t('error')),
  });

  const remove = useMutation({
    mutationFn: (id) => measurementsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['measurements']); setConfirmDeleteId(null); toast.success('Mesures supprimées'); },
    onError: () => toast.error(t('error')),
  });

  const startEdit = (m) => {
    setEditingId(m.id);
    setShowForm(false);
    ['weight','height','bodyFat','muscleMass','chest','waist','hips','arms','notes'].forEach(k => setValue(k, m[k] || ''));
    setValue('measuredAt', m.measuredAt ? m.measuredAt.split('T')[0] : '');
  };

  const chartData = [...measurements].reverse().map(m => ({
    date: new Date(m.measuredAt).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    poids: parseFloat(m.weight) || null,
    MG: parseFloat(m.bodyFat) || null,
  }));

  const latest = measurements[0];

  return (
    <div className="space-y-4 pb-20 md:pb-0 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('measurements')}</h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Ajouter
        </button>
      </div>

      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: t('weight'), value: latest.weight ? `${latest.weight} kg` : '—' },
            { label: t('body_fat'), value: latest.bodyFat ? `${latest.bodyFat}%` : '—' },
            { label: t('muscle_mass'), value: latest.muscleMass ? `${latest.muscleMass} kg` : '—' },
            { label: 'Tour de taille', value: latest.waist ? `${latest.waist} cm` : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center">
              <p className="text-2xl font-bold text-primary-400">{value}</p>
              <p className="text-xs text-dark-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {chartData.length > 1 && (
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-primary-400" /> Évolution du poids</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }} />
              <Line type="monotone" dataKey="poids" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316', r: 4 }} name="Poids (kg)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {(showForm || editingId) && (
        <div className="card border border-primary-500/30">
          <div className="flex justify-between mb-4">
            <h2 className="font-bold">{editingId ? 'Modifier les mesures' : 'Nouvelles mesures'}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); reset(); }}><X size={18} className="text-dark-500" /></button>
          </div>
          <form onSubmit={handleSubmit(d => editingId ? update.mutate({ id: editingId, data: d }) : add.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">{t('weight')}</label>
                <input {...register('weight')} type="number" step="0.1" className="input" placeholder="70" />
              </div>
              <div>
                <label className="label">{t('height')}</label>
                <input {...register('height')} type="number" step="0.1" className="input" placeholder="175" />
              </div>
              <div>
                <label className="label">{t('body_fat')}</label>
                <input {...register('bodyFat')} type="number" step="0.1" className="input" placeholder="15" />
              </div>
              <div>
                <label className="label">{t('muscle_mass')}</label>
                <input {...register('muscleMass')} type="number" step="0.1" className="input" placeholder="55" />
              </div>
              <div>
                <label className="label">Poitrine (cm)</label>
                <input {...register('chest')} type="number" step="0.1" className="input" />
              </div>
              <div>
                <label className="label">Tour de taille (cm)</label>
                <input {...register('waist')} type="number" step="0.1" className="input" />
              </div>
              <div>
                <label className="label">Hanches (cm)</label>
                <input {...register('hips')} type="number" step="0.1" className="input" />
              </div>
              <div>
                <label className="label">Bras (cm)</label>
                <input {...register('arms')} type="number" step="0.1" className="input" />
              </div>
            </div>
            <div>
              <label className="label">Date</label>
              <input {...register('measuredAt')} type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea {...register('notes')} className="input resize-none" rows={2} />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={add.isPending || update.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Check size={16} /> {t('save')}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); reset(); }} className="btn-secondary flex-1">{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDeleteId(null)} />
          <div className="relative z-10 bg-dark-800 border border-dark-700 rounded-2xl p-6 mx-4 mb-6 sm:mb-0 w-full max-w-sm shadow-2xl">
            <p className="font-semibold text-white text-center mb-1">Supprimer ces mesures ?</p>
            <p className="text-sm text-dark-500 text-center mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 btn-secondary">Annuler</button>
              <button onClick={() => remove.mutate(confirmDeleteId)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {measurements.map(m => (
          <div key={m.id} className="card">
            <div className="flex justify-between items-start">
              <p className="font-medium">{new Date(m.measuredAt).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(m)}
                  className="p-1.5 rounded-lg text-dark-500 hover:text-primary-400 hover:bg-dark-700 transition-colors">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setConfirmDeleteId(m.id)}
                  className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-dark-700 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {m.weight && <div className="text-center"><p className="font-bold text-primary-400">{m.weight} kg</p><p className="text-xs text-dark-500">Poids</p></div>}
              {m.bodyFat && <div className="text-center"><p className="font-bold text-primary-400">{m.bodyFat}%</p><p className="text-xs text-dark-500">MG</p></div>}
              {m.muscleMass && <div className="text-center"><p className="font-bold text-primary-400">{m.muscleMass} kg</p><p className="text-xs text-dark-500">MM</p></div>}
            </div>
            {m.notes && <p className="text-sm text-dark-500 mt-2">{m.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
