import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { gymProgramsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Users, Clock, Zap, ChevronDown, ChevronUp, Plus, Pencil, Trash2 } from 'lucide-react';
import GymProgramFormModal from '../components/gym/GymProgramFormModal';

const CATEGORIES = ['Tous', 'muscu', 'cardio', 'yoga', 'crossfit', 'autre'];
const DIFFICULTIES = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
const DIFF_COLORS = { debutant: 'text-green-400 bg-green-400/10', intermediaire: 'text-yellow-400 bg-yellow-400/10', avance: 'text-red-400 bg-red-400/10' };

export default function GymCatalogPage() {
  const user = useAuthStore(s => s.user);
  const isCoach = ['admin', 'coach'].includes(user?.role);
  const qc = useQueryClient();
  const [category, setCategory] = useState('Tous');
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['gymPrograms', category],
    queryFn: () => {
      if (isCoach) return gymProgramsApi.listAll().then(r => r.data);
      const params = category !== 'Tous' ? { category } : {};
      return gymProgramsApi.list(params).then(r => r.data);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => gymProgramsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gymPrograms'] }),
  });

  const enrollMutation = useMutation({
    mutationFn: (id) => gymProgramsApi.enroll(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['gymPrograms'] }),
  });

  const filtered = category === 'Tous' ? programs : programs.filter(p => p.category === category);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Catalogue de programmes</h1>
          <p className="text-dark-400 text-sm mt-1">Programmes créés par nos coachs</p>
        </div>
        {isCoach && (
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nouveau programme
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === c ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            {c === 'Tous' ? 'Tous' : c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-dark-400">
          <Zap size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucun programme dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(prog => {
            const isExpanded = expanded === prog.id;
            return (
              <div key={prog.id} className="bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-dark-750 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : prog.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-lg leading-tight">{prog.title}</h3>
                        {isCoach && !prog.isPublished && (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-dark-600 text-dark-400">Brouillon</span>
                        )}
                      </div>
                      {prog.description && (
                        <p className="text-dark-400 text-sm line-clamp-2 mb-3">{prog.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-dark-400">
                        <span className={`px-2.5 py-1 rounded-full font-medium ${DIFF_COLORS[prog.difficulty]}`}>
                          {DIFFICULTIES[prog.difficulty]}
                        </span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {prog.durationWeeks} sem.</span>
                        <span className="flex items-center gap-1"><Zap size={12} /> {prog.frequencyPerWeek}×/sem.</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {prog.enrollCount} inscrits</span>
                        {prog.category && (
                          <span className="capitalize">{prog.category}</span>
                        )}
                        {prog.coach && (
                          <span>Coach : {prog.coach.firstName} {prog.coach.lastName}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isCoach && (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); setEditing(prog); setShowForm(true); }}
                            className="p-2 rounded-xl hover:bg-dark-600 text-dark-400 hover:text-white transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); if (confirm('Supprimer ce programme ?')) deleteMutation.mutate(prog.id); }}
                            className="p-2 rounded-xl hover:bg-red-500/10 text-dark-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                      {isExpanded ? <ChevronUp size={18} className="text-dark-400" /> : <ChevronDown size={18} className="text-dark-400" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-dark-700 p-5">
                    {/* Sessions list */}
                    {prog.sessions && prog.sessions.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-dark-300 mb-2">Séances incluses</h4>
                        {prog.sessions.map((sess, i) => (
                          <div key={i} className="bg-dark-700 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{sess.name}</span>
                              {sess.dayOfWeek && <span className="text-xs text-dark-400 capitalize">{sess.dayOfWeek}</span>}
                            </div>
                            {sess.exercises && sess.exercises.length > 0 && (
                              <ul className="space-y-1">
                                {sess.exercises.map((ex, j) => (
                                  <li key={j} className="text-xs text-dark-400 flex items-center gap-2">
                                    <span className="w-4 text-center text-dark-600">{j + 1}.</span>
                                    <span>{ex.name}</span>
                                    {ex.sets && <span className="text-dark-500">{ex.sets}×{ex.reps}</span>}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-dark-500 text-sm">Détails des séances à venir.</p>
                    )}
                    {!isCoach && (
                      <button
                        onClick={() => enrollMutation.mutate(prog.id)}
                        disabled={enrollMutation.isPending}
                        className="btn-primary mt-4 w-full"
                      >
                        {enrollMutation.isPending ? 'Inscription…' : "S'inscrire à ce programme"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <GymProgramFormModal
          program={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ['gymPrograms'] }); }}
        />
      )}
    </div>
  );
}
