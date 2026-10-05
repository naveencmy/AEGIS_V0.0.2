import React from 'react';
import { cn } from '../lib/utils';

const SEVERITY_CONFIG = {
  CRITICAL: {
    label: 'Critical',
    classes: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-600',
    leftBorder: 'border-l-red-600',
  },
  HIGH: {
    label: 'High',
    classes: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-600',
    leftBorder: 'border-l-orange-500',
  },
  MEDIUM: {
    label: 'Medium',
    classes: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-600',
    leftBorder: 'border-l-amber-500',
  },
  LOW: {
    label: 'Low',
    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-600',
    leftBorder: 'border-l-emerald-600',
  },
};

export default function SeverityBadge({ severity = 'LOW', showDot = true, className }) {
  const key = (severity || '').toUpperCase();
  const config = SEVERITY_CONFIG[key] || SEVERITY_CONFIG.LOW;

  return (
    <span
      role="status"
      aria-label={`Severity: ${config.label}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide shrink-0',
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
