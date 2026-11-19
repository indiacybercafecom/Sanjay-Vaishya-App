import React, { useState } from 'react';
import { ArrowRight, Download, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';
import { downloadProposalPdf, downloadInvoicePdf } from '../../lib/pdf';
import type { AdminModule } from '../../components/navigation/navConfig';
import type {
  AdminUserRow,
  BlogPostItem,
  InquiryRecord,
  InvoiceRecord,
  PaymentRecord,
  PortfolioProject,
  ProjectRecord,
  ProposalRecord,
  PublicReview,
  ServiceItem,
  UserRole,
} from '../../types/platform';

interface AdminOperationsPanelsProps {
  activeModule: AdminModule;
  users: AdminUserRow[];
  inquiries: InquiryRecord[];
  projects: ProjectRecord[];
  services: ServiceItem[];
  portfolio: PortfolioProject[];
  proposals: ProposalRecord[];
  payments: PaymentRecord[];
  invoices: InvoiceRecord[];
  blogPosts: BlogPostItem[];
  reviews: PublicReview[];
  onReload: () => Promise<void>;
  onNavigate: (path: string) => void;
}

export function AdminOperationsPanels({
  activeModule,
  users,
  inquiries,
  projects,
  services,
  portfolio,
  proposals,
  payments,
  invoices,
  blogPosts,
  reviews,
  onReload,
  onNavigate,
}: AdminOperationsPanelsProps) {
  const { notifications, refreshPublicData, refreshNotifications, showToast } = useAuth();

  const clientUsers = users.filter((u) => (u.roles_csv || '').includes('client'));
  const staffUsers = users.filter((u) =>
    ['admin', 'project_manager', 'developer', 'designer'].some((r) => (u.roles_csv || '').includes(r))
  );

  const [taskForm, setTaskForm] = useState({
    projectId: '',
    title: '',
    description: '',
    assignedToUserId: '',
    priority: 'medium',
    dueDate: '',
  });
  const [serviceForm, setServiceForm] = useState({
    title: '',
    category: '',
    summary: '',
    description: '',
    featuresCsv: '',
    techCsv: '',
  });
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    category: 'Web Application',
    summary: '',
    description: '',
    challenges: '',
    solution: '',
    techCsv: '',
    liveUrl: '',
    githubUrl: '',
  });
  const [proposalForm, setProposalForm] = useState({
    clientUserId: '',
    inquiryId: '',
    projectId: '',
    title: '',
    scopeSummary: '',
    timeline: '4-6 weeks',
    paymentSchedule: '40% Advance, 40% Beta Milestone, 20% Final Delivery',
    terms: 'Source code & repository ownership transferred upon full milestone completion.',
    sendNow: true,
    items: [{ title: 'Core Architecture & Full-Stack Build', description: '', amountInr: 25000 }],
  });
  const [paymentReqForm, setPaymentReqForm] = useState({
    clientUserId: '',
    projectId: '',
    amountInr: '',
    paymentType: 'milestone',
  });
  const [blogForm, setBlogForm] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'Engineering',
    tag: 'Architecture',
  });

  if (activeModule === 'tasks') {
    return (
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await apiFetch(`/api/workspace/projects/${taskForm.projectId}/tasks`, {
              method: 'POST',
              body: JSON.stringify({
                title: taskForm.title,
                description: taskForm.description,
                assignedToUserId: taskForm.assignedToUserId ? Number(taskForm.assignedToUserId) : null,
                priority: taskForm.priority,
                dueDate: taskForm.dueDate,
              }),
            });
            setTaskForm({ projectId: '', title: '', description: '', assignedToUserId: '', priority: 'medium', dueDate: '' });
            showToast('Task created and assigned.');
            await onReload();
          } catch (err) {
            showToast(err instanceof Error ? err.message : 'Unable to create task.', 'error');
          }
        }}
        className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4"
      >
        <h2 className="text-base sm:text-lg font-bold text-white">Assign Development Task</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            required
            value={taskForm.projectId}
            onChange={(e) => setTaskForm((p) => ({ ...p, projectId: e.target.value }))}
            className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
          >
            <option value="">Select Project *</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.project_code} · {p.title}
              </option>
            ))}
          </select>
          <select
            value={taskForm.assignedToUserId}
            onChange={(e) => setTaskForm((p) => ({ ...p, assignedToUserId: e.target.value }))}
            className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
          >
            <option value="">Assign Team Member</option>
            {staffUsers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.roles_csv})
              </option>
            ))}
          </select>
          <input
            type="text"
            required
            value={taskForm.title}
            onChange={(e) => setTaskForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Task title"
            className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={taskForm.priority}
              onChange={(e) => setTaskForm((p) => ({ ...p, priority: e.target.value }))}
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
            <input
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm((p) => ({ ...p, dueDate: e.target.value }))}
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
          </div>
        </div>
        <textarea
          rows={3}
          value={taskForm.description}
          onChange={(e) => setTaskForm((p) => ({ ...p, description: e.target.value }))}
          placeholder="Technical implementation details..."
          className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
        />
        <button type="submit" className="min-h-[42px] px-5 py-2 rounded-lg bg-[#ED1C24] text-white text-xs font-semibold">
          Create &amp; Assign Task
        </button>
      </form>
    );
  }

  if (activeModule === 'services') {
    return (
      <div className="space-y-5">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await apiFetch('/api/admin/services', {
                method: 'POST',
                body: JSON.stringify({
                  ...serviceForm,
                  features: serviceForm.featuresCsv.split(',').map((s) => s.trim()).filter(Boolean),
                  technologies: serviceForm.techCsv.split(',').map((s) => s.trim()).filter(Boolean),
                }),
              });
              setServiceForm({ title: '', category: '', summary: '', description: '', featuresCsv: '', techCsv: '' });
              showToast('Service created.');
              await Promise.all([onReload(), refreshPublicData()]);
            } catch (err) {
              showToast(err instanceof Error ? err.message : 'Unable to publish service.', 'error');
            }
          }}
          className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4"
        >
          <h2 className="text-base sm:text-lg font-bold text-white">Add Development Service</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={serviceForm.title}
              onChange={(e) => setServiceForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Service Title"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
            <input
              type="text"
              value={serviceForm.category}
              onChange={(e) => setServiceForm((p) => ({ ...p, category: e.target.value }))}
              placeholder="Category"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
          </div>
          <input
            type="text"
            required
            value={serviceForm.summary}
            onChange={(e) => setServiceForm((p) => ({ ...p, summary: e.target.value }))}
            placeholder="Summary"
            className="w-full min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={serviceForm.featuresCsv}
              onChange={(e) => setServiceForm((p) => ({ ...p, featuresCsv: e.target.value }))}
              placeholder="Features (comma-separated)"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
            <input
              type="text"
              value={serviceForm.techCsv}
              onChange={(e) => setServiceForm((p) => ({ ...p, techCsv: e.target.value }))}
              placeholder="Technologies (comma-separated)"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
          </div>
          <button type="submit" className="min-h-[42px] px-5 py-2 rounded-lg bg-[#ED1C24] text-white text-xs font-semibold">
            Publish Service
          </button>
        </form>

        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3">
          <h3 className="text-base font-bold text-white">Configured Services ({services.length})</h3>
          {services.map((srv) => (
            <div key={srv.id} className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap justify-between gap-3">
              <div className="space-y-0.5 max-w-xl">
                <p className="text-sm font-bold text-white">{srv.title}</p>
                <p className="text-xs text-[#CCCCCC]">{srv.summary}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await apiFetch(`/api/admin/services/${srv.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ isPublished: !srv.is_published }),
                    });
                    await Promise.all([onReload(), refreshPublicData()]);
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : 'Unable to update service.', 'error');
                  }
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#333333] text-xs text-white"
              >
                {srv.is_published ? 'Published (Hide)' : 'Draft (Publish)'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeModule === 'portfolio') {
    return (
      <div className="space-y-5">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await apiFetch('/api/admin/portfolio', {
                method: 'POST',
                body: JSON.stringify({
                  ...portfolioForm,
                  technologies: portfolioForm.techCsv.split(',').map((s) => s.trim()).filter(Boolean),
                }),
              });
              setPortfolioForm({
                title: '',
                category: 'Web Application',
                summary: '',
                description: '',
                challenges: '',
                solution: '',
                techCsv: '',
                liveUrl: '',
                githubUrl: '',
              });
              showToast('Portfolio case study saved.');
              await Promise.all([onReload(), refreshPublicData()]);
            } catch (err) {
              showToast(err instanceof Error ? err.message : 'Unable to save portfolio project.', 'error');
            }
          }}
          className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4"
        >
          <h2 className="text-base sm:text-lg font-bold text-white">Add Portfolio Case Study</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={portfolioForm.title}
              onChange={(e) => setPortfolioForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Project Title"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
            <input
              type="text"
              required
              value={portfolioForm.category}
              onChange={(e) => setPortfolioForm((p) => ({ ...p, category: e.target.value }))}
              placeholder="Category"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
          </div>
          <input
            type="text"
            required
            value={portfolioForm.summary}
            onChange={(e) => setPortfolioForm((p) => ({ ...p, summary: e.target.value }))}
            placeholder="Summary"
            className="w-full min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <textarea
              rows={2}
              value={portfolioForm.challenges}
              onChange={(e) => setPortfolioForm((p) => ({ ...p, challenges: e.target.value }))}
              placeholder="Engineering Challenges"
              className="px-3 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
            <textarea
              rows={2}
              value={portfolioForm.solution}
              onChange={(e) => setPortfolioForm((p) => ({ ...p, solution: e.target.value }))}
              placeholder="Architecture Solution"
              className="px-3 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={portfolioForm.techCsv}
              onChange={(e) => setPortfolioForm((p) => ({ ...p, techCsv: e.target.value }))}
              placeholder="Tech Stack (comma-separated)"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
            <input
              type="url"
              value={portfolioForm.liveUrl}
              onChange={(e) => setPortfolioForm((p) => ({ ...p, liveUrl: e.target.value }))}
              placeholder="Live URL (optional)"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
            <input
              type="url"
              value={portfolioForm.githubUrl}
              onChange={(e) => setPortfolioForm((p) => ({ ...p, githubUrl: e.target.value }))}
              placeholder="Repository URL (optional)"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
          </div>
          <button type="submit" className="min-h-[42px] px-5 py-2 rounded-lg bg-[#ED1C24] text-white text-xs font-semibold">
            Publish Portfolio Project
          </button>
        </form>

        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3">
          <h3 className="text-base font-bold text-white">Portfolio Records ({portfolio.length})</h3>
          {portfolio.map((item) => (
            <div key={item.id} className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-white">{item.title}</p>
                <p className="text-xs text-[#00BFFF]">{item.category}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await apiFetch(`/api/admin/portfolio/${item.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ isPublished: !item.is_published }),
                    });
                    await Promise.all([onReload(), refreshPublicData()]);
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : 'Unable to update portfolio.', 'error');
                  }
                }}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#333333] text-xs text-white"
              >
                {item.is_published ? 'Published (Unpublish)' : 'Hidden (Publish)'}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeModule === 'proposals') {
    return (
      <div className="space-y-5">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const res = await apiFetch<{ proposalCode: string }>('/api/admin/proposals', {
                method: 'POST',
                body: JSON.stringify({
                  clientUserId: Number(proposalForm.clientUserId),
                  inquiryId: proposalForm.inquiryId ? Number(proposalForm.inquiryId) : null,
                  projectId: proposalForm.projectId ? Number(proposalForm.projectId) : null,
                  title: proposalForm.title,
                  scopeSummary: proposalForm.scopeSummary,
                  timeline: proposalForm.timeline,
                  paymentSchedule: proposalForm.paymentSchedule,
                  terms: proposalForm.terms,
                  sendNow: proposalForm.sendNow,
                  items: proposalForm.items,
                }),
              });
              setProposalForm({
                clientUserId: '',
                inquiryId: '',
                projectId: '',
                title: '',
                scopeSummary: '',
                timeline: '4-6 weeks',
                paymentSchedule: '40% Advance, 40% Beta Milestone, 20% Final Delivery',
                terms: 'Source code & repository ownership transferred upon full milestone completion.',
                sendNow: true,
                items: [{ title: 'Core Architecture & Full-Stack Build', description: '', amountInr: 25000 }],
              });
              showToast(`Proposal ${res.proposalCode} created.`);
              await onReload();
            } catch (err) {
              showToast(err instanceof Error ? err.message : 'Unable to create proposal.', 'error');
            }
          }}
          className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4"
        >
          <h2 className="text-base sm:text-lg font-bold text-white">Create Proposal / Quotation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              required
              value={proposalForm.clientUserId}
              onChange={(e) => setProposalForm((p) => ({ ...p, clientUserId: e.target.value }))}
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            >
              <option value="">Select Client *</option>
              {clientUsers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
            <select
              value={proposalForm.inquiryId}
              onChange={(e) => setProposalForm((p) => ({ ...p, inquiryId: e.target.value }))}
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            >
              <option value="">Link Inquiry (Optional)</option>
              {inquiries.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.inquiry_code} · {i.project_title}
                </option>
              ))}
            </select>
            <select
              value={proposalForm.projectId}
              onChange={(e) => setProposalForm((p) => ({ ...p, projectId: e.target.value }))}
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            >
              <option value="">Link Project (Optional)</option>
              {projects
                .filter((pr) => !proposalForm.clientUserId || String(pr.client_user_id) === proposalForm.clientUserId)
                .map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.project_code} · {pr.title}
                  </option>
                ))}
            </select>
            <input
              type="text"
              required
              value={proposalForm.title}
              onChange={(e) => setProposalForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Proposal Title *"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
          </div>
          <textarea
            rows={2}
            required
            value={proposalForm.scopeSummary}
            onChange={(e) => setProposalForm((p) => ({ ...p, scopeSummary: e.target.value }))}
            placeholder="Scope & deliverables breakdown..."
            className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={proposalForm.timeline}
              onChange={(e) => setProposalForm((p) => ({ ...p, timeline: e.target.value }))}
              placeholder="Estimated Timeline (e.g. 4-6 weeks)"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
            <input
              type="text"
              value={proposalForm.paymentSchedule}
              onChange={(e) => setProposalForm((p) => ({ ...p, paymentSchedule: e.target.value }))}
              placeholder="Payment Schedule"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
          </div>
          <textarea
            rows={2}
            value={proposalForm.terms}
            onChange={(e) => setProposalForm((p) => ({ ...p, terms: e.target.value }))}
            placeholder="Commercial terms & ownership clauses..."
            className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#00BFFF]">Line Items (INR)</span>
              <button
                type="button"
                onClick={() =>
                  setProposalForm((p) => ({
                    ...p,
                    items: [...p.items, { title: '', description: '', amountInr: 10000 }],
                  }))
                }
                className="text-xs text-[#00BFFF] hover:underline"
              >
                + Add Item
              </button>
            </div>
            {proposalForm.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  required
                  value={item.title}
                  onChange={(e) =>
                    setProposalForm((p) => ({
                      ...p,
                      items: p.items.map((it, i) => (i === idx ? { ...it, title: e.target.value } : it)),
                    }))
                  }
                  placeholder="Item title"
                  className="sm:col-span-2 min-h-[40px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                />
                <input
                  type="number"
                  required
                  value={item.amountInr}
                  onChange={(e) =>
                    setProposalForm((p) => ({
                      ...p,
                      items: p.items.map((it, i) =>
                        i === idx ? { ...it, amountInr: Number(e.target.value || 0) } : it
                      ),
                    }))
                  }
                  placeholder="Amount INR"
                  className="min-h-[40px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() =>
                    setProposalForm((p) => ({
                      ...p,
                      items: p.items.length > 1 ? p.items.filter((_, i) => i !== idx) : p.items,
                    }))
                  }
                  className="min-h-[40px] px-3 rounded-lg border border-[#333333] text-xs text-[#CCCCCC]"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button type="submit" className="min-h-[42px] px-5 py-2 rounded-lg bg-[#ED1C24] text-white text-xs font-semibold">
            Send Proposal to Client
          </button>
        </form>

        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3">
          <h3 className="text-base font-bold text-white">Proposals ({proposals.length})</h3>
          {proposals.map((prop) => (
            <div key={prop.id} className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-[#00BFFF] tabular-nums">
                  {prop.proposal_code} · {prop.status}
                </p>
                <p className="text-sm font-bold text-white">{prop.title}</p>
                <p className="text-xs text-[#CCCCCC]">
                  Client: {prop.client_name} · INR {prop.total_amount_inr.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadProposalPdf(prop)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#333333] text-xs text-white inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#00BFFF]" />
                PDF
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeModule === 'payments') {
    return (
      <div className="space-y-5">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await apiFetch('/api/admin/payments', {
                method: 'POST',
                body: JSON.stringify({
                  clientUserId: Number(paymentReqForm.clientUserId),
                  projectId: paymentReqForm.projectId ? Number(paymentReqForm.projectId) : null,
                  amountInr: Number(paymentReqForm.amountInr),
                  paymentType: paymentReqForm.paymentType,
                }),
              });
              setPaymentReqForm({ clientUserId: '', projectId: '', amountInr: '', paymentType: 'milestone' });
              showToast('Payment request issued.');
              await onReload();
            } catch (err) {
              showToast(err instanceof Error ? err.message : 'Unable to create payment request.', 'error');
            }
          }}
          className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4"
        >
          <h2 className="text-base sm:text-lg font-bold text-white">Issue Payment Milestone Request</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              required
              value={paymentReqForm.clientUserId}
              onChange={(e) => setPaymentReqForm((p) => ({ ...p, clientUserId: e.target.value }))}
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            >
              <option value="">Select Client *</option>
              {clientUsers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={paymentReqForm.projectId}
              onChange={(e) => setPaymentReqForm((p) => ({ ...p, projectId: e.target.value }))}
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            >
              <option value="">Select Project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_code} · {p.title}
                </option>
              ))}
            </select>
            <input
              type="number"
              required
              min={1}
              value={paymentReqForm.amountInr}
              onChange={(e) => setPaymentReqForm((p) => ({ ...p, amountInr: e.target.value }))}
              placeholder="Amount INR *"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
            <select
              value={paymentReqForm.paymentType}
              onChange={(e) => setPaymentReqForm((p) => ({ ...p, paymentType: e.target.value }))}
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            >
              <option value="advance">advance</option>
              <option value="milestone">milestone</option>
              <option value="balance">balance</option>
            </select>
          </div>
          <button type="submit" className="min-h-[42px] px-5 py-2 rounded-lg bg-[#ED1C24] text-white text-xs font-semibold">
            Create Payment Request
          </button>
        </form>

        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3">
          <h3 className="text-base font-bold text-white">Payment Ledger ({payments.length})</h3>
          {payments.map((pay) => (
            <div key={pay.id} className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap justify-between gap-2 text-xs">
              <div>
                <p className="font-mono text-[#00BFFF] tabular-nums">{pay.payment_code}</p>
                <p className="text-white font-bold">{pay.client_name || 'Client'}</p>
              </div>
              <div className="text-right font-mono tabular-nums">
                <p className="text-white">INR {pay.amount_inr.toLocaleString('en-IN')}</p>
                <p className="text-[#00CC66]">{pay.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeModule === 'invoices') {
    return (
      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white">Verified Invoices ({invoices.length})</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-[#CCCCCC]">Invoices are generated automatically when Razorpay payments clear verification.</p>
        ) : (
          invoices.map((inv) => (
            <div key={inv.id} className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-[#00CC66] tabular-nums">{inv.invoice_number}</p>
                <p className="text-sm font-bold text-white">{inv.client_name}</p>
                <p className="font-mono text-xs text-[#CCCCCC] tabular-nums">
                  INR {inv.amount_inr.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadInvoicePdf(inv)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#333333] text-xs text-white"
              >
                Download PDF
              </button>
            </div>
          ))
        )}
      </div>
    );
  }

  if (activeModule === 'communication') {
    return (
      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white">Real-Time Client &amp; Team Chat Hub</h2>
        <p className="text-sm text-[#CCCCCC]">
          Access every active Client &amp; Team channel as well as confidential Internal Team rooms inside the dedicated messaging interface.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('/messages')}
          className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center gap-2"
        >
          Open Live Messaging Center
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (activeModule === 'notifications') {
    return (
      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-white">Admin Notifications ({notifications.length})</h2>
          <button
            type="button"
            onClick={async () => {
              try {
                await apiFetch('/api/workspace/notifications/read-all', { method: 'POST' });
                await refreshNotifications();
              } catch (err) {
                showToast(err instanceof Error ? err.message : 'Unable to update notifications.', 'error');
              }
            }}
            className="text-xs text-[#00BFFF] hover:underline"
          >
            Mark All Read
          </button>
        </div>
        {notifications.map((n) => (
          <div key={n.id} className="p-3.5 bg-[#1A1E28] border border-[#262B38] rounded-lg text-xs">
            <p className="font-bold text-white">{n.title}</p>
            <p className="text-[#CCCCCC]">{n.message}</p>
          </div>
        ))}
      </div>
    );
  }

  if (activeModule === 'blog') {
    return (
      <div className="space-y-5">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await apiFetch('/api/admin/blog', {
                method: 'POST',
                body: JSON.stringify(blogForm),
              });
              setBlogForm({ title: '', summary: '', content: '', category: 'Engineering', tag: 'Architecture' });
              showToast('Blog post published.');
              await Promise.all([onReload(), refreshPublicData()]);
            } catch (err) {
              showToast(err instanceof Error ? err.message : 'Unable to publish blog post.', 'error');
            }
          }}
          className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4"
        >
          <h2 className="text-base sm:text-lg font-bold text-white">Publish Engineering Update / Guide</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              value={blogForm.title}
              onChange={(e) => setBlogForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Article Title *"
              className="sm:col-span-2 min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
            <input
              type="text"
              value={blogForm.tag}
              onChange={(e) => setBlogForm((p) => ({ ...p, tag: e.target.value }))}
              placeholder="Tag"
              className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
            />
          </div>
          <input
            type="text"
            required
            value={blogForm.summary}
            onChange={(e) => setBlogForm((p) => ({ ...p, summary: e.target.value }))}
            placeholder="Summary *"
            className="w-full min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
          />
          <textarea
            rows={3}
            value={blogForm.content}
            onChange={(e) => setBlogForm((p) => ({ ...p, content: e.target.value }))}
            placeholder="Full technical article content..."
            className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
          />
          <button type="submit" className="min-h-[42px] px-5 py-2 rounded-lg bg-[#ED1C24] text-white text-xs font-semibold">
            Publish Post
          </button>
        </form>

        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3">
          <h3 className="text-base font-bold text-white">Published Articles ({blogPosts.length})</h3>
          {blogPosts.map((post) => (
            <div key={post.id} className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg">
              <p className="font-mono text-xs text-[#00BFFF]">{post.tag}</p>
              <p className="text-sm font-bold text-white">{post.title}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activeModule === 'reviews') {
    return (
      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white">Client Testimonials &amp; Reviews Moderation</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-[#CCCCCC]">
            No reviews submitted yet. Only verified client submissions are published on the public platform.
          </p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <p className="text-sm font-bold text-white">
                  {rev.author_name} · <span className="font-mono text-[#00BFFF]">{rev.rating}/5</span>
                </p>
                <p className="text-xs text-[#CCCCCC]">{rev.comment}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await apiFetch(`/api/admin/reviews/${rev.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ isPublished: !rev.is_published }),
                    });
                    await Promise.all([onReload(), refreshPublicData()]);
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : 'Unable to update review.', 'error');
                  }
                }}
                className="min-h-[38px] px-3.5 py-2 rounded-lg border border-[#333333] text-xs text-white"
              >
                {rev.is_published ? 'Published (Hide)' : 'Approve & Publish'}
              </button>
            </div>
          ))
        )}
      </div>
    );
  }

  if (activeModule === 'users') {
    return (
      <div className="space-y-5">
        <div className="bg-[#13161D] border border-[#00BFFF]/40 rounded-lg p-4 flex items-start gap-3 text-xs">
          <ShieldCheck className="w-4 h-4 text-[#00BFFF] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-white">Firebase Auth &amp; Realtime Database Role Authority</p>
            <p className="text-[#CCCCCC] leading-relaxed">
              Every user registers with default role <span className="font-mono text-[#00BFFF]">client</span>. Authorized team roles (<span className="font-mono text-white">project_manager, developer, designer</span>) can be assigned here, while the <span className="font-mono text-[#ED1C24]">admin</span> role must only be manually assigned inside Firebase Console at <span className="font-mono text-[#00BFFF]">users/&lt;uid&gt;/role</span>.
            </p>
          </div>
        </div>

        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3">
          <h3 className="text-base font-bold text-white">Registered Accounts ({users.length})</h3>
          {users.length === 0 ? (
            <p className="text-xs text-[#CCCCCC]">No accounts registered yet.</p>
          ) : (
            users.map((u) => {
              const primaryRole = (u.roles_csv || 'client').split(',')[0] as UserRole;
              const isAdminAccount = primaryRole === 'admin';
              return (
                <div
                  key={u.id}
                  className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{u.name}</p>
                    <p className="text-xs text-[#00BFFF] truncate">{u.email}</p>
                    {u.firebase_uid && (
                      <p className="font-mono text-[10px] text-[#9AA3B5] truncate">UID: {u.firebase_uid}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdminAccount ? (
                      <span className="min-h-[38px] px-3 py-2 rounded-lg bg-[#0B0D11] border border-[#ED1C24]/50 font-mono text-xs text-[#ED1C24] inline-flex items-center">
                        admin (Firebase Console)
                      </span>
                    ) : (
                      <>
                        <select
                          value={primaryRole}
                          onChange={async (e) => {
                            try {
                              await apiFetch(`/api/admin/users/${u.id}/role`, {
                                method: 'PATCH',
                                body: JSON.stringify({ role: e.target.value, isActive: Boolean(u.is_active) }),
                              });
                              showToast('User role updated & synced.');
                              await onReload();
                            } catch (err) {
                              showToast(err instanceof Error ? err.message : 'Unable to update role.', 'error');
                            }
                          }}
                          className="min-h-[38px] px-2.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                        >
                          {['project_manager', 'developer', 'designer', 'client'].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await apiFetch(`/api/admin/users/${u.id}/role`, {
                                method: 'PATCH',
                                body: JSON.stringify({ role: primaryRole, isActive: !u.is_active }),
                              });
                              showToast(`Account ${!u.is_active ? 'enabled' : 'disabled'}.`);
                              await onReload();
                            } catch (err) {
                              showToast(err instanceof Error ? err.message : 'Unable to update status.', 'error');
                            }
                          }}
                          className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-xs font-medium ${
                            u.is_active
                              ? 'border-[#00CC66]/40 text-[#00CC66]'
                              : 'border-[#ED1C24]/40 text-[#ED1C24]'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return null;
}
