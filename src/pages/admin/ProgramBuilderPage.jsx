import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutsApi, usersApi } from '../../services/api';
import {
  Plus, Trash2, ChevronDown, ChevronUp, Save, ArrowLeft,
  Dumbbell, Calendar, Clock, Users, Target, CheckCircle,
} from 'lucide-react';

const DAY_LABELS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const MUSCLE_OPTIONS = ['Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Jambes', 'Fessiers', 'Abdominaux', 'Full Body', 'Cardio'];

function ExerciseRow({ ex, onUpdate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: ex.name, sets: ex.sets, reps: ex.reps || '', restSeconds: ex.restSeconds, weight: ex.weight || '', notes: ex.notes || '' });

  const save = () => { onUpdate(ex.id, form); setOpen(false); };

  return (
    <div className="bg-base-300 rounded-lg">
      <div className="flex items-center gap-2 p-3">
        <Dumbbell size={14} className="text-primary shrink-0" />
        <span className="flex-1 font-medium text-sm">{ex.name}</span>
        <span className="text-xs text-base-content/50">{ex.sets}×{ex.reps || '?'} · {ex.restSeconds}s repos</span>
        <button onClick={() => setOpen(!open)} className="btn btn-ghost btn-xs">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <button onClick={() => onDelete(ex.id)} className="btn btn-ghost btn-xs text-error"><Trash2 size={14} /></button>
      </div>
      {open && (
        <div className="px-3 pb-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          <div className="col-span-2 md:col-span-3">
            <input className="input input-sm input-bordered w-full" placeholder="Nom de l'exercice" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-base-content/60">Séries</span>
            <input type="number" className="input input-sm input-bordered" value={form.sets} min={1}
              onChange={e => setForm(f => ({ ...f, sets: +e.target.value }))} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-base-content/60">Répétitions</span>
            <input className="input input-sm input-bordered" placeholder="8-12" value={form.reps}
              onChange={e => setForm(f => ({ ...f, reps: e.target.value }))} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-base-content/60">Repos (sec)</span>
            <input type="number" className="input input-sm input-bordered" value={form.restSeconds} step={15}
              onChange={e => setForm(f => ({ ...f, restSeconds: +e.target.value }))} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-base-content/60">Charge</span>
            <input className="input input-sm input-bordered" placeholder="ex: 20kg / 60%" value={form.weight}
              onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
          </label>
          <div className="col-span-2 flex flex-col gap-1">
            <span className="text-xs text-base-content/60">Notes</span>
            <input className="input input-sm input-bordered" placeholder="Instructions spécifiques…" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="col-span-2 md:col-span-3 flex justify-end">
            <button onClick={save} className="btn btn-primary btn-xs gap-1"><Save size={12} />Enregistrer</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, programId, onSessionUpdate, onSessionDelete }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(true);
  const [sessionForm, setSessionForm] = useState({
    name: session.name,
    dayOfWeek: session.dayOfWeek || '',
    durationMinutes: session.durationMinutes || 60,
    muscleGroups: session.muscleGroups || [],
    notes: session.notes || '',
  });
  const [newEx, setNewEx] = useState({ name: '', sets: 3, reps: '8-12', restSeconds: 60, weight: '', notes: '' });
  const [addingEx, setAddingEx] = useState(false);

  const addExercise = useMutation({
    mutationFn: (data) => workoutsApi.addExercise({ ...data, sessionId: session.id, orderIndex: (session.exercises?.length || 0) }),
    onSuccess: () => { qc.invalidateQueries(['program', programId]); setNewEx({ name: '', sets: 3, reps: '8-12', restSeconds: 60, weight: '', notes: '' }); setAddingEx(false); },
  });

  const updateExercise = useMutation({
    mutationFn: ({ id, data }) => workoutsApi.updateExercise(id, data),
    onSuccess: () => qc.invalidateQueries(['program', programId]),
  });

  const deleteExercise = useMutation({
    mutationFn: (id) => workoutsApi.deleteExercise(id),
    onSuccess: () => qc.invalidateQueries(['program', programId]),
  });

  const toggleMuscle = (m) => {
    setSessionForm(f => ({
      ...f,
      muscleGroups: f.muscleGroups.includes(m) ? f.muscleGroups.filter(x => x !== m) : [...f.muscleGroups, m],
    }));
  };

  const saveSession = () => onSessionUpdate(session.id, sessionForm);

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body p-4">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setOpen(!open)} className="btn btn-ghost btn-xs p-0">
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <h3 className="font-semibold flex-1">{session.name}</h3>
          {session.dayOfWeek ? <span className="badge badge-outline badge-sm">{DAY_LABELS[session.dayOfWeek]}</span> : null}
          <span className="text-xs text-base-content/50">{session.durationMinutes} min</span>
          <button onClick={() => onSessionDelete(session.id)} className="btn btn-ghost btn-xs text-error"><Trash2 size={14} /></button>
        </div>

        {open && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-base-content/60">Nom</span>
                <input className="input input-sm input-bordered" value={sessionForm.name}
                  onChange={e => setSessionForm(f => ({ ...f, name: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-base-content/60">Jour</span>
                <select className="select select-sm select-bordered" value={sessionForm.dayOfWeek}
                  onChange={e => setSessionForm(f => ({ ...f, dayOfWeek: +e.target.value || null }))}>
                  <option value="">—</option>
                  {DAY_LABELS.slice(1).map((d, i) => <option key={i+1} value={i+1}>{d}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-base-content/60">Durée (min)</span>
                <input type="number" className="input input-sm input-bordered" value={sessionForm.durationMinutes} step={5}
                  onChange={e => setSessionForm(f => ({ ...f, durationMinutes: +e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-base-content/60">Notes</span>
                <input className="input input-sm input-bordered" placeholder="Instructions…" value={sessionForm.notes}
                  onChange={e => setSessionForm(f => ({ ...f, notes: e.target.value }))} />
              </label>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {MUSCLE_OPTIONS.map(m => (
                <button key={m} onClick={() => toggleMuscle(m)}
                  className={`badge cursor-pointer ${sessionForm.muscleGroups.includes(m) ? 'badge-primary' : 'badge-outline'}`}>
                  {m}
                </button>
              ))}
            </div>

            <button onClick={saveSession} className="btn btn-outline btn-xs gap-1 mb-4 self-start">
              <Save size={12} />Enregistrer la séance
            </button>

            <div className="space-y-2 mb-3">
              {(session.exercises || []).map(ex => (
                <ExerciseRow key={ex.id} ex={ex}
                  onUpdate={(id, data) => updateExercise.mutate({ id, data })}
                  onDelete={(id) => deleteExercise.mutate(id)} />
              ))}
            </div>

            {addingEx ? (
              <div className="bg-base-300 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">Nouvel exercice</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="col-span-2 md:col-span-3">
                    <input className="input input-sm input-bordered w-full" placeholder="Nom de l'exercice *" value={newEx.name}
                      onChange={e => setNewEx(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <input type="number" className="input input-sm input-bordered" placeholder="Séries" value={newEx.sets}
                    onChange={e => setNewEx(f => ({ ...f, sets: +e.target.value }))} />
                  <input className="input input-sm input-bordered" placeholder="Répétitions (ex: 8-12)" value={newEx.reps}
                    onChange={e => setNewEx(f => ({ ...f, reps: e.target.value }))} />
                  <input type="number" className="input input-sm input-bordered" placeholder="Repos (sec)" value={newEx.restSeconds}
                    onChange={e => setNewEx(f => ({ ...f, restSeconds: +e.target.value }))} />
                  <input className="input input-sm input-bordered" placeholder="Charge (ex: 60kg)" value={newEx.weight}
                    onChange={e => setNewEx(f => ({ ...f, weight: e.target.value }))} />
                  <div className="col-span-2 flex gap-2 justify-end">
                    <button onClick={() => setAddingEx(false)} className="btn btn-ghost btn-xs">Annuler</button>
                    <button disabled={!newEx.name.trim() || addExercise.isPending}
                      onClick={() => addExercise.mutate(newEx)} className="btn btn-primary btn-xs gap-1">
                      <Plus size={12} />Ajouter
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingEx(true)} className="btn btn-ghost btn-xs gap-1 text-primary">
                <Plus size={14} />Ajouter un exercice
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ProgramBuilderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();

  const clientIdParam = searchParams.get('clientId');
  const programIdParam = searchParams.get('programId');

  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ['program', programIdParam],
    queryFn: () => workoutsApi.getProgramDetail(programIdParam).then(r => r.data),
    enabled: !!programIdParam,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => usersApi.getClients().then(r => r.data),
  });

  const [meta, setMeta] = useState({
    clientId: clientIdParam || '',
    name: '',
    description: '',
    goal: '',
    frequencyPerWeek: 3,
    durationWeeks: 4,
    startDate: new Date().toISOString().split('T')[0],
  });

  const [programId, setProgramId] = useState(programIdParam || null);
  const [newSessionName, setNewSessionName] = useState('');
  const [addingSession, setAddingSession] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (program) {
      setMeta({
        clientId: program.clientId,
        name: program.name,
        description: program.description || '',
        goal: program.goal || '',
        frequencyPerWeek: program.frequencyPerWeek || 3,
        durationWeeks: program.durationWeeks || 4,
        startDate: program.startDate || new Date().toISOString().split('T')[0],
      });
    }
  }, [program]);

  const createProgram = useMutation({
    mutationFn: (data) => workoutsApi.createProgram(data),
    onSuccess: (res) => {
      setProgramId(res.data.id);
      setSaved(true);
      qc.invalidateQueries(['program', res.data.id]);
    },
  });

  const updateProgram = useMutation({
    mutationFn: ({ id, data }) => workoutsApi.updateProgram(id, data),
    onSuccess: () => { setSaved(true); qc.invalidateQueries(['program', programId]); },
  });

  const addSession = useMutation({
    mutationFn: (data) => workoutsApi.addSession({ ...data, programId, orderIndex: (program?.sessions?.length || 0) }),
    onSuccess: () => { qc.invalidateQueries(['program', programId]); setNewSessionName(''); setAddingSession(false); },
  });

  const updateSession = useMutation({
    mutationFn: ({ id, data }) => workoutsApi.updateSession(id, data),
    onSuccess: () => qc.invalidateQueries(['program', programId]),
  });

  const deleteSession = useMutation({
    mutationFn: (id) => workoutsApi.deleteSession(id),
    onSuccess: () => qc.invalidateQueries(['program', programId]),
  });

  const saveMeta = () => {
    if (programId) {
      updateProgram.mutate({ id: programId, data: meta });
    } else {
      createProgram.mutate(meta);
    }
  };

  const clientName = clients.find(c => c.id === (meta.clientId || program?.clientId))?.firstName;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm gap-1">
          <ArrowLeft size={16} />Retour
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{programId ? 'Modifier le programme' : 'Nouveau programme'}</h1>
          {clientName && <p className="text-sm text-base-content/60">Pour {clientName}</p>}
        </div>
        {saved && <div className="flex items-center gap-1 text-success text-sm"><CheckCircle size={14} />Enregistré</div>}
      </div>

      {/* Program metadata */}
      <div className="card bg-base-200 border border-base-300">
        <div className="card-body p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Target size={16} className="text-primary" />Informations du programme</h2>

          {!clientIdParam && !programIdParam && (
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium flex items-center gap-1"><Users size={13} />Client</span>
              <select className="select select-bordered" value={meta.clientId}
                onChange={e => setMeta(f => ({ ...f, clientId: e.target.value }))}>
                <option value="">Sélectionner un client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </label>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Nom du programme *</span>
              <input className="input input-bordered" placeholder="ex: Programme Prise de Masse" value={meta.name}
                onChange={e => setMeta(f => ({ ...f, name: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Objectif</span>
              <input className="input input-bordered" placeholder="ex: Prise de masse, Force, Perte de poids" value={meta.goal}
                onChange={e => setMeta(f => ({ ...f, goal: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium flex items-center gap-1"><Calendar size={13} />Date de début</span>
              <input type="date" className="input input-bordered" value={meta.startDate}
                onChange={e => setMeta(f => ({ ...f, startDate: e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium flex items-center gap-1"><Clock size={13} />Durée (semaines)</span>
              <input type="number" className="input input-bordered" value={meta.durationWeeks} min={1}
                onChange={e => setMeta(f => ({ ...f, durationWeeks: +e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Fréquence (séances/semaine)</span>
              <input type="number" className="input input-bordered" value={meta.frequencyPerWeek} min={1} max={7}
                onChange={e => setMeta(f => ({ ...f, frequencyPerWeek: +e.target.value }))} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium">Description</span>
              <input className="input input-bordered" placeholder="Notes générales sur le programme…" value={meta.description}
                onChange={e => setMeta(f => ({ ...f, description: e.target.value }))} />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={saveMeta}
              disabled={!meta.name.trim() || (!meta.clientId && !programId) || createProgram.isPending || updateProgram.isPending}
              className="btn btn-primary gap-2">
              <Save size={16} />{programId ? 'Mettre à jour' : 'Créer le programme'}
            </button>
          </div>
        </div>
      </div>

      {/* Sessions */}
      {programId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2"><Dumbbell size={16} className="text-primary" />Séances d'entraînement</h2>
            <button onClick={() => setAddingSession(true)} className="btn btn-primary btn-sm gap-1">
              <Plus size={14} />Ajouter une séance
            </button>
          </div>

          {programLoading ? (
            <div className="text-center py-8"><span className="loading loading-spinner text-primary" /></div>
          ) : (program?.sessions || []).length === 0 ? (
            <div className="card bg-base-200 border border-base-300 border-dashed">
              <div className="card-body items-center py-10 text-base-content/40">
                <Dumbbell size={32} />
                <p>Aucune séance — ajoutez-en une pour commencer</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(program?.sessions || []).map(s => (
                <SessionCard key={s.id} session={s} programId={programId}
                  onSessionUpdate={(id, data) => updateSession.mutate({ id, data })}
                  onSessionDelete={(id) => deleteSession.mutate(id)} />
              ))}
            </div>
          )}

          {addingSession && (
            <div className="card bg-base-200 border border-primary/30">
              <div className="card-body p-4 flex flex-row items-center gap-3">
                <input autoFocus className="input input-bordered flex-1" placeholder="Nom de la séance (ex: Jour A - Push)" value={newSessionName}
                  onChange={e => setNewSessionName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && newSessionName.trim() && addSession.mutate({ name: newSessionName.trim(), durationMinutes: 60 })} />
                <button onClick={() => setAddingSession(false)} className="btn btn-ghost btn-sm">Annuler</button>
                <button disabled={!newSessionName.trim() || addSession.isPending}
                  onClick={() => addSession.mutate({ name: newSessionName.trim(), durationMinutes: 60 })}
                  className="btn btn-primary btn-sm gap-1"><Plus size={14} />Créer</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
