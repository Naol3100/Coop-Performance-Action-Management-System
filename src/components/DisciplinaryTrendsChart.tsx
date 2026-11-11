import React, { useState, useMemo } from 'react';
import { DisciplinaryReport, District } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Filter,
  ShieldAlert,
  Building,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Layers,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface DisciplinaryTrendsChartProps {
  reports: DisciplinaryReport[];
  districts: District[];
  onSelectDistrict?: (districtId: string) => void;
  className?: string;
  title?: string;
  subtitle?: string;
}

// Accessible palette harmonious with CoopBank brand and status cues
const STATUS_COLORS = {
  Reviewed: '#10b981',       // Emerald
  UnderReview: '#3b82f6',    // Blue
  Correction: '#f59e0b',     // Amber
  Draft: '#8b5cf6',          // Purple
  Closed: '#059669',         // Deep green
};

const ACTION_TYPE_COLORS: Record<string, string> = {
  'Written Warning': '#3b82f6',
  'Formal Reprimand': '#6366f1',
  'Performance Improvement Plan (PIP)': '#8b5cf6',
  'Demotion / Reassignment': '#ec4899',
  'Suspension Without Pay': '#f59e0b',
  'Final Written Warning': '#f97316',
  'Termination / Dismissal': '#ef4444',
};

const DEFAULT_ACTION_COLOR = '#64748b';

export const DisciplinaryTrendsChart: React.FC<DisciplinaryTrendsChartProps> = ({
  reports,
  districts,
  onSelectDistrict,
  className = '',
  title = 'Disciplinary Case Trends & Analytics',
  subtitle = 'Supervisory overview of disciplinary report distribution across 13 bank districts and sanction categories.',
}) => {
  const [activeView, setActiveView] = useState<'district' | 'caseType' | 'timeline'>('district');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState<string>('ALL');
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<string>('ALL');

  // Filter reports according to selected controls
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (selectedDistrictFilter !== 'ALL' && r.DistrictID !== selectedDistrictFilter) {
        return false;
      }
      if (selectedPeriodFilter !== 'ALL' && r.ReportingPeriod !== selectedPeriodFilter) {
        return false;
      }
      return true;
    });
  }, [reports, selectedDistrictFilter, selectedPeriodFilter]);

  // Available distinct reporting periods
  const availablePeriods = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.ReportingPeriod) set.add(r.ReportingPeriod);
    });
    return Array.from(set).sort().reverse();
  }, [reports]);

  // 1. Data by District
  const districtChartData = useMemo(() => {
    return districts.map((district) => {
      const dReports = filteredReports.filter((r) => r.DistrictID === district.DistrictID);
      const reviewed = dReports.filter((r) => r.ReportStatus === 'Reviewed' || r.ReportStatus === 'Closed').length;
      const underReview = dReports.filter((r) => r.ReportStatus === 'Submitted' || r.ReportStatus === 'Under Review').length;
      const correction = dReports.filter((r) => r.ReportStatus === 'Correction Requested').length;
      const draft = dReports.filter((r) => r.ReportStatus === 'Draft').length;
      const total = dReports.length;

      return {
        districtId: district.DistrictID,
        districtCode: district.DistrictCode,
        districtName: district.DistrictName,
        reviewed,
        underReview,
        correction,
        draft,
        total,
      };
    });
  }, [districts, filteredReports]);

  // 2. Data by Case Type / Action Type
  const caseTypeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredReports.forEach((r) => {
      const type = r.ActionType || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });

    const totalCount = filteredReports.length || 1;

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalCount) * 100),
        color: ACTION_TYPE_COLORS[name] || DEFAULT_ACTION_COLOR,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredReports]);

  // 3. Data by Chronological Timeline (Monthly Trends)
  const timelineChartData = useMemo(() => {
    const monthMap: Record<string, { month: string; total: number; reviewed: number; pending: number }> = {};

    filteredReports.forEach((r) => {
      const dateStr = r.ActionDate || r.IncidentDate || r.CreatedAt;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      if (!monthMap[key]) {
        monthMap[key] = { month: label, total: 0, reviewed: 0, pending: 0 };
      }

      monthMap[key].total += 1;
      if (r.ReportStatus === 'Reviewed' || r.ReportStatus === 'Closed') {
        monthMap[key].reviewed += 1;
      } else {
        monthMap[key].pending += 1;
      }
    });

    return Object.keys(monthMap)
      .sort()
      .map((k) => monthMap[k]);
  }, [filteredReports]);

  // Key KPI Aggregates
  const totalCases = filteredReports.length;
  const reviewedCases = filteredReports.filter((r) => r.ReportStatus === 'Reviewed' || r.ReportStatus === 'Closed').length;
  const resolutionRate = totalCases > 0 ? Math.round((reviewedCases / totalCases) * 100) : 0;
  const severeCases = filteredReports.filter(
    (r) => r.ActionType === 'Termination / Dismissal' || r.ActionType === 'Suspension Without Pay'
  ).length;

  const topDistrict = useMemo(() => {
    const sorted = [...districtChartData].sort((a, b) => b.total - a.total);
    return sorted[0]?.total > 0 ? sorted[0] : null;
  }, [districtChartData]);

  const topCaseType = caseTypeChartData[0]?.count > 0 ? caseTypeChartData[0] : null;

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6 transition-colors ${className}`}>
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Interactive HR Oversight Analytics</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {title}
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              {filteredReports.length} Reports Analyzed
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {subtitle}
          </p>
        </div>

        {/* Filters and View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle Buttons */}
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveView('district')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'district'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>By District</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('caseType')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'caseType'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>By Case Type</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('timeline')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeView === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Timeline Trend</span>
            </button>
          </div>

          {/* District Dropdown Filter */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              aria-label="Filter by district"
              value={selectedDistrictFilter}
              onChange={(e) => setSelectedDistrictFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL">All 13 Districts</option>
              {districts.map((d) => (
                <option key={d.DistrictID} value={d.DistrictID}>
                  {d.DistrictCode} - {d.DistrictName}
                </option>
              ))}
            </select>
          </div>

          {/* Period Dropdown Filter */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
            <select
              aria-label="Filter by period"
              value={selectedPeriodFilter}
              onChange={(e) => setSelectedPeriodFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL">All Periods</option>
              {availablePeriods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick KPI Overview Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 block">
            Resolution Rate
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">{resolutionRate}%</span>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">cleared</span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            {reviewedCases} of {totalCases} reports resolved
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
            Most Prevalent Sanction
          </span>
          <div className="mt-1">
            <span className="text-sm font-bold text-emerald-950 dark:text-emerald-100 block truncate">
              {topCaseType ? topCaseType.name : 'N/A'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            {topCaseType ? `${topCaseType.count} cases (${topCaseType.percentage}%)` : 'No reports'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 block">
            Highest Volume District
          </span>
          <div className="mt-1">
            <span className="text-sm font-bold text-blue-950 dark:text-blue-100 block truncate">
              {topDistrict ? topDistrict.districtName : 'N/A'}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            {topDistrict ? `${topDistrict.total} filings (${topDistrict.districtCode})` : 'No filings'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
            High Severity Actions
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-900 dark:text-amber-100">{severeCases}</span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">critical</span>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Dismissals & Suspensions
          </span>
        </div>
      </div>

      {/* Main Chart Rendering Canvas */}
      <div className="pt-2">
        {/* VIEW 1: DISTRICT COMPARATIVE BREAKDOWN */}
        {activeView === 'district' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                13 Bank Districts Disciplinary Volume by Status
              </span>
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Reviewed & Closed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-blue-500 inline-block"></span> Pending Review
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span> Correction Needed
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-purple-500 inline-block"></span> Drafts
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={districtChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                  onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload[0] && onSelectDistrict) {
                      const data = e.activePayload[0].payload;
                      onSelectDistrict(data.districtId);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="districtCode"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 z-50">
                            <div className="font-bold border-b border-slate-800 pb-1 flex justify-between gap-4">
                              <span>{data.districtName}</span>
                              <span className="text-purple-400 font-mono">[{data.districtCode}]</span>
                            </div>
                            <div className="space-y-0.5 text-[11px]">
                              <p className="flex justify-between gap-3 text-emerald-400">
                                <span>Reviewed / Closed:</span>
                                <span className="font-bold">{data.reviewed}</span>
                              </p>
                              <p className="flex justify-between gap-3 text-blue-400">
                                <span>Pending HO Review:</span>
                                <span className="font-bold">{data.underReview}</span>
                              </p>
                              <p className="flex justify-between gap-3 text-amber-400">
                                <span>Correction Needed:</span>
                                <span className="font-bold">{data.correction}</span>
                              </p>
                              <p className="flex justify-between gap-3 text-purple-400">
                                <span>Drafts:</span>
                                <span className="font-bold">{data.draft}</span>
                              </p>
                              <div className="pt-1 border-t border-slate-800 flex justify-between font-bold text-white">
                                <span>Total Submissions:</span>
                                <span>{data.total}</span>
                              </div>
                            </div>
                            {onSelectDistrict && (
                              <p className="text-[9px] text-slate-400 pt-1 italic">Click bar to inspect district reports</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="reviewed" stackId="a" fill={STATUS_COLORS.Reviewed} radius={[0, 0, 0, 0]} name="Reviewed & Cleared" />
                  <Bar dataKey="underReview" stackId="a" fill={STATUS_COLORS.UnderReview} radius={[0, 0, 0, 0]} name="Under Review" />
                  <Bar dataKey="correction" stackId="a" fill={STATUS_COLORS.Correction} radius={[0, 0, 0, 0]} name="Correction Requested" />
                  <Bar dataKey="draft" stackId="a" fill={STATUS_COLORS.Draft} radius={[4, 4, 0, 0]} name="Drafts" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 2: CASE TYPE / SANCTION DISTRIBUTION */}
        {activeView === 'caseType' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Donut Chart */}
            <div className="lg:col-span-5 h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={caseTypeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {caseTypeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs">
                            <span className="font-bold block" style={{ color: data.color }}>
                              {data.name}
                            </span>
                            <span className="text-[11px] text-slate-300 block mt-1">
                              {data.count} Cases ({data.percentage}%)
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Case Type Breakdown List */}
            <div className="lg:col-span-7 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Sanction Category Breakdown ({caseTypeChartData.length} Action Types)
              </h4>
              <div className="space-y-2">
                {caseTypeChartData.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>{item.count}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: CHRONOLOGICAL TIMELINE TREND */}
        {activeView === 'timeline' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Monthly Incident Filings & Review Trajectory
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-purple-600 inline-block"></span> Total Filings
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> Reviewed & Cleared
                </span>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineChartData.length > 0 ? timelineChartData : [{ month: 'Current', total: 1, reviewed: 1, pending: 0 }]}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="reviewedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1">
                            <span className="font-bold text-slate-200 block border-b border-slate-800 pb-1">
                              Period: {data.month}
                            </span>
                            <p className="text-purple-400">Total Filings: <strong>{data.total}</strong></p>
                            <p className="text-emerald-400">Reviewed & Cleared: <strong>{data.reviewed}</strong></p>
                            <p className="text-blue-400">Pending Review: <strong>{data.pending}</strong></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#totalGradient)"
                    name="Total Filings"
                  />
                  <Area
                    type="monotone"
                    dataKey="reviewed"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#reviewedGradient)"
                    name="Reviewed & Cleared"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
