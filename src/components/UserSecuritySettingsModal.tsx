import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Shield,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  KeyRound,
  Trash2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';
import {
  checkWebAuthnSupport,
  registerBiometricCredential,
  getStoredBiometricCredential,
  removeBiometricCredential,
  getUserBiometricPreference,
  setUserBiometricPreference,
  WebAuthnCredentialRecord,
} from '../utils/webauthn';

interface UserSecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUpdateUser: (updatedUser: User) => void;
}

export const UserSecuritySettingsModal: React.FC<UserSecuritySettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
}) => {
  const isHighPrivilege =
    currentUser.Role === 'ADMIN' ||
    currentUser.Role === 'HO_MANAGER' ||
    currentUser.Email.toLowerCase().includes('admin');

  // Initial state derived from User record or client local preference
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    if (currentUser.BiometricEnabled !== undefined) {
      return currentUser.BiometricEnabled;
    }
    return getUserBiometricPreference(currentUser.Email, isHighPrivilege);
  });

  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [hasPlatform, setHasPlatform] = useState<boolean>(false);
  const [existingCred, setExistingCred] = useState<WebAuthnCredentialRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkWebAuthnSupport().then((support) => {
        setIsSupported(support.supported);
        setHasPlatform(support.hasPlatformAuthenticator);
      });
      const cred = getStoredBiometricCredential(currentUser.Email);
      setExistingCred(cred);

      const currentPref = currentUser.BiometricEnabled !== undefined
        ? currentUser.BiometricEnabled
        : getUserBiometricPreference(currentUser.Email, isHighPrivilege);
      setIsEnabled(currentPref);
      setFeedback(null);
    }
  }, [isOpen, currentUser.Email, currentUser.BiometricEnabled, isHighPrivilege]);

  if (!isOpen) return null;

  // Toggle Handler
  const handleTogglePreference = async (checked: boolean) => {
    setIsLoading(true);
    setFeedback(null);

    try {
      if (checked) {
        // If enabling and no credential is registered yet, prompt to register a hardware biometric key
        if (!existingCred && isSupported) {
          setFeedback({
            type: 'info',
            message: 'Initiating biometric registration prompt. Please scan your fingerprint or face sensor...',
          });

          const reg = await registerBiometricCredential({
            email: currentUser.Email,
            fullName: currentUser.FullName,
            id: currentUser.UserID,
          });

          if (!reg.success) {
            setFeedback({
              type: 'error',
              message: reg.error || 'Failed to complete biometric hardware registration.',
            });
            setIsLoading(false);
            return;
          }

          setExistingCred(reg.credential || null);
        }

        // Save preference
        setUserBiometricPreference(currentUser.Email, true);
        setIsEnabled(true);
        onUpdateUser({
          ...currentUser,
          BiometricEnabled: true,
        });

        setFeedback({
          type: 'success',
          message: 'WebAuthn Biometric Authentication is now ENABLED for your account.',
        });
      } else {
        // Disabling
        setUserBiometricPreference(currentUser.Email, false);
        setIsEnabled(false);
        onUpdateUser({
          ...currentUser,
          BiometricEnabled: false,
        });

        setFeedback({
          type: 'info',
          message: 'Biometric prompt requirement disabled for your account. Standard password authentication will be used.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to update biometric preference.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Register or re-register biometric passkey
  const handleRegisterBiometrics = async () => {
    setIsLoading(true);
    setFeedback({
      type: 'info',
      message: 'Present your Touch ID, Windows Hello, or platform authenticator...',
    });

    try {
      const reg = await registerBiometricCredential({
        email: currentUser.Email,
        fullName: currentUser.FullName,
        id: currentUser.UserID,
      });

      if (reg.success && reg.credential) {
        setExistingCred(reg.credential);
        setUserBiometricPreference(currentUser.Email, true);
        setIsEnabled(true);
        onUpdateUser({
          ...currentUser,
          BiometricEnabled: true,
        });
        setFeedback({
          type: 'success',
          message: `Hardware passkey successfully registered! Device: ${reg.credential.deviceName}`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: reg.error || 'Registration was cancelled or failed.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Biometric key generation failed.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Remove registered key
  const handleRemovePasskey = () => {
    removeBiometricCredential(currentUser.Email);
    setExistingCred(null);
    setUserBiometricPreference(currentUser.Email, false);
    setIsEnabled(false);
    onUpdateUser({
      ...currentUser,
      BiometricEnabled: false,
    });
    setFeedback({
      type: 'info',
      message: 'Stored biometric credential removed from this browser terminal.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 transition-colors relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Close Settings"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-700 dark:text-purple-300">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              User Profile Security & Biometrics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalized WebAuthn FIDO2 authentication preferences for your account.
            </p>
          </div>
        </div>

        {/* User Badge Info */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Account:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{currentUser.FullName} ({currentUser.Email})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Assigned Role:</span>
            <span className="font-bold text-purple-700 dark:text-purple-300">{currentUser.Role}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Platform Hardware Sensor:</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              {hasPlatform ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Built-in Biometrics (Touch ID / Hello)
                </>
              ) : isSupported ? (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-blue-500" /> WebAuthn Supported (Security Key / Pin)
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Not Supported in this Browser
                </>
              )}
            </span>
          </div>
        </div>

        {/* Main Toggle Switch */}
        <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <label htmlFor="biometric-toggle" className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer">
                <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Enable WebAuthn / Biometric Sign-In Prompt
              </label>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                When enabled, you will be prompted to scan your fingerprint, face, or hardware passkey on the Login Screen before opening high-privilege sessions.
              </p>
            </div>

            {/* Switch Input */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                id="biometric-toggle"
                type="checkbox"
                checked={isEnabled}
                disabled={isLoading || !isSupported}
                onChange={(e) => handleTogglePreference(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-purple-200/60 dark:border-purple-900/40">
            <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>
              Status:{' '}
              <strong className={isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                {isEnabled ? 'Active (Prompt enforced at login)' : 'Disabled (Password-only)'}
              </strong>
            </span>
          </div>
        </div>

        {/* Registered Hardware Passkey Info */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              Registered Biometric Device:
            </span>
            {existingCred && (
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                Active Key
              </span>
            )}
          </div>

          {existingCred ? (
            <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
              <div>
                <strong>Device Name:</strong> {existingCred.deviceName || 'Platform Authenticator'}
              </div>
              <div>
                <strong>Registered:</strong> {new Date(existingCred.registeredAt).toLocaleString()}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleRegisterBiometrics}
                  disabled={isLoading}
                  className="px-2.5 py-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 hover:bg-purple-100 dark:hover:bg-purple-900/60 rounded border border-purple-200 dark:border-purple-800 transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Re-register Passkey</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemovePasskey}
                  disabled={isLoading}
                  className="px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900/60 rounded border border-red-200 dark:border-red-800 transition flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove Key</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                No biometric passkey registered on this browser yet. Click below to register your device sensor.
              </p>
              <button
                type="button"
                onClick={handleRegisterBiometrics}
                disabled={isLoading || !isSupported}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Register Biometric Device Now</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Feedback Toast */}
        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-fadeIn ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : feedback.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
                : 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            ) : feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            ) : (
              <Sparkles className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
            )}
            <div className="leading-relaxed">{feedback.message}</div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
