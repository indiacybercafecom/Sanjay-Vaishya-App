import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  KeyRound,
  MailCheck,
  ArrowRight,
  Lock,
  RefreshCw,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  loginWithFirebaseEmail,
  registerWithFirebaseEmail,
  sendFirebasePasswordReset,
  resendFirebaseVerification,
  reloadCurrentFirebaseUser,
  formatFirebaseAuthError,
} from '../../firebase/auth';

interface AuthScreensProps {
  mode: 'login' | 'register' | 'verify-email' | 'reset-password' | 'forgot-password';
  onNavigate: (path: string) => void;
}

export function AuthScreens({ mode, onNavigate }: AuthScreensProps) {
  const {
    user,
    firebaseUser,
    accountDisabledError,
    clearAccountDisabledError,
    refreshAuth,
    showToast,
  } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    clearAccountDisabledError();
    setSubmitting(true);
    try {
      await loginWithFirebaseEmail(loginEmail, loginPassword);
      const syncedUser = await refreshAuth(true);
      if (!syncedUser) {
        return;
      }
      showToast('Signed in successfully.');
      const isStaff = syncedUser.roles.some((r) => ['admin', 'project_manager'].includes(r));
      onNavigate(isStaff ? '/admin' : '/dashboard');
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    clearAccountDisabledError();

    if (!regForm.name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (regForm.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (regForm.confirmPassword && regForm.password !== regForm.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await registerWithFirebaseEmail(regForm.name, regForm.email, regForm.password);
      await refreshAuth(true);
      showToast('Account created. Verification email sent.');
      onNavigate('/dashboard');
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      await sendFirebasePasswordReset(resetEmail);
      setInfoMsg('Password reset link sent. Check your inbox and spam folder.');
      showToast('Password reset email dispatched.');
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      await resendFirebaseVerification();
      setInfoMsg('Verification email sent. Open the link in your inbox, then refresh your status.');
      showToast('Verification email sent.');
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckVerification = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      const verified = await reloadCurrentFirebaseUser();
      await refreshAuth(true);
      if (verified) {
        setInfoMsg('Email verified successfully.');
        showToast('Email verified.');
      } else {
        setErrorMsg('Verification not detected yet. Click the link sent to your email first.');
      }
    } catch (err) {
      setErrorMsg(formatFirebaseAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isResetMode = mode === 'reset-password' || mode === 'forgot-password';

  return (
    <div className="max-w-md mx-auto py-4 sm:py-8">
      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 sm:p-7 space-y-5">
        {accountDisabledError && (
          <div className="p-3.5 rounded-lg bg-[#ED1C24]/15 border border-[#ED1C24]/50 text-xs text-white flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#ED1C24] shrink-0 mt-0.5" />
            <span>{accountDisabledError}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-[#ED1C24]/15 border border-[#ED1C24]/50 text-xs text-white">
            {errorMsg}
          </div>
        )}
        {infoMsg && (
          <div className="p-3.5 rounded-lg bg-[#00CC66]/15 border border-[#00CC66]/40 text-xs text-white">
            {infoMsg}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                ACCOUNT ACCESS
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Sign In</h1>
              <p className="text-xs text-[#CCCCCC]">
                Access your projects, proposals, invoices, and team workspace.
              </p>
            </div>

            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-[#CCCCCC]">Email Address</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
              />
            </label>

            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-[#CCCCCC]">Password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              {submitting ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="pt-3 border-t border-[#262B38] flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="text-[#00BFFF] hover:underline font-medium min-h-[36px]"
              >
                Create Client Account
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/forgot-password')}
                className="text-[#CCCCCC] hover:text-white min-h-[36px]"
              >
                Forgot Password?
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" />
                CLIENT REGISTRATION
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Create Account</h1>
              <p className="text-xs text-[#CCCCCC]">
                Register to submit requirements, review proposals, track milestones, and collaborate with our team.
              </p>
            </div>

            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-[#CCCCCC]">Full Name *</span>
              <input
                type="text"
                required
                autoComplete="name"
                value={regForm.name}
                onChange={(e) => setRegForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your full name"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
              />
            </label>

            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-[#CCCCCC]">Email Address *</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={regForm.email}
                onChange={(e) => setRegForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="name@company.com"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
              />
            </label>

            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-[#CCCCCC]">Password (minimum 6 characters) *</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={regForm.password}
                onChange={(e) => setRegForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Create a secure password"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
              />
            </label>

            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-[#CCCCCC]">Confirm Password</span>
              <input
                type="password"
                minLength={6}
                autoComplete="new-password"
                value={regForm.confirmPassword}
                onChange={(e) => setRegForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="Re-enter password"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              {submitting ? 'Creating Account...' : 'Create Client Account'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-3 border-t border-[#262B38] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="text-[#00BFFF] hover:underline font-medium min-h-[36px]"
              >
                Already registered? Sign In
              </button>
            </div>
          </form>
        )}

        {isResetMode && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-1">
              <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                ACCOUNT RECOVERY
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Reset Password</h1>
              <p className="text-xs text-[#CCCCCC]">
                Enter your registered email address to receive a password reset link.
              </p>
            </div>

            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-[#CCCCCC]">Email Address *</span>
              <input
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[46px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Sending Link...' : 'Send Password Reset Email'}
            </button>

            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="text-xs text-[#00BFFF] hover:underline min-h-[36px]"
            >
              Back to Sign In
            </button>
          </form>
        )}

        {mode === 'verify-email' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
                <MailCheck className="w-3.5 h-3.5" />
                EMAIL VERIFICATION
              </p>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Verify Your Email</h1>
              <p className="text-xs text-[#CCCCCC] leading-relaxed">
                {firebaseUser
                  ? `Signed in as ${firebaseUser.email}. Verification status: ${
                      user?.emailVerified ? 'Verified' : 'Pending'
                    }.`
                  : 'Sign in first to manage email verification for your account.'}
              </p>
            </div>

            {firebaseUser ? (
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCheckVerification}
                  className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Verification Status
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleResendVerification}
                  className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-[#1A1E28] border border-[#2B3140] hover:border-[#00BFFF] text-white text-xs font-semibold"
                >
                  Resend Verification Email
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('/dashboard')}
                  className="text-xs text-[#00BFFF] hover:underline min-h-[36px]"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="w-full min-h-[44px] px-4 py-2 rounded-lg bg-[#ED1C24] text-white text-xs font-semibold"
              >
                Sign In to Continue
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
