import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  X,
  ChevronDown,
  ChevronRight,
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
} from 'lucide-react';
import { endpoints } from '../lib/api';
import { cn } from '../lib/utils';

/* ─── Static config ─────────────────────────────────────────────────── */
const VENDORS = [
  { id: 'cisco_ios',   label: 'Cisco IOS',         icon: Server, color: 'text-blue-400'   },
  { id: 'cisco_asa',   label: 'Cisco ASA',          icon: Shield, color: 'text-blue-300'   },
  { id: 'palo_alto',   label: 'Palo Alto PAN-OS',   icon: Wifi,   color: 'text-orange-400' },
  { id: 'juniper',     label: 'Juniper JunOS',      icon: Cpu,    color: 'text-teal-400'   },
  { id: 'fortinet',    label: 'Fortinet FortiOS',   icon: Shield, color: 'text-red-400'    },
];

const FRAMEWORKS = [
  { id: 'nist_800_53_r5', label: 'NIST SP 800-53 Rev 5', sub: 'Federal & Defense — 1,000+ controls' },
  { id: 'cis_v8',         label: 'CIS Controls v8',       sub: 'IG1/IG2/IG3 — 153 Safeguards'       },
  { id: 'iso27001_2022',  label: 'ISO/IEC 27001:2022',    sub: 'ISMS — Annex A Controls'             },
  { id: 'pci_dss_4_0',    label: 'PCI-DSS v4.0',         sub: 'Payment — Requirements 1–12'         },
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

  juniper: `set system host-name EDGE-FW-01
set system root-authentication plain-text-password-value juniper123
set system services telnet
set system services ssh protocol-version v1
set system ntp server 0.0.0.0
set security zones security-zone untrust interfaces ge-0/0/0.0 host-inbound-traffic system-services all
set firewall family inet filter PERMIT-ALL term permit-all then accept
set security policies from-zone untrust to-zone trust policy allow-all match source-address any
set security policies from-zone untrust to-zone trust policy allow-all match destination-address any
set security policies from-zone untrust to-zone trust policy allow-all then permit`,

  fortinet: `config system global
    set hostname FORTIGATE-01
    set admin-telnet enable
    set admin-ssh-port 22
end
config firewall policy
    edit 1
        set name "PERMIT_ALL"
        set srcintf "wan1"
        set dstintf "internal"
        set srcaddr "all"
        set dstaddr "all"
        set action accept
        set schedule "always"
        set service "ALL"
        set logtraffic all
    next
end
config system snmp community
    edit 1
        set name "public"
        set status enable
    next
end`,
};

/* ─── Component ─────────────────────────────────────────────────────── */
export function AuditUpload({ onAuditCreated }) {
  const [vendor,          setVendor]          = useState('cisco_asa');
  const [selectedFws,     setSelectedFws]     = useState(['nist_800_53_r5']);
  const [configText,      setConfigText]      = useState('');
  const [uploadedFile,    setUploadedFile]    = useState(null);
  const [isDragging,      setIsDragging]      = useState(false);
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [uploadStage,     setUploadStage]     = useState('');
  const [error,           setError]           = useState(null);

  const fileInputRef = useRef(null);

  /* Drag-and-drop handlers */
  const onDragOver  = (e) => { e.preventDefault(); setIsDragging(true);  };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop      = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleFileSelect = (file) => {
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setConfigText(e.target.result || '');
    reader.readAsText(file);
  };

  const toggleFramework = (id) => {
    setSelectedFws((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const loadSample = () => {
    setConfigText(SAMPLE_CONFIGS[vendor] || SAMPLE_CONFIGS.cisco_asa);
    setUploadedFile(null);
  };

  const reset = () => {
    setConfigText('');
    setUploadedFile(null);
    setError(null);
    setUploadStage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!configText.trim() || selectedFws.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Step 1: Upload device config
      setUploadStage('Parsing device configuration…');
      const formData = new FormData();
      const blob = new Blob([configText], { type: 'text/plain' });
      formData.append('file', blob, `${vendor}_config.txt`);
      formData.append('vendor', vendor);

      const uploadRes = await endpoints.uploadDevice(formData);
      const deviceId  = uploadRes.data.id;

      // Step 2: Trigger compliance audit
      setUploadStage('Running sovereign compliance audit…');
      const auditRes = await endpoints.createAudit({
        device_config_id: deviceId,
        frameworks: selectedFws,
      });

      onAuditCreated(auditRes.data.audit_job_id);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Audit submission failed');
    } finally {
      setIsSubmitting(false);
      setUploadStage('');
    }
  };

  const hasConfig   = configText.trim().length > 0;
  const canSubmit   = hasConfig && selectedFws.length > 0 && !isSubmitting;
  const currentVendor = VENDORS.find((v) => v.id === vendor);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Vendor Selection ── */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
          1 — Select Network Appliance Vendor
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {VENDORS.map((v) => {
            const Icon    = v.icon;
            const isActive = vendor === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => { setVendor(v.id); reset(); }}
                aria-pressed={isActive}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-3.5 text-xs font-semibold transition-all',
                  isActive
                    ? 'border-indigo-500/60 bg-indigo-500/10 text-white shadow-glow-brand'
                    : 'border-surface-border bg-surface-card text-slate-400 hover:border-surface-border-hi hover:text-slate-200'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-indigo-300' : v.color)} aria-hidden="true" />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Framework Matrix ── */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
          2 — Select Compliance Frameworks
          <span className="ml-2 text-slate-600 normal-case tracking-normal font-normal">(select one or more)</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {FRAMEWORKS.map((fw) => {
            const isSelected = selectedFws.includes(fw.id);
            return (
              <button
                key={fw.id}
                type="button"
                onClick={() => toggleFramework(fw.id)}
                aria-pressed={isSelected}
                className={cn(
                  'flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all',
                  isSelected
                    ? 'border-indigo-500/50 bg-indigo-500/8 text-white'
                    : 'border-surface-border bg-surface-card text-slate-400 hover:border-surface-border-hi hover:text-slate-200'
                )}
              >
                <div className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border mt-0.5 transition-all',
                  isSelected ? 'border-indigo-500 bg-indigo-600' : 'border-surface-border-hi'
                )}>
                  {isSelected && <CheckCircle2 className="h-3 w-3 text-white" aria-hidden="true" />}
                </div>
                <div>
                  <div className="text-xs font-bold">{fw.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{fw.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
        {selectedFws.length === 0 && (
          <p className="mt-1.5 text-xs text-amber-500">⚠ Select at least one compliance framework</p>
        )}
      </div>

      {/* ── Config Input ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">
            3 — Device Configuration
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadSample}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            >
              <FileCode2 className="h-3.5 w-3.5" aria-hidden="true" />
              Load {currentVendor?.label} Sample
            </button>
            {hasConfig && (
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1 rounded-lg border border-surface-border px-2.5 py-1 text-xs text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
              >
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            'relative rounded-xl border-2 border-dashed transition-all',
            isDragging
              ? 'border-indigo-500 bg-indigo-500/8'
              : 'border-surface-border hover:border-surface-border-hi'
          )}
        >
          {/* File indicator */}
          {uploadedFile && (
            <div className="flex items-center justify-between bg-indigo-500/10 px-3.5 py-2 border-b border-surface-border rounded-t-xl">
              <div className="flex items-center gap-2 text-xs text-indigo-300">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="font-mono font-semibold">{uploadedFile.name}</span>
                <span className="text-slate-500">({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                type="button"
                onClick={reset}
                aria-label="Remove file"
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Textarea */}
          <textarea
            value={configText}
            onChange={(e) => setConfigText(e.target.value)}
            placeholder={`Paste ${currentVendor?.label || 'device'} running configuration here…\n\nOr drag-and-drop a config file, or click "Load Sample" above.`}
            aria-label={`${currentVendor?.label} configuration input`}
            rows={14}
            className="w-full bg-transparent rounded-xl px-4 py-3.5 font-mono text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-y leading-relaxed"
          />

          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-indigo-500/15 pointer-events-none">
              <div className="text-center">
                <Upload className="mx-auto h-8 w-8 text-indigo-400 mb-2" aria-hidden="true" />
                <p className="text-sm font-semibold text-indigo-300">Drop config file here</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            Upload file instead
          </button>
          {hasConfig && (
            <span className="text-[11px] text-slate-600 font-mono">
              {configText.split('\n').length} lines &bull; {configText.length.toLocaleString()} chars
            </span>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.cfg,.conf,.xml,.set"
          className="hidden"
          onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
          aria-label="Upload configuration file"
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold text-red-400">Audit Submission Failed</p>
            <p className="text-xs text-red-300/80 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Submit ── */}
      <div className="flex items-center justify-between pt-2 border-t border-surface-border">
        <div className="text-[11px] text-slate-600">
          {selectedFws.length > 0 && (
            <span>
              Auditing against:{' '}
              <span className="text-slate-400 font-medium">
                {FRAMEWORKS.filter((f) => selectedFws.includes(f.id)).map((f) => f.label).join(', ')}
              </span>
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-bold transition-all',
            canSubmit
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/30'
              : 'bg-surface-muted text-slate-600 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>{uploadStage || 'Submitting…'}</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" aria-hidden="true" />
              <span>Execute Sovereign Compliance Audit</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
