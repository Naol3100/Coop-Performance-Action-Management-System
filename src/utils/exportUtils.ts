import { DisciplinaryReport, District } from '../types';

export function exportReportsToCSV(reports: DisciplinaryReport[], districts: District[], fileNamePrefix = 'Bank_HR_Disciplinary_Reports'): void {
  const districtMap = new Map(districts.map(d => [d.DistrictID, d.DistrictName]));

  const headers = [
    'Report ID',
    'District ID',
    'District Name',
    'Employee ID',
    'Employee Name',
    'Job Title',
    'Work Unit',
    'Incident Date',
    'Action Date',
    'Action Type',
    'Issue Description',
    'Policy Reference',
    'Summary Of Findings',
    'Action Taken',
    'Director Decision Date',
    'Authorized Official',
    'Corrective Action',
    'Follow-up Required',
    'Follow-up Deadline',
    'Follow-up Status',
    'Reporting Period',
    'Report Status',
    'Submitted By',
    'Submitted At',
    'Reviewed By',
    'Reviewed At',
    'Review Comments'
  ];

  const escapeCSV = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) return '""';
    const stringVal = String(value).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const rows = reports.map(r => [
    escapeCSV(r.ReportID),
    escapeCSV(r.DistrictID),
    escapeCSV(districtMap.get(r.DistrictID) || r.DistrictID),
    escapeCSV(r.EmployeeID),
    escapeCSV(r.EmployeeName),
    escapeCSV(r.JobTitle),
    escapeCSV(r.WorkUnit),
    escapeCSV(r.IncidentDate),
    escapeCSV(r.ActionDate),
    escapeCSV(r.ActionType),
    escapeCSV(r.IssueDescription),
    escapeCSV(r.PolicyReference),
    escapeCSV(r.SummaryOfFindings),
    escapeCSV(r.ActionTaken),
    escapeCSV(r.DirectorDecisionDate),
    escapeCSV(r.AuthorizedOfficialName),
    escapeCSV(r.CorrectiveAction),
    escapeCSV(r.FollowUpRequired ? 'YES' : 'NO'),
    escapeCSV(r.FollowUpDeadline || 'N/A'),
    escapeCSV(r.FollowUpStatus),
    escapeCSV(r.ReportingPeriod),
    escapeCSV(r.ReportStatus),
    escapeCSV(r.SubmittedBy),
    escapeCSV(r.SubmittedAt ? new Date(r.SubmittedAt).toLocaleString() : 'N/A'),
    escapeCSV(r.ReviewedBy || 'N/A'),
    escapeCSV(r.ReviewedAt ? new Date(r.ReviewedAt).toLocaleString() : 'N/A'),
    escapeCSV(r.ReviewComments || 'N/A'),
  ].join(','));

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${fileNamePrefix}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadTableAsCSV(filename: string, headers: string[], rows: (string | number | boolean)[][]): void {
  const escapeCSV = (value: string | number | boolean | null | undefined): string => {
    if (value === null || value === undefined) return '""';
    const stringVal = String(value).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const formattedRows = rows.map(r => r.map(val => escapeCSV(val)).join(','));
  const csvContent = '\uFEFF' + [headers.map(h => escapeCSV(h)).join(','), ...formattedRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printElement(elementId: string): void {
  const content = document.getElementById(elementId);
  if (!content) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Official Bank HR Disciplinary Action Document</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background: #fff; margin: 0; padding: 20px; font-size: 11pt; line-height: 1.5; }
          .header-box { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
          .bank-title { font-size: 16pt; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
          .bank-sub { font-size: 9pt; color: #475569; margin-top: 3px; }
          .confidential-tag { background: #fee2e2; color: #991b1b; padding: 4px 10px; font-weight: 700; font-size: 9pt; border-radius: 4px; border: 1px solid #f87171; text-transform: uppercase; }
          .section-title { font-size: 11pt; font-weight: 700; color: #0f172a; background: #f1f5f9; padding: 6px 10px; margin-top: 15px; margin-bottom: 10px; border-left: 4px solid #1e40af; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px; }
          .field-label { font-size: 8.5pt; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 2px; }
          .field-val { font-size: 10pt; font-weight: 500; color: #0f172a; }
          .narrative-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 4px; margin-top: 4px; font-size: 9.5pt; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; page-break-inside: avoid; }
          .sig-line { border-top: 1px solid #0f172a; padding-top: 6px; margin-top: 40px; font-size: 9pt; }
          .watermark { position: fixed; top: 40%; left: 20%; transform: rotate(-35deg); font-size: 65pt; color: rgba(220, 38, 38, 0.04); font-weight: 900; pointer-events: none; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="watermark">STRICTLY CONFIDENTIAL</div>
        ${content.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
