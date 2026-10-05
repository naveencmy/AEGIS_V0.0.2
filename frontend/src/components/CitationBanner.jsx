import React from 'react';
import { ShieldCheck, ExternalLink, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * CitationBanner — Reusable authoritative citation component.
 * Displays verified regulatory control sources with exact page/section citations.
 * Only displays 'VERIFIED SOURCE' when verified evidence is explicitly indicated.
 */
export default function CitationBanner({
  source = '',
  framework = '',
  controlId = '',
  section = '',
  page = null,
  url = '',
  isVerified = true,
  className = '',
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-3.5 transition-all text-sm',
        isVerified
          ? 'bg-indigo-50/50 border-brand-border text-slate-800'
          : 'bg-amber-50/50 border-amber-200 text-slate-800',
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          {isVerified ? (
            <>
              <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold tracking-wider uppercase text-brand-800">
                Verified Regulatory Citation
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
              <span className="text-xs font-bold tracking-wider uppercase text-amber-800">
                Unverified Evidence
              </span>
            </>
          )}
        </div>

        {framework && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-white border border-slate-200 text-slate-700">
            {framework}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-slate-600">
        {controlId && (
          <div>
            <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">Control ID</span>
            <span className="font-mono font-bold text-slate-900">{controlId}</span>
          </div>
        )}

        {(section || source) && (
          <div>
            <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">Section / Title</span>
            <span className="font-medium text-slate-800 truncate block" title={section || source}>
              {section || source}
            </span>
          </div>
        )}

        {page !== null && page !== undefined && page !== '' && (
          <div>
            <span className="text-slate-400 block text-[11px] font-medium uppercase tracking-wider">Page Reference</span>
            <span className="font-mono font-semibold text-slate-800">Page {page}</span>
          </div>
        )}
      </div>

      {url && (
        <div className="mt-2.5 pt-2 border-t border-slate-200/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono truncate max-w-[280px] sm:max-w-md">
            {url}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline shrink-0"
          >
            Official Source <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
