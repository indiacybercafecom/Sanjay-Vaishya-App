import React, { useState } from 'react';
import { Search, SearchX, ArrowLeft, ExternalLink, Code2, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ResilientImage from '../components/ResilientImage';
import archDeploymentImg from '../assets/images/arch_deployment_node_1795003574111.jpg';
import communityHubImg from '../assets/images/community_digital_hub_1795003575522.jpg';

interface PortfolioPageProps {
  selectedSlug: string | null;
  onSelectSlug: (slug: string | null) => void;
  onStartProject: () => void;
}

export default function PortfolioPage({ selectedSlug, onSelectSlug, onStartProject }: PortfolioPageProps) {
  const { portfolio } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(portfolio.map((p) => p.category)))];

  const activeProject = selectedSlug ? portfolio.find((p) => p.slug === selectedSlug) : null;

  if (selectedSlug && portfolio.length > 0 && !activeProject) {
    return (
      <div className="max-w-xl mx-auto bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-8 space-y-4">
        <p className="font-mono text-xs text-[#ED1C24]">CASE STUDY NOT FOUND</p>
        <h1 className="text-xl md:text-2xl font-bold text-white">Requested Portfolio Entry Unavailable</h1>
        <p className="text-sm text-[#CCCCCC] leading-relaxed">
          No published project matches <span className="font-mono text-[#00BFFF]">{selectedSlug}</span>. Explore our verified builds or start a custom project brief.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => onSelectSlug(null)}
            className="min-h-[42px] px-4 py-2 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse All Projects
          </button>
          <button
            type="button"
            onClick={onStartProject}
            className="min-h-[42px] px-4 py-2 rounded-lg border border-[#2B3140] hover:border-[#00BFFF] text-xs font-medium text-white inline-flex items-center gap-2"
          >
            Start a Project
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (activeProject) {
    return (
      <div className="space-y-8">
        <div className="pb-6 border-b border-[#262B38] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onSelectSlug(null)}
              className="px-3.5 py-2 rounded-lg bg-[#13161D] border border-[#2B3140] text-xs font-medium text-[#CCCCCC] hover:text-white hover:border-[#00BFFF] inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              All Work
            </button>
            <div>
              <p className="font-mono text-xs text-[#00BFFF]">{activeProject.category}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{activeProject.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeProject.live_url && (
              <a
                href={activeProject.live_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg bg-[#1A1E28] border border-[#2B3140] hover:border-[#00BFFF] text-xs font-medium text-white inline-flex items-center gap-1.5"
              >
                Visit Live Project
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {activeProject.github_url && (
              <a
                href={activeProject.github_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-lg border border-[#333333] hover:border-[#00BFFF] text-xs font-medium text-[#CCCCCC] hover:text-white inline-flex items-center gap-1.5"
              >
                <Code2 className="w-3.5 h-3.5" />
                Source Repository
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#13161D] border border-[#262B38] rounded-lg overflow-hidden aspect-[16/9]">
              <ResilientImage
                src={activeProject.screenshots[0] || archDeploymentImg}
                fallbackSrc={archDeploymentImg}
                alt={activeProject.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 space-y-3">
              <h2 className="text-lg font-bold text-white">Overview</h2>
              <p className="text-sm text-[#CCCCCC] leading-relaxed">{activeProject.description}</p>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 space-y-3">
              <h2 className="text-base font-bold text-white">Engineering Challenges</h2>
              <p className="text-sm text-[#CCCCCC] leading-relaxed">
                {activeProject.challenges || 'Structured requirements engineering and performance optimization.'}
              </p>
            </div>

            <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 space-y-3">
              <h2 className="text-base font-bold text-white">Implemented Solution</h2>
              <p className="text-sm text-[#CCCCCC] leading-relaxed">
                {activeProject.solution || 'Delivered modular architecture with verified security and responsive layout.'}
              </p>
            </div>

            <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 space-y-3">
              <h2 className="text-base font-bold text-white">Technology Stack</h2>
              <div className="flex flex-wrap gap-2">
                {activeProject.technologies.map((tech) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 bg-[#1A1E28] border border-[#262B38] rounded-md font-mono text-xs text-[#00BFFF]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onStartProject}
              className="w-full min-h-[44px] py-3 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              Build a Similar Solution
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filtered = portfolio.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.technologies.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-[#262B38] flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <p className="font-mono text-xs text-[#00BFFF]">Verified Project Showcase</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Our Work</h1>
          <p className="text-sm text-[#CCCCCC]">
            Published software builds and production systems delivered by our team.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#C0C0C0] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects or tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-[#13161D] border border-[#2B3140] rounded-lg text-sm text-white placeholder-[#7A8294] focus:outline-none focus:ring-2 focus:ring-[#00BFFF]"
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
          {filtered.map((project, idx) => (
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
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs text-[#00BFFF]">
                    <span>{project.category}</span>
                    <span>·</span>
                    <span className="text-[#C0C0C0]">{project.technologies.slice(0, 3).join(' / ')}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{project.title}</h2>
                  <p className="text-sm text-[#CCCCCC] leading-relaxed">{project.summary}</p>
                </div>

                <div className="pt-4 border-t border-[#262B38] flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onSelectSlug(project.slug)}
                    className="text-xs font-semibold text-[#00BFFF] hover:underline inline-flex items-center gap-1.5"
                  >
                    Read Technical Case Study
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  {project.live_url && (
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#CCCCCC] hover:text-white inline-flex items-center gap-1"
                    >
                      Live URL
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-12 text-center space-y-4">
          <SearchX className="w-8 h-8 text-[#C0C0C0] mx-auto" />
          <p className="text-sm text-[#CCCCCC]">No verified portfolio projects match this search filter.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 rounded-lg bg-[#1A1E28] border border-[#333333] text-xs font-medium text-white"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
