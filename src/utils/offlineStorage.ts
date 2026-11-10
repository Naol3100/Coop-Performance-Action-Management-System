import { DisciplinaryReport, User, District, AuditLogEntry } from '../types';
import { INITIAL_REPORTS, INITIAL_USERS, INITIAL_DISTRICTS, INITIAL_AUDIT_LOGS } from '../data/mockData';

const STORAGE_KEYS = {
  REPORTS: 'BANK_HR_DISCIPLINARY_REPORTS_V1',
  USERS: 'BANK_HR_USERS_V1',
  DISTRICTS: 'BANK_HR_DISTRICTS_V1',
  AUDIT: 'BANK_HR_AUDIT_LOGS_V1',
  OFFLINE_QUEUE: 'BANK_HR_OFFLINE_SYNC_QUEUE_V1',
  AUTH_SESSION: 'BANK_HR_ACTIVE_SESSION_V2',
};

export function deduplicateUsers(userList: User[]): User[] {
  const map = new Map<string, User>();

  for (const u of userList) {
    if (!u || !u.UserID) continue;
    const emailKey = (u.Email || '').trim().toLowerCase();
    const primaryKey = emailKey || u.UserID;

    const existing = map.get(primaryKey) || (emailKey ? map.get(u.UserID) : undefined);
    if (!existing) {
      map.set(primaryKey, u);
      map.set(u.UserID, u);
    } else {
      // Retain the version that is newer or has updated role history
      const existingTime = existing.UpdatedAt ? new Date(existing.UpdatedAt).getTime() : 0;
      const newTime = u.UpdatedAt ? new Date(u.UpdatedAt).getTime() : 0;
      if (newTime >= existingTime) {
        map.set(primaryKey, u);
        map.set(u.UserID, u);
      }
    }
  }

  // Return unique user objects by UserID
  const uniqueUsers = new Map<string, User>();
  for (const user of map.values()) {
    uniqueUsers.set(user.UserID, user);
  }
  return Array.from(uniqueUsers.values());
}

export function loadStoredAuthSession(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.Email || parsed.UserID)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load session from localStorage', e);
  }
  return null;
}

export function saveStoredAuthSession(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    }
  } catch (e) {
    console.warn('Failed to save session to localStorage', e);
  }
}

export interface OfflineQueueItem {
  queueId: string;
  reportId: string;
  action: 'CREATE' | 'UPDATE' | 'DRAFT';
  timestamp: string;
  userEmail: string;
  employeeName: string;
  districtId: string;
}

export function loadStoredReports(): DisciplinaryReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.some(r => r.DistrictID === 'DIST-01' && r.ReportID.includes('ADA'))) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load reports from localStorage', e);
  }
  saveStoredReports(INITIAL_REPORTS);
  return INITIAL_REPORTS;
}

export function saveStoredReports(reports: DisciplinaryReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.warn('Failed to save reports to localStorage', e);
  }
}

export function loadStoredUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (raw) {
      let parsed: User[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const deduped = deduplicateUsers(parsed);
        if (deduped.length !== parsed.length) {
          saveStoredUsers(deduped);
        }
        return deduped;
      }
    }
  } catch (e) {
    console.warn('Failed to load users from localStorage', e);
  }
  const initial = deduplicateUsers(INITIAL_USERS);
  saveStoredUsers(initial);
  return initial;
}

export function saveStoredUsers(users: User[]): void {
  try {
    const deduped = deduplicateUsers(users);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(deduped));
  } catch (e) {
    console.warn('Failed to save users to localStorage', e);
  }
}

export function loadStoredDistricts(): District[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DISTRICTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.some(d => d.DistrictName === 'Adama District')) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load districts from localStorage', e);
  }
  saveStoredDistricts(INITIAL_DISTRICTS);
  return INITIAL_DISTRICTS;
}

export function saveStoredDistricts(districts: District[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DISTRICTS, JSON.stringify(districts));
  } catch (e) {
    console.warn('Failed to save districts to localStorage', e);
  }
}

export function loadStoredAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load audit logs from localStorage', e);
  }
  return INITIAL_AUDIT_LOGS;
}

export function saveStoredAuditLogs(logs: AuditLogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(logs));
  } catch (e) {
    console.warn('Failed to save audit logs to localStorage', e);
  }
}

export function getOfflineQueue(): OfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load offline queue', e);
  }
  return [];
}

export function enqueueOfflineReport(report: DisciplinaryReport, actionType: 'CREATE' | 'UPDATE' | 'DRAFT', userEmail: string): void {
  try {
    const queue = getOfflineQueue();
    const existingIndex = queue.findIndex(q => q.reportId === report.ReportID);
    const item: OfflineQueueItem = {
      queueId: `Q-${Date.now().toString().slice(-6)}`,
      reportId: report.ReportID,
      action: actionType,
      timestamp: new Date().toISOString(),
      userEmail,
      employeeName: report.EmployeeName,
      districtId: report.DistrictID,
    };

    if (existingIndex >= 0) {
      queue[existingIndex] = item;
    } else {
      queue.push(item);
    }

    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to enqueue offline item', e);
  }
}

export function removeFromOfflineQueue(reportId: string): void {
  try {
    const queue = getOfflineQueue().filter(q => q.reportId !== reportId);
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  } catch (e) {
    console.warn('Failed to remove item from offline queue', e);
  }
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.OFFLINE_QUEUE);
  } catch (e) {
    console.warn('Failed to clear offline queue', e);
  }
}
