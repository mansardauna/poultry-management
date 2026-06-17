'use strict';
'use client';

import { createContext, useContext, useState } from 'react';

/**
 * Sidebar context value interface.
 */
interface SidebarContextValue {
  isMobileOpen: boolean;
  setIsMobileOpen: (v: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isMobileOpen: false,
  setIsMobileOpen: () => {},
});

/**
 * Provider for SidebarContext.
 * @param {Object} props
 * @param {React.ReactNode} props.children - The child elements.
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  return (
    <SidebarContext.Provider value={{ isMobileOpen, setIsMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

/**
 * Custom hook to use the SidebarContext.
 * @returns {SidebarContextValue} The sidebar context value.
 */
export function useSidebar() {
  return useContext(SidebarContext);
}
