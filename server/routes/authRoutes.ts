import { Router } from 'express';
import { db } from '../db/database.ts';
import { ENV } from '../config/env.ts';
import { FirebaseAuthServiceError, deleteFirebaseUserAccount } from '../firebase/admin.ts';
import {
  type AuthenticatedRequest,
  SESSION_COOKIE_NAME,
  signToken,
  loadUserById,
  requireAuth,
  sanitizeText,
  logAudit,
  notifyAdmins,
  extractBearerOrCookieToken,
  authenticateFirebaseIdToken,
} from '../middleware/auth.ts';

export const authRouter = Router();

// Verifies Firebase ID token, synchronizes RTDB + SQLite user/roles, and sets signed HttpOnly cookie
authRouter.post('/session', async (req: AuthenticatedRequest, res) => {
  const { token, source } = extractBearerOrCookieToken(req);
  if (!token) {
    res.status(401).json({
      error: 'Missing Firebase ID token. Please sign in again.',
      code: 'auth/missing-token',
    });
    return;
  }

  const submittedName = sanitizeText(req.body?.name, 120);

  try {
    const result = await authenticateFirebaseIdToken(token, {
      name: submittedName || undefined,
      allowMissingRtdbCreation: true,
    });
    if (!result || !result.user) {
      res.status(500).json({
        error: 'Unable to synchronize user profile with backend database.',
        code: 'auth/sync-empty-user',
      });
      return;
    }

    if (result.disabled) {
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      res.status(403).json({
        error: 'This account is disabled. Contact Sanjay Vaishya.',
        code: 'auth/user-disabled',
      });
      return;
    }

    req.authUser = result.user;
    req.firebaseIdToken = token;

    const isSecureRequest =
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https' ||
      (!ENV.IS_DEV &&
        ENV.APP_URL.startsWith('https://') &&
        req.hostname !== 'localhost' &&
        req.hostname !== '127.0.0.1');

    res.cookie(SESSION_COOKIE_NAME, signToken(token), {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureRequest,
      maxAge: 60 * 60 * 1000, // 1 hour matching Firebase ID token lifetime
      path: '/',
    });

    res.json({ authenticated: true, user: result.user });
  } catch (err) {
    if (source === 'cookie') {
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    }
    const status = err instanceof FirebaseAuthServiceError ? err.statusCode : 500;
    const code = err instanceof FirebaseAuthServiceError ? err.code : 'auth/session-sync-failed';
    const message =
      err instanceof Error ? err.message : 'Unexpected backend error while synchronizing authentication session.';
    console.error(`[POST /api/auth/session] Error (${status} ${code}):`, message);
    res.status(status).json({ error: message, code });
  }
});

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.authUser });
});

authRouter.post('/logout', (req: AuthenticatedRequest, res) => {
  if (req.authUser) {
    logAudit(req.authUser.id, 'user_logout', 'user', req.authUser.id, {}, req.ip);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
});

authRouter.patch('/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.authUser!.id;
  const name = sanitizeText(req.body?.name, 100);
  const phone = sanitizeText(req.body?.phone, 40);
  const company = sanitizeText(req.body?.company, 120);

  if (!name) {
    res.status(400).json({ error: 'Name cannot be empty.' });
    return;
  }

  // Strictly update profile fields ONLY — role and status are immutable from profile endpoints
  db.prepare(`
    UPDATE users SET name = ?, phone = ?, company = ?, updated_at = datetime('now') WHERE id = ?
  `).run(name, phone, company, userId);

  db.prepare(`UPDATE clients SET company_name = ?, phone = ? WHERE user_id = ?`).run(company, phone, userId);
  logAudit(userId, 'profile_updated', 'user', userId, {}, req.ip);

  res.json({ user: loadUserById(userId) });
});

authRouter.post('/delete-account', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  if (user.roles.includes('admin')) {
    res.status(403).json({
      error: 'Administrator accounts cannot be self-deleted from this portal. Update role in Firebase Console first.',
    });
    return;
  }

  const reason = sanitizeText(req.body?.reason, 1000);
  const requestCode = `DEL-${new Date().getFullYear()}-${user.id}-${Date.now().toString(36).toUpperCase()}`;

  db.exec('BEGIN IMMEDIATE;');
  try {
    db.prepare(`
      INSERT INTO data_deletion_requests (request_code, user_id, email, categories_json, notes, delete_account, status)
      VALUES (?, ?, ?, ?, ?, 1, 'Completed')
    `).run(
      requestCode,
      user.id,
      user.email,
      JSON.stringify(['Personal Information', 'Contact Form Data', 'App Usage Logs', 'Full Account']),
      reason || 'Self-service authenticated account deletion'
    );

    const anonymizedEmail = `deleted-${user.id}-${Date.now()}@deleted.local`;
    db.prepare(`
      UPDATE users
      SET name = 'Deleted User',
          email = ?,
          phone = '',
          company = '',
          firebase_uid = NULL,
          is_active = 0,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(anonymizedEmail, user.id);

    db.prepare(`UPDATE clients SET company_name = '', phone = '', address = '', notes = '' WHERE user_id = ?`).run(user.id);
    db.prepare(`DELETE FROM notifications WHERE user_id = ?`).run(user.id);
    db.exec('COMMIT;');
  } catch (err) {
    try {
      db.exec('ROLLBACK;');
    } catch {
      // Ignore rollback error
    }
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Unable to process account deletion.',
    });
    return;
  }

  let firebaseResult = { rtdbDeleted: false, authDeleted: false };
  if (user.firebaseUid) {
    firebaseResult = await deleteFirebaseUserAccount(user.firebaseUid);
  }

  notifyAdmins(
    'data_deletion_completed',
    `Account Deleted: ${requestCode}`,
    `User #${user.id} completed self-service account deletion.`,
    '/admin'
  );
  logAudit(user.id, 'account_self_deleted', 'user', user.id, { requestCode, ...firebaseResult }, req.ip);

  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({
    ok: true,
    requestCode,
    status: 'Completed',
    firebaseDeleted: firebaseResult.authDeleted,
  });
});
