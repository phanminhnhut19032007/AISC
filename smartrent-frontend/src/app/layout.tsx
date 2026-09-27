import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'REASY - Quản lý trọ thông minh',
  description: 'Nền tảng số hóa quản lý chuỗi trọ & căn hộ mini',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
