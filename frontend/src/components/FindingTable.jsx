import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Search,
  Code2,
  Wrench,
  BookOpen,
  Filter,
  X,
  Copy,
  Check,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { CitationCard } from './CitationCard';
import SeverityBadge from './SeverityBadge';

const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function FindingTable({ findings = [] }) {
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [frameworkFilter, setFrameworkFilter] = useState('ALL');
  const [copiedKey, setCopiedKey] = useState(null);

  const uniqueFrameworks = useMemo(
    () => Array.from(new Set(findings.map((f) => f.framework))),
    [findings]
  );

  const filteredFindings = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return findings
      .filter((f) => {
        const matchSearch =
          !q ||
          f.finding_title?.toLowerCase().includes(q) ||
          f.control_id?.toLowerCase().includes(q) ||
          f.device_rule_reference?.toLowerCase().includes(q) ||
          f.finding_description?.toLowerCase().includes(q);

        const matchSev = severityFilter === 'ALL' || f.severity?.toUpperCase() === severityFilter;
        const matchFw = frameworkFilter === 'ALL' || f.framework === frameworkFilter;

        return matchSearch && matchSev && matchFw;
      })
      .sort((a, b) => (SEVERITY_ORDER[a.severity?.toUpperCase()] ?? 4) - (SEVERITY_ORDER[b.severity?.toUpperCase()] ?? 4));
  }, [findings, searchQuery, severityFilter, frameworkFilter]);

  const toggleExpand = (id) =>
    setExpandedId(expandedId === id ? null : id);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const hasFilters = searchQuery || severityFilter !== 'ALL' || frameworkFilter !== 'ALL';
  const clearFilters = () => {
    setSearchQuery('');
    setSeverityFilter('ALL');
    setFrameworkFilter('ALL');
  };

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-border bg-surface-card p-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings, control IDs, device rules…"
            aria-label="Filter audit findings"
            className="w-full rounded-lg border border-surface-border bg-surface-base/60 pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
          <select
            value={frameworkFilter}
            onChange={(e) => setFrameworkFilter(e.target.value)}
            aria-label="Filter by regulatory framework"
            className="rounded-lg border border-surface-border bg-surface-base/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Frameworks</option>
            {uniqueFrameworks.map((fw) => (
              <option key={fw} value={fw}>{fw}</option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            aria-label="Filter by severity level"
            className="rounded-lg border border-surface-border bg-surface-base/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg border border-surface-border px-2.5 py-1.5 text-xs text-slate-400 hover:text-white hover:border-surface-border-hi transition-colors"
              aria-label="Clear all filters"
            >
              <X className="h-3 w-3" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="text-[11px] text-slate-500 font-medium">
        Showing <span className="text-slate-300 font-semibold">{filteredFindings.length}</span> of{' '}
        <span className="text-slate-300 font-semibold">{findings.length}</span> findings
        {hasFilters && ' (filtered)'}
      </div>

      {/* ── Empty state ── */}
      {filteredFindings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-border p-10 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-slate-700 mb-3" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-400">No findings match the selected filters</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-card">
          <div className="divide-y divide-surface-border">
            {filteredFindings.map((finding, idx) => {
              const isExpanded = expandedId === finding.id;
              const sevKey = (finding.severity || '').toUpperCase();
              const leftBorderClass =
                sevKey === 'CRITICAL' ? 'border-l-critical' :
                sevKey === 'HIGH' ? 'border-l-high' :
                sevKey === 'MEDIUM' ? 'border-l-medium' : 'border-l-low';

              const steps = Array.isArray(finding.remediation_steps) && finding.remediation_steps.length > 0
                ? finding.remediation_steps
                : finding.remediation ? [finding.remediation] : [];

              return (
                <div
                  key={finding.id || idx}
                  className={cn('transition-colors', isExpanded ? 'bg-surface-overlay' : 'hover:bg-surface-raised/60')}
                >
                  {/* Row header */}
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    aria-controls={`finding-detail-${finding.id}`}
                    onClick={() => toggleExpand(finding.id)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggleExpand(finding.id);
                      }
                    }}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 select-none border-l-[3px] pl-3',
                      leftBorderClass
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-slate-500 shrink-0 transition-transform" style={{ transform: isExpanded ? 'rotate(90deg)' : undefined }}>
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>

                      <SeverityBadge severity={finding.severity} />

                      <span className="rounded-md bg-indigo-950/50 px-2 py-0.5 text-[11px] font-mono font-bold text-indigo-300 border border-indigo-500/25 shrink-0">
                        {finding.control_id}
                      </span>

                      <span className="text-xs font-medium text-slate-200 truncate">
                        {finding.finding_title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-500">
                      <span className="hidden sm:inline font-medium">{finding.framework}</span>
                      {finding.citation_page && (
                        <span className="hidden md:inline font-mono">p.{finding.citation_page}</span>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div
                      id={`finding-detail-${finding.id}`}
                      className="border-t border-surface-border bg-surface-base/60 p-4 space-y-4 animate-slide-in-up"
                    >
                      {/* Description */}
                      <div>
                        <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                          Finding Description &amp; Regulatory Impact
                        </h5>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {finding.finding_description}
                        </p>
                      </div>

                      {/* Device rule */}
                      {finding.device_rule_reference && (
                        <div>
                          <h5 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-1.5">
                            <Code2 className="h-3.5 w-3.5" aria-hidden="true" />
                            Triggering Device Configuration Rule
                          </h5>
                          <pre className="rounded-lg border border-surface-border bg-[#050D1A] p-3 font-mono text-xs text-amber-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                            {finding.device_rule_reference}
                          </pre>
                        </div>
                      )}

                      {/* Structured Remediation Playbook */}
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                            <Wrench className="h-4 w-4 text-emerald-400" />
                            Vendor-Specific CLI Remediation Playbook
                          </h5>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded font-mono">
                              <Clock className="h-3 w-3" />
                              ~{finding.estimated_minutes || 5} mins
                            </span>
                            <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-300 uppercase">
                              Risk: {finding.risk_level || 'LOW'}
                            </span>
                          </div>
                        </div>

                        {/* Steps */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/80">
                            Execution Steps (CLI Commands)
                          </span>
                          <div className="relative rounded-lg border border-surface-border bg-[#020817] p-3 font-mono text-xs text-emerald-200">
                            <button
                              onClick={() => handleCopy(steps.join('\n'), `rem_${finding.id}`)}
                              className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded bg-slate-800/80 px-2 py-1 text-[10px] text-slate-300 hover:text-white"
                            >
                              {copiedKey === `rem_${finding.id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              Copy Script
                            </button>
                            <ol className="list-decimal list-inside space-y-1 pr-20">
                              {steps.map((st, sIdx) => (
                                <li key={sIdx} className="font-mono text-xs text-slate-200">
                                  <span className="text-emerald-400 font-semibold">{st}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>

                        {/* Verification Command */}
                        {finding.verification_command && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400/80 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                              Verification Command
                            </span>
                            <div className="flex items-center justify-between rounded-lg border border-surface-border bg-[#020817] px-3 py-2 font-mono text-xs text-cyan-300">
                              <span>{finding.verification_command}</span>
                              <button
                                onClick={() => handleCopy(finding.verification_command, `ver_${finding.id}`)}
                                className="text-slate-500 hover:text-white"
                              >
                                {copiedKey === `ver_${finding.id}` ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Rollback Steps */}
                        {finding.rollback_steps && finding.rollback_steps.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80 flex items-center gap-1">
                              <RotateCcw className="h-3 w-3 text-amber-400" />
                              Rollback Procedure
                            </span>
                            <div className="rounded-lg border border-surface-border bg-[#020817] p-2.5 font-mono text-xs text-amber-300/90 space-y-0.5">
                              {finding.rollback_steps.map((rb, rIdx) => (
                                <div key={rIdx}>{rb}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Citation */}
                      <div>
                        <h5 className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                          <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                          Authoritative Regulatory Citation
                        </h5>
                        <CitationCard
                          citation={{
                            control_id: finding.control_id,
                            framework: finding.framework,
                            citation_source: finding.citation_source,
                            citation_section: finding.citation_section,
                            citation_page: finding.citation_page,
                            citation_url: finding.citation_url,
                            confidence: finding.confidence_score,
                          }}
                          className="max-w-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
