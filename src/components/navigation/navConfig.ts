import type { UserRole } from '../../types/platform';

export type AdminModule =
  | 'overview'
  | 'inquiries'
  | 'clients'
  | 'projects'
  | 'team'
  | 'tasks'
  | 'services'
  | 'portfolio'
  | 'proposals'
  | 'payments'
  | 'invoices'
  | 'communication'
  | 'notifications'
  | 'blog'
  | 'reviews'
  | 'analytics'
  | 'users'
  | 'settings'
  | 'audit';

export const ACCOUNT_PREFIXES = [
  '/dashboard',
  '/projects',
  '/messages',
  '/proposals',
  '/payments',
  '/notifications',
  '/profile',
  '/settings',
  '/admin',
];

export function isWorkspaceRoute(pathname: string): boolean {
  return ACCOUNT_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isAdminOrPm(roles: UserRole[] | undefined): boolean {
  return Boolean(roles?.some((r) => r === 'admin' || r === 'project_manager'));
}

export const ADMIN_MAIN_MODULES: { id: AdminModule; label: string }[] = [
  { id: 'overview', label: 'Home' },
  { id: 'inquiries', label: 'Inquiries' },
  { id: 'projects', label: 'Projects' },
  { id: 'team', label: 'Team' },
  { id: 'clients', label: 'Clients' },
];

export const ADMIN_MORE_MODULES: { id: AdminModule; label: string; adminOnly?: boolean }[] = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'services', label: 'Services', adminOnly: true },
  { id: 'portfolio', label: 'Portfolio', adminOnly: true },
  { id: 'proposals', label: 'Proposals' },
  { id: 'payments', label: 'Payments' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'communication', label: 'Messages' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'blog', label: 'Blog & Guides', adminOnly: true },
  { id: 'reviews', label: 'Reviews', adminOnly: true },
  { id: 'analytics', label: 'Analytics' },
  { id: 'users', label: 'User Management', adminOnly: true },
  { id: 'settings', label: 'Settings', adminOnly: true },
  { id: 'audit', label: 'Audit Logs', adminOnly: true },
];
