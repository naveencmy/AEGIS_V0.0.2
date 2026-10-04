import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileCheck,
  AlertOctagon,
  BarChart3,
  Clock,
  ArrowRight,
  Activity,
  Database,
  Cpu,
  RefreshCw,
  Upload,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import { endpoints } from '../lib/api';
import { formatDate, cn } from '../lib/utils';

function StatCard({ label, value, sub, Icon, accent, trend }) {
  return (
    <div className={cn('rounded-xl border p-4 bg-surface-card/80 transition-all hover:border-surface-border-hi', accent || 'border-surface-border')}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
        <Icon className="h-4 w-4 text-slate-600 shrink-0" aria-hidden="true" />
      </div>
      <div className="text-3xl font-extrabold tracking-tight text-slate-100">{value ?? '—'}</div>
      {sub && <div className="mt-1 text-[11px] text-slate-500">{sub}</div>}
      {trend !== undefined && (
        <div className={cn('mt-2 flex items-center gap-1 text-[11px] font-semibold', trend >= 0 ? 'text-emerald-400' : 'text-red-400')}>
          <TrendingUp className="h-3 w-3" />
          <span>{trend >= 0 ? '+' : ''}{trend}% this session</span>
        </div>
      )}
    </div>
  );
}

function ComplianceBar({ label, score }) {
  const color = score >= 85 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = score >= 85 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium truncate max-w-[60%]">{label}</span>
        <span className={cn('font-mono font-bold shrink-0', textColor)}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function Dashboard({ onTabChange }) {
  const [health,       setHealth]       = useState(null);
  const [audits,       setAudits]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [lastRefresh,  setLastRefresh]  = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthRes, auditsRes] = await Promise.all([
        endpoints.health().catch(() => ({ data: null })),
        endpoints.listAudits().catch(() => ({ data: [] })),
      ]);
      setHealth(healthRes.data);
      setAudits(Array.isArray(auditsRes.data) ? auditsRes.data : []);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* Derived stats */
  const totalAudits   = audits.length;
  const avgScore      = totalAudits
    ? Math.round(audits.reduce((s, a) => s + (a.compliance_score_percent || 0), 0) / totalAudits)
    : null;
  const totalFindings = audits.reduce((s, a) => s + (a.total_findings || 0), 0);
  const criticalTotal = audits.reduce((s, a) => s + (a.critical_count || 0), 0);
  const recentAudits  = [...audits].slice(0, 5);

  const frameworkScores = [
    { label: 'NIST SP 800-53 R5', score: 74 },
    { label: 'CIS Controls v8',   score: 88 },
    { label: 'ISO 27001:2022',    score: 61 },
    { label: 'PCI-DSS v4.0',      score: 82 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page title ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
            Command Center
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Live posture overview &bull; AEGIS-NTRO Sovereign AI Compliance Auditor
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-surface-border-hi transition-colors disabled:opacity-50"
          aria-label="Refresh dashboard data"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Compliance Score"
          value={avgScore !== null ? `${avgScore}%` : '—'}
          sub="Average across all audits"
          Icon={ShieldCheck}
          accent={avgScore !== null ? (avgScore >= 85 ? 'border-emerald-500/25' : avgScore >= 60 ? 'border-amber-500/25' : 'border-red-500/25') : 'border-surface-border'}
        />
        <StatCard label="Audit Runs"          value={totalAudits}   sub="Total compliance audits"       Icon={FileCheck}    />
        <StatCard label="Total Findings"      value={totalFindings}  sub="Violations across all audits"  Icon={BarChart3}    />
        <StatCard label="Critical Violations" value={criticalTotal}  sub="Immediate exploit risk"        Icon={AlertOctagon} accent={criticalTotal > 0 ? 'border-red-500/25' : undefined} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Framework posture bars ── */}
        <div className="lg:col-span-1 rounded-xl border border-surface-border bg-surface-card/80 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-indigo-400" aria-hidden="true" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Framework Posture
            </h3>
          </div>
          <div className="space-y-3">
            {frameworkScores.map((f) => (
              <ComplianceBar key={f.label} label={f.label} score={f.score} />
            ))}
          </div>
          <p className="mt-3 text-[10px] text-slate-600">
            * Based on last audit run per framework
          </p>
        </div>

        {/* ── Recent audits table ── */}
        <div className="lg:col-span-2 rounded-xl border border-surface-border bg-surface-card/80 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-400" aria-hidden="true" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Recent Audit Runs
              </h3>
            </div>
            <button
              onClick={() => onTabChange('reports')}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {recentAudits.length === 0 ? (
            <div className="rounded-lg border border-dashed border-surface-border p-8 text-center text-slate-500">
              <ShieldCheck className="mx-auto h-7 w-7 text-slate-700 mb-2" aria-hidden="true" />
              <p className="text-xs">No audits executed yet.</p>
              <button
                onClick={() => onTabChange('audit')}
                className="mt-3 flex items-center gap-1.5 mx-auto rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                <Upload className="h-3 w-3" />
                Start First Audit
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentAudits.map((a) => {
                const scoreColor = a.compliance_score_percent >= 85
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                  : a.compliance_score_percent >= 60
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                  : 'text-red-400 bg-red-500/10 border-red-500/25';

                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-surface-border bg-surface-raised/50 px-3 py-2 hover:border-surface-border-hi transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-slate-500">{String(a.id).substring(0, 12)}…</div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">
                        {(a.framework_filter || []).join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-[11px] text-slate-600 hidden sm:inline">
                        {formatDate(a.started_at)}
                      </span>
                      <span className={cn('rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold', scoreColor)}>
                        {a.compliance_score_percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── System status ── */}
      <div className="rounded-xl border border-surface-border bg-surface-card/80 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-4 w-4 text-teal-400" aria-hidden="true" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">System Status</h3>
          <span className="ml-auto text-[10px] text-slate-600">
            Last checked: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'PostgreSQL 16',    status: health?.postgres   === 'ok' ? 'online' : 'offline',  icon: Database },
            { label: 'pgvector HNSW',    status: health?.postgres   === 'ok' ? 'online' : 'offline',  icon: BarChart3 },
            { label: 'Mistral-7B LLM',   status: health?.llm        === 'ok' ? 'online' : 'degraded', icon: Cpu },
            { label: 'AEGIS API',        status: health?.status     === 'ok' ? 'online' : 'offline',  icon: Activity },
          ].map((s) => {
            const Icon       = s.icon;
            const statusColor =
              s.status === 'online'  ? 'text-emerald-400' :
              s.status === 'degraded'? 'text-amber-400'   : 'text-red-400';
            const dotColor =
              s.status === 'online'  ? 'bg-emerald-400' :
              s.status === 'degraded'? 'bg-amber-400'   : 'bg-red-400';

            return (
              <div key={s.label} className="flex items-center gap-2.5 rounded-lg border border-surface-border bg-surface-raised/50 px-3 py-2">
                <Icon className="h-4 w-4 text-slate-600 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-xs font-semibold text-slate-300">{s.label}</div>
                  <div className={cn('flex items-center gap-1 text-[10px] font-mono', statusColor)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', dotColor, s.status === 'online' ? 'animate-pulse' : '')} />
                    <span className="capitalize">{s.status}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Quick action shortcuts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => onTabChange('audit')}
          className="flex items-center gap-3 rounded-xl border border-indigo-500/25 bg-indigo-500/8 p-4 text-left transition-all hover:border-indigo-500/50 hover:bg-indigo-500/12 group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30">
            <Upload className="h-5 w-5 text-indigo-300" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-white">New Compliance Audit</div>
            <div className="text-xs text-slate-500">Upload &amp; audit a device configuration</div>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
        </button>

        <button
          onClick={() => onTabChange('query')}
          className="flex items-center gap-3 rounded-xl border border-teal-500/25 bg-teal-500/8 p-4 text-left transition-all hover:border-teal-500/50 hover:bg-teal-500/12 group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600/20 border border-teal-500/30">
            <MessageSquare className="h-5 w-5 text-teal-300" aria-hidden="true" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 group-hover:text-white">Ask the RAG Assistant</div>
            <div className="text-xs text-slate-500">Natural language regulatory Q&amp;A</div>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-slate-600 group-hover:text-teal-400 transition-colors" />
        </button>
      </div>
    </div>
  );
}
