import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Laptop,
  Globe,
  Database,
  ShieldCheck,
  CheckCircle,
  Copy,
  ExternalLink,
  DownloadCloud,
  Building2,
  Users,
  FileText
} from 'lucide-react';

interface AppDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedUrl?: string;
  userEmail?: string;
}

export const AppDeploymentModal: React.FC<AppDeploymentModalProps> = ({
  isOpen,
  onClose,
  sharedUrl = 'https://ais-pre-nzdkv634l2ocsts4nn4x6i-434006416671.europe-west2.run.app',
  userEmail = 'admin@coopbank.com',
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'use-now' | 'district-restriction' | 'install-pwa' | 'real-enterprise'>('district-restriction');

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(sharedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      setCopied(false);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                COOPERATIVE BANK OF OROMIA
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Live & Production-Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Performance Discipline Case Report • 13 Districts Enterprise System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 px-6 pt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('district-restriction')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'district-restriction'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-500" />
            <span>District Data Restriction</span>
          </button>
          <button
            onClick={() => setActiveTab('use-now')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'use-now'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>How to Use</span>
          </button>
          <button
            onClick={() => setActiveTab('install-pwa')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'install-pwa'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Install App (Mobile & PC)</span>
          </button>
          <button
            onClick={() => setActiveTab('real-enterprise')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'real-enterprise'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 rounded-t-lg'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Enterprise Setup</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs leading-relaxed">
          {/* TAB 0: DISTRICT DATA RESTRICTION & USER ISOLATION */}
          {activeTab === 'district-restriction' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-800 text-white space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      District Data Restriction Architecture
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700">
                        Adama District (DIST-01)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      How to restrict a District HR user to view solely their assigned district's data.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Step Implementation Flow */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  How It Works (Step-by-Step)
                </h4>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
                    Admin Assigns Role & District in User Management
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                    As Lead Administrator, go to the <strong>Users</strong> tab in the navigation bar. Click <strong>Provision New User</strong> or edit an existing employee profile:
                  </p>
                  <ul className="list-disc list-inside pl-7 space-y-1 text-slate-600 dark:text-slate-300 font-medium">
                    <li><strong>Enter your registered email:</strong> <code>adama.hr@coopbank.com</code></li>
                    <li><strong>Role:</strong> <code>District HR User (Restricted to Assigned District)</code></li>
                    <li><strong>Assigned District:</strong> <code>ADA - Adama District (DIST-01)</code></li>
                  </ul>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-7">
                    Click <strong>Save User Account</strong>. This writes the binding directly to Cloud Firestore and syncs across all bank devices.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">2</span>
                    Automatic Identity Matching via Google Sign-In
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                    When the District HR user opens the app and clicks <strong>Sign in with Google</strong>, the app matches their verified Google email address against the Bank HR Directory.
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 pl-7 leading-relaxed">
                    Their session is immediately locked to <strong>Role = DISTRICT_HR</strong> and <strong>DistrictID = DIST-01 (Adama District)</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">3</span>
                    Strict 5-Level Data Isolation Enforced
                  </div>
                  <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-slate-600 dark:text-slate-300">
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-bold text-slate-900 dark:text-white block mb-0.5">District Dashboard</span>
                      Displays only Adama metrics, active case counts, and Director follow-ups.
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Registry Isolation</span>
                      Filters the case table so reports from Bahir Dar, Chiro, Hawasa, Jimma, etc. are completely invisible.
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Cross-District Block</span>
                      The "All 13 Districts Reports", "HO Review Queue", and "Users" tabs are locked.
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <span className="font-bold text-slate-900 dark:text-white block mb-0.5">Filing & Export Locked</span>
                      New filings automatically lock the district to Adama; CSV exports only download Adama records.
                    </div>
                  </div>
                </div>
              </div>

              {/* Whitelist & Active/Inactive Access Control */}
              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 space-y-3">
                <span className="font-bold text-purple-900 dark:text-purple-300 block text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Whitelist Enforcement: Registered & Active Users Only</span>
                </span>
                <p className="text-purple-900/80 dark:text-purple-200/80 text-[11px] leading-relaxed">
                  The system enforces strict bank enterprise authentication:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-lg border border-purple-200 dark:border-purple-900 bg-white dark:bg-slate-900/60">
                    <span className="font-bold text-red-600 dark:text-red-400 block mb-0.5">1. Unregistered Google Accounts</span>
                    If an email not listed in the User Access Control List tries to sign in, they are blocked with an "Access Denied: Unregistered User" screen.
                  </div>
                  <div className="p-2.5 rounded-lg border border-purple-200 dark:border-purple-900 bg-white dark:bg-slate-900/60">
                    <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">2. Inactive / Deactivated Users</span>
                    If an existing user is switched to Inactive (e.g. by toggling "Deactivate" in the Admin table), their access is immediately suspended in real-time.
                  </div>
                </div>
              </div>

              {/* Instant Interactive Testing */}
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 space-y-2">
                <span className="font-bold text-emerald-900 dark:text-emerald-300 block text-xs">
                  How You Can Test This Right Now:
                </span>
                <ul className="list-disc pl-4 text-emerald-800 dark:text-emerald-200 leading-relaxed text-[11px] space-y-1">
                  <li>
                    <strong>Test District Isolation:</strong> Switch to <em>Milkina (Adama District HR)</em>. The entire app locks to Adama data only.
                  </li>
                  <li>
                    <strong>Test Inactive Deactivation:</strong> In Admin Mode, switch to <em>Robert Langdon (Deactivated)</em> or click "Deactivate" on any user in the Users tab. The screen immediately locks and displays the <em>Access Suspended: Account Inactive</em> shield!
                  </li>
                  <li>
                    <strong>Test Reactivation:</strong> Click "Reactivate" in the User Management list, and that account is instantly restored to active status!
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 1: HOW TO USE RIGHT NOW */}
          {activeTab === 'use-now' && (
            <div className="space-y-5">
              {/* Live URL Banner */}
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Live App Public Web Link:
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-600 text-white">
                    Always Online
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  You can immediately open and use this app on any mobile phone, tablet, or desktop computer using your browser:
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    readOnly
                    value={sharedUrl}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-blue-700 dark:text-blue-300 select-all"
                  />
                  <button
                    onClick={handleCopyUrl}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shrink-0"
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Roles & Quick Start Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                    1
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Admin & Google Login</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Click <strong>"Sign in with Google"</strong> in the top header. Your email (<code className="text-blue-600 dark:text-blue-400 font-mono">{userEmail}</code>) is automatically recognized as <strong>Lead HR Enterprise Administrator</strong> with full access across all 13 districts.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                    2
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white">The 13 Districts</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Preloaded with your 13 districts: <em>Adama District, Bahir Dar RO, Chiro, Dire Dawa, East Finfinne, Hawasa, Jimma, Mekelle RO, Nekemte, North Finfine, Shashemane, South Finfine, and West Finfine</em>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                    3
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Official Print & Export</h4>
                  <p className="text-slate-600 dark:text-slate-400">
                    Generate standard <strong>Official Disciplinary Documents</strong> with bank letterhead, reference numbers, and signature blocks. Export CSV/Excel logs anytime from "Reports & Downloads".
                  </p>
                </div>
              </div>

              {/* Roles Workflow Guide */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  Key Roles & Workflow in Cooperative Bank of Oromia
                </h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold shrink-0">
                      District HR Officer
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Fills out incident reports for branch staff, specifies policy breaches (attendance, cash custody, ethics), attaches sanction recommendations, and submits to Head Office.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-semibold shrink-0">
                      Head Office HR Manager
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Reviews cases across all 13 districts in the "HO Review Queue", requests corrections, or registers final approvals and sanction codes.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-semibold shrink-0">
                      Enterprise Admin
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Manages district officers, assigns new users, configures reporting quarters, and oversees the complete immutable system audit trail.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INSTALL AS APP (PWA) */}
          {activeTab === 'install-pwa' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4 text-blue-500" />
                  Progressive Web App (PWA) - Instant App Installation
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  This application is built with modern PWA standards. It installs directly onto your device without needing the Google Play Store or Apple App Store, and includes full offline support with caching.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mobile Installation */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>On Android & iPhone</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300 pl-1">
                    <li>
                      <strong>Android (Chrome):</strong> Open the link, tap the 3 dots menu at top right, and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </li>
                    <li>
                      <strong>iPhone / iPad (Safari):</strong> Open the link in Safari, tap the <strong>Share</strong> button (box with upward arrow), scroll down, and tap <strong>"Add to Home Screen"</strong>.
                    </li>
                    <li>
                      An icon named <strong>"BankHR Disc"</strong> with the Cooperative Bank of Oromia insignia appears on your home screen.
                    </li>
                    <li>
                      Opens in standalone fullscreen mode without the browser URL bar, just like any native app.
                    </li>
                  </ol>
                </div>

                {/* PC & Desktop Installation */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
                    <Laptop className="w-4 h-4 text-blue-500" />
                    <span>On Windows, Mac & Linux</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300 pl-1">
                    <li>
                      <strong>Chrome / Edge / Brave:</strong> Look at the right side of the address bar for the <strong>Install</strong> icon (computer monitor with download arrow).
                    </li>
                    <li>
                      Or click the <strong>"Install App"</strong> button in the top navigation bar.
                    </li>
                    <li>
                      Click <strong>"Install"</strong> in the prompt.
                    </li>
                    <li>
                      It creates a dedicated desktop window and Start Menu / Launchpad app shortcut with full offline capabilities!
                    </li>
                  </ol>
                </div>
              </div>

              {/* Offline & Resiliency */}
              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 space-y-2">
                <h4 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-500" />
                  Branch Offline Resilience Guarantee
                </h4>
                <p className="text-amber-800 dark:text-amber-200">
                  In regional bank branches where connectivity is intermittent, District HR officers can continue filing disciplinary cases offline. Cases are saved locally with encryption, queued, and automatically synced to Cloud Firestore as soon as connection is restored.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: ENTERPRISE REAL APP DEPLOYMENT */}
          {activeTab === 'real-enterprise' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  Enterprise Production Setup for Cooperative Bank of Oromia
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  To roll out this system bank-wide across your IT infrastructure:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] flex items-center justify-center font-bold">1</span>
                    Custom Bank Domain & SSL
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    You can point a bank subdomain such as <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono">discipline.coopbankoromia.com.et</code> directly to the Cloud Run or Firebase Hosting instance with automated SSL certificates.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] flex items-center justify-center font-bold">2</span>
                    Corporate Google Workspace or Microsoft Azure AD SSO
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    The current Firebase Authentication supports restricting logins exclusively to bank corporate domain emails (e.g. <code className="font-mono">@coopbankoromia.com.et</code>) so unauthorized accounts cannot access internal HR records.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] flex items-center justify-center font-bold">3</span>
                    Android APK / iOS Packaging (Optional)
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Because this is a compliant PWA, you can instantly generate a signed Android APK using <strong>PWABuilder</strong> (or Google's <em>Bubblewrap</em> CLI) if your bank IT department deploys apps via Mobile Device Management (MDM).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] flex items-center justify-center font-bold">4</span>
                    Continuous Cloud Database Storage
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Your database is already provisioned in Google Cloud (<code className="font-mono text-purple-600 dark:text-purple-400">ai-studio-bankhrdisciplina-364e8703-41e4-4d4f-89c5-0ad09f3ad5bd</code>) with Firestore security rules enforcing role-based boundaries.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Ready for active use by Cooperative Bank of Oromia HR staff</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm transition"
          >
            Got It, Let's Use It
          </button>
        </div>
      </div>
    </div>
  );
};
