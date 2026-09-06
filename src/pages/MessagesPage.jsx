import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import Avatar from '../components/common/Avatar';
import { Send, ArrowLeft, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MessagesPage() {
  const { userId: otherId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
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

  const selectedConv = conversations.find(c => c.user?.id === otherId);

  return (
    <div className="h-full flex gap-4 pb-20 md:pb-0 animate-fade-in" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Conversation list */}
      <div className={`w-full md:w-80 flex-shrink-0 card overflow-y-auto ${otherId ? 'hidden md:block' : ''}`}>
        <h2 className="font-bold text-lg mb-4">Messages</h2>
        {conversations.length === 0 && (
          <p className="text-dark-500 text-sm text-center py-8">Aucune conversation</p>
        )}
        {conversations.map(conv => (
          <button key={conv.user?.id} onClick={() => navigate(`/messages/${conv.user?.id}`)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors mb-1 ${otherId === conv.user?.id ? 'bg-primary-500/20' : 'hover:bg-dark-700'}`}>
            {/* Avatar: clicking navigates to profile, not to DM */}
            <div onClick={e => e.stopPropagation()}>
              <Avatar user={conv.user} size="md" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium truncate">{conv.user?.firstName} {conv.user?.lastName}</p>
              <p className="text-xs text-dark-500 truncate">{conv.lastMessage?.content}</p>
            </div>
            {conv.unreadCount > 0 && (
              <span className="bg-primary-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0">
                {conv.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Chat area */}
      {otherId ? (
        <div className="flex-1 flex flex-col card overflow-hidden p-0">
          {/* Chat header */}
          <div className="flex items-center gap-3 p-4 border-b border-dark-700">
            <button onClick={() => navigate('/messages')} className="md:hidden p-1 rounded-lg hover:bg-dark-700">
              <ArrowLeft size={20} />
            </button>
            <Avatar user={selectedConv?.user} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{selectedConv?.user?.firstName} {selectedConv?.user?.lastName}</p>
              <p className="text-xs text-dark-500 capitalize">{selectedConv?.user?.role}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map(msg => {
              const isMe = msg.senderId === user?.id;
              const sender = isMe ? user : selectedConv?.user;
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && <Avatar user={sender} size="xs" />}
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary-500 text-white rounded-br-sm' : 'bg-dark-700 rounded-bl-sm'}`}>
                    <p className="whitespace-pre-line">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-dark-500'}`}>
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-dark-700 flex gap-3">
            <input value={text} onChange={e => setText(e.target.value)}
              className="input flex-1 py-2.5" placeholder="Écrire un message…" />
            <button type="submit" disabled={sendMessage.isPending} className="btn-primary px-4">
              <Send size={18} />
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 card items-center justify-center">
          <div className="text-center text-dark-500">
            <MessageCircle size={48} className="mx-auto mb-3 text-dark-700" />
            <p>Sélectionnez une conversation</p>
          </div>
        </div>
      )}
    </div>
  );
}
