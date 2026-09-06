import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Heart, MessageCircle, Image, Video, Send, X, Dumbbell, TrendingUp, Trophy, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const POST_TYPES = [
  { value: 'general', label: 'Général', icon: '💬' },
  { value: 'workout', label: 'Entraînement', icon: '💪' },
  { value: 'progress', label: 'Progression', icon: '📈' },
  { value: 'achievement', label: 'Réussite', icon: '🏆' },
  { value: 'motivation', label: 'Motivation', icon: '⚡' },
];

function PostCard({ post, onLike, onComment }) {
  const { user } = useAuthStore();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');

  const { data: comments = [], refetch } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => postsApi.getComments(post.id).then(r => r.data),
    enabled: showComments,
  });

  const submitComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onComment(post.id, comment);
    setComment('');
    setTimeout(refetch, 500);
  };

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm">
          {post.author?.avatar ? (
            <img src={post.author.avatar} alt="" className="w-full h-full rounded-full object-cover" />
          ) : `${post.author?.firstName?.[0]}${post.author?.lastName?.[0]}`}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{post.author?.firstName} {post.author?.lastName}</p>
          <p className="text-xs text-dark-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
          </p>
        </div>
        {post.postType !== 'general' && (
          <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
            {POST_TYPES.find(t => t.value === post.postType)?.icon} {POST_TYPES.find(t => t.value === post.postType)?.label}
          </span>
        )}
      </div>

      {post.content && <p className="text-sm leading-relaxed mb-3">{post.content}</p>}

      {post.mediaUrl && post.mediaType === 'image' && (
        <img src={post.mediaUrl} alt="" className="w-full rounded-xl mb-3 max-h-96 object-cover" />
      )}
      {post.mediaUrl && post.mediaType === 'video' && (
        <video src={post.mediaUrl} controls className="w-full rounded-xl mb-3 max-h-96" />
      )}

      <div className="flex items-center gap-4 pt-3 border-t border-dark-700">
        <button onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${post.isLiked ? 'text-red-400' : 'text-dark-500 hover:text-red-400'}`}>
          <Heart size={18} fill={post.isLiked ? 'currentColor' : 'none'} />
          <span>{post.likesCount}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-dark-500 hover:text-primary-400 transition-colors">
          <MessageCircle size={18} />
          <span>{post.commentsCount}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-dark-700 flex items-center justify-center text-xs font-bold text-primary-400 flex-shrink-0">
                {c.author?.firstName?.[0]}
              </div>
              <div className="flex-1 bg-dark-700 rounded-xl px-3 py-2">
                <p className="text-xs font-medium text-primary-400">{c.author?.firstName} {c.author?.lastName}</p>
                <p className="text-sm mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          <form onSubmit={submitComment} className="flex gap-2">
            <input value={comment} onChange={e => setComment(e.target.value)}
              className="input flex-1 py-2 text-sm" placeholder="Écrire un commentaire..." />
            <button type="submit" className="btn-primary px-3 py-2"><Send size={16} /></button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function FeedPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('general');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const fileRef = useRef();

  const { data, fetchNextPage, hasNextPage, isFetching } = useQuery({
    queryKey: ['feed'],
    queryFn: () => postsApi.getFeed({ page: 1, limit: 20 }).then(r => r.data),
  });

  const posts = data?.posts || [];

  const createPost = useMutation({
    mutationFn: (formData) => postsApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['feed']);
      setContent(''); setMedia(null); setMediaPreview(null); setPostType('general');
      toast.success('Publication créée !');
    },
    onError: () => toast.error(t('error')),
  });

  const likePost = useMutation({
    mutationFn: (id) => postsApi.like(id),
    onSuccess: () => queryClient.invalidateQueries(['feed']),
  });

  const addComment = useMutation({
    mutationFn: ({ postId, content }) => postsApi.addComment(postId, content),
    onSuccess: () => queryClient.invalidateQueries(['feed']),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && !media) return toast.error('Ajoutez du contenu ou une image');
    const fd = new FormData();
    fd.append('content', content);
    fd.append('postType', postType);
    if (media) fd.append('media', media);
    createPost.mutate(fd);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMedia(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 md:pb-0 animate-fade-in">
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-sm flex-shrink-0">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              className="input flex-1 resize-none min-h-[80px]" placeholder={t('write_post')} />
          </div>

          <div className="flex flex-wrap gap-2">
            {POST_TYPES.map(pt => (
              <button key={pt.value} type="button" onClick={() => setPostType(pt.value)}
                className={`text-xs px-3 py-1.5 rounded-full transition-all ${postType === pt.value ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-500 hover:bg-dark-600'}`}>
                {pt.icon} {pt.label}
              </button>
            ))}
          </div>

          {mediaPreview && (
            <div className="relative">
              {media?.type?.startsWith('video') ? (
                <video src={mediaPreview} className="w-full rounded-xl max-h-48 object-cover" />
              ) : (
                <img src={mediaPreview} alt="" className="w-full rounded-xl max-h-48 object-cover" />
              )}
              <button type="button" onClick={() => { setMedia(null); setMediaPreview(null); }}
                className="absolute top-2 right-2 bg-dark-900/80 p-1 rounded-full">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button type="button" onClick={() => fileRef.current.click()}
                className="flex items-center gap-2 text-sm text-dark-500 hover:text-primary-400 transition-colors">
                <Image size={18} /> Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
            </div>
            <button type="submit" disabled={createPost.isPending} className="btn-primary flex items-center gap-2">
              <Send size={16} /> Publier
            </button>
          </div>
        </form>
      </div>

      {posts.map(post => (
        <PostCard key={post.id} post={post}
          onLike={(id) => likePost.mutate(id)}
          onComment={(postId, content) => addComment.mutate({ postId, content })} />
      ))}

      {isFetching && <div className="text-center text-dark-500 py-4">{t('loading')}</div>}
      {posts.length === 0 && !isFetching && (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🏋️</p>
          <p className="text-dark-500">Aucune publication. Soyez le premier !</p>
        </div>
      )}
    </div>
  );
}
