import React from 'react';
import { User, District, DisciplinaryReport } from '../types';
import { getRoleDefinition } from '../rbac/rbacPolicy';
import { DistrictDashboard } from './DistrictDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';
import {
  ShieldAlert,
  Users,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  Building,
  KeyRound,
  ShieldCheck,
  Activity,
  Briefcase
} from 'lucide-react';

interface DynamicDashboardProps {
  currentUser: User;
  currentDistrict?: District;
  districts: District[];
  reports: DisciplinaryReport[];
  allUsers: User[];
  onSelectReport: (report: DisciplinaryReport) => void;
  onOpenNewReport: () => void;
  onEditReport: (report: DisciplinaryReport) => void;
  onFilterByDistrict: (districtId: string) => void;
  onExportCSV: () => void;
  onNavigateToTab: (tab: any) => void;
}

export const DynamicDashboard: React.FC<DynamicDashboardProps> = ({
  currentUser,
  currentDistrict,
  districts,
  reports,
  allUsers,
  onSelectReport,
  onOpenNewReport,
  onEditReport,
  onFilterByDistrict,
  onExportCSV,
  onNavigateToTab,
}) => {
  const roleDef = getRoleDefinition(currentUser.Role);

  // 1. System Administrator Dashboard
  if (currentUser.Role === 'ADMIN') {
    const activeUsersCount = allUsers.filter((u) => u.IsActive).length;
    const inactiveUsersCount = allUsers.filter((u) => !u.IsActive).length;
    const pendingReviewsCount = reports.filter(
      (r) => r.ReportStatus === 'Submitted' || r.ReportStatus === 'Under Review'
    ).length;
    const activePipCount = reports.filter(
      (r) => r.ActionType === 'Performance Improvement Plan (PIP)' && r.ReportStatus !== 'Closed'
    ).length;
    const recentReports = reports.slice(0, 5);

    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Administrator Executive Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-purple-900/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Enterprise Administration Console • COOPERATIVE BANK OF OROMIA</span>
              </div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                System Administrator Console
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-purple-900/80 text-purple-200 border border-purple-700">
                  Full Authority
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                Centralized oversight for 13 Bank Districts, User Management & RBAC assignments,
                Disciplinary action registries, and immutable enterprise audit trails.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => onNavigateToTab('users')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition"
              >
                <Users className="w-4 h-4" />
                <span>Manage Users & Roles</span>
              </button>
              <button
                onClick={() => onNavigateToTab('audit-log')}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-purple-200 rounded-xl text-xs font-bold border border-purple-800 shadow-md flex items-center gap-2 transition"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Audit Trail</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enterprise Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigateToTab('users')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Bank Users</span>
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activeUsersCount}</span>
              <span className="text-xs text-slate-400">/ {allUsers.length} registered</span>
            </div>
            {inactiveUsersCount > 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                {inactiveUsersCount} account(s) currently suspended
              </p>
            )}
          </div>

          <div
            onClick={() => onNavigateToTab('districts')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">13 Bank Districts</span>
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{districts.length}</span>
              <span className="text-xs text-emerald-600 font-medium">100% operational</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cross-district coverage enabled</p>
          </div>

          <div
            onClick={() => onNavigateToTab('review-queue')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Clearances</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pendingReviewsCount}</span>
              <span className="text-xs text-slate-400">cases</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting HO verification</p>
          </div>

          <div
            onClick={() => onNavigateToTab('all-reports')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 transition"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Filings</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{reports.length}</span>
              <span className="text-xs text-slate-400">records</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{activePipCount} active PIP tracks</p>
          </div>
        </div>

        {/* Manager consolidated dashboard embedded for full analytics */}
        <ManagerDashboard
          districts={districts}
          reports={reports}
          onSelectReport={onSelectReport}
          onFilterByDistrict={onFilterByDistrict}
          onExportCSV={onExportCSV}
          onNavigateToReviewQueue={() => onNavigateToTab('review-queue')}
        />
      </div>
    );
  }

  // 2. Head Office Manager & Compliance Auditor
  if (currentUser.Role === 'HO_MANAGER' || currentUser.Role === 'AUDITOR' || currentUser.Role === 'HO_HR') {
    return (
      <ManagerDashboard
        districts={districts}
        reports={reports}
        onSelectReport={onSelectReport}
        onFilterByDistrict={onFilterByDistrict}
        onExportCSV={onExportCSV}
        onNavigateToReviewQueue={() => onNavigateToTab('review-queue')}
      />
    );
  }

  // 3. District Leadership (District HR Officer, District Manager, District Director)
  if (
    currentUser.Role === 'DISTRICT_HR' ||
    currentUser.Role === 'DISTRICT_MANAGER' ||
    currentUser.Role === 'DIRECTOR'
  ) {
    return (
      <DistrictDashboard
        currentUser={currentUser}
        currentDistrict={currentDistrict}
        reports={reports}
        onSelectReport={onSelectReport}
        onOpenNewReport={onOpenNewReport}
        onEditReport={onEditReport}
      />
    );
  }

  // 4. Branch & Staff (Branch Manager, Bank Employee)
  return (
    <EmployeeDashboard
      currentUser={currentUser}
      currentDistrict={currentDistrict}
      reports={reports}
      onSelectReport={onSelectReport}
      onOpenNewReport={onOpenNewReport}
    />
  );
};
