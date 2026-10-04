import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Database,
  Upload,
  MessageSquare,
  BookOpen,
  History,
  Lock,
  Cpu,
  Activity,
  GitCompare,
  LayoutDashboard,
  ChevronRight,
  Menu,
  X,
  Link as ChainIcon,
} from 'lucide-react';
import { endpoints } from '../lib/api';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Command Center',     icon: LayoutDashboard, shortLabel: 'Dashboard' },
  { id: 'audit',       label: 'Compliance Audit',   icon: Upload,          shortLabel: 'Audit'     },
  { id: 'query',       label: 'RAG Assistant',      icon: MessageSquare,   shortLabel: 'Assistant' },
  { id: 'drift',       label: 'Drift Monitor',      icon: GitCompare,      shortLabel: 'Drift'     },
  { id: 'blockchain',  label: 'Blockchain Ledger',  icon: ChainIcon,       shortLabel: 'Blockchain'},
  { id: 'reports',     label: 'Audit History',      icon: History,         shortLabel: 'History'   },
  { id: 'frameworks',  label: 'Standards Explorer', icon: BookOpen,        shortLabel: 'Standards' },
];

function StatusDot({ status }) {
  const color =
    status === 'online'   ? 'bg-green-400 shadow-[0_0_6px_#22c55e]' :
    status === 'degraded' ? 'bg-yellow-400 shadow-[0_0_6px_#facc15]' :
                            'bg-red-400   shadow-[0_0_6px_#f87171]';
  return (
    <span
      aria-label={`System status: ${status}`}
      className={cn('inline-block h-2 w-2 rounded-full animate-pulse-slow', color)}
    />
  );
}

export function Layout({ activeTab, onTabChange, children }) {
  const [healthStatus, setHealthStatus]   = useState('checking');
  const [healthData,   setHealthData]     = useState(null);
  const [mobileOpen,   setMobileOpen]     = useState(false);

  useEffect(() => {
    endpoints
      .health()
      .then((res) => {
        setHealthData(res.data);
        setHealthStatus(res.data.status === 'ok' ? 'online' : 'degraded');
      })
      .catch(() => setHealthStatus('offline'));
  }, []);

  const handleTabChange = (id) => {
    onTabChange(id);
    setMobileOpen(false);
  };

  const activeItem = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#020817] text-slate-100 selection:bg-indigo-500/40 selection:text-white">

      {/* ─── Top Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass border-b border-surface-border">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between gap-4">

            {/* Brand */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/30">
                <ShieldCheck className="h-5 w-5 text-white stroke-[2.2]" />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-[#020817]" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-black tracking-widest uppercase bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                    AEGIS
                  </span>
                  <span className="text-xs font-bold tracking-widest uppercase text-slate-500">NTRO</span>
                  <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 text-[9px] font-bold text-indigo-400 tracking-wider">
                    v2.0
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 font-medium tracking-wide uppercase">
                  Sovereign Network Compliance &bull; SIH26155
                </div>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav
              className="hidden md:flex items-center gap-0.5 rounded-xl border border-surface-border bg-surface-raised/60 p-1 backdrop-blur-sm"
              aria-label="Primary navigation"
            >
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id || (activeTab === 'report_view' && item.id === 'audit');
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'text-slate-400 hover:bg-surface-muted hover:text-slate-200'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Status cluster */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-card px-2.5 py-1 text-[11px] font-mono text-slate-400">
                <Database className="h-3 w-3 text-teal-400" aria-hidden="true" />
                <span>pgvector</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-card px-2.5 py-1 text-[11px] font-mono text-slate-400">
                <ChainIcon className="h-3 w-3 text-purple-400" aria-hidden="true" />
                <span>SHA-256 Ledger</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-surface-border bg-surface-card px-2.5 py-1 text-[11px] font-medium">
                <StatusDot status={healthStatus} />
                <span className="text-slate-300 capitalize">{healthStatus === 'checking' ? '…' : healthStatus}</span>
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden rounded-lg border border-surface-border bg-surface-card p-1.5 text-slate-400 hover:text-white"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-surface-border bg-surface-raised animate-fade-in">
            <nav className="p-3 space-y-1" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:bg-surface-muted hover:text-white'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                    {isActive && <ChevronRight className="ml-auto h-4 w-4 opacity-60" />}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* ─── Breadcrumb bar ─────────────────────────────────────────────── */}
      <div className="border-b border-surface-border/50 bg-surface-raised/40">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 py-1.5 flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-3 w-3 text-indigo-400 shrink-0" aria-hidden="true" />
          <span className="font-medium text-slate-400">AEGIS-NTRO</span>
          <ChevronRight className="h-3 w-3" aria-hidden="true" />
          <span className="text-slate-300 font-semibold">{activeItem.label}</span>
        </div>
      </div>

      {/* ─── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 mx-auto max-w-[1440px] w-full px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="no-print border-t border-surface-border/50 bg-surface-raised/30 py-3">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
          <span>Target: SIH26155 &bull; Organization: NTRO &bull; Theme: Blockchain &amp; Cybersecurity</span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <Lock className="h-3 w-3 text-indigo-500" aria-hidden="true" />
            <span>100% Air-Gapped Sovereign Execution &bull; Apache 2.0</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
