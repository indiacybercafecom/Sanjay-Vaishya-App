import { Router } from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { db } from '../db/database.ts';
import { UPLOADS_DIR, isRazorpayConfigured } from '../config/env.ts';
import {
  type AuthenticatedRequest,
  rateLimit,
  sanitizeText,
  notifyAdmins,
  logAudit,
} from '../middleware/auth.ts';
import { sendRealtimeNotification } from '../ws/realtime.ts';

export const publicRouter = Router();

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '').slice(0, 10);
      cb(null, `${Date.now()}-${crypto.randomBytes(12).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 3 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Allowed: PDF, PNG, JPG, WEBP, TXT, ZIP, DOCX.'));
    }
  },
});

const inquiryRateLimit = rateLimit(10 * 60 * 1000, 12);

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

publicRouter.get('/bootstrap', (_req, res) => {
  const services = db
    .prepare('SELECT * FROM services WHERE is_published = 1 ORDER BY sort_order ASC, id ASC')
    .all()
    .map((s: Record<string, unknown>) => ({
      ...s,
      features: safeParseJson<string[]>(String(s.features_json || '[]'), []),
      technologies: safeParseJson<string[]>(String(s.technologies_json || '[]'), []),
      useCases: safeParseJson<string[]>(String(s.use_cases_json || '[]'), []),
    }));

  const portfolio = db
    .prepare('SELECT * FROM portfolio_projects WHERE is_published = 1 ORDER BY id DESC')
    .all()
    .map((p: Record<string, unknown>) => ({
      ...p,
      technologies: safeParseJson<string[]>(String(p.technologies_json || '[]'), []),
      screenshots: safeParseJson<string[]>(String(p.screenshots_json || '[]'), []),
    }));

  const team = db
    .prepare('SELECT * FROM team_members WHERE is_active = 1 ORDER BY is_founder DESC, display_order ASC, id ASC')
    .all()
    .map((m: Record<string, unknown>) => ({
      id: m.id,
      name: m.name,
      designation: m.designation,
      roleCategory: m.role_category,
      bio: m.bio,
      avatarUrl: m.avatar_url,
      skills: safeParseJson<string[]>(String(m.skills_json || '[]'), []),
      responsibilities: safeParseJson<string[]>(String(m.responsibilities_json || '[]'), []),
      portfolioLinks: safeParseJson<{ label: string; url: string }[]>(String(m.portfolio_links_json || '[]'), []),
      isFounder: Boolean(m.is_founder),
    }));

  const blogPosts = db
    .prepare('SELECT * FROM blog_posts WHERE is_published = 1 ORDER BY id DESC')
    .all();

  const reviews = db
    .prepare('SELECT id, author_name, author_role, rating, comment, created_at FROM reviews WHERE is_published = 1 ORDER BY id DESC')
    .all();

  const settingsRows = db.prepare('SELECT key, value_json FROM application_settings').all() as {
    key: string;
    value_json: string;
  }[];
  const settings: Record<string, unknown> = {};
  for (const row of settingsRows) {
    settings[row.key] = safeParseJson(row.value_json, row.value_json);
  }

  res.json({
    services,
    portfolio,
    team,
    blogPosts,
    reviews,
    settings,
    razorpayConfigured: isRazorpayConfigured(),
  });
});

publicRouter.post(
  '/inquiries',
  inquiryRateLimit,
  upload.array('attachments', 3),
  (req: AuthenticatedRequest, res) => {
    const clientName = sanitizeText(req.body?.clientName, 100);
    const email = sanitizeText(req.body?.email, 160).toLowerCase();
    const phone = sanitizeText(req.body?.phone, 40);
    const company = sanitizeText(req.body?.company, 120);
    const projectTitle = sanitizeText(req.body?.projectTitle, 160);
    const category = sanitizeText(req.body?.category, 80);
    const description = sanitizeText(req.body?.description, 4000);
    const requiredFeatures = sanitizeText(req.body?.requiredFeatures, 2000);
    const preferredTech = sanitizeText(req.body?.preferredTech, 400);
    const budgetRange = sanitizeText(req.body?.budgetRange, 100);
    const timeline = sanitizeText(req.body?.timeline, 100);
    const referenceUrls = sanitizeText(req.body?.referenceUrls, 500);

    if (!clientName || !email || !email.includes('@') || !phone || !projectTitle || !category || !description || !budgetRange || !timeline) {
      res.status(400).json({ error: 'Please complete all required project inquiry fields.' });
      return;
    }

    // Duplicate inquiry prevention within 10 minutes
    const duplicate = db.prepare(`
      SELECT inquiry_code FROM inquiries
      WHERE lower(email) = ? AND lower(project_title) = ?
      AND datetime(created_at) >= datetime('now', '-10 minutes')
      LIMIT 1
    `).get(email, projectTitle.toLowerCase()) as { inquiry_code: string } | undefined;

    if (duplicate) {
      res.status(409).json({
        error: `A matching inquiry (${duplicate.inquiry_code}) was already submitted recently.`,
      });
      return;
    }

    const inquiryCode = `INQ-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const clientUserId = req.authUser?.id || null;

    const result = db.prepare(`
      INSERT INTO inquiries (
        inquiry_code, client_user_id, client_name, email, phone, company,
        project_title, category, description, required_features, preferred_tech,
        budget_range, timeline, reference_urls, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')
    `).run(
      inquiryCode,
      clientUserId,
      clientName,
      email,
      phone,
      company,
      projectTitle,
      category,
      description,
      requiredFeatures,
      preferredTech,
      budgetRange,
      timeline,
      referenceUrls
    );

    const inquiryId = Number(result.lastInsertRowid);
    const files = (req.files as Express.Multer.File[] | undefined) || [];
    for (const file of files) {
      db.prepare(`
        INSERT INTO attachments (owner_user_id, inquiry_id, original_name, stored_name, mime_type, size_bytes, visibility)
        VALUES (?, ?, ?, ?, ?, ?, 'private')
      `).run(clientUserId, inquiryId, file.originalname, file.filename, file.mimetype, file.size);
    }

    const adminIds = notifyAdmins(
      'inquiry_new',
      `New Inquiry: ${inquiryCode}`,
      `${clientName} submitted "${projectTitle}" (${category}).`,
      '/admin'
    );
    for (const adminId of adminIds) {
      sendRealtimeNotification(adminId, {
        type: 'inquiry_new',
        title: `New Inquiry: ${inquiryCode}`,
        message: `${clientName} submitted "${projectTitle}".`,
      });
    }

    logAudit(clientUserId, 'inquiry_submitted', 'inquiry', inquiryCode, { email, category }, req.ip);

    res.status(201).json({
      inquiryId,
      inquiryCode,
      status: 'New',
    });
  }
);
