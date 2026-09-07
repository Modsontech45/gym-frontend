import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkInsApi } from '../services/api';
import { ClipboardList, CheckCircle, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const SCALE_LABELS = {
  sleepQuality:  ['', 'Très mauvais', 'Mauvais', 'Correct', 'Bon', 'Excellent'],
  energyLevel:   ['', 'Épuisé', 'Fatigué', 'Normal', 'Énergique', 'Très énergique'],
  stressLevel:   ['', 'Très calme', 'Calme', 'Modéré', 'Stressé', 'Très stressé'],
  dietAdherence: ['', 'Aucune', 'Faible', 'Partielle', 'Bonne', 'Parfaite'],
  soreness:      ['', 'Aucune', 'Légère', 'Modérée', 'Forte', 'Très intense'],
};

const SCALE_COLORS = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];

function ScaleInput({ label, field, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">{label}</label>
        {value > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full text-white ${SCALE_COLORS[value]}`}>
            {SCALE_LABELS[field][value]}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all ${
              value === n ? `${SCALE_COLORS[n]} text-white scale-105 shadow-lg` : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CheckInPage() {
  const queryClient = useQueryClient();

  const { data: checkIns = [] } = useQuery({
    queryKey: ['my-checkins'],
    queryFn: () => checkInsApi.getMy().then(r => r.data),
  });

  const thisWeekMonday = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  })();

  const alreadySubmitted = checkIns.find(c => c.weekOf === thisWeekMonday);

  const [form, setForm] = useState({
    sleepQuality: alreadySubmitted?.sleepQuality || 0,
    energyLevel: alreadySubmitted?.energyLevel || 0,
    stressLevel: alreadySubmitted?.stressLevel || 0,
    dietAdherence: alreadySubmitted?.dietAdherence || 0,
    soreness: alreadySubmitted?.soreness || 0,
    sessionsCompleted: alreadySubmitted?.sessionsCompleted || '',
    weightKg: alreadySubmitted?.weightKg || '',
    wins: alreadySubmitted?.wins || '',
    struggles: alreadySubmitted?.struggles || '',
    notes: alreadySubmitted?.notes || '',
  });

  const submit = useMutation({
    mutationFn: () => checkInsApi.submit({ ...form, weekOf: thisWeekMonday }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-checkins']);
      toast.success('Check-in envoyé ! 🎉');
    },
    onError: () => toast.error('Erreur lors de l\'envoi'),
  });

  const set = (field) => (val) => setForm(f => ({ ...f, [field]: val }));

  const formatWeek = (dateStr) => {
    const d = new Date(dateStr);
    const end = new Date(d); end.setDate(d.getDate() + 6);
    return `Semaine du ${d.getDate()} au ${end.getDate()} ${end.toLocaleDateString('fr-FR', { month: 'long' })}`;
  };

  const scoreOf = (ci) => {
    const vals = [ci.sleepQuality, ci.energyLevel, ci.dietAdherence].filter(Boolean);
    if (!vals.length) return null;
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList size={22} className="text-primary-400" /> Check-in hebdomadaire</h1>
        <p className="text-dark-500 text-sm mt-1">{formatWeek(thisWeekMonday)}</p>
      </div>

      {/* Form */}
      <div className="card space-y-6">
        <ScaleInput label="Qualité du sommeil" field="sleepQuality" value={form.sleepQuality} onChange={set('sleepQuality')} />
        <ScaleInput label="Niveau d'énergie" field="energyLevel" value={form.energyLevel} onChange={set('energyLevel')} />
        <ScaleInput label="Niveau de stress" field="stressLevel" value={form.stressLevel} onChange={set('stressLevel')} />
        <ScaleInput label="Respect du régime alimentaire" field="dietAdherence" value={form.dietAdherence} onChange={set('dietAdherence')} />
        <ScaleInput label="Courbatures / récupération" field="soreness" value={form.soreness} onChange={set('soreness')} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Séances réalisées cette semaine</label>
            <input
              type="number" min="0" max="14"
              value={form.sessionsCompleted}
              onChange={(e) => set('sessionsCompleted')(e.target.value)}
              className="input"
              placeholder="0"
            />
          </div>
          <div>
            <label className="label">Poids actuel (kg)</label>
            <input
              type="number" step="0.1"
              value={form.weightKg}
              onChange={(e) => set('weightKg')(e.target.value)}
              className="input"
              placeholder="70.0"
            />
          </div>
        </div>

        <div>
          <label className="label">Ce qui s'est bien passé 🏆</label>
          <textarea value={form.wins} onChange={(e) => set('wins')(e.target.value)} className="input resize-none" rows={2} placeholder="Mes victoires de la semaine…" />
        </div>
        <div>
          <label className="label">Difficultés rencontrées 🤔</label>
          <textarea value={form.struggles} onChange={(e) => set('struggles')(e.target.value)} className="input resize-none" rows={2} placeholder="Ce qui a été difficile…" />
        </div>
        <div>
          <label className="label">Notes supplémentaires</label>
          <textarea value={form.notes} onChange={(e) => set('notes')(e.target.value)} className="input resize-none" rows={2} placeholder="Autre chose à mentionner à votre coach…" />
        </div>

        <button
          onClick={() => submit.mutate()}
          disabled={submit.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          <CheckCircle size={18} />
          {alreadySubmitted ? 'Mettre à jour le check-in' : 'Envoyer le check-in'}
        </button>
      </div>

      {/* History */}
      {checkIns.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3 text-dark-400 uppercase text-xs tracking-wide">Historique</h2>
          <div className="space-y-3">
            {checkIns.map(ci => {
              const score = scoreOf(ci);
              return (
                <div key={ci.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{formatWeek(ci.weekOf)}</p>
                    {score && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${SCALE_COLORS[Math.round(score)]}`}>
                        Score {score}/5
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ci.sleepQuality && <span className="text-xs bg-dark-700 px-2 py-1 rounded-lg">😴 Sommeil: {ci.sleepQuality}/5</span>}
                    {ci.energyLevel && <span className="text-xs bg-dark-700 px-2 py-1 rounded-lg">⚡ Énergie: {ci.energyLevel}/5</span>}
                    {ci.dietAdherence && <span className="text-xs bg-dark-700 px-2 py-1 rounded-lg">🥗 Régime: {ci.dietAdherence}/5</span>}
                    {ci.sessionsCompleted != null && <span className="text-xs bg-dark-700 px-2 py-1 rounded-lg">💪 {ci.sessionsCompleted} séances</span>}
                    {ci.weightKg && <span className="text-xs bg-dark-700 px-2 py-1 rounded-lg">⚖️ {ci.weightKg} kg</span>}
                  </div>
                  {ci.wins && <p className="text-xs text-green-400 mt-2">🏆 {ci.wins}</p>}
                  {ci.struggles && <p className="text-xs text-orange-400 mt-1">🤔 {ci.struggles}</p>}
                  {ci.coachFeedback && (
                    <div className="mt-3 p-3 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MessageSquare size={12} className="text-primary-400" />
                        <span className="text-xs text-primary-400 font-semibold">Réponse de votre coach</span>
                        {ci.coachFeedbackAt && (
                          <span className="text-xs text-dark-600 ml-auto">
                            {new Date(ci.coachFeedbackAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-dark-200">{ci.coachFeedback}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
