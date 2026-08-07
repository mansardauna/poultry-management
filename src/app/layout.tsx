'use strict';

import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "PFMS | Poultry Farm Management System",
  description: "Enterprise multi-farm management, AI telemetry, and cooperative intelligence platform",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
};

import { WorkspaceProvider } from "@/components/features/WorkspaceContext";
import { LanguageProvider } from "@/components/features/LanguageContext";
import { TimeFilterProvider } from "@/components/features/TimeFilterContext";
import { Preloader } from "@/components/features/Preloader";
import { InstallPrompt } from "@/components/features/InstallPrompt";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${dmSans.variable} font-sans`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className="h-full bg-slate-50 text-slate-900 font-sans">
        <LanguageProvider>
          <TimeFilterProvider>
            <Preloader />
            <WorkspaceProvider>
              {children}
              <InstallPrompt />
            </WorkspaceProvider>
          </TimeFilterProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
