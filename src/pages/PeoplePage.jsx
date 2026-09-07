import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socialApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Search, UserPlus, UserCheck, Users, Sparkles } from 'lucide-react';

const avatar = (u) =>
  u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${u?.firstName} ${u?.lastName}`)}&background=f97316&color=fff&size=64`;

function UserCard({ user, onToggle, loading }) {
  const me = useAuthStore(s => s.user);
  if (!user || user.id === me?.id) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-800 border border-dark-700 hover:border-dark-600 transition-colors">
      <img src={avatar(user)} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight">{user.firstName} {user.lastName}</p>
        <p className="text-xs text-dark-500 mt-0.5">
          {user.role === 'coach' ? '🏋️ Coach' : '👤 Membre'}
          {user.bio ? ` · ${user.bio.slice(0, 40)}${user.bio.length > 40 ? '…' : ''}` : ''}
        </p>
      </div>
      <button
        onClick={() => onToggle(user)}
        disabled={loading}
        className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
          user.isFollowing
            ? 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-red-400'
            : 'bg-primary-500 text-white hover:bg-primary-400'
        }`}
      >
        {user.isFollowing
          ? <><UserCheck size={13} /> Suivi</>
          : <><UserPlus size={13} /> Suivre</>}
      </button>
    </div>
  );
}

export default function PeoplePage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('discover');
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedQ(query), 350);
    return () => clearTimeout(timer.current);
  }, [query]);

  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => socialApi.getSuggestions().then(r => r.data),
  });

  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ['memberSearch', debouncedQ],
    queryFn: () => debouncedQ.length >= 2
      ? socialApi.searchMembers(debouncedQ).then(r => r.data)
      : Promise.resolve([]),
    enabled: tab === 'search' && debouncedQ.length >= 2,
  });

  const { data: followers = [] } = useQuery({
    queryKey: ['followers'],
    queryFn: () => socialApi.getFollowers().then(r => r.data),
  });

  const { data: following = [] } = useQuery({
    queryKey: ['following'],
    queryFn: () => socialApi.getFollowing().then(r => r.data),
  });

  const followMut = useMutation({
    mutationFn: ({ id, isFollowing }) =>
      isFollowing ? socialApi.unfollow(id) : socialApi.follow(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suggestions'] });
      qc.invalidateQueries({ queryKey: ['memberSearch'] });
      qc.invalidateQueries({ queryKey: ['followers'] });
      qc.invalidateQueries({ queryKey: ['following'] });
    },
  });

  const handleToggle = (user) => followMut.mutate({ id: user.id, isFollowing: user.isFollowing });

  const followingIds = new Set(following.map(u => u.id));
  const annotatedFollowers = followers.map(u => ({ ...u, isFollowing: followingIds.has(u.id) }));
  const annotatedFollowing = following.map(u => ({ ...u, isFollowing: true }));

  const tabs = [
    { key: 'discover', label: 'Découvrir', icon: Sparkles },
    { key: 'search', label: 'Rechercher', icon: Search },
    { key: 'following', label: `Suivi (${following.length})`, icon: UserCheck },
    { key: 'followers', label: `Followers (${followers.length})`, icon: Users },
  ];

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-20 md:pb-0 animate-fade-in">
      <h1 className="text-2xl font-bold">Membres</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 rounded-xl p-1 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === key ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Discover */}
      {tab === 'discover' && (
        <div className="space-y-2">
          <p className="text-xs text-dark-500 font-medium uppercase tracking-wider px-1">
            Membres de la salle · {suggestions.length} personnes
          </p>
          {suggestions.length === 0 ? (
            <div className="card text-center py-12">
              <Users size={36} className="text-dark-600 mx-auto mb-3" />
              <p className="text-dark-500">Aucun membre trouvé</p>
            </div>
          ) : suggestions.map(u => (
            <UserCard key={u.id} user={u} onToggle={handleToggle} loading={followMut.isPending} />
          ))}
        </div>
      )}

      {/* Search */}
      {tab === 'search' && (
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" />
            <input
              className="input w-full pl-10"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un membre par nom…"
              autoFocus
            />
          </div>
          {query.length < 2 ? (
            <div className="text-center py-12 text-dark-500">
              <Search size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Tapez au moins 2 caractères pour rechercher</p>
            </div>
          ) : searching ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-center text-dark-400 text-sm py-10">Aucun membre trouvé pour « {query} »</p>
          ) : (
            <div className="space-y-2">
              {searchResults.map(u => (
                <UserCard key={u.id} user={u} onToggle={handleToggle} loading={followMut.isPending} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Following */}
      {tab === 'following' && (
        <div className="space-y-2">
          {annotatedFollowing.length === 0 ? (
            <div className="card text-center py-12">
              <UserPlus size={36} className="text-dark-600 mx-auto mb-3" />
              <p className="text-dark-500">Vous ne suivez personne</p>
              <button onClick={() => setTab('discover')} className="btn-primary mt-3 text-sm">Découvrir des membres</button>
            </div>
          ) : annotatedFollowing.map(u => (
            <UserCard key={u.id} user={u} onToggle={handleToggle} loading={followMut.isPending} />
          ))}
        </div>
      )}

      {/* Followers */}
      {tab === 'followers' && (
        <div className="space-y-2">
          {annotatedFollowers.length === 0 ? (
            <div className="card text-center py-12">
              <Users size={36} className="text-dark-600 mx-auto mb-3" />
              <p className="text-dark-500">Vous n'avez pas encore de followers</p>
            </div>
          ) : annotatedFollowers.map(u => (
            <UserCard key={u.id} user={u} onToggle={handleToggle} loading={followMut.isPending} />
          ))}
        </div>
      )}
    </div>
  );
}
