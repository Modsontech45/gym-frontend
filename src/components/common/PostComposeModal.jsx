import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import Avatar from './Avatar';
import {
  X, Image, Send, Loader2,
  MessageSquare, Dumbbell, TrendingUp, Trophy, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

const POST_TYPES = [
  { value: 'general',     label: 'Général',      Icon: MessageSquare },
  { value: 'workout',     label: 'Entraînement', Icon: Dumbbell },
  { value: 'progress',    label: 'Progression',  Icon: TrendingUp },
  { value: 'achievement', label: 'Réussite',     Icon: Trophy },
  { value: 'motivation',  label: 'Motivation',   Icon: Zap },
];

export default function PostComposeModal() {
  const { user } = useAuthStore();
  const { composeOpen, closeCompose } = useUIStore();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef();

  const createPost = useMutation({
    mutationFn: (formData) => postsApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['feed']);
      setContent('');
      setMedia(null);
      setMediaPreview(null);
      setPostType('general');
      toast.success('Publication créée !');
      closeCompose();
    },
    onError: () => toast.error('Erreur lors de la publication'),
  });

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    if (file.type.startsWith('video/')) {
      if (file.size > 50 * 1024 * 1024) { toast.error('Vidéo trop lourde (max 50 Mo)'); return; }
      setCompressing(true);
      try {
        await new Promise((resolve, reject) => {
          const vid = document.createElement('video');
          vid.preload = 'metadata';
          vid.onloadedmetadata = () => {
            window.URL.revokeObjectURL(vid.src);
            vid.duration > 30 ? reject(new Error('La vidéo ne peut pas dépasser 30 secondes')) : resolve();
          };
          vid.onerror = () => reject(new Error('Impossible de lire cette vidéo'));
          vid.src = URL.createObjectURL(file);
        });
      } catch (err) { toast.error(err.message); setCompressing(false); return; }
      setCompressing(false);
    }

    setMedia(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && !media) return toast.error('Ajoutez du contenu ou une image');
    const fd = new FormData();
    fd.append('content', content);
    fd.append('postType', postType);
    if (media) fd.append('media', media);
    createPost.mutate(fd);
  };

  const handleClose = () => {
    if (createPost.isPending) return;
    closeCompose();
    setContent('');
    setMedia(null);
    setMediaPreview(null);
    setPostType('general');
  };

  if (!composeOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
          <p className="font-semibold text-white">Nouvelle publication</p>
          <button onClick={handleClose} disabled={createPost.isPending}
            className="p-1.5 rounded-lg text-dark-500 hover:text-white hover:bg-dark-700 transition-colors disabled:opacity-50">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Avatar user={user} size="md" clickable={false} />
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="input flex-1 resize-none min-h-[120px]"
              placeholder="Qu'avez-vous à partager ?"
              autoFocus
            />
          </div>

          {/* Type selectors */}
          <div className="flex flex-wrap gap-2">
            {POST_TYPES.map(({ value, label, Icon }) => (
              <button key={value} type="button" onClick={() => setPostType(value)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all ${
                  postType === value ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-500 hover:bg-dark-600'
                }`}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          {/* Media preview */}
          {mediaPreview && (
            <div className="relative">
              {media?.type?.startsWith('video') ? (
                <video src={mediaPreview} className="w-full rounded-xl max-h-48 object-cover" />
              ) : (
                <img src={mediaPreview} alt="" className="w-full rounded-xl max-h-48 object-cover" />
              )}
              <button type="button" onClick={() => { setMedia(null); setMediaPreview(null); }}
                className="absolute top-2 right-2 bg-dark-900/80 p-1.5 rounded-full hover:bg-dark-900 transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={() => !compressing && fileRef.current.click()}
              className="flex items-center gap-2 text-sm text-dark-500 hover:text-primary-400 transition-colors disabled:opacity-50"
              disabled={compressing || createPost.isPending}>
              <Image size={18} /> Photo / Vidéo
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
            <button type="submit" disabled={createPost.isPending || compressing}
              className="btn-primary flex items-center gap-2 min-w-[110px] justify-center">
              {createPost.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Publication…</>
              ) : compressing ? (
                <><Loader2 size={16} className="animate-spin" /> Vérification…</>
              ) : (
                <><Send size={16} /> Publier</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
