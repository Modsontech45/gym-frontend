import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { photosApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Camera, Plus, Trash2, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import toast from 'react-hot-toast';

const POSES = [
  { value: 'front', label: 'Face' },
  { value: 'back', label: 'Dos' },
  { value: 'side', label: 'Profil' },
  { value: 'other', label: 'Autre' },
];

function groupByMonth(photos) {
  const groups = {};
  for (const p of photos) {
    const key = p.takenAt.slice(0, 7); // "YYYY-MM"
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

function formatMonth(key) {
  const [y, m] = key.split('-');
  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  return `${months[parseInt(m) - 1]} ${y}`;
}

function Lightbox({ photos, initialIdx, onClose }) {
  const [idx, setIdx] = useState(initialIdx);
  const photo = photos[idx];

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center"
      onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
        <X size={28} />
      </button>

      <div className="absolute left-4 top-1/2 -translate-y-1/2" onClick={e => e.stopPropagation()}>
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)} className="text-white/70 hover:text-white p-2">
            <ChevronLeft size={32} />
          </button>
        )}
      </div>

      <img src={photo.url} alt="" className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
        onClick={e => e.stopPropagation()} />

      <div className="absolute right-4 top-1/2 -translate-y-1/2" onClick={e => e.stopPropagation()}>
        {idx < photos.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)} className="text-white/70 hover:text-white p-2">
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      <div className="absolute bottom-6 text-center" onClick={e => e.stopPropagation()}>
        <p className="text-white/80 text-sm">{photo.takenAt}</p>
        {photo.pose && <p className="text-white/50 text-xs">{POSES.find(p => p.value === photo.pose)?.label}</p>}
        {photo.notes && <p className="text-white/60 text-xs mt-1 max-w-xs mx-auto">{photo.notes}</p>}
        <p className="text-white/30 text-xs mt-1">{idx + 1} / {photos.length}</p>
      </div>
    </div>
  );
}

export default function ProgressPhotosPage({ clientId }) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef();
  const isOwnPhotos = !clientId;
  const queryKey = isOwnPhotos ? ['progress-photos', 'my'] : ['progress-photos', clientId];

  const [showUpload, setShowUpload] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { photos, idx }
  const [form, setForm] = useState({ takenAt: new Date().toISOString().split('T')[0], pose: 'front', notes: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const { data: photos = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => (isOwnPhotos ? photosApi.getMy() : photosApi.getClient(clientId)).then(r => r.data),
  });

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('photo', file);
      fd.append('takenAt', form.takenAt);
      fd.append('pose', form.pose);
      if (form.notes) fd.append('notes', form.notes);
      return photosApi.upload(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries(queryKey);
      setShowUpload(false);
      setFile(null);
      setPreview(null);
      setForm({ takenAt: new Date().toISOString().split('T')[0], pose: 'front', notes: '' });
      toast.success('Photo ajoutée !');
    },
    onError: () => toast.error('Erreur lors de l\'upload'),
  });

  const remove = useMutation({
    mutationFn: (id) => photosApi.delete(id),
    onSuccess: () => { qc.invalidateQueries(queryKey); toast.success('Photo supprimée'); },
  });

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const groups = groupByMonth(photos);
  const allPhotos = photos; // flat for lightbox navigation

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <Camera size={18} className="text-primary-400" />
          Photos de progression
        </h2>
        {isOwnPhotos && (
          <button onClick={() => setShowUpload(true)} className="btn-primary text-sm flex items-center gap-1">
            <Plus size={14} /> Ajouter
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-dark-500">Chargement…</div>
      ) : photos.length === 0 ? (
        <div className="card text-center py-12">
          <Camera size={36} className="text-dark-600 mx-auto mb-3" />
          <p className="text-dark-500">Aucune photo de progression</p>
          {isOwnPhotos && (
            <p className="text-xs text-dark-600 mt-1">Ajoutez votre première photo pour suivre votre évolution physique</p>
          )}
          {isOwnPhotos && (
            <button onClick={() => setShowUpload(true)} className="btn-primary text-sm mt-4 inline-flex items-center gap-1 mx-auto">
              <Camera size={14} /> Ajouter ma première photo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([monthKey, monthPhotos]) => (
            <div key={monthKey}>
              <h3 className="text-sm font-semibold text-dark-500 mb-3 flex items-center gap-2">
                {formatMonth(monthKey)}
                <span className="text-xs text-dark-600">({monthPhotos.length} photo{monthPhotos.length > 1 ? 's' : ''})</span>
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {monthPhotos.map(photo => {
                  const globalIdx = allPhotos.findIndex(p => p.id === photo.id);
                  return (
                    <div key={photo.id} className="relative group rounded-xl overflow-hidden aspect-[3/4] bg-dark-700">
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2">
                        <button onClick={() => setLightbox({ photos: allPhotos, idx: globalIdx })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-white p-2 bg-black/50 rounded-full">
                          <ZoomIn size={16} />
                        </button>
                        {isOwnPhotos && (
                          <button onClick={() => { if (window.confirm('Supprimer cette photo ?')) remove.mutate(photo.id); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-white p-2 bg-red-500/70 rounded-full">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      {/* Pose badge */}
                      {photo.pose && (
                        <span className="absolute bottom-1 left-1 text-xs px-1.5 py-0.5 bg-black/60 text-white rounded-md">
                          {POSES.find(p => p.value === photo.pose)?.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-40 p-4">
          <div className="bg-base-200 rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">Nouvelle photo</h3>
              <button onClick={() => { setShowUpload(false); setFile(null); setPreview(null); }} className="btn btn-ghost btn-sm btn-circle">
                <X size={16} />
              </button>
            </div>

            {/* File picker */}
            <div
              onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-base-300 rounded-xl aspect-[3/4] max-h-64 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden">
              {preview
                ? <img src={preview} alt="" className="w-full h-full object-cover" />
                : <div className="text-center">
                    <Camera size={32} className="text-base-content/30 mx-auto mb-2" />
                    <p className="text-sm text-base-content/50">Cliquer pour choisir une photo</p>
                  </div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Date</span>
                <input type="date" className="input input-sm input-bordered" value={form.takenAt}
                  onChange={e => setForm(f => ({ ...f, takenAt: e.target.value }))} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium">Pose</span>
                <select className="select select-sm select-bordered" value={form.pose}
                  onChange={e => setForm(f => ({ ...f, pose: e.target.value }))}>
                  {POSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium">Notes (optionnel)</span>
              <textarea className="textarea textarea-bordered textarea-sm" rows={2} value={form.notes}
                placeholder="Contexte, poids du jour…"
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </label>

            <div className="flex gap-2">
              <button onClick={() => { setShowUpload(false); setFile(null); setPreview(null); }} className="btn btn-ghost btn-sm flex-1">Annuler</button>
              <button
                disabled={!file || upload.isPending}
                onClick={() => upload.mutate()}
                className="btn btn-primary btn-sm flex-1 gap-1">
                {upload.isPending ? <span className="loading loading-spinner loading-xs" /> : <Camera size={14} />}
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {lightbox && (
        <Lightbox photos={lightbox.photos} initialIdx={lightbox.idx} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
