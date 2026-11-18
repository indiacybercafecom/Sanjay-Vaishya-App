import { Router } from 'express';
import { db } from '../db/database.ts';
import { ENV } from '../config/env.ts';
import {
  type AuthenticatedRequest,
  SESSION_COOKIE_NAME,
  signToken,
  loadUserById,
  requireAuth,
  sanitizeText,
  logAudit,
  authenticateFirebaseIdToken,
} from '../middleware/auth.ts';

export const authRouter = Router();

// Synchronizes verified Firebase ID token into an HttpOnly cookie for direct attachment downloads & WebSockets
authRouter.post('/session', requireAuth, async (req: AuthenticatedRequest, res) => {
  const submittedName = sanitizeText(req.body?.name, 120);
  if (req.firebaseIdToken && submittedName) {
    try {
      const refreshed = await authenticateFirebaseIdToken(req.firebaseIdToken, { name: submittedName });
      if (refreshed?.user) {
        req.authUser = refreshed.user;
      }
    } catch {
      // Proceed with authenticated session user
    }
  }

  const isSecureRequest =
    req.secure || req.headers['x-forwarded-proto'] === 'https' || (!ENV.IS_DEV && ENV.APP_URL.startsWith('https://') && req.hostname !== 'localhost' && req.hostname !== '127.0.0.1');

  if (req.firebaseIdToken) {
    res.cookie(SESSION_COOKIE_NAME, signToken(req.firebaseIdToken), {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecureRequest,
      maxAge: 60 * 60 * 1000, // 1 hour matching Firebase ID token lifetime
      path: '/',
    });
  }
  res.json({ user: req.authUser });
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
