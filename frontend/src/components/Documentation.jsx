import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileCode,
  Server,
  Database,
  Cpu,
  ShieldCheck,
  Blocks,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Layers,
  Search,
  Radio,
  Lock,
  ArrowRight,
  Code2,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { endpoints } from '../lib/api';
import { cn } from '../lib/utils';

export function Documentation({ onTabChange }) {
  const [activeDocSection, setActiveDocSection] = useState('overview');
  const [copiedKey, setCopiedKey] = useState(null);
  const [apiHealth, setApiHealth] = useState({ checking: true, live: false, port: '8000' });

  useEffect(() => {
    endpoints
      .health()
      .then((res) => {
        setApiHealth({ checking: false, live: res.status === 200, port: '8000' });
      })
      .catch(() => {
        setApiHealth({ checking: false, live: false, port: '8000' });
      });
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const SECTIONS = [
    { id: 'overview',     label: '1. Architecture & Security', icon: Server },
    { id: 'api',          label: '2. FastAPI OpenAPI / Swagger', icon: FileCode },
    { id: 'vendors',      label: '3. Multi-Vendor Parsers',    icon: Terminal },
    { id: 'frameworks',   label: '4. Regulatory Standards',    icon: BookOpen },
    { id: 'blockchain',   label: '5. Blockchain Evidence Specs', icon: Blocks },
    { id: 'deployment',   label: '6. Air-Gap Deployment Runbook', icon: Cpu },
  ];

  return (
    <div className="space-y-6">
      {/* ── Documentation Banner ── */}
      <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-r from-white via-cyan-50/40 to-white p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 text-[11px] font-bold uppercase tracking-wider mb-2 border border-cyan-300">
              <BookOpen className="w-3.5 h-3.5 text-cyan-700" />
              <span>Official System Technical Reference v2.0</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 flex items-center gap-2">
              AEGIS-NTRO Documentation & API Catalog
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl font-normal">
              Architecture whitepapers, deterministic multi-vendor AST parsing schemas, sovereign local inference workflows, and live REST API specifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Swagger UI (:8000/docs)</span>
            </a>
            {onTabChange && (
              <button
                onClick={() => onTabChange('blockchain')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold transition-all shadow-sm"
              >
                <Blocks className="w-4 h-4 text-cyan-600" />
                <span>Evidence Locker</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Backend Connection Status */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-700">FastAPI Daemon Status:</span>
            {apiHealth.checking ? (
              <span className="inline-flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                <Radio className="w-3.5 h-3.5 animate-spin text-cyan-600" /> Probing localhost:8000...
              </span>
            ) : apiHealth.live ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ONLINE (http://127.0.0.1:8000)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-mono text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                OFFLINE (Run: uvicorn backend.main:app)
              </span>
            )}
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            OpenAPI Spec: <code className="text-cyan-700 font-bold">/openapi.json</code>
          </div>
        </div>
      </div>

      {/* ── Main Content Grid: Sidebar + Doc Viewer ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Navigation Column */}
        <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Specification Chapters
          </div>
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const active = activeDocSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveDocSection(sec.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-all',
                  active
                    ? 'bg-gradient-to-r from-brand-50 to-cyan-50/80 text-cyan-900 border-l-4 border-cyan-500 font-bold shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-cyan-600' : 'text-slate-400')} />
                <span className="truncate">{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-9 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          {/* Section 1: Overview */}
          {activeDocSection === 'overview' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-cyan-700 font-bold uppercase tracking-wider">Chapter 01</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Architecture & Sovereign Security Model</h3>
                <p className="text-xs text-slate-600 mt-1">
                  System architecture designed for air-gapped defense networks and mission-critical enterprise perimeters.
                </p>
              </div>

              {/* Main Directive Highlight */}
              <div className="p-4 rounded-lg bg-cyan-50/80 border border-cyan-200 text-xs">
                <span className="font-bold text-cyan-950 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-cyan-700" />
                  ★ MAIN DIRECTIVE: ZERO EXTERNAL EXFILTRATION
                </span>
                <p className="text-slate-700 leading-relaxed">
                  AEGIS-NTRO operates with an absolute air-gap guarantee. All AST parsing, vector embedding generation, pgvector similarity lookups, and Mistral-7B reasoning occur strictly on sovereign local hardware. No outbound telemetry or external cloud LLM connections are permitted.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-brand-600" />
                    Unified PostgreSQL 16 + pgvector
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Single source of truth storing relational audit jobs, findings, framework controls, and 768-dimensional dense embeddings with HNSW indexing.
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-600" />
                    Deterministic Local AI Engine
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Local Mistral-7B Instruct (Q4_K_M) with temperature=0.0 and GBNF grammar constraints enforcing strict JSON output structures.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5 space-y-3">
                <h4 className="text-sm font-bold text-slate-900">Audit Pipeline Workflow</h4>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-200 flex items-center justify-between">
                    <span>1. Ingest Raw Config File</span>
                    <span className="text-cyan-400">Cisco / Palo Alto / Juniper / Fortinet</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-200 flex items-center justify-between">
                    <span>2. Deterministic AST Normalization</span>
                    <span className="text-cyan-400">Extract ACLs, Interfaces, NAT, Crypto</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-200 flex items-center justify-between">
                    <span>3. Hybrid pgvector RAG Matching</span>
                    <span className="text-cyan-400">HNSW Cosine + BM25 Lexical Keyword Filter</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-200 flex items-center justify-between">
                    <span>4. Verifiable Citation Pairing</span>
                    <span className="text-emerald-400">Publication Section + Page Number</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-200 flex items-center justify-between">
                    <span>5. SHA-256 Merkle Block Minting</span>
                    <span className="text-purple-400">Anchored in Immutable Blockchain</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: API Reference */}
          {activeDocSection === 'api' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-mono text-cyan-700 font-bold uppercase tracking-wider">Chapter 02</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">REST API Reference & OpenAPI Schema</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    FastAPI endpoints exposed on <code className="font-mono text-cyan-800 font-bold">http://127.0.0.1:8000</code>.
                  </p>
                </div>
                <a
                  href="http://127.0.0.1:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Launch Swagger UI
                </a>
              </div>

              {/* Endpoint Cards */}
              <div className="space-y-4">
                {[
                  {
                    method: 'POST',
                    path: '/api/audit',
                    summary: 'Execute Multi-Vendor Compliance Audit',
                    desc: 'Uploads raw configuration file with target framework filters, parses AST, runs deterministic rules, and returns finding array with score.',
                    payload: `multipart/form-data:
  file: <config_file>
  frameworks: ["NIST SP 800-53", "CIS Controls", "ISO 27001", "PCI-DSS"]`,
                  },
                  {
                    method: 'GET',
                    path: '/api/audit/{id}',
                    summary: 'Retrieve Audit Run Details & Findings',
                    desc: 'Returns compliance score, severity breakdown, finding details with citations, remediation CLI scripts, and blockchain anchor status.',
                    payload: `Response:
{
  "id": "7d51865a-8b1e-4512-b13c-e098a876d001",
  "compliance_score_percent": 94.2,
  "total_findings": 14,
  "critical_count": 2,
  "blockchain_anchored": true,
  "findings": [...]
}`,
                  },
                  {
                    method: 'POST',
                    path: '/api/query',
                    summary: 'Sovereign RAG Regulatory Intelligence',
                    desc: 'Queries pgvector with natural language. Enforces "Citation or Silence" invariant; returns exact control section and page number.',
                    payload: `POST JSON:
{
  "query": "What are boundary requirements for permit ip any any under NIST?",
  "framework_filter": "NIST SP 800-53"
}`,
                  },
                  {
                    method: 'POST',
                    path: '/api/drift',
                    summary: 'Configuration Drift & Regression Analysis',
                    desc: 'Compares two running configurations (Baseline vs Current) to detect altered cryptographic ciphers, relaxed ACL rules, and compliance drops.',
                    payload: `multipart/form-data:
  baseline_file: <baseline.cfg>
  current_file: <current.cfg>`,
                  },
                  {
                    method: 'GET',
                    path: '/api/blockchain/verify/{audit_id}',
                    summary: 'Cryptographic Blockchain Ledger Verification',
                    desc: 'Validates SHA-256 Merkle root, block index, timestamp, and hash chain linkage against the tamper-evident ledger.',
                    payload: `Response:
{
  "valid": true,
  "block_height": 1284,
  "merkle_root": "0x4a9b2c...",
  "verified_at": "2026-10-05T07:12:00Z"
}`,
                  },
                ].map((ep, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[11px] font-bold font-mono',
                            ep.method === 'POST' ? 'bg-cyan-100 text-cyan-800' : 'bg-emerald-100 text-emerald-800'
                          )}
                        >
                          {ep.method}
                        </span>
                        <span className="font-bold text-slate-900">{ep.path}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-semibold">{ep.summary}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{ep.desc}</p>
                    <div className="bg-slate-900 rounded p-2.5 text-slate-200 font-mono text-[11px] overflow-x-auto relative">
                      <button
                        onClick={() => handleCopy(ep.payload, `ep-${idx}`)}
                        className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white"
                        title="Copy Payload"
                      >
                        {copiedKey === `ep-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <pre className="pr-6">{ep.payload}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Multi-Vendor Parsers */}
          {activeDocSection === 'vendors' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-cyan-700 font-bold uppercase tracking-wider">Chapter 03</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Multi-Vendor Configuration Parsers</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Deterministic syntax engines converting vendor-specific network configurations into unified AST objects.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    vendor: 'Cisco Systems',
                    models: 'Cisco IOS-XE, IOS-XR, ASA 5500-X, Firepower FTD',
                    features: ['Named & standard ACLs', 'crypto isakmp / ipsec policies', 'BGP/OSPF authentication', 'Management SSH/SNMP v3'],
                    syntax: 'access-list OUTSIDE_IN extended permit ip any any',
                  },
                  {
                    vendor: 'Palo Alto Networks',
                    models: 'PAN-OS 10.x, 11.x, VM-Series, PA-400/3200/5200',
                    features: ['Security policy rules (rulebase)', 'App-ID & User-ID bindings', 'SSL Decryption profiles', 'WildFire & Antivirus profiles'],
                    syntax: 'set rulebase security rules Allow-All action allow',
                  },
                  {
                    vendor: 'Juniper Networks',
                    models: 'Junos OS 21.x+, SRX Series Gateway, MX Routers',
                    features: ['Hierarchical security policies', 'Address-book sets', 'IKE/IPSec phase-1/2 proposals', 'Screening options (SYN flood)'],
                    syntax: 'set security policies from-zone untrust to-zone trust policy Permit-All then permit',
                  },
                  {
                    vendor: 'Fortinet',
                    models: 'FortiOS 7.0+, FortiGate 60F - 1800F',
                    features: ['config firewall policy', 'config vpn ipsec phase1-interface', 'config system admin (2FA)', 'Antivirus & IPS profiles'],
                    syntax: 'config firewall policy\n  edit 1\n    set action accept\n    set srcaddr "all"\n  next\nend',
                  },
                ].map((v, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">{v.vendor}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-semibold border border-cyan-200">
                        PARSER VERIFIED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">Models: {v.models}</div>
                    <ul className="space-y-1 text-slate-600">
                      {v.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 bg-slate-900 rounded p-2 text-slate-300 font-mono text-[11px] overflow-x-auto">
                      <code>{v.syntax}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Regulatory Frameworks */}
          {activeDocSection === 'frameworks' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-cyan-700 font-bold uppercase tracking-wider">Chapter 04</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Regulatory Standards & Ingested Knowledge Base</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Authoritative publications indexed with full paragraph vectors and precise page citation anchors.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    code: 'NIST SP 800-53 Rev 5',
                    title: 'Security and Privacy Controls for Information Systems and Organizations',
                    coverage: 'Access Control (AC), System and Communications Protection (SC), Audit and Accountability (AU)',
                    keyControl: 'AC-4 (Information Flow Enforcement), SC-7 (Boundary Protection)',
                  },
                  {
                    code: 'CIS Controls v8.0',
                    title: 'Center for Internet Security Critical Security Controls',
                    coverage: 'Implementation Groups 1, 2, and 3',
                    keyControl: 'Safeguard 4.1 (Establish and Maintain a Secure Configuration Process), 4.4 (Firewall Rules)',
                  },
                  {
                    code: 'ISO/IEC 27001:2022',
                    title: 'Information Security, Cybersecurity and Privacy Protection',
                    coverage: 'Annex A Information Security Controls (93 Controls)',
                    keyControl: 'A.8.20 (Network Security), A.8.21 (Security of Network Services), A.8.22 (Segregation of Networks)',
                  },
                  {
                    code: 'PCI-DSS v4.0',
                    title: 'Payment Card Industry Data Security Standard',
                    coverage: 'Requirements 1 through 12 for Cardholder Data Environments',
                    keyControl: 'Requirement 1.2 (Network security controls are configured and maintained), 1.3 (Restrict Inbound)',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-0.5 rounded border border-cyan-200">
                        {item.code}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        100% Ingested in pgvector
                      </span>
                    </div>
                    <div className="font-bold text-slate-900">{item.title}</div>
                    <div className="text-slate-600 text-[11px]"><strong className="text-slate-800">Families:</strong> {item.coverage}</div>
                    <div className="text-cyan-900 bg-cyan-50/50 p-2 rounded text-[11px] border border-cyan-100 font-mono">
                      <strong>Audit Directives:</strong> {item.keyControl}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Blockchain Evidence */}
          {activeDocSection === 'blockchain' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-cyan-700 font-bold uppercase tracking-wider">Chapter 05</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Cryptographic Blockchain Evidence Ledger</h3>
                <p className="text-xs text-slate-600 mt-1">
                  SHA-256 Merkle tree verification creating non-repudiation seals for legal and military compliance.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-cyan-50/80 border border-cyan-200 text-xs space-y-2">
                <div className="font-bold text-cyan-950 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-cyan-700" />
                  ★ MAIN ASSURANCE: TAMPER-PROOF AUDIT REPRODUCIBILITY
                </div>
                <p className="text-slate-700 leading-relaxed">
                  Every audit produces a deterministic SHA-256 state hash binding the exact raw configuration content, normalized AST rules, identified compliance findings, and regulatory citations into a continuous Merkle chain. If any finding or configuration parameter is altered retroactively, the Merkle root changes and the block signature fails validation.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-900 p-5 text-slate-200 font-mono text-xs space-y-3">
                <div className="text-slate-400 text-[11px] uppercase tracking-wider flex items-center justify-between">
                  <span>Cryptographic Hashing Formula</span>
                  <span className="text-cyan-400">SHA-256 / MERKLE-ROOT</span>
                </div>
                <div className="bg-slate-950 p-3 rounded text-cyan-300 text-[11px] leading-relaxed">
                  Block_Hash = SHA256(Block_Index + Prev_Hash + Merkle_Root(Findings) + Config_Snapshot_Hash + Timestamp + Nonce)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-800 border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Prev Block Hash</span>
                    <span className="text-slate-200 truncate block">0000a4b7e891c3...</span>
                  </div>
                  <div className="p-2 rounded bg-slate-800 border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Current Merkle Root</span>
                    <span className="text-cyan-300 truncate block">4f9d2a68c091be...</span>
                  </div>
                  <div className="p-2 rounded bg-slate-800 border border-slate-700">
                    <span className="text-slate-400 block text-[10px]">Audit Integrity</span>
                    <span className="text-emerald-400 font-bold block">100% UNALTERED</span>
                  </div>
                </div>
              </div>

              {onTabChange && (
                <div className="pt-2">
                  <button
                    onClick={() => onTabChange('blockchain')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-sm"
                  >
                    <Blocks className="w-4 h-4" />
                    Open Live Blockchain Verifier
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Section 6: Deployment Runbook */}
          {activeDocSection === 'deployment' && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-mono text-cyan-700 font-bold uppercase tracking-wider">Chapter 06</span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">Air-Gap Deployment & Local Runbook</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Commands to start and manage your local air-gapped node on Windows / Linux.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-600" />
                    1. Launch PostgreSQL 16 + pgvector Container
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3 text-slate-200 font-mono text-xs relative">
                    <button
                      onClick={() => handleCopy('docker-compose up -d postgres', 'cmd-1')}
                      className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'cmd-1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <code>docker-compose up -d postgres</code>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-600" />
                    2. Start Sovereign FastAPI Server (Port 8000)
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3 text-slate-200 font-mono text-xs relative">
                    <button
                      onClick={() => handleCopy('.\\.venv\\Scripts\\uvicorn.exe backend.main:app --host 127.0.0.1 --port 8000 --reload', 'cmd-2')}
                      className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'cmd-2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <code>.\.venv\Scripts\uvicorn.exe backend.main:app --host 127.0.0.1 --port 8000 --reload</code>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-600" />
                    3. Launch React Defense Command Center (Port 5173)
                  </div>
                  <div className="bg-slate-900 rounded-lg p-3 text-slate-200 font-mono text-xs relative">
                    <button
                      onClick={() => handleCopy('cd frontend && npm run dev', 'cmd-3')}
                      className="absolute top-2.5 right-2.5 p-1 text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'cmd-3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <code>cd frontend && npm run dev</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Documentation;
