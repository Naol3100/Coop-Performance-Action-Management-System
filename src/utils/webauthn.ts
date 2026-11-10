// WebAuthn & Biometric Authentication Utility for High-Privilege Banking Sessions
// Supports platform authenticators: Touch ID, Face ID, Windows Hello, Android Biometrics, and FIDO2 Security Keys

export interface WebAuthnCredentialRecord {
  id: string; // base64url encoded credential ID
  rawId: string;
  type: string;
  transports?: string[];
  registeredAt: string;
  deviceName?: string;
  userEmail: string;
}

const STORAGE_KEY_PREFIX = 'cbo_webauthn_cred_';

// Check if the current browser environment supports WebAuthn and platform biometrics
export async function checkWebAuthnSupport(): Promise<{
  supported: boolean;
  hasPlatformAuthenticator: boolean;
  reason?: string;
}> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return {
      supported: false,
      hasPlatformAuthenticator: false,
      reason: 'WebAuthn API is not supported in this browser.',
    };
  }

  try {
    let hasPlatform = false;
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      hasPlatform = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return {
      supported: true,
      hasPlatformAuthenticator: hasPlatform,
    };
  } catch (err: any) {
    return {
      supported: true,
      hasPlatformAuthenticator: false,
      reason: err?.message,
    };
  }
}

// Convert base64url or string to Uint8Array
export function bufferFromBase64(base64: string): ArrayBuffer {
  const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert Uint8Array to base64url string
export function base64FromBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Generate a cryptographic challenge ArrayBuffer
export function generateChallenge(): ArrayBuffer {
  const challenge = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(challenge);
  } else {
    for (let i = 0; i < 32; i++) challenge[i] = Math.floor(Math.random() * 256);
  }
  return challenge.buffer as ArrayBuffer;
}

// Retrieve stored registered biometric credential for an administrative user
export function getStoredBiometricCredential(email: string): WebAuthnCredentialRecord | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${email.toLowerCase().trim()}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Save registered biometric credential locally
export function saveBiometricCredential(email: string, cred: WebAuthnCredentialRecord): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${email.toLowerCase().trim()}`, JSON.stringify(cred));
  } catch (err) {
    console.warn('Failed to persist biometric credential to localStorage:', err);
  }
}

// Remove registered biometric credential
export function removeBiometricCredential(email: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${email.toLowerCase().trim()}`);
  } catch (err) {
    console.warn('Failed to remove biometric credential from localStorage:', err);
  }
}

const PREF_KEY_PREFIX = 'cbo_user_pref_webauthn_';

// Check if user has explicitly enabled or disabled biometric authentication
export function getUserBiometricPreference(email: string, defaultForHighPrivilege: boolean = true): boolean {
  try {
    const raw = localStorage.getItem(`${PREF_KEY_PREFIX}${email.toLowerCase().trim()}`);
    if (raw !== null) {
      return raw === 'true';
    }
  } catch {}
  return defaultForHighPrivilege;
}

// Persist user biometric preference
export function setUserBiometricPreference(email: string, enabled: boolean): void {
  try {
    localStorage.setItem(`${PREF_KEY_PREFIX}${email.toLowerCase().trim()}`, String(enabled));
  } catch (err) {
    console.warn('Failed to set biometric preference:', err);
  }
}

// Register a new platform biometric authenticator (Touch ID, Windows Hello, Face ID, etc.)
export async function registerBiometricCredential(
  user: { email: string; fullName: string; id: string }
): Promise<{ success: boolean; credential?: WebAuthnCredentialRecord; error?: string }> {
  try {
    const support = await checkWebAuthnSupport();
    if (!support.supported) {
      return { success: false, error: 'WebAuthn is not supported by your current browser.' };
    }

    const challenge = generateChallenge();
    const userIdBuffer = new TextEncoder().encode(user.id || user.email);

    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'Cooperative Bank of Oromia',
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      },
      user: {
        id: userIdBuffer,
        name: user.email,
        displayName: user.fullName || user.email,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },  // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // prefers built-in fingerprint / face reader / Windows Hello
        userVerification: 'preferred',
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      return { success: false, error: 'No credential was created by the biometric prompt.' };
    }

    const credRecord: WebAuthnCredentialRecord = {
      id: credential.id,
      rawId: base64FromBuffer(credential.rawId),
      type: credential.type,
      registeredAt: new Date().toISOString(),
      deviceName: navigator.userAgent.includes('Mac')
        ? 'Apple Touch ID / Face ID'
        : navigator.userAgent.includes('Windows')
        ? 'Windows Hello Biometric'
        : navigator.userAgent.includes('Android')
        ? 'Android Biometric Key'
        : 'Platform Biometric Authenticator',
      userEmail: user.email.toLowerCase().trim(),
    };

    saveBiometricCredential(user.email, credRecord);
    return { success: true, credential: credRecord };
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric verification prompt was cancelled or timed out.' };
    }
    if (err?.name === 'AbortError') {
      return { success: false, error: 'Biometric verification operation was aborted.' };
    }
    return {
      success: false,
      error: err?.message || 'Biometric authentication registration failed.',
    };
  }
}

// Authenticate via Biometric or WebAuthn prompt
export async function authenticateWithBiometrics(
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const support = await checkWebAuthnSupport();
    if (!support.supported) {
      return { success: false, error: 'WebAuthn is not supported by this browser.' };
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingCred = getStoredBiometricCredential(cleanEmail);
    const challenge = generateChallenge();

    const allowCredentials: PublicKeyCredentialDescriptor[] = existingCred
      ? [
          {
            id: bufferFromBase64(existingCred.rawId || existingCred.id),
            type: 'public-key',
            transports: ['internal'],
          },
        ]
      : [];

    const publicKeyRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      timeout: 60000,
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      userVerification: 'required', // strictly requires biometric fingerprint / face scan / PIN
      ...(allowCredentials.length > 0 ? { allowCredentials } : {}),
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyRequestOptions,
    });

    if (!assertion) {
      return { success: false, error: 'Biometric assertion was rejected.' };
    }

    return { success: true };
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric prompt was dismissed or verification failed.' };
    }
    if (err?.name === 'AbortError') {
      return { success: false, error: 'Biometric verification was cancelled.' };
    }
    // If no credential was registered yet, allow fallback or informative error
    return {
      success: false,
      error: err?.message || 'Biometric identity verification could not be completed.',
    };
  }
}
