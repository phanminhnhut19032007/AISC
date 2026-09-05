import Sidebar from '@/components/layout/Sidebar';
import EmergencyAlertOverlay from '@/components/emergency/EmergencyAlertOverlay';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50 overflow-x-hidden w-full max-w-full">
      <Sidebar />
      <main className="flex-1 w-full md:ml-64 min-h-screen max-w-full overflow-x-hidden transition-all">
        {children}
      </main>
      {/* Realtime Fullscreen Emergency Alert Overlay for Landlord */}
      <EmergencyAlertOverlay />
    </div>
  );
}
