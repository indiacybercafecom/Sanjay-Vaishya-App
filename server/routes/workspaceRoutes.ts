import { Router } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { db } from '../db/database.ts';
import { ENV, UPLOADS_DIR, isRazorpayConfigured } from '../config/env.ts';
import { updateFirebaseUserNodeAsAdmin } from '../firebase/admin.ts';
import {
  type AuthenticatedRequest,
  type UserRole,
  requireAuth,
  requireRole,
  sanitizeText,
  logAudit,
  createNotification,
  notifyAdmins,
} from '../middleware/auth.ts';
import {
  canUserAccessConversation,
  broadcastToConversation,
  sendRealtimeNotification,
} from '../ws/realtime.ts';

export const workspaceRouter = Router();

const ALLOWED_MIME = new Set([
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
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported attachment type.'));
  },
});

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isTeamStaff(user: NonNullable<AuthenticatedRequest['authUser']>): boolean {
  return user.roles.some((r) => ['admin', 'project_manager', 'developer', 'designer'].includes(r));
}

function canAccessProject(user: NonNullable<AuthenticatedRequest['authUser']>, projectId: number): boolean {
  const project = db.prepare(`
    SELECT id, client_user_id, manager_user_id FROM projects WHERE id = ?
  `).get(projectId) as { id: number; client_user_id: number; manager_user_id: number | null } | undefined;

  if (!project) return false;
  if (user.roles.includes('admin')) return true;
  if (project.manager_user_id === user.id) return true;
  if (project.client_user_id === user.id) return true;

  const member = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, user.id);
  return Boolean(member);
}

function ensureProjectConversations(projectId: number, title: string, clientUserId: number, managerUserId: number | null): void {
  db.prepare(`
    INSERT OR IGNORE INTO conversations (project_id, channel_type, title)
    VALUES (?, 'client_team', ?)
  `).run(projectId, `${title} — Client & Team`);

  db.prepare(`
    INSERT OR IGNORE INTO conversations (project_id, channel_type, title)
    VALUES (?, 'internal_team', ?)
  `).run(projectId, `${title} — Internal Team`);

  const clientConvo = db
    .prepare(`SELECT id FROM conversations WHERE project_id = ? AND channel_type = 'client_team'`)
    .get(projectId) as { id: number } | undefined;
  const internalConvo = db
    .prepare(`SELECT id FROM conversations WHERE project_id = ? AND channel_type = 'internal_team'`)
    .get(projectId) as { id: number } | undefined;

  if (clientConvo) {
    db.prepare(`INSERT OR IGNORE INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`).run(
      clientConvo.id,
      clientUserId
    );
    if (managerUserId) {
      db.prepare(`INSERT OR IGNORE INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`).run(
        clientConvo.id,
        managerUserId
      );
    }
  }
  if (internalConvo && managerUserId) {
    db.prepare(`INSERT OR IGNORE INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`).run(
      internalConvo.id,
      managerUserId
    );
  }
}

function computeProjectProgress(projectId: number): number {
  const ms = db.prepare('SELECT status FROM milestones WHERE project_id = ?').all(projectId) as { status: string }[];
  if (ms.length > 0) {
    const completed = ms.filter((m) => m.status === 'completed').length;
    return Math.round((completed / ms.length) * 100);
  }
  const tasks = db.prepare('SELECT status FROM tasks WHERE project_id = ?').all(projectId) as { status: string }[];
  if (tasks.length > 0) {
    const done = tasks.filter((t) => t.status === 'done').length;
    return Math.round((done / tasks.length) * 100);
  }
  return 0;
}

// ---------- WORKSPACE OVERVIEW ----------
workspaceRouter.get('/workspace/overview', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;

  if (user.roles.includes('admin') || user.roles.includes('project_manager')) {
    const totalClients = (db.prepare(`SELECT COUNT(DISTINCT user_id) as cnt FROM user_roles WHERE role = 'client'`).get() as { cnt: number }).cnt;
    const activeProjects = (db.prepare(`SELECT COUNT(*) as cnt FROM projects WHERE status NOT IN ('Completed', 'Delivered', 'Cancelled')`).get() as { cnt: number }).cnt;
    const totalProjects = (db.prepare(`SELECT COUNT(*) as cnt FROM projects`).get() as { cnt: number }).cnt;
    const openInquiries = (db.prepare(`SELECT COUNT(*) as cnt FROM inquiries WHERE status IN ('New', 'Under Review', 'Discussion')`).get() as { cnt: number }).cnt;
    const pendingProposals = (db.prepare(`SELECT COUNT(*) as cnt FROM proposals WHERE status IN ('sent', 'viewed', 'revision_requested')`).get() as { cnt: number }).cnt;
    const collectedRevenue = (db.prepare(`SELECT COALESCE(SUM(amount_inr), 0) as total FROM payments WHERE status = 'successful'`).get() as { total: number }).total;
    const pendingPayments = (db.prepare(`SELECT COALESCE(SUM(amount_inr), 0) as total FROM payments WHERE status = 'pending'`).get() as { total: number }).total;
    const unreadNotifications = (db.prepare(`SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0`).get(user.id) as { cnt: number }).cnt;
    const recentActivities = db
      .prepare(`
        SELECT a.id, a.action, a.entity_type, a.entity_id, a.created_at, u.name as actor_name
        FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
        ORDER BY a.id DESC LIMIT 10
      `)
      .all();

    res.json({
      role: user.primaryRole,
      metrics: {
        totalClients,
        activeProjects,
        totalProjects,
        openInquiries,
        pendingProposals,
        collectedRevenue,
        pendingPayments,
        unreadNotifications,
      },
      recentActivities,
      razorpayConfigured: isRazorpayConfigured(),
    });
    return;
  }

  if (isTeamStaff(user)) {
    const assignedProjects = db.prepare(`
      SELECT DISTINCT p.id FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.manager_user_id = ? OR pm.user_id = ?
    `).all(user.id, user.id) as { id: number }[];
    const openTasks = (db.prepare(`SELECT COUNT(*) as cnt FROM tasks WHERE assigned_to_user_id = ? AND status != 'done'`).get(user.id) as { cnt: number }).cnt;
    const unreadNotifications = (db.prepare(`SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0`).get(user.id) as { cnt: number }).cnt;

    res.json({
      role: user.primaryRole,
      metrics: {
        activeProjects: assignedProjects.length,
        openTasks,
        unreadNotifications,
      },
      razorpayConfigured: isRazorpayConfigured(),
    });
    return;
  }

  // Client metrics strictly scoped to this client
  const myProjects = db.prepare(`SELECT id, title, status FROM projects WHERE client_user_id = ?`).all(user.id) as {
    id: number;
    title: string;
    status: string;
  }[];
  const pendingProposals = (db.prepare(`SELECT COUNT(*) as cnt FROM proposals WHERE client_user_id = ? AND status IN ('sent', 'viewed')`).get(user.id) as { cnt: number }).cnt;
  const pendingPayments = (db.prepare(`SELECT COALESCE(SUM(amount_inr), 0) as total FROM payments WHERE client_user_id = ? AND status = 'pending'`).get(user.id) as { total: number }).total;
  const myInquiries = (db.prepare(`SELECT COUNT(*) as cnt FROM inquiries WHERE client_user_id = ? OR lower(email) = ?`).get(user.id, user.email) as { cnt: number }).cnt;
  const unreadNotifications = (db.prepare(`SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0`).get(user.id) as { cnt: number }).cnt;

  const upcomingMilestones = db.prepare(`
    SELECT m.id, m.title, m.due_date, m.status, m.amount_inr, p.title as project_title, p.id as project_id
    FROM milestones m
    JOIN projects p ON p.id = m.project_id
    WHERE p.client_user_id = ? AND m.status != 'completed'
    ORDER BY m.due_date ASC LIMIT 5
  `).all(user.id);

  res.json({
    role: 'client',
    metrics: {
      activeProjects: myProjects.filter((p) => !['Completed', 'Delivered', 'Cancelled'].includes(p.status)).length,
      totalProjects: myProjects.length,
      pendingProposals,
      pendingPayments,
      myInquiries,
      unreadNotifications,
    },
    upcomingMilestones,
    razorpayConfigured: isRazorpayConfigured(),
  });
});

// ---------- INQUIRIES ----------
workspaceRouter.get('/workspace/inquiries', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  let rows;
  if (user.roles.includes('admin') || user.roles.includes('project_manager')) {
    rows = db.prepare('SELECT * FROM inquiries ORDER BY id DESC').all();
  } else {
    rows = db
      .prepare('SELECT id, inquiry_code, client_name, email, phone, company, project_title, category, description, required_features, preferred_tech, budget_range, timeline, reference_urls, status, created_at, updated_at FROM inquiries WHERE client_user_id = ? OR lower(email) = ? ORDER BY id DESC')
      .all(user.id, user.email);
  }
  res.json({ inquiries: rows });
});

workspaceRouter.patch(
  '/admin/inquiries/:id',
  requireRole('admin', 'project_manager'),
  (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    const status = sanitizeText(req.body?.status, 40);
    const adminNotes = sanitizeText(req.body?.adminNotes, 2000);
    const validStatuses = ['New', 'Under Review', 'Discussion', 'Proposal Sent', 'Accepted', 'Rejected', 'Converted to Project'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid inquiry status.' });
      return;
    }

    db.prepare(`
      UPDATE inquiries SET status = ?, admin_notes = ?, updated_at = datetime('now') WHERE id = ?
    `).run(status, adminNotes, id);

    const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (inquiry?.client_user_id) {
      const nId = createNotification(
        Number(inquiry.client_user_id),
        'inquiry_updated',
        `Inquiry ${inquiry.inquiry_code} Updated`,
        `Status changed to ${status}.`,
        '/dashboard'
      );
      sendRealtimeNotification(Number(inquiry.client_user_id), { id: nId, title: `Inquiry ${inquiry.inquiry_code} Updated` });
    }

    logAudit(req.authUser!.id, 'inquiry_updated', 'inquiry', id, { status }, req.ip);
    res.json({ inquiry });
  }
);

workspaceRouter.post(
  '/admin/inquiries/:id/convert',
  requireRole('admin', 'project_manager'),
  (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    const inquiry = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id) as
      | {
          id: number;
          inquiry_code: string;
          client_user_id: number | null;
          client_name: string;
          email: string;
          phone: string;
          company: string;
          project_title: string;
          description: string;
        }
      | undefined;

    if (!inquiry) {
      res.status(404).json({ error: 'Inquiry not found.' });
      return;
    }

    let clientUserId = inquiry.client_user_id;
    if (!clientUserId) {
      const existingUser = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(inquiry.email.toLowerCase()) as
        | { id: number }
        | undefined;
      if (existingUser) {
        clientUserId = existingUser.id;
      } else {
        // Create relational client record linked cleanly when client registers with Firebase Auth using this email
        const created = db.prepare(`
          INSERT INTO users (name, email, phone, company, password_hash, email_verified, is_active)
          VALUES (?, ?, ?, ?, '', 0, 1)
        `).run(inquiry.client_name, inquiry.email.toLowerCase(), inquiry.phone, inquiry.company);
        clientUserId = Number(created.lastInsertRowid);
        db.prepare(`INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?, 'client')`).run(clientUserId);
        db.prepare(`INSERT OR IGNORE INTO clients (user_id, company_name, phone) VALUES (?, ?, ?)`).run(
          clientUserId,
          inquiry.company,
          inquiry.phone
        );
      }
    }

    const projectCode = `PRJ-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const startDate = sanitizeText(req.body?.startDate, 30) || new Date().toISOString().slice(0, 10);
    const expectedDelivery = sanitizeText(req.body?.expectedDeliveryDate, 30);

    const pRes = db.prepare(`
      INSERT INTO projects (project_code, title, description, client_user_id, manager_user_id, inquiry_id, status, start_date, expected_delivery_date)
      VALUES (?, ?, ?, ?, ?, ?, 'Planning', ?, ?)
    `).run(
      projectCode,
      inquiry.project_title,
      inquiry.description,
      clientUserId,
      req.authUser!.id,
      inquiry.id,
      startDate,
      expectedDelivery
    );

    const projectId = Number(pRes.lastInsertRowid);
    db.prepare(`UPDATE inquiries SET status = 'Converted to Project', client_user_id = ?, updated_at = datetime('now') WHERE id = ?`).run(
      clientUserId,
      inquiry.id
    );
    ensureProjectConversations(projectId, inquiry.project_title, clientUserId, req.authUser!.id);

    createNotification(
      clientUserId,
      'project_created',
      `Project Created: ${projectCode}`,
      `"${inquiry.project_title}" is now active in your project portal.`,
      '/projects'
    );
    logAudit(req.authUser!.id, 'inquiry_converted_to_project', 'project', projectCode, { inquiryId: id }, req.ip);

    res.status(201).json({ projectId, projectCode });
  }
);

// ---------- PROJECTS, MILESTONES, TASKS & UPDATES ----------
workspaceRouter.get('/workspace/projects', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  let rows: Record<string, unknown>[];

  if (user.roles.includes('admin') || user.roles.includes('project_manager')) {
    rows = db.prepare(`
      SELECT p.*, c.name as client_name, c.email as client_email, m.name as manager_name
      FROM projects p
      JOIN users c ON c.id = p.client_user_id
      LEFT JOIN users m ON m.id = p.manager_user_id
      ORDER BY p.id DESC
    `).all() as Record<string, unknown>[];
  } else if (isTeamStaff(user)) {
    rows = db.prepare(`
      SELECT DISTINCT p.*, c.name as client_name, c.email as client_email, m.name as manager_name
      FROM projects p
      JOIN users c ON c.id = p.client_user_id
      LEFT JOIN users m ON m.id = p.manager_user_id
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.manager_user_id = ? OR pm.user_id = ?
      ORDER BY p.id DESC
    `).all(user.id, user.id) as Record<string, unknown>[];
  } else {
    rows = db.prepare(`
      SELECT p.*, c.name as client_name, m.name as manager_name
      FROM projects p
      JOIN users c ON c.id = p.client_user_id
      LEFT JOIN users m ON m.id = p.manager_user_id
      WHERE p.client_user_id = ?
      ORDER BY p.id DESC
    `).all(user.id) as Record<string, unknown>[];
  }

  const enriched = rows.map((p) => {
    const pid = Number(p.id);
    const milestones = db.prepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY sort_order ASC, id ASC').all(pid);
    return {
      ...p,
      progress: computeProjectProgress(pid),
      milestones,
    };
  });

  res.json({ projects: enriched });
});

workspaceRouter.get('/workspace/projects/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const projectId = Number(req.params.id);
  const user = req.authUser!;
  if (!canAccessProject(user, projectId)) {
    res.status(403).json({ error: 'Access denied to this project.' });
    return;
  }

  const project = db.prepare(`
    SELECT p.*, c.name as client_name, c.email as client_email, m.name as manager_name
    FROM projects p
    JOIN users c ON c.id = p.client_user_id
    LEFT JOIN users m ON m.id = p.manager_user_id
    WHERE p.id = ?
  `).get(projectId) as Record<string, unknown>;

  const milestones = db.prepare('SELECT * FROM milestones WHERE project_id = ? ORDER BY sort_order ASC, id ASC').all(projectId);
  const members = db.prepare(`
    SELECT pm.id, pm.user_id, pm.role_label, u.name, u.email
    FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ?
  `).all(projectId);

  const staff = isTeamStaff(user);
  const tasks = staff
    ? db.prepare(`
        SELECT t.*, u.name as assignee_name FROM tasks t
        LEFT JOIN users u ON u.id = t.assigned_to_user_id
        WHERE t.project_id = ? ORDER BY t.id DESC
      `).all(projectId)
    : [];

  // Clients strictly see ONLY 'client' visibility updates
  const updates = staff
    ? db.prepare(`
        SELECT pu.*, u.name as author_name, a.original_name as deliverable_name
        FROM project_updates pu
        JOIN users u ON u.id = pu.author_user_id
        LEFT JOIN attachments a ON a.id = pu.deliverable_attachment_id
        WHERE pu.project_id = ? ORDER BY pu.id DESC
      `).all(projectId)
    : db.prepare(`
        SELECT pu.id, pu.project_id, pu.author_user_id, pu.visibility, pu.title, pu.body,
               pu.deliverable_attachment_id, pu.client_feedback, pu.approved_by_client, pu.created_at,
               u.name as author_name, a.original_name as deliverable_name
        FROM project_updates pu
        JOIN users u ON u.id = pu.author_user_id
        LEFT JOIN attachments a ON a.id = pu.deliverable_attachment_id
        WHERE pu.project_id = ? AND pu.visibility = 'client' ORDER BY pu.id DESC
      `).all(projectId);

  const conversations = staff
    ? db.prepare('SELECT * FROM conversations WHERE project_id = ? ORDER BY id ASC').all(projectId)
    : db.prepare(`SELECT * FROM conversations WHERE project_id = ? AND channel_type = 'client_team'`).all(projectId);

  res.json({
    project: {
      ...project,
      progress: computeProjectProgress(projectId),
    },
    milestones,
    members,
    tasks,
    updates,
    conversations,
  });
});

workspaceRouter.post(
  '/admin/projects',
  requireRole('admin', 'project_manager'),
  (req: AuthenticatedRequest, res) => {
    const title = sanitizeText(req.body?.title, 160);
    const description = sanitizeText(req.body?.description, 4000);
    const clientUserId = Number(req.body?.clientUserId);
    const managerUserId = Number(req.body?.managerUserId || req.authUser!.id);
    const status = sanitizeText(req.body?.status, 40) || 'Planning';
    const startDate = sanitizeText(req.body?.startDate, 30);
    const expectedDeliveryDate = sanitizeText(req.body?.expectedDeliveryDate, 30);

    if (!title || !description || !clientUserId) {
      res.status(400).json({ error: 'Title, description, and client selection are required.' });
      return;
    }

    const clientExists = db.prepare('SELECT id FROM users WHERE id = ?').get(clientUserId) as { id: number } | undefined;
    if (!clientExists) {
      res.status(404).json({ error: 'Selected client account does not exist.' });
      return;
    }

    const projectCode = `PRJ-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const result = db.prepare(`
      INSERT INTO projects (project_code, title, description, client_user_id, manager_user_id, status, start_date, expected_delivery_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(projectCode, title, description, clientUserId, managerUserId, status, startDate, expectedDeliveryDate);

    const projectId = Number(result.lastInsertRowid);
    ensureProjectConversations(projectId, title, clientUserId, managerUserId);

    const nId = createNotification(
      clientUserId,
      'project_created',
      `New Project: ${projectCode}`,
      `"${title}" has been scheduled in your dashboard.`,
      '/projects'
    );
    sendRealtimeNotification(clientUserId, { id: nId, title: `New Project: ${projectCode}` });
    logAudit(req.authUser!.id, 'project_created', 'project', projectCode, { clientUserId }, req.ip);

    res.status(201).json({ id: projectId, projectCode });
  }
);

workspaceRouter.patch(
  '/admin/projects/:id',
  requireRole('admin', 'project_manager'),
  (req: AuthenticatedRequest, res) => {
    const projectId = Number(req.params.id);
    const status = sanitizeText(req.body?.status, 40);
    const managerUserId = req.body?.managerUserId ? Number(req.body.managerUserId) : null;
    const expectedDeliveryDate = sanitizeText(req.body?.expectedDeliveryDate, 30);

    const valid = ['Inquiry', 'Planning', 'Proposal', 'Approved', 'In Progress', 'Review', 'Testing', 'Completed', 'Delivered', 'On Hold', 'Cancelled'];
    if (status && !valid.includes(status)) {
      res.status(400).json({ error: 'Invalid project status.' });
      return;
    }

    const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as Record<string, unknown> | undefined;
    if (!existing) {
      res.status(404).json({ error: 'Project not found.' });
      return;
    }

    db.prepare(`
      UPDATE projects
      SET status = COALESCE(NULLIF(?, ''), status),
          manager_user_id = COALESCE(?, manager_user_id),
          expected_delivery_date = COALESCE(NULLIF(?, ''), expected_delivery_date),
          updated_at = datetime('now')
      WHERE id = ?
    `).run(status, managerUserId, expectedDeliveryDate, projectId);

    if (status === 'Completed' || status === 'Delivered') {
      createNotification(
        Number(existing.client_user_id),
        'project_completed',
        `Project ${existing.project_code} ${status}`,
        `"${existing.title}" status is now ${status}.`,
        '/projects'
      );
    }

    logAudit(req.authUser!.id, 'project_updated', 'project', projectId, { status }, req.ip);
    res.json({ ok: true });
  }
);

workspaceRouter.post(
  '/workspace/projects/:id/members',
  requireRole('admin', 'project_manager'),
  (req: AuthenticatedRequest, res) => {
    const projectId = Number(req.params.id);
    const userId = Number(req.body?.userId);
    const roleLabel = sanitizeText(req.body?.roleLabel, 60) || 'Developer';

    db.prepare(`INSERT OR REPLACE INTO project_members (project_id, user_id, role_label) VALUES (?, ?, ?)`).run(
      projectId,
      userId,
      roleLabel
    );

    const convos = db.prepare('SELECT id FROM conversations WHERE project_id = ?').all(projectId) as { id: number }[];
    for (const c of convos) {
      db.prepare(`INSERT OR IGNORE INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`).run(c.id, userId);
    }

    createNotification(userId, 'project_assigned', 'Project Assignment', `You were assigned to project #${projectId} as ${roleLabel}.`, '/projects');
    logAudit(req.authUser!.id, 'project_member_assigned', 'project', projectId, { userId, roleLabel }, req.ip);
    res.status(201).json({ ok: true });
  }
);

// Milestones
workspaceRouter.post(
  '/workspace/projects/:id/milestones',
  requireRole('admin', 'project_manager'),
  (req: AuthenticatedRequest, res) => {
    const projectId = Number(req.params.id);
    const title = sanitizeText(req.body?.title, 160);
    const description = sanitizeText(req.body?.description, 1000);
    const dueDate = sanitizeText(req.body?.dueDate, 30);
    const amountInr = Math.max(0, Number(req.body?.amountInr || 0));

    if (!title) {
      res.status(400).json({ error: 'Milestone title is required.' });
      return;
    }

    const r = db.prepare(`
      INSERT INTO milestones (project_id, title, description, due_date, amount_inr)
      VALUES (?, ?, ?, ?, ?)
    `).run(projectId, title, description, dueDate, amountInr);

    const project = db.prepare('SELECT client_user_id, title FROM projects WHERE id = ?').get(projectId) as
      | { client_user_id: number; title: string }
      | undefined;
    if (project) {
      createNotification(
        project.client_user_id,
        'milestone_created',
        `Milestone Added: ${title}`,
        `A new milestone was added to "${project.title}".`,
        '/projects'
      );
    }
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  }
);

workspaceRouter.patch('/workspace/milestones/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const milestoneId = Number(req.params.id);
  const user = req.authUser!;
  const ms = db.prepare(`
    SELECT m.*, p.client_user_id, p.manager_user_id, p.title as project_title
    FROM milestones m JOIN projects p ON p.id = m.project_id WHERE m.id = ?
  `).get(milestoneId) as { id: number; project_id: number; title: string; status: string; client_user_id: number; project_title: string } | undefined;

  if (!ms || !canAccessProject(user, ms.project_id)) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  const nextStatus = sanitizeText(req.body?.status, 30);
  if (!['pending', 'in_progress', 'review', 'completed'].includes(nextStatus)) {
    res.status(400).json({ error: 'Invalid milestone status.' });
    return;
  }

  // Clients can only approve a milestone currently in 'review' into 'completed'
  if (user.primaryRole === 'client' && (ms.status !== 'review' || nextStatus !== 'completed')) {
    res.status(403).json({ error: 'Clients can only approve milestones that are in review status.' });
    return;
  }

  db.prepare('UPDATE milestones SET status = ? WHERE id = ?').run(nextStatus, milestoneId);
  createNotification(
    ms.client_user_id,
    'milestone_updated',
    `Milestone Updated: ${ms.title}`,
    `Milestone on "${ms.project_title}" is now ${nextStatus}.`,
    '/projects'
  );
  logAudit(user.id, 'milestone_updated', 'milestone', milestoneId, { nextStatus }, req.ip);
  res.json({ ok: true, progress: computeProjectProgress(ms.project_id) });
});

// Tasks
workspaceRouter.post(
  '/workspace/projects/:id/tasks',
  requireRole('admin', 'project_manager'),
  (req: AuthenticatedRequest, res) => {
    const projectId = Number(req.params.id);
    const title = sanitizeText(req.body?.title, 160);
    const description = sanitizeText(req.body?.description, 2000);
    const assignedToUserId = req.body?.assignedToUserId ? Number(req.body.assignedToUserId) : null;
    const priority = sanitizeText(req.body?.priority, 20) || 'medium';
    const dueDate = sanitizeText(req.body?.dueDate, 30);
    const milestoneId = req.body?.milestoneId ? Number(req.body.milestoneId) : null;

    if (!title) {
      res.status(400).json({ error: 'Task title is required.' });
      return;
    }

    const r = db.prepare(`
      INSERT INTO tasks (project_id, milestone_id, title, description, assigned_to_user_id, priority, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(projectId, milestoneId, title, description, assignedToUserId, priority, dueDate);

    if (assignedToUserId) {
      const nId = createNotification(assignedToUserId, 'task_assigned', `Task Assigned: ${title}`, `Assigned on project #${projectId}.`, '/projects');
      sendRealtimeNotification(assignedToUserId, { id: nId, title: `Task Assigned: ${title}` });
    }
    res.status(201).json({ id: Number(r.lastInsertRowid) });
  }
);

workspaceRouter.patch('/workspace/tasks/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const taskId = Number(req.params.id);
  const user = req.authUser!;
  if (!isTeamStaff(user)) {
    res.status(403).json({ error: 'Only team members can update tasks.' });
    return;
  }

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as { id: number; project_id: number } | undefined;
  if (!task || !canAccessProject(user, task.project_id)) {
    res.status(403).json({ error: 'Access denied to this task.' });
    return;
  }

  const status = sanitizeText(req.body?.status, 30);
  const internalNotes = req.body?.internalNotes !== undefined ? sanitizeText(req.body.internalNotes, 2000) : undefined;

  if (status && !['todo', 'in_progress', 'review', 'done'].includes(status)) {
    res.status(400).json({ error: 'Invalid task status.' });
    return;
  }

  db.prepare(`
    UPDATE tasks
    SET status = COALESCE(NULLIF(?, ''), status),
        internal_notes = COALESCE(?, internal_notes),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(status, internalNotes ?? null, taskId);

  logAudit(user.id, 'task_updated', 'task', taskId, { status }, req.ip);
  res.json({ ok: true, progress: computeProjectProgress(task.project_id) });
});

// Project Updates & Deliverables
workspaceRouter.post(
  '/workspace/projects/:id/updates',
  requireAuth,
  upload.single('deliverable'),
  (req: AuthenticatedRequest, res) => {
    const projectId = Number(req.params.id);
    const user = req.authUser!;
    if (!isTeamStaff(user) || !canAccessProject(user, projectId)) {
      res.status(403).json({ error: 'Authorized team access required.' });
      return;
    }

    const title = sanitizeText(req.body?.title, 160);
    const body = sanitizeText(req.body?.body, 4000);
    const visibility = req.body?.visibility === 'internal' ? 'internal' : 'client';

    if (!title || !body) {
      res.status(400).json({ error: 'Update title and details are required.' });
      return;
    }

    let attachmentId: number | null = null;
    if (req.file) {
      const att = db.prepare(`
        INSERT INTO attachments (owner_user_id, project_id, original_name, stored_name, mime_type, size_bytes, visibility)
        VALUES (?, ?, ?, ?, ?, ?, 'private')
      `).run(user.id, projectId, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size);
      attachmentId = Number(att.lastInsertRowid);
    }

    const r = db.prepare(`
      INSERT INTO project_updates (project_id, author_user_id, visibility, title, body, deliverable_attachment_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(projectId, user.id, visibility, title, body, attachmentId);

    if (visibility === 'client') {
      const project = db.prepare('SELECT client_user_id FROM projects WHERE id = ?').get(projectId) as { client_user_id: number } | undefined;
      if (project) {
        const nId = createNotification(
          project.client_user_id,
          attachmentId ? 'deliverable_submitted' : 'project_update',
          attachmentId ? `Deliverable Submitted: ${title}` : `Project Update: ${title}`,
          body.slice(0, 140),
          '/projects'
        );
        sendRealtimeNotification(project.client_user_id, { id: nId, title });
      }
    }

    res.status(201).json({ id: Number(r.lastInsertRowid) });
  }
);

workspaceRouter.post('/workspace/updates/:id/feedback', requireAuth, (req: AuthenticatedRequest, res) => {
  const updateId = Number(req.params.id);
  const user = req.authUser!;
  const feedback = sanitizeText(req.body?.feedback, 2000);
  const approve = Boolean(req.body?.approve);

  const row = db.prepare(`
    SELECT pu.*, p.client_user_id, p.title as project_title
    FROM project_updates pu JOIN projects p ON p.id = pu.project_id
    WHERE pu.id = ? AND pu.visibility = 'client'
  `).get(updateId) as { id: number; client_user_id: number; title: string; project_title: string } | undefined;

  if (!row || (row.client_user_id !== user.id && !user.roles.includes('admin'))) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  db.prepare(`UPDATE project_updates SET client_feedback = ?, approved_by_client = ? WHERE id = ?`).run(
    feedback,
    approve ? 1 : 0,
    updateId
  );

  notifyAdmins(
    'feedback_received',
    `Client Feedback on ${row.project_title}`,
    `${user.name}: ${approve ? 'Approved' : 'Submitted feedback on'} "${row.title}".`,
    '/admin'
  );
  res.json({ ok: true });
});

// ---------- PROPOSALS & QUOTATIONS ----------
workspaceRouter.get('/workspace/proposals', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const rows =
    user.roles.includes('admin') || user.roles.includes('project_manager')
      ? (db.prepare(`
          SELECT pr.*, u.name as client_name, u.email as client_email
          FROM proposals pr JOIN users u ON u.id = pr.client_user_id
          ORDER BY pr.id DESC
        `).all() as Record<string, unknown>[])
      : (db.prepare(`
          SELECT pr.*, u.name as client_name, u.email as client_email
          FROM proposals pr JOIN users u ON u.id = pr.client_user_id
          WHERE pr.client_user_id = ? AND pr.status != 'draft'
          ORDER BY pr.id DESC
        `).all(user.id) as Record<string, unknown>[]);

  const enriched = rows.map((pr) => ({
    ...pr,
    items: db.prepare('SELECT * FROM proposal_items WHERE proposal_id = ? ORDER BY sort_order ASC, id ASC').all(Number(pr.id)),
  }));
  res.json({ proposals: enriched });
});

workspaceRouter.post(
  '/admin/proposals',
  requireRole('admin', 'project_manager'),
  (req: AuthenticatedRequest, res) => {
    const clientUserId = Number(req.body?.clientUserId);
    const inquiryId = req.body?.inquiryId ? Number(req.body.inquiryId) : null;
    const projectId = req.body?.projectId ? Number(req.body.projectId) : null;
    const title = sanitizeText(req.body?.title, 180);
    const scopeSummary = sanitizeText(req.body?.scopeSummary, 4000);
    const timeline = sanitizeText(req.body?.timeline, 120);
    const paymentSchedule = sanitizeText(req.body?.paymentSchedule, 1000);
    const terms = sanitizeText(req.body?.terms, 2000);
    const status = req.body?.sendNow ? 'sent' : 'draft';
    const items = Array.isArray(req.body?.items) ? (req.body.items as { title: string; description?: string; amountInr: number }[]) : [];

    if (!clientUserId || !title || !scopeSummary || items.length === 0) {
      res.status(400).json({ error: 'Client, title, scope summary, and at least one item are required.' });
      return;
    }

    const totalAmount = items.reduce((sum, item) => sum + Math.max(0, Number(item.amountInr || 0)), 0);
    const proposalCode = `PROP-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const r = db.prepare(`
      INSERT INTO proposals (
        proposal_code, inquiry_id, project_id, client_user_id, title,
        scope_summary, timeline, payment_schedule, terms, total_amount_inr, status, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      proposalCode,
      inquiryId,
      projectId,
      clientUserId,
      title,
      scopeSummary,
      timeline,
      paymentSchedule,
      terms,
      totalAmount,
      status,
      req.authUser!.id
    );

    const proposalId = Number(r.lastInsertRowid);
    const insertItem = db.prepare(`
      INSERT INTO proposal_items (proposal_id, title, description, amount_inr, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    items.forEach((item, idx) => {
      insertItem.run(
        proposalId,
        sanitizeText(item.title, 160),
        sanitizeText(item.description || '', 500),
        Math.max(0, Number(item.amountInr || 0)),
        idx + 1
      );
    });

    if (inquiryId && status === 'sent') {
      db.prepare(`UPDATE inquiries SET status = 'Proposal Sent', updated_at = datetime('now') WHERE id = ?`).run(inquiryId);
    }

    if (status === 'sent') {
      const nId = createNotification(
        clientUserId,
        'proposal_received',
        `New Proposal: ${proposalCode}`,
        `"${title}" (INR ${totalAmount.toLocaleString('en-IN')}) is ready for review.`,
        '/proposals'
      );
      sendRealtimeNotification(clientUserId, { id: nId, title: `New Proposal: ${proposalCode}` });
    }

    logAudit(req.authUser!.id, 'proposal_created', 'proposal', proposalCode, { totalAmount, status }, req.ip);
    res.status(201).json({ id: proposalId, proposalCode });
  }
);

workspaceRouter.post('/workspace/proposals/:id/respond', requireAuth, (req: AuthenticatedRequest, res) => {
  const proposalId = Number(req.params.id);
  const user = req.authUser!;
  const action = sanitizeText(req.body?.action, 40);
  const revisionNote = sanitizeText(req.body?.note, 1000);

  const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(proposalId) as
    | {
        id: number;
        proposal_code: string;
        inquiry_id: number | null;
        project_id: number | null;
        client_user_id: number;
        title: string;
        total_amount_inr: number;
        status: string;
      }
    | undefined;

  if (!proposal || (proposal.client_user_id !== user.id && !user.roles.includes('admin'))) {
    res.status(403).json({ error: 'Access denied.' });
    return;
  }

  if (proposal.status === 'draft' && user.primaryRole === 'client') {
    res.status(403).json({ error: 'Draft proposals cannot be acted upon.' });
    return;
  }

  const map: Record<string, string> = {
    view: 'viewed',
    accept: 'accepted',
    revise: 'revision_requested',
    reject: 'rejected',
  };
  const nextStatus = map[action];
  if (!nextStatus) {
    res.status(400).json({ error: 'Invalid proposal response action.' });
    return;
  }

  if (proposal.status === 'accepted') {
    res.status(409).json({ error: 'This proposal has already been accepted.' });
    return;
  }

  db.prepare(`
    UPDATE proposals SET status = ?, client_revision_note = ?, updated_at = datetime('now') WHERE id = ?
  `).run(nextStatus, revisionNote, proposalId);

  if (nextStatus === 'accepted') {
    if (proposal.inquiry_id) {
      db.prepare(`UPDATE inquiries SET status = 'Accepted', updated_at = datetime('now') WHERE id = ?`).run(proposal.inquiry_id);
    }
    // Create an advance payment record in Pending status
    const paymentCode = `PAY-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    db.prepare(`
      INSERT INTO payments (payment_code, project_id, proposal_id, client_user_id, amount_inr, payment_type, status)
      VALUES (?, ?, ?, ?, ?, 'advance', 'pending')
    `).run(paymentCode, proposal.project_id, proposal.id, proposal.client_user_id, proposal.total_amount_inr);

    notifyAdmins(
      'proposal_accepted',
      `Proposal Accepted: ${proposal.proposal_code}`,
      `${user.name} accepted "${proposal.title}".`,
      '/admin'
    );
  } else if (nextStatus === 'revision_requested' || nextStatus === 'rejected') {
    notifyAdmins(
      'proposal_response',
      `Proposal ${nextStatus === 'revision_requested' ? 'Revision' : 'Update'}: ${proposal.proposal_code}`,
      `${user.name} marked proposal as ${nextStatus}.`,
      '/admin'
    );
  }

  logAudit(user.id, `proposal_${nextStatus}`, 'proposal', proposal.proposal_code, { revisionNote }, req.ip);
  res.json({ ok: true, status: nextStatus });
});

// ---------- PAYMENTS & INVOICES (RAZORPAY READY) ----------
workspaceRouter.get('/workspace/payments', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const payments =
    user.roles.includes('admin') || user.roles.includes('project_manager')
      ? db.prepare(`
          SELECT pay.*, u.name as client_name, u.email as client_email, p.title as project_title
          FROM payments pay
          JOIN users u ON u.id = pay.client_user_id
          LEFT JOIN projects p ON p.id = pay.project_id
          ORDER BY pay.id DESC
        `).all()
      : db.prepare(`
          SELECT pay.*, p.title as project_title
          FROM payments pay
          LEFT JOIN projects p ON p.id = pay.project_id
          WHERE pay.client_user_id = ?
          ORDER BY pay.id DESC
        `).all(user.id);

  const invoices =
    user.roles.includes('admin') || user.roles.includes('project_manager')
      ? db.prepare(`
          SELECT inv.*, u.name as client_name, p.title as project_title, pay.payment_code, pay.razorpay_payment_id
          FROM invoices inv
          JOIN users u ON u.id = inv.client_user_id
          JOIN payments pay ON pay.id = inv.payment_id
          LEFT JOIN projects p ON p.id = inv.project_id
          ORDER BY inv.id DESC
        `).all()
      : db.prepare(`
          SELECT inv.*, u.name as client_name, p.title as project_title, pay.payment_code, pay.razorpay_payment_id
          FROM invoices inv
          JOIN users u ON u.id = inv.client_user_id
          JOIN payments pay ON pay.id = inv.payment_id
          LEFT JOIN projects p ON p.id = inv.project_id
          WHERE inv.client_user_id = ?
          ORDER BY inv.id DESC
        `).all(user.id);

  res.json({
    payments,
    invoices,
    razorpayConfigured: isRazorpayConfigured(),
  });
});

workspaceRouter.post(
  '/admin/payments',
  requireRole('admin', 'project_manager'),
  (req: AuthenticatedRequest, res) => {
    const clientUserId = Number(req.body?.clientUserId);
    const projectId = req.body?.projectId ? Number(req.body.projectId) : null;
    const milestoneId = req.body?.milestoneId ? Number(req.body.milestoneId) : null;
    const amountInr = Math.max(1, Number(req.body?.amountInr || 0));
    const paymentType = ['advance', 'milestone', 'balance'].includes(req.body?.paymentType) ? req.body.paymentType : 'milestone';

    if (!clientUserId || !amountInr) {
      res.status(400).json({ error: 'Client and valid INR amount are required.' });
      return;
    }

    const paymentCode = `PAY-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const r = db.prepare(`
      INSERT INTO payments (payment_code, project_id, milestone_id, client_user_id, amount_inr, payment_type, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `).run(paymentCode, projectId, milestoneId, clientUserId, amountInr, paymentType);

    createNotification(
      clientUserId,
      'payment_due',
      `Payment Request: ${paymentCode}`,
      `Payment of INR ${amountInr.toLocaleString('en-IN')} (${paymentType}) is pending.`,
      '/payments'
    );
    res.status(201).json({ id: Number(r.lastInsertRowid), paymentCode });
  }
);

workspaceRouter.post('/payments/razorpay/create-order', requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!isRazorpayConfigured()) {
    res.status(503).json({
      error: 'Razorpay merchant credentials are not configured yet on the server. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET in environment variables.',
    });
    return;
  }

  const paymentId = Number(req.body?.paymentId);
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as
    | { id: number; payment_code: string; client_user_id: number; amount_inr: number; status: string }
    | undefined;

  if (!payment || (payment.client_user_id !== req.authUser!.id && !req.authUser!.roles.includes('admin'))) {
    res.status(403).json({ error: 'Access denied to this payment record.' });
    return;
  }
  if (payment.status === 'successful') {
    res.status(409).json({ error: 'Payment has already been completed.' });
    return;
  }
  if (!Number.isFinite(payment.amount_inr) || payment.amount_inr <= 0) {
    res.status(400).json({ error: 'Invalid payment amount.' });
    return;
  }

  const amountPaise = Math.round(payment.amount_inr * 100);

  try {
    const authHeader = Buffer.from(`${ENV.RAZORPAY_KEY_ID}:${ENV.RAZORPAY_KEY_SECRET}`).toString('base64');
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: payment.payment_code,
      }),
    });

    const data = (await rzpRes.json()) as { id?: string; amount?: number; currency?: string; error?: { description?: string } };
    if (!rzpRes.ok || !data.id) {
      res.status(502).json({ error: data.error?.description || 'Failed to create Razorpay order.' });
      return;
    }

    db.prepare(`UPDATE payments SET razorpay_order_id = ?, status = 'processing', updated_at = datetime('now') WHERE id = ?`).run(
      data.id,
      payment.id
    );

    res.json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency || 'INR',
      keyId: ENV.RAZORPAY_KEY_ID,
      paymentCode: payment.payment_code,
    });
  } catch {
    res.status(502).json({ error: 'Unable to reach Razorpay API.' });
  }
});

workspaceRouter.post('/payments/razorpay/verify', requireAuth, (req: AuthenticatedRequest, res) => {
  if (!isRazorpayConfigured()) {
    res.status(503).json({ error: 'Razorpay is not configured on this server.' });
    return;
  }

  const paymentId = Number(req.body?.paymentId);
  const razorpayOrderId = sanitizeText(req.body?.razorpayOrderId, 120);
  const razorpayPaymentId = sanitizeText(req.body?.razorpayPaymentId, 120);
  const razorpaySignature = sanitizeText(req.body?.razorpaySignature, 200);

  if (!paymentId || !razorpayOrderId || !razorpayPaymentId || !/^[a-f0-9]{64}$/i.test(razorpaySignature)) {
    res.status(400).json({ error: 'Invalid Razorpay verification payload.' });
    return;
  }

  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId) as
    | { id: number; project_id: number | null; client_user_id: number; amount_inr: number; razorpay_order_id: string; status: string }
    | undefined;

  if (!payment || (payment.client_user_id !== req.authUser!.id && !req.authUser!.roles.includes('admin'))) {
    res.status(403).json({ error: 'Access denied to this payment record.' });
    return;
  }
  if (!payment.razorpay_order_id || payment.razorpay_order_id !== razorpayOrderId) {
    res.status(400).json({ error: 'Order reference mismatch.' });
    return;
  }
  if (payment.status === 'successful') {
    res.status(409).json({ error: 'Duplicate payment verification rejected.' });
    return;
  }

  const expectedSignature = crypto
    .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  const sigBuf = Buffer.from(razorpaySignature.toLowerCase(), 'hex');
  const expBuf = Buffer.from(expectedSignature.toLowerCase(), 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    db.prepare(`UPDATE payments SET status = 'failed', updated_at = datetime('now') WHERE id = ?`).run(payment.id);
    logAudit(req.authUser!.id, 'payment_signature_failed', 'payment', payment.id, { razorpayOrderId }, req.ip);
    res.status(400).json({ error: 'Invalid payment signature.' });
    return;
  }

  db.prepare(`
    UPDATE payments
    SET razorpay_payment_id = ?, razorpay_signature = ?, status = 'successful', updated_at = datetime('now')
    WHERE id = ?
  `).run(razorpayPaymentId, razorpaySignature.toLowerCase(), payment.id);

  const invoiceNumber = `INV-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  db.prepare(`
    INSERT OR IGNORE INTO invoices (invoice_number, payment_id, project_id, client_user_id, amount_inr, status)
    VALUES (?, ?, ?, ?, ?, 'issued')
  `).run(invoiceNumber, payment.id, payment.project_id, payment.client_user_id, payment.amount_inr);

  notifyAdmins('payment_received', `Payment Verified: ${invoiceNumber}`, `INR ${payment.amount_inr} received.`, '/admin');
  logAudit(req.authUser!.id, 'payment_verified', 'payment', payment.id, { razorpayPaymentId, invoiceNumber }, req.ip);

  res.json({ ok: true, invoiceNumber });
});

workspaceRouter.post('/payments/razorpay/webhook', (req, res) => {
  if (!ENV.RAZORPAY_WEBHOOK_SECRET) {
    res.status(503).json({ error: 'Razorpay webhook secret not configured.' });
    return;
  }
  const signature = String(req.headers['x-razorpay-signature'] || '').trim();
  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;
  if (!rawBody || !/^[a-f0-9]{64}$/i.test(signature)) {
    res.status(400).json({ error: 'Missing or invalid webhook payload signature.' });
    return;
  }

  const expected = crypto.createHmac('sha256', ENV.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const sigBuf = Buffer.from(signature.toLowerCase(), 'hex');
  const expBuf = Buffer.from(expected.toLowerCase(), 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    res.status(400).json({ error: 'Invalid webhook signature.' });
    return;
  }

  const event = req.body as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  const entity = event.payload?.payment?.entity;

  if (event.event === 'payment.captured' && entity?.order_id && entity?.id) {
    const payment = db.prepare(`SELECT * FROM payments WHERE razorpay_order_id = ?`).get(entity.order_id) as
      | { id: number; project_id: number | null; client_user_id: number; amount_inr: number; status: string }
      | undefined;
    if (payment && payment.status !== 'successful') {
      db.prepare(`UPDATE payments SET razorpay_payment_id = ?, status = 'successful', updated_at = datetime('now') WHERE id = ?`).run(
        entity.id,
        payment.id
      );
      const invoiceNumber = `INV-${new Date().getFullYear()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      db.prepare(`
        INSERT OR IGNORE INTO invoices (invoice_number, payment_id, project_id, client_user_id, amount_inr, status)
        VALUES (?, ?, ?, ?, ?, 'issued')
      `).run(invoiceNumber, payment.id, payment.project_id, payment.client_user_id, payment.amount_inr);
      logAudit(null, 'payment_webhook_captured', 'payment', payment.id, { razorpayPaymentId: entity.id, invoiceNumber }, req.ip);
    }
  } else if (event.event === 'payment.failed' && entity?.order_id) {
    const payment = db.prepare(`SELECT id, status FROM payments WHERE razorpay_order_id = ?`).get(entity.order_id) as
      | { id: number; status: string }
      | undefined;
    if (payment && payment.status !== 'successful') {
      db.prepare(`UPDATE payments SET status = 'failed', updated_at = datetime('now') WHERE id = ?`).run(payment.id);
      logAudit(null, 'payment_webhook_failed', 'payment', payment.id, { orderId: entity.order_id }, req.ip);
    }
  }
  res.json({ received: true });
});

// ---------- PROJECT CHAT & PRIVATE ATTACHMENTS ----------
workspaceRouter.get('/workspace/conversations', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const rows = db.prepare(`
    SELECT c.*, p.project_code, p.title as project_title, p.client_user_id, p.manager_user_id
    FROM conversations c
    JOIN projects p ON p.id = c.project_id
    ORDER BY c.id DESC
  `).all() as { id: number; project_id: number; channel_type: string }[];

  const accessible = rows.filter((c) => canUserAccessConversation(user, c.id));
  res.json({ conversations: accessible });
});

workspaceRouter.get('/workspace/conversations/:id/messages', requireAuth, (req: AuthenticatedRequest, res) => {
  const conversationId = Number(req.params.id);
  const user = req.authUser!;
  if (!canUserAccessConversation(user, conversationId)) {
    res.status(403).json({ error: 'Access denied to this conversation.' });
    return;
  }

  const messages = db.prepare(`
    SELECT m.id, m.conversation_id, m.sender_user_id, m.body, m.attachment_id, m.is_deleted, m.created_at,
           u.name as sender_name, a.original_name as attachment_name, a.mime_type as attachment_mime
    FROM messages m
    JOIN users u ON u.id = m.sender_user_id
    LEFT JOIN attachments a ON a.id = m.attachment_id
    WHERE m.conversation_id = ?
    ORDER BY m.id ASC
  `).all(conversationId);

  db.prepare(`
    INSERT INTO conversation_members (conversation_id, user_id, last_read_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(conversation_id, user_id) DO UPDATE SET last_read_at = datetime('now')
  `).run(conversationId, user.id);

  res.json({ messages });
});

workspaceRouter.post(
  '/workspace/conversations/:id/messages',
  requireAuth,
  upload.single('attachment'),
  (req: AuthenticatedRequest, res) => {
    const conversationId = Number(req.params.id);
    const user = req.authUser!;
    if (!canUserAccessConversation(user, conversationId)) {
      res.status(403).json({ error: 'Access denied to this conversation.' });
      return;
    }

    const body = sanitizeText(req.body?.body, 4000);
    if (!body && !req.file) {
      res.status(400).json({ error: 'Message text or attachment is required.' });
      return;
    }

    const convo = db.prepare('SELECT project_id, channel_type, title FROM conversations WHERE id = ?').get(conversationId) as {
      project_id: number;
      channel_type: string;
      title: string;
    };

    let attachmentId: number | null = null;
    let attachmentName: string | null = null;
    let attachmentMime: string | null = null;

    if (req.file) {
      const att = db.prepare(`
        INSERT INTO attachments (owner_user_id, project_id, original_name, stored_name, mime_type, size_bytes, visibility)
        VALUES (?, ?, ?, ?, ?, ?, 'private')
      `).run(user.id, convo.project_id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size);
      attachmentId = Number(att.lastInsertRowid);
      attachmentName = req.file.originalname;
      attachmentMime = req.file.mimetype;
    }

    const r = db.prepare(`
      INSERT INTO messages (conversation_id, sender_user_id, body, attachment_id)
      VALUES (?, ?, ?, ?)
    `).run(conversationId, user.id, body || '[Attachment]', attachmentId);

    const msgId = Number(r.lastInsertRowid);
    const createdMsg = {
      id: msgId,
      conversation_id: conversationId,
      sender_user_id: user.id,
      sender_name: user.name,
      body: body || '[Attachment]',
      attachment_id: attachmentId,
      attachment_name: attachmentName,
      attachment_mime: attachmentMime,
      is_deleted: 0,
      created_at: new Date().toISOString(),
    };

    broadcastToConversation(conversationId, { event: 'chat:message', data: createdMsg });

    // Notify project stakeholders
    const project = db.prepare('SELECT client_user_id, manager_user_id FROM projects WHERE id = ?').get(convo.project_id) as {
      client_user_id: number;
      manager_user_id: number | null;
    };
    const targets = new Set<number>();
    if (convo.channel_type === 'client_team' && project.client_user_id !== user.id) {
      targets.add(project.client_user_id);
    }
    if (project.manager_user_id && project.manager_user_id !== user.id) {
      targets.add(project.manager_user_id);
    }
    for (const targetId of targets) {
      const nId = createNotification(targetId, 'chat_message', `New Message in ${convo.title}`, `${user.name}: ${createdMsg.body.slice(0, 80)}`, '/messages');
      sendRealtimeNotification(targetId, { id: nId, title: `New Message in ${convo.title}` });
    }

    res.status(201).json({ message: createdMsg });
  }
);

workspaceRouter.delete('/workspace/messages/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const messageId = Number(req.params.id);
  const user = req.authUser!;
  const msg = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId) as
    | { id: number; conversation_id: number; sender_user_id: number }
    | undefined;

  if (!msg) {
    res.status(404).json({ error: 'Message not found.' });
    return;
  }
  if (msg.sender_user_id !== user.id && !user.roles.includes('admin')) {
    res.status(403).json({ error: 'Only the sender or an admin can moderate this message.' });
    return;
  }

  db.prepare(`UPDATE messages SET is_deleted = 1, body = '[Message removed]' WHERE id = ?`).run(messageId);
  broadcastToConversation(msg.conversation_id, { event: 'chat:deleted', data: { id: messageId, conversationId: msg.conversation_id } });
  res.json({ ok: true });
});

workspaceRouter.get('/attachments/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const attId = Number(req.params.id);
  const user = req.authUser!;
  const att = db.prepare('SELECT * FROM attachments WHERE id = ?').get(attId) as
    | {
        id: number;
        owner_user_id: number | null;
        project_id: number | null;
        inquiry_id: number | null;
        original_name: string;
        stored_name: string;
        mime_type: string;
      }
    | undefined;

  if (!att) {
    res.status(404).json({ error: 'Attachment not found.' });
    return;
  }

  let authorized = user.roles.includes('admin') || att.owner_user_id === user.id;
  if (!authorized && att.project_id) {
    authorized = canAccessProject(user, att.project_id);
  }
  if (!authorized && att.inquiry_id && user.roles.includes('project_manager')) {
    authorized = true;
  }

  if (!authorized) {
    res.status(403).json({ error: 'Unauthorized attachment access.' });
    return;
  }

  const fullPath = path.join(UPLOADS_DIR, path.basename(att.stored_name));
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'File missing on storage.' });
    return;
  }

  res.setHeader('Content-Type', att.mime_type);
  res.setHeader('Content-Disposition', `attachment; filename="${att.original_name.replace(/"/g, '')}"`);
  res.sendFile(fullPath);
});

// ---------- NOTIFICATIONS ----------
workspaceRouter.get('/workspace/notifications', requireAuth, (req: AuthenticatedRequest, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 40').all(req.authUser!.id);
  res.json({ notifications: rows });
});

workspaceRouter.patch('/workspace/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.authUser!.id);
  res.json({ ok: true });
});

workspaceRouter.post('/workspace/notifications/read-all', requireAuth, (req: AuthenticatedRequest, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.authUser!.id);
  res.json({ ok: true });
});

// ---------- CLIENT REVIEW SUBMISSION ----------
workspaceRouter.post('/workspace/reviews', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.authUser!;
  const projectId = req.body?.projectId ? Number(req.body.projectId) : null;
  const rating = Math.min(5, Math.max(1, Number(req.body?.rating || 5)));
  const comment = sanitizeText(req.body?.comment, 1000);
  const authorRole = sanitizeText(req.body?.authorRole, 120) || user.company || 'Verified Client';

  if (!comment) {
    res.status(400).json({ error: 'Review comment is required.' });
    return;
  }
  if (projectId && !canAccessProject(user, projectId)) {
    res.status(403).json({ error: 'You cannot review a project outside your account.' });
    return;
  }

  const r = db.prepare(`
    INSERT INTO reviews (client_user_id, project_id, author_name, author_role, rating, comment, is_published)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `).run(user.id, projectId, user.name, authorRole, rating, comment);

  notifyAdmins('review_submitted', 'New Client Review Pending Approval', `${user.name} submitted a ${rating}/5 review.`, '/admin');
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});

// ---------- ADMIN MANAGEMENT ROUTES ----------
workspaceRouter.get('/admin/users', requireRole('admin', 'project_manager'), (_req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.firebase_uid, u.name, u.email, u.phone, u.company, u.is_active, u.created_at,
           GROUP_CONCAT(ur.role) as roles_csv
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    GROUP BY u.id
    ORDER BY u.id DESC
  `).all();
  res.json({ users });
});

workspaceRouter.patch('/admin/users/:id/role', requireRole('admin'), async (req: AuthenticatedRequest, res) => {
  const targetId = Number(req.params.id);
  const role = sanitizeText(req.body?.role, 40) as UserRole;
  const isActive = req.body?.isActive !== undefined ? Boolean(req.body.isActive) : true;
  const validRoles: UserRole[] = ['project_manager', 'developer', 'designer', 'client'];

  if (targetId === req.authUser!.id) {
    res.status(400).json({ error: 'You cannot modify your own administrator role or active status from this panel.' });
    return;
  }

  const targetRow = db.prepare('SELECT id, firebase_uid FROM users WHERE id = ?').get(targetId) as
    | { id: number; firebase_uid: string | null }
    | undefined;
  if (!targetRow) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const targetRoles = db.prepare('SELECT role FROM user_roles WHERE user_id = ?').all(targetId) as { role: UserRole }[];
  const targetIsAdmin = targetRoles.some((r) => r.role === 'admin');

  if (role === 'admin' || targetIsAdmin) {
    res.status(403).json({ error: 'Admin role must only be assigned or modified manually through Firebase Console.' });
    return;
  }

  if (!validRoles.includes(role)) {
    res.status(400).json({ error: 'Invalid staff or client role.' });
    return;
  }

  db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(targetId);
  db.prepare('INSERT INTO user_roles (user_id, role) VALUES (?, ?)').run(targetId, role);
  db.prepare(`UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?`).run(isActive ? 1 : 0, targetId);

  let firebaseSynced = false;
  if (targetRow.firebase_uid) {
    firebaseSynced = await updateFirebaseUserNodeAsAdmin(
      targetRow.firebase_uid,
      { role, status: isActive ? 'active' : 'disabled' },
      req.firebaseIdToken
    );
  }

  logAudit(req.authUser!.id, 'user_role_updated', 'user', targetId, { role, isActive, firebaseSynced }, req.ip);
  res.json({ ok: true, firebaseSynced });
});

// Admin Team Members
workspaceRouter.get('/admin/team', requireRole('admin', 'project_manager'), (_req, res) => {
  const rows = db.prepare('SELECT * FROM team_members ORDER BY is_founder DESC, display_order ASC, id ASC').all();
  res.json({
    team: rows.map((m: Record<string, unknown>) => ({
      ...m,
      skills: safeParseJson<string[]>(String(m.skills_json || '[]'), []),
      responsibilities: safeParseJson<string[]>(String(m.responsibilities_json || '[]'), []),
      portfolioLinks: safeParseJson<{ label: string; url: string }[]>(String(m.portfolio_links_json || '[]'), []),
      isFounder: Boolean(m.is_founder),
      isActive: Boolean(m.is_active),
    })),
  });
});

workspaceRouter.post('/admin/team', requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const name = sanitizeText(req.body?.name, 100);
  const designation = sanitizeText(req.body?.designation, 120);
  const roleCategory = sanitizeText(req.body?.roleCategory, 80);
  const bio = sanitizeText(req.body?.bio, 1000);
  const avatarUrl = sanitizeText(req.body?.avatarUrl, 500);
  const skills = Array.isArray(req.body?.skills) ? req.body.skills : [];
  const responsibilities = Array.isArray(req.body?.responsibilities) ? req.body.responsibilities : [];
  const userId = req.body?.userId ? Number(req.body.userId) : null;

  if (!name || !designation || !roleCategory) {
    res.status(400).json({ error: 'Name, designation, and role category are required.' });
    return;
  }

  const r = db.prepare(`
    INSERT INTO team_members (user_id, name, designation, role_category, bio, avatar_url, skills_json, responsibilities_json, is_founder, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
  `).run(userId, name, designation, roleCategory, bio, avatarUrl, JSON.stringify(skills), JSON.stringify(responsibilities));

  logAudit(req.authUser!.id, 'team_member_added', 'team_member', Number(r.lastInsertRowid), { name, designation }, req.ip);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});

workspaceRouter.patch('/admin/team/:id', requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const isActive = req.body?.isActive !== undefined ? (req.body.isActive ? 1 : 0) : 1;
  const designation = sanitizeText(req.body?.designation, 120);
  const bio = sanitizeText(req.body?.bio, 1000);

  db.prepare(`
    UPDATE team_members
    SET is_active = ?,
        designation = COALESCE(NULLIF(?, ''), designation),
        bio = COALESCE(NULLIF(?, ''), bio)
    WHERE id = ?
  `).run(isActive, designation, bio, id);
  res.json({ ok: true });
});

// Admin Services Management
workspaceRouter.get('/admin/services', requireRole('admin'), (_req, res) => {
  const rows = db.prepare('SELECT * FROM services ORDER BY sort_order ASC, id ASC').all();
  res.json({ services: rows });
});

workspaceRouter.post('/admin/services', requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const title = sanitizeText(req.body?.title, 120);
  const category = sanitizeText(req.body?.category, 80) || title;
  const summary = sanitizeText(req.body?.summary, 400);
  const description = sanitizeText(req.body?.description, 2000);
  const features = Array.isArray(req.body?.features) ? req.body.features : [];
  const technologies = Array.isArray(req.body?.technologies) ? req.body.technologies : [];
  const useCases = Array.isArray(req.body?.useCases) ? req.body.useCases : [];
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomBytes(2).toString('hex')}`;

  if (!title || !summary) {
    res.status(400).json({ error: 'Service title and summary are required.' });
    return;
  }

  const r = db.prepare(`
    INSERT INTO services (slug, category, title, summary, description, features_json, technologies_json, use_cases_json, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `).run(slug, category, title, summary, description || summary, JSON.stringify(features), JSON.stringify(technologies), JSON.stringify(useCases));

  logAudit(req.authUser!.id, 'service_created', 'service', Number(r.lastInsertRowid), { title }, req.ip);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});

workspaceRouter.patch('/admin/services/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const isPublished = req.body?.isPublished !== undefined ? (req.body.isPublished ? 1 : 0) : 1;
  const summary = sanitizeText(req.body?.summary, 400);
  db.prepare(`
    UPDATE services SET is_published = ?, summary = COALESCE(NULLIF(?, ''), summary) WHERE id = ?
  `).run(isPublished, summary, id);
  res.json({ ok: true });
});

// Admin Portfolio Management
workspaceRouter.get('/admin/portfolio', requireRole('admin'), (_req, res) => {
  const rows = db.prepare('SELECT * FROM portfolio_projects ORDER BY id DESC').all();
  res.json({ portfolio: rows });
});

workspaceRouter.post('/admin/portfolio', requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const title = sanitizeText(req.body?.title, 160);
  const category = sanitizeText(req.body?.category, 80);
  const summary = sanitizeText(req.body?.summary, 400);
  const description = sanitizeText(req.body?.description, 4000);
  const challenges = sanitizeText(req.body?.challenges, 2000);
  const solution = sanitizeText(req.body?.solution, 2000);
  const technologies = Array.isArray(req.body?.technologies) ? req.body.technologies : [];
  const liveUrl = sanitizeText(req.body?.liveUrl, 400);
  const githubUrl = sanitizeText(req.body?.githubUrl, 400);
  const isPublished = req.body?.isPublished === false ? 0 : 1;
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomBytes(2).toString('hex')}`;

  if (!title || !category || !summary) {
    res.status(400).json({ error: 'Title, category, and summary are required.' });
    return;
  }

  const r = db.prepare(`
    INSERT INTO portfolio_projects (slug, title, category, summary, description, challenges, solution, technologies_json, live_url, github_url, is_published)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(slug, title, category, summary, description || summary, challenges, solution, JSON.stringify(technologies), liveUrl, githubUrl, isPublished);

  logAudit(req.authUser!.id, 'portfolio_created', 'portfolio', Number(r.lastInsertRowid), { title }, req.ip);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});

workspaceRouter.patch('/admin/portfolio/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const isPublished = req.body?.isPublished ? 1 : 0;
  db.prepare('UPDATE portfolio_projects SET is_published = ? WHERE id = ?').run(isPublished, id);
  res.json({ ok: true });
});

// Admin Blog Management
workspaceRouter.get('/admin/blog', requireRole('admin'), (_req, res) => {
  res.json({ posts: db.prepare('SELECT * FROM blog_posts ORDER BY id DESC').all() });
});

workspaceRouter.post('/admin/blog', requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const title = sanitizeText(req.body?.title, 180);
  const summary = sanitizeText(req.body?.summary, 400);
  const content = sanitizeText(req.body?.content, 8000);
  const category = sanitizeText(req.body?.category, 60) || 'Guides';
  const tag = sanitizeText(req.body?.tag, 60) || 'Engineering';
  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomBytes(2).toString('hex')}`;

  if (!title || !summary) {
    res.status(400).json({ error: 'Blog post title and summary are required.' });
    return;
  }

  const r = db.prepare(`
    INSERT INTO blog_posts (slug, title, summary, content, category, tag, is_published)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `).run(slug, title, summary, content || summary, category, tag);

  logAudit(req.authUser!.id, 'blog_post_created', 'blog_post', Number(r.lastInsertRowid), { title }, req.ip);
  res.status(201).json({ id: Number(r.lastInsertRowid) });
});

// Admin Reviews Moderation
workspaceRouter.get('/admin/reviews', requireRole('admin'), (_req, res) => {
  res.json({ reviews: db.prepare('SELECT * FROM reviews ORDER BY id DESC').all() });
});

workspaceRouter.patch('/admin/reviews/:id', requireRole('admin'), (req, res) => {
  const id = Number(req.params.id);
  const isPublished = req.body?.isPublished ? 1 : 0;
  db.prepare('UPDATE reviews SET is_published = ? WHERE id = ?').run(isPublished, id);
  res.json({ ok: true });
});

// Admin Application Settings & Audit Logs
workspaceRouter.get('/admin/settings', requireRole('admin'), (_req, res) => {
  const rows = db.prepare('SELECT key, value_json, updated_at FROM application_settings').all();
  res.json({ settings: rows });
});

workspaceRouter.put('/admin/settings', requireRole('admin'), (req: AuthenticatedRequest, res) => {
  const updates = req.body?.settings as Record<string, string> | undefined;
  if (!updates || typeof updates !== 'object') {
    res.status(400).json({ error: 'Invalid settings payload.' });
    return;
  }
  const stmt = db.prepare(`
    INSERT INTO application_settings (key, value_json, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = datetime('now')
  `);
  for (const [k, v] of Object.entries(updates)) {
    stmt.run(sanitizeText(k, 80), JSON.stringify(sanitizeText(v, 500)));
  }
  logAudit(req.authUser!.id, 'settings_updated', 'application_settings', 'global', updates, req.ip);
  res.json({ ok: true });
});

workspaceRouter.get('/admin/audit-logs', requireRole('admin'), (_req, res) => {
  const logs = db.prepare(`
    SELECT a.*, u.name as actor_name, u.email as actor_email
    FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
    ORDER BY a.id DESC LIMIT 100
  `).all();
  res.json({ logs });
});
