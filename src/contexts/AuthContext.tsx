import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, onIdTokenChanged, type User as FirebaseUser } from 'firebase/auth';
import { firebaseAuth } from '../firebase/config';
import { logoutFromFirebase } from '../firebase/auth';
import { subscribeToUserNode } from '../firebase/database';
import { apiFetch } from '../lib/api';
import type {
  AuthUser,
  ServiceItem,
  PortfolioProject,
  TeamMember,
  BlogPostItem,
  PublicReview,
  NotificationRecord,
} from '../types/platform';

interface ToastState {
  message: string;
  type: 'info' | 'error';
}

interface AuthContextValue {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  accountDisabledError: string | null;
  clearAccountDisabledError: () => void;
  services: ServiceItem[];
  portfolio: PortfolioProject[];
  team: TeamMember[];
  blogPosts: BlogPostItem[];
  reviews: PublicReview[];
  settings: Record<string, string>;
  razorpayConfigured: boolean;
  notifications: NotificationRecord[];
  unreadCount: number;
  wsSocket: WebSocket | null;
  toast: ToastState | null;
  showToast: (message: string, type?: 'info' | 'error') => void;
  refreshAuth: (forceTokenRefresh?: boolean) => Promise<AuthUser | null>;
  refreshPublicData: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [accountDisabledError, setAccountDisabledError] = useState<string | null>(null);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPostItem[]>([]);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [razorpayConfigured, setRazorpayConfigured] = useState(false);

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [wsSocket, setWsSocket] = useState<WebSocket | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const showToast = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3600);
  }, []);

  const refreshPublicData = useCallback(async () => {
    try {
      const data = await apiFetch<{
        services: ServiceItem[];
        portfolio: PortfolioProject[];
        team: TeamMember[];
        blogPosts: BlogPostItem[];
        reviews: PublicReview[];
        settings: Record<string, string>;
        razorpayConfigured: boolean;
      }>('/api/public/bootstrap');
      setServices(data.services || []);
      setPortfolio(data.portfolio || []);
      setTeam(data.team || []);
      setBlogPosts(data.blogPosts || []);
      setReviews(data.reviews || []);
      setSettings(data.settings || {});
      setRazorpayConfigured(Boolean(data.razorpayConfigured));
    } catch (err) {
      console.error('Failed to load platform data:', err);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!firebaseAuth.currentUser) return;
    try {
      const data = await apiFetch<{ notifications: NotificationRecord[] }>('/api/workspace/notifications');
      setNotifications(data.notifications || []);
    } catch {
      // Ignore if unauthenticated or disabled
    }
  }, []);

  const syncBackendSession = useCallback(
    async (fbUser: FirebaseUser | null, forceTokenRefresh = false): Promise<AuthUser | null> => {
      if (!fbUser) {
        setUser(null);
        setAuthLoading(false);
        return null;
      }

      try {
        const idToken = await fbUser.getIdToken(forceTokenRefresh);
        const res = await fetch('/api/auth/session', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ name: fbUser.displayName || '' }),
        });

        const payload = (await res.json()) as { authenticated?: boolean; user?: AuthUser | null; error?: string };

        if (res.status === 403) {
          setAccountDisabledError(payload.error || 'This account has been disabled.');
          await logoutFromFirebase();
          setUser(null);
          return null;
        }

        if (!res.ok || !payload.user) {
          setUser(null);
          return null;
        }

        setAccountDisabledError(null);
        setUser(payload.user);
        return payload.user;
      } catch {
        setUser(null);
        return null;
      } finally {
        setAuthLoading(false);
      }
    },
    []
  );

  const refreshAuth = useCallback(
    async (forceTokenRefresh = false): Promise<AuthUser | null> => {
      return syncBackendSession(firebaseAuth.currentUser, forceTokenRefresh);
    },
    [syncBackendSession]
  );

  useEffect(() => {
    refreshPublicData();
  }, [refreshPublicData]);

  // Listen to Firebase Auth state & ID token updates
  useEffect(() => {
    let mounted = true;
    const unsubAuth = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (!mounted) return;
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setUser(null);
        setNotifications([]);
        setAuthLoading(false);
        return;
      }
      await syncBackendSession(fbUser, false);
    });

    const unsubToken = onIdTokenChanged(firebaseAuth, async (fbUser) => {
      if (!mounted || !fbUser) return;
      await syncBackendSession(fbUser, false);
    });

    return () => {
      mounted = false;
      unsubAuth();
      unsubToken();
    };
  }, [syncBackendSession]);

  // Subscribe to Realtime Database users/{uid} so role/status updates reflect immediately
  useEffect(() => {
    if (!firebaseUser) return;
    let firstSnapshot = true;

    const unsub = subscribeToUserNode(firebaseUser.uid, async (node) => {
      if (firstSnapshot) {
        firstSnapshot = false;
        return;
      }
      if (node?.status === 'disabled') {
        setAccountDisabledError('Your account has been disabled by an administrator.');
        await logoutFromFirebase();
        setUser(null);
        return;
      }
      await syncBackendSession(firebaseUser, true);
    });

    return () => unsub();
  }, [firebaseUser, syncBackendSession]);

  // Connect WebSocket when user is authenticated
  useEffect(() => {
    if (!user || !firebaseUser) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setWsSocket(null);
      }
      setNotifications([]);
      return;
    }

    let cancelled = false;
    let sock: WebSocket | null = null;

    const connectWs = async () => {
      refreshNotifications();
      try {
        const token = await firebaseUser.getIdToken();
        if (cancelled) return;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;
        sock = new WebSocket(wsUrl);
        wsRef.current = sock;
        setWsSocket(sock);

        sock.addEventListener('message', (event) => {
          try {
            const msg = JSON.parse(event.data) as { event?: string; data?: { title?: string } };
            if (msg.event === 'notification:new') {
              refreshNotifications();
              if (msg.data?.title) {
                showToast(msg.data.title, 'info');
              }
            }
          } catch {
            // Ignore malformed socket message
          }
        });
      } catch {
        // Ignore socket error when token unavailable
      }
    };

    connectWs();

    return () => {
      cancelled = true;
      if (sock) {
        sock.close();
      }
      wsRef.current = null;
      setWsSocket(null);
    };
  }, [user, firebaseUser, refreshNotifications, showToast]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Ignore network errors during logout cookie clear
    }
    await logoutFromFirebase();
    setUser(null);
    setFirebaseUser(null);
    setNotifications([]);
    showToast('Signed out cleanly.');
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        authLoading,
        accountDisabledError,
        clearAccountDisabledError: () => setAccountDisabledError(null),
        services,
        portfolio,
        team,
        blogPosts,
        reviews,
        settings,
        razorpayConfigured,
        notifications,
        unreadCount,
        wsSocket,
        toast,
        showToast,
        refreshAuth,
        refreshPublicData,
        refreshNotifications,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
