import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, getApps, getApp, cert, type App, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type Auth, type DecodedIdToken } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { APP_ROOT, ENV } from '../config/env.ts';

export type UserRole = 'admin' | 'project_manager' | 'developer' | 'designer' | 'client';
export type AccountStatus = 'active' | 'disabled';

const VALID_ROLES = new Set<UserRole>(['admin', 'project_manager', 'developer', 'designer', 'client']);

export interface FirebaseAdminDiagnostics {
  initialized: boolean;
  hasServiceAccount: boolean;
  mode: 'service_account' | 'dev_unauthenticated_fallback' | 'unconfigured_error';
  projectId: string;
  databaseURL: string;
  clientEmail: string | null;
  error: string | null;
}

export class FirebaseAuthServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 401, code = 'auth/verification-failed') {
    super(message);
    this.name = 'FirebaseAuthServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

interface ParsedServiceAccount extends ServiceAccount {
  type?: string;
  project_id?: string;
  private_key?: string;
  client_email?: string;
}

let hasServiceAccount = false;
let initMode: FirebaseAdminDiagnostics['mode'] = 'unconfigured_error';
let initError: string | null = null;
let configuredClientEmail: string | null = null;
let adminAppInstance: App | null = null;
let adminAuthInstance: Auth | null = null;

function unwrapSurroundingQuotes(value: string): string {
  const trimmed = value.replace(/^\uFEFF/, '').trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner.startsWith('{') && inner.endsWith('}')) {
      return inner;
    }
  }
  return trimmed;
}

function escapeLiteralNewlinesInJsonStrings(input: string): string {
  let out = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (escaped) {
      out += ch;
      escaped = false;
      continue;
    }
    if (ch === '\\') {
      out += ch;
      if (inString) escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      out += ch;
      continue;
    }
    if (inString && ch === '\n') {
      out += '\\n';
      continue;
    }
    if (inString && ch === '\r') {
      out += '\\r';
      continue;
    }
    out += ch;
  }
  return out;
}

function parseJsonObjectLenient(jsonText: string): unknown {
  try {
    return JSON.parse(jsonText);
  } catch (primaryErr) {
    if (jsonText.includes('\n') || jsonText.includes('\r')) {
      try {
        return JSON.parse(escapeLiteralNewlinesInJsonStrings(jsonText));
      } catch {
        // Fall through to report original error
      }
    }
    throw primaryErr;
  }
}

export function parseServiceAccountInput(raw: string): ParsedServiceAccount {
  const cleaned = unwrapSurroundingQuotes(raw);
  let jsonText = cleaned;

  // Handle double-encoded JSON strings (e.g. "\"{\\\"type\\\":...}\"")
  if (jsonText.startsWith('"') && jsonText.endsWith('"')) {
    try {
      const unwrapped = JSON.parse(jsonText);
      if (typeof unwrapped === 'string' && unwrapped.trim().startsWith('{')) {
        jsonText = unwrapped.trim();
      }
    } catch {
      // Continue to standard parsing/path checks
    }
  }

  if (!jsonText.startsWith('{')) {
    // Try reading from filesystem path if it looks like a path or file exists
    const resolvedPath = path.isAbsolute(jsonText) ? jsonText : path.resolve(APP_ROOT, jsonText);
    if (fs.existsSync(resolvedPath)) {
      jsonText = fs.readFileSync(resolvedPath, 'utf8').replace(/^\uFEFF/, '').trim();
    } else if (/^[A-Za-z0-9+/=_-]+$/.test(jsonText) && jsonText.length > 64) {
      // Support Base64-encoded service account JSON for Hostinger env panels
      const decoded = Buffer.from(jsonText, 'base64').toString('utf8').replace(/^\uFEFF/, '').trim();
      if (!decoded.startsWith('{')) {
        throw new Error(
          `FIREBASE_SERVICE_ACCOUNT_JSON is neither valid JSON, Base64 JSON, nor an existing file path (${resolvedPath}).`
        );
      }
      jsonText = decoded;
    } else {
      throw new Error(`Service account file not found at ${resolvedPath} and value is not valid JSON.`);
    }
  }

  let parsedRaw: unknown;
  try {
    parsedRaw = parseJsonObjectLenient(jsonText);
    if (typeof parsedRaw === 'string') {
      parsedRaw = parseJsonObjectLenient(parsedRaw);
    }
  } catch (err) {
    throw new Error(
      `FIREBASE_SERVICE_ACCOUNT_JSON could not be parsed as JSON: ${err instanceof Error ? err.message : 'Syntax error'}`
    );
  }

  const parsed = parsedRaw as ParsedServiceAccount;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must decode to a JSON object.');
  }

  if (parsed.type && parsed.type !== 'service_account') {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT_JSON has invalid type "${parsed.type}" (expected "service_account").`);
  }

  const projectId = (parsed.project_id || parsed.projectId || '').trim();
  const clientEmail = (parsed.client_email || parsed.clientEmail || '').trim();
  const rawPrivateKey = parsed.private_key || parsed.privateKey || '';
  const privateKey = typeof rawPrivateKey === 'string' ? rawPrivateKey.replace(/\\n/g, '\n').trim() : '';

  if (!projectId) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing required field "project_id".');
  }
  if (ENV.FIREBASE_PROJECT_ID && projectId !== ENV.FIREBASE_PROJECT_ID) {
    throw new Error(
      `Firebase project mismatch: service account project_id "${projectId}" does not match FIREBASE_PROJECT_ID "${ENV.FIREBASE_PROJECT_ID}".`
    );
  }
  if (!clientEmail || !clientEmail.includes('@')) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing valid "client_email".');
  }
  if (!privateKey || !privateKey.includes('BEGIN') || !privateKey.includes('PRIVATE KEY')) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing a valid PEM "private_key".');
  }

  parsed.project_id = projectId;
  parsed.projectId = projectId;
  parsed.client_email = clientEmail;
  parsed.clientEmail = clientEmail;
  parsed.private_key = privateKey;
  parsed.privateKey = privateKey;

  return parsed;
}

function initAdminApp(): void {
  if (getApps().length > 0) {
    adminAppInstance = getApp();
    adminAuthInstance = getAuth(adminAppInstance);
    return;
  }

  if (ENV.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const parsed = parseServiceAccountInput(ENV.FIREBASE_SERVICE_ACCOUNT_JSON);
      const projectId = parsed.project_id || ENV.FIREBASE_PROJECT_ID;
      adminAppInstance = initializeApp({
        credential: cert(parsed),
        projectId,
        databaseURL: ENV.FIREBASE_DATABASE_URL,
      });
      adminAuthInstance = getAuth(adminAppInstance);
      hasServiceAccount = true;
      configuredClientEmail = parsed.client_email || null;
      initMode = 'service_account';
      initError = null;
      return;
    } catch (err) {
      hasServiceAccount = false;
      configuredClientEmail = null;
      adminAppInstance = null;
      adminAuthInstance = null;
      initMode = 'unconfigured_error';
      initError = err instanceof Error ? err.message : 'Invalid FIREBASE_SERVICE_ACCOUNT_JSON configuration.';
      console.error('[FIREBASE ADMIN ERROR]', initError);
      return;
    }
  }

  // Never silently fall back to an unauthenticated Admin SDK in production
  if (!ENV.IS_DEV) {
    hasServiceAccount = false;
    configuredClientEmail = null;
    adminAppInstance = null;
    adminAuthInstance = null;
    initMode = 'unconfigured_error';
    initError =
      'FIREBASE_SERVICE_ACCOUNT_JSON is required in production. Configure your Firebase service account credentials in environment variables.';
    console.error('[FIREBASE ADMIN FATAL]', initError);
    return;
  }

  // Explicit development-only fallback when local .env omits FIREBASE_SERVICE_ACCOUNT_JSON
  adminAppInstance = initializeApp({
    projectId: ENV.FIREBASE_PROJECT_ID,
    databaseURL: ENV.FIREBASE_DATABASE_URL,
  });
  adminAuthInstance = getAuth(adminAppInstance);
  hasServiceAccount = false;
  configuredClientEmail = null;
  initMode = 'dev_unauthenticated_fallback';
  initError = null;
  console.warn(
    '[FIREBASE ADMIN DEV] FIREBASE_SERVICE_ACCOUNT_JSON is not set; using development token-signature fallback (Admin RTDB SDK disabled).'
  );
}

initAdminApp();

export const adminApp = adminAppInstance;
export const adminAuth = adminAuthInstance;

export function getFirebaseAdminDiagnostics(): FirebaseAdminDiagnostics {
  return {
    initialized: Boolean(adminAppInstance && adminAuthInstance),
    hasServiceAccount,
    mode: initMode,
    projectId: ENV.FIREBASE_PROJECT_ID,
    databaseURL: ENV.FIREBASE_DATABASE_URL,
    clientEmail: configuredClientEmail,
    error: initError,
  };
}

export function validateFirebaseAdminStartup(): FirebaseAdminDiagnostics {
  const diag = getFirebaseAdminDiagnostics();
  if (diag.error) {
    console.error(`[FIREBASE ADMIN VALIDATION FAILED] (${diag.mode}): ${diag.error}`);
  } else if (diag.hasServiceAccount) {
    console.log(
      `[FIREBASE ADMIN READY] Project="${diag.projectId}" ServiceAccount="${diag.clientEmail}"`
    );
  }
  return diag;
}

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
    throw new FirebaseAuthServiceError('Missing Firebase ID token.', 401, 'auth/missing-token');
  }

  if (!adminAuthInstance) {
    throw new FirebaseAuthServiceError(
      initError || 'Firebase Admin SDK is not configured on the server.',
      503,
      'firebase/admin-not-configured'
    );
  }

  try {
    return await adminAuthInstance.verifyIdToken(idToken, hasServiceAccount);
  } catch (err) {
    const code = (err as { code?: string })?.code || 'auth/verification-failed';
    const rawMsg = err instanceof Error ? err.message : 'Firebase ID token verification failed.';

    if (code === 'auth/id-token-expired') {
      throw new FirebaseAuthServiceError('Your Firebase session has expired. Please sign in again.', 401, code);
    }
    if (code === 'auth/id-token-revoked') {
      throw new FirebaseAuthServiceError('Your session has been revoked. Please sign in again.', 401, code);
    }
    if (code === 'auth/user-disabled') {
      throw new FirebaseAuthServiceError('This Firebase account has been disabled.', 403, code);
    }
    if (code === 'auth/user-not-found') {
      throw new FirebaseAuthServiceError('Firebase user record no longer exists.', 401, code);
    }
    if (rawMsg.includes('aud') || rawMsg.includes('project')) {
      throw new FirebaseAuthServiceError(
        `Firebase ID token project mismatch (server expected "${ENV.FIREBASE_PROJECT_ID}").`,
        500,
        'auth/project-mismatch'
      );
    }
    if (code === 'auth/argument-error') {
      throw new FirebaseAuthServiceError('Malformed or invalid Firebase ID token.', 401, code);
    }
    if (code.startsWith('app/') || rawMsg.includes('credential') || rawMsg.includes('ECONN') || rawMsg.includes('ENOTFOUND')) {
      throw new FirebaseAuthServiceError(
        `Backend Firebase verification service error: ${rawMsg}`,
        503,
        code
      );
    }

    throw new FirebaseAuthServiceError(`Firebase ID token verification failed: ${rawMsg}`, 401, code);
  }
}

export async function getFirebaseAuthUserEmail(uid: string): Promise<string> {
  if (!hasServiceAccount || !adminAuthInstance) return '';
  try {
    const record = await adminAuthInstance.getUser(uid);
    return (record.email || '').trim().toLowerCase();
  } catch {
    return '';
  }
}

export async function fetchFirebaseUserNode(
  uid: string,
  callerIdToken?: string
): Promise<{
  node: FirebaseUserRecordRTDB | null;
  lookupOk: boolean;
  source: 'admin_sdk' | 'rest_token' | 'none';
  error?: string;
  statusCode?: number;
}> {
  if (!adminAppInstance && initMode === 'unconfigured_error') {
    return {
      node: null,
      lookupOk: false,
      source: 'none',
      error: initError || 'Firebase Admin SDK is unconfigured.',
      statusCode: 503,
    };
  }

  if (hasServiceAccount && adminAppInstance) {
    try {
      const dbRef = getDatabase(adminAppInstance).ref(`users/${uid}`);
      const snap = await Promise.race([
        dbRef.once('value'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase RTDB lookup timed out after 8000ms.')), 8000)
        ),
      ]);
      return {
        node: (snap.val() as FirebaseUserRecordRTDB | null) || null,
        lookupOk: true,
        source: 'admin_sdk',
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Admin RTDB read failed.';
      console.error(`Admin RTDB read failed for users/${uid}:`, msg);
      if (!ENV.IS_DEV) {
        return {
          node: null,
          lookupOk: false,
          source: 'admin_sdk',
          error: `Firebase Realtime Database lookup failed: ${msg}`,
          statusCode: 502,
        };
      }
    }
  }

  // Development fallback using verified user ID token against Firebase RTDB REST API (enforced by database.rules.json)
  if (callerIdToken) {
    try {
      const baseDbUrl = ENV.FIREBASE_DATABASE_URL.replace(/\/+$/, '');
      const url = `${baseDbUrl}/users/${encodeURIComponent(uid)}.json?auth=${encodeURIComponent(callerIdToken)}`;
      const res = await fetch(url);
      if (res.ok) {
        return {
          node: ((await res.json()) as FirebaseUserRecordRTDB | null) || null,
          lookupOk: true,
          source: 'rest_token',
        };
      }
      const errText = await res.text().catch(() => '');
      return {
        node: null,
        lookupOk: false,
        source: 'rest_token',
        statusCode: res.status,
        error: `Firebase RTDB REST lookup returned HTTP ${res.status}${errText ? `: ${errText.slice(0, 200)}` : ''}`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      console.error('RTDB token-scoped lookup error:', msg);
      return {
        node: null,
        lookupOk: false,
        source: 'rest_token',
        error: `RTDB token-scoped lookup failed: ${msg}`,
        statusCode: 502,
      };
    }
  }

  return {
    node: null,
    lookupOk: false,
    source: 'none',
    error: 'No Admin credentials or user token available for RTDB lookup.',
    statusCode: 503,
  };
}

export async function ensureRtdbUserNodeIfMissingAsAdmin(
  uid: string,
  profile: { name: string; email: string; phone?: string; company?: string },
  role: UserRole,
  status: AccountStatus = 'active'
): Promise<boolean> {
  if (!hasServiceAccount || !adminAppInstance) return false;
  try {
    const userRef = getDatabase(adminAppInstance).ref(`users/${uid}`);
    const snap = await userRef.once('value');
    if (snap.exists()) {
      return false;
    }
    const now = new Date().toISOString();
    await userRef.set({
      profile: {
        name: profile.name.slice(0, 120) || 'Client User',
        email: profile.email.slice(0, 180),
        phone: (profile.phone || '').slice(0, 40),
        company: (profile.company || '').slice(0, 120),
      },
      role,
      status,
      createdAt: now,
      updatedAt: now,
    });
    return true;
  } catch (err) {
    console.error(`Admin RTDB initial profile healing failed for users/${uid}:`, err);
    return false;
  }
}

export async function syncFirebaseUserClaims(uid: string, role: UserRole): Promise<void> {
  if (!hasServiceAccount || !adminAuthInstance) return;
  try {
    await adminAuthInstance.setCustomUserClaims(uid, { role });
  } catch (err) {
    console.warn(`Unable to sync custom claims for uid=${uid}:`, err instanceof Error ? err.message : err);
  }
}

export async function deleteFirebaseUserAccount(uid: string): Promise<{ rtdbDeleted: boolean; authDeleted: boolean }> {
  let rtdbDeleted = false;
  let authDeleted = false;
  if (hasServiceAccount && adminAppInstance) {
    try {
      await getDatabase(adminAppInstance).ref(`users/${uid}`).remove();
      rtdbDeleted = true;
    } catch (err) {
      console.error(`Failed to delete RTDB node users/${uid}:`, err);
    }
  }
  if (hasServiceAccount && adminAuthInstance) {
    try {
      await adminAuthInstance.deleteUser(uid);
      authDeleted = true;
    } catch (err) {
      console.error(`Failed to delete Firebase Auth user ${uid}:`, err);
    }
  }
  return { rtdbDeleted, authDeleted };
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
  payload.updatedAt = new Date().toISOString();

  if (hasServiceAccount && adminAppInstance && adminAuthInstance) {
    try {
      await getDatabase(adminAppInstance).ref(`users/${targetUid}`).update(payload);
      if (updates.role) {
        await adminAuthInstance.setCustomUserClaims(targetUid, { role: updates.role });
      }
      return true;
    } catch (err) {
      console.error('Admin RTDB/Claims update error:', err);
    }
  }

  if (adminIdToken && ENV.IS_DEV) {
    try {
      const url = `${ENV.FIREBASE_DATABASE_URL.replace(/\/+$/, '')}/users/${encodeURIComponent(
        targetUid
      )}.json?auth=${encodeURIComponent(adminIdToken)}`;
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
