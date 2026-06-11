'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export interface Workspace {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  addWorkspace: (workspace: Workspace) => Promise<void>;
  updateWorkspace: (id: string, name: string, type: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const DEFAULT_WORKSPACE: Workspace = {
  id: 'main',
  name: 'Main Farm',
  type: 'Main',
  createdAt: new Date().toISOString(),
};

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    async function loadWorkspaces() {
      try {
        const res = await fetch('/api/workspaces');
        const data = res.ok ? await res.json() : [];
        const loadedWorkspaces = Array.isArray(data) && data.length > 0 ? data : [DEFAULT_WORKSPACE];

        setWorkspaces(loadedWorkspaces);

        const cookieWorkspaceId = Cookies.get('pfms_workspace');
        const found = loadedWorkspaces.find((workspace) => workspace.id === cookieWorkspaceId) ?? loadedWorkspaces[0];
        setActiveWorkspaceState(found);
        Cookies.set('pfms_workspace', found.id, { path: '/' });
      } catch (error) {
        console.error('Failed to load workspaces', error);
        setWorkspaces([DEFAULT_WORKSPACE]);
        setActiveWorkspaceState(DEFAULT_WORKSPACE);
        Cookies.set('pfms_workspace', DEFAULT_WORKSPACE.id, { path: '/' });
      }
    }

    loadWorkspaces();
  }, []);

  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    Cookies.set('pfms_workspace', workspace.id, { path: '/' });
    window.location.reload();
  };

  const addWorkspace = async (workspace: Workspace) => {
    const response = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workspace),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unable to create workspace' }));
      throw new Error(error?.error || 'Unable to create workspace');
    }

    const createdWorkspace = await response.json();
    const newWorkspaces = [...workspaces, createdWorkspace];
    setWorkspaces(newWorkspaces);
    setActiveWorkspace(createdWorkspace);
  };

  const updateWorkspace = async (id: string, name: string, type: string) => {
    const response = await fetch('/api/workspaces', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, type }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unable to update workspace' }));
      throw new Error(error?.error || 'Unable to update workspace');
    }

    setWorkspaces((prev) =>
      prev.map((ws) => (ws.id === id ? { ...ws, name, type } : ws))
    );
    if (activeWorkspace?.id === id) {
      setActiveWorkspaceState((prev) => prev ? { ...prev, name, type } : prev);
    }
  };

  const deleteWorkspace = async (id: string) => {
    if (id === 'main') throw new Error('Cannot delete the main workspace');

    const response = await fetch(`/api/workspaces?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unable to delete workspace' }));
      throw new Error(error?.error || 'Unable to delete workspace');
    }

    const newWorkspaces = workspaces.filter((ws) => ws.id !== id);
    setWorkspaces(newWorkspaces);

    if (activeWorkspace?.id === id) {
      const fallback = newWorkspaces[0] ?? DEFAULT_WORKSPACE;
      Cookies.set('pfms_workspace', fallback.id, { path: '/' });
      window.location.href = '/';
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <WorkspaceContext.Provider value={{ workspaces, activeWorkspace, setActiveWorkspace, addWorkspace, updateWorkspace, deleteWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
