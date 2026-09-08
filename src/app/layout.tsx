'use strict';

import type { Metadata } from "next";
import "./globals.css";

const dmSans = {
  variable: "--font-dm-sans",
};

export const metadata: Metadata = {
  title: "PFMS | Poultry Farm Management System",
  description: "Enterprise multi-farm management, AI telemetry, flock tracking, egg production logs, and cooperative intelligence platform",
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Poultry Farm Management System (PFMS)",
    description: "Enterprise multi-farm management, AI telemetry, flock tracking, and cooperative intelligence platform",
    type: "website",
    siteName: "Poultry Farm Management System",
  },
  twitter: {
    card: "summary_large_image",
    title: "PFMS | Poultry Farm Management System",
    description: "Enterprise multi-farm management, AI telemetry, and cooperative intelligence platform",
  },
};

import { WorkspaceProvider } from "@/components/features/WorkspaceContext";
import { LanguageProvider } from "@/components/features/LanguageContext";
import { TimeFilterProvider } from "@/components/features/TimeFilterContext";
import { WhiteLabelProvider } from "@/components/features/WhiteLabelContext";
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
            <WhiteLabelProvider>
              <WorkspaceProvider>
                {children}
                <InstallPrompt />
              </WorkspaceProvider>
            </WhiteLabelProvider>
          </TimeFilterProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
