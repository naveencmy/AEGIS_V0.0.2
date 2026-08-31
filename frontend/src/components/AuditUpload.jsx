import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Shield,
  Check,
  AlertCircle,
  Play,
  Layers,
  FileCode2,
} from 'lucide-react';
import { endpoints } from '../lib/api';
import { cn } from '../lib/utils';

const VENDORS = [
  { id: 'cisco', name: 'Cisco IOS / ASA', type: 'firewall' },
  { id: 'palo_alto', name: 'Palo Alto PAN-OS', type: 'firewall' },
  { id: 'juniper', name: 'Juniper JunOS', type: 'firewall' },
  { id: 'fortinet', name: 'Fortinet FortiOS', type: 'firewall' },
];

const FRAMEWORKS = [
  { id: 'NIST_800_53_R5', name: 'NIST SP 800-53 Rev 5', badge: 'Federal / DoD' },
  { id: 'CIS_v8', name: 'CIS Controls v8', badge: 'Enterprise Defense' },
  { id: 'ISO27001_2022', name: 'ISO/IEC 27001:2022', badge: 'Global ISMS' },
  { id: 'PCI_DSS_4.0', name: 'PCI-DSS 4.0', badge: 'Payment Security' },
];

const CISCO_SAMPLE = `: Saved
ASA Version 9.16(2)
hostname cisco-asa-edge-5525
interface GigabitEthernet0/0
 nameif outside
 security-level 0
 ip address 203.0.113.1 255.255.255.0
interface GigabitEthernet0/1
 nameif inside
 security-level 100
 ip address 192.168.1.1 255.255.255.0
access-list OUTSIDE_IN extended permit ip any any
access-list DMZ_IN extended permit tcp any host 172.16.1.10 eq 443
access-group OUTSIDE_IN in interface outside
logging enable
`;

const PALO_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<config version="10.2.0">
  <devices>
    <entry name="localhost.localdomain">
      <system><hostname>pan-os-dc-fw01</hostname></system>
      <vsys>
        <entry name="vsys1">
          <zone><entry name="untrust"/><entry name="trust"/><entry name="dmz"/></zone>
          <rulebase>
            <security>
              <rules>
                <entry name="ALLOW_ALL_INBOUND">
                  <to><member>trust</member></to>
                  <from><member>untrust</member></from>
                  <source><member>any</member></source>
                  <destination><member>any</member></destination>
                  <action>allow</action>
                </entry>
              </rules>
            </security>
          </rulebase>
        </entry>
      </vsys>
    </entry>
  </devices>
</config>`;

export function AuditUpload({ onAuditCreated }) {
  const [selectedVendor, setSelectedVendor] = useState('cisco');
  const [selectedFrameworks, setSelectedFrameworks] = useState(['NIST_800_53_R5', 'CIS_v8']);
  const [file, setFile] = useState(null);
  const [rawText, setRawText] = useState('');
  const [deviceName, setDeviceName] = useState('edge-firewall-01');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const toggleFramework = (id) => {
    setSelectedFrameworks((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((f) => f !== id) : prev) : [...prev, id]
    );
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setDeviceName(selected.name.replace(/\.[^/.]+$/, ''));
      const reader = new FileReader();
      reader.onload = (event) => {
        setRawText(event.target?.result || '');
      };
      reader.readAsText(selected);
    }
  };

  const loadSample = (type) => {
    if (type === 'cisco') {
      setSelectedVendor('cisco');
      setDeviceName('cisco-asa-edge-5525');
      setRawText(CISCO_SAMPLE);
      setFile(new File([CISCO_SAMPLE], 'cisco_asa_sample.txt', { type: 'text/plain' }));
    } else {
      setSelectedVendor('palo_alto');
      setDeviceName('pan-os-dc-fw01');
      setRawText(PALO_SAMPLE);
      setFile(new File([PALO_SAMPLE], 'palo_alto_sample.xml', { type: 'text/xml' }));
    }
  };

  const handleStartAudit = async () => {
    if (!rawText.trim() && !file) {
      setErrorMsg('Please upload a configuration file or select a demo sample');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      // 1. Upload device config
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        const blob = new Blob([rawText], { type: 'text/plain' });
        formData.append('file', blob, `${deviceName}.txt`);
      }
      formData.append('vendor', selectedVendor);
      formData.append('device_name', deviceName);
      formData.append('device_type', 'firewall');

      const uploadRes = await endpoints.uploadDevice(formData);
      const deviceId = uploadRes.data.device_config_id;

      // 2. Trigger Compliance Audit
      const auditRes = await endpoints.createAudit({
        device_config_id: deviceId,
        frameworks: selectedFrameworks,
      });

      if (onAuditCreated) {
        onAuditCreated(auditRes.data.audit_job_id);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.message || 'Failed to initiate compliance audit');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pre-cached Demo Scenario Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-obsidian-card to-cyan-950/20 p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">SIH26155 Pre-Configured Demo Scenarios</h4>
            <p className="text-xs text-slate-400">Load sample device configs with instant citation audit</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadSample('cisco')}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/20 transition-all"
          >
            <FileCode2 className="h-3.5 w-3.5" />
            <span>Load Cisco ASA Sample</span>
          </button>

          <button
            type="button"
            onClick={() => loadSample('palo_alto')}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-all"
          >
            <FileCode2 className="h-3.5 w-3.5" />
            <span>Load Palo Alto Sample</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Vendor & Framework Configuration */}
        <div className="space-y-5 lg:col-span-1">
          {/* Vendor Selection */}
          <div className="rounded-xl border border-indigo-500/20 bg-obsidian-card/70 p-4 backdrop-blur-sm">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              1. Target Network Vendor
            </label>
            <div className="space-y-2">
              {VENDORS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVendor(v.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg border p-3 text-left text-xs font-medium transition-all",
                    selectedVendor === v.id
                      ? "border-indigo-500 bg-indigo-500/15 text-slate-100 shadow-md shadow-indigo-500/10"
                      : "border-slate-800 bg-obsidian/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  )}
                >
                  <span>{v.name}</span>
                  {selectedVendor === v.id && <Check className="h-4 w-4 text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Compliance Frameworks Multi-Select */}
          <div className="rounded-xl border border-indigo-500/20 bg-obsidian-card/70 p-4 backdrop-blur-sm">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
              2. Audit Regulatory Standards
            </label>
            <div className="space-y-2">
              {FRAMEWORKS.map((fw) => {
                const isSelected = selectedFrameworks.includes(fw.id);
                return (
                  <div
                    key={fw.id}
                    onClick={() => toggleFramework(fw.id)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-lg border p-3 text-xs transition-all select-none",
                      isSelected
                        ? "border-cyan-500/60 bg-cyan-500/10 text-slate-100"
                        : "border-slate-800 bg-obsidian/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    )}
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{fw.name}</div>
                      <div className="text-[10px] text-slate-400">{fw.badge}</div>
                    </div>
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                        isSelected
                          ? "border-cyan-400 bg-cyan-500 text-obsidian"
                          : "border-slate-600 bg-transparent"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Device Name, Upload Zone & Config Preview */}
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-xl border border-indigo-500/20 bg-obsidian-card/70 p-5 backdrop-blur-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Device Identifier / Hostname
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                className="w-full rounded-lg border border-slate-700/60 bg-obsidian/80 px-3.5 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. edge-asa-dc01"
              />
            </div>

            {/* Dropzone */}
            <div className="relative rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 bg-obsidian/50 p-6 text-center transition-colors">
              <input
                type="file"
                id="config-upload"
                onChange={handleFileChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <UploadCloud className="mx-auto h-10 w-10 text-indigo-400 mb-2" />
              <p className="text-sm font-medium text-slate-200">
                {file ? file.name : "Drop config file here, or click to browse"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports Cisco (.txt, .cfg), PAN-OS XML (.xml), JunOS (.set, .conf), FortiOS (.conf)
              </p>
            </div>

            {/* Raw Config Preview Textarea */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Configuration Contents
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={8}
                placeholder="Paste or review raw firewall / router configuration..."
                className="w-full rounded-lg border border-slate-800 bg-slate-950/80 p-3 font-mono text-xs text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Start Audit Button */}
            <button
              type="button"
              disabled={isUploading}
              onClick={handleStartAudit}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50",
                isUploading && "animate-pulse cursor-not-allowed"
              )}
            >
              {isUploading ? (
                <span>Executing Hybrid RAG & Compliance Reasoner...</span>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-white" />
                  <span>Execute Sovereign Compliance Audit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
