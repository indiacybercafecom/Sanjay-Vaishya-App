import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';
import { downloadProposalPdf } from '../../lib/pdf';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import type { ProposalRecord } from '../../types/platform';

export function ProposalsFeature() {
  const { showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [proposals, setProposals] = useState<ProposalRecord[]>([]);
  const [revisionNotes, setRevisionNotes] = useState<Record<number, string>>({});

  const loadProposals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ proposals: ProposalRecord[] }>('/api/workspace/proposals');
      setProposals(res.proposals);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load proposals.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const handleProposalResponse = async (proposalId: number, action: 'accept' | 'revise' | 'reject') => {
    try {
      await apiFetch(`/api/workspace/proposals/${proposalId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          note: revisionNotes[proposalId] || '',
        }),
      });
      showToast(`Proposal updated (${action}).`);
      loadProposals();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update proposal.', 'error');
    }
  };

  if (loading && proposals.length === 0) return <LoadingSkeleton rows={2} />;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#262B38] space-y-1">
        <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          COMMERCIAL QUOTATIONS
        </p>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Proposals &amp; Scope</h1>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No proposals issued yet"
          description="Structured quotations with milestone breakdowns appear here after technical evaluation."
        />
      ) : (
        <div className="space-y-5">
          {proposals.map((prop) => (
            <div key={prop.id} className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#262B38]">
                <div className="space-y-1">
                  <p className="font-mono text-[11px] text-[#00BFFF] tabular-nums">
                    {prop.proposal_code} · STATUS: {prop.status.toUpperCase()}
                  </p>
                  <h2 className="text-lg font-bold text-white">{prop.title}</h2>
                  <p className="text-xs text-[#C0C0C0]">Timeline: {prop.timeline || 'Standard milestone plan'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-base font-bold text-[#00CC66] tabular-nums">
                    INR {prop.total_amount_inr.toLocaleString('en-IN')}
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadProposalPdf(prop)}
                    className="min-h-[40px] px-3.5 py-2 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs font-medium text-white inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#00BFFF]" />
                    PDF
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed">{prop.scope_summary}</p>

              <div className="bg-[#1A1E28] border border-[#262B38] rounded-lg divide-y divide-[#262B38]">
                {prop.items.map((item) => (
                  <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      {item.description && <p className="text-[#CCCCCC]">{item.description}</p>}
                    </div>
                    <span className="font-mono text-white tabular-nums shrink-0">
                      INR {item.amount_inr.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {['sent', 'viewed', 'revision_requested'].includes(prop.status) && (
                <div className="pt-2 space-y-3">
                  <input
                    type="text"
                    value={revisionNotes[prop.id] || ''}
                    onChange={(e) => setRevisionNotes((p) => ({ ...p, [prop.id]: e.target.value }))}
                    placeholder="Optional revision comment or scope question..."
                    className="w-full min-h-[42px] px-3.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-white"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleProposalResponse(prop.id, 'accept')}
                      className="min-h-[42px] px-4 py-2 rounded-lg bg-[#00CC66]/20 border border-[#00CC66]/50 text-[#00CC66] text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept Proposal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProposalResponse(prop.id, 'revise')}
                      className="min-h-[42px] px-4 py-2 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs text-white"
                    >
                      Request Revision
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProposalResponse(prop.id, 'reject')}
                      className="min-h-[42px] px-4 py-2 rounded-lg border border-[#ED1C24]/40 text-[#ED1C24] text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
