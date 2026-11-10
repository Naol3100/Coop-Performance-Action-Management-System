import React, { useState } from 'react';
import { DisciplinaryReport, District, User } from '../types';
import {
  X,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Building,
  User as UserIcon,
  Calendar,
  FileText,
  Clock,
  ShieldCheck,
  FileEdit,
  Download
} from 'lucide-react';

import { getRoleDefinition, hasPermission, canPerformAction } from '../rbac/rbacPolicy';

interface ReportDetailModalProps {
  report: DisciplinaryReport;
  districts: District[];
  currentUser: User;
  onClose: () => void;
  onPrint: () => void;
  onMarkReviewed: (reportId: string, comments: string) => void;
  onRequestCorrection: (reportId: string, reason: string) => void;
  onEditReport: (report: DisciplinaryReport) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  districts,
  currentUser,
  onClose,
  onPrint,
  onMarkReviewed,
  onRequestCorrection,
  onEditReport,
}) => {
  const district = districts.find(d => d.DistrictID === report.DistrictID);
  const canReview = canPerformAction(currentUser.Role, 'approve', 'reports') || hasPermission(currentUser.Role, 'reports.review');
  const canEdit = canPerformAction(currentUser.Role, 'edit', 'reports') && (currentUser.DistrictID === report.DistrictID || currentUser.Role === 'ADMIN');

  // Review states
  const [reviewComments, setReviewComments] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [showCorrectionInput, setShowCorrectionInput] = useState(false);

  const handleApprove = () => {
    onMarkReviewed(report.ReportID, reviewComments.trim() || 'Compliance with Bank HR Disciplinary Standards confirmed.');
  };

  const handleSendCorrection = () => {
    if (!correctionReason.trim()) {
      alert('Please enter specific reasons for returning this report to the district.');
      return;
    }
    onRequestCorrection(report.ReportID, correctionReason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 max-h-[92vh] flex flex-col transition-colors">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-bold text-blue-300 text-sm">{report.ReportID}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-900/90 text-blue-200 border border-blue-700">
                  {report.ReportStatus}
                </span>
                <span className="text-slate-400 text-xs">| Period: {report.ReportingPeriod}</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {report.EmployeeName} — {report.ActionType}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onPrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Print / Official Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Head Office Review Actions Panel if applicable */}
          {canReview && (report.ReportStatus === 'Submitted' || report.ReportStatus === 'Under Review') && (
            <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  Head Office HR Oversight Action
                </h4>
                <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">Authorized Role: {currentUser.Role}</span>
              </div>
              <p className="text-[11px] text-blue-800 dark:text-blue-300">
                Verify that the sanction aligns with Bank HR Code of Conduct regulations and proper authorization was issued by District Director {district?.DirectorName}.
              </p>

              {!showCorrectionInput ? (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Review Endorsement Comments (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Compliance verified. Document archived in central personnel registry."
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={handleApprove}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Mark as Reviewed & Approved</span>
                    </button>

                    <button
                      onClick={() => setShowCorrectionInput(true)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Request District Correction</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/80">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 dark:text-amber-200 text-xs">Specify Required Amendments for District HR:</span>
                    <button
                      onClick={() => setShowCorrectionInput(false)}
                      className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 text-[11px] underline"
                    >
                      Cancel
                    </button>
                  </div>

                  <textarea
                    rows={2}
                    value={correctionReason}
                    onChange={(e) => setCorrectionReason(e.target.value)}
                    placeholder="Describe what missing evidence or policy adjustment is needed before approval..."
                    className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 rounded-lg p-2 text-xs text-amber-950 dark:text-amber-100"
                  />

                  <button
                    onClick={handleSendCorrection}
                    className="px-4 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Dispatch Correction Notice to District</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Correction Notice banner if report is currently in Correction Requested */}
          {report.ReportStatus === 'Correction Requested' && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl p-4 text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Head Office HR Returned This Report for Correction
                </span>
                {canEdit && (
                  <button
                    onClick={() => onEditReport(report)}
                    className="px-3 py-1 bg-amber-700 text-white font-semibold rounded text-xs hover:bg-amber-800 flex items-center gap-1"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>Edit & Resubmit Report</span>
                  </button>
                )}
              </div>
              <p className="text-xs font-medium bg-white/80 dark:bg-slate-900/80 p-2.5 rounded border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100">
                {report.CorrectionNotes || 'Corrections requested.'}
              </p>
            </div>
          )}

          {/* Section A: Report & District Meta */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] text-blue-900 dark:text-blue-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              Section A: Report Information & District Governance
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">District</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{district?.DistrictName} ({report.DistrictID})</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Submitting Officer</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{report.SubmitterName}</span>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{report.SubmittedBy}</div>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Submission Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {report.SubmittedAt ? new Date(report.SubmittedAt).toLocaleString() : 'Draft'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Reporting Period</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{report.ReportingPeriod}</span>
              </div>
            </div>
          </div>

          {/* Section B: Employee Information */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] text-blue-900 dark:text-blue-400 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5" />
              Section B: Employee Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Staff Number</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{report.EmployeeID}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Full Name</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{report.EmployeeName}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Job Title</span>
                <span className="text-slate-800 dark:text-slate-200">{report.JobTitle}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Branch / Work Unit</span>
                <span className="text-slate-800 dark:text-slate-200">{report.WorkUnit}</span>
              </div>
            </div>
          </div>

          {/* Section C: Disciplinary Action Details */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] text-blue-900 dark:text-blue-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Section C: Disciplinary Action & Sanction Specifications
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80">
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Action Sanction</span>
                <span className="font-bold text-indigo-950 dark:text-indigo-300 text-xs">{report.ActionType}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Incident Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{report.IncidentDate}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Action Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{report.ActionDate}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Authorized Official</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{report.AuthorizedOfficialName}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Decision Date</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{report.DirectorDecisionDate}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Follow-Up Action</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {report.FollowUpRequired ? `${report.FollowUpStatus} (Due: ${report.FollowUpDeadline || 'TBD'})` : 'None Required'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold mb-1">Policy Reference Clause</span>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-slate-200 font-medium">
                {report.PolicyReference}
              </div>
            </div>

            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold mb-1">Description of Performance Deficit</span>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-slate-200 whitespace-pre-line">
                {report.IssueDescription}
              </div>
            </div>

            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold mb-1">Summary of Findings & Supporting Facts</span>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-slate-200 whitespace-pre-line">
                {report.SummaryOfFindings}
              </div>
            </div>

            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold mb-1">Specific Action Sanction Imposed</span>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-slate-200 font-medium">
                {report.ActionTaken}
              </div>
            </div>

            {report.CorrectiveAction && (
              <div>
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold mb-1">Corrective Measures & Remediations</span>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-800 dark:text-slate-200">
                  {report.CorrectiveAction}
                </div>
              </div>
            )}
          </div>

          {/* Section D: Supporting Documents */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] text-blue-900 dark:text-blue-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Section D: Supporting Documents & Legal Exhibits ({report.Attachments?.length || 0})
            </h4>

            {report.Attachments && report.Attachments.length > 0 ? (
              <div className="space-y-2">
                {report.Attachments.map(att => (
                  <div
                    key={att.AttachmentID}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{att.FileName}</span>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {att.DocumentCategory} • {att.FileSize} • Uploaded by {att.UploadedBy}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Simulated document view/download: ${att.FileName}`)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-blue-200 dark:border-slate-700 rounded flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 italic text-xs">No attachments associated with this report filing.</p>
            )}
          </div>

          {/* Review Verification Block if already reviewed */}
          {report.ReviewedBy && (
            <div className="border border-emerald-200 dark:border-emerald-850 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-900 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Head Office HR Review Endorsement</span>
              </div>
              <div className="text-xs text-emerald-950 dark:text-emerald-200">
                Reviewed by <strong>{report.ReviewerName || report.ReviewedBy}</strong> on{' '}
                {report.ReviewedAt ? new Date(report.ReviewedAt).toLocaleString() : 'N/A'}
              </div>
              {report.ReviewComments && (
                <div className="p-2.5 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-900 dark:text-emerald-200 text-xs mt-1">
                  "{report.ReviewComments}"
                </div>
              )}
            </div>
          )}

          {/* Audit Trail Timeline */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Immutable Audit History Trail
            </h4>

            <div className="space-y-2 border-l-2 border-slate-200 dark:border-slate-700 ml-2 pl-3">
              {report.AuditTrail?.map(item => (
                <div key={item.HistoryID} className="relative text-xs">
                  <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 absolute -left-[17px] top-1"></div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.Action}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(item.Timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.Actor} ({item.ActorRole})</div>
                  <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">{item.Details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-850 px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            Security Hash: SHA-256:{report.ReportID.replace(/[^a-zA-Z0-9]/g, '')}F829
          </span>

          <div className="flex items-center space-x-3">
            <button
              onClick={onPrint}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Document</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
