import React from 'react';
import {
  ArrowRight,
  ChevronRight,
  GitBranch,
  BookOpen,
  Mail,
  Info,
  Shield,
  FileCheck2,
  Cookie,
  Trash2,
  LayoutDashboard,
  FileText,
  CreditCard,
  User,
  Settings,
  ShieldAlert,
  LogOut,
  LogIn,
  Globe,
  ListTodo,
  Layers,
  Briefcase,
  Receipt,
  MessageSquare,
  Bell,
  Star,
  BarChart3,
  ShieldCheck,
  ScrollText,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { BottomSheet } from '../common/BottomSheet';
import { PWAInstallButton } from '../PWAInstallButton';
import { ADMIN_MORE_MODULES, isAdminOrPm, isWorkspaceRoute, type AdminModule } from './navConfig';

const ADMIN_MORE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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

interface MoreMenuProps {
  open: boolean;
  onClose: () => void;
  currentPath: string;
  activeAdminModule: AdminModule;
  onNavigate: (path: string) => void;
  onSelectAdminModule: (mod: AdminModule) => void;
  onOpenCookieSettings: () => void;
}

export function MoreMenu({
  open,
  onClose,
  currentPath,
  activeAdminModule,
  onNavigate,
  onSelectAdminModule,
  onOpenCookieSettings,
}: MoreMenuProps) {
  const { user, logout } = useAuth();
  const isStaffAdmin = isAdminOrPm(user?.roles);
  const isFullAdmin = Boolean(user?.roles.includes('admin'));
  const inWorkspace = isWorkspaceRoute(currentPath);
  const inAdmin = currentPath === '/admin' || currentPath.startsWith('/admin/');

  const go = (path: string) => {
    onClose();
    onNavigate(path);
  };

  if (user && inAdmin && isStaffAdmin) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Admin Modules"
        subtitle="SANJAY VAISHYA ADMIN CENTER"
      >
        <div className="space-y-4">
          <div className="bg-[#0B0D11] border border-[#262B38] rounded-lg divide-y divide-[#262B38]">
            {[
              { id: 'clients' as AdminModule, label: 'Clients' },
              ...ADMIN_MORE_MODULES.filter((m) => !m.adminOnly || isFullAdmin),
            ].map((mod) => {
              const Icon = ADMIN_MORE_ICONS[mod.id] || Layers;
              const active = activeAdminModule === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectAdminModule(mod.id);
                  }}
                  className={`w-full min-h-[46px] px-3.5 py-2.5 text-left text-xs font-medium flex items-center justify-between gap-2 ${
                    active ? 'bg-[#1A1E28] text-[#00BFFF]' : 'text-white hover:bg-[#1A1E28]/60'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0 text-[#00BFFF]" />
                    <span className="truncate">{mod.label}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#9AA3B5] shrink-0" />
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => go('/dashboard')}
              className="min-h-[44px] px-3 py-2 rounded-lg bg-[#1A1E28] border border-[#262B38] text-xs font-medium text-white flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4 text-[#00BFFF]" />
              Client View
            </button>
            <button
              type="button"
              onClick={() => go('/')}
              className="min-h-[44px] px-3 py-2 rounded-lg bg-[#1A1E28] border border-[#262B38] text-xs font-medium text-white flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4 text-[#00BFFF]" />
              Public App
            </button>
          </div>

          <button
            type="button"
            onClick={async () => {
              onClose();
              await logout();
              onNavigate('/');
            }}
            className="w-full min-h-[44px] px-4 py-2 rounded-lg border border-[#ED1C24]/40 text-xs font-semibold text-[#ED1C24] flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </BottomSheet>
    );
  }

  if (user && inWorkspace) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={user.name}
        subtitle={`${user.primaryRole.replace('_', ' ').toUpperCase()} ACCOUNT`}
      >
        <div className="space-y-4">
          {isStaffAdmin && (
            <button
              type="button"
              onClick={() => go('/admin')}
              className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-[#ED1C24]/15 border border-[#ED1C24]/40 text-xs font-semibold text-[#ED1C24] flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Open Admin Control Center
            </button>
          )}

          <div className="bg-[#0B0D11] border border-[#262B38] rounded-lg divide-y divide-[#262B38]">
            {[
              { path: '/proposals', label: 'Proposals & Quotations', icon: FileText },
              { path: '/payments', label: 'Payments & Invoices', icon: CreditCard },
              { path: '/profile', label: 'Profile & Contact Details', icon: User },
              { path: '/settings', label: 'Settings & Legal', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => go(item.path)}
                  className="w-full min-h-[46px] px-3.5 py-2.5 text-left text-xs font-medium text-white hover:bg-[#1A1E28] flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-[#00BFFF] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#9AA3B5] shrink-0" />
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => go('/start-project')}
              className="min-h-[44px] px-3 py-2 rounded-lg bg-[#ED1C24] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              Start Project
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => go('/')}
              className="min-h-[44px] px-3 py-2 rounded-lg bg-[#1A1E28] border border-[#262B38] text-xs font-medium text-white flex items-center justify-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-[#00BFFF]" />
              Public Home
            </button>
          </div>

          <div className="flex justify-center">
            <PWAInstallButton />
          </div>

          <button
            type="button"
            onClick={async () => {
              onClose();
              await logout();
              onNavigate('/');
            }}
            className="w-full min-h-[44px] px-4 py-2 rounded-lg border border-[#333333] text-xs font-medium text-[#CCCCCC] hover:text-[#ED1C24] flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </BottomSheet>
    );
  }

  // Public More Sheet (grouped list rows)
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Menu & Policies"
      subtitle="SANJAY VAISHYA"
    >
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => go('/start-project')}
          className="w-full min-h-[46px] px-4 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold flex items-center justify-center gap-2"
        >
          Start a Project
          <ArrowRight className="w-4 h-4" />
        </button>

        {user ? (
          <button
            type="button"
            onClick={() => go(isStaffAdmin ? '/admin' : '/dashboard')}
            className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-[#1A1E28] border border-[#00BFFF]/50 text-xs font-semibold text-[#00BFFF] flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            {isStaffAdmin ? 'Open Admin Control Center' : 'Open Client Workspace'}
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => go('/login')}
              className="min-h-[44px] px-3 py-2 rounded-lg bg-[#1A1E28] border border-[#2B3140] text-xs font-semibold text-white flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-[#00BFFF]" />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => go('/register')}
              className="min-h-[44px] px-3 py-2 rounded-lg bg-[#1A1E28] border border-[#2B3140] text-xs font-semibold text-white"
            >
              Create Account
            </button>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="font-mono text-[10px] text-[#9AA3B5] uppercase px-1">Explore Platform</p>
          <div className="bg-[#0B0D11] border border-[#262B38] rounded-lg divide-y divide-[#262B38]">
            {[
              { path: '/process', label: 'Development Process', icon: GitBranch },
              { path: '/updates', label: 'Updates & Technical Guides', icon: BookOpen },
              { path: '/contact', label: 'Contact Team', icon: Mail },
              { path: '/about', label: 'About Sanjay Vaishya', icon: Info },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => go(item.path)}
                  className="w-full min-h-[46px] px-3.5 py-2.5 text-left text-xs font-medium text-white hover:bg-[#1A1E28] flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-[#00BFFF] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-[#9AA3B5] shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="font-mono text-[10px] text-[#9AA3B5] uppercase px-1">Legal &amp; Cookie Consent</p>
          <div className="bg-[#0B0D11] border border-[#262B38] rounded-lg divide-y divide-[#262B38]">
            <button
              type="button"
              onClick={() => go('/privacy')}
              className="w-full min-h-[44px] px-3.5 py-2 text-left text-xs text-[#CCCCCC] hover:text-white flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2.5">
                <Shield className="w-3.5 h-3.5 text-[#00BFFF]" />
                Privacy Policy
              </span>
              <ChevronRight className="w-4 h-4 text-[#9AA3B5]" />
            </button>
            <button
              type="button"
              onClick={() => go('/terms')}
              className="w-full min-h-[44px] px-3.5 py-2 text-left text-xs text-[#CCCCCC] hover:text-white flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2.5">
                <FileCheck2 className="w-3.5 h-3.5 text-[#00BFFF]" />
                Terms &amp; Conditions
              </span>
              <ChevronRight className="w-4 h-4 text-[#9AA3B5]" />
            </button>
            <button
              type="button"
              onClick={() => go('/cookie-policy')}
              className="w-full min-h-[44px] px-3.5 py-2 text-left text-xs text-[#CCCCCC] hover:text-white flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2.5">
                <Cookie className="w-3.5 h-3.5 text-[#00BFFF]" />
                Cookie Policy
              </span>
              <ChevronRight className="w-4 h-4 text-[#9AA3B5]" />
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCookieSettings();
              }}
              className="w-full min-h-[44px] px-3.5 py-2 text-left text-xs text-[#CCCCCC] hover:text-white flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2.5">
                <Settings className="w-3.5 h-3.5 text-[#00BFFF]" />
                Cookie Settings
              </span>
              <ChevronRight className="w-4 h-4 text-[#9AA3B5]" />
            </button>
            <button
              type="button"
              onClick={() => go('/delete-data')}
              className="w-full min-h-[44px] px-3.5 py-2 text-left text-xs text-[#ED1C24] flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2.5">
                <Trash2 className="w-3.5 h-3.5" />
                Delete Data Request
              </span>
              <ChevronRight className="w-4 h-4 text-[#ED1C24]" />
            </button>
          </div>
        </div>

        <div className="pt-1 flex justify-center">
          <PWAInstallButton />
        </div>
      </div>
    </BottomSheet>
  );
}
