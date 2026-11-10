export * from './rbac/types';
import { UserRole, RoleChangeRecord, LoginHistoryRecord } from './rbac/types';

export type ReportStatus = 
  | 'Draft' 
  | 'Submitted' 
  | 'Under Review' 
  | 'Correction Requested' 
  | 'Reviewed' 
  | 'Closed';

export type ActionType =
  | 'Written Warning'
  | 'Formal Reprimand'
  | 'Performance Improvement Plan (PIP)'
  | 'Demotion / Reassignment'
  | 'Suspension Without Pay'
  | 'Final Written Warning'
  | 'Termination / Dismissal';

export type FollowUpStatus =
  | 'Pending'
  | 'In Progress'
  | 'Satisfactory'
  | 'Escalated'
  | 'Not Required';

export type DocumentCategory =
  | 'Notice of Inquiry'
  | 'Hearing Minutes'
  | 'Investigation Summary'
  | 'Director Approval Order'
  | 'Performance Improvement Agreement'
  | 'Other Supporting Evidence';

export interface District {
  DistrictID: string;
  DistrictCode: string;
  DistrictName: string;
  Region: string;
  OfficeLocation: string;
  IsActive: boolean;
  DirectorName: string;
}

export interface User {
  UserID: string;
  EmployeeID?: string;
  FullName: string;
  Email: string;
  Role: UserRole;
  DistrictID: string | null; // null for HO roles and ADMIN if cross-district
  Department?: string;
  Position: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt?: string;
  CreatedBy?: string;
  UpdatedBy?: string;
  LastLogin?: string;
  RoleHistory?: RoleChangeRecord[];
  LoginHistory?: LoginHistoryRecord[];
  Password?: string;
  TemporaryPassword?: string;
  MustChangePassword?: boolean;
  ActivationCode?: string;
  LastPasswordReset?: string;
  BiometricEnabled?: boolean;
}

export interface ReportAttachment {
  AttachmentID: string;
  ReportID: string;
  FileName: string;
  FileSize: string;
  FileType: string;
  UploadedBy: string;
  UploadedAt: string;
  DocumentCategory: DocumentCategory;
  Url?: string;
}

export interface ReportAuditHistory {
  HistoryID: string;
  Action: string;
  Timestamp: string;
  Actor: string;
  ActorRole: string;
  Details: string;
}

export interface DisciplinaryReport {
  ReportID: string;
  EmployeeID: string;
  EmployeeName: string;
  JobTitle: string;
  WorkUnit: string;
  DistrictID: string;
  IncidentDate: string;
  ActionDate: string;
  ActionType: ActionType;
  IssueDescription: string;
  PolicyReference: string;
  SummaryOfFindings: string;
  ActionTaken: string;
  DirectorDecisionDate: string;
  AuthorizedOfficialName: string;
  CorrectiveAction: string;
  FollowUpRequired: boolean;
  FollowUpDeadline?: string;
  FollowUpStatus: FollowUpStatus;
  ReportingPeriod: string; // e.g. "2026-Q1"
  SubmittedBy: string; // email
  SubmitterName: string;
  SubmittedAt?: string;
  ReportStatus: ReportStatus;
  ReviewedBy?: string;
  ReviewerName?: string;
  ReviewedAt?: string;
  ReviewComments?: string;
  CorrectionNotes?: string;
  Attachments: ReportAttachment[];
  AuditTrail: ReportAuditHistory[];
  pendingOfflineSync?: boolean;
  isOfflineCreated?: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface AuditLogEntry {
  AuditID: string;
  UserEmail: string;
  UserName: string;
  Action: string;
  EntityType: 'Report' | 'User' | 'District' | 'System';
  EntityID: string;
  Timestamp: string;
  ChangeSummary: string;
  ReasonForChange: string;
}

export interface SystemConfig {
  bankName: string;
  bankDivision: string;
  currentFiscalYear: string;
  currentReportingPeriod: string;
  allowDrafts: boolean;
  requireDirectorAttachment: boolean;
  notificationEmailEnabled: boolean;
  retentionYears: number;
}
