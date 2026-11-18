import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center gap-2 rounded-lg border border-[#00BFFF]/40 bg-[#1A1E28] hover:border-[#00BFFF] text-[#F4F6F9] transition-colors whitespace-nowrap shrink-0 ${
          compact ? 'px-3 py-2 text-xs font-medium' : 'px-4 py-2.5 text-xs font-semibold'
        }`}
      >
        <Download className="w-3.5 h-3.5 text-[#00BFFF]" />
        Install App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-[#262B38] bg-[#1A1E28] px-3 py-2 text-xs font-medium text-[#CCCCCC] hover:border-[#00BFFF] hover:text-white transition-colors whitespace-nowrap shrink-0"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#00BFFF]" />
          Install App
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#0B0D11]/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-lg bg-[#13161D] border border-[#262B38] p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Install Sanjay Vaishya App</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg text-[#C0C0C0] hover:text-white"
                  aria-label="Close install instructions"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="text-sm text-[#CCCCCC] space-y-2 list-decimal list-inside">
                <li>Tap the Share icon in your Safari browser toolbar.</li>
                <li>Scroll down and tap <strong className="text-white">Add to Home Screen</strong>.</li>
                <li>Confirm by tapping Add in the top corner.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-[500] flex items-center gap-2 rounded-lg bg-[#1A1E28] border border-[#ED1C24] px-3.5 py-2 text-xs font-medium text-white shadow-xl"
      role="status"
    >
      <WifiOff className="w-4 h-4 text-[#ED1C24] shrink-0" />
      <span>Offline Mode — Static app shell active</span>
    </div>
  );
}
