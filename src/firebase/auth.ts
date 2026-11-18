import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  type User,
} from 'firebase/auth';
import { firebaseAuth } from './config';
import { ensureInitialClientNode } from './database';

let activeAuthFlows = 0;

export function isAuthFlowInProgress(): boolean {
  return activeAuthFlows > 0;
}

export async function registerWithFirebaseEmail(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  activeAuthFlows += 1;
  try {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
    if (cleanName) {
      await updateProfile(cred.user, { displayName: cleanName });
    }

    try {
      await ensureInitialClientNode(cred.user.uid, {
        name: cleanName || cleanEmail.split('@')[0] || 'Client User',
        email: (cred.user.email || cleanEmail).trim().toLowerCase(),
      });
    } catch (err) {
      const code = (err as { code?: string })?.code ? ` [${(err as { code?: string }).code}]` : '';
      const detail = err instanceof Error ? err.message : 'Unable to initialize user profile.';
      throw new Error(
        `Account created, but Realtime Database profile creation failed${code}: ${detail}`
      );
    }

    // Refresh ID token so displayName claims are immediately included for backend verification
    await cred.user.getIdToken(true);
    return cred.user;
  } finally {
    activeAuthFlows = Math.max(0, activeAuthFlows - 1);
  }
}

export async function loginWithFirebaseEmail(email: string, password: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();
  activeAuthFlows += 1;
  try {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);

    // Self-heal missing RTDB client node for legacy/interrupted accounts without touching existing nodes
    try {
      await ensureInitialClientNode(cred.user.uid, {
        name: cred.user.displayName || cleanEmail.split('@')[0] || 'Client User',
        email: (cred.user.email || cleanEmail).trim().toLowerCase(),
      });
    } catch {
      // Non-fatal: backend Admin SDK or SQLite fallback preserves existing user & role
    }

    return cred.user;
  } finally {
    activeAuthFlows = Math.max(0, activeAuthFlows - 1);
  }
}

export async function logoutFromFirebase(): Promise<void> {
  await signOut(firebaseAuth);
}

export async function sendFirebasePasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(firebaseAuth, email.trim());
}

export function formatFirebaseAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email address or password.';
    case 'auth/user-disabled':
      return 'This account has been disabled by the administrator.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error while contacting authentication service.';
    default:
      return error instanceof Error ? error.message : 'Authentication request failed.';
  }
}
