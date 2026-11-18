import React, { useState } from 'react';
import {
  ArrowRight,
  Users,
  Phone,
  MessageSquare,
  Mail,
  Globe,
  MapPin,
  ExternalLink,
  Search,
  SearchX,
  Share2,
  Rss,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ResilientImage from '../components/ResilientImage';
import { ArchitectureDiagram } from '../components/PerformanceVisuals';
import codeEngineeringImg from '../assets/images/code_engineering_rig_1795003574967.jpg';
import archDeploymentImg from '../assets/images/arch_deployment_node_1795003574111.jpg';
import communityHubImg from '../assets/images/community_digital_hub_1795003575522.jpg';

export function ProcessPage({ onStartProject }: { onStartProject: () => void }) {
  const phases = [
    {
      num: '01',
      title: 'Requirement Intake & Discovery',
      detail: 'Clients submit project goals, feature checklists, reference links, and attachments through our structured intake workflow.',
    },
    {
      num: '02',
      title: 'Architecture & Formal Quotation',
      detail: 'Sanjay Vaishya and team evaluate scope, break down cost and milestones, and issue a transparent proposal for client approval.',
    },
    {
      num: '03',
      title: 'Sprint Execution & Task Assignment',
      detail: 'Project managers assign milestones and engineering tasks across frontend, backend, UI/UX, and database specialists.',
    },
    {
      num: '04',
      title: 'Deliverable Review & Approval',
      detail: 'Completed builds and artifacts are uploaded privately per milestone for client feedback and sign-off.',
    },
    {
      num: '05',
      title: 'Production Deployment & Ongoing Support',
      detail: 'Code is deployed with HTTPS, SEO verification, and post-delivery maintenance coverage.',
    },
  ];

  return (
    <div className="space-y-10">
      <div className="pb-6 border-b border-[#262B38] flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-xs text-[#00BFFF]">Engineering Methodology</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Development Process</h1>
        </div>
        <button
          type="button"
          onClick={onStartProject}
          className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center gap-2"
        >
          Start a Project
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <ArchitectureDiagram />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {phases.map((p) => (
          <div key={p.num} className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 space-y-2">
            <span className="font-mono text-xs font-bold text-[#00BFFF] tabular-nums">{p.num}.</span>
            <h2 className="text-lg font-bold text-white">{p.title}</h2>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">{p.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamPage({ onStartProject }: { onStartProject: () => void }) {
  const { team } = useAuth();
  const roleCategories = [
    'Frontend Developer',
    'Backend Developer',
    'Full-Stack Developer',
    'Android Developer',
    'UI/UX Designer',
    'Database Developer',
    'QA Tester',
    'Project Manager',
    'DevOps Engineer',
  ];

  return (
    <div className="space-y-10">
      <div className="pb-6 border-b border-[#262B38] flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-xs text-[#00BFFF]">Founder-Led Collective</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Our Development Team</h1>
          <p className="text-sm text-[#CCCCCC] max-w-[65ch]">
            Projects are led by Sanjay Vaishya and executed collaboratively through verified specialist profiles managed in our platform.
          </p>
        </div>
        <button
          type="button"
          onClick={onStartProject}
          className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center gap-2"
        >
          Work With Our Team
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        {team.map((member) => (
          <article
            key={member.id}
            className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            <div className="lg:col-span-4 aspect-[4/3] rounded-lg overflow-hidden border border-[#262B38] bg-[#0B0D11]">
              <ResilientImage
                src={member.avatarUrl || codeEngineeringImg}
                fallbackSrc={codeEngineeringImg}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="lg:col-span-8 space-y-5">
              <div>
                <p className="font-mono text-xs text-[#ED1C24] mb-1">
                  {member.isFounder ? 'Founder & Engineering Lead' : member.roleCategory}
                </p>
                <h2 className="text-2xl font-bold text-white">{member.name}</h2>
                <p className="text-sm font-medium text-[#00BFFF] mt-0.5">{member.designation}</p>
              </div>

              <p className="text-sm text-[#CCCCCC] leading-relaxed max-w-[70ch]">{member.bio}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <h3 className="text-xs font-mono text-[#C0C0C0]">Responsibilities</h3>
                  <ul className="space-y-1.5">
                    {member.responsibilities.map((resp) => (
                      <li key={resp} className="text-xs text-[#CCCCCC] flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00CC66] shrink-0" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-mono text-[#C0C0C0]">Technical Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-[#1A1E28] border border-[#262B38] rounded-md font-mono text-xs text-[#F4F6F9]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Team Role Categories */}
      <section className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-[#00BFFF]" />
          <h2 className="text-lg font-bold text-white">Team Discipline Categories</h2>
        </div>
        <p className="text-sm text-[#CCCCCC] max-w-[72ch]">
          Depending on project scope, tasks inside our workspace are assigned across the following specialist roles (verified individual profiles are added and managed directly by the Founder/Admin):
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          {roleCategories.map((role) => (
            <div
              key={role}
              className="px-3.5 py-2.5 bg-[#1A1E28] border border-[#262B38] rounded-lg font-mono text-xs text-[#F4F6F9]"
            >
              {role}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function ContactPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { settings } = useAuth();
  const email = settings.contact_email || 'sanjayvaishya.dev@gmail.com';
  const phone = settings.contact_phone || '+91 9203251821';
  const address = settings.office_address || 'Jobgarh, Singrauli, Madhya Pradesh, India (486886)';

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-[#262B38] flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-xs text-[#00BFFF]">Direct Communication Channels</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Contact Sanjay Vaishya</h1>
          <p className="text-sm text-[#CCCCCC]">
            Reach our development team by Email, WhatsApp, or Phone—or submit a full project brief directly.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('/start-project')}
          className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center gap-2"
        >
          Submit Project Requirements
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href={`mailto:${email}`}
            className="bg-[#13161D] border border-[#262B38] hover:border-[#00BFFF] rounded-lg p-5 space-y-3 transition-colors"
          >
            <Mail className="w-5 h-5 text-[#ED1C24]" />
            <div>
              <p className="font-mono text-xs text-[#C0C0C0]">Send Mail</p>
              <p className="text-sm font-medium text-white break-all mt-1">{email}</p>
            </div>
          </a>

          <a
            href="https://wa.me/919203251821"
            target="_blank"
            rel="noreferrer"
            className="bg-[#13161D] border border-[#262B38] hover:border-[#00CC66] rounded-lg p-5 space-y-3 transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-[#00CC66]" />
            <div>
              <p className="font-mono text-xs text-[#C0C0C0]">WhatsApp Business</p>
              <p className="text-sm font-medium text-white mt-1">Chat with Team Lead</p>
            </div>
          </a>

          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="bg-[#13161D] border border-[#262B38] hover:border-[#00BFFF] rounded-lg p-5 space-y-3 transition-colors"
          >
            <Phone className="w-5 h-5 text-[#00BFFF]" />
            <div>
              <p className="font-mono text-xs text-[#C0C0C0]">Phone</p>
              <p className="text-sm font-medium text-white tabular-nums mt-1">{phone}</p>
            </div>
          </a>

          <a
            href="https://sanjay.indiacybercafe.com"
            target="_blank"
            rel="noreferrer"
            className="bg-[#13161D] border border-[#262B38] hover:border-[#00BFFF] rounded-lg p-5 space-y-3 transition-colors"
          >
            <Globe className="w-5 h-5 text-[#00BFFF]" />
            <div>
              <p className="font-mono text-xs text-[#C0C0C0]">Official Web Portal</p>
              <p className="text-sm font-medium text-white mt-1">sanjay.indiacybercafe.com</p>
            </div>
          </a>
        </div>

        <div className="lg:col-span-6 bg-[#13161D] border border-[#262B38] rounded-lg overflow-hidden flex flex-col">
          <div className="h-52">
            <ResilientImage
              src={communityHubImg}
              alt="Sanjay Vaishya Development Hub in Singrauli"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 space-y-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#ED1C24]" />
              Development Office &amp; Hub
            </h2>
            <p className="font-mono text-xs text-[#00BFFF]">{address}</p>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              Available for project consultations, technical audits, and digital infrastructure support online and in person.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UpdatesPage({ onOpenGuide }: { onOpenGuide: (slug: string) => void }) {
  const { blogPosts, showToast, settings } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(blogPosts.map((p) => p.category)))];

  const filtered = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handlePostShare = async (post: { slug: string; title: string; summary: string; image_url: string }) => {
    const shareUrl = `${window.location.origin}/#${post.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `${post.summary}\n${post.image_url}`,
          url: shareUrl,
        });
      } catch {
        // Cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${post.title} — ${shareUrl}`);
        showToast('Post link and title copied to clipboard.');
      } catch {
        showToast('Unable to copy link.', 'error');
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-[#262B38] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-xs text-[#00BFFF]">Engineering Guides &amp; Dispatches</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Updates &amp; Technical Guides</h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#C0C0C0] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-[#13161D] border border-[#2B3140] rounded-lg text-sm text-white placeholder-[#7A8294] focus:outline-none focus:ring-2 focus:ring-[#00BFFF]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#13161D] border border-[#262B38] rounded-lg overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#1A1E28] text-[#00BFFF] border border-[#00BFFF]/40'
                    : 'text-[#CCCCCC] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((post, idx) => (
            <article
              key={post.id}
              className="bg-[#13161D] border border-[#262B38] rounded-lg overflow-hidden flex flex-col justify-between"
            >
              <div className="aspect-[16/9] bg-[#0B0D11] overflow-hidden">
                <ResilientImage
                  src={post.image_url || (idx % 2 === 0 ? archDeploymentImg : codeEngineeringImg)}
                  fallbackSrc={idx % 2 === 0 ? archDeploymentImg : codeEngineeringImg}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-[#00BFFF]">
                    <span>{post.category}</span>
                    <span>·</span>
                    <span className="text-[#C0C0C0]">{post.tag}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white leading-snug">{post.title}</h2>
                  <p className="text-sm text-[#CCCCCC] leading-relaxed">{post.summary}</p>
                </div>

                <div className="pt-4 border-t border-[#262B38] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenGuide(post.slug)}
                    className="text-xs font-semibold text-[#00BFFF] hover:underline inline-flex items-center gap-1.5"
                  >
                    Read Full Guide
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePostShare(post)}
                    className="px-3 py-1.5 rounded-lg bg-[#1A1E28] border border-[#2B3140] hover:border-[#00BFFF] text-xs font-medium text-white inline-flex items-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#00BFFF]" />
                    Share
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-12 text-center space-y-3">
          <SearchX className="w-8 h-8 text-[#C0C0C0] mx-auto" />
          <p className="text-sm text-[#CCCCCC]">No guides matched your search.</p>
        </div>
      )}

      <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#1A1E28] border border-[#262B38] flex items-center justify-center text-[#00BFFF] shrink-0">
            <Rss className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">External Updates Archive</h3>
            <p className="text-xs text-[#CCCCCC]">
              Browse full updates and community stories published on our web portal.
            </p>
          </div>
        </div>
        <a
          href={settings.updates_external_url || 'https://sanjay.indiacybercafe.com/updates.html'}
          target="_blank"
          rel="noreferrer"
          className="px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          View All Updates
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
