import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { productsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { ShoppingBag, Plus, Pencil, Trash2, X, Save, Tag, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['protéine', 'créatine', 'brûleur', 'vêtements', 'équipement', 'accessoires', 'autre'];

const fmt = (n) => Number(n).toLocaleString('fr-FR');
const pct = (orig, cur) => Math.round((1 - cur / orig) * 100);

function ProductFormModal({ product, onClose, onSaved }) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    image: product?.image || '',
    category: product?.category || 'protéine',
    originalPrice: product?.originalPrice || '',
    currentPrice: product?.currentPrice || '',
    currency: product?.currency || 'FCFA',
    inStock: product?.inStock !== false,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const create = useMutation({ mutationFn: productsApi.create, onSuccess: onSaved, onError: () => toast.error('Erreur') });
  const update = useMutation({ mutationFn: ({ id, data }) => productsApi.update(id, data), onSuccess: onSaved, onError: () => toast.error('Erreur') });

  const submit = () => {
    if (!form.name.trim()) return toast.error('Le nom est requis');
    if (!form.originalPrice || !form.currentPrice) return toast.error('Les prix sont requis');
    if (Number(form.currentPrice) > Number(form.originalPrice)) return toast.error('Le prix actuel doit être ≤ au prix original');
    if (isEdit) update.mutate({ id: product.id, data: form });
    else create.mutate(form);
  };

  const isPending = create.isPending || update.isPending;

  const fieldCls = 'w-full bg-dark-700 border border-dark-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 transition-colors';

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{isEdit ? 'Modifier le produit' : 'Nouveau produit'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-dark-700 text-dark-400"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-1.5 block">Nom du produit</label>
            <input className={fieldCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Whey Protéine Vanille" />
          </div>

          <div>
            <label className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-1.5 block">Catégorie</label>
            <select className={fieldCls} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-1.5 block">Description (optionnelle)</label>
            <textarea className={`${fieldCls} resize-none`} rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ingrédients, dosage, avantages…" />
          </div>

          <div>
            <label className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-1.5 block">Image (URL)</label>
            <input className={fieldCls} value={form.image} onChange={e => set('image', e.target.value)} placeholder="https://…" />
            {form.image && (
              <img src={form.image} alt="" className="mt-2 w-full h-32 object-contain rounded-xl bg-dark-700" onError={e => e.target.style.display='none'} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-1.5 block">Prix avant (FCFA)</label>
              <input type="number" min="0" className={fieldCls} value={form.originalPrice} onChange={e => set('originalPrice', e.target.value)} placeholder="25000" />
            </div>
            <div>
              <label className="text-xs font-semibold text-dark-400 uppercase tracking-wide mb-1.5 block">Prix actuel (FCFA)</label>
              <input type="number" min="0" className={fieldCls} value={form.currentPrice} onChange={e => set('currentPrice', e.target.value)} placeholder="19000" />
            </div>
          </div>

          {form.originalPrice && form.currentPrice && Number(form.currentPrice) < Number(form.originalPrice) && (
            <div className="flex items-center gap-2 text-xs text-green-400 bg-green-400/10 rounded-xl px-3 py-2">
              <Tag size={13} />
              Réduction de {pct(Number(form.originalPrice), Number(form.currentPrice))}% — économie de {fmt(Number(form.originalPrice) - Number(form.currentPrice))} FCFA
            </div>
          )}

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.inStock} onChange={e => set('inStock', e.target.checked)} className="w-4 h-4 accent-primary-500" />
            <span className="text-sm text-dark-300">En stock</span>
          </label>
        </div>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={submit} disabled={isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
            <Save size={15} /> {isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, isCoach, onEdit, onDelete, onBuy }) {
  const hasDiscount = Number(product.currentPrice) < Number(product.originalPrice);
  const discount = hasDiscount ? pct(Number(product.originalPrice), Number(product.currentPrice)) : 0;

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-2xl overflow-hidden hover:border-primary-500/30 transition-all group">
      {/* Image */}
      <div className="relative bg-dark-700 aspect-square overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-dark-600" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          {!product.inStock && (
            <span className="bg-dark-900/80 text-dark-400 text-[11px] px-2 py-0.5 rounded-full">
              Rupture
            </span>
          )}
        </div>
        {/* Coach actions */}
        {isCoach && (
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(product)} className="p-1.5 bg-dark-800/90 rounded-lg text-dark-300 hover:text-white transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(product.id)} className="p-1.5 bg-dark-800/90 rounded-lg text-dark-300 hover:text-red-400 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[10px] text-primary-400 font-medium uppercase tracking-wide mb-1 capitalize">{product.category}</p>
        <h3 className="font-semibold text-sm leading-snug mb-3 line-clamp-2">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-dark-500 mb-3 line-clamp-2">{product.description}</p>
        )}

        {/* Pricing */}
        <div className="flex items-end gap-2 mb-3">
          <span className="text-lg font-bold text-white">{fmt(product.currentPrice)} <span className="text-xs font-normal text-dark-400">{product.currency}</span></span>
          {hasDiscount && (
            <span className="text-sm text-dark-500 line-through mb-0.5">{fmt(product.originalPrice)}</span>
          )}
        </div>

        {/* Seller */}
        <p className="text-[10px] text-dark-600 mb-3">Vendu par {product.seller?.firstName} {product.seller?.lastName}</p>

        {/* Buy button */}
        {!isCoach && (
          <button
            onClick={() => onBuy(product)}
            disabled={!product.inStock}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              product.inStock
                ? 'bg-primary-500 hover:bg-primary-400 text-white'
                : 'bg-dark-700 text-dark-500 cursor-not-allowed'
            }`}
          >
            <ShoppingBag size={15} />
            {product.inStock ? 'Acheter' : 'Indisponible'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function BoutiquePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isCoach = ['admin', 'coach'].includes(user?.role);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterCat, setFilterCat] = useState('Tous');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list().then(r => r.data),
  });

  const remove = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products'] }); toast.success('Produit supprimé'); },
    onError: () => toast.error('Erreur'),
  });

  const handleDelete = (id) => {
    if (!confirm('Supprimer ce produit ?')) return;
    remove.mutate(id);
  };

  const handleBuy = (product) => {
    const sellerId = product.seller?.id || product.coachId;
    const msg = encodeURIComponent(
      `Bonjour, je suis intéressé(e) par :\n*${product.name}* — ${fmt(product.currentPrice)} ${product.currency}\n${product.image || ''}`
    );
    navigate(`/messages/${sellerId}?prefill=${msg}`);
  };

  const onSaved = () => {
    qc.invalidateQueries({ queryKey: ['products'] });
    setShowForm(false);
    setEditing(null);
    toast.success(editing ? 'Produit mis à jour !' : 'Produit créé !');
  };

  const cats = ['Tous', ...CATEGORIES];
  const displayed = filterCat === 'Tous' ? products : products.filter(p => p.category === filterCat);

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-5 pb-24 md:pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="text-primary-400" size={24} /> Boutique
          </h1>
          <p className="text-dark-400 text-sm mt-0.5">Produits de la salle</p>
        </div>
        {isCoach && (
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Ajouter un produit
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {cats.map(c => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filterCat === c ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-400 hover:bg-dark-600 hover:text-white'
            }`}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="card text-center py-20">
          <ShoppingBag size={48} className="text-dark-700 mx-auto mb-4" />
          <p className="text-dark-500 font-medium">Aucun produit disponible</p>
          {isCoach && (
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary mt-4 mx-auto flex items-center gap-2 text-sm">
              <Plus size={14} /> Ajouter le premier produit
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayed.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              isCoach={isCoach}
              onEdit={(prod) => { setEditing(prod); setShowForm(true); }}
              onDelete={handleDelete}
              onBuy={handleBuy}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ProductFormModal
          product={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
