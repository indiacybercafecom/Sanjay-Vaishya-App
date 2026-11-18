import React from 'react';
import {
  ArrowRight,
  Users,
  Code2,
  ExternalLink,
  MessageSquare,
  Mail,
  Phone,
  Layers,
  GitBranch,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ResilientImage from '../../components/ResilientImage';
import heroHpcImg from '../../assets/images/hero_hpc_server_1795003573637.jpg';
import archDeploymentImg from '../../assets/images/arch_deployment_node_1795003574111.jpg';
import codeEngineeringImg from '../../assets/images/code_engineering_rig_1795003574967.jpg';
import communityHubImg from '../../assets/images/community_digital_hub_1795003575522.jpg';

interface HomeScreenProps {
  onNavigate: (path: string) => void;
  onSelectServiceQuote: (category: string) => void;
  onOpenProjectDetail: (slug: string) => void;
}

export function HomeScreen({ onNavigate, onSelectServiceQuote, onOpenProjectDetail }: HomeScreenProps) {
  const { user, services, portfolio, team, reviews, settings } = useAuth();
  const founder = team.find((m) => m.isFounder) || team[0];
  const teamOthers = team.filter((m) => !m.isFounder);
  const isStaff = Boolean(user?.roles.some((r) => ['admin', 'project_manager'].includes(r)));

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 1. Welcome Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
        <div className="lg:col-span-7 bg-[#13161D] border border-[#262B38] rounded-lg p-4 sm:p-6 flex flex-col justify-between gap-4">
          <div className="space-y-2.5">
            <p className="font-mono text-[11px] text-[#00BFFF]">
              SANJAY VAISHYA · Founder-Led Full-Stack Development Team
            </p>
            <h1 className="text-[clamp(1.5rem,3.4vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-white">
              We Design, Develop &amp; Deliver Complete Digital Solutions.
            </h1>
            <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed max-w-[65ch]">
              Custom websites, Android applications, enterprise software systems, UI/UX design, and DevOps—delivered by a collaborative engineering team with live milestone tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => onNavigate('/start-project')}
              className="min-h-[44px] px-4 sm:px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              Start a Project
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate(user ? (isStaff ? '/admin' : '/dashboard') : '/work')}
              className="min-h-[44px] px-4 sm:px-5 py-2.5 rounded-lg bg-[#1A1E28] border border-[#2B3140] hover:border-[#00BFFF] text-[#F4F6F9] text-xs sm:text-sm font-medium whitespace-nowrap shrink-0"
            >
              {user ? (isStaff ? 'Open Admin Center' : 'Open Workspace') : 'Explore Our Work'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#13161D] border border-[#262B38] rounded-lg overflow-hidden flex flex-col">
          <div className="relative min-h-[168px] sm:min-h-[210px] flex-1">
            <ResilientImage
              src={heroHpcImg}
              alt="High-Performance Computing and Software Development Infrastructure"
              className="w-full h-full lg:absolute lg:inset-0 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D11]/90 via-transparent to-transparent" />
          </div>
          <div className="px-4 py-3 border-t border-[#262B38] flex items-center justify-between gap-3 text-xs">
            <span className="text-[#CCCCCC] truncate">Structured Milestones · Real-Time Chat</span>
            <button
              type="button"
              onClick={() => onNavigate('/process')}
              className="font-mono text-[#00BFFF] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
            >
              <GitBranch className="w-3.5 h-3.5" />
              Process
            </button>
          </div>
        </div>
      </section>

      {/* 2. Start a Project */}
      <section className="bg-[#1A1E28] border border-[#2B3140] rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
        <div className="space-y-1 min-w-0">
          <p className="font-mono text-[11px] text-[#ED1C24]">PROJECT INTAKE</p>
          <p className="text-sm sm:text-base font-bold text-white">
            Have software requirements ready? Submit a brief for scope review &amp; quotation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/start-project')}
          className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          Submit Requirements
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* 3. Services */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-[#262B38]">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 shrink-0" />
              CAPABILITIES
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-white">Development Services</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/services')}
            className="min-h-[40px] px-3 rounded-lg bg-[#13161D] border border-[#262B38] text-xs font-medium text-[#00BFFF] hover:border-[#00BFFF] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            View All ({services.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {services.slice(0, 6).map((svc, idx) => (
            <div
              key={svc.id}
              className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-[#00BFFF] truncate">
                    0{idx + 1}. {svc.category}
                  </span>
                  <Code2 className="w-4 h-4 text-[#C0C0C0] shrink-0" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">{svc.title}</h3>
                <p className="text-xs text-[#CCCCCC] leading-relaxed line-clamp-2">{svc.summary}</p>
              </div>
              <div className="pt-2.5 border-t border-[#262B38] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/services')}
                  className="min-h-[36px] text-xs text-[#CCCCCC] hover:text-white"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => onSelectServiceQuote(svc.category)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#1A1E28] border border-[#2B3140] hover:border-[#ED1C24] text-xs font-semibold text-white inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  Request Quote
                  <ArrowRight className="w-3.5 h-3.5 text-[#ED1C24]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Recent / Selected Work */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-[#262B38]">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-[#00BFFF]">PORTFOLIO</p>
            <h2 className="text-lg sm:text-xl font-bold text-white">Selected Work</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/work')}
            className="min-h-[40px] px-3 rounded-lg bg-[#13161D] border border-[#262B38] text-xs font-medium text-[#00BFFF] hover:border-[#00BFFF] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            All Work
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {portfolio.map((project, idx) => (
            <article
              key={project.id}
              className="bg-[#13161D] border border-[#262B38] rounded-lg overflow-hidden flex flex-col justify-between"
            >
              <div className="aspect-[16/9] bg-[#0B0D11] overflow-hidden">
                <ResilientImage
                  src={project.screenshots[0] || (idx % 2 === 0 ? archDeploymentImg : communityHubImg)}
                  fallbackSrc={idx % 2 === 0 ? archDeploymentImg : communityHubImg}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <p className="font-mono text-[11px] text-[#00BFFF]">{project.category}</p>
                  <h3 className="text-base sm:text-lg font-bold text-white">{project.title}</h3>
                  <p className="text-xs text-[#CCCCCC] leading-relaxed">{project.summary}</p>
                </div>
                <div className="pt-2.5 border-t border-[#262B38] flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenProjectDetail(project.slug)}
                    className="min-h-[36px] text-xs font-semibold text-[#00BFFF] hover:underline inline-flex items-center gap-1.5"
                  >
                    Case Study
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  {project.live_url && (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#CCCCCC] hover:text-white inline-flex items-center gap-1"
                    >
                      Live Site
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 5. Development Team (+ Verified Reviews if present) */}
      <section className="space-y-4">
        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#262B38] shrink-0 bg-[#0B0D11]">
              <ResilientImage
                src={founder?.avatarUrl || codeEngineeringImg}
                fallbackSrc={codeEngineeringImg}
                alt="Sanjay Vaishya"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="font-mono text-[11px] text-[#ED1C24]">DEVELOPMENT TEAM</p>
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                {founder?.name || 'Sanjay Vaishya'}
              </h2>
              <p className="text-xs text-[#00BFFF] truncate">
                {founder?.designation || 'Founder & Lead Full-Stack Developer'}
              </p>
              <p className="text-xs text-[#CCCCCC] pt-0.5">
                Collaborative engineering across{' '}
                {teamOthers.length > 0
                  ? `${teamOthers.length + 1} verified team profiles`
                  : 'frontend, backend, mobile, UI/UX, and QA specialists'}
                .
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('/team')}
              className="min-h-[42px] px-4 py-2 rounded-lg bg-[#1A1E28] border border-[#2B3140] hover:border-[#00BFFF] text-xs font-semibold text-white inline-flex items-center gap-2 whitespace-nowrap"
            >
              <Users className="w-4 h-4 text-[#00BFFF]" />
              Meet the Team
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/about')}
              className="min-h-[42px] px-4 py-2 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs font-medium text-[#CCCCCC] whitespace-nowrap"
            >
              About Practice
            </button>
          </div>
        </div>

        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 space-y-1.5">
                <p className="text-xs sm:text-sm text-[#CCCCCC]">"{rev.comment}"</p>
                <p className="font-mono text-[11px] text-[#00BFFF]">
                  {rev.author_name} · {rev.author_role} ({rev.rating}/5)
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Contact */}
      <section className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] text-[#00BFFF]">CONTACT</p>
            <h2 className="text-base sm:text-lg font-bold text-white">Connect with Sanjay Vaishya Team</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[#1A1E28] border border-[#2B3140] hover:border-[#00BFFF] text-xs font-semibold text-white inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            Contact Page
            <ArrowRight className="w-3.5 h-3.5 text-[#00BFFF]" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <a
            href={`mailto:${settings.contact_email || 'sanjayvaishya.dev@gmail.com'}`}
            className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#262B38] hover:border-[#00BFFF] flex items-center gap-2.5 text-[#CCCCCC] hover:text-white min-w-0"
          >
            <Mail className="w-4 h-4 text-[#ED1C24] shrink-0" />
            <span className="truncate">{settings.contact_email || 'sanjayvaishya.dev@gmail.com'}</span>
          </a>
          <a
            href="https://wa.me/919203251821"
            target="_blank"
            rel="noreferrer"
            className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#262B38] hover:border-[#00CC66] flex items-center gap-2.5 text-[#CCCCCC] hover:text-white min-w-0"
          >
            <MessageSquare className="w-4 h-4 text-[#00CC66] shrink-0" />
            <span className="truncate">WhatsApp Team Lead</span>
          </a>
          <a
            href={`tel:${(settings.contact_phone || '+91 9203251821').replace(/\s+/g, '')}`}
            className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#262B38] hover:border-[#00BFFF] flex items-center gap-2.5 text-[#CCCCCC] hover:text-white tabular-nums min-w-0"
          >
            <Phone className="w-4 h-4 text-[#00BFFF] shrink-0" />
            <span className="truncate">{settings.contact_phone || '+91 9203251821'}</span>
          </a>
        </div>
      </section>
    </div>
  );
}
