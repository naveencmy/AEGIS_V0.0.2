import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Lock,
  Award,
  CreditCard,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  X,
} from 'lucide-react';
import { endpoints } from '../lib/api';
import { cn } from '../lib/utils';
import SeverityBadge from './SeverityBadge';

const FRAMEWORK_TABS = [
  { id: 'ALL',            label: 'All Frameworks' },
  { id: 'NIST_800_53_R5', label: 'NIST SP 800-53' },
  { id: 'CIS_v8',         label: 'CIS Controls v8' },
  { id: 'ISO27001_2022',  label: 'ISO 27001:2022' },
  { id: 'PCI_DSS_4.0',    label: 'PCI-DSS v4.0' },
];

export function ThreatExplorer() {
  const [controls, setControls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchControls = async () => {
    setLoading(true);
    try {
      const res = await endpoints.searchFrameworks({
        q: searchQuery || undefined,
        framework: activeTab === 'ALL' ? undefined : activeTab,
        page: 1,
        page_size: 50,
      });
      setControls(res.data?.controls || []);
      setTotalCount(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to search controls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchControls();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Regulatory Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-normal">
            Ground-truth controls, security baselines, and implementation guidance ingested in PostgreSQL pgvector.
          </p>
        </div>

        <button
          onClick={fetchControls}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* ── Search Bar & Framework Tabs ── */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search controls, requirements, guidance (e.g. boundary protection, encryption, SSH)..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Framework Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg w-fit text-xs font-semibold">
          {FRAMEWORK_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-3 py-1.5 rounded-md transition-colors',
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results Count ── */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>Found <strong className="text-slate-800">{totalCount || controls.length}</strong> Regulatory Controls</span>
        <span>Indexed via BGE-M3 (1024-dim dense) + tsvector BM25</span>
      </div>

      {/* ── Control Cards List ── */}
      {controls.length === 0 && !loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-800">No Matching Controls</div>
          <p className="text-xs text-slate-500 mt-1">
            Try a different search term or select another framework filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {controls.map((c) => {
            const isExpanded = expandedId === c.id;

            return (
              <div
                key={c.id}
                className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden hover:border-slate-300 transition-all"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="p-4 cursor-pointer flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors select-none"
                >
                  <div className="flex items-start gap-3">
                    <button className="mt-0.5 text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 border border-cyan-200 px-2 py-0.5 rounded shadow-2xs">
                          {c.control_id}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {c.framework}
                        </span>
                        {c.severity && (
                          <SeverityBadge severity={c.severity} />
                        )}
                        <span className="cyber-key-pill text-[9px]">
                          ★ STANDARD
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
                      {!isExpanded && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 bg-slate-50/40 space-y-4 text-xs">
                    {/* Main Requirement Callout - Highlighted */}
                    <div className="p-3.5 rounded-lg bg-gradient-to-r from-cyan-50/70 via-white to-blue-50/40 border border-cyan-200 space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="cyber-key-pill">
                          ★ MAIN REQUIREMENT
                        </span>
                        <span className="text-[11px] font-bold text-cyan-950 uppercase tracking-wider">
                          Mandatory Regulatory Baseline
                        </span>
                      </div>
                      <p className="text-slate-800 leading-relaxed font-sans text-xs font-medium">
                        {c.description}
                      </p>
                    </div>

                    {c.guidance && (
                      <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="cyber-key-pill bg-slate-800 text-cyan-300 border-cyan-500/50">
                            ★ IMPLEMENTATION GUIDANCE
                          </span>
                          <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                            Hardened Practice
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-sans text-xs">{c.guidance}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px]">
                      <span className="text-slate-500 font-mono">
                        Source Reference: {c.source_page ? `Page ${c.source_page}` : 'Authoritative Standards Spec'}
                      </span>
                      {c.source_url && (
                        <a
                          href={c.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-cyan-700 hover:text-cyan-900 hover:underline"
                        >
                          Official Publication <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
