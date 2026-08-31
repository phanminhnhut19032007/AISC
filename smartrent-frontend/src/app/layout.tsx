import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'RENTEASY - Quản lý trọ thông minh',
  description: 'Nền tảng số hóa quản lý chuỗi trọ & căn hộ mini',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { borderRadius: '10px', background: '#1e293b', color: '#fff' },
          }}
        />
      </body>
    </html>
  );
}
