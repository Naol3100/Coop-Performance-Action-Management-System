import React from 'react';
import { DisciplinaryReport, District } from '../types';
import { Printer, X, ArrowLeft, Shield } from 'lucide-react';
import { printElement } from '../utils/exportUtils';

interface OfficialPrintDocumentProps {
  report: DisciplinaryReport;
  district?: District;
  onBack: () => void;
}

export const OfficialPrintDocument: React.FC<OfficialPrintDocumentProps> = ({
  report,
  district,
  onBack,
}) => {
  const handlePrint = () => {
    printElement('printable-document-content');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-16">
      {/* Action toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Records</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            Print preview ready for official bank archiving or PDF export.
          </span>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet View */}
      <div
        id="printable-document-content"
        className="bg-white rounded-xl border border-slate-300 shadow-xl p-8 sm:p-12 text-slate-900 space-y-6 relative print:shadow-none print:border-none print:p-0"
      >
        {/* Top Bank Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 font-extrabold text-lg sm:text-xl tracking-wider uppercase">
              <Shield className="w-6 h-6 text-blue-900 inline-block" />
              <span>COOPERATIVE BANK OF OROMIA</span>
            </div>
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide mt-1">
              Human Resources Directorate • Performance & Ethics Oversight Division
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Head Office: Bole, Finfinne • Official HR Record Format HR-FORM-2026-DISC
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block bg-red-100 text-red-900 border border-red-300 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
              Strictly Confidential
            </span>
            <div className="font-mono text-xs font-bold text-slate-800 mt-2">
              Doc Ref: {report.ReportID}
            </div>
            <div className="text-[11px] text-slate-500">
              Generated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Document Title Banner */}
        <div className="text-center py-2 bg-slate-50 border border-slate-200 rounded">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wide">
            PERFORMANCE DISCIPLINE CASE REPORT
          </h2>
          <p className="text-xs text-slate-600">
            Formally logged under COOPERATIVE BANK OF OROMIA Code of Conduct & Performance Regulations
          </p>
        </div>

        {/* Section A: Report Metadata */}
        <div>
          <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider bg-slate-100 px-3 py-1.5 border-l-4 border-blue-900 mb-2">
            Section A: Report Information & District Governance
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 border border-slate-200 rounded text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Reporting District</span>
              <span className="font-bold text-slate-900">{district?.DistrictName} ({report.DistrictID})</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Reporting HR Officer</span>
              <span className="font-medium text-slate-900">{report.SubmitterName}</span>
              <div className="text-[10px] text-slate-500">{report.SubmittedBy}</div>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Filing Period</span>
              <span className="font-medium text-slate-900">{report.ReportingPeriod}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Report Status</span>
              <span className="font-bold text-blue-900 uppercase">{report.ReportStatus}</span>
            </div>
          </div>
        </div>

        {/* Section B: Employee Information */}
        <div>
          <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider bg-slate-100 px-3 py-1.5 border-l-4 border-blue-900 mb-2">
            Section B: Employee Information
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 border border-slate-200 rounded text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Employee ID / Staff No</span>
              <span className="font-mono font-bold text-slate-900">{report.EmployeeID}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Employee Full Name</span>
              <span className="font-bold text-slate-900">{report.EmployeeName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Job Title / Position</span>
              <span className="font-medium text-slate-800">{report.JobTitle}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Branch / Work Unit</span>
              <span className="font-medium text-slate-800">{report.WorkUnit}</span>
            </div>
          </div>
        </div>

        {/* Section C: Disciplinary Action Details */}
        <div>
          <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider bg-slate-100 px-3 py-1.5 border-l-4 border-blue-900 mb-2">
            Section C: Disciplinary Action & Sanction Specifications
          </h3>
          <div className="border border-slate-200 rounded p-4 text-xs space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Sanction Type Imposed</span>
                <span className="font-bold text-red-950 text-sm">{report.ActionType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Incident Date</span>
                <span className="font-medium text-slate-800">{report.IncidentDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Action Effective Date</span>
                <span className="font-medium text-slate-800">{report.ActionDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Authorized Official</span>
                <span className="font-bold text-slate-900">{report.AuthorizedOfficialName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Director Decision Date</span>
                <span className="font-medium text-slate-800">{report.DirectorDecisionDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Follow-Up Review</span>
                <span className="font-medium text-slate-800">
                  {report.FollowUpRequired ? `${report.FollowUpStatus} (Due: ${report.FollowUpDeadline || 'N/A'})` : 'None Required'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                Governing Policy Standard & Clause
              </span>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">
                {report.PolicyReference}
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                Description of Performance Deficiency / Non-Adherence
              </span>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 whitespace-pre-line leading-relaxed">
                {report.IssueDescription}
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                Summary of Findings & Corroborating Facts
              </span>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 whitespace-pre-line leading-relaxed">
                {report.SummaryOfFindings}
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                Disciplinary Sanctions & Administrative Orders Imposed
              </span>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-900">
                {report.ActionTaken}
              </div>
            </div>

            {report.CorrectiveAction && (
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">
                  Required Corrective Measures & Performance Benchmark Deadlines
                </span>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800">
                  {report.CorrectiveAction}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section D: Supporting Documents Inventory */}
        <div>
          <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider bg-slate-100 px-3 py-1.5 border-l-4 border-blue-900 mb-2">
            Section D: Attached Evidentiary Exhibits & Authorizations
          </h3>
          <div className="border border-slate-200 rounded p-3 text-xs">
            {report.Attachments && report.Attachments.length > 0 ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase">
                    <th className="py-1">Document Category</th>
                    <th className="py-1">Filename</th>
                    <th className="py-1">Size</th>
                    <th className="py-1">Upload Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.Attachments.map(att => (
                    <tr key={att.AttachmentID}>
                      <td className="py-1.5 font-medium text-slate-800">{att.DocumentCategory}</td>
                      <td className="py-1.5 font-mono text-[11px] text-blue-900">{att.FileName}</td>
                      <td className="py-1.5 text-slate-500">{att.FileSize}</td>
                      <td className="py-1.5 text-slate-500">{new Date(att.UploadedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-slate-500 italic">No formal file attachments cataloged with this filing.</p>
            )}
          </div>
        </div>

        {/* Head Office Review Endorsement if Reviewed */}
        {report.ReviewedBy && (
          <div className="border border-emerald-300 bg-emerald-50/40 rounded p-3 text-xs">
            <span className="font-bold text-emerald-900 uppercase text-[10px] block mb-1">
              Head Office HR Oversight Endorsement
            </span>
            <p className="text-emerald-950">
              Verified & Cleared by <strong>{report.ReviewerName || report.ReviewedBy}</strong> on{' '}
              {report.ReviewedAt ? new Date(report.ReviewedAt).toLocaleString() : 'N/A'}.
            </p>
            {report.ReviewComments && (
              <p className="italic text-emerald-900 mt-1">"{report.ReviewComments}"</p>
            )}
          </div>
        )}

        {/* Section E: Formal Signature Blocks */}
        <div className="pt-6 border-t border-slate-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Submitting HR Officer Signature */}
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Submitting District HR Officer</div>
              <div className="font-bold text-slate-900 text-xs mt-1">{report.SubmitterName}</div>
              <div className="text-[10px] text-slate-500">{report.SubmittedBy}</div>
              <div className="border-t border-slate-900 mt-12 pt-1 text-[10px] text-slate-600">
                Signature & Official Stamp
              </div>
            </div>

            {/* District Director Authorization */}
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Authorized Official / Director</div>
              <div className="font-bold text-slate-900 text-xs mt-1">{report.AuthorizedOfficialName}</div>
              <div className="text-[10px] text-slate-500">Date: {report.DirectorDecisionDate || 'Recorded'}</div>
              <div className="border-t border-slate-900 mt-12 pt-1 text-[10px] text-slate-600">
                District Director Seal & Signature
              </div>
            </div>

            {/* Head Office HR Oversight */}
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Head Office HR Oversight Manager</div>
              <div className="font-bold text-slate-900 text-xs mt-1">{report.ReviewerName || 'Head Office HR Registry'}</div>
              <div className="text-[10px] text-slate-500">
                Date: {report.ReviewedAt ? new Date(report.ReviewedAt).toLocaleDateString() : 'Pending Clearance'}
              </div>
              <div className="border-t border-slate-900 mt-12 pt-1 text-[10px] text-slate-600">
                Central Directorate Attestation
              </div>
            </div>
          </div>
        </div>

        {/* Footer Security Stamp */}
        <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
          CONFIDENTIAL EMPLOYEE DISCIPLINARY RECORD • SYSTEM CERTIFICATE HASH: CBO-HRIS-2026-DISC-0988421 • RETAIN 7 YEARS PER BANK RETENTION POLICY
        </div>
      </div>
    </div>
  );
};
