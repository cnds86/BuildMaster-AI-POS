import { UserRole } from '../types';

/** Normalize role string to uppercase (source of truth for role storage) */
export function normalizeRole(role: string): UserRole {
  return role.toUpperCase() as UserRole;
}

/** Display label for a role — returns title-cased label */
export function roleLabel(role: string | undefined): string {
  if (!role) return '';
  const map: Record<string, string> = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    STAFF: 'Staff',
    CASHIER: 'Cashier',
  };
  return map[role.toUpperCase()] || role;
}

/** Check if user has one of the allowed roles (case-insensitive) */
export function hasRole(userRole: string | undefined, allowed: string[]): boolean {
  if (!userRole) return false;
  return allowed.map(r => r.toUpperCase()).includes(userRole.toUpperCase());
}
