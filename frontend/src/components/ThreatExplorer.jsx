import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Lock,
  Award,
  CreditCard,
  Filter,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { endpoints } from '../lib/api';
import { cn } from '../lib/utils';

const FRAMEWORK_STYLES = {
  NIST:  { icon: ShieldCheck, badge: 'bg-blue-950/80 text-blue-300 border-blue-500/40',    dot: 'bg-blue-500'    },
  CIS:   { icon: Lock,        badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-500' },
  ISO:   { icon: Award,       badge: 'bg-purple-950/80 text-purple-300 border-purple-500/40',    dot: 'bg-purple-500'  },
  PCI:   { icon: CreditCard,  badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',       dot: 'bg-amber-500'   },
};

function getStyle(framework = '') {
  const key = Object.keys(FRAMEWORK_STYLES).find((k) => framework.toUpperCase().includes(k));
  return FRAMEWORK_STYLES[key] || { icon: BookOpen, badge: 'bg-slate-900 text-slate-300 border-slate-600/40', dot: 'bg-slate-500' };
}

function ControlCard({ control }) {
  const [expanded, setExpanded] = useState(false);
  const style  = getStyle(control.framework || '');
  const Icon   = style.icon;

  return (
    <article
      className="rounded-xl border border-surface-border bg-surface-card/80 overflow-hidden transition-all hover:border-surface-border-hi"
      aria-label={`Control ${control.control_id}: ${control.title}`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setExpanded(!expanded); } }}
        className="flex items-start gap-3 p-4 cursor-pointer select-none"
        aria-expanded={expanded}
      >
        <span
          className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold uppercase shrink-0 mt-0.5', style.badge)}
        >
          <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
          {control.control_id}
        </span>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-200 leading-snug">{control.title}</h4>
          {!expanded && (
            <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
              {control.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {control.severity && (
            <span className={cn(
              'text-[9px] font-bold uppercase tracking-widest rounded-md px-1.5 py-0.5 font-mono',
              control.severity?.toLowerCase() === 'critical' ? 'bg-red-500/15 text-red-400' :
              control.severity?.toLowerCase() === 'high'     ? 'bg-orange-500/15 text-orange-400' :
              control.severity?.toLowerCase() === 'medium'   ? 'bg-amber-500/15 text-amber-400' :
                                                               'bg-emerald-500/15 text-emerald-400'
            )}>
              {control.severity}
            </span>
          )}
          <span className="text-slate-600" style={{ transform: expanded ? 'rotate(90deg)' : undefined, transition: 'transform 0.15s' }}>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-surface-border bg-surface-base/60 px-4 py-3 space-y-3 animate-slide-in-up">
          <p className="text-xs text-slate-300 leading-relaxed">{control.description}</p>

          {control.guidance && (
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/20 p-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Implementation Guidance</span>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{control.guidance}</p>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-600">
            <span className="font-mono">{control.framework}</span>
            {control.source_url && (
              <a
                href={control.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-teal-400 hover:text-teal-300 hover:underline"
              >
                Official Standard
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export function ThreatExplorer() {
  const [frameworks,       setFrameworks]       = useState([]);
  const [controls,         setControls]         = useState([]);
  const [totalControls,    setTotalControls]    = useState(0);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [selectedFw,       setSelectedFw]       = useState('');
  const [loading,          setLoading]          = useState(false);

  const loadFrameworks = async () => {
    try {
      const res = await endpoints.listFrameworks();
      setFrameworks(res.data.frameworks || []);
    } catch {}
  };

  const loadControls = useCallback(async (q = searchQuery, fw = selectedFw) => {
    setLoading(true);
    try {
      const res = await endpoints.searchFrameworks({ q, framework: fw || undefined, page: 1, page_size: 40 });
      setControls(res.data.controls || []);
      setTotalControls(res.data.total || 0);
    } catch {
      setControls([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedFw]);

  useEffect(() => {
    loadFrameworks();
    loadControls('', '');
  }, []);

  const handleSearch = (q) => {
    setSearchQuery(q);
    loadControls(q, selectedFw);
  };

  const handleFwChange = (fw) => {
    setSelectedFw(fw);
    loadControls(searchQuery, fw);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">
          Regulatory Standards Explorer
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Authoritative full-text searchable compliance repository &bull; PostgreSQL 16 tsvector + pgvector
        </p>
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-surface-border bg-surface-card/80 p-3">
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search controls (e.g. 'boundary protection', 'AC-4', 'network segregation')…"
            aria-label="Search regulatory controls"
            className="w-full rounded-lg border border-surface-border bg-surface-base/60 pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
          <select
            value={selectedFw}
            onChange={(e) => handleFwChange(e.target.value)}
            aria-label="Filter by framework"
            className="rounded-lg border border-surface-border bg-surface-base/60 px-3 py-2 text-xs font-medium text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Standards</option>
            {frameworks.map((fw) => (
              <option key={fw.framework} value={fw.framework}>
                {fw.name} ({fw.count})
              </option>
            ))}
          </select>

          <button
            onClick={() => loadControls(searchQuery, selectedFw)}
            disabled={loading}
            aria-label="Refresh results"
            className="rounded-lg border border-surface-border bg-surface-card p-2 text-slate-500 hover:text-white transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span>
          Showing{' '}
          <span className="text-slate-300 font-semibold">{controls.length}</span> of{' '}
          <span className="text-slate-300 font-semibold">{totalControls}</span> authoritative controls
        </span>
        {loading && (
          <span className="flex items-center gap-1.5 text-indigo-400">
            <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
            Searching…
          </span>
        )}
      </div>

      {/* Controls grid */}
      {controls.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-surface-border p-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-slate-700 mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-400">No controls found</p>
          <p className="text-xs text-slate-600 mt-1">Try adjusting your search or framework filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {controls.map((c) => (
            <ControlCard key={c.id} control={c} />
          ))}
        </div>
      )}
    </div>
  );
}
