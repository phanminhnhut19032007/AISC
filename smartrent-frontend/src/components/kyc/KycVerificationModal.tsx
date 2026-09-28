'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, AlertCircle, Clock, CheckCircle2, Upload, 
  FileText, Camera, Check, X, ArrowRight, Sparkles, Building2, 
  HelpCircle, Eye, RefreshCw, FileCheck, Award, ShieldAlert
} from 'lucide-react';
import { getUser, updateUserVerification, UserAuthData } from '@/lib/auth';

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifiedChange?: (newStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED') => void;
}

export default function KycVerificationModal({ isOpen, onClose, onVerifiedChange }: KycModalProps) {
  const [currentUser, setCurrentUser] = useState<UserAuthData | null>(null);
  const [activeTab, setActiveTab] = useState<'VIEW' | 'UPLOAD'>('VIEW');
  
  // KYC Form State
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idBack, setIdBack] = useState<string | null>(null);
  const [propertyDoc, setPropertyDoc] = useState<string | null>(null);
  const [businessDoc, setBusinessDoc] = useState<string | null>(null);
  
  const [propertyDocType, setPropertyDocType] = useState<'SO_HONG' | 'HOP_DONG_THUE'>('SO_HONG');
  const [idNumber, setIdNumber] = useState<string>('079201008899');
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // File input refs
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const propertyRef = useRef<HTMLInputElement>(null);
  const businessRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const u = getUser();
      setCurrentUser(u);
      
      // Load existing docs or prefill demo
      if (u?.kyc_documents) {
        setIdFront(u.kyc_documents.id_card_front || null);
        setIdBack(u.kyc_documents.id_card_back || null);
        setPropertyDoc(u.kyc_documents.property_doc || null);
        setBusinessDoc(u.kyc_documents.business_license || null);
        if (u.kyc_documents.id_number) setIdNumber(u.kyc_documents.id_number);
      } else {
        // Sample default preview docs for realistic showcase
        setIdFront('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=60');
        setIdBack('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60');
        setPropertyDoc('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=60');
        setBusinessDoc('https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60');
      }

      if (!u?.verification_status || u.verification_status === 'UNVERIFIED') {
        setActiveTab('UPLOAD');
      } else {
        setActiveTab('VIEW');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStatus = currentUser?.verification_status || 'PENDING';

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    triggerOcr: boolean = false
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setter(url);

        if (triggerOcr) {
          setOcrScanning(true);
          setOcrSuccess(false);
          setTimeout(() => {
            setOcrScanning(false);
            setOcrSuccess(true);
            setIdNumber('079201008899');
          }, 900);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitKyc = () => {
    setSubmitting(true);
    setTimeout(() => {
      const kycData = {
        id_card_front: idFront || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=60',
        id_card_back: idBack || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60',
        property_doc: propertyDoc || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=60',
        business_license: businessDoc || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60',
        id_number: idNumber || '079201008899',
        submitted_at: new Date().toISOString(),
      };

      updateUserVerification('PENDING', kycData);
      const updated = getUser();
      setCurrentUser(updated);
      setSubmitting(false);
      setActiveTab('VIEW');
      if (onVerifiedChange) onVerifiedChange('PENDING');
    }, 700);
  };

  // Demo toggle action: Instantly approve or reset
  const handleSetStatus = (newStatus: 'PENDING' | 'VERIFIED' | 'UNVERIFIED') => {
    updateUserVerification(newStatus, {
      approved_at: newStatus === 'VERIFIED' ? new Date().toISOString() : undefined,
    });
    const updated = getUser();
    setCurrentUser(updated);
    if (onVerifiedChange) onVerifiedChange(newStatus);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-auto max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg ${
              currentStatus === 'VERIFIED'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {currentStatus === 'VERIFIED' ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Xác Minh Danh Tính Chủ Trọ (KYC)</h3>
                {currentStatus === 'VERIFIED' ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ĐÃ XÁC MINH
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> CHỜ DUYỆT
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Bảo chứng tính pháp lý nhà trọ & tạo niềm tin tuyệt đối cho người thuê
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert Banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          {currentStatus === 'VERIFIED' ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    Tài khoản đã được bảo chứng chính chủ
                    <span className="inline-flex items-center text-[10px] font-extrabold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                      Tích Xanh Verified
                    </span>
                  </h4>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Hồ sơ CCCD, Sổ hồng & Giấy phép PCCC của bạn đã được kiểm duyệt hợp lệ.
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSetStatus('PENDING')}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors flex-shrink-0 shadow-sm"
                title="Bấm để test lại trạng thái chờ duyệt"
              >
                Chuyển về Chờ duyệt (Demo)
              </button>
            </div>
          ) : (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                  <Clock className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    Hồ sơ xác minh đang chờ xét duyệt
                    <span className="inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-md">
                      Dấu chấm than màu cam
                    </span>
                  </h4>
                  <p className="text-[11px] text-amber-800/90 mt-0.5">
                    Ban quản trị SmartRent đang tiến hành rà soát giấy tờ pháp lý của bạn (Ước tính: 1-2h làm việc).
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSetStatus('VERIFIED')}
                className="text-[11px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl transition-transform active:scale-95 shadow-md shadow-emerald-600/20 flex-shrink-0 flex items-center gap-1"
                title="Duyệt ngay để đổi dấu chấm than thành Tích xanh"
              >
                <Sparkles className="w-3.5 h-3.5" /> Duyệt ngay (Tích Xanh)
              </button>
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Quy trình 3 bước xác thực theo đúng sơ đồ */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" /> Hồ sơ giấy tờ xác thực pháp lý
            </h4>

            <div className="grid sm:grid-cols-3 gap-3.5">
              
              {/* Mục 1: CCCD 2 Mặt */}
              <div className={`p-4 rounded-2xl border transition-all ${
                idFront ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">1</span>
                  {idFront ? (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Đã nộp
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">Bắt buộc</span>
                  )}
                </div>
                <h5 className="font-bold text-slate-800 text-xs">CCCD 2 mặt chính chủ</h5>
                <p className="text-[11px] text-slate-500 mt-1">Khớp tên {currentUser?.full_name || 'Chủ tài khoản'}</p>
                
                {idFront && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-indigo-100 bg-white h-20 group">
                    <img src={idFront} alt="CCCD Front" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                      Xem ảnh
                    </div>
                  </div>
                )}
              </div>

              {/* Mục 2: Sổ hồng / Hợp đồng quản lý */}
              <div className={`p-4 rounded-2xl border transition-all ${
                propertyDoc ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">2</span>
                  {propertyDoc ? (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Đã nộp
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">Bắt buộc</span>
                  )}
                </div>
                <h5 className="font-bold text-slate-800 text-xs">Sổ hồng / Sổ đỏ hoặc HĐ thuê</h5>
                <p className="text-[11px] text-slate-500 mt-1">Quyền sở hữu hoặc ủy quyền quản lý</p>
                
                {propertyDoc && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-indigo-100 bg-white h-20 group">
                    <img src={propertyDoc} alt="Property Doc" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                      Xem ảnh
                    </div>
                  </div>
                )}
              </div>

              {/* Mục 3: Giấy phép KD / PCCC */}
              <div className={`p-4 rounded-2xl border transition-all ${
                businessDoc ? 'bg-indigo-50/40 border-indigo-200' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">3</span>
                  {businessDoc ? (
                    <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Đã nộp
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">Khuyến khích</span>
                  )}
                </div>
                <h5 className="font-bold text-slate-800 text-xs">Giấy phép KD & PCCC</h5>
                <p className="text-[11px] text-slate-500 mt-1">Đạt chuẩn an ninh trật tự & PCCC</p>
                
                {businessDoc && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-indigo-100 bg-white h-20 group">
                    <img src={businessDoc} alt="Business Doc" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                      Xem ảnh
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Upload Cập nhật giấy tờ */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" /> Tải lên / Cập nhật tài liệu xác thực
              </h4>
              <span className="text-[11px] text-slate-400">Định dạng JPG, PNG, PDF</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {/* Nút Upload CCCD Mặt trước */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">CCCD Mặt trước *</label>
                <div 
                  onClick={() => idFrontRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 text-center cursor-pointer bg-white transition-colors"
                >
                  <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-blue-600">Chọn ảnh mặt trước</span>
                  <input 
                    type="file" 
                    ref={idFrontRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, setIdFront, true)}
                  />
                </div>
              </div>

              {/* Nút Upload CCCD Mặt sau */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">CCCD Mặt sau *</label>
                <div 
                  onClick={() => idBackRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 text-center cursor-pointer bg-white transition-colors"
                >
                  <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-blue-600">Chọn ảnh mặt sau</span>
                  <input 
                    type="file" 
                    ref={idBackRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, setIdBack)}
                  />
                </div>
              </div>

              {/* Nút Upload Sổ hồng / HĐ */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Sổ hồng / Hợp đồng thuê QL *</label>
                <div 
                  onClick={() => propertyRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 text-center cursor-pointer bg-white transition-colors"
                >
                  <FileText className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-blue-600">Tải lên giấy tờ nhà đất</span>
                  <input 
                    type="file" 
                    ref={propertyRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, setPropertyDoc)}
                  />
                </div>
              </div>

              {/* Nút Upload Giấy phép KD */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Giấy phép PCCC / ĐKKD</label>
                <div 
                  onClick={() => businessRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-3 text-center cursor-pointer bg-white transition-colors"
                >
                  <ShieldCheck className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="text-xs font-bold text-blue-600">Tải lên chứng nhận PCCC</span>
                  <input 
                    type="file" 
                    ref={businessRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={(e) => handleFileUpload(e, setBusinessDoc)}
                  />
                </div>
              </div>
            </div>

            {/* OCR Auto matched display */}
            {ocrScanning && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-700 text-xs font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                AI đang quét và đối soát thông tin CCCD...
              </div>
            )}
            {ocrSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                AI đã nhận diện: Họ tên khớp 100% với chủ tài khoản ({currentUser?.full_name}) - Số CCCD: {idNumber}
              </div>
            )}
          </div>

          {/* Lợi ích khi đạt Tích Xanh */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-blue-50 to-white border border-indigo-100">
            <h5 className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Quyền lợi đặc quyền của Chủ trọ Tích Xanh:
            </h5>
            <ul className="text-xs text-slate-600 space-y-1.5 pl-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Hiển thị huy hiệu <b>Tích Xanh Verified</b> trên trang tìm kiếm và phòng trọ.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Tăng <b>300% tỷ lệ người thuê liên hệ</b> nhờ độ tin cậy và minh bạch pháp lý.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Được ưu tiên xuất hóa đơn điện tử và bảo hiểm cháy nổ nhà trọ.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="text-[11px] text-slate-400 font-semibold">
            Bảo mật thông tin theo tiêu chuẩn Nhà nước
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Đóng
            </button>

            <button
              onClick={handleSubmitKyc}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Đang gửi hồ sơ...' : 'Gửi lại hồ sơ kiểm duyệt'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
