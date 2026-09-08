import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, usersApi, workoutsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { ChevronLeft, ChevronRight, Plus, X, Check, Clock, MapPin, User } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  confirmed: { dot: 'bg-green-500', badge: 'bg-green-500/15 text-green-400', label: 'Confirmé' },
  pending:   { dot: 'bg-yellow-500', badge: 'bg-yellow-500/15 text-yellow-400', label: 'En attente' },
  cancelled: { dot: 'bg-red-500', badge: 'bg-red-500/15 text-red-400', label: 'Annulé' },
};

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function monthRange(year, month) {
  const from = new Date(year, month, 1).toISOString();
  const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  return { from, to };
}

function AppointmentModal({ appt, onClose, onConfirm, onCancel, onDelete, isCoach }) {
  const start = new Date(appt.startTime);
  const end = new Date(appt.endTime);
  const st = STATUS_COLORS[appt.status] ?? STATUS_COLORS.pending;
  const other = isCoach ? appt.client : appt.coach;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-base-200 rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg">{appt.title}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle"><X size={16} /></button>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-base-content/70">
            <Clock size={14} />
            <span>
              {start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
              {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} →{' '}
              {end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {other && (
            <div className="flex items-center gap-2 text-base-content/70">
              <User size={14} />
              <span>{isCoach ? 'Client' : 'Coach'} : {other.firstName} {other.lastName}</span>
            </div>
          )}
          {appt.location && (
            <div className="flex items-center gap-2 text-base-content/70">
              <MapPin size={14} /><span>{appt.location}</span>
            </div>
          )}
          {appt.notes && <p className="italic text-base-content/60 pt-1">{appt.notes}</p>}
        </div>

        <div className="flex gap-2 pt-2">
          {isCoach && appt.status === 'pending' && (
            <button onClick={onConfirm} className="btn btn-success btn-sm gap-1 flex-1"><Check size={14} />Confirmer</button>
          )}
          {appt.status !== 'cancelled' && (
            <button onClick={onCancel} className="btn btn-warning btn-sm gap-1 flex-1">Annuler le RDV</button>
          )}
          {isCoach && (
            <button onClick={onDelete} className="btn btn-error btn-outline btn-sm gap-1"><X size={14} /></button>
          )}
        </div>
      </div>
    </div>
  );
}

const fieldClass = 'w-full bg-dark-700 border border-dark-600 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors';
const labelClass = 'flex flex-col gap-1.5';
const labelText = 'text-xs font-semibold text-dark-400 uppercase tracking-wide';

function CreateModal({ clients, coaches, onClose, onCreate, isCoach }) {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    clientId: '',
    coachId: '',
    title: "Séance d'entraînement",
    date: new Date().toISOString().split('T')[0],
    startHour: '09:00',
    endHour: '10:00',
    location: '',
    notes: '',
    sessionId: '',
  });

  // For clients: load their programs to pick a session
  const { data: programs = [] } = useQuery({
    queryKey: ['my-programs'],
    queryFn: () => workoutsApi.getMy().then(r => r.data),
    enabled: !isCoach,
  });
  const allSessions = programs.flatMap(p =>
    (p.sessions || []).map(s => ({ ...s, programName: p.name }))
  );

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = () => {
    const [sh, sm] = form.startHour.split(':').map(Number);
    const [eh, em] = form.endHour.split(':').map(Number);
    const startTime = new Date(`${form.date}T${form.startHour}`).toISOString();
    const endTime = new Date(`${form.date}T${form.endHour}`).toISOString();
    if (eh * 60 + em <= sh * 60 + sm) { toast.error("L'heure de fin doit être après le début"); return; }
    if (isCoach && !form.clientId) { toast.error('Sélectionnez un client'); return; }
    onCreate({
      clientId: isCoach ? form.clientId : user?.id,
      coachId: !isCoach ? (form.coachId || undefined) : undefined,
      title: form.title,
      startTime, endTime,
      location: form.location || undefined,
      notes: form.notes || undefined,
      sessionId: form.sessionId || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-dark-800 border border-dark-700 rounded-2xl w-full max-w-md p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">Nouveau rendez-vous</h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-dark-700 text-dark-400"><X size={18} /></button>
        </div>

        {isCoach && (
          <label className={labelClass}>
            <span className={labelText}>Client</span>
            <select className={fieldClass} value={form.clientId} onChange={e => set('clientId', e.target.value)}>
              <option value="">Sélectionner un client…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </label>
        )}

        {!isCoach && coaches.length > 0 && (
          <label className={labelClass}>
            <span className={labelText}>Coach (optionnel)</span>
            <select className={fieldClass} value={form.coachId} onChange={e => set('coachId', e.target.value)}>
              <option value="">Sélectionner un coach…</option>
              {coaches.map(c => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </label>
        )}

        {!isCoach && allSessions.length > 0 && (
          <label className={labelClass}>
            <span className={labelText}>Programme / Séance (optionnel)</span>
            <select
              className={fieldClass}
              value={form.sessionId}
              onChange={e => {
                const s = allSessions.find(s => s.id === e.target.value);
                set('sessionId', e.target.value);
                if (s) set('title', s.name);
              }}
            >
              <option value="">Choisir une séance…</option>
              {allSessions.map(s => (
                <option key={s.id} value={s.id}>{s.programName} — {s.name}</option>
              ))}
            </select>
          </label>
        )}

        <label className={labelClass}>
          <span className={labelText}>Titre</span>
          <input className={fieldClass} value={form.title} onChange={e => set('title', e.target.value)} />
        </label>

        <label className={labelClass}>
          <span className={labelText}>Date</span>
          <input type="date" className={fieldClass} value={form.date} onChange={e => set('date', e.target.value)} />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            <span className={labelText}>Début</span>
            <input type="time" className={fieldClass} value={form.startHour} onChange={e => set('startHour', e.target.value)} />
          </label>
          <label className={labelClass}>
            <span className={labelText}>Fin</span>
            <input type="time" className={fieldClass} value={form.endHour} onChange={e => set('endHour', e.target.value)} />
          </label>
        </div>

        <label className={labelClass}>
          <span className={labelText}>Lieu (optionnel)</span>
          <input className={fieldClass} placeholder="Salle, adresse…" value={form.location} onChange={e => set('location', e.target.value)} />
        </label>

        <label className={labelClass}>
          <span className={labelText}>Notes (optionnel)</span>
          <textarea className={`${fieldClass} resize-none`} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </label>

        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={submit} className="btn-primary flex-1">Créer</button>
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isCoach = user?.role === 'admin' || user?.role === 'coach';

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const { from, to } = monthRange(year, month);

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', year, month],
    queryFn: () => appointmentsApi.getMy({ from, to }).then(r => r.data),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => usersApi.getClients().then(r => r.data),
    enabled: isCoach,
  });

  // For client creating appointment: need to pick which coach
  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => usersApi.getCoaches().then(r => r.data),
    enabled: !isCoach,
  });

  const create = useMutation({
    mutationFn: (data) => appointmentsApi.create(data),
    onSuccess: () => { qc.invalidateQueries(['appointments']); setShowCreate(false); toast.success('RDV créé !'); },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const update = useMutation({
    mutationFn: ({ id, data }) => appointmentsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries(['appointments']); setSelectedAppt(null); },
  });

  const remove = useMutation({
    mutationFn: (id) => appointmentsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries(['appointments']); setSelectedAppt(null); toast.success('RDV supprimé'); },
  });

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
  const totalCells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const d = i - startOffset + 1;
    return d >= 1 && d <= lastDay.getDate() ? new Date(year, month, d) : null;
  });

  const dayAppts = (date) => date
    ? appointments.filter(a => isSameDay(new Date(a.startTime), date))
    : [];

  const selectedAppts = dayAppts(selectedDay);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendrier</h1>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm gap-1">
          <Plus size={16} />Nouveau RDV
        </button>
      </div>

      {/* Month navigation */}
      <div className="card bg-base-200">
        <div className="flex items-center justify-between mb-4 px-2">
          <button onClick={prevMonth} className="btn btn-ghost btn-sm btn-circle"><ChevronLeft size={18} /></button>
          <h2 className="font-semibold text-lg">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonth} className="btn btn-ghost btn-sm btn-circle"><ChevronRight size={18} /></button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs text-base-content/40 font-medium py-1">{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((date, idx) => {
            if (!date) return <div key={idx} />;
            const appts = dayAppts(date);
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, selectedDay);
            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(date)}
                className={`relative flex flex-col items-center py-2 rounded-xl transition-colors min-h-[52px]
                  ${isSelected ? 'bg-primary text-white' : isToday ? 'bg-primary/10' : 'hover:bg-base-300'}`}
              >
                <span className={`text-sm font-medium ${isToday && !isSelected ? 'text-primary' : ''}`}>
                  {date.getDate()}
                </span>
                {appts.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {appts.slice(0, 3).map(a => (
                      <span key={a.id} className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[a.status]?.dot ?? 'bg-primary'}`} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail */}
      <div>
        <h3 className="font-semibold mb-3 text-base-content/70">
          {selectedDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          {selectedAppts.length > 0 && <span className="ml-2 badge badge-primary badge-sm">{selectedAppts.length}</span>}
        </h3>

        {selectedAppts.length === 0 ? (
          <div className="card bg-base-200 border border-base-300 border-dashed py-8 text-center">
            <p className="text-base-content/40 text-sm">Aucun rendez-vous ce jour</p>
            <button onClick={() => setShowCreate(true)} className="btn btn-ghost btn-xs mt-2 text-primary">
              <Plus size={14} /> Planifier un RDV
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedAppts.map(a => {
              const start = new Date(a.startTime);
              const end = new Date(a.endTime);
              const st = STATUS_COLORS[a.status] ?? STATUS_COLORS.pending;
              const other = isCoach ? a.client : a.coach;
              return (
                <button key={a.id} onClick={() => setSelectedAppt(a)} className="w-full text-left">
                  <div className="card bg-base-200 hover:bg-base-300 transition-colors flex-row items-center gap-3 p-3">
                    <div className={`w-1 self-stretch rounded-full ${st.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{a.title}</p>
                      <p className="text-xs text-base-content/50">
                        {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} →{' '}
                        {end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {other ? ` · ${other.firstName} ${other.lastName}` : ''}
                      </p>
                      {a.location && <p className="text-xs text-base-content/40"><MapPin size={10} className="inline mr-0.5" />{a.location}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming summary */}
      {appointments.filter(a => new Date(a.startTime) >= today && a.status !== 'cancelled').length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 text-base-content/70">À venir ce mois-ci</h3>
          <div className="space-y-1">
            {appointments
              .filter(a => new Date(a.startTime) >= today && a.status !== 'cancelled')
              .slice(0, 5)
              .map(a => {
                const start = new Date(a.startTime);
                const st = STATUS_COLORS[a.status] ?? STATUS_COLORS.pending;
                return (
                  <div key={a.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-base-200 transition-colors cursor-pointer"
                    onClick={() => setSelectedAppt(a)}>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
                    <span className="text-xs text-base-content/50 w-24 shrink-0">
                      {start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} {start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-sm truncate">{a.title}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateModal
          clients={clients}
          coaches={coaches}
          isCoach={isCoach}
          onClose={() => setShowCreate(false)}
          onCreate={(data) => create.mutate(data)}
        />
      )}

      {selectedAppt && (
        <AppointmentModal
          appt={selectedAppt}
          isCoach={isCoach}
          onClose={() => setSelectedAppt(null)}
          onConfirm={() => update.mutate({ id: selectedAppt.id, data: { status: 'confirmed' } })}
          onCancel={() => update.mutate({ id: selectedAppt.id, data: { status: 'cancelled' } })}
          onDelete={() => { if (window.confirm('Supprimer ce RDV ?')) remove.mutate(selectedAppt.id); }}
        />
      )}
    </div>
  );
}
