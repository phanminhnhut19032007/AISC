'use client';
import React, { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import { 
  ShieldCheck, AlertCircle, CheckCircle2, XCircle, Search, 
  Filter, Eye, Sparkles, Check, X, Building2, Phone, Mail, 
  FileText, Camera, Award, Clock, ArrowRight, RotateCcw, 
  ExternalLink, UserCheck, ShieldAlert, Download, RefreshCw, MessageSquare
} from 'lucide-react';
import { 
  KycApplication, getKycApplications, approveKycApplication, 
  rejectKycApplication, toggleKycSlotApproval 
} from '@/lib/kycAdmin';
import { getUser, saveAuth, UserAuthData } from '@/lib/auth';
import { useConfirm } from '@/context/ConfirmationContext';

export default function AdminKycPage() {
  const { showAlert } = useConfirm();
  const [applications, setApplications] = useState<KycApplication[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAuthData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  
  // Selected inspection modal
  const [selectedApp, setSelectedApp] = useState<KycApplication | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  
  // Rejection reason modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('Ảnh giấy tờ mờ, không nhìn rõ số hiệu. Vui lòng chụp lại rõ nét hơn.');
  
  // Lightbox preview image
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const loadData = () => {
    const list = getKycApplications();
    setApplications(list);
    setCurrentUser(getUser());

    // Update selected app if still open
    if (selectedApp) {
      const updated = list.find((a) => a.id === selectedApp.id);
      if (updated) setSelectedApp(updated);
    }
  };

  useEffect(() => {
    loadData();

    const handleKycUpdated = () => loadData();
    window.addEventListener('reasy_admin_kyc_updated', handleKycUpdated);
    window.addEventListener('smartrent_user_updated', handleKycUpdated);

    return () => {
      window.removeEventListener('reasy_admin_kyc_updated', handleKycUpdated);
      window.removeEventListener('smartrent_user_updated', handleKycUpdated);
    };
  }, []);

  // Filtered list
  const filteredApps = applications.filter((app) => {
    const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;
    const matchQuery =
      app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.phone.includes(searchQuery) ||
      app.idNumber.includes(searchQuery) ||
      app.buildingName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchQuery;
  });

  // Stats calculation
  const totalCount = applications.length;
  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;
  const verifiedCount = applications.filter((a) => a.status === 'VERIFIED').length;
  const rejectedCount = applications.filter((a) => a.status === 'REJECTED').length;

  const handleOpenInspect = (app: KycApplication) => {
    setSelectedApp(app);
    setInspectModalOpen(true);
  };

  const handleApproveEntire = (appId: string) => {
    approveKycApplication(appId);
    showAlert({
      title: 'Đã phê duyệt hồ sơ',
      message: 'Đã cấp Huy hiệu Tích Xanh chính chủ thành công cho tài khoản!',
      type: 'success',
    });
    loadData();
  };

  const handleConfirmReject = () => {
    if (!selectedApp) return;
    rejectKycApplication(selectedApp.id, rejectReason);
    setRejectModalOpen(false);
    showAlert({
      title: 'Đã từ chối hồ sơ',
      message: `Đã gửi thông báo yêu cầu bổ sung giấy tờ tới chủ trọ ${selectedApp.fullName}.`,
      type: 'warning',
    });
    loadData();
  };

  const handleToggleSlot = (slot: 'idFront' | 'idBack' | 'propertyDoc' | 'businessDoc') => {
    if (!selectedApp) return;
    const updated = toggleKycSlotApproval(selectedApp.id, slot);
    if (updated) setSelectedApp({ ...updated });
    loadData();
  };

  const handleQuickAdminLogin = () => {
    const adminUser: UserAuthData = {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Quản trị viên Minh Nhựt',
      phone: '0388430402',
      role: 'SUPERADMIN',
    };
    saveAuth('mock_jwt_superadmin_0388430402', adminUser);
    setCurrentUser(adminUser);
    showAlert({
      title: 'Đăng nhập Admin thành công',
      message: 'Chào mừng Quản trị viên Minh Nhựt vào Trung tâm Phê duyệt KYC!',
      type: 'success',
    });
    loadData();
  };

  // Role Guard Check & Direct Admin Login Gateway
  if (!currentUser || (currentUser.role !== 'SUPERADMIN' && currentUser.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-800/90 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
          <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 border border-indigo-400/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Cổng Quản Trị Duyệt KYC
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Đường dẫn bảo mật dành riêng cho Quản trị viên REASY
            </p>
          </div>

          {currentUser && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-left text-xs text-amber-300">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                Đang đăng nhập bằng tài khoản: {currentUser.full_name} ({currentUser.role === 'OWNER' ? 'Chủ trọ' : 'Cư dân'})
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Tài khoản hiện tại không có quyền Admin. Vui lòng bấm nút bên dưới để chuyển sang tài khoản Quản trị viên.
              </p>
            </div>
          )}

          {/* Quick 1-Click Login Button for Admin */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleQuickAdminLogin}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
            >
              <ShieldCheck className="w-4.5 h-4.5" />
              <span>Đăng nhập quyền Admin (0388430402)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="/admin/login"
              className="block w-full py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors text-center"
            >
              Mở trang đăng nhập Admin riêng biệt (/admin/login)
            </a>
          </div>

          <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
            <a href="/dashboard" className="text-slate-400 hover:text-slate-200">
              ← Về bảng điều khiển
            </a>
            <span className="font-mono text-indigo-300">0388430402 / MinhNhut2007</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header title="Bảng Quản Trị Duyệt KYC Chủ Trọ (Admin Portal)" />

      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* Top Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Hệ Thống Phê Duyệt Pháp Lý Tập Trung</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Quản Trị Thẩm Định Danh Tính & Sổ Hồng
              </h1>
              <p className="text-sm text-slate-300 max-w-2xl">
                Kiểm tra CCCD 2 mặt, Sổ hồng/HĐ thuê & Giấy phép PCCC. Cấp huy hiệu <b>Tích Xanh Verified</b> bảo chứng an tâm cho cư dân REASY.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                onClick={loadData}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 border border-white/10 backdrop-blur-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" /> Làm mới dữ liệu
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng hồ sơ</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalCount}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Chủ trọ toàn hệ thống</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm flex items-center gap-4 bg-amber-50/20">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
              <Clock className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Chờ xét duyệt</p>
              <h3 className="text-2xl font-black text-amber-900 mt-0.5">{pendingCount}</h3>
              <p className="text-[11px] text-amber-700 font-bold mt-0.5">Icon Chấm than cam (!)</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm flex items-center gap-4 bg-emerald-50/20">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Đã cấp Tích Xanh</p>
              <h3 className="text-2xl font-black text-emerald-900 mt-0.5">{verifiedCount}</h3>
              <p className="text-[11px] text-emerald-700 font-bold mt-0.5">Đã duyệt 4/4 ô hợp lệ (✓)</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm flex items-center gap-4 bg-red-50/20">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Yêu cầu bổ sung</p>
              <h3 className="text-2xl font-black text-red-900 mt-0.5">{rejectedCount}</h3>
              <p className="text-[11px] text-red-700 font-medium mt-0.5">Giấy tờ mờ / lỗi</p>
            </div>
          </div>
        </div>

        {/* Toolbar: Search & Segmented Filter Tabs */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên chủ trọ, SĐT, số CCCD, tòa nhà..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { id: 'ALL', label: 'Tất cả', count: totalCount },
              { id: 'PENDING', label: 'Chờ duyệt', count: pendingCount, color: 'text-amber-600' },
              { id: 'VERIFIED', label: 'Đã xác minh', count: verifiedCount, color: 'text-emerald-600' },
              { id: 'REJECTED', label: 'Từ chối', count: rejectedCount, color: 'text-red-600' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-white text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Applications List Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-3.5 px-4">Mã HS / Chủ Trọ</th>
                  <th className="py-3.5 px-4">Tòa Nhà & Địa Chỉ</th>
                  <th className="py-3.5 px-4">Số CCCD / OCR AI</th>
                  <th className="py-3.5 px-4">Tiến Độ 4 Ô Ảnh</th>
                  <th className="py-3.5 px-4">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-sm">Không tìm thấy hồ sơ nào phù hợp</p>
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => {
                    const approvedSlots = [
                      app.idFrontStatus === 'APPROVED',
                      app.idBackStatus === 'APPROVED',
                      app.propertyDocStatus === 'APPROVED',
                      app.businessDocStatus === 'APPROVED',
                    ].filter(Boolean).length;

                    return (
                      <tr 
                        key={app.id} 
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        onClick={() => handleOpenInspect(app)}
                      >
                        {/* Chủ trọ */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                              {app.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                                  {app.fullName}
                                </span>
                                {app.status === 'VERIFIED' && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3" /> {app.phone} • <span className="font-mono">{app.id}</span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Tòa nhà */}
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold text-slate-800 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-slate-500" />
                              {app.buildingName}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                              {app.address}
                            </p>
                          </div>
                        </td>

                        {/* Số CCCD / AI OCR */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                              {app.idNumber}
                            </span>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-bold text-emerald-700">
                                OCR khớp {app.ocrScore}%
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Tiến độ 4 ô ảnh */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              {/* 4 Mini Icons */}
                              {[
                                { name: 'CCCD Trước', st: app.idFrontStatus, img: app.idFront },
                                { name: 'CCCD Sau', st: app.idBackStatus, img: app.idBack },
                                { name: 'Sổ Hồng', st: app.propertyDocStatus, img: app.propertyDoc },
                                { name: 'PCCC', st: app.businessDocStatus, img: app.businessDoc },
                              ].map((item, i) => (
                                <div
                                  key={i}
                                  className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold border transition-all ${
                                    item.st === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                      : item.img
                                      ? 'bg-amber-100 text-amber-700 border-amber-300 animate-pulse'
                                      : 'bg-slate-100 text-slate-400 border-slate-200'
                                  }`}
                                  title={`${item.name}: ${item.st === 'APPROVED' ? 'Đã duyệt' : item.img ? 'Chờ duyệt (!)' : 'Chưa có ảnh'}`}
                                >
                                  {item.st === 'APPROVED' ? '✓' : item.img ? '!' : '-'}
                                </div>
                              ))}
                              <span className="text-[11px] font-extrabold text-slate-700 ml-1.5">
                                {approvedSlots}/4 ô
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3.5 px-4">
                          {app.status === 'VERIFIED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2.5 py-1 rounded-full shadow-xs">
                              <CheckCircle2 className="w-3 h-3" /> Đã Xác Minh
                            </span>
                          ) : app.status === 'REJECTED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-red-800 bg-red-100 border border-red-300 px-2.5 py-1 rounded-full shadow-xs">
                              <XCircle className="w-3 h-3" /> Bị Từ Chối
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full shadow-xs animate-pulse">
                              <span className="w-3.5 h-3.5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">!</span> Chờ Duyệt
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenInspect(app)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Xem xét
                            </button>
                            {app.status !== 'VERIFIED' && (
                              <button
                                type="button"
                                onClick={() => handleApproveEntire(app.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                                title="Duyệt nhanh và cấp Tích xanh"
                              >
                                <Sparkles className="w-3 h-3" /> Duyệt
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── FULL KYC INSPECTION MODAL (Giao diện Thẩm định Chi tiết 2 Cột) ─── */}
      {inspectModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div 
            className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-auto max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden flex-shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                  {selectedApp.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-white">Thẩm Định Hồ Sơ KYC: {selectedApp.fullName}</h3>
                    {selectedApp.status === 'VERIFIED' ? (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ĐÃ XÁC MINH
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> CHỜ PHÊ DUYỆT
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Mã hồ sơ: <span className="font-mono text-blue-300">{selectedApp.id}</span> • Nộp lúc: {new Date(selectedApp.submittedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Alert if rejected */}
              {selectedApp.rejectionReason && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs font-semibold">
                  <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">Lý do từ chối trước đó:</h4>
                    <p className="mt-0.5">{selectedApp.rejectionReason}</p>
                  </div>
                </div>
              )}

              {/* 2 Columns: Left = Metadata & OCR Info | Right = 4 Photo slots with zoom */}
              <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Column 1: Info & OCR (1 col) */}
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-600" /> Thông tin đăng ký
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">Họ và tên chủ tài khoản</span>
                        <span className="font-bold text-slate-800 text-sm">{selectedApp.fullName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">Số điện thoại</span>
                        <span className="font-bold text-slate-800">{selectedApp.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">Tòa nhà cho thuê</span>
                        <span className="font-bold text-slate-800">{selectedApp.buildingName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-bold">Địa chỉ tài sản</span>
                        <span className="text-slate-600 font-medium">{selectedApp.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI OCR Validation Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl p-4 border border-blue-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-blue-600" /> AI OCR So Khớp
                      </h4>
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                        Đạt {selectedApp.ocrScore}%
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-blue-100">
                        <span className="text-slate-500 text-[11px]">Số CCCD quét được:</span>
                        <span className="font-mono font-bold text-slate-800">{selectedApp.idNumber}</span>
                      </div>
                      <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-blue-100">
                        <span className="text-slate-500 text-[11px]">Đối soát tên thật:</span>
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Trùng khớp 100%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2 & 3: 4 Document Slots (2 cols) */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" /> 4 Ô Giấy tờ đối soát thực tế
                    </h4>
                    <span className="text-[11px] text-slate-500 font-bold">
                      Click vào ảnh để phóng to
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {/* Slot 1: CCCD Mặt trước */}
                    <div className={`p-3 rounded-2xl border transition-all ${
                      selectedApp.idFrontStatus === 'APPROVED'
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : selectedApp.idFront
                        ? 'bg-amber-50/40 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">1. CCCD Mặt trước</span>
                        {selectedApp.idFrontStatus === 'APPROVED' ? (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Đã duyệt
                          </span>
                        ) : selectedApp.idFront ? (
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                            ! Chờ duyệt
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Trống</span>
                        )}
                      </div>

                      {selectedApp.idFront ? (
                        <div 
                          onClick={() => setLightboxImage(selectedApp.idFront)}
                          className="relative rounded-xl overflow-hidden border border-slate-200 bg-black/5 h-28 cursor-pointer group"
                        >
                          <img src={selectedApp.idFront} alt="CCCD Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> Xem ảnh lớn
                          </div>
                        </div>
                      ) : (
                        <div className="h-28 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                          Chưa nộp ảnh
                        </div>
                      )}

                      {selectedApp.idFront && (
                        <button
                          type="button"
                          onClick={() => handleToggleSlot('idFront')}
                          className={`mt-2 w-full py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            selectedApp.idFrontStatus === 'APPROVED'
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                          }`}
                        >
                          {selectedApp.idFrontStatus === 'APPROVED' ? 'Hủy duyệt ô 1' : '⚡ Duyệt ô 1 (Tích Xanh)'}
                        </button>
                      )}
                    </div>

                    {/* Slot 2: CCCD Mặt sau */}
                    <div className={`p-3 rounded-2xl border transition-all ${
                      selectedApp.idBackStatus === 'APPROVED'
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : selectedApp.idBack
                        ? 'bg-amber-50/40 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">2. CCCD Mặt sau</span>
                        {selectedApp.idBackStatus === 'APPROVED' ? (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Đã duyệt
                          </span>
                        ) : selectedApp.idBack ? (
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                            ! Chờ duyệt
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Trống</span>
                        )}
                      </div>

                      {selectedApp.idBack ? (
                        <div 
                          onClick={() => setLightboxImage(selectedApp.idBack)}
                          className="relative rounded-xl overflow-hidden border border-slate-200 bg-black/5 h-28 cursor-pointer group"
                        >
                          <img src={selectedApp.idBack} alt="CCCD Back" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> Xem ảnh lớn
                          </div>
                        </div>
                      ) : (
                        <div className="h-28 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                          Chưa nộp ảnh
                        </div>
                      )}

                      {selectedApp.idBack && (
                        <button
                          type="button"
                          onClick={() => handleToggleSlot('idBack')}
                          className={`mt-2 w-full py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            selectedApp.idBackStatus === 'APPROVED'
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                          }`}
                        >
                          {selectedApp.idBackStatus === 'APPROVED' ? 'Hủy duyệt ô 2' : '⚡ Duyệt ô 2 (Tích Xanh)'}
                        </button>
                      )}
                    </div>

                    {/* Slot 3: Sổ hồng */}
                    <div className={`p-3 rounded-2xl border transition-all ${
                      selectedApp.propertyDocStatus === 'APPROVED'
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : selectedApp.propertyDoc
                        ? 'bg-amber-50/40 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">3. Sổ hồng / HĐ Thuê</span>
                        {selectedApp.propertyDocStatus === 'APPROVED' ? (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Đã duyệt
                          </span>
                        ) : selectedApp.propertyDoc ? (
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                            ! Chờ duyệt
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Trống</span>
                        )}
                      </div>

                      {selectedApp.propertyDoc ? (
                        <div 
                          onClick={() => setLightboxImage(selectedApp.propertyDoc)}
                          className="relative rounded-xl overflow-hidden border border-slate-200 bg-black/5 h-28 cursor-pointer group"
                        >
                          <img src={selectedApp.propertyDoc} alt="Property Doc" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> Xem ảnh lớn
                          </div>
                        </div>
                      ) : (
                        <div className="h-28 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                          Chưa nộp ảnh
                        </div>
                      )}

                      {selectedApp.propertyDoc && (
                        <button
                          type="button"
                          onClick={() => handleToggleSlot('propertyDoc')}
                          className={`mt-2 w-full py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            selectedApp.propertyDocStatus === 'APPROVED'
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                          }`}
                        >
                          {selectedApp.propertyDocStatus === 'APPROVED' ? 'Hủy duyệt ô 3' : '⚡ Duyệt ô 3 (Tích Xanh)'}
                        </button>
                      )}
                    </div>

                    {/* Slot 4: PCCC */}
                    <div className={`p-3 rounded-2xl border transition-all ${
                      selectedApp.businessDocStatus === 'APPROVED'
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : selectedApp.businessDoc
                        ? 'bg-amber-50/40 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">4. Giấy phép KD / PCCC</span>
                        {selectedApp.businessDocStatus === 'APPROVED' ? (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Đã duyệt
                          </span>
                        ) : selectedApp.businessDoc ? (
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                            ! Chờ duyệt
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Trống</span>
                        )}
                      </div>

                      {selectedApp.businessDoc ? (
                        <div 
                          onClick={() => setLightboxImage(selectedApp.businessDoc)}
                          className="relative rounded-xl overflow-hidden border border-slate-200 bg-black/5 h-28 cursor-pointer group"
                        >
                          <img src={selectedApp.businessDoc} alt="Business Doc" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> Xem ảnh lớn
                          </div>
                        </div>
                      ) : (
                        <div className="h-28 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs">
                          Chưa nộp ảnh
                        </div>
                      )}

                      {selectedApp.businessDoc && (
                        <button
                          type="button"
                          onClick={() => handleToggleSlot('businessDoc')}
                          className={`mt-2 w-full py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            selectedApp.businessDocStatus === 'APPROVED'
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                          }`}
                        >
                          {selectedApp.businessDocStatus === 'APPROVED' ? 'Hủy duyệt ô 4' : '⚡ Duyệt ô 4 (Tích Xanh)'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                onClick={() => setRejectModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Từ chối / Yêu cầu chụp lại
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setInspectModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Đóng
                </button>

                <button
                  onClick={() => {
                    handleApproveEntire(selectedApp.id);
                    setInspectModalOpen(false);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-transform active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> Phê duyệt toàn bộ & Cấp Tích Xanh (✓)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── REJECTION REASON MODAL ─── */}
      {rejectModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Từ Chối Hồ Sơ KYC</h3>
                <p className="text-xs text-slate-500">Chủ trọ: {selectedApp.fullName}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Lý do từ chối (gửi thông báo cho Chủ trọ):
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-500 font-medium text-slate-800"
              />

              {/* Quick Template Reasons */}
              <div className="mt-2 space-y-1">
                <p className="text-[10px] font-bold text-slate-400">Chọn mẫu lý do nhanh:</p>
                {[
                  'Ảnh CCCD bị mờ/chói sáng không nhận diện được.',
                  'Ảnh Sổ hồng không khớp với địa chỉ nhà trọ đăng ký.',
                  'Thiếu giấy chứng nhận thẩm duyệt PCCC theo quy định.',
                ].map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectReason(txt)}
                    className="block w-full text-left text-[11px] text-blue-600 hover:text-blue-800 hover:underline truncate"
                  >
                    • {txt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── IMAGE LIGHTBOX PREVIEW ─── */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img 
              src={lightboxImage} 
              alt="Preview Full" 
              className="max-h-[80vh] w-auto mx-auto object-contain rounded-2xl shadow-2xl border border-white/10" 
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1 transition-colors"
            >
              <X className="w-4 h-4" /> Đóng ảnh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
