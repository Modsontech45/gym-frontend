import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gymApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Plus, Pencil, Trash2, Check } from 'lucide-react';

const XOF = (n) => n.toLocaleString('fr-FR') + ' XOF';

function PackageFormModal({ pkg, gymId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: pkg?.name || '',
    description: pkg?.description || '',
    price: pkg?.price || 0,
    durationDays: pkg?.durationDays || 30,
    features: (pkg?.features || []).join('\n'),
    isActive: pkg?.isActive !== false,
  });

  const mutation = useMutation({
    mutationFn: (data) => pkg ? gymApi.updatePackage(pkg.id, data) : gymApi.createPackage(data),
    onSuccess: onSaved,
  });

  const submit = () => {
    mutation.mutate({
      ...form,
      price: Number(form.price),
      durationDays: Number(form.durationDays),
      features: form.features.split('\n').map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-800 rounded-2xl w-full max-w-md border border-dark-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-dark-700">
          <h2 className="font-bold">{pkg ? 'Modifier le forfait' : 'Nouveau forfait'}</h2>
          <button onClick={onClose} className="text-dark-400 hover:text-white">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Nom</label>
            <input className="input w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Mensuel, Journée…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prix (XOF)</label>
              <input type="number" className="input w-full" value={form.price} min={0}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="label">Durée (jours)</label>
              <input type="number" className="input w-full" value={form.durationDays} min={1}
                onChange={e => setForm(f => ({ ...f, durationDays: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input w-full" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Avantages (un par ligne)</label>
            <textarea className="input w-full resize-none text-sm" rows={4} value={form.features}
              onChange={e => setForm(f => ({ ...f, features: e.target.value }))}
              placeholder={"Accès illimité\nVestiaires & douches\nCours collectifs"} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-primary-500" />
            <span className="text-sm">Forfait actif</span>
          </label>
        </div>
        <div className="p-5 border-t border-dark-700 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={submit} disabled={mutation.isPending || !form.name} className="btn-primary flex-1">
            {mutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GymPackagesPage() {
  const user = useAuthStore(s => s.user);
  const isAdmin = user?.role === 'admin';
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['gymPackages'],
    queryFn: () => gymApi.getPackages().then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => gymApi.deletePackage(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gymPackages'] }),
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Forfaits & tarifs</h1>
          <p className="text-dark-400 text-sm mt-1">Choisissez la formule qui vous convient</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nouveau forfait
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <h3 className="font-bold text-xl mb-1">{pkg.name}</h3>
                {pkg.description && <p className="text-dark-400 text-sm mb-4">{pkg.description}</p>}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-primary-400">{XOF(pkg.price)}</span>
                  <span className="text-dark-400 text-sm ml-2">/ {pkg.durationDays === 1 ? 'jour' : `${pkg.durationDays} jours`}</span>
                </div>
                {pkg.features && pkg.features.length > 0 && (
                  <ul className="space-y-2">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-dark-300">
                        <Check size={14} className="text-primary-400 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {isAdmin && (
                <div className="border-t border-dark-700 p-3 flex gap-2">
                  <button onClick={() => { setEditing(pkg); setShowForm(true); }}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-dark-400 hover:text-white py-1.5 hover:bg-dark-700 rounded-lg transition-colors">
                    <Pencil size={13} /> Modifier
                  </button>
                  <button onClick={() => { if (confirm('Supprimer ce forfait ?')) deleteMutation.mutate(pkg.id); }}
                    className="flex-1 flex items-center justify-center gap-1 text-xs text-dark-400 hover:text-red-400 py-1.5 hover:bg-red-400/10 rounded-lg transition-colors">
                    <Trash2 size={13} /> Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PackageFormModal
          pkg={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ['gymPackages'] }); }}
        />
      )}
    </div>
  );
}
