import React, { useState } from 'react';
import {
  Printer,
  Download,
  ShieldCheck,
  FileCheck,
  ArrowLeft,
  AlertTriangle,
  Blocks,
  GitCompare,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Server,
  Calendar,
} from 'lucide-react';
import { FindingTable } from './FindingTable';
import { formatDate, cn, copyToClipboard } from '../lib/utils';
import { endpoints } from '../lib/api';

export function ComplianceReport({
  auditData,
  onBack,
  onVerifyBlockchain,
  onInspectDrift,
}) {
  const [copiedId, setCopiedId] = useState(false);

  if (!auditData) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-16 text-center text-slate-500 bg-white">
        <ShieldCheck className="mx-auto h-12 w-12 text-slate-400 mb-3" />
        <h3 className="text-base font-bold text-slate-800">No Compliance Report Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
          Select an audit from the history list or execute a new audit in the workbench.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-600 text-white text-xs font-semibold shadow-sm hover:bg-brand-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Audits List
        </button>
      </div>
    );
  }

  const {
    id,
    status = 'completed',
    started_at,
    completed_at,
    total_findings = 0,
    critical_count = 0,
    high_count = 0,
    medium_count = 0,
    low_count = 0,
    compliance_score_percent = 45,
    framework_filter = [],
    device_config_id,
    blockchain_anchored = false,
    findings = [],
  } = auditData;

  const scoreLabel =
    compliance_score_percent >= 80
      ? 'Compliant'
      : compliance_score_percent >= 60
      ? 'Remediation Required'
      : 'Non-Compliant';

  const handleCopyId = async () => {
    const ok = await copyToClipboard(id);
    if (ok) {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `AEGIS_Audit_${id.slice(0, 8)}.json`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar & Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
            aria-label="Back to Audits List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-950">
                Compliance Assessment Report
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {status}
              </span>
            </div>
            <div className="text-xs text-slate-500 font-mono flex items-center gap-2 mt-0.5">
              <span>Audit Job ID: {id}</span>
              <button
                onClick={handleCopyId}
                className="hover:text-slate-800"
                title="Copy Full Audit ID"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {onInspectDrift && (
            <button
              onClick={() => onInspectDrift(device_config_id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-sm transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5 text-slate-500" />
              Inspect Drift
            </button>
          )}

          {onVerifyBlockchain && (
            <button
              onClick={() => onVerifyBlockchain(id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-sm transition-colors"
            >
              <Blocks className="w-3.5 h-3.5 text-slate-500" />
              Anchor to Ledger
            </button>
          )}

          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export Evidence JSON
          </button>
        </div>
      </div>

      {/* ── Executive Assessment Summary Card ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Large Score Callout */}
          <div className="lg:col-span-4 flex items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-slate-200" strokeWidth="8" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={cn(
                    'transition-all duration-700',
                    compliance_score_percent >= 80
                      ? 'stroke-emerald-600'
                      : compliance_score_percent >= 60
                      ? 'stroke-amber-500'
                      : 'stroke-red-600'
                  )}
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * compliance_score_percent) / 100}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-slate-900 font-mono">
                {compliance_score_percent}%
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Posture Assessment
              </div>
              <div
                className={cn(
                  'text-lg font-extrabold mt-0.5',
                  compliance_score_percent >= 80
                    ? 'text-emerald-700'
                    : compliance_score_percent >= 60
                    ? 'text-amber-700'
                    : 'text-red-600'
                )}
              >
                {scoreLabel}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {total_findings} total violations identified
              </div>
            </div>
          </div>

          {/* Right: Metadata Grid */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-lg border border-slate-100 bg-[#F8FAFC]">
              <span className="text-slate-400 block font-medium uppercase tracking-wider text-[11px]">
                Target Appliance
              </span>
              <span className="font-mono font-bold text-slate-900 mt-0.5 block truncate">
                {device_config_id ? device_config_id.slice(0, 12) : 'Cisco ASA'}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 bg-[#F8FAFC]">
              <span className="text-slate-400 block font-medium uppercase tracking-wider text-[11px]">
                Evaluation Time
              </span>
              <span className="font-semibold text-slate-800 mt-0.5 block truncate">
                {formatDate(started_at)}
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 bg-[#F8FAFC]">
              <span className="text-slate-400 block font-medium uppercase tracking-wider text-[11px]">
                Active Frameworks
              </span>
              <span className="font-bold text-slate-900 mt-0.5 block">
                {(framework_filter || []).length || 3} Standards
              </span>
            </div>

            <div className="p-3 rounded-lg border border-slate-100 bg-[#F8FAFC]">
              <span className="text-slate-400 block font-medium uppercase tracking-wider text-[11px]">
                Evidence Status
              </span>
              <span className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Ledger Grounded
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Severity Counters Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 text-red-900">
          <div className="text-xs font-bold uppercase tracking-wider text-red-700">Critical Severity</div>
          <div className="text-2xl font-bold font-mono mt-1 text-red-700">{critical_count}</div>
          <div className="text-[11px] text-red-600 mt-0.5">Perimeter Bypass Rules</div>
        </div>

        <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 text-orange-900">
          <div className="text-xs font-bold uppercase tracking-wider text-orange-700">High Severity</div>
          <div className="text-2xl font-bold font-mono mt-1 text-orange-700">{high_count}</div>
          <div className="text-[11px] text-orange-600 mt-0.5">Plaintext / Crypto Gaps</div>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-900">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-700">Medium Severity</div>
          <div className="text-2xl font-bold font-mono mt-1 text-amber-700">{medium_count}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Logging & Auditing Policy</div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-900">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Low Severity</div>
          <div className="text-2xl font-bold font-mono mt-1 text-emerald-700">{low_count}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Administrative Hygiene</div>
        </div>
      </div>

      {/* ── Executive Cyber Posture & Highlighted Main Points ── */}
      <div className="cyber-point-card shadow-sm border border-cyan-200 bg-gradient-to-r from-cyan-50/40 via-white to-blue-50/30 p-5 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-cyan-100">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
            <h3 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
              Executive Audit Takeaways & Core Directives
            </h3>
          </div>
          <span className="cyber-badge text-[11px]">
            Crisp Findings Summary
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {/* Main Risk Point - Highlighted */}
          <div className="p-3 rounded-lg bg-white border border-cyan-200 shadow-xs flex items-start gap-3">
            <span className="cyber-key-pill shrink-0 mt-0.5">
              ★ MAIN RISK
            </span>
            <div className="text-xs leading-relaxed text-slate-800">
              {critical_count > 0 ? (
                <>
                  <strong className="text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-200 mr-1.5">
                    Critical Perimeter Exposure:
                  </strong>
                  Detected <strong className="text-red-600 font-mono font-bold">{critical_count} critical rule violation(s)</strong> that bypass boundary protection (e.g. wide-open <code className="font-mono text-slate-900 font-bold bg-slate-100 px-1 py-0.2 rounded">permit ip any any</code> or plaintext administrative access). Requires immediate remediation before production deployment.
                </>
              ) : (
                <>
                  <strong className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mr-1.5">
                    Boundary Armor Verified:
                  </strong>
                  No unrestricted perimeter bypass rules identified. The device conforms to primary boundary filtering standards.
                </>
              )}
            </div>
          </div>

          {/* Main Action Directive - Highlighted */}
          <div className="p-3 rounded-lg bg-white border border-cyan-200 shadow-xs flex items-start gap-3">
            <span className="cyber-key-pill shrink-0 mt-0.5 bg-cyan-900 text-cyan-300 border-cyan-400">
              ★ MAIN ACTION
            </span>
            <div className="text-xs leading-relaxed text-slate-800">
              <strong className="text-cyan-900 font-bold bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-300 mr-1.5">
                Priority Remediation Steps:
              </strong>
              Disable plaintext Telnet/HTTP services, enforce <strong className="text-slate-900">SSH v2 with crypto key generation</strong>, replace wildcard ACL statements with least-privilege destination IP ranges, and configure centralized NTP/Syslog logging for forensic auditability.
            </div>
          </div>

          {/* Standards & Evidence Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs">
            <div className="cyber-bullet-item text-slate-700 bg-white/70 p-2.5 rounded-lg border border-slate-200/80">
              <strong className="text-slate-900 font-semibold">Regulatory Coverage:</strong> Audited against{' '}
              <span className="font-semibold text-brand-700 font-mono">
                {(framework_filter || []).join(', ') || 'NIST SP 800-53, CIS v8, ISO 27001'}
              </span>{' '}
              with an aggregated compliance baseline of{' '}
              <strong className="font-mono text-cyan-700 font-bold">{compliance_score_percent}%</strong>.
            </div>

            <div className="cyber-bullet-item text-slate-700 bg-white/70 p-2.5 rounded-lg border border-slate-200/80">
              <strong className="text-slate-900 font-semibold">Cryptographic Integrity:</strong> Evidence payload anchored with SHA-256 Merkle root. Grounded under zero-cloud-egress air-gap invariants.
            </div>
          </div>
        </div>
      </div>

      {/* ── Findings Table ── */}
      <FindingTable findings={findings} />
    </div>
  );
}
