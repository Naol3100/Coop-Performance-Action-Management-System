import React from 'react';
import { DisciplinaryReport, District, User } from '../types';
import { getRoleDefinition } from '../rbac/rbacPolicy';
import {
  UserCheck,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building,
  Shield,
  Briefcase,
  Calendar,
  Layers,
} from 'lucide-react';

interface EmployeeDashboardProps {
  currentUser: User;
  currentDistrict?: District;
  reports: DisciplinaryReport[];
  onSelectReport: (report: DisciplinaryReport) => void;
  onOpenNewReport?: () => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  currentUser,
  currentDistrict,
  reports,
  onSelectReport,
  onOpenNewReport,
}) => {
  const roleDef = getRoleDefinition(currentUser.Role);
  const isBranchManager = currentUser.Role === 'BRANCH_MANAGER';

  // For Employee: filter by their employee email, employee ID or name
  // For Branch Manager: filter by their branch/district
  const relevantReports = isBranchManager
    ? reports.filter((r) => r.DistrictID === currentUser.DistrictID)
    : reports.filter(
        (r) =>
          (currentUser.EmployeeID && r.EmployeeID === currentUser.EmployeeID) ||
          r.SubmittedBy?.toLowerCase() === currentUser.Email.toLowerCase() ||
          r.EmployeeName?.toLowerCase().includes(currentUser.FullName.toLowerCase())
      );

  const activeReports = relevantReports.filter((r) => r.ReportStatus !== 'Closed');
  const closedReports = relevantReports.filter((r) => r.ReportStatus === 'Closed');
  const pipCount = relevantReports.filter((r) => r.ActionType === 'Performance Improvement Plan (PIP)').length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Briefcase className="w-4 h-4" />
              <span>{roleDef.category} • {roleDef.name}</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {currentUser.FullName}
              {currentUser.EmployeeID && (
                <span className="text-xs font-mono font-normal bg-indigo-900/60 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-700">
                  {currentUser.EmployeeID}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <span>{currentUser.Position}</span>
              <span>•</span>
              <span>{currentUser.Department || 'Branch Operations'}</span>
              <span>•</span>
              <span>{currentDistrict?.DistrictName || 'Coopbank Operations'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isBranchManager && onOpenNewReport && (
              <button
                onClick={onOpenNewReport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Initiate Incident Filing</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Total Filings & Notices</span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{relevantReports.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Logged performance records</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Active Follow-up Actions</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{activeReports.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Pending review or corrective plan</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase">Resolved & Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{closedReports.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Cleared cases</div>
        </div>
      </div>

      {/* Case Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            {isBranchManager ? 'Branch Disciplinary Incident Records' : 'My Performance & Disciplinary Filings'}
          </h3>
          <span className="text-xs text-slate-500">
            {relevantReports.length} record(s) on file
          </span>
        </div>

        {relevantReports.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">Clean Performance Record</p>
            <p className="text-xs text-slate-500">No active disciplinary inquiries or formal warnings are logged for this account.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Sanction / Action</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Incident Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {relevantReports.map((report) => (
                  <tr key={report.ReportID} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">{report.ReportID}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{report.EmployeeName}</div>
                      <div className="text-[11px] text-slate-400">{report.JobTitle}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{report.ActionType}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                        {report.ReportStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">{report.IncidentDate}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectReport(report)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded border border-indigo-200 dark:border-indigo-800 transition"
                      >
                        View Notice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
