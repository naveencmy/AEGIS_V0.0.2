import React, { useState } from 'react';
import {
  Printer,
  Download,
  ShieldCheck,
  FileCheck,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  BarChart3,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { FindingTable } from './FindingTable';
import { formatDate, cn } from '../lib/utils';

function ScoreArc({ score }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 85 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
      <circle cx="44" cy="44" r={r} fill="none" stroke="#1E293B" strokeWidth="8" />
      <circle
        cx="44" cy="44" r={r}
        fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 44 44)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="44" y="48" textAnchor="middle" fontSize="15" fontWeight="800" fill={color} fontFamily="Inter, sans-serif">
        {score}%
      </text>
    </svg>
  );
}

function MetricCard({ label, value, sub, accent, Icon }) {
  return (
    <div className={cn('rounded-xl border p-4 backdrop-blur-sm', accent)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-slate-600" aria-hidden="true" />}
      </div>
      <div className="text-2xl font-extrabold tracking-tight text-slate-100">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

export function ComplianceReport({ auditData, onBack, onVerifyBlockchain }) {
  if (!auditData) return (
    <div className="rounded-xl border border-dashed border-surface-border p-16 text-center text-slate-500">
      <ShieldCheck className="mx-auto h-10 w-10 text-slate-700 mb-3" />
      <p className="text-sm">No audit report selected.</p>
    </div>
  );

  const {
    id,
    status,
    started_at,
    completed_at,
    total_findings = 0,
    critical_count = 0,
    high_count = 0,
    medium_count = 0,
    low_count = 0,
    compliance_score_percent = 100,
    framework_filter = [],
    blockchain_anchored = false,
    blockchain_block_height = null,
    blockchain_block_hash = null,
    blockchain_merkle_root = null,
    findings = [],
  } = auditData;

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `AEGIS_Audit_${id}.json` });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const scoreLabel =
    compliance_score_percent >= 85 ? 'Compliant' :
    compliance_score_percent >= 60 ? 'Remediation Required' : 'High Non-Compliance';

  const scoreColor =
    compliance_score_percent >= 85 ? 'text-emerald-400' :
    compliance_score_percent >= 60 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Report Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-border pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back to audit"
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-surface-border bg-surface-card text-slate-400 hover:text-white hover:border-surface-border-hi transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-100">
                Compliance Audit Report
              </h2>
              <span className="rounded-md border border-surface-border bg-surface-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {status || 'COMPLETED'}
              </span>
              {blockchain_anchored && (
                <span className="flex items-center gap-1 rounded-md bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-300">
                  <Lock className="h-3 w-3" />
                  Block #{blockchain_block_height} Anchored
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Audit ID:{' '}
              <span className="font-mono text-slate-400">{String(id).substring(0, 16)}…</span>
              {' '}&bull;{' '}
              Completed: <span className="text-slate-400">{formatDate(completed_at || started_at)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 no-print">
          {onVerifyBlockchain && (
            <button
              onClick={onVerifyBlockchain}
              className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-600/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-600/20 transition-all shadow-sm"
            >
              <Lock className="h-3.5 w-3.5" />
              Verify On Blockchain
            </button>
          )}
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-surface-border-hi hover:text-white transition-all"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Export JSON
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* ── Executive Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">

        {/* Compliance Score Card */}
        <div className="lg:col-span-2 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-surface-card to-indigo-950/20 p-5 flex items-center gap-4 shadow-glow-brand/10">
          <ScoreArc score={compliance_score_percent} />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
              Compliance Posture
            </div>
            <div className={cn('text-lg font-extrabold', scoreColor)}>
              {scoreLabel}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {framework_filter.join(', ') || 'NIST 800-53 R5'}
            </div>
            <div className="mt-2 w-full h-1.5 rounded-full bg-surface-border overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', compliance_score_percent >= 85 ? 'bg-emerald-500' : compliance_score_percent >= 60 ? 'bg-amber-500' : 'bg-red-500')}
                style={{ width: `${compliance_score_percent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric tiles */}
        <MetricCard
          label="Total Findings"
          value={total_findings}
          sub="Violations identified"
          accent="border-surface-border bg-surface-card/70"
          Icon={BarChart3}
        />
        <MetricCard
          label="Critical"
          value={critical_count}
          sub="Immediate exploit risk"
          accent="border-red-500/20 bg-red-500/5"
          Icon={AlertOctagon}
        />
        <MetricCard
          label="High"
          value={high_count}
          sub="Perimeter exposure"
          accent="border-orange-500/20 bg-orange-500/5"
          Icon={AlertTriangle}
        />
        <MetricCard
          label="Medium"
          value={medium_count}
          sub="Elevated risk"
          accent="border-amber-500/20 bg-amber-500/5"
          Icon={Info}
        />
        <MetricCard
          label="Low"
          value={low_count}
          sub="Best-practice gap"
          accent="border-emerald-500/20 bg-emerald-500/5"
          Icon={CheckCircle2}
        />
      </div>

      {/* ── Blockchain Proof of Audit Callout ── */}
      {blockchain_anchored && (
        <div className="rounded-xl border border-purple-500/25 bg-gradient-to-r from-purple-950/20 via-surface-card to-surface-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">
                  Cryptographically Anchored on Immutable Ledger
                </span>
                <span className="rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono px-1.5 py-0.2">
                  Block #{blockchain_block_height}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 truncate max-w-xl mt-0.5">
                Merkle Root: {blockchain_merkle_root || 'Calculated'} &bull; Hash: {blockchain_block_hash?.substring(0, 20)}…
              </p>
            </div>
          </div>

          {onVerifyBlockchain && (
            <button
              onClick={onVerifyBlockchain}
              className="flex items-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/15 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/25 transition-colors shrink-0"
            >
              <span>Verify Integrity</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* ── Findings Section ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-indigo-400 shrink-0" aria-hidden="true" />
          <h3 className="text-base font-bold text-slate-100">
            Detailed Regulatory Audit Findings
            <span className="ml-2 text-sm font-medium text-slate-500">({findings.length})</span>
          </h3>
        </div>

        <FindingTable findings={findings} />
      </div>
    </div>
  );
}
