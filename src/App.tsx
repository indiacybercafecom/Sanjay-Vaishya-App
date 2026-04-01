/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [galleryImages, setGalleryImages] = useState<{src: string, title: string, desc: string, tag: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameRef = React.useRef<HTMLInputElement>(null);
  const queryRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Splash screen timer
    const timer = setTimeout(() => setShowSplash(false), 2500);
    
    // Theme initialization
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDarkMode(initialDark);
    if (initialDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // History management for back button
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.section) {
        setActiveSection(event.state.section);
      } else {
        setActiveSection('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Set initial history state if not present
    const navIds = ['home', 'help', 'gallery', 'updates', 'contact', 'settings', 'about'];
    const initialSection = window.location.hash.replace('#', '') || 'home';
    if (!window.history.state) {
      window.history.replaceState({ section: initialSection }, '', `#${initialSection}`);
    }
    if (navIds.includes(initialSection)) {
      setActiveSection(initialSection);
    }

    // Load specific gallery images
    setTimeout(() => {
      setGalleryImages([
        {
          src: 'https://sanjay.indiacybercafe.com/uploads/sanjay/sanjay%20kumar%20vaishya%20hero%20image.png',
          title: 'Hero Image with Personal Strength',
          desc: 'A polished personal branding portrait capturing Sanjay\'s confident and authentic presence. Ideal for personal branding, leadership, and digital service expertise.',
          tag: 'Personal Brand'
        },
        {
          src: 'https://sanjay.indiacybercafe.com/uploads/sanjay/Sanjay%20Kumar%20Vaishya%20%E2%80%93%20Leadership%2C%20Guidance%20and%20Community%20Support.jpg',
          title: 'Leadership & Community Support',
          desc: 'Sanjay Kumar Vaishya demonstrating leadership and providing guidance to the community through digital support services.',
          tag: 'Leadership'
        },
        {
          src: 'https://sanjay.indiacybercafe.com/uploads/sanjay/sanjay-vaishya-school-classroom-friends.jpg.jpg',
          title: 'Connections & Growth',
          desc: 'Building strong connections and fostering community growth through education and shared experiences in a classroom setting.',
          tag: 'Community'
        },
        {
          src: 'https://sanjay.indiacybercafe.com/uploads/sanjay/Sanjay%20Kumar%20Vaishya%20%E2%80%93%20Teamwork%2C%20Connections%20and%20Community%20Growth.jpg',
          title: 'Teamwork & Digital Expertise',
          desc: 'Collaborating with others to provide expert digital services and support, ensuring teamwork leads to community success.',
          tag: 'Teamwork'
        }
      ]);
    }, 1500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newMode;
    });
  };

  const handleHelpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameRef.current || !queryRef.current) return;
    
    setIsSubmitting(true);
    
    const name = nameRef.current.value;
    const query = queryRef.current.value;
    
    setTimeout(() => {
      const message = `Hello Sanjay, I need assistance.%0A%0AName: ${encodeURIComponent(name)}%0AQuery: ${encodeURIComponent(query)}`;
      window.open(`https://wa.me/919203251821?text=${message}`, '_blank');
      setIsSubmitting(false);
    }, 800);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sanjay Vaishya - Developer',
          text: 'Check out Sanjay Vaishya\'s professional portfolio and get free assistance.',
          url: window.location.href
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const navItems = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'help', icon: 'help_outline', label: 'Help' },
    { id: 'gallery', icon: 'grid_view', label: 'Gallery' },
    { id: 'updates', icon: 'notifications', label: 'Updates' },
    { id: 'contact', icon: 'mail', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0e0e0e] text-gray-900 dark:text-white font-sans transition-colors duration-500">
      
      {/* Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-[#0e0e0e] transition-colors duration-500"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="w-24 h-24 rounded-full border-4 border-[#834fff] border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <img src="https://indiacybercafe.com/wp-content/uploads/2026/03/sanjay_siteicon.png" alt="Logo" className="w-16 h-16 rounded-full" />
              </div>
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 font-headline font-extrabold text-2xl text-[#834fff] tracking-tight"
            >
              Sanjay Vaishya
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-2 text-gray-400 text-sm tracking-widest uppercase"
            >
              Developer
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/80 dark:bg-[#0e0e0e]/80 border-b border-gray-100 dark:border-white/5 px-6 py-4 flex items-center justify-between transition-all duration-500 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          <img src="https://indiacybercafe.com/wp-content/uploads/2026/03/sanjay_siteicon.png" alt="Logo" className="w-10 h-10 rounded-full border-2 border-[#834fff]" />
          <div>
            <h1 className="font-headline font-extrabold text-lg leading-tight tracking-tight">Sanjay Vaishya</h1>
            <p className="text-[10px] font-bold text-[#834fff] uppercase tracking-widest leading-none">Developer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[#834fff] active:scale-90 transition-all hover:bg-gray-200 dark:hover:bg-white/10"
          >
            <span className="material-icons-round text-xl">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
          </button>
          <button 
            onClick={() => navigateTo('settings')}
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-all hover:bg-gray-200 dark:hover:bg-white/10"
          >
            <span className="material-icons-round text-xl">settings</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6 pb-32 max-w-lg mx-auto">
        
        {/* Home Section */}
        {activeSection === 'home' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[24px] p-8 flex flex-col items-center text-center shadow-sm dark:shadow-2xl transition-all duration-500">
              <div className="relative mb-6">
                <img src="https://indiacybercafe.com/wp-content/uploads/2026/03/sanjay_siteicon.png" alt="Sanjay Vaishya" className="w-32 h-32 rounded-full border-4 border-[#834fff] shadow-2xl" />
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-[#0e0e0e] rounded-full"></div>
              </div>
              <h2 className="font-headline font-extrabold text-3xl mb-1">Sanjay Vaishya</h2>
              <p className="text-[#834fff] font-bold tracking-widest uppercase text-xs mb-4">Developer & Cyber Cafe Owner</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-8">
                Providing free assistance and professional development services to the community.
              </p>
              
              <div className="grid grid-cols-4 gap-4 w-full">
                <a href="tel:+919203251821" className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <span className="material-icons-round">call</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Call</span>
                </a>
                <a href="https://wa.me/919203251821" className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                    <span className="material-icons-round">chat</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">WhatsApp</span>
                </a>
                <a href="mailto:sanjayvaishya.dev@gmail.com" className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                    <span className="material-icons-round">email</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Email</span>
                </a>
                <a href="https://sanjay.indiacybercafe.com" target="_blank" className="flex flex-col items-center gap-2 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#834fff]/10 flex items-center justify-center text-[#834fff] group-hover:scale-110 transition-transform">
                    <span className="material-icons-round">language</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Web</span>
                </a>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#834fff] to-[#6d23f9] rounded-[24px] p-6 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <h3 className="font-headline font-bold text-xl mb-2 relative z-10">Free Assistance</h3>
              <p className="text-white/80 text-sm mb-6 relative z-10 leading-relaxed">Need help with online forms, college admissions, or tech bugs? I offer free support to everyone.</p>
              <button onClick={() => setActiveSection('help')} className="bg-white text-[#834fff] font-bold px-8 py-3 rounded-full text-sm relative z-10 hover:shadow-lg transition-all active:scale-95">Request Now</button>
            </div>

            <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[24px] p-5 flex items-center gap-4 shadow-sm transition-all duration-500">
              <div className="w-12 h-12 rounded-full bg-[#834fff]/10 flex items-center justify-center text-[#834fff]">
                <span className="material-icons-round">location_on</span>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Location</p>
                <p className="text-sm font-bold">Jobgarh, Singrauli, MP, India</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Help Section */}
        {activeSection === 'help' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="font-headline font-extrabold text-2xl">Free Assistance</h2>
            <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[24px] p-8 shadow-sm transition-all duration-500">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">Fill out the form below and I will get back to you on WhatsApp as soon as possible.</p>
              <form onSubmit={handleHelpSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase text-gray-500 tracking-widest ml-1">Your Name</label>
                  <input ref={nameRef} type="text" required className="w-full bg-gray-100 dark:bg-white/10 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#834fff] transition-all" placeholder="Enter your name" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase text-gray-500 tracking-widest ml-1">Your Query</label>
                  <textarea ref={queryRef} required rows={4} className="w-full bg-gray-100 dark:bg-white/10 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-[#834fff] transition-all resize-none" placeholder="How can I help you?"></textarea>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-[#834fff] text-white font-bold py-5 rounded-2xl shadow-xl shadow-[#834fff]/30 hover:bg-[#6d23f9] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-icons-round">send</span>
                      Submit to WhatsApp
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Gallery Section */}
        {activeSection === 'gallery' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <h2 className="font-headline font-extrabold text-2xl">Gallery</h2>
            <div className="space-y-8">
              {galleryImages.length > 0 ? (
                galleryImages.map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.1 }}
                    className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[32px] overflow-hidden shadow-sm dark:shadow-2xl transition-all duration-500"
                  >
                    <div className="bg-[#1a1a1a] dark:bg-black p-4">
                      <p className="text-white text-xs font-bold leading-tight">Sanjay Kumar Vaishya – Professional Identity and Digital Service Expert</p>
                    </div>
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={item.src} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 space-y-4">
                      <h3 className="font-headline font-extrabold text-xl leading-tight">{item.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                      <div className="inline-block px-4 py-2 bg-[#834fff]/10 rounded-full">
                        <span className="text-[#834fff] text-xs font-bold">{item.tag}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                [...Array(2)].map((_, i) => (
                  <div key={i} className="h-96 rounded-[32px] bg-gray-100 dark:bg-white/10 animate-pulse"></div>
                ))
              )}
            </div>
            <div className="pt-6 text-center">
              <a href="https://sanjay.indiacybercafe.com/posts/sanjay-collections.html" target="_blank" className="text-[#834fff] font-bold flex items-center justify-center gap-2 hover:underline">
                View All Collections
                <span className="material-icons-round text-sm">open_in_new</span>
              </a>
            </div>
          </motion.div>
        )}

        {/* Updates Section */}
        {activeSection === 'updates' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="font-headline font-extrabold text-2xl">Blog & Updates</h2>
            <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[32px] p-8 text-center shadow-sm transition-all duration-500">
              <div className="w-20 h-20 bg-[#834fff]/10 rounded-full flex items-center justify-center text-[#834fff] mx-auto mb-6">
                <span className="material-icons-round text-4xl">rss_feed</span>
              </div>
              <h3 className="font-headline font-extrabold text-xl mb-4">Latest Updates</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Stay updated with the latest news, tech trends, and community support stories from Sanjay Vaishya.
              </p>
              <a 
                href="https://sanjay.indiacybercafe.com/updates" 
                target="_blank" 
                className="inline-flex items-center gap-3 bg-[#834fff] text-white font-bold px-8 py-4 rounded-2xl shadow-xl shadow-[#834fff]/30 hover:bg-[#6d23f9] transition-all active:scale-95"
              >
                View All Updates
                <span className="material-icons-round">open_in_new</span>
              </a>
            </div>
          </motion.div>
        )}

        {/* Contact Section */}
        {activeSection === 'contact' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="font-headline font-extrabold text-2xl">Contact</h2>
            <div className="space-y-4">
              {[
                { label: 'Call Me', value: '+91 9203251821', icon: 'call', color: 'blue', href: 'tel:+919203251821' },
                { label: 'WhatsApp', value: 'Chat with Sanjay', icon: 'chat', color: 'green', href: 'https://wa.me/919203251821' },
                { label: 'Email', value: 'sanjayvaishya.dev@gmail.com', icon: 'email', color: 'red', href: 'mailto:sanjayvaishya.dev@gmail.com' },
                { label: 'Website', value: 'sanjay.indiacybercafe.com', icon: 'public', color: 'purple', href: 'https://sanjay.indiacybercafe.com' }
              ].map((item, i) => (
                <a key={i} href={item.href} target={item.icon === 'public' ? '_blank' : undefined} className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-[24px] flex items-center justify-between group active:scale-95 transition-all shadow-sm duration-500">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full bg-${item.color}-500/10 flex items-center justify-center text-${item.color}-500`}>
                      <span className="material-icons-round">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</p>
                      <p className="font-bold text-sm">{item.value}</p>
                    </div>
                  </div>
                  <span className="material-icons-round text-gray-400 group-hover:text-[#834fff] transition-colors">chevron_right</span>
                </a>
              ))}
            </div>
            <div className="backdrop-blur-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-[24px] p-8 shadow-sm">
              <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-icons-round text-[#834fff]">location_on</span>
                Office Address
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Jobgarh, Singrauli, Madhya Pradesh, India (486886)<br /><br />
                Visit my Cyber Cafe for direct assistance and digital services. I'm available for consultations and support during business hours.
              </p>
            </div>
          </motion.div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="font-headline font-extrabold text-2xl">Settings</h2>
            <div className="space-y-3">
              <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-[24px] flex items-center justify-between shadow-sm transition-all duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center text-[#834fff]">
                    <span className="material-icons-round">palette</span>
                  </div>
                  <span className="font-bold">Dark Mode</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isDarkMode} onChange={toggleTheme} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#834fff]"></div>
                </label>
              </div>

              <button onClick={() => setActiveSection('about')} className="w-full backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-[24px] flex items-center justify-between group active:scale-95 transition-all shadow-sm duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center text-[#834fff]">
                    <span className="material-icons-round">person</span>
                  </div>
                  <span className="font-bold">About Sanjay</span>
                </div>
                <span className="material-icons-round text-gray-400 group-hover:text-[#834fff] transition-colors">chevron_right</span>
              </button>

              <button onClick={handleShare} className="w-full backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-[24px] flex items-center justify-between group active:scale-95 transition-all shadow-sm duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center text-[#834fff]">
                    <span className="material-icons-round">share</span>
                  </div>
                  <span className="font-bold">Share App</span>
                </div>
                <span className="material-icons-round text-gray-400 group-hover:text-[#834fff] transition-colors">chevron_right</span>
              </button>

              <div className="pt-10 text-center space-y-4">
                <div className="flex justify-center gap-6">
                  <button className="text-[10px] uppercase tracking-widest text-gray-500 font-bold hover:text-[#834fff]">Privacy Policy</button>
                  <button className="text-[10px] uppercase tracking-widest text-gray-500 font-bold hover:text-[#834fff]">Terms & Conditions</button>
                </div>
                <div className="pt-4">
                  <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">App Version v1.0.0</p>
                  <p className="text-[10px] text-gray-400 mt-1">Designed with ❤️ for Sanjay Vaishya</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* About Section */}
        {activeSection === 'about' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <button onClick={() => setActiveSection('settings')} className="p-2 rounded-full bg-white/5">
                <span className="material-icons-round">arrow_back</span>
              </button>
              <h2 className="font-headline font-extrabold text-2xl">About Sanjay</h2>
            </div>
            <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[24px] p-8 space-y-8 shadow-sm transition-all duration-500">
              <img src="https://picsum.photos/seed/sanjay/600/300" alt="About" className="w-full h-48 object-cover rounded-2xl shadow-xl" />
              <div className="space-y-6">
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  Sanjay Vaishya is a dedicated professional based in Singrauli, Madhya Pradesh. He wears multiple hats as a <strong>Cyber Cafe Owner</strong> and a <strong>Developer</strong>.
                </p>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  With a passion for technology and community service, Sanjay provides <strong>free assistance</strong> to individuals navigating digital forms, educational admissions, and technical development queries.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-5 bg-[#834fff]/5 rounded-[24px] border border-[#834fff]/10">
                    <h4 className="font-bold text-[#834fff] mb-1">Developer</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Building modern digital solutions.</p>
                  </div>
                  <div className="p-5 bg-[#834fff]/5 rounded-[24px] border border-[#834fff]/10">
                    <h4 className="font-bold text-[#834fff] mb-1">Support</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Free community assistance.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </main>

      {/* Floating Action Button */}
      <motion.a 
        href="https://wa.me/919203251821?text=Hello%20Sanjay,%20I%20need%20assistance" 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-28 right-6 w-14 h-14 bg-green-500 text-white rounded-2xl shadow-2xl flex items-center justify-center z-40"
      >
        <span className="material-icons-round text-3xl">chat</span>
      </motion.a>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/80 dark:bg-[#0e0e0e]/80 border-t border-gray-100 dark:border-white/5 rounded-t-[32px] px-6 pt-4 pb-8 flex items-center justify-around transition-all duration-500 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-none">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => navigateTo(item.id)} 
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeSection === item.id ? 'text-[#834fff] scale-110' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeSection === item.id ? 'bg-[#834fff]/10' : ''}`}>
              <span className={`material-icons-round ${activeSection === item.id ? 'fill-1' : ''}`}>{item.icon}</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <style>{`
        .font-headline { font-family: 'Manrope', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .material-icons-round { font-size: 24px; }
        .fill-1 { font-variation-settings: 'FILL' 1; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );

  function navigateTo(sectionId: string, push = true) {
    setActiveSection(sectionId);
    if (push) {
      window.history.pushState({ section: sectionId }, '', `#${sectionId}`);
    }
    window.scrollTo(0, 0);
  }
}
