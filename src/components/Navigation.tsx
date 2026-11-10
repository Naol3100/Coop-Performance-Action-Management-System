import React from 'react';
import { UserRole } from '../types';
import { canAccessTab, getRoleDefinition, AppTab } from '../rbac/rbacPolicy';
import {
  LayoutDashboard,
  FilePlus,
  Files,
  FolderGit2,
  CheckCircle2,
  DownloadCloud,
  Users,
  MapPin,
  ShieldAlert,
  Database,
  Lock,
  Fingerprint,
  ShieldCheck,
} from 'lucide-react';

export type NavTab = AppTab;

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userRole: UserRole;
  isAuthorizedAdmin?: boolean;
  pendingReviewsCount: number;
  correctionsCount: number;
  offlineQueueCount: number;
  isOnline: boolean;
  onOpenSecuritySettings?: () => void;
  isBiometricActive?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  userRole,
  pendingReviewsCount,
  correctionsCount,
  offlineQueueCount,
  isOnline,
  onOpenSecuritySettings,
  isBiometricActive,
}) => {
  const roleDef = getRoleDefinition(userRole);

  interface NavItem {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    allowed: boolean;
    badge?: number | string;
    badgeColor?: string;
    restrictedTooltip?: string;
  }

  // Dynamic Dashboard and Reports labels based on role jurisdiction
  const getDashboardLabel = () => {
    switch (userRole) {
      case 'ADMIN':
        return 'System Admin Console';
      case 'HO_MANAGER':
        return 'Head Office Executive Dashboard';
      case 'HO_HR':
        return 'HO HR Operations';
      case 'DISTRICT_MANAGER':
        return 'District Leadership Dashboard';
      case 'DISTRICT_HR':
        return 'District HR Dashboard';
      case 'BRANCH_MANAGER':
        return 'Branch Manager Dashboard';
      case 'EMPLOYEE':
        return 'Employee Portal';
      case 'AUDITOR':
        return 'Compliance Audit Dashboard';
      case 'DIRECTOR':
        return 'District Director Dashboard';
      default:
        return 'Operational Dashboard';
    }
  };

  const getMyReportsLabel = () => {
    if (userRole === 'EMPLOYEE') return 'My Records & PIPs';
    if (roleDef.isDistrictBound) return 'My District Reports';
    if (userRole === 'HO_HR') return 'Head Office Submissions';
    return 'District Submissions';
  };

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: getDashboardLabel(),
      icon: LayoutDashboard,
      allowed: canAccessTab(userRole, 'dashboard'),
    },
    {
      id: 'submit',
      label: 'Submit Disciplinary Report',
      icon: FilePlus,
      allowed: canAccessTab(userRole, 'submit'),
      restrictedTooltip: `Filing disciplinary reports is not authorized for ${roleDef.name}.`,
    },
    {
      id: 'my-reports',
      label: getMyReportsLabel(),
      icon: Files,
      allowed: canAccessTab(userRole, 'my-reports'),
      badge: roleDef.isDistrictBound && correctionsCount > 0 ? correctionsCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'all-reports',
      label: 'All 13 Districts Reports',
      icon: FolderGit2,
      allowed: canAccessTab(userRole, 'all-reports'),
      restrictedTooltip: `Cross-district access requires Head Office Oversight, Compliance Auditor, or Administrator authority.`,
    },
    {
      id: 'review-queue',
      label: 'HO Review & Clearance Queue',
      icon: CheckCircle2,
      allowed: canAccessTab(userRole, 'review-queue'),
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
      badgeColor: 'bg-blue-600 text-white',
      restrictedTooltip: 'Restricted strictly to Head Office HR Oversight and Review personnel.',
    },
    {
      id: 'reports-download',
      label: 'Reports & Downloads',
      icon: DownloadCloud,
      allowed: canAccessTab(userRole, 'reports-download'),
    },
    {
      id: 'users',
      label: 'User Management & RBAC',
      icon: Users,
      allowed: canAccessTab(userRole, 'users'),
      restrictedTooltip: 'User Access Control List and Role Assignments are restricted to System Administrators.',
    },
    {
      id: 'districts',
      label: '13 Districts Registry',
      icon: MapPin,
      allowed: canAccessTab(userRole, 'districts'),
      restrictedTooltip: 'District operational directory managed by authorized leadership.',
    },
    {
      id: 'audit-log',
      label: 'System Audit Trail',
      icon: ShieldAlert,
      allowed: canAccessTab(userRole, 'audit-log'),
      restrictedTooltip: 'Immutable audit logs reserved for Head Office, Compliance Auditors, and Administrators.',
    },
    {
      id: 'offline-sync',
      label: 'Offline & Cloud Sync',
      icon: Database,
      allowed: canAccessTab(userRole, 'offline-sync'),
      badge: !isOnline ? 'OFFLINE' : offlineQueueCount > 0 ? offlineQueueCount : undefined,
      badgeColor: !isOnline ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white',
    },
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs sticky top-[73px] z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 overflow-x-auto py-2 scrollbar-thin">
          <div className="flex space-x-1 shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isAccessible = item.allowed;

              if (!isAccessible) {
                return (
                  <div
                    key={item.id}
                    title={item.restrictedTooltip || 'Restricted by RBAC security policy.'}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 dark:text-slate-600 cursor-not-allowed select-none bg-slate-50/50 dark:bg-slate-900/50 border border-transparent"
                  >
                    <Icon className="w-4 h-4 shrink-0 opacity-40" />
                    <span>{item.label}</span>
                    <Lock className="w-3 h-3 ml-0.5 text-slate-300 dark:text-slate-600 shrink-0" />
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 relative ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>

                  {item.badge !== undefined && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        item.badgeColor || 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* User Profile Security Settings Button */}
          {onOpenSecuritySettings && (
            <div className="shrink-0 pl-2">
              <button
                type="button"
                onClick={onOpenSecuritySettings}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition shadow-xs"
                title="Personalized Account Security & WebAuthn / Biometric Preferences"
              >
                <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline">Profile Security</span>
                <span className="sm:hidden">Security</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isBiometricActive ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                  title={isBiometricActive ? 'Biometric Authentication ON' : 'Biometric Authentication OFF'}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
