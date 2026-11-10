import React, { useState } from 'react';
import { User } from '../types';
import { getRoleDefinition } from '../rbac/rbacPolicy';
import {
  ShieldCheck,
  X,
  History,
  Lock,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  Clock,
  Briefcase,
  Building,
  Key,
  LogIn,
  AlertTriangle
} from 'lucide-react';

interface UserRbacModalProps {
  user: User;
  onClose: () => void;
}

export const UserRbacModal: React.FC<UserRbacModalProps> = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState<'permissions' | 'roles' | 'logins'>('permissions');
  const roleDef = getRoleDefinition(user.Role);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 transition-colors my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>RBAC & Security Audit</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleDef.badgeBg} ${roleDef.badgeText} ${roleDef.badgeBorder}`}>
                  {roleDef.name}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-mono">{user.FullName} ({user.Email})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">User ID</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{user.UserID}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Employee ID</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{user.EmployeeID || 'EMP-N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Department</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">{user.Department || 'Operations'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">District Scope</span>
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {roleDef.isDistrictBound ? (user.DistrictID || 'Unassigned') : 'Cross-District (13)'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('permissions')}
            className={`pb-2 border-b-2 transition ${
              activeTab === 'permissions'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Capabilities & Permissions ({roleDef.permissions.length})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`pb-2 border-b-2 transition ${
              activeTab === 'roles'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Role Change History ({user.RoleHistory?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('logins')}
            className={`pb-2 border-b-2 transition ${
              activeTab === 'logins'
                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Login History ({user.LoginHistory?.length || 0})
          </button>
        </div>

        {/* Tab 1: Role & Permissions Inspector */}
        {activeTab === 'permissions' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-purple-50/50 dark:bg-purple-950/20 p-2.5 rounded-lg border border-purple-100 dark:border-purple-900/40">
              {roleDef.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto p-1 scrollbar-thin">
              {roleDef.permissions.map((perm) => (
                <div
                  key={perm}
                  className="flex items-center space-x-2 text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">{perm}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Role Change History Trail */}
        {activeTab === 'roles' && (
          <div className="space-y-2">
            {(!user.RoleHistory || user.RoleHistory.length === 0) ? (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No historical role changes recorded. Account initialized under role: <strong>{roleDef.name}</strong>.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto scrollbar-thin">
                {user.RoleHistory.map((rec, i) => (
                  <div
                    key={rec.id || i}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">
                          {rec.previousRole}
                        </span>
                        <span>→</span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold font-mono text-[10px]">
                          {rec.newRole}
                        </span>
                      </span>
                      <span className="text-slate-400 font-mono">{new Date(rec.changedAt).toLocaleString()}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Changed by: <span className="font-medium text-slate-700 dark:text-slate-300">{rec.changedByName || rec.changedByEmail}</span>
                    </div>
                    {rec.reason && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                        <strong className="text-slate-700 dark:text-slate-300">Reason:</strong> {rec.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Login History */}
        {activeTab === 'logins' && (
          <div className="space-y-2">
            {(!user.LoginHistory || user.LoginHistory.length === 0) ? (
              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                {user.LastLogin ? (
                  <span>Last active on: <strong>{new Date(user.LastLogin).toLocaleString()}</strong></span>
                ) : (
                  <span>No login events recorded yet.</span>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                {user.LoginHistory.map((lh, i) => (
                  <div
                    key={lh.id || i}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {lh.authMethod} Authentication
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Role: {lh.roleAtLogin}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {new Date(lh.timestamp).toLocaleString()}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {lh.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Account Life-Cycle Metadata */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 grid grid-cols-2 gap-2">
          <div>
            <strong>Created:</strong> {user.CreatedAt ? new Date(user.CreatedAt).toLocaleDateString() : 'Initial Setup'} ({user.CreatedBy || 'System'})
          </div>
          <div className="text-right">
            <strong>Last Updated:</strong> {user.UpdatedAt ? new Date(user.UpdatedAt).toLocaleDateString() : 'N/A'} {user.UpdatedBy ? `by ${user.UpdatedBy}` : ''}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
