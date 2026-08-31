import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Search,
  ExternalLink,
  Code2,
  Wrench,
  BookOpen,
} from 'lucide-react';
import { getSeverityBadge, cn } from '../lib/utils';
import { CitationCard } from './CitationCard';

export function FindingTable({ findings = [] }) {
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [frameworkFilter, setFrameworkFilter] = useState('ALL');

  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSearch =
        searchQuery === '' ||
        f.finding_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.control_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.device_rule_reference && f.device_rule_reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.finding_description && f.finding_description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchSeverity =
        severityFilter === 'ALL' || f.severity.toUpperCase() === severityFilter;

      const matchFramework =
        frameworkFilter === 'ALL' || f.framework === frameworkFilter;

      return matchSearch && matchSeverity && matchFramework;
    });
  }, [findings, searchQuery, severityFilter, frameworkFilter]);

  const uniqueFrameworks = useMemo(() => {
    const set = new Set(findings.map((f) => f.framework));
    return Array.from(set);
  }, [findings]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-500/20 bg-obsidian-card/60 p-3 backdrop-blur-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings, control IDs, device rules..."
            className="w-full rounded-lg border border-slate-700/60 bg-obsidian/80 pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Framework Filter */}
          <select
            value={frameworkFilter}
            onChange={(e) => setFrameworkFilter(e.target.value)}
            className="rounded-lg border border-slate-700/60 bg-obsidian/80 px-3 py-2 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Frameworks</option>
            {uniqueFrameworks.map((fw) => (
              <option key={fw} value={fw}>
                {fw}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-slate-700/60 bg-obsidian/80 px-3 py-2 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Findings Table List */}
      {filteredFindings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-400">
          <ShieldAlert className="mx-auto h-8 w-8 text-slate-600 mb-2" />
          <p className="text-sm font-medium">No findings match the selected filters</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-indigo-500/20 bg-obsidian-card/40">
          <div className="divide-y divide-slate-800/80">
            {filteredFindings.map((finding) => {
              const isExpanded = expandedId === finding.id;
              const badge = getSeverityBadge(finding.severity);

              return (
                <div
                  key={finding.id}
                  className="transition-colors hover:bg-slate-900/40"
                >
                  {/* Row Header */}
                  <div
                    onClick={() => toggleExpand(finding.id)}
                    className="flex cursor-pointer items-center justify-between p-4 gap-3 select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button className="text-slate-400 hover:text-slate-200">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>

                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
                          badge.bg
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", badge.pill)} />
                        {badge.label}
                      </span>

                      <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-indigo-400 border border-indigo-500/20">
                        {finding.control_id}
                      </span>

                      <span className="text-sm font-medium text-slate-200 truncate">
                        {finding.finding_title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-slate-400 hidden sm:inline-block">
                        {finding.framework}
                      </span>
                      {finding.citation_page && (
                        <span className="text-xs font-mono text-slate-500 hidden md:inline-block">
                          p. {finding.citation_page}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="border-t border-indigo-500/10 bg-obsidian/60 p-5 space-y-4 text-sm animate-in fade-in-50 duration-150">
                      {/* Violation Description */}
                      <div>
                        <h6 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                          Finding Description & Impact
                        </h6>
                        <p className="text-slate-300 leading-relaxed">
                          {finding.finding_description}
                        </p>
                      </div>

                      {/* Device Rule Reference */}
                      {finding.device_rule_reference && (
                        <div>
                          <h6 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1.5">
                            <Code2 className="h-3.5 w-3.5" />
                            Triggering Device Configuration Rule
                          </h6>
                          <pre className="rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-amber-300/90 overflow-x-auto whitespace-pre-wrap">
                            {finding.device_rule_reference}
                          </pre>
                        </div>
                      )}

                      {/* Remediation Guidance */}
                      {finding.remediation && (
                        <div>
                          <h6 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
                            <Wrench className="h-3.5 w-3.5" />
                            Actionable Remediation Procedure
                          </h6>
                          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-200/90 leading-relaxed">
                            {finding.remediation}
                          </div>
                        </div>
                      )}

                      {/* Citation Reference Card */}
                      <div>
                        <h6 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                          <BookOpen className="h-3.5 w-3.5" />
                          Authoritative Regulatory Citation
                        </h6>
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
