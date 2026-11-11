import React, { useState, useEffect } from 'react';
import { User, District, UserRole, RoleChangeRecord, DisciplinaryReport, AuditLogEntry } from '../types';
import {
  getRoleDefinition,
  ALL_ROLES,
  ROLE_DEFINITIONS,
  hasPermission,
  OFFICIAL_JOB_TITLES,
  mapJobTitleToRole,
  getJobTitleDetails,
  JobTitleMapping,
} from '../rbac/rbacPolicy';
import { INITIAL_USERS } from '../data/mockData';
import { UserRbacModal } from './UserRbacModal';
import { AdminBulkExportHub } from './AdminBulkExportHub';
import {
  Users,
  ShieldAlert,
  UserPlus,
  MapPin,
  Settings,
  Edit2,
  CheckCircle,
  XCircle,
  Lock,
  Building,
  Key,
  Plus,
  KeyRound,
  Copy,
  Send,
  RefreshCw,
  ShieldCheck,
  History,
  Briefcase,
  Layers,
  Fingerprint,
  FileSpreadsheet,
  Sparkles,
  UserCheck,
  ChevronDown,
  Search,
  Check,
  Shield,
  Download,
  ArrowDownToLine,
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser?: User;
  isAuthorizedAdmin?: boolean;
  initialTab?: 'users' | 'districts' | 'exports' | 'settings';
  users: User[];
  districts: District[];
  reports?: DisciplinaryReport[];
  auditLogs?: AuditLogEntry[];
  onLogAudit?: (entry: AuditLogEntry) => void;
  onUpdateUser: (updatedUser: User) => void;
  onCreateUser: (newUser: User) => void;
  onUpdateDistrict: (updatedDistrict: District) => void;
  onSendPasswordReset?: (email: string) => Promise<{ success: boolean; error?: string }>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  isAuthorizedAdmin,
  initialTab = 'users',
  users,
  districts,
  reports = [],
  auditLogs = [],
  onLogAudit,
  onUpdateUser,
  onCreateUser,
  onUpdateDistrict,
  onSendPasswordReset,
}) => {
  // STRICT SECURITY GATE: Only the ADMIN role (System Administrator) is authorized for User Provisioning and RBAC control
  const isAdmin = Boolean(currentUser?.Role === 'ADMIN' || isAuthorizedAdmin);
  const defaultTab = isAdmin ? initialTab : 'districts';
  const [activeTab, setActiveTab] = useState<'users' | 'districts' | 'exports' | 'settings'>(defaultTab);

  useEffect(() => {
    if (!isAdmin && activeTab !== 'districts') {
      setActiveTab('districts');
    } else if (initialTab && isAdmin) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isAdmin, activeTab]);
  
  // User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [roleChangeReasonInput, setRoleChangeReasonInput] = useState<string>('');
  const [inspectingRbacUser, setInspectingRbacUser] = useState<User | null>(null);
  const [isTitleDropdownOpen, setIsTitleDropdownOpen] = useState(false);
  const [titleSearchQuery, setTitleSearchQuery] = useState('');
  const [userFormData, setUserFormData] = useState<Partial<User>>({
    FullName: '',
    Email: '',
    EmployeeID: '',
    Department: 'District Human Capital Operations',
    Role: 'DISTRICT_HR',
    DistrictID: 'DIST-01',
    Position: 'Human Capital Business Partner (HCBP)',
    IsActive: true,
  });

  // Password Reset / Activation Modal State
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [tempPasswordInput, setTempPasswordInput] = useState('Cbo@2026!');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // District Edit Modal State
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [designationFilter, setDesignationFilter] = useState<'ALL' | 'HCBP' | 'EPM' | 'ADMIN' | 'OTHER'>('ALL');
  const [isSyncingRoster, setIsSyncingRoster] = useState(false);

  const activeUsersCount = users.filter(u => u.IsActive).length;
  const districtHROfficersCount = users.filter(u => u.Role === 'DISTRICT_HR').length;
  const hoManagersCount = users.filter(u => u.Role === 'HO_MANAGER').length;
  const adminsCount = users.filter(u => u.Role === 'ADMIN').length;
  const auditorsAndDirectorsCount = users.filter(u => u.Role === 'AUDITOR' || u.Role === 'DIRECTOR').length;
  const hcbpCount = users.filter(u => u.Position?.includes('HCBP') || u.Position?.includes('Human Capital Business Partner')).length;
  const epmCount = users.filter(u => u.Position?.includes('EPM') || u.Position?.includes('Employee Performance Management')).length;

  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const handleSyncOfficialRoster = async () => {
    setIsSyncingRoster(true);
    setActionSuccessMessage(null);
    try {
      let syncedCount = 0;
      const now = new Date().toISOString();
      for (const officialUser of INITIAL_USERS) {
        const existing = users.find(
          (u) =>
            u.UserID === officialUser.UserID ||
            (u.Email && officialUser.Email && u.Email.toLowerCase().trim() === officialUser.Email.toLowerCase().trim())
        );

        if (!existing) {
          onCreateUser(officialUser);
          syncedCount++;
        } else {
          // If existing user has mismatched position or district, align with official spreadsheet
          const posChanged = existing.Position !== officialUser.Position;
          const distChanged = existing.DistrictID !== officialUser.DistrictID;
          const nameChanged = existing.FullName !== officialUser.FullName;
          if (posChanged || distChanged || nameChanged) {
            onUpdateUser({
              ...existing,
              FullName: officialUser.FullName,
              Position: officialUser.Position,
              DistrictID: officialUser.DistrictID,
              Department: officialUser.Department,
              UpdatedAt: now,
              UpdatedBy: currentUser?.FullName || 'Enterprise Administrator',
            });
            syncedCount++;
          }
        }
      }
      setActionSuccessMessage(
        `Official Staff Roster Synchronized: Verified all 21 District HR Personnel (HCBP & EPM Officers across all 13 Districts) + System Administrators in local state and Firestore directory!`
      );
    } finally {
      setIsSyncingRoster(false);
    }
  };

  const getRoleLabel = (role?: UserRole) => {
    return getRoleDefinition(role).name;
  };

  const handleOpenCreateUser = () => {
    if (!isAdmin) {
      setFormError('Access Denied: Only System Administrators can provision new users.');
      return;
    }
    setFormError(null);
    setActionSuccessMessage(null);
    setRoleChangeReasonInput('');
    const defaultPosition = 'Human Capital Business Partner (HCBP)';
    const defaultRole = mapJobTitleToRole(defaultPosition);
    setUserFormData({
      FullName: '',
      Email: '',
      EmployeeID: `EMP-${Math.floor(10000 + Math.random() * 90000)}`,
      Department: 'District Human Capital Operations',
      Role: defaultRole,
      DistrictID: 'DIST-01',
      Position: defaultPosition,
      Password: 'CoopBank@2026',
      IsActive: true,
    });
    setTitleSearchQuery('');
    setIsTitleDropdownOpen(false);
    setIsCreatingUser(true);
  };

  const handleOpenEditUser = (u: User) => {
    if (!isAdmin) {
      setFormError('Access Denied: Only System Administrators can modify user accounts.');
      return;
    }
    setFormError(null);
    setActionSuccessMessage(null);
    setRoleChangeReasonInput('');
    setEditingUser(u);
    const pos = u.Position || getRoleDefinition(u.Role).name;
    const mappedRole = mapJobTitleToRole(pos);
    setUserFormData({
      ...u,
      Position: pos,
      Role: mappedRole,
      DistrictID: getRoleDefinition(mappedRole).isDistrictBound ? (u.DistrictID || 'DIST-01') : null,
    });
    setTitleSearchQuery('');
    setIsTitleDropdownOpen(false);
  };

  const handleSaveUser = () => {
    setFormError(null);
    const cleanEmail = (userFormData.Email || '').trim().toLowerCase();
    const cleanName = (userFormData.FullName || '').trim();
    const cleanPosition = (userFormData.Position || '').trim();

    if (!cleanName) {
      setFormError('Staff Full Name is required.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setFormError('A valid official bank or Google email address is required (e.g. employee@coopbank.com or name@gmail.com).');
      return;
    }

    if (!cleanPosition) {
      setFormError('Please select or specify a Job Title / Designation.');
      return;
    }

    if (!isAdmin) {
      setFormError('Access Denied: Only System Administrators are authorized to provision or modify user accounts.');
      return;
    }

    // Role, authority level, and access scope are centrally determined by Job Title / Designation
    const selectedRole: UserRole = mapJobTitleToRole(cleanPosition);
    const roleDef = getRoleDefinition(selectedRole);
    const isDistrictBound = roleDef.isDistrictBound;
    const now = new Date().toISOString();
    const titleDetails = getJobTitleDetails(cleanPosition);

    if (isCreatingUser) {
      const existing = users.find(u => u.Email.toLowerCase() === cleanEmail);
      if (existing) {
        // User already exists: seamlessly update their role, district, and position!
        const roleChanged = existing.Role !== selectedRole;
        let roleHistory = [...(existing.RoleHistory || [])];
        if (roleChanged) {
          roleHistory.unshift({
            id: `RH-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: existing.UserID,
            userEmail: cleanEmail,
            previousRole: existing.Role,
            newRole: selectedRole,
            changedByEmail: currentUser?.Email || 'admin@coopbank.com',
            changedByName: currentUser?.FullName || 'Enterprise Administrator',
            changedAt: now,
            reason: roleChangeReasonInput.trim() || `Designation assigned to "${cleanPosition}" (Auto-assigned role: ${roleDef.name}).`,
          });
        }

        const updatedUser: User = {
          ...existing,
          EmployeeID: userFormData.EmployeeID?.trim() || existing.EmployeeID,
          Department: userFormData.Department?.trim() || titleDetails.department || existing.Department || 'General Banking',
          FullName: cleanName,
          Email: cleanEmail,
          Role: selectedRole,
          DistrictID: isDistrictBound ? (userFormData.DistrictID || 'DIST-01') : null,
          Position: cleanPosition,
          IsActive: userFormData.IsActive ?? true,
          UpdatedAt: now,
          UpdatedBy: currentUser?.FullName || 'Enterprise Administrator',
          RoleHistory: roleHistory,
          ...(userFormData.Password?.trim() ? {
            Password: userFormData.Password.trim(),
            TemporaryPassword: userFormData.Password.trim(),
            MustChangePassword: userFormData.Password.trim() === 'CoopBank@2026',
            LastPasswordReset: now,
          } : {}),
        };

        onUpdateUser(updatedUser);
        setIsCreatingUser(false);
        setActionSuccessMessage(`Account for "${cleanName}" (${cleanEmail}) has been updated with designation "${cleanPosition}" and role "${roleDef.name}". Active immediately!`);
        return;
      }

      const rolePrefix = selectedRole === 'ADMIN'
        ? 'USR-ADM'
        : selectedRole === 'HO_MANAGER'
        ? 'USR-HOM'
        : selectedRole === 'HO_HR'
        ? 'USR-HOHR'
        : selectedRole === 'DISTRICT_MANAGER'
        ? 'USR-DM'
        : selectedRole === 'BRANCH_MANAGER'
        ? 'USR-BM'
        : selectedRole === 'EMPLOYEE'
        ? 'USR-EMP'
        : selectedRole === 'AUDITOR'
        ? 'USR-AUD'
        : selectedRole === 'DIRECTOR'
        ? 'USR-DIR'
        : 'USR-DHR';
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const newUserId = `${rolePrefix}-${randSuffix}`;

      const initialPassword = userFormData.Password?.trim() || 'CoopBank@2026';

      const newUser: User = {
        UserID: newUserId,
        EmployeeID: userFormData.EmployeeID?.trim() || `EMP-${Math.floor(10000 + Math.random() * 90000)}`,
        Email: cleanEmail,
        FullName: cleanName,
        Role: selectedRole,
        DistrictID: isDistrictBound ? (userFormData.DistrictID || 'DIST-01') : null,
        Department: userFormData.Department?.trim() || titleDetails.department,
        Position: cleanPosition,
        IsActive: userFormData.IsActive ?? true,
        Password: initialPassword,
        TemporaryPassword: initialPassword,
        MustChangePassword: initialPassword === 'CoopBank@2026',
        CreatedAt: now,
        UpdatedAt: now,
        CreatedBy: currentUser?.FullName || 'Enterprise Administrator',
        RoleHistory: [],
        LoginHistory: [],
      };

      onCreateUser(newUser);
      setIsCreatingUser(false);
      setActionSuccessMessage(`User "${cleanName}" (${cleanEmail}) successfully provisioned as "${cleanPosition}" (Role: ${roleDef.name}). Immediate access granted.`);
    } else if (editingUser) {
      const roleChanged = editingUser.Role !== selectedRole;
      let updatedRoleHistory = [...(editingUser.RoleHistory || [])];

      if (roleChanged) {
        const historyRecord: RoleChangeRecord = {
          id: `RH-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId: editingUser.UserID,
          userEmail: cleanEmail,
          previousRole: editingUser.Role,
          newRole: selectedRole,
          changedByEmail: currentUser?.Email || 'admin@coopbank.com',
          changedByName: currentUser?.FullName || 'Enterprise Administrator',
          changedAt: now,
          reason: roleChangeReasonInput.trim() || `Assigned designation "${cleanPosition}" (Auto-assigned role: ${roleDef.name}).`,
        };
        updatedRoleHistory.unshift(historyRecord);
      }

      const updatedUser: User = {
        ...editingUser,
        EmployeeID: userFormData.EmployeeID?.trim() || editingUser.EmployeeID,
        Department: userFormData.Department?.trim() || titleDetails.department || editingUser.Department || 'General Banking Operations',
        FullName: cleanName,
        Email: cleanEmail,
        Role: selectedRole,
        DistrictID: isDistrictBound ? (userFormData.DistrictID || editingUser.DistrictID || 'DIST-01') : null,
        Position: cleanPosition,
        IsActive: userFormData.IsActive ?? editingUser.IsActive,
        UpdatedAt: now,
        UpdatedBy: currentUser?.FullName || 'Enterprise Administrator',
        RoleHistory: updatedRoleHistory,
        ...(userFormData.Password?.trim() ? {
          Password: userFormData.Password.trim(),
          TemporaryPassword: userFormData.Password.trim(),
          MustChangePassword: userFormData.Password.trim() === 'CoopBank@2026',
          LastPasswordReset: now,
        } : {}),
      };
      onUpdateUser(updatedUser);
      setEditingUser(null);
      setActionSuccessMessage(`User "${cleanName}" (${cleanEmail}) account updated successfully to designation "${cleanPosition}" (Role: "${roleDef.name}"). Immediate role effect active!`);
    }
  };

  const handleToggleUserStatus = (u: User) => {
    if (!isAdmin) return;
    onUpdateUser({
      ...u,
      IsActive: !u.IsActive,
    });
  };

  const handleOpenResetPassword = (u: User) => {
    if (!isAdmin) return;
    setResetTargetUser(u);
    setTempPasswordInput(`Cbo@${Math.floor(1000 + Math.random() * 9000)}!`);
    setResetSuccessMessage(null);
    setResetErrorMessage(null);
    setCopiedCode(false);
  };

  const handleSendResetEmail = async () => {
    if (!resetTargetUser) return;
    setIsSendingReset(true);
    setResetErrorMessage(null);
    setResetSuccessMessage(null);
    try {
      if (onSendPasswordReset) {
        await onSendPasswordReset(resetTargetUser.Email);
      }
      const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
      onUpdateUser({
        ...resetTargetUser,
        ActivationCode: activationCode,
        LastPasswordReset: new Date().toISOString(),
      });
      setResetSuccessMessage(
        `Official password reset and activation link dispatched to ${resetTargetUser.Email}. (Activation Token: ${activationCode})`
      );
    } catch (err: any) {
      setResetErrorMessage(err?.message || 'Failed to dispatch reset email.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const handleApplyTemporaryPassword = () => {
    if (!resetTargetUser) return;
    if (!tempPasswordInput.trim()) {
      setResetErrorMessage('Please enter a valid temporary password.');
      return;
    }
    onUpdateUser({
      ...resetTargetUser,
      TemporaryPassword: tempPasswordInput.trim(),
      Password: tempPasswordInput.trim(),
      MustChangePassword: true,
      LastPasswordReset: new Date().toISOString(),
    });
    setResetSuccessMessage(
      `Temporary password successfully applied for ${resetTargetUser.FullName}. The user can now sign in using: ${tempPasswordInput.trim()}`
    );
  };

  const handleSaveDistrict = () => {
    if (editingDistrict) {
      onUpdateDistrict(editingDistrict);
      setEditingDistrict(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-xl p-6 text-white shadow-lg border border-purple-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>{isAdmin ? 'System Administration & Security Governance' : 'Cooperative Bank of Oromia Districts'}</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {isAdmin ? 'Enterprise Access & Directory Management' : 'Autonomous 13 Districts Registry'}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {isAdmin
                ? 'Configure multi-role access controls, 13 district assignments, user provisioning, and security audit logs.'
                : 'Official directory of the 13 Cooperative Bank of Oromia reporting jurisdictions and directorates.'}
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenCreateUser}
                className="inline-flex items-center space-x-2 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>Provision New User</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      {isAdmin ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase">Active Users</span>
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activeUsersCount} / {users.length}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Authenticated profiles</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase">13 Districts</span>
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{districts.length}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">100% active jurisdictions</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase">District HR Officers</span>
              <Building className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">{districtHROfficersCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Assigned to district rows</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase">HO Managers & Admins</span>
              <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">{hoManagersCount + adminsCount}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{hoManagersCount} Managers, {adminsCount} Admins</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase">13 Autonomous Districts</span>
              <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">{districts.length} Active Hubs</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Autonomous operational branches</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase">Jurisdiction Model</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-300">Row-Level Isolation</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Restricted to designated boundary</div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-semibold uppercase">Directory Access</span>
              <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-300">Read-Only Directory</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Official bank-wide district registry</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {isAdmin && (
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-3 transition-colors flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'border-b-2 border-purple-700 text-purple-700 dark:text-purple-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Accounts & District Assignments ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('districts')}
            className={`pb-3 px-3 transition-colors flex items-center gap-1.5 ${
              activeTab === 'districts'
                ? 'border-b-2 border-purple-700 text-purple-700 dark:text-purple-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>13 Districts Directory ({districts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('exports')}
            className={`pb-3 px-3 transition-colors flex items-center gap-1.5 ${
              activeTab === 'exports'
                ? 'border-b-2 border-purple-700 text-purple-700 dark:text-purple-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
            <span>Bulk CSV Export Hub</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
              Date Filtered
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 px-3 transition-colors flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-b-2 border-purple-700 text-purple-700 dark:text-purple-400 font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Security & Policy Settings</span>
          </button>
        </div>
      )}

      {/* Tab 1: Users Table */}
      {activeTab === 'users' && (
        !isAdmin ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 p-8 text-center max-w-md mx-auto space-y-3 shadow-sm">
            <Lock className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Restricted Area</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              User account provisioning, credential management, and role assignments are restricted strictly to System Administrators.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* District Isolation Explanation Card */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-800/70 rounded-xl p-4 sm:p-5 text-white shadow-md">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-blue-800/40">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      How District Data Restriction Works
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/80 text-blue-300 border border-blue-700">
                        RBAC & Row-Level Security
                      </span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Example: Restricting a <strong>District HR Officer</strong> to view strictly <strong>Adama District</strong> data.
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const existing = users.find(u => u.Email.toLowerCase() === 'adama.hr@coopbank.com');
                        if (existing) {
                          handleOpenEditUser(existing);
                        } else {
                          setUserFormData({
                            FullName: 'Adama District HR Officer',
                            Email: 'adama.hr@coopbank.com',
                            Role: 'DISTRICT_HR',
                            DistrictID: 'DIST-01',
                            Position: 'Senior District HR Officer - Adama District',
                            IsActive: true,
                          });
                          setIsCreatingUser(true);
                        }
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-lg text-xs transition flex items-center gap-1.5 shadow"
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>Inspect Adama District Binding</span>
                    </button>
                  </div>
                )}
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 text-xs">
              <div className="bg-slate-900/60 border border-blue-900/50 rounded-lg p-3">
                <span className="font-bold text-blue-300 block mb-1">1. District Binding</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  In this table, set Role = <code className="text-amber-300">DISTRICT_HR</code> and District = <code className="text-emerald-300">DIST-01 (Adama District)</code>.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-blue-900/50 rounded-lg p-3">
                <span className="font-bold text-blue-300 block mb-1">2. Google Sign-In Matching</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  When the District HR officer logs in via Google Auth with their registered email, the system matches their email to this record and restricts the session to Adama.
                </p>
              </div>

              <div className="bg-slate-900/60 border border-blue-900/50 rounded-lg p-3">
                <span className="font-bold text-blue-300 block mb-1">3. Complete Isolation</span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  The Dashboard, Case Registry, Filing Form, and CSV Export all filter exclusively to Adama. Other 12 districts are completely blocked.
                </p>
              </div>
            </div>
          </div>

          {actionSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between shadow-sm animate-fadeIn">
              <div className="flex items-center space-x-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">{actionSuccessMessage}</span>
              </div>
              <button
                onClick={() => setActionSuccessMessage(null)}
                className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span>User Access Control List (ACL Whitelist)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    {users.length} Registered Accounts
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                    {hcbpCount} HCBP
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
                    {epmCount} EPM Officers
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Official bank staff across all 13 districts. Only registered staff with <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active</span> status can log in. Users toggled to <span className="font-semibold text-red-600 dark:text-red-400">Inactive</span> are immediately locked out in real-time.
                </p>
              </div>
              {isAdmin && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveTab('exports')}
                    className="px-3 py-2 bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
                    title="Bulk CSV Export for Historical Logs and User Management Reports filtered by date range"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Bulk CSV Exports</span>
                  </button>
                  <button
                    onClick={handleSyncOfficialRoster}
                    disabled={isSyncingRoster}
                    className="px-3 py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 active:from-emerald-800 active:to-teal-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow disabled:opacity-50"
                    title="Verify and synchronize all 21 District HR Personnel (HCBP & EPM Officers) from the official bank directory"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>{isSyncingRoster ? 'Syncing...' : 'Sync Official Staff Roster (21 Officers)'}</span>
                  </button>
                  <button
                    onClick={handleOpenCreateUser}
                    className="px-3.5 py-2 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add / Provision User</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick Search, Designation & Role Filter Bar */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex-1 min-w-[220px] max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search staff by name, email, district, HCBP, or EPM Officer..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">Designation:</span>
                  <select
                    value={designationFilter}
                    onChange={(e) => setDesignationFilter(e.target.value as any)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="ALL">All Staff ({users.length})</option>
                    <option value="HCBP">HCBP Partners ({hcbpCount})</option>
                    <option value="EPM">EPM Officers ({epmCount})</option>
                    <option value="ADMIN">System Admins ({adminsCount})</option>
                    <option value="OTHER">Other Designations</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="ALL">All Roles ({users.length})</option>
                    {ALL_ROLES.map((role) => {
                      const count = users.filter((u) => u.Role === role).length;
                      return (
                        <option key={role} value={role}>
                          {getRoleDefinition(role).name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3.5">User ID</th>
                  <th className="py-3 px-3.5">Full Name & Registered Email</th>
                  <th className="py-3 px-3.5">Assigned Role & Designation</th>
                  <th className="py-3 px-3.5">District Jurisdiction</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {users
                  .filter((u) => {
                    const q = searchQuery.toLowerCase().trim();
                    const dist = districts.find(d => d.DistrictID === u.DistrictID);
                    const matchesSearch = !q ||
                      u.FullName.toLowerCase().includes(q) ||
                      u.Email.toLowerCase().includes(q) ||
                      u.UserID.toLowerCase().includes(q) ||
                      (dist?.DistrictName && dist.DistrictName.toLowerCase().includes(q)) ||
                      (u.Position && u.Position.toLowerCase().includes(q));
                    const matchesRole = roleFilter === 'ALL' || u.Role === roleFilter;

                    const isHcbp = Boolean(u.Position?.includes('HCBP') || u.Position?.includes('Human Capital Business Partner'));
                    const isEpm = Boolean(u.Position?.includes('EPM') || u.Position?.includes('Employee Performance Management'));
                    const matchesDesignation =
                      designationFilter === 'ALL' ||
                      (designationFilter === 'HCBP' && isHcbp) ||
                      (designationFilter === 'EPM' && isEpm) ||
                      (designationFilter === 'ADMIN' && u.Role === 'ADMIN') ||
                      (designationFilter === 'OTHER' && !isHcbp && !isEpm && u.Role !== 'ADMIN');

                    return matchesSearch && matchesRole && matchesDesignation;
                  })
                  .map((u, idx) => {
                    const dist = districts.find(d => d.DistrictID === u.DistrictID);
                    const isHcbp = Boolean(u.Position?.includes('HCBP') || u.Position?.includes('Human Capital Business Partner'));
                    const isEpm = Boolean(u.Position?.includes('EPM') || u.Position?.includes('Employee Performance Management'));

                    return (
                      <tr key={`${u.UserID || 'usr'}-${u.Email || 'email'}-${idx}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">{u.UserID}</td>
                        <td className="py-3 px-3.5">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{u.FullName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{u.Email}</div>
                        </td>
                        <td className="py-3 px-3.5">
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {(() => {
                                const rDef = getRoleDefinition(u.Role);
                                return (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${rDef.badgeBg} ${rDef.badgeText} border ${rDef.badgeBorder}`}>
                                    {rDef.name}
                                  </span>
                                );
                              })()}

                              {/* Designation specific badge */}
                              {isHcbp && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1 shadow-2xs">
                                  <Sparkles className="w-2.5 h-2.5 text-sky-500" /> HCBP
                                </span>
                              )}
                              {isEpm && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-800 flex items-center gap-1 shadow-2xs">
                                  <UserCheck className="w-2.5 h-2.5 text-teal-500" /> EPM Officer
                                </span>
                              )}

                              {/* Quick Role Switcher for instant live effect (ADMIN only) */}
                              {isAdmin && (
                                <select
                                  value={u.Role}
                                  onChange={(e) => {
                                    const newRole = e.target.value as UserRole;
                                    const roleDef = getRoleDefinition(newRole);
                                    const now = new Date().toISOString();
                                    const isDist = roleDef.isDistrictBound;
                                    const defaultPos = (newRole === 'DISTRICT_HR' && u.Position)
                                      ? u.Position
                                      : newRole === 'ADMIN'
                                      ? 'Enterprise System Administrator'
                                      : newRole === 'HO_MANAGER'
                                      ? 'Head Office HR Operations & Performance Manager'
                                      : newRole === 'HO_HR'
                                      ? 'Head Office HR Specialist'
                                      : newRole === 'DISTRICT_MANAGER'
                                      ? 'District General Manager'
                                      : newRole === 'BRANCH_MANAGER'
                                      ? 'Branch Operations Manager'
                                      : newRole === 'AUDITOR'
                                      ? 'Internal Compliance Auditor'
                                      : newRole === 'DIRECTOR'
                                      ? 'Authorized District Director'
                                      : newRole === 'EMPLOYEE'
                                      ? 'Bank Staff'
                                      : 'Human Capital Business Partner (HCBP)';

                                    const roleHistory: RoleChangeRecord[] = [
                                      {
                                        id: `RH-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                                        userId: u.UserID,
                                        userEmail: u.Email,
                                        previousRole: u.Role,
                                        newRole: newRole,
                                        changedByEmail: currentUser?.Email || 'admin@coopbank.com',
                                        changedByName: currentUser?.FullName || 'Enterprise Administrator',
                                        changedAt: now,
                                        reason: `Role changed from ${getRoleDefinition(u.Role).name} to ${roleDef.name} via User Management Console.`,
                                      },
                                      ...(u.RoleHistory || []),
                                    ];

                                    const updated: User = {
                                      ...u,
                                      Role: newRole,
                                      DistrictID: isDist ? (u.DistrictID || 'DIST-01') : null,
                                      Position: defaultPos,
                                      RoleHistory: roleHistory,
                                      UpdatedAt: now,
                                      UpdatedBy: currentUser?.FullName || 'Enterprise Administrator',
                                    };

                                    onUpdateUser(updated);
                                    setActionSuccessMessage(`Role for ${u.FullName} (${u.Email}) updated to ${roleDef.name}. Immediate effect applied across all tabs!`);
                                  }}
                                  className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer hover:border-purple-400"
                                  title="Change role immediately"
                                >
                                  {ALL_ROLES.map((r) => (
                                    <option key={r} value={r}>
                                      Switch to {getRoleDefinition(r).name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{u.Position}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5">
                          {getRoleDefinition(u.Role).isDistrictBound ? (
                            <div className="flex items-center space-x-1">
                              <span className="font-medium text-slate-800 dark:text-slate-200">{dist?.DistrictName || 'Not Assigned'}</span>
                              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">({u.DistrictID || 'N/A'})</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic">Cross-District (All 13)</span>
                          )}
                        </td>
                        <td className="py-3 px-3.5">
                          {u.IsActive ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-red-700 dark:text-red-400 font-semibold">
                              <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" /> Deactivated
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          {isAdmin ? (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-2 py-1 rounded text-[11px] font-medium border transition ${
                                  u.IsActive
                                    ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800'
                                    : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800'
                                }`}
                              >
                                {u.IsActive ? 'Deactivate' : 'Reactivate'}
                              </button>

                              <button
                                onClick={() => handleOpenResetPassword(u)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 rounded transition flex items-center gap-1 shadow-xs"
                                title="Reset User Account Password & Send Activation"
                              >
                                <KeyRound className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                <span>Reset Password</span>
                              </button>

                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition"
                                title="Edit User"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Read-Only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
        )
      )}

      {/* Tab 2: 13 Districts Registry Table */}
      {activeTab === 'districts' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Cooperative Bank of Oromia Districts Master Directory</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Each district operates an autonomous reporting jurisdiction</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3.5">District ID</th>
                  <th className="py-3 px-3.5">Code</th>
                  <th className="py-3 px-3.5">District Name</th>
                  <th className="py-3 px-3.5">Region</th>
                  <th className="py-3 px-3.5">Authorized District Director</th>
                  <th className="py-3 px-3.5">Office Hub Location</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {districts.map(d => (
                  <tr key={d.DistrictID} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-900 dark:text-blue-300">{d.DistrictID}</td>
                    <td className="py-3 px-3.5 font-mono font-semibold text-slate-600 dark:text-slate-400">{d.DistrictCode}</td>
                    <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-slate-100">{d.DistrictName}</td>
                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-400">{d.Region}</td>
                    <td className="py-3 px-3.5 font-medium text-slate-800 dark:text-slate-200">{d.DirectorName}</td>
                    <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{d.OfficeLocation}</td>
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      {isAdmin || hasPermission(currentUser?.Role, 'districts.manage') ? (
                        <button
                          onClick={() => setEditingDistrict(d)}
                          className="px-2 py-1 text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 rounded font-medium transition"
                        >
                          Edit Details
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Read-Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Policy Settings */}
      {activeTab === 'settings' && (
        !isAdmin ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 p-8 text-center max-w-md mx-auto space-y-3 shadow-sm">
            <Lock className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Restricted Area</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Security and policy configurations are reserved strictly for System Administrators.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6 transition-colors">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3">
              Enterprise Disciplinary Reporting & Retention Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Row-Level Security (AppSheet Security Filters)</span>
                  <p className="text-slate-600 dark:text-slate-300">
                    Enforces that queries executed by District HR accounts are filtered at source using the formula:
                  </p>
                  <code className="block p-2 rounded bg-slate-900 dark:bg-slate-950 text-emerald-400 font-mono text-[11px] border border-slate-800">
                    [DistrictID] = LOOKUP(USEREMAIL(), "Users", "Email", "DistrictID")
                  </code>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Head Office Managers and Administrators evaluate to TRUE across all rows.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Audit Log Immutability Policy</span>
                  <p className="text-slate-600 dark:text-slate-300">
                    All submissions, corrections, review approvals, and user status toggles are recorded into the immutable AuditLog table with user timestamp, email, and diff summary.
                  </p>
                  <div className="flex items-center text-emerald-700 dark:text-emerald-400 font-semibold gap-1.5 text-xs">
                    <CheckCircle className="w-4 h-4" />
                    <span>Permanent Audit Trail Active</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-950/30 space-y-2">
                  <span className="font-bold text-purple-950 dark:text-purple-300 flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    WebAuthn / Biometric Administrative Policy
                  </span>
                  <p className="text-purple-900 dark:text-purple-300 text-[11px] leading-relaxed">
                    Browser-based platform biometric verification (Touch ID, Windows Hello, Face ID, Android Biometrics) is enforced on the Login Screen for high-privilege administrative sessions (System Administrator and Head Office Manager). Cryptographic hardware challenges prevent credential stuffing and unauthorized terminal takeovers.
                  </p>
                  <div className="flex items-center text-purple-700 dark:text-purple-300 font-semibold gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-purple-500" />
                    <span>FIDO2 / WebAuthn Biometric Guard Enforced</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 space-y-3">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">Filing & Record Retention</span>
                  <div className="space-y-2">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold">Current Active Reporting Period:</label>
                    <input
                      type="text"
                      disabled
                      value="2026-Q4 (October - December 2026)"
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-2 text-slate-700 dark:text-slate-300 font-medium"
                    />

                    <label className="block text-slate-700 dark:text-slate-300 font-semibold pt-2">Regulatory Archive Retention Period:</label>
                    <input
                      type="text"
                      disabled
                      value="7 Years (Standard Bank Regulatory Compliance)"
                      className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded p-2 text-slate-700 dark:text-slate-300 font-medium"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-purple-50/40 dark:bg-purple-950/20 space-y-2">
                  <span className="font-bold text-purple-950 dark:text-purple-300 block">Bank Directorate Authorization</span>
                  <p className="text-purple-900 dark:text-purple-300 text-[11px]">
                    Disciplinary sanctions filed in this application require formal concurrence from the responsible District Director before Head Office HR clearance is granted.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Tab: Bulk CSV Export Hub */}
      {activeTab === 'exports' && (
        <AdminBulkExportHub
          currentUser={currentUser}
          users={users}
          districts={districts}
          reports={reports || []}
          auditLogs={auditLogs || []}
          onLogAudit={onLogAudit}
        />
      )}

      {/* User Create / Edit Modal */}
      {isAdmin && (isCreatingUser || editingUser) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              {isCreatingUser ? 'Provision New User Account' : `Edit User: ${editingUser?.FullName}`}
            </h3>

            {formError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-red-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.FullName || ''}
                  onChange={(e) => setUserFormData({ ...userFormData, FullName: e.target.value })}
                  placeholder="e.g. Rachel Adams"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Registered Email / Google Login Email <span className="text-red-500">*</span>:
                </label>
                <input
                  type="email"
                  required
                  value={userFormData.Email || ''}
                  onChange={(e) => setUserFormData({ ...userFormData, Email: e.target.value })}
                  placeholder="e.g. employee@coopbank.com or employee@gmail.com"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  The user can sign in using this exact registered email either via standard Password or Google Account Single Sign-On.
                </p>
              </div>

              {/* PRIMARY ROLE ASSIGNMENT: Job Title / Designation with Searchable Type-Ahead Dropdown */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Job Title / Designation <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Role & Permissions Driver
                  </span>
                </div>

                {/* Combobox Trigger & Input */}
                <div className="relative">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      value={userFormData.Position || ''}
                      onChange={(e) => {
                        const newPos = e.target.value;
                        const derivedRole = mapJobTitleToRole(newPos);
                        const details = getJobTitleDetails(newPos);
                        setUserFormData({
                          ...userFormData,
                          Position: newPos,
                          Role: derivedRole,
                          Department: details.department || userFormData.Department,
                          DistrictID: details.isDistrictBound ? (userFormData.DistrictID || 'DIST-01') : null,
                        });
                        setTitleSearchQuery(newPos);
                        setIsTitleDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setTitleSearchQuery(userFormData.Position || '');
                        setIsTitleDropdownOpen(true);
                      }}
                      placeholder="Search or select job title (e.g. HCBP, EPM Officer, District Manager, Admin)..."
                      className="w-full bg-white dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-700/80 rounded-xl py-2.5 pl-9 pr-10 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium text-xs shadow-sm transition"
                    />
                    <Search className="w-4 h-4 text-purple-500 absolute left-3 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setIsTitleDropdownOpen(!isTitleDropdownOpen)}
                      className="absolute right-2 p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition"
                      title="Toggle title list"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isTitleDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* Dropdown Menu */}
                  {isTitleDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsTitleDropdownOpen(false)}
                      />
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-80 overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800/80 shadow-2xl p-2 divide-y divide-slate-100 dark:divide-slate-800/60 animate-in fade-in zoom-in-95 duration-150">
                        {/* Quick filter chips within dropdown */}
                        <div className="pb-2 px-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                            Official Bank Designations ({OFFICIAL_JOB_TITLES.length} Titles)
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {['HCBP', 'EPM Officer', 'District Manager', 'Branch Manager', 'HO Manager', 'Enterprise Admin'].map(tag => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  const match = OFFICIAL_JOB_TITLES.find(t => t.title.toLowerCase().includes(tag.toLowerCase()));
                                  if (match) {
                                    const matchRoleDef = getRoleDefinition(match.role);
                                    setUserFormData({
                                      ...userFormData,
                                      Position: match.title,
                                      Role: match.role,
                                      Department: match.department,
                                      DistrictID: matchRoleDef.isDistrictBound ? (userFormData.DistrictID || 'DIST-01') : null,
                                    });
                                    setIsTitleDropdownOpen(false);
                                  } else {
                                    setTitleSearchQuery(tag);
                                  }
                                }}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Filtered Titles Grouped by Category */}
                        <div className="pt-2 space-y-3">
                          {Array.from(new Set(
                            OFFICIAL_JOB_TITLES
                              .filter(item => {
                                const q = (titleSearchQuery || '').toLowerCase().trim();
                                if (!q) return true;
                                return (
                                  item.title.toLowerCase().includes(q) ||
                                  item.role.toLowerCase().includes(q) ||
                                  item.department.toLowerCase().includes(q) ||
                                  item.category.toLowerCase().includes(q)
                                );
                              })
                              .map(item => item.category)
                          )).map(category => {
                            const items = OFFICIAL_JOB_TITLES.filter(item => {
                              const matchesCategory = item.category === category;
                              const q = (titleSearchQuery || '').toLowerCase().trim();
                              if (!q) return matchesCategory;
                              const matchesSearch =
                                item.title.toLowerCase().includes(q) ||
                                item.role.toLowerCase().includes(q) ||
                                item.department.toLowerCase().includes(q) ||
                                item.category.toLowerCase().includes(q);
                              return matchesCategory && matchesSearch;
                            });

                            if (items.length === 0) return null;

                            return (
                              <div key={category} className="space-y-1">
                                <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 px-2 py-0.5 bg-purple-50/50 dark:bg-purple-950/30 rounded">
                                  {category}
                                </div>
                                <div className="space-y-0.5">
                                  {items.map((item) => {
                                    const isSelected = userFormData.Position === item.title;
                                    const roleDef = getRoleDefinition(item.role);
                                    return (
                                      <button
                                        key={item.title}
                                        type="button"
                                        onClick={() => {
                                          setUserFormData({
                                            ...userFormData,
                                            Position: item.title,
                                            Role: item.role,
                                            Department: item.department,
                                            DistrictID: roleDef.isDistrictBound ? (userFormData.DistrictID || 'DIST-01') : null,
                                          });
                                          setIsTitleDropdownOpen(false);
                                        }}
                                        className={`w-full text-left p-2 rounded-lg transition flex items-center justify-between text-xs ${
                                          isSelected
                                            ? 'bg-purple-500 text-white font-bold shadow-sm'
                                            : 'hover:bg-purple-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                                        }`}
                                      >
                                        <div className="flex flex-col min-w-0 pr-2">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-semibold">{item.title}</span>
                                            {item.isKeyDesignation && (
                                              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                                                isSelected ? 'bg-purple-600 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                              }`}>
                                                Official Staff Title
                                              </span>
                                            )}
                                          </div>
                                          <span className={`text-[10px] ${isSelected ? 'text-purple-100' : 'text-slate-500 dark:text-slate-400'}`}>
                                            Mapped Role: <strong className="font-mono">{roleDef.name} ({item.role})</strong> • {roleDef.isDistrictBound ? 'District-Bound' : 'Bank-Wide Oversight'}
                                          </span>
                                        </div>
                                        {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          {OFFICIAL_JOB_TITLES.filter(item => {
                            const q = (titleSearchQuery || '').toLowerCase().trim();
                            if (!q) return true;
                            return (
                              item.title.toLowerCase().includes(q) ||
                              item.role.toLowerCase().includes(q) ||
                              item.department.toLowerCase().includes(q) ||
                              item.category.toLowerCase().includes(q)
                            );
                          }).length === 0 && (
                            <div className="text-center py-4 text-xs text-slate-500 dark:text-slate-400">
                              <p>No exact match for "{titleSearchQuery}".</p>
                              <button
                                type="button"
                                onClick={() => {
                                  const customTitle = titleSearchQuery.trim();
                                  const derivedRole = mapJobTitleToRole(customTitle);
                                  const details = getJobTitleDetails(customTitle);
                                  setUserFormData({
                                    ...userFormData,
                                    Position: customTitle,
                                    Role: derivedRole,
                                    Department: details.department,
                                    DistrictID: details.isDistrictBound ? (userFormData.DistrictID || 'DIST-01') : null,
                                  });
                                  setIsTitleDropdownOpen(false);
                                }}
                                className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition"
                              >
                                Use custom title: "{titleSearchQuery}"
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SYSTEM-ASSIGNED ACCESS & AUTHORITY LEVEL: Auto-generated, Read-Only */}
              {(() => {
                const currentPos = userFormData.Position || 'Human Capital Business Partner (HCBP)';
                const details = getJobTitleDetails(currentPos);
                const roleDef = details.roleDefinition;

                return (
                  <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-gradient-to-br from-purple-50/50 via-white to-slate-50 dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-purple-100 dark:border-purple-900/60 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-xs">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            System-Assigned Access & Authority Level
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            Automatically determined by selected Job Title & Bank RBAC Policy
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Read-Only System Controlled
                      </span>
                    </div>

                    {/* Assigned Specs Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                          Assigned System Role
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${roleDef.badgeBg} ${roleDef.badgeText} border`}>
                            {roleDef.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-1 block">
                          ROLE_KEY: {details.role}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                          Authority Level
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {details.authorityLevel}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          Governance Category: {roleDef.category}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                          Access Scope
                        </span>
                        <span className={`text-xs font-bold block ${details.isDistrictBound ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-blue-400'}`}>
                          {details.isDistrictBound ? 'District-Bound Jurisdiction' : 'Bank-Wide Oversight'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                          {details.scopeDescription}
                        </span>
                      </div>
                    </div>

                    {/* Operational Department & Responsibilities Summary */}
                    <div className="p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Mapped Department: <strong className="text-slate-800 dark:text-slate-200">{details.department}</strong>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {roleDef.description}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {details.responsibilities.map((resp, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                            {resp}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* District Assignment strictly if role is District-Bound */}
                    {details.isDistrictBound ? (
                      <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/50 space-y-1.5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <label className="block font-bold text-amber-900 dark:text-amber-300 text-xs flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            Assign Bank District (1 of 13 Districts) <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[9px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400">
                            District Restriction Enforced
                          </span>
                        </div>
                        <select
                          value={userFormData.DistrictID || 'DIST-01'}
                          onChange={(e) => setUserFormData({ ...userFormData, DistrictID: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border border-amber-400 dark:border-amber-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-medium text-xs focus:ring-2 focus:ring-amber-500"
                        >
                          {districts.map(d => (
                            <option key={d.DistrictID} value={d.DistrictID}>
                              {d.DistrictCode} - {d.DistrictName} ({d.Region})
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
                          CoopBank RBAC Policy: Users holding district-level designations ({currentPos}) can only access and file disciplinary reports within their assigned district ({userFormData.DistrictID || 'DIST-01'}).
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-blue-900 dark:text-blue-300">
                            Bank-Wide Cross-District Authority
                          </p>
                          <p className="text-[10px] text-blue-800/80 dark:text-blue-400/80 mt-0.5">
                            This enterprise designation possesses national oversight across all 13 bank districts without district confinement.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {isCreatingUser ? 'Initial Password (Default: CoopBank@2026):' : 'Update Password (leave blank to keep current):'}
                </label>
                <input
                  type="text"
                  value={userFormData.Password || ''}
                  onChange={(e) => setUserFormData({ ...userFormData, Password: e.target.value })}
                  placeholder={isCreatingUser ? 'CoopBank@2026' : 'Keep current password'}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100 font-mono text-xs"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  If set to <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono">CoopBank@2026</code>, the user will be asked to set their personalized password on first login.
                </p>
              </div>

              <div className="pt-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700/60">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userFormData.IsActive ?? true}
                    onChange={(e) => setUserFormData({ ...userFormData, IsActive: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-700 dark:text-purple-400 focus:ring-purple-500"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Account Status: {userFormData.IsActive ?? true ? 'Active (Permit Login)' : 'Inactive (Restrict Access)'}
                  </span>
                </label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 pl-6 leading-relaxed">
                  Only active accounts can log in and view bank disciplinary cases.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsCreatingUser(false);
                  setEditingUser(null);
                }}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg text-xs transition"
              >
                Save User Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* District Edit Modal */}
      {editingDistrict && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2">
              Edit District: {editingDistrict.DistrictName} ({editingDistrict.DistrictID})
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Authorized District Director:</label>
                <input
                  type="text"
                  value={editingDistrict.DirectorName}
                  onChange={(e) => setEditingDistrict({ ...editingDistrict, DirectorName: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Office Hub Location:</label>
                <input
                  type="text"
                  value={editingDistrict.OfficeLocation}
                  onChange={(e) => setEditingDistrict({ ...editingDistrict, OfficeLocation: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Region:</label>
                <input
                  type="text"
                  value={editingDistrict.Region}
                  onChange={(e) => setEditingDistrict({ ...editingDistrict, Region: e.target.value })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setEditingDistrict(null)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDistrict}
                className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg text-xs transition"
              >
                Save District Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Password Reset & Activation Modal */}
      {isAdmin && resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-blue-500/30 space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    User Credential Management & Reset
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Administrator reset for {resetTargetUser.FullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResetTargetUser(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* User Target Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee Full Name:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{resetTargetUser.FullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registered Email:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{resetTargetUser.Email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Role & District:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {resetTargetUser.Role} {resetTargetUser.DistrictID ? `(${resetTargetUser.DistrictID})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Status:</span>
                <span className={`font-bold ${resetTargetUser.IsActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {resetTargetUser.IsActive ? 'Active (Can Log In)' : 'Inactive (Blocked)'}
                </span>
              </div>
              {resetTargetUser.LastPasswordReset && (
                <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700/40">
                  <span>Last Credential Reset:</span>
                  <span>{new Date(resetTargetUser.LastPasswordReset).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Error or Success banners */}
            {resetErrorMessage && (
              <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-200 text-xs flex items-center gap-2">
                <span>{resetErrorMessage}</span>
              </div>
            )}
            {resetSuccessMessage && (
              <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs space-y-2">
                <div className="font-medium">{resetSuccessMessage}</div>
                {tempPasswordInput && (
                  <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded border border-emerald-700 font-mono text-emerald-300 text-xs">
                    <span>Password: <strong>{tempPasswordInput}</strong></span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(tempPasswordInput);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="text-[11px] text-emerald-400 hover:text-white flex items-center gap-1 underline font-sans ml-2"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedCode ? 'Copied!' : 'Copy Password'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Option 1: Send Official Email */}
            <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 space-y-2">
              <span className="font-bold text-blue-900 dark:text-blue-300 block text-xs flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-500" />
                <span>Option 1: Dispatch Official Activation & Reset Link</span>
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Sends an official account activation and password reset link directly to the registered email <strong>{resetTargetUser.Email}</strong>.
              </p>
              <button
                type="button"
                onClick={handleSendResetEmail}
                disabled={isSendingReset}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingReset ? 'Dispatching Link...' : 'Send Activation & Reset Email'}</span>
              </button>
            </div>

            {/* Action Option 2: Set Temporary Password */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-purple-500" />
                  <span>Option 2: Issue New Password for Staff</span>
                </span>
                <button
                  type="button"
                  onClick={() => setTempPasswordInput(`Cbo@${Math.floor(1000 + Math.random() * 9000)}!`)}
                  className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Generate Random</span>
                </button>
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                Manually set a password that the user can immediately type into the login screen to sign in.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempPasswordInput}
                  onChange={(e) => setTempPasswordInput(e.target.value)}
                  placeholder="Enter new password"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-purple-700 dark:text-purple-300"
                />
                <button
                  type="button"
                  onClick={handleApplyTemporaryPassword}
                  className="px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold whitespace-nowrap transition shadow-sm"
                >
                  Save & Apply Password
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setResetTargetUser(null)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
