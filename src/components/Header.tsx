import React from 'react';
import { User, District, UserRole } from '../types';
import { getRoleDefinition, ALL_ROLES } from '../rbac/rbacPolicy';
import {
  ShieldCheck,
  Building2,
  UserCheck,
  Lock,
  Wifi,
  WifiOff,
  Database,
  LogIn,
  LogOut,
  HelpCircle,
  Briefcase,
  Fingerprint,
  Bot,
  Sparkles,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useFirebase } from '../context/FirebaseContext';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  districts: District[];
  onSwitchUser: (user: User) => void;
  systemName: string;
  onOpenOfflineCenter: () => void;
  unsyncedCount: number;
  onOpenGuide: () => void;
  onOpenAiAssistant?: () => void;
  canSwitchUser?: boolean;
  onSignOut?: () => void;
  onOpenSecuritySettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  districts,
  onSwitchUser,
  systemName,
  onOpenOfflineCenter,
  unsyncedCount,
  onOpenGuide,
  onOpenAiAssistant,
  canSwitchUser,
  onSignOut,
  onOpenSecuritySettings,
}) => {
  const currentDistrict = districts.find((d) => d.DistrictID === currentUser.DistrictID);
  const { isOnline } = useOnlineStatus();
  const { firebaseUser, authLoading, isConnected, signInWithGoogle, signOut } = useFirebase();

  const roleDef = getRoleDefinition(currentUser.Role);

  const isAuthorizedAdmin = Boolean(
    currentUser?.Role === 'ADMIN' ||
    (firebaseUser && (
      firebaseUser.email?.toLowerCase() === 'milkinaol31@gmail.com' ||
      firebaseUser.email?.toLowerCase() === 'bighabes@gmail.com' ||
      firebaseUser.email?.toLowerCase().includes('admin')
    )) ||
    canSwitchUser
  );

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top institution bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
        <div className="flex items-center space-x-2">
          <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
          <span className="font-semibold text-slate-200 uppercase tracking-wider">{systemName}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">EMPLOYEE PERFORMANCE DISCIPLINE CASE REPORT</span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Online/Offline status badge */}
          <button
            onClick={onOpenOfflineCenter}
            className={`flex items-center space-x-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition ${
              isOnline
                ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/80'
                : 'bg-amber-950 border-amber-800 text-amber-200 hover:bg-amber-900'
            }`}
            title="Click to open Offline & Sync Center"
          >
            {isOnline ? (
              <Wifi className="w-3 h-3 text-emerald-400" />
            ) : (
              <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />
            )}
            <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
            {unsyncedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-bold text-[9px]">
                {unsyncedCount}
              </span>
            )}
          </button>

          <span className="text-slate-700 hidden sm:inline">•</span>

          {/* AI Assistant Quick Trigger */}
          {onOpenAiAssistant && (
            <>
              <button
                onClick={onOpenAiAssistant}
                className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm border border-blue-400/30 transition transform hover:scale-[1.02]"
                title="Open CoopBank AI Disciplinary Advisor"
              >
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                <span>AI Advisor</span>
              </button>
              <span className="text-slate-700 hidden sm:inline">•</span>
            </>
          )}

          {/* In-App PWA Install Button */}
          <PWAInstallButton onOpenGuide={onOpenGuide} />

          <span className="text-slate-700 hidden sm:inline">•</span>

          {/* App Usage & Deployment Guide */}
          <button
            onClick={onOpenGuide}
            className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 shadow-sm transition"
            title="Open Complete Usage & Deployment Guide"
          >
            <HelpCircle className="w-3 h-3 text-indigo-200" />
            <span>App Guide</span>
          </button>

          <span className="text-slate-700 hidden sm:inline">•</span>

          {/* Persistent Dark Mode Toggle */}
          <ThemeToggle />

          <span className="text-slate-700 hidden sm:inline">•</span>

          {/* Cloud Firestore Status Badge */}
          <div
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
              isConnected
                ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
            }`}
            title={isConnected ? 'Connected to Cloud Firestore' : 'Firestore Standby'}
          >
            <Database className={`w-3 h-3 ${isConnected ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className="hidden md:inline">Firestore:</span>
            <span className={isConnected ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
              {isConnected ? 'Active' : 'Standby'}
            </span>
          </div>

          <span className="text-slate-700 hidden sm:inline">•</span>

          {/* Firebase Google Auth Button / Status */}
          {firebaseUser ? (
            <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
              <span className="max-w-[120px] truncate font-medium text-emerald-300" title={firebaseUser.email || ''}>
                {firebaseUser.email}
              </span>
              <button
                onClick={signOut}
                title="Sign Out of Firebase Google Auth"
                className="text-slate-400 hover:text-red-300 ml-1 p-0.5 rounded hover:bg-slate-700 transition"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              disabled={authLoading}
              className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white border border-blue-500 shadow-sm transition"
              title="Sign in with your Google account to sync live with Cloud Firestore"
            >
              <LogIn className="w-3 h-3" />
              <span>{authLoading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}

          {/* Account Log Out */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 transition"
              title="Sign Out of Current Session"
            >
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Main branding & user identity bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and system title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shadow-inner border border-blue-400/30">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              PERFORMANCE DISCIPLINE CASE REPORT
              <span className="text-xs font-normal px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                13 Districts
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              COOPERATIVE BANK OF OROMIA • Performance & Ethics Oversight Directorate
            </p>
          </div>
        </div>

        {/* Current Active User Profile */}
        <div className="flex items-center space-x-3 bg-slate-800/90 p-2 px-3 rounded-xl border border-slate-700 shadow-sm">
          {onOpenSecuritySettings && (
            <button
              type="button"
              onClick={onOpenSecuritySettings}
              className="p-1.5 rounded-lg bg-purple-950/70 border border-purple-800/80 text-purple-300 hover:bg-purple-900 hover:text-white transition shadow-xs flex items-center justify-center shrink-0"
              title="Personalized Biometric & WebAuthn Security Settings"
            >
              <Fingerprint className="w-4 h-4 text-purple-400" />
            </button>
          )}

          <div className="text-right">
            <div className="flex items-center justify-end space-x-2">
              <span className="text-sm font-semibold text-slate-100">{currentUser.FullName}</span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${roleDef.badgeBg} ${roleDef.badgeText} ${roleDef.badgeBorder}`}>
                {roleDef.name}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-end gap-1.5 mt-0.5">
              {roleDef.isDistrictBound ? (
                <>
                  <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 font-medium">
                    {currentDistrict?.DistrictName || 'District Not Assigned'}
                  </span>
                  <span className="text-slate-500 font-mono">({currentUser.DistrictID || 'N/A'})</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="text-blue-300 font-medium">{roleDef.category} • All 13 Districts</span>
                </>
              )}
            </div>
          </div>

          {/* User selector dropdown ONLY for Authorized Administrator */}
          {isAuthorizedAdmin && (
            <div className="relative">
              <label htmlFor="user-select" className="sr-only">Switch User Persona (Administrator Access Only)</label>
              <div className="flex items-center bg-slate-900 rounded-lg border border-purple-500/60 px-2 py-1.5 text-xs text-slate-200 shadow-inner">
                <UserCheck className="w-4 h-4 text-purple-400 mr-1.5 shrink-0" />
                <span className="text-[10px] font-mono uppercase text-purple-300 font-bold mr-1 hidden lg:inline">Admin Mode:</span>
                <select
                  id="user-select"
                  aria-label="Switch User Persona"
                  className="bg-transparent border-none text-xs text-slate-200 focus:outline-none focus:ring-0 cursor-pointer pr-4"
                  value={currentUser.UserID}
                  onChange={(e) => {
                    const selected = allUsers.find(u => u.UserID === e.target.value);
                    if (selected) onSwitchUser(selected);
                  }}
                >
                  {ALL_ROLES.map((roleKey) => {
                    const roleUsers = allUsers.filter((u) => u.Role === roleKey);
                    if (roleUsers.length === 0) return null;
                    const rDef = getRoleDefinition(roleKey);
                    return (
                      <optgroup key={roleKey} label={`${rDef.name} (${roleUsers.length})`}>
                        {roleUsers.map((u) => {
                          const dist = districts.find((d) => d.DistrictID === u.DistrictID);
                          const districtLabel = dist ? ` — ${dist.DistrictName}` : '';
                          return (
                            <option key={u.UserID} value={u.UserID} className="bg-slate-900 text-white">
                              {u.FullName}{districtLabel} {u.IsActive ? '(Active)' : '🔒 (INACTIVE)'}
                            </option>
                          );
                        })}
                      </optgroup>
                    );
                  })}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
