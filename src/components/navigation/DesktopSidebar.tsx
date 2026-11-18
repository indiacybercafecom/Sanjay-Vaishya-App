import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  FileText,
  CreditCard,
  Bell,
  User,
  Settings,
  Inbox,
  Users,
  UserCog,
  ListTodo,
  Layers,
  Briefcase,
  Receipt,
  BookOpen,
  Star,
  BarChart3,
  ShieldCheck,
  ScrollText,
  ShieldAlert,
  Globe,
  LogOut,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ADMIN_MAIN_MODULES, ADMIN_MORE_MODULES, isAdminOrPm, type AdminModule } from './navConfig';

const ADMIN_ICONS: Record<AdminModule, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  inquiries: Inbox,
  projects: FolderKanban,
  team: UserCog,
  clients: Users,
  tasks: ListTodo,
  services: Layers,
  portfolio: Briefcase,
  proposals: FileText,
  payments: CreditCard,
  invoices: Receipt,
  communication: MessageSquare,
  notifications: Bell,
  blog: BookOpen,
  reviews: Star,
  analytics: BarChart3,
  users: ShieldCheck,
  settings: Settings,
  audit: ScrollText,
};

interface DesktopSidebarProps {
  currentPath: string;
  activeAdminModule: AdminModule;
  onNavigate: (path: string) => void;
  onSelectAdminModule: (mod: AdminModule) => void;
}

export function DesktopSidebar({
  currentPath,
  activeAdminModule,
  onNavigate,
  onSelectAdminModule,
}: DesktopSidebarProps) {
  const { user, unreadCount, logout } = useAuth();
  if (!user) return null;

  const isStaffAdmin = isAdminOrPm(user.roles);
  const isFullAdmin = user.roles.includes('admin');
  const inAdmin = currentPath === '/admin' || currentPath.startsWith('/admin/');

  const clientNav = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'My Projects', icon: FolderKanban },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/proposals', label: 'Proposals', icon: FileText },
    { path: '/payments', label: 'Payments & Invoices', icon: CreditCard },
    { path: '/notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/settings', label: 'Settings & Legal', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 shrink-0 bg-[#13161D] border-r border-[#262B38] min-h-[calc(100dvh-3.5rem)] sticky top-14 self-start max-h-[calc(100dvh-3.5rem)] overflow-y-auto p-3 justify-between">
      <div className="space-y-5">
        {/* Identity Summary */}
        <div className="p-3 rounded-lg bg-[#0B0D11] border border-[#262B38] space-y-1">
          <p className="font-mono text-[10px] text-[#00BFFF] uppercase">
            {user.primaryRole.replace('_', ' ')} PORTAL
          </p>
          <p className="text-sm font-bold text-white truncate">{user.name}</p>
          <p className="text-[11px] text-[#9AA3B5] truncate">{user.email}</p>
        </div>

        {inAdmin && isStaffAdmin ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="px-2 font-mono text-[10px] text-[#9AA3B5] uppercase">Main Operations</p>
              {ADMIN_MAIN_MODULES.map((mod) => {
                const Icon = ADMIN_ICONS[mod.id];
                const active = activeAdminModule === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => onSelectAdminModule(mod.id)}
                    className={`w-full min-h-[40px] px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center gap-2.5 transition-colors ${
                      active
                        ? 'bg-[#1A1E28] text-[#00BFFF] border border-[#00BFFF]/40'
                        : 'text-[#CCCCCC] hover:text-white hover:bg-[#1A1E28]/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{mod.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1 pt-2 border-t border-[#262B38]">
              <p className="px-2 font-mono text-[10px] text-[#9AA3B5] uppercase">More Modules</p>
              {ADMIN_MORE_MODULES.filter((m) => !m.adminOnly || isFullAdmin).map((mod) => {
                const Icon = ADMIN_ICONS[mod.id];
                const active = activeAdminModule === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => onSelectAdminModule(mod.id)}
                    className={`w-full min-h-[38px] px-3 py-1.5 rounded-lg text-left text-xs font-medium flex items-center gap-2.5 transition-colors ${
                      active
                        ? 'bg-[#1A1E28] text-[#00BFFF] border border-[#00BFFF]/40'
                        : 'text-[#CCCCCC] hover:text-white hover:bg-[#1A1E28]/60'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{mod.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="px-2 font-mono text-[10px] text-[#9AA3B5] uppercase">Workspace</p>
            {clientNav.map((item) => {
              const Icon = item.icon;
              const active = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => onNavigate(item.path)}
                  className={`w-full min-h-[40px] px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between gap-2 transition-colors ${
                    active
                      ? 'bg-[#1A1E28] text-[#00BFFF] border border-[#00BFFF]/40'
                      : 'text-[#CCCCCC] hover:text-white hover:bg-[#1A1E28]/60'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && item.badge > 0 ? (
                    <span className="font-mono text-[11px] text-[#ED1C24] tabular-nums">{item.badge}</span>
                  ) : null}
                </button>
              );
            })}

            {isStaffAdmin && (
              <button
                type="button"
                onClick={() => onNavigate('/admin')}
                className="w-full mt-2 min-h-[40px] px-3 py-2 rounded-lg text-left text-xs font-semibold text-[#ED1C24] bg-[#ED1C24]/10 border border-[#ED1C24]/30 hover:bg-[#ED1C24]/20 flex items-center gap-2.5"
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Admin Control Center</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Workspace Utility Links */}
      <div className="pt-4 mt-4 border-t border-[#262B38] space-y-1.5">
        <button
          type="button"
          onClick={() => onNavigate('/start-project')}
          className="w-full min-h-[38px] px-3 py-2 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>New Project Request</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="w-full min-h-[38px] px-3 py-2 rounded-lg text-xs text-[#CCCCCC] hover:text-white hover:bg-[#1A1E28] flex items-center gap-2"
        >
          <Globe className="w-4 h-4 shrink-0 text-[#00BFFF]" />
          <span>Explore Public Platform</span>
        </button>
        <button
          type="button"
          onClick={async () => {
            await logout();
            onNavigate('/');
          }}
          className="w-full min-h-[38px] px-3 py-2 rounded-lg text-xs text-[#CCCCCC] hover:text-[#ED1C24] hover:bg-[#1A1E28] flex items-center gap-2"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
