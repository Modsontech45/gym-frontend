import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { gymApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function MembershipGatePage() {
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);
  const user = useAuthStore(s => s.user);

  const { data: membership, isLoading } = useQuery({
    queryKey: ['myMembership'],
    queryFn: () => gymApi.getMyMembership().then(r => r.data),
    refetchInterval: 15000,
  });

  const mutation = useMutation({
    mutationFn: () => gymApi.requestMembership({ requestNote: note }),
    onSuccess: () => setSent(true),
  });

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const status = membership?.status;

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-800 rounded-2xl p-8 border border-dark-700 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
          </svg>
        </div>

        {status === 'pending' || sent ? (
          <>
            <h2 className="text-xl font-bold mb-2">Demande en attente</h2>
            <p className="text-dark-400 text-sm leading-relaxed">
              Votre demande d'adhésion est en cours de traitement. Un coach ou administrateur l'examinera prochainement.
              Vous serez notifié dès qu'elle sera approuvée.
            </p>
            <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
              <p className="text-yellow-400 text-sm">⏳ En attente d'approbation</p>
            </div>
          </>
        ) : status === 'rejected' ? (
          <>
            <h2 className="text-xl font-bold mb-2 text-red-400">Demande refusée</h2>
            {membership?.reviewNote && (
              <p className="text-dark-400 text-sm mb-4">Motif : {membership.reviewNote}</p>
            )}
            <p className="text-dark-400 text-sm mb-6">Contactez la salle pour plus d'informations.</p>
            <button
              onClick={() => { setSent(false); mutation.reset(); }}
              className="btn-primary w-full"
            >
              Faire une nouvelle demande
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-2">Rejoindre la salle</h2>
            <p className="text-dark-400 text-sm mb-6">
              Bonjour {user?.firstName}, pour accéder à l'application, vous devez d'abord faire une demande d'adhésion à la salle.
            </p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Message facultatif pour la salle…"
              rows={3}
              className="input w-full resize-none mb-4 text-sm"
            />
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="btn-primary w-full"
            >
              {mutation.isPending ? 'Envoi…' : 'Envoyer la demande'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
