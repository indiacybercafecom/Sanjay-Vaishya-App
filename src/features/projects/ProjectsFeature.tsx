import React, { useState, useEffect, useCallback } from 'react';
import { FolderKanban, MessageSquare, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch, apiUpload } from '../../lib/api';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import type { ProjectRecord, MilestoneRecord, TaskRecord, ProjectUpdateRecord } from '../../types/platform';

interface ProjectsFeatureProps {
  initialProjectId?: number | null;
  onNavigate: (path: string) => void;
}

export function ProjectsFeature({ initialProjectId, onNavigate }: ProjectsFeatureProps) {
  const { user, showToast } = useAuth();
  const isStaff = Boolean(user?.roles.some((r) => ['admin', 'project_manager', 'developer', 'designer'].includes(r)));

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(initialProjectId || null);
  const [projectDetail, setProjectDetail] = useState<{
    project: ProjectRecord;
    milestones: MilestoneRecord[];
    tasks: TaskRecord[];
    updates: ProjectUpdateRecord[];
  } | null>(null);

  const [updateForm, setUpdateForm] = useState({ title: '', body: '', visibility: 'client' });
  const [updateFile, setUpdateFile] = useState<File | null>(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<number, string>>({});
  const [taskNoteDrafts, setTaskNoteDrafts] = useState<Record<number, string>>({});

  useEffect(() => {
    if (initialProjectId) setSelectedProjectId(initialProjectId);
  }, [initialProjectId]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ projects: ProjectRecord[] }>('/api/workspace/projects');
      setProjects(res.projects);
      if (res.projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(res.projects[0].id);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load projects.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, showToast]);

  const loadDetail = useCallback(
    async (projectId: number) => {
      try {
        const detail = await apiFetch<{
          project: ProjectRecord;
          milestones: MilestoneRecord[];
          tasks: TaskRecord[];
          updates: ProjectUpdateRecord[];
        }>(`/api/workspace/projects/${projectId}`);
        setProjectDetail(detail);
        const drafts: Record<number, string> = {};
        detail.tasks.forEach((t) => {
          drafts[t.id] = t.internal_notes || '';
        });
        setTaskNoteDrafts(drafts);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Failed to load project details.', 'error');
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProjectId) loadDetail(selectedProjectId);
  }, [selectedProjectId, loadDetail]);

  const handleMilestoneApprove = async (milestoneId: number) => {
    try {
      await apiFetch(`/api/workspace/milestones/${milestoneId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      });
      showToast('Milestone marked completed.');
      if (selectedProjectId) loadDetail(selectedProjectId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update milestone.', 'error');
    }
  };

  const handleTaskUpdate = async (taskId: number, status?: TaskRecord['status'], internalNotes?: string) => {
    try {
      await apiFetch(`/api/workspace/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(status ? { status } : {}),
          ...(internalNotes !== undefined ? { internalNotes } : {}),
        }),
      });
      showToast('Task updated.');
      if (selectedProjectId) loadDetail(selectedProjectId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update task.', 'error');
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) return;
    try {
      const fd = new FormData();
      fd.append('title', updateForm.title);
      fd.append('body', updateForm.body);
      fd.append('visibility', updateForm.visibility);
      if (updateFile) fd.append('deliverable', updateFile);

      await apiUpload(`/api/workspace/projects/${selectedProjectId}/updates`, fd);
      setUpdateForm({ title: '', body: '', visibility: 'client' });
      setUpdateFile(null);
      showToast('Project update posted.');
      loadDetail(selectedProjectId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to post update.', 'error');
    }
  };

  const handleUpdateFeedback = async (updateId: number, approve: boolean) => {
    try {
      await apiFetch(`/api/workspace/updates/${updateId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({
          feedback: feedbackDrafts[updateId] || (approve ? 'Approved deliverable.' : 'Requested changes.'),
          approve,
        }),
      });
      showToast(approve ? 'Deliverable approved.' : 'Feedback submitted.');
      if (selectedProjectId) loadDetail(selectedProjectId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Feedback submission failed.', 'error');
    }
  };

  if (!user) return null;
  if (loading && projects.length === 0) return <LoadingSkeleton rows={3} />;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#262B38] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5" />
            PROJECT EXECUTION WORKSPACE
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-white">My Projects</h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/messages')}
          className="min-h-[44px] px-4 py-2 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs font-medium text-white inline-flex items-center gap-2"
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#00BFFF]" />
          Project Chat
        </button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects initialized yet"
          description="Submit a project inquiry to begin architecture evaluation and milestone setup."
          actionLabel="Start a Project Inquiry"
          onAction={() => onNavigate('/start-project')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-4 space-y-2.5">
            {projects.map((prj) => (
              <button
                key={prj.id}
                type="button"
                onClick={() => setSelectedProjectId(prj.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors space-y-2 ${
                  selectedProjectId === prj.id
                    ? 'bg-[#1A1E28] border-[#00BFFF]'
                    : 'bg-[#13161D] border-[#262B38] hover:border-[#2B3140]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-[#00BFFF] tabular-nums">{prj.project_code}</span>
                  <span className="font-mono text-[11px] text-[#C0C0C0]">{prj.status}</span>
                </div>
                <p className="text-sm font-bold text-white">{prj.title}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[#0B0D11] rounded overflow-hidden">
                    <div className="h-full bg-[#00CC66]" style={{ width: `${prj.progress}%` }} />
                  </div>
                  <span className="font-mono text-[11px] text-[#00CC66] tabular-nums">{prj.progress}%</span>
                </div>
              </button>
            ))}
          </div>

          {projectDetail && (
            <div className="lg:col-span-8 space-y-5">
              <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-mono text-[11px] text-[#00BFFF] tabular-nums">
                      {projectDetail.project.project_code} · {projectDetail.project.status}
                    </p>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{projectDetail.project.title}</h2>
                    <p className="text-xs text-[#C0C0C0]">
                      Manager: {projectDetail.project.manager_name || 'Sanjay Vaishya'} · Expected Delivery:{' '}
                      {projectDetail.project.expected_delivery_date || 'Scheduled per milestone'}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[11px] text-[#C0C0C0]">Progress</p>
                    <p className="font-mono text-2xl font-bold text-[#00CC66] tabular-nums">
                      {projectDetail.project.progress}%
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed">{projectDetail.project.description}</p>
              </div>

              {/* Milestones */}
              <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3">
                <h3 className="text-base font-bold text-white">Milestones</h3>
                {projectDetail.milestones.length === 0 ? (
                  <p className="text-xs text-[#CCCCCC]">Milestones will appear once scheduled by the project manager.</p>
                ) : (
                  <div className="space-y-2.5">
                    {projectDetail.milestones.map((ms) => (
                      <div
                        key={ms.id}
                        className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-white">{ms.title}</p>
                          {ms.description && <p className="text-xs text-[#CCCCCC]">{ms.description}</p>}
                          <p className="font-mono text-[11px] text-[#C0C0C0] tabular-nums">
                            Due: {ms.due_date || 'TBD'} · INR {ms.amount_inr.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-[11px] px-2.5 py-1 rounded border ${
                              ms.status === 'completed'
                                ? 'border-[#00CC66]/40 text-[#00CC66] bg-[#00CC66]/10'
                                : 'border-[#2B3140] text-white bg-[#0B0D11]'
                            }`}
                          >
                            {ms.status}
                          </span>
                          {ms.status === 'review' && (
                            <button
                              type="button"
                              onClick={() => handleMilestoneApprove(ms.id)}
                              className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#00CC66]/20 border border-[#00CC66]/50 text-[#00CC66] text-xs font-semibold"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Staff Task Board */}
              {isStaff && (
                <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3">
                  <h3 className="text-base font-bold text-white">Assigned Engineering Tasks</h3>
                  {projectDetail.tasks.length === 0 ? (
                    <p className="text-xs text-[#CCCCCC]">No tasks assigned on this project yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {projectDetail.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold text-white">{task.title}</p>
                              <p className="text-xs text-[#CCCCCC]">
                                Assignee: {task.assignee_name || 'Unassigned'} · Priority: {task.priority} · Due:{' '}
                                {task.due_date || 'TBD'}
                              </p>
                            </div>
                            <select
                              value={task.status}
                              onChange={(e) => handleTaskUpdate(task.id, e.target.value as TaskRecord['status'])}
                              className="min-h-[40px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] font-mono text-xs text-white"
                            >
                              <option value="todo">todo</option>
                              <option value="in_progress">in_progress</option>
                              <option value="review">review</option>
                              <option value="done">done</option>
                            </select>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <input
                              type="text"
                              value={taskNoteDrafts[task.id] || ''}
                              onChange={(e) => setTaskNoteDrafts((p) => ({ ...p, [task.id]: e.target.value }))}
                              placeholder="Internal engineering notes..."
                              className="flex-1 min-w-[180px] min-h-[38px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleTaskUpdate(task.id, undefined, taskNoteDrafts[task.id] || '')}
                              className="min-h-[38px] px-3 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs text-white"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Staff Update / Deliverable Upload */}
              {isStaff && (
                <form
                  onSubmit={handlePostUpdate}
                  className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3"
                >
                  <h3 className="text-base font-bold text-white">Post Project Update or Deliverable</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={updateForm.title}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Update / Deliverable title"
                      className="sm:col-span-2 min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                    />
                    <select
                      value={updateForm.visibility}
                      onChange={(e) => setUpdateForm((p) => ({ ...p, visibility: e.target.value }))}
                      className="min-h-[42px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                    >
                      <option value="client">Client &amp; Team Visible</option>
                      <option value="internal">Internal Team Only</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={updateForm.body}
                    onChange={(e) => setUpdateForm((p) => ({ ...p, body: e.target.value }))}
                    placeholder="Describe completed work, staging links, or deliverable instructions..."
                    className="w-full px-3 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <input
                      type="file"
                      onChange={(e) => setUpdateFile(e.target.files?.[0] || null)}
                      className="text-xs text-[#CCCCCC] max-w-full"
                    />
                    <button
                      type="submit"
                      className="min-h-[42px] px-5 py-2 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold"
                    >
                      Publish Update
                    </button>
                  </div>
                </form>
              )}

              {/* Updates & Deliverables Feed */}
              <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-3">
                <h3 className="text-base font-bold text-white">Updates &amp; Deliverables</h3>
                {projectDetail.updates.length === 0 ? (
                  <p className="text-xs text-[#CCCCCC]">No project updates posted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {projectDetail.updates.map((upd) => (
                      <div key={upd.id} className="p-4 bg-[#1A1E28] border border-[#262B38] rounded-lg space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-bold text-white">{upd.title}</p>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-[#00BFFF]">{upd.author_name}</span>
                            {upd.visibility === 'internal' && (
                              <span className="px-2 py-0.5 rounded bg-[#ED1C24]/20 text-[#ED1C24]">Internal</span>
                            )}
                            {upd.approved_by_client === 1 && (
                              <span className="px-2 py-0.5 rounded bg-[#00CC66]/15 text-[#00CC66]">
                                Client Approved
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-[#CCCCCC] leading-relaxed">{upd.body}</p>
                        {upd.deliverable_attachment_id && (
                          <a
                            href={`/api/attachments/${upd.deliverable_attachment_id}`}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-[#00BFFF] hover:border-[#00BFFF]"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download ({upd.deliverable_name || 'Deliverable'})
                          </a>
                        )}
                        {upd.client_feedback && (
                          <p className="text-xs text-[#F4F6F9] p-2.5 rounded bg-[#0B0D11] border border-[#262B38]">
                            Client Feedback: {upd.client_feedback}
                          </p>
                        )}
                        {user.primaryRole === 'client' && upd.approved_by_client === 0 && (
                          <div className="pt-2 border-t border-[#262B38] flex flex-wrap gap-2">
                            <input
                              type="text"
                              value={feedbackDrafts[upd.id] || ''}
                              onChange={(e) => setFeedbackDrafts((p) => ({ ...p, [upd.id]: e.target.value }))}
                              placeholder="Optional review feedback..."
                              className="flex-1 min-w-[180px] min-h-[40px] px-3 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateFeedback(upd.id, false)}
                              className="min-h-[40px] px-3 rounded-lg border border-[#333333] text-xs text-white"
                            >
                              Send Feedback
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateFeedback(upd.id, true)}
                              className="min-h-[40px] px-3 rounded-lg bg-[#00CC66]/20 border border-[#00CC66]/50 text-[#00CC66] text-xs font-semibold"
                            >
                              Approve Deliverable
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
