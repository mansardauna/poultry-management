'use strict';

/**
 * Route permissions map defining which user roles can access each dashboard route.
 */
export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard': ['SuperAdmin', 'Admin', 'Manager', 'Staff'],
  '/dashboard/chickens': ['SuperAdmin', 'Admin', 'Manager', 'Staff'],
  '/dashboard/eggs': ['SuperAdmin', 'Admin', 'Manager', 'Staff'],
  '/dashboard/feed': ['SuperAdmin', 'Admin', 'Manager', 'Staff'],
  '/dashboard/settings': ['SuperAdmin', 'Admin', 'Manager', 'Staff'],
  '/dashboard/staff': ['SuperAdmin', 'Admin', 'Manager'],
  '/dashboard/housing': ['SuperAdmin', 'Admin', 'Manager'],
  '/dashboard/health': ['SuperAdmin', 'Admin', 'Manager'],
  '/dashboard/sales': ['SuperAdmin', 'Admin', 'Manager'],
  '/dashboard/inventory': ['SuperAdmin', 'Admin', 'Manager'],
  '/dashboard/contacts': ['SuperAdmin', 'Admin', 'Manager'],
  '/dashboard/enterprise': ['SuperAdmin', 'Admin', 'Manager'],
  '/dashboard/finance': ['SuperAdmin', 'Admin'],
  '/dashboard/cctv': ['SuperAdmin', 'Admin'],
  '/dashboard/admin': ['SuperAdmin'],
};

/**
 * Checks whether a given role is allowed to view a specific pathname.
 *
 * @param pathname The URL path (e.g. '/dashboard/finance')
 * @param role The user's role ('SuperAdmin', 'Admin', 'Manager', 'Staff')
 * @returns boolean
 */
export function isRouteAllowedForRole(pathname: string, role: string): boolean {
  // Normalize path by stripping query params or trailing slash
  const cleanPath = pathname.split('?')[0].replace(/\/$/, '') || '/dashboard';

  // SuperAdmin has access to everything
  if (role === 'SuperAdmin') {
    return true;
  }

  // Exact match
  if (ROUTE_PERMISSIONS[cleanPath]) {
    return ROUTE_PERMISSIONS[cleanPath].includes(role);
  }

  // Check prefix matches for nested routes (e.g. /dashboard/finance/new)
  for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (route !== '/dashboard' && cleanPath.startsWith(route)) {
      return allowedRoles.includes(role);
    }
  }

  // Default to allowed if general dashboard route
  return true;
}
