import React, { useState } from 'react';
import {
  ShieldCheck,
  Shield,
  Server,
  FileCheck,
  Search,
  GitCompare,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Database,
  ExternalLink,
  Layers,
  ChevronRight,
  Terminal,
  Activity,
  Blocks,
  FileText,
} from 'lucide-react';
import { CyberBackground } from './CyberBackground';

export default function LandingPage({ onEnterApp }) {
  const [activeSection, setActiveSection] = useState('hero');

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]/80 text-slate-900 selection:bg-cyan-100 selection:text-cyan-900 font-sans relative">
      {/* ── Background Cyber Security Animation ── */}
      <CyberBackground />

      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => scrollTo('hero')}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-600 to-cyan-600 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-cyan-100" />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-slate-950 flex items-center gap-2">
                AEGIS-NTRO
                <span className="text-[10px] uppercase font-mono font-bold bg-cyan-50 text-cyan-800 border border-cyan-300 px-1.5 py-0.5 rounded shadow-2xs">
                  CYBER v2.0
                </span>
              </div>
              <div className="text-[10px] font-medium text-slate-500 tracking-wider uppercase">
                Sovereign Security Intelligence
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <button onClick={() => scrollTo('workflow')} className="hover:text-cyan-700 transition-colors">
              Platform
            </button>
            <button onClick={() => scrollTo('capabilities')} className="hover:text-cyan-700 transition-colors">
              Capabilities
            </button>
            <button onClick={() => scrollTo('sovereign-ai')} className="hover:text-cyan-700 transition-colors">
              Sovereign AI
            </button>
            <button onClick={() => scrollTo('evidence')} className="hover:text-cyan-700 transition-colors">
              Evidence
            </button>
            <button onClick={() => scrollTo('frameworks')} className="hover:text-cyan-700 transition-colors">
              Frameworks
            </button>
            <button onClick={() => scrollTo('architecture')} className="hover:text-cyan-700 transition-colors">
              Architecture
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onEnterApp('documentation')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-cyan-700 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
              title="Open In-Depth System Technical Documentation"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-600" />
              <span>Documentation</span>
            </button>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hidden lg:inline-flex items-center gap-1 text-[11px] font-mono font-medium text-slate-500 hover:text-cyan-700 px-2 py-1 rounded bg-slate-50 border border-slate-200"
              title="Launch FastAPI Swagger UI"
            >
              Swagger <ExternalLink className="w-3 h-3 text-cyan-600" />
            </a>
            <button
              onClick={() => onEnterApp('dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-brand-600 via-cyan-600 to-brand-700 hover:from-brand-700 hover:to-cyan-700 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02]"
            >
              Enter Command Center <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section id="hero" className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-28 border-b border-slate-200/80 overflow-hidden bg-gradient-to-b from-white/80 via-[#F8FAFC]/65 to-white/80 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Narrative */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-900 text-xs font-semibold tracking-wide uppercase shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                Sovereign Cyber Network Assurance Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
                VERIFY EVERY CONFIGURATION.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-cyan-600 to-cyan-500">
                  PROVE EVERY DECISION.
                </span>
              </h1>

              <p className="text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                AEGIS-NTRO combines multi-vendor network compliance auditing, sovereign AI reasoning,
                regulatory evidence, configuration drift detection, and cryptographically verifiable audit
                trails into a single mission-critical platform.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onEnterApp('dashboard')}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all"
                >
                  Enter Command Center <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollTo('workflow')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-sm font-semibold transition-all shadow-sm"
                >
                  Explore Platform
                </button>
              </div>

              {/* Guarantees / Badges */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Air-Gapped Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Local AI Reasoning</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Citation Grounded</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cryptographic Proof</span>
                </div>
              </div>
            </div>

            {/* Right Column: Realistic Application Preview */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-slate-200 bg-white/95 p-5 shadow-elevated relative">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                      Core Gateway Perimeter (Cisco ASA)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    RUN-ID: 7d51865a
                  </span>
                </div>

                {/* Score & KPI Strip */}
                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Compliance Score
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mt-0.5">94.2%</div>
                    <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Standard Baseline
                    </div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Critical Findings
                    </div>
                    <div className="text-2xl font-bold text-red-600 mt-0.5">02</div>
                    <div className="text-[11px] text-slate-500 font-medium mt-1">Requires Remediation</div>
                  </div>
                </div>

                {/* Active Sample Finding */}
                <div className="p-3.5 rounded-lg border border-red-200 bg-red-50/40 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800">
                      CRITICAL · AC-4
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">NIST SP 800-53 R5</span>
                  </div>
                  <div className="font-semibold text-slate-900">
                    Unrestricted Inbound Flow Detected
                  </div>
                  <div className="font-mono text-[11px] text-slate-700 bg-white/80 p-2 rounded border border-red-100 truncate">
                    access-list OUTSIDE_IN extended permit ip any any
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center gap-1 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    <span>Cited: Section 3.4 AC-4, Page 47 (Official CSRC Link)</span>
                  </div>
                </div>

                {/* Evidence Ledger Seal */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Evidence Integrity:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> VERIFIED (Block #1284)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Strip ── */}
      <section className="py-10 bg-white/70 backdrop-blur-[2px] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
            Built for Environments Where Evidence Matters
          </div>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 md:gap-16 text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-600" /> Defense Organizations
            </div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-600" /> Critical Infrastructure
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-600" /> Security Operations Centers
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-brand-600" /> Regulatory Compliance
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-brand-600" /> National Technical Research
            </div>
          </div>
        </div>
      </section>

      {/* ── Visual Workflow ── */}
      <section id="workflow" className="py-20 border-b border-slate-200/80 bg-[#F8FAFC]/75 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-bold text-brand-600 tracking-wider uppercase mb-2">
              Verified Pipeline
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              FROM CONFIGURATION TO VERIFIED EVIDENCE
            </h2>
            <p className="text-base text-slate-600 mt-3 font-normal">
              AEGIS-NTRO deterministically parses raw network configurations, maps policy rules against
              authoritative regulatory publications, and generates an unalterable evidence trail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                step: '01',
                icon: Terminal,
                title: 'Network Config',
                desc: 'Ingests Cisco, Palo Alto, Juniper, or Fortinet running configurations.',
              },
              {
                step: '02',
                icon: Search,
                title: 'Policy Analysis',
                desc: 'Normalizes ACLs, NAT policies, crypto parameters, and services into AST.',
              },
              {
                step: '03',
                icon: Database,
                title: 'Regulatory Control',
                desc: 'Matches rules against NIST SP 800-53, CIS v8, ISO 27001, and PCI-DSS.',
              },
              {
                step: '04',
                icon: FileCheck,
                title: 'Verified Citation',
                desc: 'Pairs every violation with exact publication title, section, and page number.',
              },
              {
                step: '05',
                icon: ShieldCheck,
                title: 'Remediation',
                desc: 'Generates hardened CLI replacement commands to eliminate the gap.',
              },
              {
                step: '06',
                icon: Blocks,
                title: 'Immutable Evidence',
                desc: 'Anchors audit hash and configuration snapshot into SHA-256 Merkle ledger.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
                    <span className="font-bold text-brand-600">{item.step}</span>
                    <item.icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Capabilities (6 Layers of Assurance) ── */}
      <section id="capabilities" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-bold text-brand-600 tracking-wider uppercase mb-2">
              Comprehensive Defense
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              ONE PLATFORM. SIX LAYERS OF ASSURANCE.
            </h2>
            <p className="text-base text-slate-600 mt-3 font-normal">
              Purpose-built capabilities engineered to provide mathematical confidence in network security compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Server,
                title: '1. Multi-Vendor Compliance',
                desc: 'Analyze Cisco IOS/ASA, Palo Alto PAN-OS, Juniper JunOS, and Fortinet FortiOS syntax seamlessly against security frameworks without vendor lock-in.',
              },
              {
                icon: FileCheck,
                title: '2. Citation-Native Intelligence',
                desc: 'Generate answers grounded in verified regulatory sources. Every finding includes exact control IDs, section titles, and page references.',
              },
              {
                icon: GitCompare,
                title: '3. Configuration Drift',
                desc: 'Identify unauthorized deviations from hardened baselines. Detect permissive rules, altered cryptographic profiles, and audit score regressions.',
              },
              {
                icon: ShieldCheck,
                title: '4. Hardened Remediation',
                desc: 'Translate compliance findings into actionable, syntax-accurate configuration replacement blocks ready for peer review and change management.',
              },
              {
                icon: Blocks,
                title: '5. Immutable Evidence Ledger',
                desc: 'Anchor audit findings and snapshot hashes into a cryptographically verifiable SHA-256 Merkle chain, providing tamper-proof legal receipts.',
              },
              {
                icon: Cpu,
                title: '6. Sovereign Local AI',
                desc: 'Execute all natural language reasoning and parsing using local Mistral-7B inference. Zero external API calls, zero telemetry, 100% air-gap ready.',
              },
            ].map((cap, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-6 hover:bg-white hover:border-slate-300 transition-all shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 mb-4">
                  <cap.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{cap.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sovereign AI Section ── */}
      <section id="sovereign-ai" className="py-20 border-b border-slate-200 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="text-xs font-bold text-brand-600 tracking-wider uppercase">
                Privacy & Data Sovereignty
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                INTELLIGENCE WITHOUT DATA EXFILTRATION
              </h2>
              <p className="text-base text-slate-600 leading-relaxed font-normal">
                AEGIS-NTRO is designed for controlled environments where sensitive network topology,
                firewall rule sets, and cryptographic secrets must remain strictly inside sovereign infrastructure.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-lg bg-white border border-slate-200">
                  <div className="text-xs font-bold text-slate-900">AIR-GAPPED READY</div>
                  <div className="text-xs text-slate-600 mt-1">Zero dependency on external cloud LLM APIs.</div>
                </div>
                <div className="p-4 rounded-lg bg-white border border-slate-200">
                  <div className="text-xs font-bold text-slate-900">LOCAL INFERENCE</div>
                  <div className="text-xs text-slate-600 mt-1">Local Mistral-7B Q4 reasoning on sovereign nodes.</div>
                </div>
                <div className="p-4 rounded-lg bg-white border border-slate-200">
                  <div className="text-xs font-bold text-slate-900">PRIVATE VECTORS</div>
                  <div className="text-xs text-slate-600 mt-1">Dense embeddings indexed in PostgreSQL pgvector.</div>
                </div>
                <div className="p-4 rounded-lg bg-white border border-slate-200">
                  <div className="text-xs font-bold text-slate-900">CONTROLLED PROCESS</div>
                  <div className="text-xs text-slate-600 mt-1">Predictable, deterministic token generation.</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Sovereign Processing Flow
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-800 font-semibold">1. NETWORK CONFIGURATION</span>
                    <span className="text-brand-600 font-bold">Local File</span>
                  </div>
                  <div className="text-center text-slate-400">↓</div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-800 font-semibold">2. HYBRID PGVECTOR RAG</span>
                    <span className="text-brand-600 font-bold">Local Database</span>
                  </div>
                  <div className="text-center text-slate-400">↓</div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-800 font-semibold">3. LOCAL AI ENGINE</span>
                    <span className="text-brand-600 font-bold">Mistral-7B Q4</span>
                  </div>
                  <div className="text-center text-slate-400">↓</div>
                  <div className="p-3 rounded-lg bg-brand-50 border border-brand-200 flex items-center justify-between">
                    <span className="text-brand-900 font-semibold">4. VERIFIED AUDIT EVIDENCE</span>
                    <span className="text-emerald-700 font-bold">Cited & Sealed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Citation-Native AI Section ── */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-bold text-brand-600 tracking-wider uppercase mb-2">
              Hallucination Defense
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              AI THAT KNOWS WHEN TO STAY SILENT
            </h2>
            <p className="text-base text-slate-600 mt-3 font-normal">
              Unlike generic chatbots that guess when evidence is missing, AEGIS enforces a strict{' '}
              <strong className="text-slate-900 font-semibold">"Citation or Silence"</strong> invariant.
              If regulatory ground-truth is insufficient, the model explicitly refuses to speculate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Grounded Path */}
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit mb-3">
                <CheckCircle2 className="w-3.5 h-3.5" /> GROUNDED QUERY RESPONSE
              </div>
              <p className="text-xs text-slate-600 mb-4">
                When indexed regulatory guidance exists, AEGIS returns exact, actionable synthesis with verified citations.
              </p>
              <div className="p-4 rounded-lg bg-white border border-slate-200 text-xs space-y-2">
                <div className="font-semibold text-slate-900">
                  "Unrestricted inbound traffic (permit ip any any) violates boundary protection."
                </div>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  <span className="px-2 py-0.5 rounded bg-brand-50 border border-brand-200 text-brand-700 font-mono text-[11px] font-semibold">
                    NIST AC-4 · PAGE 47
                  </span>
                  <span className="px-2 py-0.5 rounded bg-brand-50 border border-brand-200 text-brand-700 font-mono text-[11px] font-semibold">
                    CIS 4.1
                  </span>
                  <span className="px-2 py-0.5 rounded bg-brand-50 border border-brand-200 text-brand-700 font-mono text-[11px] font-semibold">
                    PCI-DSS 4.0 · REQ 1.2
                  </span>
                </div>
              </div>
            </div>

            {/* Silence Path */}
            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-6 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 w-fit mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> INSUFFICIENT EVIDENCE DETECTED
              </div>
              <p className="text-xs text-slate-600 mb-4">
                When queries target unverified, out-of-distribution, or fictitious subjects, AEGIS triggers sovereign silence.
              </p>
              <div className="p-4 rounded-lg bg-white border border-amber-200 text-xs space-y-2">
                <div className="text-amber-800 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  INSUFFICIENT VERIFIED INTELLIGENCE
                </div>
                <div className="text-slate-600 text-[11px]">
                  "The sovereign repository does not contain sufficient verified evidence to answer this query. No unsupported inference was generated."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Evidence Vault & Cryptographic Ledger Section ── */}
      <section id="evidence" className="py-20 border-b border-slate-200/90 bg-gradient-to-b from-[#F8FAFC]/85 via-cyan-50/20 to-[#F8FAFC]/85 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-bold text-cyan-700 tracking-wider uppercase mb-2 flex items-center justify-center gap-1.5">
              <Blocks className="w-4 h-4 text-cyan-600" />
              <span>Immutable Audit Trail</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              CRYPTOGRAPHIC EVIDENCE & TAMPER-PROOF LEDGER
            </h2>
            <p className="text-base text-slate-600 mt-3 font-normal">
              Eliminate disputes during defense inspections and regulatory audits. Every configuration snapshot and compliance finding is cryptographically bound into an immutable SHA-256 Merkle chain.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Pillars */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-xl border border-cyan-200 bg-white/90 p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center font-bold">
                    <Lock className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">SHA-256 Merkle Root Construction</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Raw network device configs, normalized AST policy structures, and detected regulatory gaps are hashed into a deterministic Merkle root. Any retroactive alteration invalidates the entire block signature.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Non-Repudiation for Defense Audits</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Provides military and intelligence grade receipts for compliance officers, proving precisely which rule violated which NIST or CIS safeguard at the exact timestamp of execution.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Independent Cryptographic Verification</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Verify historical audits locally or export cryptographically signed proof manifests for third-party regulatory inspection.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onEnterApp('blockchain')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/20"
                >
                  <Blocks className="w-4 h-4" />
                  Launch Live Blockchain Evidence Locker
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onEnterApp('documentation')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-semibold transition-all shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-600" />
                  Read Evidence Specs
                </button>
              </div>
            </div>

            {/* Right: Live Interactive-Style Block Seal */}
            <div className="lg:col-span-6">
              <div className="rounded-xl border border-cyan-500/30 bg-slate-950 p-6 text-slate-200 font-mono shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-cyan-400">BLOCK #1284 SEALED</span>
                  </div>
                  <span className="text-[11px] text-slate-400">GENESIS + 1284</span>
                </div>

                <div className="space-y-3 my-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Block Hash (SHA-256)</span>
                    <span className="text-cyan-300 text-[11px] break-all select-all font-bold">
                      0000a89f3b12c4e8d76a0129bc5f33e8a760b91e5d4218ac90e1f74b6201c87a
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Previous Block Hash</span>
                    <span className="text-slate-400 text-[11px] break-all">
                      00007d12f45a0b9e812c34a90f12d56a78b0123e45c678a9b01234def567890a
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Merkle Root (14 Audited Findings)</span>
                    <span className="text-purple-300 text-[11px] break-all font-bold">
                      4f9d2a68c091be5a73e810cd398241fa09b62a45d81c20e9812739fa8c102934
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Raw Config Digest (Cisco-ASA-Perimeter.cfg)</span>
                    <span className="text-emerald-300 text-[11px] break-all">
                      e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Cryptographic Seal:</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED GENUINE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Supported Frameworks ── */}
      <section id="frameworks" className="py-20 border-b border-slate-200 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-bold text-brand-600 tracking-wider uppercase mb-2">
              Regulatory Standards
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              INGESTED REGULATORY FRAMEWORKS
            </h2>
            <p className="text-base text-slate-600 mt-3 font-normal">
              Official defense and enterprise cybersecurity standards ingested directly into PostgreSQL pgvector.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                id: 'NIST SP 800-53 Rev 5',
                focus: 'Federal & Defense Systems Security',
                controls: '1,000+ Ingested Controls',
                classes: 'AC, SC, IA, AU, CM Families',
              },
              {
                id: 'CIS Controls v8.0',
                focus: 'Enterprise Essential Cyber Hygiene',
                controls: '153 Safeguards',
                classes: 'Implementation Groups 1, 2, 3',
              },
              {
                id: 'ISO/IEC 27001:2022',
                focus: 'Information Security Management',
                controls: '93 Controls',
                classes: 'Annex A Security Controls',
              },
              {
                id: 'PCI-DSS v4.0',
                focus: 'Payment Network Boundary Defense',
                controls: '12 Core Requirements',
                classes: 'Requirements 1.0 - 12.0',
              },
            ].map((fw, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-brand-300 transition-all"
              >
                <div className="text-xs font-bold font-mono text-brand-700 bg-brand-50 border border-brand-200 px-2 py-1 rounded w-fit mb-3">
                  {fw.id}
                </div>
                <div className="text-sm font-bold text-slate-900 mb-1">{fw.focus}</div>
                <div className="text-xs text-slate-500 font-medium mb-3">{fw.controls}</div>
                <div className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                  {fw.classes}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Architecture Section ── */}
      <section id="architecture" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-bold text-brand-600 tracking-wider uppercase mb-2">
              System Engineering
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              DESIGNED FOR SOVEREIGN INFRASTRUCTURE
            </h2>
            <p className="text-base text-slate-600 mt-3 font-normal">
              High-performance, single-database architecture leveraging PostgreSQL 16 + pgvector for both
              vector embeddings and relational state.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-8 max-w-4xl mx-auto shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-center text-xs">
              <div className="p-4 rounded-lg bg-white border border-slate-200 font-mono">
                <Server className="w-5 h-5 text-brand-600 mx-auto mb-2" />
                <span className="font-bold text-slate-900 block">MULTI-VENDOR AST</span>
                <span className="text-[11px] text-slate-500">Cisco, Palo, Juniper, Fortinet</span>
              </div>
              <div className="p-4 rounded-lg bg-white border border-slate-200 font-mono">
                <Database className="w-5 h-5 text-brand-600 mx-auto mb-2" />
                <span className="font-bold text-slate-900 block">POSTGRES + PGVECTOR</span>
                <span className="text-[11px] text-slate-500">Dense HNSW + BM25 Lexical</span>
              </div>
              <div className="p-4 rounded-lg bg-white border border-slate-200 font-mono">
                <Cpu className="w-5 h-5 text-brand-600 mx-auto mb-2" />
                <span className="font-bold text-slate-900 block">MISTRAL-7B ENGINE</span>
                <span className="text-[11px] text-slate-500">Deterministic Q4 Local LLM</span>
              </div>
              <div className="p-4 rounded-lg bg-white border border-slate-200 font-mono">
                <Blocks className="w-5 h-5 text-brand-600 mx-auto mb-2" />
                <span className="font-bold text-slate-900 block">EVIDENCE LEDGER</span>
                <span className="text-[11px] text-slate-500">SHA-256 Merkle Blocks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final Call to Action ── */}
      <section className="py-20 bg-gradient-to-b from-[#F8FAFC] to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold uppercase tracking-wider">
            Ready for Operation
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
            MAKE COMPLIANCE VERIFIABLE.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal">
            Bring configuration analysis, regulatory intelligence, remediation, and evidence integrity
            into one sovereign security workflow.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onEnterApp('dashboard')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-sm transition-all"
            >
              Enter AEGIS Command Center <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollTo('architecture')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-sm font-semibold shadow-sm transition-all"
            >
              Explore Architecture
            </button>
          </div>
        </div>
      </section>

      {/* ── Minimal Footer ── */}
      <footer className="border-t border-slate-200 py-10 bg-white text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span className="font-bold text-slate-800">AEGIS-NTRO</span>
            <span>— Sovereign Network Assurance & Compliance Intelligence</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 font-medium">
            <button onClick={() => scrollTo('workflow')} className="hover:text-cyan-700 transition-colors">Platform</button>
            <button onClick={() => scrollTo('evidence')} className="hover:text-cyan-700 transition-colors">Evidence</button>
            <button onClick={() => scrollTo('sovereign-ai')} className="hover:text-cyan-700 transition-colors">Security</button>
            <button onClick={() => onEnterApp('documentation')} className="hover:text-cyan-700 transition-colors">Documentation</button>
            <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" className="hover:text-cyan-700 transition-colors">Swagger API</a>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> All Systems Operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
