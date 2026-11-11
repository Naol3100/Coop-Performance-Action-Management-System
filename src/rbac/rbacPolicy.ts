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

export interface JobTitleMapping {
  title: string;
  role: UserRole;
  category: string;
  department: string;
  description: string;
  isKeyDesignation?: boolean;
  isDistrictBound?: boolean;
}

export const OFFICIAL_JOB_TITLES: JobTitleMapping[] = [
  // District HR Operations (HCBP & EPM Officers)
  {
    title: 'Human Capital Business Partner (HCBP)',
    role: 'DISTRICT_HR',
    category: 'District HR Operations',
    department: 'District Human Capital Operations',
    description: 'District HR business partnering, performance reviews, case submissions, and employee hearings.',
  },
  {
    title: 'Employee Performance Management Officer (EPM Officer)',
    role: 'DISTRICT_HR',
    category: 'District HR Operations',
    department: 'District Employee Performance & Ethics',
    description: 'Filing, tracking, and resolving employee performance actions and PIP monitoring at district level.',
  },
  {
    title: 'District HR Officer',
    role: 'DISTRICT_HR',
    category: 'District HR Operations',
    department: 'District HR Operations',
    description: 'District HR officer handling formal disciplinary filings and performance records.',
  },
  {
    title: 'Senior District HR Officer',
    role: 'DISTRICT_HR',
    category: 'District HR Operations',
    department: 'District HR Operations',
    description: 'Senior district HR specialist overseeing complex cases and branch reporting alignment.',
  },
  {
    title: 'District Employee Relations Officer',
    role: 'DISTRICT_HR',
    category: 'District HR Operations',
    department: 'District Employee Relations',
    description: 'Handles employee grievances, mediation, and disciplinary hearings within the district.',
  },

  // District Leadership & Regional Directorate
  {
    title: 'Authorized District Director',
    role: 'DIRECTOR',
    category: 'Executive Directorate',
    department: 'District Executive Directorate',
    description: 'Authorized regional signatory and executive concurrence official for disciplinary decisions.',
  },
  {
    title: 'District Director',
    role: 'DIRECTOR',
    category: 'Executive Directorate',
    department: 'District Executive Directorate',
    description: 'Executive director with final district approval on disciplinary recommendations.',
  },
  {
    title: 'District General Manager',
    role: 'DISTRICT_MANAGER',
    category: 'District Leadership',
    department: 'Regional Management Hub',
    description: 'District operational head overseeing regional performance, case filings, and follow-ups.',
  },
  {
    title: 'District Manager',
    role: 'DISTRICT_MANAGER',
    category: 'District Leadership',
    department: 'Regional Management Hub',
    description: 'Operational manager monitoring district branches and sanction enforcement.',
  },

  // Branch Operations & Management
  {
    title: 'Branch Manager',
    role: 'BRANCH_MANAGER',
    category: 'Branch Management',
    department: 'Branch Retail Operations',
    description: 'Local branch leader monitoring branch staff, incident reporting, and immediate corrective action.',
  },
  {
    title: 'Branch Operations Manager',
    role: 'BRANCH_MANAGER',
    category: 'Branch Management',
    department: 'Branch Operations Hub',
    description: 'Branch operations supervisor managing customer service, cash management, and staff discipline.',
  },
  {
    title: 'Assistant Branch Manager',
    role: 'BRANCH_MANAGER',
    category: 'Branch Management',
    department: 'Branch Retail Operations',
    description: 'Supports branch leadership with staff performance oversight and compliance filings.',
  },

  // Head Office HR Oversight & Performance
  {
    title: 'Head Office HR Operations & Performance Manager',
    role: 'HO_MANAGER',
    category: 'Head Office Oversight',
    department: 'Head Office HR Operations & Performance',
    description: 'Supervisory oversight over all 13 bank districts, review queue approvals, and national metrics.',
  },
  {
    title: 'Head Office HR Manager',
    role: 'HO_MANAGER',
    category: 'Head Office Oversight',
    department: 'Head Office HR Operations & Performance',
    description: 'Head Office manager directing nationwide employee performance review protocols.',
  },
  {
    title: 'Senior Head Office HR Specialist',
    role: 'HO_HR',
    category: 'Head Office Oversight',
    department: 'Employee Relations & Disciplinary Review',
    description: 'Senior specialist managing nationwide employee performance records and clearance reviews.',
  },
  {
    title: 'Head Office HR Specialist',
    role: 'HO_HR',
    category: 'Head Office Oversight',
    department: 'Employee Relations & Disciplinary Review',
    description: 'HO specialist reviewing district filings and ensuring labor law and bank policy adherence.',
  },
  {
    title: 'Head Office HR Officer',
    role: 'HO_HR',
    category: 'Head Office Oversight',
    department: 'Employee Relations & Disciplinary Review',
    description: 'Cross-district review officer processing appeals and formal clearance workflows.',
  },
  {
    title: 'National Employee Relations Specialist',
    role: 'HO_HR',
    category: 'Head Office Oversight',
    department: 'Corporate Employee Relations',
    description: 'Bank-wide employee relations specialist coordinating high-stakes disciplinary actions.',
  },

  // Compliance & Regulatory Audit
  {
    title: 'Lead HR & Operational Compliance Auditor',
    role: 'AUDITOR',
    category: 'Compliance & Audit',
    department: 'Internal Audit & Regulatory Compliance',
    description: 'Lead auditor performing immutable audit log inspection and procedural compliance verification.',
  },
  {
    title: 'Internal Compliance Auditor',
    role: 'AUDITOR',
    category: 'Compliance & Audit',
    department: 'Internal Audit & Regulatory Compliance',
    description: 'Independent cross-district read-only inspection and procedural audit verification.',
  },
  {
    title: 'Compliance Auditor',
    role: 'AUDITOR',
    category: 'Compliance & Audit',
    department: 'Internal Audit & Regulatory Compliance',
    description: 'Audits disciplinary actions against bank regulations and labor proclamations.',
  },

  // Enterprise Administration & Governance
  {
    title: 'Lead HR Enterprise Administrator',
    role: 'ADMIN',
    category: 'Enterprise Administration',
    department: 'Information Systems Directorate',
    description: 'Full enterprise control over User Management, District Assignments, and Security Audit Logs.',
  },
  {
    title: 'Enterprise System Administrator',
    role: 'ADMIN',
    category: 'Enterprise Administration',
    department: 'Information Systems Directorate',
    description: 'Administrator with full system configuration, user provisioning, and RBAC authority.',
  },
  {
    title: 'Senior System & Access Administrator',
    role: 'ADMIN',
    category: 'Enterprise Administration',
    department: 'Information Security & Access Control',
    description: 'Enterprise administrator managing authentication, access control lists, and security policies.',
  },
  {
    title: 'System Administrator',
    role: 'ADMIN',
    category: 'Enterprise Administration',
    department: 'Information Systems Directorate',
    description: 'System administrator with bank-wide user provisioning and oversight authority.',
  },

  // General Branch & Operations Personnel (Employee Self-Service)
  {
    title: 'Senior Teller & Vault Custodian',
    role: 'EMPLOYEE',
    category: 'Branch & Staff',
    department: 'Branch Cash & Vault Operations',
    description: 'Frontline staff member with personal performance improvement tracking and self-service view.',
  },
  {
    title: 'Commercial Credit Analyst',
    role: 'EMPLOYEE',
    category: 'Branch & Staff',
    department: 'Credit Analysis & Underwriting',
    description: 'Credit analyst staff with personal record access and PIP view.',
  },
  {
    title: 'Customer Service Officer',
    role: 'EMPLOYEE',
    category: 'Branch & Staff',
    department: 'Retail Banking Services',
    description: 'Customer-facing staff member with access to personal personnel disciplinary records.',
  },
  {
    title: 'Junior Loan Officer',
    role: 'EMPLOYEE',
    category: 'Branch & Staff',
    department: 'Credit & Microfinance',
    description: 'Branch loan officer with personal portal view for active PIPs and notices.',
  },
  {
    title: 'Bank Staff',
    role: 'EMPLOYEE',
    category: 'Branch & Staff',
    department: 'Retail Operations',
    description: 'General bank staff with self-service view of personal files.',
  },
  {
    title: 'Bank Employee',
    role: 'EMPLOYEE',
    category: 'Branch & Staff',
    department: 'Branch Banking',
    description: 'Standard employee account for viewing personal performance improvement plans.',
  },
];

export function mapJobTitleToRole(title: string | undefined | null): UserRole {
  if (!title) return 'DISTRICT_HR';
  const clean = title.trim().toLowerCase();

  // 1. Direct match in OFFICIAL_JOB_TITLES
  const exact = OFFICIAL_JOB_TITLES.find((t) => t.title.toLowerCase() === clean);
  if (exact) return exact.role;

  // 2. Keyword heuristic matching
  if (clean.includes('admin') || clean.includes('enterprise system') || clean.includes('system administrator')) {
    return 'ADMIN';
  }
  if (clean.includes('director') || clean.includes('authorized district director')) {
    return 'DIRECTOR';
  }
  if (clean.includes('auditor') || clean.includes('compliance')) {
    return 'AUDITOR';
  }
  if (
    clean.includes('ho manager') ||
    clean.includes('head office manager') ||
    clean.includes('head office hr manager') ||
    clean.includes('operations & performance manager')
  ) {
    return 'HO_MANAGER';
  }
  if (clean.includes('ho hr') || clean.includes('head office hr') || (clean.includes('head office') && clean.includes('specialist'))) {
    return 'HO_HR';
  }
  if (clean.includes('district manager') || clean.includes('general manager')) {
    return 'DISTRICT_MANAGER';
  }
  if (clean.includes('branch manager') || clean.includes('branch operations manager')) {
    return 'BRANCH_MANAGER';
  }
  if (
    clean.includes('hcbp') ||
    clean.includes('human capital') ||
    clean.includes('epm') ||
    clean.includes('district hr') ||
    clean.includes('performance management')
  ) {
    return 'DISTRICT_HR';
  }

  // 3. Fallback for staff/teller/officer without higher keywords
  if (clean.includes('teller') || clean.includes('analyst') || clean.includes('staff') || clean.includes('employee')) {
    return 'EMPLOYEE';
  }

  // Default to District HR if in doubt, as this system is primarily used by district HR officers
  return 'DISTRICT_HR';
}

export function getJobTitleDetails(title: string | undefined | null) {
  const role = mapJobTitleToRole(title);
  const roleDef = getRoleDefinition(role);
  const matched = OFFICIAL_JOB_TITLES.find((t) => t.title.toLowerCase() === (title || '').trim().toLowerCase());

  // Authority level and core responsibilities derived from role
  let authorityLevel = 'Level 4: Staff Member (Self-Service PIP Access)';
  let responsibilities: string[] = ['View Personal Improvement Plan', 'Read-Only Document Access'];

  if (role === 'ADMIN') {
    authorityLevel = 'Level 1: Enterprise System Administrator (Full Governance)';
    responsibilities = [
      'Bank-Wide User Account Provisioning & RBAC Control',
      'All 13 Autonomous Districts Configuration & Regional Director Alignment',
      'Tamper-Evident Security Audit Logs & Session Oversight',
      'Emergency Account Lock & Credential Reset',
    ];
  } else if (role === 'HO_MANAGER') {
    authorityLevel = 'Level 2: Head Office Supervisory Oversight (13 Districts)';
    responsibilities = [
      'National Case Clearance Queue Approval & Escalations',
      'Cross-District Disciplinary Review & Policy Enforcement',
      'Sanction Concurrence & Executive HR Oversight',
      'Bank-Wide Compliance Performance Analytics',
    ];
  } else if (role === 'HO_HR') {
    authorityLevel = 'Level 2: Head Office HR Specialist (Cross-District)';
    responsibilities = [
      'National Employee Performance & Sanctions Management',
      'HO Clearance Review & District Guidance',
      'Central Disciplinary Registry Records Clearance',
    ];
  } else if (role === 'DIRECTOR') {
    authorityLevel = 'Level 2: District Executive Directorate (Regional Concurrence)';
    responsibilities = [
      'Authorized District Director Signatory Concurrence',
      'District Case Resolution Review & Executive Endorsement',
      'District Operations & Disciplinary Closure Sign-off',
    ];
  } else if (role === 'DISTRICT_MANAGER') {
    authorityLevel = 'Level 3: District Operational Management';
    responsibilities = [
      'District Disciplinary Action Reviews & Follow-Up',
      'District Branch Performance Monitoring & Corrective Actions',
      'Regional Disciplinary Concurrence & Action Tracking',
    ];
  } else if (role === 'DISTRICT_HR') {
    authorityLevel = 'Level 3: District Operational HR Authority (Autonomous)';
    responsibilities = [
      'District Disciplinary Report Creation & Investigation Filing',
      'District Performance Improvement Plan (PIP) Initiation & Review',
      'District Hearing Minutes & Documentation Attachment',
      'Official Case Submission to Head Office Review Queue',
    ];
  } else if (role === 'BRANCH_MANAGER') {
    authorityLevel = 'Level 4: Branch Leadership & Incident Monitoring';
    responsibilities = [
      'Branch Staff Disciplinary Incident Submissions',
      'Local Performance Correction Notices',
      'Branch Compliance Follow-Up',
    ];
  } else if (role === 'AUDITOR') {
    authorityLevel = 'Level 2: Compliance Auditor (Independent Inspection)';
    responsibilities = [
      'Tamper-Evident Audit Log Verification',
      'Cross-District Disciplinary Case Procedural Inspection',
      'Independent Governance Compliance Auditing',
    ];
  }

  return {
    role,
    roleDef,
    roleDefinition: roleDef,
    department: matched?.department || (roleDef.isDistrictBound ? 'District Operations' : 'Head Office HR Operations'),
    category: matched?.category || roleDef.category,
    authorityLevel,
    isDistrictBound: roleDef.isDistrictBound,
    scopeDescription: roleDef.isDistrictBound
      ? 'District-Bound Autonomous Jurisdiction (Restricted strictly to assigned bank district filings)'
      : 'Bank-Wide Authority (All 13 Autonomous Bank Districts Oversight)',
    description: matched?.description || roleDef.description,
    responsibilities,
  };
}
