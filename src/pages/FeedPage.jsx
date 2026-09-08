import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { postsApi, messagesApi, socialApi, productsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/common/Avatar';
import {
  Heart, MessageCircle, X,
  Dumbbell, TrendingUp, Trophy, Zap, MessageSquare,
  MoreHorizontal, Trash2, Share2, Link, Reply, Send,
  UserPlus, UserCheck, Eye, Play, ShoppingBag, Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const POST_TYPES = [
  { value: 'general',     label: 'Général',      Icon: MessageSquare },
  { value: 'workout',     label: 'Entraînement', Icon: Dumbbell },
  { value: 'progress',    label: 'Progression',  Icon: TrendingUp },
  { value: 'achievement', label: 'Réussite',     Icon: Trophy },
  { value: 'motivation',  label: 'Motivation',   Icon: Zap },
];

const fmt = (n) => Number(n).toLocaleString('fr-FR');
const viewedSet = new Set(); // module-level — survives re-renders, cleared on page refresh

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────

function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative z-10 bg-dark-800 border border-dark-700 rounded-2xl p-6 mx-4 mb-6 sm:mb-0 w-full max-w-sm shadow-2xl">
        <p className="font-semibold text-white text-center mb-1">Supprimer la publication ?</p>
        <p className="text-sm text-dark-500 text-center mb-5">Cette action est irréversible.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-secondary">Annuler</button>
          <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-xl transition-colors">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Share Modal ──────────────────────────────────────────────────────────────

function ShareModal({ post, onClose }) {
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(null);
  const [sent, setSent] = useState(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.getConversations().then(r => r.data),
  });

  const contacts = conversations
    .map(c => c.user)
    .filter(u => u && `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()));

  const copyLink = () => {
    const url = `${window.location.origin}/feed?post=${post.id}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Lien copié !')).catch(() => {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      toast.success('Lien copié !');
    });
    onClose();
  };

  const sendDm = async (contact) => {
    setSending(contact.id);
    try {
      const postUrl = `${window.location.origin}/feed?post=${post.id}`;
      const excerpt = post.content ? `"${post.content.slice(0, 80)}${post.content.length > 80 ? '…' : ''}"` : '';
      const msg = `📌 ${post.author?.firstName} ${post.author?.lastName} a publié :\n${excerpt}\n${postUrl}`;
      await messagesApi.send(contact.id, msg);
      setSent(contact.id);
      toast.success(`Partagé à ${contact.firstName} !`);
      setTimeout(onClose, 800);
    } catch {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 bg-dark-800 border border-dark-700 rounded-2xl mx-4 mb-4 sm:mb-0 w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-700">
          <p className="font-semibold text-white">Partager</p>
          <button onClick={onClose} className="text-dark-500 hover:text-white"><X size={18} /></button>
        </div>
        <button onClick={copyLink}
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-dark-700 transition-colors text-sm border-b border-dark-700">
          <div className="w-9 h-9 rounded-full bg-dark-700 flex items-center justify-center shrink-0">
            <Link size={16} className="text-primary-400" />
          </div>
          <span className="font-medium text-white">Copier le lien</span>
        </button>
        <div className="px-4 py-3">
          <p className="text-xs text-dark-500 mb-2">Envoyer en message privé</p>
          {conversations.length > 0 && (
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="input text-sm py-2 mb-2" placeholder="Rechercher un contact…" />
          )}
          <div className="space-y-1 max-h-52 overflow-y-auto">
            {contacts.map(contact => (
              <button key={contact.id} onClick={() => sendDm(contact)} disabled={!!sending || sent === contact.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-700 transition-colors text-left">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-xs font-bold shrink-0">
                  {contact.avatar
                    ? <img src={contact.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    : `${contact.firstName?.[0]}${contact.lastName?.[0]}`}
                </div>
                <span className="text-sm text-white flex-1">{contact.firstName} {contact.lastName}</span>
                {sent === contact.id
                  ? <span className="text-xs text-green-400">Envoyé</span>
                  : sending === contact.id ? <span className="text-xs text-dark-500">…</span> : null}
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-dark-500 text-center py-4">Aucun contact. Commencez une conversation d'abord.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Three-dot menu ───────────────────────────────────────────────────────────

function PostMenu({ canDelete, onDelete, onShare }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg text-dark-500 hover:text-white hover:bg-dark-700 transition-colors">
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 w-44 bg-dark-800 border border-dark-700 rounded-xl shadow-2xl z-30 overflow-hidden">
          <button onClick={() => { setOpen(false); onShare(); }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-dark-700 transition-colors text-dark-300 hover:text-white">
            <Share2 size={15} /> Partager
          </button>
          {canDelete && (
            <button onClick={() => { setOpen(false); onDelete(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-red-500/10 transition-colors text-red-400">
              <Trash2 size={15} /> Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({ post, onLike, onComment, onDelete, onDeleteComment, onFollow }) {
  const { user } = useAuthStore();
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteComment, setConfirmDeleteComment] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [localViews, setLocalViews] = useState(post.viewCount || 0);
  const [localPlays, setLocalPlays] = useState(post.playCount || 0);
  const inputRef = useRef();

  const isOwn = user?.id === post.author?.id;
  const canDelete = isOwn || user?.role === 'admin';
  const typeInfo = POST_TYPES.find(t => t.value === post.postType);
  const isCoachOrAdmin = ['coach', 'admin'].includes(post.author?.role);

  // Track view once per session
  useEffect(() => {
    if (!post.id || viewedSet.has(post.id)) return;
    viewedSet.add(post.id);
    postsApi.view(post.id).then(() => setLocalViews(v => v + 1)).catch(() => {});
  }, [post.id]);

  const { data: comments = [], refetch } = useQuery({
    queryKey: ['comments', post.id],
    queryFn: () => postsApi.getComments(post.id).then(r => r.data),
    enabled: showComments,
  });

  const handleReply = (authorName) => {
    setShowComments(true);
    setReplyTo({ name: authorName });
    setComment(`@${authorName} `);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.setSelectionRange(999, 999); }, 100);
  };

  const submitComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    onComment(post.id, comment);
    setComment('');
    setReplyTo(null);
    setTimeout(refetch, 500);
  };

  const handlePlay = () => {
    postsApi.play(post.id).then(() => setLocalPlays(v => v + 1)).catch(() => {});
  };

  const isReplyComment = (text) => text?.startsWith('@');

  return (
    <>
      <div className="card animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar user={post.author} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{post.author?.firstName} {post.author?.lastName}</p>
              {isCoachOrAdmin && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/20 text-primary-400 font-medium">
                  {post.author?.role === 'admin' ? 'Admin' : 'Coach'}
                </span>
              )}
              {/* Follow button — only for other people's posts */}
              {!isOwn && (
                <button
                  onClick={() => onFollow(post.author)}
                  className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold transition-all ${
                    post.author?.isFollowing
                      ? 'bg-dark-700 text-dark-400 hover:text-red-400 hover:bg-dark-600'
                      : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
                  }`}
                >
                  {post.author?.isFollowing
                    ? <><UserCheck size={11} /> Suivi</>
                    : <><UserPlus size={11} /> Suivre</>}
                </button>
              )}
            </div>
            <p className="text-xs text-dark-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {typeInfo && post.postType !== 'general' && (
              <span className="hidden sm:flex items-center gap-1 text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">
                <typeInfo.Icon size={11} /> {typeInfo.label}
              </span>
            )}
            <PostMenu
              canDelete={canDelete}
              onDelete={() => setConfirmDelete(true)}
              onShare={() => setShowShare(true)}
            />
          </div>
        </div>

        {post.content && <p className="text-sm leading-relaxed mb-3 whitespace-pre-line">{post.content}</p>}

        {post.mediaUrl && post.mediaType === 'image' && (
          <img src={post.mediaUrl} alt="" className="w-full rounded-xl mb-3" />
        )}
        {post.mediaUrl && post.mediaType === 'video' && (
          <video
            src={post.mediaUrl}
            controls
            onPlay={handlePlay}
            className="w-full rounded-xl mb-3"
            style={{ maxHeight: '70vh' }}
          />
        )}

        {/* Actions */}
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
          <button onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 text-sm text-dark-500 hover:text-primary-400 transition-colors">
            <Share2 size={17} />
          </button>
          <div className="ml-auto flex items-center gap-3 text-dark-600 text-xs">
            <span className="flex items-center gap-1"><Eye size={13} /> {localViews}</span>
            {post.mediaType === 'video' && (
              <span className="flex items-center gap-1"><Play size={12} /> {localPlays}</span>
            )}
          </div>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-3 space-y-2">
            {comments.map(c => {
              const canDeleteComment = user?.id === c.author?.id || user?.role === 'admin';
              return (
              <div key={c.id} className="flex gap-2 group">
                <Avatar user={c.author} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className={`rounded-xl px-3 py-2 ${c.content?.startsWith('@') ? 'bg-primary-500/10 border border-primary-500/20' : 'bg-dark-700'}`}>
                    <p className="text-xs font-medium text-primary-400">{c.author?.firstName} {c.author?.lastName}</p>
                    {c.content?.startsWith('@') ? (
                      <p className="text-sm mt-0.5">
                        <span className="text-primary-400 font-medium">{c.content.split(' ')[0]}</span>
                        {' ' + c.content.split(' ').slice(1).join(' ')}
                      </p>
                    ) : (
                      <p className="text-sm mt-0.5">{c.content}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 ml-1">
                    <button
                      onClick={() => handleReply(`${c.author?.firstName} ${c.author?.lastName}`)}
                      className="text-xs text-dark-600 hover:text-primary-400 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100">
                      <Reply size={12} /> Répondre
                    </button>
                    {canDeleteComment && (
                      <button
                        onClick={() => setConfirmDeleteComment(c.id)}
                        className="text-xs text-dark-600 hover:text-red-400 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <Trash2 size={12} /> Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </div>
              );
            })}

            {replyTo && (
              <div className="flex items-center gap-2 bg-primary-500/10 rounded-lg px-3 py-1.5 text-xs text-primary-400">
                <Reply size={12} />
                <span>Répondre à {replyTo.name}</span>
                <button onClick={() => { setReplyTo(null); setComment(''); }} className="ml-auto text-dark-500 hover:text-white">
                  <X size={12} />
                </button>
              </div>
            )}

            <form onSubmit={submitComment} className="flex gap-2">
              <input
                ref={inputRef}
                value={comment}
                onChange={e => { setComment(e.target.value); if (!e.target.value.startsWith('@')) setReplyTo(null); }}
                className="input flex-1 py-2 text-sm"
                placeholder={replyTo ? `Répondre à ${replyTo.name}…` : 'Écrire un commentaire…'}
              />
              <button type="submit" disabled={!comment.trim()} className="btn-primary px-3 py-2 disabled:opacity-50">
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>

      {confirmDelete && (
        <ConfirmModal
          onConfirm={() => { onDelete(post.id); setConfirmDelete(false); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
      {confirmDeleteComment && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmDeleteComment(null)} />
          <div className="relative z-10 bg-dark-800 border border-dark-700 rounded-2xl p-6 mx-4 mb-6 sm:mb-0 w-full max-w-sm shadow-2xl">
            <p className="font-semibold text-white text-center mb-1">Supprimer ce commentaire ?</p>
            <p className="text-sm text-dark-500 text-center mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteComment(null)} className="flex-1 btn-secondary">Annuler</button>
              <button onClick={() => { onDeleteComment(post.id, confirmDeleteComment); setConfirmDeleteComment(null); }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-xl transition-colors">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
      {showShare && <ShareModal post={post} onClose={() => setShowShare(false)} />}
    </>
  );
}

// ─── Product Feed Card ────────────────────────────────────────────────────────

function ProductFeedCard({ product }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isCoach = ['admin', 'coach'].includes(user?.role);
  const hasDiscount = Number(product.currentPrice) < Number(product.originalPrice);
  const discount = hasDiscount ? Math.round((1 - product.currentPrice / product.originalPrice) * 100) : 0;

  const handleBuy = () => {
    const sellerId = product.seller?.id || product.coachId;
    const msg = encodeURIComponent(
      `Bonjour, je suis intéressé(e) par :\n*${product.name}* — ${fmt(product.currentPrice)} ${product.currency}\n${product.image || ''}`
    );
    navigate(`/messages/${sellerId}?prefill=${msg}`);
  };

  return (
    <div className="card animate-fade-in border-primary-500/10">
      {/* Header like a post */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
          <ShoppingBag size={18} className="text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{product.seller?.firstName} {product.seller?.lastName}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-500/20 text-primary-400 font-medium">Boutique</span>
          </div>
          <p className="text-xs text-dark-500">
            {formatDistanceToNow(new Date(product.createdAt), { addSuffix: true, locale: fr })}
          </p>
        </div>
        <button onClick={() => navigate('/boutique')} className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
          Voir tout
        </button>
      </div>

      {/* Product image */}
      {product.image && (
        <img src={product.image} alt={product.name} className="w-full rounded-xl mb-3 max-h-64 object-cover" />
      )}

      {/* Product info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-primary-400 uppercase tracking-wide font-medium mb-0.5 capitalize">{product.category}</p>
          <p className="font-semibold text-sm">{product.name}</p>
          {product.description && <p className="text-xs text-dark-500 mt-1 line-clamp-2">{product.description}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold text-white">{fmt(product.currentPrice)} <span className="text-xs font-normal text-dark-400">{product.currency}</span></span>
            {hasDiscount && (
              <>
                <span className="text-sm text-dark-500 line-through">{fmt(product.originalPrice)}</span>
                <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
                  <Tag size={10} /> -{discount}%
                </span>
              </>
            )}
          </div>
        </div>
        {!isCoach && (
          <button
            onClick={handleBuy}
            disabled={!product.inStock}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              product.inStock ? 'bg-primary-500 hover:bg-primary-400 text-white' : 'bg-dark-700 text-dark-500 cursor-not-allowed'
            }`}
          >
            <ShoppingBag size={14} />
            {product.inStock ? 'Acheter' : 'Rupture'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FeedPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: ['feed'],
    queryFn: () => postsApi.getFeed({ page: 1, limit: 20 }).then(r => r.data),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list().then(r => r.data),
    staleTime: 60000,
  });

  // Merge posts + products sorted by date, newest first
  const feedItems = useMemo(() => {
    const posts = (data?.posts || []).map(p => ({ ...p, _type: 'post' }));
    const prods = products.map(p => ({ ...p, _type: 'product' }));
    return [...posts, ...prods].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [data?.posts, products]);

  const deletePost = useMutation({
    mutationFn: (id) => postsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries(['feed']); toast.success('Publication supprimée'); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const likePost = useMutation({
    mutationFn: (id) => postsApi.like(id),
    onSuccess: () => queryClient.invalidateQueries(['feed']),
  });

  const addComment = useMutation({
    mutationFn: ({ postId, content }) => postsApi.addComment(postId, content),
    onSuccess: () => queryClient.invalidateQueries(['feed']),
  });

  const deleteComment = useMutation({
    mutationFn: ({ postId, commentId }) => postsApi.deleteComment(postId, commentId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries(['comments', postId]);
      queryClient.invalidateQueries(['feed']);
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const followMut = useMutation({
    mutationFn: ({ id, isFollowing }) =>
      isFollowing ? socialApi.unfollow(id) : socialApi.follow(id),
    onSuccess: () => queryClient.invalidateQueries(['feed']),
  });

  const handleFollow = (author) => {
    if (!author?.id) return;
    followMut.mutate({ id: author.id, isFollowing: author.isFollowing });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 md:pb-0 animate-fade-in">
      {feedItems.map(item =>
        item._type === 'product' ? (
          <ProductFeedCard key={`prod-${item.id}`} product={item} />
        ) : (
          <PostCard
            key={item.id}
            post={item}
            onLike={(id) => likePost.mutate(id)}
            onDelete={(id) => deletePost.mutate(id)}
            onComment={(postId, content) => addComment.mutate({ postId, content })}
            onDeleteComment={(postId, commentId) => deleteComment.mutate({ postId, commentId })}
            onFollow={handleFollow}
          />
        )
      )}

      {isFetching && <div className="text-center text-dark-500 py-4">{t('loading')}</div>}
      {feedItems.length === 0 && !isFetching && (
        <div className="card text-center py-12">
          <Dumbbell size={48} className="text-dark-700 mx-auto mb-3" />
          <p className="text-dark-500">Aucune publication. Soyez le premier !</p>
        </div>
      )}
    </div>
  );
}
