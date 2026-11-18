import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  Cookie,
  Shield,
  FileCheck2,
  Trash2,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';
import { updateProfileInRtdb } from '../../firebase/database';
import { PWAInstallButton } from '../../components/PWAInstallButton';

export function ProfileFeature() {
  const { user, firebaseUser, refreshAuth, showToast } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    company: user?.company || '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, phone: user.phone || '', company: user.company || '' });
    }
  }, [user]);

  if (!user) return null;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(profileForm),
      });
      if (firebaseUser) {
        try {
          await updateProfileInRtdb(firebaseUser.uid, profileForm);
        } catch {
          // Backend RTDB sync or session handles fallback
        }
      }
      await refreshAuth(true);
      showToast('Profile updated.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Profile update failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="pb-4 border-b border-[#262B38] space-y-1">
        <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          ACCOUNT IDENTITY
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Profile</h1>
      </div>

      <form onSubmit={handleProfileSave} className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
        <div className="p-3.5 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[#CCCCCC] break-all">{user.email}</span>
          <span className="font-mono text-[#00BFFF] uppercase">{user.roles.join(', ')}</span>
        </div>

        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-[#CCCCCC]">Full Name</span>
          <input
            type="text"
            required
            value={profileForm.name}
            onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full min-h-[44px] px-3.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white"
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-[#CCCCCC]">Phone / WhatsApp</span>
          <input
            type="tel"
            value={profileForm.phone}
            onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+91 9876543210"
            className="w-full min-h-[44px] px-3.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white"
          />
        </label>

        <label className="space-y-1.5 block">
          <span className="text-xs font-medium text-[#CCCCCC]">Company / Organization</span>
          <input
            type="text"
            value={profileForm.company}
            onChange={(e) => setProfileForm((p) => ({ ...p, company: e.target.value }))}
            placeholder="Optional"
            className="w-full min-h-[44px] px-3.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] disabled:opacity-60 text-white text-xs font-semibold"
        >
          {saving ? 'Saving...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}

export function SettingsFeature({
  onNavigate,
  onOpenCookieSettings,
}: {
  onNavigate: (path: string) => void;
  onOpenCookieSettings: () => void;
}) {
  const { logout } = useAuth();

  return (
    <div className="max-w-3xl space-y-5">
      <div className="pb-4 border-b border-[#262B38] space-y-1">
        <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5" />
          PREFERENCES &amp; COMPLIANCE
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Platform Settings</h1>
      </div>

      <div className="bg-[#13161D] border border-[#262B38] rounded-lg divide-y divide-[#262B38]">
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Cookie className="w-4 h-4 text-[#00BFFF]" />
              Cookie Consent Preferences
            </p>
            <p className="text-xs text-[#CCCCCC]">Review or update your essential and analytics cookie settings.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenCookieSettings}
              className="min-h-[40px] px-3.5 py-2 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs font-medium text-white"
            >
              Manage Consent
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/cookie-policy')}
              className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[#1A1E28] border border-[#2B3140] text-xs font-medium text-[#00BFFF]"
            >
              Cookie Policy
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/privacy')}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#1A1E28] transition-colors text-left"
        >
          <div className="space-y-1">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00BFFF]" />
              Privacy Policy
            </p>
            <p className="text-xs text-[#CCCCCC]">How client inquiries, files, and account records are protected.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#C0C0C0] shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/terms')}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#1A1E28] transition-colors text-left"
        >
          <div className="space-y-1">
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#00BFFF]" />
              Terms &amp; Conditions
            </p>
            <p className="text-xs text-[#CCCCCC]">Service scope, intellectual property, and client agreements.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#C0C0C0] shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/delete-data')}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-[#1A1E28] transition-colors text-left"
        >
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#ED1C24] flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Data Request
            </p>
            <p className="text-xs text-[#CCCCCC]">Request permanent deletion of personal or project inquiry records.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#ED1C24] shrink-0" />
        </button>

        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Install Progressive Web App</p>
            <p className="text-xs text-[#CCCCCC]">Install the platform workspace directly on desktop or mobile.</p>
          </div>
          <PWAInstallButton />
        </div>

        <div className="p-4 sm:p-5">
          <button
            type="button"
            onClick={async () => {
              await logout();
              onNavigate('/');
            }}
            className="min-h-[44px] px-4 py-2 rounded-lg border border-[#ED1C24]/40 text-xs font-semibold text-[#ED1C24] inline-flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out of Account
          </button>
        </div>
      </div>
    </div>
  );
}
