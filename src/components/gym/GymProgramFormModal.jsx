import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { gymProgramsApi } from '../../services/api';
import { X, Plus, Trash2 } from 'lucide-react';

const CATEGORIES = ['muscu', 'cardio', 'yoga', 'crossfit', 'autre'];
const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export default function GymProgramFormModal({ program, onClose, onSaved }) {
  const isEdit = !!program;
  const [form, setForm] = useState({
    title: '', description: '', category: 'muscu', difficulty: 'debutant',
    durationWeeks: 8, frequencyPerWeek: 3, isPublished: false,
    sessions: [],
  });

  useEffect(() => {
    if (program) {
      setForm({
        title: program.title || '',
        description: program.description || '',
        category: program.category || 'muscu',
        difficulty: program.difficulty || 'debutant',
        durationWeeks: program.durationWeeks || 8,
        frequencyPerWeek: program.frequencyPerWeek || 3,
        isPublished: program.isPublished || false,
        sessions: program.sessions || [],
      });
    }
  }, [program]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? gymProgramsApi.update(program.id, data) : gymProgramsApi.create(data),
    onSuccess: onSaved,
  });

  const addSession = () => {
    setForm(f => ({ ...f, sessions: [...f.sessions, { name: '', dayOfWeek: 'lundi', exercises: [] }] }));
  };

  const removeSession = (i) => {
    setForm(f => ({ ...f, sessions: f.sessions.filter((_, idx) => idx !== i) }));
  };

  const updateSession = (i, key, val) => {
    setForm(f => {
      const sessions = [...f.sessions];
      sessions[i] = { ...sessions[i], [key]: val };
      return { ...f, sessions };
    });
  };

  const addExercise = (si) => {
    setForm(f => {
      const sessions = [...f.sessions];
      sessions[si] = { ...sessions[si], exercises: [...(sessions[si].exercises || []), { name: '', sets: 3, reps: 10 }] };
      return { ...f, sessions };
    });
  };

  const removeExercise = (si, ei) => {
    setForm(f => {
      const sessions = [...f.sessions];
      sessions[si] = { ...sessions[si], exercises: sessions[si].exercises.filter((_, idx) => idx !== ei) };
      return { ...f, sessions };
    });
  };

  const updateExercise = (si, ei, key, val) => {
    setForm(f => {
      const sessions = [...f.sessions];
      const exs = [...sessions[si].exercises];
      exs[ei] = { ...exs[ei], [key]: val };
      sessions[si] = { ...sessions[si], exercises: exs };
      return { ...f, sessions };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-dark-800 rounded-2xl w-full max-w-2xl border border-dark-700 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-dark-700 sticky top-0 bg-dark-800 z-10">
          <h2 className="font-bold text-lg">{isEdit ? 'Modifier le programme' : 'Nouveau programme catalogue'}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="label">Titre *</label>
            <input className="input w-full" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Perte de poids 8 semaines" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input w-full resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Catégorie</label>
              <select className="input w-full" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Niveau</label>
              <select className="input w-full" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancé</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Durée (semaines)</label>
              <input type="number" min={1} max={52} className="input w-full" value={form.durationWeeks}
                onChange={e => setForm(f => ({ ...f, durationWeeks: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Fréquence / semaine</label>
              <input type="number" min={1} max={7} className="input w-full" value={form.frequencyPerWeek}
                onChange={e => setForm(f => ({ ...f, frequencyPerWeek: Number(e.target.value) }))} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPublished}
              onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
              className="w-4 h-4 accent-primary-500" />
            <span className="text-sm">Publier (visible par les clients)</span>
          </label>

          {/* Sessions */}
          <div className="border-t border-dark-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Séances ({form.sessions.length})</h3>
              <button onClick={addSession} className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300">
                <Plus size={14} /> Ajouter séance
              </button>
            </div>
            <div className="space-y-3">
              {form.sessions.map((sess, si) => (
                <div key={si} className="bg-dark-700 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input className="input flex-1 text-sm py-1.5" placeholder="Nom de la séance" value={sess.name}
                      onChange={e => updateSession(si, 'name', e.target.value)} />
                    <select className="input text-sm py-1.5 w-32" value={sess.dayOfWeek}
                      onChange={e => updateSession(si, 'dayOfWeek', e.target.value)}>
                      {DAYS.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                    </select>
                    <button onClick={() => removeSession(si)} className="text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                  </div>
                  {/* Exercises */}
                  <div className="pl-2 space-y-1">
                    {(sess.exercises || []).map((ex, ei) => (
                      <div key={ei} className="flex items-center gap-2">
                        <input className="input flex-1 text-xs py-1" placeholder="Exercice" value={ex.name}
                          onChange={e => updateExercise(si, ei, 'name', e.target.value)} />
                        <input type="number" className="input w-14 text-xs py-1 text-center" min={1} placeholder="Sets" value={ex.sets}
                          onChange={e => updateExercise(si, ei, 'sets', Number(e.target.value))} />
                        <span className="text-dark-500 text-xs">×</span>
                        <input type="number" className="input w-14 text-xs py-1 text-center" min={1} placeholder="Reps" value={ex.reps}
                          onChange={e => updateExercise(si, ei, 'reps', Number(e.target.value))} />
                        <button onClick={() => removeExercise(si, ei)} className="text-dark-500 hover:text-red-400"><X size={12} /></button>
                      </div>
                    ))}
                    <button onClick={() => addExercise(si)} className="text-xs text-dark-400 hover:text-dark-200 flex items-center gap-1 mt-1">
                      <Plus size={12} /> Exercice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-dark-700 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.title.trim()}
            className="btn-primary flex-1"
          >
            {mutation.isPending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le programme'}
          </button>
        </div>
      </div>
    </div>
  );
}
