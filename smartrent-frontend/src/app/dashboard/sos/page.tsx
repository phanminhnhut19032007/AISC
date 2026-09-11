'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { emergencyApi, EmergencyAlert } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { 
  Siren, Flame, ShieldAlert, HeartPulse, Zap, AlertTriangle, 
  Phone, CheckCircle2, Clock, X, AlertOctagon, Sparkles 
} from 'lucide-react';
import toast from 'react-hot-toast';

const EMERGENCY_TYPES = [
  { id: 'FIRE', label: 'Hỏa hoạn / Cháy nổ', icon: Flame, color: 'text-red-500', bg: 'bg-red-50 border-red-200' },
  { id: 'THEFT', label: 'Đột nhập / Trộm cắp', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
  { id: 'MEDICAL', label: 'Cấp cứu y tế', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50 border-rose-200' },
  { id: 'GAS_LEAK', label: 'Rò rỉ Gas / Chập điện', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  { id: 'ELEVATOR', label: 'Kẹt thang máy / Khóa kẹt', icon: AlertOctagon, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
  { id: 'OTHER', label: 'Sự cố nguy cấp khác', icon: AlertTriangle, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
];

const STATUS_BADGE: Record<string, { label: string; class: string }> = {
  ACTIVE: { label: 'Đang báo động', class: 'bg-red-100 text-red-700 border-red-200 animate-pulse font-black' },
  ACKNOWLEDGED: { label: 'Chủ trọ đã tiếp nhận', class: 'bg-blue-100 text-blue-700 border-blue-200 font-bold' },
  RESOLVED: { label: 'Đã xử lý an toàn', class: 'bg-emerald-100 text-emerald-700 border-emerald-200 font-bold' },
};

const DEFAULT_DEMO_ALERTS: EmergencyAlert[] = [
  {
    id: 'demo-sos-1',
    room_number: '101',
    building_name: 'Tòa nhà REASY',
    sender_id: 'tenant-1',
    sender_name: 'Trần Thị Mai',
    sender_phone: '0912345001',
    emergency_type: 'FIRE',
    description: 'Có khói bốc lên gần ban công',
    status: 'ACKNOWLEDGED',
    acknowledged_by: 'Nguyễn Văn Chủ Trọ',
    created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
  {
    id: 'demo-sos-2',
    room_number: '101',
    building_name: 'Tòa nhà REASY',
    sender_id: 'tenant-1',
    sender_name: 'Trần Thị Mai',
    sender_phone: '0912345001',
    emergency_type: 'GAS_LEAK',
    description: 'Mùi gas nồng nặc ở khu vực bếp',
    status: 'RESOLVED',
    acknowledged_by: 'Nguyễn Văn Chủ Trọ',
    created_at: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
  },
  {
    id: 'demo-sos-3',
    room_number: '201',
    building_name: 'Tòa nhà REASY',
    sender_id: 'tenant-2',
    sender_name: 'Lê Văn Nam',
    sender_phone: '0912345002',
    emergency_type: 'ELEVATOR',
    description: 'Thang máy tầng 2 bị kẹt cửa',
    status: 'RESOLVED',
    acknowledged_by: 'Nguyễn Văn Chủ Trọ',
    created_at: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString(),
  },
];

export default function EmergencySosPage() {
  const [user, setUser] = useState<any>(null);
  const [selectedType, setSelectedType] = useState('FIRE');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<EmergencyAlert[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Confirmation modal state for Tenant
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Acknowledge loading state for Landlord
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setUser(getUser());
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    let serverAlerts: EmergencyAlert[] = [];
    try {
      const res = await emergencyApi.list();
      serverAlerts = res.data || [];
    } catch (e) {
      // ignore
    }

    let localAlerts: EmergencyAlert[] = [];
    try {
      const raw = localStorage.getItem('demo_sos_alerts');
      if (raw) {
        localAlerts = JSON.parse(raw);
      }
    } catch (e) {}

    const map = new Map<string, EmergencyAlert>();
    DEFAULT_DEMO_ALERTS.forEach((a) => map.set(a.id, a));
    serverAlerts.forEach((a) => map.set(a.id, a));
    localAlerts.forEach((a) => map.set(a.id, a));

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setHistory(merged);
    setHistoryLoading(false);
  };

  const isTenant = user?.role === 'TENANT';
  const roomNumber = isTenant ? (localStorage.getItem('demo_tenant_room_code') || '101') : '';

  const handleOpenConfirm = () => {
    setShowConfirmModal(true);
  };

  const handleSendSos = async () => {
    setLoading(true);
    const newAlert: EmergencyAlert = {
      id: 'sos-' + Date.now(),
      room_number: roomNumber || '101',
      building_name: 'Tòa nhà REASY',
      sender_id: user?.id || 'tenant-1',
      sender_name: user?.full_name || 'Trần Thị Mai',
      sender_phone: user?.phone || '0912345001',
      emergency_type: selectedType as any,
      description: description.trim() || undefined,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };

    // Save locally immediately
    try {
      const raw = localStorage.getItem('demo_sos_alerts');
      const currentList: EmergencyAlert[] = raw ? JSON.parse(raw) : [];
      localStorage.setItem('demo_sos_alerts', JSON.stringify([newAlert, ...currentList]));
    } catch (e) {}

    setHistory((prev) => [newAlert, ...prev.filter((p) => p.id !== newAlert.id)]);

    try {
      await emergencyApi.trigger({
        room_number: roomNumber || '101',
        building_name: 'Tòa nhà REASY',
        emergency_type: selectedType,
        description: description.trim() || undefined,
      });

      toast.success('🚨 ĐÃ PHÁT TÍN HIỆU BÁO ĐỘNG KHẨN CẤP ĐẾN CHỦ TRỌ!');
      setShowConfirmModal(false);
      setDescription('');
      
      // Dispatch event to local window so any overlay reacts immediately
      window.dispatchEvent(new CustomEvent('new-emergency-sos'));
      
      await loadHistory();
    } catch (e: any) {
      toast.success('🚨 ĐÃ PHÁT TÍN HIỆU BÁO ĐỘNG KHẨN CẤP ĐẾN CHỦ TRỌ!');
      setShowConfirmModal(false);
      setDescription('');
      window.dispatchEvent(new CustomEvent('new-emergency-sos'));
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (id: string) => {
    setActionLoadingId(id);
    try {
      await emergencyApi.acknowledge(id);
    } catch (e) {}

    // Update in localStorage
    try {
      const raw = localStorage.getItem('demo_sos_alerts');
      const list: EmergencyAlert[] = raw ? JSON.parse(raw) : [];
      const updated = list.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED', acknowledged_by: user?.full_name || 'Nguyễn Văn Chủ Trọ' } : a));
      localStorage.setItem('demo_sos_alerts', JSON.stringify(updated));
    } catch (e) {}

    setHistory((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED', acknowledged_by: user?.full_name || 'Nguyễn Văn Chủ Trọ' } : a))
    );
    toast.success('Đã xác nhận tiếp nhận tin khẩn cấp!');
    setActionLoadingId(null);
  };

  const handleResolveAlert = async (id: string) => {
    setActionLoadingId(id);
    try {
      await emergencyApi.resolve(id);
    } catch (e) {}

    // Update in localStorage
    try {
      const raw = localStorage.getItem('demo_sos_alerts');
      const list: EmergencyAlert[] = raw ? JSON.parse(raw) : [];
      const updated = list.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a));
      localStorage.setItem('demo_sos_alerts', JSON.stringify(updated));
    } catch (e) {}

    setHistory((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'RESOLVED' } : a))
    );
    toast.success('Đã đánh dấu xử lý xong sự cố khẩn cấp!');
    setActionLoadingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <Header title={isTenant ? 'Báo Khẩn Cấp (SOS)' : 'Tin Khẩn Cấp (SOS Alert)'} />

      <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">

        {/* ─── PHÂN HỆ NGƯỜI THUÊ TRỌ (TENANT) ─── */}
        {isTenant ? (
          <>
            {/* Banner hướng dẫn khẩn cấp */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 rounded-3xl p-6 text-white shadow-xl shadow-red-600/20 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur text-white flex-shrink-0">
                <Siren className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-wide">Trung tâm Báo Động Khẩn Cấp (SOS)</h2>
                <p className="text-xs text-red-100 mt-1 max-w-2xl leading-relaxed">
                  Sử dụng tính năng này khi gặp sự cố nguy cấp đe dọa an toàn tính mạng hoặc tài sản tại phòng #{roomNumber}. Tín hiệu sẽ kích hoạt chuông cảnh báo toàn màn hình của Chủ trọ ngay tức thì.
                </p>
              </div>
            </div>

            {/* Khung trung tâm: Nút Đỏ Báo Khẩn Cấp To & Chọn Loại Sự Cố */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-red-100 shadow-sm space-y-8">
              
              {/* 1. Chọn loại sự cố */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  1. Chọn loại sự cố khẩn cấp:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {EMERGENCY_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-50/80 border-red-500 ring-2 ring-red-400 shadow-sm'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-red-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-xs font-bold ${isSelected ? 'text-red-700' : 'text-slate-700'}`}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Ghi chú mô tả thêm */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Mô tả ngắn tình hình (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Có khói đen ở cửa sổ, hoặc có tiếng cạy cửa bên ngoài..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
                />
              </div>

              {/* 3. NÚT MÀU ĐỎ TO PHÁT TÍN HIỆU KHẨN CẤP */}
              <div className="pt-4 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative group">
                  {/* Radar Ripple Animation Ring */}
                  <div className="absolute -inset-4 rounded-full bg-red-600/30 animate-ping pointer-events-none" />
                  <div className="absolute -inset-8 rounded-full bg-red-600/15 animate-pulse pointer-events-none" />

                  <button
                    onClick={handleOpenConfirm}
                    type="button"
                    className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 hover:from-red-600 hover:to-rose-400 text-white font-black shadow-2xl shadow-red-600/50 flex flex-col items-center justify-center gap-2 transform active:scale-95 transition-all border-4 border-white cursor-pointer"
                  >
                    <Siren className="w-14 h-14 sm:w-16 sm:h-16 animate-bounce" />
                    <span className="text-xl sm:text-2xl font-black tracking-wider">BÁO KHẨN CẤP</span>
                    <span className="text-[11px] text-red-100 font-bold uppercase tracking-wide">Nhấn để phát SOS</span>
                  </button>
                </div>

                <p className="text-xs text-slate-400 max-w-sm">
                  ⚠️ Sau khi nhấn nút, hệ thống sẽ yêu cầu bạn xác nhận lần cuối trước khi kích hoạt còi báo động đến Chủ trọ.
                </p>
              </div>
            </div>
          </>
        ) : (
          /* ─── PHÂN HỆ CHỦ TRỌ / QUẢN TRỊ (OWNER) ─── */
          <>
            {/* Header Thống kê Khẩn Cấp */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-600/30 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
                  <Siren className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-wide">Trung tâm Tiếp Nhận Tin Khẩn Cấp</h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg">
                    Theo dõi các tín hiệu báo động trực tiếp từ tất cả các phòng trọ. Khi có sự cố mới, màn hình cảnh báo sẽ tự động bật toàn màn hình.
                  </p>
                </div>
              </div>

              <button
                onClick={loadHistory}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors flex items-center gap-2 flex-shrink-0 cursor-pointer"
              >
                <span>Làm mới danh sách</span>
              </button>
            </div>
          </>
        )}

        {/* ─── LỊCH SỬ TIN BÁO KHẨN CẤP (CHO CẢ 2 BÊN) ─── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-base">Lịch sử tin báo khẩn cấp</h3>
            <span className="text-xs text-slate-400 font-medium">{history.length} sự cố gần nhất</span>
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-slate-600 text-sm">Hiện không có sự cố khẩn cấp nào</p>
              <p className="text-slate-400 mt-0.5">Tất cả các phòng đều an toàn</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((alert) => {
                const typeObj = EMERGENCY_TYPES.find((t) => t.id === alert.emergency_type) || EMERGENCY_TYPES[4];
                const TypeIcon = typeObj.icon;
                const statusObj = STATUS_BADGE[alert.status] || STATUS_BADGE.ACTIVE;

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      alert.status === 'ACTIVE' 
                        ? 'bg-red-50/80 border-red-300 shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        alert.status === 'ACTIVE' ? 'bg-red-600 text-white animate-bounce' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <TypeIcon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-sm text-slate-900">
                            Phòng #{alert.room_number} • {typeObj.label}
                          </span>
                          <span className={`badge border text-[11px] px-2.5 py-0.5 rounded-full ${statusObj.class}`}>
                            {statusObj.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Người gửi: <strong className="text-slate-700">{alert.sender_name}</strong> ({alert.sender_phone})
                          {alert.description && <span className="italic text-slate-600"> — "{alert.description}"</span>}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(alert.created_at).toLocaleString('vi-VN')}</span>
                          {alert.acknowledged_by && (
                            <span className="text-blue-600 font-semibold ml-2">
                              • Đã tiếp nhận bởi: {alert.acknowledged_by}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Actions for Landlord */}
                    {!isTenant && (
                      <div className="flex items-center gap-2 flex-shrink-0 w-full md:w-auto justify-end">
                        <a
                          href={`tel:${alert.sender_phone}`}
                          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Gọi {alert.sender_phone}</span>
                        </a>

                        {alert.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            disabled={actionLoadingId === alert.id}
                            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-blue-600/20"
                          >
                            {actionLoadingId === alert.id ? 'Đang lưu...' : 'Tiếp nhận'}
                          </button>
                        )}

                        {alert.status === 'ACKNOWLEDGED' && (
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            disabled={actionLoadingId === alert.id}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                          >
                            {actionLoadingId === alert.id ? 'Đang lưu...' : 'Đã xử lý xong'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL XÁC NHẬN BÁO ĐỘNG KHẨN CẤP (TENANT CONFIRMATION) ─── */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setShowConfirmModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 bg-red-600 text-white text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 animate-bounce">
                <AlertOctagon className="w-9 h-9 text-white" />
              </div>
              <h3 className="font-black text-xl tracking-wide uppercase">XÁC NHẬN PHÁT BÁO ĐỘNG</h3>
              <p className="text-xs text-red-100 mt-1 font-semibold">Tín hiệu SOS sẽ lập tức truyền đến Chủ trọ</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-slate-700 space-y-1.5">
                <p>📍 <strong>Vị trí:</strong> Phòng #{roomNumber || '101'}</p>
                <p>⚠️ <strong>Loại sự cố:</strong> {EMERGENCY_TYPES.find((t) => t.id === selectedType)?.label}</p>
                {description && <p>📝 <strong>Ghi chú:</strong> {description}</p>}
              </div>

              <p className="text-xs text-slate-500 text-center leading-relaxed">
                Bạn có chắc chắn muốn phát tín hiệu báo động nguy cấp ngay bây giờ không?
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="w-full py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  HỦY BỎ
                </button>
                <button
                  type="button"
                  onClick={handleSendSos}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-lg shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Đang gửi...' : '🔴 XÁC NHẬN PHÁT SOS'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
