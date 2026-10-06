'use strict';
import { headers, cookies } from 'next/headers';
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { Toaster } from 'react-hot-toast';
import { AiLogger } from "@/components/features/ai/AiLogger";
import { Suspense } from 'react';

import { isRouteAllowedForRole } from "@/lib/permissions";
import { AccessDenied } from "@/components/layout/AccessDenied";
import { ImpersonationBanner } from "@/components/layout/ImpersonationBanner";

/**
 * DashboardLayout wraps all pages inside the `(dashboard)` route group.
 * It reads the `pfms_role` cookie or `x-user-role` header to determine the current user's role
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
  const headersList = await headers();
  const currentPath = headersList.get('x-current-path') || headersList.get('x-middleware-request-x-current-path') || '';
  const isSuperAdminPath = currentPath.startsWith('/dashboard/admin');
  const roleCookie = cookieStore.get('pfms_role')?.value;
  const headerRole = headersList.get('x-user-role');

  const isImpersonating = cookieStore.get('pfms_impersonate_by')?.value === 'superadmin';
  const impersonatedOrgName = cookieStore.get('pfms_impersonate_org_name')?.value;
  const impersonatedEmail = cookieStore.get('pfms_email')?.value;

  const isSuperAdmin = !isImpersonating && (
    isSuperAdminPath ||
    headerRole === 'SuperAdmin' ||
    roleCookie === 'SuperAdmin'
  );

  const role = isSuperAdmin ? 'SuperAdmin' : (roleCookie || headerRole || 'Admin');
  const tier = isSuperAdmin ? 'enterprise' : (cookieStore.get('pfms_tier')?.value || headersList.get('x-user-tier') || 'free');

  const isAllowed = !currentPath || isRouteAllowedForRole(currentPath, role);

  return (
    <SidebarProvider>
      <div className="h-full flex flex-col overflow-hidden">
        {isImpersonating && (
          <ImpersonationBanner 
            orgName={impersonatedOrgName} 
            adminEmail={impersonatedEmail} 
          />
        )}
        <div className="flex-1 flex overflow-hidden">
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
          <Suspense fallback={<div className="w-64 bg-indigo-950 hidden md:block" />}>
            <Sidebar role={role} tier={tier} />
          </Suspense>
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header role={role} tier={tier} />
            <main className={`flex-1 overflow-y-auto ${role === 'SuperAdmin' ? 'p-3 sm:p-5 md:p-6' : 'p-4 md:p-8'}`}>
              {isAllowed ? children : <AccessDenied role={role} path={currentPath} />}
            </main>
          </div>
          {role !== 'SuperAdmin' && <AiLogger role={role} />}
        </div>
      </div>
    </SidebarProvider>
  );
}
