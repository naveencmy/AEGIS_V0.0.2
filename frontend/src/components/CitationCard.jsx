import React from 'react';
import {
  ExternalLink,
  Bookmark,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Award,
  CreditCard,
  FileText,
} from 'lucide-react';
import { cn } from '../lib/utils';

const FRAMEWORK_META = {
  NIST: {
    icon: ShieldCheck,
    badge: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
    accent: 'border-blue-500/30',
    label: 'NIST Federal',
  },
  CIS: {
    icon: Lock,
    badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    accent: 'border-emerald-500/30',
    label: 'CIS Defense',
  },
  ISO: {
    icon: Award,
    badge: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
    accent: 'border-purple-500/30',
    label: 'ISO Global',
  },
  PCI: {
    icon: CreditCard,
    badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    accent: 'border-amber-500/30',
    label: 'PCI Payment',
  },
};

function getFrameworkMeta(fw = '') {
  const key = Object.keys(FRAMEWORK_META).find((k) => fw.toUpperCase().includes(k));
  return FRAMEWORK_META[key] || {
    icon: FileText,
    badge: 'bg-slate-900 text-slate-300 border-slate-600/40',
    accent: 'border-slate-600/30',
    label: 'Standard',
  };
}

/**
 * CitationCard — rich regulatory citation display.
 */
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

  const meta         = getFrameworkMeta(framework || '');
  const FrameworkIcon = meta.icon;
  const matchPct     = Math.min(100, Math.round((confidence || 1.0) * 100));
  const matchLabel   = matchPct >= 85 ? 'High Match' : matchPct >= 65 ? 'Medium Match' : 'Low Match';
  const matchColor   = matchPct >= 85 ? 'text-emerald-400' : matchPct >= 65 ? 'text-amber-400' : 'text-red-400';

  return (
    <article
      role="article"
      aria-label={`Citation ${control_id}: ${title || framework}`}
      className={cn(
        'rounded-xl border bg-surface-card/80 p-3.5 transition-colors hover:border-surface-border-hi animate-fade-in',
        meta.accent,
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase shrink-0',
              meta.badge
            )}
          >
            <FrameworkIcon className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{control_id}</span>
          </span>
          <span className="text-xs text-slate-400 font-medium truncate">
            {citation_source || framework}
          </span>
        </div>

        {citation_url && (
          <a
            href={citation_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open source document for ${control_id}`}
            className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-teal-400 hover:text-teal-300 hover:underline transition-colors"
          >
            <span>Source</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
      </div>

      {/* Title */}
      {title && (
        <p className="mt-2 text-xs font-semibold text-slate-200 line-clamp-2 leading-relaxed">
          {title}
        </p>
      )}

      {/* Meta row */}
      <div className="mt-2 pt-2 border-t border-surface-border flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        {citation_section && (
          <span className="flex items-center gap-1 font-mono">
            <Bookmark className="h-2.5 w-2.5 text-indigo-400 shrink-0" aria-hidden="true" />
            <span>{citation_section}</span>
          </span>
        )}
        {citation_page && (
          <span className="font-mono">p. {citation_page}</span>
        )}
        <span
          role="status"
          aria-label={`Relevance: ${matchLabel}, ${matchPct}%`}
          className={cn('flex items-center gap-1 ml-auto font-mono font-semibold', matchColor)}
        >
          <CheckCircle2 className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
          <span>{matchLabel} ({matchPct}%)</span>
        </span>
      </div>
    </article>
  );
}
