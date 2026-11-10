import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider, testConnection } from '../firebase/firebase';
import { seedInitialDataIfEmpty } from '../services/firebaseDb';

interface FirebaseContextType {
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  isConnected: boolean;
  isSeeding: boolean;
  dbError: string | null;
  clearDbError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshConnection: () => Promise<boolean>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const clearDbError = useCallback(() => {
    setDbError(null);
  }, []);

  // Validate server connection and seed initial data if needed
  const checkConnectionAndSeed = useCallback(async (user: FirebaseUser | null) => {
    try {
      const ok = await testConnection();
      setIsConnected(ok);
      if (ok && user && !user.isAnonymous) {
        setIsSeeding(true);
        try {
          await seedInitialDataIfEmpty();
        } catch (e) {
          console.error('Seeding check:', e);
        } finally {
          setIsSeeding(false);
        }
      }
      setDbError(null);
      return ok;
    } catch (err: any) {
      console.error('Connection test failed:', err);
      setIsConnected(false);
      setDbError(err?.message || 'Failed to connect to Cloud Firestore.');
      return false;
    }
  }, []);

  useEffect(() => {
    // Listen for authentication changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous) {
        setFirebaseUser(user);
      } else {
        setFirebaseUser(null);
      }
      setAuthLoading(false);
      await checkConnectionAndSeed(user);

      // If completely unauthenticated, establish anonymous auth session in background for Firestore listeners
      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch {
          // Anonymous auth fallback if not enabled in console
        }
      }
    });

    return () => unsubscribe();
  }, [checkConnectionAndSeed]);

  const signInWithGoogle = async () => {
    try {
      setAuthLoading(true);
      setDbError(null);
      const cred = await signInWithPopup(auth, googleProvider);
      setFirebaseUser(cred.user);
      await checkConnectionAndSeed(cred.user);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setDbError('Sign-in cancelled. Please allow popups if prompted.');
      } else if (err.code === 'auth/popup-blocked') {
        setDbError('Popup was blocked by your browser. Please allow popups for this site.');
      } else if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your current domain';
        setDbError(`Domain "${currentDomain}" is not authorized for Google Sign-In in Firebase. To enable Google Sign-In, add "${currentDomain}" to Authorized Domains in Firebase Console (Authentication > Settings > Authorized Domains). In the meantime, you can log in directly using your registered email and password.`);
      } else {
        setDbError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setAuthLoading(true);
      setDbError(null);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      setFirebaseUser(cred.user);
      await checkConnectionAndSeed(cred.user);
      return { success: true };
    } catch (err: any) {
      console.error('Email Sign-In Error:', err);
      let errMsg = 'Failed to authenticate. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errMsg = 'Invalid email or password. If you do not have a password yet, please use "Forgot Password / Get Activation Link".';
      } else if (err.code === 'auth/wrong-password') {
        errMsg = 'Incorrect password. Please verify or use "Forgot Password / Get Activation Link".';
      } else if (err.code === 'auth/too-many-requests') {
        errMsg = 'Too many failed attempts. Please wait a few minutes before trying again.';
      } else if (err.message) {
        errMsg = err.message;
      }
      return { success: false, error: errMsg };
    } finally {
      setAuthLoading(false);
    }
  };

  const sendPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err: any) {
      console.warn('Password reset notification:', err);
      return { success: false, error: err.message || 'Unable to trigger Firebase password reset email.' };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setFirebaseUser(null);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
      setDbError(err.message || 'Failed to sign out.');
    }
  };

  const refreshConnection = async () => {
    return await checkConnectionAndSeed(firebaseUser);
  };

  return (
    <FirebaseContext.Provider
      value={{
        firebaseUser,
        authLoading,
        isConnected,
        isSeeding,
        dbError,
        clearDbError,
        signInWithGoogle,
        signInWithEmail,
        sendPasswordReset,
        signOut,
        refreshConnection,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
