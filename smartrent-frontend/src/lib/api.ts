import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('smartrent_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      Cookies.remove('smartrent_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ---- Types ----
export interface User {
  id: string;
  full_name: string;
  phone: string;
  role: string;
  email?: string;
}

export interface TokenResponse {
  access_token: string;
  user_id: string;
  role: string;
  full_name: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  owner_id: string;
  province?: string;
  total_floors?: number;
}

export interface Room {
  id: string;
  building_id: string;
  room_number: string;
  base_rent: number;
  electricity_rate: number;
  water_rate: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE';
  floor?: number;
  area_sqm?: number;
}

export interface Invoice {
  id: string;
  room_id: string;
  month: number;
  year: number;
  base_rent: number;
  electricity_amount: number;
  water_amount: number;
  service_fees_amount: number;
  total_amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  vietqr_code?: string;
  payment_reference?: string;
  due_date?: string;
  paid_at?: string;
}

export interface Ticket {
  id: string;
  room_id: string;
  tenant_id: string;
  title: string;
  description?: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_CONFIRM' | 'CLOSED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  image_urls?: string[];
  technician_id?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  building_id: string;
  sender_id: string;
  recipient_id?: string | null;
  sender_name: string;
  sender_role: string;
  recipient_name?: string | null;
  message: string;
  is_recalled: boolean;
  created_at: string;
}

// ---- Auth API ----
export const authApi = {
  login: (phone: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { phone, password }),
  register: (data: { full_name: string; phone: string; password: string; role: string }) =>
    api.post<TokenResponse>('/auth/register', data),
  me: () => api.get<User>('/auth/me'),
  updateMe: (data: { full_name?: string; phone?: string; email?: string; password?: string }) =>
    api.patch<User>('/auth/me', data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post<{ message: string }>('/auth/change-password', data),
};

// ---- Buildings API ----
export const buildingsApi = {
  list: (params?: { include_deleted?: boolean }) => api.get<Building[]>('/buildings', { params }),
  create: (data: Omit<Building, 'id' | 'owner_id'>) => api.post<Building>('/buildings', data),
  get: (id: string) => api.get<Building>(`/buildings/${id}`),
  rooms: (buildingId: string) => api.get<Room[]>(`/buildings/${buildingId}/rooms`),
  delete: (id: string) => api.delete(`/buildings/${id}`),
  restore: (id: string) => api.post<Building>(`/buildings/${id}/restore`),
};

// ---- Rooms API ----
export const roomsApi = {
  create: (data: {
    building_id: string;
    room_number: string;
    base_rent: number;
    electricity_rate?: number;
    water_rate?: number;
  }) => api.post<Room>('/rooms', data),
  get: (id: string) => api.get<Room>(`/rooms/${id}`),
  update: (id: string, data: Partial<Room>) => api.patch<Room>(`/rooms/${id}`, data),
  delete: (id: string) => api.delete(`/rooms/${id}`),
};

// ---- Invoices API ----
export const invoicesApi = {
  list: (params?: { room_id?: string; status?: string; include_deleted?: boolean }) =>
    api.get<Invoice[]>('/invoices', { params }),
  get: (id: string) => api.get<Invoice>(`/invoices/${id}`),
  generate: (data: { room_id: string; month: number; year: number }) =>
    api.post<Invoice>('/invoices/generate', data),
  markPaid: (id: string) => api.patch<Invoice>(`/invoices/${id}/mark-paid`),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  restore: (id: string) => api.post<Invoice>(`/invoices/${id}/restore`),
};

// ---- Tickets API ----
export const ticketsApi = {
  list: (params?: { room_id?: string; status?: string }) =>
    api.get<Ticket[]>('/tickets', { params }),
  get: (id: string) => api.get<Ticket>(`/tickets/${id}`),
  create: (data: { room_id: string; title: string; description?: string; priority?: string }) =>
    api.post<Ticket>('/tickets', data),
  assign: (id: string, technician_id: string) =>
    api.patch(`/tickets/${id}/assign`, { technician_id }),
  updateStatus: (id: string, status: string, resolution_note?: string) =>
    api.patch(`/tickets/${id}/status`, { status, resolution_note }),
};

// ---- OCR API ----
export const ocrApi = {
  uploadMeterImage: (formData: FormData) =>
    api.post('/meter-readings/ocr-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ---- Meter Readings API ----
export const meterReadingsApi = {
  create: (data: {
    room_id: string;
    meter_type: 'ELECTRICITY' | 'WATER';
    month: number;
    year: number;
    new_reading: number;
    is_manual: boolean;
    ocr_image_url?: string;
  }) => api.post('/meter-readings', data),
  listByRoom: (roomId: string) => api.get<any[]>(`/meter-readings/room/${roomId}`),
};

// ---- Chat API ----
export interface ChatMember {
  user_id: string;
  full_name: string;
  role: 'OWNER' | 'TENANT' | 'SUPERADMIN';
  room_number: string;
}

export const chatApi = {
  listMessages: (buildingId: string, recipientId?: string) =>
    api.get<ChatMessage[]>(`/chat/${buildingId}/messages`, {
      params: recipientId ? { recipient_id: recipientId } : {},
    }),
  sendMessage: (buildingId: string, message: string, recipientId?: string) =>
    api.post<ChatMessage>(`/chat/${buildingId}/messages`, { message, recipient_id: recipientId }),
  recallMessage: (buildingId: string, messageId: string) =>
    api.delete(`/chat/${buildingId}/messages/${messageId}`),
  listMembers: (buildingId: string) =>
    api.get<ChatMember[]>(`/chat/${buildingId}/members`),
};

// ---- Emergency SOS API ----
export interface EmergencyAlert {
  id: string;
  room_number: string;
  building_name: string;
  sender_id: string;
  sender_name: string;
  sender_phone: string;
  emergency_type: 'FIRE' | 'THEFT' | 'MEDICAL' | 'GAS_LEAK' | 'OTHER';
  description?: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  acknowledged_by?: string;
  created_at: string;
}

export const emergencyApi = {
  trigger: (data: {
    room_number?: string;
    building_name?: string;
    emergency_type: string;
    description?: string;
  }) => api.post<EmergencyAlert>('/emergency/sos', data),
  getActive: () => api.get<EmergencyAlert[]>('/emergency/active'),
  list: () => api.get<EmergencyAlert[]>('/emergency/list'),
  acknowledge: (id: string) => api.post<EmergencyAlert>(`/emergency/${id}/acknowledge`),
  resolve: (id: string) => api.post<EmergencyAlert>(`/emergency/${id}/resolve`),
};
