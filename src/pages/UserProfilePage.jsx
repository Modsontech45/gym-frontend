import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usersApi, messagesApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import {
  ArrowLeft, MessageCircle, Flame, Dumbbell,
  FileText, Trophy, Calendar, MapPin, Target,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';

function StreakBadge({ value, label, Icon, color }) {
  return (
    <div className="flex-1 card text-center py-4">
      <Icon size={20} className={`mx-auto mb-1 ${color}`} />
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-dark-500 mt-0.5">{label}</p>
    </div>
  );
}

function PostThumb({ post }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/feed?post=' + post.id)}
      className="aspect-square rounded-xl overflow-hidden bg-dark-700 relative group"
    >
      {post.mediaUrl && post.mediaType === 'image' ? (
        <img src={post.mediaUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
      ) : post.mediaUrl && post.mediaType === 'video' ? (
        <video src={post.mediaUrl} className="w-full h-full object-cover" muted />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-3">
          <p className="text-xs text-dark-400 text-center line-clamp-4 leading-snug">{post.content}</p>
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-xl" />
    </button>
  );
}

export default function UserProfilePage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuthStore();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => usersApi.getPublicProfile(userId).then(r => r.data),
    enabled: !!userId,
  });

  const isMe = me?.id === userId;

  const startDm = async () => {
    navigate(`/messages/${userId}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto animate-fade-in pb-20 md:pb-0">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-dark-700 transition-colors">
            <ArrowLeft size={20} />
          </button>
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-24 bg-dark-700 animate-pulse rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 animate-fade-in">
        <p className="text-dark-500">Profil introuvable</p>
        <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Retour</button>
      </div>
    );
  }

  const memberSince = profile.createdAt
    ? format(new Date(profile.createdAt), 'MMMM yyyy', { locale: fr })
    : '—';

  const LEVEL_LABEL = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
  const roleLabel = { admin: 'Admin', coach: 'Coach', client: 'Membre' };

  return (
    <div className="max-w-xl mx-auto animate-fade-in pb-20 md:pb-0 space-y-4">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-dark-500 hover:text-white transition-colors text-sm">
        <ArrowLeft size={18} /> Retour
      </button>

      {/* Header card */}
      <div className="card text-center relative">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold text-3xl overflow-hidden mx-auto mb-3 ring-4 ring-primary-500/20">
          {profile.avatar
            ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
            : `${profile.firstName?.[0]}${profile.lastName?.[0]}`}
        </div>

        <h1 className="text-xl font-bold text-white">{profile.firstName} {profile.lastName}</h1>

        <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400">
            {roleLabel[profile.role] || profile.role}
          </span>
          {profile.experienceLevel && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-dark-400">
              {LEVEL_LABEL[profile.experienceLevel] || profile.experienceLevel}
            </span>
          )}
        </div>

        {profile.bio && (
          <p className="text-sm text-dark-400 mt-3 max-w-sm mx-auto leading-relaxed">{profile.bio}</p>
        )}

        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-dark-500 flex-wrap">
          {profile.location && (
            <span className="flex items-center gap-1"><MapPin size={12} /> {profile.location}</span>
          )}
          {profile.fitnessGoal && (
            <span className="flex items-center gap-1"><Target size={12} /> {profile.fitnessGoal}</span>
          )}
          <span className="flex items-center gap-1"><Calendar size={12} /> Membre depuis {memberSince}</span>
        </div>

        {/* Message button (only for others) */}
        {!isMe && (
          <button
            onClick={startDm}
            className="btn-primary mt-4 flex items-center gap-2 mx-auto text-sm"
          >
            <MessageCircle size={16} /> Envoyer un message
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center py-4">
          <FileText size={20} className="mx-auto mb-1 text-primary-400" />
          <p className="text-2xl font-bold text-white">{profile.postCount ?? 0}</p>
          <p className="text-xs text-dark-500 mt-0.5">Publications</p>
        </div>
        <div className="card text-center py-4">
          <Dumbbell size={20} className="mx-auto mb-1 text-purple-400" />
          <p className="text-2xl font-bold text-white">{profile.totalWorkouts ?? 0}</p>
          <p className="text-xs text-dark-500 mt-0.5">Séances complétées</p>
        </div>
      </div>

      {/* Streaks */}
      <div>
        <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-2">Séries en cours</h2>
        <div className="flex gap-3">
          <StreakBadge
            value={profile.workoutStreak ?? 0}
            label={profile.workoutStreak === 1 ? 'jour workout' : 'jours workout'}
            Icon={Flame}
            color={profile.workoutStreak >= 7 ? 'text-orange-400' : profile.workoutStreak >= 3 ? 'text-amber-400' : 'text-dark-500'}
          />
          <StreakBadge
            value={profile.postStreak ?? 0}
            label={profile.postStreak === 1 ? 'jour actif' : 'jours actifs'}
            Icon={Trophy}
            color={profile.postStreak >= 7 ? 'text-yellow-400' : profile.postStreak >= 3 ? 'text-primary-400' : 'text-dark-500'}
          />
        </div>
      </div>

      {/* Recent posts grid */}
      {profile.recentPosts?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-2">Publications récentes</h2>
          <div className="grid grid-cols-3 gap-2">
            {profile.recentPosts.map(post => (
              <PostThumb key={post.id} post={post} />
            ))}
          </div>
        </div>
      )}

      {profile.recentPosts?.length === 0 && (
        <div className="card text-center py-10 text-dark-500 text-sm">
          Aucune publication pour l'instant
        </div>
      )}
    </div>
  );
}
