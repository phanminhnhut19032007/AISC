'use client';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { buildingsApi, invoicesApi, ticketsApi, Building, Room, Invoice, Ticket } from '@/lib/api';
import { DoorOpen, Wrench, TrendingUp, ArrowUpRight, FileText, QrCode, ClipboardList, Info, AlertTriangle, ShieldCheck, Home, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';

function StatCard({
  label, value, sub, icon: Icon, color
}: { label: string; value: string | number; sub?: string; icon: any; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700 border-green-200',
  SENT: 'bg-blue-100 text-blue-700 border-blue-200',
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
  CANCELLED: 'bg-slate-100 text-slate-400 border-slate-200',
};

const STATUS_LABEL: Record<string, string> = {
  PAID: 'Đã thanh toán', SENT: 'Chờ thanh toán', DRAFT: 'Bản nháp', OVERDUE: 'Quá hạn', CANCELLED: 'Đã hủy'
};

const TICKET_STATUS_LABEL: Record<string, string> = {
  OPEN: 'Mới gửi', ASSIGNED: 'Chủ nhà đã nhận', IN_PROGRESS: 'Đang xử lý', CLOSED: 'Đã sửa xong', CANCELLED: 'Đã hủy'
};

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQrModal, setShowQrModal] = useState<Invoice | null>(null);

  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    setCurrentUser(user);

    const load = async () => {
      try {
        const [bRes, invRes, tickRes] = await Promise.all([
          buildingsApi.list(),
          invoicesApi.list(),
          ticketsApi.list(),
        ]);
        const bs = bRes.data;
        setBuildings(bs);
        setInvoices(invRes.data);
        setTickets(tickRes.data);

        // Load rooms for all buildings
        const roomsAll: Room[] = [];
        for (const b of bs) {
          const r = await buildingsApi.rooms(b.id);
          roomsAll.push(...r.data);
        }
        setRooms(roomsAll);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const now = new Date();
  const formatMoney = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const isTenant = currentUser?.role === 'TENANT';

  if (loading) {
    return (
      <div>
        <Header title="Tổng quan" />
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- 1. RENDER RESIDENT/TENANT INTERFACE ---
  if (isTenant) {
    // Tìm hóa đơn mới nhất chưa thanh toán hoặc hóa đơn mới nhất nói chung
    const unpaidInvoice = [...invoices]
      .filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
      .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))[0];

    const latestInvoice = unpaidInvoice || [...invoices]
      .sort((a, b) => (b.year * 12 + b.month) - (a.year * 12 + a.month))[0];

    const getRoomName = (roomId: string) => rooms.find((r) => r.id === roomId)?.room_number || '101';
    const getBuildingInfo = () => {
      if (buildings.length > 0) {
        return { name: buildings[0].name, address: buildings[0].address };
      }
      return { name: 'Nhà trọ Renteasy', address: 'Đang cập nhật' };
    };

    return (
      <div className="min-h-screen bg-slate-50">
        <Header title="Tổng quan cư dân" />
        
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-black">Xin chào, Phòng {getRoomName(latestInvoice?.room_id || '')}!</h2>
              <p className="text-xs text-blue-100 mt-1 max-w-md leading-relaxed">
                Chào mừng bạn đến với RENTEASY. Tất cả thông tin thuê phòng, hóa đơn và sự cố được cập nhật liên tục tại đây.
              </p>
            </div>
            <div className="hidden md:flex w-14 h-14 bg-white/10 rounded-2xl items-center justify-center backdrop-blur shadow-inner">
              <Home className="w-7 h-7 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Content Column (Invoices & History) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Month Room Invoice Card */}
              {latestInvoice ? (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-base">Hóa đơn phòng tháng {latestInvoice.month}/{latestInvoice.year}</h3>
                      <span className="text-xs text-slate-400 mt-0.5 block">Phòng #{getRoomName(latestInvoice.room_id)} - {getBuildingInfo().name}</span>
                    </div>
                    <span className={`badge border text-xs px-3 py-1 font-bold ${STATUS_BADGE[latestInvoice.status] || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABEL[latestInvoice.status] || latestInvoice.status}
                    </span>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Bill details */}
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm py-1 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Tiền phòng cơ bản:</span>
                        <span className="font-bold text-slate-800">{formatMoney(latestInvoice.base_rent)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-1 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Tiền điện:</span>
                        <span className="font-bold text-slate-800">{formatMoney(latestInvoice.electricity_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm py-1 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Tiền nước:</span>
                        <span className="font-bold text-slate-800">{formatMoney(latestInvoice.water_amount)}</span>
                      </div>
                      <div className="flex justify-between text-base pt-3 border-t border-slate-100">
                        <span className="text-slate-800 font-extrabold">Tổng tiền thanh toán:</span>
                        <span className="font-black text-blue-700 text-lg">{formatMoney(latestInvoice.total_amount)}</span>
                      </div>
                    </div>

                    {/* Pay Button / VietQR QR display */}
                    <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-4 border border-slate-100 text-center">
                      {latestInvoice.status !== 'PAID' && latestInvoice.status !== 'CANCELLED' ? (
                        latestInvoice.vietqr_code ? (
                          <div className="space-y-3">
                            <img src={latestInvoice.vietqr_code} alt="VietQR" className="w-36 h-36 object-contain mx-auto bg-white p-1 rounded-xl shadow-sm border border-slate-100" />
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quét mã chuyển khoản nhanh</p>
                              <p className="text-xs text-indigo-600 font-bold mt-0.5">MB Bank - Nộp tiền phòng</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 py-6">
                            <AlertTriangle className="w-10 h-10 mx-auto text-amber-500 mb-2" />
                            <p className="text-xs">Không có mã QR thanh toán</p>
                          </div>
                        )
                      ) : (
                        <div className="py-6 text-center space-y-2">
                          <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
                          <h4 className="font-bold text-emerald-700 text-sm">Hóa đơn đã được thanh toán</h4>
                          <p className="text-xs text-slate-400">Cảm ơn bạn đã đóng tiền phòng đầy đủ!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center text-slate-400">
                  <ClipboardList className="w-12 h-12 text-indigo-500 mx-auto mb-3 opacity-40" />
                  <h3 className="font-bold text-slate-700">Chưa có hóa đơn nào</h3>
                  <p className="text-xs mt-1">Chủ nhà chưa xuất hóa đơn tháng này cho phòng của bạn.</p>
                </div>
              )}

              {/* Invoice History list */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-bold text-slate-800 text-base">Lịch sử hóa đơn phòng</h2>
                  <span className="text-xs text-slate-400">Sắp xếp gần nhất</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-left">
                        {['Tháng/Năm', 'Tổng tiền', 'Trạng thái', 'Ngày thanh toán', 'Chi tiết QR'].map((h) => (
                          <th key={h} className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {invoices.length <= 1 && (!latestInvoice || invoices.length === 0) ? (
                        <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-xs">Chưa có lịch sử hóa đơn khác</td></tr>
                      ) : (
                        invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/30">
                            <td className="px-5 py-3.5 font-semibold text-slate-700">Tháng {inv.month}/{inv.year}</td>
                            <td className="px-5 py-3.5 font-bold text-slate-800">{formatMoney(inv.total_amount)}</td>
                            <td className="px-5 py-3.5">
                              <span className={`badge border text-[10px] ${STATUS_BADGE[inv.status] || 'bg-slate-100 text-slate-600'}`}>
                                {STATUS_LABEL[inv.status] || inv.status}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-500">
                              {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('vi-VN') : '—'}
                            </td>
                            <td className="px-5 py-3.5">
                              {inv.vietqr_code ? (
                                <button
                                  onClick={() => setShowQrModal(inv)}
                                  className="text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 text-xs font-bold"
                                >
                                  <QrCode className="w-4 h-4" /> Xem QR
                                </button>
                              ) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Side Column (Room Info & Incidents) */}
            <div className="space-y-6">
              {/* Room info info */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-slate-50 pb-2">
                  🏢 Thông tin phòng thuê
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase">Số phòng trọ:</span>
                    <span className="font-bold text-indigo-700 text-base">Phòng {getRoomName(latestInvoice?.room_id || '')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase">Tòa nhà:</span>
                    <span className="font-semibold text-slate-800">{getBuildingInfo().name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-xs font-bold uppercase">Địa chỉ cụ thể:</span>
                    <span className="text-slate-500 text-xs font-medium leading-relaxed block">{getBuildingInfo().address}</span>
                  </div>
                </div>
              </div>

              {/* Incidents reporter widget */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                    🛠️ Sự cố bạn đã báo
                  </h3>
                  <Link href="/dashboard/tickets" className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5">
                    Gửi báo cáo <Plus className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {tickets.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Không có sự cố nào đang báo cáo
                    </div>
                  ) : (
                    tickets.slice(0, 4).map((t) => (
                      <div key={t.id} className="p-3 bg-slate-50/50 border border-slate-100 rounded-2xl space-y-1.5 hover:border-blue-200 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-800 text-xs truncate flex-1 leading-snug">{t.title}</h4>
                          <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex-shrink-0">
                            {TICKET_STATUS_LABEL[t.status] || t.status}
                          </span>
                        </div>
                        {t.description && <p className="text-[10px] text-slate-500 truncate">{t.description}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global QR Code Modal */}
        {showQrModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowQrModal(null)}>
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl overflow-hidden flex flex-col relative" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-black text-slate-800 mb-1 text-base">Mã QR Thanh Toán</h3>
              <p className="text-xs text-slate-400 mb-5">Phòng #{getRoomName(showQrModal.room_id)} — Tháng {showQrModal.month}/{showQrModal.year}</p>
              
              <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
                <img src={showQrModal.vietqr_code} alt="VietQR" className="mx-auto w-48 h-48 object-contain bg-white p-1 rounded-xl shadow-inner border border-slate-100" />
              </div>
              
              <div className="text-2xl font-black text-indigo-700 mb-1">
                {formatMoney(showQrModal.total_amount)}
              </div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-5">Nội dung: {showQrModal.payment_reference}</div>
              <button onClick={() => setShowQrModal(null)} className="btn-primary w-full py-2.5 rounded-xl text-sm font-extrabold">Đóng</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- 2. RENDER ADMIN/OWNER INTERFACE ---
  const occupied = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const pendingTickets = tickets.filter((t) => !['CLOSED', 'CANCELLED'].includes(t.status)).length;
  const thisMonthInvoices = invoices.filter(
    (inv) => inv.month === now.getMonth() + 1 && inv.year === now.getFullYear()
  );
  const revenue = thisMonthInvoices
    .filter((i) => i.status === 'PAID')
    .reduce((s, i) => s + i.total_amount, 0);

  const recentInvoices = [...invoices]
    .sort((a, b) => b.year * 100 + b.month - (a.year * 100 + a.month))
    .slice(0, 6);

  return (
    <div>
      <Header title="Tổng quan" />
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Tổng số phòng" value={rooms.length} sub={`${buildings.length} tòa nhà`} icon={DoorOpen} color="bg-blue-600" />
          <StatCard label="Đang thuê" value={occupied} sub={`${rooms.length - occupied} phòng trống`} icon={DoorOpen} color="bg-emerald-500" />
          <StatCard label="Doanh thu tháng này" value={formatMoney(revenue)} sub={`${thisMonthInvoices.length} hóa đơn`} icon={TrendingUp} color="bg-violet-500" />
          <StatCard label="Phiếu bảo trì cần xử lý" value={pendingTickets} sub="yêu cầu chưa đóng" icon={Wrench} color="bg-orange-500" />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 flex-wrap">
          <Link href="/dashboard/invoices" className="btn-primary flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Quản lý hóa đơn
          </Link>
          <Link href="/dashboard/tickets" className="btn-secondary flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Xử lý bảo trì
          </Link>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Hóa đơn gần đây</h2>
            <Link href="/dashboard/invoices" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Xem tất cả <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Mã phòng', 'Tháng', 'Tổng tiền', 'Trạng thái', 'Ngày thanh toán'].map((h) => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentInvoices.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">Chưa có hóa đơn nào</td></tr>
                ) : (
                  recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-3.5 text-sm font-mono text-slate-700">{inv.room_id.slice(0, 8)}...</td>
                      <td className="px-6 py-3.5 text-sm text-slate-600">T{inv.month}/{inv.year}</td>
                      <td className="px-6 py-3.5 text-sm font-semibold text-slate-800">{formatMoney(inv.total_amount)}</td>
                      <td className="px-6 py-3.5">
                        <span className={`badge ${STATUS_BADGE[inv.status] || 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_LABEL[inv.status] || inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-sm text-slate-500">
                        {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
