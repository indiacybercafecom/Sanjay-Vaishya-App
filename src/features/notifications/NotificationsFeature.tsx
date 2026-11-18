import React from 'react';
import { Bell, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../lib/api';
import { EmptyState } from '../../components/common/EmptyState';

export function NotificationsFeature({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { notifications, refreshNotifications, showToast } = useAuth();

  return (
    <div className="space-y-5">
      <div className="pb-4 border-b border-[#262B38] flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            ACTIVITY &amp; ALERTS
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={async () => {
              await apiFetch('/api/workspace/notifications/read-all', { method: 'POST' });
              await refreshNotifications();
              showToast('All notifications marked read.');
            }}
            className="min-h-[40px] px-4 py-2 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs text-white"
          >
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Updates on inquiries, proposals, milestones, messages, and invoices appear here in real time."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-lg border flex flex-wrap items-center justify-between gap-3 ${
                n.is_read ? 'bg-[#13161D] border-[#262B38]' : 'bg-[#1A1E28] border-[#00BFFF]/50'
              }`}
            >
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">{n.title}</p>
                <p className="text-xs text-[#CCCCCC]">{n.message}</p>
                <p className="font-mono text-[11px] text-[#C0C0C0] tabular-nums flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {n.created_at.slice(0, 16).replace('T', ' ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {n.link_path && (
                  <button
                    type="button"
                    onClick={() => onNavigate(n.link_path)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#0B0D11] border border-[#2B3140] text-xs text-[#00BFFF]"
                  >
                    Open
                  </button>
                )}
                {!n.is_read && (
                  <button
                    type="button"
                    onClick={async () => {
                      await apiFetch(`/api/workspace/notifications/${n.id}/read`, { method: 'PATCH' });
                      await refreshNotifications();
                    }}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-[#333333] text-xs text-[#CCCCCC]"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
