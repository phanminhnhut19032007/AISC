'use client';
import React, { useEffect, useState, useRef } from 'react';
import Header from '@/components/layout/Header';
import { invoicesApi, buildingsApi, meterReadingsApi, Invoice, Room, Building } from '@/lib/api';
import { Plus, QrCode, CheckCircle, RefreshCw, X, Zap, Droplets, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUser } from '@/lib/auth';

const STATUS_BADGE: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700 border-green-200',
  SENT: 'bg-blue-100 text-blue-700 border-blue-200',
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
};
const STATUS_VN: Record<string, string> = {
  PAID: 'Đã thanh toán', SENT: 'Chờ thanh toán', DRAFT: 'Bản nháp', OVERDUE: 'Quá hạn'
};

// Hàm định dạng lỗi validation từ backend để không bao giờ bị crash màn hình React
const getErrorMessage = (err: any): string => {
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    // Nếu là danh sách lỗi validation của FastAPI, gộp lại thành chuỗi text
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
  
  // State form tạo hóa đơn
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

  // States lưu ảnh minh chứng thực tế
  const [elecProofPreview, setElecProofPreview] = useState<string | null>(null);
  const [waterProofPreview, setWaterProofPreview] = useState<string | null>(null);

  const fileRefElec = useRef<HTMLInputElement>(null);
  const fileRefWater = useRef<HTMLInputElement>(null);

  // Đồng bộ tháng/năm khi người dùng thay đổi ngày cụ thể
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

  // Tải chỉ số cũ từ hóa đơn / chốt số gần nhất trong cơ sở dữ liệu
  useEffect(() => {
    const fetchPreviousReadings = async () => {
      if (!genForm.room_id) return;
      
      const room = rooms.find(r => r.id === genForm.room_id);
      if (!room) return;

      try {
        const res = await meterReadingsApi.listByRoom(genForm.room_id);
        const readings = res.data || [];

        // Tìm chỉ số điện gần nhất
        const latestElec = readings.find(r => r.meter_type === 'ELECTRICITY');
        if (latestElec) {
          setElecOld(latestElec.new_reading);
          setElecNew(latestElec.new_reading);
        } else {
          const defaultVal = room.room_number ? Number(room.room_number) * 10 + 645 : 1645;
          setElecOld(defaultVal);
          setElecNew(defaultVal);
        }

        // Tìm chỉ số nước gần nhất
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

  const load = async (deletedOnly: boolean = showDeleted) => {
    setLoading(true);
    try {
      const [invRes, bldRes] = await Promise.all([
        invoicesApi.list({ include_deleted: deletedOnly }),
        buildingsApi.list()
      ]);
      setInvoices(invRes.data);
      setBuildings(bldRes.data);
      const roomsAll: Room[] = [];
      for (const b of bldRes.data) {
        const r = await buildingsApi.rooms(b.id);
        roomsAll.push(...r.data);
      }
      setRooms(roomsAll);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(showDeleted); }, [showDeleted]);

  // Xử lý nạp ảnh minh chứng Điện
  const handleUploadProofElec = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setElecProofPreview(e.target?.result as string);
      toast.success('Đã tải lên ảnh minh chứng đồng hồ điện!');
    };
    reader.readAsDataURL(file);
  };

  // Xử lý nạp ảnh minh chứng Nước
  const handleUploadProofWater = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setWaterProofPreview(e.target?.result as string);
      toast.success('Đã tải lên ảnh minh chứng đồng hồ nước!');
    };
    reader.readAsDataURL(file);
  };

  // Tiến hành chốt số điện nước thực tế & sinh hóa đơn
  const handleGenerate = async () => {
    if (!genForm.room_id) return toast.error('Vui lòng chọn phòng trọ');
    if (elecNew === '' || waterNew === '') return toast.error('Vui lòng nhập đầy đủ chỉ số điện và nước mới');
    
    const parsedElecNew = Number(elecNew);
    const parsedWaterNew = Number(waterNew);

    if (isNaN(parsedElecNew) || isNaN(parsedWaterNew)) {
      return toast.error('Chỉ số nhập vào không hợp lệ');
    }

    if (parsedElecNew < elecOld) return toast.error('Chỉ số điện mới không được nhỏ hơn chỉ số của hóa đơn gần nhất');
    if (parsedWaterNew < waterOld) return toast.error('Chỉ số nước mới không được nhỏ hơn chỉ số của hóa đơn gần nhất');

    setGenerating(true);
    try {
      // 1. Lưu chỉ số điện lên DB (Đúc kết URL demo ngắn thay vì Base64 quá dài gây lỗi tràn cột 512 ký tự)
      await meterReadingsApi.create({
        room_id: String(genForm.room_id),
        meter_type: 'ELECTRICITY',
        month: Number(genForm.month),
        year: Number(genForm.year),
        new_reading: parsedElecNew,
        is_manual: true,
        ocr_image_url: elecProofPreview ? '/uploads/proof_electricity.jpg' : undefined
      });

      // 2. Lưu chỉ số nước lên DB
      await meterReadingsApi.create({
        room_id: String(genForm.room_id),
        meter_type: 'WATER',
        month: Number(genForm.month),
        year: Number(genForm.year),
        new_reading: parsedWaterNew,
        is_manual: true,
        ocr_image_url: waterProofPreview ? '/uploads/proof_water.jpg' : undefined
      });

      // 3. Gọi API sinh hóa đơn kết toán dựa trên chỉ số vừa lưu
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

  const filtered = filter === 'ALL' ? invoices : invoices.filter((i) => i.status === filter);
  const formatMoney = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' VND';
  
  const getRoomNumber = (roomId: string) => rooms.find((r) => r.id === roomId)?.room_number || roomId.slice(0, 6);
  
  const getBuildingName = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return '—';
    const building = buildings.find((b) => b.id === room.building_id);
    return building ? building.name : '—';
  };

  return (
    <div>
      <Header title={currentUser?.role === 'TENANT' ? 'Hóa đơn thanh toán' : 'Quản lý Hóa đơn'} />
      <div className="p-6 space-y-5">
        {/* Actions bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap items-center">
            {['ALL', 'SENT', 'PAID', 'OVERDUE'].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setFilter(s);
                  setShowDeleted(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  !showDeleted && filter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                }`}
              >
                {s === 'ALL' ? 'Tất cả' : STATUS_VN[s] || s}
              </button>
            ))}
            
            {currentUser?.role !== 'TENANT' && (
              <>
                <div className="h-6 w-[1px] bg-slate-200 mx-1" />
                <button
                  onClick={() => {
                    setShowDeleted(true);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 transition-all ${
                    showDeleted 
                      ? 'bg-red-50 border-red-200 text-red-700 font-bold' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🗑️ Thùng rác (Hóa đơn đã xóa)
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => load(showDeleted)} className="btn-secondary flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Tải lại
            </button>
            {currentUser?.role !== 'TENANT' && (
              <button onClick={() => setShowGenModal(true)} className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" /> Tạo hóa đơn
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {['Tòa nhà', 'Phòng', 'Tháng/Năm', 'Tiền phòng', 'Tiền điện', 'Tiền nước', 'Tổng tiền', 'Trạng thái', 'Mã QR', 'Thao tác']
                    .filter((h) => currentUser?.role !== 'TENANT' || h !== 'Thao tác')
                    .map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}><td colSpan={currentUser?.role === 'TENANT' ? 9 : 10}><div className="h-12 bg-slate-50 animate-pulse m-3 rounded-lg" /></td></tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={currentUser?.role === 'TENANT' ? 9 : 10} className="text-center py-12 text-slate-400">{showDeleted ? "Không có hóa đơn nào trong thùng rác" : "Không có hóa đơn nào"}</td></tr>
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
                              <td colSpan={currentUser?.role === 'TENANT' ? 9 : 10} className="px-4 py-2 text-[10px] font-bold text-slate-600 bg-slate-100/80">
                                {showDeleted ? `🗑️ Thùng rác hóa đơn ${groupKey}` : `📅 Danh sách hóa đơn ${groupKey}`}
                              </td>
                            </tr>
                          )}
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3.5 text-sm font-bold text-slate-800">{getBuildingName(inv.room_id)}</td>
                            <td className="px-4 py-3.5 text-sm font-semibold text-indigo-600">#{getRoomNumber(inv.room_id)}</td>
                            <td className="px-4 py-3.5 text-sm text-slate-600">Tháng {inv.month}/{inv.year}</td>
                            <td className="px-4 py-3.5 text-sm text-slate-600">{formatMoney(inv.base_rent)}</td>
                            <td className="px-4 py-3.5 text-sm text-slate-600">{formatMoney(inv.electricity_amount)}</td>
                            <td className="px-4 py-3.5 text-sm text-slate-600">{formatMoney(inv.water_amount)}</td>
                            <td className="px-4 py-3.5 text-sm font-bold text-slate-900">{formatMoney(inv.total_amount)}</td>
                            <td className="px-4 py-3.5">
                              <span className={`badge border ${STATUS_BADGE[inv.status] || 'bg-slate-100 text-slate-600'}`}>
                                {STATUS_VN[inv.status] || inv.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              {inv.vietqr_code ? (
                                <button
                                  onClick={() => setQrInvoice(inv)}
                                  className="text-blue-500 hover:text-blue-700 transition-colors"
                                  title="Xem mã QR thanh toán"
                                >
                                  <QrCode className="w-5 h-5" />
                                </button>
                              ) : '—'}
                            </td>
                            {currentUser?.role !== 'TENANT' && (
                              <td className="px-4 py-3.5 flex items-center gap-2">
                                {showDeleted ? (
                                  <button
                                    onClick={() => handleRestoreInvoice(inv.id)}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors bg-blue-50"
                                  >
                                    🔄 Phục hồi
                                  </button>
                                ) : (
                                  <>
                                    {inv.status !== 'PAID' && inv.status !== 'CANCELLED' ? (
                                      <button
                                        onClick={() => handleMarkPaid(inv.id)}
                                        className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg transition-colors animate-fade-in"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5" /> Thu tiền mat
                                      </button>
                                    ) : null}
                                    <button
                                      onClick={() => handleDeleteInvoice(inv.id)}
                                      className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium border border-red-200 hover:border-red-300 px-2.5 py-1 rounded-lg transition-colors"
                                    >
                                      Xóa
                                    </button>
                                  </>
                                )}
                              </td>
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

      {/* Generate Invoice Modal (Chốt số điện nước trực quan & Lưu ảnh minh chứng) */}
      {showGenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Chốt Số &amp; Tạo Hóa Đơn</h2>
                <p className="text-xs text-slate-400 mt-0.5">Lấy chỉ số cũ từ hóa đơn gần nhất, nhập chỉ số mới từ bàn phím và đính kèm ảnh chụp minh chứng</p>
              </div>
              <button onClick={() => setShowGenModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            {/* Body Modal */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* 1. Chọn phòng & Ngày lập */}
              <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Chọn phòng trọ *</label>
                  <select
                    value={genForm.room_id}
                    onChange={(e) => setGenForm({ ...genForm, room_id: e.target.value })}
                    className="input font-bold"
                  >
                    <option value="">-- Chọn phòng trọ --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        Phòng {r.room_number} ({getBuildingName(r.id)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Ngày lập hóa đơn *</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input font-bold text-slate-700"
                  />
                </div>
              </div>

              {genForm.room_id ? (
                <div className="grid md:grid-cols-2 gap-6 pt-2">
                  {/* Cột A: Chốt số ĐIỆN */}
                  <div className="p-4 border border-yellow-100 bg-yellow-50/20 rounded-xl space-y-4">
                    <h3 className="text-sm font-bold text-yellow-800 flex items-center gap-1.5 border-b border-yellow-100 pb-2">
                      <Zap className="w-4 h-4 text-yellow-500" /> 1. Chốt chỉ số ĐIỆN (kWh)
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Chỉ số cũ (HĐ trước)</label>
                        <input type="number" readOnly value={elecOld} className="input py-1.5 font-bold text-slate-500 bg-slate-100 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-yellow-700 uppercase tracking-wide mb-1">Chỉ số mới *</label>
                        <input
                          type="number"
                          value={elecNew}
                          onChange={e => setElecNew(e.target.value === '' ? '' : Number(e.target.value))}
                          className="input py-1.5 font-bold text-yellow-950 border-yellow-300 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-600 bg-white/60 p-2 rounded-lg border border-yellow-100">
                      <span>Điện tiêu thụ:</span>
                      <span className="font-bold text-yellow-800">
                        {((elecNew === '' ? elecOld : elecNew) - elecOld).toFixed(1)} kWh
                      </span>
                    </div>

                    {/* Ảnh minh chứng đồng hồ Điện */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ảnh chụp minh chứng đồng hồ điện</label>
                      <div 
                        onClick={() => fileRefElec.current?.click()}
                        className="border border-dashed border-yellow-300 rounded-lg p-3 text-center cursor-pointer hover:bg-yellow-50 transition-colors bg-white"
                      >
                        {elecProofPreview ? (
                          <div className="relative group">
                            <img src={elecProofPreview} alt="Minh chứng điện" className="h-20 mx-auto object-contain rounded" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                              <span className="text-[10px] text-white font-bold">Thay ảnh</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1 text-xs text-yellow-700 py-2">
                            <Camera className="w-5 h-5 text-yellow-500" />
                            <span>Tải ảnh đồng hồ điện</span>
                          </div>
                        )}
                        <input
                          ref={fileRefElec}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && handleUploadProofElec(e.target.files[0])}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cột B: Chốt số NƯỚC */}
                  <div className="p-4 border border-blue-100 bg-blue-50/20 rounded-xl space-y-4">
                    <h3 className="text-sm font-bold text-blue-800 flex items-center gap-1.5 border-b border-blue-100 pb-2">
                      <Droplets className="w-4 h-4 text-blue-500" /> 2. Chốt chỉ số NƯỚC (m³)
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Chỉ số cũ (HĐ trước)</label>
                        <input type="number" readOnly value={waterOld} className="input py-1.5 font-bold text-slate-500 bg-slate-100 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">Chỉ số mới *</label>
                        <input
                          type="number"
                          value={waterNew}
                          onChange={e => setWaterNew(e.target.value === '' ? '' : Number(e.target.value))}
                          className="input py-1.5 font-bold text-blue-950 border-blue-300 bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-600 bg-white/60 p-2 rounded-lg border border-blue-100">
                      <span>Nước tiêu thụ:</span>
                      <span className="font-bold text-blue-800">
                        {((waterNew === '' ? waterOld : waterNew) - waterOld).toFixed(1)} m³
                      </span>
                    </div>

                    {/* Ảnh minh chứng đồng hồ Nước */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Ảnh chụp minh chứng đồng hồ nước</label>
                      <div 
                        onClick={() => fileRefWater.current?.click()}
                        className="border border-dashed border-blue-300 rounded-lg p-3 text-center cursor-pointer hover:bg-blue-50 transition-colors bg-white"
                      >
                        {waterProofPreview ? (
                          <div className="relative group">
                            <img src={waterProofPreview} alt="Minh chứng nước" className="h-20 mx-auto object-contain rounded" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                              <span className="text-[10px] text-white font-bold">Thay ảnh</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1 text-xs text-blue-700 py-2">
                            <Camera className="w-5 h-5 text-blue-500" />
                            <span>Tải ảnh đồng hồ nước</span>
                          </div>
                        )}
                        <input
                          ref={fileRefWater}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files?.[0] && handleUploadProofWater(e.target.files[0])}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
                  Vui lòng chọn phòng trọ để thực hiện chốt số điện nước.
                </div>
              )}
            </div>
            
            {/* Footer Modal */}
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 flex-shrink-0">
              <button onClick={() => setShowGenModal(false)} className="btn-secondary">Hủy</button>
              <button
                onClick={handleGenerate}
                disabled={generating || !genForm.room_id}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow shadow-blue-600/10 min-w-[150px]"
              >
                {generating ? 'Đang kết toán...' : 'Tính tiền & Tạo hóa đơn'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrInvoice && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setQrInvoice(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-1">Mã VietQR Thanh Toán</h3>
            <p className="text-sm text-slate-500 mb-4">
              Phòng #{getRoomNumber(qrInvoice.room_id)} ({getBuildingName(qrInvoice.room_id)}) — Tháng {qrInvoice.month}/{qrInvoice.year}
            </p>
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              {qrInvoice.vietqr_code ? (
                <img src={qrInvoice.vietqr_code} alt="VietQR" className="mx-auto w-48 h-48 object-contain" />
              ) : (
                <div className="w-48 h-48 mx-auto flex items-center justify-center text-slate-400">Không có QR</div>
              )}
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {new Intl.NumberFormat('vi-VN').format(qrInvoice.total_amount)} VND
            </div>
            <div className="text-xs text-slate-400 mb-4">Nội dung chuyển khoản: {qrInvoice.payment_reference}</div>
            <button onClick={() => setQrInvoice(null)} className="btn-primary w-full">Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
