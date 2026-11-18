import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Users,
  Code2,
  ExternalLink,
  MessageSquare,
  Mail,
  Phone,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ResilientImage from '../../components/ResilientImage';
import { ArchitectureDiagram, PerformanceBenchmarkChart } from '../../components/PerformanceVisuals';
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

  const workflowStages = [
    { step: '01', title: 'Discovery & Inquiry', desc: 'Capture scope, required features, budget range, and timeline.' },
    { step: '02', title: 'Proposal & Milestones', desc: 'Structured quotation with feature breakdown and payment schedule.' },
    { step: '03', title: 'Collaborative Engineering', desc: 'Assigned developers and designers execute milestone tasks.' },
    { step: '04', title: 'QA Review & Client Feedback', desc: 'Deliverables tested, uploaded privately, and approved per milestone.' },
    { step: '05', title: 'Deployment & Support', desc: 'Production launch, documentation, and post-delivery maintenance.' },
  ];

  const pillars = [
    { title: 'Direct Communication', desc: 'Project-scoped chat channels connecting you directly with the engineering lead and assigned team.' },
    { title: 'Collaborative Development', desc: 'Frontend, backend, UI/UX, and QA specialists coordinated under one unified team workflow.' },
    { title: 'Structured Project Management', desc: 'Every project runs through clear milestones, assigned tasks, and verifiable deliverables.' },
    { title: 'Transparent Progress', desc: 'Live milestone completion tracking—never arbitrary or inflated progress numbers.' },
  ];

  const isStaff = Boolean(user?.roles.some((r) => ['admin', 'project_manager'].includes(r)));

  return (
    <div className="space-y-8 md:space-y-12">
      {/* 1. Compact App Welcome / Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch">
        <div className="lg:col-span-6 bg-[#13161D] border border-[#262B38] rounded-lg p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div className="space-y-3">
            <p className="font-mono text-[11px] text-[#00BFFF]">
              SANJAY VAISHYA · Founder-Led Full-Stack Development Team
            </p>
            <h1 className="text-[clamp(1.65rem,3.6vw,2.75rem)] font-bold leading-[1.12] tracking-tight text-white">
              Building Digital Products. Managing Ideas. Delivering Results.
            </h1>
            <p className="text-sm text-[#CCCCCC] leading-relaxed">
              From business websites to custom software and mobile apps, our collaborative engineering team handles architecture, design, milestone tracking, and production delivery.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => onNavigate('/start-project')}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 whitespace-nowrap"
              >
                Start a Project
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate(user ? (isStaff ? '/admin' : '/dashboard') : '/work')}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1A1E28] border border-[#2B3140] hover:border-[#00BFFF] text-[#F4F6F9] text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                {user ? (isStaff ? 'Open Admin Center' : 'Open Client Portal') : 'Explore Our Work'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-2 border-t border-[#262B38]">
            {[
              { code: '01. Build', label: 'Web & Mobile Apps' },
              { code: '02. Systems', label: 'CRM, ERP & SaaS' },
              { code: '03. Track', label: 'Live Client Portal' },
              { code: '04. Ship', label: 'DevOps & Support' },
            ].map((item) => (
              <div key={item.code} className="p-2.5 bg-[#0B0D11] border border-[#262B38] rounded-lg">
                <span className="font-mono text-[11px] text-[#00BFFF] block">{item.code}</span>
                <span className="text-[11px] text-[#CCCCCC]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#13161D] border border-[#262B38] rounded-lg overflow-hidden flex flex-col justify-between">
          <div className="relative min-h-[190px] sm:min-h-[240px] flex-1">
            <ResilientImage
              src={heroHpcImg}
              alt="High-Performance Computing and Software Development Infrastructure"
              className="w-full h-full lg:absolute lg:inset-0 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D11]/90 via-transparent to-transparent" />
          </div>
          <div className="p-4 sm:p-5 border-t border-[#262B38] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[#C0C0C0] block text-[11px]">Engineering Statement</span>
              <span className="font-semibold text-white">We Design, Develop &amp; Deliver Digital Solutions.</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/services')}
              className="font-mono text-[#00BFFF] hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              {services.length} Core Disciplines
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Quick Start-a-Project Strip */}
      <section className="bg-[#1A1E28] border border-[#2B3140] rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[11px] text-[#ED1C24]">STRUCTURED PROJECT INTAKE</p>
          <p className="text-sm sm:text-base font-bold text-white">
            Have an idea or software requirement? Submit a project brief directly to our team.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('/start-project')}
          className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 shrink-0"
        >
          Submit Requirements
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>

      {/* 3. Services Preview */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#262B38]">
          <div>
            <p className="font-mono text-[11px] text-[#00BFFF] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              ENGINEERING CAPABILITIES
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Development Services</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/services')}
            className="min-h-[40px] px-3 rounded-lg bg-[#13161D] border border-[#262B38] text-xs font-medium text-[#00BFFF] hover:border-[#00BFFF] inline-flex items-center gap-1.5"
          >
            All Services
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.slice(0, 6).map((svc, idx) => (
            <div
              key={svc.id}
              className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-[#00BFFF]">0{idx + 1}. {svc.category}</span>
                  <Code2 className="w-4 h-4 text-[#C0C0C0]" />
                </div>
                <h3 className="text-base font-bold text-white">{svc.title}</h3>
                <p className="text-xs text-[#CCCCCC] leading-relaxed">{svc.summary}</p>
              </div>
              <div className="pt-3 border-t border-[#262B38] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('/services')}
                  className="text-xs text-[#CCCCCC] hover:text-white min-h-[36px]"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => onSelectServiceQuote(svc.category)}
                  className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#1A1E28] border border-[#2B3140] hover:border-[#ED1C24] text-xs font-semibold text-white inline-flex items-center gap-1.5"
                >
                  Request Quote
                  <ArrowRight className="w-3.5 h-3.5 text-[#ED1C24]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Selected Work Preview */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#262B38]">
          <div>
            <p className="font-mono text-[11px] text-[#00BFFF]">VERIFIED IMPLEMENTATIONS</p>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Selected Work</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/work')}
            className="min-h-[40px] px-3 rounded-lg bg-[#13161D] border border-[#262B38] text-xs font-medium text-[#00BFFF] hover:border-[#00BFFF] inline-flex items-center gap-1.5"
          >
            Full Portfolio
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
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <p className="font-mono text-[11px] text-[#00BFFF]">{project.category}</p>
                  <h3 className="text-lg font-bold text-white">{project.title}</h3>
                  <p className="text-xs text-[#CCCCCC] leading-relaxed">{project.summary}</p>
                </div>
                <div className="pt-3 border-t border-[#262B38] flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenProjectDetail(project.slug)}
                    className="min-h-[36px] text-xs font-semibold text-[#00BFFF] hover:underline inline-flex items-center gap-1.5"
                  >
                    Case Details
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

      {/* 5. Development Process & Engineering Visuals */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-5 bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
          <div>
            <span className="font-mono text-[11px] text-[#ED1C24]">EXECUTION WORKFLOW</span>
            <h2 className="text-xl font-bold text-white mt-0.5">Development Process</h2>
          </div>
          <div className="space-y-2.5">
            {workflowStages.map((stage) => (
              <div key={stage.step} className="p-3 bg-[#0B0D11] border border-[#262B38] rounded-lg flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-[#00BFFF] tabular-nums mt-0.5">{stage.step}.</span>
                <div>
                  <h3 className="text-xs font-bold text-white">{stage.title}</h3>
                  <p className="text-xs text-[#CCCCCC] mt-0.5">{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-7 space-y-4">
          <ArchitectureDiagram />
          <PerformanceBenchmarkChart />
        </div>
      </section>

      {/* 6. Founder & Team + Operational Standards */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#262B38] shrink-0 bg-[#0B0D11]">
              <ResilientImage
                src={founder?.avatarUrl || codeEngineeringImg}
                fallbackSrc={codeEngineeringImg}
                alt="Sanjay Vaishya"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-mono text-[11px] text-[#ED1C24]">FOUNDER &amp; TEAM</p>
              <h2 className="text-lg font-bold text-white">{founder?.name || 'Sanjay Vaishya'}</h2>
              <p className="text-xs text-[#00BFFF]">
                {founder?.designation || 'Founder & Lead Full-Stack Developer'}
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#CCCCCC] leading-relaxed">
            An independent, founder-led full-stack development team delivering complete digital solutions across{' '}
            {teamOthers.length > 0 ? `${teamOthers.length + 1} verified team profiles` : 'specialized frontend, backend, Android, UI/UX, and DevOps roles'}.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('/team')}
              className="min-h-[42px] px-4 py-2 rounded-lg bg-[#1A1E28] border border-[#2B3140] hover:border-[#00BFFF] text-xs font-semibold text-white inline-flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-[#00BFFF]" />
              Meet the Team
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/about')}
              className="min-h-[42px] px-4 py-2 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs font-medium text-[#CCCCCC]"
            >
              About Practice
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pillars.map((pillar, i) => (
            <div key={pillar.title} className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#1A1E28] border border-[#2B3140] flex items-center justify-center text-[#00BFFF]">
                {i % 2 === 0 ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4 text-[#00CC66]" />}
              </div>
              <h3 className="text-sm font-bold text-white">{pillar.title}</h3>
              <p className="text-xs text-[#CCCCCC] leading-relaxed">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">Verified Client Reviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-[#13161D] border border-[#262B38] rounded-lg p-4 space-y-2">
                <p className="text-xs sm:text-sm text-[#CCCCCC]">"{rev.comment}"</p>
                <p className="font-mono text-[11px] text-[#00BFFF]">
                  {rev.author_name} · {rev.author_role} ({rev.rating}/5)
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Compact Contact Strip (Replaces bloated multi-column footer) */}
      <section className="bg-[#13161D] border border-[#262B38] rounded-lg p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] text-[#00BFFF]">DIRECT CONTACT</p>
            <h2 className="text-lg font-bold text-white">Connect with Sanjay Vaishya Team</h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#1A1E28] border border-[#2B3140] hover:border-[#00BFFF] text-xs font-semibold text-white inline-flex items-center gap-1.5"
          >
            Contact Page
            <ArrowRight className="w-3.5 h-3.5 text-[#00BFFF]" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <a
            href={`mailto:${settings.contact_email || 'sanjayvaishya.dev@gmail.com'}`}
            className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#262B38] hover:border-[#00BFFF] flex items-center gap-2.5 text-[#CCCCCC] hover:text-white truncate"
          >
            <Mail className="w-4 h-4 text-[#ED1C24] shrink-0" />
            <span className="truncate">{settings.contact_email || 'sanjayvaishya.dev@gmail.com'}</span>
          </a>
          <a
            href="https://wa.me/919203251821"
            target="_blank"
            rel="noreferrer"
            className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#262B38] hover:border-[#00CC66] flex items-center gap-2.5 text-[#CCCCCC] hover:text-white"
          >
            <MessageSquare className="w-4 h-4 text-[#00CC66] shrink-0" />
            <span>WhatsApp Team Lead</span>
          </a>
          <a
            href={`tel:${(settings.contact_phone || '+91 9203251821').replace(/\s+/g, '')}`}
            className="min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0B0D11] border border-[#262B38] hover:border-[#00BFFF] flex items-center gap-2.5 text-[#CCCCCC] hover:text-white tabular-nums"
          >
            <Phone className="w-4 h-4 text-[#00BFFF] shrink-0" />
            <span>{settings.contact_phone || '+91 9203251821'}</span>
          </a>
        </div>
      </section>
    </div>
  );
}
