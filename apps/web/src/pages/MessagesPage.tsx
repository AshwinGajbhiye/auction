import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Send, MessageSquare, MapPin, Tag } from 'lucide-react';
import { conversationsApi, ConversationSummary, ChatMessage } from '../api/conversations';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation } = useSocket();
  const location = useLocation();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(
    (location.state as any)?.conversationId || null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    conversationsApi
      .getConversations()
      .then((data) => {
        setConversations(data);
        if (!activeConvId && data.length > 0) {
          setActiveConvId(data[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load messages and subscribe to room
  useEffect(() => {
    if (!activeConvId) return;

    setLoadingMessages(true);
    conversationsApi
      .getMessages(activeConvId, 1, 100)
      .then((res) => setMessages(res.items || []))
      .catch(console.error)
      .finally(() => setLoadingMessages(false));

    joinConversation(activeConvId);

    const handleNewMessage = (event: any) => {
      if (event.conversationId === activeConvId) {
        setMessages((prev) => [...prev, event.message]);
      }
    };

    if (socket) {
      socket.on('message:new', handleNewMessage);
    }

    return () => {
      if (socket) {
        socket.off('message:new', handleNewMessage);
      }
      leaveConversation(activeConvId);
    };
  }, [activeConvId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage('');

    try {
      const sent = await conversationsApi.sendMessage(activeConvId, content);
      setMessages((prev) => [...prev, sent]);
    } catch (err: any) {
      alert(err.message || 'Could not send message.');
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  if (loading) {
    return <LoadingSpinner message="Opening student chat..." />;
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden h-[calc(100vh-12rem)] min-h-[500px] flex">
      {/* Left Column: Conversations List */}
      <aside className="w-80 border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand-600" />
            Messages
          </h2>
          <span className="text-[11px] font-bold text-slate-400 font-mono">
            {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.length > 0 ? (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                  activeConvId === c.id ? 'bg-brand-50/60' : 'hover:bg-slate-50'
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center shrink-0">
                  {c.otherParticipant?.name?.slice(0, 1) || 'U'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {c.otherParticipant?.name}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {c.lastMessage?.createdAt
                        ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>

                  <p className="text-[11px] text-brand-600 font-semibold truncate mt-0.5">
                    {c.listing?.title}
                  </p>

                  <p className="text-xs text-slate-500 truncate mt-1">
                    {c.lastMessage?.content || 'Started a conversation'}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No conversations yet. Message a seller from any listing page!
            </div>
          )}
        </div>
      </aside>

      {/* Right Column: Chat Window */}
      <section className="flex-1 flex flex-col bg-slate-50/50">
        {activeConv ? (
          <>
            {/* Header: Item preview & participant */}
            <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <img
                    src={activeConv.listing?.images?.[0]?.imageUrl || '/placeholder-item.jpg'}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <Link
                    to={`/listings/${activeConv.listingId}`}
                    className="text-xs font-bold text-slate-900 hover:text-brand-600 truncate max-w-sm block"
                  >
                    {activeConv.listing?.title}
                  </Link>
                  <p className="text-[11px] text-slate-500">
                    Chat with <strong>{activeConv.otherParticipant?.name}</strong>
                  </p>
                </div>
              </div>

              <Link
                to={`/listings/${activeConv.listingId}`}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                View Listing →
              </Link>
            </div>

            {/* Messages body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {loadingMessages ? (
                <LoadingSpinner message="Fetching messages..." />
              ) : messages.length > 0 ? (
                messages.map((m) => {
                  const isMe = m.senderId === user?.id || m.sender?.id === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                          isMe
                            ? 'gradient-brand text-white shadow-xs rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200 shadow-xs rounded-bl-xs'
                        }`}
                      >
                        {m.content}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-xs text-slate-400">
                  Start the conversation! Coordinate on-campus exchange location and timing.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message (e.g. Can meet outside library 3pm?)"
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-4 py-2.5 gradient-brand text-white rounded-xl shadow-xs hover:opacity-95 disabled:opacity-40 transition-all flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
            <MessageSquare className="h-10 w-10 text-slate-300 mb-2" />
            <span>Select a conversation to start chatting</span>
          </div>
        )}
      </section>
    </div>
  );
};
