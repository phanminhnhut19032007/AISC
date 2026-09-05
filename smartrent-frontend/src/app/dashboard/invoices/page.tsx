'use client';
import React, { useEffect, useState, useRef } from 'react';
import Header from '@/components/layout/Header';
import { invoicesApi, buildingsApi, meterReadingsApi, Invoice, Room, Building } from '@/lib/api';
import { Plus, QrCode, CheckCircle, RefreshCw, X, Zap, Droplets, Camera, Clock, DollarSign, Home as HomeIcon, ShieldCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUser } from '@/lib/auth';

const STATUS_BADGE: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  SENT: 'bg-blue-100 text-blue-700 border-blue-200',
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
};
const STATUS_VN: Record<string, string> = {
  PAID: 'Đã thanh toán', SENT: 'Chờ thanh toán', DRAFT: 'Bản nháp', OVERDUE: 'Quá hạn'
};

// Hàm định dạng lỗi validation từ backend
const getErrorMessage = (err: any): string => {
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d: any) => {
      const field = d.loc ? d.loc.join('.') : 'Trường dữ liệu';
      return `${field}: ${d.msg || 'Không hợp lệ'}`;
    }).join(', ');
  }
  if (detail && typeof detail === 'object') {
    return JSON.stringify(detail);
  }
  return err.message || 'Đã xảy ra lỗi hệ thống';
};

export default function InvoicesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [showDeleted, setShowDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGenModal, setShowGenModal] = useState(false);
  const [qrInvoice, setQrInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    setCurrentUser(getUser());
  }, []);
  
  // State form tạo hóa đơn (Admin)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  
  const [genForm, setGenForm] = useState({
    room_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [generating, setGenerating] = useState(false);

  // States chốt số điện nước
  const [elecOld, setElecOld] = useState(0);
  const [elecNew, setElecNew] = useState<number | ''>(0);
  const [waterOld, setWaterOld] = useState(0);
  const [waterNew, setWaterNew] = useState<number | ''>(0);

  // States lưu ảnh minh chứng
  const [elecProofPreview, setElecProofPreview] = useState<string | null>(null);
  const [waterProofPreview, setWaterProofPreview] = useState<string | null>(null);

  const fileRefElec = useRef<HTMLInputElement>(null);
  const fileRefWater = useRef<HTMLInputElement>(null);

  // Đồng bộ tháng/năm khi người dùng thay đổi ngày
  useEffect(() => {
    if (selectedDate) {
      const dateObj = new Date(selectedDate);
      if (!isNaN(dateObj.getTime())) {
        setGenForm(prev => ({
          ...prev,
          month: dateObj.getMonth() + 1,
          year: dateObj.getFullYear()
        }));
      }
    }
  }, [selectedDate]);

  // Tải chỉ số cũ từ hóa đơn gần nhất
  useEffect(() => {
    const fetchPreviousReadings = async () => {
      if (!genForm.room_id) return;
      
      const room = rooms.find(r => r.id === genForm.room_id);
      if (!room) return;

      try {
        const res = await meterReadingsApi.listByRoom(genForm.room_id);
        const readings = res.data || [];

        const latestElec = readings.find(r => r.meter_type === 'ELECTRICITY');
        if (latestElec) {
          setElecOld(latestElec.new_reading);
          setElecNew(latestElec.new_reading);
        } else {
          const defaultVal = room.room_number ? Number(room.room_number) * 10 + 645 : 1645;
          setElecOld(defaultVal);
          setElecNew(defaultVal);
        }

        const latestWater = readings.find(r => r.meter_type === 'WATER');
        if (latestWater) {
          setWaterOld(latestWater.new_reading);
          setWaterNew(latestWater.new_reading);
        } else {
          const defaultVal = room.room_number ? Number(room.room_number) + 24 : 124;
          setWaterOld(defaultVal);
          setWaterNew(defaultVal);
        }
      } catch (err) {
        const defaultElec = room.room_number ? Number(room.room_number) * 10 + 645 : 1645;
        const defaultWater = room.room_number ? Number(room.room_number) + 24 : 124;
        setElecOld(defaultElec);
        setElecNew(defaultElec);
        setWaterOld(defaultWater);
        setWaterNew(defaultWater);
      }

      setElecProofPreview(null);
      setWaterProofPreview(null);
    };

    fetchPreviousReadings();
  }, [genForm.room_id, rooms]);

  const load = async (deleted = false) => {
    setLoading(true);
    try {
      const [invRes, bldRes] = await Promise.all([
        invoicesApi.list({ include_deleted: deleted }), 
        buildingsApi.list()
      ]);
      setInvoices(invRes.data || []);
      setBuildings(bldRes.data || []);

      const roomsAll: Room[] = [];
      for (const b of (bldRes.data || [])) {
        try {
          const r = await buildingsApi.rooms(b.id);
          roomsAll.push(...(r.data || []));
        } catch (e) {
          // ignore room load per-building error
        }
      }
      setRooms(roomsAll);
    } catch (err: any) {
      toast.error('Lỗi khi tải danh sách hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(showDeleted); }, [showDeleted]);

  // Handle upload ảnh minh chứng điện
  const handleElecProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh tối đa là 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setElecProofPreview(event.target?.result as string);
        toast.success('Đã tải ảnh minh chứng số điện');
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle upload ảnh minh chứng nước
  const handleWaterProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh tối đa là 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setWaterProofPreview(event.target?.result as string);
        toast.success('Đã tải ảnh minh chứng số nước');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!genForm.room_id) return toast.error('Vui lòng chọn phòng trọ');
    
    const parsedElecNew = Number(elecNew);
    const parsedWaterNew = Number(waterNew);

    if (isNaN(parsedElecNew) || parsedElecNew < elecOld) {
      return toast.error(`Chỉ số điện mới (${elecNew}) không được nhỏ hơn số cũ (${elecOld})`);
    }

    if (isNaN(parsedWaterNew) || parsedWaterNew < waterOld) {
      return toast.error(`Chỉ số nước mới (${waterNew}) không được nhỏ hơn số cũ (${waterOld})`);
    }

    setGenerating(true);
    try {
      await meterReadingsApi.create({
        room_id: String(genForm.room_id),
        meter_type: 'ELECTRICITY',
        month: Number(genForm.month),
        year: Number(genForm.year),
        new_reading: parsedElecNew,
        is_manual: true,
        ocr_image_url: elecProofPreview ? '/uploads/proof_electricity.jpg' : undefined
      });

      await meterReadingsApi.create({
        room_id: String(genForm.room_id),
        meter_type: 'WATER',
        month: Number(genForm.month),
        year: Number(genForm.year),
        new_reading: parsedWaterNew,
        is_manual: true,
        ocr_image_url: waterProofPreview ? '/uploads/proof_water.jpg' : undefined
      });

      await invoicesApi.generate({
        room_id: String(genForm.room_id),
        month: Number(genForm.month),
        year: Number(genForm.year)
      });
      
      toast.success(`Đã lưu chỉ số & Tạo hóa đơn thành công cho ngày ${new Date(selectedDate).toLocaleDateString('vi-VN')}!`);
      
      setShowGenModal(false);
      await load(showDeleted);
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await invoicesApi.markPaid(id);
      toast.success('Đã cập nhật trạng thái thu tiền mặt!');
      await load(showDeleted);
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn XÓA tạm thời hóa đơn này? Hóa đơn sẽ được đưa vào thùng rác.')) {
      return;
    }
    try {
      await invoicesApi.delete(id);
      toast.success('Đã chuyển hóa đơn vào thùng rác!');
      await load(showDeleted);
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    }
  };

  const handleRestoreInvoice = async (id: string) => {
    try {
      await invoicesApi.restore(id);
      toast.success('Đã phục hồi hóa đơn thành công!');
      await load(showDeleted);
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    }
  };

  const isTenant = currentUser?.role === 'TENANT';
  const filtered = filter === 'ALL' ? invoices : invoices.filter((i) => i.status === filter);
  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' VND';
  
  const getRoomNumber = (roomId: string) => rooms.find((r) => r.id === roomId)?.room_number || roomId.slice(0, 6);
  
  const getBuildingName = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return 'Tòa nhà REASY';
    const building = buildings.find((b) => b.id === room.building_id);
    return building ? building.name : 'Tòa nhà REASY';
  };

  // Tính toán số liệu thống kê cho Tenant
  const unpaidInvoices = invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE');
  const totalUnpaidAmount = unpaidInvoices.reduce((sum, i) => sum + i.total_amount, 0);
  const paidInvoices = invoices.filter(i => i.status === 'PAID');
  const latestUnpaidInvoice = unpaidInvoices[0] || null;

  return (
    <div>
      <Header title={isTenant ? 'Hóa đơn phòng trọ' : 'Quản lý Hóa đơn'} />
      <div className="p-4 sm:p-6 space-y-5 max-w-full">
        
        {/* Phân hệ Cư Dân: Thẻ thống kê tổng quan hóa đơn & Trạng thái thanh toán */}
        {isTenant && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Hóa đơn chờ thanh toán */}
            <div className={`rounded-2xl p-5 border transition-all ${
              totalUnpaidAmount > 0 
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm' 
                : 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cần thanh toán</p>
                  <p className={`text-2xl font-black mt-1 ${totalUnpaidAmount > 0 ? 'text-blue-700' : 'text-emerald-700'}`}>
                    {formatMoney(totalUnpaidAmount)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {unpaidInvoices.length > 0 
                      ? `${unpaidInvoices.length} hóa đơn đang chờ thanh toán` 
                      : '✅ Đã hoàn tất đóng tiền phòng'}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  totalUnpaidAmount > 0 ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-emerald-600 text-white'
                }`}>
                  {totalUnpaidAmount > 0 ? <DollarSign className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                </div>
              </div>

              {latestUnpaidInvoice && (
                <button
                  onClick={() => setQrInvoice(latestUnpaidInvoice)}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Quét VietQR đóng tiền ngay</span>
                </button>
              )}
            </div>

            {/* Card 2: Lịch sử đã thanh toán */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lịch sử đã đóng</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{paidInvoices.length} kỳ</p>
                  <p className="text-xs text-slate-400 mt-1">Hóa đơn các tháng trước đã thanh toán</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Card 3: Thông tin phòng */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phòng đang thuê</p>
                  <p className="text-2xl font-black text-indigo-600 mt-1">
                    #{rooms[0]?.room_number || '101'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    {buildings[0]?.name || 'Tòa nhà REASY'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <HomeIcon className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter bar & Actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap items-center">
            {['ALL', 'SENT', 'PAID', 'OVERDUE'].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setFilter(s);
                  setShowDeleted(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                  !showDeleted && filter === s ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {s === 'ALL' ? 'Tất cả' : STATUS_VN[s] || s}
              </button>
            ))}
            
            {!isTenant && (
              <>
                <div className="h-6 w-[1px] bg-slate-200 mx-1" />
                <button
                  onClick={() => setShowDeleted(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all cursor-pointer ${
                    showDeleted 
                      ? 'bg-red-50 border-red-200 text-red-700 font-bold shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🗑️ Thùng rác
                </button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => load(showDeleted)} className="btn-secondary flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Tải lại
            </button>
            {!isTenant && (
              <button onClick={() => setShowGenModal(true)} className="btn-primary flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" /> Tạo hóa đơn
              </button>
            )}
          </div>
        </div>

        {/* Table danh sách hóa đơn */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {(isTenant 
                    ? ['Kỳ hóa đơn', 'Tiền phòng', 'Tiền điện', 'Tiền nước', 'Tổng tiền', 'Trạng thái', 'Thanh toán & Lịch sử']
                    : ['Tòa nhà', 'Phòng', 'Tháng/Năm', 'Tiền phòng', 'Tiền điện', 'Tiền nước', 'Tổng tiền', 'Trạng thái', 'Mã QR', 'Thao tác']
                  ).map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}><td colSpan={isTenant ? 7 : 10}><div className="h-12 bg-slate-50 animate-pulse m-3 rounded-lg" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isTenant ? 7 : 10} className="text-center py-12 text-slate-400">
                      {showDeleted ? "Không có hóa đơn nào trong thùng rác" : "Chưa có hóa đơn nào"}
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const sortedInvoices = [...filtered].sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month));
                    let lastGroupKey = '';
                    return sortedInvoices.map((inv) => {
                      const groupKey = `Tháng ${inv.month}/${inv.year}`;
                      const showGroupDivider = groupKey !== lastGroupKey;
                      if (showGroupDivider) {
                        lastGroupKey = groupKey;
                      }
                      return (
                        <React.Fragment key={inv.id}>
                          {showGroupDivider && (
                            <tr className="bg-slate-100/90 border-y border-slate-200">
                              <td colSpan={isTenant ? 7 : 10} className="px-4 py-2 text-[10px] font-bold text-slate-600 bg-slate-100/80">
                                {showDeleted ? `🗑️ Thùng rác hóa đơn ${groupKey}` : `📅 Danh sách hóa đơn ${groupKey}`}
                              </td>
                            </tr>
                          )}
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            {!isTenant && (
                              <>
                                <td className="px-4 py-3.5 text-sm font-bold text-slate-800">{getBuildingName(inv.room_id)}</td>
                                <td className="px-4 py-3.5 text-sm font-semibold text-indigo-600">#{getRoomNumber(inv.room_id)}</td>
                              </>
                            )}

                            <td className="px-4 py-3.5 text-sm font-medium text-slate-700">
                              Tháng {inv.month}/{inv.year}
                            </td>
                            <td className="px-4 py-3.5 text-sm text-slate-600">{formatMoney(inv.base_rent)}</td>
                            <td className="px-4 py-3.5 text-sm text-slate-600">{formatMoney(inv.electricity_amount)}</td>
                            <td className="px-4 py-3.5 text-sm text-slate-600">{formatMoney(inv.water_amount)}</td>
                            <td className="px-4 py-3.5 text-sm font-bold text-slate-900">{formatMoney(inv.total_amount)}</td>
                            
                            {/* Trạng thái */}
                            <td className="px-4 py-3.5">
                              <span className={`badge border ${STATUS_BADGE[inv.status] || 'bg-slate-100 text-slate-600'}`}>
                                {STATUS_VN[inv.status] || inv.status}
                              </span>
                            </td>

                            {/* Cột dành cho Tenant */}
                            {isTenant ? (
                              <td className="px-4 py-3.5">
                                {inv.status === 'PAID' ? (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('vi-VN') : 'Đã thanh toán'}
                                    </span>
                                    {inv.vietqr_code && (
                                      <button
                                        onClick={() => setQrInvoice(inv)}
                                        className="text-slate-400 hover:text-blue-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                        title="Xem biên lai VietQR"
                                      >
                                        <QrCode className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setQrInvoice(inv)}
                                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>Quét VietQR</span>
                                  </button>
                                )}
                              </td>
                            ) : (
                              /* Cột dành cho Admin */
                              <>
                                <td className="px-4 py-3.5">
                                  {inv.vietqr_code ? (
                                    <button
                                      onClick={() => setQrInvoice(inv)}
                                      className="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                                      title="Xem mã QR thanh toán"
                                    >
                                      <QrCode className="w-5 h-5" />
                                    </button>
                                  ) : '—'}
                                </td>
                                <td className="px-4 py-3.5 flex items-center gap-2">
                                  {showDeleted ? (
                                    <button
                                      onClick={() => handleRestoreInvoice(inv.id)}
                                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors bg-blue-50 cursor-pointer"
                                    >
                                      🔄 Phục hồi
                                    </button>
                                  ) : (
                                    <>
                                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' ? (
                                        <button
                                          onClick={() => handleMarkPaid(inv.id)}
                                          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg transition-colors animate-fade-in cursor-pointer"
                                        >
                                          <CheckCircle className="w-3.5 h-3.5" /> Thu tiền mặt
                                        </button>
                                      ) : null}
                                      <button
                                        onClick={() => handleDeleteInvoice(inv.id)}
                                        className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium border border-red-200 hover:border-red-300 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                      >
                                        Xóa
                                      </button>
                                    </>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        </React.Fragment>
                      );
                    });
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Generate Invoice Modal (Admin Only) */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Chốt Số &amp; Tạo Hóa Đơn</h2>
                <p className="text-xs text-slate-500 mt-0.5">Nhập chỉ số điện nước hoặc tải ảnh công tơ để tự động sinh VietQR</p>
              </div>
              <button 
                onClick={() => setShowGenModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Chọn phòng trọ áp dụng</label>
                <select
                  value={genForm.room_id}
                  onChange={(e) => setGenForm({ ...genForm, room_id: e.target.value })}
                  className="input font-medium"
                >
                  <option value="">-- Chọn phòng trọ --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Phòng #{r.room_number} ({getBuildingName(r.id)}) — Giá thuê: {formatMoney(r.base_rent)}/tháng
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ngày lập hóa đơn</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input font-medium"
                />
              </div>

              {/* Nhập chỉ số Điện */}
              <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-sm text-slate-800">Chỉ số Điện (kWh)</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileRefElec.current?.click()}
                    className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {elecProofPreview ? 'Đã có ảnh minh chứng' : 'Tải ảnh công tơ'}
                  </button>
                  <input type="file" ref={fileRefElec} onChange={handleElecProofUpload} accept="image/*" className="hidden" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">Số cũ gần nhất</label>
                    <input type="number" disabled value={elecOld} className="input bg-slate-100 text-slate-500 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-amber-800 font-bold mb-1">Số mới chốt</label>
                    <input
                      type="number"
                      value={elecNew}
                      onChange={(e) => setElecNew(e.target.value === '' ? '' : Number(e.target.value))}
                      className="input border-amber-300 font-bold text-amber-900 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Nhập chỉ số Nước */}
              <div className="p-4 bg-sky-50/60 border border-sky-200/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-sky-600" />
                    <span className="font-bold text-sm text-slate-800">Chỉ số Nước (m³)</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileRefWater.current?.click()}
                    className="text-xs bg-sky-100 text-sky-800 font-semibold px-2.5 py-1 rounded-lg hover:bg-sky-200 transition-colors flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {waterProofPreview ? 'Đã có ảnh minh chứng' : 'Tải ảnh đồng hồ nước'}
                  </button>
                  <input type="file" ref={fileRefWater} onChange={handleWaterProofUpload} accept="image/*" className="hidden" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-medium mb-1">Số cũ gần nhất</label>
                    <input type="number" disabled value={waterOld} className="input bg-slate-100 text-slate-500 font-bold" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-sky-800 font-bold mb-1">Số mới chốt</label>
                    <input
                      type="number"
                      value={waterNew}
                      onChange={(e) => setWaterNew(e.target.value === '' ? '' : Number(e.target.value))}
                      className="input border-sky-300 font-bold text-sky-900 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 flex-shrink-0">
              <button onClick={() => setShowGenModal(false)} className="btn-secondary">Hủy bỏ</button>
              <button onClick={handleGenerate} disabled={generating} className="btn-primary">
                {generating ? 'Đang tạo...' : 'Lưu chỉ số &amp; Phát hành hóa đơn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal (Hiển thị mã VietQR đóng tiền cho cả Tenant & Admin) */}
      {qrInvoice && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setQrInvoice(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setQrInvoice(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-slate-800 text-lg mb-1">Mã VietQR Thanh Toán</h3>
            <p className="text-xs text-slate-500 mb-4">
              Phòng #{getRoomNumber(qrInvoice.room_id)} • Kỳ {qrInvoice.month}/{qrInvoice.year}
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4 flex items-center justify-center shadow-inner">
              {qrInvoice.vietqr_code ? (
                <img src={qrInvoice.vietqr_code} alt="VietQR" className="w-52 h-52 object-contain rounded-lg" />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">Chưa có mã QR</div>
              )}
            </div>

            <div className="text-2xl font-black text-blue-600 mb-1">
              {formatMoney(qrInvoice.total_amount)}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 mb-4 text-left space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Nội dung CK:</span>
                <span className="font-bold text-slate-800 font-mono">{qrInvoice.payment_reference || `SEPAY_${qrInvoice.id.slice(0, 8)}`}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Trạng thái:</span>
                <span className={`font-bold ${qrInvoice.status === 'PAID' ? 'text-emerald-600' : 'text-blue-600'}`}>
                  {STATUS_VN[qrInvoice.status] || qrInvoice.status}
                </span>
              </div>
            </div>

            <button onClick={() => setQrInvoice(null)} className="btn-primary w-full py-2.5 font-bold cursor-pointer">
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
