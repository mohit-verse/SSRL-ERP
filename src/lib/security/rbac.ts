import { UserRole, Profile } from '@/lib/types';
import { Permission, isPermissionGranted } from './permissions';

export class AuthenticationError extends Error {
  constructor(message: string = '401 Unauthorized: Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = '403 Forbidden: Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Validates that a user profile is active.
 * Throws AuthorizationError if account is deactivated.
 */
export function requireActiveUser(profile: Profile): void {
  if (!profile || !profile.is_active) {
    throw new AuthorizationError('403 Forbidden: Account is deactivated or profile does not exist');
  }
}

/**
 * Validates whether a user profile has an allowed role.
 */
export function requireRole(profile: Profile, allowedRoles: UserRole[]): void {
  requireActiveUser(profile);
  if (!allowedRoles.includes(profile.role)) {
    throw new AuthorizationError(`403 Forbidden: Role ${profile.role} is not authorized for this operation`);
  }
}

/**
 * Validates whether a user profile has a specific permission.
 */
export function requirePermission(profile: Profile, permission: Permission): void {
  requireActiveUser(profile);
  if (!isPermissionGranted(profile.role, permission)) {
    throw new AuthorizationError(`403 Forbidden: Permission ${permission} denied for role ${profile.role}`);
  }
}

/**
 * Prevents a user from modifying their own role or active state via standard routes.
 */
export function preventSelfRoleEscalation(currentUserId: string, targetUserId: string): void {
  if (currentUserId === targetUserId) {
    throw new AuthorizationError('403 Forbidden: Users cannot modify their own role or activation state');
  }
}

/**
 * Legacy/Helper compatibility function.
 */
export function authorizeUser(profile: Profile, allowedRoles: UserRole[]): void {
  requireRole(profile, allowedRoles);
}

export function isAuditorReadOnly(profile: Profile): boolean {
  return profile.role === 'CA_AUDITOR';
}
