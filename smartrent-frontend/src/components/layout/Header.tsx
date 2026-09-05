'use client';
import { 
  Bell, User, Wrench, FileText, ShoppingBag, MessageSquare, Check, Menu, 
  UserCog, LogOut, X, Phone, Mail, Lock, KeyRound, Eye, EyeOff, Shield, RotateCcw, ChevronDown 
} from 'lucide-react';
import { getUser, clearAuth } from '@/lib/auth';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ticketsApi, invoicesApi, buildingsApi, authApi, Room } from '@/lib/api';
import toast from 'react-hot-toast';

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: 'TICKET' | 'INVOICE' | 'ORDER' | 'CHAT';
  targetUrl: string;
  isRead: boolean;
  createdAt: string;
}

export default function Header({ title }: { title: string }) {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; role: string; full_name: string; phone?: string; email?: string } | null>(null);
  const [roomNumber, setRoomNumber] = useState<string>('');
  
  // Notification states
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // User Profile Dropdown state
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Edit Profile Modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    email: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Change Password Modal states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  // Load notifications from live backend data
  const fetchLiveNotifications = async (currentUser: any) => {
    if (!currentUser) return;
    try {
      // 1. Fetch buildings list to load rooms for name matching
      const bRes = await buildingsApi.list();
      const roomsMap: Record<string, string> = {};
      for (const b of bRes.data) {
        try {
          const rRes = await buildingsApi.rooms(b.id);
          rRes.data.forEach((r: Room) => {
            roomsMap[r.id] = r.room_number;
          });
        } catch (e) {
          // ignore
        }
      }

      // 2. Fetch tickets and invoices
      const [tRes, invRes] = await Promise.all([
        ticketsApi.list(),
        invoicesApi.list()
      ]);

      const tickets = tRes.data || [];
      const invoices = invRes.data || [];

      // 3. Retrieve marked "read" IDs from localStorage
      const readIdsStr = localStorage.getItem('renteasy_read_notif_ids');
      const readIds: string[] = readIdsStr ? JSON.parse(readIdsStr) : [];

      const list: NotificationItem[] = [];

      if (currentUser.role === 'OWNER' || currentUser.role === 'SUPERADMIN') {
        // Owner notifications:
        tickets
          .filter((t) => t.status === 'OPEN')
          .forEach((t) => {
            const rNum = roomsMap[t.room_id] || 'cư dân';
            const id = `ticket_open_${t.id}`;
            list.push({
              id,
              title: `Báo cáo sự cố mới • Phòng #${rNum}`,
              content: t.title || 'Người thuê vừa gửi yêu cầu sửa chữa mới',
              type: 'TICKET',
              targetUrl: '/dashboard/tickets',
              isRead: readIds.includes(id),
              createdAt: t.created_at || new Date().toISOString(),
            });
          });

        invoices
          .filter((i) => i.status === 'SENT' || i.status === 'OVERDUE')
          .forEach((i) => {
            const rNum = roomsMap[i.room_id] || 'cư dân';
            const id = `invoice_${i.id}_pending`;
            list.push({
              id,
              title: `Hóa đơn T${i.month}/${i.year} • Phòng #${rNum}`,
              content: `Số tiền: ${formatMoney(i.total_amount)} - ${i.status === 'OVERDUE' ? 'Quá hạn đóng' : 'Đang chờ thu'}`,
              type: 'INVOICE',
              targetUrl: '/dashboard/invoices',
              isRead: readIds.includes(id),
              createdAt: new Date().toISOString(),
            });
          });
      } else {
        // Tenant notifications:
        invoices
          .filter((i) => i.status === 'SENT' || i.status === 'OVERDUE')
          .forEach((i) => {
            const id = `invoice_${i.id}_tenant`;
            list.push({
              id,
              title: `Hóa đơn tiền phòng T${i.month}/${i.year}`,
              content: `Tổng tiền: ${formatMoney(i.total_amount)}. Vui lòng thanh toán trước hạn.`,
              type: 'INVOICE',
              targetUrl: '/dashboard/invoices',
              isRead: readIds.includes(id),
              createdAt: new Date().toISOString(),
            });
          });

        tickets.forEach((t) => {
          if (t.status !== 'OPEN') {
            const id = `ticket_status_${t.id}_${t.status}`;
            const statusLabel = 
              t.status === 'IN_PROGRESS' ? 'Đang sửa chữa' : 
              t.status === 'CLOSED' ? 'Đã hoàn tất xử lý' : t.status;
            list.push({
              id,
              title: `Cập nhật sự cố: ${t.title}`,
              content: `Trạng thái: ${statusLabel}`,
              type: 'TICKET',
              targetUrl: '/dashboard/tickets',
              isRead: readIds.includes(id),
              createdAt: t.created_at || new Date().toISOString(),
            });
          }
        });
      }

      // UniPack demo orders
      try {
        const rawOrders = localStorage.getItem('renteasy_unipack_orders');
        if (rawOrders) {
          const orders = JSON.parse(rawOrders);
          orders.forEach((o: any) => {
            const id = `order_${o.id}`;
            list.push({
              id,
              title: `Đơn hàng UniPack #${o.id.slice(0, 6)}`,
              content: `Gói ${o.itemTitle} (Phòng #${o.roomNumber}) - ${o.status === 'PAID' ? 'Đã thanh toán' : 'Chờ giao hàng'}`,
              type: 'ORDER',
              targetUrl: '/dashboard/unipack',
              isRead: readIds.includes(id),
              createdAt: o.createdAt || new Date().toISOString(),
            });
          });
        }
      } catch (e) {
        // ignore
      }

      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(list);
    } catch (e) {
      // ignore
    }
  };

  const loadUserData = async () => {
    const currentUser = getUser();
    if (currentUser) {
      setUser(currentUser);
      setProfileForm({
        full_name: currentUser.full_name || '',
        phone: currentUser.phone || '',
        email: currentUser.email || ''
      });
      fetchLiveNotifications(currentUser);
    }

    try {
      const res = await authApi.me();
      if (res.data) {
        const updated = {
          id: res.data.id,
          full_name: res.data.full_name,
          role: res.data.role,
          phone: res.data.phone,
          email: res.data.email
        };
        setUser(updated);
        localStorage.setItem('smartrent_user', JSON.stringify(updated));
        setProfileForm({
          full_name: res.data.full_name || '',
          phone: res.data.phone || '',
          email: res.data.email || ''
        });
      }
    } catch (err) {
      // ignore
    }

    if (currentUser?.role === 'TENANT') {
      const storedRoom = localStorage.getItem('demo_tenant_room_code') || '101';
      setRoomNumber(storedRoom);
    }
  };

  useEffect(() => {
    loadUserData();

    const interval = setInterval(() => {
      const currentUser = getUser();
      if (currentUser) {
        fetchLiveNotifications(currentUser);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownToggle = () => {
    setShowDropdown(prev => !prev);
    setShowUserMenu(false);
  };

  const handleUserMenuToggle = () => {
    setShowUserMenu(prev => !prev);
    setShowDropdown(false);
  };

  const handleLogout = () => {
    clearAuth();
    toast.success('Đã đăng xuất tài khoản thành công');
    router.push('/login');
  };

  const handleOpenEditProfile = () => {
    setShowUserMenu(false);
    setProfileForm({
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      email: user?.email || ''
    });
    setShowEditProfileModal(true);
  };

  const handleOpenChangePassword = () => {
    setShowUserMenu(false);
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setShowCurrentPass(false);
    setShowNewPass(false);
    setShowConfirmPass(false);
    setShowChangePasswordModal(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.full_name.trim()) {
      return toast.error('Vui lòng nhập Họ và tên');
    }
    if (!profileForm.phone.trim()) {
      return toast.error('Vui lòng nhập Số điện thoại');
    }

    setSavingProfile(true);
    try {
      const payload: any = {
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim(),
        email: profileForm.email.trim() || undefined,
      };

      const res = await authApi.updateMe(payload);
      
      const updatedUser = {
        id: res.data.id,
        full_name: res.data.full_name,
        role: res.data.role,
        phone: res.data.phone,
        email: res.data.email
      };
      setUser(updatedUser);
      localStorage.setItem('smartrent_user', JSON.stringify(updatedUser));
      
      toast.success('Cập nhật thông tin cá nhân thành công!');
      setShowEditProfileModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Lỗi cập nhật thông tin cá nhân');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.current_password) {
      return toast.error('Vui lòng nhập mật khẩu hiện tại');
    }
    if (!passwordForm.new_password) {
      return toast.error('Vui lòng nhập mật khẩu mới');
    }
    if (passwordForm.new_password.length < 6) {
      return toast.error('Mật khẩu mới phải có tối thiểu 6 ký tự');
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error('Xác nhận mật khẩu mới không khớp');
    }

    setChangingPassword(true);
    try {
      await authApi.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });

      toast.success('Đổi mật khẩu thành công!');
      setShowChangePasswordModal(false);
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Mật khẩu hiện tại không chính xác');
    } finally {
      setChangingPassword(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getDisplayName = () => {
    if (user?.role === 'TENANT') {
      return `${user.full_name}`;
    }
    return user?.full_name || 'Admin';
  };

  const getDisplayRole = () => {
    if (user?.role === 'TENANT') {
      return `Cư dân phòng #${roomNumber || '101'}`;
    }
    return 'Chủ trọ / Quản lý';
  };

  const handleMarkAllRead = () => {
    const readIdsStr = localStorage.getItem('renteasy_read_notif_ids');
    const readIds: string[] = readIdsStr ? JSON.parse(readIdsStr) : [];
    
    notifications.forEach(n => {
      if (!readIds.includes(n.id)) {
        readIds.push(n.id);
      }
    });

    localStorage.setItem('renteasy_read_notif_ids', JSON.stringify(readIds));
    setNotifications(prev => prev.map(item => ({ ...item, isRead: true })));
  };

  const handleNotificationClick = (n: NotificationItem) => {
    const readIdsStr = localStorage.getItem('renteasy_read_notif_ids');
    const readIds: string[] = readIdsStr ? JSON.parse(readIdsStr) : [];
    if (!readIds.includes(n.id)) {
      readIds.push(n.id);
      localStorage.setItem('renteasy_read_notif_ids', JSON.stringify(readIds));
    }

    setNotifications(prev => prev.map(item => 
      item.id === n.id ? { ...item, isRead: true } : item
    ));
    setShowDropdown(false);

    router.push(n.targetUrl);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TICKET':
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'INVOICE':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'ORDER':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'CHAT':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 1000 / 60);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return new Date(isoString).toLocaleDateString('vi-VN');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 w-full max-w-full">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'));
          }}
          className="p-2 -ml-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden transition-colors flex-shrink-0"
          title="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-slate-800 truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        
        {/* 1. NOTIFICATION BELL DROPDOWN */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleDropdownToggle}
            className={`relative p-2 rounded-xl transition-all cursor-pointer ${
              showDropdown ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating Notification Popover */}
          {showDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 sm:w-88 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-sm">Thông báo</h3>
                {notifications.length > 0 && (
                  <button 
                    onClick={handleMarkAllRead} 
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer" 
                    title="Đọc tất cả"
                  >
                    <Check className="w-3.5 h-3.5" /> Đọc hết
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    Không có thông báo nào
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3.5 text-left cursor-pointer transition-colors flex gap-3 ${
                        n.isRead ? 'hover:bg-slate-50 bg-white' : 'bg-blue-50/40 hover:bg-blue-50/70'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-slate-800 truncate">{n.title}</span>
                          <span className="text-[9px] text-slate-400 flex-shrink-0 font-medium">{formatTimeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">{n.content}</p>
                      </div>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 self-center flex-shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 border-t border-slate-50 text-center bg-slate-50/50">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hệ thống thông báo REASY</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. USER PROFILE DROPDOWN WRAPPER */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={handleUserMenuToggle}
            className={`flex items-center gap-2.5 pl-2.5 pr-2 py-1.5 rounded-xl border transition-all cursor-pointer ${
              showUserMenu 
                ? 'bg-slate-100 border-slate-300 shadow-sm' 
                : 'hover:bg-slate-50 border-transparent hover:border-slate-200'
            }`}
            title="Tài khoản cá nhân"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm text-white font-bold text-xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight max-w-[130px] truncate">{getDisplayName()}</p>
              <p className="text-[10px] text-slate-400 font-semibold">{getDisplayRole()}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180 text-blue-600' : ''}`} />
          </button>

          {/* Floating User Menu Popover (Matching Design in media_1788608015491.png) */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2.5 w-72 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
              
              {/* User Header Summary */}
              <div className="p-4 bg-slate-900 text-white flex items-center gap-3.5">
                <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-md flex-shrink-0">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm text-white truncate">{getDisplayName()}</h4>
                  <span className="inline-block text-[10px] font-semibold text-slate-300 bg-white/10 px-2 py-0.5 rounded-md mt-1">
                    {getDisplayRole()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-2 space-y-1">
                {/* 1. Chỉnh sửa thông tin cá nhân */}
                <button
                  onClick={handleOpenEditProfile}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 transition-colors text-left cursor-pointer"
                >
                  <UserCog className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Chỉnh sửa thông tin cá nhân</span>
                </button>

                {/* 2. Đổi mật khẩu */}
                <button
                  onClick={handleOpenChangePassword}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 transition-colors text-left cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Đổi mật khẩu</span>
                </button>

                <div className="h-[1px] bg-slate-100 my-1" />

                {/* 3. Đăng xuất tài khoản */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. EDIT PROFILE MODAL */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowEditProfileModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <UserCog className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Thông tin cá nhân</h3>
                  <p className="text-[11px] text-slate-400">Cập nhật họ tên, số điện thoại &amp; email</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEditProfileModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {/* Họ và tên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Số điện thoại đăng nhập <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="0901234567"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Địa chỉ Email (Tùy chọn)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="example@reasy.vn"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary py-2.5 px-5 font-bold text-xs shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. CHANGE PASSWORD MODAL (Matching Exact Design in media_1788608039205.png) */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowChangePasswordModal(false)}>
          <div className="bg-[#f1f3f9] rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 sm:p-7" onClick={(e) => e.stopPropagation()}>
            
            {/* Header with rounded light blue box */}
            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#dbe8fc] text-[#2563eb] flex items-center justify-center shadow-xs">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-[#0f172a] text-lg">Đổi mật khẩu</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              
              {/* Mật khẩu hiện tại * */}
              <div>
                <label className="block text-xs font-bold text-[#0f172a] mb-1.5">
                  Mật khẩu hiện tại *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    required
                    value={passwordForm.current_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    placeholder="Nhập mật khẩu cũ"
                    className="w-full bg-[#e7ebf4]/70 border border-transparent rounded-xl pl-4 pr-10 py-3 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Mật khẩu mới * */}
              <div>
                <label className="block text-xs font-bold text-[#0f172a] mb-1.5">
                  Mật khẩu mới *
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự...)"
                    className="w-full bg-[#e7ebf4]/70 border border-transparent rounded-xl pl-4 pr-10 py-3 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới * */}
              <div>
                <label className="block text-xs font-bold text-[#0f172a] mb-1.5">
                  Xác nhận mật khẩu mới *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full bg-[#e7ebf4]/70 border border-transparent rounded-xl pl-4 pr-10 py-3 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {changingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
