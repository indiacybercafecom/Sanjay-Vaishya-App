import { initializeApp, getApps, getApp, cert, type App } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { ENV } from '../config/env.ts';

export type UserRole = 'admin' | 'project_manager' | 'developer' | 'designer' | 'client';
export type AccountStatus = 'active' | 'disabled';

const VALID_ROLES = new Set<UserRole>(['admin', 'project_manager', 'developer', 'designer', 'client']);

let hasServiceAccount = false;

function initAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  if (ENV.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = JSON.parse(ENV.FIREBASE_SERVICE_ACCOUNT_JSON);
      hasServiceAccount = true;
      return initializeApp({
        credential: cert(parsed),
        projectId: ENV.FIREBASE_PROJECT_ID,
        databaseURL: ENV.FIREBASE_DATABASE_URL,
      });
    } catch (err) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON format:', err);
    }
  }

  return initializeApp({
    projectId: ENV.FIREBASE_PROJECT_ID,
    databaseURL: ENV.FIREBASE_DATABASE_URL,
  });
}

export const adminApp = initAdminApp();
export const adminAuth = getAuth(adminApp);

export interface FirebaseUserRecordRTDB {
  profile?: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    emailVerified?: boolean;
  };
  role?: string;
  status?: string;
  createdAt?: string;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  return adminAuth.verifyIdToken(idToken);
}

export async function fetchFirebaseUserNode(
  uid: string,
  callerIdToken?: string
): Promise<FirebaseUserRecordRTDB | null> {
  if (hasServiceAccount) {
    try {
      const snap = await getDatabase(adminApp).ref(`users/${uid}`).once('value');
      return (snap.val() as FirebaseUserRecordRTDB | null) || null;
    } catch (err) {
      console.error('Admin RTDB read failed, falling back to token-scoped RTDB lookup:', err);
    }
  }

  // Fallback using verified user ID token against Firebase RTDB REST API (enforced by database.rules.json)
  if (callerIdToken) {
    try {
      const url = `${ENV.FIREBASE_DATABASE_URL}/users/${encodeURIComponent(uid)}.json?auth=${encodeURIComponent(
        callerIdToken
      )}`;
      const res = await fetch(url);
      if (res.ok) {
        return (await res.json()) as FirebaseUserRecordRTDB | null;
      }
    } catch (err) {
      console.error('RTDB token-scoped lookup error:', err);
    }
  }

  return null;
}

export function normalizeRole(rawRole: unknown): UserRole {
  if (typeof rawRole === 'string' && VALID_ROLES.has(rawRole as UserRole)) {
    return rawRole as UserRole;
  }
  return 'client';
}

export function normalizeStatus(rawStatus: unknown): AccountStatus {
  return rawStatus === 'disabled' ? 'disabled' : 'active';
}

export async function updateFirebaseUserNodeAsAdmin(
  targetUid: string,
  updates: { role?: UserRole; status?: AccountStatus },
  adminIdToken?: string
): Promise<boolean> {
  const payload: Record<string, string> = {};
  if (updates.role) payload.role = updates.role;
  if (updates.status) payload.status = updates.status;

  if (hasServiceAccount) {
    try {
      await getDatabase(adminApp).ref(`users/${targetUid}`).update(payload);
      if (updates.role) {
        await adminAuth.setCustomUserClaims(targetUid, { role: updates.role });
      }
      return true;
    } catch (err) {
      console.error('Admin RTDB/Claims update error:', err);
    }
  }

  if (adminIdToken) {
    try {
      const url = `${ENV.FIREBASE_DATABASE_URL}/users/${encodeURIComponent(targetUid)}.json?auth=${encodeURIComponent(
        adminIdToken
      )}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.error('RTDB REST admin update failed:', err);
    }
  }

  return false;
}
