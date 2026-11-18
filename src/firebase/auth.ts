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

export async function registerWithFirebaseEmail(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, password);
  if (cleanName) {
    await updateProfile(cred.user, { displayName: cleanName });
  }

  try {
    await ensureInitialClientNode(cred.user.uid, {
      name: cleanName,
      email: (cred.user.email || cleanEmail).trim().toLowerCase(),
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'Unable to initialize user profile.';
    throw new Error(
      `Account created, but profile initialization failed (${detail}). Please sign in again to finish setup.`
    );
  }

  return cred.user;
}

export async function loginWithFirebaseEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
  return cred.user;
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
      return 'An account with this email address already exists.';
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
