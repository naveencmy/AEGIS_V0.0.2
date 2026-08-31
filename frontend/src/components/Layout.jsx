import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cpu,
  Database,
  Search,
  Upload,
  MessageSquare,
  BookOpen,
  History,
  Activity,
  Lock,
} from 'lucide-react';
import { endpoints } from '../lib/api';
import { cn } from '../lib/utils';

export function Layout({ activeTab, onTabChange, children }) {
  const [healthStatus, setHealthStatus] = useState('checking');

  useEffect(() => {
    endpoints
      .health()
      .then((res) => {
        setHealthStatus(res.data.status === 'ok' ? 'online' : 'degraded');
      })
      .catch(() => setHealthStatus('offline'));
  }, []);

  const navItems = [
    { id: 'audit', label: 'Compliance Audit', icon: Upload },
    { id: 'query', label: 'RAG Assistant', icon: MessageSquare },
    { id: 'reports', label: 'Audit History', icon: History },
    { id: 'frameworks', label: 'Standards Explorer', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-obsidian text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-indigo-500/20 bg-obsidian/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo / Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-lg shadow-indigo-500/20">
                <ShieldCheck className="h-6 w-6 text-white stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold tracking-wider bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                    AEGIS-NTRO
                  </span>
                  <span className="rounded bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 text-[10px] font-bold text-indigo-400">
                    v2.0.0-RC1
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Sovereign Network Compliance Auditor &bull; NTRO SIH26155
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-obsidian-card/60 p-1 backdrop-blur-sm">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Sovereign & DB Status Badges */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-obsidian-card px-2.5 py-1 text-[11px] font-mono text-slate-300">
                <Database className="h-3 w-3 text-cyan-400" />
                <span>PostgreSQL 16 + pgvector</span>
              </div>

              <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-obsidian-card px-2.5 py-1 text-[11px] font-medium">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    healthStatus === 'online'
                      ? "bg-emerald-400 animate-pulse"
                      : healthStatus === 'degraded'
                      ? "bg-yellow-400"
                      : "bg-red-400"
                  )}
                />
                <span className="text-slate-300 capitalize">{healthStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around border-t border-slate-800/80 bg-obsidian/95 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg p-2 text-[10px] font-medium",
                  isActive ? "text-indigo-400" : "text-slate-400"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-indigo-500/10 bg-obsidian-card/40 py-4 text-center text-xs text-slate-500 print:hidden">
        <div className="mx-auto max-w-7xl px-4 flex flex-wrap items-center justify-between gap-2">
          <span>Target: SIH26155 &bull; Organization: NTRO &bull; Theme: Blockchain & Cybersecurity</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Lock className="h-3 w-3 text-indigo-400" />
            100% Air-Gapped Sovereign Execution
          </span>
        </div>
      </footer>
    </div>
  );
}
