'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2, LayoutDashboard,
  FileText, Wrench, LogOut, ShoppingBag, MessageSquare, X
} from 'lucide-react';
import { clearAuth, getUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/dashboard/buildings', label: 'Tòa nhà', icon: Building2 },
  { href: '/dashboard/invoices', label: 'Hóa đơn', icon: FileText },
  { href: '/dashboard/tickets', label: 'Bảo trì & Sửa chữa', icon: Wrench },
  { href: '/dashboard/unipack', label: 'Tiện ích UniPack', icon: ShoppingBag },
  { href: '/dashboard/chat', label: 'Chat', icon: MessageSquare },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());

    const handleToggle = () => setMobileOpen((prev) => !prev);
    const handleClose = () => setMobileOpen(false);

    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    window.addEventListener('close-mobile-sidebar', handleClose);
    return () => {
      window.removeEventListener('toggle-mobile-sidebar', handleToggle);
      window.removeEventListener('close-mobile-sidebar', handleClose);
    };
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  const filteredNavItems = navItems
    .filter((item) => {
      if (user?.role === 'TENANT') {
        // Tenant doesn't see buildings management tab in sidebar
        return item.href !== '/dashboard/buildings';
      }
      return true;
    })
    .map((item) => {
      if (user?.role === 'TENANT') {
        if (item.href === '/dashboard/invoices') {
          return { ...item, label: 'Hóa đơn phòng' };
        }
        if (item.href === '/dashboard/tickets') {
          return { ...item, label: 'Báo cáo sự cố' };
        }
      }
      return item;
    });

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-900 flex flex-col z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Logo & Brand */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group min-w-0">
            <div className="h-10 w-10 rounded-xl bg-white/95 p-1 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform overflow-hidden flex-shrink-0">
              <img src="/logo.jpg" alt="REASY Logo" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-wide bg-gradient-to-r from-amber-300 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  REASY
                </span>
              </div>
              <p className="text-slate-400 text-[11px] truncate">
                {user?.role === 'TENANT' ? 'Cư dân REASY' : 'Bảng điều khiển Admin'}
              </p>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg md:hidden hover:bg-white/10 transition-colors"
            title="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout Button */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </>
  );
}
