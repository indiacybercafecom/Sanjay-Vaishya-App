import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  ShieldAlert,
  Star,
  FolderKanban,
  Inbox,
  MessageSquare,
  FileText,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import type { InquiryRecord, ProjectRecord } from '../../types/platform';

interface OverviewResponse {
  role: string;
  metrics: Record<string, number>;
}

interface ClientDashboardFeatureProps {
  onNavigate: (path: string) => void;
  onSelectProject: (projectId: number) => void;
}

export function ClientDashboardFeature({ onNavigate, onSelectProject }: ClientDashboardFeatureProps) {
  const { user, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    authorRole: user?.company || '',
    comment: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, inq, prj] = await Promise.all([
        apiFetch<OverviewResponse>('/api/workspace/overview'),
        apiFetch<{ inquiries: InquiryRecord[] }>('/api/workspace/inquiries'),
        apiFetch<{ projects: ProjectRecord[] }>('/api/workspace/projects'),
      ]);
      setOverview(ov);
      setInquiries(inq.inquiries);
      setProjects(prj.projects);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/workspace/reviews', {
        method: 'POST',
        body: JSON.stringify(reviewForm),
      });
      setReviewForm({ rating: 5, authorRole: user?.company || '', comment: '' });
      showToast('Review submitted for founder verification before publishing.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Review submission failed.', 'error');
    }
  };

  if (!user) return null;
  if (loading && !overview) return <LoadingSkeleton rows={4} />;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#262B38] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[11px] text-[#00BFFF] uppercase">
            {user.primaryRole.replace('_', ' ')} Workspace
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Welcome, {user.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate('/start-project')}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center gap-2"
          >
            New Project Request
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {user.roles.some((r) => ['admin', 'project_manager'].includes(r)) && (
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-[#00BFFF]/50 bg-[#00BFFF]/10 text-[#00BFFF] text-xs font-semibold inline-flex items-center gap-2"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Open Admin Center
            </button>
          )}
        </div>
      </div>

      {/* Quick Workspace Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Projects', path: '/projects', icon: FolderKanban },
          { label: 'Messages', path: '/messages', icon: MessageSquare },
          { label: 'Proposals', path: '/proposals', icon: FileText },
          { label: 'Payments', path: '/payments', icon: CreditCard },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.path}
              type="button"
              onClick={() => onNavigate(action.path)}
              className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#13161D] border border-[#262B38] hover:border-[#00BFFF] text-left flex items-center gap-2.5 text-xs font-medium text-white transition-colors"
            >
              <Icon className="w-4 h-4 text-[#00BFFF] shrink-0" />
              <span className="truncate">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 space-y-1">
          <p className="font-mono text-[11px] text-[#C0C0C0]">Active Projects</p>
          <p className="font-mono text-2xl font-bold text-white tabular-nums">
            {overview?.metrics.activeProjects ?? 0}
          </p>
        </div>
        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 space-y-1">
          <p className="font-mono text-[11px] text-[#C0C0C0]">
            {user.primaryRole === 'client' ? 'Pending Proposals' : 'Open Tasks'}
          </p>
          <p className="font-mono text-2xl font-bold text-[#00BFFF] tabular-nums">
            {user.primaryRole === 'client'
              ? overview?.metrics.pendingProposals ?? 0
              : overview?.metrics.openTasks ?? 0}
          </p>
        </div>
        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 space-y-1">
          <p className="font-mono text-[11px] text-[#C0C0C0]">Pending Billing (INR)</p>
          <p className="font-mono text-2xl font-bold text-white tabular-nums">
            {(overview?.metrics.pendingPayments ?? 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 space-y-1">
          <p className="font-mono text-[11px] text-[#C0C0C0]">Unread Alerts</p>
          <p className="font-mono text-2xl font-bold text-[#ED1C24] tabular-nums">
            {overview?.metrics.unreadNotifications ?? 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-white">Submitted Project Inquiries</h2>
            <button
              type="button"
              onClick={() => onNavigate('/start-project')}
              className="text-xs text-[#00BFFF] hover:underline"
            >
              + New Inquiry
            </button>
          </div>
          {inquiries.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No inquiries logged yet"
              description="Submit your project requirements to receive a scope review and quotation."
              actionLabel="Start a Project"
              onAction={() => onNavigate('/start-project')}
            />
          ) : (
            <div className="space-y-2.5">
              {inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="p-3.5 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-mono text-[11px] text-[#00BFFF] tabular-nums">{inq.inquiry_code}</p>
                    <p className="text-sm font-bold text-white truncate">{inq.project_title}</p>
                    <p className="text-xs text-[#CCCCCC] truncate">
                      {inq.category} · {inq.budget_range}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-[#0B0D11] border border-[#2B3140] text-white shrink-0">
                    {inq.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-5">
          <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
            <h2 className="text-base font-bold text-white">Active Projects</h2>
            {projects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No active projects"
                description="Projects appear here once an inquiry or proposal is converted into an active build."
              />
            ) : (
              <div className="space-y-2.5">
                {projects.slice(0, 4).map((prj) => (
                  <button
                    key={prj.id}
                    type="button"
                    onClick={() => {
                      onSelectProject(prj.id);
                      onNavigate('/projects');
                    }}
                    className="w-full text-left p-3.5 bg-[#1A1E28] border border-[#262B38] hover:border-[#00BFFF] rounded-lg space-y-2 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] text-[#00BFFF] tabular-nums">{prj.project_code}</span>
                      <span className="font-mono text-[11px] text-[#00CC66] tabular-nums">{prj.progress}%</span>
                    </div>
                    <p className="text-sm font-bold text-white">{prj.title}</p>
                    <div className="w-full h-1.5 bg-[#0B0D11] rounded overflow-hidden">
                      <div className="h-full bg-[#00BFFF]" style={{ width: `${prj.progress}%` }} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {user.primaryRole === 'client' && (
            <form
              onSubmit={handleReviewSubmit}
              className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3"
            >
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-[#00BFFF]" />
                Share Client Feedback
              </h3>
              <p className="text-xs text-[#CCCCCC]">
                Verified client reviews are published publicly after founder approval.
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm((p) => ({ ...p, rating: Number(e.target.value) }))}
                  className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} / 5 Rating
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={reviewForm.authorRole}
                  onChange={(e) => setReviewForm((p) => ({ ...p, authorRole: e.target.value }))}
                  placeholder="Role / Company"
                  className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                />
              </div>
              <textarea
                rows={3}
                required
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                placeholder="Share your honest feedback on communication and delivery..."
                className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
              />
              <button
                type="submit"
                className="w-full min-h-[42px] px-4 py-2 rounded-lg bg-[#1A1E28] border border-[#2B3140] hover:border-[#00BFFF] text-xs font-semibold text-white"
              >
                Submit Review for Verification
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
