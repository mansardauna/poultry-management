'use client';

import { createContext, useContext, useState } from 'react';

interface SidebarContextValue {
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isMobileOpen: false,
  setIsMobileOpen: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ isMobileOpen, setIsMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
