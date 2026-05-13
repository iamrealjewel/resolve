export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  DEPARTMENT_HEAD: "DEPARTMENT_HEAD",
  LINE_MANAGER: "LINE_MANAGER",
  RESOLVER: "RESOLVER",
  USER: "USER",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const MENU_PERMISSIONS: Record<string, Role[]> = {
  "/dashboard": ["SUPER_ADMIN", "DEPARTMENT_HEAD", "LINE_MANAGER", "RESOLVER", "USER"],
  "/incidents": ["SUPER_ADMIN", "DEPARTMENT_HEAD", "LINE_MANAGER", "RESOLVER", "USER"],
  "/org": ["SUPER_ADMIN"],
  "/users": ["SUPER_ADMIN"],
  "/masters": ["SUPER_ADMIN"],
  "/audit-trail": ["SUPER_ADMIN", "DEPARTMENT_HEAD", "LINE_MANAGER", "RESOLVER", "USER"],
};

export function canAccess(role: string | undefined, path: string): boolean {
  if (!role) return false;
  
  // Find the matching base path
  const basePaths = Object.keys(MENU_PERMISSIONS);
  const matchingPath = basePaths.find(p => path === p || path.startsWith(p + "/"));
  
  if (!matchingPath) return true; // Allow access to undefined paths (like /profile)
  
  return MENU_PERMISSIONS[matchingPath].includes(role as Role);
}
