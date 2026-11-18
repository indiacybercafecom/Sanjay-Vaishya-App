import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from '../components/navigation/AppHeader';
import { DesktopSidebar } from '../components/navigation/DesktopSidebar';
import { MobileBottomNav } from '../components/navigation/MobileBottomNav';
import { MoreMenu } from '../components/navigation/MoreMenu';
import { isWorkspaceRoute, type AdminModule } from '../components/navigation/navConfig';
import { OfflineIndicator } from '../components/PWAInstallButton';

interface AppShellProps {
  currentPath: string;
  activeAdminModule: AdminModule;
  onNavigate: (path: string) => void;
  onSelectAdminModule: (mod: AdminModule) => void;
  onOpenCookieSettings: () => void;
  children: React.ReactNode;
}

export function AppShell({
  currentPath,
  activeAdminModule,
  onNavigate,
  onSelectAdminModule,
  onOpenCookieSettings,
  children,
}: AppShellProps) {
  const { user } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const inWorkspace = isWorkspaceRoute(currentPath);
  const showSidebar = Boolean(user && inWorkspace);

  return (
    <div className="min-h-[100dvh] bg-[#0B0D11] text-[#F4F6F9] font-sans flex flex-col">
      <AppHeader
        currentPath={currentPath}
        onNavigate={onNavigate}
        onOpenAccountOrMore={() => setMoreOpen(true)}
      />

      <div className="flex-1 flex w-full max-w-[1400px] mx-auto">
        {showSidebar && (
          <DesktopSidebar
            currentPath={currentPath}
            activeAdminModule={activeAdminModule}
            onNavigate={onNavigate}
            onSelectAdminModule={onSelectAdminModule}
          />
        )}

        <main className="flex-1 min-w-0 px-3 sm:px-6 py-4 sm:py-7 pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-10">
          {children}
        </main>
      </div>

      {/* Slim Desktop Legal Strip (Public routes only; mobile accesses legal via More & Settings) */}
      {!inWorkspace && (
        <div className="hidden md:block border-t border-[#262B38] bg-[#0B0D11]">
          <div className="max-w-[1400px] mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4 text-xs text-[#9AA3B5]">
            <span>© {new Date().getFullYear()} SANJAY VAISHYA · Founder-Led Full-Stack Development Team</span>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => onNavigate('/privacy')} className="hover:text-white">
                Privacy Policy
              </button>
              <button type="button" onClick={() => onNavigate('/terms')} className="hover:text-white">
                Terms
              </button>
              <button type="button" onClick={() => onNavigate('/cookie-policy')} className="hover:text-white">
                Cookie Policy
              </button>
              <button type="button" onClick={onOpenCookieSettings} className="hover:text-white">
                Cookie Settings
              </button>
              <button type="button" onClick={() => onNavigate('/delete-data')} className="hover:text-[#ED1C24]">
                Delete Data
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav
        currentPath={currentPath}
        activeAdminModule={activeAdminModule}
        onNavigate={onNavigate}
        onSelectAdminModule={onSelectAdminModule}
        onOpenMore={() => setMoreOpen(true)}
      />

      <MoreMenu
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        currentPath={currentPath}
        activeAdminModule={activeAdminModule}
        onNavigate={onNavigate}
        onSelectAdminModule={onSelectAdminModule}
        onOpenCookieSettings={onOpenCookieSettings}
      />

      <OfflineIndicator />
    </div>
  );
}
