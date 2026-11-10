import React from 'react';
import { DisciplinaryReport, District, User } from '../types';
import {
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileEdit,
  PlusCircle,
  Calendar,
  AlertCircle,
  Building,
  UserCheck
} from 'lucide-react';

interface DistrictDashboardProps {
  currentUser: User;
  currentDistrict?: District;
  reports: DisciplinaryReport[];
  onSelectReport: (report: DisciplinaryReport) => void;
  onOpenNewReport: () => void;
  onEditReport: (report: DisciplinaryReport) => void;
}

export const DistrictDashboard: React.FC<DistrictDashboardProps> = ({
  currentUser,
  currentDistrict,
  reports,
  onSelectReport,
  onOpenNewReport,
  onEditReport,
}) => {
  // STRICT DATA ISOLATION: Filter reports strictly by currentUser's assigned DistrictID
  const districtReports = reports.filter(r => r.DistrictID === currentUser.DistrictID);

  const totalReports = districtReports.length;
  const currentPeriodReports = districtReports.filter(r => r.ReportingPeriod === '2026-Q3' || r.ReportingPeriod === '2026-Q4').length;
  const draftReports = districtReports.filter(r => r.ReportStatus === 'Draft').length;
  const awaitingReviewReports = districtReports.filter(r => r.ReportStatus === 'Submitted' || r.ReportStatus === 'Under Review').length;
  const correctionRequestedReports = districtReports.filter(r => r.ReportStatus === 'Correction Requested');
  const reviewedOrClosedReports = districtReports.filter(r => r.ReportStatus === 'Reviewed' || r.ReportStatus === 'Closed').length;

  // Follow-up actions approaching or pending
  const pendingFollowUps = districtReports.filter(r => r.FollowUpRequired && (r.FollowUpStatus === 'Pending' || r.FollowUpStatus === 'In Progress'));

  return (
    <div className="space-y-6">
      {/* Top Banner with District Identity */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-xl p-6 text-white shadow-lg border border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Building className="w-4 h-4" />
              <span>District HR Portal • Authorized District Environment</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {currentDistrict?.DistrictName || 'Assigned District'}
              <span className="text-sm font-medium bg-blue-800/80 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-700">
                {currentUser.DistrictID}
              </span>
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              District Director: <strong>{currentDistrict?.DirectorName}</strong> • Regional Hub: {currentDistrict?.OfficeLocation}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenNewReport}
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit Disciplinary Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Urgent Correction Alert Banner if any reports need correction */}
      {correctionRequestedReports.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Action Required: {correctionRequestedReports.length} Report(s) Returned for Correction by Head Office HR
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Head Office HR has reviewed submitted filings and requested amendments or missing documentation. Please review comments and resubmit.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {correctionRequestedReports.map(rep => (
                  <button
                    key={rep.ReportID}
                    onClick={() => onEditReport(rep)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded shadow-sm"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Fix {rep.ReportID} ({rep.EmployeeName})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Key Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total District Reports */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Reports</span>
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalReports}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">All historical filings</div>
        </div>

        {/* Current Period (2026-Q3/Q4) */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Current Period</span>
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">{currentPeriodReports}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">2026 Fiscal Cycle</div>
        </div>

        {/* Drafts */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Draft Reports</span>
            <FileEdit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{draftReports}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Unsubmitted drafts</div>
        </div>

        {/* Awaiting Review */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Under HO Review</span>
            <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{awaitingReviewReports}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Pending approval</div>
        </div>

        {/* Corrections Needed */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Correction Needed</span>
            <AlertCircle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">{correctionRequestedReports.length}</div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Returned by HO</div>
        </div>

        {/* Reviewed & Closed */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Reviewed / Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{reviewedOrClosedReports}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Finalized & cleared</div>
        </div>
      </div>

      {/* Two column grid: Follow-up Action Tracker & Recent District Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Follow-up action tracker */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Follow-Up Actions & Deadlines
            </h3>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
              {pendingFollowUps.length} Active
            </span>
          </div>

          {pendingFollowUps.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
              No pending follow-up deadlines for {currentDistrict?.DistrictName}.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingFollowUps.map(item => (
                <div
                  key={item.ReportID}
                  onClick={() => onSelectReport(item)}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition-all text-xs"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{item.EmployeeName}</span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{item.EmployeeID}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 line-clamp-1 mb-2">{item.ActionType}</div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Deadline: <strong className="text-slate-700 dark:text-slate-300">{item.FollowUpDeadline || 'Unspecified'}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-medium text-[10px]">
                      {item.FollowUpStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <UserCheck className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Compliance Obligation</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                District HR Officers are responsible for recording follow-up status outcomes before the deadline expires.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Recent District Reports Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Recent District Disciplinary Filings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Submissions generated from {currentDistrict?.DistrictName}
              </p>
            </div>
            <button
              onClick={onOpenNewReport}
              className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create New</span>
            </button>
          </div>

          {districtReports.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No disciplinary reports recorded for this district yet.</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Use the submission form to record disciplinary actions authorized by your District Director.
              </p>
              <button
                onClick={onOpenNewReport}
                className="mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-medium rounded-lg"
              >
                Start First Report
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Report ID</th>
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Disciplinary Action</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {districtReports.map((report) => {
                    const getStatusBadge = (status: string) => {
                      switch (status) {
                        case 'Draft':
                          return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Draft</span>;
                        case 'Submitted':
                          return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Submitted</span>;
                        case 'Under Review':
                          return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">Under Review</span>;
                        case 'Correction Requested':
                          return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold animate-pulse">Correction Needed</span>;
                        case 'Reviewed':
                          return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Reviewed</span>;
                        case 'Closed':
                          return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Closed</span>;
                        default:
                          return <span>{status}</span>;
                      }
                    };

                    return (
                      <tr key={report.ReportID} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-medium text-blue-900 dark:text-blue-400">{report.ReportID}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{report.EmployeeName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{report.JobTitle}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{report.ActionType}</span>
                        </td>
                        <td className="py-2.5 px-3">{getStatusBadge(report.ReportStatus)}</td>
                        <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {report.SubmittedAt ? new Date(report.SubmittedAt).toLocaleDateString() : 'Unsubmitted'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {report.ReportStatus === 'Draft' || report.ReportStatus === 'Correction Requested' ? (
                            <button
                              onClick={() => onEditReport(report)}
                              className="px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded"
                            >
                              Edit / Resubmit
                            </button>
                          ) : (
                            <button
                              onClick={() => onSelectReport(report)}
                              className="px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded"
                            >
                              View Details
                            </button>
                          )}
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
    </div>
  );
};
