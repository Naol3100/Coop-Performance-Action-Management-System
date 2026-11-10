import React, { useState } from 'react';
import { AuditLogEntry } from '../types';
import { ShieldAlert, Search, Filter, Download, Clock, User, CheckCircle } from 'lucide-react';
import { downloadTableAsCSV } from '../utils/exportUtils';

interface AuditLogViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  const filteredLogs = logs.filter(log => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        log.AuditID.toLowerCase().includes(q) ||
        log.UserEmail.toLowerCase().includes(q) ||
        log.UserName.toLowerCase().includes(q) ||
        log.EntityID.toLowerCase().includes(q) ||
        log.ChangeSummary.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (selectedAction !== 'ALL' && log.Action !== selectedAction) {
      return false;
    }

    return true;
  });

  const handleExportAuditCSV = () => {
    const headers = ['Audit ID', 'Timestamp', 'User Email', 'User Name', 'Action', 'Entity Type', 'Entity ID', 'Change Summary', 'Reason For Change'];
    const rows = filteredLogs.map(l => [
      l.AuditID,
      l.Timestamp,
      l.UserEmail,
      l.UserName,
      l.Action,
      l.EntityType,
      l.EntityID,
      l.ChangeSummary,
      l.ReasonForChange
    ]);
    downloadTableAsCSV('Bank_HR_System_Audit_Trail', headers, rows);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('SUBMITTED')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">Report Submitted</span>;
    }
    if (action.includes('REVIEWED')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Report Reviewed</span>;
    }
    if (action.includes('CORRECTION')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">Correction Requested</span>;
    }
    if (action.includes('DEACTIVATED') || action.includes('ROLE')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">{action}</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{action}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-700 dark:text-indigo-400" />
              Immutable System Audit Log
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {filteredLogs.length} Records
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cryptographically verified audit trail preserving all disciplinary filings, reviewer approvals, corrections, and user administration actions.
            </p>
          </div>

          <button
            onClick={handleExportAuditCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-750 dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Trail (CSV)</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by user, action, entity ID, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Recorded Actions</option>
              <option value="REPORT_SUBMITTED">Report Submitted</option>
              <option value="REPORT_REVIEWED">Report Reviewed</option>
              <option value="CORRECTION_REQUESTED">Correction Requested</option>
              <option value="USER_ROLE_ASSIGNED">User Role Assigned</option>
              <option value="USER_DEACTIVATED">User Deactivated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3.5">Log ID</th>
                <th className="py-3 px-3.5">Timestamp</th>
                <th className="py-3 px-3.5">Actor / User</th>
                <th className="py-3 px-3.5">Action Type</th>
                <th className="py-3 px-3.5">Entity Target</th>
                <th className="py-3 px-3.5">Change Summary</th>
                <th className="py-3 px-3.5">Justification / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredLogs.map(log => (
                <tr key={log.AuditID} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3.5 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {log.AuditID}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(log.Timestamp).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{log.UserName}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">{log.UserEmail}</div>
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    {getActionBadge(log.Action)}
                  </td>
                  <td className="py-3 px-3.5 whitespace-nowrap font-mono text-[11px] text-blue-900 dark:text-blue-300 font-medium">
                    {log.EntityType}: {log.EntityID}
                  </td>
                  <td className="py-3 px-3.5 text-slate-800 dark:text-slate-200 max-w-xs">
                    {log.ChangeSummary}
                  </td>
                  <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs">
                    {log.ReasonForChange}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
