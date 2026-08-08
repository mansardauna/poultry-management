'use strict';
'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useSidebar } from './SidebarContext';
import {
  Box,
  ShoppingCart,
  Settings,
  Video,
  Menu,
  Home,
  Activity,
  Egg,
  Package,
  Users,
  LogOut,
  Wheat,
  CircleDollarSign,
  UserSquare2,
  Wrench,
  ChevronDown,
  Plus,
  X,
  Pencil,
  Trash2,
  Building2,
  ShieldCheck,
  Layout
} from 'lucide-react';
import clsx from 'clsx';
import { useWorkspace, Workspace } from '../features/WorkspaceContext';
import { OnboardingWizard } from '../features/onboarding/OnboardingWizard';
import { useLanguage } from '../features/LanguageContext';
import toast from 'react-hot-toast';

/**
 * Sidebar component properties.
 */
interface SidebarProps {
  role?: string;
  tier?: string;
}

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['Admin', 'Manager'] },
  { name: 'Batches', href: '/dashboard/chickens', icon: Package, roles: ['Admin', 'Manager', 'Staff'] },
  { name: 'Housing', href: '/dashboard/housing', icon: Home, roles: ['Admin', 'Manager'] },
  { name: 'Eggs', href: '/dashboard/eggs', icon: Egg, roles: ['Admin', 'Manager', 'Staff'] },
  { name: 'Feed', href: '/dashboard/feed', icon: Wheat, roles: ['Admin', 'Manager', 'Staff'] },
  { name: 'Health', href: '/dashboard/health', icon: Activity, roles: ['Admin', 'Manager'] },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Wrench, roles: ['Admin', 'Manager'] },
  { name: 'Contacts', href: '/dashboard/contacts', icon: UserSquare2, roles: ['Admin', 'Manager'] },
  { name: 'Finance', href: '/dashboard/finance', icon: CircleDollarSign, roles: ['Admin'] },
  { name: 'Sales & Invoices', href: '/dashboard/sales', icon: ShoppingCart, roles: ['Admin', 'Manager'] },
  { name: 'Staff Management', href: '/dashboard/staff', icon: Users, roles: ['Admin', 'Manager'] },
  { name: 'Enterprise Hub', href: '/dashboard/enterprise', icon: Building2, roles: ['Admin', 'Manager'] },
  { name: 'Super Admin Portal', href: '/dashboard/admin', icon: ShieldCheck, roles: ['SuperAdmin'] },
  { name: 'Landing CMS', href: '/dashboard/admin?tab=cms', icon: Layout, roles: ['SuperAdmin'] },
  { name: 'CCTV Monitoring', href: '/dashboard/cctv', icon: Video, roles: ['Admin'] },
];

const FARM_TYPES = ['Layer Farm', 'Broiler Farm', 'Hatchery', 'Mixed Use', 'Main'];

/**
 * Properties for EditBranchModal component.
 */
interface EditModalProps {
  workspace: Workspace;
  onClose: () => void;
  onSave: (name: string, type: string) => Promise<void>;
}

/**
 * Modal for editing branch properties.
 * @param {EditModalProps} props
 */
function EditBranchModal({ workspace, onClose, onSave }: EditModalProps) {
  const [name, setName] = useState(workspace.name);
  const [type, setType] = useState(workspace.type);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Branch name is required'); return; }
    setIsSaving(true);
    try {
      await onSave(name.trim(), type);
      toast.success('Branch updated successfully');
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to update branch');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Pencil className="text-indigo-600" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Edit Branch</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Branch Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              placeholder="e.g. North Side Broilers"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Farm Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              {FARM_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Main sidebar navigation component.
 * @param {SidebarProps} props
 */
export function Sidebar({ role = 'Admin', tier = 'free' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isMobileOpen, setIsMobileOpen } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { workspaces, activeWorkspace, isLoading, setActiveWorkspace, updateWorkspace, deleteWorkspace } = useWorkspace();
  const { texts } = useLanguage();

  const isAdmin = role === 'Admin' || role === 'SuperAdmin';
  const visibleItems = menuItems.filter(item => item.roles.includes(role));

  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';
  const planParam = searchParams.get('plan');
  const isUpgraded = searchParams.get('upgraded') === 'true';
  const [currentTier, setCurrentTier] = useState(tier);
  const [proPrice, setProPrice] = useState(15000);

  useEffect(() => {
    fetch('/api/admin/plans', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const proPlan = data.find((p: any) => p.id === 'pro');
          if (proPlan?.priceMonthly) setProPrice(proPlan.priceMonthly);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentTier(tier);
  }, [tier]);

  useEffect(() => {
    if (isUpgraded) {
      const qTier = searchParams.get('tier');
      if (qTier) {
        fetch('/api/checkout/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planTier: qTier, demo: true })
        }).then(res => res.json()).then(data => {
          if (data.tier) {
            setCurrentTier(data.tier);
          }
        });
      }
    }
  }, [isUpgraded, searchParams]);

  useEffect(() => {
    const hasDismissed = typeof window !== 'undefined' && localStorage.getItem('pfms_onboarded_dismissed') === 'true';
    if (isOnboarding && !hasDismissed) {
      setShowOnboarding(true);
    } else if (!isLoading && role === 'Admin' && workspaces.length === 0 && !hasDismissed) {
      setShowOnboarding(true);
    }
  }, [workspaces.length, role, isLoading, isOnboarding]);

  useEffect(() => {
    if (planParam === 'pro' && !isLoading) {
      const initiateCheckout = async () => {
        try {
          const res = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId: 'pro', isAnnual: false })
          });
          const data = await res.json();
          if (data.url) {
            window.location.href = data.url;
          }
        } catch (e) {
          toast.error('Failed to redirect to checkout');
        }
      };
      initiateCheckout();
    }
  }, [planParam, isLoading]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    document.cookie = 'pfms_workspace=; Max-Age=0; path=/;';
    document.cookie = 'pfms_org_id=; Max-Age=0; path=/;';
    document.cookie = 'pfms_tier=; Max-Age=0; path=/;';
    window.location.href = '/login';
  };

  const handleDelete = async (ws: Workspace) => {
    if (!confirm(`Are you sure you want to delete "${ws.name}"? All its data will remain but this branch will be removed.`)) return;
    setDeletingId(ws.id);
    try {
      await deleteWorkspace(ws.id);
      toast.success(`"${ws.name}" deleted`);
    } catch (err: unknown) {
      toast.error((err as Error)?.message || 'Failed to delete branch');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)} 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity cursor-pointer" 
        />
      )}

      {/* Sidebar Container */}
      <div 
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-indigo-950 text-indigo-100 transition-all duration-300 md:relative md:translate-x-0 md:z-auto",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-20 border-b border-indigo-900 px-4 relative">
          {!isCollapsed ? (
            <div className="relative flex-1">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between py-2 px-2 hover:bg-indigo-900 rounded-md transition-colors text-left"
              >
                <div className="flex items-center gap-2 truncate">
                  <Box size={24} className="text-blue-400 flex-shrink-0" />
                  <div className="flex flex-col truncate">
                    <span className="font-semibold text-white text-sm truncate">{activeWorkspace?.name || 'PFMS'}</span>
                    <span className="text-xs text-indigo-400">Workspace</span>
                  </div>
                </div>
                <ChevronDown size={16} className={clsx("text-indigo-400 transition-transform", isDropdownOpen && "rotate-180")} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-xl py-2 z-50 text-slate-800 max-h-64 overflow-y-auto scrollbar-sidebar">
                  <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Your Farms
                  </div>
                  {workspaces.map(ws => (
                    <div
                      key={ws.id}
                      className={clsx(
                        "flex items-center gap-1 pr-2 hover:bg-slate-50 transition-colors group",
                        activeWorkspace?.id === ws.id && "bg-blue-50"
                      )}
                    >
                      <button
                        onClick={() => {
                          setActiveWorkspace(ws);
                          setIsDropdownOpen(false);
                        }}
                        className={clsx(
                          "flex-1 text-left px-4 py-2 text-sm flex items-center gap-2",
                          activeWorkspace?.id === ws.id ? "text-blue-600 font-medium" : "text-slate-700"
                        )}
                      >
                        <span className="truncate">{ws.name}</span>
                        {activeWorkspace?.id === ws.id && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                      </button>
                      {/* Admin-only edit/delete buttons */}
                      {isAdmin && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsDropdownOpen(false);
                              setEditingWorkspace(ws);
                            }}
                            title="Edit branch"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          {ws.id !== 'main' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsDropdownOpen(false);
                                handleDelete(ws);
                              }}
                              title="Delete branch"
                              disabled={deletingId === ws.id}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {isAdmin && (
                    <div className="border-t border-slate-100 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          if (tier === 'free' && workspaces.length >= 1) {
                             toast.error('Free tier is limited to 1 branch. Upgrade to Pro for unlimited branches!');
                             router.push('/dashboard/settings');
                             return;
                          }
                          setShowOnboarding(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-2 font-medium"
                      >
                        <Plus size={16} /> Add new branch
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Box size={28} className="text-blue-400 mx-auto" />
          )}
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:block p-1 hover:bg-indigo-900 rounded-md text-indigo-400 ml-2"
          >
            <Menu size={24} />
          </button>
          
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1 hover:bg-indigo-900 rounded-md text-indigo-400"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4 scrollbar-sidebar scrollbar-custom">
          <nav className="space-y-1 px-3">
            {visibleItems.map((item) => {
              const isActive = item.href === '/dashboard' 
                ? pathname === '/dashboard' 
                : (pathname === item.href || pathname.startsWith(item.href + '/'));
                
              const isLocked = (item.name === 'CCTV Monitoring' && currentTier === 'free') || (item.name === 'Enterprise Hub' && currentTier !== 'enterprise');
                
              return (
                <Link
                  key={item.name}
                  href={isLocked ? '/dashboard/settings?tab=subscription' : item.href}
                  onClick={(e) => {
                     if (isLocked) {
                        e.preventDefault();
                        toast.error(
                          item.name === 'Enterprise Hub' 
                            ? 'Enterprise Hub is an Enterprise tier feature (₦45,000/mo). Upgrade to unlock!' 
                            : 'CCTV Monitoring is a Pro feature. Upgrade to unlock!'
                        );
                        router.push('/dashboard/settings?tab=subscription');
                        return;
                     }
                     setIsMobileOpen(false);
                  }}
                  className={clsx(
                    isActive ? 'bg-indigo-800 text-white' : 'hover:bg-indigo-900 hover:text-white',
                    isLocked && 'opacity-60 grayscale',
                    'group flex items-center px-3 py-3 text-sm font-semibold rounded-md transition-colors relative',
                    isCollapsed ? 'justify-center' : ''
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <item.icon
                    size={22}
                    className={clsx(
                      isActive ? 'text-blue-400' : 'text-indigo-400 group-hover:text-blue-300',
                      'flex-shrink-0 transition-colors',
                      isCollapsed ? 'mr-0' : 'mr-3'
                    )}
                  />
                  {!isCollapsed && (
                     <span className="truncate flex-1">
                        {texts.menu[item.name] || item.name}
                     </span>
                  )}
                  
                  {!isCollapsed && isLocked && (
                    <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">PRO</span>
                  )}
                  
                  {/* Active Indicator */}
                  {isActive && !isLocked && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        {/* Plan Upgrade Banner in Sidebar */}
        {!isCollapsed && role !== 'SuperAdmin' && currentTier === 'free' && (
          <div className="mx-3 mb-2 p-3 bg-gradient-to-r from-amber-500/20 to-indigo-500/20 border border-amber-500/30 rounded-xl text-center">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300">FREE STARTER</span>
              <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-1.5 py-0.2 rounded">1 Branch Limit</span>
            </div>
            <p className="text-[11px] text-indigo-200 mb-2 leading-tight">Unlock CCTV, Voice AI & Unlimited Branches!</p>
            <button
              onClick={() => {
                setIsMobileOpen(false);
                router.push('/dashboard/settings?tab=subscription');
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 rounded-md transition-colors shadow-sm cursor-pointer"
            >
              Upgrade to Pro (₦{proPrice.toLocaleString()}/mo)
            </button>
          </div>
        )}

        {!isCollapsed && role !== 'SuperAdmin' && currentTier !== 'free' && (
          <div className="mx-3 mb-2 px-3 py-2 bg-emerald-950/60 border border-emerald-500/30 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-[11px] font-extrabold text-emerald-300 uppercase tracking-wider truncate">
              {currentTier === 'entrepreneur' ? 'Entrepreneur' : currentTier === 'enterprise' ? 'Enterprise' : 'Pro'}
            </span>
          </div>
        )}

        {!isCollapsed && role === 'SuperAdmin' && (
          <div className="mx-3 mb-2 p-3 bg-indigo-950/80 border border-indigo-500/40 rounded-xl flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-indigo-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-indigo-300 uppercase truncate">Super Admin Control</p>
              <p className="text-[9px] text-indigo-400/80 truncate">Full System Management & CMS</p>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-indigo-900 flex flex-col gap-2">
          <Link
            href="/dashboard/settings"
            onClick={() => setIsMobileOpen(false)}
            className={clsx(
              "group flex items-center px-3 py-3 text-sm font-semibold rounded-md hover:bg-indigo-900 hover:text-white transition-colors",
              isCollapsed ? 'justify-center' : ''
            )}
            title={isCollapsed ? texts.menu.Settings : undefined}
          >
            <Settings size={22} className={clsx("text-indigo-400 group-hover:text-blue-300 flex-shrink-0 transition-colors", isCollapsed ? 'mr-0' : 'mr-3')} />
            {!isCollapsed && texts.menu.Settings}
          </Link>
          <button
            onClick={handleLogout}
            className={clsx(
              "group flex items-center w-full px-3 py-3 text-sm font-medium rounded-md text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors",
              isCollapsed ? 'justify-center' : ''
            )}
            title={isCollapsed ? texts.menu.Logout : undefined}
          >
            <LogOut size={22} className={clsx("flex-shrink-0 transition-colors", isCollapsed ? 'mr-0' : 'mr-3')} />
            {!isCollapsed && texts.menu.Logout}
          </button>
        </div>
      </div>
      
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {showOnboarding && (
        <OnboardingWizard onClose={() => {
          if (typeof window !== 'undefined') localStorage.setItem('pfms_onboarded_dismissed', 'true');
          setShowOnboarding(false);
          router.replace('/dashboard');
        }} />
      )}

      {editingWorkspace && (
        <EditBranchModal
          workspace={editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
          onSave={(name, type) => updateWorkspace(editingWorkspace.id, name, type)}
        />
      )}
    </>
  );
}
