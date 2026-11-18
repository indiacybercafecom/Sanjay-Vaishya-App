import React, { useState, useEffect } from 'react';
import {
  Home,
  Layers,
  Briefcase,
  Users,
  MoreHorizontal,
  FolderKanban,
  MessageSquare,
  Bell,
  User,
  Inbox,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminOrPm, isWorkspaceRoute, type AdminModule } from './navConfig';

interface MobileBottomNavProps {
  currentPath: string;
  activeAdminModule?: AdminModule;
  onNavigate: (path: string) => void;
  onSelectAdminModule: (mod: AdminModule) => void;
  onOpenMore: () => void;
}

export function MobileBottomNav({
  currentPath,
  activeAdminModule = 'overview',
  onNavigate,
  onSelectAdminModule,
  onOpenMore,
}: MobileBottomNavProps) {
  const { user, unreadCount } = useAuth();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Hide bottom bar when mobile virtual keyboard is open or a text input is focused on narrow viewports
  useEffect(() => {
    const checkInputFocus = () => {
      if (window.innerWidth >= 768) {
        setKeyboardVisible(false);
        return;
      }
      const el = document.activeElement;
      const isTextControl =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement;
      const nonTextInputTypes = new Set(['checkbox', 'radio', 'button', 'submit', 'file']);
      const activeTextInput =
        el instanceof HTMLInputElement ? !nonTextInputTypes.has(el.type) : isTextControl;
      setKeyboardVisible(Boolean(activeTextInput));
    };

    const onViewportResize = () => {
      if (window.innerWidth >= 768) {
        setKeyboardVisible(false);
        return;
      }
      const vv = window.visualViewport;
      if (vv && window.innerHeight - vv.height > 150) {
        setKeyboardVisible(true);
      } else {
        checkInputFocus();
      }
    };

    const onFocusOut = () => setTimeout(checkInputFocus, 60);

    document.addEventListener('focusin', checkInputFocus);
    document.addEventListener('focusout', onFocusOut);
    window.visualViewport?.addEventListener('resize', onViewportResize);

    return () => {
      document.removeEventListener('focusin', checkInputFocus);
      document.removeEventListener('focusout', onFocusOut);
      window.visualViewport?.removeEventListener('resize', onViewportResize);
    };
  }, []);

  if (keyboardVisible) {
    return null;
  }

  const isStaffAdmin = isAdminOrPm(user?.roles);
  const inWorkspace = isWorkspaceRoute(currentPath);
  const inAdmin = currentPath === '/admin' || currentPath.startsWith('/admin/');

  let items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    active: boolean;
    badge?: number;
    onClick: () => void;
  }[];

  if (user && inAdmin && isStaffAdmin) {
    items = [
      {
        id: 'admin-home',
        label: 'Overview',
        icon: LayoutDashboard,
        active: activeAdminModule === 'overview',
        onClick: () => onSelectAdminModule('overview'),
      },
      {
        id: 'admin-inquiries',
        label: 'Inquiries',
        icon: Inbox,
        active: activeAdminModule === 'inquiries',
        onClick: () => onSelectAdminModule('inquiries'),
      },
      {
        id: 'admin-projects',
        label: 'Projects',
        icon: FolderKanban,
        active: activeAdminModule === 'projects',
        onClick: () => onSelectAdminModule('projects'),
      },
      {
        id: 'admin-team',
        label: 'Team',
        icon: Users,
        active: activeAdminModule === 'team',
        onClick: () => onSelectAdminModule('team'),
      },
      {
        id: 'admin-more',
        label: 'More',
        icon: MoreHorizontal,
        active: !['overview', 'inquiries', 'projects', 'team'].includes(activeAdminModule),
        onClick: onOpenMore,
      },
    ];
  } else if (user && inWorkspace) {
    items = [
      {
        id: 'ws-home',
        label: 'Home',
        icon: Home,
        active: currentPath === '/dashboard',
        onClick: () => onNavigate('/dashboard'),
      },
      {
        id: 'ws-projects',
        label: 'Projects',
        icon: FolderKanban,
        active: currentPath === '/projects',
        onClick: () => onNavigate('/projects'),
      },
      {
        id: 'ws-messages',
        label: 'Messages',
        icon: MessageSquare,
        active: currentPath === '/messages',
        onClick: () => onNavigate('/messages'),
      },
      {
        id: 'ws-notifications',
        label: 'Alerts',
        icon: Bell,
        badge: unreadCount,
        active: currentPath === '/notifications',
        onClick: () => onNavigate('/notifications'),
      },
      {
        id: 'ws-account',
        label: 'Account',
        icon: User,
        active: ['/profile', '/settings', '/proposals', '/payments'].includes(currentPath),
        onClick: onOpenMore,
      },
    ];
  } else {
    items = [
      {
        id: 'pub-home',
        label: 'Home',
        icon: Home,
        active: currentPath === '/' || currentPath === '',
        onClick: () => onNavigate('/'),
      },
      {
        id: 'pub-services',
        label: 'Services',
        icon: Layers,
        active: currentPath === '/services',
        onClick: () => onNavigate('/services'),
      },
      {
        id: 'pub-work',
        label: 'Work',
        icon: Briefcase,
        active: currentPath === '/work' || currentPath.startsWith('/work/'),
        onClick: () => onNavigate('/work'),
      },
      {
        id: 'pub-team',
        label: 'Team',
        icon: Users,
        active: currentPath === '/team',
        onClick: () => onNavigate('/team'),
      },
      {
        id: 'pub-more',
        label: 'More',
        icon: MoreHorizontal,
        active: [
          '/process',
          '/about',
          '/contact',
          '/updates',
          '/start-project',
          '/privacy',
          '/terms',
          '/cookie-policy',
          '/delete-data',
        ].some((p) => currentPath === p || currentPath.startsWith(`${p}/`)),
        onClick: onOpenMore,
      },
    ];
  }

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-[120] bg-[#0B0D11]/95 backdrop-blur-md border-t border-[#262B38] safe-pb"
    >
      <div className="grid grid-cols-5 h-[62px]">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              aria-current={item.active ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 min-h-[48px] px-1 transition-colors ${
                item.active ? 'text-[#00BFFF]' : 'text-[#9AA3B5] hover:text-white'
              }`}
            >
              {item.active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#00BFFF] rounded-full" />
              )}
              <div className="relative flex items-center justify-center">
                <Icon className="w-[20px] h-[20px]" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#ED1C24] text-white font-mono text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-medium leading-none truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
