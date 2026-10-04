import React from 'react';
import { cn } from '../lib/utils';

const SEVERITY_CONFIG = {
  CRITICAL: {
    label: 'Critical',
    classes: 'bg-red-500/10 text-red-400 border border-red-500/30 ring-1 ring-red-500/10',
    dot: 'bg-red-400',
    leftBorder: 'border-l-critical',
  },
  HIGH: {
    label: 'High',
    classes: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
    dot: 'bg-orange-400',
    leftBorder: 'border-l-high',
  },
  MEDIUM: {
    label: 'Medium',
    classes: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    dot: 'bg-amber-400',
    leftBorder: 'border-l-medium',
  },
  LOW: {
    label: 'Low',
    classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    dot: 'bg-emerald-400',
    leftBorder: 'border-l-low',
  },
};

/**
 * SeverityBadge — pill display for severity levels.
 * @param {string} severity  - CRITICAL | HIGH | MEDIUM | LOW (case-insensitive)
 * @param {boolean} showDot  - prepend a coloured dot
 * @param {string} className - extra tailwind overrides
 */
export default function SeverityBadge({ severity = 'LOW', showDot = true, className }) {
  const key   = (severity || '').toUpperCase();
  const config = SEVERITY_CONFIG[key] || SEVERITY_CONFIG.LOW;

  return (
    <span
      role="img"
      aria-label={`Severity: ${config.label}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest font-mono shrink-0',
        config.classes,
        className
      )}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dot)} aria-hidden="true" />
      )}
      {config.label}
    </span>
  );
}

export { SEVERITY_CONFIG };
