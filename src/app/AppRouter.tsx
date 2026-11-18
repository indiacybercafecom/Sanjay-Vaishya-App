import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AppShell } from './AppShell';
import CookieConsent from '../components/CookieConsent';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { isWorkspaceRoute, type AdminModule } from '../components/navigation/navConfig';

// Public & Feature Modules
import { HomeScreen } from '../features/home/HomeScreen';
import ServicesPage from '../pages/ServicesPage';
import PortfolioPage from '../pages/PortfolioPage';
import { ProcessPage, TeamPage, ContactPage, UpdatesPage } from '../pages/ProcessAndTeamPages';
import InquiryPage from '../pages/InquiryPage';
import { AuthScreens } from '../features/authentication/AuthScreens';
import { ClientDashboardFeature } from '../features/dashboard/ClientDashboardFeature';
import { ProjectsFeature } from '../features/projects/ProjectsFeature';
import { MessagingFeature } from '../features/messaging/MessagingFeature';
import { ProposalsFeature } from '../features/proposals/ProposalsFeature';
import { PaymentsFeature } from '../features/payments/PaymentsFeature';
import { NotificationsFeature } from '../features/notifications/NotificationsFeature';
import { ProfileFeature, SettingsFeature } from '../features/settings/SettingsAndProfileFeature';
import { AdminFeature } from '../features/admin/AdminFeature';
import {
  AboutView,
  CookiePolicyView,
  PrivacyPolicyView,
  TermsView,
  DeleteDataView,
  DeployGuideView,
  BlogGuideView,
} from '../components/LegalAndGuideViews';

function parseInitialPath(): string {
  const hash = window.location.hash.replace(/^#/, '');
  if (hash === 'privacy') return '/privacy';
  if (hash === 'terms') return '/terms';
  if (hash === 'cookie-policy') return '/cookie-policy';
  if (hash === 'delete-data') return '/delete-data';
  if (hash === 'deploy-guide') return '/updates/deploy-guide';
  if (hash === 'blog-guide') return '/updates/blog-guide';
  if (hash === 'about') return '/about';
  return window.location.pathname || '/';
}

function parseAdminTabFromSearch(): AdminModule {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab') as AdminModule | null;
  return tab || 'overview';
}

export function AppRouter() {
  const { user, authLoading, blogPosts, toast, showToast } = useAuth();

  const [currentPath, setCurrentPath] = useState<string>(parseInitialPath);
  const [activeAdminModule, setActiveAdminModule] = useState<AdminModule>(parseAdminTabFromSearch);
  const [preselectedCategory, setPreselectedCategory] = useState<string | undefined>(undefined);
  const [selectedPortfolioSlug, setSelectedPortfolioSlug] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [cookieDrawerOpen, setCookieDrawerOpen] = useState(false);

  const [deleteOptions, setDeleteOptions] = useState({
    contactData: true,
    usageLogs: false,
    personalInfo: true,
    other: false,
  });

  const navigate = useCallback((path: string) => {
    const raw = path.startsWith('/') ? path : `/${path}`;
    const [pathname, searchPart] = raw.split('?');
    if (pathname.startsWith('/work/')) {
      setSelectedPortfolioSlug(pathname.replace('/work/', ''));
    } else if (pathname === '/work') {
      setSelectedPortfolioSlug(null);
    }

    if (pathname === '/admin' && searchPart) {
      const sp = new URLSearchParams(searchPart);
      const tab = sp.get('tab') as AdminModule | null;
      if (tab) setActiveAdminModule(tab);
    }

    window.history.pushState({}, '', raw);
    setCurrentPath(pathname || '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectAdminModule = useCallback(
    (mod: AdminModule) => {
      setActiveAdminModule(mod);
      if (currentPath !== '/admin') {
        window.history.pushState({}, '', mod === 'overview' ? '/admin' : `/admin?tab=${mod}`);
        setCurrentPath('/admin');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [currentPath]
  );

  useEffect(() => {
    const onPopState = () => {
      const next = window.location.pathname || '/';
      if (next.startsWith('/work/')) {
        setSelectedPortfolioSlug(next.replace('/work/', ''));
      } else if (next === '/work') {
        setSelectedPortfolioSlug(null);
      }
      if (next === '/admin') {
        setActiveAdminModule(parseAdminTabFromSearch());
      }
      setCurrentPath(next);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleToggleDeleteOption = (key: 'contactData' | 'usageLogs' | 'personalInfo' | 'other') => {
    setDeleteOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSendDeletionRequest = () => {
    const selectedLabels = [
      deleteOptions.contactData && 'Contact Form Data',
      deleteOptions.usageLogs && 'App Usage Logs',
      deleteOptions.personalInfo && 'Personal Information',
      deleteOptions.other && 'Other Data',
    ].filter(Boolean);

    if (selectedLabels.length === 0) {
      showToast('Select at least one data category to delete.', 'error');
      return;
    }

    const body = encodeURIComponent(
      `Hello Sanjay Vaishya Team,\n\nPlease delete the following data associated with my account/inquiries:\n- ${selectedLabels.join(
        '\n- '
      )}\n\nAccount Email: ${user?.email || '[Enter your email]'}\n`
    );
    window.location.href = `mailto:sanjayvaishya.dev@gmail.com?subject=Data%20Deletion%20Request&body=${body}`;
    showToast('Prepared deletion request in your email client.');
  };

  const isProtected = isWorkspaceRoute(currentPath);

  const renderPage = () => {
    if (isProtected && authLoading) {
      return <LoadingSkeleton rows={3} />;
    }

    if (isProtected && !user) {
      return <AuthScreens mode="login" onNavigate={navigate} />;
    }

    if (currentPath === '/' || currentPath === '') {
      return (
        <HomeScreen
          onNavigate={navigate}
          onSelectServiceQuote={(category) => {
            setPreselectedCategory(category);
            navigate('/start-project');
          }}
          onOpenProjectDetail={(slug) => {
            setSelectedPortfolioSlug(slug);
            navigate(`/work/${slug}`);
          }}
        />
      );
    }

    if (currentPath === '/services') {
      return (
        <ServicesPage
          onSelectServiceQuote={(category) => {
            setPreselectedCategory(category);
            navigate('/start-project');
          }}
        />
      );
    }

    if (currentPath === '/work' || currentPath.startsWith('/work/')) {
      const slugFromPath = currentPath.startsWith('/work/') ? currentPath.replace('/work/', '') : null;
      return (
        <PortfolioPage
          selectedSlug={slugFromPath || selectedPortfolioSlug}
          onSelectSlug={(slug) => {
            setSelectedPortfolioSlug(slug);
            navigate(slug ? `/work/${slug}` : '/work');
          }}
          onStartProject={() => navigate('/start-project')}
        />
      );
    }

    if (currentPath === '/process') {
      return <ProcessPage onStartProject={() => navigate('/start-project')} />;
    }

    if (currentPath === '/team') {
      return <TeamPage onStartProject={() => navigate('/start-project')} />;
    }

    if (currentPath === '/about') {
      return <AboutView onBack={() => navigate('/')} />;
    }

    if (currentPath === '/contact') {
      return <ContactPage onNavigate={navigate} />;
    }

    if (currentPath === '/start-project') {
      return <InquiryPage preselectedCategory={preselectedCategory} onNavigate={navigate} />;
    }

    if (currentPath === '/updates') {
      return <UpdatesPage onOpenGuide={(slug) => navigate(`/updates/${slug}`)} />;
    }

    if (currentPath.startsWith('/updates/')) {
      const guideSlug = currentPath.replace('/updates/', '');
      if (guideSlug === 'deploy-guide') {
        return <DeployGuideView onBack={() => navigate('/updates')} />;
      }
      if (guideSlug === 'blog-guide') {
        return <BlogGuideView onBack={() => navigate('/updates')} />;
      }
      const post = blogPosts.find((p) => p.slug === guideSlug);
      if (post) {
        return (
          <div className="space-y-6 max-w-3xl">
            <button
              type="button"
              onClick={() => navigate('/updates')}
              className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[#13161D] border border-[#2B3140] text-xs font-medium text-[#CCCCCC] hover:text-white inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Updates
            </button>
            <article className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-8 space-y-4">
              <p className="font-mono text-xs text-[#00BFFF]">
                {post.category} · {post.tag}
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{post.title}</h1>
              <p className="text-sm text-[#CCCCCC] leading-relaxed">{post.summary}</p>
              <div className="pt-4 border-t border-[#262B38] text-sm text-[#F4F6F9] leading-relaxed whitespace-pre-line">
                {post.content}
              </div>
            </article>
          </div>
        );
      }
      return <UpdatesPage onOpenGuide={(slug) => navigate(`/updates/${slug}`)} />;
    }

    // Auth Routes
    if (currentPath === '/login') return <AuthScreens mode="login" onNavigate={navigate} />;
    if (currentPath === '/register') return <AuthScreens mode="register" onNavigate={navigate} />;
    if (currentPath === '/verify-email') return <AuthScreens mode="verify-email" onNavigate={navigate} />;
    if (currentPath === '/reset-password') return <AuthScreens mode="reset-password" onNavigate={navigate} />;
    if (currentPath === '/forgot-password') return <AuthScreens mode="forgot-password" onNavigate={navigate} />;

    // Legal & Compliance Routes (Preserved)
    if (currentPath === '/privacy') return <PrivacyPolicyView onBack={() => navigate(user ? '/settings' : '/')} />;
    if (currentPath === '/terms') return <TermsView onBack={() => navigate(user ? '/settings' : '/')} />;
    if (currentPath === '/cookie-policy') return <CookiePolicyView onBack={() => navigate(user ? '/settings' : '/')} />;
    if (currentPath === '/delete-data') {
      return (
        <DeleteDataView
          onBack={() => navigate(user ? '/settings' : '/')}
          deleteOptions={deleteOptions}
          onToggleOption={handleToggleDeleteOption}
          onSendRequest={handleSendDeletionRequest}
        />
      );
    }

    // Workspace Feature Routes
    if (currentPath === '/dashboard') {
      return <ClientDashboardFeature onNavigate={navigate} onSelectProject={setSelectedProjectId} />;
    }
    if (currentPath === '/projects') {
      return <ProjectsFeature initialProjectId={selectedProjectId} onNavigate={navigate} />;
    }
    if (currentPath === '/messages') {
      return <MessagingFeature />;
    }
    if (currentPath === '/proposals') {
      return <ProposalsFeature />;
    }
    if (currentPath === '/payments') {
      return <PaymentsFeature />;
    }
    if (currentPath === '/notifications') {
      return <NotificationsFeature onNavigate={navigate} />;
    }
    if (currentPath === '/profile') {
      return <ProfileFeature onNavigate={navigate} />;
    }
    if (currentPath === '/settings') {
      return (
        <SettingsFeature
          onNavigate={navigate}
          onOpenCookieSettings={() => setCookieDrawerOpen(true)}
        />
      );
    }

    // Admin Control Center
    if (currentPath === '/admin') {
      const canAccessAdmin = user?.roles.some((r) => ['admin', 'project_manager'].includes(r));
      if (!canAccessAdmin) {
        return (
          <div className="bg-[#13161D] border border-[#ED1C24]/40 rounded-lg p-6 sm:p-8 max-w-xl mx-auto space-y-4">
            <p className="font-mono text-xs text-[#ED1C24]">ACCESS RESTRICTED</p>
            <h1 className="text-xl font-bold text-white">Admin &amp; Project Manager Permissions Required</h1>
            <p className="text-sm text-[#CCCCCC]">
              Your account does not have administrative permissions. Contact the founder to update your role in Firebase Console if needed.
            </p>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="min-h-[42px] px-4 py-2 rounded-lg bg-[#ED1C24] text-white text-xs font-semibold"
            >
              Return to My Dashboard
            </button>
          </div>
        );
      }
      return (
        <AdminFeature
          activeModule={activeAdminModule}
          onSelectModule={handleSelectAdminModule}
          onNavigate={navigate}
        />
      );
    }

    // Clean fallback to Home
    return (
      <HomeScreen
        onNavigate={navigate}
        onSelectServiceQuote={(category) => {
          setPreselectedCategory(category);
          navigate('/start-project');
        }}
        onOpenProjectDetail={(slug) => {
          setSelectedPortfolioSlug(slug);
          navigate(`/work/${slug}`);
        }}
      />
    );
  };

  return (
    <>
      <AppShell
        currentPath={currentPath}
        activeAdminModule={activeAdminModule}
        onNavigate={navigate}
        onSelectAdminModule={handleSelectAdminModule}
        onOpenCookieSettings={() => setCookieDrawerOpen(true)}
      >
        {renderPage()}
      </AppShell>

      <CookieConsent
        onViewPolicy={() => navigate('/cookie-policy')}
        forceOpen={cookieDrawerOpen}
        onClose={() => setCookieDrawerOpen(false)}
      />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 right-4 z-[500] max-w-sm bg-[#1A1E28] border border-[#2B3140] shadow-[0_8px_32px_rgba(0,0,0,0.6)] rounded-lg px-4 py-3 flex items-center gap-3 text-xs text-white"
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-[#ED1C24] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#00CC66] shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}
