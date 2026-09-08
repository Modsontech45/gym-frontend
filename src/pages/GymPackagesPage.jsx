import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi, subsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Check, Clock, ShoppingCart, Pencil, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_LABEL = { journalier: 'Journalier', hebdomadaire: 'Hebdomadaire', mensuel: 'Mensuel' };
const TYPE_COLOR = {
  journalier: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  hebdomadaire: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  mensuel: 'text-primary-400 bg-primary-500/10 border-primary-500/20',
};
const TYPE_HEADER_COLOR = {
  journalier: 'text-blue-400',
  hebdomadaire: 'text-purple-400',
  mensuel: 'text-primary-400',
};

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function PlanFormModal({ plan, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: plan?.name || '',
    planType: plan?.planType || 'mensuel',
    price: plan?.price || '',
    sessionsIncluded: plan?.sessionsIncluded || '',
    description: plan?.description || '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => plan ? plansApi.update(plan.id, form) : plansApi.create(form),
    onSuccess: onSaved,
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-800 rounded-2xl w-full max-w-md border border-dark-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-dark-700">
          <h2 className="font-bold">{plan ? 'Modifier le forfait' : 'Nouveau forfait'}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <Field label="Nom *">
            <input className="input w-full" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Mensuel Standard" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type *">
              <select className="input w-full" value={form.planType} onChange={e => set('planType', e.target.value)}>
                <option value="journalier">Journalier</option>
                <option value="hebdomadaire">Hebdomadaire</option>
                <option value="mensuel">Mensuel</option>
              </select>
            </Field>
            <Field label="Prix (FCFA) *">
              <input type="number" className="input w-full" value={form.price} min={0}
                onChange={e => set('price', e.target.value)} placeholder="5000" />
            </Field>
          </div>
          <Field label="Séances incluses">
            <input type="number" className="input w-full" value={form.sessionsIncluded} min={0}
              onChange={e => set('sessionsIncluded', e.target.value)} placeholder="0" />
          </Field>
          <Field label="Description (optionnel)">
            <textarea className="input w-full resize-none text-sm" rows={3} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Accès à la salle + coaching personnalisé…" />
          </Field>
        </div>
        <div className="p-5 border-t border-dark-700 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.name || !form.price}
            className="btn-primary flex-1"
          >
            {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, isStaff, pendingPlanIds, onEdit, onDelete, onToggle, onSubscribe }) {
  const isPending = pendingPlanIds.has(plan.id);
  const color = TYPE_COLOR[plan.planType] || TYPE_COLOR.mensuel;
  const sessions = parseInt(plan.sessionsIncluded) || 0;

  return (
    <div className={`bg-dark-800 rounded-2xl border flex flex-col overflow-hidden transition-all ${plan.isActive ? 'border-dark-700' : 'border-dark-700 opacity-50'}`}>
      {/* Type badge */}
      <div className={`px-5 pt-5 pb-0`}>
        <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full border ${color}`}>
          {TYPE_LABEL[plan.planType] || plan.planType}
        </span>
        {!plan.isActive && <span className="ml-2 text-xs text-dark-500">(inactif)</span>}
      </div>

      {/* Content */}
      <div className="p-5 flex-1">
        <h3 className="font-bold text-lg text-white mb-1">{plan.name}</h3>
        {plan.description && (
          <p className="text-dark-400 text-sm mb-4 leading-relaxed">{plan.description}</p>
        )}
        <div className="mb-4">
          <span className="text-3xl font-extrabold text-primary-400">
            {Math.round(parseFloat(plan.price)).toLocaleString('fr-FR')}
          </span>
          <span className="text-dark-400 text-sm ml-1">FCFA</span>
        </div>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm text-dark-300">
            <Check size={14} className="text-primary-400 shrink-0" />
            {sessions} séance{sessions !== 1 ? 's' : ''} incluse{sessions !== 1 ? 's' : ''}
          </li>
          {plan.description?.split('\n').filter(Boolean).map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-dark-300">
              <Check size={14} className="text-primary-400 mt-0.5 shrink-0" /> {f}
            </li>
          ))}
        </ul>
      </div>

      {/* Action row */}
      <div className="border-t border-dark-700">
        {isStaff ? (
          <div className="p-3 flex gap-2 items-center">
            <button
              onClick={() => onToggle(plan)}
              className={`p-1.5 rounded-lg transition-colors ${plan.isActive ? 'text-primary-400 hover:text-dark-500' : 'text-dark-500 hover:text-primary-400'}`}
              title={plan.isActive ? 'Désactiver' : 'Activer'}
            >
              {plan.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            </button>
            <button
              onClick={() => onEdit(plan)}
              className="flex-1 flex items-center justify-center gap-1 text-xs text-dark-400 hover:text-white py-1.5 hover:bg-dark-700 rounded-lg transition-colors"
            >
              <Pencil size={13} /> Modifier
            </button>
            <button
              onClick={() => onDelete(plan)}
              className="flex-1 flex items-center justify-center gap-1 text-xs text-dark-400 hover:text-red-400 py-1.5 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <Trash2 size={13} /> Supprimer
            </button>
          </div>
        ) : (
          <div className="p-4">
            {isPending ? (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-amber-400 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <Clock size={15} /> En attente de confirmation
              </div>
            ) : (
              <button
                onClick={() => onSubscribe(plan)}
                disabled={!plan.isActive}
                className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-sm font-semibold"
              >
                <ShoppingCart size={16} /> S'abonner
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GymPackagesPage() {
  const user = useAuthStore(s => s.user);
  const isStaff = user?.role === 'admin' || user?.role === 'coach';
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getAll().then(r => r.data),
  });

  // For clients: track which plans they already have a pending request for
  const { data: mySubs = [] } = useQuery({
    queryKey: ['my-subs'],
    queryFn: () => subsApi.getMy().then(r => r.data),
    enabled: !isStaff,
  });
  const pendingPlanIds = new Set(
    mySubs.filter(s => s.status === 'en_attente').map(s => s.planId)
  );

  const deleteMutation = useMutation({
    mutationFn: (id) => plansApi.delete(id),
    onSuccess: () => { qc.invalidateQueries(['plans']); toast.success('Forfait supprimé'); },
    onError: () => toast.error('Erreur'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => plansApi.update(id, { isActive: !isActive }),
    onSuccess: () => qc.invalidateQueries(['plans']),
  });

  const subscribeMutation = useMutation({
    mutationFn: (planId) => subsApi.request(planId),
    onSuccess: () => {
      qc.invalidateQueries(['my-subs']);
      toast.success('Demande envoyée ! Votre coach la confirmera après réception du paiement.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const activePlans = isStaff ? plans : plans.filter(p => p.isActive);
  const grouped = ['journalier', 'hebdomadaire', 'mensuel'].reduce((acc, type) => {
    const items = activePlans.filter(p => p.planType === type);
    if (items.length) acc[type] = items;
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Forfaits & tarifs</h1>
          <p className="text-dark-400 text-sm mt-1">Choisissez la formule qui vous convient</p>
        </div>
        {isStaff && (
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Nouveau forfait
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="card text-center py-20 text-dark-500">
          {isStaff ? 'Aucun forfait. Créez-en un pour commencer.' : 'Aucun forfait disponible pour le moment.'}
        </div>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <div key={type} className="mb-8">
            <h2 className={`text-xs font-bold uppercase tracking-widest mb-4 ${TYPE_HEADER_COLOR[type]}`}>
              {TYPE_LABEL[type]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map(plan => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isStaff={isStaff}
                  pendingPlanIds={pendingPlanIds}
                  onEdit={(p) => { setEditing(p); setShowForm(true); }}
                  onDelete={(p) => {
                    if (confirm(`Supprimer le forfait "${p.name}" ?`)) deleteMutation.mutate(p.id);
                  }}
                  onToggle={(p) => toggleMutation.mutate({ id: p.id, isActive: p.isActive })}
                  onSubscribe={(p) => subscribeMutation.mutate(p.id)}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {showForm && (
        <PlanFormModal
          plan={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            qc.invalidateQueries(['plans']);
            toast.success(editing ? 'Forfait modifié' : 'Forfait créé');
          }}
        />
      )}
    </div>
  );
}
