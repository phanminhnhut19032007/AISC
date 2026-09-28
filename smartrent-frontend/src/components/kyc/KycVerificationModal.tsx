'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, AlertCircle, Clock, CheckCircle2, Upload, 
  FileText, Camera, Check, X, ArrowRight, Sparkles, Building2, 
  HelpCircle, Eye, RefreshCw, FileCheck, Award, ShieldAlert, Trash2, ImagePlus
} from 'lucide-react';
import { 
  getUser, updateUserVerification, UserAuthData, DocVerificationStatus, 
  areAll4KycDocsApproved, KycDocumentsData 
} from '@/lib/auth';

interface KycModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerifiedChange?: (newStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED') => void;
}

interface DocSlot {
  id: 'id_front' | 'id_back' | 'property' | 'business';
  title: string;
  subtitle: string;
  tag: string;
  image: string | null;
  status: DocVerificationStatus;
}

export default function KycVerificationModal({ isOpen, onClose, onVerifiedChange }: KycModalProps) {
  const [currentUser, setCurrentUser] = useState<UserAuthData | null>(null);
  
  // 4 KYC Document Slots State - Started EMPTY (No pre-filled photos)
  const [idFront, setIdFront] = useState<string | null>(null);
  const [idFrontStatus, setIdFrontStatus] = useState<DocVerificationStatus>('EMPTY');

  const [idBack, setIdBack] = useState<string | null>(null);
  const [idBackStatus, setIdBackStatus] = useState<DocVerificationStatus>('EMPTY');

  const [propertyDoc, setPropertyDoc] = useState<string | null>(null);
  const [propertyDocStatus, setPropertyDocStatus] = useState<DocVerificationStatus>('EMPTY');

  const [businessDoc, setBusinessDoc] = useState<string | null>(null);
  const [businessDocStatus, setBusinessDocStatus] = useState<DocVerificationStatus>('EMPTY');
  
  const [idNumber, setIdNumber] = useState<string>('079201008899');
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // File input refs
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);
  const propertyRef = useRef<HTMLInputElement>(null);
  const businessRef = useRef<HTMLInputElement>(null);

  // Sync state from current user data when modal opens
  useEffect(() => {
    if (isOpen) {
      const u = getUser();
      setCurrentUser(u);
      
      if (u?.kyc_documents) {
        const d = u.kyc_documents;
        setIdFront(d.id_card_front || null);
        setIdFrontStatus(d.id_card_front_status || (d.id_card_front ? 'PENDING' : 'EMPTY'));

        setIdBack(d.id_card_back || null);
        setIdBackStatus(d.id_card_back_status || (d.id_card_back ? 'PENDING' : 'EMPTY'));

        setPropertyDoc(d.property_doc || null);
        setPropertyDocStatus(d.property_doc_status || (d.property_doc ? 'PENDING' : 'EMPTY'));

        setBusinessDoc(d.business_license || null);
        setBusinessDocStatus(d.business_license_status || (d.business_license ? 'PENDING' : 'EMPTY'));

        if (d.id_number) setIdNumber(d.id_number);
      } else {
        // Completely empty slots by default (no placeholder images)
        setIdFront(null);
        setIdFrontStatus('EMPTY');
        setIdBack(null);
        setIdBackStatus('EMPTY');
        setPropertyDoc(null);
        setPropertyDocStatus('EMPTY');
        setBusinessDoc(null);
        setBusinessDocStatus('EMPTY');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate approved and filled counts
  const slots: DocSlot[] = [
    {
      id: 'id_front',
      title: '1. CCCD Mặt trước',
      subtitle: `Khớp tên ${currentUser?.full_name || 'Chủ trọ'}`,
      tag: 'Bắt buộc',
      image: idFront,
      status: idFront ? idFrontStatus : 'EMPTY',
    },
    {
      id: 'id_back',
      title: '2. CCCD Mặt sau',
      subtitle: 'Có vân tay & chip bảo mật',
      tag: 'Bắt buộc',
      image: idBack,
      status: idBack ? idBackStatus : 'EMPTY',
    },
    {
      id: 'property',
      title: '3. Sổ hồng / HĐ Thuê',
      subtitle: 'Chứng minh quyền quản lý nhà',
      tag: 'Bắt buộc',
      image: propertyDoc,
      status: propertyDoc ? propertyDocStatus : 'EMPTY',
    },
    {
      id: 'business',
      title: '4. Giấy phép KD / PCCC',
      subtitle: 'Đạt chuẩn an ninh PCCC',
      tag: 'Bắt buộc',
      image: businessDoc,
      status: businessDoc ? businessDocStatus : 'EMPTY',
    },
  ];

  const approvedCount = [
    idFront && idFrontStatus === 'APPROVED',
    idBack && idBackStatus === 'APPROVED',
    propertyDoc && propertyDocStatus === 'APPROVED',
    businessDoc && businessDocStatus === 'APPROVED',
  ].filter(Boolean).length;

  const uploadedCount = [idFront, idBack, propertyDoc, businessDoc].filter(Boolean).length;
  const isAll4Approved = approvedCount === 4;

  // Update local storage and fire global event
  const persistState = (
    nextFront: string | null, nextFrontSt: DocVerificationStatus,
    nextBack: string | null, nextBackSt: DocVerificationStatus,
    nextProp: string | null, nextPropSt: DocVerificationStatus,
    nextBiz: string | null, nextBizSt: DocVerificationStatus
  ) => {
    const nextDocs: KycDocumentsData = {
      id_card_front: nextFront,
      id_card_front_status: nextFrontSt,
      id_card_back: nextBack,
      id_card_back_status: nextBackSt,
      property_doc: nextProp,
      property_doc_status: nextPropSt,
      business_license: nextBiz,
      business_license_status: nextBizSt,
      id_number: idNumber,
      submitted_at: new Date().toISOString(),
    };

    const allAppr = areAll4KycDocsApproved(nextDocs);
    const newStatus = allAppr ? 'VERIFIED' : 'PENDING';
    
    updateUserVerification(newStatus, nextDocs);
    const updated = getUser();
    setCurrentUser(updated);
    if (onVerifiedChange) onVerifiedChange(newStatus);
  };

  // Upload file to specific slot -> status turns to PENDING with orange '!'
  const handleFileUpload = (
    slotId: 'id_front' | 'id_back' | 'property' | 'business',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        
        let nFront = idFront, nFrontSt = idFrontStatus;
        let nBack = idBack, nBackSt = idBackStatus;
        let nProp = propertyDoc, nPropSt = propertyDocStatus;
        let nBiz = businessDoc, nBizSt = businessDocStatus;

        if (slotId === 'id_front') {
          setIdFront(url);
          setIdFrontStatus('PENDING');
          nFront = url;
          nFrontSt = 'PENDING';

          setOcrScanning(true);
          setOcrSuccess(false);
          setTimeout(() => {
            setOcrScanning(false);
            setOcrSuccess(true);
          }, 800);
        } else if (slotId === 'id_back') {
          setIdBack(url);
          setIdBackStatus('PENDING');
          nBack = url;
          nBackSt = 'PENDING';
        } else if (slotId === 'property') {
          setPropertyDoc(url);
          setPropertyDocStatus('PENDING');
          nProp = url;
          nPropSt = 'PENDING';
        } else if (slotId === 'business') {
          setBusinessDoc(url);
          setBusinessDocStatus('PENDING');
          nBiz = url;
          nBizSt = 'PENDING';
        }

        persistState(nFront, nFrontSt, nBack, nBackSt, nProp, nPropSt, nBiz, nBizSt);
      };
      reader.readAsDataURL(file);
    }
  };

  // Approve single slot
  const handleToggleSlotApproval = (slotId: 'id_front' | 'id_back' | 'property' | 'business') => {
    let nFront = idFront, nFrontSt = idFrontStatus;
    let nBack = idBack, nBackSt = idBackStatus;
    let nProp = propertyDoc, nPropSt = propertyDocStatus;
    let nBiz = businessDoc, nBizSt = businessDocStatus;

    if (slotId === 'id_front' && idFront) {
      const next = idFrontStatus === 'APPROVED' ? 'PENDING' : 'APPROVED';
      setIdFrontStatus(next);
      nFrontSt = next;
    } else if (slotId === 'id_back' && idBack) {
      const next = idBackStatus === 'APPROVED' ? 'PENDING' : 'APPROVED';
      setIdBackStatus(next);
      nBackSt = next;
    } else if (slotId === 'property' && propertyDoc) {
      const next = propertyDocStatus === 'APPROVED' ? 'PENDING' : 'APPROVED';
      setPropertyDocStatus(next);
      nPropSt = next;
    } else if (slotId === 'business' && businessDoc) {
      const next = businessDocStatus === 'APPROVED' ? 'PENDING' : 'APPROVED';
      setBusinessDocStatus(next);
      nBizSt = next;
    }

    persistState(nFront, nFrontSt, nBack, nBackSt, nProp, nPropSt, nBiz, nBizSt);
  };

  // Remove single slot photo
  const handleRemoveSlot = (slotId: 'id_front' | 'id_back' | 'property' | 'business', e: React.MouseEvent) => {
    e.stopPropagation();
    let nFront = idFront, nFrontSt = idFrontStatus;
    let nBack = idBack, nBackSt = idBackStatus;
    let nProp = propertyDoc, nPropSt = propertyDocStatus;
    let nBiz = businessDoc, nBizSt = businessDocStatus;

    if (slotId === 'id_front') {
      setIdFront(null);
      setIdFrontStatus('EMPTY');
      nFront = null;
      nFrontSt = 'EMPTY';
      setOcrSuccess(false);
    } else if (slotId === 'id_back') {
      setIdBack(null);
      setIdBackStatus('EMPTY');
      nBack = null;
      nBackSt = 'EMPTY';
    } else if (slotId === 'property') {
      setPropertyDoc(null);
      setPropertyDocStatus('EMPTY');
      nProp = null;
      nPropSt = 'EMPTY';
    } else if (slotId === 'business') {
      setBusinessDoc(null);
      setBusinessDocStatus('EMPTY');
      nBiz = null;
      nBizSt = 'EMPTY';
    }

    persistState(nFront, nFrontSt, nBack, nBackSt, nProp, nPropSt, nBiz, nBizSt);
  };

  // 1-Click Load Demo Photos (Waiting for approval with orange '!')
  const handleLoadDemoPhotos = () => {
    const sampleFront = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=60';
    const sampleBack = 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60';
    const sampleProp = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=60';
    const sampleBiz = 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60';

    setIdFront(sampleFront);
    setIdFrontStatus('PENDING');

    setIdBack(sampleBack);
    setIdBackStatus('PENDING');

    setPropertyDoc(sampleProp);
    setPropertyDocStatus('PENDING');

    setBusinessDoc(sampleBiz);
    setBusinessDocStatus('PENDING');

    setOcrSuccess(true);

    persistState(sampleFront, 'PENDING', sampleBack, 'PENDING', sampleProp, 'PENDING', sampleBiz, 'PENDING');
  };

  // 1-Click Approve all 4 slots -> turns top-right header icon to Green Checkmark
  const handleApproveAll = () => {
    // If some slots have no photos, fill them with demo photos first
    const f = idFront || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop&q=60';
    const b = idBack || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=60';
    const p = propertyDoc || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=500&auto=format&fit=crop&q=60';
    const biz = businessDoc || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=500&auto=format&fit=crop&q=60';

    setIdFront(f);
    setIdFrontStatus('APPROVED');

    setIdBack(b);
    setIdBackStatus('APPROVED');

    setPropertyDoc(p);
    setPropertyDocStatus('APPROVED');

    setBusinessDoc(biz);
    setBusinessDocStatus('APPROVED');

    persistState(f, 'APPROVED', b, 'APPROVED', p, 'APPROVED', biz, 'APPROVED');
  };

  // Reset all to empty
  const handleResetAll = () => {
    setIdFront(null);
    setIdFrontStatus('EMPTY');

    setIdBack(null);
    setIdBackStatus('EMPTY');

    setPropertyDoc(null);
    setPropertyDocStatus('EMPTY');

    setBusinessDoc(null);
    setBusinessDocStatus('EMPTY');

    setOcrSuccess(false);

    persistState(null, 'EMPTY', null, 'EMPTY', null, 'EMPTY', null, 'EMPTY');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col my-auto max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3.5 relative z-10">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
              isAll4Approved
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 ring-2 ring-emerald-400/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {isAll4Approved ? (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">Xác Minh Pháp Lý Chủ Trọ (KYC 4 Ô)</h3>
                {isAll4Approved ? (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-in zoom-in-50">
                    <CheckCircle2 className="w-3 h-3" /> ĐÃ DUYỆT 4/4 Ô (TÍCH XANH)
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" /> ĐÃ DUYỆT {approvedCount}/4 Ô
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Chỉ khi duyệt đủ <b className="text-amber-300">cả 4 ô ảnh</b> thì icon tài khoản góc trên bên phải mới đổi thành <b className="text-emerald-400">Tích Xanh</b>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors relative z-10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Rule Banner */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <div className="text-xs font-bold text-slate-700">
                Tiến độ xét duyệt: <span className="text-blue-600 font-extrabold">{approvedCount}/4 ô hoàn thành</span>
              </div>
              <div className="w-32 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${isAll4Approved ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${(approvedCount / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Quick Demo Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {uploadedCount < 4 && (
                <button
                  type="button"
                  onClick={handleLoadDemoPhotos}
                  className="text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <ImagePlus className="w-3.5 h-3.5" /> Nạp 4 ảnh mẫu (!)
                </button>
              )}

              {!isAll4Approved ? (
                <button
                  type="button"
                  onClick={handleApproveAll}
                  className="text-[11px] font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> ⚡ Duyệt tất cả 4 ô (Tích Xanh)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-all cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Xóa ảnh / Reset lại
                </button>
              )}
            </div>
          </div>

          {/* Quy tắc giải thích trực quan */}
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 font-bold text-slate-600">
              <span className="w-2 h-2 rounded-full bg-slate-300" /> Chưa chèn ảnh = Trống
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-bold text-amber-700">
              <span className="w-3.5 h-3.5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">!</span> Chèn ảnh = Chấm than cam
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
              <span className="w-3.5 h-3.5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px]">✓</span> Đã duyệt = Tích xanh
            </span>
          </div>
        </div>

        {/* Body 4 Photo Slots Grid */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" /> 4 Ô Giấy tờ & Hồ sơ pháp lý
            </h4>

            {/* Hidden Input Files */}
            <input 
              type="file" 
              ref={idFrontRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleFileUpload('id_front', e)}
            />
            <input 
              type="file" 
              ref={idBackRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleFileUpload('id_back', e)}
            />
            <input 
              type="file" 
              ref={propertyRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleFileUpload('property', e)}
            />
            <input 
              type="file" 
              ref={businessRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleFileUpload('business', e)}
            />

            {/* 4 Cards Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              
              {/* ─── Ô 1: CCCD MẶT TRƯỚC ─── */}
              <div className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                idFront
                  ? idFrontStatus === 'APPROVED'
                    ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                    : 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                  : 'bg-white border-slate-200 hover:border-blue-300'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
                    {/* Badge trạng thái từng ô */}
                    {idFront ? (
                      idFrontStatus === 'APPROVED' ? (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> ĐÃ DUYỆT
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                          <span className="w-3 h-3 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">!</span> CHỜ DUYỆT
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Chưa có ảnh</span>
                    )}
                  </div>

                  <h5 className="font-bold text-slate-800 text-xs">CCCD Mặt trước</h5>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Khớp tên {currentUser?.full_name || 'Chủ trọ'}</p>
                </div>

                {/* Photo Display / Upload Area */}
                <div className="mt-3">
                  {idFront ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-28 group">
                      <img src={idFront} alt="CCCD Front" className="w-full h-full object-cover" />
                      
                      {/* Indicator Icon Over Image */}
                      <div className="absolute top-2 right-2 z-10">
                        {idFrontStatus === 'APPROVED' ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white" title="Ô này đã được duyệt">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white animate-pulse" title="Ô này đang chờ duyệt (Dấu chấm than cam)">
                            !
                          </div>
                        )}
                      </div>

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                        <button
                          type="button"
                          onClick={() => idFrontRef.current?.click()}
                          className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          title="Đổi ảnh khác"
                        >
                          Đổi ảnh
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSlot('id_front', e)}
                          className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg cursor-pointer"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => idFrontRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl h-28 flex flex-col items-center justify-center p-2 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-colors"
                    >
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[11px] font-bold text-blue-600">Chọn ảnh mặt trước</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG</span>
                    </div>
                  )}
                </div>

                {/* Individual Action Button */}
                {idFront && (
                  <button
                    type="button"
                    onClick={() => handleToggleSlotApproval('id_front')}
                    className={`mt-2.5 w-full py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      idFrontStatus === 'APPROVED'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    {idFrontStatus === 'APPROVED' ? (
                      <>Hủy duyệt ô 1</>
                    ) : (
                      <><Sparkles className="w-3 h-3" /> ⚡ Duyệt ô 1 (Tích Xanh)</>
                    )}
                  </button>
                )}
              </div>

              {/* ─── Ô 2: CCCD MẶT SAU ─── */}
              <div className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                idBack
                  ? idBackStatus === 'APPROVED'
                    ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                    : 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                  : 'bg-white border-slate-200 hover:border-blue-300'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
                    {idBack ? (
                      idBackStatus === 'APPROVED' ? (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> ĐÃ DUYỆT
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                          <span className="w-3 h-3 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">!</span> CHỜ DUYỆT
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Chưa có ảnh</span>
                    )}
                  </div>

                  <h5 className="font-bold text-slate-800 text-xs">CCCD Mặt sau</h5>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Vân tay & chip bảo mật</p>
                </div>

                {/* Photo Display / Upload Area */}
                <div className="mt-3">
                  {idBack ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-28 group">
                      <img src={idBack} alt="CCCD Back" className="w-full h-full object-cover" />
                      
                      <div className="absolute top-2 right-2 z-10">
                        {idBackStatus === 'APPROVED' ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white" title="Ô này đã được duyệt">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white animate-pulse" title="Ô này đang chờ duyệt (Dấu chấm than cam)">
                            !
                          </div>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                        <button
                          type="button"
                          onClick={() => idBackRef.current?.click()}
                          className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Đổi ảnh
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSlot('id_back', e)}
                          className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => idBackRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl h-28 flex flex-col items-center justify-center p-2 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-colors"
                    >
                      <Camera className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[11px] font-bold text-blue-600">Chọn ảnh mặt sau</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG</span>
                    </div>
                  )}
                </div>

                {idBack && (
                  <button
                    type="button"
                    onClick={() => handleToggleSlotApproval('id_back')}
                    className={`mt-2.5 w-full py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      idBackStatus === 'APPROVED'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    {idBackStatus === 'APPROVED' ? (
                      <>Hủy duyệt ô 2</>
                    ) : (
                      <><Sparkles className="w-3 h-3" /> ⚡ Duyệt ô 2 (Tích Xanh)</>
                    )}
                  </button>
                )}
              </div>

              {/* ─── Ô 3: SỔ HỒNG / HỢP ĐỒNG THUÊ ─── */}
              <div className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                propertyDoc
                  ? propertyDocStatus === 'APPROVED'
                    ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                    : 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                  : 'bg-white border-slate-200 hover:border-blue-300'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">3</span>
                    {propertyDoc ? (
                      propertyDocStatus === 'APPROVED' ? (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> ĐÃ DUYỆT
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                          <span className="w-3 h-3 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">!</span> CHỜ DUYỆT
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Chưa có ảnh</span>
                    )}
                  </div>

                  <h5 className="font-bold text-slate-800 text-xs">Sổ hồng / Sổ đỏ / HĐ</h5>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Quyền sở hữu / quản lý</p>
                </div>

                <div className="mt-3">
                  {propertyDoc ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-28 group">
                      <img src={propertyDoc} alt="Property Doc" className="w-full h-full object-cover" />
                      
                      <div className="absolute top-2 right-2 z-10">
                        {propertyDocStatus === 'APPROVED' ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white" title="Ô này đã được duyệt">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white animate-pulse" title="Ô này đang chờ duyệt (Dấu chấm than cam)">
                            !
                          </div>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                        <button
                          type="button"
                          onClick={() => propertyRef.current?.click()}
                          className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Đổi ảnh
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSlot('property', e)}
                          className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => propertyRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl h-28 flex flex-col items-center justify-center p-2 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-colors"
                    >
                      <FileText className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[11px] font-bold text-blue-600">Tải ảnh Sổ hồng</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, PDF</span>
                    </div>
                  )}
                </div>

                {propertyDoc && (
                  <button
                    type="button"
                    onClick={() => handleToggleSlotApproval('property')}
                    className={`mt-2.5 w-full py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      propertyDocStatus === 'APPROVED'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    {propertyDocStatus === 'APPROVED' ? (
                      <>Hủy duyệt ô 3</>
                    ) : (
                      <><Sparkles className="w-3 h-3" /> ⚡ Duyệt ô 3 (Tích Xanh)</>
                    )}
                  </button>
                )}
              </div>

              {/* ─── Ô 4: GIẤY PHÉP KD / PCCC ─── */}
              <div className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                businessDoc
                  ? businessDocStatus === 'APPROVED'
                    ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                    : 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200'
                  : 'bg-white border-slate-200 hover:border-blue-300'
              }`}>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-5 h-5 rounded-md bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">4</span>
                    {businessDoc ? (
                      businessDocStatus === 'APPROVED' ? (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" /> ĐÃ DUYỆT
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
                          <span className="w-3 h-3 bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">!</span> CHỜ DUYỆT
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Chưa có ảnh</span>
                    )}
                  </div>

                  <h5 className="font-bold text-slate-800 text-xs">Giấy phép KD / PCCC</h5>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Cam kết an toàn PCCC</p>
                </div>

                <div className="mt-3">
                  {businessDoc ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 h-28 group">
                      <img src={businessDoc} alt="Business Doc" className="w-full h-full object-cover" />
                      
                      <div className="absolute top-2 right-2 z-10">
                        {businessDocStatus === 'APPROVED' ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white" title="Ô này đã được duyệt">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white animate-pulse" title="Ô này đang chờ duyệt (Dấu chấm than cam)">
                            !
                          </div>
                        )}
                      </div>

                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                        <button
                          type="button"
                          onClick={() => businessRef.current?.click()}
                          className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Đổi ảnh
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSlot('business', e)}
                          className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => businessRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-xl h-28 flex flex-col items-center justify-center p-2 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-colors"
                    >
                      <Award className="w-6 h-6 text-slate-400 mb-1" />
                      <span className="text-[11px] font-bold text-blue-600">Tải ảnh PCCC / KD</span>
                      <span className="text-[10px] text-slate-400">JPG, PNG, PDF</span>
                    </div>
                  )}
                </div>

                {businessDoc && (
                  <button
                    type="button"
                    onClick={() => handleToggleSlotApproval('business')}
                    className={`mt-2.5 w-full py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      businessDocStatus === 'APPROVED'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    {businessDocStatus === 'APPROVED' ? (
                      <>Hủy duyệt ô 4</>
                    ) : (
                      <><Sparkles className="w-3 h-3" /> ⚡ Duyệt ô 4 (Tích Xanh)</>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* OCR Live Notification */}
            {ocrScanning && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-blue-700 text-xs font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                AI đang quét và đối soát thông tin họ tên CCCD...
              </div>
            )}
            {ocrSuccess && (
              <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                AI đã nhận diện: Họ tên khớp 100% với chủ tài khoản ({currentUser?.full_name}) - Số CCCD: {idNumber}
              </div>
            )}
          </div>

          {/* Lợi ích khi đạt Tích Xanh */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 via-blue-50 to-white border border-indigo-100">
            <h5 className="font-extrabold text-xs text-indigo-950 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" /> Quyền lợi đặc quyền khi duyệt đủ cả 4 ô (Tích Xanh):
            </h5>
            <ul className="text-xs text-slate-600 space-y-1.5 pl-2">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 stroke-[3]" />
                <span>Kích hoạt <b>Huy hiệu Tích Xanh bảo chứng</b> trên avatar góc phải và khắp hệ thống.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 stroke-[3]" />
                <span>Tăng <b>300% tỷ lệ người thuê liên hệ</b> nhờ độ tin cậy và minh bạch pháp lý nhà trọ.</span>
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
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
