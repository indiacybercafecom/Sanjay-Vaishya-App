import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie } from 'lucide-react';

interface CookieConsentProps {
  onViewPolicy: () => void;
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function CookieConsent({ onViewPolicy, forceOpen = false, onClose }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setIsVisible(true);
      return;
    }
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
    onClose?.();
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
    onClose?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-[200] p-3 md:p-5 pointer-events-none"
        >
          <div className="max-w-[1280px] mx-auto pointer-events-auto">
            <div className="bg-[#13161D]/95 backdrop-blur-md border border-[#2B3140] rounded-lg px-4 py-3.5 md:px-6 md:py-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#1A1E28] border border-[#2B3140] flex items-center justify-center text-[#1FA8D6] shrink-0 mt-0.5 sm:mt-0">
                  <Cookie className="w-4 h-4" />
                </div>
                <div className="text-xs md:text-sm text-[#CCCCCC] leading-snug max-w-2xl">
                  <span className="font-semibold text-white mr-1.5">Cookie Consent:</span>
                  We use cookies for essential preferences and analytics.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsVisible(false);
                      onClose?.();
                      onViewPolicy();
                    }}
                    className="text-[#1FA8D6] font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FA8D6] rounded-sm"
                  >
                    Read Policy
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="px-4 py-2 text-xs font-medium text-[#CCCCCC] border border-[#333333] rounded-lg hover:bg-white/5 hover:text-white transition-colors duration-200 whitespace-nowrap shrink-0"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  className="px-4 py-2 bg-[#D9252D] hover:bg-[#B81D24] text-white text-xs font-semibold rounded-lg transition-all duration-200 active:translate-y-px whitespace-nowrap shrink-0"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
