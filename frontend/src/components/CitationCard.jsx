import React from 'react';
import { ExternalLink, Bookmark, CheckCircle2, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

export function CitationCard({ citation, className }) {
  if (!citation) return null;

  const {
    control_id,
    framework,
    title,
    citation_source,
    citation_section,
    citation_page,
    citation_url,
    confidence = 1.0,
  } = citation;

  // Framework color badge
  const getFrameworkColor = (fw = "") => {
    if (fw.includes("NIST")) return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    if (fw.includes("CIS")) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    if (fw.includes("ISO")) return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-indigo-500/20 bg-obsidian-card/80 p-3.5 backdrop-blur-sm transition-all hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide uppercase",
              getFrameworkColor(framework)
            )}
          >
            <ShieldCheck className="h-3 w-3" />
            {control_id}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {citation_source || framework}
          </span>
        </div>

        {citation_url && (
          <a
            href={citation_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Source Doc</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {title && (
        <h5 className="mt-2 text-xs font-semibold text-slate-200 line-clamp-1">
          {title}
        </h5>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
        {citation_section && (
          <span className="flex items-center gap-1">
            <Bookmark className="h-3 w-3 text-indigo-400" />
            <span>Section: {citation_section}</span>
          </span>
        )}
        {citation_page && (
          <span className="text-slate-400 font-mono">
            Page {citation_page}
          </span>
        )}
        {confidence !== undefined && (
          <span className="flex items-center gap-1 ml-auto text-emerald-400 font-medium">
            <CheckCircle2 className="h-3 w-3" />
            <span>{(confidence * 100).toFixed(0)}% Match</span>
          </span>
        )}
      </div>
    </div>
  );
}
