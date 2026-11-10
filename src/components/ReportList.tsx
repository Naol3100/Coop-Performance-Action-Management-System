import React, { useState, useMemo } from 'react';
import { DisciplinaryReport, District, User, ReportStatus } from '../types';
import {
  Search,
  Filter,
  Download,
  FileText,
  Printer,
  FileEdit,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lock,
  Calendar
} from 'lucide-react';
import { exportReportsToCSV } from '../utils/exportUtils';
import { getRoleDefinition, hasPermission, canPerformAction } from '../rbac/rbacPolicy';

interface ReportListProps {
  currentUser: User;
  reports: DisciplinaryReport[];
  districts: District[];
  onSelectReport: (report: DisciplinaryReport) => void;
  onEditReport: (report: DisciplinaryReport) => void;
  onPrintReport: (report: DisciplinaryReport) => void;
  title?: string;
  forcedDistrictId?: string; // If specified (e.g. from district dashboard drilldown)
}

export const ReportList: React.FC<ReportListProps> = ({
  currentUser,
  reports,
  districts,
  onSelectReport,
  onEditReport,
  onPrintReport,
  title = 'Disciplinary Action Reports Registry',
  forcedDistrictId,
}) => {
  const roleDef = getRoleDefinition(currentUser.Role);
  const isDistrictBound = roleDef.isDistrictBound && !hasPermission(currentUser.Role, 'reports.view_all_districts');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    forcedDistrictId || (isDistrictBound ? currentUser.DistrictID || 'ALL' : 'ALL')
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedActionType, setSelectedActionType] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');

  // Strict role isolation: District-bound users only see their district; Employees only see their own records
  const accessibleReports = useMemo(() => {
    if (currentUser.Role === 'EMPLOYEE') {
      return reports.filter(
        (r) =>
          (currentUser.EmployeeID && r.EmployeeID === currentUser.EmployeeID) ||
          r.SubmittedBy?.toLowerCase() === currentUser.Email.toLowerCase() ||
          r.EmployeeName?.toLowerCase().includes(currentUser.FullName.toLowerCase())
      );
    }
    if (isDistrictBound) {
      return reports.filter((r) => r.DistrictID === currentUser.DistrictID);
    }
    return reports;
  }, [reports, isDistrictBound, currentUser]);

  // Apply filters
  const filteredReports = useMemo(() => {
    return accessibleReports.filter(report => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = report.ReportID.toLowerCase().includes(query);
        const matchesEmpId = report.EmployeeID.toLowerCase().includes(query);
        const matchesEmpName = report.EmployeeName.toLowerCase().includes(query);
        const matchesJob = report.JobTitle.toLowerCase().includes(query);
        const matchesAction = report.ActionType.toLowerCase().includes(query);
        if (!matchesId && !matchesEmpId && !matchesEmpName && !matchesJob && !matchesAction) {
          return false;
        }
      }

      // District filter (for HO Manager / Admin)
      if (!isDistrictBound && selectedDistrict !== 'ALL') {
        if (report.DistrictID !== selectedDistrict) return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        if (report.ReportStatus !== selectedStatus) return false;
      }

      // Action type filter
      if (selectedActionType !== 'ALL') {
        if (report.ActionType !== selectedActionType) return false;
      }

      // Reporting period filter
      if (selectedPeriod !== 'ALL') {
        if (report.ReportingPeriod !== selectedPeriod) return false;
      }

      return true;
    });
  }, [accessibleReports, searchQuery, selectedDistrict, selectedStatus, selectedActionType, selectedPeriod, isDistrictBound]);

  const handleExportFiltered = () => {
    exportReportsToCSV(filteredReports, districts, `Disciplinary_Reports_Export_${selectedDistrict}`);
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">Draft</span>;
      case 'Submitted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">Submitted</span>;
      case 'Under Review':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">Under Review</span>;
      case 'Correction Requested':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 font-bold">Correction Requested</span>;
      case 'Reviewed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Reviewed</span>;
      case 'Closed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">Closed</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const districtMap = useMemo(() => new Map(districts.map(d => [d.DistrictID, d])), [districts]);

  return (
    <div className="space-y-4">
      {/* Header and Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              {title}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {filteredReports.length} {filteredReports.length === 1 ? 'Record' : 'Records'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isDistrictBound
                ? `Restricted to assigned district records only: ${districtMap.get(currentUser.DistrictID || '')?.DistrictName || currentUser.DistrictID}`
                : 'Consolidated cross-district repository across all 13 bank districts'}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportFiltered}
              disabled={filteredReports.length === 0}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-750 dark:hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Filtered ({filteredReports.length})</span>
            </button>
          </div>
        </div>

        {/* Security Indicator for District-bound roles */}
        {isDistrictBound && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-lg p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong>Security Filter Active:</strong> Only reports authored or belonging to <strong>{districtMap.get(currentUser.DistrictID || '')?.DistrictName}</strong> are visible. Other districts are hidden at database filter level.
            </span>
          </div>
        )}

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Search query */}
          <div className="relative">
            <label htmlFor="search-reports-input" className="sr-only">Search reports</label>
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              id="search-reports-input"
              type="text"
              placeholder="Search ID, employee, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* District selector (only enabled for non-district-bound roles) */}
          <div>
            <label htmlFor="filter-district-select" className="sr-only">Filter District</label>
            {isDistrictBound ? (
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                <span className="truncate">{districtMap.get(currentUser.DistrictID || '')?.DistrictName}</span>
                <Lock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
              </div>
            ) : (
              <select
                id="filter-district-select"
                aria-label="Filter District"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All 13 Districts</option>
                {districts.map(d => (
                  <option key={d.DistrictID} value={d.DistrictID}>
                    {d.DistrictCode} - {d.DistrictName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Status selector */}
          <div>
            <label htmlFor="filter-status-select" className="sr-only">Filter Status</label>
            <select
              id="filter-status-select"
              aria-label="Filter Status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Drafts</option>
              <option value="Submitted">Submitted (New)</option>
              <option value="Under Review">Under Review</option>
              <option value="Correction Requested">Correction Requested</option>
              <option value="Reviewed">Reviewed</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Action Type selector */}
          <div>
            <label htmlFor="filter-action-type-select" className="sr-only">Filter Action Type</label>
            <select
              id="filter-action-type-select"
              aria-label="Filter Action Type"
              value={selectedActionType}
              onChange={(e) => setSelectedActionType(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Action Types</option>
              <option value="Written Warning">Written Warning</option>
              <option value="Formal Reprimand">Formal Reprimand</option>
              <option value="Performance Improvement Plan (PIP)">Performance Improvement Plan (PIP)</option>
              <option value="Demotion / Reassignment">Demotion / Reassignment</option>
              <option value="Suspension Without Pay">Suspension Without Pay</option>
              <option value="Final Written Warning">Final Written Warning</option>
              <option value="Termination / Dismissal">Termination / Dismissal</option>
            </select>
          </div>

          {/* Reporting Period selector */}
          <div>
            <label htmlFor="filter-period-select" className="sr-only">Filter Reporting Period</label>
            <select
              id="filter-period-select"
              aria-label="Filter Reporting Period"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Periods</option>
              <option value="2026-Q4">2026-Q4</option>
              <option value="2026-Q3">2026-Q3</option>
              <option value="2026-Q2">2026-Q2</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        {filteredReports.length === 0 ? (
          <div className="text-center py-14 px-4">
            <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No disciplinary action reports match the criteria</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Try adjusting your search terms, changing the district filter, or resetting the status selections.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDistrict(isDistrictBound ? currentUser.DistrictID || 'ALL' : 'ALL');
                setSelectedStatus('ALL');
                setSelectedActionType('ALL');
                setSelectedPeriod('ALL');
              }}
              className="mt-3 px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg font-medium"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3.5">Report ID</th>
                  <th className="py-3 px-3.5">District</th>
                  <th className="py-3 px-3.5">Employee Information</th>
                  <th className="py-3 px-3.5">Action Sanction</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Follow-Up</th>
                  <th className="py-3 px-3.5">Submission Date</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredReports.map((report) => {
                  const dist = districtMap.get(report.DistrictID);

                  return (
                    <tr key={report.ReportID} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      {/* ID */}
                      <td className="py-3 px-3.5 font-mono font-bold text-blue-900 dark:text-blue-300 whitespace-nowrap">
                        <button
                          onClick={() => onSelectReport(report)}
                          className="hover:underline text-left"
                        >
                          {report.ReportID}
                        </button>
                      </td>

                      {/* District */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{dist?.DistrictCode || report.DistrictID}</span>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">{dist?.DistrictName}</div>
                      </td>

                      {/* Employee */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{report.EmployeeName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <span className="font-mono text-[10px]">{report.EmployeeID}</span>
                          <span>•</span>
                          <span className="truncate max-w-[140px]">{report.JobTitle}</span>
                        </div>
                      </td>

                      {/* Action Sanction */}
                      <td className="py-3 px-3.5">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{report.ActionType}</span>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                          By: {report.AuthorizedOfficialName}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {getStatusBadge(report.ReportStatus)}
                          {report.pendingOfflineSync && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                              Offline Queued
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Follow-up */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        {report.FollowUpRequired ? (
                          <div className="flex flex-col">
                            <span className="text-[11px] font-medium text-purple-700 dark:text-purple-300">
                              {report.FollowUpStatus}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              Due: {report.FollowUpDeadline || 'TBD'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">None</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {report.SubmittedAt ? (
                          <>
                            <div>{new Date(report.SubmittedAt).toLocaleDateString()}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">{report.ReportingPeriod}</div>
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">Draft</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Print / PDF Document button */}
                          <button
                            onClick={() => onPrintReport(report)}
                            title="Generate Official Printable Report / PDF"
                            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit / Resubmit button if Draft or Correction Requested and user has permission */}
                          {canPerformAction(currentUser.Role, 'edit', 'reports') &&
                            (report.ReportStatus === 'Draft' || report.ReportStatus === 'Correction Requested') && (
                            <button
                              onClick={() => onEditReport(report)}
                              title="Edit / Resubmit Report"
                              className="px-2 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded flex items-center gap-1 transition"
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                          )}

                          {/* View details */}
                          <button
                            onClick={() => onSelectReport(report)}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded transition"
                          >
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
