import React, { useState, useMemo } from 'react';
import { User, District, DisciplinaryReport, AuditLogEntry } from '../types';
import {
  exportUserManagementReportCSV,
  exportHistoricalAuditLogsCSV,
  exportDisciplinaryFilingsCSV,
  isWithinDateRange,
} from '../utils/bulkExportUtils';
import {
  FileSpreadsheet,
  Calendar,
  Download,
  Filter,
  Users,
  ShieldAlert,
  FileText,
  CheckCircle,
  Clock,
  Sparkles,
  Search,
  Building,
  Shield,
  Layers,
  ArrowDownToLine,
  RefreshCw,
  Info,
} from 'lucide-react';

interface AdminBulkExportHubProps {
  currentUser?: User;
  users: User[];
  districts: District[];
  reports: DisciplinaryReport[];
  auditLogs: AuditLogEntry[];
  onLogAudit?: (entry: AuditLogEntry) => void;
}

export const AdminBulkExportHub: React.FC<AdminBulkExportHubProps> = ({
  currentUser,
  users,
  districts,
  reports,
  auditLogs,
  onLogAudit,
}) => {
  // Date range filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activePreset, setActivePreset] = useState<string>('ALL');

  // User management secondary filters
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userDistrictFilter, setUserDistrictFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Audit log secondary filters
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditEntityTypeFilter, setAuditEntityTypeFilter] = useState<string>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');

  // Disciplinary filings secondary filters
  const [reportDistrictFilter, setReportDistrictFilter] = useState<string>('ALL');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('ALL');
  const [reportActionTypeFilter, setReportActionTypeFilter] = useState<string>('ALL');

  // Notification state
  const [exportNotice, setExportNotice] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Apply quick date preset
  const handleApplyPreset = (preset: string) => {
    setActivePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (preset === 'ALL') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'TODAY') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7_DAYS') {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === '30_DAYS') {
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === 'THIS_QUARTER') {
      // 2026 Q4 (Oct 1 to Dec 31)
      setStartDate('2026-10-01');
      setEndDate('2026-12-31');
    } else if (preset === 'YTD') {
      // Year to date 2026
      setStartDate('2026-01-01');
      setEndDate(todayStr);
    }
  };

  // Distinct audit actions for filter dropdown
  const availableAuditActions = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach((l) => {
      if (l.Action) set.add(l.Action);
    });
    return Array.from(set).sort();
  }, [auditLogs]);

  // Distinct report action types
  const availableActionTypes = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.ActionType) set.add(r.ActionType);
    });
    return Array.from(set).sort();
  }, [reports]);

  // Real-time matching counts
  const matchingUsersCount = useMemo(() => {
    return users.filter((u) => {
      const matchesDate =
        isWithinDateRange(u.CreatedAt, startDate, endDate) ||
        isWithinDateRange(u.LastLogin, startDate, endDate);
      if (!matchesDate) return false;
      if (userRoleFilter !== 'ALL' && u.Role !== userRoleFilter) return false;
      if (userDistrictFilter !== 'ALL' && u.DistrictID !== userDistrictFilter) return false;
      if (userStatusFilter === 'ACTIVE' && !u.IsActive) return false;
      if (userStatusFilter === 'INACTIVE' && u.IsActive) return false;
      return true;
    }).length;
  }, [users, startDate, endDate, userRoleFilter, userDistrictFilter, userStatusFilter]);

  const matchingAuditLogsCount = useMemo(() => {
    return auditLogs.filter((l) => {
      if (!isWithinDateRange(l.Timestamp, startDate, endDate)) return false;
      if (auditActionFilter !== 'ALL' && l.Action !== auditActionFilter) return false;
      if (auditEntityTypeFilter !== 'ALL' && l.EntityType !== auditEntityTypeFilter) return false;
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase();
        const match =
          l.AuditID.toLowerCase().includes(q) ||
          l.UserEmail.toLowerCase().includes(q) ||
          l.UserName.toLowerCase().includes(q) ||
          l.EntityID.toLowerCase().includes(q) ||
          l.ChangeSummary.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    }).length;
  }, [auditLogs, startDate, endDate, auditActionFilter, auditEntityTypeFilter, auditSearchQuery]);

  const matchingReportsCount = useMemo(() => {
    return reports.filter((r) => {
      const targetDate = r.ActionDate || r.IncidentDate || r.SubmittedAt;
      if (!isWithinDateRange(targetDate, startDate, endDate)) return false;
      if (reportDistrictFilter !== 'ALL' && r.DistrictID !== reportDistrictFilter) return false;
      if (reportStatusFilter !== 'ALL' && r.ReportStatus !== reportStatusFilter) return false;
      if (reportActionTypeFilter !== 'ALL' && r.ActionType !== reportActionTypeFilter) return false;
      return true;
    }).length;
  }, [reports, startDate, endDate, reportDistrictFilter, reportStatusFilter, reportActionTypeFilter]);

  // Record audit of export
  const recordExportAudit = (datasetName: string, count: number) => {
    if (onLogAudit && currentUser) {
      const newAudit: AuditLogEntry = {
        AuditID: `AUD-EXP-${Date.now().toString().slice(-4)}`,
        UserEmail: currentUser.Email,
        UserName: currentUser.FullName,
        Action: 'BULK_CSV_EXPORT',
        EntityType: 'System',
        EntityID: `DATASET-${datasetName.toUpperCase()}`,
        Timestamp: new Date().toISOString(),
        ChangeSummary: `Admin exported ${count} records from ${datasetName} filtered by date range (${startDate || 'Start'} to ${endDate || 'Now'}).`,
        ReasonForChange: 'Official administrative governance & external compliance audit reporting.',
      };
      onLogAudit(newAudit);
    }
  };

  // Export User Report
  const handleExportUsers = () => {
    const { exportedCount } = exportUserManagementReportCSV(users, districts, {
      startDate,
      endDate,
      roleFilter: userRoleFilter,
      districtFilter: userDistrictFilter,
      statusFilter: userStatusFilter,
    });
    recordExportAudit('User Management Roster', exportedCount);
    setExportNotice({
      message: `Successfully generated and downloaded User Management CSV with ${exportedCount} records.`,
      type: 'success',
    });
  };

  // Export Historical Logs
  const handleExportAuditLogs = () => {
    const { exportedCount } = exportHistoricalAuditLogsCSV(auditLogs, {
      startDate,
      endDate,
      actionFilter: auditActionFilter,
      entityTypeFilter: auditEntityTypeFilter,
      searchQuery: auditSearchQuery,
    });
    recordExportAudit('Historical Audit Logs', exportedCount);
    setExportNotice({
      message: `Successfully generated and downloaded Historical Audit Logs CSV with ${exportedCount} entries.`,
      type: 'success',
    });
  };

  // Export Disciplinary Filings
  const handleExportDisciplinaryFilings = () => {
    const { exportedCount } = exportDisciplinaryFilingsCSV(reports, districts, {
      startDate,
      endDate,
      districtFilter: reportDistrictFilter,
      statusFilter: reportStatusFilter,
      actionTypeFilter: reportActionTypeFilter,
    });
    recordExportAudit('Disciplinary Action Filings', exportedCount);
    setExportNotice({
      message: `Successfully generated and downloaded Disciplinary Filings CSV with ${exportedCount} case records.`,
      type: 'success',
    });
  };

  // Export All 3 Datasets Sequentially
  const handleExportAllDatasets = () => {
    handleExportUsers();
    setTimeout(() => {
      handleExportAuditLogs();
    }, 400);
    setTimeout(() => {
      handleExportDisciplinaryFilings();
    }, 800);
    setExportNotice({
      message: `Initiated complete administrative bulk download for all 3 datasets filtered by date range.`,
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-6 text-white shadow-xl border border-indigo-900/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <ArrowDownToLine className="w-4 h-4 text-indigo-400" />
              <span>Enterprise Data Extraction & Compliance Hub</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Bulk CSV Export Center
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-900/80 text-indigo-200 border border-indigo-700">
                Date-Filtered Extraction
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Generate and download RFC 4180-compliant, Excel-ready CSV reports for Historical Audit Trails, User Management Rosters, and Disciplinary Filings with precision date filtering.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportAllDatasets}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 transition hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Export All 3 Datasets Bundle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {exportNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{exportNotice.message}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-xs font-bold hover:underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Date Range Global Filtering Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Date Range Filter (Master Boundary)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Applies across all export targets (inclusive date bounds with local timezone adjustment)
              </p>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: '7_DAYS', label: 'Last 7 Days' },
              { id: '30_DAYS', label: 'Last 30 Days' },
              { id: 'THIS_QUARTER', label: 'This Quarter (Q4)' },
              { id: 'YTD', label: 'Year to Date (2026)' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  activePreset === preset.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Start Date (From):
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset('CUSTOM');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              End Date (To):
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset('CUSTOM');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => handleApplyPreset('ALL')}
              className="w-full py-2 px-3 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to All Time</span>
            </button>
          </div>
        </div>

        {/* Active Filter Summary */}
        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            Active Filter Window:{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {startDate ? startDate : 'Beginning of Records'}
            </strong>{' '}
            to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {endDate ? endDate : 'Present Time'}
            </strong>{' '}
            ({activePreset === 'ALL' ? 'Unbounded' : activePreset})
          </span>
        </div>
      </div>

      {/* Export Cards Grid: 1. Historical Audit Logs, 2. User Management Roster, 3. Disciplinary Filings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CARD 1: HISTORICAL AUDIT LOGS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between space-y-4 transition-colors hover:border-indigo-300 dark:hover:border-indigo-800">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {matchingAuditLogsCount} Matching Records
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Historical System Audit Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Full chronological audit trail including logins, role updates, report actions, and password changes.
              </p>
            </div>

            {/* Secondary Filters */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Action Filter:
                </label>
                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Actions ({auditLogs.length})</option>
                  {availableAuditActions.map((act) => (
                    <option key={act} value={act}>
                      {act}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Entity Scope:
                </label>
                <select
                  value={auditEntityTypeFilter}
                  onChange={(e) => setAuditEntityTypeFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Entities (User, Report, District, System)</option>
                  <option value="User">User Administration Only</option>
                  <option value="Report">Disciplinary Reports Only</option>
                  <option value="District">District Registry Only</option>
                  <option value="System">System & Security Only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Text Keyword:
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    placeholder="Search by actor or description..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-7 pr-2 py-1 text-xs text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleExportAuditLogs}
              disabled={matchingAuditLogsCount === 0}
              className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Historical Logs ({matchingAuditLogsCount})</span>
            </button>
          </div>
        </div>

        {/* CARD 2: USER MANAGEMENT & RBAC ROSTER */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between space-y-4 transition-colors hover:border-indigo-300 dark:hover:border-indigo-800">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {matchingUsersCount} Matching Accounts
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                User Management & Roles Report
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Complete user profiles, official job titles, assigned roles, authority levels, and district jurisdictions.
              </p>
            </div>

            {/* Secondary Filters */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Designation / Role:
                </label>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Roles ({users.length} Users)</option>
                  <option value="DISTRICT_HR">District HR Officers (HCBP & EPM)</option>
                  <option value="DISTRICT_MANAGER">District Managers</option>
                  <option value="DIRECTOR">District Directors</option>
                  <option value="BRANCH_MANAGER">Branch Managers</option>
                  <option value="HO_HR">Head Office HR Specialists</option>
                  <option value="HO_MANAGER">Head Office Managers</option>
                  <option value="ADMIN">System Administrators</option>
                  <option value="AUDITOR">Compliance Auditors</option>
                  <option value="EMPLOYEE">Bank Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Assigned District:
                </label>
                <select
                  value={userDistrictFilter}
                  onChange={(e) => setUserDistrictFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Districts / Bank-Wide</option>
                  {districts.map((d) => (
                    <option key={d.DistrictID} value={d.DistrictID}>
                      {d.DistrictCode} - {d.DistrictName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Account Status:
                </label>
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Accounts (Active & Suspended)</option>
                  <option value="ACTIVE">Active Only (Login Permitted)</option>
                  <option value="INACTIVE">Suspended / Inactive Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleExportUsers}
              disabled={matchingUsersCount === 0}
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download User Roster ({matchingUsersCount})</span>
            </button>
          </div>
        </div>

        {/* CARD 3: DISCIPLINARY INCIDENT FILINGS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between space-y-4 transition-colors hover:border-indigo-300 dark:hover:border-indigo-800">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {matchingReportsCount} Matching Filings
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Disciplinary Filings Master Archive
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Detailed incident filings, director decision dates, sanctions, corrective action plans, and review outcomes.
              </p>
            </div>

            {/* Secondary Filters */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Bank District:
                </label>
                <select
                  value={reportDistrictFilter}
                  onChange={(e) => setReportDistrictFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All 13 Bank Districts</option>
                  {districts.map((d) => (
                    <option key={d.DistrictID} value={d.DistrictID}>
                      {d.DistrictCode} - {d.DistrictName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Sanction / Action Type:
                </label>
                <select
                  value={reportActionTypeFilter}
                  onChange={(e) => setReportActionTypeFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Action Types</option>
                  {availableActionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Workflow Status:
                </label>
                <select
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Reviewed">Reviewed & Cleared</option>
                  <option value="Submitted">Pending HO Review</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Correction Requested">Correction Requested</option>
                  <option value="Draft">Drafts Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleExportDisciplinaryFilings}
              disabled={matchingReportsCount === 0}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download Filings CSV ({matchingReportsCount})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
