import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Mail,
  Globe,
  MessageSquare,
  Phone,
  ExternalLink,
  Lightbulb,
  AlertTriangle,
  Send,
  ShieldCheck,
  Terminal,
  FolderOpen,
  Cloud,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import ResilientImage from './ResilientImage';
import heroHpcImg from '../assets/images/hero_hpc_server_1795003573637.jpg';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

interface BackHeaderProps {
  title: string;
  onBack: () => void;
  backLabel?: string;
  accent?: 'default' | 'danger';
}

function SectionBackHeader({ title, onBack, backLabel = 'Back', accent = 'default' }: BackHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#262B38]">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-2 rounded-lg bg-[#13161D] border border-[#2B3140] text-[#CCCCCC] hover:text-white hover:border-[#1FA8D6] transition-colors duration-200 flex items-center gap-2 text-xs font-medium whitespace-nowrap shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </button>
        <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${accent === 'danger' ? 'text-[#D9252D]' : 'text-white'}`}>
          {title}
        </h2>
      </div>
    </div>
  );
}

export function AboutView({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-8">
      <SectionBackHeader title="About Sanjay Vaishya" onBack={onBack} backLabel="Home" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-5 bg-[#13161D] border border-[#262B38] rounded-lg overflow-hidden flex flex-col">
          <div className="aspect-[4/3] relative overflow-hidden">
            <ResilientImage
              src="https://sanjay.indiacybercafe.com/uploads/sanjay/sanjay%20kumar%20vaishya%20hero%20image.png"
              fallbackSrc={heroHpcImg}
              alt="Sanjay Vaishya"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D11]/90 via-[#0B0D11]/30 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5">
              <p className="font-mono text-xs text-[#00BFFF] mb-1">Founder &amp; Lead Full-Stack Developer</p>
              <h3 className="text-xl font-bold text-white">Sanjay Vaishya</h3>
            </div>
          </div>

          <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg">
                <p className="font-mono text-xs text-[#00BFFF] mb-1">Brand Positioning</p>
                <p className="text-xs text-[#CCCCCC]">We Design, Develop &amp; Deliver Digital Solutions.</p>
              </div>
              <div className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg">
                <p className="font-mono text-xs text-[#ED1C24] mb-1">Team Model</p>
                <p className="text-xs text-[#CCCCCC]">Collaborative full-stack specialists under founder leadership.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#262B38] space-y-2 text-xs text-[#CCCCCC]">
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#00BFFF]" />
                <span>sanjayvaishya.dev@gmail.com</span>
              </p>
              <p className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-[#00BFFF]" />
                <span>sanjay.indiacybercafe.com</span>
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-8 space-y-6">
          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white">01. Founder &amp; Leadership</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed max-w-[72ch]">
              <strong className="text-white">Sanjay Vaishya</strong> is the Founder &amp; Lead Full-Stack Developer behind our independent software development team, as well as the founder of India Cyber Cafe in Singrauli, Madhya Pradesh. He leads technical architecture, project planning, client communication, quality assurance, and production delivery.
            </p>
          </section>

          <div className="border-t border-[#262B38]" />

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white">02. Collaborative Team Execution</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed max-w-[72ch]">
              Every client engagement is executed collectively across frontend, backend, mobile engineering, UI/UX design, database architecture, and QA specialists—managed transparently through milestones, proposals, and real-time project channels.
            </p>
          </section>

          <div className="border-t border-[#262B38]" />

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-white">03. End-to-End Delivery</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed max-w-[72ch]">
              From initial project intake and formal quotations to Razorpay milestone billing, deliverable reviews, and production deployment, the <strong className="text-white">Sanjay Vaishya Platform</strong> unifies agency showcase and collaborative project management in one place.
            </p>
          </section>

          <div className="pt-4 border-t border-[#262B38] flex flex-wrap items-center justify-between gap-4">
            <span className="font-mono text-xs text-[#C0C0C0]">Location: Jobgarh, Singrauli, MP</span>
            <a
              href="/about.html"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-medium text-[#00BFFF] border border-[#2B3140] rounded-lg hover:bg-white/5 transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              Open Standalone Page
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CookiePolicyView({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-8">
      <SectionBackHeader title="Cookie Policy" onBack={onBack} backLabel="Settings" />

      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#262B38]">
          <span className="font-mono text-xs text-[#1FA8D6]">Last Updated: April 06, 2026</span>
          <span className="font-mono text-xs text-[#C0C0C0]">GDPR · Google Play Console · Indian IT Act</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">01. What are Cookies?</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              Cookies are small text files stored on your device (computer or mobile) when you visit a website or use an application. They enable reliable core operation and provide anonymous usage insights to site maintainers.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">02. How We Use Cookies</h3>
            <ul className="text-sm text-[#CCCCCC] space-y-1.5">
              <li><strong className="text-white">Essential Cookies:</strong> Required for core navigation and interface state preferences.</li>
              <li><strong className="text-white">Analytics Cookies:</strong> Collect anonymous interaction metrics (such as Google Analytics) to improve stability.</li>
              <li><strong className="text-white">Functional Cookies:</strong> Store your explicit cookie consent selection across sessions.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">03. Third-Party Cookies</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              Trusted third-party analytics providers may set cookies to measure session duration and page navigation patterns so we can diagnose bottlenecks and refine guides.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">04. Managing Cookies</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              You can clear or block cookies through your browser settings at any time, or update your consent preference directly from the Settings section or consent prompt.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">05. Global Compliance & Policy</h3>
            <ul className="text-sm text-[#CCCCCC] space-y-1.5">
              <li><strong className="text-white">GDPR (EU / EEA & UK):</strong> Transparent disclosure and affirmative consent control.</li>
              <li><strong className="text-white">Google Play Console Policy:</strong> Clear data collection and storage disclosures.</li>
              <li><strong className="text-white">Indian IT Act & DPDP Framework:</strong> Reasonable security practices for user data.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">06. Contact Us</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              For questions regarding our cookie practices, write to{' '}
              <a href="mailto:sanjayvaishya.dev@gmail.com" className="text-[#1FA8D6] hover:underline">
                sanjayvaishya.dev@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPolicyView({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-8">
      <SectionBackHeader title="Privacy Policy" onBack={onBack} backLabel="Settings" />

      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-8 space-y-6">
        <div className="pb-4 border-b border-[#262B38]">
          <span className="font-mono text-xs text-[#1FA8D6]">Last Updated: April 01, 2026</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">01. Introduction</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              Welcome to the Sanjay Vaishya App. Your privacy is important to us. This policy outlines how information is handled when you use our support tools and guides.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">02. Information We Collect</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              When you submit a project inquiry or create a client account using Firebase Authentication, we collect only the details you provide—such as your full name, email address, phone/company profile, project requirements, and uploaded files—to collaborate on your software project.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">03. How We Use Information</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              Submitted details are used strictly to communicate with you via WhatsApp or Email. <strong className="text-white">We never sell user data to third parties.</strong>
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">04. Log Data & Third-Party Services</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              Standard browser or WebView logs and analytics cookies may be processed by services such as Google Analytics in accordance with their own privacy policies.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">05. Data Security & Children’s Privacy</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              We apply reasonable safeguards to protect submitted inquiries. This application does not target children under 13 and does not knowingly collect children’s data.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">06. Contact</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              Email: sanjayvaishya.dev@gmail.com<br />
              Phone: +91 9203251821
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function TermsView({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-8">
      <SectionBackHeader title="Terms & Conditions" onBack={onBack} backLabel="Settings" />

      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">01. Acceptance of Terms</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              By accessing or using the Sanjay Vaishya App, you agree to these Terms & Conditions. If you do not agree, please discontinue use of the application.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">02. Intellectual Property</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              All original copy, documentation, and branding belong to <strong className="text-white">Sanjay Vaishya / India Cyber Cafe</strong> and may not be redistributed without prior permission.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">03. User Responsibilities</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              You agree to use this platform strictly for lawful purposes and not to submit misleading or abusive content through the contact channels.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">04. Limitation of Liability</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              Technical assistance and guides are provided on an "as-is" basis. We are not liable for incidental damages arising from external hosting or third-party platforms.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">05. External Links & Governing Law</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              External links are provided for convenience. These terms are governed by the laws of <strong className="text-white">India</strong>, subject to the jurisdiction of courts in Singrauli, MP.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-bold text-white">06. Contact</h3>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              For questions regarding these terms, email{' '}
              <a href="mailto:sanjayvaishya.dev@gmail.com" className="text-[#1FA8D6] hover:underline">
                sanjayvaishya.dev@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function DeleteDataView({
  onBack,
  onNavigate,
}: {
  onBack: () => void;
  onNavigate?: (path: string) => void;
}) {
  const { user, logout, showToast } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    'Contact Form & Inquiry Data',
    'Personal Profile Information',
  ]);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<{ requestCode: string; status: string } | null>(null);

  const [confirmAccountDelete, setConfirmAccountDelete] = useState(false);
  const [accountDeleteReason, setAccountDeleteReason] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      setEmail((prev) => prev || user.email);
    }
  }, [user]);

  const categories = [
    'Contact Form & Inquiry Data',
    'Personal Profile Information',
    'Uploaded Files & Attachments',
    'App Usage Logs',
    'Other Workspace Data',
  ];

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((item) => item !== cat) : [...prev, cat]));
  };

  const handleSubmitCategoryRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRequest) return;
    setErrorMsg(null);

    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Enter the email address associated with your account or inquiry.');
      return;
    }
    if (selectedCategories.length === 0) {
      setErrorMsg('Select at least one data category to remove.');
      return;
    }

    setSubmittingRequest(true);
    try {
      const data = await apiFetch<{ requestCode: string; status: string }>('/api/public/data-deletion-requests', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          categories: selectedCategories,
          notes: notes.trim(),
        }),
      });
      setSubmittedReceipt({ requestCode: data.requestCode, status: data.status });
      showToast(`Deletion request ${data.requestCode} logged.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to submit deletion request.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleOpenEmailFallback = () => {
    const body = encodeURIComponent(
      `Hello Sanjay Vaishya Team,\n\nPlease delete the following data associated with my email (${email || '[Enter Email]'}):\n- ${selectedCategories.join(
        '\n- '
      )}\n\nAdditional details: ${notes || 'None'}\n`
    );
    window.location.href = `mailto:sanjayvaishya.dev@gmail.com?subject=Data%20Deletion%20Request&body=${body}`;
  };

  const handleDeleteOwnAccount = async () => {
    if (deletingAccount || !user) return;
    setErrorMsg(null);
    setDeletingAccount(true);
    try {
      const res = await apiFetch<{ requestCode: string; status: string }>('/api/auth/delete-account', {
        method: 'POST',
        body: JSON.stringify({ reason: accountDeleteReason.trim() }),
      });
      showToast(`Account deleted (${res.requestCode}). Signing out...`);
      await logout();
      if (onNavigate) onNavigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to delete account.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setDeletingAccount(false);
      setConfirmAccountDelete(false);
    }
  };

  const isAdminUser = Boolean(user?.roles.includes('admin'));

  return (
    <div className="space-y-8">
      <SectionBackHeader title="Account & Data Deletion" onBack={onBack} backLabel="Settings" accent="danger" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSubmitCategoryRequest}
          className="lg:col-span-7 bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-8 space-y-6"
        >
          <div className="space-y-1.5">
            <p className="font-mono text-xs text-[#00BFFF]">GOOGLE PLAY &amp; PRIVACY COMPLIANCE</p>
            <h3 className="text-lg font-bold text-white">Submit Data Deletion Request</h3>
            <p className="text-sm text-[#CCCCCC]">
              Select the data categories to erase from our project database and support logs. Requests are recorded directly on our server with a tracking code.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-[#ED1C24]/15 border border-[#ED1C24]/50 text-xs text-white">
              {errorMsg}
            </div>
          )}

          {submittedReceipt && (
            <div className="p-4 rounded-lg bg-[#00CC66]/10 border border-[#00CC66]/40 space-y-1">
              <p className="font-mono text-xs text-[#00CC66] flex items-center gap-1.5 tabular-nums">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                REQUEST LOGGED: {submittedReceipt.requestCode} ({submittedReceipt.status})
              </p>
              <p className="text-xs text-[#F4F6F9]">
                Your deletion request has been queued for verification and processing within 7–10 business days.
              </p>
            </div>
          )}

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-[#CCCCCC]">Registered / Inquiry Email Address *</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full min-h-[44px] px-3.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
            />
          </label>

          <div className="space-y-2.5">
            <span className="text-xs font-medium text-[#CCCCCC] block">Data Categories *</span>
            {categories.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-3.5 p-3.5 bg-[#1A1E28] border border-[#262B38] rounded-lg cursor-pointer hover:border-[#00BFFF]/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="w-4 h-4 rounded border-[#333333] bg-[#0B0D11] text-[#ED1C24] focus:ring-2 focus:ring-[#00BFFF]"
                />
                <span className="text-sm font-medium text-white">{cat}</span>
              </label>
            ))}
          </div>

          <label className="space-y-1.5 block">
            <span className="text-xs font-medium text-[#CCCCCC]">Additional Notes / Inquiry Code (Optional)</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional reference IDs (e.g. INQ-2026-XXXX) or context..."
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submittingRequest}
              className="flex-1 min-w-[200px] min-h-[44px] py-3 px-5 bg-[#ED1C24] hover:bg-[#B81D24] disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {submittingRequest ? 'Submitting Request...' : 'Submit Deletion Request'}
            </button>
            <button
              type="button"
              onClick={handleOpenEmailFallback}
              className="min-h-[44px] py-3 px-4 border border-[#2B3140] hover:border-[#00BFFF] text-xs font-medium text-[#CCCCCC] hover:text-white rounded-lg inline-flex items-center justify-center gap-2"
            >
              <Mail className="w-3.5 h-3.5 text-[#00BFFF]" />
              Email Copy
            </button>
          </div>
        </form>

        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#ED1C24]">
              <Trash2 className="w-4 h-4" />
              <h3 className="text-base font-bold text-white">Self-Service Account Deletion</h3>
            </div>
            {!user ? (
              <div className="space-y-3">
                <p className="text-xs text-[#CCCCCC] leading-relaxed">
                  Want to immediately delete your signed-in client account along with your Firebase Authentication and Realtime Database profile? Sign in first to use instant self-service deletion.
                </p>
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('/login')}
                    className="w-full min-h-[42px] px-4 py-2 rounded-lg border border-[#2B3140] hover:border-[#00BFFF] text-xs font-medium text-white"
                  >
                    Sign In to Manage Account
                  </button>
                )}
              </div>
            ) : isAdminUser ? (
              <p className="text-xs text-[#CCCCCC] leading-relaxed">
                Administrator accounts are protected against accidental self-deletion here. Update your role in Firebase Console before removing administrative accounts.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#CCCCCC] leading-relaxed">
                  Signed in as <span className="text-white font-semibold">{user.email}</span>. Self-service deletion permanently anonymizes your portal profile and revokes your Firebase login immediately.
                </p>
                <input
                  type="text"
                  value={accountDeleteReason}
                  onChange={(e) => setAccountDeleteReason(e.target.value)}
                  placeholder="Optional reason for leaving"
                  className="w-full min-h-[40px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                />
                {!confirmAccountDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmAccountDelete(true)}
                    className="w-full min-h-[42px] px-4 py-2 rounded-lg border border-[#ED1C24]/50 text-[#ED1C24] hover:bg-[#ED1C24]/10 text-xs font-semibold"
                  >
                    Delete My Account Permanently
                  </button>
                ) : (
                  <div className="p-3.5 rounded-lg bg-[#ED1C24]/10 border border-[#ED1C24]/50 space-y-3">
                    <p className="text-xs text-white font-medium">
                      Confirm permanent account deletion? This signs you out and cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={deletingAccount}
                        onClick={handleDeleteOwnAccount}
                        className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold"
                      >
                        {deletingAccount ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmAccountDelete(false)}
                        className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#2B3140] text-xs text-[#CCCCCC]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[#00BFFF] shrink-0 mt-0.5" />
            <p className="text-xs text-[#CCCCCC] leading-relaxed">
              Statutory billing records (verified invoices) may be retained as required by Indian tax law while personal contact data and credentials are erased.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeployGuideView({ onBack }: { onBack: () => void }) {
  const steps = [
    {
      num: '01',
      title: 'Login to Hostinger',
      body: 'Open the official Hostinger dashboard and sign in using your registered account email and password.',
    },
    {
      num: '02',
      title: 'Open hPanel & File Manager',
      body: 'Select your hosting plan, click Manage, and open File Manager. Navigate directly into the public_html directory.',
    },
    {
      num: '03',
      title: 'Upload Website Files',
      body: 'Upload your HTML, CSS, JavaScript, or PHP source files. If uploading a compressed ZIP bundle, extract it inside public_html.',
    },
    {
      num: '04',
      title: 'Set Primary Entry File',
      body: 'Verify your root homepage file is named index.html or index.php so the web server resolves requests automatically.',
    },
    {
      num: '05',
      title: 'Verify PHP Runtime Support',
      body: 'Hostinger enables PHP across standard plans by default—uploaded .php scripts execute immediately without extra flags.',
    },
    {
      num: '06',
      title: 'Connect Domain & DNS',
      body: 'Confirm your domain nameservers point to Hostinger. External domain transfers typically propagate within a few hours.',
    },
    {
      num: '07',
      title: 'Verify Live Deployment',
      body: 'Open your domain in a clean browser tab and confirm all stylesheets, scripts, and routes load over HTTPS.',
    },
  ];

  return (
    <div className="space-y-8">
      <SectionBackHeader title="Hostinger Deployment Guide" onBack={onBack} backLabel="Updates" />

      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-8 space-y-8">
        <div className="space-y-3 pb-6 border-b border-[#262B38]">
          <p className="font-mono text-xs text-[#1FA8D6]">Infrastructure Guide · Hostinger</p>
          <h3 className="text-2xl font-bold text-white">
            How to Deploy a Website on Hostinger (Step-by-Step)
          </h3>
          <p className="text-sm text-[#CCCCCC] max-w-[72ch]">
            Website deployment publishes your local codebase to a live server environment. Follow this structured workflow to push HTML, CSS, JavaScript, and PHP builds into production on Hostinger.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex items-center gap-3">
            <Globe className="w-5 h-5 text-[#1FA8D6] shrink-0" />
            <div>
              <p className="text-xs font-medium text-white">Domain Name</p>
              <p className="font-mono text-xs text-[#C0C0C0]">e.g. yourname.com</p>
            </div>
          </div>
          <div className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex items-center gap-3">
            <Cloud className="w-5 h-5 text-[#1FA8D6] shrink-0" />
            <div>
              <p className="text-xs font-medium text-white">Hostinger Plan</p>
              <p className="font-mono text-xs text-[#C0C0C0]">Active hPanel access</p>
            </div>
          </div>
          <div className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-[#1FA8D6] shrink-0" />
            <div>
              <p className="text-xs font-medium text-white">Build Assets</p>
              <p className="font-mono text-xs text-[#C0C0C0]">HTML, CSS, JS, PHP</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => (
            <div key={step.num} className="p-5 bg-[#1A1E28] border border-[#262B38] rounded-lg space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-[#1FA8D6] tabular-nums">{step.num}.</span>
                <h4 className="text-base font-bold text-white">{step.title}</h4>
              </div>
              <p className="text-sm text-[#CCCCCC] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-[#1A1E28] border border-[#22C55E]/30 rounded-lg space-y-2.5">
            <h4 className="text-sm font-bold text-[#22C55E] flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Operational Tips
            </h4>
            <ul className="text-xs text-[#CCCCCC] space-y-1.5">
              <li>Keep all file names lowercase and free of spaces</li>
              <li>Ensure every asset resides inside public_html</li>
              <li>Verify relative paths locally before uploading</li>
            </ul>
          </div>
          <div className="p-5 bg-[#1A1E28] border border-[#D9252D]/40 rounded-lg space-y-2.5">
            <h4 className="text-sm font-bold text-[#D9252D] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Common Pitfalls
            </h4>
            <ul className="text-xs text-[#CCCCCC] space-y-1.5">
              <li>Site fails to load: verify index.html or index.php exists</li>
              <li>Broken CSS or JS: audit case-sensitive relative paths</li>
              <li>404 on assets: confirm files are not nested in an extra subfolder</li>
            </ul>
          </div>
        </div>

        <div className="p-6 bg-[#1A1E28] border border-[#2B3140] rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">Need Deployment Support?</h4>
            <p className="text-xs text-[#CCCCCC]">Reach out directly if you encounter DNS or upload issues.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://wa.me/919203251821?text=I%20need%20help%20for%20deploying%20website%20on%20Hostinger"
              className="px-4 py-2.5 bg-[#D9252D] hover:bg-[#B81D24] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Support
            </a>
            <a
              href="mailto:sanjayvaishya.dev@gmail.com?subject=Help%20with%20Hostinger%20Deployment&body=Hello%20Sanjay,%20I%20need%20help%20for%20deploying%20my%20website%20on%20Hostinger."
              className="px-4 py-2.5 border border-[#333333] text-[#F4F6F9] hover:border-[#1FA8D6] text-xs font-medium rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Mail className="w-3.5 h-3.5 text-[#1FA8D6]" />
              Email Support
            </a>
            <a
              href="tel:+919203251821"
              className="px-4 py-2.5 border border-[#333333] text-[#F4F6F9] hover:border-[#1FA8D6] text-xs font-medium rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Phone className="w-3.5 h-3.5 text-[#1FA8D6]" />
              Call
            </a>
          </div>
        </div>

        <div className="pt-4 border-t border-[#262B38] flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#C0C0C0]">Keep iterating—consistent testing ensures reliable production deployments.</p>
          <a
            href="/deploy-hostinger-guide.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[#1FA8D6] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            Open Full Guide in New Tab
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function BlogGuideView({ onBack }: { onBack: () => void }) {
  const steps = [
    {
      num: '01',
      title: 'Create Project Workspace',
      body: 'Create a dedicated folder named my-website and add three core files: index.html, style.css, and script.js.',
    },
    {
      num: '02',
      title: 'Build Semantic HTML Structure',
      body: 'Define headings, paragraphs, navigation, and action buttons inside index.html to establish clear document hierarchy.',
    },
    {
      num: '03',
      title: 'Apply CSS Grid & Styling',
      body: 'Link style.css to configure typography, dark surface contrast, spacing rhythm, and clean button states.',
    },
    {
      num: '04',
      title: 'Add Interactive JavaScript',
      body: 'Attach event listeners in script.js to respond to user clicks, validate form inputs, and toggle dynamic UI states.',
    },
    {
      num: '05',
      title: 'Verify Responsive Layout',
      body: 'Test below 768px so multi-column grids collapse cleanly without horizontal scrolling or text truncation.',
    },
    {
      num: '06',
      title: 'Publish Online',
      body: 'Push your completed project to GitHub Pages, Netlify, or Hostinger to make it accessible over HTTPS.',
    },
  ];

  return (
    <div className="space-y-8">
      <SectionBackHeader title="Website Engineering Guide" onBack={onBack} backLabel="Updates" />

      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-8 space-y-8">
        <div className="space-y-3 pb-6 border-b border-[#262B38]">
          <p className="font-mono text-xs text-[#1FA8D6]">Core Web Fundamentals · HTML / CSS / JS</p>
          <h3 className="text-2xl font-bold text-white">
            How to Build a Website with HTML, CSS, and JS
          </h3>
          <p className="text-sm text-[#CCCCCC] max-w-[72ch]">
            A practical foundational guide for building clean, responsive web pages from scratch without unnecessary complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg space-y-1">
            <p className="font-mono text-xs font-bold text-[#1FA8D6] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              HTML5
            </p>
            <p className="text-xs text-[#CCCCCC]">Defines semantic page structure, headings, and content blocks.</p>
          </div>
          <div className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg space-y-1">
            <p className="font-mono text-xs font-bold text-[#1FA8D6] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              CSS3
            </p>
            <p className="text-xs text-[#CCCCCC]">Controls grid layout, typography scale, spacing, and contrast.</p>
          </div>
          <div className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg space-y-1">
            <p className="font-mono text-xs font-bold text-[#D9252D] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              JavaScript
            </p>
            <p className="text-xs text-[#CCCCCC]">Handles state updates, form validation, and interactive DOM behavior.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => (
            <div key={step.num} className="p-5 bg-[#1A1E28] border border-[#262B38] rounded-lg space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold text-[#1FA8D6] tabular-nums">{step.num}.</span>
                <h4 className="text-base font-bold text-white">{step.title}</h4>
              </div>
              <p className="text-sm text-[#CCCCCC] leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 bg-[#1A1E28] border border-[#22C55E]/30 rounded-lg space-y-2.5">
            <h4 className="text-sm font-bold text-[#22C55E] flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Best Practices
            </h4>
            <ul className="text-xs text-[#CCCCCC] space-y-1.5">
              <li>Keep markup structured and readable</li>
              <li>Use high-contrast text and consistent spacing</li>
              <li>Verify all file links and test on mobile widths</li>
            </ul>
          </div>
          <div className="p-5 bg-[#1A1E28] border border-[#D9252D]/40 rounded-lg space-y-2.5">
            <h4 className="text-sm font-bold text-[#D9252D] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Common Mistakes
            </h4>
            <ul className="text-xs text-[#CCCCCC] space-y-1.5">
              <li>Forgetting to link style.css or script.js in index.html</li>
              <li>Mismatched file names or unclosed HTML tags</li>
              <li>Skipping responsive checks below 768px</li>
            </ul>
          </div>
        </div>

        <div className="p-6 bg-[#1A1E28] border border-[#2B3140] rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white">Stuck on Your Build?</h4>
            <p className="text-xs text-[#CCCCCC]">Send your code question via WhatsApp, Email, or Phone.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://wa.me/919203251821?text=I%20need%20help%20for%20making%20HTML%20CSS%20website"
              className="px-4 py-2.5 bg-[#D9252D] hover:bg-[#B81D24] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp Support
            </a>
            <a
              href="mailto:sanjayvaishya.dev@gmail.com?subject=Help%20with%20HTML/CSS%20Website&body=Hello%20Sanjay,%20I%20need%20help%20for%20making%20HTML%20CSS%20website."
              className="px-4 py-2.5 border border-[#333333] text-[#F4F6F9] hover:border-[#1FA8D6] text-xs font-medium rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Mail className="w-3.5 h-3.5 text-[#1FA8D6]" />
              Email Support
            </a>
            <a
              href="tel:+919203251821"
              className="px-4 py-2.5 border border-[#333333] text-[#F4F6F9] hover:border-[#1FA8D6] text-xs font-medium rounded-lg inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Phone className="w-3.5 h-3.5 text-[#1FA8D6]" />
              Call
            </a>
          </div>
        </div>

        <div className="pt-4 border-t border-[#262B38] flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-[#C0C0C0]">Start small, build step by step, and ship to production.</p>
          <a
            href="/blog-website-guide.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-[#1FA8D6] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            Open Full Guide in New Tab
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
