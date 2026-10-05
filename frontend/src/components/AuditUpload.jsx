import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Shield,
  Server,
  Wifi,
  FileCode2,
  Loader2,
  Check,
  ChevronRight,
} from 'lucide-react';
import { endpoints } from '../lib/api';
import { cn } from '../lib/utils';

const VENDORS = [
  { id: 'cisco_asa',   label: 'Cisco ASA',          sub: 'Adaptive Security Appliance', icon: Shield },
  { id: 'cisco_ios',   label: 'Cisco IOS / XE',     sub: 'Enterprise Routers & Switches', icon: Server },
  { id: 'palo_alto',   label: 'Palo Alto PAN-OS',   sub: 'Next-Gen Firewall XML',       icon: Wifi },
  { id: 'juniper',     label: 'Juniper JunOS',      sub: 'Security Gateways & Switches', icon: Cpu },
  { id: 'fortinet',    label: 'Fortinet FortiOS',   sub: 'FortiGate Security Fabric',   icon: Shield },
];

const FRAMEWORKS = [
  { id: 'nist_800_53_r5', label: 'NIST SP 800-53 Rev 5', sub: 'Federal & Defense — 1,000+ controls' },
  { id: 'cis_v8',         label: 'CIS Controls v8',       sub: 'IG1 / IG2 / IG3 — 153 Safeguards' },
  { id: 'iso27001_2022',  label: 'ISO/IEC 27001:2022',    sub: 'ISMS — Annex A Security Controls' },
  { id: 'pci_dss_4_0',    label: 'PCI-DSS v4.0',         sub: 'Payment Perimeter Network Defense' },
];

const SAMPLE_CONFIGS = {
  cisco_asa: `! Cisco ASA 9.x Running Configuration
hostname BORDER-FW-01
!
access-list OUTSIDE_IN extended permit ip any any
access-list MGMT_ACL extended permit tcp any any eq telnet
ssh 0.0.0.0 0.0.0.0 outside
telnet 192.168.1.0 255.255.255.0 inside
!
snmp-server community public RO
snmp-server community private RW
!
no service password-encryption
no logging enable
!
crypto isakmp policy 10
  encryption des
  hash md5
  authentication pre-share
  group 1
!
aaa authentication ssh console LOCAL
username admin privilege 15 password 0 admin123`,

  cisco_ios: `! Cisco IOS 15.x Running Configuration
hostname CORE-RTR-01
!
no service tcp-small-servers
no service udp-small-servers
no ip http server
no ip http secure-server
!
line vty 0 4
  transport input telnet
  password cisco
  login
!
ip access-list extended PERMIT_ALL
  permit ip any any
!
ntp server 0.0.0.0
snmp-server community public RO
!
banner motd ^
  UNAUTHORIZED ACCESS PROHIBITED
^`,

  palo_alto: `<?xml version="1.0" encoding="UTF-8"?>
<config version="10.2.0">
  <devices>
    <entry name="localhost.localdomain">
      <vsys><entry name="vsys1">
        <rulebase><security><rules>
          <entry name="ALLOW_ALL">
            <from><zone><member>untrust</member></zone></from>
            <to><zone><member>trust</member></zone></to>
            <source><member>any</member></source>
            <destination><member>any</member></destination>
            <application><member>any</member></application>
            <service><member>application-default</member></service>
            <action>allow</action>
          </entry>
        </rules></security></rulebase>
      </entry></vsys>
    </entry>
  </devices>
</config>`,
};

export function AuditUpload({ onAuditCreated }) {
  const [selectedVendor, setSelectedVendor] = useState('cisco_asa');
  const [deviceName, setDeviceName] = useState('BORDER-FW-01');
  const [inputMode, setInputMode] = useState('paste'); // 'paste' | 'file'
  const [configText, setConfigText] = useState(SAMPLE_CONFIGS.cisco_asa);
  const [file, setFile] = useState(null);
  const [selectedFrameworks, setSelectedFrameworks] = useState([
    'nist_800_53_r5',
    'cis_v8',
    'iso27001_2022',
    'pci_dss_4_0',
  ]);

  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const PROGRESS_STEPS = [
    'Parsing multi-vendor AST structure...',
    'Normalizing security rules & ACL parameters...',
    'Hybrid dense vector search (pgvector BGE-M3)...',
    'Reciprocal Rank Fusion & cross-encoder re-ranking...',
    'Mistral-7B GBNF grammar evaluation...',
    'Anchoring verified findings into evidence ledger...',
  ];

  const handleVendorSelect = (vendorId) => {
    setSelectedVendor(vendorId);
    if (SAMPLE_CONFIGS[vendorId]) {
      setConfigText(SAMPLE_CONFIGS[vendorId]);
      setDeviceName(vendorId === 'cisco_ios' ? 'CORE-RTR-01' : 'BORDER-FW-01');
    }
  };

  const handleFrameworkToggle = (fwId) => {
    setSelectedFrameworks((prev) =>
      prev.includes(fwId) ? prev.filter((id) => id !== fwId) : [...prev, fwId]
    );
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const processFile = (f) => {
    setFile(f);
    setDeviceName(f.name.replace(/\.[^/.]+$/, '').toUpperCase());
    const reader = new FileReader();
    reader.onload = (e) => setConfigText(e.target.result);
    reader.readAsText(f);
  };

  const handleExecuteAudit = async () => {
    if (!configText.trim() && !file) {
      setError('Please provide a configuration via paste or file upload.');
      return;
    }
    if (selectedFrameworks.length === 0) {
      setError('Please select at least one regulatory framework.');
      return;
    }

    setLoading(true);
    setError(null);
    setProgressStep(0);

    // Simulated progress timer while backend processes
    const stepInterval = setInterval(() => {
      setProgressStep((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      // 1. Upload device config
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        const blob = new Blob([configText], { type: 'text/plain' });
        formData.append('file', blob, `${deviceName.toLowerCase()}_config.txt`);
      }
      formData.append('vendor', selectedVendor);
      formData.append('device_name', deviceName || 'UNNAMED-APPLIANCE');

      const uploadRes = await endpoints.uploadDevice(formData);
      const deviceConfigId = uploadRes.data.device_config_id;

      // 2. Trigger Compliance Audit
      const auditRes = await endpoints.createAudit({
        device_config_id: deviceConfigId,
        frameworks: selectedFrameworks,
      });

      clearInterval(stepInterval);
      setProgressStep(PROGRESS_STEPS.length - 1);

      if (onAuditCreated) {
        onAuditCreated(auditRes.data.audit_job_id);
      }
    } catch (err) {
      clearInterval(stepInterval);
      console.error('Audit execution error:', err);
      setError(
        err.response?.data?.detail ||
          'Failed to execute compliance audit. Check backend connectivity.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ── 5-Step Progress Header ── */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {[
            { step: '01', label: 'DEVICE' },
            { step: '02', label: 'CONFIGURATION' },
            { step: '03', label: 'FRAMEWORKS' },
            { step: '04', label: 'AUDIT' },
            { step: '05', label: 'RESULTS' },
          ].map((item, idx) => (
            <React.Fragment key={item.step}>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono',
                    idx <= 2
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {item.step}
                </span>
                <span className="hidden sm:inline text-xs font-bold tracking-wider text-slate-700">
                  {item.label}
                </span>
              </div>
              {idx < 4 && <ChevronRight className="w-4 h-4 text-slate-300" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Pre-Audit Directives & Highlighted Scope ── */}
      <div className="cyber-point-card bg-gradient-to-r from-cyan-50/50 via-white to-blue-50/30 border border-cyan-200/90 shadow-sm rounded-xl p-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-cyan-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Audit Execution Directives & Scope
            </span>
          </div>
          <span className="cyber-key-pill text-[10px]">
            ★ CORE WORKBENCH RULES
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div className="cyber-bullet-item text-slate-700">
            <strong className="text-slate-950 font-bold bg-cyan-100/70 px-1.5 py-0.5 rounded border border-cyan-300 mr-1.5">
              ★ MAIN RULE:
            </strong>
            Input raw vendor running configurations. Passwords, hashes, and secrets are evaluated for cryptographic weakness strictly inside the air-gapped boundary.
          </div>
          <div className="cyber-bullet-item text-slate-700">
            <strong className="text-slate-950 font-bold bg-cyan-100/70 px-1.5 py-0.5 rounded border border-cyan-300 mr-1.5">
              ★ REASONING GATE:
            </strong>
            Violations are strictly validated by local Mistral-7B GBNF grammar constraints against ingested regulatory standards with zero hallucination.
          </div>
        </div>
      </div>

      {/* ── 01: Vendor Appliance Selection ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            01. Select Network Appliance & Vendor Platform
          </label>
          <span className="text-xs text-cyan-700 font-semibold flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            Deterministic AST Parsing
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {VENDORS.map((v) => {
            const Icon = v.icon;
            const isSelected = selectedVendor === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => handleVendorSelect(v.id)}
                className={cn(
                  'rounded-xl border p-4 text-left transition-all relative flex flex-col justify-between shadow-sm',
                  isSelected
                    ? 'border-cyan-500 bg-cyan-50/70 ring-1 ring-cyan-500 shadow-cyber-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Icon
                      className={cn(
                        'w-5 h-5',
                        isSelected ? 'text-cyan-600' : 'text-slate-400'
                      )}
                    />
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-slate-900 text-xs">{v.label}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{v.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 02: Configuration Input ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            02. Network Configuration Payload
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Quick Samples:</span>
            <button
              onClick={() => handleVendorSelect('cisco_asa')}
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded border border-brand-200"
            >
              Cisco ASA
            </button>
            <button
              onClick={() => handleVendorSelect('cisco_ios')}
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded border border-brand-200"
            >
              Cisco IOS
            </button>
            <button
              onClick={() => handleVendorSelect('palo_alto')}
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded border border-brand-200"
            >
              Palo Alto XML
            </button>
          </div>
        </div>

        {/* Input Format Mode Toggle & Device Identifier */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-t-xl border border-b-0 border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInputMode('paste')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                inputMode === 'paste'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              Paste Configuration
            </button>
            <button
              type="button"
              onClick={() => setInputMode('file')}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-colors',
                inputMode === 'file'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              Upload File (.txt, .conf, .xml)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Device Name:</span>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="e.g. BORDER-FW-01"
              className="text-xs font-mono font-semibold px-2.5 py-1 rounded border border-slate-300 bg-slate-50 focus:bg-white text-slate-900 w-44"
            />
          </div>
        </div>

        {/* Editor Body */}
        {inputMode === 'paste' ? (
          <div className="rounded-b-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>ACTIVE INPUT BUFFER</span>
              <span>{configText.split('\n').length} lines · {configText.length} bytes</span>
            </div>
            <textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              rows={14}
              placeholder="Paste raw router or firewall configuration here..."
              className="w-full p-4 bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-y selection:bg-brand-600 selection:text-white"
              spellCheck={false}
            />
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'rounded-b-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all bg-white',
              dragOver ? 'border-brand-500 bg-brand-50/50' : 'border-slate-300 hover:border-slate-400'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.conf,.cfg,.xml"
              className="hidden"
              onChange={(e) => e.target.files[0] && processFile(e.target.files[0])}
            />
            <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-800">
              {file ? file.name : 'Click to select or drag and drop network configuration'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supports Cisco running-config, Palo Alto XML export, JunOS flat set syntax, FortiOS full-config
            </p>
          </div>
        )}
      </div>

      {/* ── 03: Framework Selection ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            03. Target Regulatory Frameworks & Standards
          </label>
          <span className="text-xs text-cyan-700 font-semibold font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
            PostgreSQL pgvector Grounded
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {FRAMEWORKS.map((fw) => {
            const isChecked = selectedFrameworks.includes(fw.id);
            return (
              <div
                key={fw.id}
                onClick={() => handleFrameworkToggle(fw.id)}
                className={cn(
                  'rounded-xl border p-4 cursor-pointer transition-all flex items-start justify-between shadow-sm select-none',
                  isChecked
                    ? 'border-cyan-500 bg-cyan-50/70 ring-1 ring-cyan-500 shadow-cyber-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">{fw.label}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{fw.sub}</div>
                </div>

                <div
                  className={cn(
                    'w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 border transition-colors',
                    isChecked
                      ? 'bg-cyan-600 border-cyan-600 text-white'
                      : 'border-slate-300 bg-white'
                  )}
                >
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Active Execution Step Tracker (When Loading) ── */}
      {loading && (
        <div className="rounded-xl border border-cyan-300 bg-cyan-50/80 p-5 shadow-cyber-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-950">
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-cyan-600 animate-spin" />
              Sovereign Compliance Reasoning in Progress
            </span>
            <span className="font-mono font-bold text-cyan-800">{progressStep + 1} / {PROGRESS_STEPS.length}</span>
          </div>

          <div className="h-2 rounded-full bg-cyan-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 transition-all duration-500 rounded-full"
              style={{ width: `${((progressStep + 1) / PROGRESS_STEPS.length) * 100}%` }}
            />
          </div>

          <div className="text-xs font-mono text-cyan-900 font-semibold">
            → {PROGRESS_STEPS[progressStep]}
          </div>
        </div>
      )}

      {/* ── Execute Action Button ── */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          Target Appliance: <strong className="text-slate-800 font-mono">{deviceName}</strong> · Frameworks:{' '}
          <strong className="text-cyan-700 font-bold">{selectedFrameworks.length} Selected</strong>
        </div>

        <button
          onClick={handleExecuteAudit}
          disabled={loading || (!configText.trim() && !file)}
          className={cn(
            'inline-flex items-center gap-2.5 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all',
            loading || (!configText.trim() && !file)
              ? 'bg-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-brand-600 via-cyan-600 to-brand-700 hover:from-brand-700 hover:via-cyan-700 hover:to-brand-800 hover:shadow-cyber-sm hover:scale-[1.01]'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Evaluating Configuration...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" /> RUN SOVEREIGN COMPLIANCE AUDIT
            </>
          )}
        </button>
      </div>
    </div>
  );
}
