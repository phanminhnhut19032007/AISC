'use client';
import { DocVerificationStatus, getUser, updateUserVerification } from './auth';

export interface KycApplication {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  buildingName: string;
  address: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  rejectionReason?: string;
  idNumber: string;
  idFront: string | null;
  idFrontStatus: DocVerificationStatus;
  idBack: string | null;
  idBackStatus: DocVerificationStatus;
  propertyDoc: string | null;
  propertyDocStatus: DocVerificationStatus;
  businessDoc: string | null;
  businessDocStatus: DocVerificationStatus;
  ocrMatched: boolean;
  ocrScore: number;
}

const STORAGE_KEY = 'reasy_admin_kyc_applications';

const DEFAULT_SAMPLE_APPLICATIONS: KycApplication[] = [
  {
    id: 'KYC-2026-001',
    userId: 'usr-owner-001',
    fullName: 'Trần Văn Mạnh',
    phone: '0988123456',
    email: 'manh.tran@gmail.com',
    buildingName: 'Chung cư Mini Tân Bình',
    address: '45/12 Bạch Đằng, P.2, Q. Tân Bình, TP.HCM',
    submittedAt: '2026-09-28T08:30:00Z',
    status: 'PENDING',
    idNumber: '079201008899',
    idFront: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    idFrontStatus: 'PENDING',
    idBack: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    idBackStatus: 'PENDING',
    propertyDoc: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80',
    propertyDocStatus: 'PENDING',
    businessDoc: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    businessDocStatus: 'PENDING',
    ocrMatched: true,
    ocrScore: 98,
  },
  {
    id: 'KYC-2026-002',
    userId: 'usr-owner-002',
    fullName: 'Lê Hoàng Yến',
    phone: '0912778899',
    email: 'yen.le@gmail.com',
    buildingName: 'Nhà trọ Cao Cấp KTX Làng ĐH',
    address: '12 Đường số 6, Linh Trung, TP. Thủ Đức',
    submittedAt: '2026-09-27T14:15:00Z',
    reviewedAt: '2026-09-27T16:00:00Z',
    reviewedBy: 'Admin REASY',
    status: 'VERIFIED',
    idNumber: '079198007722',
    idFront: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    idFrontStatus: 'APPROVED',
    idBack: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    idBackStatus: 'APPROVED',
    propertyDoc: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80',
    propertyDocStatus: 'APPROVED',
    businessDoc: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
    businessDocStatus: 'APPROVED',
    ocrMatched: true,
    ocrScore: 99,
  },
  {
    id: 'KYC-2026-003',
    userId: 'usr-owner-003',
    fullName: 'Phạm Minh Đức',
    phone: '0933556677',
    email: 'duc.pham@gmail.com',
    buildingName: 'Dãy Trọ Sinh Viên Bình Thạnh',
    address: '89 D2, P.25, Q. Bình Thạnh, TP.HCM',
    submittedAt: '2026-09-26T10:00:00Z',
    reviewedAt: '2026-09-26T11:30:00Z',
    reviewedBy: 'Admin REASY',
    status: 'REJECTED',
    rejectionReason: 'Ảnh Sổ hồng bị mờ góc không đọc được số thửa đất. Vui lòng chụp lại rõ nét.',
    idNumber: '079195003344',
    idFront: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
    idFrontStatus: 'APPROVED',
    idBack: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    idBackStatus: 'APPROVED',
    propertyDoc: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80',
    propertyDocStatus: 'REJECTED',
    businessDoc: null,
    businessDocStatus: 'EMPTY',
    ocrMatched: true,
    ocrScore: 94,
  },
];

export function getKycApplications(): KycApplication[] {
  if (typeof window === 'undefined') return DEFAULT_SAMPLE_APPLICATIONS;

  let stored: KycApplication[] = [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      stored = JSON.parse(raw);
    } catch {
      stored = DEFAULT_SAMPLE_APPLICATIONS;
    }
  } else {
    stored = DEFAULT_SAMPLE_APPLICATIONS;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }

  // Synchronize current logged-in owner user into the list
  const currentUser = getUser();
  if (currentUser && (currentUser.role === 'OWNER' || currentUser.role === 'SUPERADMIN')) {
    const existingIndex = stored.findIndex((a) => a.userId === currentUser.id);
    const docs = currentUser.kyc_documents;
    
    const liveApp: KycApplication = {
      id: existingIndex >= 0 ? stored[existingIndex].id : `KYC-${currentUser.id.slice(0, 6).toUpperCase()}`,
      userId: currentUser.id,
      fullName: currentUser.full_name || 'Chủ trọ hiện tại',
      phone: currentUser.phone || '0388430402',
      email: currentUser.email || 'chutro@reasy.vn',
      buildingName: 'Tòa nhà REASY Quản lý',
      address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
      submittedAt: docs?.submitted_at || new Date().toISOString(),
      reviewedAt: currentUser.verification_status === 'VERIFIED' ? (docs?.approved_at || new Date().toISOString()) : undefined,
      reviewedBy: currentUser.verification_status === 'VERIFIED' ? 'Admin REASY' : undefined,
      status: currentUser.verification_status === 'VERIFIED' ? 'VERIFIED' : (currentUser.verification_status === 'REJECTED' ? 'REJECTED' : 'PENDING'),
      idNumber: docs?.id_number || '079201008899',
      idFront: docs?.id_card_front || null,
      idFrontStatus: docs?.id_card_front_status || (docs?.id_card_front ? 'PENDING' : 'EMPTY'),
      idBack: docs?.id_card_back || null,
      idBackStatus: docs?.id_card_back_status || (docs?.id_card_back ? 'PENDING' : 'EMPTY'),
      propertyDoc: docs?.property_doc || null,
      propertyDocStatus: docs?.property_doc_status || (docs?.property_doc ? 'PENDING' : 'EMPTY'),
      businessDoc: docs?.business_license || null,
      businessDocStatus: docs?.business_license_status || (docs?.business_license ? 'PENDING' : 'EMPTY'),
      ocrMatched: true,
      ocrScore: 99,
    };

    if (existingIndex >= 0) {
      stored[existingIndex] = { ...stored[existingIndex], ...liveApp };
    } else {
      stored.unshift(liveApp);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  }

  return stored;
}

export function saveKycApplications(apps: KycApplication[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

// Approve entire application
export function approveKycApplication(appId: string, reviewerName: string = 'Admin REASY'): KycApplication | null {
  const apps = getKycApplications();
  const index = apps.findIndex((a) => a.id === appId);
  if (index === -1) return null;

  const app = apps[index];
  app.status = 'VERIFIED';
  app.reviewedAt = new Date().toISOString();
  app.reviewedBy = reviewerName;
  app.rejectionReason = undefined;

  // Make sure all 4 slots are approved
  app.idFrontStatus = 'APPROVED';
  app.idBackStatus = 'APPROVED';
  app.propertyDocStatus = 'APPROVED';
  app.businessDocStatus = 'APPROVED';

  // If this belongs to the logged-in user, update live user
  const currentUser = getUser();
  if (currentUser && currentUser.id === app.userId) {
    updateUserVerification('VERIFIED', {
      id_card_front: app.idFront || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
      id_card_front_status: 'APPROVED',
      id_card_back: app.idBack || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      id_card_back_status: 'APPROVED',
      property_doc: app.propertyDoc || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80',
      property_doc_status: 'APPROVED',
      business_license: app.businessDoc || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&auto=format&fit=crop&q=80',
      business_license_status: 'APPROVED',
      approved_at: new Date().toISOString(),
    });
  }

  saveKycApplications(apps);
  window.dispatchEvent(new CustomEvent('reasy_admin_kyc_updated'));
  return app;
}

// Reject application with reason
export function rejectKycApplication(appId: string, reason: string, reviewerName: string = 'Admin REASY'): KycApplication | null {
  const apps = getKycApplications();
  const index = apps.findIndex((a) => a.id === appId);
  if (index === -1) return null;

  const app = apps[index];
  app.status = 'REJECTED';
  app.rejectionReason = reason;
  app.reviewedAt = new Date().toISOString();
  app.reviewedBy = reviewerName;

  const currentUser = getUser();
  if (currentUser && currentUser.id === app.userId) {
    updateUserVerification('REJECTED');
  }

  saveKycApplications(apps);
  window.dispatchEvent(new CustomEvent('reasy_admin_kyc_updated'));
  return app;
}

// Toggle individual slot
export function toggleKycSlotApproval(
  appId: string,
  slot: 'idFront' | 'idBack' | 'propertyDoc' | 'businessDoc'
): KycApplication | null {
  const apps = getKycApplications();
  const index = apps.findIndex((a) => a.id === appId);
  if (index === -1) return null;

  const app = apps[index];
  const statusKey = `${slot}Status` as keyof KycApplication;
  const currentSt = app[statusKey] as DocVerificationStatus;
  const nextSt: DocVerificationStatus = currentSt === 'APPROVED' ? 'PENDING' : 'APPROVED';
  
  (app[statusKey] as any) = nextSt;

  const all4Approved =
    app.idFrontStatus === 'APPROVED' &&
    app.idBackStatus === 'APPROVED' &&
    app.propertyDocStatus === 'APPROVED' &&
    app.businessDocStatus === 'APPROVED';

  app.status = all4Approved ? 'VERIFIED' : 'PENDING';
  if (all4Approved) {
    app.reviewedAt = new Date().toISOString();
    app.reviewedBy = 'Admin REASY';
  }

  const currentUser = getUser();
  if (currentUser && currentUser.id === app.userId) {
    updateUserVerification(app.status, {
      [`${slot === 'idFront' ? 'id_card_front' : slot === 'idBack' ? 'id_card_back' : slot === 'propertyDoc' ? 'property_doc' : 'business_license'}_status`]: nextSt,
    });
  }

  saveKycApplications(apps);
  window.dispatchEvent(new CustomEvent('reasy_admin_kyc_updated'));
  return app;
}
