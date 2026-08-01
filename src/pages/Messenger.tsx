import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ImagePlus, Smile, ArrowLeft, Search, Loader2, Repeat2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/Avatar';
import { getConversations, getMessages, sendMessage, markMessagesRead, getFriends } from '@/lib/api';
import type { Profile, Message } from '@/types';
import { displayName, displayHandle, timeAgo, formatTime } from '@/lib/helpers';
import type { Page } from '@/App';

interface MessengerProps {
  onOpenProfile: (userId: string) => void;
  onNavigate: (page: Page) => void;
  initialPartnerId?: string | null;
}

const EMOJIS = ['😀', '😂', '🥰', '😍', '😘', '😎', '🤔', '😴', '😭', '😡', '🎉', '🔥', '❤️', '👍', '👎', '🙏', '👏', '💪', '✨', '🌟', '🌈', '☀️', '🌙', '🍕', '🍔', '☕', '🍻', '🎵', '⚽', '🏀', '🚀', '💯'];

export default function Messenger({ onOpenProfile, initialPartnerId }: MessengerProps) {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<{ partner: Profile; lastMessage: Message | null }[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Profile[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const convs = await getConversations(user.id);
      setConversations(convs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConversations();
    if (user) {
      getFriends(user.id).then(setFriends).catch(() => {});
    }
  }, [loadConversations, user]);

  // Auto-select partner if navigated from share
  useEffect(() => {
    if (initialPartnerId && friends.length > 0) {
      const partner = friends.find((f) => f.id === initialPartnerId);
      if (partner) {
        setSelectedPartner(partner);
      }
    }
  }, [initialPartnerId, friends]);

  // Load messages when partner selected
  useEffect(() => {
    if (!user || !selectedPartner) return;
    setLoadingMsgs(true);
    getMessages(user.id, selectedPartner.id).then((msgs) => {
      setMessages(msgs);
      setLoadingMsgs(false);
      markMessagesRead(user.id, selectedPartner.id);
    });

    // Poll for new messages
    const interval = setInterval(() => {
      getMessages(user!.id, selectedPartner!.id).then((msgs) => {
        setMessages(msgs);
        markMessagesRead(user!.id, selectedPartner!.id);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [user, selectedPartner]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!text.trim() && !imageUrl.trim()) return;
    if (!user || !selectedPartner) return;
    setSending(true);
    const content = text.trim();
    const img = imageUrl.trim() || null;
    setText('');
    setImageUrl('');
    setShowImageInput(false);

    try {
      const msg = await sendMessage(user.id, selectedPartner.id, content, img, null);
      if (msg) {
        setMessages((prev) => [...prev, msg]);
      }
      loadConversations();
    } catch {
      setText(content);
    } finally {
      setSending(false);
    }
  }

  function handleSelectEmoji(emoji: string) {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
  }

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) => displayName(c.partner).toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  // Mobile: show conversation or list
  const showConversationOnMobile = !!selectedPartner;

  return (
    <div className="flex h-[calc(100vh-0px)] md:h-screen overflow-hidden">
      {/* Chat list */}
      <div className={`${showConversationOnMobile ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-slate-200 bg-white shrink-0`}>
        <div className="p-4 border-b border-slate-100">
          <h1 className="text-xl font-bold text-slate-800 mb-3">Chats</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-100 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-700"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
            </div>
          ) : filteredConversations.length === 0 && !searchQuery ? (
            <div className="p-4">
              <p className="text-sm text-slate-400 mb-3">No conversations yet. Start chatting with your friends!</p>
              <button
                onClick={() => setShowNewChat(true)}
                className="w-full py-2.5 rounded-lg bg-brand-50 text-brand-600 text-sm font-semibold hover:bg-brand-100 transition-colors"
              >
                Start a new chat
              </button>
            </div>
          ) : (
            <>
              {filteredConversations.map((conv) => (
                <button
                  key={conv.partner.id}
                  onClick={() => setSelectedPartner(conv.partner)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                    selectedPartner?.id === conv.partner.id ? 'bg-brand-50' : ''
                  }`}
                >
                  <Avatar profile={conv.partner} size="md" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-sm text-slate-800 truncate">{displayName(conv.partner)}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {conv.lastMessage?.content || (conv.lastMessage?.image_url ? '📷 Photo' : conv.lastMessage?.shared_post_id ? 'Shared a post' : 'Say hi!')}
                    </p>
                  </div>
                  {conv.lastMessage && (
                    <span className="text-xs text-slate-300 shrink-0">{timeAgo(conv.lastMessage.created_at)}</span>
                  )}
                </button>
              ))}

              {/* New chat button */}
              <button
                onClick={() => setShowNewChat(true)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-brand-600"
              >
                <div className="w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center">
                  <span className="text-xl font-light">+</span>
                </div>
                <span className="font-semibold text-sm">New chat</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Conversation */}
      <div className={`${showConversationOnMobile ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-slate-50`}>
        {selectedPartner ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-3 bg-white border-b border-slate-200">
              <button onClick={() => setSelectedPartner(null)} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <Avatar profile={selectedPartner} size="sm" onClick={() => onOpenProfile(selectedPartner.id)} />
              <div className="flex-1 min-w-0">
                <button onClick={() => onOpenProfile(selectedPartner.id)} className="font-semibold text-sm text-slate-800 hover:underline truncate block">
                  {displayName(selectedPartner)}
                </button>
                <p className="text-xs text-slate-400">{displayHandle(selectedPartner.username)}</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.sender_id === user?.id;
                  const prevMsg = messages[i - 1];
                  const showAvatar = !isMine && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        showAvatar ? <Avatar profile={selectedPartner} size="xs" /> : <div className="w-7 shrink-0" />
                      )}
                      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                        {msg.shared_post_id && msg.shared_post ? (
                          <div className={`rounded-2xl p-3 ${isMine ? 'bg-brand-500' : 'bg-white border border-slate-200'} animate-message-in`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar profile={msg.shared_post.author} size="xs" />
                              <span className={`text-xs font-semibold ${isMine ? 'text-white' : 'text-slate-700'}`}>
                                {displayName(msg.shared_post.author)}
                              </span>
                            </div>
                            <p className={`text-sm ${isMine ? 'text-white' : 'text-slate-600'}`}>{msg.shared_post.content || 'Shared post'}</p>
                            {msg.shared_post.image_url && (
                              <img src={msg.shared_post.image_url} alt="" className="mt-2 rounded-lg max-h-40 w-full object-cover" />
                            )}
                            <div className={`flex items-center gap-1 mt-1.5 text-xs ${isMine ? 'text-white/70' : 'text-slate-400'}`}>
                              <Repeat2 className="w-3 h-3" /> Shared post
                            </div>
                          </div>
                        ) : msg.image_url ? (
                          <img src={msg.image_url} alt="" className="rounded-2xl max-h-64 w-auto object-cover" />
                        ) : (
                          <div className={`px-3.5 py-2.5 rounded-2xl ${isMine ? 'bg-brand-500 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md'} animate-message-in`}>
                            <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        )}
                        <span className="text-[10px] text-slate-300 mt-0.5 px-1">{formatTime(msg.created_at)}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Emoji picker */}
            {showEmoji && (
              <div className="bg-white border-t border-slate-200 p-3 grid grid-cols-8 gap-1">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelectEmoji(emoji)}
                    className="text-2xl hover:bg-slate-100 rounded-lg p-1.5 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Image URL input */}
            {showImageInput && (
              <div className="p-3 bg-white border-t border-slate-200">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-brand-500"
                />
              </div>
            )}

            {/* Input bar */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <button
                onClick={() => { setShowEmoji((s) => !s); setShowImageInput(false); }}
                className={`p-2 rounded-full transition-colors ${showEmoji ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <Smile className="w-5.5 h-5.5" style={{ width: 22, height: 22 }} />
              </button>
              <button
                onClick={() => { setShowImageInput((s) => !s); setShowEmoji(false); }}
                className={`p-2 rounded-full transition-colors ${showImageInput ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:bg-slate-100'}`}
              >
                <ImagePlus className="w-5.5 h-5.5" style={{ width: 22, height: 22 }} />
              </button>
              <div className="flex-1 flex items-center bg-slate-100 rounded-full px-4 py-2.5">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !sending && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent outline-none text-sm text-slate-700 placeholder-slate-400"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={sending || (!text.trim() && !imageUrl.trim())}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-500 via-blue-500 to-accent-500 text-white flex items-center justify-center disabled:opacity-40 shadow-md shadow-brand/30"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 animate-float">
                <Send className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-medium text-slate-500">Your Messages</p>
              <p className="text-sm mt-1">Select a chat or start a new conversation</p>
            </div>
          </div>
        )}
      </div>

      {/* New chat modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm backdrop-enter" onClick={() => setShowNewChat(false)}>
          <div className="bg-white w-full md:max-w-sm rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[70vh] flex flex-col modal-enter" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">New Chat</h2>
              <p className="text-sm text-slate-400 mt-0.5">Select a friend to start chatting</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {friends.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">No friends yet. Add friends first!</p>
              ) : (
                friends.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => { setSelectedPartner(f); setShowNewChat(false); }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <Avatar profile={f} size="sm" />
                    <span className="flex-1 text-left font-medium text-slate-700 text-sm">{displayName(f)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
