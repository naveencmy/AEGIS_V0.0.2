# AEGIS — Project Context Document

> **Document ID**: AEGIS-CTX-001  
> **Version**: 1.0  
> **Classification**: INTERNAL — NTRO Challenge Submission  
> **Last Updated**: 2026-09-28  
> **Authors**: Product & Engineering Team  

---

## 1. Executive Summary

**AEGIS** (Automated Enterprise Governance & Inspection System) is an AI-driven, multi-vendor network security compliance auditor designed to solve the critical gap in heterogeneous network hardening at national-infrastructure scale.

The system addresses NTRO's challenge of automating compliance verification across 50+ device families from 15+ vendors against 4+ regulatory frameworks (CIS Benchmarks, NIST SP 800-53, DISA STIGs, ISO/IEC 27001) — replacing manual, error-prone, checklist-based auditing with an intelligent, tamper-proof, blockchain-anchored audit pipeline.

---

## 2. Problem Domain

### 2.1 Industry Landscape

Modern enterprise networks — particularly those of national-security significance — are inherently **heterogeneous**. A single organization may operate:

| Device Category | Vendors | Config Syntax Variance |
|---|---|---|
| Firewalls & SASE | Palo Alto, Fortinet, Cisco, Check Point, Juniper, Sophos, SonicWall, WatchGuard, Barracuda, Zscaler | High — Each vendor has proprietary CLI, API, and config file formats |
| Routers & Switches | Cisco IOS/NX-OS, Juniper JUNOS, Arista EOS, Huawei VRP, MikroTik RouterOS | Very High — Different config hierarchies, ACL syntaxes |
| Load Balancers | F5 BIG-IP, Citrix ADC, NGINX, HAProxy, AWS ALB/NLB | Medium — Mix of declarative and imperative configs |
| VPN Gateways | Cisco AnyConnect, Palo Alto GlobalProtect, OpenVPN, WireGuard, Fortinet FortiClient | High — Different tunnel configurations, auth schemes |
| IDS/IPS | Snort, Suricata, Cisco Firepower, Palo Alto Threat Prevention | Medium — Rule syntax varies, tuning parameters differ |
| WAFs | Cloudflare, AWS WAF, Imperva, ModSecurity, Akamai | Medium — Rule sets and policy definitions vary |
| Cloud Security Groups | AWS SG/NACL, Azure NSG, GCP Firewall Rules | Low within cloud, High across clouds |
| SD-WAN Controllers | VMware VeloCloud, Cisco Viptela, Fortinet Secure SD-WAN, Silver Peak | High — Overlay/underlay config differences |
| Wireless Controllers | Cisco WLC, Aruba, Ruckus, Meraki | High — SSID, RADIUS, encryption config variations |
| Endpoint Security | CrowdStrike, SentinelOne, Microsoft Defender, Carbon Black | Medium — Policy definition formats differ |

### 2.2 The Core Pain

> **Misconfiguration is the #1 attack vector.** According to Verizon DBIR 2025, configuration errors account for ~28% of initial breach vectors in enterprise environments.

**Current State (Bifurcated Approach):**

```
Option A: Manual Auditing                   Option B: Vendor-Locked Suites
┌─────────────────────────┐                ┌──────────────────────────┐
│ • Checklist-based       │                │ • Expensive ($200K+/yr)  │
│ • Error-prone (human)   │                │ • Single-vendor focus    │
│ • 3-6 months per cycle  │                │ • Poor multi-vendor      │
│ • Inconsistent coverage │                │ • Rigid compliance maps  │
│ • No tamper evidence    │                │ • No blockchain/tamper   │
│ • Doesn't scale         │                │ • Limited AI/NLP         │
└─────────────────────────┘                └──────────────────────────┘
```

**Neither option** serves a heterogeneous, multi-vendor environment at the speed, accuracy, and auditability required by national-security organizations.

### 2.3 Regulatory Pressure

| Framework | Scope | Audit Frequency | Penalty for Non-Compliance |
|---|---|---|---|
| **CIS Benchmarks** | Device-level hardening | Continuous | Audit failure, insurance denial |
| **NIST SP 800-53** | Federal information systems | Annual + continuous monitoring | Loss of ATO, federal contract risk |
| **DISA STIGs** | DoD/defense networks | Every release cycle | Systems taken offline |
| **ISO/IEC 27001** | Enterprise-wide ISMS | Annual surveillance + 3-year recertification | Certification revocation |

---

## 3. Stakeholder Map

### 3.1 Primary Stakeholders

| Stakeholder | Role | Key Concerns | Success Metric |
|---|---|---|---|
| **NTRO** | Problem owner, evaluator | National security posture, innovation | Working prototype demonstrating core capabilities |
| **Network Security Teams** | Primary users | Accurate audits, reduced workload | 80%+ reduction in manual audit hours |
| **CISO / Security Leadership** | Decision makers | Compliance assurance, risk visibility | Real-time compliance dashboard, tamper-proof reports |
| **Compliance Officers** | Report consumers | Audit trail integrity, framework mapping | Blockchain-anchored audit logs |
| **DevSecOps Engineers** | Integrators | API access, CI/CD hooks | RESTful API, webhook support |

### 3.2 Secondary Stakeholders

| Stakeholder | Interest |
|---|---|
| **Auditors (Internal/External)** | Verifiable, immutable audit trails |
| **Vendor TAC Teams** | Remediation guidance accuracy |
| **Risk Management** | Quantified risk scoring per device/segment |
| **SOC Analysts** | Real-time misconfiguration alerts |

---

## 4. Competitive Landscape

### 4.1 Existing Solutions & Gaps

| Solution | Multi-Vendor | AI/NLP | Blockchain | Continuous Audit | Open/Flexible |
|---|---|---|---|---|---|
| **Qualys Policy Compliance** | Partial | No | No | Yes | No (Proprietary) |
| **Tripwire Enterprise** | Partial | No | No | Yes | No |
| **Algosec / Tufin** | Firewall-focused | Limited | No | Yes | No |
| **Nipper Studio** | Yes | No | No | Batch | Partial |
| **AEGIS (Ours)** | **Full** | **Yes (NLP)** | **Yes** | **Yes** | **Yes** |

### 4.2 Differentiation Strategy

AEGIS sits in the unique quadrant of **High AI/NLP Capability + Full Multi-Vendor Coverage** — a space no existing commercial solution occupies. The addition of blockchain-anchored audit trails creates a third axis of differentiation that is especially relevant for government/defense contexts.

---

## 5. Technical Context

### 5.1 Key Technical Challenges

1. **Config Parsing Heterogeneity**: 50+ distinct configuration syntaxes, each with vendor-specific idioms, versioning, and deprecated constructs.
2. **Compliance Rule Mapping**: Translating natural-language framework controls (e.g., "Ensure SSH idle timeout is ≤ 300 seconds") to vendor-specific config checks.
3. **NLP for Rule Interpretation**: Using LLMs/NLP to parse ambiguous compliance language into executable audit policies.
4. **Tamper-Proof Evidence Chain**: Blockchain anchoring of audit snapshots, diffs, and remediation actions.
5. **Scale**: Auditing 10,000+ devices across hybrid on-prem/cloud/SD-WAN topologies within SLA.
6. **Real-Time Drift Detection**: Detecting configuration drift between audit cycles.

### 5.2 Technology Constraints

- Must operate in **air-gapped environments** (NTRO context) — on-premises LLM inference capability required
- Must support **Indian government cloud** deployment targets
- Must handle **classified configurations** — data never leaves the sovereign perimeter
- Must integrate with existing **SIEM/SOAR** platforms (Splunk, QRadar, XSOAR)

### 5.3 Data Sources

| Source Type | Format | Volume | Frequency |
|---|---|---|---|
| Device Configs | CLI output, XML, JSON, YAML | 10-50 KB per device | On-demand + scheduled |
| Compliance Frameworks | PDF, XML (XCCDF/OVAL), structured DB | Static, updated quarterly | Pull on release |
| Vendor CVE Feeds | NVD JSON, vendor-specific | Streaming | Real-time |
| Audit Logs | Syslog, SNMP, API | High volume | Continuous |
| Remediation Knowledge Base | Vendor documentation, community | Semi-structured | Curated |

---

## 6. Success Criteria (NTRO Evaluation)

### 6.1 Deliverables Checklist

| # | Deliverable | Format | Status |
|---|---|---|---|
| 1 | Source Code | GitHub Repository | ⬜ Not Started |
| 2 | README with Setup Instructions | Markdown | ⬜ Not Started |
| 3 | Architecture Document | PDF/MD (Max 2 Pages) | ⬜ Not Started |
| 4 | Demo Video | MP4 (Max 2 Minutes) | ⬜ Not Started |
| 5 | Technical Presentation | PPTX/PDF (Max 5 Slides) | ⬜ Not Started |

### 6.2 Evaluation Dimensions

| Dimension | Weight | AEGIS Target |
|---|---|---|
| **Innovation** | High | Breakthrough — NLP-driven compliance, blockchain audit trail |
| **Technical Feasibility** | High | Working demo with 3+ vendor parsers |
| **Impact & Benefits** | High | Quantified: hours saved, misconfiguration detection rate |
| **Scalability** | Medium | Architecture supporting 10K+ devices |
| **User Experience** | Medium | Clean dashboard, actionable remediation |

---

## 7. Constraints & Assumptions

### 7.1 Constraints

- **Timeline**: Prototype must be demonstrable by September 20, 2026
- **Team Size**: Hackathon-scale team (4-6 members)
- **Compute**: Must work on standard cloud VMs (no specialized hardware)
- **Data**: No access to real classified configs — use synthetic/public datasets for demo

### 7.2 Assumptions

- CIS Benchmark documents (PDF) can be parsed programmatically
- Sample device configs from vendor documentation are available for testing
- Blockchain can be implemented as a permissioned ledger (Hyperledger Fabric or similar)
- On-premises LLM inference is feasible with quantized models (e.g., Llama 3.x 8B)
- NTRO evaluators will assess working prototype quality, not production-readiness

---

## 8. Glossary

| Term | Definition |
|---|---|
| **ACL** | Access Control List — rules governing network traffic |
| **ATO** | Authority to Operate — formal authorization for system deployment |
| **CIS** | Center for Internet Security — publishes security benchmarks |
| **DISA STIG** | Defense Information Systems Agency Security Technical Implementation Guide |
| **NIST SP 800-53** | National Institute of Standards and Technology Special Publication on Security Controls |
| **SASE** | Secure Access Service Edge — cloud-delivered security framework |
| **SD-WAN** | Software-Defined Wide Area Network |
| **XCCDF** | Extensible Configuration Checklist Description Format |
| **OVAL** | Open Vulnerability and Assessment Language |
| **NLP** | Natural Language Processing |
| **SIEM** | Security Information and Event Management |
| **SOAR** | Security Orchestration, Automation, and Response |

---

> **Next Document**: [Problem Statement →](./problem.md)
