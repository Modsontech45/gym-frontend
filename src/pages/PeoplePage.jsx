import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi, gymApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Search, UserPlus, UserCheck, Users } from 'lucide-react';

const AVATAR_PLACEHOLDER = (name) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&size=64`;

function UserCard({ user, onFollowToggle }) {
  const me = useAuthStore(s => s.user);
  if (!user || user.id === me?.id) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-700 transition-colors">
      <img
        src={user.avatar || AVATAR_PLACEHOLDER(`${user.firstName} ${user.lastName}`)}
        alt=""
        className="w-10 h-10 rounded-full object-cover bg-dark-600"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm leading-tight">{user.firstName} {user.lastName}</p>
        <p className="text-xs text-dark-400 capitalize">{user.role === 'coach' ? '🏋️ Coach' : '👤 Membre'}</p>
      </div>
      <button
        onClick={() => onFollowToggle(user)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
          user.isFollowing
            ? 'bg-dark-600 text-dark-300 hover:bg-dark-500'
            : 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
        }`}
      >
        {user.isFollowing ? <><UserCheck size={13} /> Suivi</> : <><UserPlus size={13} /> Suivre</>}
      </button>
    </div>
  );
}

export default function PeoplePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('search'); // 'search' | 'followers' | 'following'
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedQ(query), 350);
    return () => clearTimeout(timer.current);
  }, [query]);

  const { data: searchResults = [], isFetching } = useQuery({
    queryKey: ['memberSearch', debouncedQ],
    queryFn: () => debouncedQ.length >= 2 ? socialApi.searchMembers(debouncedQ).then(r => r.data) : Promise.resolve([]),
    enabled: debouncedQ.length >= 2,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers'],
    queryFn: () => socialApi.getFollowers().then(r => r.data),
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following'],
    queryFn: () => socialApi.getFollowing().then(r => r.data),
  });

  const followMutation = useMutation({
    mutationFn: ({ id, isFollowing }) => isFollowing ? socialApi.unfollow(id) : socialApi.follow(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memberSearch'] });
      qc.invalidateQueries({ queryKey: ['followers'] });
      qc.invalidateQueries({ queryKey: ['following'] });
    },
  });

  const handleToggle = (user) => {
    followMutation.mutate({ id: user.id, isFollowing: user.isFollowing });
  };

  // Annotate followers/following with isFollowing
  const followingIds = new Set(following.map(u => u.id));
  const annotatedFollowers = followers.map(u => ({ ...u, isFollowing: followingIds.has(u.id) }));
  const annotatedFollowing = following.map(u => ({ ...u, isFollowing: true }));

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Membres</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 rounded-xl p-1 mb-6">
        {[
          { key: 'search', label: 'Rechercher', icon: Search },
          { key: 'following', label: `Suivi (${following.length})`, icon: UserCheck },
          { key: 'followers', label: `Followers (${followers.length})`, icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key ? 'bg-dark-600 text-white' : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'search' && (
        <div>
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              className="input w-full pl-9"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un membre par nom…"
            />
          </div>
          {query.length >= 2 && (
            <div className="space-y-1">
              {isFetching ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-dark-400 text-sm py-8">Aucun membre trouvé.</p>
              ) : (
                searchResults.map(u => <UserCard key={u.id} user={u} onFollowToggle={handleToggle} />)
              )}
            </div>
          )}
          {query.length < 2 && (
            <div className="text-center py-12 text-dark-500">
              <Search size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tapez au moins 2 caractères pour rechercher.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'following' && (
        <div className="space-y-1">
          {annotatedFollowing.length === 0 ? (
            <p className="text-center text-dark-400 text-sm py-12">Vous ne suivez personne pour l'instant.</p>
          ) : (
            annotatedFollowing.map(u => <UserCard key={u.id} user={u} onFollowToggle={handleToggle} />)
          )}
        </div>
      )}

      {tab === 'followers' && (
        <div className="space-y-1">
          {annotatedFollowers.length === 0 ? (
            <p className="text-center text-dark-400 text-sm py-12">Vous n'avez pas encore de followers.</p>
          ) : (
            annotatedFollowers.map(u => <UserCard key={u.id} user={u} onFollowToggle={handleToggle} />)
          )}
        </div>
      )}
    </div>
  );
}
