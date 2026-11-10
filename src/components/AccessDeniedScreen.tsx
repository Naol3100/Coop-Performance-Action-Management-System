import React from 'react';
import { ShieldAlert, UserX, Lock, LogOut, RefreshCw, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { User, District } from '../types';

interface AccessDeniedScreenProps {
  type: 'unregistered' | 'inactive';
  email?: string;
  user?: User | null;
  districts?: District[];
  onSignOut: () => void;
  onRefresh?: () => void;
  isAdminSession?: boolean;
  onReactivate?: (user: User) => void;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  type,
  email,
  user,
  districts = [],
  onSignOut,
  onRefresh,
  isAdminSession = false,
  onReactivate,
}) => {
  const displayEmail = email || user?.Email || 'Unknown Account';
  const displayName = user?.FullName || 'User';
  const districtName = districts.find((d) => d.DistrictID === user?.DistrictID)?.DistrictName || user?.DistrictID || 'Cross-District';

  if (type === 'unregistered') {
    return (
      <div className="max-w-2xl mx-auto my-12 px-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-red-500/40 shadow-xl overflow-hidden transition-colors">
          {/* Top Security Banner */}
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 p-6 text-white border-b border-red-900/60">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center shrink-0 shadow-inner">
                <UserX className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-900/80 text-red-300 border border-red-700/60 mb-1">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  Access Denied • Unregistered User
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Unauthorized Google Account
                </h2>
                <p className="text-xs text-red-200/80 mt-0.5">
                  Cooperative Bank of Oromia • Performance Discipline Case System
                </p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6">
            {/* Account Details Callout */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Attempted Sign-in Email:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{displayEmail}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Access Control Policy:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">Strict Whitelist Enforced</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 dark:text-slate-400 font-medium">System Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                  Not in User Access Control List
                </span>
              </div>
            </div>

            {/* Explanation Message */}
            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <p>
                Your Google account is authenticated, but it has <strong>not been provisioned</strong> in the Bank&apos;s User Access Control List (ACL). To protect confidential disciplinary records across the bank&apos;s 13 districts, only registered and active staff may enter.
              </p>

              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4 text-xs space-y-2">
                <div className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  How to Request Access:
                </div>
                <ol className="list-decimal pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
                  <li>
                    Contact the Lead HR Enterprise Administrator or your Regional HR Department.
                  </li>
                  <li>Provide your full official name, bank branch/office, and requested jurisdiction (District HR or Head Office Manager).</li>
                  <li>Once the Administrator registers your account and marks you as <strong>Active</strong>, sign in again.</li>
                </ol>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onSignOut}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out & Try Authorized Account</span>
              </button>

              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-check Permission</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Type === 'inactive'
  return (
    <div className="max-w-2xl mx-auto my-12 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-500/40 shadow-xl overflow-hidden transition-colors">
        {/* Top Inactive Security Banner */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-red-950 p-6 text-white border-b border-amber-900/60">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-amber-600/30 border border-amber-500/50 flex items-center justify-center shrink-0 shadow-inner">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-900/80 text-amber-300 border border-amber-700/60 mb-1">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                Access Restricted • Account Inactive
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Account Temporarily Deactivated
              </h2>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Cooperative Bank of Oromia • Performance Discipline Case System
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* User Profile Context */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">User Full Name:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{displayName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Registered Email:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{displayEmail}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Role & District:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {user?.Role || 'District HR'} • {districtName}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Account Status:</span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                INACTIVE (LOGIN BLOCKED)
              </span>
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <p>
              Your account is registered in the Bank&apos;s User Directory, but has been switched to{' '}
              <strong className="text-red-600 dark:text-red-400 font-bold">INACTIVE</strong> by the System Administrator. Access to case filing, reports, analytics, and district management has been restricted.
            </p>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 text-xs text-amber-900 dark:text-amber-200">
              <p className="font-semibold mb-1">Real-Time Access Re-evaluation:</p>
              <p className="text-[11px] leading-relaxed">
                As soon as the Lead HR Administrator toggles this account back to <strong>Active</strong> in the User Access Control List, this system will automatically refresh and restore full access in real time.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={onSignOut}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out Account</span>
            </button>

            <div className="flex items-center gap-2">
              {isAdminSession && user && onReactivate && (
                <button
                  onClick={() => onReactivate(user)}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition"
                  title="Admin Quick Action: Reactivate this user"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Reactivate User (Admin)</span>
                </button>
              )}

              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="px-3.5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Activation Status</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
