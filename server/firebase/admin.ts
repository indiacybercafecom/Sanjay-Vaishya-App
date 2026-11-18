import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, getApps, getApp, cert, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { ENV } from '../config/env.ts';

export type UserRole = 'admin' | 'project_manager' | 'developer' | 'designer' | 'client';
export type AccountStatus = 'active' | 'disabled';

const VALID_ROLES = new Set<UserRole>(['admin', 'project_manager', 'developer', 'designer', 'client']);

let hasServiceAccount = false;

function parseServiceAccountInput(raw: string): ServiceAccount | null {
  if (!raw) return null;
  let jsonText = raw.trim();

  // Support either direct JSON or path to a local service account file
  if (!jsonText.startsWith('{')) {
    const resolvedPath = path.isAbsolute(jsonText) ? jsonText : path.resolve(process.cwd(), jsonText);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Service account file not found at ${resolvedPath}`);
    }
    jsonText = fs.readFileSync(resolvedPath, 'utf8');
  }

  const parsed = JSON.parse(jsonText) as ServiceAccount & { private_key?: string };
  if (typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  return parsed;
}

function initAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  if (ENV.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = parseServiceAccountInput(ENV.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (parsed) {
        hasServiceAccount = true;
        return initializeApp({
          credential: cert(parsed),
          projectId: ENV.FIREBASE_PROJECT_ID,
          databaseURL: ENV.FIREBASE_DATABASE_URL,
        });
      }
    } catch (err) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON configuration:', err);
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
  };
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing Firebase ID token.');
  }
  return adminAuth.verifyIdToken(idToken);
}

export async function fetchFirebaseUserNode(
  uid: string,
  callerIdToken?: string
): Promise<{ node: FirebaseUserRecordRTDB | null; lookupOk: boolean }> {
  if (hasServiceAccount) {
    try {
      const snap = await getDatabase(adminApp).ref(`users/${uid}`).once('value');
      return { node: (snap.val() as FirebaseUserRecordRTDB | null) || null, lookupOk: true };
    } catch (err) {
      console.error('Admin RTDB read failed, falling back to token-scoped RTDB lookup:', err);
    }
  }

  // Fallback using verified user ID token against Firebase RTDB REST API (enforced by database.rules.json)
  if (callerIdToken) {
    try {
      const baseDbUrl = ENV.FIREBASE_DATABASE_URL.replace(/\/+$/, '');
      const url = `${baseDbUrl}/users/${encodeURIComponent(uid)}.json?auth=${encodeURIComponent(callerIdToken)}`;
      const res = await fetch(url);
      if (res.ok) {
        return { node: ((await res.json()) as FirebaseUserRecordRTDB | null) || null, lookupOk: true };
      }
    } catch (err) {
      console.error('RTDB token-scoped lookup error:', err);
    }
  }

  return { node: null, lookupOk: false };
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
