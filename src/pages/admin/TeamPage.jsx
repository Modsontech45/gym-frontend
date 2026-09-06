import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { ShieldCheck, Plus, X, Copy, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const ROLE_BADGE = {
  admin:  { label: 'Admin',       cls: 'bg-red-500/20 text-red-400' },
  coach:  { label: 'Sous-admin',  cls: 'bg-primary-500/20 text-primary-400' },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="ml-1 text-dark-500 hover:text-primary-400 transition-colors" title="Copier">
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  );
}

export default function TeamPage() {
  const { user: me } = useAuthStore();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newCreds, setNewCreds] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: coaches = [], isLoading } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => usersApi.getCoaches().then(r => r.data),
  });

  const create = useMutation({
    mutationFn: usersApi.createCoach,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['coaches']);
      setShowForm(false);
      reset();
      setNewCreds({ email: res.data.email, password: res.data.tempPassword, name: res.data.firstName });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur lors de la création'),
  });

  return (
    <div className="space-y-4 pb-20 md:pb-0 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Équipe</h1>
          <p className="text-sm text-dark-500 mt-0.5">Gérez les sous-admins et coachs de votre espace</p>
        </div>
        <button onClick={() => { setShowForm(true); setNewCreds(null); }}
          className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Ajouter un sous-admin
        </button>
      </div>

      {/* New credentials banner */}
      {newCreds && (
        <div className="card border border-green-500/30 bg-green-500/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-green-400 mb-1">✅ Compte créé pour {newCreds.name}</p>
              <p className="text-sm text-dark-400">Transmettez ces identifiants en toute sécurité :</p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-dark-400 w-20">Email :</span>
                  <code className="text-white">{newCreds.email}</code>
                  <CopyButton text={newCreds.email} />
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-dark-400 w-20">Mot de passe :</span>
                  <code className="text-primary-400 font-bold">{newCreds.password}</code>
                  <CopyButton text={newCreds.password} />
                </div>
              </div>
              <p className="text-xs text-dark-500 mt-2">⚠️ Demandez-lui de changer son mot de passe dès la première connexion.</p>
            </div>
            <button onClick={() => setNewCreds(null)} className="text-dark-500 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="card border border-primary-500/30">
          <div className="flex justify-between mb-4">
            <h2 className="font-bold">Nouveau sous-admin</h2>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-dark-500" /></button>
          </div>
          <form onSubmit={handleSubmit(d => create.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Prénom *</label>
                <input {...register('firstName', { required: true })} className="input" placeholder="Jean" />
              </div>
              <div>
                <label className="label">Nom *</label>
                <input {...register('lastName', { required: true })} className="input" placeholder="Dupont" />
              </div>
            </div>
            <div>
              <label className="label">Email *</label>
              <input {...register('email', { required: true })} type="email" className="input" placeholder="coach@exemple.com" />
            </div>
            <div>
              <label className="label">Téléphone (optionnel)</label>
              <input {...register('phone')} type="tel" className="input" placeholder="+225 07 00 00 00 00" />
            </div>
            <p className="text-xs text-dark-500">
              Un mot de passe temporaire <strong className="text-white">Gym2024!</strong> sera attribué. L'utilisateur pourra le modifier dans son profil.
            </p>
            <div className="flex gap-3">
              <button type="submit" disabled={create.isPending} className="btn-primary flex-1">
                {create.isPending ? 'Création…' : 'Créer le compte'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
            </div>
          </form>
        </div>
      )}

      {/* Team list */}
      {isLoading ? (
        <div className="text-center py-12 text-dark-500">Chargement…</div>
      ) : coaches.length === 0 ? (
        <div className="card text-center py-12">
          <ShieldCheck size={48} className="text-dark-600 mx-auto mb-4" />
          <p className="text-dark-500">Aucun membre dans l'équipe</p>
        </div>
      ) : (
        <div className="space-y-2">
          {coaches.map(coach => {
            const badge = ROLE_BADGE[coach.role] || ROLE_BADGE.coach;
            const isMe = coach.id === me?.id;
            return (
              <div key={coach.id} className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold shrink-0">
                  {coach.avatar
                    ? <img src={coach.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    : `${coach.firstName?.[0]}${coach.lastName?.[0]}`
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{coach.firstName} {coach.lastName}</p>
                    {isMe && <span className="text-xs text-dark-500">(vous)</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <p className="text-sm text-dark-500 truncate">{coach.email}</p>
                  {coach.phone && <p className="text-xs text-dark-600">{coach.phone}</p>}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-dark-600">
                    Depuis {new Date(coach.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                  </p>
                  {coach.lastLoginAt && (
                    <p className="text-xs text-dark-600">
                      Connexion {new Date(coach.lastLoginAt).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
