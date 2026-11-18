import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  KeyRound,
  ArrowRight,
  Send,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  loginWithFirebaseEmail,
  registerWithFirebaseEmail,
  sendFirebasePasswordReset,
  formatFirebaseAuthError,
} from '../../firebase/auth';

interface AuthScreensProps {
  mode: 'login' | 'register' | 'reset-password' | 'forgot-password';
  onNavigate: (path: string) => void;
}

export function AuthScreens({ mode, onNavigate }: AuthScreensProps) {
  const { accountDisabledError, clearAccountDisabledError, refreshAuth, showToast } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState('');

  const navigateByRole = (roles: string[]) => {
    const isStaff = roles.some((r) => ['admin', 'project_manager'].includes(r));
    onNavigate(isStaff ? '/admin' : '/dashboard');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);
    setInfoMsg(null);
    clearAccountDisabledError();

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg('Please enter your email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      await loginWithFirebaseEmail(loginEmail, loginPassword);
      const syncedUser = await refreshAuth(true);
      if (!syncedUser) {
        return;
      }
      showToast('Signed in successfully.');
      navigateByRole(syncedUser.roles);
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);
    setInfoMsg(null);
    clearAccountDisabledError();

    if (!regForm.name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!regForm.email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (regForm.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setErrorMsg('Password and confirm password do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await registerWithFirebaseEmail(regForm.name, regForm.email, regForm.password);
      const syncedUser = await refreshAuth(true);
      if (!syncedUser) {
        setErrorMsg(
          'Your account was created, but session synchronization did not complete. Please sign in to continue.'
        );
        return;
      }
      showToast('Account created successfully. Welcome to Sanjay Vaishya!');
      navigateByRole(syncedUser.roles);
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);
    setInfoMsg(null);

    if (!resetEmail.trim()) {
      setErrorMsg('Please enter your registered email address.');
      return;
    }

    setSubmitting(true);
    try {
      await sendFirebasePasswordReset(resetEmail);
      setInfoMsg('Password reset link sent. Check your inbox and spam folder.');
      showToast('Password reset link dispatched.');
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isResetMode = mode === 'reset-password' || mode === 'forgot-password';

  return (
    <div className="w-full max-w-[440px] mx-auto py-2 sm:py-6">
      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 sm:p-6 space-y-4">
        {/* Compact Brand Indicator */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#262B38]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-4 rounded-sm bg-[#ED1C24] shrink-0" aria-hidden="true" />
            <span className="text-xs font-bold tracking-tight text-white truncate">SANJAY VAISHYA</span>
          </div>
          <span className="font-mono text-[10px] text-[#00BFFF] shrink-0">
            {mode === 'login' ? 'WORKSPACE AUTH' : mode === 'register' ? 'NEW ACCOUNT' : 'RECOVERY'}
          </span>
        </div>

        {accountDisabledError && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-[#ED1C24]/15 border border-[#ED1C24]/50 text-xs text-white flex items-start gap-2.5"
          >
            <AlertTriangle className="w-4 h-4 text-[#ED1C24] shrink-0 mt-0.5" />
            <span>{accountDisabledError}</span>
          </div>
        )}
        {errorMsg && (
          <div role="alert" className="p-3 rounded-lg bg-[#ED1C24]/15 border border-[#ED1C24]/50 text-xs text-white">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div role="status" className="p-3 rounded-lg bg-[#00CC66]/15 border border-[#00CC66]/40 text-xs text-white">
            {infoMsg}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3.5" noValidate>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-white">Sign In</h1>
              <p className="text-xs text-[#CCCCCC]">
                Access your projects, proposals, invoices, and team chat.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs font-medium text-[#CCCCCC]">
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                inputMode="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white placeholder-[#7A8294] focus:border-[#00BFFF] focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="login-password" className="block text-xs font-medium text-[#CCCCCC]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => onNavigate('/forgot-password')}
                  className="text-[11px] text-[#00BFFF] hover:underline py-1"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white placeholder-[#7A8294] focus:border-[#00BFFF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                  aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#9AA3B5] hover:text-white rounded-md"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="pt-3 border-t border-[#262B38] flex items-center justify-between gap-2 text-xs">
              <span className="text-[#9AA3B5]">New to Sanjay Vaishya?</span>
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="min-h-[40px] px-2 text-[#00BFFF] hover:underline font-medium"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3" noValidate>
            <div className="space-y-0.5">
              <h1 className="text-xl font-bold text-white">Create Account</h1>
              <p className="text-xs text-[#CCCCCC]">Start tracking projects and collaborating with our team.</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="reg-name" className="block text-xs font-medium text-[#CCCCCC]">
                Full Name
              </label>
              <input
                id="reg-name"
                type="text"
                required
                autoComplete="name"
                value={regForm.name}
                onChange={(e) => setRegForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white placeholder-[#7A8294] focus:border-[#00BFFF] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="reg-email" className="block text-xs font-medium text-[#CCCCCC]">
                Email Address
              </label>
              <input
                id="reg-email"
                type="email"
                inputMode="email"
                required
                autoComplete="email"
                value={regForm.email}
                onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="name@company.com"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white placeholder-[#7A8294] focus:border-[#00BFFF] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="reg-password" className="block text-xs font-medium text-[#CCCCCC]">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={regForm.password}
                  onChange={(e) => setRegForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                  className="w-full min-h-[44px] pl-3.5 pr-11 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white placeholder-[#7A8294] focus:border-[#00BFFF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword((prev) => !prev)}
                  aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#9AA3B5] hover:text-white rounded-md"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="reg-confirm-password" className="block text-xs font-medium text-[#CCCCCC]">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={regForm.confirmPassword}
                  onChange={(e) => setRegForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  placeholder="Re-enter your password"
                  className="w-full min-h-[44px] pl-3.5 pr-11 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white placeholder-[#7A8294] focus:border-[#00BFFF] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowRegConfirmPassword((prev) => !prev)}
                  aria-label={showRegConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[40px] min-h-[40px] flex items-center justify-center text-[#9AA3B5] hover:text-white rounded-md"
                >
                  {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-[11px] text-[#9AA3B5]">
              Use an active email address so you can receive password recovery links if needed.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {submitting ? 'Creating Account...' : 'Create Account'}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </button>

            <div className="pt-3 border-t border-[#262B38] flex items-center justify-between gap-2 text-xs">
              <span className="text-[#9AA3B5]">Already have an account?</span>
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="min-h-[40px] px-2 text-[#00BFFF] hover:underline font-medium"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {isResetMode && (
          <form onSubmit={handlePasswordReset} className="space-y-3.5" noValidate>
            <div className="space-y-1">
              <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                PASSWORD RECOVERY
              </p>
              <h1 className="text-xl font-bold text-white">Reset Password</h1>
              <p className="text-xs text-[#CCCCCC]">
                Enter the email address registered on your account to receive a password reset link.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reset-email" className="block text-xs font-medium text-[#CCCCCC]">
                Email Address
              </label>
              <input
                id="reset-email"
                type="email"
                inputMode="email"
                required
                autoComplete="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white placeholder-[#7A8294] focus:border-[#00BFFF] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending Link...' : 'Send Reset Link'}
            </button>

            <div className="pt-2 border-t border-[#262B38] flex justify-start">
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="min-h-[40px] text-xs text-[#00BFFF] hover:underline font-medium"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
