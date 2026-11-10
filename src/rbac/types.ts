export type UserRole =
  | 'ADMIN'             // System Administrator
  | 'HO_MANAGER'        // Head Office Manager
  | 'HO_HR'             // Head Office HR
  | 'DISTRICT_MANAGER'  // District Manager
  | 'DISTRICT_HR'       // District HR Officer
  | 'BRANCH_MANAGER'    // Branch Manager
  | 'EMPLOYEE'          // Bank Employee
  | 'AUDITOR'           // Compliance Auditor
  | 'DIRECTOR';         // District Director

export type PermissionCategory =
  | 'Dashboard Access'
  | 'User Management'
  | 'Employee Management'
  | 'Performance Management'
  | 'Reports'
  | 'Analytics'
  | 'System Settings';

export type Permission =
  // 1. Dashboard Access
  | 'dashboard.view'
  | 'dashboard.cross_district'
  // 2. User Management
  | 'users.view'
  | 'users.manage'
  | 'users.role_assign'
  | 'users.status_toggle'
  | 'users.password_reset'
  // 3. Employee Management
  | 'employees.view'
  | 'employees.manage'
  // 4. Performance Management
  | 'reports.create'
  | 'reports.edit'
  | 'reports.delete'
  | 'reports.review'
  | 'reports.approve'
  | 'reports.request_correction'
  // 5. Reports
  | 'reports.view'
  | 'reports.view_all_districts'
  | 'reports.export'
  // 6. Analytics
  | 'analytics.view'
  // 7. System Settings
  | 'settings.manage'
  | 'districts.manage'
  | 'audit.view';

export type AppTab =
  | 'dashboard'
  | 'submit'
  | 'my-reports'
  | 'all-reports'
  | 'review-queue'
  | 'reports-download'
  | 'users'
  | 'districts'
  | 'audit-log'
  | 'offline-sync';

export interface RoleDefinition {
  role: UserRole;
  name: string;
  category: 'Enterprise Administration' | 'Head Office Oversight' | 'District Leadership' | 'Branch & Staff';
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  permissions: Permission[];
  defaultTab: AppTab;
  allowedTabs: AppTab[];
  canSwitchPersona: boolean;
  isDistrictBound: boolean;
}

export interface RoleChangeRecord {
  id: string;
  userId: string;
  userEmail: string;
  previousRole: UserRole;
  newRole: UserRole;
  changedByEmail: string;
  changedByName: string;
  changedAt: string;
  reason?: string;
}

export interface LoginHistoryRecord {
  id: string;
  userId: string;
  email: string;
  timestamp: string;
  authMethod: 'PASSWORD' | 'GOOGLE' | 'ACTIVATION_CODE' | 'WEBAUTHN_BIOMETRIC';
  status: 'SUCCESS' | 'FAILED';
  roleAtLogin: UserRole;
  districtId?: string | null;
}
