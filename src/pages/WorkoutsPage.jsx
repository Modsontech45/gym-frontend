import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Dumbbell, ChevronDown, ChevronRight, CheckCircle, Clock, Target } from 'lucide-react';
import toast from 'react-hot-toast';

function ExerciseItem({ exercise }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-dark-700/50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
        <Dumbbell size={14} className="text-primary-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{exercise.name}</p>
        <p className="text-xs text-dark-500">{exercise.sets} séries × {exercise.reps} reps · {exercise.restSeconds}s repos</p>
      </div>
      {exercise.weight && <span className="text-xs text-primary-400">{exercise.weight}</span>}
    </div>
  );
}

function SessionCard({ session, onLog }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-dark-700 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 hover:bg-dark-600 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
            <Target size={18} className="text-primary-400" />
          </div>
          <div className="text-left">
            <p className="font-medium text-sm">{session.name}</p>
            <p className="text-xs text-dark-500">{session.durationMinutes} min · {session.exercises?.length || 0} exercices</p>
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
          {session.exercises?.map(ex => <ExerciseItem key={ex.id} exercise={ex} />)}
          <button onClick={() => onLog(session.id)} className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
            <CheckCircle size={16} /> Marquer comme complété
          </button>
        </div>
      )}
    </div>
  );
}

export default function WorkoutsPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['my-programs'],
    queryFn: () => workoutsApi.getMy().then(r => r.data),
  });

  const logSession = useMutation({
    mutationFn: (sessionId) => workoutsApi.logSession({ sessionId, durationMinutes: 60, rating: 5 }),
    onSuccess: () => { toast.success('Séance enregistrée ! 🎉'); queryClient.invalidateQueries(['my-programs']); },
    onError: () => toast.error(t('error')),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64 text-dark-500">{t('loading')}</div>;

  return (
    <div className="space-y-6 pb-20 md:pb-0 animate-fade-in">
      <h1 className="text-2xl font-bold">{t('workouts')}</h1>

      {programs.length === 0 ? (
        <div className="card text-center py-16">
          <Dumbbell size={48} className="text-dark-600 mx-auto mb-4" />
          <p className="text-dark-500 text-lg">{t('no_program')}</p>
          <p className="text-dark-600 text-sm mt-2">{t('contact_coach')}</p>
        </div>
      ) : programs.map(program => (
        <div key={program.id} className="card space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{program.name}</h2>
              {program.description && <p className="text-dark-500 text-sm mt-1">{program.description}</p>}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${program.isActive ? 'bg-green-500/20 text-green-400' : 'bg-dark-600 text-dark-500'}`}>
              {program.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>

          <div className="flex gap-4 text-sm text-dark-500">
            <span className="flex items-center gap-1"><Clock size={14} /> {program.frequencyPerWeek}x/semaine</span>
            <span className="flex items-center gap-1"><Target size={14} /> {program.goal || 'Objectif général'}</span>
          </div>

          {program.sessions?.length > 0 ? (
            <div className="space-y-2">
              {program.sessions.map(session => (
                <SessionCard key={session.id} session={session} onLog={(id) => logSession.mutate(id)} />
              ))}
            </div>
          ) : (
            <p className="text-dark-500 text-sm text-center py-4">Aucune séance dans ce programme</p>
          )}
        </div>
      ))}
    </div>
  );
}
