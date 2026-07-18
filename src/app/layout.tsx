'use strict';
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins"
});

/** Exported component/variable metadata */
export const metadata: Metadata = {
  title: "PFMS | Poultry Farm Management System",
  description: "Modern poultry farm operations platform",
};

import { WorkspaceProvider } from "@/components/features/WorkspaceContext";
import { LanguageProvider } from "@/components/features/LanguageContext";
import { TimeFilterProvider } from "@/components/features/TimeFilterContext";
import { Preloader } from "@/components/features/Preloader";
import { InstallPrompt } from "@/components/features/InstallPrompt";

/** Exported function default */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${poppins.variable} font-sans`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
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
