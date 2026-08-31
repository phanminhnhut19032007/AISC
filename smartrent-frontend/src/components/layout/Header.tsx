'use client';
import { Bell, User, Wrench, FileText, ShoppingBag, MessageSquare, Check } from 'lucide-react';
import { getUser } from '@/lib/auth';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ticketsApi, invoicesApi, buildingsApi, Room } from '@/lib/api';

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
  const [user, setUser] = useState<{ id: string; role: string; full_name: string } | null>(null);
  const [roomNumber, setRoomNumber] = useState<string>('');
  
  // Notification states
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        // A. OPEN tickets reported by tenants
        tickets
          .filter((t) => t.status === 'OPEN')
          .forEach((t) => {
            const rNum = roomsMap[t.room_id] || 'cư dân';
            const notifId = `ticket_open_${t.id}`;
            list.push({
              id: notifId,
              title: 'Yêu cầu sửa chữa mới',
              content: `Phòng #${rNum} vừa báo sự cố: "${t.title}"`,
              type: 'TICKET',
              targetUrl: '/dashboard/tickets',
              isRead: readIds.includes(notifId),
              createdAt: t.created_at || new Date().toISOString()
            });
          });

        // B. UniPack orders - mock notifications can be stored in localStorage but synced
        const savedOrders = localStorage.getItem('unipack_orders');
        if (savedOrders) {
          const orders = JSON.parse(savedOrders);
          orders.forEach((o: any) => {
            const notifId = `order_${o.id}`;
            list.push({
              id: notifId,
              title: 'Đơn hàng UniPack mới',
              content: `Phòng ${o.roomNumber} đặt hàng: "${o.productName}"`,
              type: 'ORDER',
              targetUrl: '/dashboard/unipack',
              isRead: readIds.includes(notifId),
              createdAt: o.createdAt || new Date().toISOString()
            });
          });
        }
      } else {
        // Tenant notifications:
        // A. Invoices waiting for payment
        invoices
          .filter((inv) => inv.status === 'SENT' || inv.status === 'OVERDUE')
          .forEach((inv) => {
            const notifId = `invoice_${inv.id}_pending`;
            list.push({
              id: notifId,
              title: 'Hóa đơn tiền phòng mới',
              content: `Hóa đơn tháng ${inv.month}/${inv.year} đã được xuất. Số tiền: ${formatMoney(inv.total_amount)}`,
              type: 'INVOICE',
              targetUrl: '/dashboard',
              isRead: readIds.includes(notifId),
              createdAt: inv.due_date || new Date().toISOString()
            });
          });

        // B. Active tickets update status
        tickets
          .filter((t) => ['ASSIGNED', 'IN_PROGRESS', 'CLOSED'].includes(t.status))
          .forEach((t) => {
            const notifId = `ticket_status_${t.id}_${t.status}`;
            const statusVn = t.status === 'CLOSED' ? 'Đã giải quyết' : t.status === 'IN_PROGRESS' ? 'Đang sửa chữa' : 'Đã tiếp nhận';
            list.push({
              id: notifId,
              title: 'Cập nhật tiến độ sự cố',
              content: `Sự cố "${t.title}" của bạn đã đổi sang: ${statusVn}`,
              type: 'TICKET',
              targetUrl: '/dashboard/tickets',
              isRead: readIds.includes(notifId),
              createdAt: t.created_at || new Date().toISOString()
            });
          });
      }

      // Sort notifications by date descending
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(list);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    
    const savedRoom = localStorage.getItem('demo_tenant_room_code');
    if (savedRoom) {
      setRoomNumber(savedRoom);
    }

    // Initial fetch
    fetchLiveNotifications(currentUser);

    // Dynamic polling interval (every 10 seconds to keep synced)
    const interval = setInterval(() => {
      fetchLiveNotifications(currentUser);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // When dropdown opens, trigger a fresh fetch
  const handleDropdownToggle = () => {
    const nextShow = !showDropdown;
    setShowDropdown(nextShow);
    if (nextShow) {
      fetchLiveNotifications(user);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDisplayName = () => {
    if (user?.role === 'TENANT') {
      return `Phòng ${roomNumber || '101'}`;
    }
    return user?.full_name || 'Admin';
  };

  const getDisplayRole = () => {
    if (user?.role === 'TENANT') {
      return 'Người thuê';
    }
    if (user?.role === 'OWNER') {
      return 'Chủ trọ';
    }
    return user?.role || 'OWNER';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllRead = () => {
    const readIdsStr = localStorage.getItem('renteasy_read_notif_ids');
    const readIds: string[] = readIdsStr ? JSON.parse(readIdsStr) : [];
    
    notifications.forEach(n => {
      if (!readIds.includes(n.id)) {
        readIds.push(n.id);
      }
    });

    localStorage.setItem('renteasy_read_notif_ids', JSON.stringify(readIds));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleNotificationClick = (n: NotificationItem) => {
    // Add to read list in localStorage
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

    // Redirect to targets
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
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        
        {/* Notification Bell Dropdown wrapper */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={handleDropdownToggle}
            className={`relative p-2 rounded-xl transition-all ${
              showDropdown ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating Dropdown Popover */}
          {showDropdown && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-sm">Thông báo</h3>
                {notifications.length > 0 && (
                  <button 
                    onClick={handleMarkAllRead} 
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5" 
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
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Hệ thống thông báo RENTEASY</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-700">{getDisplayName()}</p>
            <p className="text-xs text-slate-400 font-semibold">{getDisplayRole()}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
