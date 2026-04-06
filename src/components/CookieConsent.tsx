import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CookieConsentProps {
  onViewPolicy: () => void;
}

export default function CookieConsent({ onViewPolicy }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
        >
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[24px] p-6 shadow-2xl shadow-black/10 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className="w-12 h-12 bg-[#834fff]/10 rounded-full flex items-center justify-center text-[#834fff] shrink-0">
                  <span className="material-icons-round text-2xl">cookie</span>
                </div>
                <div>
                  <h4 className="font-headline font-bold text-lg mb-1">Cookie Consent</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl">
                    We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. <button onClick={onViewPolicy} className="text-[#834fff] font-bold hover:underline">Read Policy</button>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleDecline}
                  className="px-6 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  className="px-8 py-2.5 bg-[#834fff] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#834fff]/20 hover:bg-[#6d23f9] transition-all active:scale-95"
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
