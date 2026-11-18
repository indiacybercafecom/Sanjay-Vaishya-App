import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
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
  const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
  }
  try {
    await ensureInitialClientNode(cred.user.uid, {
      name: name.trim(),
      email: (cred.user.email || email).trim().toLowerCase(),
    });
  } catch {
    // Backend session sync also initializes RTDB client record when needed
  }
  try {
    await sendEmailVerification(cred.user);
  } catch {
    // Do not block registration if verification email dispatch is throttled
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

export async function resendFirebaseVerification(): Promise<void> {
  if (!firebaseAuth.currentUser) {
    throw new Error('Sign in first to resend your verification email.');
  }
  await sendEmailVerification(firebaseAuth.currentUser);
}

export async function reloadCurrentFirebaseUser(): Promise<boolean> {
  if (!firebaseAuth.currentUser) return false;
  await firebaseAuth.currentUser.reload();
  return firebaseAuth.currentUser.emailVerified;
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
