import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  Upload,
  FileCheck,
  MessageSquare,
  GitCompare,
  Blocks,
  BookOpen,
  Menu,
  X,
  ExternalLink,
  Cpu,
  Database,
  CheckCircle2,
  ChevronRight,
  User,
  Home,
  FileText,
  FileCode,
  Sparkles,
  Radio,
} from 'lucide-react';
import { endpoints } from '../lib/api';
import { cn } from '../lib/utils';
import { CyberBackground } from './CyberBackground';

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'COMMAND CENTER',     icon: LayoutDashboard, title: 'Executive Command Center' },
  { id: 'audit',         label: 'AUDIT WORKBENCH',    icon: Upload,          title: 'Multi-Vendor Audit Workbench' },
  { id: 'reports',       label: 'COMPLIANCE REPORTS', icon: FileCheck,       title: 'Compliance Reports & Evidence' },
  { id: 'query',         label: 'RAG ASSISTANT',      icon: MessageSquare,   title: 'Sovereign Regulatory Intelligence' },
  { id: 'drift',         label: 'CONFIG DRIFT',       icon: GitCompare,      title: 'Configuration Drift & Regression' },
  { id: 'blockchain',    label: 'EVIDENCE LEDGER',    icon: Blocks,          title: 'Blockchain Evidence Ledger' },
  { id: 'frameworks',    label: 'KNOWLEDGE BASE',     icon: BookOpen,        title: 'Regulatory Knowledge Base' },
  { id: 'documentation', label: 'SYSTEM DOCS',        icon: FileCode,        title: 'System Documentation & API Reference' },
];

export function Layout({ activeTab, onTabChange, children }) {
  const [healthStatus, setHealthStatus] = useState('online');
  const [healthData, setHealthData] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    endpoints
      .health()
      .then((res) => {
        setHealthData(res.data);
        setHealthStatus(res.data.status === 'ok' ? 'online' : 'degraded');
      })
      .catch(() => setHealthStatus('offline'));
  }, []);

  const activeItem = NAV_ITEMS.find((n) => n.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]/80 text-slate-900 font-sans selection:bg-cyan-100 selection:text-cyan-900 relative">
      {/* ── Cyber Defense Animated Mesh Background ── */}
      <CyberBackground />

      {/* ── Left Sidebar (248px) ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white/95 backdrop-blur-md border-r border-slate-200/90 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 shadow-sm',
          mobileOpen ? 'translate-x-0 shadow-elevated' : '-translate-x-full'
        )}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-white via-cyan-50/30 to-white">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onTabChange('dashboard')}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5 text-cyan-100" />
                </div>
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-white animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-slate-950 flex items-center gap-1.5">
                  AEGIS-NTRO
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-100 text-cyan-800 font-bold border border-cyan-300/60">
                    CYBER
                  </span>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-1">
                  Sovereign Security
                </div>
              </div>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-700"
              aria-label="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="p-3 space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
              <span>Navigation</span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === 'reports' && activeTab === 'report_view');

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all text-left relative',
                    isActive
                      ? 'bg-gradient-to-r from-brand-50 to-cyan-50/70 text-slate-950 font-bold border-l-4 border-cyan-500 rounded-l-none shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 shrink-0 transition-colors',
                      isActive ? 'text-cyan-600 stroke-[2.2]' : 'text-slate-400'
                    )}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Sidebar: System Telemetry & User */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
          <div className="rounded-lg bg-white border border-slate-200 p-2.5 text-[11px] space-y-1.5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span>System Mode</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Air-Gapped
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span>Local AI Engine</span>
              <span className="font-mono text-slate-800 font-bold text-[10px]">Mistral-7B Q4</span>
            </div>
            <div className="flex items-center justify-between text-slate-500 font-medium">
              <span>Database Engine</span>
              <span className="font-mono text-slate-800 font-bold text-[10px]">PostgreSQL 16</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                AU
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900 leading-tight">Auditor Session</div>
                <div className="text-[10px] text-slate-500 font-mono">ID: 01-SOVEREIGN</div>
              </div>
            </div>

            <button
              onClick={() => onTabChange('landing')}
              title="Return to Product Overview"
              className="p-1.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
              aria-label="Product Landing"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Overlay for Mobile ── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ── Main Fluid Container ── */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Header (64px) */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Open Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span>AEGIS-NTRO</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-cyan-700 font-semibold">{activeItem.label}</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-950 tracking-tight leading-tight flex items-center gap-2">
                {activeItem.title}
              </h1>
            </div>
          </div>

          {/* Compact Telemetry Status Indicators & Quick Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => onTabChange('blockchain')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border shadow-2xs',
                activeTab === 'blockchain'
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-cyan-700 hover:border-cyan-300'
              )}
              title="Inspect Cryptographic Evidence Ledger"
            >
              <Blocks className="w-3.5 h-3.5 text-cyan-600" />
              <span>Evidence</span>
            </button>

            <button
              onClick={() => onTabChange('documentation')}
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border shadow-2xs',
                activeTab === 'documentation'
                  ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-bold'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-cyan-700 hover:border-cyan-300'
              )}
              title="System Technical Documentation & OpenAPI"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-600" />
              <span>Docs</span>
            </button>

            <div className="w-px h-5 bg-slate-200 mx-1" />

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50/90 border border-cyan-200 text-[11px] font-semibold text-cyan-900 shadow-sm">
              <Radio className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              <span>CYBER SHIELD</span>
              <span className="font-bold text-cyan-700 font-mono">ACTIVE</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>AIR-GAP</span>
              <span className="font-bold text-emerald-700">ONLINE</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700 shadow-xs">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>API</span>
              <span className={cn('font-bold', healthStatus === 'online' ? 'text-emerald-700' : 'text-amber-700')}>
                {healthStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="relative z-10 flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
