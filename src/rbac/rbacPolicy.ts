export * from './types';
import { UserRole, Permission, AppTab, RoleDefinition } from './types';

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  ADMIN: {
    role: 'ADMIN',
    name: 'System Administrator',
    category: 'Enterprise Administration',
    description: 'Full enterprise control over User Management, District Assignments, System Configurations, and Security Audit Logs.',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/80',
    badgeText: 'text-purple-800 dark:text-purple-300',
    badgeBorder: 'border-purple-300 dark:border-purple-800',
    canSwitchPersona: true,
    isDistrictBound: false,
    defaultTab: 'dashboard',
    permissions: [
      'dashboard.view',
      'dashboard.cross_district',
      'users.view',
      'users.manage',
      'users.role_assign',
      'users.status_toggle',
      'users.password_reset',
      'employees.view',
      'employees.manage',
      'reports.view',
      'reports.view_all_districts',
      'reports.create',
      'reports.edit',
      'reports.delete',
      'reports.review',
      'reports.approve',
      'reports.request_correction',
      'reports.export',
      'analytics.view',
      'audit.view',
      'settings.manage',
      'districts.manage',
    ],
    allowedTabs: [
      'dashboard',
      'submit',
      'my-reports',
      'all-reports',
      'review-queue',
      'reports-download',
      'users',
      'districts',
      'audit-log',
      'offline-sync',
    ],
  },

  HO_MANAGER: {
    role: 'HO_MANAGER',
    name: 'Head Office Manager',
    category: 'Head Office Oversight',
    description: 'Supervisory oversight over all 13 bank districts, review queue approvals, case endorsement, and national compliance metrics.',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/80',
    badgeText: 'text-blue-800 dark:text-blue-300',
    badgeBorder: 'border-blue-300 dark:border-blue-800',
    canSwitchPersona: false,
    isDistrictBound: false,
    defaultTab: 'dashboard',
    permissions: [
      'dashboard.view',
      'dashboard.cross_district',
      'employees.view',
      'reports.view',
      'reports.view_all_districts',
      'reports.review',
      'reports.approve',
      'reports.request_correction',
      'reports.export',
      'analytics.view',
      'audit.view',
      'districts.manage',
    ],
    allowedTabs: [
      'dashboard',
      'all-reports',
      'review-queue',
      'reports-download',
      'districts',
      'audit-log',
      'offline-sync',
    ],
  },

  HO_HR: {
    role: 'HO_HR',
    name: 'Head Office HR',
    category: 'Head Office Oversight',
    description: 'Head Office HR Operations Specialist managing national employee performance records, case clearances, and compliance reviews.',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/80',
    badgeText: 'text-cyan-800 dark:text-cyan-300',
    badgeBorder: 'border-cyan-300 dark:border-cyan-800',
    canSwitchPersona: false,
    isDistrictBound: false,
    defaultTab: 'dashboard',
    permissions: [
      'dashboard.view',
      'dashboard.cross_district',
      'employees.view',
      'employees.manage',
      'reports.view',
      'reports.view_all_districts',
      'reports.create',
      'reports.edit',
      'reports.review',
      'reports.approve',
      'reports.request_correction',
      'reports.export',
      'analytics.view',
    ],
    allowedTabs: [
      'dashboard',
      'submit',
      'my-reports',
      'all-reports',
      'review-queue',
      'reports-download',
      'districts',
      'offline-sync',
    ],
  },

  DISTRICT_MANAGER: {
    role: 'DISTRICT_MANAGER',
    name: 'District Manager',
    category: 'District Leadership',
    description: 'District operational head overseeing regional performance, case filings, disciplinary reviews, and follow-ups within their assigned district.',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80',
    badgeText: 'text-emerald-800 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-800',
    canSwitchPersona: false,
    isDistrictBound: true,
    defaultTab: 'dashboard',
    permissions: [
      'dashboard.view',
      'employees.view',
      'employees.manage',
      'reports.view',
      'reports.create',
      'reports.edit',
      'reports.review',
      'reports.export',
      'analytics.view',
    ],
    allowedTabs: [
      'dashboard',
      'submit',
      'my-reports',
      'reports-download',
      'districts',
      'offline-sync',
    ],
  },

  DISTRICT_HR: {
    role: 'DISTRICT_HR',
    name: 'District HR Officer',
    category: 'District Leadership',
    description: 'Filing, tracking, and resolving employee performance and disciplinary actions strictly within their designated bank district.',
    badgeBg: 'bg-teal-100 dark:bg-teal-950/80',
    badgeText: 'text-teal-800 dark:text-teal-300',
    badgeBorder: 'border-teal-300 dark:border-teal-800',
    canSwitchPersona: false,
    isDistrictBound: true,
    defaultTab: 'dashboard',
    permissions: [
      'dashboard.view',
      'employees.view',
      'reports.view',
      'reports.create',
      'reports.edit',
      'reports.export',
    ],
    allowedTabs: [
      'dashboard',
      'submit',
      'my-reports',
      'reports-download',
      'offline-sync',
    ],
  },

  BRANCH_MANAGER: {
    role: 'BRANCH_MANAGER',
    name: 'Branch Manager',
    category: 'Branch & Staff',
    description: 'Local branch leader monitoring branch staff performance, initiation of disciplinary incident reports, and corrective actions.',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/80',
    badgeText: 'text-orange-800 dark:text-orange-300',
    badgeBorder: 'border-orange-300 dark:border-orange-800',
    canSwitchPersona: false,
    isDistrictBound: true,
    defaultTab: 'dashboard',
    permissions: [
      'dashboard.view',
      'employees.view',
      'reports.view',
      'reports.create',
      'reports.export',
    ],
    allowedTabs: [
      'dashboard',
      'submit',
      'my-reports',
      'reports-download',
      'offline-sync',
    ],
  },

  EMPLOYEE: {
    role: 'EMPLOYEE',
    name: 'Bank Employee',
    category: 'Branch & Staff',
    description: 'Bank staff member with self-service viewing access to personal performance improvement plans and official records.',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-300 dark:border-slate-700',
    canSwitchPersona: false,
    isDistrictBound: true,
    defaultTab: 'dashboard',
    permissions: [
      'dashboard.view',
      'reports.view',
      'reports.export',
    ],
    allowedTabs: [
      'dashboard',
      'my-reports',
      'reports-download',
    ],
  },

  DIRECTOR: {
    role: 'DIRECTOR',
    name: 'District Director',
    category: 'District Leadership',
    description: 'Authorized regional signatory and executive concurrence official for disciplinary decisions in their district.',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/80',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-300 dark:border-amber-800',
    canSwitchPersona: false,
    isDistrictBound: true,
    defaultTab: 'dashboard',
    permissions: [
      'dashboard.view',
      'employees.view',
      'reports.view',
      'reports.create',
      'reports.edit',
      'reports.approve',
      'reports.review',
      'reports.export',
      'analytics.view',
    ],
    allowedTabs: [
      'dashboard',
      'submit',
      'my-reports',
      'reports-download',
      'districts',
      'offline-sync',
    ],
  },

  AUDITOR: {
    role: 'AUDITOR',
    name: 'Compliance Auditor',
    category: 'Head Office Oversight',
    description: 'Independent cross-district read-only inspection, procedural verification, and tamper-evident audit inspection.',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/80',
    badgeText: 'text-indigo-800 dark:text-indigo-300',
    badgeBorder: 'border-indigo-300 dark:border-indigo-800',
    canSwitchPersona: false,
    isDistrictBound: false,
    defaultTab: 'dashboard',
    permissions: [
      'dashboard.view',
      'dashboard.cross_district',
      'employees.view',
      'reports.view',
      'reports.view_all_districts',
      'reports.export',
      'analytics.view',
      'audit.view',
    ],
    allowedTabs: [
      'dashboard',
      'all-reports',
      'reports-download',
      'districts',
      'audit-log',
      'offline-sync',
    ],
  },
};

export const ALL_ROLES: UserRole[] = Object.keys(ROLE_DEFINITIONS) as UserRole[];

export function getRoleDefinition(role?: UserRole | string): RoleDefinition {
  if (role && role in ROLE_DEFINITIONS) {
    return ROLE_DEFINITIONS[role as UserRole];
  }
  return ROLE_DEFINITIONS.EMPLOYEE;
}

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  const def = getRoleDefinition(role);
  return def.permissions.includes(permission);
}

export function hasAnyPermission(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  const def = getRoleDefinition(role);
  return permissions.some((p) => def.permissions.includes(p));
}

export function hasAllPermissions(role: UserRole | undefined, permissions: Permission[]): boolean {
  if (!role) return false;
  const def = getRoleDefinition(role);
  return permissions.every((p) => def.permissions.includes(p));
}

export function canAccessTab(role: UserRole | undefined, tab: AppTab): boolean {
  if (!role) return false;
  const def = getRoleDefinition(role);
  return def.allowedTabs.includes(tab);
}

export function getAllowedTabsForRole(role: UserRole | undefined): AppTab[] {
  if (!role) return ['dashboard'];
  return getRoleDefinition(role).allowedTabs;
}

export function canPerformAction(
  role: UserRole | undefined,
  action: 'create' | 'edit' | 'delete' | 'view' | 'approve' | 'export',
  entity: 'reports' | 'users' | 'districts' | 'settings' | 'audit' | 'employees'
): boolean {
  if (!role) return false;

  switch (entity) {
    case 'reports':
      if (action === 'create') return hasPermission(role, 'reports.create');
      if (action === 'edit') return hasPermission(role, 'reports.edit');
      if (action === 'delete') return hasPermission(role, 'reports.delete');
      if (action === 'view') return hasPermission(role, 'reports.view');
      if (action === 'approve') return hasPermission(role, 'reports.approve') || hasPermission(role, 'reports.review');
      if (action === 'export') return hasPermission(role, 'reports.export');
      return false;

    case 'users':
      if (action === 'view') return hasPermission(role, 'users.view');
      if (action === 'create' || action === 'edit' || action === 'delete') {
        return hasPermission(role, 'users.manage');
      }
      return false;

    case 'employees':
      if (action === 'view') return hasPermission(role, 'employees.view');
      if (action === 'create' || action === 'edit' || action === 'delete') {
        return hasPermission(role, 'employees.manage');
      }
      return false;

    case 'districts':
      if (action === 'create' || action === 'edit' || action === 'delete') {
        return hasPermission(role, 'districts.manage');
      }
      return true;

    case 'settings':
      return hasPermission(role, 'settings.manage');

    case 'audit':
      return hasPermission(role, 'audit.view');

    default:
      return false;
  }
}
