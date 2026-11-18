import React from 'react';
import { Bell, LogIn, User, ArrowRight, LayoutDashboard, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminOrPm, isWorkspaceRoute } from './navConfig';

interface AppHeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onOpenAccountOrMore: () => void;
}

export function AppHeader({ currentPath, onNavigate, onOpenAccountOrMore }: AppHeaderProps) {
  const { user, unreadCount } = useAuth();
  const isStaff = isAdminOrPm(user?.roles);
  const inWorkspace = isWorkspaceRoute(currentPath);

  const publicLinks = [
    { path: '/', label: 'Home' },
    { path: '/services', label: 'Services' },
    { path: '/work', label: 'Work' },
    { path: '/process', label: 'Process' },
    { path: '/team', label: 'Team' },
    { path: '/updates', label: 'Updates' },
    { path: '/contact', label: 'Contact' },
  ];

  const homeTarget = inWorkspace && user ? (isStaff ? '/admin' : '/dashboard') : '/';

  return (
    <header className="sticky top-0 z-[100] h-14 bg-[#0B0D11]/95 backdrop-blur-md border-b border-[#262B38]">
      <div className="h-full max-w-[1400px] mx-auto px-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate(homeTarget)}
          className="min-h-[44px] flex items-center gap-2 text-left whitespace-nowrap shrink-0"
        >
          <span className="w-2 h-5 rounded-sm bg-[#ED1C24] shrink-0" aria-hidden="true" />
          <span className="text-sm sm:text-base font-bold tracking-tight text-white">SANJAY VAISHYA</span>
        </button>

        {/* Desktop Public Links (hidden inside logged-in workspace where DesktopSidebar is active) */}
        {!inWorkspace && (
          <nav className="hidden lg:flex items-center gap-5" aria-label="Primary navigation">
            {publicLinks.map((item) => {
              const active =
                item.path === '/'
                  ? currentPath === '/' || currentPath === ''
                  : currentPath === item.path || currentPath.startsWith(`${item.path}/`);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => onNavigate(item.path)}
                  className={`relative py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active ? 'text-[#00BFFF]' : 'text-[#CCCCCC] hover:text-white'
                  }`}
                >
                  {item.label}
                  {active && <span className="absolute left-0 right-0 -bottom-[2px] h-[2px] bg-[#00BFFF]" />}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right Compact Action Strip */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!inWorkspace && (
            <button
              type="button"
              onClick={() => onNavigate('/start-project')}
              className="hidden sm:inline-flex min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              Start a Project
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {user ? (
            <>
              {!inWorkspace && (
                <button
                  type="button"
                  onClick={() => onNavigate(isStaff ? '/admin' : '/dashboard')}
                  className="hidden md:inline-flex min-h-[38px] px-3 py-1.5 rounded-lg bg-[#13161D] border border-[#2B3140] hover:border-[#00BFFF] text-xs font-medium text-white items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#00BFFF]" />
                  {isStaff ? 'Admin Center' : 'Workspace'}
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigate('/notifications')}
                aria-label="Notifications"
                className="relative min-w-[44px] min-h-[44px] rounded-lg hover:bg-[#13161D] flex items-center justify-center text-[#CCCCCC] hover:text-white transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#ED1C24] text-white font-mono text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenAccountOrMore}
                aria-label="Account profile and quick menu"
                className="min-h-[44px] px-2.5 rounded-lg bg-[#13161D] border border-[#262B38] hover:border-[#00BFFF] flex items-center gap-2 text-xs text-white transition-colors"
              >
                <span className="w-6 h-6 rounded-md bg-[#1A1E28] border border-[#2B3140] flex items-center justify-center font-mono text-[11px] font-bold text-[#00BFFF]">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden sm:inline max-w-[110px] truncate font-medium">{user.name}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#13161D] border border-[#2B3140] hover:border-[#00BFFF] text-xs font-medium text-white inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-[#00BFFF]" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={onOpenAccountOrMore}
                aria-label="Open platform menu"
                className="hidden md:inline-flex lg:hidden min-w-[44px] min-h-[44px] rounded-lg bg-[#13161D] border border-[#262B38] items-center justify-center text-white"
              >
                <Menu className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
