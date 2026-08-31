'use client';
import { useEffect, useState, useRef } from 'react';
import Header from '@/components/layout/Header';
import { buildingsApi, chatApi, Building, ChatMessage, ChatMember } from '@/lib/api';
import { getUser, getToken } from '@/lib/auth';
import { Send, MessageSquare, Building2, Clock, Users, Trash2, ArrowRight, X, ChevronRight, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [members, setMembers] = useState<ChatMember[]>([]);
  
  // Active chat target: 'group' or a member's user_id
  const [chatTarget, setChatTarget] = useState<'group' | string>('group');
  const [selectedMember, setSelectedMember] = useState<ChatMember | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<boolean>(false);

  // Drawer / Modal states
  const [showMembersDrawer, setShowMembersDrawer] = useState<boolean>(false);
  const [forwardMessage, setForwardMessage] = useState<ChatMessage | null>(null);
  const [forwardBuildingId, setForwardBuildingId] = useState<string>('');
  const [forwardRecipientId, setForwardRecipientId] = useState<string>('group'); // 'group' or user_id
  const [forwardMembers, setForwardMembers] = useState<ChatMember[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load current user and buildings list
  useEffect(() => {
    setCurrentUser(getUser());
    const loadBuildings = async () => {
      try {
        const res = await buildingsApi.list();
        setBuildings(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedBuildingId(res.data[0].id);
          setForwardBuildingId(res.data[0].id);
        }
      } catch (err) {
        toast.error('Không thể tải danh sách tòa nhà');
      } finally {
        setLoading(false);
      }
    };
    loadBuildings();
  }, []);

  // Load building members whenever selected building changes
  useEffect(() => {
    if (!selectedBuildingId) return;
    const fetchMembers = async () => {
      try {
        const res = await chatApi.listMembers(selectedBuildingId);
        const membersList = res.data || [];
        setMembers(membersList);
        
        // Default to group chat for all roles
        setChatTarget('group');
        setSelectedMember(null);
      } catch (err) {
        console.error('Error fetching members:', err);
      }
    };
    fetchMembers();
  }, [selectedBuildingId]);

  // Load members for forwarding destination building
  useEffect(() => {
    if (!forwardBuildingId) return;
    const fetchForwardMembers = async () => {
      try {
        const res = await chatApi.listMembers(forwardBuildingId);
        setForwardMembers(res.data || []);
      } catch (err) {
        console.error('Error fetching forward members:', err);
      }
    };
    fetchForwardMembers();
    setForwardRecipientId('group');
  }, [forwardBuildingId]);

  // Handle active chat target change, load history and setup WebSocket
  useEffect(() => {
    if (!selectedBuildingId) return;

    // 1. Fetch previous messages
    const fetchHistory = async () => {
      try {
        const recipientId = chatTarget === 'group' ? undefined : chatTarget;
        const res = await chatApi.listMessages(selectedBuildingId, recipientId);
        setMessages(res.data || []);
      } catch (err) {
        toast.error('Lỗi khi tải lịch sử tin nhắn');
      }
    };
    fetchHistory();

    // 2. Setup real-time WebSocket connection
    const token = getToken();
    if (!token) return;

    setConnecting(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const wsUrl = apiUrl.replace(/^http/, 'ws') + `/chat/${selectedBuildingId}/ws?token=${token}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnecting(false);
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'recall') {
          // Update the recalled message text locally
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.message_id
                ? { ...m, is_recalled: true, message: 'Tin nhắn đã bị thu hồi' }
                : m
            )
          );
        } else if (payload.type === 'message' || !payload.type) {
          const msg: ChatMessage = payload;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;

            // Filter message according to active chat target
            const isGroupChat = chatTarget === 'group';
            const msgIsGroup = msg.recipient_id === null;

            if (isGroupChat && msgIsGroup) {
              return [...prev, msg];
            }
            if (!isGroupChat && !msgIsGroup) {
              const matchesPrivate =
                (msg.sender_id === chatTarget || msg.recipient_id === chatTarget);
              if (matchesPrivate) {
                return [...prev, msg];
              }
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Error parsing ws data:', err);
      }
    };

    ws.onclose = () => {
      setConnecting(false);
    };

    ws.onerror = () => {
      setConnecting(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedBuildingId, chatTarget]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message handler
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedBuildingId) return;

    const recipientId = chatTarget === 'group' ? undefined : chatTarget;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          message: newMessage,
          recipient_id: recipientId,
        })
      );
      setNewMessage('');
    } else {
      chatApi.sendMessage(selectedBuildingId, newMessage, recipientId)
        .then((res) => {
          setMessages((prev) => [...prev, res.data]);
          setNewMessage('');
        })
        .catch(() => {
          toast.error('Không thể gửi tin nhắn. Vui lòng kết nối lại!');
        });
    }
  };

  // Recall (delete) message
  const handleRecallMessage = async (messageId: string) => {
    try {
      await chatApi.recallMessage(selectedBuildingId, messageId);
      toast.success('Đã thu hồi tin nhắn');
    } catch (err) {
      toast.error('Không thể thu hồi tin nhắn');
    }
  };

  // Forward message content
  const handleForwardMessage = async () => {
    if (!forwardMessage || !forwardBuildingId) return;
    try {
      const recipientId = forwardRecipientId === 'group' ? undefined : forwardRecipientId;
      await chatApi.sendMessage(forwardBuildingId, `[Chuyển tiếp]: ${forwardMessage.message}`, recipientId);
      toast.success('Đã chuyển tiếp tin nhắn thành công!');
      setForwardMessage(null);
    } catch (err) {
      toast.error('Chuyển tiếp thất bại');
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'OWNER') return 'Chủ trọ';
    if (role === 'SUPERADMIN') return 'Quản trị viên';
    return 'Người thuê';
  };

  if (loading) {
    return (
      <div>
        <Header title="Chat Real-time" />
        <div className="p-6 text-center text-slate-500">Đang tải...</div>
      </div>
    );
  }

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative overflow-hidden">
      <Header title="Trò chuyện tòa nhà" />

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side Panel: Buildings & Rooms selection list */}
        <div className="w-full md:w-80 bg-white border-r border-slate-100 flex flex-col overflow-hidden">
          {/* Building Selection Dropdown */}
          <div className="p-4 border-b border-slate-100">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Chọn tòa nhà</label>
            <select
              value={selectedBuildingId}
              onChange={(e) => setSelectedBuildingId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  🏢 {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rooms and Targets menu */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Group Channels Section - visible to all roles */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kênh chung</span>
              <button
                onClick={() => {
                  setChatTarget('group');
                  setSelectedMember(null);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between border ${
                  chatTarget === 'group'
                    ? 'bg-blue-50 border-blue-100 text-blue-700 font-bold shadow-sm'
                    : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Users className="w-4.5 h-4.5 text-indigo-600 flex-shrink-0" />
                  <span className="truncate">Phòng chat chung tòa nhà</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Direct Messages Section */}
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nhắn tin phòng khác (DMs)</span>
              {members.length <= 1 ? (
                <div className="text-xs text-slate-400 p-3 italic bg-slate-50 rounded-xl text-center">Chưa có thành viên khác</div>
              ) : (
                <div className="space-y-1.5">
                  {members
                    .filter((m) => m.user_id !== currentUser?.id)
                    .map((m) => (
                      <button
                        key={m.user_id}
                        onClick={() => {
                          setChatTarget(m.user_id);
                          setSelectedMember(m);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between border ${
                          chatTarget === m.user_id
                            ? 'bg-blue-50 border-blue-100 text-blue-700 font-bold shadow-sm'
                            : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            m.role === 'OWNER' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {m.role === 'OWNER' ? (
                              <Building2 className="w-3.5 h-3.5" />
                            ) : (
                              <User className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="truncate text-left">
                            <div className="font-semibold text-slate-800 truncate leading-tight">
                              {m.role === 'OWNER' ? 'Chủ nhà' : m.room_number}
                            </div>
                          </div>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold uppercase">
                          {m.role === 'OWNER' ? 'Chủ nhà' : 'Thuê'}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Chat Workspace Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {selectedBuildingId ? (
            <>
              {/* Chat Window Header */}
              <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    {chatTarget === 'group' ? (
                      <>🏢 Kênh chung: {selectedBuilding?.name}</>
                    ) : (
                      <>💬 Nhắn riêng: {selectedMember?.role === 'OWNER' ? 'Chủ nhà' : selectedMember?.room_number}</>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">{selectedBuilding?.address}</p>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* View building members list drawer toggle */}
                  <button 
                    onClick={() => setShowMembersDrawer(true)} 
                    className="p-2 border border-slate-100 hover:bg-slate-50 rounded-xl transition-all text-slate-500 flex items-center gap-1.5"
                    title="Xem thành viên"
                  >
                    <Users className="w-4.5 h-4.5 text-indigo-600" />
                    <span className="text-xs font-semibold hidden sm:inline">Xem thành viên ({members.length})</span>
                  </button>

                  <div className="flex items-center gap-1.5 pl-3 border-l border-slate-100">
                    <span className={`w-2 h-2 rounded-full ${connecting ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`} />
                    <span className="text-xs text-slate-500 font-medium hidden lg:inline">
                      {connecting ? 'Đang kết nối...' : 'Trực tiếp'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message List area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare className="w-12 h-12 mb-2 opacity-25" />
                    <p className="text-sm">Chưa có tin nhắn nào.</p>
                    <p className="text-xs mt-1">Hãy gửi tin nhắn đầu tiên để bắt đầu cuộc trò chuyện!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    const role = msg.sender_role;
                    return (
                      <div key={msg.id} className={`flex items-start gap-3 group relative ${isMe ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar tag */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                          isMe 
                            ? 'bg-blue-600 text-white' 
                            : role === 'OWNER' || role === 'SUPERADMIN'
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {role === 'OWNER' || role === 'SUPERADMIN' ? (
                            <Building2 className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>

                        {/* Message Bubble Container */}
                        <div className={`max-w-[70%] space-y-1 ${isMe ? 'text-right' : 'text-left'}`}>
                          {/* Role info (No names for privacy) */}
                          {!isMe && (
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                role === 'OWNER' || role === 'SUPERADMIN'
                                  ? 'bg-red-50 text-red-600 border border-red-100'
                                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              }`}>
                                {getRoleLabel(role)}
                              </span>
                            </div>
                          )}

                          {/* Bubble and Context Actions wrapper */}
                          <div className={`relative group flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              msg.is_recalled
                                ? 'bg-slate-200 text-slate-400 italic border border-slate-300/40 rounded-2xl'
                                : isMe 
                                  ? 'bg-blue-600 text-white rounded-tr-none' 
                                  : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-sm'
                            }`}>
                              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            </div>

                            {/* Message actions on hover */}
                            {!msg.is_recalled && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm flex-shrink-0 z-10">
                                {/* Forward action */}
                                <button 
                                  onClick={() => setForwardMessage(msg)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                  title="Chuyển tiếp tin nhắn"
                                >
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                
                                {/* Recall action (Only sender) */}
                                {isMe && (
                                  <button 
                                    onClick={() => handleRecallMessage(msg.id)}
                                    className="p-1 hover:bg-red-50 rounded text-red-500"
                                    title="Thu hồi tin nhắn"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Time */}
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 justify-end flex-row">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3 flex-shrink-0">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={chatTarget === 'group' ? 'Nhập nội dung gửi đến kênh chung tòa nhà...' : 'Nhập tin nhắn riêng gửi thành viên...'}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all shadow-md shadow-blue-600/10 active:scale-95 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6">
              <MessageSquare className="w-16 h-16 mb-3 opacity-25" />
              <h3 className="font-bold text-slate-700">Chưa chọn phòng trò chuyện</h3>
              <p className="text-sm mt-1 text-center max-w-sm">Vui lòng chọn tòa nhà ở cột bên trái để bắt đầu cuộc trò chuyện thời gian thực.</p>
            </div>
          )}
        </div>

        {/* Right Members Drawer Sidepanel */}
        {showMembersDrawer && (
          <div className="fixed inset-0 bg-black/40 z-50 flex justify-end md:static md:bg-transparent md:z-0">
            {/* Modal backdrop click */}
            <div className="absolute inset-0 md:hidden" onClick={() => setShowMembersDrawer(false)} />
            
            <div className="relative w-80 bg-white border-l border-slate-100 h-full flex flex-col p-5 shadow-2xl md:shadow-none z-10">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-indigo-600" />
                  Thành viên tòa nhà ({members.length})
                </h4>
                <button onClick={() => setShowMembersDrawer(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {members.map((m) => {
                  const isCurrent = m.user_id === currentUser?.id;
                  return (
                    <div 
                      key={m.user_id} 
                      className={`flex items-center justify-between p-2.5 rounded-xl border border-slate-100 ${isCurrent ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          m.role === 'OWNER' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {m.role === 'OWNER' ? (
                            <Building2 className="w-3.5 h-3.5" />
                          ) : (
                            <User className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="truncate text-left">
                          <div className="font-semibold text-slate-800 text-xs truncate leading-tight">
                            {m.role === 'OWNER' ? 'Chủ nhà' : m.room_number} {isCurrent && '(Bạn)'}
                          </div>
                        </div>
                      </div>
                      
                      {!isCurrent && (
                        <button
                          onClick={() => {
                            setChatTarget(m.user_id);
                            setSelectedMember(m);
                            setShowMembersDrawer(false);
                            toast.success(`Đã mở cuộc trò chuyện riêng với ${m.role === 'OWNER' ? 'Chủ nhà' : m.room_number}`);
                          }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-indigo-100 transition-all flex-shrink-0"
                        >
                          Chat riêng
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Forward message Modal */}
      {forwardMessage && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4" onClick={() => setForwardMessage(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">Chuyển tiếp tin nhắn</h3>
              <button onClick={() => setForwardMessage(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Nội dung tin nhắn:</span>
                <p className="text-sm text-slate-700 italic">"{forwardMessage.message}"</p>
              </div>

              {/* Destination Building */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Chọn tòa nhà đích</label>
                <select
                  value={forwardBuildingId}
                  onChange={(e) => setForwardBuildingId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      🏢 {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Recipient */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Chọn người nhận</label>
                <select
                  value={forwardRecipientId}
                  onChange={(e) => setForwardRecipientId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
                >
                  <option value="group">📢 Kênh chung tòa nhà</option>
                  {forwardMembers
                    .filter((m) => m.user_id !== currentUser?.id)
                    .map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        👤 {m.role === 'OWNER' ? 'Chủ nhà' : m.room_number}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button onClick={() => setForwardMessage(null)} className="btn-secondary">Hủy</button>
              <button 
                onClick={handleForwardMessage}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/10 transition-transform active:scale-95"
              >
                Gửi chuyển tiếp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
