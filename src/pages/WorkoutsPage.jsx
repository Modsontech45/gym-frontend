import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Dumbbell, ChevronDown, ChevronRight, CheckCircle, Clock, Target, Star, BarChart2, Calendar, Zap, Award } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Log session modal ─────────────────────────────────────────────────────────

function LogModal({ session, onClose, onConfirm }) {
  const [duration, setDuration] = useState(session.durationMinutes || 45);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-800 rounded-2xl w-full max-w-sm border border-dark-700 p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div>
          <h3 className="font-bold text-lg">{session.name}</h3>
          <p className="text-dark-400 text-sm">Comment s'est passée cette séance ?</p>
        </div>

        {/* Duration */}
        <div>
          <label className="label">Durée réelle</label>
          <div className="flex items-center gap-3 mt-1">
            <button onClick={() => setDuration(d => Math.max(5, d - 5))}
              className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-xl hover:bg-dark-600 transition-colors">−</button>
            <span className="flex-1 text-center font-bold text-lg text-primary-400">{duration} min</span>
            <button onClick={() => setDuration(d => Math.min(240, d + 5))}
              className="w-10 h-10 rounded-xl bg-dark-700 flex items-center justify-center text-xl hover:bg-dark-600 transition-colors text-primary-400">+</button>
          </div>
        </div>

        {/* Star rating */}
        <div>
          <label className="label">Ressenti</label>
          <div className="flex gap-2 mt-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)} className="flex-1 flex flex-col items-center gap-1">
                <Star size={26} className={n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-dark-600'} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-center text-xs text-dark-400 mt-1">
              {['', 'Très difficile 😣', 'Difficile 😤', 'Correct 😊', 'Bien 💪', 'Excellent ! 🔥'][rating]}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes (optionnel)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="input resize-none w-full mt-1 text-sm"
            placeholder="Exercices modifiés, ressenti, records…"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button
            onClick={() => onConfirm({ durationMinutes: duration, rating: rating || null, notes: notes.trim() || null })}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <CheckCircle size={16} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Exercise item ─────────────────────────────────────────────────────────────

function ExerciseItem({ exercise }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-dark-700/50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
        <Dumbbell size={13} className="text-primary-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{exercise.name}</p>
        <p className="text-xs text-dark-500">
          {exercise.sets} × {exercise.reps} reps
          {exercise.restSeconds ? ` · ${exercise.restSeconds}s repos` : ''}
          {exercise.notes ? ` — ${exercise.notes}` : ''}
        </p>
      </div>
      {exercise.weight && <span className="text-xs text-primary-400 font-medium">{exercise.weight}</span>}
    </div>
  );
}

// ── Session card ──────────────────────────────────────────────────────────────

function SessionCard({ session, onLog }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-dark-700 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 hover:bg-dark-600 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center shrink-0">
            <Target size={18} className="text-primary-400" />
          </div>
          <div className="text-left">
            <p className="font-medium text-sm">{session.name}</p>
            <p className="text-xs text-dark-500">
              {session.dayOfWeek && <span className="capitalize">{session.dayOfWeek} · </span>}
              {session.durationMinutes} min · {session.exercises?.length || 0} exercices
            </p>
          </div>
        </div>
        {open ? <ChevronDown size={18} className="text-dark-500" /> : <ChevronRight size={18} className="text-dark-500" />}
      </button>
      {open && (
        <div className="px-4 pb-4">
          {session.muscleGroups?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {session.muscleGroups.map(g => (
                <span key={g} className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">{g}</span>
              ))}
            </div>
          )}
          {session.notes && <p className="text-xs text-dark-400 mb-3 italic">{session.notes}</p>}
          {session.exercises?.map(ex => <ExerciseItem key={ex.id} exercise={ex} />)}
          <button onClick={() => onLog(session)} className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
            <CheckCircle size={16} /> Marquer comme complété
          </button>
        </div>
      )}
    </div>
  );
}

// ── History tab ───────────────────────────────────────────────────────────────

function WorkoutHistory({ stats, logs }) {
  const fmt = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  // Build last 30 days heatmap
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push({ key, count: stats?.dayCounts?.[key] || 0, day: d.getDate(), isToday: i === 0 });
  }

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cette semaine', value: stats?.thisWeek ?? '—', icon: Calendar, color: 'primary' },
          { label: 'Ce mois', value: stats?.thisMonth ?? '—', icon: BarChart2, color: 'primary' },
          { label: 'Total', value: stats?.allTime ?? '—', icon: Award, color: 'primary' },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card text-center py-4">
            <Icon size={18} className="text-primary-400 mx-auto mb-1" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-dark-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {stats?.avgDurationMinutes > 0 && (
        <div className="flex gap-4">
          <div className="card flex-1 text-center py-3">
            <Clock size={16} className="text-dark-400 mx-auto mb-1" />
            <p className="font-bold">{stats.avgDurationMinutes} min</p>
            <p className="text-xs text-dark-500">Durée moy.</p>
          </div>
          {stats.avgRating && (
            <div className="card flex-1 text-center py-3">
              <Star size={16} className="text-yellow-400 mx-auto mb-1" />
              <p className="font-bold">{stats.avgRating}/5</p>
              <p className="text-xs text-dark-500">Ressenti moy.</p>
            </div>
          )}
        </div>
      )}

      {/* 30-day heatmap */}
      <div className="card">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Zap size={14} className="text-primary-400" /> Activité — 30 derniers jours
        </h3>
        <div className="grid grid-cols-10 gap-1">
          {days.map(d => (
            <div
              key={d.key}
              title={`${d.key}: ${d.count} séance(s)`}
              className={`aspect-square rounded-md flex items-center justify-center text-xs transition-colors ${
                d.isToday ? 'ring-1 ring-primary-500 ' : ''
              }${
                d.count === 0 ? 'bg-dark-700' :
                d.count === 1 ? 'bg-primary-500/40' :
                'bg-primary-500'
              }`}
            >
              <span className="text-dark-500 text-[9px]">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 justify-end">
          <span className="text-xs text-dark-500">Moins</span>
          <div className="w-3 h-3 rounded bg-dark-700" />
          <div className="w-3 h-3 rounded bg-primary-500/40" />
          <div className="w-3 h-3 rounded bg-primary-500" />
          <span className="text-xs text-dark-500">Plus</span>
        </div>
      </div>

      {/* Log list */}
      {logs.length === 0 ? (
        <div className="card text-center py-10">
          <Dumbbell size={36} className="text-dark-600 mx-auto mb-3" />
          <p className="text-dark-500">Aucune séance enregistrée</p>
          <p className="text-xs text-dark-600 mt-1">Complétez une séance pour voir votre historique ici.</p>
        </div>
      ) : (
        <div className="card space-y-2">
          <h3 className="font-medium text-sm text-dark-400 mb-1">Historique des séances</h3>
          {logs.map(log => (
            <div key={log.id} className="flex items-center gap-3 py-2 border-b border-dark-700/50 last:border-0">
              <div className="w-9 h-9 bg-green-500/15 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle size={16} className="text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{log.session?.name || 'Séance'}</p>
                <p className="text-xs text-dark-500">{log.session?.program?.name || ''}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-dark-400">{fmt(log.completedAt)}</p>
                {log.durationMinutes && <p className="text-xs text-dark-500">{log.durationMinutes} min</p>}
                {log.rating && (
                  <p className="text-xs text-yellow-400">{'★'.repeat(log.rating)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WorkoutsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('programme');
  const [loggingSession, setLoggingSession] = useState(null);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['my-programs'],
    queryFn: () => workoutsApi.getMy().then(r => r.data),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['my-logs'],
    queryFn: () => workoutsApi.getLogs().then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['workout-stats'],
    queryFn: () => workoutsApi.getStats().then(r => r.data),
  });

  const logSession = useMutation({
    mutationFn: ({ sessionId, ...rest }) => workoutsApi.logSession({ sessionId, ...rest }),
    onSuccess: () => {
      toast.success('Séance enregistrée ! 🎉');
      queryClient.invalidateQueries({ queryKey: ['my-programs'] });
      queryClient.invalidateQueries({ queryKey: ['my-logs'] });
      queryClient.invalidateQueries({ queryKey: ['workout-stats'] });
      setLoggingSession(null);
    },
    onError: () => toast.error(t('error')),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-dark-500">{t('loading')}</div>;

  return (
    <div className="space-y-4 pb-20 md:pb-0 animate-fade-in">
      {/* Header + tabs */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('workouts')}</h1>
        {stats && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500/15 rounded-xl">
            <Zap size={14} className="text-primary-400" />
            <span className="text-sm text-primary-400 font-medium">{stats.thisWeek} cette semaine</span>
          </div>
        )}
      </div>

      <div className="flex gap-1 bg-dark-800 p-1 rounded-xl">
        {[
          { key: 'programme', label: 'Mon programme', icon: Dumbbell },
          { key: 'historique', label: 'Historique', icon: BarChart2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-primary-500 text-white' : 'text-dark-500 hover:text-white'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Programme tab */}
      {tab === 'programme' && (
        programs.length === 0 ? (
          <div className="card text-center py-16">
            <Dumbbell size={48} className="text-dark-600 mx-auto mb-4" />
            <p className="text-dark-500 text-lg">{t('no_program')}</p>
            <p className="text-dark-600 text-sm mt-2">{t('contact_coach')}</p>
          </div>
        ) : programs.map(program => (
          <div key={program.id} className="card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{program.name}</h2>
                {program.description && <p className="text-dark-500 text-sm mt-1">{program.description}</p>}
                {program.coach && (
                  <p className="text-xs text-dark-500 mt-1">
                    Coach : <span className="text-dark-300">{program.coach.firstName} {program.coach.lastName}</span>
                  </p>
                )}
              </div>
              <span className={`shrink-0 text-xs px-2 py-1 rounded-full ${program.isActive ? 'bg-green-500/20 text-green-400' : 'bg-dark-600 text-dark-500'}`}>
                {program.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-dark-500">
              <span className="flex items-center gap-1"><Clock size={14} /> {program.frequencyPerWeek}×/semaine</span>
              {program.goal && <span className="flex items-center gap-1"><Target size={14} /> {program.goal}</span>}
              {program.durationWeeks && <span className="flex items-center gap-1"><Calendar size={14} /> {program.durationWeeks} semaines</span>}
            </div>

            {program.sessions?.length > 0 ? (
              <div className="space-y-2">
                {program.sessions.map(session => (
                  <SessionCard key={session.id} session={session} onLog={(s) => setLoggingSession(s)} />
                ))}
              </div>
            ) : (
              <p className="text-dark-500 text-sm text-center py-4">Aucune séance dans ce programme</p>
            )}
          </div>
        ))
      )}

      {/* Historique tab */}
      {tab === 'historique' && <WorkoutHistory stats={stats} logs={logs} />}

      {/* Log modal */}
      {loggingSession && (
        <LogModal
          session={loggingSession}
          onClose={() => setLoggingSession(null)}
          onConfirm={(data) => logSession.mutate({ sessionId: loggingSession.id, ...data })}
        />
      )}
    </div>
  );
}
