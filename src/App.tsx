/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import CookieConsent from './components/CookieConsent';

export default function App() {
  const [activeSection, setActiveSection] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOptions, setDeleteOptions] = useState({
    contactData: true,
    usageLogs: false,
    personalInfo: false,
    other: false
  });
  const [galleryImages, setGalleryImages] = useState<{src: string, title: string, desc: string, tag: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
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
    const navIds = ['home', 'help', 'gallery', 'updates', 'contact', 'settings', 'about', 'privacy', 'terms', 'delete-data', 'blog-guide'];
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
          url: window.location.origin
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert('Link copied to clipboard!');
    }
  };

  const handleImageShare = async (image: { src: string, title: string, desc: string }) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title,
          text: image.desc,
          url: image.src
        });
      } catch (err) {
        console.log('Image share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(image.src);
        // Using a custom log instead of alert as per guidelines
        console.log('Image link copied to clipboard');
      } catch (err) {
        console.log('Failed to copy image link:', err);
      }
    }
  };

  const handlePostShare = async (post: any) => {
    const shareUrl = `${window.location.origin}/#${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.desc,
          url: shareUrl
        });
      } catch (err) {
        console.log('Post share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        console.log('Post link copied to clipboard');
      } catch (err) {
        console.log('Failed to copy post link:', err);
      }
    }
  };

  const sendDeleteRequest = () => {
    const selected = Object.entries(deleteOptions)
      .filter(([_, val]) => val)
      .map(([key, _]) => {
        if (key === 'contactData') return 'Contact Form Data';
        if (key === 'usageLogs') return 'App Usage Logs';
        if (key === 'personalInfo') return 'Personal Information';
        return 'Other Data';
      });

    const subject = `Data Deletion Request - Sanjay Vaishya App`;
    const body = `Hello Sanjay,%0A%0AI would like to request the deletion of my data from the Sanjay Vaishya App.%0A%0AItems to delete:%0A${selected.map(s => `- ${s}`).join('%0A')}%0A%0APlease process this request and confirm once completed.%0A%0AThank you.`;
    
    window.location.href = `mailto:sanjayvaishya.dev@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
  };

  const navItems = [
    { id: 'home', icon: 'home', label: 'Home' },
    { id: 'help', icon: 'help_outline', label: 'Help' },
    { id: 'gallery', icon: 'grid_view', label: 'Gallery' },
    { id: 'updates', icon: 'notifications', label: 'Updates' },
    { id: 'contact', icon: 'mail', label: 'Contact' },
  ];

  const blogPosts = [
    {
      id: 'deploy-guide',
      title: '🌐 How to Deploy a Website on Hostinger (Step-by-Step Guide)',
      desc: 'Learn how to make your website live on the internet using Hostinger. A complete beginner-friendly guide for HTML, CSS, JS, and PHP.',
      image: 'https://indiacybercafe.com/wp-content/uploads/2026/04/Deploy_Website_HTML_202604031034.jpeg',
      category: 'Guides',
      tag: 'New Guide'
    },
    {
      id: 'blog-guide',
      title: 'How to Build a Website with HTML, CSS, and JS (Step-by-Step Guide)',
      desc: 'If you want to build your own website, this guide is for you. Learn how to create a website in a very simple way.',
      image: 'https://indiacybercafe.com/wp-content/uploads/2026/04/HTML_CSS_JS.jpeg',
      category: 'Guides',
      tag: 'New Guide'
    }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         post.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Guides', 'News', 'Tips'];

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
                      <div className="flex items-center justify-between pt-2">
                        <div className="inline-block px-4 py-2 bg-[#834fff]/10 rounded-full">
                          <span className="text-[#834fff] text-xs font-bold">{item.tag}</span>
                        </div>
                        <button 
                          onClick={() => handleImageShare(item)}
                          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[#834fff] active:scale-90 transition-all hover:bg-[#834fff]/10"
                          title="Share Image"
                        >
                          <span className="material-icons-round text-xl">share</span>
                        </button>
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
            <div className="flex flex-col gap-4">
              <h2 className="font-headline font-extrabold text-2xl">Blog & Updates</h2>
              
              {/* Search and Filter UI */}
              <div className="space-y-4">
                <div className="relative">
                  <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                  <input 
                    type="text" 
                    placeholder="Search posts..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#834fff] outline-none transition-all"
                  />
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        selectedCategory === cat 
                        ? 'bg-[#834fff] text-white shadow-lg shadow-[#834fff]/30' 
                        : 'bg-white dark:bg-white/5 text-gray-500 border border-gray-200 dark:border-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <AnimatePresence mode="popLayout">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <motion.div 
                    key={post.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[32px] overflow-hidden shadow-sm transition-all duration-500"
                  >
                    <div className="h-48 relative overflow-hidden">
                      <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-4 left-6">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-widest">{post.tag}</span>
                      </div>
                    </div>
                    <div className="p-8 space-y-4">
                      <h3 className="font-headline font-extrabold text-xl leading-tight">{post.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {post.desc}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <button 
                          onClick={() => navigateTo(post.id as any)}
                          className="inline-flex items-center gap-2 text-[#834fff] font-bold hover:underline"
                        >
                          Read All
                          <span className="material-icons-round text-sm">arrow_forward</span>
                        </button>
                        <button 
                          onClick={() => handlePostShare(post)}
                          className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[#834fff] active:scale-90 transition-all hover:bg-[#834fff]/10"
                          title="Share Post"
                        >
                          <span className="material-icons-round text-xl">share</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <span className="material-icons-round text-4xl text-gray-300 mb-4">search_off</span>
                  <p className="text-gray-500">No posts found matching your search.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[32px] p-8 text-center shadow-sm transition-all duration-500">
              <div className="w-20 h-20 bg-[#834fff]/10 rounded-full flex items-center justify-center text-[#834fff] mx-auto mb-6">
                <span className="material-icons-round text-4xl">rss_feed</span>
              </div>
              <h3 className="font-headline font-extrabold text-xl mb-4">Latest Updates</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                Stay updated with the latest news, tech trends, and community support stories from Sanjay Vaishya.
              </p>
              <a 
                href="https://sanjay.indiacybercafe.com/updates.html" 
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

              <div className="flex items-center gap-4 w-full">
                <button onClick={() => navigateTo('about')} className="flex-1 backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-[24px] flex items-center justify-between group active:scale-95 transition-all shadow-sm duration-500">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center text-[#834fff]">
                      <span className="material-icons-round">person</span>
                    </div>
                    <span className="font-bold">About Sanjay</span>
                  </div>
                  <span className="material-icons-round text-gray-400 group-hover:text-[#834fff] transition-colors">chevron_right</span>
                </button>
                <button 
                  onClick={() => window.open('/about.html', '_blank')}
                  className="p-5 backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[24px] text-gray-400 hover:text-[#834fff] active:scale-95 transition-all shadow-sm duration-500"
                  title="Open dedicated About page"
                >
                  <span className="material-icons-round">open_in_new</span>
                </button>
              </div>

              <button onClick={handleShare} className="w-full backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-[24px] flex items-center justify-between group active:scale-95 transition-all shadow-sm duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center text-[#834fff]">
                    <span className="material-icons-round">share</span>
                  </div>
                  <span className="font-bold">Share App</span>
                </div>
                <span className="material-icons-round text-gray-400 group-hover:text-[#834fff] transition-colors">chevron_right</span>
              </button>

              <button onClick={() => window.open('https://play.google.com/store/apps/details?id=com.sanjayvaishya.app', '_blank')} className="w-full backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-[24px] flex items-center justify-between group active:scale-95 transition-all shadow-sm duration-500">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center text-[#834fff]">
                    <span className="material-icons-round">star</span>
                  </div>
                  <span className="font-bold">Rate App</span>
                </div>
                <span className="material-icons-round text-gray-400 group-hover:text-[#834fff] transition-colors">chevron_right</span>
              </button>

              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="w-full backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 p-5 rounded-[24px] flex items-center justify-between group active:scale-95 transition-all shadow-sm duration-500"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                    <span className="material-icons-round">delete_outline</span>
                  </div>
                  <span className="font-bold text-red-500">Delete Account / Data</span>
                </div>
                <span className="material-icons-round text-gray-400 group-hover:text-red-500 transition-colors">chevron_right</span>
              </button>

              <div className="pt-10 text-center space-y-4">
                <div className="flex justify-center gap-6">
                  <button onClick={() => navigateTo('privacy')} className="text-[10px] uppercase tracking-widest text-gray-500 font-bold hover:text-[#834fff]">Privacy Policy</button>
                  <button onClick={() => navigateTo('cookie-policy')} className="text-[10px] uppercase tracking-widest text-gray-500 font-bold hover:text-[#834fff]">Cookie Policy</button>
                  <button onClick={() => navigateTo('terms')} className="text-[10px] uppercase tracking-widest text-gray-500 font-bold hover:text-[#834fff]">Terms & Conditions</button>
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
            <div className="relative flex items-center justify-center min-h-[64px] mb-4 px-4">
              <button 
                onClick={() => navigateTo('settings')} 
                className="absolute left-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-all"
              >
                <span className="material-icons-round">arrow_back</span>
              </button>
              <h2 className="font-headline font-extrabold text-2xl">About Sanjay Vaishya</h2>
            </div>
            <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[32px] p-8 space-y-8 shadow-sm transition-all duration-500">
              <div className="relative h-48 rounded-2xl overflow-hidden group">
                <img src="https://sanjay.indiacybercafe.com/uploads/sanjay/sanjay%20kumar%20vaishya%20hero%20image.png" alt="Sanjay Vaishya" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-white font-headline font-bold text-xl">Sanjay Vaishya</h3>
                  <p className="text-white/80 text-xs font-bold uppercase tracking-widest">Developer & CEO, India Cyber Cafe</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <section className="space-y-3">
                  <h4 className="font-headline font-extrabold text-lg text-[#834fff]">Introduction</h4>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    Sanjay Vaishya is a visionary <strong>Developer</strong> and the <strong>CEO of India Cyber Cafe</strong>, based in Jobgarh, Singrauli, Madhya Pradesh. With years of experience in digital services, he has dedicated his career to bridging the digital divide in India.
                  </p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-headline font-extrabold text-lg text-[#834fff]">About India Cyber Cafe</h4>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    India Cyber Cafe is more than just a cafe; it's a digital hub providing essential services like online form filling, technical support, and developer guidance. We empower local communities by making digital tools accessible to everyone.
                  </p>
                </section>

                <section className="space-y-3">
                  <h4 className="font-headline font-extrabold text-lg text-[#834fff]">Purpose of the App</h4>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    The <strong>Sanjay Vaishya App</strong> is designed to provide a direct channel for users to seek <strong>FREE assistance</strong>. Whether you need help with digital services, cyber cafe queries, or basic coding guidance, this app is your companion.
                  </p>
                </section>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-5 bg-[#834fff]/5 rounded-[24px] border border-[#834fff]/10">
                    <h4 className="font-bold text-[#834fff] mb-1">Vision</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Digital India for everyone.</p>
                  </div>
                  <div className="p-5 bg-[#834fff]/5 rounded-[24px] border border-[#834fff]/10">
                    <h4 className="font-bold text-[#834fff] mb-1">Mission</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Empowering through free support.</p>
                  </div>
                </div>

                <section className="space-y-3 pt-4">
                  <h4 className="font-headline font-extrabold text-lg text-[#834fff]">Contact Information</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <span className="material-icons-round text-sm">email</span>
                      sanjayvaishya.dev@gmail.com
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <span className="material-icons-round text-sm">public</span>
                      sanjay.indiacybercafe.com
                    </p>
                  </div>
                </section>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold text-center">
                  Keywords: developer app, cyber cafe services, digital services India, Sanjay Vaishya, India Cyber Cafe
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Cookie Policy Section */}
        {activeSection === 'cookie-policy' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="relative flex items-center justify-center min-h-[64px] mb-4 px-4">
              <button 
                onClick={() => navigateTo('settings')} 
                className="absolute left-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-all"
              >
                <span className="material-icons-round">arrow_back</span>
              </button>
              <h2 className="font-headline font-extrabold text-2xl">Cookie Policy</h2>
            </div>
            <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[32px] p-8 space-y-6 shadow-sm transition-all duration-500">
              <p className="text-[10px] font-bold text-[#834fff] uppercase tracking-widest">Last Updated: April 06, 2026</p>
              
              <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
                <section>
                  <h3 className="text-lg font-bold">1. What are Cookies?</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Cookies are small text files that are stored on your device (computer or mobile) when you visit a website or use an app. They are widely used to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">2. How We Use Cookies</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    The Sanjay Vaishya App uses cookies for the following purposes:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mt-2">
                    <li>• <strong>Essential Cookies:</strong> Necessary for the app to function properly, such as remembering your theme preference (Dark/Light mode).</li>
                    <li>• <strong>Analytics Cookies:</strong> Help us understand how users interact with the app by collecting and reporting information anonymously (e.g., via Google Analytics).</li>
                    <li>• <strong>Functional Cookies:</strong> Remember choices you make (like your cookie consent preference) to provide a more personalized experience.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-bold">3. Third-Party Cookies</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    In some cases, we use cookies provided by trusted third parties. For example, we use Google Analytics to help us understand how you use the app and ways that we can improve your experience. These cookies may track things such as how long you spend on the app and the pages that you visit.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">4. Managing Cookies</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    You can control and/or delete cookies as you wish. You can delete all cookies that are already on your device and you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust some preferences every time you visit the app and some services and functionalities may not work.
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-2">
                    You can also manage your consent through the banner that appears when you first visit the app.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">5. Compliance & Policy</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    This policy is designed to comply with global privacy standards, including:
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mt-2">
                    <li>• <strong>GDPR (EU):</strong> Ensuring transparency and user consent for data processing.</li>
                    <li>• <strong>Google Play Console Policy:</strong> Meeting the requirements for clear disclosure of data collection practices.</li>
                    <li>• <strong>Indian IT Act:</strong> Adhering to the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-lg font-bold">6. Contact Us</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    If you have any questions about our use of cookies, please contact us at:<br />
                    Email: sanjayvaishya.dev@gmail.com
                  </p>
                </section>
              </div>
            </div>
          </motion.div>
        )}

        {/* Privacy Policy Section */}
        {activeSection === 'privacy' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="relative flex items-center justify-center min-h-[64px] mb-4 px-4">
              <button 
                onClick={() => navigateTo('settings')} 
                className="absolute left-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-all"
              >
                <span className="material-icons-round">arrow_back</span>
              </button>
              <h2 className="font-headline font-extrabold text-2xl">Privacy Policy</h2>
            </div>
            <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[32px] p-8 space-y-6 shadow-sm transition-all duration-500">
              <p className="text-[10px] font-bold text-[#834fff] uppercase tracking-widest">Last Updated: April 01, 2026</p>
              
              <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
                <section>
                  <h3 className="text-lg font-bold">Introduction</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Welcome to the Sanjay Vaishya App. Your privacy is important to us. This policy explains how we handle your information.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">Information We Collect</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    We do not require any login or registration. We only collect information you voluntarily provide through our contact form (such as your name and query) to assist you.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">How We Use Information</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    The information you provide is used solely to respond to your requests and provide the assistance you seek. <strong>We do not sell user data to any third parties.</strong>
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">Log Data & Cookies</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    As a WebView-based app, we may collect standard log data and use cookies to improve your browsing experience on our website content.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">Third-Party Services</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    We may use third-party services like Google Analytics to understand app usage. These services have their own privacy policies.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">Data Security</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    We take reasonable measures to protect your data, but remember that no method of transmission over the internet is 100% secure.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">Children’s Privacy</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Our app does not target children under 13. We do not knowingly collect data from children.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">Contact Us</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    If you have questions, contact us at:<br />
                    Email: sanjayvaishya.dev@gmail.com<br />
                    Phone: +91 9203251821
                  </p>
                </section>
              </div>
            </div>
          </motion.div>
        )}

        {/* Terms & Conditions Section */}
        {activeSection === 'terms' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="relative flex items-center justify-center min-h-[64px] mb-4 px-4">
              <button 
                onClick={() => navigateTo('settings')} 
                className="absolute left-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-all"
              >
                <span className="material-icons-round">arrow_back</span>
              </button>
              <h2 className="font-headline font-extrabold text-2xl">Terms & Conditions</h2>
            </div>
            <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[32px] p-8 space-y-6 shadow-sm transition-all duration-500">
              <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
                <section>
                  <h3 className="text-lg font-bold">Acceptance of Terms</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    By using the Sanjay Vaishya App, you agree to these Terms & Conditions. If you do not agree, please do not use the app.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">Intellectual Property</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    All content, including text, images, and logos, belongs to <strong>Sanjay Vaishya / India Cyber Cafe</strong>. You may not use it without permission.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">User Responsibilities</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    You agree to use the app for lawful purposes only and not to provide false information through our contact forms.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">Limitation of Liability</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    We provide assistance on an "as-is" basis. We are not liable for any damages resulting from the use or inability to use the app.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">External Links</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    The app contains links to external sites. We are not responsible for the content or privacy practices of those sites.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">Governing Law</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    These terms are governed by the laws of <strong>India</strong>. Any disputes will be subject to the jurisdiction of courts in Singrauli, MP.
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold">Contact</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    For any queries regarding these terms, email us at sanjayvaishya.dev@gmail.com.
                  </p>
                </section>
              </div>
            </div>
          </motion.div>
        )}

        {/* Delete Data Section */}
        {activeSection === 'delete-data' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="relative flex items-center justify-center min-h-[64px] mb-4 px-4">
              <button 
                onClick={() => navigateTo('settings')} 
                className="absolute left-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-all"
              >
                <span className="material-icons-round">arrow_back</span>
              </button>
              <h2 className="font-headline font-extrabold text-2xl text-red-500">Delete Data</h2>
            </div>
            <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[32px] p-8 space-y-8 shadow-sm transition-all duration-500">
              <div className="space-y-4">
                <h3 className="font-headline font-bold text-lg">Select Data to Delete</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Please select the types of data you would like to request deletion for:</p>
                
                <div className="space-y-3">
                  {[
                    { id: 'contactData', label: 'Contact Form Data' },
                    { id: 'usageLogs', label: 'App Usage Logs' },
                    { id: 'personalInfo', label: 'Personal Information' },
                    { id: 'other', label: 'Other Data' }
                  ].map((opt) => (
                    <label key={opt.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                      <input 
                        type="checkbox" 
                        checked={deleteOptions[opt.id as keyof typeof deleteOptions]} 
                        onChange={() => setDeleteOptions(prev => ({ ...prev, [opt.id]: !prev[opt.id as keyof typeof deleteOptions] }))}
                        className="w-5 h-5 rounded border-gray-300 text-[#834fff] focus:ring-[#834fff]"
                      />
                      <span className="font-bold text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-5">
                <p className="text-xs text-red-500 leading-relaxed font-bold">
                  Note: Clicking the button below will open your email app with a pre-filled request. Once sent, we will process your deletion within 7-10 business days.
                </p>
              </div>

              <button 
                onClick={sendDeleteRequest}
                className="w-full bg-red-500 text-white font-bold py-5 rounded-2xl shadow-xl shadow-red-500/30 hover:bg-red-600 transition-all flex items-center justify-center gap-3 active:scale-95"
              >
                <span className="material-icons-round">send</span>
                Send Deletion Request
              </button>
            </div>
          </motion.div>
        )}

        {/* Deploy Guide Section */}
        {activeSection === 'deploy-guide' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="relative flex items-center justify-center min-h-[64px] mb-4 px-4">
              <button 
                onClick={() => navigateTo('updates')} 
                className="absolute left-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-all"
              >
                <span className="material-icons-round">arrow_back</span>
              </button>
              <h2 className="font-headline font-extrabold text-2xl">Deployment Guide</h2>
            </div>

            <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[32px] p-8 md:p-12 space-y-8 shadow-sm transition-all duration-500">
              <div className="space-y-4">
                <h3 className="font-headline font-extrabold text-2xl leading-tight">
                  🌐 How to Deploy a Website on Hostinger (Step-by-Step Guide)
                </h3>
                <div className="bg-[#834fff]/5 p-6 rounded-3xl border border-[#834fff]/10">
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    📌 <strong>Introduction:</strong> Website deployment means making your website live on the internet so everyone can see it. Hostinger is a great platform for this because it is fast, affordable, and very easy to use for beginners.
                  </p>
                </div>
              </div>

              <div className="space-y-10">
                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="material-icons-round text-[#834fff]">psychology</span>
                    🧠 What You Need:
                  </h4>
                  <div className="grid gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-3">
                      <span className="material-icons-round text-[#834fff]">language</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Domain name (e.g., yourname.com)</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-3">
                      <span className="material-icons-round text-[#834fff]">cloud_queue</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Hostinger hosting account</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center gap-3">
                      <span className="material-icons-round text-[#834fff]">folder_zip</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Website files (HTML, CSS, JS, PHP)</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#834fff] text-white flex items-center justify-center text-sm">1</span>
                    1️⃣ Login to Hostinger
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Go to the official Hostinger website and click on the login button. Enter your email and password to access your hosting dashboard.
                  </p>
                </section>

                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#834fff] text-white flex items-center justify-center text-sm">2</span>
                    2️⃣ Open hPanel / File Manager
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Once logged in, find your hosting plan and click "Manage". Look for the <strong>File Manager</strong> icon. Inside the File Manager, open the <strong>public_html</strong> folder. This is where all your website files must go.
                  </p>
                </section>

                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#834fff] text-white flex items-center justify-center text-sm">3</span>
                    3️⃣ Upload Website Files
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Click the upload button and select your HTML, CSS, and JS files. If you have PHP files, upload them too. If your files are in a ZIP folder, upload the ZIP and then use the "Extract" option inside Hostinger.
                  </p>
                </section>

                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#834fff] text-white flex items-center justify-center text-sm">4</span>
                    4️⃣ Set Main File
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Make sure your main homepage file is named <strong>index.html</strong> or <strong>index.php</strong>. This is the first file Hostinger looks for when someone visits your domain.
                  </p>
                </section>

                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#834fff] text-white flex items-center justify-center text-sm">5</span>
                    5️⃣ Check PHP Support
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Hostinger supports PHP by default on all their hosting plans. You don't need any extra setup to run your PHP scripts. Just upload and they will work!
                  </p>
                </section>

                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#834fff] text-white flex items-center justify-center text-sm">6</span>
                    6️⃣ Connect Domain
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Ensure your domain is correctly linked to your Hostinger account. If you bought the domain elsewhere, you may need to wait for DNS propagation (usually takes a few hours).
                  </p>
                </section>

                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#834fff] text-white flex items-center justify-center text-sm">7</span>
                    7️⃣ Open Your Website
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Now, open a new tab in your browser and enter your domain name. If everything was done correctly, your website should be live and visible to the world!
                  </p>
                </section>

                <section className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-green-50 dark:bg-green-500/10 rounded-3xl border border-green-100 dark:border-green-500/20">
                    <h4 className="font-headline font-bold text-lg text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                      <span className="material-icons-round">lightbulb</span>
                      💡 Quick Tips
                    </h4>
                    <ul className="text-xs text-green-700 dark:text-green-300 space-y-2">
                      <li>• Use correct file names (lowercase)</li>
                      <li>• Keep all files inside public_html</li>
                      <li>• Test your website locally before uploading</li>
                    </ul>
                  </div>
                  <div className="p-6 bg-amber-50 dark:bg-amber-500/10 rounded-3xl border border-amber-100 dark:border-amber-500/20">
                    <h4 className="font-headline font-bold text-lg text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                      <span className="material-icons-round">warning</span>
                      ⚠️ Common Mistakes
                    </h4>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-2">
                      <li>• <strong>Not loading:</strong> Check if index file exists.</li>
                      <li>• <strong>CSS/JS broken:</strong> Check file paths.</li>
                      <li>• <strong>Wrong path:</strong> Files must be in public_html.</li>
                      <li>• <strong>Missing file:</strong> Ensure all assets are uploaded.</li>
                    </ul>
                  </div>
                </section>

                <div className="bg-[#834fff] rounded-[24px] p-8 text-white space-y-6 shadow-xl shadow-[#834fff]/30">
                  <div className="space-y-2">
                    <h3 className="font-headline font-bold text-xl">💬 Need Help?</h3>
                    <p className="text-white/80 text-xs">If you are facing any problem, we are here to help you. You can contact us anytime.</p>
                  </div>
                  <div className="grid gap-3">
                    <a href="https://wa.me/919203251821?text=I%20need%20help%20for%20deploying%20website%20on%20Hostinger" className="flex items-center justify-center gap-2 bg-white text-[#834fff] font-bold py-4 rounded-2xl active:scale-95 transition-all text-sm">
                      <span className="material-icons-round text-lg">chat</span>
                      WhatsApp Support
                    </a>
                    <a href="mailto:sanjayvaishya.dev@gmail.com?subject=Help%20with%20Hostinger%20Deployment&body=Hello%20Sanjay,%20I%20need%20help%20for%20deploying%20my%20website%20on%20Hostinger." className="flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 font-bold py-4 rounded-2xl active:scale-95 transition-all text-sm">
                      <span className="material-icons-round text-lg">email</span>
                      Email Support
                    </a>
                    <a href="tel:+919203251821" className="flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 font-bold py-4 rounded-2xl active:scale-95 transition-all text-sm">
                      <span className="material-icons-round text-lg">call</span>
                      Call Support
                    </a>
                  </div>
                </div>

                <div className="text-center space-y-4 pt-4">
                  <p className="text-lg font-headline font-bold text-gray-800 dark:text-gray-200">🚀 Conclusion</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Deploying a website is a big step! Don't worry if you make mistakes, just keep trying. You've got this!</p>
                  <button 
                    onClick={() => window.open('/deploy-hostinger-guide.html', '_blank')}
                    className="inline-flex items-center gap-2 text-[#834fff] font-bold hover:underline mt-4"
                  >
                    Open Full Guide in New Tab
                    <span className="material-icons-round text-sm">open_in_new</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Blog Guide Section */}
        {activeSection === 'blog-guide' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="relative flex items-center justify-center min-h-[64px] mb-4 px-4">
              <button 
                onClick={() => navigateTo('updates')} 
                className="absolute left-0 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-all"
              >
                <span className="material-icons-round">arrow_back</span>
              </button>
              <h2 className="font-headline font-extrabold text-2xl">Website Guide</h2>
            </div>

            <div className="backdrop-blur-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-[32px] p-8 md:p-12 space-y-8 shadow-sm transition-all duration-500">
              <div className="space-y-4">
                <h3 className="font-headline font-extrabold text-2xl leading-tight">
                  🌐 How to Build a Website with HTML, CSS, and JS (Step-by-Step Guide)
                </h3>
                <div className="bg-[#834fff]/5 p-6 rounded-3xl border border-[#834fff]/10">
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                    📌 <strong>Introduction:</strong> If you want to build your own website, this guide is perfect for you. You don’t need any advanced knowledge. Just follow these simple steps and you can create your first website easily.
                  </p>
                </div>
              </div>

              <div className="space-y-10">
                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="material-icons-round text-[#834fff]">psychology</span>
                    What is HTML, CSS, and JavaScript?
                  </h4>
                  <div className="grid gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      <p className="font-bold text-[#834fff] text-sm">HTML (HyperText Markup Language)</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">It creates the structure of your website (like headings, text, buttons).</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      <p className="font-bold text-[#834fff] text-sm">CSS (Cascading Style Sheets)</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">It makes your website look beautiful (colors, layout, design).</p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                      <p className="font-bold text-[#834fff] text-sm">JavaScript (JS)</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">It adds functionality (button click, popup, actions).</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#834fff] text-white flex items-center justify-center text-sm">1</span>
                    Create Your Project Folder
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Create a folder on your computer and name it: <strong>my-website</strong>. Inside this folder, create 3 files: <code>index.html</code>, <code>style.css</code>, and <code>script.js</code>.
                  </p>
                </section>

                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#834fff] text-white flex items-center justify-center text-sm">2</span>
                    Create HTML Structure
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Open <code>index.html</code> and write your basic structure. Add a heading (H1), a paragraph, and a button. This will create the basic layout of your website.
                  </p>
                </section>

                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#834fff] text-white flex items-center justify-center text-sm">3</span>
                    Add CSS Styling
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Open <code>style.css</code> and add styles like background color, font style, and button styling. This will make your website look clean and attractive.
                  </p>
                </section>

                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#834fff] text-white flex items-center justify-center text-sm">4</span>
                    Add JavaScript
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Open <code>script.js</code> and add a simple function like showing a message on button click or an alert popup. This makes your website interactive.
                  </p>
                </section>

                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#834fff] text-white flex items-center justify-center text-sm">5</span>
                    Make Website Mobile Friendly
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    Ensure your website works on mobile by using proper spacing, avoiding large text overflow, and using responsive design.
                  </p>
                </section>

                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-xl flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#834fff] text-white flex items-center justify-center text-sm">6</span>
                    Publish Your Website
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    You can make your website live using free platforms like <strong>GitHub Pages</strong> or <strong>Netlify</strong>. Upload your files and your website will be online.
                  </p>
                </section>

                <section className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-green-50 dark:bg-green-500/10 rounded-3xl border border-green-100 dark:border-green-500/20">
                    <h4 className="font-headline font-bold text-lg text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                      <span className="material-icons-round">lightbulb</span>
                      Quick Tips
                    </h4>
                    <ul className="text-xs text-green-700 dark:text-green-300 space-y-2">
                      <li>• Keep your design simple</li>
                      <li>• Use clear text and colors</li>
                      <li>• Always test your website</li>
                      <li>• Save files correctly</li>
                    </ul>
                  </div>
                  <div className="p-6 bg-amber-50 dark:bg-amber-500/10 rounded-3xl border border-amber-100 dark:border-amber-500/20">
                    <h4 className="font-headline font-bold text-lg text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                      <span className="material-icons-round">warning</span>
                      Common Mistakes
                    </h4>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-2">
                      <li>• Not linking CSS or JS files</li>
                      <li>• Wrong file names</li>
                      <li>• Not checking mobile view</li>
                      <li>• Using too much complex code</li>
                    </ul>
                  </div>
                </section>

                <div className="bg-[#834fff] rounded-[24px] p-8 text-white space-y-6 shadow-xl shadow-[#834fff]/30">
                  <div className="space-y-2">
                    <h3 className="font-headline font-bold text-xl">💬 Need Help?</h3>
                    <p className="text-white/80 text-xs">If you are facing any problem, we are here to help you. You can contact us anytime.</p>
                  </div>
                  <div className="grid gap-3">
                    <a href="https://wa.me/919203251821?text=I%20need%20help%20for%20making%20HTML%20CSS%20website" className="flex items-center justify-center gap-2 bg-white text-[#834fff] font-bold py-4 rounded-2xl active:scale-95 transition-all text-sm">
                      <span className="material-icons-round text-lg">chat</span>
                      WhatsApp Support
                    </a>
                    <a href="mailto:sanjayvaishya.dev@gmail.com?subject=Help%20with%20HTML/CSS%20Website&body=Hello%20Sanjay,%20I%20need%20help%20for%20making%20HTML%20CSS%20website." className="flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 font-bold py-4 rounded-2xl active:scale-95 transition-all text-sm">
                      <span className="material-icons-round text-lg">email</span>
                      Email Support
                    </a>
                    <a href="tel:+919203251821" className="flex items-center justify-center gap-2 bg-white/10 text-white border border-white/20 font-bold py-4 rounded-2xl active:scale-95 transition-all text-sm">
                      <span className="material-icons-round text-lg">call</span>
                      Call Support
                    </a>
                  </div>
                </div>

                <div className="text-center space-y-4 pt-4">
                  <p className="text-lg font-headline font-bold text-gray-800 dark:text-gray-200">🚀 Conclusion</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Building a website is easier than you think. Start step by step and keep practicing. Start today and create your first website!</p>
                  <button 
                    onClick={() => window.open('/blog-website-guide.html', '_blank')}
                    className="inline-flex items-center gap-2 text-[#834fff] font-bold hover:underline mt-4"
                  >
                    Open Full Guide in New Tab
                    <span className="material-icons-round text-sm">open_in_new</span>
                  </button>
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-[32px] p-8 shadow-2xl border border-gray-200 dark:border-white/10"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto mb-6">
                <span className="material-icons-round text-3xl">warning</span>
              </div>
              <h3 className="font-headline font-extrabold text-xl text-center mb-4">Delete Data Request?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-8 leading-relaxed">
                Are you sure you want to request data deletion? This will take you to our interactive request page.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    navigateTo('delete-data');
                  }}
                  className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-500/30 active:scale-95 transition-all"
                >
                  Yes, Continue
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold py-4 rounded-2xl active:scale-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CookieConsent onViewPolicy={() => navigateTo('cookie-policy')} />

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
