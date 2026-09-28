import Cookies from 'js-cookie';

const TOKEN_KEY = 'smartrent_token';
const USER_KEY = 'smartrent_user';

export type DocVerificationStatus = 'EMPTY' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycDocumentsData {
  id_card_front?: string | null;
  id_card_front_status?: DocVerificationStatus;
  id_card_back?: string | null;
  id_card_back_status?: DocVerificationStatus;
  property_doc?: string | null;
  property_doc_status?: DocVerificationStatus;
  business_license?: string | null;
  business_license_status?: DocVerificationStatus;
  id_number?: string;
  submitted_at?: string;
  approved_at?: string;
}

export interface UserAuthData {
  id: string;
  full_name: string;
  role: string;
  phone?: string;
  email?: string;
  verification_status?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  is_verified?: boolean;
  kyc_documents?: KycDocumentsData;
}

export function areAll4KycDocsApproved(docs?: KycDocumentsData): boolean {
  if (!docs) return false;
  return (
    !!docs.id_card_front && docs.id_card_front_status === 'APPROVED' &&
    !!docs.id_card_back && docs.id_card_back_status === 'APPROVED' &&
    !!docs.property_doc && docs.property_doc_status === 'APPROVED' &&
    !!docs.business_license && docs.business_license_status === 'APPROVED'
  );
}

export function saveAuth(token: string, user: UserAuthData) {
  Cookies.set(TOKEN_KEY, token, { expires: 7 });
  if (typeof window !== 'undefined') {
    if (user.role === 'OWNER') {
      const allApproved = areAll4KycDocsApproved(user.kyc_documents);
      user.verification_status = allApproved ? 'VERIFIED' : 'PENDING';
      user.is_verified = allApproved;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function getUser(): UserAuthData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed: UserAuthData = JSON.parse(raw);
    if (parsed && parsed.role === 'OWNER') {
      const allApproved = areAll4KycDocsApproved(parsed.kyc_documents);
      parsed.verification_status = allApproved ? 'VERIFIED' : (parsed.verification_status || 'PENDING');
      parsed.is_verified = allApproved;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function updateUserVerification(status?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED', kycData?: Partial<KycDocumentsData>) {
  if (typeof window === 'undefined') return;
  const user = getUser();
  if (user) {
    if (kycData) {
      user.kyc_documents = { ...user.kyc_documents, ...kycData };
    }
    
    const allApproved = areAll4KycDocsApproved(user.kyc_documents);
    const finalStatus = status !== undefined ? status : (allApproved ? 'VERIFIED' : 'PENDING');
    user.verification_status = finalStatus;
    user.is_verified = finalStatus === 'VERIFIED';

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent('smartrent_user_updated', { detail: user }));
  }
}

export function clearAuth() {
  Cookies.remove(TOKEN_KEY);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
