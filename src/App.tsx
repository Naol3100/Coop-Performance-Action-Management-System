import React, { useState, useEffect, useCallback } from 'react';
import {
  District,
  User,
  DisciplinaryReport,
  AuditLogEntry,
  SystemConfig
} from './types';
import {
  INITIAL_DISTRICTS,
  INITIAL_USERS,
  INITIAL_REPORTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_CONFIG
} from './data/mockData';
import {
  loadStoredReports,
  saveStoredReports,
  loadStoredUsers,
  saveStoredUsers,
  loadStoredDistricts,
  saveStoredDistricts,
  loadStoredAuditLogs,
  saveStoredAuditLogs,
  getOfflineQueue,
  enqueueOfflineReport,
  clearOfflineQueue,
  OfflineQueueItem,
  loadStoredAuthSession,
  saveStoredAuthSession,
  deduplicateUsers
} from './utils/offlineStorage';
import { useFirebase } from './context/FirebaseContext';
import {
  saveReportToFirestore,
  addReportReviewToFirestore,
  saveUserToFirestore,
  saveDistrictToFirestore,
  subscribeReports,
  subscribeDistricts,
  subscribeUsers,
  subscribeAuditLogs,
  fetchUserByEmailFromFirestore,
} from './services/firebaseDb';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { DynamicDashboard } from './components/DynamicDashboard';
import { DistrictDashboard } from './components/DistrictDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { ReportForm } from './components/ReportForm';
import { ReportList } from './components/ReportList';
import {
  getRoleDefinition,
  hasPermission,
  canAccessTab,
  canPerformAction,
  getAllowedTabsForRole
} from './rbac/rbacPolicy';
import { ReportDetailModal } from './components/ReportDetailModal';
import { OfficialPrintDocument } from './components/OfficialPrintDocument';
import { AdminDashboard } from './components/AdminDashboard';
import { AuditLogView } from './components/AuditLogView';
import { OfflineSyncCenter } from './components/OfflineSyncCenter';
import { OfflineIndicator } from './components/OfflineIndicator';
import { AppDeploymentModal } from './components/AppDeploymentModal';
import { AccessDeniedScreen } from './components/AccessDeniedScreen';
import { LoginScreen } from './components/LoginScreen';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { UserSecuritySettingsModal } from './components/UserSecuritySettingsModal';
import { exportReportsToCSV } from './utils/exportUtils';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { getUserBiometricPreference } from './utils/webauthn';
import { AiAssistant } from './components/AiAssistant';
import { AlertCircle, Lock, Shield, Database, CheckCircle, AlertTriangle, X, RefreshCw, LogIn, Bot, Sparkles } from 'lucide-react';

export default function App() {
  const [systemConfig] = useState<SystemConfig>(INITIAL_CONFIG);

  // Firebase Context
  const { firebaseUser, authLoading, isConnected, isSeeding, signInWithGoogle, sendPasswordReset, signOut, refreshConnection, dbError, clearDbError } = useFirebase();
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isDbLoading, setIsDbLoading] = useState(false);

  // Persistent State backed by Firestore + local offline caching
  const [districts, setDistricts] = useState<District[]>(() => loadStoredDistricts());
  const [users, setUsers] = useState<User[]>(() => loadStoredUsers());
  const [reports, setReports] = useState<DisciplinaryReport[]>(() => loadStoredReports());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadStoredAuditLogs());
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>(() => getOfflineQueue());
  const [isSyncing, setIsSyncing] = useState(false);

  // Online connection tracking hook
  const { isOnline } = useOnlineStatus();

  // Current logged in user (null by default if no active session in localStorage)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = loadStoredAuthSession();
    if (session && session.Email?.toLowerCase().trim() === 'naolcbo@gmail.com') {
      const adminSession: User = {
        ...session,
        Role: 'ADMIN',
        DistrictID: null,
        Position: 'Lead HR Enterprise Administrator',
      };
      saveStoredAuthSession(adminSession);
      return adminSession;
    }
    return session;
  });

  // Track if current session holds admin authorization so switching personas never locks the admin out
  const [sessionAdminUser, setSessionAdminUser] = useState<User | null>(() => {
    const current = loadStoredAuthSession();
    if (current && (current.Role === 'ADMIN' || current.Email?.toLowerCase().trim() === 'naolcbo@gmail.com')) {
      return {
        ...current,
        Role: 'ADMIN',
        DistrictID: null,
        Position: 'Lead HR Enterprise Administrator',
      };
    }
    return current?.Role === 'ADMIN' ? current : null;
  });

  // Active testing persona selected by Admin (isolated from root credentials)
  const [sessionPersonaUser, setSessionPersonaUser] = useState<User | null>(null);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Modal / Detail states
  const [detailModalReport, setDetailModalReport] = useState<DisciplinaryReport | null>(null);
  const [printDocumentReport, setPrintDocumentReport] = useState<DisciplinaryReport | null>(null);
  const [editingReport, setEditingReport] = useState<DisciplinaryReport | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);

  // Optional filter drilldown
  const [forcedDistrictFilter, setForcedDistrictFilter] = useState<string | undefined>(undefined);

  // Auto-dismiss notification after 6 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Connect Firestore Real-Time Snapshot Listeners
  useEffect(() => {
    if (authLoading || !isConnected) return;

    setIsDbLoading(true);

    const unsubReports = subscribeReports(
      (fsReports) => {
        if (fsReports.length > 0) {
          setReports(fsReports);
          saveStoredReports(fsReports);
        }
        setIsDbLoading(false);
      },
      (err) => console.error('Subscription error for reports:', err)
    );

    const unsubDistricts = subscribeDistricts(
      (fsDistricts) => {
        if (fsDistricts.length > 0) {
          setDistricts(fsDistricts);
          saveStoredDistricts(fsDistricts);
        }
      },
      (err) => console.error('Subscription error for districts:', err)
    );

    const unsubUsers = subscribeUsers(
      (fsUsers) => {
        if (fsUsers.length > 0) {
          // Merge remote users from Firestore with local users, ensuring newest updates take precedence
          setUsers((prevUsers) => {
            const map = new Map<string, User>();
            for (const u of prevUsers) {
              if (u && u.UserID) map.set(u.UserID, u);
            }
            for (const u of fsUsers) {
              if (u && u.UserID) {
                const existing = map.get(u.UserID);
                const existingTime = existing?.UpdatedAt ? new Date(existing.UpdatedAt).getTime() : 0;
                const remoteTime = u.UpdatedAt ? new Date(u.UpdatedAt).getTime() : 0;

                let candidate = u;
                if (u.Email && u.Email.toLowerCase().trim() === 'naolcbo@gmail.com') {
                  candidate = {
                    ...u,
                    Role: 'ADMIN',
                    DistrictID: null,
                    Position: 'Lead HR Enterprise Administrator',
                  };
                }

                if (!existing || remoteTime >= existingTime) {
                  map.set(u.UserID, candidate);
                }
              }
            }
            const merged = Array.from(map.values());
            saveStoredUsers(merged);
            return merged;
          });

          // Match and update the active user session in real-time
          setCurrentUser((prevCurrent) => {
            const activeEmail = (prevCurrent?.Email || firebaseUser?.email || '').toLowerCase().trim();
            const activeId = prevCurrent?.UserID;

            let liveUser = fsUsers.find((u) =>
              (activeId && u.UserID === activeId) ||
              (activeEmail && u.Email && u.Email.toLowerCase().trim() === activeEmail)
            );

            // naolcbo@gmail.com is strictly granted Enterprise Admin privileges
            if (activeEmail === 'naolcbo@gmail.com') {
              if (liveUser) {
                liveUser = {
                  ...liveUser,
                  Role: 'ADMIN',
                  DistrictID: null,
                  Position: 'Lead HR Enterprise Administrator',
                };
              } else {
                liveUser = {
                  UserID: 'USR-DHR-NAOL',
                  Email: 'naolcbo@gmail.com',
                  FullName: firebaseUser?.displayName || 'Naol Feyisa',
                  Role: 'ADMIN',
                  DistrictID: null,
                  Position: 'Lead HR Enterprise Administrator',
                  IsActive: true,
                  CreatedAt: new Date().toISOString(),
                  LastLogin: new Date().toISOString(),
                };
              }
            }

            if (liveUser) {
              const roleChanged = prevCurrent ? prevCurrent.Role !== liveUser.Role : false;
              const districtChanged = prevCurrent ? prevCurrent.DistrictID !== liveUser.DistrictID : false;
              const statusChanged = prevCurrent ? prevCurrent.IsActive !== liveUser.IsActive : false;
              const positionChanged = prevCurrent ? prevCurrent.Position !== liveUser.Position : false;

              if (roleChanged || districtChanged || statusChanged || positionChanged) {
                saveStoredAuthSession(liveUser);
                if (liveUser.Role === 'ADMIN') {
                  setSessionAdminUser(liveUser);
                }
                if (roleChanged && prevCurrent) {
                  setNotification({
                    type: 'info',
                    message: `Role Updated in Real-Time: Your role is now "${getRoleDefinition(liveUser.Role).name}". Accessible workspace and permissions refreshed immediately.`,
                  });
                }
              }
              return liveUser;
            }

            return prevCurrent;
          });
        }
        setIsDbLoading(false);
      },
      (err) => console.error('Subscription error for users:', err)
    );

    const unsubAudit = subscribeAuditLogs(
      (fsLogs) => {
        if (fsLogs.length > 0) {
          setAuditLogs(fsLogs);
          saveStoredAuditLogs(fsLogs);
        }
      },
      (err) => console.error('Subscription error for audit logs:', err)
    );

    return () => {
      unsubReports();
      unsubDistricts();
      unsubUsers();
      unsubAudit();
    };
  }, [isConnected, authLoading, firebaseUser]);

  // Real-time multi-tab & cross-window synchronization via BroadcastChannel, Storage, and Custom events
  useEffect(() => {
    let rbacChannel: BroadcastChannel | null = null;
    try {
      rbacChannel = new BroadcastChannel('cbo_rbac_sync');
      rbacChannel.onmessage = (event) => {
        if (event.data?.type === 'USER_ROLE_UPDATED' && event.data?.user) {
          const updatedUser: User = event.data.user;
          // Instantly update users list in this tab
          setUsers((prev) =>
            prev.map((u) =>
              u.UserID === updatedUser.UserID || u.Email.toLowerCase().trim() === updatedUser.Email.toLowerCase().trim()
                ? updatedUser
                : u
            )
          );

          // Check if this active tab belongs to the updated user
          setCurrentUser((prev) => {
            if (!prev) return null;
            if (
              prev.UserID === updatedUser.UserID ||
              prev.Email.toLowerCase().trim() === updatedUser.Email.toLowerCase().trim()
            ) {
              saveStoredAuthSession(updatedUser);
              setNotification({
                type: 'info',
                message: `Role Updated in Real-Time: Your role is now "${getRoleDefinition(updatedUser.Role).name}". Permissions refreshed immediately without refresh.`,
              });
              return updatedUser;
            }
            return prev;
          });
        }
      };
    } catch {}

    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'BANK_HR_USERS_V1' || e.key === 'cbo_last_role_update') && e.newValue) {
        try {
          const freshUsers: User[] = loadStoredUsers();
          setUsers(freshUsers);

          setCurrentUser((prev) => {
            if (!prev) return null;
            const updated = freshUsers.find(
              (u) =>
                u.UserID === prev.UserID ||
                u.Email.toLowerCase().trim() === prev.Email.toLowerCase().trim()
            );
            if (
              updated &&
              (updated.Role !== prev.Role ||
                updated.IsActive !== prev.IsActive ||
                updated.DistrictID !== prev.DistrictID)
            ) {
              saveStoredAuthSession(updated);
              setNotification({
                type: 'info',
                message: `Role Updated in Real-Time: Your role is now "${getRoleDefinition(updated.Role).name}". Permissions refreshed immediately.`,
              });
              return updated;
            }
            return prev;
          });
        } catch {}
      }
    };

    const handleCustomRoleUpdate = (e: any) => {
      const updatedUser: User = e.detail;
      if (!updatedUser) return;
      setUsers((prev) =>
        prev.map((u) =>
          u.UserID === updatedUser.UserID || u.Email.toLowerCase().trim() === updatedUser.Email.toLowerCase().trim()
            ? updatedUser
            : u
        )
      );
      setCurrentUser((prev) => {
        if (!prev) return null;
        if (
          prev.UserID === updatedUser.UserID ||
          prev.Email.toLowerCase().trim() === updatedUser.Email.toLowerCase().trim()
        ) {
          saveStoredAuthSession(updatedUser);
          setNotification({
            type: 'info',
            message: `Role Updated in Real-Time: Your role is now "${getRoleDefinition(updatedUser.Role).name}". Permissions refreshed immediately.`,
          });
          return updatedUser;
        }
        return prev;
      });
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cbo_user_role_updated', handleCustomRoleUpdate);
    return () => {
      if (rbacChannel) rbacChannel.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cbo_user_role_updated', handleCustomRoleUpdate);
    };
  }, []);

  // Direct Firestore verification for Google sign-in accounts
  useEffect(() => {
    if (!firebaseUser?.email) return;
    const userEmail = firebaseUser.email.toLowerCase().trim();

    // Check if user is already loaded
    const alreadyMatched = users.find((u) => u.Email.toLowerCase().trim() === userEmail);
    if (alreadyMatched) {
      if (!currentUser || currentUser.UserID !== alreadyMatched.UserID || currentUser.Role !== alreadyMatched.Role) {
        setCurrentUser(alreadyMatched);
        saveStoredAuthSession(alreadyMatched);
      }
      return;
    }

    // Direct Firestore fetch to guarantee immediate login access for newly added users
    let isMounted = true;
    fetchUserByEmailFromFirestore(userEmail).then((remoteUser) => {
      if (!isMounted) return;
      if (remoteUser) {
        setUsers((prev) => {
          const updated = [remoteUser, ...prev.filter((u) => u.Email.toLowerCase().trim() !== userEmail)];
          saveStoredUsers(updated);
          return updated;
        });
        setCurrentUser(remoteUser);
        saveStoredAuthSession(remoteUser);
        if (remoteUser.Role === 'ADMIN') {
          setSessionAdminUser(remoteUser);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [firebaseUser, users, currentUser]);

  // Local sync handlers
  const persistReports = (newReports: DisciplinaryReport[]) => {
    setReports(newReports);
    saveStoredReports(newReports);
  };

  const persistAuditLogs = (newLogs: AuditLogEntry[]) => {
    setAuditLogs(newLogs);
    saveStoredAuditLogs(newLogs);
  };

  const persistUsers = (newUsers: User[]) => {
    const deduped = deduplicateUsers(newUsers);
    setUsers(deduped);
    saveStoredUsers(deduped);
  };

  const persistDistricts = (newDistricts: District[]) => {
    setDistricts(newDistricts);
    saveStoredDistricts(newDistricts);
  };

  // Synchronize queued offline reports
  const handleSyncAll = useCallback(async () => {
    if (offlineQueue.length === 0) return;
    setIsSyncing(true);

    try {
      if (isOnline && firebaseUser) {
        for (const item of offlineQueue) {
          const reportToSync = reports.find((r) => r.ReportID === item.reportId);
          if (reportToSync) {
            await saveReportToFirestore(
              reportToSync,
              currentUser?.Email || 'system@cbo.com',
              currentUser?.FullName || 'System Synchronizer',
              item.action === 'CREATE'
            );
          }
        }
      }

      // Mark all reports as synced in local state
      const updatedReports = reports.map((r) => {
        if (r.pendingOfflineSync) {
          return {
            ...r,
            pendingOfflineSync: false,
          };
        }
        return r;
      });

      persistReports(updatedReports);

      // Log sync event in audit trail
      const now = new Date().toISOString();
      const syncAudit: AuditLogEntry = {
        AuditID: `AUD-SYNC-${Date.now().toString().slice(-4)}`,
        UserEmail: currentUser?.Email || 'system@cbo.com',
        UserName: currentUser?.FullName || 'System Synchronizer',
        Action: 'OFFLINE_SYNC_COMPLETED',
        EntityType: 'System',
        EntityID: `QUEUE-${offlineQueue.length}`,
        Timestamp: now,
        ChangeSummary: `Successfully synchronized ${offlineQueue.length} offline disciplinary report filings with Cloud Firestore master database.`,
        ReasonForChange: 'Offline queue synchronization protocol completed.',
      };

      persistAuditLogs([syncAudit, ...auditLogs]);
      clearOfflineQueue();
      setOfflineQueue([]);
      setNotification({
        type: 'success',
        message: `Successfully synchronized ${offlineQueue.length} report(s) with Cloud Firestore.`,
      });
    } catch (err: any) {
      console.error('Batch sync error:', err);
      setNotification({
        type: 'error',
        message: `Failed to complete cloud synchronization: ${err?.message || 'Network error'}.`,
      });
    } finally {
      setIsSyncing(false);
    }
  }, [offlineQueue, reports, auditLogs, currentUser, isOnline, firebaseUser]);

  // Automatically trigger sync when transitioning from offline to online
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0 && firebaseUser) {
      handleSyncAll();
    }
  }, [isOnline, offlineQueue.length, firebaseUser, handleSyncAll]);

  // User login handler (called when user submits email & password on LoginScreen)
  const handleLoginSuccess = (user: User, requiresPasswordChange?: boolean) => {
    const userToSave: User = {
      ...user,
      MustChangePassword: requiresPasswordChange !== undefined ? requiresPasswordChange : user.MustChangePassword,
    };
    setCurrentUser(userToSave);
    if (user.Role === 'ADMIN') {
      setSessionAdminUser(userToSave);
    }
    saveStoredAuthSession(userToSave);
    setActiveTab('dashboard');
    setForcedDistrictFilter(undefined);

    const now = new Date().toISOString();
    const loginAudit: AuditLogEntry = {
      AuditID: `AUD-LOGIN-${Date.now().toString().slice(-4)}`,
      UserEmail: user.Email,
      UserName: user.FullName,
      Action: 'USER_LOGIN',
      EntityType: 'User',
      EntityID: user.UserID,
      Timestamp: now,
      ChangeSummary: `User ${user.FullName} (${user.Email}) signed in to Bank Disciplinary Portal with credentials.`,
      ReasonForChange: 'Authenticated session initialized.',
    };
    persistAuditLogs([loginAudit, ...auditLogs]);

    const roleDef = getRoleDefinition(user.Role);
    const distName = districts.find(d => d.DistrictID === user.DistrictID)?.DistrictName;
    const jurisdiction = roleDef.isDistrictBound ? (distName ? `${distName} District` : 'Assigned District') : 'Bank-Wide Cross-District Authority';
    setNotification({
      type: 'success',
      message: `Welcome, ${user.FullName}. Authenticated as ${roleDef.name} (${jurisdiction}).`,
    });
  };

  // Handler for mandatory password update when logging in with admin-generated default credentials
  const handlePasswordChanged = async (newPassword: string) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    const updatedUser: User = {
      ...currentUser,
      Password: newPassword,
      TemporaryPassword: '',
      MustChangePassword: false,
      LastPasswordReset: now,
    };

    setCurrentUser(updatedUser);
    saveStoredAuthSession(updatedUser);

    const updatedUsers = users.map((u) => (u.UserID === updatedUser.UserID ? updatedUser : u));
    persistUsers(updatedUsers);

    if (isConnected || isOnline) {
      try {
        await saveUserToFirestore(updatedUser, updatedUser.Email, updatedUser.FullName);
      } catch (e) {
        console.warn('Failed to sync updated password to Firestore:', e);
      }
    }

    const auditEntry: AuditLogEntry = {
      AuditID: `AUD-PWD-${Date.now().toString().slice(-4)}`,
      UserEmail: updatedUser.Email,
      UserName: updatedUser.FullName,
      Action: 'PASSWORD_UPDATED',
      EntityType: 'User',
      EntityID: updatedUser.UserID,
      Timestamp: now,
      ChangeSummary: `User ${updatedUser.FullName} (${updatedUser.Email}) updated default administrator login password to personal secure password.`,
      ReasonForChange: 'Mandatory initial credential update completed successfully.',
    };
    persistAuditLogs([auditEntry, ...auditLogs]);

    setNotification({
      type: 'success',
      message: 'New personal password set successfully! Enterprise access granted.',
    });
  };

  // Sign out handler
  const handleSignOut = async () => {
    const email = currentUser?.Email || firebaseUser?.email || 'Unknown';
    const name = currentUser?.FullName || 'User';
    setCurrentUser(null);
    setSessionAdminUser(null);
    saveStoredAuthSession(null);
    if (firebaseUser) {
      try {
        await signOut();
      } catch (e) {
        console.error('Firebase signout error:', e);
      }
    }
    const logoutAudit: AuditLogEntry = {
      AuditID: `AUD-LOGOUT-${Date.now().toString().slice(-4)}`,
      UserEmail: email,
      UserName: name,
      Action: 'USER_LOGOUT',
      EntityType: 'User',
      EntityID: 'SESSION',
      Timestamp: new Date().toISOString(),
      ChangeSummary: `User ${name} (${email}) signed out of the system.`,
      ReasonForChange: 'User terminated session.',
    };
    persistAuditLogs([logoutAudit, ...auditLogs]);
  };

  // User activation passcode sync handler
  const handleUpdateUserActivation = (email: string, code: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const matched = users.find(u => u.Email.toLowerCase() === cleanEmail);
    if (matched) {
      const updatedUser: User = {
        ...matched,
        ActivationCode: code,
        TemporaryPassword: code,
        LastPasswordReset: new Date().toISOString(),
      };
      handleUpdateUser(updatedUser);
    }
  };

  // User switching handler (strictly reserved for Enterprise Administrator)
  const handleSwitchUser = (user: User) => {
    const isAllowed = currentUser?.Role === 'ADMIN' || sessionAdminUser?.Role === 'ADMIN';

    if (!isAllowed) {
      console.warn('Unauthorized attempt to switch user persona. Role is locked.');
      return;
    }

    if (currentUser?.Role === 'ADMIN' && !sessionAdminUser) {
      setSessionAdminUser(currentUser);
    }

    setSessionPersonaUser(user);
    setCurrentUser(user);
    saveStoredAuthSession(user);
    setForcedDistrictFilter(undefined);

    // Synchronize active tab to allowed tab for new persona
    const allowed = getAllowedTabsForRole(user.Role);
    if (!allowed.includes(activeTab)) {
      const def = getRoleDefinition(user.Role);
      setActiveTab(def.defaultTab || 'dashboard');
    }
  };

  const handleExitProxy = () => {
    if (sessionAdminUser) {
      setSessionPersonaUser(null);
      setCurrentUser(sessionAdminUser);
      saveStoredAuthSession(sessionAdminUser);
      setForcedDistrictFilter(undefined);
      setActiveTab('dashboard');
      setNotification({
        type: 'info',
        message: 'Returned to System Administrator workspace.',
      });
    }
  };

  // Report creation / edit handler with Firestore integration
  const handleSubmitReport = async (submittedReport: DisciplinaryReport, isDraft: boolean) => {
    const isOfflineSave = !isOnline || !firebaseUser;
    const finalReportWithSync: DisciplinaryReport = {
      ...submittedReport,
      pendingOfflineSync: isOfflineSave,
      isOfflineCreated: isOfflineSave || submittedReport.isOfflineCreated,
    };

    const index = reports.findIndex((r) => r.ReportID === finalReportWithSync.ReportID);
    let updatedReports: DisciplinaryReport[];
    if (index >= 0) {
      updatedReports = [...reports];
      updatedReports[index] = finalReportWithSync;
    } else {
      updatedReports = [finalReportWithSync, ...reports];
    }
    persistReports(updatedReports);

    // Save to Cloud Firestore if connected
    if (isOnline && firebaseUser) {
      try {
        await saveReportToFirestore(
          finalReportWithSync,
          currentUser?.Email || firebaseUser.email || 'staff@cbo.com',
          currentUser?.FullName || firebaseUser.displayName || 'Bank Staff',
          index < 0
        );
        setNotification({
          type: 'success',
          message: `Disciplinary Report ${finalReportWithSync.ReportID} successfully saved and synchronized to Cloud Firestore.`,
        });
      } catch (err: any) {
        console.error('Firestore save failed:', err);
        setNotification({
          type: 'error',
          message: `Saved in local storage, but Firestore write failed: ${err.message || 'permission error'}. Queued for sync.`,
        });
      }
    } else {
      // If offline or not signed in, queue
      enqueueOfflineReport(
        finalReportWithSync,
        isDraft ? 'DRAFT' : index >= 0 ? 'UPDATE' : 'CREATE',
        currentUser?.Email || 'staff@cbo.com'
      );
      setOfflineQueue(getOfflineQueue());
      setNotification({
        type: 'info',
        message: !isOnline
          ? `Report saved locally in Offline Mode. It will sync automatically to Cloud Firestore when connection returns.`
          : `Report saved in local cache. Sign in with Google to sync directly to Cloud Firestore.`,
      });
    }

    // Add audit log
    const newAudit: AuditLogEntry = {
      AuditID: `AUD-LOG-${Date.now().toString().slice(-4)}`,
      UserEmail: currentUser?.Email || 'staff@cbo.com',
      UserName: currentUser?.FullName || 'Bank Staff',
      Action: isDraft ? 'DRAFT_SAVED' : 'REPORT_SUBMITTED',
      EntityType: 'Report',
      EntityID: finalReportWithSync.ReportID,
      Timestamp: new Date().toISOString(),
      ChangeSummary: isDraft
        ? `Saved draft report for ${finalReportWithSync.EmployeeName} (${finalReportWithSync.EmployeeID}) ${isOfflineSave ? '[Offline/Pending Sync]' : '[Cloud Synced]'}`
        : `Submitted disciplinary report for ${finalReportWithSync.EmployeeName} (${finalReportWithSync.ActionType}) ${isOfflineSave ? '[Offline/Pending Sync]' : '[Cloud Synced]'}`,
      ReasonForChange: isDraft ? 'Draft authoring' : 'Filing of authorized disciplinary action by District Director',
    };
    persistAuditLogs([newAudit, ...auditLogs]);

    setEditingReport(null);
    setActiveTab(currentUser?.Role === 'DISTRICT_HR' ? 'my-reports' : 'dashboard');
  };

  // Head Office Review Endorsement handler with Firestore persistence
  const handleMarkReviewed = async (reportId: string, comments: string) => {
    const now = new Date().toISOString();
    const userEmail = currentUser?.Email || 'manager@cbo.com';
    const userName = currentUser?.FullName || 'Head Office HR Manager';
    let updatedReportForFs: DisciplinaryReport | null = null;
    const updatedReports = reports.map((r) => {
      if (r.ReportID === reportId) {
        const updatedTrail = [
          ...(r.AuditTrail || []),
          {
            HistoryID: `AUD-${Date.now().toString().slice(-4)}`,
            Action: 'Report Reviewed and Endorsed',
            Timestamp: now,
            Actor: `${userName} (${userEmail})`,
            ActorRole: 'Head Office HR Manager',
            Details: comments,
          },
        ];
        const res: DisciplinaryReport = {
          ...r,
          ReportStatus: 'Reviewed' as const,
          ReviewedBy: userEmail,
          ReviewerName: userName,
          ReviewedAt: now,
          ReviewComments: comments,
          AuditTrail: updatedTrail,
          UpdatedAt: now,
        };
        updatedReportForFs = res;
        return res;
      }
      return r;
    });
    persistReports(updatedReports);

    // Save review to Cloud Firestore
    if (isOnline && firebaseUser && updatedReportForFs) {
      try {
        await addReportReviewToFirestore(
          reportId,
          userEmail,
          userName,
          'Reviewed',
          comments,
          updatedReportForFs
        );
        setNotification({
          type: 'success',
          message: `Report ${reportId} endorsed and review saved in Cloud Firestore.`,
        });
      } catch (err: any) {
        console.error('Error writing review to Firestore:', err);
      }
    }

    const newAudit: AuditLogEntry = {
      AuditID: `AUD-LOG-${Date.now().toString().slice(-4)}`,
      UserEmail: userEmail,
      UserName: userName,
      Action: 'REPORT_REVIEWED',
      EntityType: 'Report',
      EntityID: reportId,
      Timestamp: now,
      ChangeSummary: `Reviewed and approved report ${reportId}. Notes: ${comments}`,
      ReasonForChange: 'Head Office oversight compliance clearance.',
    };
    persistAuditLogs([newAudit, ...auditLogs]);

    if (detailModalReport && detailModalReport.ReportID === reportId) {
      setDetailModalReport(null);
    }
  };

  // Head Office Correction Request handler with Firestore persistence
  const handleRequestCorrection = async (reportId: string, reason: string) => {
    const now = new Date().toISOString();
    const userEmail = currentUser?.Email || 'manager@cbo.com';
    const userName = currentUser?.FullName || 'Head Office HR Manager';
    let updatedReportForFs: DisciplinaryReport | null = null;
    const updatedReports = reports.map((r) => {
      if (r.ReportID === reportId) {
        const updatedTrail = [
          ...(r.AuditTrail || []),
          {
            HistoryID: `AUD-${Date.now().toString().slice(-4)}`,
            Action: 'Correction Requested by Head Office',
            Timestamp: now,
            Actor: `${userName} (${userEmail})`,
            ActorRole: 'Head Office HR Manager',
            Details: reason,
          },
        ];
        const res: DisciplinaryReport = {
          ...r,
          ReportStatus: 'Correction Requested' as const,
          CorrectionNotes: reason,
          AuditTrail: updatedTrail,
          UpdatedAt: now,
        };
        updatedReportForFs = res;
        return res;
      }
      return r;
    });
    persistReports(updatedReports);

    // Save review to Cloud Firestore
    if (isOnline && firebaseUser && updatedReportForFs) {
      try {
        await addReportReviewToFirestore(
          reportId,
          userEmail,
          userName,
          'Correction Requested',
          reason,
          updatedReportForFs
        );
        setNotification({
          type: 'success',
          message: `Correction request for ${reportId} logged in Cloud Firestore.`,
        });
      } catch (err: any) {
        console.error('Error writing correction request to Firestore:', err);
      }
    }

    const newAudit: AuditLogEntry = {
      AuditID: `AUD-LOG-${Date.now().toString().slice(-4)}`,
      UserEmail: userEmail,
      UserName: userName,
      Action: 'CORRECTION_REQUESTED',
      EntityType: 'Report',
      EntityID: reportId,
      Timestamp: now,
      ChangeSummary: `Requested correction on report ${reportId}: ${reason}`,
      ReasonForChange: 'Incomplete evidence or policy non-conformance.',
    };
    persistAuditLogs([newAudit, ...auditLogs]);

    if (detailModalReport && detailModalReport.ReportID === reportId) {
      setDetailModalReport(null);
    }
  };

  // User management handlers
  const handleCreateUser = async (newUser: User) => {
    const isCallerAdmin = currentUser?.Role === 'ADMIN' || sessionAdminUser?.Role === 'ADMIN';
    if (!isCallerAdmin) {
      setNotification({
        type: 'error',
        message: 'Permission Denied: Only System Administrators are authorized to provision new users.',
      });
      return;
    }

    const userEmail = currentUser?.Email || 'admin@coopbank.com';
    const userName = currentUser?.FullName || 'Administrator';

    // Persist to local state immediately
    const updatedUsers = [newUser, ...users.filter(u => u.Email.toLowerCase() !== newUser.Email.toLowerCase() && u.UserID !== newUser.UserID)];
    persistUsers(updatedUsers);

    // Save to Firestore
    try {
      await saveUserToFirestore(newUser, userEmail, userName);
    } catch (err: any) {
      console.warn('Note: Stored locally; Firestore sync status:', err?.message || err);
    }

    const newAudit: AuditLogEntry = {
      AuditID: `AUD-LOG-${Date.now().toString().slice(-4)}`,
      UserEmail: userEmail,
      UserName: userName,
      Action: 'USER_CREATED',
      EntityType: 'User',
      EntityID: newUser.UserID,
      Timestamp: new Date().toISOString(),
      ChangeSummary: `Admin created user ${newUser.FullName} (${newUser.Email}) with role ${newUser.Role}`,
      ReasonForChange: 'Enterprise user provisioning.',
    };
    persistAuditLogs([newAudit, ...auditLogs]);

    const roleName = getRoleDefinition(newUser.Role).name;
    setNotification({
      type: 'success',
      message: `User ${newUser.FullName} (${newUser.Email}) successfully provisioned as ${roleName}. They can now log in immediately.`,
    });
  };

  const handleUpdateUser = async (updatedUser: User) => {
    const callerEmail = (currentUser?.Email || firebaseUser?.email || '').toLowerCase().trim();
    const isAdminEmail = ['naolcbo@gmail.com', 'bighabes@gmail.com', 'milkinaol31@gmail.com', 'admin@coopbank.com'].includes(callerEmail);
    const isCallerAdmin = currentUser?.Role === 'ADMIN' || sessionAdminUser?.Role === 'ADMIN' || activeUser?.Role === 'ADMIN' || isAdminEmail;

    if (!isCallerAdmin) {
      setNotification({
        type: 'error',
        message: 'Permission Denied: Only System Administrators are authorized to update user roles or profiles.',
      });
      return;
    }

    const userEmail = currentUser?.Email || firebaseUser?.email || 'admin@coopbank.com';
    const userName = currentUser?.FullName || firebaseUser?.displayName || 'Administrator';

    const updatedUsersList = users.map((u) => {
      const matchId = u.UserID === updatedUser.UserID;
      const matchEmail = u.Email && updatedUser.Email && u.Email.toLowerCase().trim() === updatedUser.Email.toLowerCase().trim();
      return (matchId || matchEmail) ? updatedUser : u;
    });
    persistUsers(updatedUsersList);

    // If updating the active user session or testing persona, immediately sync state and update tab access
    const isTargetCurrentUser = Boolean(currentUser && (
      currentUser.UserID === updatedUser.UserID ||
      (currentUser.Email && updatedUser.Email && currentUser.Email.toLowerCase().trim() === updatedUser.Email.toLowerCase().trim())
    ));

    if (isTargetCurrentUser && currentUser) {
      // Preserve sessionAdminUser if the current user was an Admin so they don't lose admin control
      if ((currentUser.Role === 'ADMIN' || isCallerAdmin) && !sessionAdminUser) {
        setSessionAdminUser(currentUser.Role === 'ADMIN' ? currentUser : {
          ...currentUser,
          Role: 'ADMIN',
          Position: 'Enterprise System Administrator',
          DistrictID: null,
        });
      }
      setCurrentUser(updatedUser);
      saveStoredAuthSession(updatedUser);
      const allowed = getAllowedTabsForRole(updatedUser.Role);
      if (!allowed.includes(activeTab)) {
        const def = getRoleDefinition(updatedUser.Role);
        setActiveTab(def.defaultTab || 'dashboard');
      }
    }

    const isTargetPersona = Boolean(sessionPersonaUser && (
      sessionPersonaUser.UserID === updatedUser.UserID ||
      (sessionPersonaUser.Email && updatedUser.Email && sessionPersonaUser.Email.toLowerCase().trim() === updatedUser.Email.toLowerCase().trim())
    ));

    if (isTargetPersona) {
      setSessionPersonaUser(updatedUser);
      const allowed = getAllowedTabsForRole(updatedUser.Role);
      if (!allowed.includes(activeTab)) {
        const def = getRoleDefinition(updatedUser.Role);
        setActiveTab(def.defaultTab || 'dashboard');
      }
    }

    // Broadcast in-window custom event
    try {
      window.dispatchEvent(new CustomEvent('cbo_user_role_updated', { detail: updatedUser }));
      localStorage.setItem('cbo_last_role_update', JSON.stringify({ userId: updatedUser.UserID, role: updatedUser.Role, timestamp: Date.now() }));
    } catch {}

    // Broadcast across browser tabs via BroadcastChannel for zero-latency multi-tab sync
    try {
      const channel = new BroadcastChannel('cbo_rbac_sync');
      channel.postMessage({ type: 'USER_ROLE_UPDATED', user: updatedUser });
      channel.close();
    } catch {}

    // Save to Firestore so remote clients update in real time
    try {
      await saveUserToFirestore(updatedUser, userEmail, userName);
    } catch (err: any) {
      console.warn('Note: Stored locally; Firestore sync status:', err?.message || err);
    }

    const newAudit: AuditLogEntry = {
      AuditID: `AUD-LOG-${Date.now().toString().slice(-4)}`,
      UserEmail: userEmail,
      UserName: userName,
      Action: 'USER_UPDATED',
      EntityType: 'User',
      EntityID: updatedUser.UserID,
      Timestamp: new Date().toISOString(),
      ChangeSummary: `Admin updated user account for ${updatedUser.FullName} (${updatedUser.Email}) - Role: ${updatedUser.Role}, Active: ${updatedUser.IsActive}`,
      ReasonForChange: 'Account maintenance and role reassignment.',
    };
    persistAuditLogs([newAudit, ...auditLogs]);

    setNotification({
      type: 'success',
      message: `User account for ${updatedUser.FullName} (${updatedUser.Email}) updated to "${getRoleDefinition(updatedUser.Role).name}". Permissions active immediately across all sessions.`,
    });
  };

  const handleToggleUserStatus = (targetUser: User) => {
    const updated: User = {
      ...targetUser,
      IsActive: !targetUser.IsActive,
    };
    handleUpdateUser(updated);
    setNotification({
      type: updated.IsActive ? 'success' : 'error',
      message: updated.IsActive
        ? `Reactivated user ${updated.FullName}. System access restored.`
        : `Deactivated user ${updated.FullName}. System access immediately restricted.`,
    });
  };

  const handleUpdateDistrict = async (updatedDistrict: District) => {
    const userEmail = currentUser?.Email || 'admin@cbo.com';
    const userName = currentUser?.FullName || 'Administrator';
    persistDistricts(districts.map((d) => (d.DistrictID === updatedDistrict.DistrictID ? updatedDistrict : d)));
    if (isOnline && firebaseUser) {
      try {
        await saveDistrictToFirestore(updatedDistrict, userEmail, userName);
      } catch (err) {
        console.error('Error updating district in Firestore:', err);
      }
    }
  };

  // Reset default sample data
  const handleResetData = () => {
    localStorage.clear();
    setReports(INITIAL_REPORTS);
    setUsers(INITIAL_USERS);
    setDistricts(INITIAL_DISTRICTS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setOfflineQueue([]);
    saveStoredReports(INITIAL_REPORTS);
    saveStoredUsers(INITIAL_USERS);
    saveStoredDistricts(INITIAL_DISTRICTS);
    saveStoredAuditLogs(INITIAL_AUDIT_LOGS);
    clearOfflineQueue();
  };

  // User Access Whitelist & Active Status Validation
  const authEmail = (currentUser?.Email || firebaseUser?.email || '').toLowerCase().trim();

  // Compute activeUser dynamically from live users list or current session
  const activeUser: User = (() => {
    if (sessionPersonaUser) {
      const found = users.find(u => u.UserID === sessionPersonaUser.UserID || (u.Email && u.Email.toLowerCase().trim() === sessionPersonaUser.Email?.toLowerCase().trim()));
      return found || sessionPersonaUser;
    }

    const currentId = currentUser?.UserID;
    const currentMail = authEmail;

    const liveMatch = users.find(u =>
      (currentId && u.UserID === currentId) ||
      (currentMail && u.Email && u.Email.toLowerCase().trim() === currentMail)
    );

    if (liveMatch) {
      return liveMatch;
    }

    if (currentUser) {
      return currentUser;
    }

    // Default fallback if initial sign-in
    return {
      UserID: `USR-${firebaseUser?.uid.slice(0, 8) || 'STAFF'}`,
      Email: currentMail || 'staff@coopbank.com',
      FullName: firebaseUser?.displayName || 'Bank Staff',
      Role: 'DISTRICT_HR',
      DistrictID: 'DIST-01',
      Position: 'District HR Officer',
      IsActive: true,
      CreatedAt: new Date().toISOString(),
    };
  })();

  const isAuthorizedAdmin = Boolean(
    activeUser.Role === 'ADMIN' ||
    sessionAdminUser?.Role === 'ADMIN' ||
    currentUser?.Role === 'ADMIN' ||
    ['naolcbo@gmail.com', 'bighabes@gmail.com', 'milkinaol31@gmail.com', 'admin@coopbank.com'].includes(authEmail)
  );

  const isRegisteredUser = Boolean(
    currentUser ||
    (firebaseUser && users.some(u => u.Email.toLowerCase().trim() === firebaseUser.email?.toLowerCase().trim())) ||
    sessionAdminUser
  );

  const isUserActive = Boolean(activeUser.IsActive !== false);

  const isAccessAllowed = isRegisteredUser && isUserActive;

  // Automatic Tab Redirection on Role / Permission Change:
  // If the user's role is updated such that their current tab is not allowed,
  // gracefully redirect them to their role's authorized default tab.
  useEffect(() => {
    if (!currentUser && !firebaseUser) return;
    if (!activeUser) return;
    const allowed = getAllowedTabsForRole(activeUser.Role);
    if (!allowed.includes(activeTab)) {
      const def = getRoleDefinition(activeUser.Role);
      setActiveTab(def.defaultTab || 'dashboard');
      setNotification({
        type: 'info',
        message: `Your account role is updated to "${def.name}". Navigation refreshed to your authorized workspace.`,
      });
    }
  }, [activeUser.Role, activeTab, currentUser, firebaseUser]);

  // Mandatory password change check: prompt user who signed in with admin-generated login (e.g. Coopbank@2026 or MustChangePassword flag)
  const isPasswordChangeRequired = Boolean(
    currentUser &&
    (currentUser.MustChangePassword === true ||
     currentUser.Password === 'CoopBank@2026' ||
     currentUser.Password?.toLowerCase() === 'coopbank@2026' ||
     (currentUser.TemporaryPassword && currentUser.TemporaryPassword.length > 0))
  );

  const currentDistrict = districts.find(d => d.DistrictID === activeUser.DistrictID);
  const pendingReviewsCount = reports.filter(r => r.ReportStatus === 'Submitted' || r.ReportStatus === 'Under Review').length;
  const userDistrictCorrectionsCount = reports.filter(r => r.DistrictID === activeUser.DistrictID && r.ReportStatus === 'Correction Requested').length;

  // Gate: When user is not authenticated via email/password or Google, require login first!
  // Placed strictly AFTER all React Hook declarations to guarantee zero Rules-of-Hooks violations
  if (!currentUser && !firebaseUser) {
    return (
      <LoginScreen
        allUsers={users}
        onLoginSuccess={handleLoginSuccess}
        onGoogleSignIn={signInWithGoogle}
        onSendPasswordReset={sendPasswordReset}
        onUpdateUserActivation={handleUpdateUserActivation}
        authLoading={authLoading}
        systemName={systemConfig.bankName}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Global Header */}
      <Header
        currentUser={activeUser}
        allUsers={users}
        districts={districts}
        onSwitchUser={handleSwitchUser}
        systemName={systemConfig.bankName}
        onOpenOfflineCenter={() => setActiveTab('offline-sync')}
        unsyncedCount={offlineQueue.length}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        canSwitchUser={Boolean(isAuthorizedAdmin && activeUser.Role === 'ADMIN' && !sessionPersonaUser)}
        isProxyActive={Boolean(sessionPersonaUser && isAuthorizedAdmin)}
        onExitProxy={handleExitProxy}
        onSignOut={handleSignOut}
        onOpenSecuritySettings={() => setIsSecurityModalOpen(true)}
      />

      {/* Global Navigation Bar (Only rendered when user is registered and active) */}
      {isAccessAllowed && (
        <Navigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setEditingReport(null);
            setForcedDistrictFilter(undefined);
            setActiveTab(tab);
          }}
          userRole={activeUser.Role}
          isAuthorizedAdmin={isAuthorizedAdmin}
          pendingReviewsCount={pendingReviewsCount}
          correctionsCount={userDistrictCorrectionsCount}
          offlineQueueCount={offlineQueue.length}
          isOnline={isOnline}
          onOpenSecuritySettings={() => setIsSecurityModalOpen(true)}
          isBiometricActive={
            activeUser.BiometricEnabled !== undefined
              ? activeUser.BiometricEnabled
              : getUserBiometricPreference(activeUser.Email, activeUser.Role === 'ADMIN' || activeUser.Role === 'HO_MANAGER')
          }
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Cloud Database Notification Banner */}
        {notification && (
          <div
            className={`p-3.5 rounded-xl mb-5 border flex items-center justify-between text-xs shadow-sm transition animate-fadeIn ${
              notification.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
                : notification.type === 'error'
                ? 'bg-red-950/80 border-red-800 text-red-200'
                : 'bg-blue-950/80 border-blue-800 text-blue-200'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
              {notification.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />}
              {notification.type === 'info' && <Database className="w-4 h-4 text-blue-400 shrink-0" />}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Database / Authentication Notice Banner if any */}
        {dbError && (
          <div className="p-3.5 rounded-xl mb-5 border bg-amber-950/80 border-amber-800 text-amber-200 flex items-start justify-between text-xs shadow-sm">
            <div className="flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">
                  {dbError.includes('unauthorized-domain') || dbError.includes('Authorized Domains') || dbError.includes('authorized for Google Sign-In')
                    ? 'Firebase Authentication Domain Setup Required:'
                    : 'Cloud Service Notice:'}
                </span>
                <span className="leading-relaxed text-slate-200">{dbError}</span>
              </div>
            </div>
            <button
              onClick={clearDbError}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition shrink-0 ml-2"
              title="Dismiss notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Database Initialization / Seeding status */}
        {(isSeeding || isDbLoading) && (
          <div className="p-3 rounded-xl mb-5 border bg-indigo-950/60 border-indigo-800 text-indigo-200 flex items-center space-x-2.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin shrink-0" />
            <span>Synchronizing master collections with Cloud Firestore ({systemConfig.bankName} 13 Districts)...</span>
          </div>
        )}

        {/* Google Authentication Connect Prompt Banner if not logged in */}
        {!firebaseUser && (
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border border-blue-800/60 rounded-xl p-4 mb-6 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200">
            <div className="flex items-start sm:items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Database className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-slate-100 text-sm">
                  Persistent Cloud Firestore & Firebase Auth Configured
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Live database persistence is active on <strong>europe-west2</strong> for all 13 bank districts. Sign in with your Google Account to synchronize filings live with Cloud Firestore.
                </p>
              </div>
            </div>
            <button
              onClick={signInWithGoogle}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-md flex items-center gap-2 transition shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          </div>
        )}

        {/* Whitelist Authorization Enforcement: Unregistered Google Account Screen */}
        {(!isRegisteredUser && (isDbLoading || isSeeding)) ? (
          <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-lg animate-fadeIn">
            <RefreshCw className="w-10 h-10 text-purple-600 dark:text-purple-400 animate-spin mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Verifying Bank Credentials...</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synchronizing with Cloud Firestore master user directory for <strong>{authEmail}</strong>. Please wait a moment...
            </p>
          </div>
        ) : !isRegisteredUser ? (
          <AccessDeniedScreen
            type="unregistered"
            email={firebaseUser?.email || ''}
            onSignOut={handleSignOut}
            onRefresh={async () => {
              if (firebaseUser?.email) {
                const fetched = await fetchUserByEmailFromFirestore(firebaseUser.email);
                if (fetched) {
                  setUsers(prev => [fetched, ...prev.filter(u => u.Email.toLowerCase().trim() !== fetched.Email.toLowerCase().trim())]);
                  setCurrentUser(fetched);
                  saveStoredAuthSession(fetched);
                }
              }
              await refreshConnection();
            }}
          />
        ) : !isUserActive ? (
          /* Whitelist Authorization Enforcement: Inactive / Deactivated User Screen */
          <AccessDeniedScreen
            type="inactive"
            email={firebaseUser?.email || activeUser.Email}
            user={activeUser}
            districts={districts}
            onSignOut={handleSignOut}
            onRefresh={refreshConnection}
            isAdminSession={isAuthorizedAdmin}
            onReactivate={(u) => handleToggleUserStatus(u)}
          />
        ) : printDocumentReport ? (
          /* Official Printable Document View */
          <OfficialPrintDocument
            report={printDocumentReport}
            district={districts.find(d => d.DistrictID === printDocumentReport.DistrictID)}
            onBack={() => setPrintDocumentReport(null)}
          />
        ) : (
          <>
            {/* Tab: Dashboard */}
            {activeTab === 'dashboard' && (
              <DynamicDashboard
                currentUser={activeUser}
                currentDistrict={currentDistrict}
                districts={districts}
                reports={reports}
                allUsers={users}
                onSelectReport={(r) => setDetailModalReport(r)}
                onOpenNewReport={() => {
                  setEditingReport(null);
                  setActiveTab('submit');
                }}
                onEditReport={(r) => {
                  setEditingReport(r);
                  setActiveTab('submit');
                }}
                onFilterByDistrict={(dId) => {
                  setForcedDistrictFilter(dId);
                  setActiveTab('all-reports');
                }}
                onExportCSV={() =>
                  exportReportsToCSV(
                    reports.filter((r) => r.ReportStatus !== 'Draft'),
                    districts,
                    'National_Disciplinary_Reports_All13'
                  )
                }
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* Tab: Submit New Report (or Edit) */}
            {activeTab === 'submit' && (
              !canPerformAction(activeUser.Role, 'create', 'reports') ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 p-8 text-center max-w-md mx-auto space-y-3 shadow-sm">
                  <Shield className="w-12 h-12 text-red-500 mx-auto" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Restricted Operation</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Initiating and filing official disciplinary incident reports is restricted for role "{getRoleDefinition(activeUser.Role).name}".
                  </p>
                </div>
              ) : (
                <ReportForm
                  currentUser={activeUser}
                  districts={districts}
                  editingReport={editingReport}
                  onSubmit={handleSubmitReport}
                  onCancel={() => {
                    setEditingReport(null);
                    setActiveTab('dashboard');
                  }}
                />
              )
            )}

            {/* Tab: My District Reports */}
            {activeTab === 'my-reports' && (
              <ReportList
                currentUser={activeUser}
                reports={reports}
                districts={districts}
                onSelectReport={(r) => setDetailModalReport(r)}
                onEditReport={(r) => {
                  setEditingReport(r);
                  setActiveTab('submit');
                }}
                onPrintReport={(r) => setPrintDocumentReport(r)}
                title={
                  activeUser.Role === 'EMPLOYEE'
                    ? 'My Personnel Disciplinary Records & PIPs'
                    : getRoleDefinition(activeUser.Role).isDistrictBound
                    ? `${currentDistrict?.DistrictName || 'My District'} Reports`
                    : 'District Disciplinary Submissions'
                }
                forcedDistrictId={
                  getRoleDefinition(activeUser.Role).isDistrictBound
                    ? activeUser.DistrictID || undefined
                    : undefined
                }
              />
            )}

            {/* Tab: All 13 Districts Reports (Requires cross-district permission) */}
            {activeTab === 'all-reports' && (
              !hasPermission(activeUser.Role, 'reports.view_all_districts') ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 p-8 text-center max-w-md mx-auto space-y-3 shadow-sm">
                  <Shield className="w-12 h-12 text-red-500 mx-auto" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Restricted Area</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Cross-district report inspection is restricted to Head Office Oversight, Compliance Auditors, and System Administrators.
                  </p>
                </div>
              ) : (
                <ReportList
                  currentUser={activeUser}
                  reports={reports}
                  districts={districts}
                  onSelectReport={(r) => setDetailModalReport(r)}
                  onEditReport={(r) => {
                    setEditingReport(r);
                    setActiveTab('submit');
                  }}
                  onPrintReport={(r) => setPrintDocumentReport(r)}
                  title="All 13 Districts Master Repository"
                  forcedDistrictId={forcedDistrictFilter}
                />
              )
            )}

            {/* Tab: Review Queue (Authorized Reviewers only) */}
            {activeTab === 'review-queue' && (
              !hasPermission(activeUser.Role, 'reports.review') ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 p-8 text-center max-w-md mx-auto space-y-3 shadow-sm">
                  <Shield className="w-12 h-12 text-red-500 mx-auto" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Restricted Area</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    The supervisory review queue is reserved for Head Office HR Reviewers and System Administrators.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                      Head Office HR Supervisory Review Queue
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Filings submitted by District Directors awaiting compliance verification or returned for district amendments.
                    </p>
                  </div>

                  <ReportList
                    currentUser={activeUser}
                    reports={reports.filter(r => r.ReportStatus === 'Submitted' || r.ReportStatus === 'Under Review' || r.ReportStatus === 'Correction Requested')}
                    districts={districts}
                    onSelectReport={(r) => setDetailModalReport(r)}
                    onEditReport={(r) => {
                      setEditingReport(r);
                      setActiveTab('submit');
                    }}
                    onPrintReport={(r) => setPrintDocumentReport(r)}
                    title="Submissions Awaiting Action"
                  />
                </div>
              )
            )}

            {/* Tab: Reports & Downloads */}
            {activeTab === 'reports-download' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Reports, Exports & Documentation Hub</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Download authorized disciplinary records into Excel-compatible CSV format, or generate official printable documents.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">Download Filtered Submissions (CSV)</span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {getRoleDefinition(activeUser.Role).isDistrictBound
                          ? `Exports all authorized filings for ${currentDistrict?.DistrictName || 'District'} formatted for Excel and HR audit analysis.`
                          : 'Exports all submissions across all 13 bank districts including employee IDs, sanction types, and review outcomes.'}
                      </p>
                      <button
                        onClick={() => {
                          const isBound = getRoleDefinition(activeUser.Role).isDistrictBound;
                          const exportSet = isBound
                            ? reports.filter(r => r.DistrictID === activeUser.DistrictID)
                            : reports.filter(r => r.ReportStatus !== 'Draft');
                          exportReportsToCSV(exportSet, districts, 'Bank_HR_Disciplinary_Export');
                        }}
                        className="mt-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-lg text-xs shadow-sm"
                      >
                        Download Submissions CSV
                      </button>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 space-y-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm">Official Bank PDF Templates</span>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Generate official COOPERATIVE BANK OF OROMIA Disciplinary Report documents with formal letterhead and signature blocks.
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        To generate an individual report PDF, locate the report in the registry table and click the print icon.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Embedded table */}
                <ReportList
                  currentUser={activeUser}
                  reports={reports}
                  districts={districts}
                  onSelectReport={(r) => setDetailModalReport(r)}
                  onEditReport={(r) => {
                    setEditingReport(r);
                    setActiveTab('submit');
                  }}
                  onPrintReport={(r) => setPrintDocumentReport(r)}
                  title="Report Archives & Registry"
                />
              </div>
            )}

            {/* Tab: User Management (Admin only) */}
            {activeTab === 'users' && (
              isAuthorizedAdmin ? (
                <AdminDashboard
                  currentUser={activeUser}
                  isAuthorizedAdmin={isAuthorizedAdmin}
                  initialTab="users"
                  users={users}
                  districts={districts}
                  onUpdateUser={handleUpdateUser}
                  onCreateUser={handleCreateUser}
                  onUpdateDistrict={handleUpdateDistrict}
                  onSendPasswordReset={sendPasswordReset}
                />
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 p-8 text-center max-w-md mx-auto space-y-3 shadow-sm">
                  <Shield className="w-12 h-12 text-red-500 mx-auto" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Restricted Area</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    User account provisioning, credential management, and role assignments are restricted strictly to authorized System Administrators.
                  </p>
                </div>
              )
            )}

            {/* Tab: District Registry */}
            {activeTab === 'districts' && (
              canAccessTab(activeUser.Role, 'districts') ? (
                <AdminDashboard
                  currentUser={activeUser}
                  initialTab="districts"
                  users={users}
                  districts={districts}
                  onUpdateUser={handleUpdateUser}
                  onCreateUser={handleCreateUser}
                  onUpdateDistrict={handleUpdateDistrict}
                  onSendPasswordReset={sendPasswordReset}
                />
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 p-8 text-center max-w-md mx-auto space-y-3 shadow-sm">
                  <Shield className="w-12 h-12 text-red-500 mx-auto" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Restricted Area</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    District configuration and metadata settings are restricted to authorized leadership.
                  </p>
                </div>
              )
            )}

            {/* Tab: System Audit Trail (Requires audit.view permission) */}
            {activeTab === 'audit-log' && (
              hasPermission(activeUser.Role, 'audit.view') ? (
                <AuditLogView logs={auditLogs} />
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 p-8 text-center max-w-md mx-auto space-y-3 shadow-sm">
                  <Shield className="w-12 h-12 text-red-500 mx-auto" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Restricted Area</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Immutable enterprise audit logs can only be audited by Head Office HR Managers, Compliance Auditors, and System Administrators.
                  </p>
                </div>
              )
            )}

            {/* Tab: Offline & Sync Center */}
            {activeTab === 'offline-sync' && (
              <OfflineSyncCenter
                queue={offlineQueue}
                reports={reports}
                districts={districts}
                onSyncAll={handleSyncAll}
                isSyncing={isSyncing}
                onResetData={handleResetData}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Offline Notification Indicator */}
      <OfflineIndicator
        unsyncedCount={offlineQueue.length}
        onSyncNow={handleSyncAll}
        isSyncing={isSyncing}
      />

      {/* Detail Modal */}
      {detailModalReport && (
        <ReportDetailModal
          report={detailModalReport}
          districts={districts}
          currentUser={activeUser}
          onClose={() => setDetailModalReport(null)}
          onPrint={() => {
            setPrintDocumentReport(detailModalReport);
            setDetailModalReport(null);
          }}
          onMarkReviewed={handleMarkReviewed}
          onRequestCorrection={handleRequestCorrection}
          onEditReport={(r) => {
            setDetailModalReport(null);
            setEditingReport(r);
            setActiveTab('submit');
          }}
        />
      )}

      {/* App Usage and Enterprise Deployment Guide Modal */}
      <AppDeploymentModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        userEmail={firebaseUser?.email || currentUser?.Email || 'admin@coopbank.com'}
      />

      {/* Mandatory Password Change Modal for Admin-Generated / Default Initial Logins */}
      {isPasswordChangeRequired && currentUser && (
        <ChangePasswordModal
          isOpen={isPasswordChangeRequired}
          user={currentUser}
          onPasswordChanged={handlePasswordChanged}
        />
      )}

      {/* User Security & Biometric Preference Modal */}
      {isSecurityModalOpen && activeUser && (
        <UserSecuritySettingsModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
          currentUser={activeUser}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {/* Floating AI Assistant Chatbot Launcher Button */}
      {!isAiAssistantOpen && (
        <button
          onClick={() => setIsAiAssistantOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full shadow-xl hover:shadow-2xl border border-blue-400/40 transition-all duration-300 transform hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          title="Open CoopBank AI Disciplinary Advisor & Assistant Chatbot"
          aria-label="Open CoopBank AI Assistant Chatbot"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-blue-500/40 border border-blue-300/40 flex items-center justify-center text-white shadow-inner">
              <Bot className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
            </span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight flex items-center gap-1 text-white">
              <span>AI Assistant</span>
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            </span>
            <span className="text-[10px] text-blue-200/90 leading-tight">HR Case Advisor</span>
          </div>
        </button>
      )}

      {/* AI Disciplinary & HR Regulations Chatbot Modal */}
      <AiAssistant
        currentUser={activeUser}
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        onPreFillDraft={(draft) => {
          setIsAiAssistantOpen(false);
          setActiveTab('submit');
        }}
      />

      {/* Global Bank Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-4 mt-auto text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>© 2026 COOPERATIVE BANK OF OROMIA • HR Governance & Disciplinary Reporting Division</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-500">
            <span>Confidential Employee Records</span>
            <span>•</span>
            <span>13 Districts Enterprise System</span>
            <span>•</span>
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-blue-400 hover:text-blue-300 underline font-medium"
            >
              How to Use & Deploy App
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('offline-sync')}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Offline Sync Center
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
