import React, { useState } from 'react';
import { DisciplinaryReport, District } from '../types';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  Filter,
  FileSpreadsheet,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface ManagerDashboardProps {
  districts: District[];
  reports: DisciplinaryReport[];
  onSelectReport: (report: DisciplinaryReport) => void;
  onFilterByDistrict: (districtId: string) => void;
  onExportCSV: () => void;
  onNavigateToReviewQueue: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  districts,
  reports,
  onSelectReport,
  onFilterByDistrict,
  onExportCSV,
  onNavigateToReviewQueue,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');

  // Filter out drafts from high-level management analytics (only official submissions count)
  const officialReports = reports.filter(r => r.ReportStatus !== 'Draft');
  
  const filteredReports = selectedPeriod === 'ALL'
    ? officialReports
    : officialReports.filter(r => r.ReportingPeriod === selectedPeriod);

  // High-level aggregates
  const totalReportsCount = filteredReports.length;
  const pendingReviewCount = filteredReports.filter(r => r.ReportStatus === 'Submitted' || r.ReportStatus === 'Under Review').length;
  const correctionCount = filteredReports.filter(r => r.ReportStatus === 'Correction Requested').length;
  const reviewedCount = filteredReports.filter(r => r.ReportStatus === 'Reviewed').length;
  const closedCount = filteredReports.filter(r => r.ReportStatus === 'Closed').length;

  // Breakdown by Action Type
  const actionTypeMap: Record<string, number> = {};
  filteredReports.forEach(r => {
    actionTypeMap[r.ActionType] = (actionTypeMap[r.ActionType] || 0) + 1;
  });

  // 13 District Reporting Volume & Status breakdown
  const districtVolume = districts.map(d => {
    const dReports = filteredReports.filter(r => r.DistrictID === d.DistrictID);
    const pending = dReports.filter(r => r.ReportStatus === 'Submitted' || r.ReportStatus === 'Under Review').length;
    const reviewed = dReports.filter(r => r.ReportStatus === 'Reviewed' || r.ReportStatus === 'Closed').length;
    const corrections = dReports.filter(r => r.ReportStatus === 'Correction Requested').length;

    return {
      district: d,
      total: dReports.length,
      pending,
      reviewed,
      corrections,
      hasSubmissions: dReports.length > 0,
    };
  });

  // Calculate highest volume district
  const maxDistrictVolume = Math.max(...districtVolume.map(d => d.total), 1);

  // Urgent review queue (first 5 awaiting review)
  const urgentQueue = filteredReports
    .filter(r => r.ReportStatus === 'Submitted' || r.ReportStatus === 'Under Review')
    .slice(0, 5);

  // Overdue or upcoming follow-up actions
  const followUpActions = filteredReports.filter(r => r.FollowUpRequired && (r.FollowUpStatus === 'Pending' || r.FollowUpStatus === 'In Progress'));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-xl p-6 text-white shadow-lg border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>Head Office HR Operations & Oversight Directorate</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              National Disciplinary Reporting Monitor
              <span className="text-xs font-semibold bg-emerald-600/90 text-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-500">
                13 of 13 Districts Monitored
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Consolidated supervisory view of employee performance-related sanctions across all 13 bank districts. Real-time review, correction dispatch, and compliance tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period Filter */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
              <Filter className="w-3.5 h-3.5 text-blue-400 mr-1.5" />
              <label htmlFor="period-filter-select" className="sr-only">Reporting Period</label>
              <select
                id="period-filter-select"
                aria-label="Reporting Period"
                className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option value="ALL" className="bg-slate-900">All Reporting Periods</option>
                <option value="2026-Q4" className="bg-slate-900">2026 Q4 (Current)</option>
                <option value="2026-Q3" className="bg-slate-900">2026 Q3</option>
                <option value="2026-Q2" className="bg-slate-900">2026 Q2</option>
              </select>
            </div>

            <button
              onClick={onExportCSV}
              className="inline-flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export All to CSV</span>
            </button>

            {pendingReviewCount > 0 && (
              <button
                onClick={onNavigateToReviewQueue}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition"
              >
                <Clock className="w-4 h-4" />
                <span>Review Queue ({pendingReviewCount})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Across All Districts */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Filed Reports</span>
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalReportsCount}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Across 13 districts</div>
        </div>

        {/* Pending HO Review */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending HO Review</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">{pendingReviewCount}</div>
          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-1">Awaiting HO verification</div>
        </div>

        {/* Corrections Requested */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Corrections Pending</span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-800 dark:text-amber-300">{correctionCount}</div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">With district officers</div>
        </div>

        {/* Reviewed and Cleared */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Reviewed & Cleared</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{reviewedCount + closedCount}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
            {reviewedCount} Reviewed, {closedCount} Closed
          </div>
        </div>

        {/* Active Follow-ups */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Follow-ups</span>
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">{followUpActions.length}</div>
          <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1">PIPs & deadlines active</div>
        </div>
      </div>

      {/* Main Grid: 13-Districts Volume Comparison & Action Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 13 Districts Comparative Bar Heatmap */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                13 Districts Disciplinary Reporting Volume
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comparison of performance sanctions filed by each District Director
              </p>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">13 Jurisdictions</span>
          </div>

          <div className="space-y-2.5">
            {districtVolume.map(({ district, total, pending, reviewed, corrections }) => {
              const percentage = Math.round((total / maxDistrictVolume) * 100);

              return (
                <div key={district.DistrictID} className="group">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-slate-500 dark:text-slate-400 w-12">{district.DistrictCode}</span>
                      <button
                        onClick={() => onFilterByDistrict(district.DistrictID)}
                        className="font-medium text-slate-800 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 hover:underline text-left"
                      >
                        {district.DistrictName}
                      </button>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px]">
                      {pending > 0 && (
                        <span className="text-blue-600 dark:text-blue-400 font-medium" title="Pending HO Review">
                          {pending} pending
                        </span>
                      )}
                      {corrections > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-medium" title="Correction Requested">
                          {corrections} fix
                        </span>
                      )}
                      {reviewed > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400" title="Reviewed">
                          {reviewed} cleared
                        </span>
                      )}
                      <span className="font-bold text-slate-900 dark:text-slate-100 w-6 text-right">{total}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    {total === 0 ? (
                      <div className="w-full bg-slate-100 dark:bg-slate-800 text-[9px] text-slate-300 dark:text-slate-600 text-center leading-none">0</div>
                    ) : (
                      <>
                        <div
                          style={{ width: `${(reviewed / maxDistrictVolume) * 100}%` }}
                          className="bg-emerald-500 h-full"
                          title={`${reviewed} Reviewed`}
                        />
                        <div
                          style={{ width: `${(pending / maxDistrictVolume) * 100}%` }}
                          className="bg-blue-500 h-full"
                          title={`${pending} Pending Review`}
                        />
                        <div
                          style={{ width: `${(corrections / maxDistrictVolume) * 100}%` }}
                          className="bg-amber-500 h-full"
                          title={`${corrections} Correction Requested`}
                        />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Reviewed & Cleared
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block"></span> Pending HO Review
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span> Correction Requested
            </span>
          </div>
        </div>

        {/* Right Column: Breakdown by Action Type & Urgent Review Queue */}
        <div className="space-y-6">
          {/* Action Type Breakdown */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
              <span>Sanctions by Action Type</span>
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{totalReportsCount} Total</span>
            </h3>

            <div className="space-y-2">
              {Object.entries(actionTypeMap).length === 0 ? (
                <div className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No reports in selected period</div>
              ) : (
                Object.entries(actionTypeMap)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const percent = Math.round((count / totalReportsCount) * 100) || 0;
                    return (
                      <div key={type} className="text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{type}</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {count} <span className="text-slate-400 dark:text-slate-500 font-normal">({percent}%)</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Urgent Reviews Awaiting Action */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-3 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Awaiting HO Review
              </h3>
              <button
                onClick={onNavigateToReviewQueue}
                className="text-xs text-blue-700 dark:text-blue-400 font-semibold hover:underline"
              >
                View Queue
              </button>
            </div>

            {urgentQueue.length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                All submitted reports have been reviewed!
              </div>
            ) : (
              <div className="space-y-2.5">
                {urgentQueue.map(report => {
                  const dist = districts.find(d => d.DistrictID === report.DistrictID);
                  return (
                    <div
                      key={report.ReportID}
                      onClick={() => onSelectReport(report)}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 cursor-pointer transition text-xs"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono font-bold text-blue-900 dark:text-blue-400">{report.ReportID}</span>
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                          {dist?.DistrictCode || report.DistrictID}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{report.EmployeeName}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{report.ActionType}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
