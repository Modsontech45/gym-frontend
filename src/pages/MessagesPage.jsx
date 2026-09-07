import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi, socialApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/common/Avatar';
import { Send, ArrowLeft, MessageCircle, Edit, Search, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ── New conversation modal ────────────────────────────────────────────────────

function NewConvModal({ onClose, onStart }) {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const timer = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer.current);
  }, [q]);

  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions'],
    queryFn: () => socialApi.getSuggestions().then(r => r.data),
  });

  const { data: searchResults = [], isFetching } = useQuery({
    queryKey: ['memberSearch', debouncedQ],
    queryFn: () => debouncedQ.length >= 2
      ? socialApi.searchMembers(debouncedQ).then(r => r.data)
      : Promise.resolve([]),
    enabled: debouncedQ.length >= 2,
  });

  const people = debouncedQ.length >= 2 ? searchResults : suggestions;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-dark-800 rounded-2xl w-full max-w-sm border border-dark-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-4 border-b border-dark-700">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              className="input w-full pl-9 py-2 text-sm"
              placeholder="Rechercher un membre…"
            />
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-700 text-dark-400">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isFetching ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : people.length === 0 ? (
            <div className="text-center py-10 text-dark-500 text-sm">
              {debouncedQ.length >= 2 ? `Aucun résultat pour « ${q} »` : 'Aucun membre trouvé'}
            </div>
          ) : (
            people.map(u => (
              <button
                key={u.id}
                onClick={() => onStart(u)}
                className="w-full flex items-center gap-3 p-3 hover:bg-dark-700 transition-colors text-left"
              >
                <img
                  src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${u.firstName} ${u.lastName}`)}&background=f97316&color=fff&size=64`}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-dark-500 capitalize">{u.role === 'coach' ? '🏋️ Coach' : '👤 Membre'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { userId: otherId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [showNewConv, setShowNewConv] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesApi.getConversations().then(r => r.data),
    refetchInterval: 10000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', otherId],
    queryFn: () => messagesApi.getMessages(otherId).then(r => r.data),
    enabled: !!otherId,
    refetchInterval: 5000,
  });

  const sendMessage = useMutation({
    mutationFn: ({ receiverId, content }) => messagesApi.send(receiverId, content),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', otherId]);
      queryClient.invalidateQueries(['conversations']);
      setText('');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !otherId) return;
    sendMessage.mutate({ receiverId: otherId, content: text });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const selectedConv = conversations.find(c => c.user?.id === otherId);

  const startConv = (member) => {
    setShowNewConv(false);
    navigate(`/messages/${member.id}`);
  };

  return (
    <>
      {showNewConv && <NewConvModal onClose={() => setShowNewConv(false)} onStart={startConv} />}

      <div className="h-full flex gap-4 pb-20 md:pb-0 animate-fade-in" style={{ height: 'calc(100vh - 8rem)' }}>

        {/* ── Conversation list ── */}
        <div className={`w-full md:w-80 flex-shrink-0 card flex flex-col overflow-hidden p-0 ${otherId ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center justify-between p-4 border-b border-dark-700">
            <h2 className="font-bold text-lg">Messages</h2>
            <button
              onClick={() => setShowNewConv(true)}
              className="p-2 rounded-xl hover:bg-dark-700 text-primary-400 hover:text-primary-300 transition-colors"
              title="Nouvelle conversation"
            >
              <Edit size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <div className="text-center py-10">
                <MessageCircle size={36} className="text-dark-600 mx-auto mb-3" />
                <p className="text-dark-500 text-sm">Aucune conversation</p>
                <button
                  onClick={() => setShowNewConv(true)}
                  className="btn-primary mt-3 text-sm flex items-center gap-2 mx-auto"
                >
                  <Edit size={14} /> Nouveau message
                </button>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.user?.id}
                  onClick={() => navigate(`/messages/${conv.user?.id}`)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors mb-1 ${
                    otherId === conv.user?.id ? 'bg-primary-500/20 border border-primary-500/30' : 'hover:bg-dark-700'
                  }`}
                >
                  <div onClick={e => e.stopPropagation()}>
                    <Avatar user={conv.user} size="md" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold truncate">{conv.user?.firstName} {conv.user?.lastName}</p>
                    <p className="text-xs text-dark-500 truncate">{conv.lastMessage?.content}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Chat area ── */}
        {otherId ? (
          <div className="flex-1 flex flex-col card overflow-hidden p-0">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-dark-700">
              <button onClick={() => navigate('/messages')} className="md:hidden p-1 rounded-lg hover:bg-dark-700">
                <ArrowLeft size={20} />
              </button>
              <Avatar user={selectedConv?.user} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {selectedConv?.user?.firstName} {selectedConv?.user?.lastName}
                </p>
                <p className="text-xs text-dark-500 capitalize">{selectedConv?.user?.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-dark-500">
                  <MessageCircle size={40} className="text-dark-700 mb-3" />
                  <p className="text-sm">Commencez la conversation</p>
                </div>
              )}
              {messages.map(msg => {
                const isMe = msg.senderId === user?.id;
                const sender = isMe ? user : selectedConv?.user;
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMe && <Avatar user={sender} size="xs" />}
                    <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                      isMe ? 'bg-primary-500 text-white rounded-br-sm' : 'bg-dark-700 rounded-bl-sm'
                    }`}>
                      <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-dark-500'}`}>
                        {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-dark-700 flex gap-3 items-end">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="input flex-1 py-2.5 resize-none max-h-32 overflow-y-auto"
                placeholder="Écrire un message… (Entrée pour envoyer)"
                style={{ fieldSizing: 'content' }}
              />
              <button type="submit" disabled={sendMessage.isPending || !text.trim()} className="btn-primary px-4 py-2.5">
                <Send size={18} />
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 card items-center justify-center">
            <div className="text-center text-dark-500">
              <MessageCircle size={48} className="mx-auto mb-3 text-dark-700" />
              <p className="font-medium">Sélectionnez une conversation</p>
              <p className="text-sm mt-1">ou</p>
              <button
                onClick={() => setShowNewConv(true)}
                className="btn-primary mt-3 flex items-center gap-2 mx-auto text-sm"
              >
                <Edit size={14} /> Nouveau message
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
