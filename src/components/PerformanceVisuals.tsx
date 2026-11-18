import React, { useState } from 'react';
import { Cpu, Activity, Layers, ArrowRight } from 'lucide-react';

interface PipelineSpec {
  id: 'build' | 'deploy' | 'assist';
  label: string;
  nodes: { code: string; title: string; metric: string }[];
  throughput: string;
  latency: string;
  thermalNote: string;
}

const PIPELINES: PipelineSpec[] = [
  {
    id: 'build',
    label: 'Web Build',
    nodes: [
      { code: 'N01', title: 'HTML5 Structure', metric: 'Semantic DOM' },
      { code: 'N02', title: 'CSS3 Grid Layer', metric: '1280px Core' },
      { code: 'N03', title: 'JS Runtime', metric: '< 16ms Frame' },
    ],
    throughput: '99.4 Lighthouse',
    latency: '14 ms TTI',
    thermalNote: 'Zero layout shift across mobile and desktop viewports',
  },
  {
    id: 'deploy',
    label: 'Hostinger Node',
    nodes: [
      { code: 'N01', title: 'Archive Bundle', metric: 'public_html' },
      { code: 'N02', title: 'PHP & Asset Sync', metric: 'Edge Cache' },
      { code: 'N03', title: 'DNS Propagation', metric: 'SSL Active' },
    ],
    throughput: '1.2 Gbps Edge',
    latency: '38 ms TTFB',
    thermalNote: 'Balanced load path with automated index.html routing',
  },
  {
    id: 'assist',
    label: 'Support Flow',
    nodes: [
      { code: 'N01', title: 'Query Intake', metric: 'Name + Scope' },
      { code: 'N02', title: 'Channel Route', metric: 'Mail / WhatsApp' },
      { code: 'N03', title: 'Resolution', metric: 'Direct Fix' },
    ],
    throughput: '100% Free Aid',
    latency: '< 30 min Reply',
    thermalNote: 'Direct human engineering support from Singrauli Hub',
  },
];

export function ArchitectureDiagram() {
  const [activeId, setActiveId] = useState<'build' | 'deploy' | 'assist'>('deploy');
  const current = PIPELINES.find((p) => p.id === activeId) || PIPELINES[1];

  return (
    <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 shadow-[0_2px_12px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#262B38]">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-[#1FA8D6]" />
          <span className="text-sm font-medium text-[#F4F6F9]">System Architecture Pathway</span>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0B0D11] border border-[#262B38] rounded-lg">
          {PIPELINES.map((pipe) => (
            <button
              key={pipe.id}
              type="button"
              onClick={() => setActiveId(pipe.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 whitespace-nowrap shrink-0 ${
                activeId === pipe.id
                  ? 'bg-[#1FA8D6]/15 text-[#1FA8D6] border border-[#1FA8D6]/40'
                  : 'text-[#C0C0C0] hover:text-white border border-transparent'
              }`}
            >
              {pipe.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive SVG & Node Circuit */}
      <div className="py-6 relative">
        <svg
          className="w-full h-12 mb-2 hidden sm:block"
          viewBox="0 0 600 48"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M 90 24 L 290 24 L 510 24"
            stroke="#262B38"
            strokeWidth="2"
          />
          <path
            d="M 90 24 L 290 24"
            stroke="#1FA8D6"
            strokeWidth="2"
            className="animate-data-flow"
          />
          <path
            d="M 290 24 L 510 24"
            stroke="#D9252D"
            strokeWidth="2"
            className="animate-data-flow"
          />
          <circle cx="90" cy="24" r="5" fill="#1FA8D6" />
          <circle cx="300" cy="24" r="5" fill="#C0C0C0" />
          <circle cx="510" cy="24" r="5" fill="#D9252D" />
        </svg>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {current.nodes.map((node, index) => (
            <div
              key={node.code}
              className="bg-[#1A1E28] border border-[#2B3140] rounded-lg p-4 transition-colors duration-200 hover:border-[#1FA8D6]/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-[#1FA8D6] tabular-nums">{node.code}</span>
                {index < 2 && <ArrowRight className="w-3.5 h-3.5 text-[#C0C0C0]/60 hidden sm:block" />}
              </div>
              <p className="text-sm font-medium text-white mb-1">{node.title}</p>
              <p className="font-mono text-xs text-[#CCCCCC] tabular-nums">{node.metric}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabular Readout Strip */}
      <div className="pt-4 border-t border-[#262B38] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[#C0C0C0] block mb-0.5">Benchmark</span>
            <span className="font-mono font-medium text-white tabular-nums">{current.throughput}</span>
          </div>
          <div>
            <span className="text-[#C0C0C0] block mb-0.5">Response</span>
            <span className="font-mono font-medium text-[#1FA8D6] tabular-nums">{current.latency}</span>
          </div>
        </div>
        <p className="text-[#C0C0C0] text-xs">{current.thermalNote}</p>
      </div>
    </div>
  );
}

interface MetricView {
  id: 'latency' | 'throughput' | 'thermal';
  label: string;
  unit: string;
  bars: { label: string; value: number; display: string; accent?: 'red' | 'blue' | 'green' }[];
}

const METRIC_VIEWS: MetricView[] = [
  {
    id: 'latency',
    label: 'Execution Latency',
    unit: 'ms (lower is faster)',
    bars: [
      { label: 'Static HTML Core', value: 18, display: '12 ms', accent: 'blue' },
      { label: 'CSS Grid Render', value: 24, display: '16 ms', accent: 'blue' },
      { label: 'Hostinger Edge', value: 42, display: '38 ms', accent: 'green' },
      { label: 'Legacy Uncached', value: 88, display: '210 ms', accent: 'red' },
    ],
  },
  {
    id: 'throughput',
    label: 'Compute Throughput',
    unit: 'req/sec capacity',
    bars: [
      { label: 'Edge Asset Cache', value: 94, display: '9,400 /s', accent: 'blue' },
      { label: 'PHP 8.3 Worker', value: 78, display: '4,850 /s', accent: 'green' },
      { label: 'Static Bundle', value: 98, display: '11,200 /s', accent: 'blue' },
      { label: 'Unoptimized DB', value: 34, display: '920 /s', accent: 'red' },
    ],
  },
  {
    id: 'thermal',
    label: 'Thermal & Load Balance',
    unit: '% resource headroom',
    bars: [
      { label: 'Idle Compute Node', value: 22, display: '22% Load', accent: 'green' },
      { label: 'Form Traffic Peak', value: 48, display: '48% Load', accent: 'blue' },
      { label: 'Batch Asset Sync', value: 64, display: '64% Load', accent: 'blue' },
      { label: 'Thermal Ceiling', value: 85, display: '85% Cap', accent: 'red' },
    ],
  },
];

export function PerformanceBenchmarkChart() {
  const [selectedMetric, setSelectedMetric] = useState<'latency' | 'throughput' | 'thermal'>('throughput');
  const active = METRIC_VIEWS.find((m) => m.id === selectedMetric) || METRIC_VIEWS[1];

  const getBarColor = (accent?: 'red' | 'blue' | 'green') => {
    if (accent === 'red') return 'bg-[#D9252D]';
    if (accent === 'green') return 'bg-[#22C55E]';
    return 'bg-[#1FA8D6]';
  };

  return (
    <div className="bg-[#13161D] border border-[#262B38] rounded-lg p-6 shadow-[0_2px_12px_rgba(0,0,0,0.28)]">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#262B38]">
        <div className="flex items-center gap-2.5">
          <Cpu className="w-4 h-4 text-[#D9252D]" />
          <span className="text-sm font-medium text-[#F4F6F9]">Infrastructure Telemetry</span>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0B0D11] border border-[#262B38] rounded-lg">
          <button
            type="button"
            onClick={() => setSelectedMetric('throughput')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 whitespace-nowrap shrink-0 ${
              selectedMetric === 'throughput'
                ? 'bg-[#D9252D]/20 text-white border border-[#D9252D]/60'
                : 'text-[#C0C0C0] hover:text-white border border-transparent'
            }`}
          >
            Throughput
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric('latency')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 whitespace-nowrap shrink-0 ${
              selectedMetric === 'latency'
                ? 'bg-[#D9252D]/20 text-white border border-[#D9252D]/60'
                : 'text-[#C0C0C0] hover:text-white border border-transparent'
            }`}
          >
            Latency
          </button>
          <button
            type="button"
            onClick={() => setSelectedMetric('thermal')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 whitespace-nowrap shrink-0 ${
              selectedMetric === 'thermal'
                ? 'bg-[#D9252D]/20 text-white border border-[#D9252D]/60'
                : 'text-[#C0C0C0] hover:text-white border border-transparent'
            }`}
          >
            Thermal Flow
          </button>
        </div>
      </div>

      <div className="pt-5 space-y-4">
        <div className="flex items-center justify-between text-xs text-[#C0C0C0]">
          <span className="font-medium text-white flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#1FA8D6]" />
            {active.label}
          </span>
          <span className="font-mono">{active.unit}</span>
        </div>

        <div className="space-y-3.5">
          {active.bars.map((bar) => (
            <div key={bar.label} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#CCCCCC]">{bar.label}</span>
                <span className="font-mono font-medium text-white tabular-nums">{bar.display}</span>
              </div>
              <div className="h-2.5 w-full bg-[#0B0D11] border border-[#262B38] rounded-sm overflow-hidden">
                <div
                  className={`h-full ${getBarColor(bar.accent)} transition-all duration-300 ease-out`}
                  style={{ width: `${bar.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
