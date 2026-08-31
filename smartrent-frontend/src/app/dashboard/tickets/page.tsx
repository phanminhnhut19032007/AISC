'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { ticketsApi, Ticket, buildingsApi, Room, Building } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { Wrench, AlertCircle, Clock, CheckCircle2, XCircle, RefreshCw, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: 'Mới', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertCircle },
  ASSIGNED: { label: 'Đã phân công', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
  IN_PROGRESS: { label: 'Đang xử lý', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Clock },
  CLOSED: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  CANCELLED: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle },
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200',
  MEDIUM: 'text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200',
  HIGH: 'text-orange-500 bg-orange-50 px-2 py-0.5 rounded border border-orange-200',
  URGENT: 'text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-bold',
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

export default function TicketsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // States for reporting a new issue (Tenant)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    room_id: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
  });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, bRes] = await Promise.all([ticketsApi.list(), buildingsApi.list()]);
      setTickets(tRes.data || []);
      setBuildings(bRes.data || []);
      const roomsAll: Room[] = [];
      for (const b of bRes.data) {
        const r = await buildingsApi.rooms(b.id);
        roomsAll.push(...r.data);
      }
      setRooms(roomsAll);

      // Pre-select first room for tenant convenience
      if (roomsAll.length > 0) {
        setCreateForm((prev) => ({ ...prev, room_id: roomsAll[0].id }));
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentUser(getUser());
    load();
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    let confirmMsg = 'Bạn có chắc chắn muốn chuyển trạng thái phiếu bảo trì này?';
    if (status === 'ASSIGNED') {
      confirmMsg = 'Bạn có chắc chắn muốn PHÂN CÔNG xử lý phiếu bảo trì này?';
    } else if (status === 'IN_PROGRESS') {
      confirmMsg = 'Bạn có chắc chắn muốn BẮT ĐẦU xử lý phiếu bảo trì này?';
    } else if (status === 'CLOSED') {
      confirmMsg = 'Bạn có chắc chắn muốn xác nhận HOÀN THÀNH phiếu bảo trì này?';
    }

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      await ticketsApi.updateStatus(id, status);
      toast.success('Cập nhật trạng thái thành công!');
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.room_id) return toast.error('Vui lòng chọn phòng phát sinh sự cố');
    if (!createForm.title.trim()) return toast.error('Vui lòng nhập tiêu đề sự cố');

    setSubmitting(true);
    try {
      await ticketsApi.create(createForm);
      toast.success('Gửi báo cáo sự cố thành công!');
      setShowCreateModal(false);
      setCreateForm({
        room_id: rooms.length > 0 ? rooms[0].id : '',
        title: '',
        description: '',
        priority: 'MEDIUM',
      });
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Gửi báo cáo sự cố thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = filter === 'ALL' ? tickets : tickets.filter((t) => t.status === filter);
  const getRoomNumber = (roomId: string) => rooms.find((r) => r.id === roomId)?.room_number || '?';
  const getBuildingName = (roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return '';
    const bld = buildings.find(b => b.id === room.building_id);
    return bld ? bld.name : '';
  };

  const stats = {
    open: tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t) => ['ASSIGNED', 'IN_PROGRESS'].includes(t.status)).length,
    closed: tickets.filter((t) => t.status === 'CLOSED').length,
  };

  const isTenant = currentUser?.role === 'TENANT';

  return (
    <div>
      <Header title={isTenant ? 'Báo cáo Sự cố' : 'Quản lý Bảo trì & Sửa chữa'} />
      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: isTenant ? 'Sự cố mới gửi' : 'Phiếu mới', value: stats.open, color: 'border-yellow-250 bg-yellow-50/50', textColor: 'text-yellow-700' },
            { label: 'Đang xử lý', value: stats.inProgress, color: 'border-blue-250 bg-blue-50/50', textColor: 'text-blue-700' },
            { label: 'Đã giải quyết', value: stats.closed, color: 'border-green-250 bg-green-50/50', textColor: 'text-green-700' },
          ].map(({ label, value, color, textColor }) => (
            <div key={label} className={`rounded-2xl p-5 border bg-white shadow-sm flex items-center justify-between ${color}`}>
              <div>
                <div className="text-xs text-slate-500 font-medium">{label}</div>
                <div className={`text-3xl font-extrabold mt-1.5 ${textColor}`}>{value}</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                <Wrench className={`w-5 h-5 ${textColor}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Filter + Action Buttons */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-2">
            {['ALL', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'CLOSED'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  filter === s 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {s === 'ALL' ? 'Tất cả' : STATUS_CONFIG[s]?.label || s}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="btn-secondary flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Tải lại
            </button>
            {isTenant && (
              <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2 shadow-md shadow-blue-600/10">
                <Plus className="w-4 h-4" /> Báo sự cố mới
              </button>
            )}
          </div>
        </div>

        {/* Ticket Cards List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-2xl border border-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
            <p className="font-medium">Không có phiếu báo cáo sự cố nào</p>
            {isTenant && <p className="text-xs mt-1">Ấn "Báo sự cố mới" để gửi thông tin cho chủ nhà.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((t) => {
              const cfg = STATUS_CONFIG[t.status] || { label: t.status, color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Wrench };
              const StatusIcon = cfg.icon;
              return (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-blue-100 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-800 text-base leading-snug">{t.title}</h3>
                        <span className={`badge border text-[10px] font-bold ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1 inline-block align-middle" />
                          {cfg.label}
                        </span>
                        <span className={`text-[10px] font-extrabold ${PRIORITY_COLOR[t.priority] || 'text-slate-500'}`}>
                          Độ ưu tiên: {PRIORITY_LABEL[t.priority] || t.priority}
                        </span>
                      </div>
                      {t.description && <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{t.description}</p>}
                      <div className="flex items-center gap-4 mt-3 pt-2 border-t border-slate-50">
                        <span className="text-xs text-slate-400 font-medium">
                          Phòng #{getRoomNumber(t.room_id)}{getBuildingName(t.room_id) ? ` - Tòa ${getBuildingName(t.room_id)}` : ''}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">ID: #{t.id.slice(0, 8)}</span>
                      </div>
                    </div>
                    
                    {/* Admin/Owner Status Action buttons */}
                    {!isTenant && (
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {t.status === 'OPEN' && (
                          <button onClick={() => handleStatusUpdate(t.id, 'ASSIGNED')} className="text-xs px-3.5 py-2 font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-all">Phân công</button>
                        )}
                        {t.status === 'ASSIGNED' && (
                          <button onClick={() => handleStatusUpdate(t.id, 'IN_PROGRESS')} className="text-xs px-3.5 py-2 font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm transition-all">Bắt đầu xử lý</button>
                        )}
                        {t.status === 'IN_PROGRESS' && (
                          <button onClick={() => handleStatusUpdate(t.id, 'CLOSED')} className="text-xs px-3.5 py-2 font-extrabold bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm transition-all">Giải quyết xong</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tenant: Create Issue Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-base">Báo cáo sự cố phòng trọ</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="p-6 space-y-4">
                {/* Room selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phòng phát sinh sự cố *</label>
                  <select
                    value={createForm.room_id}
                    onChange={(e) => setCreateForm({ ...createForm, room_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
                    required
                  >
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Phòng {r.room_number}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tiêu đề sự cố *</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                    placeholder="Ví dụ: Hỏng vòi nước, Mất điện phòng..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mô tả chi tiết</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Mô tả cụ thể sự cố để chủ nhà nắm bắt và chuẩn bị dụng cụ xử lý..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 h-24 resize-none"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mức độ ưu tiên *</label>
                  <select
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
                    required
                  >
                    <option value="LOW">Thấp</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HIGH">Cao</option>
                    <option value="URGENT">Khẩn cấp</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Hủy bỏ</button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/10 transition-transform active:scale-95"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
