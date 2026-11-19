import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onIdTokenChanged, type User as FirebaseUser } from 'firebase/auth';
import { firebaseAuth } from '../firebase/config';
import { isAuthFlowInProgress, logoutFromFirebase } from '../firebase/auth';
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
  refreshAuth: (forceTokenRefresh?: boolean, fallbackName?: string) => Promise<AuthUser | null>;
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
  const userRef = useRef<AuthUser | null>(null);
  const inFlightSyncRef = useRef<Promise<AuthUser | null> | null>(null);
  const lastSyncedTokenRef = useRef<string | null>(null);
  const lastRtdbSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

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
    async (
      fbUser: FirebaseUser | null,
      forceTokenRefresh = false,
      fallbackName?: string
    ): Promise<AuthUser | null> => {
      if (!fbUser) {
        lastSyncedTokenRef.current = null;
        lastRtdbSignatureRef.current = null;
        setUser(null);
        setAuthLoading(false);
        return null;
      }

      if (inFlightSyncRef.current) {
        if (!forceTokenRefresh && !fallbackName) {
          return inFlightSyncRef.current;
        }
        await inFlightSyncRef.current.catch(() => null);
      }

      const runSync = async (): Promise<AuthUser | null> => {
        try {
          const idToken = await fbUser.getIdToken(forceTokenRefresh);
          const currentUser = userRef.current;
          if (
            !forceTokenRefresh &&
            !fallbackName &&
            lastSyncedTokenRef.current === idToken &&
            currentUser?.firebaseUid === fbUser.uid
          ) {
            return currentUser;
          }

          const resolvedName = (fallbackName || fbUser.displayName || '').trim();
          const res = await fetch('/api/auth/session', {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ name: resolvedName }),
          });

          const rawText = await res.text().catch(() => '');
          let payload: {
            authenticated?: boolean;
            user?: AuthUser | null;
            error?: string;
            code?: string;
          } = {};
          if (rawText) {
            try {
              payload = JSON.parse(rawText) as typeof payload;
            } catch {
              payload = {};
            }
          }

          if (res.status === 403) {
            lastSyncedTokenRef.current = null;
            const disabledMsg = payload.error || 'This account has been disabled.';
            await logoutFromFirebase();
            setUser(null);
            if (forceTokenRefresh) {
              throw new Error(disabledMsg);
            }
            setAccountDisabledError(disabledMsg);
            return null;
          }

          if (!res.ok || !payload.user) {
            lastSyncedTokenRef.current = null;
            setUser(null);
            const fallbackHttpText =
              rawText && !rawText.trim().startsWith('<') ? rawText.trim().slice(0, 220) : '';
            const detailedError =
              payload.error ||
              fallbackHttpText ||
              `Backend session synchronization failed (HTTP ${res.status}).`;
            console.error('[AuthContext] /api/auth/session failed:', res.status, payload.code || '', detailedError);
            if (forceTokenRefresh) {
              throw new Error(detailedError);
            }
            if (res.status >= 500) {
              showToast(detailedError, 'error');
            }
            return null;
          }

          lastSyncedTokenRef.current = idToken;
          setAccountDisabledError(null);
          setUser(payload.user);
          return payload.user;
        } catch (err) {
          if (forceTokenRefresh) {
            throw err instanceof Error ? err : new Error('Session synchronization failed.');
          }
          console.error('[AuthContext] Session sync exception:', err);
          setUser(null);
          return null;
        } finally {
          inFlightSyncRef.current = null;
          setAuthLoading(false);
        }
      };

      const promise = runSync();
      inFlightSyncRef.current = promise;
      return promise;
    },
    [showToast]
  );

  const refreshAuth = useCallback(
    async (forceTokenRefresh = false, fallbackName?: string): Promise<AuthUser | null> => {
      return syncBackendSession(firebaseAuth.currentUser, forceTokenRefresh, fallbackName);
    },
    [syncBackendSession]
  );

  useEffect(() => {
    refreshPublicData();
  }, [refreshPublicData]);

  // Single auth/token listener prevents duplicate initial sync race conditions
  useEffect(() => {
    let mounted = true;
    const unsubToken = onIdTokenChanged(firebaseAuth, async (fbUser) => {
      if (!mounted) return;
      setFirebaseUser(fbUser);
      if (!fbUser) {
        lastSyncedTokenRef.current = null;
        lastRtdbSignatureRef.current = null;
        setUser(null);
        setNotifications([]);
        setAuthLoading(false);
        return;
      }
      // Wait for explicit refreshAuth(true) when registerWithFirebaseEmail / loginWithFirebaseEmail is mid-setup
      if (isAuthFlowInProgress()) {
        return;
      }
      await syncBackendSession(fbUser, false);
    });

    return () => {
      mounted = false;
      unsubToken();
    };
  }, [syncBackendSession]);

  // Subscribe to Realtime Database users/{uid} so role/status changes or node removals sync immediately
  useEffect(() => {
    if (!firebaseUser) return;
    let hadNode = false;

    const unsub = subscribeToUserNode(firebaseUser.uid, async (node) => {
      if (!node) {
        if (hadNode && !isAuthFlowInProgress()) {
          lastSyncedTokenRef.current = null;
          lastRtdbSignatureRef.current = null;
          setAccountDisabledError('Your account record was removed or revoked. Sign in again if needed.');
          try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
          } catch {
            // Ignore logout cleanup errors
          }
          await logoutFromFirebase();
          setUser(null);
        }
        return;
      }

      hadNode = true;

      if (node.status === 'disabled') {
        lastSyncedTokenRef.current = null;
        lastRtdbSignatureRef.current = null;
        setAccountDisabledError('Your account has been disabled by an administrator.');
        try {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        } catch {
          // Ignore logout cleanup errors
        }
        await logoutFromFirebase();
        setUser(null);
        return;
      }

      const sig = `${node.role}:${node.status}:${node.profile?.name || ''}:${node.profile?.phone || ''}:${
        node.profile?.company || ''
      }`;
      if (lastRtdbSignatureRef.current === null) {
        lastRtdbSignatureRef.current = sig;
        return;
      }
      if (lastRtdbSignatureRef.current !== sig) {
        lastRtdbSignatureRef.current = sig;
        try {
          await syncBackendSession(firebaseUser, true);
        } catch {
          // Non-fatal background refresh error
        }
      }
    });

    return () => unsub();
  }, [firebaseUser, syncBackendSession]);

  // Connect WebSocket when user session cookie is synchronized (never pass tokens in URL query strings)
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

    const connectWs = () => {
      refreshNotifications();
      try {
        if (cancelled) return;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
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
        // Ignore socket connection error
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
    lastSyncedTokenRef.current = null;
    lastRtdbSignatureRef.current = null;
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
