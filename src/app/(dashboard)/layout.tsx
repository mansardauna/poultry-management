'use strict';
import { cookies } from 'next/headers';
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { Toaster } from 'react-hot-toast';

/**
 * DashboardLayout wraps all pages inside the `(dashboard)` route group.
 * It reads the `pfms_auth` cookie to determine the current user's role
 * and passes it to the Sidebar and Header components for role-based rendering.
 *
 * @param children - The dashboard page content to render inside the main area.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pfms_auth');
  const role = authCookie?.value || 'Staff';

  return (
    <SidebarProvider>
      <div className="h-full flex overflow-hidden">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '500',
              boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
              maxWidth: '380px',
            },
            success: {
              iconTheme: { primary: '#4f46e5', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#dc2626', secondary: '#fff' },
            },
          }}
        />
        <Sidebar role={role} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header role={role} />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
