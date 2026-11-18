import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Cpu, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface ServicesPageProps {
  onSelectServiceQuote: (category: string) => void;
}

export default function ServicesPage({ onSelectServiceQuote }: ServicesPageProps) {
  const { services } = useAuth();
  const [selectedSlug, setSelectedSlug] = useState<string>('all');

  const visibleServices =
    selectedSlug === 'all' ? services : services.filter((s) => s.slug === selectedSlug);

  return (
    <div className="space-y-8">
      <div className="pb-6 border-b border-[#262B38] flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-xs text-[#00BFFF]">Engineering Service Catalogue</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Development Services</h1>
          <p className="text-sm text-[#CCCCCC] max-w-[65ch]">
            End-to-end software services executed by Sanjay Vaishya and our collaborative engineering team.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectServiceQuote('Full-Stack Development')}
          className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          Request Custom Quotation
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Category Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
        <button
          type="button"
          onClick={() => setSelectedSlug('all')}
          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
            selectedSlug === 'all'
              ? 'bg-[#1A1E28] text-[#00BFFF] border border-[#00BFFF]/50'
              : 'bg-[#13161D] text-[#CCCCCC] border border-[#262B38] hover:text-white'
          }`}
        >
          All Services ({services.length})
        </button>
        {services.map((svc) => (
          <button
            key={svc.id}
            type="button"
            onClick={() => setSelectedSlug(svc.slug)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              selectedSlug === svc.slug
                ? 'bg-[#1A1E28] text-[#00BFFF] border border-[#00BFFF]/50'
                : 'bg-[#13161D] text-[#CCCCCC] border border-[#262B38] hover:text-white'
            }`}
          >
            {svc.title}
          </button>
        ))}
      </div>

      {/* Detailed Service Cards */}
      <div className="space-y-6">
        {visibleServices.map((svc, idx) => (
          <section
            key={svc.id}
            className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2 font-mono text-xs text-[#00BFFF]">
                <Layers className="w-4 h-4" />
                <span>0{idx + 1}. {svc.category}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{svc.title}</h2>
              <p className="text-sm text-[#CCCCCC] leading-relaxed">{svc.description}</p>

              <div className="pt-2">
                <p className="font-mono text-xs text-[#C0C0C0] mb-2">Suitable Use Cases</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-white">
                  {svc.useCases.map((uc, uIdx) => (
                    <span key={uc}>
                      {uc}
                      {uIdx < svc.useCases.length - 1 ? ' ·' : ''}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onSelectServiceQuote(svc.category)}
                  className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#ED1C24] hover:bg-[#B81D24] text-white text-xs font-semibold inline-flex items-center gap-2"
                >
                  Request a Quote for {svc.title}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-[#1A1E28] border border-[#262B38] rounded-lg p-5 space-y-3">
                <h3 className="text-sm font-bold text-white">Key Deliverables &amp; Features</h3>
                <ul className="space-y-2">
                  {svc.features.map((feat) => (
                    <li key={feat} className="text-xs text-[#CCCCCC] flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00CC66] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#1A1E28] border border-[#262B38] rounded-lg p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#00BFFF]" />
                  Technologies Applied
                </h3>
                <div className="space-y-2">
                  {svc.technologies.map((tech) => (
                    <div
                      key={tech}
                      className="px-3 py-2 bg-[#0B0D11] border border-[#262B38] rounded-md font-mono text-xs text-[#F4F6F9]"
                    >
                      {tech}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
