# AEGIS — Product Requirements Document (PRD)

> **Document ID**: AEGIS-PRD-001  
> **Version**: 1.0  
> **Status**: Draft — Pending Stakeholder Review  
> **Classification**: INTERNAL — NTRO Challenge Submission  
> **Created**: 2026-09-28  
> **Last Updated**: 2026-09-28  
> **Product Owner**: [TBD]  
> **Engineering Lead**: [TBD]  
> **Design Lead**: [TBD]  
> **Target Release**: September 20, 2026 (SIH 2026 Submission)  

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Success Metrics](#3-goals--success-metrics)
4. [Target Users & Personas](#4-target-users--personas)
5. [User Stories & Acceptance Criteria](#5-user-stories--acceptance-criteria)
6. [Feature Requirements (MoSCoW)](#6-feature-requirements-moscow)
7. [Detailed Feature Specifications](#7-detailed-feature-specifications)
8. [Information Architecture & Wireframes](#8-information-architecture--wireframes)
9. [Data Requirements](#9-data-requirements)
10. [AI/ML Product Requirements](#10-aiml-product-requirements)
11. [Blockchain Product Requirements](#11-blockchain-product-requirements)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [Integration Requirements](#13-integration-requirements)
14. [Constraints & Dependencies](#14-constraints--dependencies)
15. [Release Plan & Milestones](#15-release-plan--milestones)
16. [Risk Register](#16-risk-register)
17. [Open Questions](#17-open-questions)
18. [Appendices](#18-appendices)

---

## 1. Product Overview

### 1.1 Product Name

**AEGIS** — Automated Enterprise Governance & Inspection System

### 1.2 One-Liner

> An AI-powered compliance auditor that automatically verifies network device configurations from any vendor against security frameworks (CIS, NIST, STIG, ISO 27001), producing tamper-proof, blockchain-anchored audit evidence with vendor-specific remediation guidance.

### 1.3 Product Vision

**For** network security teams managing heterogeneous, multi-vendor enterprise networks  
**Who** struggle with manual, slow, error-prone compliance auditing that cannot scale  
**AEGIS is** an AI-driven compliance automation platform  
**That** continuously audits device configurations against multiple security frameworks, provides vendor-specific remediation, and produces cryptographically tamper-proof evidence  
**Unlike** manual auditing or vendor-locked compliance tools (Qualys, Tripwire, Algosec)  
**Our product** works across all vendors, uses NLP to interpret compliance rules, and anchors every audit to a blockchain ledger — making compliance continuous, intelligent, and provably trustworthy.

### 1.4 Strategic Context

This product is being developed for the **Smart India Hackathon (SIH) 2026**, Problem Statement by the **National Technical Research Organisation (NTRO)**, under the domain **Blockchain & Cybersecurity**.

| Attribute | Value |
|---|---|
| Challenge | AI-Driven Multi-Vendor Network Security Compliance Auditor |
| Organization | National Technical Research Organisation (NTRO) |
| Domain | Software — Blockchain & Cybersecurity |
| Deadline | September 20, 2026 |
| Submission Limit | 0/500 ideas |

### 1.5 Related Documents

| Document | Location |
|---|---|
| Context Document | [context.md](./context.md) |
| Problem Analysis | [problem.md](./problem.md) |
| Solution Design | [solution.md](./solution.md) |
| Security Design | [security.md](./security.md) |
| Architecture Document | [architecture.md](./architecture.md) |
| SRS + SDS | [design.md](./design.md) |

---

## 2. Problem Statement

### 2.1 The Problem

Modern enterprise networks contain thousands of devices from dozens of vendors. Each device must comply with security hardening standards (CIS, NIST, STIG, ISO 27001). Today, organizations face a **binary choice**:

| Option | Pros | Cons |
|---|---|---|
| **Manual Auditing** | Flexible, vendor-agnostic | Slow (3-6 months), error-prone, doesn't scale, no evidence integrity |
| **Enterprise Compliance Tools** | Automated, fast | Vendor-locked, expensive ($200K+/yr), rigid, no blockchain |

**Neither option** delivers what modern networks need: **continuous, AI-driven, vendor-agnostic, tamper-proof compliance auditing**.

### 2.2 Why Now?

1. **Regulatory intensification**: CIS, NIST, and ISO frameworks now demand continuous monitoring, not periodic audits
2. **Network complexity growth**: Hybrid cloud + SD-WAN + IoT has tripled the device count in 5 years
3. **AI maturity**: On-premises LLMs (Llama 3.x) can now interpret compliance rules locally without cloud dependency
4. **Blockchain adoption**: Permissioned ledgers (Hyperledger Fabric) are production-ready for evidence chains
5. **Breach economics**: Average breach cost from misconfiguration is $4.45M (IBM 2024) — prevention ROI is massive

### 2.3 Evidence of Problem (Data)

| Statistic | Source |
|---|---|
| 28% of breaches originate from configuration errors | Verizon DBIR 2025 |
| 73% of organizations fail at least one CIS benchmark control at any point | CIS Benchmark Report 2025 |
| Average time to detect misconfiguration: 197 days | Ponemon Institute 2024 |
| 60% of security teams cite "too many tools" as a top challenge | ESG Research 2025 |
| $4.45M average breach cost | IBM Cost of a Data Breach 2024 |

---

## 3. Goals & Success Metrics

### 3.1 Product Goals

| # | Goal | Type | Timeline |
|---|---|---|---|
| G1 | Demonstrate automated multi-vendor config parsing (3+ vendors) | Demo | MVP |
| G2 | Show AI-driven compliance rule interpretation from natural language | Demo | MVP |
| G3 | Produce blockchain-anchored, verifiable audit evidence | Demo | MVP |
| G4 | Deliver vendor-specific remediation guidance for findings | Demo | MVP |
| G5 | Present real-time compliance dashboard with drill-down | Demo | MVP |
| G6 | Win SIH 2026 evaluation by demonstrating innovation depth | Strategic | Sept 20, 2026 |

### 3.2 North Star Metric

> **Compliance Verification Accuracy**: The percentage of security controls that AEGIS correctly evaluates (pass/fail/NA) compared to expert human auditor results.
>
> **Target**: ≥ 90% accuracy on demo dataset

### 3.3 Success Metrics (AARRR Framework)

| Stage | Metric | MVP Target | Production Target |
|---|---|---|---|
| **Acquisition** | Evaluator engagement in demo | 100% attention for 2 min | N/A (enterprise) |
| **Activation** | Time from install to first audit | ≤ 15 minutes | ≤ 30 minutes |
| **Retention** | Audit runs per week (per org) | N/A (demo) | ≥ 5 scheduled audits/week |
| **Revenue** | N/A (hackathon) | N/A | Enterprise license |
| **Referral** | Evaluator recommendation score | ≥ 8/10 | NPS ≥ 50 |

### 3.4 Key Performance Indicators (KPIs)

| KPI | Definition | Target |
|---|---|---|
| **Parse Success Rate** | % of configs successfully parsed to canonical schema | ≥ 95% |
| **Compliance Check Accuracy** | % of controls correctly evaluated vs. human expert | ≥ 90% |
| **NLP Rule Accuracy** | % of AI-interpreted rules matching expert-created rules | ≥ 85% |
| **Audit Execution Time** | Time to complete full audit (100 devices, CIS) | ≤ 60 seconds |
| **Blockchain Anchor Rate** | % of audits with successful blockchain evidence | 100% |
| **False Positive Rate** | % of FAIL findings that are incorrect | ≤ 10% |
| **Remediation Relevance** | % of remediation steps rated "useful" by evaluator | ≥ 80% |

### 3.5 Anti-Goals (What We Are NOT Building)

| Anti-Goal | Rationale |
|---|---|
| Active network scanner (port scanning, vulnerability scanning) | AEGIS is a configuration auditor, not a scanner |
| Device configuration push (auto-remediation) | Too risky for hackathon; remediation is advisory only |
| Full production deployment pipeline | Demo quality, not prod-ready DevOps |
| Real-time network traffic analysis | Out of scope; focus on config-level compliance |
| Endpoint security agent | AEGIS audits network devices, not endpoints |
| Complete coverage of all CIS/NIST/STIG controls | MVP covers key controls; completeness is post-hackathon |

---

## 4. Target Users & Personas

### 4.1 Persona: Arjun — Senior Network Security Engineer

| Attribute | Detail |
|---|---|
| **Name** | Arjun Mehta |
| **Role** | Senior Network Security Engineer |
| **Organization** | Government ministry IT cell, 2,000+ devices |
| **Experience** | 8 years in network security |
| **Technical Level** | Expert — CLI, scripting, multi-vendor experience |
| **Current Tools** | Cisco ASDM, FortiManager, manual Excel checklists |
| **Pain Points** | Spends 2 weeks per quarter manually auditing 500 devices. Different checklist per vendor. Reports are questioned because there is no evidence trail. Cannot keep up with CIS benchmark updates. |
| **Goals** | Automate 80% of audit work. Get a single view of compliance across vendors. Produce reports that auditors trust. |
| **Quote** | *"I know my network is probably non-compliant right now. I just can't prove where, fast enough."* |
| **Scenario** | Arjun uploads a batch of Cisco IOS, Palo Alto, and Fortinet configs. AEGIS parses all three, runs CIS benchmarks, and presents a unified compliance dashboard showing 3 critical findings across 2 vendors. Arjun drills down, sees the exact config lines at fault, and downloads vendor-specific remediation commands. The audit is anchored to blockchain — he exports a verifiable certificate for the compliance officer. |

---

### 4.2 Persona: Priya — Chief Information Security Officer

| Attribute | Detail |
|---|---|
| **Name** | Priya Sharma |
| **Role** | CISO |
| **Organization** | National infrastructure operator |
| **Experience** | 15 years in cybersecurity leadership |
| **Technical Level** | Medium — understands concepts, delegates execution |
| **Current Tools** | SIEM dashboards, vendor quarterly reports, internal audit team |
| **Pain Points** | No real-time visibility into compliance posture. Board asks for compliance percentage — she doesn't have a reliable number. Audit reports arrive months after the audit period. Cannot prove to regulators that audits are untampered. |
| **Goals** | See real-time compliance score. Demonstrate to board that compliance is improving. Provide regulators with irrefutable audit evidence. |
| **Quote** | *"The board asks me every quarter: are we compliant? I always say 'mostly.' I need to say 'here's the number, here's the proof.'"* |
| **Scenario** | Priya opens the AEGIS executive dashboard. She sees an enterprise-wide compliance score of 87.3%, up from 81.2% last quarter. She clicks into the trend chart, sees the improvement trajectory, and identifies 2 device groups pulling the score down. She exports a PDF report with a blockchain verification QR code and sends it to the board. |

---

### 4.3 Persona: Ravi — Compliance Officer

| Attribute | Detail |
|---|---|
| **Name** | Ravi Kumar |
| **Role** | Compliance & GRC Analyst |
| **Organization** | Defense research institute |
| **Experience** | 6 years in governance, risk, and compliance |
| **Technical Level** | Low-Medium — reads reports, doesn't configure devices |
| **Current Tools** | Microsoft Excel, Adobe Acrobat, internal audit forms |
| **Pain Points** | Receives audit reports as PDFs from the security team. Has no way to verify if they're complete or tampered. During external audits, cannot prove when an audit was conducted or that findings haven't been selectively omitted. Mapping one device's compliance across CIS + NIST + ISO is manual cross-referencing. |
| **Goals** | Verify audit report integrity cryptographically. Map compliance across multiple frameworks. Provide external auditors with self-verifiable evidence. |
| **Quote** | *"When the external auditor asks me to prove this report hasn't been modified, I literally have nothing. It's just a PDF on a shared drive."* |
| **Scenario** | An external auditor requests proof of last quarter's compliance audit. Ravi opens the AEGIS Blockchain Verifier, enters the audit ID, and the system shows: "VERIFIED — Audit anchored on Block #1247 on 2026-06-15T14:32:00Z. Hash chain intact. No tampering detected." Ravi exports the verification certificate and hands it to the auditor. |

---

### 4.4 Persona: Deepak — Network Administrator

| Attribute | Detail |
|---|---|
| **Name** | Deepak Patel |
| **Role** | Network Administrator |
| **Organization** | State government IT department |
| **Experience** | 4 years managing Cisco and Fortinet devices |
| **Technical Level** | High — daily CLI user |
| **Current Tools** | PuTTY, SecureCRT, vendor documentation |
| **Pain Points** | When an audit finding says "disable insecure protocols," he has to look up the exact command for each vendor. Different OS versions have different syntax. No rollback guidance if a fix breaks something. |
| **Goals** | Get copy-paste remediation commands for his exact vendor/version. Know the risk level of each fix. Have rollback steps if something goes wrong. |
| **Quote** | *"Tell me the exact command for FortiOS 7.4. Don't make me search the 600-page admin guide."* |
| **Scenario** | Deepak receives a finding from AEGIS: "CIS 2.1.1 FAIL — Telnet enabled on FortiGate-200F (FortiOS 7.4.3)." He clicks "View Remediation" and sees: Step 1: `config system global` → Step 2: `set admin-telnet disable` → Step 3: `end`. Verification: `get system global | grep telnet`. Rollback: `set admin-telnet enable`. Risk: LOW (no service restart). Estimated time: 2 minutes. |

---

## 5. User Stories & Acceptance Criteria

### 5.1 Epic 1: Configuration Ingestion & Parsing

#### US-1.1: Upload Device Configuration

> **As a** Security Engineer,  
> **I want to** upload a network device configuration file,  
> **So that** AEGIS can analyze it for compliance without needing live device access.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | System accepts .txt, .conf, .xml, .json, .cfg file formats | Upload each format successfully |
| AC-2 | Maximum file size of 10MB supported | Upload 10MB file → success; 11MB → rejected with error |
| AC-3 | Vendor auto-detected from config content with ≥95% accuracy | Upload known vendor configs → vendor correctly identified |
| AC-4 | Upload confirmation shows: config ID, detected vendor, file hash | Verify all fields present in response |
| AC-5 | Config stored encrypted at rest | Verify database column is encrypted |
| AC-6 | Invalid/corrupted files rejected with user-friendly error message | Upload binary/empty file → clear error |

**Priority**: Must Have  
**Story Points**: 5  
**Dependencies**: None

---

#### US-1.2: Auto-Detect Vendor

> **As a** Security Engineer,  
> **I want** AEGIS to automatically identify the vendor and OS from the config file content,  
> **So that** I don't have to manually specify vendor for each upload.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | Cisco IOS/IOS-XE configs detected by presence of `version`, `hostname`, `interface` keywords | Upload Cisco config → "cisco_ios" returned |
| AC-2 | Palo Alto PAN-OS configs detected by XML structure and `<config>` root | Upload PA XML → "palo_alto" returned |
| AC-3 | Fortinet FortiOS configs detected by `config system global`, `edit`, `next` patterns | Upload FortiOS config → "fortios" returned |
| AC-4 | Unknown vendor returns "unknown" with suggestion to manually specify | Upload random text → "unknown" + guidance |
| AC-5 | Detection completes in < 200ms | Performance test with 100 sequential detections |
| AC-6 | Confidence score returned (0.0-1.0) with each detection | Verify score present and reasonable |

**Priority**: Must Have  
**Story Points**: 3  
**Dependencies**: US-1.1

---

#### US-1.3: Parse Configuration to Canonical Schema

> **As a** Security Engineer,  
> **I want** the uploaded config to be parsed into a standardized format,  
> **So that** compliance checks can work the same way regardless of vendor.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | Cisco IOS configs parsed to extract: services, AAA, ACLs, logging, crypto, banners | Upload known Cisco config → verify all sections present |
| AC-2 | Palo Alto configs parsed to extract: security profiles, zones, management settings, logging | Upload known PA config → verify all sections present |
| AC-3 | Fortinet configs parsed to extract: system global, firewall policy, admin settings, logging | Upload known FortiOS config → verify all sections present |
| AC-4 | Canonical schema output validates against JSON Schema | Run schema validation on every parse output |
| AC-5 | Parse completes in < 500ms per config | Performance test with timer |
| AC-6 | Unmapped/unparsed config sections reported (not silently dropped) | Verify `unmapped_sections` list populated |
| AC-7 | Config version stored with device association | Upload 2 configs for same device → 2 versions stored |

**Priority**: Must Have  
**Story Points**: 13  
**Dependencies**: US-1.2

---

### 5.2 Epic 2: Compliance Audit Engine

#### US-2.1: Run Compliance Audit

> **As a** Security Engineer,  
> **I want to** run a compliance audit against selected devices and frameworks,  
> **So that** I can see which devices are non-compliant and why.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | User can select devices (individual, group, or all) | UI/API allows each selection mode |
| AC-2 | User can select compliance framework (CIS, NIST, STIG, ISO) | Framework dropdown/multi-select works |
| AC-3 | Audit produces per-device, per-control results (PASS/FAIL/NA) | Verify finding records created for each combination |
| AC-4 | Each finding includes: control ID, status, actual value, expected value, evidence text | Verify all fields populated on sample finding |
| AC-5 | Compliance score calculated as (passed / (passed + failed)) × 100 | Verify calculation with known test data |
| AC-6 | Audit completes in < 60 seconds for 100 devices against CIS | Performance test |
| AC-7 | Audit results persisted and queryable by audit run ID | API query returns complete results |

**Priority**: Must Have  
**Story Points**: 13  
**Dependencies**: US-1.3, US-2.2

---

#### US-2.2: Manage Compliance Rules

> **As a** Security Engineer,  
> **I want to** view, add, and modify compliance rules,  
> **So that** I can customize which controls are checked and how they are evaluated.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | Pre-loaded rules for CIS Benchmark key controls (20-30 controls) | Verify rules exist in DB on first startup |
| AC-2 | Each rule shows: framework, control ID, title, severity, structured check, source | UI/API returns all fields |
| AC-3 | Rules can be added manually via structured JSON | POST rule → rule created and usable |
| AC-4 | Rules can be AI-interpreted from natural language text | POST control text → structured rule generated |
| AC-5 | AI-interpreted rules flagged with "pending_review" status | Verify status field on AI-generated rules |
| AC-6 | Rule version history maintained | Edit rule → previous version accessible |

**Priority**: Must Have  
**Story Points**: 8  
**Dependencies**: US-3.1

---

#### US-2.3: View Compliance Findings

> **As a** Security Engineer,  
> **I want to** explore audit findings with filters and drill-down,  
> **So that** I can prioritize remediation by severity and impact.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | Findings filterable by: severity, status, framework, device, device group | Apply each filter → results update correctly |
| AC-2 | Findings sortable by: severity (default), device, control ID, status | Sort by each column → order correct |
| AC-3 | Finding detail view shows: control description, actual config, expected config, evidence | Click finding → detail panel opens with all fields |
| AC-4 | Findings exportable to CSV and PDF | Export → valid file downloaded |
| AC-5 | Severity distribution shown as chart (critical/high/medium/low) | Chart renders with correct counts |
| AC-6 | Pagination for large result sets (50 per page default) | Navigate pages → correct data shown |

**Priority**: Should Have  
**Story Points**: 8  
**Dependencies**: US-2.1

---

#### US-2.4: Detect Configuration Drift

> **As a** Security Engineer,  
> **I want** AEGIS to automatically detect when a device's configuration has changed since the last audit,  
> **So that** I can investigate whether the change introduced a compliance violation.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | When a new config is uploaded for an existing device, diff is computed automatically | Upload second config → drift report generated |
| AC-2 | Diff shows: changed fields, previous values, new values | Verify diff content is accurate |
| AC-3 | Changes classified by security impact: critical/high/medium/low/info | Verify classification on known changes |
| AC-4 | Critical/high changes trigger an alert (dashboard notification) | Make critical change → alert visible |
| AC-5 | Drift report accessible from device detail view | Navigate to device → drift tab shows report |

**Priority**: Should Have  
**Story Points**: 5  
**Dependencies**: US-1.3

---

### 5.3 Epic 3: AI/NLP Compliance Intelligence

#### US-3.1: Interpret Compliance Rule from Natural Language

> **As a** Security Engineer,  
> **I want to** paste a compliance control description (from CIS/NIST/STIG PDF) and have AEGIS automatically generate a structured audit rule,  
> **So that** I don't have to manually translate every control into a machine-checkable rule.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | Input accepts free-text compliance control description | Paste CIS control text → input accepted |
| AC-2 | LLM generates structured rule with: check path, operator, expected value, severity | Verify output JSON has all fields |
| AC-3 | Confidence score (0.0-1.0) assigned to each interpretation | Verify score present and varies by clarity |
| AC-4 | Rules with confidence < 0.8 automatically flagged for human review | Submit ambiguous text → status = "pending_review" |
| AC-5 | Interpretation completes in < 5 seconds | Timer test |
| AC-6 | Results cached — identical input returns cached result instantly | Submit same text twice → second is < 100ms |
| AC-7 | Works fully offline (on-premises LLM, no external API calls) | Disconnect internet → still works |

**Priority**: Must Have  
**Story Points**: 13  
**Dependencies**: None (but requires LLM model deployment)

---

#### US-3.2: Generate Remediation from AI

> **As a** Network Administrator,  
> **I want** AEGIS to generate vendor-specific remediation steps when no pre-built playbook exists,  
> **So that** I always have actionable guidance for every finding.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | AI-generated remediation includes: steps, verification command, risk assessment | Verify all sections present |
| AC-2 | Remediation is vendor and OS-version specific | Check commands are correct for target vendor |
| AC-3 | AI-generated playbooks clearly labeled as "AI-Generated — Review Before Use" | Warning banner visible in UI |
| AC-4 | Generation completes in < 10 seconds | Timer test |
| AC-5 | Generated playbooks can be approved by admin (promoting to "approved" status) | Approve → status changes, warning removed |

**Priority**: Should Have  
**Story Points**: 8  
**Dependencies**: US-3.1

---

### 5.4 Epic 4: Blockchain Audit Evidence

#### US-4.1: Anchor Audit to Blockchain

> **As a** Compliance Officer,  
> **I want** every completed audit to be cryptographically anchored to an immutable blockchain ledger,  
> **So that** audit results cannot be tampered with after the fact.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | On audit completion, config snapshot hash (SHA-256) computed | Verify hash matches manual computation |
| AC-2 | Audit results hash (SHA-256) computed | Verify hash matches manual computation |
| AC-3 | Both hashes submitted as a block to the ledger | Verify block created in ledger |
| AC-4 | Block includes: timestamp, auditor identity, Merkle root, previous block hash | Verify all fields in block record |
| AC-5 | Blockchain anchoring completes within 10 seconds of audit completion | Timer test |
| AC-6 | Audit detail view shows blockchain status: "Anchored" + block ID | UI displays blockchain badge |

**Priority**: Must Have  
**Story Points**: 8  
**Dependencies**: US-2.1

---

#### US-4.2: Verify Audit Integrity

> **As an** External Auditor,  
> **I want to** independently verify that a specific audit report has not been tampered with,  
> **So that** I can trust the audit evidence without relying on the organization's word.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | User enters audit ID → system recomputes all hashes from current data | Trigger verification → hashes recomputed |
| AC-2 | Recomputed hashes compared with blockchain-stored hashes | Comparison logic correct |
| AC-3 | Result: VALID (all match), TAMPERED (any mismatch), MISSING (no block) | Test all three scenarios |
| AC-4 | If TAMPERED: specific tampered element identified (config vs. results) | Modify results in DB → "results_hash tampered" shown |
| AC-5 | Verification certificate exportable as PDF with QR code | Export → PDF with QR code generated |
| AC-6 | Full chain integrity verification available (all blocks in sequence) | Trigger full chain verify → all blocks checked |

**Priority**: Must Have  
**Story Points**: 8  
**Dependencies**: US-4.1

---

### 5.5 Epic 5: Remediation Guidance

#### US-5.1: View Vendor-Specific Remediation

> **As a** Network Administrator,  
> **I want to** see exact CLI commands to fix a compliance finding on my specific vendor and OS version,  
> **So that** I can remediate quickly without searching vendor documentation.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | Remediation includes numbered steps with exact CLI commands | Verify commands are vendor-accurate |
| AC-2 | Verification command provided to confirm fix was applied | Run verification → output matches expected |
| AC-3 | Risk level (LOW/MEDIUM/HIGH) for the remediation action | Risk field present and reasonable |
| AC-4 | Rollback steps provided in case fix causes issues | Rollback section present with commands |
| AC-5 | Estimated time to apply fix shown | Time estimate present |
| AC-6 | Commands are copy-pasteable (no formatting artifacts) | Copy from UI → paste to terminal works |

**Priority**: Should Have  
**Story Points**: 5  
**Dependencies**: US-2.1

---

### 5.6 Epic 6: Compliance Dashboard

#### US-6.1: View Executive Compliance Overview

> **As a** CISO,  
> **I want** a dashboard showing enterprise-wide compliance score with trends,  
> **So that** I can report to the board with confidence.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | Overall compliance score (%) displayed prominently | Score visible immediately on page load |
| AC-2 | Trend chart showing compliance score over last 6 audit cycles | Chart renders with historical data |
| AC-3 | Breakdown by severity: critical/high findings count | Severity widget accurate |
| AC-4 | Breakdown by device group or location | Group/location filter works |
| AC-5 | Top 5 failing controls listed | List accurate and clickable |
| AC-6 | Dashboard loads in < 2 seconds | Performance test |
| AC-7 | Export to PDF with branding | PDF generated with all dashboard content |

**Priority**: Should Have  
**Story Points**: 8  
**Dependencies**: US-2.1

---

#### US-6.2: View Device Compliance Detail

> **As a** Security Engineer,  
> **I want to** click into any device and see its full compliance status,  
> **So that** I can understand exactly what's passing and failing on that device.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | Device detail page shows: hostname, vendor, model, OS version, IP, last audit time | All metadata fields displayed |
| AC-2 | Per-control compliance status shown as color-coded list (green=PASS, red=FAIL, gray=NA) | Visual coding correct |
| AC-3 | Each finding expandable to show evidence and remediation | Click expand → detail shown |
| AC-4 | Config version history accessible from device page | Version history tab works |
| AC-5 | Drift indicator shown if config changed since last audit | Drift badge visible when applicable |

**Priority**: Should Have  
**Story Points**: 5  
**Dependencies**: US-6.1

---

#### US-6.3: Browse Blockchain Audit Chain

> **As an** Auditor,  
> **I want to** browse the complete chain of audit evidence blocks,  
> **So that** I can verify the continuity and integrity of the audit history.

**Acceptance Criteria:**

| # | Criterion | Verification |
|---|---|---|
| AC-1 | Chain browser shows blocks in reverse chronological order | Order is correct |
| AC-2 | Each block shows: block #, timestamp, audit ID, hash (truncated), auditor | All fields present |
| AC-3 | Click block → full block detail with all hashes and Merkle root | Detail view opens |
| AC-4 | "Verify Chain" button checks integrity of entire chain | Button triggers verification → result shown |
| AC-5 | Visual indicator for chain integrity (green = intact, red = broken) | Color coding works |

**Priority**: Should Have  
**Story Points**: 5  
**Dependencies**: US-4.1

---

## 6. Feature Requirements (MoSCoW)

### 6.1 Must Have (MVP — Demo Day)

| # | Feature | User Stories | Demo Value |
|---|---|---|---|
| M1 | **Multi-vendor config upload & parsing** (Cisco IOS, Palo Alto, Fortinet) | US-1.1, US-1.2, US-1.3 | Core differentiator — shows multi-vendor capability |
| M2 | **Canonical security schema normalization** | US-1.3 | Enables vendor-agnostic compliance |
| M3 | **CIS Benchmark compliance audit** (20-30 key controls) | US-2.1, US-2.2 | Shows automated compliance checking |
| M4 | **AI/NLP compliance rule interpretation** (5-10 demo rules) | US-3.1 | Key innovation — NLP for security |
| M5 | **Blockchain audit evidence** (simulated ledger for demo) | US-4.1, US-4.2 | Trust & tamper-proofing differentiator |
| M6 | **Basic compliance results API** | US-2.1 | Backend working proof |

### 6.2 Should Have (Demo Polish)

| # | Feature | User Stories | Demo Value |
|---|---|---|---|
| S1 | **Compliance dashboard** (3 views: Executive, Device, Findings) | US-6.1, US-6.2 | Visual wow factor for evaluators |
| S2 | **Vendor-specific remediation** (pre-built for MVP controls) | US-5.1 | Actionable output — not just audit |
| S3 | **Configuration drift detection** | US-2.4 | Shows continuous monitoring capability |
| S4 | **Finding exploration with filters** | US-2.3 | UX quality signal |
| S5 | **AI remediation generation** | US-3.2 | Deepens AI narrative |

### 6.3 Could Have (If Time Permits)

| # | Feature | Value |
|---|---|---|
| C1 | Multi-framework audit (NIST + STIG + ISO alongside CIS) | Breadth of compliance coverage |
| C2 | Risk-weighted compliance scoring (CVSS-based) | Sophistication signal |
| C3 | PDF report generation with blockchain certificate | Professional output |
| C4 | Real-time dashboard updates (WebSocket) | Technical impressiveness |
| C5 | SIEM webhook integration | Enterprise readiness signal |

### 6.4 Won't Have (Explicitly Out of Scope)

| # | Feature | Reason |
|---|---|---|
| W1 | Live SSH/NETCONF device connection | Demo uses file upload; live access is risky for hackathon |
| W2 | Auto-remediation (config push) | Safety concern; advisory only |
| W3 | Full CIS Benchmark coverage (all 200+ controls) | Time constraint; 20-30 key controls sufficient |
| W4 | Multi-tenant / organization support | Single-tenant for demo |
| W5 | User management UI | Hardcoded demo users sufficient |
| W6 | Production Hyperledger Fabric deployment | Simulated blockchain for demo |

---

## 7. Detailed Feature Specifications

### 7.1 Feature: Config Upload & Parse (M1 + M2)

#### 7.1.1 Upload Flow

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  User      │     │  Upload   │     │  Vendor   │     │  Parse &  │
│  selects   │────▶│  API      │────▶│  Detect   │────▶│  Normalize│
│  config    │     │  (POST)   │     │           │     │           │
│  file      │     │           │     │  Returns: │     │  Returns: │
│            │     │  Validates│     │  vendor,  │     │  canonical│
│            │     │  format,  │     │  confidence│    │  schema,  │
│            │     │  size     │     │           │     │  version  │
└───────────┘     └───────────┘     └───────────┘     └───────────┘
```

#### 7.1.2 Supported Vendors (MVP)

| Vendor | OS | Config Format | Parser Strategy |
|---|---|---|---|
| **Cisco** | IOS 15.x, IOS-XE 16.x/17.x | Plain text (show running-config) | CiscoConfParse library + custom extractors |
| **Palo Alto** | PAN-OS 10.x, 11.x | XML (show config) or set commands | XML parsing (lxml) + set command parser |
| **Fortinet** | FortiOS 7.x | Block-structured text (show full-configuration) | Custom block parser (config/edit/next/end) |

#### 7.1.3 Canonical Schema Coverage

| Schema Section | Cisco IOS | Palo Alto | Fortinet |
|---|---|---|---|
| `services.telnet` | ✅ | ✅ | ✅ |
| `services.ssh` | ✅ | ✅ | ✅ |
| `services.http/https` | ✅ | ✅ | ✅ |
| `services.snmp` | ✅ | ✅ | ✅ |
| `authentication.aaa_model` | ✅ | ✅ | ✅ |
| `authentication.password_policy` | ✅ | Partial | ✅ |
| `authentication.login_banner` | ✅ | ✅ | ✅ |
| `access_control.acls` | ✅ | ✅ (security rules) | ✅ (firewall policy) |
| `logging` | ✅ | ✅ | ✅ |
| `encryption.password_encryption` | ✅ | ✅ | ✅ |
| `management.console_access` | ✅ | ✅ | ✅ |

---

### 7.2 Feature: CIS Benchmark Compliance Audit (M3)

#### 7.2.1 MVP Control Set (25 Controls)

| # | CIS Control ID | Title | Severity | Category |
|---|---|---|---|---|
| 1 | 1.1.1 | Enable AAA new-model | HIGH | Authentication |
| 2 | 1.1.2 | Enable AAA authentication for login | HIGH | Authentication |
| 3 | 1.1.3 | Enable AAA authentication for enable mode | HIGH | Authentication |
| 4 | 1.1.4 | Set AAA accounting | MEDIUM | Logging |
| 5 | 1.2.1 | Set exec timeout on console | MEDIUM | Management |
| 6 | 1.2.2 | Set exec timeout on VTY lines | MEDIUM | Management |
| 7 | 1.2.3 | Set exec timeout on AUX | LOW | Management |
| 8 | 1.3.1 | Set login banner | LOW | Authentication |
| 9 | 1.3.2 | Set MOTD banner | LOW | Authentication |
| 10 | 2.1.1 | Disable Telnet (transport input ssh) | HIGH | Services |
| 11 | 2.1.2 | Disable HTTP server | HIGH | Services |
| 12 | 2.1.3 | Enable HTTPS with strong ciphers | MEDIUM | Services |
| 13 | 2.2.1 | Set SSH version 2 | HIGH | Services |
| 14 | 2.2.2 | Set SSH timeout | MEDIUM | Services |
| 15 | 2.2.3 | Set SSH authentication retries ≤ 3 | MEDIUM | Services |
| 16 | 2.3.1 | Configure NTP server | MEDIUM | Services |
| 17 | 2.3.2 | Require NTP authentication | MEDIUM | Services |
| 18 | 2.4.1 | Set SNMPv3 (disable v1/v2c) | HIGH | Services |
| 19 | 2.4.2 | Remove default SNMP community strings | CRITICAL | Services |
| 20 | 3.1.1 | Enable syslog logging | HIGH | Logging |
| 21 | 3.1.2 | Set syslog severity to informational or lower | MEDIUM | Logging |
| 22 | 3.1.3 | Enable logging timestamps | LOW | Logging |
| 23 | 3.2.1 | Enable password encryption | HIGH | Encryption |
| 24 | 3.3.1 | Apply ACL to VTY lines | HIGH | Access Control |
| 25 | 3.3.2 | Disable CDP on external interfaces | MEDIUM | Management |

#### 7.2.2 Audit Result Format

```json
{
  "audit_run_id": "audit-2026-09-28-001",
  "triggered_at": "2026-09-28T05:00:00Z",
  "completed_at": "2026-09-28T05:00:12Z",
  "framework": "CIS",
  "devices_audited": 10,
  "summary": {
    "total_controls": 25,
    "passed": 18,
    "failed": 6,
    "not_applicable": 1,
    "compliance_score": 75.0
  },
  "critical_findings": 1,
  "high_findings": 3,
  "medium_findings": 2,
  "findings": [
    {
      "id": "finding-001",
      "device_id": "dev-fw01",
      "device_hostname": "FW-CORE-01",
      "control_id": "CIS-2.4.2",
      "title": "Remove default SNMP community strings",
      "severity": "CRITICAL",
      "status": "FAIL",
      "actual_value": "community string 'public' found",
      "expected_value": "No default community strings (public/private)",
      "evidence": "snmp-server community public RO",
      "remediation_available": true
    }
  ]
}
```

---

### 7.3 Feature: AI/NLP Rule Interpretation (M4)

#### 7.3.1 Input/Output Examples

| Input (Natural Language Control) | Output (Structured Rule) |
|---|---|
| "Ensure 'aaa new-model' is enabled" | `{"check": "authentication.aaa_model", "operator": "exists", "expected": true, "severity": "HIGH"}` |
| "Ensure SSH version 2 is configured" | `{"check": "services.ssh.version", "operator": "equals", "expected": 2, "severity": "HIGH"}` |
| "Ensure exec timeout is set to no more than 10 minutes on VTY lines" | `{"check": "authentication.exec_timeout", "operator": "less_than_or_equal", "expected": 600, "severity": "MEDIUM"}` |
| "Ensure default SNMP community strings are removed" | `{"check": "services.snmp.community_strings", "operator": "not_contains_any", "expected": ["public", "private"], "severity": "CRITICAL"}` |

#### 7.3.2 LLM Prompt Template (Simplified)

```
You are a network security compliance expert. Convert the following compliance
control description into a structured audit rule.

Control: {control_text}
Framework: {framework}

Output a JSON object with:
- check: dot-notation path in the canonical security schema
- operator: one of [equals, not_equals, exists, not_exists, contains, 
            not_contains, greater_than, less_than, less_than_or_equal,
            greater_than_or_equal, matches_regex, in_list, not_in_list,
            not_contains_any]
- expected: the expected value
- severity: one of [CRITICAL, HIGH, MEDIUM, LOW]

Respond with ONLY the JSON object. No explanation.
```

#### 7.3.3 Confidence Scoring Heuristic

| Factor | Weight | Example |
|---|---|---|
| LLM self-reported confidence | 40% | Model includes certainty in structured output |
| Rule schema validation | 30% | Output validates against JSON schema |
| Semantic similarity to known rules | 20% | Cosine similarity to existing approved rules |
| Control text clarity | 10% | Length, specificity, keyword density |

---

### 7.4 Feature: Blockchain Audit Evidence (M5)

#### 7.4.1 Block Structure

```json
{
  "block_number": 1247,
  "timestamp": "2026-09-28T05:00:15Z",
  "previous_hash": "a3f8d2e1b9c7...",
  "data": {
    "audit_run_id": "audit-2026-09-28-001",
    "config_snapshot_hash": "7b2c4e9f1a3d...",
    "audit_results_hash": "d9e5f7a2b6c8...",
    "auditor_identity": "arjun.mehta@ntro.gov.in",
    "device_count": 10,
    "framework": "CIS",
    "compliance_score": 75.0
  },
  "merkle_root": "e4f8a1b3c7d2...",
  "hash": "5c9d2f7e3a1b..."
}
```

#### 7.4.2 MVP Implementation (Simulated)

For the hackathon demo, blockchain is implemented as a **SQLite-backed chain** with identical cryptographic properties (SHA-256 hashing, chain linkage, Merkle roots) but without Hyperledger Fabric infrastructure overhead.

**This demonstrates**:
- Cryptographic hash chain integrity
- Tamper detection capability
- Evidence verification workflow

**Production upgrade path**: Replace SQLite backend with Hyperledger Fabric SDK — identical API surface, no application code changes.

---

## 8. Information Architecture & Wireframes

### 8.1 Navigation Structure

```
AEGIS Dashboard
├── 📊 Overview (Executive Dashboard)
│   ├── Compliance Score Widget
│   ├── Trend Chart (6 cycles)
│   ├── Severity Distribution
│   ├── Top Failing Controls
│   └── Device Group Breakdown
│
├── 🖥️ Devices
│   ├── Device List (table with filters)
│   ├── Device Detail
│   │   ├── Config Tab (versions, raw view)
│   │   ├── Compliance Tab (per-control results)
│   │   ├── Drift Tab (change history)
│   │   └── Remediation Tab (pending fixes)
│   └── Add Device / Upload Config
│
├── 🔍 Audit
│   ├── Run New Audit (wizard)
│   ├── Audit History (list)
│   └── Audit Detail
│       ├── Summary
│       ├── Findings (filterable table)
│       └── Blockchain Status
│
├── 📋 Compliance Rules
│   ├── Rule Library (by framework)
│   ├── Add Rule (manual or AI-interpret)
│   └── Pending Review Queue
│
├── 🔗 Blockchain
│   ├── Chain Explorer (block list)
│   ├── Block Detail
│   └── Verify Audit (integrity check)
│
└── ⚙️ Settings
    ├── Frameworks
    ├── Device Groups
    └── System Info
```

### 8.2 Key Screen Descriptions

#### Screen: Executive Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  AEGIS    Overview   Devices   Audit   Rules   Blockchain    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────┐  ┌─────────────────────────────────────┐ │
│  │                │  │         Compliance Trend             │ │
│  │    87.3%       │  │  100% ─                              │ │
│  │  Compliance    │  │   90% ─     ╱─ 87.3%                │ │
│  │    Score       │  │   80% ─ ──╱                          │ │
│  │                │  │   70% ─╱                              │ │
│  │  ▲ +6.1% vs   │  │       Q1  Q2  Q3  Q4  Q1  Q2        │ │
│  │   last quarter │  │                                       │ │
│  └────────────────┘  └─────────────────────────────────────┘ │
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ CRITICAL │ │   HIGH   │ │  MEDIUM  │ │   LOW    │       │
│  │    2     │ │    8     │ │   15     │ │   23     │       │
│  │  ●●      │ │  ●●●●   │ │  ●●●●●  │ │  ●●●●●  │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
│  Top Failing Controls          Devices by Compliance          │
│  ┌─────────────────────────┐  ┌───────────────────────────┐ │
│  │ 1. SNMP defaults  [12] │  │  DC-North   ████████ 92%  │ │
│  │ 2. Telnet enabled [ 8] │  │  DC-South   ██████── 78%  │ │
│  │ 3. SSH v1 in use  [ 6] │  │  Branch-HQ  █████─── 65%  │ │
│  │ 4. No exec timeout[ 5] │  │  Cloud-AWS  ████████ 95%  │ │
│  │ 5. Weak crypto    [ 4] │  │  SD-WAN     ██████── 80%  │ │
│  └─────────────────────────┘  └───────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Data Requirements

### 9.1 Sample Data for Demo

| Data Type | Source | Quantity | Format |
|---|---|---|---|
| Cisco IOS configs | Vendor documentation + synthetic | 10 configs | Plain text |
| Palo Alto configs | Vendor documentation + synthetic | 5 configs | XML |
| Fortinet configs | Vendor documentation + synthetic | 5 configs | Block text |
| CIS Benchmark rules | CIS Benchmark PDFs (Cisco IOS L1) | 25 controls | Structured JSON |
| Remediation playbooks | Vendor admin guides | 25 playbooks (per vendor × control) | JSON |

### 9.2 Data Quality Requirements

| Requirement | Standard |
|---|---|
| Sample configs must represent real-world patterns | Include both compliant and non-compliant settings |
| Each config must have at least 5 FAIL findings | Ensures demo shows value |
| Remediation commands must be verified against vendor docs | No hallucinated CLI commands |
| CIS control text must match official benchmark wording | Direct quotes from CIS PDFs |

---

## 10. AI/ML Product Requirements

### 10.1 Model Requirements

| Requirement | Specification |
|---|---|
| Model | Llama 3.x 8B (or equivalent open-source) |
| Quantization | GGUF Q4_K_M (4-bit) for CPU-only deployment |
| Inference Runtime | llama.cpp or vLLM |
| Max Input Tokens | 2048 (control text + system prompt) |
| Max Output Tokens | 512 (structured rule JSON) |
| Temperature | 0.1 (low creativity, high consistency) |
| Response Format | JSON mode enforced |

### 10.2 AI Quality Gates

| Gate | Threshold | Action if Failed |
|---|---|---|
| Schema Validation | 100% of outputs must validate | Retry with reformatted prompt (max 2 retries) |
| Confidence Score | ≥ 0.8 for auto-approval | Flag for human review |
| Semantic Similarity | ≥ 0.7 cosine similarity to nearest approved rule | Flag for review + log |
| Latency | ≤ 5 seconds per interpretation | Alert + fallback to manual rule creation |
| Hallucination Check | No invented schema paths | Validate check path against canonical schema definition |

### 10.3 AI Failure Modes & Fallbacks

| Failure Mode | Fallback |
|---|---|
| LLM service unavailable | System operates with deterministic rules only; NLP features disabled |
| LLM generates invalid JSON | Retry with stricter prompt; after 2 failures, flag for manual creation |
| LLM generates wrong schema path | Validate against schema; reject and flag |
| LLM inference too slow (> 10s) | Queue request; notify user; suggest manual rule creation |

---

## 11. Blockchain Product Requirements

### 11.1 MVP Implementation

| Requirement | Specification |
|---|---|
| Implementation | SQLite-backed simulated blockchain |
| Hashing Algorithm | SHA-256 |
| Chain Linkage | Each block contains hash of previous block |
| Merkle Tree | Merkle root of [config_hash, results_hash] |
| Verification | Recompute hashes and compare with stored values |
| Explorer UI | Table view of blocks with detail expansion |

### 11.2 Production Path (Post-Hackathon)

| Component | MVP → Production |
|---|---|
| Storage | SQLite → Hyperledger Fabric 2.5 |
| Consensus | Single-node → RAFT (multi-orderer) |
| Identity | Hardcoded → MSP (Membership Service Provider) |
| Smart Contracts | Python class → Go chaincode |
| Network | Single-peer → Multi-peer (2+ organizations) |

---

## 12. Non-Functional Requirements

| Category | Requirement | Target |
|---|---|---|
| **Performance** | Config parse latency | ≤ 500ms |
| **Performance** | Audit execution (100 devices) | ≤ 60s |
| **Performance** | Dashboard load (initial) | ≤ 2s |
| **Performance** | API response (p95) | ≤ 200ms |
| **Scalability** | Supported devices | 10,000+ (architecture) |
| **Scalability** | Concurrent users | 100+ |
| **Security** | Encryption at rest | AES-256 |
| **Security** | Encryption in transit | TLS 1.3 |
| **Security** | Authentication | JWT (demo) / OIDC (production) |
| **Reliability** | Parser success rate | ≥ 95% |
| **Reliability** | Audit accuracy | ≥ 90% |
| **Usability** | Time to first audit | ≤ 15 minutes |
| **Usability** | Browser support | Chrome 120+, Firefox 120+, Edge 120+ |
| **Maintainability** | Add new vendor parser | ≤ 1 week effort |
| **Maintainability** | Add new compliance framework | ≤ 2 weeks effort |
| **Portability** | Deployment | Docker Compose (demo) / K8s (production) |
| **Data Sovereignty** | External network calls | Zero (fully air-gap capable) |

---

## 13. Integration Requirements

### 13.1 MVP Integrations (Demo)

| Integration | Direction | Protocol | Purpose |
|---|---|---|---|
| File Upload | Inbound | HTTP POST (multipart) | Config ingestion |
| REST API | Bidirectional | HTTPS/JSON | All AEGIS operations |
| WebSocket | Outbound (to browser) | WSS | Real-time dashboard updates |

### 13.2 Production Integrations (Post-Hackathon)

| Integration | Direction | Protocol | Purpose |
|---|---|---|---|
| SSH/NETCONF | Outbound → devices | SSH (22), NETCONF (830) | Live config fetch |
| SIEM (Splunk/QRadar) | Outbound | Syslog (RFC 5424) / Webhook | Alert forwarding |
| SOAR (XSOAR/Phantom) | Outbound | REST API / Webhook | Automated response |
| ServiceNow/JIRA | Outbound | REST API | Remediation ticket creation |
| HashiCorp Vault | Internal | HTTPS | Device credential management |
| LDAP/Active Directory | Inbound | LDAP(S) | User authentication |
| CVE/NVD Feeds | Inbound | HTTPS (NVD API) | Vulnerability correlation |

---

## 14. Constraints & Dependencies

### 14.1 Constraints

| # | Constraint | Impact | Mitigation |
|---|---|---|---|
| C1 | SIH 36-hour hackathon format | Limited implementation time | Strict MVP scope; pre-built templates |
| C2 | No real classified device configs available | Demo uses synthetic data | Create realistic synthetic configs from vendor docs |
| C3 | Team size: 4-6 members | Parallel work required | Clear task decomposition per epic |
| C4 | Must work without GPU for evaluation portability | LLM inference slower | Use quantized models; cache aggressively |
| C5 | NTRO evaluation format: 2-min video + 5 slides | Communication must be concise | Script demo flow; rehearse presentation |
| C6 | No internet during demo (potential air-gap) | No external API calls allowed | All dependencies bundled; offline LLM |

### 14.2 Technical Dependencies

| Dependency | Version | Risk | Mitigation |
|---|---|---|---|
| Python | 3.12+ | Low | Stable, widely available |
| FastAPI | 0.110+ | Low | Stable, well-documented |
| React | 18.x | Low | Stable, team familiarity |
| CiscoConfParse | 2.x | Medium | Actively maintained; fallback to custom parser |
| Llama 3.x model | 8B Q4 | Medium | Test multiple quantizations; have fallback rules |
| llama.cpp / vLLM | Latest | Medium | Test CPU-only mode early |
| Hyperledger Fabric SDK | 2.5.x | High | Complex setup; MVP uses SQLite simulation |
| D3.js | 7.x | Low | Stable visualization library |

---

## 15. Release Plan & Milestones

### 15.1 Development Phases

```
Phase 1: Foundation (Days 1-3)
├── Project skeleton & CI
├── Canonical security schema (JSON Schema)
├── Cisco IOS parser
├── Basic FastAPI endpoints
└── PostgreSQL schema

Phase 2: Core Engine (Days 4-7)
├── Palo Alto parser
├── Fortinet parser
├── Deterministic rule evaluator
├── CIS Benchmark rules (25 controls)
├── Compliance scoring logic
└── Audit execution pipeline

Phase 3: AI & Blockchain (Days 8-10)
├── LLM integration (local inference)
├── NLP rule interpretation
├── Blockchain simulation (SQLite)
├── Evidence hashing & verification
└── Remediation knowledge base

Phase 4: Dashboard & UX (Days 11-13)
├── React dashboard setup
├── Executive overview page
├── Device detail page
├── Finding explorer
├── Blockchain chain browser
└── Config upload UI

Phase 5: Integration & Polish (Days 14-15)
├── End-to-end testing
├── Demo data preparation
├── Performance optimization
├── Bug fixes
├── Demo video recording
└── Presentation preparation
```

### 15.2 Milestone Checklist

| Milestone | Date | Deliverable | Status |
|---|---|---|---|
| M1: Foundation Complete | Day 3 | 1 vendor parser + API + DB working | ⬜ |
| M2: Core Engine Complete | Day 7 | 3 vendors + audit engine + scoring | ⬜ |
| M3: AI + Blockchain Working | Day 10 | NLP interpretation + blockchain proof | ⬜ |
| M4: Dashboard Complete | Day 13 | 3 dashboard views + upload UI | ⬜ |
| M5: Demo Ready | Day 15 | Full demo flow + video + slides | ⬜ |
| M6: SIH Submission | Sept 20 | All deliverables submitted | ⬜ |

### 15.3 Demo Script (2-Minute Video)

| Time | Action | Narration Key Point |
|---|---|---|
| 0:00-0:15 | Show problem slide | "Networks have 10K+ devices from 15+ vendors. Manual auditing takes months." |
| 0:15-0:30 | Upload 3 configs (Cisco, PA, Fortinet) | "AEGIS auto-detects vendor, parses to a universal schema." |
| 0:30-0:50 | Run CIS compliance audit | "One click audits all devices against CIS Benchmarks." |
| 0:50-1:05 | Show findings with severity | "6 findings detected. 1 critical: default SNMP community string." |
| 1:05-1:20 | Show AI rule interpretation | "Paste any CIS control text — AI converts it to an executable rule." |
| 1:20-1:35 | Show remediation guidance | "Vendor-specific fix: exact CLI commands for Fortinet." |
| 1:35-1:50 | Show blockchain verification | "Every audit is blockchain-anchored. Tamper-proof. Verifiable." |
| 1:50-2:00 | Show executive dashboard | "Real-time compliance score. One pane of glass. All vendors." |

---

## 16. Risk Register

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | LLM accuracy too low for demo | Medium | High | Pre-test all 10 demo rules; fallback to manual rules | AI Lead |
| R2 | Config parser fails on edge cases | Medium | Medium | Test with 20+ sample configs per vendor; graceful error handling | Backend Lead |
| R3 | Demo data not realistic enough | Medium | High | Use configs from vendor official documentation examples | Product Owner |
| R4 | Blockchain simulation questioned by evaluators | Low | Medium | Explain upgrade path; show cryptographic verification working | Backend Lead |
| R5 | Dashboard performance issues with larger datasets | Low | Medium | Pre-aggregate data; lazy loading; pagination | Frontend Lead |
| R6 | LLM inference too slow on CPU-only machine | Medium | Medium | Use smallest viable quantization; cache all results; pre-compute demo rules | AI Lead |
| R7 | Team member unavailability during hackathon | Low | High | Cross-train on critical path items; documented setup procedures | Team Lead |
| R8 | Evaluator asks "what if connectivity drops?" | High | Low | Demo graceful degradation: AI → deterministic, blockchain → local queue | All |
| R9 | Scope creep during development | Medium | High | This PRD is the scope bible; defer anything not in Must Have/Should Have | Product Owner |
| R10 | Integration between frontend and backend breaks | Medium | Medium | API contract tests; mock server for frontend dev | Full Stack |

---

## 17. Open Questions

| # | Question | Decision Needed By | Status |
|---|---|---|---|
| Q1 | Which specific CIS Benchmark PDF version do we use for demo rules? | Phase 1 start | ⬜ Open |
| Q2 | Should we show the canonical schema in the UI, or keep it backend-only? | Phase 4 start | ⬜ Open |
| Q3 | How do we handle configs that are only partially parseable (e.g., 70% extracted)? | Phase 2 start | ⬜ Open |
| Q4 | Do evaluators have access to GPU machines, or should we optimize for CPU-only? | Before submission | ⬜ Open |
| Q5 | Should the blockchain explorer show raw hashes or human-readable summaries? | Phase 4 start | ⬜ Open |
| Q6 | Do we need a CLI tool for the demo, or is the web UI sufficient? | Phase 4 start | ⬜ Open |
| Q7 | What is the exact evaluation rubric used by NTRO judges? | Before demo prep | ⬜ Open |

---

## 18. Appendices

### Appendix A: Evaluator-Anticipated Questions & Answers

| Question | Prepared Answer |
|---|---|
| *"Where is your training data from?"* | "CIS Benchmark official PDFs for rule interpretation. Device configs are synthetic but modeled on vendor documentation examples with real-world patterns. No classified data used." |
| *"Why not just use an existing tool like Qualys?"* | "Qualys is vendor-limited, has no NLP interpretation, and no blockchain evidence. AEGIS is the only solution combining all three: multi-vendor, AI-driven, and tamper-proof." |
| *"What happens when connectivity drops?"* | "AEGIS degrades gracefully: AI service down → deterministic rules still work. Blockchain unavailable → evidence queued locally and synced when available. File-upload mode works fully offline." |
| *"How would this scale to production?"* | "Architecture supports 10K+ devices via Kafka event streaming, horizontal scaling of audit workers, and Kubernetes deployment. We demonstrate the architecture, not just the demo." |
| *"Who benefits and how do you measure it?"* | "Security teams save 80%+ audit hours. CISOs get real-time compliance scores. Compliance officers get legally defensible evidence. Measurable by: audit cycle time, detection rate, false positive rate." |
| *"Is the blockchain real or simulated?"* | "For this demo, we use a cryptographically identical simulation (SHA-256 hash chains) backed by SQLite. The production path is Hyperledger Fabric — same API, same cryptographic properties, just a different storage backend." |

### Appendix B: Competitive Feature Matrix

| Feature | AEGIS | Qualys | Tripwire | Algosec | Nipper | Manual |
|---|---|---|---|---|---|---|
| Multi-vendor (15+) | ✅ (3 MVP) | Partial | Partial | Firewalls only | Yes | Yes |
| AI/NLP rule interpretation | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Blockchain evidence | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Continuous auditing | ✅ | ✅ | ✅ | ✅ | ❌ (batch) | ❌ |
| Vendor-specific remediation | ✅ | Limited | Limited | ❌ | ✅ | ❌ |
| Air-gap compatible | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Open source | ✅ | ❌ | ❌ | ❌ | ❌ | N/A |
| Cost | Free | $200K+/yr | $150K+/yr | $100K+/yr | $10K+/yr | Labor |

### Appendix C: RICE Prioritization (Epics)

| Epic | Reach | Impact | Confidence | Effort | RICE Score | Priority |
|---|---|---|---|---|---|---|
| E1: Config Parsing | 10K | Massive (3x) | High (100%) | 3 mo | 10,000 | 1st |
| E2: Audit Engine | 10K | Massive (3x) | High (100%) | 3 mo | 10,000 | 1st (tied) |
| E4: Blockchain | 5K | High (2x) | High (100%) | 2 mo | 5,000 | 2nd |
| E3: AI/NLP | 5K | Massive (3x) | Medium (80%) | 3 mo | 4,000 | 3rd |
| E6: Dashboard | 10K | High (2x) | High (100%) | 3 mo | 6,667 | 2nd (tied) |
| E5: Remediation | 5K | Medium (1x) | High (100%) | 1 mo | 5,000 | 2nd (tied) |

---

## Document Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner | | | |
| Engineering Lead | | | |
| Design Lead | | | |
| CISO / Security Advisor | | | |

---

> **This PRD is the single source of truth for what AEGIS will deliver.**  
> Any feature not listed here is out of scope. Changes require PRD amendment with stakeholder sign-off.
