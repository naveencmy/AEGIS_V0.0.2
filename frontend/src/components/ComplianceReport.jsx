import React, { useState } from 'react';
import {
  Printer,
  Download,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  CheckCircle,
  Activity,
  ArrowLeft,
} from 'lucide-react';
import { FindingTable } from './FindingTable';
import { formatDate, cn } from '../lib/utils';

export function ComplianceReport({ auditData, onBack }) {
  if (!auditData) return null;

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
    findings = [],
  } = auditData;

  const handlePrintPDF = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `AEGIS_Audit_Report_${id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Determine health color from score
  const getScoreColor = (score) => {
    if (score >= 85) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    if (score >= 60) return "text-yellow-400 border-yellow-500/40 bg-yellow-500/10";
    return "text-red-400 border-red-500/40 bg-red-500/10";
  };

  return (
    <div className="space-y-6">
      {/* Report Header and Export Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-obsidian-card p-2 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-slate-100">
                Compliance Audit Report
              </h2>
              <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400">
                v2.0.0-RC1
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Audit Run ID: <span className="font-mono text-slate-300">{id}</span> &bull; Completed: {formatDate(completed_at || started_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-obsidian-card px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-indigo-500 hover:text-white transition-all shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-500/20"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Executive Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Compliance Score Card */}
        <div className="lg:col-span-2 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-obsidian-card to-indigo-950/30 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Compliance Posture
            </span>
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className={cn("text-4xl font-extrabold tracking-tight", getScoreColor(compliance_score_percent).split(" ")[0])}>
              {compliance_score_percent}%
            </span>
            <span className="text-xs font-medium text-slate-400">
              {compliance_score_percent >= 85 ? "Compliant" : compliance_score_percent >= 60 ? "Remediation Advised" : "High Non-Compliance"}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                compliance_score_percent >= 85 ? "bg-emerald-500" : compliance_score_percent >= 60 ? "bg-yellow-500" : "bg-red-500"
              )}
              style={{ width: `${compliance_score_percent}%` }}
            />
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Audited Standards: {framework_filter.join(', ') || 'NIST 800-53 Rev 5'}
          </p>
        </div>

        {/* Total Findings */}
        <div className="rounded-xl border border-slate-800 bg-obsidian-card/70 p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Findings</div>
          <div className="mt-2 text-2xl font-bold text-slate-100">{total_findings}</div>
          <div className="mt-1 text-[11px] text-slate-500">Violations identified</div>
        </div>

        {/* Critical Card */}
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-red-400">Critical</div>
          <div className="mt-2 text-2xl font-bold text-red-400">{critical_count}</div>
          <div className="mt-1 text-[11px] text-red-300/70">Immediate exploit risk</div>
        </div>

        {/* High Card */}
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-orange-400">High</div>
          <div className="mt-2 text-2xl font-bold text-orange-400">{high_count}</div>
          <div className="mt-1 text-[11px] text-orange-300/70">Significant perimeter exposure</div>
        </div>

        {/* Medium & Low Card */}
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-yellow-400">Medium / Low</div>
          <div className="mt-2 text-2xl font-bold text-yellow-400">{medium_count + low_count}</div>
          <div className="mt-1 text-[11px] text-yellow-300/70">{medium_count} med &bull; {low_count} low</div>
        </div>
      </div>

      {/* Cited Findings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-indigo-400" />
            <span>Detailed Regulatory Audit Findings ({findings.length})</span>
          </h3>
        </div>

        <FindingTable findings={findings} />
      </div>
    </div>
  );
}
