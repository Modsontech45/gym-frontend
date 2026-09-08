import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, subsApi, plansApi, promotionsApi } from '../../services/api';
import {
  CreditCard, Plus, Edit2, Trash2, Check, X,
  Tag, Calendar, Users, Zap,
  ToggleLeft, ToggleRight, Clock, ThumbsUp,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABEL = { journalier: 'Journalier', hebdomadaire: 'Hebdomadaire', mensuel: 'Mensuel' };
const TYPE_COLOR = { journalier: 'text-blue-400 bg-blue-500/10', hebdomadaire: 'text-purple-400 bg-purple-500/10', mensuel: 'text-primary-400 bg-primary-500/10' };

function computeEndDate(startDate, planType) {
  const d = new Date(startDate);
  if (planType === 'journalier')   d.setDate(d.getDate() + 1);
  else if (planType === 'hebdomadaire') d.setDate(d.getDate() + 7);
  else if (planType === 'mensuel') d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

function applyDiscount(price, promo) {
  if (!promo || !price) return parseFloat(price) || 0;
  if (promo.discountType === 'percentage') return Math.max(0, price * (1 - promo.discountValue / 100));
  return Math.max(0, price - promo.discountValue);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
        active ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-400 hover:text-white'
      }`}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

// ─── Tab: Abonnements ─────────────────────────────────────────────────────────

function AbonnementsTab({ clients, plans }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [creditId, setCreditId] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ userId: '', planId: '', promotionId: '', startDate: today, notes: '' });
  const [promoInput, setPromoInput] = useState('');
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const { data: allSubs = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subsApi.getAll().then(r => r.data),
  });

  const selectedPlan = plans.find(p => p.id === form.planId);
  const endDate = selectedPlan ? computeEndDate(form.startDate || today, selectedPlan.planType) : '';
  const basePrice = selectedPlan ? parseFloat(selectedPlan.price) : 0;
  const finalPrice = applyDiscount(basePrice, selectedPromo);

  const validateCode = async () => {
    if (!promoInput.trim()) return;
    setPromoError('');
    try {
      const res = await promotionsApi.validate(promoInput.trim());
      const promo = res.data;
      if (promo.appliesTo !== 'all' && selectedPlan && promo.appliesTo !== selectedPlan.planType) {
        setPromoError(`Ce code ne s'applique qu'aux forfaits ${TYPE_LABEL[promo.appliesTo] || promo.appliesTo}`);
        setSelectedPromo(null);
        return;
      }
      setSelectedPromo(promo);
      set('promotionId', promo.id);
      toast.success(`Promo appliquée : -${promo.discountType === 'percentage' ? promo.discountValue + '%' : Math.round(promo.discountValue).toLocaleString('fr-FR') + ' FCFA'}`);
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Code invalide');
      setSelectedPromo(null);
    }
  };

  const removePromo = () => { setSelectedPromo(null); setPromoInput(''); setPromoError(''); set('promotionId', ''); };

  const createSub = useMutation({
    mutationFn: () => subsApi.create({ ...form, startDate: form.startDate || today }),
    onSuccess: () => {
      queryClient.invalidateQueries(['subscriptions']);
      setShowForm(false);
      setForm({ userId: '', planId: '', promotionId: '', startDate: today, notes: '' });
      setSelectedPromo(null); setPromoInput('');
      toast.success('Abonnement créé !');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const credit = useMutation({
    mutationFn: ({ id, amount }) => subsApi.credit(id, amount),
    onSuccess: () => { queryClient.invalidateQueries(['subscriptions']); setCreditId(null); setCreditAmount(''); toast.success('Solde crédité !'); },
    onError: () => toast.error('Erreur'),
  });

  const approve = useMutation({
    mutationFn: (id) => subsApi.approve(id),
    onSuccess: () => { queryClient.invalidateQueries(['subscriptions']); toast.success('Abonnement approuvé !'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const pendingSubs = allSubs.filter(s => s.status === 'en_attente');
  const totalBalance = allSubs.reduce((sum, s) => sum + parseFloat(s.balance || 0), 0);
  const activeSubs = allSubs.filter(s => s.status === 'actif').length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-primary-400">{activeSubs}</p>
          <p className="text-xs text-dark-500 mt-0.5">Actifs</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-primary-400">{Math.round(totalBalance).toLocaleString('fr-FR')}</p>
          <p className="text-xs text-dark-500 mt-0.5">Solde total (FCFA)</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-primary-400">{allSubs.length}</p>
          <p className="text-xs text-dark-500 mt-0.5">Total</p>
        </div>
      </div>

      <button onClick={() => setShowForm(v => !v)}
        className="btn-primary flex items-center gap-2 text-sm">
        <Plus size={16} /> Nouvel abonnement
      </button>

      {/* Create form */}
      {showForm && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-white flex items-center gap-2"><CreditCard size={16} className="text-primary-400" /> Créer un abonnement</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Client *">
              <select value={form.userId} onChange={e => set('userId', e.target.value)} className="input">
                <option value="">— Choisir un client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </Field>

            <Field label="Forfait *">
              <select value={form.planId} onChange={e => { set('planId', e.target.value); removePromo(); }} className="input">
                <option value="">— Choisir un forfait —</option>
                {['journalier','hebdomadaire','mensuel'].map(type => {
                  const typePlans = plans.filter(p => p.planType === type && p.isActive);
                  if (!typePlans.length) return null;
                  return (
                    <optgroup key={type} label={TYPE_LABEL[type]}>
                      {typePlans.map(p => (
                        <option key={p.id} value={p.id}>{p.name} — {Math.round(p.price).toLocaleString('fr-FR')} FCFA</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </Field>

            <Field label="Date de début">
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className="input" />
            </Field>

            {selectedPlan && (
              <Field label="Date de fin (calculée)">
                <div className="input flex items-center text-dark-400 cursor-default">{endDate}</div>
              </Field>
            )}
          </div>

          {/* Promo code */}
          {selectedPlan && (
            <div>
              <label className="label">Code promotionnel (optionnel)</label>
              {selectedPromo ? (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2.5">
                  <Tag size={14} className="text-green-400 shrink-0" />
                  <span className="text-sm text-green-400 flex-1">{selectedPromo.name} — {selectedPromo.discountType === 'percentage' ? selectedPromo.discountValue + '%' : Math.round(selectedPromo.discountValue).toLocaleString('fr-FR') + ' FCFA'} de réduction</span>
                  <button onClick={removePromo} className="text-dark-500 hover:text-red-400"><X size={14} /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={promoInput} onChange={e => setPromoInput(e.target.value)}
                    className="input flex-1" placeholder="Code promo" onKeyDown={e => e.key === 'Enter' && validateCode()} />
                  <button type="button" onClick={validateCode} className="btn-secondary text-sm px-4">Appliquer</button>
                </div>
              )}
              {promoError && <p className="text-xs text-red-400 mt-1">{promoError}</p>}
            </div>
          )}

          {/* Price preview */}
          {selectedPlan && (
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-dark-500">Prix de base</p>
                <p className={`font-semibold ${selectedPromo ? 'line-through text-dark-500' : 'text-white'}`}>
                  {Math.round(basePrice).toLocaleString('fr-FR')} FCFA
                </p>
                {selectedPromo && (
                  <>
                    <p className="text-xs text-green-400">Réduction appliquée</p>
                    <p className="font-bold text-green-400">{Math.round(finalPrice).toLocaleString('fr-FR')} FCFA</p>
                  </>
                )}
              </div>
              <div className="text-right text-xs text-dark-500">
                <p>{selectedPlan.sessionsIncluded} séances incluses</p>
                <p>{TYPE_LABEL[selectedPlan.planType]}</p>
                <p>{form.startDate} → {endDate}</p>
              </div>
            </div>
          )}

          <Field label="Notes (optionnel)">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              className="input h-16 resize-none" placeholder="Remarques…" />
          </Field>

          <div className="flex gap-3">
            <button onClick={() => createSub.mutate()} disabled={createSub.isPending || !form.userId || !form.planId}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              <Check size={16} /> {createSub.isPending ? 'Création…' : 'Créer'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary px-4"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* Pending subscription requests */}
      {pendingSubs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-2">
            <Clock size={14} /> Demandes en attente ({pendingSubs.length})
          </h3>
          {pendingSubs.map(sub => (
            <div key={sub.id} className="card border border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                    {sub.user?.firstName?.[0]}{sub.user?.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-white">{sub.user?.firstName} {sub.user?.lastName}</p>
                    <p className="text-xs text-dark-500">{sub.planName} · {TYPE_LABEL[sub.planType] || sub.planType}</p>
                    <p className="text-xs text-dark-600">{Math.round(parseFloat(sub.price)).toLocaleString('fr-FR')} FCFA · {sub.sessionsIncluded} séances</p>
                  </div>
                </div>
                <button
                  onClick={() => approve.mutate(sub.id)}
                  disabled={approve.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm font-semibold shrink-0"
                >
                  <ThumbsUp size={15} /> Approuver
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active/all subscription list */}
      <div className="space-y-3">
        {allSubs.filter(s => s.status !== 'en_attente').map(sub => (
          <div key={sub.id} className="card">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm shrink-0">
                  {sub.user?.firstName?.[0]}{sub.user?.lastName?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{sub.user?.firstName} {sub.user?.lastName}</p>
                  <p className="text-xs text-dark-500">{sub.planName}</p>
                  <p className="text-xs text-dark-600">{sub.startDate} → {sub.endDate}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xl font-bold text-primary-400">{Math.round(sub.balance).toLocaleString('fr-FR')} FCFA</p>
                <p className="text-xs text-dark-500">{sub.sessionsUsed}/{sub.sessionsIncluded} séances</p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {sub.planType && <span className={`text-xs px-1.5 py-0.5 rounded-full ${TYPE_COLOR[sub.planType] || 'text-dark-400 bg-dark-700'}`}>{TYPE_LABEL[sub.planType] || sub.planType}</span>}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${sub.status === 'actif' ? 'bg-green-500/20 text-green-400' : 'bg-dark-600 text-dark-400'}`}>{sub.status}</span>
                </div>
                {sub.discountAmount > 0 && <p className="text-xs text-green-400 mt-0.5">-{Math.round(sub.discountAmount).toLocaleString('fr-FR')} FCFA promo</p>}
              </div>
            </div>

            <div className="mt-3 bg-dark-700 rounded-full h-1.5">
              <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (sub.sessionsUsed / (sub.sessionsIncluded || 1)) * 100)}%` }} />
            </div>

            {creditId === sub.id ? (
              <div className="flex gap-2 mt-3">
                <input type="number" value={creditAmount} onChange={e => setCreditAmount(e.target.value)}
                  className="input flex-1 py-2 text-sm" placeholder="Montant à créditer (FCFA)" />
                <button onClick={() => credit.mutate({ id: sub.id, amount: creditAmount })} className="btn-primary text-sm px-4">Créditer</button>
                <button onClick={() => setCreditId(null)} className="btn-secondary text-sm px-3"><X size={14} /></button>
              </div>
            ) : (
              <button onClick={() => setCreditId(sub.id)} className="mt-2 text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1">
                <Plus size={12} /> Créditer le solde
              </button>
            )}
          </div>
        ))}
        {allSubs.filter(s => s.status !== 'en_attente').length === 0 && (
          <div className="card text-center py-10 text-dark-500">Aucun abonnement actif</div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Forfaits ────────────────────────────────────────────────────────────

function ForfaitsTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', planType: 'mensuel', price: '', sessionsIncluded: '', description: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: () => plansApi.getAll().then(r => r.data) });

  const save = useMutation({
    mutationFn: () => editId ? plansApi.update(editId, form) : plansApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries(['plans']);
      resetForm();
      toast.success(editId ? 'Forfait modifié' : 'Forfait créé');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const deletePlan = useMutation({
    mutationFn: (id) => plansApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['plans']); toast.success('Forfait supprimé'); },
    onError: () => toast.error('Erreur'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }) => plansApi.update(id, { isActive: !isActive }),
    onSuccess: () => queryClient.invalidateQueries(['plans']),
  });

  const resetForm = () => { setForm({ name: '', planType: 'mensuel', price: '', sessionsIncluded: '', description: '' }); setEditId(null); setShowForm(false); };
  const startEdit = (plan) => { setForm({ name: plan.name, planType: plan.planType, price: plan.price, sessionsIncluded: plan.sessionsIncluded, description: plan.description || '' }); setEditId(plan.id); setShowForm(true); };

  return (
    <div className="space-y-4">
      <button onClick={() => { resetForm(); setShowForm(v => !v); }}
        className="btn-primary flex items-center gap-2 text-sm">
        <Plus size={16} /> Nouveau forfait
      </button>

      {showForm && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-white">{editId ? 'Modifier le forfait' : 'Nouveau forfait'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Nom *">
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input" placeholder="Ex: Mensuel Standard" />
            </Field>
            <Field label="Type *">
              <select value={form.planType} onChange={e => set('planType', e.target.value)} className="input">
                <option value="journalier">Journalier</option>
                <option value="hebdomadaire">Hebdomadaire</option>
                <option value="mensuel">Mensuel</option>
              </select>
            </Field>
            <Field label="Prix (FCFA) *">
              <input type="number" value={form.price} onChange={e => set('price', e.target.value)} className="input" placeholder="5000" min="0" />
            </Field>
            <Field label="Séances incluses">
              <input type="number" value={form.sessionsIncluded} onChange={e => set('sessionsIncluded', e.target.value)} className="input" placeholder="0" min="0" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Description (optionnel)">
                <input value={form.description} onChange={e => set('description', e.target.value)} className="input" placeholder="Accès illimité + coaching…" />
              </Field>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => save.mutate()} disabled={save.isPending || !form.name || !form.price}
              className="btn-primary flex items-center gap-2">
              <Check size={16} /> {save.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button onClick={resetForm} className="btn-secondary px-4"><X size={16} /></button>
          </div>
        </div>
      )}

      {['journalier', 'hebdomadaire', 'mensuel'].map(type => {
        const typePlans = plans.filter(p => p.planType === type);
        if (!typePlans.length) return null;
        return (
          <div key={type}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${type === 'journalier' ? 'text-blue-400' : type === 'hebdomadaire' ? 'text-purple-400' : 'text-primary-400'}`}>
              {TYPE_LABEL[type]}
            </h3>
            <div className="space-y-2">
              {typePlans.map(plan => (
                <div key={plan.id} className={`card flex items-center justify-between gap-3 ${!plan.isActive ? 'opacity-50' : ''}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-white">{plan.name}</p>
                      {!plan.isActive && <span className="text-xs text-dark-500">(inactif)</span>}
                    </div>
                    {plan.description && <p className="text-xs text-dark-500 mt-0.5 truncate">{plan.description}</p>}
                    <p className="text-xs text-dark-600">{plan.sessionsIncluded} séance{plan.sessionsIncluded !== 1 ? 's' : ''} incluse{plan.sessionsIncluded !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-lg font-bold text-primary-400">{Math.round(plan.price).toLocaleString('fr-FR')} FCFA</p>
                    <button onClick={() => toggleActive.mutate({ id: plan.id, isActive: plan.isActive })}
                      className={`transition-colors ${plan.isActive ? 'text-primary-400 hover:text-dark-500' : 'text-dark-500 hover:text-primary-400'}`}>
                      {plan.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                    <button onClick={() => startEdit(plan)} className="text-dark-500 hover:text-white transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => { if (confirm(`Supprimer le forfait "${plan.name}" ?`)) deletePlan.mutate(plan.id); }}
                      className="text-dark-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {plans.length === 0 && <div className="card text-center py-10 text-dark-500">Aucun forfait. Créez-en un pour commencer.</div>}
    </div>
  );
}

// ─── Tab: Promotions ──────────────────────────────────────────────────────────

function PromotionsTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ name: '', code: '', discountType: 'percentage', discountValue: '', appliesTo: 'all', startDate: today, endDate: '', usageLimit: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const { data: promos = [] } = useQuery({ queryKey: ['promotions'], queryFn: () => promotionsApi.getAll().then(r => r.data) });

  const save = useMutation({
    mutationFn: () => editId ? promotionsApi.update(editId, form) : promotionsApi.create(form),
    onSuccess: () => { queryClient.invalidateQueries(['promotions']); resetForm(); toast.success(editId ? 'Promotion modifiée' : 'Promotion créée'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const toggle = useMutation({
    mutationFn: (id) => promotionsApi.toggle(id),
    onSuccess: () => queryClient.invalidateQueries(['promotions']),
  });

  const deletePromo = useMutation({
    mutationFn: (id) => promotionsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['promotions']); toast.success('Promotion supprimée'); },
    onError: () => toast.error('Erreur'),
  });

  const resetForm = () => { setForm({ name: '', code: '', discountType: 'percentage', discountValue: '', appliesTo: 'all', startDate: today, endDate: '', usageLimit: '' }); setEditId(null); setShowForm(false); };
  const startEdit = (p) => { setForm({ name: p.name, code: p.code || '', discountType: p.discountType, discountValue: p.discountValue, appliesTo: p.appliesTo, startDate: p.startDate, endDate: p.endDate, usageLimit: p.usageLimit || '' }); setEditId(p.id); setShowForm(true); };

  const isExpired = (p) => p.endDate < today;

  return (
    <div className="space-y-4">
      <button onClick={() => { resetForm(); setShowForm(v => !v); }}
        className="btn-primary flex items-center gap-2 text-sm">
        <Tag size={16} /> Nouvelle promotion
      </button>

      {showForm && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-white">{editId ? 'Modifier la promotion' : 'Nouvelle promotion'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Nom *">
              <input value={form.name} onChange={e => set('name', e.target.value)} className="input" placeholder="Ex: Promo Rentrée" />
            </Field>
            <Field label="Code promo (optionnel)">
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} className="input font-mono" placeholder="RENTREE20" />
            </Field>
            <Field label="Type de réduction *">
              <select value={form.discountType} onChange={e => set('discountType', e.target.value)} className="input">
                <option value="percentage">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (FCFA)</option>
              </select>
            </Field>
            <Field label={`Valeur * (${form.discountType === 'percentage' ? '%' : 'FCFA'})`}>
              <input type="number" value={form.discountValue} onChange={e => set('discountValue', e.target.value)} className="input" placeholder={form.discountType === 'percentage' ? '20' : '1000'} min="0" max={form.discountType === 'percentage' ? 100 : undefined} />
            </Field>
            <Field label="Applicable à">
              <select value={form.appliesTo} onChange={e => set('appliesTo', e.target.value)} className="input">
                <option value="all">Tous les forfaits</option>
                <option value="journalier">Journalier uniquement</option>
                <option value="hebdomadaire">Hebdomadaire uniquement</option>
                <option value="mensuel">Mensuel uniquement</option>
              </select>
            </Field>
            <Field label="Limite d'utilisation (vide = illimité)">
              <input type="number" value={form.usageLimit} onChange={e => set('usageLimit', e.target.value)} className="input" placeholder="10" min="1" />
            </Field>
            <Field label="Date de début *">
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className="input" />
            </Field>
            <Field label="Date de fin *">
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className="input" min={form.startDate} />
            </Field>
          </div>
          <div className="flex gap-3">
            <button onClick={() => save.mutate()} disabled={save.isPending || !form.name || !form.discountValue || !form.endDate}
              className="btn-primary flex items-center gap-2">
              <Check size={16} /> {save.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button onClick={resetForm} className="btn-secondary px-4"><X size={16} /></button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {promos.map(p => {
          const expired = isExpired(p);
          const discount = p.discountType === 'percentage'
            ? `-${p.discountValue}%`
            : `-${Math.round(p.discountValue).toLocaleString('fr-FR')} FCFA`;
          return (
            <div key={p.id} className={`card ${!p.isActive || expired ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-white">{p.name}</p>
                    <span className="text-lg font-bold text-primary-400">{discount}</span>
                    {p.code && (
                      <span className="text-xs font-mono bg-dark-700 text-primary-300 px-2 py-0.5 rounded">{p.code}</span>
                    )}
                    {expired && <span className="text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">Expirée</span>}
                    {!expired && p.isActive && <span className="text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">Active</span>}
                    {!p.isActive && !expired && <span className="text-xs text-dark-500 bg-dark-700 px-2 py-0.5 rounded-full">Désactivée</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-dark-500">
                    <span className="flex items-center gap-1"><Calendar size={11} /> {p.startDate} → {p.endDate}</span>
                    {p.appliesTo !== 'all' && <span className="flex items-center gap-1"><Tag size={11} /> {TYPE_LABEL[p.appliesTo] || p.appliesTo}</span>}
                    {p.usageLimit && <span className="flex items-center gap-1"><Users size={11} /> {p.usageCount}/{p.usageLimit} utilisations</span>}
                    {!p.usageLimit && p.usageCount > 0 && <span>{p.usageCount} utilisations</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggle.mutate(p.id)}
                    className={`transition-colors ${p.isActive ? 'text-primary-400 hover:text-dark-500' : 'text-dark-500 hover:text-primary-400'}`}>
                    {p.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button onClick={() => startEdit(p)} className="text-dark-500 hover:text-white transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => { if (confirm(`Supprimer la promotion "${p.name}" ?`)) deletePromo.mutate(p.id); }}
                    className="text-dark-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          );
        })}
        {promos.length === 0 && <div className="card text-center py-10 text-dark-500">Aucune promotion créée.</div>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionsPage() {
  const [tab, setTab] = useState('abonnements');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => usersApi.getClients().then(r => r.data),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.getAll().then(r => r.data),
  });

  return (
    <div className="space-y-4 pb-20 md:pb-0 animate-fade-in">
      <h1 className="text-2xl font-bold">Abonnements</h1>

      <div className="flex gap-2 flex-wrap">
        <TabBtn active={tab === 'abonnements'} onClick={() => setTab('abonnements')}>
          <span className="flex items-center gap-1.5"><CreditCard size={14} /> Abonnements</span>
        </TabBtn>
        <TabBtn active={tab === 'forfaits'} onClick={() => setTab('forfaits')}>
          <span className="flex items-center gap-1.5"><Zap size={14} /> Forfaits</span>
        </TabBtn>
        <TabBtn active={tab === 'promotions'} onClick={() => setTab('promotions')}>
          <span className="flex items-center gap-1.5"><Tag size={14} /> Promotions</span>
        </TabBtn>
      </div>

      {tab === 'abonnements' && <AbonnementsTab clients={clients} plans={plans} />}
      {tab === 'forfaits'    && <ForfaitsTab />}
      {tab === 'promotions'  && <PromotionsTab />}
    </div>
  );
}
