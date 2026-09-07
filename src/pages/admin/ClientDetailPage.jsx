import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, subsApi, workoutsApi, measurementsApi, coachNotesApi, checkInsApi } from '../../services/api';
import ProgressPhotosPage from '../ProgressPhotosPage';
import { ArrowLeft, MessageCircle, CreditCard, Dumbbell, Plus, X, TrendingUp, TrendingDown, Minus, Activity, StickyNote, Pin, Pencil, Trash2, ClipboardList, ExternalLink } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from 'recharts';

const TABS = ['Infos', 'Abonnements', 'Programmes', 'Check-ins', 'Progression', 'Photos', 'Notes'];

const SCALE_COLORS = ['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-lime-400', 'text-green-400'];
const SCALE_BG = ['', 'bg-red-500/15', 'bg-orange-500/15', 'bg-yellow-500/15', 'bg-lime-500/15', 'bg-green-500/15'];

const delta = (first, last) => {
  if (first == null || last == null) return null;
  return parseFloat((last - first).toFixed(2));
};

const DeltaBadge = ({ value, unit = 'kg', invertGood = false }) => {
  if (value == null) return null;
  const good = invertGood ? value < 0 : value > 0;
  const neutral = value === 0;
  const color = neutral ? 'text-dark-500' : good ? 'text-green-400' : 'text-red-400';
  const Icon = neutral ? Minus : value > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${color}`}>
      <Icon size={11} />
      {value > 0 ? '+' : ''}{value} {unit}
    </span>
  );
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('Infos');
  const [showSubForm, setShowSubForm] = useState(false);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [showMeasForm, setShowMeasForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [activeMetric, setActiveMetric] = useState('poids');
  const { register: regSub, handleSubmit: submitSub, reset: resetSub } = useForm();
  const { register: regProg, handleSubmit: submitProg, reset: resetProg } = useForm();
  const { register: regMeas, handleSubmit: submitMeas, reset: resetMeas } = useForm();

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => usersApi.getClient(id).then(r => r.data),
  });

  const { data: measurements = [] } = useQuery({
    queryKey: ['client-measurements', id],
    queryFn: () => measurementsApi.getClient(id).then(r => r.data),
  });

  const { data: clientCheckIns = [] } = useQuery({
    queryKey: ['client-checkins', id],
    queryFn: () => checkInsApi.getClient(id).then(r => r.data),
  });

  const { data: sessionLogs = [] } = useQuery({
    queryKey: ['client-logs', id],
    queryFn: () => workoutsApi.getClientLogs(id).then(r => r.data),
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['coach-notes', id],
    queryFn: () => coachNotesApi.getClient(id).then(r => r.data),
  });

  const createNote = useMutation({
    mutationFn: (data) => coachNotesApi.create({ ...data, clientId: id }),
    onSuccess: () => { queryClient.invalidateQueries(['coach-notes', id]); setNoteText(''); toast.success('Note ajoutée'); },
    onError: () => toast.error(t('error')),
  });

  const updateNote = useMutation({
    mutationFn: ({ noteId, data }) => coachNotesApi.update(noteId, data),
    onSuccess: () => { queryClient.invalidateQueries(['coach-notes', id]); setEditingNoteId(null); toast.success('Note mise à jour'); },
    onError: () => toast.error(t('error')),
  });

  const deleteNote = useMutation({
    mutationFn: (noteId) => coachNotesApi.delete(noteId),
    onSuccess: () => { queryClient.invalidateQueries(['coach-notes', id]); toast.success('Note supprimée'); },
    onError: () => toast.error(t('error')),
  });

  const togglePin = (note) => updateNote.mutate({ noteId: note.id, data: { pinned: !note.pinned } });

  const createSub = useMutation({
    mutationFn: (data) => subsApi.create({ ...data, userId: id }),
    onSuccess: () => { queryClient.invalidateQueries(['client', id]); setShowSubForm(false); resetSub(); toast.success('Abonnement créé !'); },
    onError: () => toast.error(t('error')),
  });

  const createProgram = useMutation({
    mutationFn: (data) => workoutsApi.createProgram({ ...data, clientId: id }),
    onSuccess: () => { queryClient.invalidateQueries(['client', id]); setShowProgramForm(false); resetProg(); toast.success('Programme créé !'); },
    onError: () => toast.error(t('error')),
  });

  const addMeasurement = useMutation({
    mutationFn: (data) => measurementsApi.add({ ...data, userId: id }),
    onSuccess: () => { queryClient.invalidateQueries(['client-measurements', id]); setShowMeasForm(false); resetMeas(); toast.success('Mesures ajoutées !'); },
    onError: () => toast.error(t('error')),
  });

  if (isLoading) return <div className="text-center py-12 text-dark-500">{t('loading')}</div>;
  if (!client) return <div className="text-center py-12 text-dark-500">Client introuvable</div>;

  // Chart data — chronological order
  const chartData = [...measurements].reverse().map(m => ({
    date: new Date(m.measuredAt).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    poids: m.weight ? parseFloat(m.weight) : null,
    MG: m.bodyFat ? parseFloat(m.bodyFat) : null,
    MM: m.muscleMass ? parseFloat(m.muscleMass) : null,
    taille: m.waist ? parseFloat(m.waist) : null,
  }));

  const first = measurements.length > 0 ? measurements[measurements.length - 1] : null;
  const latest = measurements.length > 0 ? measurements[0] : null;

  const metrics = [
    { key: 'poids', label: 'Poids', dataKey: 'weight', unit: 'kg', color: '#f97316', invertGood: true },
    { key: 'MG', label: 'Masse grasse', dataKey: 'bodyFat', unit: '%', color: '#ef4444', invertGood: true },
    { key: 'MM', label: 'Masse musc.', dataKey: 'muscleMass', unit: 'kg', color: '#22c55e', invertGood: false },
    { key: 'taille', label: 'Tour de taille', dataKey: 'waist', unit: 'cm', color: '#8b5cf6', invertGood: true },
  ];

  return (
    <div className="space-y-4 pb-20 md:pb-0 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/clients')} className="p-2 rounded-xl hover:bg-dark-700 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{client.firstName} {client.lastName}</h1>
      </div>

      {/* Header card */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-2xl shrink-0">
          {client.firstName?.[0]}{client.lastName?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold">{client.firstName} {client.lastName}</p>
          <p className="text-dark-500 text-sm truncate">{client.email}</p>
          {client.phone && <p className="text-dark-500 text-sm">{client.phone}</p>}
          {client.fitnessGoal && <p className="text-primary-400 text-sm mt-1">🎯 {client.fitnessGoal}</p>}
        </div>
        <Link to={`/messages/${client.id}`} className="btn-secondary flex items-center gap-2 shrink-0">
          <MessageCircle size={16} /> Message
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 p-1 rounded-xl">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-primary-500 text-white' : 'text-dark-500 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ─── Infos ─── */}
      {tab === 'Infos' && (
        <div className="card space-y-3">
          <h2 className="font-semibold">Profil fitness</h2>
          {[
            ['Objectif', client.fitnessGoal],
            ['Niveau', client.experienceLevel],
            ['Type de corps', client.bodyType],
            ['Coach préféré', client.coachPreference],
            ['Langue', client.language],
            ['Inscription', client.createdAt ? new Date(client.createdAt).toLocaleDateString('fr-FR') : null],
          ].filter(([, v]) => v).map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-dark-500">{label}</span>
              <span className="font-medium capitalize">{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Abonnements ─── */}
      {tab === 'Abonnements' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold flex items-center gap-2"><CreditCard size={18} className="text-primary-400" /> Abonnements</h2>
            <button onClick={() => setShowSubForm(!showSubForm)} className="btn-primary text-sm flex items-center gap-1"><Plus size={14} /> Ajouter</button>
          </div>

          {showSubForm && (
            <form onSubmit={submitSub(d => createSub.mutate(d))} className="space-y-3 mb-4 p-3 bg-dark-700 rounded-xl">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nom du plan</label><input {...regSub('planName', { required: true })} className="input" placeholder="Mensuel Standard" /></div>
                <div><label className="label">Type</label>
                  <select {...regSub('planType')} className="input">
                    <option value="mensuel">Mensuel</option>
                    <option value="trimestriel">Trimestriel</option>
                    <option value="semestriel">Semestriel</option>
                    <option value="annuel">Annuel</option>
                  </select>
                </div>
                <div><label className="label">Prix (FCFA)</label><input {...regSub('price', { required: true })} type="number" step="0.01" className="input" /></div>
                <div><label className="label">Séances incluses</label><input {...regSub('sessionsIncluded')} type="number" className="input" defaultValue={12} /></div>
                <div><label className="label">Date début</label><input {...regSub('startDate', { required: true })} type="date" className="input" /></div>
                <div><label className="label">Date fin</label><input {...regSub('endDate', { required: true })} type="date" className="input" /></div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1 text-sm">{t('create')}</button>
                <button type="button" onClick={() => setShowSubForm(false)} className="btn-secondary flex-1 text-sm">{t('cancel')}</button>
              </div>
            </form>
          )}

          {client.subscriptions?.length === 0 ? (
            <p className="text-dark-500 text-sm">Aucun abonnement</p>
          ) : client.subscriptions?.map(sub => (
            <div key={sub.id} className="flex items-center justify-between p-3 bg-dark-700 rounded-xl mb-2">
              <div>
                <p className="font-medium text-sm">{sub.planName}</p>
                <p className="text-xs text-dark-500">{sub.startDate} → {sub.endDate}</p>
                <p className="text-xs text-dark-500">{sub.sessionsUsed}/{sub.sessionsIncluded} séances</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary-400">{Math.round(sub.balance).toLocaleString('fr-FR')} FCFA</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${sub.status === 'actif' ? 'bg-green-500/20 text-green-400' : 'bg-dark-600 text-dark-400'}`}>{sub.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Programmes ─── */}
      {tab === 'Programmes' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Dumbbell size={18} className="text-primary-400" /> Programmes</h2>
            <Link to={`/programs/builder?clientId=${id}`} className="btn-primary text-sm flex items-center gap-1">
              <Plus size={14} /> Créer
            </Link>
          </div>

          {client.programs?.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell size={28} className="text-dark-600 mx-auto mb-2" />
              <p className="text-dark-500 text-sm">Aucun programme pour ce client</p>
              <Link to={`/programs/builder?clientId=${id}`} className="btn-primary text-sm mt-3 inline-flex items-center gap-1">
                <Plus size={14} /> Créer le premier programme
              </Link>
            </div>
          ) : client.programs?.map(p => (
            <div key={p.id} className="p-3 bg-dark-700 rounded-xl mb-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{p.name}</p>
                  {p.goal && <p className="text-xs text-dark-500 mt-0.5">🎯 {p.goal}</p>}
                  <p className="text-xs text-dark-500 mt-0.5">{p.frequencyPerWeek}x/sem · {p.durationWeeks} sem · {p.sessions?.length || 0} séances</p>
                  {p.startDate && <p className="text-xs text-dark-600 mt-0.5">Début : {new Date(p.startDate).toLocaleDateString('fr-FR')}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.isActive ? 'bg-green-500/20 text-green-400' : 'bg-dark-600 text-dark-400'}`}>{p.isActive ? 'Actif' : 'Inactif'}</span>
                  <Link to={`/programs/builder?programId=${p.id}`}
                    className="p-1.5 rounded-lg text-dark-500 hover:text-primary-400 hover:bg-dark-600 transition-colors" title="Modifier">
                    <ExternalLink size={13} />
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Session completion history */}
          {sessionLogs.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-sm text-dark-500 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                Séances complétées ({sessionLogs.length})
              </h3>
              <div className="space-y-2">
                {sessionLogs.slice(0, 8).map(log => (
                  <div key={log.id} className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                    <div className="w-8 h-8 bg-green-500/15 rounded-lg flex items-center justify-center shrink-0">
                      <Dumbbell size={14} className="text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{log.session?.name ?? 'Séance'}</p>
                      <p className="text-xs text-dark-500">{log.session?.program?.name ?? ''}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-dark-400">{new Date(log.completedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                      {log.durationMinutes && <p className="text-xs text-dark-500">{log.durationMinutes} min</p>}
                      {log.rating && <p className="text-xs text-yellow-400">{'★'.repeat(log.rating)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Check-ins ─── */}
      {tab === 'Check-ins' && (
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <ClipboardList size={18} className="text-primary-400" /> Check-ins hebdomadaires
          </h2>

          {clientCheckIns.length === 0 ? (
            <div className="card text-center py-10">
              <ClipboardList size={32} className="text-dark-600 mx-auto mb-2" />
              <p className="text-dark-500 text-sm">Aucun check-in pour ce client</p>
              <p className="text-xs text-dark-600 mt-1">Le client peut remplir son check-in depuis son tableau de bord</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientCheckIns.map(ci => {
                const scores = [ci.sleepQuality, ci.energyLevel, ci.dietAdherence].filter(Boolean);
                const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null;
                const idx = avg ? Math.round(avg) : 0;
                const weekEnd = new Date(ci.weekOf); weekEnd.setDate(weekEnd.getDate() + 6);
                return (
                  <div key={ci.id} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-sm">
                        {new Date(ci.weekOf).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} →{' '}
                        {weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </p>
                      {avg && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SCALE_BG[idx]} ${SCALE_COLORS[idx]}`}>
                          Score {avg}/5
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: 'Sommeil', val: ci.sleepQuality },
                        { label: 'Énergie', val: ci.energyLevel },
                        { label: 'Stress', val: ci.stressLevel },
                        { label: 'Régime', val: ci.dietAdherence },
                        { label: 'Courbatures', val: ci.soreness },
                        { label: 'Séances', val: ci.sessionsCompleted, suffix: '' },
                      ].filter(m => m.val != null).map(({ label, val, suffix }) => (
                        <div key={label} className={`text-center py-2 px-1 rounded-xl ${SCALE_BG[Math.min(val, 5)] || 'bg-dark-700'}`}>
                          <p className={`text-lg font-bold ${SCALE_COLORS[Math.min(val, 5)] || 'text-white'}`}>
                            {val}{suffix !== '' ? '/5' : ''}
                          </p>
                          <p className="text-xs text-dark-500">{label}</p>
                        </div>
                      ))}
                    </div>

                    {ci.weightKg && <p className="text-xs text-dark-400 mb-2">⚖️ Poids : <strong>{ci.weightKg} kg</strong></p>}
                    {ci.wins && <p className="text-sm text-green-400 mb-1">🏆 {ci.wins}</p>}
                    {ci.struggles && <p className="text-sm text-orange-400 mb-1">🤔 {ci.struggles}</p>}
                    {ci.notes && <p className="text-sm text-dark-400 italic">{ci.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Photos ─── */}
      {tab === 'Photos' && (
        <ProgressPhotosPage clientId={id} />
      )}

      {/* ─── Notes ─── */}
      {tab === 'Notes' && (
        <div className="space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><StickyNote size={18} className="text-primary-400" /> Notes privées coach</h2>

          {/* New note input */}
          <div className="card space-y-3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="input resize-none w-full"
              rows={3}
              placeholder="Ajouter une note privée sur ce client…"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { if (noteText.trim()) createNote.mutate({ content: noteText }); }}
                disabled={!noteText.trim() || createNote.isPending}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Plus size={14} /> Ajouter la note
              </button>
            </div>
          </div>

          {notes.length === 0 ? (
            <div className="card text-center py-8">
              <StickyNote size={28} className="text-dark-600 mx-auto mb-2" />
              <p className="text-dark-500 text-sm">Aucune note pour ce client</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <div
                  key={note.id}
                  className={`card border ${note.pinned ? 'border-primary-500/40 bg-primary-500/5' : 'border-dark-700'}`}
                >
                  {editingNoteId === note.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                        className="input resize-none w-full text-sm"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateNote.mutate({ noteId: note.id, data: { content: editNoteText } })}
                          className="btn-primary text-xs px-3 py-1.5"
                        >
                          Enregistrer
                        </button>
                        <button onClick={() => setEditingNoteId(null)} className="btn-secondary text-xs px-3 py-1.5">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-2">
                        {note.pinned && <Pin size={13} className="text-primary-400 mt-0.5 shrink-0" />}
                        <p className="text-sm flex-1 whitespace-pre-wrap">{note.content}</p>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            onClick={() => togglePin(note)}
                            title={note.pinned ? 'Désépingler' : 'Épingler'}
                            className={`p-1.5 rounded-lg transition-colors ${note.pinned ? 'text-primary-400 hover:bg-primary-500/20' : 'text-dark-500 hover:text-primary-400 hover:bg-dark-700'}`}
                          >
                            <Pin size={13} />
                          </button>
                          <button
                            onClick={() => { setEditingNoteId(note.id); setEditNoteText(note.content); }}
                            className="p-1.5 rounded-lg text-dark-500 hover:text-white hover:bg-dark-700 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => deleteNote.mutate(note.id)}
                            className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-dark-700 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <p className="text-xs text-dark-600">
                          {note.coach?.firstName} {note.coach?.lastName} · {new Date(note.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {note.pinned && <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">Épinglé</span>}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Progression ─── */}
      {tab === 'Progression' && (
        <div className="space-y-4">
          {/* Add measurement form toggle */}
          <div className="flex justify-between items-center">
            <h2 className="font-semibold flex items-center gap-2"><Activity size={18} className="text-primary-400" /> Mesures</h2>
            <button onClick={() => setShowMeasForm(!showMeasForm)} className="btn-primary text-sm flex items-center gap-1">
              <Plus size={14} /> Ajouter
            </button>
          </div>

          {showMeasForm && (
            <div className="card border border-primary-500/30">
              <div className="flex justify-between mb-3">
                <p className="font-semibold text-sm">Nouvelles mesures</p>
                <button onClick={() => { setShowMeasForm(false); resetMeas(); }}><X size={16} className="text-dark-500" /></button>
              </div>
              <form onSubmit={submitMeas(d => addMeasurement.mutate(d))} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Poids (kg)</label><input {...regMeas('weight')} type="number" step="0.1" className="input" /></div>
                  <div><label className="label">Masse grasse (%)</label><input {...regMeas('bodyFat')} type="number" step="0.1" className="input" /></div>
                  <div><label className="label">Masse musc. (kg)</label><input {...regMeas('muscleMass')} type="number" step="0.1" className="input" /></div>
                  <div><label className="label">Tour de taille (cm)</label><input {...regMeas('waist')} type="number" step="0.1" className="input" /></div>
                  <div><label className="label">Hanches (cm)</label><input {...regMeas('hips')} type="number" step="0.1" className="input" /></div>
                  <div><label className="label">Bras (cm)</label><input {...regMeas('arms')} type="number" step="0.1" className="input" /></div>
                </div>
                <div><label className="label">Date</label><input {...regMeas('measuredAt')} type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} /></div>
                <div><label className="label">Notes coach</label><textarea {...regMeas('notes')} className="input resize-none" rows={2} placeholder="Observations, contexte..." /></div>
                <div className="flex gap-2">
                  <button type="submit" disabled={addMeasurement.isPending} className="btn-primary flex-1 text-sm">Enregistrer</button>
                  <button type="button" onClick={() => { setShowMeasForm(false); resetMeas(); }} className="btn-secondary flex-1 text-sm">Annuler</button>
                </div>
              </form>
            </div>
          )}

          {measurements.length === 0 ? (
            <div className="card text-center py-10">
              <Activity size={32} className="text-dark-600 mx-auto mb-2" />
              <p className="text-dark-500 text-sm">Aucune mesure enregistrée</p>
              <p className="text-xs text-dark-600 mt-1">Ajoutez la première mesure pour démarrer le suivi</p>
            </div>
          ) : (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {metrics.map(({ key, label, dataKey, unit, color, invertGood }) => {
                  const latestVal = latest?.[dataKey] != null ? parseFloat(latest[dataKey]) : null;
                  const firstVal = first?.[dataKey] != null ? parseFloat(first[dataKey]) : null;
                  const d = delta(firstVal, latestVal);
                  return (
                    <div key={key} className="card text-center">
                      <p className="text-2xl font-bold" style={{ color }}>{latestVal != null ? `${latestVal} ${unit}` : '—'}</p>
                      <p className="text-xs text-dark-500 mt-0.5">{label}</p>
                      {d !== null && measurements.length > 1 && (
                        <div className="mt-1"><DeltaBadge value={d} unit={unit} invertGood={invertGood} /></div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Metric selector */}
              <div className="flex gap-2 flex-wrap">
                {metrics.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setActiveMetric(m.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeMetric === m.key ? 'text-white' : 'bg-dark-700 text-dark-400 hover:text-white'}`}
                    style={activeMetric === m.key ? { backgroundColor: m.color } : {}}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Chart */}
              {chartData.length > 1 && (
                <div className="card">
                  <p className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={15} className="text-primary-400" />
                    {metrics.find(m => m.key === activeMetric)?.label} — évolution
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', color: '#fff', fontSize: 12 }}
                      />
                      {metrics
                        .filter(m => m.key === activeMetric)
                        .map(m => (
                          <Line
                            key={m.key}
                            type="monotone"
                            dataKey={m.key}
                            stroke={m.color}
                            strokeWidth={2}
                            dot={{ fill: m.color, r: 4 }}
                            connectNulls
                            name={m.label}
                          />
                        ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Measurement history */}
              <div className="space-y-2">
                <p className="text-sm text-dark-500 font-medium">Historique ({measurements.length} entrées)</p>
                {measurements.slice(0, 10).map(m => (
                  <div key={m.id} className="card py-3">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">
                        {new Date(m.measuredAt).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {m.weight && <span className="text-xs bg-dark-700 px-2 py-1 rounded-lg"><span className="text-primary-400 font-bold">{m.weight} kg</span> poids</span>}
                      {m.bodyFat && <span className="text-xs bg-dark-700 px-2 py-1 rounded-lg"><span className="text-red-400 font-bold">{m.bodyFat}%</span> MG</span>}
                      {m.muscleMass && <span className="text-xs bg-dark-700 px-2 py-1 rounded-lg"><span className="text-green-400 font-bold">{m.muscleMass} kg</span> MM</span>}
                      {m.waist && <span className="text-xs bg-dark-700 px-2 py-1 rounded-lg"><span className="text-purple-400 font-bold">{m.waist} cm</span> taille</span>}
                    </div>
                    {m.notes && <p className="text-xs text-dark-500 mt-2 italic">{m.notes}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
