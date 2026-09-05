import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../components/auth/AuthProvider';
import { ToastProvider } from '../components/ui/Toast';

export const metadata: Metadata = {
  title: 'Mini Kanban',
  description: 'A collaborative Kanban board for small teams.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans antialiased">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
