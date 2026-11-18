import React, { useState, useEffect, useCallback } from 'react';
import { Plus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { AdminOperationsPanels } from './AdminOperationsPanels';
import { ADMIN_MAIN_MODULES, type AdminModule } from '../../components/navigation/navConfig';
import type {
  AdminUserRow,
  AuditLogRow,
  BlogPostItem,
  InquiryRecord,
  InvoiceRecord,
  PaymentRecord,
  PortfolioProject,
  ProjectRecord,
  ProposalRecord,
  PublicReview,
  ServiceItem,
  TeamMember,
} from '../../types/platform';

interface AdminFeatureProps {
  activeModule: AdminModule;
  onSelectModule: (mod: AdminModule) => void;
  onNavigate: (path: string) => void;
}

export function AdminFeature({ activeModule, onSelectModule, onNavigate }: AdminFeatureProps) {
  const { user, refreshPublicData, settings: publicSettings, showToast } = useAuth();
  const isFullAdmin = Boolean(user?.roles.includes('admin'));

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<{
    metrics: Record<string, number>;
    recentActivities: {
      id: number;
      action: string;
      entity_type: string;
      entity_id: string;
      actor_name: string | null;
      created_at: string;
    }[];
  } | null>(null);

  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioProject[]>([]);
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPostItem[]>([]);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);

  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    clientUserId: '',
    expectedDeliveryDate: '',
  });
  const [milestoneForm, setMilestoneForm] = useState({
    projectId: '',
    title: '',
    description: '',
    dueDate: '',
    amountInr: '',
  });
  const [teamForm, setTeamForm] = useState({
    name: '',
    designation: '',
    roleCategory: 'Full-Stack Developer',
    bio: '',
    skillsCsv: '',
    responsibilitiesCsv: '',
    userId: '',
  });
  const [settingsForm, setSettingsForm] = useState<Record<string, string>>({
    brand_name: 'Sanjay Vaishya',
    founder_name: 'Sanjay Vaishya',
    contact_email: 'sanjayvaishya.dev@gmail.com',
    contact_phone: '+91 9203251821',
    office_address: 'Jobgarh, Singrauli, Madhya Pradesh, India (486886)',
    whatsapp_number: '919203251821',
  });

  useEffect(() => {
    if (Object.keys(publicSettings).length > 0) {
      setSettingsForm((prev) => ({ ...prev, ...publicSettings }));
    }
  }, [publicSettings]);

  const loadAll = useCallback(async () => {
    try {
      const [ov, inq, usr, prj, prop, pay, tm] = await Promise.all([
        apiFetch<typeof overview>('/api/workspace/overview'),
        apiFetch<{ inquiries: InquiryRecord[] }>('/api/workspace/inquiries'),
        apiFetch<{ users: AdminUserRow[] }>('/api/admin/users'),
        apiFetch<{ projects: ProjectRecord[] }>('/api/workspace/projects'),
        apiFetch<{ proposals: ProposalRecord[] }>('/api/workspace/proposals'),
        apiFetch<{ payments: PaymentRecord[]; invoices: InvoiceRecord[] }>('/api/workspace/payments'),
        apiFetch<{ team: TeamMember[] }>('/api/admin/team'),
      ]);
      setOverview(ov);
      setInquiries(inq.inquiries);
      setUsers(usr.users);
      setProjects(prj.projects);
      setProposals(prop.proposals);
      setPayments(pay.payments);
      setInvoices(pay.invoices);
      setTeam(tm.team);

      if (isFullAdmin) {
        const [srv, port, blg, rev, aud] = await Promise.all([
          apiFetch<{ services: ServiceItem[] }>('/api/admin/services'),
          apiFetch<{ portfolio: PortfolioProject[] }>('/api/admin/portfolio'),
          apiFetch<{ posts: BlogPostItem[] }>('/api/admin/blog'),
          apiFetch<{ reviews: PublicReview[] }>('/api/admin/reviews'),
          apiFetch<{ logs: AuditLogRow[] }>('/api/admin/audit-logs'),
        ]);
        setServices(srv.services);
        setPortfolio(port.portfolio);
        setBlogPosts(blg.posts);
        setReviews(rev.reviews);
        setAuditLogs(aud.logs);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load admin workspace.', 'error');
    } finally {
      setLoading(false);
    }
  }, [isFullAdmin, showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const clientUsers = users.filter((u) => (u.roles_csv || '').includes('client'));

  if (loading && !overview) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-[#262B38] flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[11px] text-[#ED1C24]">FOUNDER &amp; OPERATIONS CONTROL CENTER</p>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Sanjay Vaishya Admin</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('/projects')}
            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs text-white"
          >
            Execution Workspace
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/messages')}
            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs text-white"
          >
            Real-Time Chat
          </button>
        </div>
      </div>

      {/* Compact Main Module Pill Strip on Tablet/Mobile */}
      <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1">
        {ADMIN_MAIN_MODULES.map((mod) => (
          <button
            key={mod.id}
            type="button"
            onClick={() => onSelectModule(mod.id)}
            className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border ${
              activeModule === mod.id
                ? 'bg-[#1A1E28] text-[#00BFFF] border-[#00BFFF]'
                : 'bg-[#13161D] text-[#CCCCCC] border-[#262B38]'
            }`}
          >
            {mod.label}
          </button>
        ))}
      </div>

      {activeModule === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 space-y-1">
              <p className="font-mono text-[11px] text-[#C0C0C0]">Clients</p>
              <p className="font-mono text-2xl font-bold text-white tabular-nums">
                {overview?.metrics.totalClients ?? 0}
              </p>
            </div>
            <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 space-y-1">
              <p className="font-mono text-[11px] text-[#C0C0C0]">Active Projects</p>
              <p className="font-mono text-2xl font-bold text-[#00BFFF] tabular-nums">
                {overview?.metrics.activeProjects ?? 0}
              </p>
            </div>
            <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 space-y-1">
              <p className="font-mono text-[11px] text-[#C0C0C0]">Open Inquiries</p>
              <p className="font-mono text-2xl font-bold text-[#ED1C24] tabular-nums">
                {overview?.metrics.openInquiries ?? 0}
              </p>
            </div>
            <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 space-y-1">
              <p className="font-mono text-[11px] text-[#C0C0C0]">Revenue (INR)</p>
              <p className="font-mono text-2xl font-bold text-[#00CC66] tabular-nums">
                {(overview?.metrics.collectedRevenue ?? 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3">
            <h2 className="text-base font-bold text-white">Recent Platform Activity</h2>
            {!overview?.recentActivities?.length ? (
              <p className="text-xs text-[#CCCCCC]">Platform activity logs appear here as actions occur.</p>
            ) : (
              <div className="space-y-2">
                {overview.recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-mono text-[#00BFFF]">{act.action}</span>{' '}
                      <span className="text-[#CCCCCC]">
                        on {act.entity_type} ({act.entity_id})
                      </span>
                      {act.actor_name && <span className="text-white"> · {act.actor_name}</span>}
                    </div>
                    <span className="font-mono text-[11px] text-[#C0C0C0] tabular-nums">
                      {act.created_at.slice(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeModule === 'inquiries' && (
        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white">Project Inquiries Queue ({inquiries.length})</h2>
          {inquiries.length === 0 ? (
            <p className="text-sm text-[#CCCCCC]">No inquiries submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div key={inq.id} className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-mono text-xs text-[#00BFFF] tabular-nums">
                        {inq.inquiry_code} · {inq.category}
                      </p>
                      <h3 className="text-base font-bold text-white">{inq.project_title}</h3>
                      <p className="text-xs text-[#CCCCCC]">
                        {inq.client_name} ({inq.email} · {inq.phone}) {inq.company ? `· ${inq.company}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={inq.status}
                        onChange={async (e) => {
                          await apiFetch(`/api/admin/inquiries/${inq.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ status: e.target.value, adminNotes: inq.admin_notes || '' }),
                          });
                          showToast(`Inquiry ${inq.inquiry_code} updated.`);
                          await loadAll();
                        }}
                        className="min-h-[38px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                      >
                        {[
                          'New',
                          'Under Review',
                          'Discussion',
                          'Proposal Sent',
                          'Accepted',
                          'Rejected',
                          'Converted to Project',
                        ].map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      {inq.status !== 'Converted to Project' && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await apiFetch<{ projectCode: string }>(
                              `/api/admin/inquiries/${inq.id}/convert`,
                              { method: 'POST', body: JSON.stringify({}) }
                            );
                            showToast(`Converted to Project ${res.projectCode}.`);
                            await loadAll();
                          }}
                          className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          Convert to Project
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[#CCCCCC] leading-relaxed">{inq.description}</p>
                  <div className="font-mono text-[11px] text-[#C0C0C0] flex flex-wrap gap-4">
                    <span>Budget: {inq.budget_range}</span>
                    <span>Timeline: {inq.timeline}</span>
                    {inq.preferred_tech && <span>Tech: {inq.preferred_tech}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeModule === 'clients' && (
        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white">Client Accounts ({clientUsers.length})</h2>
          {clientUsers.length === 0 ? (
            <p className="text-sm text-[#CCCCCC]">No client accounts registered yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {clientUsers.map((c) => (
                <div key={c.id} className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white">{c.name}</p>
                    <span className="font-mono text-[11px] text-[#00CC66]">
                      {c.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-[#00BFFF] break-all">{c.email}</p>
                  <p className="text-xs text-[#CCCCCC]">
                    {c.company || 'Individual Client'} · {c.phone || 'No phone recorded'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeModule === 'projects' && (
        <div className="space-y-5">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await apiFetch('/api/admin/projects', {
                method: 'POST',
                body: JSON.stringify(projectForm),
              });
              setProjectForm({ title: '', description: '', clientUserId: '', expectedDeliveryDate: '' });
              showToast('Project initialized.');
              await loadAll();
            }}
            className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4"
          >
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#00BFFF]" />
              Create New Project Workspace
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={projectForm.title}
                onChange={(e) => setProjectForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Project title"
                className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
              />
              <select
                required
                value={projectForm.clientUserId}
                onChange={(e) => setProjectForm((p) => ({ ...p, clientUserId: e.target.value }))}
                className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
              >
                <option value="">Select Client *</option>
                {clientUsers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={projectForm.expectedDeliveryDate}
                onChange={(e) => setProjectForm((p) => ({ ...p, expectedDeliveryDate: e.target.value }))}
                className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
              />
            </div>
            <textarea
              rows={2}
              required
              value={projectForm.description}
              onChange={(e) => setProjectForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Scope & technical goals..."
              className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
            <button type="submit" className="min-h-[42px] px-5 py-2 rounded-lg bg-[#ED1C24] text-white text-xs font-semibold">
              Create Project
            </button>
          </form>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await apiFetch(`/api/workspace/projects/${milestoneForm.projectId}/milestones`, {
                method: 'POST',
                body: JSON.stringify({
                  title: milestoneForm.title,
                  description: milestoneForm.description,
                  dueDate: milestoneForm.dueDate,
                  amountInr: Number(milestoneForm.amountInr || 0),
                }),
              });
              setMilestoneForm({ projectId: '', title: '', description: '', dueDate: '', amountInr: '' });
              showToast('Milestone added.');
              await loadAll();
            }}
            className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4"
          >
            <h3 className="text-base font-bold text-white">Add Milestone to Project</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                required
                value={milestoneForm.projectId}
                onChange={(e) => setMilestoneForm((p) => ({ ...p, projectId: e.target.value }))}
                className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
              >
                <option value="">Select Project *</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_code} · {p.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={milestoneForm.title}
                onChange={(e) => setMilestoneForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Milestone title"
                className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
              />
              <input
                type="date"
                value={milestoneForm.dueDate}
                onChange={(e) => setMilestoneForm((p) => ({ ...p, dueDate: e.target.value }))}
                className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
              />
              <input
                type="number"
                value={milestoneForm.amountInr}
                onChange={(e) => setMilestoneForm((p) => ({ ...p, amountInr: e.target.value }))}
                placeholder="Amount INR"
                className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
              />
            </div>
            <button
              type="submit"
              className="min-h-[42px] px-4 py-2 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs font-semibold text-white"
            >
              Add Milestone
            </button>
          </form>

          <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3">
            <h3 className="text-base font-bold text-white">All Projects ({projects.length})</h3>
            {projects.map((prj) => (
              <div
                key={prj.id}
                className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="font-mono text-xs text-[#00BFFF] tabular-nums">
                    {prj.project_code} · Progress {prj.progress}%
                  </p>
                  <p className="text-sm font-bold text-white">{prj.title}</p>
                  <p className="text-xs text-[#CCCCCC]">Client: {prj.client_name}</p>
                </div>
                <select
                  value={prj.status}
                  onChange={async (e) => {
                    await apiFetch(`/api/admin/projects/${prj.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: e.target.value }),
                    });
                    showToast('Project status updated.');
                    await loadAll();
                  }}
                  className="min-h-[40px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                >
                  {[
                    'Inquiry',
                    'Planning',
                    'Proposal',
                    'Approved',
                    'In Progress',
                    'Review',
                    'Testing',
                    'Completed',
                    'Delivered',
                    'On Hold',
                    'Cancelled',
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeModule === 'team' && (
        <div className="space-y-5">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await apiFetch('/api/admin/team', {
                method: 'POST',
                body: JSON.stringify({
                  ...teamForm,
                  userId: teamForm.userId ? Number(teamForm.userId) : null,
                  skills: teamForm.skillsCsv.split(',').map((s) => s.trim()).filter(Boolean),
                  responsibilities: teamForm.responsibilitiesCsv.split(',').map((s) => s.trim()).filter(Boolean),
                }),
              });
              setTeamForm({
                name: '',
                designation: '',
                roleCategory: 'Full-Stack Developer',
                bio: '',
                skillsCsv: '',
                responsibilitiesCsv: '',
                userId: '',
              });
              showToast('Team member profile added.');
              await Promise.all([loadAll(), refreshPublicData()]);
            }}
            className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4"
          >
            <h2 className="text-base sm:text-lg font-bold text-white">Add Verified Team Member Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={teamForm.name}
                onChange={(e) => setTeamForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Full Name"
                className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
              />
              <input
                type="text"
                required
                value={teamForm.designation}
                onChange={(e) => setTeamForm((p) => ({ ...p, designation: e.target.value }))}
                placeholder="Designation"
                className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
              />
              <select
                value={teamForm.roleCategory}
                onChange={(e) => setTeamForm((p) => ({ ...p, roleCategory: e.target.value }))}
                className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
              >
                {[
                  'Frontend Developer',
                  'Backend Developer',
                  'Full-Stack Developer',
                  'Android Developer',
                  'UI/UX Designer',
                  'Database Developer',
                  'QA Tester',
                  'Project Manager',
                  'DevOps Engineer',
                ].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              rows={2}
              value={teamForm.bio}
              onChange={(e) => setTeamForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Role summary and technical specialization..."
              className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={teamForm.skillsCsv}
                onChange={(e) => setTeamForm((p) => ({ ...p, skillsCsv: e.target.value }))}
                placeholder="Skills (comma-separated)"
                className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
              />
              <input
                type="text"
                value={teamForm.responsibilitiesCsv}
                onChange={(e) => setTeamForm((p) => ({ ...p, responsibilitiesCsv: e.target.value }))}
                placeholder="Responsibilities (comma-separated)"
                className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
              />
            </div>
            <button type="submit" className="min-h-[42px] px-5 py-2 rounded-lg bg-[#ED1C24] text-white text-xs font-semibold">
              Save Team Member
            </button>
          </form>

          <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3">
            <h3 className="text-base font-bold text-white">Team Directory ({team.length})</h3>
            {team.map((m) => (
              <div key={m.id} className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">{m.name}</p>
                  <p className="text-xs text-[#00BFFF]">{m.designation} · {m.roleCategory}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch(`/api/admin/team/${m.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ isActive: !m.isActive }),
                    });
                    await Promise.all([loadAll(), refreshPublicData()]);
                  }}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#333333] text-xs text-white"
                >
                  {m.isActive ? 'Published (Hide)' : 'Hidden (Publish)'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeModule === 'analytics' && (
        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-5">
          <div className="space-y-1">
            <p className="font-mono text-xs text-[#00BFFF]">DATABASE-DERIVED METRICS</p>
            <h2 className="text-lg font-bold text-white">Reports &amp; Analytics</h2>
          </div>

          {[
            { label: 'Total Inquiries Logged', value: inquiries.length, max: Math.max(10, inquiries.length) },
            { label: 'Converted & Active Projects', value: projects.length, max: Math.max(10, projects.length) },
            { label: 'Issued Proposals', value: proposals.length, max: Math.max(10, proposals.length) },
            {
              label: 'Verified Payments Completed',
              value: payments.filter((p) => p.status === 'successful').length,
              max: Math.max(10, payments.length),
            },
          ].map((bar) => (
            <div key={bar.label} className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#CCCCCC]">{bar.label}</span>
                <span className="font-mono text-white tabular-nums">{bar.value}</span>
              </div>
              <div className="w-full h-2.5 bg-[#0B0D11] rounded overflow-hidden">
                <div
                  className="h-full bg-[#00BFFF]"
                  style={{ width: `${Math.min(100, Math.round((bar.value / bar.max) * 100))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {activeModule === 'settings' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await apiFetch('/api/admin/settings', {
              method: 'PUT',
              body: JSON.stringify({ settings: settingsForm }),
            });
            await refreshPublicData();
            showToast('Global platform settings saved.');
          }}
          className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4"
        >
          <h2 className="text-base sm:text-lg font-bold text-white">Global Platform Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(settingsForm).map(([k, v]) => (
              <label key={k} className="space-y-1.5 block">
                <span className="font-mono text-xs text-[#00BFFF]">{k}</span>
                <input
                  type="text"
                  value={v}
                  onChange={(e) => setSettingsForm((p) => ({ ...p, [k]: e.target.value }))}
                  className="w-full min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                />
              </label>
            ))}
          </div>
          <button type="submit" className="min-h-[42px] px-5 py-2 rounded-lg bg-[#ED1C24] text-white text-xs font-semibold inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Save Configuration
          </button>
        </form>
      )}

      {activeModule === 'audit' && (
        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-white">Security &amp; Action Audit Trail ({auditLogs.length})</h2>
          <div className="space-y-2.5">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-mono text-[#00BFFF]">
                    {log.action} · {log.entity_type}:{log.entity_id}
                  </p>
                  <p className="text-[#CCCCCC]">
                    Actor: {log.actor_name || 'Guest / System'} {log.actor_email ? `(${log.actor_email})` : ''}
                  </p>
                </div>
                <span className="font-mono text-[11px] text-[#C0C0C0] tabular-nums">
                  {log.created_at.slice(0, 19).replace('T', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <AdminOperationsPanels
        activeModule={activeModule}
        users={users}
        inquiries={inquiries}
        projects={projects}
        services={services}
        portfolio={portfolio}
        proposals={proposals}
        payments={payments}
        invoices={invoices}
        blogPosts={blogPosts}
        reviews={reviews}
        onReload={loadAll}
        onNavigate={onNavigate}
      />
    </div>
  );
}
