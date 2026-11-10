import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase/firebase';
import {
  District,
  User,
  DisciplinaryReport,
  AuditLogEntry,
  ReportAttachment,
} from '../types';
import {
  INITIAL_DISTRICTS,
  INITIAL_USERS,
  INITIAL_REPORTS,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData';

export interface ReportReviewDoc {
  reviewId: string;
  reportId: string;
  reviewerEmail: string;
  reviewerName: string;
  reviewDecision: 'Reviewed' | 'Correction Requested' | 'Closed';
  comments: string;
  createdAt: string;
}

// Collection names matching the blueprint and security rules
export const COLLECTIONS = {
  USERS: 'Users',
  DISTRICTS: 'Districts',
  REPORTS: 'DisciplinaryReports',
  REVIEWS: 'ReportReviews',
  ATTACHMENTS: 'ReportAttachments',
  AUDIT_LOG: 'AuditLog',
} as const;

/**
 * Seed Firestore with initial fictional test records if collections are currently empty.
 * This guarantees the user has immediate, full data across all 13 districts, initial reports,
 * and audit records stored in Firestore.
 */
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  if (!auth.currentUser) return false;
  try {
    const districtsCol = collection(db, COLLECTIONS.DISTRICTS);
    let snapshot;
    try {
      snapshot = await getDocs(districtsCol);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTIONS.DISTRICTS);
    }

    if (!snapshot.empty) {
      const hasAdama = snapshot.docs.some(docSnap => {
        const d = docSnap.data();
        return (d.districtName === 'Adama District' || d.DistrictName === 'Adama District');
      });
      if (!hasAdama) {
        for (const d of INITIAL_DISTRICTS) {
          const dDoc = doc(db, COLLECTIONS.DISTRICTS, d.DistrictID);
          await setDoc(dDoc, {
            districtId: d.DistrictID,
            DistrictID: d.DistrictID,
            districtCode: d.DistrictCode,
            DistrictCode: d.DistrictCode,
            districtName: d.DistrictName,
            DistrictName: d.DistrictName,
            region: d.Region,
            Region: d.Region,
            officeLocation: d.OfficeLocation,
            OfficeLocation: d.OfficeLocation,
            isActive: d.IsActive,
            IsActive: d.IsActive,
            directorName: d.DirectorName,
            DirectorName: d.DirectorName,
          }, { merge: true }).catch(console.error);
        }
      }

      // Ensure all initial bank users (including naolcbo@gmail.com and Lead Admins) are provisioned in Users collection
      for (const u of INITIAL_USERS) {
        const userDocRef = doc(db, COLLECTIONS.USERS, u.UserID);
        await setDoc(userDocRef, {
          userId: u.UserID,
          UserID: u.UserID,
          email: u.Email,
          Email: u.Email,
          fullName: u.FullName,
          FullName: u.FullName,
          role: u.Role,
          Role: u.Role,
          districtId: u.DistrictID || '',
          DistrictID: u.DistrictID,
          position: u.Position,
          Position: u.Position,
          isActive: u.IsActive,
          IsActive: u.IsActive,
          createdAt: u.CreatedAt || new Date().toISOString(),
          CreatedAt: u.CreatedAt || new Date().toISOString(),
          lastLogin: u.LastLogin || new Date().toISOString(),
          LastLogin: u.LastLogin || new Date().toISOString(),
          password: u.Password || 'CoopBank@2026',
          Password: u.Password || 'CoopBank@2026',
        }, { merge: true }).catch(console.error);
      }

      return true;
    }

    // Seed Districts
    for (const d of INITIAL_DISTRICTS) {
      const dDoc = doc(db, COLLECTIONS.DISTRICTS, d.DistrictID);
      const data = {
        districtId: d.DistrictID,
        DistrictID: d.DistrictID,
        districtCode: d.DistrictCode,
        DistrictCode: d.DistrictCode,
        districtName: d.DistrictName,
        DistrictName: d.DistrictName,
        region: d.Region,
        Region: d.Region,
        officeLocation: d.OfficeLocation,
        OfficeLocation: d.OfficeLocation,
        isActive: d.IsActive,
        IsActive: d.IsActive,
        directorName: d.DirectorName,
        DirectorName: d.DirectorName,
      };
      await setDoc(dDoc, data).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.DISTRICTS}/${d.DistrictID}`)
      );
    }

    // Seed Users
    for (const u of INITIAL_USERS) {
      const uDoc = doc(db, COLLECTIONS.USERS, u.UserID);
      const data = {
        userId: u.UserID,
        UserID: u.UserID,
        email: u.Email,
        Email: u.Email,
        fullName: u.FullName,
        FullName: u.FullName,
        role: u.Role,
        Role: u.Role,
        districtId: u.DistrictID || '',
        DistrictID: u.DistrictID,
        position: u.Position,
        Position: u.Position,
        isActive: u.IsActive,
        IsActive: u.IsActive,
        createdAt: u.CreatedAt,
        CreatedAt: u.CreatedAt,
        lastLogin: u.LastLogin || new Date().toISOString(),
        LastLogin: u.LastLogin,
      };
      await setDoc(uDoc, data).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.USERS}/${u.UserID}`)
      );
    }

    // Seed Reports & Attachments
    for (const r of INITIAL_REPORTS) {
      const rDoc = doc(db, COLLECTIONS.REPORTS, r.ReportID);
      const data = {
        reportId: r.ReportID,
        ReportID: r.ReportID,
        employeeId: r.EmployeeID,
        EmployeeID: r.EmployeeID,
        employeeName: r.EmployeeName,
        EmployeeName: r.EmployeeName,
        jobTitle: r.JobTitle,
        JobTitle: r.JobTitle,
        workUnit: r.WorkUnit,
        WorkUnit: r.WorkUnit,
        districtId: r.DistrictID,
        DistrictID: r.DistrictID,
        incidentDate: r.IncidentDate,
        IncidentDate: r.IncidentDate,
        actionDate: r.ActionDate,
        ActionDate: r.ActionDate,
        actionType: r.ActionType,
        ActionType: r.ActionType,
        issueDescription: r.IssueDescription,
        IssueDescription: r.IssueDescription,
        policyReference: r.PolicyReference,
        PolicyReference: r.PolicyReference,
        summaryOfFindings: r.SummaryOfFindings,
        SummaryOfFindings: r.SummaryOfFindings,
        actionTaken: r.ActionTaken,
        ActionTaken: r.ActionTaken,
        directorDecisionDate: r.DirectorDecisionDate,
        DirectorDecisionDate: r.DirectorDecisionDate,
        authorizedOfficialName: r.AuthorizedOfficialName,
        AuthorizedOfficialName: r.AuthorizedOfficialName,
        correctiveAction: r.CorrectiveAction,
        CorrectiveAction: r.CorrectiveAction,
        followUpRequired: r.FollowUpRequired,
        FollowUpRequired: r.FollowUpRequired,
        followUpDeadline: r.FollowUpDeadline || '',
        FollowUpDeadline: r.FollowUpDeadline,
        followUpStatus: r.FollowUpStatus,
        FollowUpStatus: r.FollowUpStatus,
        reportingPeriod: r.ReportingPeriod,
        ReportingPeriod: r.ReportingPeriod,
        submittedBy: r.SubmittedBy,
        SubmittedBy: r.SubmittedBy,
        submitterName: r.SubmitterName,
        SubmitterName: r.SubmitterName,
        submittedAt: r.SubmittedAt || r.CreatedAt,
        SubmittedAt: r.SubmittedAt,
        reportStatus: r.ReportStatus,
        ReportStatus: r.ReportStatus,
        reviewedBy: r.ReviewedBy || '',
        ReviewedBy: r.ReviewedBy,
        reviewerName: r.ReviewerName || '',
        ReviewerName: r.ReviewerName,
        reviewedAt: r.ReviewedAt || '',
        ReviewedAt: r.ReviewedAt,
        reviewComments: r.ReviewComments || '',
        ReviewComments: r.ReviewComments,
        correctionNotes: r.CorrectionNotes || '',
        CorrectionNotes: r.CorrectionNotes,
        attachments: r.Attachments || [],
        Attachments: r.Attachments || [],
        auditTrail: r.AuditTrail || [],
        AuditTrail: r.AuditTrail || [],
        createdAt: r.CreatedAt,
        CreatedAt: r.CreatedAt,
        updatedAt: r.UpdatedAt,
        UpdatedAt: r.UpdatedAt,
      };
      await setDoc(rDoc, data).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.REPORTS}/${r.ReportID}`)
      );

      // Seed individual attachments to ReportAttachments collection
      if (r.Attachments && r.Attachments.length > 0) {
        for (const att of r.Attachments) {
          const attDoc = doc(db, COLLECTIONS.ATTACHMENTS, att.AttachmentID);
          const attData = {
            attachmentId: att.AttachmentID,
            AttachmentID: att.AttachmentID,
            reportId: r.ReportID,
            ReportID: r.ReportID,
            fileName: att.FileName,
            FileName: att.FileName,
            fileSize: att.FileSize,
            FileSize: att.FileSize,
            fileType: att.FileType,
            FileType: att.FileType,
            uploadedBy: att.UploadedBy,
            UploadedBy: att.UploadedBy,
            uploadedAt: att.UploadedAt,
            UploadedAt: att.UploadedAt,
            documentCategory: att.DocumentCategory,
            DocumentCategory: att.DocumentCategory,
            url: att.Url || '',
          };
          await setDoc(attDoc, attData).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.ATTACHMENTS}/${att.AttachmentID}`)
          );
        }
      }
    }

    // Seed Audit Log
    for (const a of INITIAL_AUDIT_LOGS) {
      const aDoc = doc(db, COLLECTIONS.AUDIT_LOG, a.AuditID);
      const data = {
        auditId: a.AuditID,
        AuditID: a.AuditID,
        userEmail: a.UserEmail,
        UserEmail: a.UserEmail,
        userName: a.UserName,
        UserName: a.UserName,
        action: a.Action,
        Action: a.Action,
        entityType: a.EntityType,
        EntityType: a.EntityType,
        entityId: a.EntityID,
        EntityID: a.EntityID,
        timestamp: a.Timestamp,
        Timestamp: a.Timestamp,
        changeSummary: a.ChangeSummary,
        ChangeSummary: a.ChangeSummary,
        reasonForChange: a.ReasonForChange,
        ReasonForChange: a.ReasonForChange,
      };
      await setDoc(aDoc, data).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `${COLLECTIONS.AUDIT_LOG}/${a.AuditID}`)
      );
    }

    return true;
  } catch (error) {
    console.error('Failed to seed initial data to Firestore:', error);
    return false;
  }
}

// ----------------- Disciplinary Reports Operations -----------------

export async function fetchReportsFromFirestore(): Promise<DisciplinaryReport[]> {
  if (!auth.currentUser) return [];
  const path = COLLECTIONS.REPORTS;
  try {
    const snap = await getDocs(collection(db, path));
    const items: DisciplinaryReport[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      items.push({
        ReportID: d.ReportID || d.reportId || docSnap.id,
        EmployeeID: d.EmployeeID || d.employeeId || '',
        EmployeeName: d.EmployeeName || d.employeeName || '',
        JobTitle: d.JobTitle || d.jobTitle || '',
        WorkUnit: d.WorkUnit || d.workUnit || '',
        DistrictID: d.DistrictID || d.districtId || '',
        IncidentDate: d.IncidentDate || d.incidentDate || '',
        ActionDate: d.ActionDate || d.actionDate || '',
        ActionType: d.ActionType || d.actionType || 'Written Warning',
        IssueDescription: d.IssueDescription || d.issueDescription || '',
        PolicyReference: d.PolicyReference || d.policyReference || '',
        SummaryOfFindings: d.SummaryOfFindings || d.summaryOfFindings || '',
        ActionTaken: d.ActionTaken || d.actionTaken || '',
        DirectorDecisionDate: d.DirectorDecisionDate || d.directorDecisionDate || '',
        AuthorizedOfficialName: d.AuthorizedOfficialName || d.authorizedOfficialName || '',
        CorrectiveAction: d.CorrectiveAction || d.correctiveAction || '',
        FollowUpRequired: !!(d.FollowUpRequired ?? d.followUpRequired),
        FollowUpDeadline: d.FollowUpDeadline || d.followUpDeadline,
        FollowUpStatus: d.FollowUpStatus || d.followUpStatus || 'Pending',
        ReportingPeriod: d.ReportingPeriod || d.reportingPeriod || '2026-Q1',
        SubmittedBy: d.SubmittedBy || d.submittedBy || '',
        SubmitterName: d.SubmitterName || d.submitterName || '',
        SubmittedAt: d.SubmittedAt || d.submittedAt,
        ReportStatus: d.ReportStatus || d.reportStatus || 'Draft',
        ReviewedBy: d.ReviewedBy || d.reviewedBy,
        ReviewerName: d.ReviewerName || d.reviewerName,
        ReviewedAt: d.ReviewedAt || d.reviewedAt,
        ReviewComments: d.ReviewComments || d.reviewComments,
        CorrectionNotes: d.CorrectionNotes || d.correctionNotes,
        Attachments: d.Attachments || d.attachments || [],
        AuditTrail: d.AuditTrail || d.auditTrail || [],
        CreatedAt: d.CreatedAt || d.createdAt || new Date().toISOString(),
        UpdatedAt: d.UpdatedAt || d.updatedAt || new Date().toISOString(),
      });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeReports(
  onSuccess: (reports: DisciplinaryReport[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const path = COLLECTIONS.REPORTS;
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: DisciplinaryReport[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          ReportID: d.ReportID || d.reportId || docSnap.id,
          EmployeeID: d.EmployeeID || d.employeeId || '',
          EmployeeName: d.EmployeeName || d.employeeName || '',
          JobTitle: d.JobTitle || d.jobTitle || '',
          WorkUnit: d.WorkUnit || d.workUnit || '',
          DistrictID: d.DistrictID || d.districtId || '',
          IncidentDate: d.IncidentDate || d.incidentDate || '',
          ActionDate: d.ActionDate || d.actionDate || '',
          ActionType: d.ActionType || d.actionType || 'Written Warning',
          IssueDescription: d.IssueDescription || d.issueDescription || '',
          PolicyReference: d.PolicyReference || d.policyReference || '',
          SummaryOfFindings: d.SummaryOfFindings || d.summaryOfFindings || '',
          ActionTaken: d.ActionTaken || d.actionTaken || '',
          DirectorDecisionDate: d.DirectorDecisionDate || d.directorDecisionDate || '',
          AuthorizedOfficialName: d.AuthorizedOfficialName || d.authorizedOfficialName || '',
          CorrectiveAction: d.CorrectiveAction || d.correctiveAction || '',
          FollowUpRequired: !!(d.FollowUpRequired ?? d.followUpRequired),
          FollowUpDeadline: d.FollowUpDeadline || d.followUpDeadline,
          FollowUpStatus: d.FollowUpStatus || d.followUpStatus || 'Pending',
          ReportingPeriod: d.ReportingPeriod || d.reportingPeriod || '2026-Q1',
          SubmittedBy: d.SubmittedBy || d.submittedBy || '',
          SubmitterName: d.SubmitterName || d.submitterName || '',
          SubmittedAt: d.SubmittedAt || d.submittedAt,
          ReportStatus: d.ReportStatus || d.reportStatus || 'Draft',
          ReviewedBy: d.ReviewedBy || d.reviewedBy,
          ReviewerName: d.ReviewerName || d.reviewerName,
          ReviewedAt: d.ReviewedAt || d.reviewedAt,
          ReviewComments: d.ReviewComments || d.reviewComments,
          CorrectionNotes: d.CorrectionNotes || d.correctionNotes,
          Attachments: d.Attachments || d.attachments || [],
          AuditTrail: d.AuditTrail || d.auditTrail || [],
          CreatedAt: d.CreatedAt || d.createdAt || new Date().toISOString(),
          UpdatedAt: d.UpdatedAt || d.updatedAt || new Date().toISOString(),
        });
      });
      onSuccess(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveReportToFirestore(
  report: DisciplinaryReport,
  actorEmail: string,
  actorName: string,
  isNew: boolean
): Promise<void> {
  const path = `${COLLECTIONS.REPORTS}/${report.ReportID}`;
  const now = new Date().toISOString();

  const reportData = {
    reportId: report.ReportID,
    ReportID: report.ReportID,
    employeeId: report.EmployeeID,
    EmployeeID: report.EmployeeID,
    employeeName: report.EmployeeName,
    EmployeeName: report.EmployeeName,
    jobTitle: report.JobTitle,
    JobTitle: report.JobTitle,
    workUnit: report.WorkUnit,
    WorkUnit: report.WorkUnit,
    districtId: report.DistrictID,
    DistrictID: report.DistrictID,
    incidentDate: report.IncidentDate,
    IncidentDate: report.IncidentDate,
    actionDate: report.ActionDate,
    ActionDate: report.ActionDate,
    actionType: report.ActionType,
    ActionType: report.ActionType,
    issueDescription: report.IssueDescription,
    IssueDescription: report.IssueDescription,
    policyReference: report.PolicyReference,
    PolicyReference: report.PolicyReference,
    summaryOfFindings: report.SummaryOfFindings,
    SummaryOfFindings: report.SummaryOfFindings,
    actionTaken: report.ActionTaken,
    ActionTaken: report.ActionTaken,
    directorDecisionDate: report.DirectorDecisionDate,
    DirectorDecisionDate: report.DirectorDecisionDate,
    authorizedOfficialName: report.AuthorizedOfficialName,
    AuthorizedOfficialName: report.AuthorizedOfficialName,
    correctiveAction: report.CorrectiveAction,
    CorrectiveAction: report.CorrectiveAction,
    followUpRequired: report.FollowUpRequired,
    FollowUpRequired: report.FollowUpRequired,
    followUpDeadline: report.FollowUpDeadline || '',
    FollowUpDeadline: report.FollowUpDeadline,
    followUpStatus: report.FollowUpStatus,
    FollowUpStatus: report.FollowUpStatus,
    reportingPeriod: report.ReportingPeriod,
    ReportingPeriod: report.ReportingPeriod,
    submittedBy: report.SubmittedBy,
    SubmittedBy: report.SubmittedBy,
    submitterName: report.SubmitterName,
    SubmitterName: report.SubmitterName,
    submittedAt: report.SubmittedAt || now,
    SubmittedAt: report.SubmittedAt || now,
    reportStatus: report.ReportStatus,
    ReportStatus: report.ReportStatus,
    reviewedBy: report.ReviewedBy || '',
    ReviewedBy: report.ReviewedBy,
    reviewerName: report.ReviewerName || '',
    ReviewerName: report.ReviewerName,
    reviewedAt: report.ReviewedAt || '',
    ReviewedAt: report.ReviewedAt,
    reviewComments: report.ReviewComments || '',
    ReviewComments: report.ReviewComments,
    correctionNotes: report.CorrectionNotes || '',
    CorrectionNotes: report.CorrectionNotes,
    attachments: report.Attachments || [],
    Attachments: report.Attachments || [],
    auditTrail: report.AuditTrail || [],
    AuditTrail: report.AuditTrail || [],
    createdAt: report.CreatedAt || now,
    CreatedAt: report.CreatedAt || now,
    updatedAt: now,
    UpdatedAt: now,
  };

  try {
    await setDoc(doc(db, COLLECTIONS.REPORTS, report.ReportID), reportData);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }

  // Persist individual attachments in ReportAttachments collection
  if (report.Attachments && report.Attachments.length > 0) {
    for (const att of report.Attachments) {
      const attPath = `${COLLECTIONS.ATTACHMENTS}/${att.AttachmentID}`;
      try {
        await setDoc(doc(db, COLLECTIONS.ATTACHMENTS, att.AttachmentID), {
          attachmentId: att.AttachmentID,
          AttachmentID: att.AttachmentID,
          reportId: report.ReportID,
          ReportID: report.ReportID,
          fileName: att.FileName,
          FileName: att.FileName,
          fileSize: att.FileSize,
          FileSize: att.FileSize,
          fileType: att.FileType,
          FileType: att.FileType,
          uploadedBy: att.UploadedBy,
          UploadedBy: att.UploadedBy,
          uploadedAt: att.UploadedAt,
          UploadedAt: att.UploadedAt,
          documentCategory: att.DocumentCategory,
          DocumentCategory: att.DocumentCategory,
          url: att.Url || '',
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, attPath);
      }
    }
  }

  // Record Audit Log entry
  const auditId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const auditPath = `${COLLECTIONS.AUDIT_LOG}/${auditId}`;
  try {
    await setDoc(doc(db, COLLECTIONS.AUDIT_LOG, auditId), {
      auditId,
      AuditID: auditId,
      userEmail: actorEmail,
      UserEmail: actorEmail,
      userName: actorName,
      UserName: actorName,
      action: isNew ? (report.ReportStatus === 'Draft' ? 'DRAFT_CREATED' : 'REPORT_SUBMITTED') : 'REPORT_UPDATED',
      Action: isNew ? (report.ReportStatus === 'Draft' ? 'DRAFT_CREATED' : 'REPORT_SUBMITTED') : 'REPORT_UPDATED',
      entityType: 'Report',
      EntityType: 'Report',
      entityId: report.ReportID,
      EntityID: report.ReportID,
      timestamp: now,
      Timestamp: now,
      changeSummary: `${isNew ? 'Created' : 'Updated'} report for ${report.EmployeeName} (${report.EmployeeID}) with status ${report.ReportStatus}`,
      ChangeSummary: `${isNew ? 'Created' : 'Updated'} report for ${report.EmployeeName} (${report.EmployeeID}) with status ${report.ReportStatus}`,
      reasonForChange: report.ReportStatus === 'Draft' ? 'Draft authoring' : 'Filing of authorized disciplinary action by District Director',
      ReasonForChange: report.ReportStatus === 'Draft' ? 'Draft authoring' : 'Filing of authorized disciplinary action by District Director',
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, auditPath);
  }
}

// ----------------- Report Reviews Operations -----------------

export async function addReportReviewToFirestore(
  reportId: string,
  reviewerEmail: string,
  reviewerName: string,
  reviewDecision: 'Reviewed' | 'Correction Requested' | 'Closed',
  comments: string,
  updatedReport: DisciplinaryReport
): Promise<void> {
  const reviewId = `REV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const revPath = `${COLLECTIONS.REVIEWS}/${reviewId}`;
  const now = new Date().toISOString();

  // 1. Write review doc to ReportReviews
  try {
    await setDoc(doc(db, COLLECTIONS.REVIEWS, reviewId), {
      reviewId,
      ReviewID: reviewId,
      reportId,
      ReportID: reportId,
      reviewerEmail,
      ReviewerEmail: reviewerEmail,
      reviewerName,
      ReviewerName: reviewerName,
      reviewDecision,
      ReviewDecision: reviewDecision,
      comments,
      Comments: comments,
      createdAt: now,
      CreatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, revPath);
  }

  // 2. Update report doc in DisciplinaryReports
  await saveReportToFirestore(updatedReport, reviewerEmail, reviewerName, false);
}

// ----------------- Districts Operations -----------------

export async function fetchDistrictsFromFirestore(): Promise<District[]> {
  if (!auth.currentUser) return [];
  const path = COLLECTIONS.DISTRICTS;
  try {
    const snap = await getDocs(collection(db, path));
    const items: District[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      items.push({
        DistrictID: d.DistrictID || d.districtId || docSnap.id,
        DistrictCode: d.DistrictCode || d.districtCode || '',
        DistrictName: d.DistrictName || d.districtName || '',
        Region: d.Region || d.region || '',
        OfficeLocation: d.OfficeLocation || d.officeLocation || '',
        IsActive: !!(d.IsActive ?? d.isActive),
        DirectorName: d.DirectorName || d.directorName || '',
      });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeDistricts(
  onSuccess: (districts: District[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const path = COLLECTIONS.DISTRICTS;
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: District[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          DistrictID: d.DistrictID || d.districtId || docSnap.id,
          DistrictCode: d.DistrictCode || d.districtCode || '',
          DistrictName: d.DistrictName || d.districtName || '',
          Region: d.Region || d.region || '',
          OfficeLocation: d.OfficeLocation || d.officeLocation || '',
          IsActive: !!(d.IsActive ?? d.isActive),
          DirectorName: d.DirectorName || d.directorName || '',
        });
      });
      onSuccess(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveDistrictToFirestore(district: District, actorEmail: string, actorName: string): Promise<void> {
  const path = `${COLLECTIONS.DISTRICTS}/${district.DistrictID}`;
  try {
    await setDoc(doc(db, COLLECTIONS.DISTRICTS, district.DistrictID), {
      districtId: district.DistrictID,
      DistrictID: district.DistrictID,
      districtCode: district.DistrictCode,
      DistrictCode: district.DistrictCode,
      districtName: district.DistrictName,
      DistrictName: district.DistrictName,
      region: district.Region,
      Region: district.Region,
      officeLocation: district.OfficeLocation,
      OfficeLocation: district.OfficeLocation,
      isActive: district.IsActive,
      IsActive: district.IsActive,
      directorName: district.DirectorName,
      DirectorName: district.DirectorName,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ----------------- Users Operations -----------------

export async function fetchUsersFromFirestore(): Promise<User[]> {
  if (!auth.currentUser) return [];
  const path = COLLECTIONS.USERS;
  try {
    const snap = await getDocs(collection(db, path));
    const items: User[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      items.push({
        UserID: d.UserID || d.userId || docSnap.id,
        Email: d.Email || d.email || '',
        FullName: d.FullName || d.fullName || '',
        Role: d.Role || d.role || 'DISTRICT_HR',
        DistrictID: d.DistrictID || d.districtId || null,
        Position: d.Position || d.position || '',
        IsActive: !!(d.IsActive ?? d.isActive),
        CreatedAt: d.CreatedAt || d.createdAt || new Date().toISOString(),
        LastLogin: d.LastLogin || d.lastLogin,
        Password: d.Password || d.password || 'CoopBank@2026',
        TemporaryPassword: d.TemporaryPassword || d.temporaryPassword,
        MustChangePassword: !!(d.MustChangePassword ?? d.mustChangePassword),
        ActivationCode: d.ActivationCode || d.activationCode,
        LastPasswordReset: d.LastPasswordReset || d.lastPasswordReset,
      });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeUsers(
  onSuccess: (users: User[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const path = COLLECTIONS.USERS;
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: User[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          UserID: d.UserID || d.userId || docSnap.id,
          EmployeeID: d.EmployeeID || d.employeeId || '',
          Email: d.Email || d.email || '',
          FullName: d.FullName || d.fullName || '',
          Role: d.Role || d.role || 'DISTRICT_HR',
          DistrictID: d.DistrictID || d.districtId || null,
          Department: d.Department || d.department || 'General Banking',
          Position: d.Position || d.position || '',
          IsActive: !!(d.IsActive ?? d.isActive),
          CreatedAt: d.CreatedAt || d.createdAt || new Date().toISOString(),
          UpdatedAt: d.UpdatedAt || d.updatedAt || d.CreatedAt || new Date().toISOString(),
          CreatedBy: d.CreatedBy || d.createdBy || 'System',
          UpdatedBy: d.UpdatedBy || d.updatedBy || '',
          LastLogin: d.LastLogin || d.lastLogin,
          RoleHistory: Array.isArray(d.RoleHistory || d.roleHistory) ? (d.RoleHistory || d.roleHistory) : [],
          LoginHistory: Array.isArray(d.LoginHistory || d.loginHistory) ? (d.LoginHistory || d.loginHistory) : [],
          Password: d.Password || d.password || 'CoopBank@2026',
          TemporaryPassword: d.TemporaryPassword || d.temporaryPassword,
          MustChangePassword: !!(d.MustChangePassword ?? d.mustChangePassword),
          ActivationCode: d.ActivationCode || d.activationCode,
          LastPasswordReset: d.LastPasswordReset || d.lastPasswordReset,
        });
      });
      onSuccess(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function fetchUserByEmailFromFirestore(email: string): Promise<User | null> {
  if (!email || !auth.currentUser) return null;
  const cleanEmail = email.trim().toLowerCase();
  const path = COLLECTIONS.USERS;
  try {
    const snap = await getDocs(collection(db, path));
    let found: User | null = null;
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      const docEmail = (d.Email || d.email || '').toString().trim().toLowerCase();
      if (docEmail === cleanEmail) {
        found = {
          UserID: d.UserID || d.userId || docSnap.id,
          EmployeeID: d.EmployeeID || d.employeeId || '',
          Email: d.Email || d.email || '',
          FullName: d.FullName || d.fullName || '',
          Role: d.Role || d.role || 'DISTRICT_HR',
          DistrictID: d.DistrictID || d.districtId || null,
          Department: d.Department || d.department || 'General Banking',
          Position: d.Position || d.position || '',
          IsActive: !!(d.IsActive ?? d.isActive),
          CreatedAt: d.CreatedAt || d.createdAt || new Date().toISOString(),
          UpdatedAt: d.UpdatedAt || d.updatedAt || d.CreatedAt || new Date().toISOString(),
          CreatedBy: d.CreatedBy || d.createdBy || 'System',
          UpdatedBy: d.UpdatedBy || d.updatedBy || '',
          LastLogin: d.LastLogin || d.lastLogin,
          RoleHistory: Array.isArray(d.RoleHistory || d.roleHistory) ? (d.RoleHistory || d.roleHistory) : [],
          LoginHistory: Array.isArray(d.LoginHistory || d.loginHistory) ? (d.LoginHistory || d.loginHistory) : [],
          Password: d.Password || d.password || 'CoopBank@2026',
          TemporaryPassword: d.TemporaryPassword || d.temporaryPassword,
          MustChangePassword: !!(d.MustChangePassword ?? d.mustChangePassword),
          ActivationCode: d.ActivationCode || d.activationCode,
          LastPasswordReset: d.LastPasswordReset || d.lastPasswordReset,
        };
      }
    });
    return found;
  } catch (err) {
    console.warn('Direct Firestore user fetch error:', err);
    return null;
  }
}

export async function saveUserToFirestore(
  user: User,
  actorEmail: string,
  actorName: string,
  roleChangeReason?: string
): Promise<void> {
  const path = `${COLLECTIONS.USERS}/${user.UserID}`;
  const now = new Date().toISOString();

  const userDocPayload = {
    userId: user.UserID,
    UserID: user.UserID,
    employeeId: user.EmployeeID || '',
    EmployeeID: user.EmployeeID || '',
    email: user.Email,
    Email: user.Email,
    fullName: user.FullName,
    FullName: user.FullName,
    role: user.Role,
    Role: user.Role,
    districtId: user.DistrictID || '',
    DistrictID: user.DistrictID,
    department: user.Department || 'General Banking',
    Department: user.Department || 'General Banking',
    position: user.Position,
    Position: user.Position,
    isActive: user.IsActive,
    IsActive: user.IsActive,
    createdAt: user.CreatedAt || now,
    CreatedAt: user.CreatedAt || now,
    updatedAt: now,
    UpdatedAt: now,
    createdBy: user.CreatedBy || actorEmail,
    CreatedBy: user.CreatedBy || actorEmail,
    updatedBy: actorEmail,
    UpdatedBy: actorEmail,
    lastLogin: user.LastLogin || now,
    LastLogin: user.LastLogin,
    roleHistory: user.RoleHistory || [],
    RoleHistory: user.RoleHistory || [],
    loginHistory: user.LoginHistory || [],
    LoginHistory: user.LoginHistory || [],
    password: user.Password || 'CoopBank@2026',
    Password: user.Password || 'CoopBank@2026',
    temporaryPassword: user.TemporaryPassword || '',
    TemporaryPassword: user.TemporaryPassword || '',
    mustChangePassword: !!user.MustChangePassword,
    MustChangePassword: !!user.MustChangePassword,
    activationCode: user.ActivationCode || '',
    ActivationCode: user.ActivationCode || '',
    lastPasswordReset: user.LastPasswordReset || '',
    LastPasswordReset: user.LastPasswordReset || '',
  };

  try {
    await setDoc(doc(db, COLLECTIONS.USERS, user.UserID), userDocPayload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }

  // Audit log
  const auditId = `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const auditPath = `${COLLECTIONS.AUDIT_LOG}/${auditId}`;
  try {
    await setDoc(doc(db, COLLECTIONS.AUDIT_LOG, auditId), {
      auditId,
      AuditID: auditId,
      userEmail: actorEmail,
      UserEmail: actorEmail,
      userName: actorName,
      UserName: actorName,
      action: 'USER_MODIFIED',
      Action: 'USER_MODIFIED',
      entityType: 'User',
      EntityType: 'User',
      entityId: user.UserID,
      EntityID: user.UserID,
      timestamp: now,
      Timestamp: now,
      changeSummary: `Admin ${actorName} (${actorEmail}) updated profile for ${user.FullName} (${user.Email}) - Role: ${user.Role}, Status: ${user.IsActive ? 'Active' : 'Inactive'}, District: ${user.DistrictID || 'Cross-District'}`,
      ChangeSummary: `Admin ${actorName} (${actorEmail}) updated profile for ${user.FullName} (${user.Email}) - Role: ${user.Role}, Status: ${user.IsActive ? 'Active' : 'Inactive'}, District: ${user.DistrictID || 'Cross-District'}`,
      reasonForChange: roleChangeReason || 'Enterprise user role and jurisdiction maintenance.',
      ReasonForChange: roleChangeReason || 'Enterprise user role and jurisdiction maintenance.',
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, auditPath);
  }
}

// ----------------- Audit Log Operations -----------------

export async function fetchAuditLogsFromFirestore(): Promise<AuditLogEntry[]> {
  const path = COLLECTIONS.AUDIT_LOG;
  try {
    const snap = await getDocs(collection(db, path));
    const items: AuditLogEntry[] = [];
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      items.push({
        AuditID: d.AuditID || d.auditId || docSnap.id,
        UserEmail: d.UserEmail || d.userEmail || '',
        UserName: d.UserName || d.userName || '',
        Action: d.Action || d.action || '',
        EntityType: d.EntityType || d.entityType || 'Report',
        EntityID: d.EntityID || d.entityId || '',
        Timestamp: d.Timestamp || d.timestamp || new Date().toISOString(),
        ChangeSummary: d.ChangeSummary || d.changeSummary || '',
        ReasonForChange: d.ReasonForChange || d.reasonForChange || '',
      });
    });
    // Sort descending by timestamp
    return items.sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeAuditLogs(
  onSuccess: (logs: AuditLogEntry[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const path = COLLECTIONS.AUDIT_LOG;
  return onSnapshot(
    collection(db, path),
    (snap) => {
      const items: AuditLogEntry[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          AuditID: d.AuditID || d.auditId || docSnap.id,
          UserEmail: d.UserEmail || d.userEmail || '',
          UserName: d.UserName || d.userName || '',
          Action: d.Action || d.action || '',
          EntityType: d.EntityType || d.entityType || 'Report',
          EntityID: d.EntityID || d.entityId || '',
          Timestamp: d.Timestamp || d.timestamp || new Date().toISOString(),
          ChangeSummary: d.ChangeSummary || d.changeSummary || '',
          ReasonForChange: d.ReasonForChange || d.reasonForChange || '',
        });
      });
      items.sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());
      onSuccess(items);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function addAuditLogToFirestore(entry: AuditLogEntry): Promise<void> {
  const path = `${COLLECTIONS.AUDIT_LOG}/${entry.AuditID}`;
  try {
    await setDoc(doc(db, COLLECTIONS.AUDIT_LOG, entry.AuditID), {
      auditId: entry.AuditID,
      AuditID: entry.AuditID,
      userEmail: entry.UserEmail,
      UserEmail: entry.UserEmail,
      userName: entry.UserName,
      UserName: entry.UserName,
      action: entry.Action,
      Action: entry.Action,
      entityType: entry.EntityType,
      EntityType: entry.EntityType,
      entityId: entry.EntityID,
      EntityID: entry.EntityID,
      timestamp: entry.Timestamp,
      Timestamp: entry.Timestamp,
      changeSummary: entry.ChangeSummary,
      ChangeSummary: entry.ChangeSummary,
      reasonForChange: entry.ReasonForChange,
      ReasonForChange: entry.ReasonForChange,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
