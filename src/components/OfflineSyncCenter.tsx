import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { OfflineQueueItem } from '../utils/offlineStorage';
import { DisciplinaryReport, District } from '../types';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  HardDrive,
  FileText,
  RotateCcw
} from 'lucide-react';
import { downloadTableAsCSV } from '../utils/exportUtils';

interface OfflineSyncCenterProps {
  queue: OfflineQueueItem[];
  reports: DisciplinaryReport[];
  districts: District[];
  onSyncAll: () => void;
  isSyncing: boolean;
  onResetData: () => void;
}

export const OfflineSyncCenter: React.FC<OfflineSyncCenterProps> = ({
  queue,
  reports,
  districts,
  onSyncAll,
  isSyncing,
  onResetData,
}) => {
  const { isOnline, isSimulated, toggleSimulateOffline } = useOnlineStatus();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleExportLocalCache = () => {
    const headers = ['Report ID', 'District ID', 'Employee ID', 'Employee Name', 'Action Type', 'Report Status', 'Submitted At'];
    const rows = reports.map(r => [
      r.ReportID,
      r.DistrictID,
      r.EmployeeID,
      r.EmployeeName,
      r.ActionType,
      r.ReportStatus,
      r.SubmittedAt || 'Draft'
    ]);
    downloadTableAsCSV('Bank_HR_Offline_Cached_Database', headers, rows);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Database className="w-4 h-4" />
              <span>Offline Architecture & Resilience Center</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Offline Mode & Data Synchronization
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              COOPERATIVE BANK OF OROMIA HR application with complete offline capability. File disciplinary actions without connectivity; changes are queued locally and automatically synced once online.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => toggleSimulateOffline()}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 shadow ${
                isOnline
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isOnline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              <span>{isOnline ? 'Simulate Offline Mode' : 'Restore Online Mode'}</span>
            </button>

            {queue.length > 0 && isOnline && (
              <button
                onClick={onSyncAll}
                disabled={isSyncing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Now ({queue.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Connectivity Status & Local Cache Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Network Status Card */}
        <div className={`p-4 rounded-xl border shadow-sm transition-colors ${
          isOnline
            ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800/80'
            : 'bg-amber-50/50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Connection State</span>
            {isOnline ? (
              <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
            )}
          </div>
          <div className={`text-xl font-bold ${isOnline ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {isSimulated
              ? 'Simulated offline environment'
              : isOnline
              ? 'Connected to central network'
              : 'Local storage active'}
          </div>
        </div>

        {/* Queued Filings */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-1 text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Unsynced Queue</span>
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{queue.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {queue.length === 0 ? 'All filings synchronized' : 'Awaiting sync transmission'}
          </div>
        </div>

        {/* Cached Reports in LocalStorage */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-1 text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Cached Reports</span>
            <HardDrive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-indigo-950 dark:text-indigo-300">{reports.length}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Persisted locally</div>
        </div>

        {/* PWA Standalone Status */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-1 text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">PWA Status</span>
            <DownloadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isInstalled ? 'Installed App' : 'Web App'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {isInstalled ? 'Standalone Mode' : 'Service Worker Active'}
          </div>
        </div>
      </div>

      {/* Offline Sync Queue Details */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Pending Offline Synchronization Queue
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Reports drafted or submitted while disconnected from the central server
            </p>
          </div>

          {queue.length > 0 && isOnline && (
            <button
              onClick={onSyncAll}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Transmit & Sync to Head Office</span>
            </button>
          )}
        </div>

        {queue.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Queue is completely empty</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              All disciplinary filings have been synchronized with the master database. You can safely file new reports even if you lose network connection.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Queue ID</th>
                  <th className="py-2.5 px-3">Report Reference</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">District</th>
                  <th className="py-2.5 px-3">Queued Time</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {queue.map(item => (
                  <tr key={item.queueId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{item.queueId}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-900 dark:text-blue-300 font-semibold">{item.reportId}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-slate-100">{item.employeeName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">{item.districtId}</td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-semibold border border-blue-200 dark:border-blue-800">
                        {item.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800">
                        Pending Sync
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How Offline Mode Works in AI Studio App */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-3 text-xs transition-colors">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Local Persistence Architecture
          </h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Every submission, edit, user profile, and audit entry is stored immediately in the browser's persistent storage. Even during power loss, accidental tab closure, or complete network disconnection, your data remains intact.
          </p>
          <div className="pt-2 flex items-center space-x-2">
            <button
              onClick={handleExportLocalCache}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-750 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Backup Local Cache (CSV)</span>
            </button>
            <button
              onClick={() => {
                if (confirm('Reset local storage back to default bank records?')) {
                  onResetData();
                }
              }}
              className="px-3 py-1.5 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default Sample Data</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-3 text-xs transition-colors">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
            <DownloadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Progressive Web App (PWA) Capabilities
          </h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            This application is configured as a production PWA with a Service Worker precaching all static assets (HTML, scripts, styles, icons). It can be installed as a standalone desktop or mobile application.
          </p>
          {isInstallable ? (
            <button
              onClick={install}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Install to Desktop / Mobile</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded border border-slate-200 dark:border-slate-800">
              Service Worker registered. PWA manifest configured for standalone mode with offline fallback.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
