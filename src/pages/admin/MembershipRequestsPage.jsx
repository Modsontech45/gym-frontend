import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gymApi } from '../../services/api';
import { Check, X, Clock, Users } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'text-yellow-400 bg-yellow-400/10', icon: Clock },
  approved: { label: 'Approuvé', color: 'text-green-400 bg-green-400/10', icon: Check },
  rejected: { label: 'Refusé', color: 'text-red-400 bg-red-400/10', icon: X },
};

const AVATAR = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=64`;

function ReviewModal({ membership, onClose, onDone }) {
  const [note, setNote] = useState('');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (status) => gymApi.reviewMembership(membership.id, { status, reviewNote: note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['membershipRequests'] }); qc.invalidateQueries({ queryKey: ['allMembers'] }); onDone(); },
  });

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-800 rounded-2xl w-full max-w-md border border-dark-700" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-dark-700">
          <h2 className="font-bold">Examiner la demande</h2>
          <p className="text-dark-400 text-sm mt-1">
            {membership.member?.firstName} {membership.member?.lastName} — {membership.member?.email}
          </p>
        </div>
        <div className="p-5">
          {membership.requestNote && (
            <div className="bg-dark-700 rounded-xl p-3 mb-4">
              <p className="text-xs text-dark-400 mb-1">Message du membre :</p>
              <p className="text-sm">{membership.requestNote}</p>
            </div>
          )}
          <label className="label">Note de révision (optionnelle)</label>
          <textarea className="input w-full resize-none" rows={3} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Raison du refus ou message d'accueil…" />
        </div>
        <div className="p-5 border-t border-dark-700 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button
            onClick={() => mutation.mutate('rejected')}
            disabled={mutation.isPending}
            className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium text-sm transition-colors"
          >
            Refuser
          </button>
          <button
            onClick={() => mutation.mutate('approved')}
            disabled={mutation.isPending}
            className="flex-1 btn-primary"
          >
            Approuver
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MembershipRequestsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('pending');
  const [reviewing, setReviewing] = useState(null);

  const { data: pending = [], isLoading: loadingPending } = useQuery({
    queryKey: ['membershipRequests'],
    queryFn: () => gymApi.getPendingRequests().then(r => r.data),
  });

  const { data: allMembers = [], isLoading: loadingAll } = useQuery({
    queryKey: ['allMembers', tab],
    queryFn: () => gymApi.getAllMembers(tab !== 'pending' ? { status: tab } : {}).then(r => r.data),
    enabled: tab !== 'pending',
  });

  const rows = tab === 'pending' ? pending : allMembers;
  const isLoading = tab === 'pending' ? loadingPending : loadingAll;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Adhésions</h1>
          <p className="text-dark-400 text-sm mt-1">Gérez les demandes d'adhésion à la salle</p>
        </div>
        {pending.length > 0 && (
          <span className="px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-sm font-medium">
            {pending.length} en attente
          </span>
        )}
      </div>

      <div className="flex gap-1 bg-dark-800 rounded-xl p-1 mb-6">
        {[
          { key: 'pending', label: 'En attente' },
          { key: 'approved', label: 'Approuvés' },
          { key: 'rejected', label: 'Refusés' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-dark-600 text-white' : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20 text-dark-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucune demande {tab === 'pending' ? 'en attente' : tab === 'approved' ? 'approuvée' : 'refusée'}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(m => {
            const member = m.member;
            const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending;
            const Icon = cfg.icon;
            return (
              <div key={m.id} className="bg-dark-800 rounded-2xl border border-dark-700 p-4 flex items-center gap-4">
                <img
                  src={member?.avatar || AVATAR(`${member?.firstName} ${member?.lastName}`)}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover bg-dark-600 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-tight">{member?.firstName} {member?.lastName}</p>
                  <p className="text-xs text-dark-400">{member?.email}</p>
                  {m.requestNote && <p className="text-xs text-dark-500 mt-1 truncate">"{m.requestNote}"</p>}
                  {m.reviewNote && <p className="text-xs text-dark-500 mt-0.5 italic">Note : {m.reviewNote}</p>}
                  <p className="text-xs text-dark-600 mt-1">{new Date(m.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                    <Icon size={11} /> {cfg.label}
                  </span>
                  {m.status === 'pending' && (
                    <button onClick={() => setReviewing(m)} className="btn-primary text-xs px-3 py-1.5">
                      Examiner
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewing && (
        <ReviewModal
          membership={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => setReviewing(null)}
        />
      )}
    </div>
  );
}
