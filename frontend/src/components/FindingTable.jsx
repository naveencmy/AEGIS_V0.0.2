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
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { cn, copyToClipboard } from '../lib/utils';
import SeverityBadge from './SeverityBadge';
import CitationBanner from './CitationBanner';

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

  const handleCopy = async (text, key) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSeverityFilter('ALL');
    setFrameworkFilter('ALL');
  };

  return (
    <div className="space-y-4">
      {/* ── Filter Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings, control IDs, rules..."
            className="w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Severity Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs font-semibold">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={cn(
                  'px-2.5 py-1 rounded transition-colors text-[11px]',
                  severityFilter === sev
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Framework Select */}
          <select
            value={frameworkFilter}
            onChange={(e) => setFrameworkFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Frameworks</option>
            {uniqueFrameworks.map((fw) => (
              <option key={fw} value={fw}>{fw}</option>
            ))}
          </select>

          {(searchQuery || severityFilter !== 'ALL' || frameworkFilter !== 'ALL') && (
            <button
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Findings Count & List ── */}
      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
        Identified Regulatory Violations ({filteredFindings.length} of {findings.length})
      </div>

      {filteredFindings.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-800">No Violations Found</div>
          <p className="text-xs text-slate-500 mt-1">
            No findings match your active filter criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((f, idx) => {
            const isExpanded = expandedId === f.id || idx === 0;

            return (
              <div
                key={f.id}
                className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:border-slate-300"
              >
                {/* Finding Header */}
                <div
                  onClick={() => toggleExpand(f.id)}
                  className="p-4 cursor-pointer flex items-start justify-between gap-4 select-none hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <button
                      className="mt-0.5 text-slate-400 hover:text-slate-600"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <SeverityBadge severity={f.severity} />
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {f.control_id}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {f.framework}
                        </span>
                        <span className="cyber-key-pill text-[10px]">
                          ★ KEY POINT
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">
                        {f.finding_title || 'Non-Compliant Rule Assertion'}
                      </h4>

                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {f.finding_description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="inline-block text-[11px] font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                      Score Impact: -15%
                    </span>
                  </div>
                </div>

                {/* Collapsible Body Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 space-y-4 text-xs bg-slate-50/40">
                    {/* Main Impact Callout - Highlighted */}
                    <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-50/70 via-white to-blue-50/40 border border-cyan-200 shadow-2xs flex items-start gap-3">
                      <span className="cyber-key-pill shrink-0 mt-0.5">
                        ★ CORE RISK
                      </span>
                      <div className="text-slate-800 leading-relaxed font-sans">
                        <strong className="text-cyan-900 font-bold mr-1">Main Vulnerability Impact:</strong>
                        {f.finding_description}
                      </div>
                    </div>

                    {/* Raw Violating Device Rule */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-slate-500" />
                          Violating Configuration Statement
                        </span>
                        <button
                          onClick={() => handleCopy(f.device_rule_reference, `rule-${f.id}`)}
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          {copiedKey === `rule-${f.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Rule
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900 text-red-300 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                        <span className="text-slate-500 select-none">! Target statement:</span><br />
                        {f.device_rule_reference}
                      </div>
                    </div>

                    {/* Authoritative Citation Banner */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-cyan-600" />
                        Authoritative Regulatory Grounding
                      </div>

                      <CitationBanner
                        isVerified={true}
                        framework={f.framework}
                        controlId={f.control_id}
                        section={f.citation_section || f.citation_source}
                        page={f.citation_page}
                        url={f.citation_url}
                      />
                    </div>

                    {/* Step-by-Step Remediation Plan */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                          <Wrench className="w-3.5 h-3.5 text-emerald-600" /> Hardened Remediation Action
                        </span>
                        <button
                          onClick={() => handleCopy(f.remediation, `rem-${f.id}`)}
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
                        >
                          {copiedKey === `rem-${f.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy Fix
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-3.5 rounded-lg bg-emerald-50/70 border border-emerald-300 text-slate-800 leading-relaxed font-sans shadow-2xs">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="cyber-key-pill bg-emerald-800 text-emerald-200 border-emerald-500">
                            ★ MAIN DIRECTIVE
                          </span>
                          <span className="text-xs font-bold text-emerald-950">Immediate Corrective Measure</span>
                        </div>
                        <p className="mb-3 font-semibold text-slate-900 text-xs">{f.remediation}</p>
                        <div className="p-2.5 rounded-lg bg-slate-900 text-cyan-300 font-mono text-[11px] overflow-x-auto border border-cyan-900/60 shadow-inner">
                          <span className="text-slate-500">! Recommended Remediation Syntax</span>
                          <br />
                          <span className="text-red-400 font-bold">no {f.device_rule_reference}</span>
                          <br />
                          <span className="text-emerald-400 font-bold">! Apply explicit least-privilege destination ACL rule</span>
                        </div>
                      </div>
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
