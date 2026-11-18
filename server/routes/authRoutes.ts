import { Router } from 'express';
import { db } from '../db/database.ts';
import { ENV } from '../config/env.ts';
import { FirebaseAuthServiceError } from '../firebase/admin.ts';
import {
  type AuthenticatedRequest,
  SESSION_COOKIE_NAME,
  signToken,
  loadUserById,
  requireAuth,
  sanitizeText,
  logAudit,
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
    const result = await authenticateFirebaseIdToken(token, submittedName ? { name: submittedName } : undefined);
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
