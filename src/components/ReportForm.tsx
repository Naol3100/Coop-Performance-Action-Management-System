import React, { useState, useEffect } from 'react';
import {
  DisciplinaryReport,
  District,
  User,
  ActionType,
  FollowUpStatus,
  DocumentCategory,
  ReportAttachment
} from '../types';
import {
  Building,
  User as UserIcon,
  AlertTriangle,
  Upload,
  Trash2,
  FileText,
  Save,
  Send,
  CheckCircle,
  HelpCircle,
  Calendar,
  ShieldAlert,
  WifiOff
} from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getRoleDefinition } from '../rbac/rbacPolicy';

interface ReportFormProps {
  currentUser: User;
  districts: District[];
  editingReport?: DisciplinaryReport | null;
  onSubmit: (report: DisciplinaryReport, isDraft: boolean) => void;
  onCancel: () => void;
}

const ACTION_TYPES: ActionType[] = [
  'Written Warning',
  'Formal Reprimand',
  'Performance Improvement Plan (PIP)',
  'Demotion / Reassignment',
  'Suspension Without Pay',
  'Final Written Warning',
  'Termination / Dismissal'
];

const STANDARD_POLICIES = [
  'Bank HR Policy Sec 4.12: Dual Control & Cash Custody Protocols',
  'Bank Code of Conduct Sec 2.1: Conflict of Interest & Undisclosed Affiliations',
  'Commercial Credit Underwriting Standards Rev 2025.2, Sec 6.3',
  'Bank Anti-Money Laundering & KYC Compliance Directive, Policy 10.1',
  'Data Protection, Cybersecurity & Customer Privacy Standard, Sec 9.1',
  'Staff Attendance & Punctuality Standard Policy, Sec 3.4',
  'Branch Customer Service & SLA Adherence Charter, Sec 5.0'
];

export const ReportForm: React.FC<ReportFormProps> = ({
  currentUser,
  districts,
  editingReport,
  onSubmit,
  onCancel,
}) => {
  // If District HR, DistrictID is strictly locked to user's assigned district
  const initialDistrictId = editingReport?.DistrictID || currentUser.DistrictID || 'DIST-01';
  const assignedDistrict = districts.find(d => d.DistrictID === initialDistrictId);

  // Auto-generate immutable Report ID if new
  const [reportId] = useState<string>(() => {
    if (editingReport) return editingReport.ReportID;
    const year = new Date().getFullYear();
    const code = assignedDistrict?.DistrictCode || 'DIS';
    const rand = Math.floor(100 + Math.random() * 900);
    return `DISC-${year}-${code}-${rand}`;
  });

  // Form states
  const [employeeId, setEmployeeId] = useState(editingReport?.EmployeeID || '');
  const [employeeName, setEmployeeName] = useState(editingReport?.EmployeeName || '');
  const [jobTitle, setJobTitle] = useState(editingReport?.JobTitle || '');
  const [workUnit, setWorkUnit] = useState(editingReport?.WorkUnit || '');
  const [reportingPeriod, setReportingPeriod] = useState(editingReport?.ReportingPeriod || '2026-Q4');
  
  // Section C states
  const [incidentDate, setIncidentDate] = useState(editingReport?.IncidentDate || '');
  const [actionDate, setActionDate] = useState(editingReport?.ActionDate || new Date().toISOString().slice(0, 10));
  const [actionType, setActionType] = useState<ActionType>(editingReport?.ActionType || 'Written Warning');
  const [issueDescription, setIssueDescription] = useState(editingReport?.IssueDescription || '');
  const [policyReference, setPolicyReference] = useState(editingReport?.PolicyReference || STANDARD_POLICIES[0]);
  const [summaryOfFindings, setSummaryOfFindings] = useState(editingReport?.SummaryOfFindings || '');
  const [actionTaken, setActionTaken] = useState(editingReport?.ActionTaken || '');
  const [directorDecisionDate, setDirectorDecisionDate] = useState(
    editingReport?.DirectorDecisionDate || new Date().toISOString().slice(0, 10)
  );
  const [authorizedOfficialName, setAuthorizedOfficialName] = useState(
    editingReport?.AuthorizedOfficialName || (assignedDistrict?.DirectorName ? `${assignedDistrict.DirectorName} (District Director)` : '')
  );
  const [correctiveAction, setCorrectiveAction] = useState(editingReport?.CorrectiveAction || '');
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(editingReport?.FollowUpRequired ?? false);
  const [followUpDeadline, setFollowUpDeadline] = useState(editingReport?.FollowUpDeadline || '');
  const [followUpStatus, setFollowUpStatus] = useState<FollowUpStatus>(editingReport?.FollowUpStatus || 'Pending');

  // Section D: Attachments
  const [attachments, setAttachments] = useState<ReportAttachment[]>(editingReport?.Attachments || []);
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentCategory, setNewAttachmentCategory] = useState<DocumentCategory>('Director Approval Order');

  // Section E: Confirmation
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    if (!authorizedOfficialName && assignedDistrict) {
      setAuthorizedOfficialName(`${assignedDistrict.DirectorName} (District Director)`);
    }
  }, [assignedDistrict, authorizedOfficialName]);

  const handleAddAttachment = () => {
    if (!newAttachmentName.trim()) return;
    const newAtt: ReportAttachment = {
      AttachmentID: `ATT-${Date.now().toString().slice(-4)}`,
      ReportID: reportId,
      FileName: newAttachmentName.trim().endsWith('.pdf') ? newAttachmentName.trim() : `${newAttachmentName.trim()}.pdf`,
      FileSize: `${(Math.random() * 2 + 0.5).toFixed(1)} MB`,
      FileType: 'application/pdf',
      UploadedBy: currentUser.Email,
      UploadedAt: new Date().toISOString(),
      DocumentCategory: newAttachmentCategory,
    };
    setAttachments(prev => [...prev, newAtt]);
    setNewAttachmentName('');
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.AttachmentID !== id));
  };

  const validateForm = (isDraft: boolean): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isDraft) {
      if (!employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
      if (!employeeName.trim()) newErrors.employeeName = 'Employee Full Name is required';
      if (!jobTitle.trim()) newErrors.jobTitle = 'Job Title is required';
      if (!workUnit.trim()) newErrors.workUnit = 'Work Unit / Branch is required';
      if (!incidentDate) newErrors.incidentDate = 'Incident date is required';
      if (!actionDate) newErrors.actionDate = 'Action date is required';
      if (!issueDescription.trim() || issueDescription.trim().length < 20) {
        newErrors.issueDescription = 'Detailed description of the performance issue is required (min 20 characters)';
      }
      if (!summaryOfFindings.trim()) {
        newErrors.summaryOfFindings = 'Summary of findings / investigation facts is required';
      }
      if (!actionTaken.trim()) {
        newErrors.actionTaken = 'Specific disciplinary action taken is required';
      }
      if (!directorDecisionDate) {
        newErrors.directorDecisionDate = 'District Director decision date is required';
      }
      if (!authorizedOfficialName.trim()) {
        newErrors.authorizedOfficialName = 'Authorized Official name is required';
      }
      if (followUpRequired && !followUpDeadline) {
        newErrors.followUpDeadline = 'Follow-up deadline is required when follow-up is enabled';
      }
      if (!isConfirmed) {
        newErrors.isConfirmed = 'You must confirm the accuracy of this disciplinary action report before official submission';
      }
    } else {
      // Draft only requires at least employee name or ID
      if (!employeeName.trim() && !employeeId.trim()) {
        newErrors.draft = 'Please enter at least an Employee Name or ID to save as draft';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (isDraft: boolean) => {
    if (!validateForm(isDraft)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const now = new Date().toISOString();
    const finalReport: DisciplinaryReport = {
      ReportID: reportId,
      EmployeeID: employeeId.trim(),
      EmployeeName: employeeName.trim(),
      JobTitle: jobTitle.trim(),
      WorkUnit: workUnit.trim(),
      DistrictID: initialDistrictId,
      IncidentDate: incidentDate,
      ActionDate: actionDate,
      ActionType: actionType,
      IssueDescription: issueDescription.trim(),
      PolicyReference: policyReference.trim(),
      SummaryOfFindings: summaryOfFindings.trim(),
      ActionTaken: actionTaken.trim(),
      DirectorDecisionDate: directorDecisionDate,
      AuthorizedOfficialName: authorizedOfficialName.trim(),
      CorrectiveAction: correctiveAction.trim(),
      FollowUpRequired: followUpRequired,
      FollowUpDeadline: followUpRequired ? followUpDeadline : undefined,
      FollowUpStatus: followUpRequired ? followUpStatus : 'Not Required',
      ReportingPeriod: reportingPeriod,
      SubmittedBy: currentUser.Email,
      SubmitterName: currentUser.FullName,
      SubmittedAt: isDraft ? undefined : now,
      ReportStatus: isDraft ? 'Draft' : 'Submitted',
      Attachments: attachments,
      AuditTrail: [
        ...(editingReport?.AuditTrail || []),
        {
          HistoryID: `AUD-${Date.now().toString().slice(-4)}`,
          Action: isDraft ? 'Draft Saved' : editingReport?.ReportStatus === 'Correction Requested' ? 'Correction Resubmitted' : 'Report Submitted',
          Timestamp: now,
          Actor: `${currentUser.FullName} (${currentUser.Email})`,
          ActorRole: getRoleDefinition(currentUser.Role).name,
          Details: isDraft
            ? 'Report saved as draft'
            : editingReport?.ReportStatus === 'Correction Requested'
            ? 'Resubmitted following requested Head Office corrections'
            : 'Formally submitted to Head Office HR Oversight',
        }
      ],
      CreatedAt: editingReport?.CreatedAt || now,
      UpdatedAt: now,
    };

    onSubmit(finalReport, isDraft);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">
              <Building className="w-4 h-4" />
              <span>Standard Disciplinary Action Filing Form</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {editingReport ? `Amend Report: ${editingReport.ReportID}` : 'New Performance Disciplinary Report'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              COOPERATIVE BANK OF OROMIA • Confidential Employee Disciplinary Record
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Immutable ID:</span>
            <span className="font-mono text-xs font-bold text-blue-900 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              {reportId}
            </span>
          </div>
        </div>

        {/* Correction Instructions Banner if returning from Correction Requested */}
        {editingReport?.ReportStatus === 'Correction Requested' && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 rounded-r-lg text-amber-900 dark:text-amber-200">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Head Office HR Correction Request Notice:</h4>
                <p className="text-xs mt-1 font-medium bg-white/70 dark:bg-slate-900/80 p-2 rounded border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100">
                  {editingReport.CorrectionNotes || 'Please review and update the required fields as requested.'}
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                  After making the necessary changes and attaching required documentation, click "Submit Official Report" to resubmit.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isOnline && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex items-center space-x-2.5">
            <WifiOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> You are disconnected from the network. Your report will be saved securely in local storage and queued to synchronize automatically when you reconnect.
            </span>
          </div>
        )}

        {Object.keys(errors).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-800 dark:text-red-200 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Please complete all required fields before submission:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {Object.values(errors).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* SECTION A: Report Information */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">A</span>
            Report Information & District Binding
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500">System Controlled</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reporting District <span className="text-slate-400 dark:text-slate-500 font-normal">(Auto-Locked)</span>
            </label>
            <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{assignedDistrict?.DistrictName}</span>
              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">[{initialDistrictId}]</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Bound to authenticated HR Officer profile</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Submitting HR Officer <span className="text-slate-400 dark:text-slate-500 font-normal">(Authenticated)</span>
            </label>
            <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{currentUser.FullName}</span>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.Email}</div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reporting Period / Fiscal Quarter <span className="text-red-500">*</span>
            </label>
            <select
              value={reportingPeriod}
              onChange={(e) => setReportingPeriod(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            >
              <option value="2026-Q4">2026 - Quarter 4 (Current)</option>
              <option value="2026-Q3">2026 - Quarter 3</option>
              <option value="2026-Q2">2026 - Quarter 2</option>
              <option value="2026-Q1">2026 - Quarter 1</option>
            </select>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Fiscal reporting governance cycle</p>
          </div>
        </div>
      </div>

      {/* SECTION B: Employee Information */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">B</span>
            Employee Information
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Subject of Disciplinary Action</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Employee ID / Staff Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. EMP-98231"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className={`w-full bg-white dark:bg-slate-800 border rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 ${
                  errors.employeeId ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
            {errors.employeeId && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">{errors.employeeId}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Employee Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Alexander Drake"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              className={`w-full bg-white dark:bg-slate-800 border rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 ${
                errors.employeeName ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.employeeName && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">{errors.employeeName}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Job Title / Position <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Senior Teller & Vault Custodian"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className={`w-full bg-white dark:bg-slate-800 border rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 ${
                errors.jobTitle ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.jobTitle && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">{errors.jobTitle}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Branch / Department / Work Unit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Central Financial Plaza - Main Branch"
              value={workUnit}
              onChange={(e) => setWorkUnit(e.target.value)}
              className={`w-full bg-white dark:bg-slate-800 border rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 ${
                errors.workUnit ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.workUnit && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">{errors.workUnit}</p>}
          </div>
        </div>
      </div>

      {/* SECTION C: Disciplinary Action Information */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">C</span>
            Disciplinary Action & Performance Violation Details
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Director Decision & Policy Alignment</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date of Incident / Performance Deficit <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className={`w-full bg-white dark:bg-slate-800 border rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 ${
                  errors.incidentDate ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
            {errors.incidentDate && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">{errors.incidentDate}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Date Disciplinary Sanction Taken <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
                className={`w-full bg-white dark:bg-slate-800 border rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 ${
                  errors.actionDate ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
                }`}
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
            </div>
            {errors.actionDate && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">{errors.actionDate}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Type of Disciplinary Action <span className="text-red-500">*</span>
          </label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value as ActionType)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          >
            {ACTION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            Classification per COOPERATIVE BANK OF OROMIA Disciplinary & Code of Conduct Framework
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Relevant Policy Standard / Code of Conduct Reference <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <select
              value={STANDARD_POLICIES.includes(policyReference) ? policyReference : 'CUSTOM'}
              onChange={(e) => {
                if (e.target.value !== 'CUSTOM') {
                  setPolicyReference(e.target.value);
                }
              }}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
            >
              {STANDARD_POLICIES.map((p, idx) => (
                <option key={idx} value={p}>{p}</option>
              ))}
              <option value="CUSTOM">-- Specify Custom Policy Clause --</option>
            </select>

            <input
              type="text"
              value={policyReference}
              onChange={(e) => setPolicyReference(e.target.value)}
              placeholder="Or enter policy reference code directly..."
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Detailed Description of Performance Deficit / Breach <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="Describe the nature of the employee's non-performance, attendance lapse, or procedural breach..."
            className={`w-full bg-white dark:bg-slate-800 border rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 ${
              errors.issueDescription ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          {errors.issueDescription && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">{errors.issueDescription}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Summary of Findings & Supporting Facts <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={summaryOfFindings}
            onChange={(e) => setSummaryOfFindings(e.target.value)}
            placeholder="Summarize the inquiry, audit review, or supervisory hearing findings..."
            className={`w-full bg-white dark:bg-slate-800 border rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 ${
              errors.summaryOfFindings ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          {errors.summaryOfFindings && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">{errors.summaryOfFindings}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Disciplinary Action Authorized by District Director <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="e.g. Formal written warning entered in HR file; PIP ordered"
              className={`w-full bg-white dark:bg-slate-800 border rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 ${
                errors.actionTaken ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.actionTaken && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">{errors.actionTaken}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Authorized Official Name & Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={authorizedOfficialName}
              onChange={(e) => setAuthorizedOfficialName(e.target.value)}
              placeholder="e.g. Dr. Arthur Sterling (District Director)"
              className={`w-full bg-white dark:bg-slate-800 border rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 ${
                errors.authorizedOfficialName ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
              }`}
            />
            {errors.authorizedOfficialName && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">{errors.authorizedOfficialName}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Date of District Director's Official Decision <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={directorDecisionDate}
            onChange={(e) => setDirectorDecisionDate(e.target.value)}
            className={`w-full bg-white dark:bg-slate-800 border rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 ${
              errors.directorDecisionDate ? 'border-red-500 bg-red-50/20 dark:bg-red-950/20' : 'border-slate-300 dark:border-slate-700'
            }`}
          />
          {errors.directorDecisionDate && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">{errors.directorDecisionDate}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Corrective Measures or Performance Improvement Requirements
          </label>
          <textarea
            rows={2}
            value={correctiveAction}
            onChange={(e) => setCorrectiveAction(e.target.value)}
            placeholder="Specific benchmarks, retraining modules, or milestone expectations imposed on the employee..."
            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Follow-up Section Toggle */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-750 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Post-Action Follow-Up Monitoring Required?</span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Enable if the sanction requires a compliance check or PIP review</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {followUpRequired && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Follow-Up Review Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={followUpDeadline}
                  onChange={(e) => setFollowUpDeadline(e.target.value)}
                  className={`w-full bg-white dark:bg-slate-800 border rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100 ${
                    errors.followUpDeadline ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {errors.followUpDeadline && <p className="text-[10px] text-red-600 dark:text-red-400 mt-1">{errors.followUpDeadline}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Follow-Up Status
                </label>
                <select
                  value={followUpStatus}
                  onChange={(e) => setFollowUpStatus(e.target.value as FollowUpStatus)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs text-slate-800 dark:text-slate-100"
                >
                  <option value="Pending">Pending (Not yet due)</option>
                  <option value="In Progress">In Progress (Active Monitoring)</option>
                  <option value="Satisfactory">Satisfactory (Remediation Complete)</option>
                  <option value="Escalated">Escalated (Further Action Required)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION D: Supporting Documents */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">D</span>
            Supporting Documents & Legal Authorization
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Confidential Attachments</span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Attach authorized documents such as Director Decision Orders, Hearing Minutes, or Performance Improvement Agreements. In production, these are stored in secure bank storage.
        </p>

        {/* Upload simulator bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
          <input
            type="text"
            placeholder="Document filename (e.g. Director_Order_Signed.pdf)"
            value={newAttachmentName}
            onChange={(e) => setNewAttachmentName(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
          />

          <select
            value={newAttachmentCategory}
            onChange={(e) => setNewAttachmentCategory(e.target.value as DocumentCategory)}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100"
          >
            <option value="Director Approval Order">Director Approval Order</option>
            <option value="Investigation Summary">Investigation Summary</option>
            <option value="Hearing Minutes">Hearing Minutes</option>
            <option value="Performance Improvement Agreement">Performance Improvement Agreement</option>
            <option value="Notice of Inquiry">Notice of Inquiry</option>
            <option value="Other Supporting Evidence">Other Supporting Evidence</option>
          </select>

          <button
            type="button"
            onClick={handleAddAttachment}
            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Attach Document</span>
          </button>
        </div>

        {/* Existing attachments list */}
        {attachments.length > 0 ? (
          <div className="space-y-2">
            {attachments.map((att) => (
              <div
                key={att.AttachmentID}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs transition-colors"
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{att.FileName}</span>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {att.DocumentCategory} • {att.FileSize} • Uploaded by {att.UploadedBy}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.AttachmentID)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40"
                  title="Remove document"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-slate-400 dark:text-slate-500 text-xs">
            No supporting documents attached yet.
          </div>
        )}
      </div>

      {/* SECTION E: Confirmation and Submission */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4 transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">E</span>
            Confirmation & Sign-Off Certification
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Official Filing</span>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-750 space-y-3">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Official HR Declaration:</strong> I hereby certify under COOPERATIVE BANK OF OROMIA HR reporting regulations that the performance disciplinary details recorded herein accurately represent the formal proceedings and sanctioned actions authorized by the District Director. I acknowledge that upon submission this record will be transmitted to Head Office HR for supervisory audit.
            </span>
          </label>
          {errors.isConfirmed && (
            <p className="text-[10px] text-red-600 dark:text-red-400 font-bold ml-7">{errors.isConfirmed}</p>
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2">
            <span>Submitting Officer: <strong>{currentUser.FullName}</strong> ({currentUser.Email})</span>
            <span>District: <strong>{assignedDistrict?.DistrictName}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          >
            Cancel / Back to Dashboard
          </button>

          <div className="w-full sm:w-auto flex items-center space-x-3">
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Save className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(false)}
              className="w-full sm:w-auto px-6 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition"
            >
              <Send className="w-4 h-4" />
              <span>Submit Official Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
