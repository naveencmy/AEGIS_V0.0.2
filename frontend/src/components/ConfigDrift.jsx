import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  GitCompare,
  Plus,
  Minus,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  FileCode2,
} from 'lucide-react';
import { endpoints } from '../lib/api';
import { cn } from '../lib/utils';

const DRIFT_PRESETS = {
  cisco_drift: {
    vendor: 'cisco_ios',
    hostname: 'CORE-ROUTER-01',
    baseline: `hostname CORE-ROUTER-01
version 15.7
service password-encryption
aaa new-model
aaa authentication login default group tacacs+ local
line vty 0 15
 transport input ssh
 exec-timeout 10 0
access-list OUTSIDE_IN extended permit tcp 10.0.0.0 255.0.0.0 host 192.168.1.10 eq 443
access-list OUTSIDE_IN extended deny ip any any log
logging host 10.10.10.50`,
    current: `hostname CORE-ROUTER-01
version 15.7
no service password-encryption
aaa new-model
aaa authentication login default group tacacs+ local
telnet 0.0.0.0 0.0.0.0 outside
snmp-server community public RO
line vty 0 15
 transport input telnet ssh
 exec-timeout 10 0
access-list OUTSIDE_IN extended permit ip any any
logging host 10.10.10.50`,
  },
  fortinet_drift: {
    vendor: 'fortinet',
    hostname: 'FG-EDGE-FW',
    baseline: `config system global
    set hostname "FG-EDGE-FW"
    set admin-telnet disable
    set admin-https-redirect enable
end
config firewall policy
    edit 1
        set name "DMZ_INBOUND"
        set srcintf "wan1"
        set dstintf "dmz"
        set srcaddr "trusted_subnets"
        set dstaddr "web_servers"
        set action accept
        set service "HTTPS"
    next
end`,
    current: `config system global
    set hostname "FG-EDGE-FW"
    set admin-telnet enable
    set admin-https-redirect enable
end
config firewall policy
    edit 1
        set name "DMZ_INBOUND"
        set srcintf "wan1"
        set dstintf "dmz"
        set srcaddr "all"
        set dstaddr "all"
        set action accept
        set service "ALL"
    next
end`,
  },
};

export function ConfigDrift() {
  const [vendor, setVendor] = useState('cisco_ios');
  const [hostname, setHostname] = useState('CORE-ROUTER-01');
  const [baselineConfig, setBaselineConfig] = useState(DRIFT_PRESETS.cisco_drift.baseline);
  const [currentConfig, setCurrentConfig] = useState(DRIFT_PRESETS.cisco_drift.current);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleLoadPreset = (key) => {
    const preset = DRIFT_PRESETS[key];
    if (preset) {
      setVendor(preset.vendor);
      setHostname(preset.hostname);
      setBaselineConfig(preset.baseline);
      setCurrentConfig(preset.current);
      setReport(null);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const res = await endpoints.analyzeDrift({
        vendor,
        baseline_config: baselineConfig,
        current_config: currentConfig,
        hostname,
      });
      setReport(res.data);
    } catch (err) {
      console.error('Failed to analyze drift:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
              Configuration Drift &amp; Regression Analyzer
            </h1>
            <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
              AST Semantic Diff
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Detect unauthorized configuration modifications, line-level deltas, and newly introduced security compliance regressions.
          </p>
        </div>

        {/* Preset buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleLoadPreset('cisco_drift')}
            className="rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-indigo-500/40 transition-all"
          >
            Load Cisco Drift Sample
          </button>
          <button
            onClick={() => handleLoadPreset('fortinet_drift')}
            className="rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:border-indigo-500/40 transition-all"
          >
            Load Fortinet Drift Sample
          </button>
        </div>
      </div>

      {/* ── Inputs Card ── */}
      <div className="rounded-2xl border border-surface-border bg-surface-card/80 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Target Vendor</label>
            <select
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="cisco_ios">Cisco IOS / ASA</option>
              <option value="palo_alto">Palo Alto PAN-OS</option>
              <option value="fortinet">Fortinet FortiOS</option>
              <option value="juniper">Juniper JunOS</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Device Hostname</label>
            <input
              type="text"
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <FileCode2 className="h-3.5 w-3.5 text-indigo-400" />
                Baseline Approved Configuration
              </label>
              <span className="text-[10px] text-slate-500">Historical Checkpoint</span>
            </div>
            <textarea
              rows={10}
              value={baselineConfig}
              onChange={(e) => setBaselineConfig(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-surface-raised/80 p-3 font-mono text-xs text-slate-300 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-amber-400" />
                Current Running Configuration
              </label>
              <span className="text-[10px] text-slate-500">Latest Snapshot</span>
            </div>
            <textarea
              rows={10}
              value={currentConfig}
              onChange={(e) => setCurrentConfig(e.target.value)}
              className="w-full rounded-xl border border-surface-border bg-surface-raised/80 p-3 font-mono text-xs text-slate-300 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20"
          >
            <GitCompare className={cn('h-4 w-4', loading && 'animate-spin')} />
            {loading ? 'Analyzing Drift…' : 'Execute Drift Analysis'}
          </button>
        </div>
      </div>

      {/* ── Report Section ── */}
      {report && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-surface-border bg-surface-card/80 p-4">
              <div className="text-xs text-slate-500">Drift Severity</div>
              <div className={cn(
                'mt-2 text-2xl font-black font-mono',
                report.drift_severity === 'CRITICAL' ? 'text-red-400' :
                report.drift_severity === 'HIGH' ? 'text-amber-400' :
                report.drift_severity === 'MEDIUM' ? 'text-yellow-400' : 'text-emerald-400'
              )}>
                {report.drift_severity}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Overall Risk Classification
              </div>
            </div>

            <div className="rounded-xl border border-surface-border bg-surface-card/80 p-4">
              <div className="text-xs text-slate-500">Security Regressions</div>
              <div className="mt-2 text-2xl font-black font-mono text-red-400">
                {report.security_regressions_detected}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Violations Introduced
              </div>
            </div>

            <div className="rounded-xl border border-surface-border bg-surface-card/80 p-4">
              <div className="text-xs text-slate-500">Lines Added</div>
              <div className="mt-2 text-2xl font-black font-mono text-emerald-400">
                +{report.total_added_lines}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                New Directives
              </div>
            </div>

            <div className="rounded-xl border border-surface-border bg-surface-card/80 p-4">
              <div className="text-xs text-slate-500">Lines Removed</div>
              <div className="mt-2 text-2xl font-black font-mono text-slate-400">
                -{report.total_removed_lines}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Deleted Directives
              </div>
            </div>
          </div>

          {/* Semantic Regressions Cards */}
          {report.semantic_drift.length > 0 && (
            <div className="rounded-2xl border border-red-500/20 bg-surface-card/80 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-400" />
                Detected Security Regressions &amp; Violations
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.semantic_drift.map((s, idx) => (
                  <div key={idx} className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-red-500/20 border border-red-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-red-300 uppercase">
                        {s.severity} &bull; {s.category}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono font-medium">
                        {s.action}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium">
                      {s.description}
                    </p>
                    {s.remediation_advice && (
                      <div className="text-[11px] text-amber-300/90 bg-black/40 p-2 rounded-lg border border-surface-border">
                        <strong>Remediation:</strong> {s.remediation_advice}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unified Diff Viewer */}
          <div className="rounded-2xl border border-surface-border bg-surface-card/80 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <GitCompare className="h-4 w-4 text-indigo-400" />
              Line-by-Line Unified Diff
            </h3>

            <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface-raised font-mono text-xs">
              <div className="divide-y divide-surface-border/40">
                {report.line_diff.map((l, idx) => {
                  const isAdd = l.change_type === 'ADDED';
                  const isDel = l.change_type === 'REMOVED';
                  const hasImpact = l.security_impact && l.security_impact !== 'INFO' && l.security_impact !== 'LOW';

                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex items-center gap-3 px-3 py-1.5 transition-colors',
                        isAdd && hasImpact && 'bg-red-950/30 text-red-200 font-semibold',
                        isAdd && !hasImpact && 'bg-emerald-950/20 text-emerald-300',
                        isDel && 'bg-red-950/20 text-slate-400 line-through opacity-70',
                        !isAdd && !isDel && 'text-slate-400'
                      )}
                    >
                      <span className="w-8 text-[10px] text-slate-600 text-right select-none">
                        {l.line_number || ''}
                      </span>
                      <span className="w-4 select-none text-center font-bold">
                        {isAdd ? '+' : isDel ? '-' : ' '}
                      </span>
                      <span className="flex-1 truncate">{l.content}</span>
                      {l.security_impact && l.security_impact !== 'INFO' && (
                        <span className={cn(
                          'rounded px-1.5 py-0.5 text-[9px] font-bold font-sans uppercase shrink-0',
                          l.security_impact === 'CRITICAL' ? 'bg-red-500/20 text-red-300 border border-red-500/40' :
                          l.security_impact === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40'
                        )}>
                          {l.security_impact} RISK
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
