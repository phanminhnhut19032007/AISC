'use client';
import { useEffect, useState } from 'react';
import { emergencyApi, EmergencyAlert } from '@/lib/api';
import { getUser } from '@/lib/auth';
import { Siren, Phone, AlertTriangle, Flame, ShieldAlert, HeartPulse, Zap, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  FIRE: { label: 'HỎA HOẠN / CHÁY NỔ', icon: Flame, color: 'text-red-500', bg: 'bg-red-500/10' },
  THEFT: { label: 'ĐỘT NHẬP / TRỘM CẮP', icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  MEDICAL: { label: 'CẤP CỨU Y TẾ', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  GAS_LEAK: { label: 'RÒ RỈ GAS / CHẬP ĐIỆN', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ELEVATOR: { label: 'KẸT THANG MÁY / CỬA KHÓA', icon: AlertTriangle, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  OTHER: { label: 'SỰ CỐ KHẨN CẤP', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
};

export default function EmergencyAlertOverlay() {
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [user, setUser] = useState<any>(null);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const fetchActive = async () => {
    const currentUser = getUser();
    // Only landlords & admins receive fullscreen emergency alerts
    if (!currentUser || currentUser.role === 'TENANT') return;

    try {
      const res = await emergencyApi.getActive();
      setActiveAlerts(res.data || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchActive();

    // Check for active emergencies every 4 seconds
    const interval = setInterval(fetchActive, 4000);

    // Also listen to local event bus if triggered in same window
    const handleLocalSos = () => fetchActive();
    window.addEventListener('new-emergency-sos', handleLocalSos);

    return () => {
      clearInterval(interval);
      window.removeEventListener('new-emergency-sos', handleLocalSos);
    };
  }, []);

  if (!user || user.role === 'TENANT' || activeAlerts.length === 0) {
    return null;
  }

  const currentAlert = activeAlerts[0];
  const typeInfo = TYPE_CONFIG[currentAlert.emergency_type] || TYPE_CONFIG.OTHER;
  const TypeIcon = typeInfo.icon;

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await emergencyApi.acknowledge(currentAlert.id);
      toast.success('Đã xác nhận tiếp nhận tin khẩn cấp!');
      // Remove acknowledged alert from local state
      setActiveAlerts((prev) => prev.filter((a) => a.id !== currentAlert.id));
    } catch (e: any) {
      toast.error('Lỗi khi xác nhận tin khẩn cấp');
    } finally {
      setAcknowledging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-red-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Flashing Warning Glow Background */}
      <div className="absolute inset-0 bg-red-600/20 animate-pulse pointer-events-none" />

      <div className="relative bg-slate-900 border-2 border-red-500 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden text-white flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Siren Header Bar */}
        <div className="bg-red-600 px-6 py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-red-600 flex items-center justify-center animate-bounce shadow-md">
              <Siren className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wider uppercase">BÁO ĐỘNG KHẨN CẤP (SOS)!</h2>
              <p className="text-xs text-red-100 font-semibold">Tín hiệu cảnh báo nguy cấp từ Cư dân</p>
            </div>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-white/20 text-white animate-pulse">
            LIVE SOS
          </span>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {/* Room Banner */}
          <div className="bg-red-950/60 border border-red-500/40 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-red-400 uppercase tracking-wide">Vị trí phát tín hiệu</span>
              <h3 className="text-2xl font-black text-white mt-0.5">
                Phòng #{currentAlert.room_number}
              </h3>
              <p className="text-xs text-slate-300">{currentAlert.building_name}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 font-medium">Thời gian phát</span>
              <p className="text-sm font-bold text-red-300 font-mono">
                {new Date(currentAlert.created_at).toLocaleTimeString('vi-VN')}
              </p>
            </div>
          </div>

          {/* Emergency Details */}
          <div className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/10">
            {/* Type */}
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${typeInfo.bg} ${typeInfo.color} flex items-center justify-center flex-shrink-0`}>
                <TypeIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Phân loại sự cố</span>
                <p className={`text-sm font-black ${typeInfo.color}`}>{typeInfo.label}</p>
              </div>
            </div>

            {/* Tenant info */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Người gửi báo động</span>
                <p className="text-sm font-bold text-white">{currentAlert.sender_name}</p>
              </div>
              <a
                href={`tel:${currentAlert.sender_phone}`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
              >
                <Phone className="w-3.5 h-3.5 animate-bounce" />
                <span>Gọi ngay: {currentAlert.sender_phone}</span>
              </a>
            </div>

            {/* Description note if any */}
            {currentAlert.description && (
              <div className="pt-2 border-t border-white/5">
                <span className="text-[11px] text-slate-400 font-medium">Ghi chú từ cư dân:</span>
                <p className="text-xs text-slate-200 mt-0.5 bg-black/30 p-2.5 rounded-lg italic">
                  "{currentAlert.description}"
                </p>
              </div>
            )}
          </div>

          {/* Instruction */}
          <p className="text-xs text-center text-red-300 font-medium leading-relaxed">
            ⚠️ Vui lòng liên hệ người thuê hoặc cơ quan chức năng ngay lập tức. Sau khi tiếp nhận, hãy nhấn nút xác nhận bên dưới để đóng cửa sổ báo động.
          </p>

          {/* Big Action Button to Acknowledge and Dismiss */}
          <button
            onClick={handleAcknowledge}
            disabled={acknowledging}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm py-4 px-6 rounded-2xl shadow-xl shadow-red-600/40 flex items-center justify-center gap-2.5 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>
              {acknowledging ? 'Đang xử lý...' : 'XÁC NHẬN ĐÃ TIẾP NHẬN (ĐÓNG BÁO ĐỘNG)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
