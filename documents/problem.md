# AEGIS — Problem Statement & Analysis

> **Document ID**: AEGIS-PRB-001  
> **Version**: 1.0  
> **Classification**: INTERNAL — NTRO Challenge Submission  
> **Last Updated**: 2026-09-28  
> **Predecessor**: [Context Document](./context.md)  

---

## 1. Problem Statement (Formal)

### 1.1 One-Line Problem

> In heterogeneous multi-vendor enterprise networks, there is no unified, AI-driven, tamper-proof system to continuously audit, verify, and enforce compliance of network device configurations against multiple security frameworks simultaneously.

### 1.2 Problem Decomposition

The core problem decomposes into **five interdependent sub-problems**:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    THE COMPLIANCE AUDIT GAP                         │
│                                                                      │
│  P1: PARSING            P2: MAPPING           P3: INTELLIGENCE       │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐       │
│  │ 50+ config   │      │ Framework    │      │ Human-speed  │       │
│  │ syntaxes,    │─────▶│ controls are │─────▶│ auditing     │       │
│  │ no universal │      │ in natural   │      │ cannot keep  │       │
│  │ schema       │      │ language,    │      │ pace with    │       │
│  │              │      │ not code     │      │ config churn │       │
│  └──────────────┘      └──────────────┘      └──────────────┘       │
│         │                     │                      │               │
│         ▼                     ▼                      ▼               │
│  P4: TRUST                  P5: SCALE                                │
│  ┌──────────────┐      ┌──────────────┐                              │
│  │ Audit reports│      │ 10K+ devices │                              │
│  │ can be       │      │ across hybrid│                              │
│  │ tampered,    │      │ topologies   │                              │
│  │ no evidence  │      │ need real-   │                              │
│  │ chain        │      │ time auditing│                              │
│  └──────────────┘      └──────────────┘                              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Problem Analysis

### P1: Configuration Parsing Heterogeneity

**What**: Every vendor uses a proprietary configuration syntax. A single compliance check like "disable Telnet" manifests differently across vendors:

| Vendor | "Disable Telnet" Configuration |
|---|---|
| **Cisco IOS** | `no ip telnet server` or `transport input ssh` on VTY lines |
| **Palo Alto PAN-OS** | Management profile: `set deviceconfig system service disable-telnet yes` |
| **Juniper JUNOS** | `delete system services telnet` |
| **Fortinet FortiOS** | `config system global` → `set admin-telnet disable` |
| **Check Point** | SmartConsole GUI setting, no CLI equivalent |

**Impact**: Without a universal config abstraction layer, every compliance check must be re-implemented per vendor — exponential complexity growth.

**Quantified**: For N compliance controls × M vendors = N×M individual check implementations. With CIS Benchmarks alone (~200 controls) × 10 vendors = **2,000 individual checks** to maintain.

---

### P2: Compliance Rule Ambiguity

**What**: Security frameworks express controls in natural language, creating interpretation gaps:

> **CIS Benchmark Example (Cisco IOS L1 §2.1.1):**  
> *"Ensure 'aaa new-model' is enabled"*  
> — What does "enabled" mean for a device that uses a different AAA syntax entirely?

> **NIST SP 800-53 AC-17:**  
> *"Establish and manage remote access connections"*  
> — What constitutes "managed" varies by organizational risk appetite.

**Impact**: Manual interpretation leads to inconsistent audit results. Two auditors given the same device config and the same framework will produce different compliance reports.

**Root Cause**: Compliance frameworks are written for human judgment, not machine execution.

---

### P3: Speed-of-Audit Gap

**What**: Network configurations change continuously — through planned changes (change management), unplanned changes (break/fix), and malicious changes (compromise). Manual audits run on 3-6 month cycles.

```
Timeline ────────────────────────────────────────────────▶

Config Changes:  ▪ ▪  ▪▪ ▪  ▪ ▪▪▪ ▪  ▪▪ ▪  ▪ ▪▪ ▪  ▪▪▪ ▪

Manual Audit:    ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▓░░

                 ↑                                      ↑
           Audit #1                              Audit #2
           (Point-in-time)                       (6 months later)

RISK WINDOW: ════════════════════════════════════════════
              Undetected misconfigurations persist for months
```

**Impact**: 95%+ of the time between audits, the compliance state is **unknown**. Any misconfiguration introduced after Audit #1 persists undetected until Audit #2.

---

### P4: Audit Integrity / Tamper-Proofing

**What**: Traditional audit reports are PDF/Excel files stored on shared drives. They can be:
- Modified after the fact to hide non-compliance
- Backdated to cover audit gaps
- Selectively omitted for problematic devices
- Destroyed to eliminate evidence of breach

**Impact**: In regulatory or legal proceedings, audit evidence without cryptographic proof of integrity is unreliable. For national-security contexts (NTRO), tamper-proof audit trails are not optional — they are a fundamental requirement.

**Current Gap**: No existing network compliance tool provides blockchain-anchored, immutable audit evidence chains.

---

### P5: Scale & Topology Complexity

**What**: Modern networks span:
- On-premises data centers (legacy + modern)
- Multi-cloud environments (AWS, Azure, GCP)
- SD-WAN overlays
- Remote/branch office networks
- IoT/OT network segments

**Impact**: A single organization may have 10,000+ auditable network devices across these topologies. Each topology has different access methods, credential stores, and connectivity requirements.

---

## 3. Root Cause Analysis (Ishikawa / Fishbone)

```
                                     COMPLIANCE GAP
                                          │
        ┌───────────────┬─────────────────┼─────────────────┬───────────────┐
        │               │                 │                 │               │
    PEOPLE          PROCESS           TECHNOLOGY        STANDARDS       DATA
        │               │                 │                 │               │
   ├─ Skill gap    ├─ Manual          ├─ No universal   ├─ Ambiguous  ├─ Config
   │  in multi-    │  checklist-      │  config parser   │  control     │  formats
   │  vendor       │  based audit     │                  │  language    │  vary
   │  expertise    │                  │                  │              │
   ├─ Auditor      ├─ Infrequent     ├─ Vendor lock-   ├─ Multiple   ├─ No
   │  shortage     │  audit cycles   │  in tools        │  frameworks  │  central
   │               │                  │                  │  overlap     │  CMDB
   ├─ Inconsistent ├─ No continuous  ├─ No tamper-     ├─ Version    ├─ Stale
   │  judgment     │  monitoring     │  proof logging   │  churn       │  baselines
```

---

## 4. Impact Assessment

### 4.1 Business Impact

| Impact Area | Without AEGIS | With AEGIS |
|---|---|---|
| **Audit Cycle Time** | 3-6 months | Continuous (real-time) |
| **Human Hours per Audit** | 400-800 hrs (per cycle) | 40-80 hrs (review + exception handling) |
| **Misconfiguration Detection Rate** | 60-70% (human error) | 95%+ (automated) |
| **Time to Detect Drift** | Days to months | Minutes |
| **Audit Report Integrity** | Unverifiable | Blockchain-proven |
| **Multi-Vendor Coverage** | Partial (tool-dependent) | Complete (plugin architecture) |
| **Compliance Framework Coverage** | 1-2 frameworks per tool | 4+ frameworks simultaneously |

### 4.2 Security Impact

| Threat Scenario | Current Risk | With AEGIS |
|---|---|---|
| **Firewall rule misconfiguration** | High — detected at next audit | Low — detected in minutes |
| **Insecure protocol enabled** | Medium — depends on auditor | Low — automated check |
| **ACL over-permissiveness** | High — complex to audit manually | Low — policy-as-code validation |
| **Audit evidence tampering** | High — no integrity proof | Negligible — blockchain anchoring |
| **Configuration drift after change** | High — no continuous monitoring | Low — drift detection alerts |

### 4.3 Financial Impact

| Cost Category | Current (Manual + Tools) | AEGIS (Projected) |
|---|---|---|
| Annual audit labor | $150K-$500K | $30K-$100K |
| Enterprise compliance tools | $200K-$1M/yr (licenses) | Open-source + infra costs |
| Breach cost (misconfiguration) | $4.45M avg (IBM 2024) | Reduced by 60-80% |
| Regulatory fines | Variable, potentially $M+ | Near-zero (continuous compliance) |

---

## 5. User Pain Point Matrix

| # | Pain Point | Severity | Frequency | Affected Role |
|---|---|---|---|---|
| 1 | Cannot audit all vendors with one tool | Critical | Every audit | Security Engineer |
| 2 | Compliance checks are stale by the time they're complete | High | Every cycle | CISO |
| 3 | No evidence chain for audit findings | Critical | Regulatory review | Compliance Officer |
| 4 | Remediation guidance is generic, not vendor-specific | High | Every finding | Network Admin |
| 5 | Can't map one config change across multiple frameworks | Medium | Change review | GRC Analyst |
| 6 | Audit reports don't quantify risk prioritization | High | Every report | Risk Manager |
| 7 | No way to detect configuration drift between audits | Critical | Continuous | SOC Analyst |
| 8 | Manual audit is boring, error-prone, and burning out staff | High | Continuous | Security Team |

---

## 6. Jobs-to-Be-Done (JTBD)

### Primary JTBD

> **When** a security team manages a multi-vendor network estate,  
> **They want to** verify every device is hardened against mandated security frameworks,  
> **So that** the organization maintains continuous compliance, reduces breach risk, and can prove audit integrity to regulators.

### Supporting JTBDs

| # | Job | Functional | Emotional | Social |
|---|---|---|---|---|
| 1 | Audit a firewall | Get a pass/fail per CIS control | Confidence it's actually checked | Show auditors we're compliant |
| 2 | Fix a finding | Get vendor-specific remediation steps | Not waste hours in vendor docs | Report progress to CISO |
| 3 | Prove compliance | Provide tamper-proof evidence | Trust the audit trail | Satisfy regulators |
| 4 | Monitor drift | Alert on unauthorized config changes | Sleep at night | Demonstrate vigilance |
| 5 | Onboard new vendor | Add device family quickly | Not learn another tool | Keep team velocity |

---

## 7. Hypothesis

> **We believe that** building an AI-driven compliance auditor with multi-vendor config parsing, NLP-based rule interpretation, and blockchain-anchored evidence chains  
> **For** security teams managing heterogeneous network environments  
> **Will** reduce audit cycle time from months to minutes, increase misconfiguration detection rate to 95%+, and provide legally defensible compliance evidence  
> **We'll know we're right when** we can demonstrate automated auditing of 3+ vendor device families against CIS Benchmarks with tamper-proof reporting in a 2-minute demo.

---

> **Next Document**: [Solution Design →](./solution.md)
