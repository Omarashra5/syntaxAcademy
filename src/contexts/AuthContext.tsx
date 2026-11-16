import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { auth, BOOTSTRAPPED_ADMIN_EMAIL, db, googleProvider } from '../lib/firebase';
import { generateId, sanitizeText } from '../lib/validation';
import { getAdminSessionStatus } from '../services/adminApiService';
import type { StudentUser } from '../types';

interface AuthContextValue {
  user: User | null;
  studentProfile: StudentUser | null;
  isFirebaseAdmin: boolean;
  isServerAdmin: boolean;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (fullName: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshAdminSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const inFlightProfileSync = new Map<string, Promise<StudentUser>>();
let activeExplicitAuthFlows = 0;

async function runEnsureStudentProfile(
  firebaseUser: User,
  explicitFullName?: string
): Promise<StudentUser> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const existing = await getDoc(userRef);
  if (existing.exists()) {
    const existingData = existing.data() as StudentUser;
    const updates: Record<string, unknown> = {};
    if (firebaseUser.email && existingData.email !== firebaseUser.email) {
      updates.email = firebaseUser.email;
    }
    const sanitizedExplicit = explicitFullName ? sanitizeText(explicitFullName, 120) : '';
    if (sanitizedExplicit.length >= 2 && existingData.fullName !== sanitizedExplicit) {
      updates.fullName = sanitizedExplicit;
    }
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = serverTimestamp();
      await updateDoc(userRef, updates);
      return { ...existingData, ...updates } as StudentUser;
    }
    return existingData;
  }

  const now = serverTimestamp();
  const fullName = sanitizeText(
    explicitFullName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
    120
  );
  const profile: Record<string, unknown> = {
    uid: firebaseUser.uid,
    fullName: fullName.length >= 2 ? fullName : 'Syntax Student',
    email: firebaseUser.email || '',
    avatarUrl: firebaseUser.photoURL || '',
    role: 'student',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(userRef, profile);

  // Notify admin of new student registration
  const notifId = generateId('notif');
  batch.set(doc(db, 'notifications', notifId), {
    id: notifId,
    recipientUid: 'admin',
    type: 'new_student',
    titleEn: 'New Student Registered',
    titleAr: 'تسجيل طالب جديد',
    bodyEn: `${profile.fullName} (${profile.email}) created a Syntax Academy account.`,
    bodyAr: `قام ${profile.fullName} (${profile.email}) بإنشاء حساب جديد في Syntax Academy.`,
    actionUrl: '/admin/students',
    isRead: false,
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();
  const createdSnap = await getDoc(userRef);
  return createdSnap.data() as StudentUser;
}

function ensureStudentProfile(firebaseUser: User, explicitFullName?: string): Promise<StudentUser> {
  const existingPromise = inFlightProfileSync.get(firebaseUser.uid);
  if (existingPromise) {
    return existingPromise;
  }
  const promise = runEnsureStudentProfile(firebaseUser, explicitFullName).finally(() => {
    inFlightProfileSync.delete(firebaseUser.uid);
  });
  inFlightProfileSync.set(firebaseUser.uid, promise);
  return promise;
}

async function checkFirebaseAdminStatus(firebaseUser: User | null): Promise<boolean> {
  if (!firebaseUser) return false;
  if (
    firebaseUser.emailVerified &&
    firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
  ) {
    return true;
  }
  try {
    const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
    return adminSnap.exists();
  } catch {
    return false;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentUser | null>(null);
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState(false);
  const [isServerAdmin, setIsServerAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshAdminSession = useCallback(async () => {
    try {
      const status = await getAdminSessionStatus();
      setIsServerAdmin(status.authenticated);
      return status.authenticated;
    } catch {
      setIsServerAdmin(false);
      return false;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const current = auth.currentUser;
    if (!current) {
      setStudentProfile(null);
      return;
    }
    const snap = await getDoc(doc(db, 'users', current.uid));
    if (snap.exists()) {
      setStudentProfile(snap.data() as StudentUser);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    refreshAdminSession();

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!mounted) return;
      setUser(firebaseUser);
      if (firebaseUser) {
        if (activeExplicitAuthFlows > 0) {
          if (mounted) setLoading(false);
          return;
        }
        try {
          const [profile, adminFlag] = await Promise.all([
            ensureStudentProfile(firebaseUser),
            checkFirebaseAdminStatus(firebaseUser),
          ]);
          if (mounted) {
            setStudentProfile(profile);
            setIsFirebaseAdmin(adminFlag);
          }
        } catch (err) {
          console.error('Auth profile sync warning:', err);
        }
      } else {
        setStudentProfile(null);
        setIsFirebaseAdmin(false);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, [refreshAdminSession]);

  const loginWithEmail = async (email: string, password: string) => {
    activeExplicitAuthFlows += 1;
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const [profile, adminFlag] = await Promise.all([
        ensureStudentProfile(cred.user),
        checkFirebaseAdminStatus(cred.user),
      ]);
      setStudentProfile(profile);
      setIsFirebaseAdmin(adminFlag);
    } finally {
      activeExplicitAuthFlows = Math.max(0, activeExplicitAuthFlows - 1);
    }
  };

  const registerWithEmail = async (fullName: string, email: string, password: string) => {
    activeExplicitAuthFlows += 1;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: sanitizeText(fullName, 120) });
      try {
        await sendEmailVerification(cred.user);
      } catch {
        // Non-fatal if verification email rate-limited
      }
      const [profile, adminFlag] = await Promise.all([
        ensureStudentProfile(cred.user, fullName),
        checkFirebaseAdminStatus(cred.user),
      ]);
      setStudentProfile(profile);
      setIsFirebaseAdmin(adminFlag);
    } finally {
      activeExplicitAuthFlows = Math.max(0, activeExplicitAuthFlows - 1);
    }
  };

  const loginWithGoogle = async () => {
    activeExplicitAuthFlows += 1;
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const [profile, adminFlag] = await Promise.all([
        ensureStudentProfile(cred.user),
        checkFirebaseAdminStatus(cred.user),
      ]);
      setStudentProfile(profile);
      setIsFirebaseAdmin(adminFlag);
    } finally {
      activeExplicitAuthFlows = Math.max(0, activeExplicitAuthFlows - 1);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setStudentProfile(null);
    setIsFirebaseAdmin(false);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No authenticated user.');
    await sendEmailVerification(auth.currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        studentProfile,
        isFirebaseAdmin,
        isServerAdmin,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        resetPassword,
        resendVerificationEmail,
        refreshProfile,
        refreshAdminSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
