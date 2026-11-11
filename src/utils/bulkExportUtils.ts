import { User, AuditLogEntry, DisciplinaryReport, District } from '../types';
import { getRoleDefinition } from '../rbac/rbacPolicy';

/**
 * Escapes values for RFC 4180 compliant CSV output
 */
export function escapeCSVCell(value: any): string {
  if (value === null || value === undefined) return '""';
  const stringVal = String(value).replace(/"/g, '""');
  return `"${stringVal}"`;
}

/**
 * Triggers a browser download of CSV text with UTF-8 BOM for Microsoft Excel compatibility
 */
export function downloadCSVContent(fileName: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): void {
  const formattedRows = rows.map(row => row.map(cell => escapeCSVCell(cell)).join(','));
  const headerLine = headers.map(h => escapeCSVCell(h)).join(',');
  const csvContent = '\uFEFF' + [headerLine, ...formattedRows].join('\r\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${fileName}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Filter items by date range (inclusive)
 */
export function isWithinDateRange(
  dateStr: string | undefined | null,
  startDateStr?: string,
  endDateStr?: string
): boolean {
  if (!startDateStr && !endDateStr) return true;
  if (!dateStr) return false;

  const itemDate = new Date(dateStr);
  if (isNaN(itemDate.getTime())) return false;

  if (startDateStr) {
    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    if (itemDate < start) return false;
  }

  if (endDateStr) {
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    if (itemDate > end) return false;
  }

  return true;
}

/**
 * Export User Management Reports filtered by date range, role, district, and status
 */
export function exportUserManagementReportCSV(
  users: User[],
  districts: District[],
  options?: {
    startDate?: string;
    endDate?: string;
    roleFilter?: string;
    districtFilter?: string;
    statusFilter?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  }
): { exportedCount: number } {
  const districtMap = new Map(districts.map(d => [d.DistrictID, d.DistrictName]));

  const filteredUsers = users.filter(user => {
    // Date filter on CreatedAt or LastLogin
    const matchesDate = isWithinDateRange(user.CreatedAt, options?.startDate, options?.endDate) ||
      isWithinDateRange(user.LastLogin, options?.startDate, options?.endDate);
    if (!matchesDate) return false;

    // Role filter
    if (options?.roleFilter && options.roleFilter !== 'ALL' && user.Role !== options.roleFilter) {
      return false;
    }

    // District filter
    if (options?.districtFilter && options.districtFilter !== 'ALL' && user.DistrictID !== options.districtFilter) {
      return false;
    }

    // Status filter
    if (options?.statusFilter && options.statusFilter !== 'ALL') {
      if (options.statusFilter === 'ACTIVE' && !user.IsActive) return false;
      if (options.statusFilter === 'INACTIVE' && user.IsActive) return false;
    }

    return true;
  });

  const headers = [
    'User ID',
    'Employee ID',
    'Full Name',
    'Official Registered Email',
    'Job Title / Designation',
    'Assigned System Role',
    'Authority Level',
    'Access Scope',
    'Assigned Bank District ID',
    'Assigned District Name',
    'Assigned Department',
    'Account Status',
    'Account Created At',
    'Last Login Timestamp',
    'Last Profile Updated At',
    'Must Change Password on First Login',
    'Role Modification History Count',
    'Login History Sessions Count',
    'Biometric Credentials Registered'
  ];

  const rows = filteredUsers.map(u => {
    const roleDef = getRoleDefinition(u.Role);
    const distName = u.DistrictID ? (districtMap.get(u.DistrictID) || u.DistrictID) : 'Bank-Wide Cross-District';
    const scope = roleDef.isDistrictBound ? 'District-Bound Jurisdiction' : 'Bank-Wide National Oversight';
    
    return [
      u.UserID,
      u.EmployeeID || 'N/A',
      u.FullName,
      u.Email,
      u.Position || roleDef.name,
      `${roleDef.name} (${u.Role})`,
      roleDef.category,
      scope,
      u.DistrictID || 'CROSS-DISTRICT',
      distName,
      u.Department || (roleDef.isDistrictBound ? 'District Operations' : 'Head Office HR Operations'),
      u.IsActive ? 'ACTIVE (Permitted)' : 'SUSPENDED / INACTIVE',
      u.CreatedAt ? new Date(u.CreatedAt).toLocaleString() : 'N/A',
      u.LastLogin ? new Date(u.LastLogin).toLocaleString() : 'Never Logged In',
      u.UpdatedAt ? new Date(u.UpdatedAt).toLocaleString() : 'N/A',
      u.MustChangePassword ? 'YES (Default Credentials Pending)' : 'NO (Personalized)',
      (u.RoleHistory || []).length,
      (u.LoginHistory || []).length,
      u.BiometricEnabled ? 'YES' : 'NO'
    ];
  });

  downloadCSVContent('CoopBank_User_Management_Report', headers, rows);
  return { exportedCount: filteredUsers.length };
}

/**
 * Export Historical System Audit Logs filtered by date range and action
 */
export function exportHistoricalAuditLogsCSV(
  logs: AuditLogEntry[],
  options?: {
    startDate?: string;
    endDate?: string;
    actionFilter?: string;
    entityTypeFilter?: string;
    searchQuery?: string;
  }
): { exportedCount: number } {
  const filteredLogs = logs.filter(log => {
    // Date filter on log.Timestamp
    if (!isWithinDateRange(log.Timestamp, options?.startDate, options?.endDate)) {
      return false;
    }

    // Action filter
    if (options?.actionFilter && options.actionFilter !== 'ALL' && log.Action !== options.actionFilter) {
      return false;
    }

    // Entity filter
    if (options?.entityTypeFilter && options.entityTypeFilter !== 'ALL' && log.EntityType !== options.entityTypeFilter) {
      return false;
    }

    // Search query
    if (options?.searchQuery?.trim()) {
      const q = options.searchQuery.toLowerCase();
      const match =
        log.AuditID.toLowerCase().includes(q) ||
        log.UserEmail.toLowerCase().includes(q) ||
        log.UserName.toLowerCase().includes(q) ||
        log.EntityID.toLowerCase().includes(q) ||
        log.ChangeSummary.toLowerCase().includes(q) ||
        log.ReasonForChange.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  const headers = [
    'Audit Entry ID',
    'Event Timestamp (UTC)',
    'Event Timestamp (Local)',
    'Actor Full Name',
    'Actor Official Email',
    'System Action Executed',
    'Target Entity Type',
    'Target Entity ID',
    'Administrative Change Summary',
    'Official Reason / Policy Ground'
  ];

  const rows = filteredLogs.map(l => {
    const localTime = l.Timestamp ? new Date(l.Timestamp).toLocaleString() : 'N/A';
    return [
      l.AuditID,
      l.Timestamp,
      localTime,
      l.UserName,
      l.UserEmail,
      l.Action,
      l.EntityType,
      l.EntityID,
      l.ChangeSummary,
      l.ReasonForChange
    ];
  });

  downloadCSVContent('CoopBank_Historical_Audit_Logs', headers, rows);
  return { exportedCount: filteredLogs.length };
}

/**
 * Export Disciplinary Filings Master Report filtered by date range
 */
export function exportDisciplinaryFilingsCSV(
  reports: DisciplinaryReport[],
  districts: District[],
  options?: {
    startDate?: string;
    endDate?: string;
    districtFilter?: string;
    statusFilter?: string;
    actionTypeFilter?: string;
  }
): { exportedCount: number } {
  const districtMap = new Map(districts.map(d => [d.DistrictID, d.DistrictName]));

  const filtered = reports.filter(r => {
    // Date check on IncidentDate, ActionDate, or SubmittedAt
    const targetDate = r.ActionDate || r.IncidentDate || r.SubmittedAt;
    if (!isWithinDateRange(targetDate, options?.startDate, options?.endDate)) {
      return false;
    }

    if (options?.districtFilter && options.districtFilter !== 'ALL' && r.DistrictID !== options.districtFilter) {
      return false;
    }

    if (options?.statusFilter && options.statusFilter !== 'ALL' && r.ReportStatus !== options.statusFilter) {
      return false;
    }

    if (options?.actionTypeFilter && options.actionTypeFilter !== 'ALL' && r.ActionType !== options.actionTypeFilter) {
      return false;
    }

    return true;
  });

  const headers = [
    'Report ID',
    'District ID',
    'District Name',
    'Employee ID',
    'Employee Name',
    'Employee Job Title',
    'Assigned Work Unit',
    'Incident Date',
    'Action Date',
    'Disciplinary Sanction / Action Type',
    'Policy Reference Standards',
    'Director Decision Date',
    'Authorized District Official',
    'Issue Description',
    'Summary Of Findings',
    'Action Taken',
    'Corrective Action Prescribed',
    'Follow-up Required',
    'Follow-up Deadline',
    'Follow-up Status',
    'Reporting Period',
    'Workflow Status',
    'Filing Submitter Name',
    'Filing Submitter Email',
    'Submitted At',
    'HO Reviewer Name',
    'HO Reviewer Email',
    'HO Reviewed At',
    'HO Review Comments',
    'Correction Notes',
    'Attached Documents Count'
  ];

  const rows = filtered.map(r => [
    r.ReportID,
    r.DistrictID,
    districtMap.get(r.DistrictID) || r.DistrictID,
    r.EmployeeID,
    r.EmployeeName,
    r.JobTitle,
    r.WorkUnit,
    r.IncidentDate,
    r.ActionDate,
    r.ActionType,
    r.PolicyReference,
    r.DirectorDecisionDate,
    r.AuthorizedOfficialName,
    r.IssueDescription,
    r.SummaryOfFindings,
    r.ActionTaken,
    r.CorrectiveAction,
    r.FollowUpRequired ? 'YES' : 'NO',
    r.FollowUpDeadline || 'N/A',
    r.FollowUpStatus,
    r.ReportingPeriod,
    r.ReportStatus,
    r.SubmitterName,
    r.SubmittedBy,
    r.SubmittedAt ? new Date(r.SubmittedAt).toLocaleString() : 'N/A',
    r.ReviewerName || 'N/A',
    r.ReviewedBy || 'N/A',
    r.ReviewedAt ? new Date(r.ReviewedAt).toLocaleString() : 'N/A',
    r.ReviewComments || 'N/A',
    r.CorrectionNotes || 'N/A',
    (r.Attachments || []).length
  ]);

  downloadCSVContent('CoopBank_Disciplinary_Filings_Report', headers, rows);
  return { exportedCount: filtered.length };
}
