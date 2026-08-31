import Cookies from 'js-cookie';

const TOKEN_KEY = 'smartrent_token';
const USER_KEY = 'smartrent_user';

export function saveAuth(token: string, user: { id: string; full_name: string; role: string }) {
  Cookies.set(TOKEN_KEY, token, { expires: 7 });
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
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
