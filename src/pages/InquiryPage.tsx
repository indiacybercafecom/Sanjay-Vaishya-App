import React, { useState, useEffect } from 'react';
import {
  Send,
  Upload,
  X,
  CheckCircle2,
  FileText,
  ArrowRight,
  ShieldCheck,
  Clock,
  Layers,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAuthHeaders } from '../lib/api';

interface InquiryPageProps {
  preselectedCategory?: string;
  onNavigate: (path: string) => void;
}

const DRAFT_STORAGE_KEY = 'sv_project_inquiry_draft';

const DEFAULT_CATEGORIES = [
  'Web Development',
  'Android / Mobile App Development',
  'Custom Software Development',
  'UI/UX Design',
  'API & Backend Systems',
  'Website Maintenance & Optimization',
  'Business Automation & Dashboards',
];

const BUDGET_RANGES = [
  'Under INR 25,000',
  'INR 25,000 - INR 75,000',
  'INR 75,000 - INR 2,00,000',
  'INR 2,00,000 - INR 5,00,000',
  'INR 5,00,000+ (Enterprise)',
  'Flexible / Need Quotation',
];

const TIMELINES = [
  'Urgent (2 - 4 weeks)',
  'Standard (1 - 2 months)',
  'Comprehensive (2 - 4 months)',
  'Long-Term Retainer / Phased',
  'Flexible',
];

export default function InquiryPage({ preselectedCategory, onNavigate }: InquiryPageProps) {
  const { user, services, showToast } = useAuth();

  const categories = services.length > 0 ? services.map((s) => s.title) : DEFAULT_CATEGORIES;

  const [form, setForm] = useState({
    clientName: '',
    email: '',
    phone: '',
    company: '',
    projectTitle: '',
    category: preselectedCategory || categories[0],
    description: '',
    requiredFeatures: '',
    preferredTech: '',
    budgetRange: BUDGET_RANGES[1],
    timeline: TIMELINES[1],
    referenceUrls: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{ inquiryCode: string; status: string } | null>(null);

  // Restore saved draft & prefill user profile if available
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<typeof form>;
        setForm((prev) => ({
          ...prev,
          ...parsed,
          category: preselectedCategory || parsed.category || prev.category,
        }));
      }
    } catch {
      // Ignore storage error
    }
  }, [preselectedCategory]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        clientName: prev.clientName || user.name,
        email: prev.email || user.email,
        phone: prev.phone || user.phone || '',
        company: prev.company || user.company || '',
      }));
    }
  }, [user]);

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      try {
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage error
      }
      return next;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const combined = [...files, ...selected].slice(0, 3);
    setFiles(combined);
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);

    if (
      !form.clientName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.projectTitle.trim() ||
      !form.description.trim()
    ) {
      setErrorMsg('Please fill out all required fields marked with *.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = new FormData();
      (Object.entries(form) as [string, string][]).forEach(([k, v]) => payload.append(k, v));
      files.forEach((f) => payload.append('attachments', f));

      const headers = await getAuthHeaders();
      const response = await fetch('/api/public/inquiries', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: payload,
      });

      const data = (await response.json()) as { inquiryCode?: string; status?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Unable to submit inquiry.');
      }

      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      setSubmittedResult({
        inquiryCode: data.inquiryCode || 'INQ-SUBMITTED',
        status: data.status || 'New',
      });
      showToast(`Project inquiry ${data.inquiryCode} submitted.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Submission failed.';
      setErrorMsg(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedResult) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-10 space-y-6">
          <div className="w-12 h-12 rounded-lg bg-[#00CC66]/10 border border-[#00CC66]/40 flex items-center justify-center text-[#00CC66]">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <p className="font-mono text-xs text-[#00BFFF] tabular-nums">
              REFERENCE ID: {submittedResult.inquiryCode} · STATUS: {submittedResult.status.toUpperCase()}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Project Requirement Logged
            </h1>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              Sanjay Vaishya and our engineering leads have received your project specification. We review requirements carefully and prepare scope clarification or a structured proposal inside your Client Portal.
            </p>
          </div>

          <div className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg space-y-2 text-xs text-[#CCCCCC]">
            <p className="font-medium text-white">Next Steps</p>
            <ul className="space-y-1.5">
              <li>1. Requirement audit by Sanjay Vaishya &amp; architecture team</li>
              <li>2. Technical clarification &amp; formal quotation issued to your account</li>
              <li>3. Milestone schedule &amp; workspace chat activation upon approval</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {user ? (
              <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center gap-2"
              >
                Track in Client Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center gap-2"
              >
                Create Client Account to Track
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSubmittedResult(null);
                setFiles([]);
                setForm((prev) => ({
                  ...prev,
                  projectTitle: '',
                  description: '',
                  requiredFeatures: '',
                  referenceUrls: '',
                }));
              }}
              className="min-h-[44px] px-5 py-2.5 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs font-medium text-[#F4F6F9]"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="pb-6 border-b border-[#262B38] space-y-2">
        <p className="font-mono text-xs text-[#00BFFF]">Structured Project Intake</p>
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Start a Development Project
        </h1>
        <p className="text-sm text-[#CCCCCC] max-w-[68ch]">
          Share your technical goals, required features, preferred stack, and timeline. Your inquiry is stored securely in our platform and assigned a unique tracking reference.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-8 space-y-6"
        >
          {errorMsg && (
            <div className="p-4 rounded-lg bg-[#ED1C24]/15 border border-[#ED1C24]/50 text-xs text-white">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            <h2 className="text-sm font-mono text-[#00BFFF] font-semibold">01 · Contact Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-[#CCCCCC]">Full Name *</span>
                <input
                  type="text"
                  required
                  value={form.clientName}
                  onChange={(e) => updateField('clientName', e.target.value)}
                  placeholder="Your full name"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
                />
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-[#CCCCCC]">Email Address *</span>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="name@company.com"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
                />
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-[#CCCCCC]">Phone / WhatsApp Number *</span>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
                />
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-[#CCCCCC]">Company / Organization (Optional)</span>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Company or startup name"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
                />
              </label>
            </div>
          </div>

          <div className="border-t border-[#262B38] pt-6 space-y-4">
            <h2 className="text-sm font-mono text-[#00BFFF] font-semibold">02 · Project Specification</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-[#CCCCCC]">Project Title *</span>
                <input
                  type="text"
                  required
                  value={form.projectTitle}
                  onChange={(e) => updateField('projectTitle', e.target.value)}
                  placeholder="e.g. Custom Inventory & Billing Portal"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
                />
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-[#CCCCCC]">Project Category *</span>
                <select
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-[#CCCCCC]">Project Description &amp; Business Goals *</span>
              <textarea
                rows={4}
                required
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe what problem your software solves, primary users, and core workflow..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
              />
            </label>

            <label className="space-y-1.5 block">
              <span className="text-xs font-medium text-[#CCCCCC]">Required Features &amp; Modules</span>
              <textarea
                rows={3}
                value={form.requiredFeatures}
                onChange={(e) => updateField('requiredFeatures', e.target.value)}
                placeholder="e.g. Role-based login, Razorpay checkout, admin analytics, PDF invoicing, mobile responsiveness..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-[#CCCCCC]">Preferred Tech Stack (Optional)</span>
                <input
                  type="text"
                  value={form.preferredTech}
                  onChange={(e) => updateField('preferredTech', e.target.value)}
                  placeholder="e.g. React, Node.js, PostgreSQL, Kotlin"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
                />
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-[#CCCCCC]">Reference URLs / Examples (Optional)</span>
                <input
                  type="text"
                  value={form.referenceUrls}
                  onChange={(e) => updateField('referenceUrls', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
                />
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-[#CCCCCC]">Estimated Budget Range *</span>
                <select
                  value={form.budgetRange}
                  onChange={(e) => updateField('budgetRange', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
                >
                  {BUDGET_RANGES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 block">
                <span className="text-xs font-medium text-[#CCCCCC]">Target Timeline *</span>
                <select
                  value={form.timeline}
                  onChange={(e) => updateField('timeline', e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-sm text-white focus:border-[#00BFFF] focus:outline-none"
                >
                  {TIMELINES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="border-t border-[#262B38] pt-6 space-y-3">
            <h2 className="text-sm font-mono text-[#00BFFF] font-semibold">
              03 · Supporting Files (Up to 3 · PDF, PNG, JPG, DOCX, ZIP · Max 10MB)
            </h2>
            <label className="block p-4 rounded-lg bg-[#0B0D11] border border-dashed border-[#2B3140] hover:border-[#00BFFF] transition-colors cursor-pointer">
              <div className="flex items-center gap-3 text-xs text-[#CCCCCC]">
                <Upload className="w-4 h-4 text-[#00BFFF] shrink-0" />
                <span>Select wireframes, requirement docs, or reference screenshots</span>
              </div>
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.zip,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-lg bg-[#1A1E28] border border-[#262B38] text-xs"
                  >
                    <span className="flex items-center gap-2 text-white truncate">
                      <FileText className="w-3.5 h-3.5 text-[#00BFFF] shrink-0" />
                      <span className="truncate">{file.name}</span>
                      <span className="font-mono text-[#C0C0C0] tabular-nums shrink-0">
                        ({Math.max(1, Math.round(file.size / 1024))} KB)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-[#CCCCCC] hover:text-[#ED1C24] p-1"
                      aria-label="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] px-6 py-3 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] disabled:opacity-60 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting Requirement...' : 'Submit Project Inquiry'}
            </button>
          </div>
        </form>

        {/* Right Guidance Rail */}
        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 space-y-4">
            <p className="font-mono text-xs text-[#00BFFF]">Founder-Led Evaluation</p>
            <h3 className="text-lg font-bold text-white">What Happens After Submission</h3>
            <div className="space-y-4 text-xs text-[#CCCCCC] leading-relaxed">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#00BFFF] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Technical Discovery</p>
                  <p>Sanjay Vaishya &amp; team leads review your feature checklist and architecture constraints.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Layers className="w-4 h-4 text-[#00BFFF] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Milestone Quotation</p>
                  <p>Receive an itemized proposal in your Client Portal with transparent timelines and Razorpay milestone billing.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#00CC66] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Confidentiality &amp; Security</p>
                  <p>All uploaded requirement files are stored in private authenticated storage—never exposed publicly.</p>
                </div>
              </div>
            </div>
          </div>

          {!user && (
            <div className="bg-[#1A1E28] border border-[#262B38] rounded-lg p-5 space-y-3">
              <p className="text-xs font-semibold text-white">Already have a client account?</p>
              <p className="text-xs text-[#CCCCCC]">
                Sign in first to automatically link this inquiry to your project workspace.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="w-full min-h-[44px] px-4 py-2 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs font-medium text-white"
              >
                Sign In to Client Portal
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
