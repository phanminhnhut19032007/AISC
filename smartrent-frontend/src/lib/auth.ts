import Cookies from 'js-cookie';

const TOKEN_KEY = 'smartrent_token';
const USER_KEY = 'smartrent_user';

export interface UserAuthData {
  id: string;
  full_name: string;
  role: string;
  phone?: string;
  email?: string;
  verification_status?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  is_verified?: boolean;
  kyc_documents?: {
    id_card_front?: string;
    id_card_back?: string;
    property_doc?: string;
    business_license?: string;
    id_number?: string;
    submitted_at?: string;
    approved_at?: string;
  };
}

export function saveAuth(token: string, user: UserAuthData) {
  Cookies.set(TOKEN_KEY, token, { expires: 7 });
  if (typeof window !== 'undefined') {
    if (user.role === 'OWNER' && !user.verification_status) {
      user.verification_status = 'PENDING';
      user.is_verified = false;
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
    const parsed = JSON.parse(raw);
    if (parsed && parsed.role === 'OWNER' && !parsed.verification_status) {
      parsed.verification_status = 'PENDING';
    }
    return parsed;
  } catch {
    return null;
  }
}

export function updateUserVerification(status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED', kycData?: any) {
  if (typeof window === 'undefined') return;
  const user = getUser();
  if (user) {
    user.verification_status = status;
    user.is_verified = status === 'VERIFIED';
    if (kycData) {
      user.kyc_documents = { ...user.kyc_documents, ...kycData };
    }
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
