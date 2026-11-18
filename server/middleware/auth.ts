import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/database.ts';
import { ENV } from '../config/env.ts';
import {
  verifyFirebaseIdToken,
  fetchFirebaseUserNode,
  getFirebaseAuthUserEmail,
  ensureRtdbUserNodeIfMissingAsAdmin,
  normalizeRole,
  normalizeStatus,
  FirebaseAuthServiceError,
  type UserRole,
  type AccountStatus,
} from '../firebase/admin.ts';

export type { UserRole, AccountStatus };

export interface AuthUser {
  id: number;
  firebaseUid: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  isActive: boolean;
  status: AccountStatus;
  roles: UserRole[];
  primaryRole: UserRole;
}

export interface AuthErrorDetail {
  status: number;
  code: string;
  message: string;
}

export interface AuthenticatedRequest extends Request {
  authUser?: AuthUser;
  firebaseIdToken?: string;
  authError?: AuthErrorDetail;
}

export const SESSION_COOKIE_NAME = 'sv_fb_session';

export function signToken(rawToken: string): string {
  const sig = crypto.createHmac('sha256', ENV.SESSION_SECRET).update(rawToken).digest('hex');
  return `${rawToken}.${sig}`;
}

export function verifySignedToken(signedToken: string): string | null {
  const idx = signedToken.lastIndexOf('.');
  if (idx <= 0) return null;
  const rawToken = signedToken.slice(0, idx);
  const sigHex = signedToken.slice(idx + 1);
  const expectedHex = crypto.createHmac('sha256', ENV.SESSION_SECRET).update(rawToken).digest('hex');
  const sigBuf = Buffer.from(sigHex, 'hex');
  const expBuf = Buffer.from(expectedHex, 'hex');
  if (sigBuf.length !== expBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  return rawToken;
}

export function resolveHighestRole(roles: UserRole[]): UserRole {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('project_manager')) return 'project_manager';
  if (roles.includes('developer')) return 'developer';
  if (roles.includes('designer')) return 'designer';
  return 'client';
}

export function loadUserById(userId: number): AuthUser | null {
  const userRow = db
    .prepare(`
      SELECT id, firebase_uid, name, email, phone, company, is_active
      FROM users WHERE id = ?
    `)
    .get(userId) as
    | {
        id: number;
        firebase_uid: string | null;
        name: string;
        email: string;
        phone: string;
        company: string;
        is_active: number;
      }
    | undefined;

  if (!userRow || !userRow.is_active) return null;

  const roleRows = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(userId) as { role: UserRole }[];
  const roles: UserRole[] = roleRows.length > 0 ? roleRows.map((r) => r.role) : ['client'];

  return {
    id: userRow.id,
    firebaseUid: userRow.firebase_uid || '',
    name: userRow.name,
    email: userRow.email,
    phone: userRow.phone || '',
    company: userRow.company || '',
    isActive: Boolean(userRow.is_active),
    status: userRow.is_active ? 'active' : 'disabled',
    roles,
    primaryRole: resolveHighestRole(roles),
  };
}

const uidSyncLocks = new Map<string, Promise<{ user: AuthUser; disabled: boolean } | null>>();

export async function authenticateFirebaseIdToken(
  idToken: string,
  fallbackProfile?: { name?: string }
): Promise<{ user: AuthUser; disabled: boolean } | null> {
  if (!idToken) {
    throw new FirebaseAuthServiceError('Missing Firebase ID token.', 401, 'auth/missing-token');
  }

  const decoded = await verifyFirebaseIdToken(idToken);
  const uid = decoded.uid;
  if (!uid) {
    throw new FirebaseAuthServiceError('Decoded Firebase token is missing user UID.', 401, 'auth/invalid-uid');
  }

  const previous = uidSyncLocks.get(uid) || Promise.resolve(null);
  const current = previous
    .catch(() => null)
    .then(async (): Promise<{ user: AuthUser; disabled: boolean } | null> => {
      const rtdbResult = await fetchFirebaseUserNode(uid, idToken);
      if (!rtdbResult.lookupOk && !ENV.IS_DEV) {
        throw new FirebaseAuthServiceError(
          rtdbResult.error || 'Unable to query user profile from Firebase Realtime Database.',
          rtdbResult.statusCode || 502,
          'rtdb/lookup-failed'
        );
      }
      if (!rtdbResult.lookupOk && rtdbResult.error) {
        console.warn(`[AUTH DEV WARNING] RTDB lookup degraded for uid=${uid}: ${rtdbResult.error}`);
      }

      const rtdbUser = rtdbResult.node;
      let email = (decoded.email || rtdbUser?.profile?.email || '').trim().toLowerCase();
      if (!email) {
        email = await getFirebaseAuthUserEmail(uid);
      }
      if (!email) {
        throw new FirebaseAuthServiceError(
          'Your Firebase account does not have an email address associated with it.',
          400,
          'auth/missing-email'
        );
      }

      const fallbackName = sanitizeText(fallbackProfile?.name, 120);
      const displayName =
        sanitizeText(rtdbUser?.profile?.name, 120) ||
        sanitizeText(decoded.name, 120) ||
        fallbackName ||
        email.split('@')[0] ||
        'Client User';
      const phone = sanitizeText(rtdbUser?.profile?.phone, 40);
      const company = sanitizeText(rtdbUser?.profile?.company, 120);
      const emailVerifiedInt = decoded.email_verified ? 1 : 0;

      let userId = 0;
      let resolvedRole: UserRole = 'client';
      let isActive = true;

      db.exec('BEGIN IMMEDIATE;');
      try {
        const byUid = db
          .prepare('SELECT id, firebase_uid, name, email, phone, company, is_active FROM users WHERE firebase_uid = ?')
          .get(uid) as
          | {
              id: number;
              firebase_uid: string | null;
              name: string;
              email: string;
              phone: string;
              company: string;
              is_active: number;
            }
          | undefined;

        const byEmail = db
          .prepare('SELECT id, firebase_uid, name, email, phone, company, is_active FROM users WHERE lower(email) = ?')
          .get(email) as
          | {
              id: number;
              firebase_uid: string | null;
              name: string;
              email: string;
              phone: string;
              company: string;
              is_active: number;
            }
          | undefined;

        const existing = byUid || byEmail;
        const hasEmailCollision = Boolean(byUid && byEmail && byUid.id !== byEmail.id);

        const existingRoles = existing
          ? (db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(existing.id) as { role: UserRole }[]).map(
              (r) => r.role
            )
          : [];
        const highestExistingRole = existingRoles.length > 0 ? resolveHighestRole(existingRoles) : null;
        const rtdbRole = rtdbUser?.role ? normalizeRole(rtdbUser.role) : null;
        const claimRole = decoded.role ? normalizeRole(decoded.role) : null;

        // Preserve manually assigned admin roles across SQLite, Firebase Custom Claims, and RTDB — never downgrade admin to client
        if (rtdbRole === 'admin' || claimRole === 'admin' || existingRoles.includes('admin')) {
          resolvedRole = 'admin';
        } else if (rtdbRole) {
          resolvedRole = rtdbRole;
        } else if (claimRole) {
          resolvedRole = claimRole;
        } else if (highestExistingRole) {
          resolvedRole = highestExistingRole;
        } else {
          resolvedRole = 'client';
        }

        if (rtdbUser?.status !== undefined) {
          isActive = normalizeStatus(rtdbUser.status) === 'active';
        } else if (existing) {
          isActive = Boolean(existing.is_active);
        } else {
          isActive = true;
        }

        if (!existing) {
          const ins = db
            .prepare(`
              INSERT INTO users (firebase_uid, name, email, phone, company, password_hash, email_verified, is_active)
              VALUES (?, ?, ?, ?, ?, '', ?, ?)
            `)
            .run(uid, displayName, email, phone, company, emailVerifiedInt, isActive ? 1 : 0);
          userId = Number(ins.lastInsertRowid);
        } else {
          userId = existing.id;
          const nextEmail = hasEmailCollision ? existing.email : email;
          db.prepare(`
            UPDATE users
            SET firebase_uid = ?,
                name = COALESCE(NULLIF(?, ''), name),
                email = ?,
                phone = COALESCE(NULLIF(?, ''), phone),
                company = COALESCE(NULLIF(?, ''), company),
                email_verified = CASE WHEN ? = 1 THEN 1 ELSE email_verified END,
                is_active = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `).run(uid, displayName, nextEmail, phone, company, emailVerifiedInt, isActive ? 1 : 0, userId);

          if (hasEmailCollision) {
            console.warn(
              `[AUTH SYNC WARNING] Duplicate SQLite email detected (${email}); preserved UID-matched user id=${userId} without overwriting email.`
            );
          }
        }

        // Synchronize resolved authoritative role in SQLite user_roles
        db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId);
        db.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').run(userId, resolvedRole);

        if (resolvedRole === 'client') {
          db.prepare(`INSERT OR IGNORE INTO clients (user_id, company_name, phone) VALUES (?, ?, ?)`).run(
            userId,
            company,
            phone
          );
        }

        // Automatically link any earlier guest inquiries submitted with this email
        db.prepare(`UPDATE inquiries SET client_user_id = ? WHERE lower(email) = ? AND client_user_id IS NULL`).run(
          userId,
          email
        );

        db.exec('COMMIT;');
      } catch (err) {
        try {
          db.exec('ROLLBACK;');
        } catch {
          // Ignore rollback error
        }
        const dbMessage = err instanceof Error ? err.message : 'Database synchronization error';
        throw new FirebaseAuthServiceError(
          `Failed to synchronize user account with backend database: ${dbMessage}`,
          500,
          'auth/sqlite-sync-failed'
        );
      }

      // If user has no RTDB node yet and Admin SDK is available, safely initialize it with their resolved role (never overwriting existing nodes)
      if (!rtdbUser && rtdbResult.lookupOk) {
        await ensureRtdbUserNodeIfMissingAsAdmin(
          uid,
          { name: displayName, email, phone, company },
          resolvedRole,
          isActive ? 'active' : 'disabled'
        );
      }

      if (!isActive) {
        return {
          disabled: true,
          user: {
            id: userId,
            firebaseUid: uid,
            name: displayName,
            email,
            phone,
            company,
            isActive: false,
            status: 'disabled',
            roles: [resolvedRole],
            primaryRole: resolvedRole,
          },
        };
      }

      const user = loadUserById(userId);
      if (!user) {
        throw new FirebaseAuthServiceError(
          'User account was synchronized but could not be reloaded from SQLite.',
          500,
          'auth/user-reload-failed'
        );
      }
      return { user, disabled: false };
    });

  uidSyncLocks.set(uid, current);
  try {
    return await current;
  } finally {
    if (uidSyncLocks.get(uid) === current) {
      uidSyncLocks.delete(uid);
    }
  }
}

export function extractBearerOrCookieToken(req: Request): { token: string | null; source: 'bearer' | 'cookie' | null } {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return { token, source: 'bearer' };
  }
  const signedCookie = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  if (signedCookie) {
    const verified = verifySignedToken(signedCookie);
    if (verified) return { token: verified, source: 'cookie' };
  }
  return { token: null, source: null };
}

export async function attachSessionMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  // /api/auth/session performs direct verification & synchronization with request body profile context
  if (req.path === '/api/auth/session' && req.method === 'POST') {
    next();
    return;
  }

  const { token, source } = extractBearerOrCookieToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const result = await authenticateFirebaseIdToken(token);
    if (result?.disabled) {
      if (source === 'cookie') {
        res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      }
      if (req.path.startsWith('/api/')) {
        res.status(403).json({
          error: 'This account is disabled. Contact Sanjay Vaishya.',
          code: 'auth/user-disabled',
        });
        return;
      }
      next();
      return;
    }
    if (result?.user) {
      req.authUser = result.user;
      req.firebaseIdToken = token;
    }
  } catch (err) {
    const status = err instanceof FirebaseAuthServiceError ? err.statusCode : 401;
    const code = err instanceof FirebaseAuthServiceError ? err.code : 'auth/verification-failed';
    const message = err instanceof Error ? err.message : 'Firebase authentication failed.';
    req.authError = { status, code, message };

    if (source === 'cookie' && status === 401) {
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    }
    if (status >= 500) {
      console.error(`[AUTH MIDDLEWARE ${status}] ${req.method} ${req.path} (${code}): ${message}`);
    }
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser) {
    if (req.authError) {
      res.status(req.authError.status).json({ error: req.authError.message, code: req.authError.code });
      return;
    }
    res.status(401).json({ error: 'Authentication required', code: 'auth/unauthenticated' });
    return;
  }
  if (!req.authUser.isActive) {
    res.status(403).json({ error: 'Account disabled', code: 'auth/user-disabled' });
    return;
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      if (req.authError) {
        res.status(req.authError.status).json({ error: req.authError.message, code: req.authError.code });
        return;
      }
      res.status(401).json({ error: 'Authentication required', code: 'auth/unauthenticated' });
      return;
    }
    if (!req.authUser.isActive) {
      res.status(403).json({ error: 'Account disabled', code: 'auth/user-disabled' });
      return;
    }
    const hasMatch = req.authUser.roles.some((r) => allowedRoles.includes(r));
    if (!hasMatch) {
      res.status(403).json({ error: 'Insufficient permissions for this resource', code: 'auth/forbidden' });
      return;
    }
    next();
  };
}

export function logAudit(
  actorUserId: number | null,
  action: string,
  entityType: string,
  entityId: string | number,
  details: Record<string, unknown> = {},
  ipAddress = ''
): void {
  try {
    db.prepare(`
      INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details_json, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(actorUserId, action, entityType, String(entityId), JSON.stringify(details), ipAddress);
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

export function createNotification(
  userId: number,
  type: string,
  title: string,
  message: string,
  linkPath = '/dashboard'
): number {
  const res = db
    .prepare(`
      INSERT INTO notifications (user_id, type, title, message, link_path)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(userId, type, title, message, linkPath);
  return Number(res.lastInsertRowid);
}

export function notifyAdmins(type: string, title: string, message: string, linkPath = '/admin'): number[] {
  const admins = db
    .prepare(`
      SELECT DISTINCT u.id FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      WHERE ur.role IN ('admin', 'project_manager') AND u.is_active = 1
    `)
    .all() as { id: number }[];
  return admins.map((a) => createNotification(a.id, type, title, message, linkPath));
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(windowMs: number, maxRequests: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip || 'unknown'}:${req.path}`;
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record || record.resetAt <= now) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment before retrying.' });
      return;
    }

    record.count += 1;
    next();
  };
}

export function sanitizeText(value: unknown, maxLength = 2000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export function verifySameOriginForMutations(req: Request, res: Response, next: NextFunction): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  if (req.path === '/api/payments/razorpay/webhook') {
    next();
    return;
  }
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        res.status(403).json({ error: 'Cross-origin mutation rejected' });
        return;
      }
    } catch {
      res.status(403).json({ error: 'Invalid Origin header' });
      return;
    }
  }
  next();
}
