# AEGIS — Solution Design Document

> **Document ID**: AEGIS-SOL-001  
> **Version**: 1.0  
> **Classification**: INTERNAL — NTRO Challenge Submission  
> **Last Updated**: 2026-09-28  
> **Predecessor**: [Problem Statement](./problem.md)  

---

## 1. Solution Overview

### 1.1 Product Vision

**AEGIS** transforms network security compliance from a periodic, manual, vendor-siloed activity into a **continuous, AI-driven, vendor-agnostic, tamper-proof** process.

### 1.2 Value Proposition Canvas

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         VALUE PROPOSITION                                 │
│                                                                           │
│  ┌─────────────────────────────┐    ┌──────────────────────────────────┐  │
│  │     CUSTOMER PROFILE        │    │     AEGIS VALUE MAP              │  │
│  │                             │    │                                  │  │
│  │  JOBS:                      │    │  PRODUCTS & SERVICES:            │  │
│  │  • Audit 10K+ devices      │    │  • Multi-vendor config parser    │  │
│  │  • Prove compliance        │    │  • AI compliance engine          │  │
│  │  • Detect drift            │    │  • Blockchain audit ledger       │  │
│  │  • Remediate findings      │    │  • Remediation advisor           │  │
│  │                             │    │  • Real-time dashboard           │  │
│  │  PAINS:                     │    │                                  │  │
│  │  • Manual, slow audits     │    │  PAIN RELIEVERS:                 │  │
│  │  • Vendor tool lock-in     │    │  • Automated parsing (50+ types) │  │
│  │  • Tamper-able reports     │    │  • Single pane of glass          │  │
│  │  • Ambiguous controls      │    │  • Immutable evidence chain      │  │
│  │                             │    │  • NLP rule interpretation       │  │
│  │  GAINS:                     │    │                                  │  │
│  │  • Real-time compliance    │    │  GAIN CREATORS:                  │  │
│  │  • Reduced audit cost      │    │  • Continuous monitoring          │  │
│  │  • Risk quantification     │    │  • 80% cost reduction            │  │
│  │  • Audit defensibility     │    │  • CVSS-weighted risk scores     │  │
│  │                             │    │  • Blockchain proof of audit     │  │
│  └─────────────────────────────┘    └──────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Solution Architecture (High-Level)

### 2.1 System Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                                │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────────────────┐  │
│  │  Compliance      │  │  Real-Time   │  │  Report Generator          │  │
│  │  Dashboard       │  │  Alert Feed  │  │  (PDF/Excel/API)           │  │
│  │  (React + D3.js) │  │  (WebSocket) │  │  + Blockchain Certificate  │  │
│  └─────────────────┘  └──────────────┘  └────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                        API GATEWAY (FastAPI)                              │
│  /audit  /devices  /compliance  /reports  /remediation  /blockchain      │
├─────────────────────────────────────────────────────────────────────────┤
│                        CORE ENGINE LAYER                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐                │
│  │  Config       │  │  Compliance   │  │  Remediation   │                │
│  │  Normalizer   │  │  Engine       │  │  Advisor       │                │
│  │              │  │               │  │                │                │
│  │  • Multi-     │  │  • Rule       │  │  • Vendor-     │                │
│  │    vendor     │  │    evaluation │  │    specific    │                │
│  │    parsers    │  │  • NLP rule   │  │    fix steps   │                │
│  │  • Canonical  │  │    interpret  │  │  • Risk-based  │                │
│  │    schema     │  │  • Drift      │  │    priority    │                │
│  │  • Plugin     │  │    detection  │  │  • Auto-gen    │                │
│  │    arch       │  │  • Scoring    │  │    playbooks   │                │
│  └──────────────┘  └───────────────┘  └────────────────┘                │
├─────────────────────────────────────────────────────────────────────────┤
│                        AI/NLP LAYER                                      │
│  ┌───────────────────────┐  ┌─────────────────────────────────────────┐  │
│  │  LLM Engine            │  │  ML Models                             │  │
│  │  (On-Prem: Llama 3.x) │  │  • Anomaly detection (config patterns) │  │
│  │  • Rule interpretation │  │  • Drift classification                │  │
│  │  • Config understanding│  │  • Risk scoring (CVSS-weighted)        │  │
│  │  • Remediation gen     │  │  • Compliance prediction               │  │
│  └───────────────────────┘  └─────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                        DATA LAYER                                        │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Config Store │  │  Compliance   │  │  Audit     │  │  Blockchain  │  │
│  │  (PostgreSQL) │  │  Rule DB      │  │  History   │  │  Ledger      │  │
│  │  + TimescaleDB│  │  (MongoDB)    │  │  (Timescale│  │  (Hyperledger│  │
│  │               │  │               │  │   DB)      │  │   Fabric)    │  │
│  └──────────────┘  └───────────────┘  └────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│                        INTEGRATION LAYER                                 │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │  Device       │  │  SIEM/SOAR    │  │  CVE/NVD   │  │  Change      │  │
│  │  Connectors   │  │  Integration  │  │  Feeds     │  │  Management  │  │
│  │  (SSH/API/    │  │  (Splunk/     │  │  (NVD API) │  │  (ServiceNow │  │
│  │   SNMP/       │  │   QRadar/     │  │            │  │   /JIRA)     │  │
│  │   NETCONF)    │  │   XSOAR)      │  │            │  │              │  │
│  └──────────────┘  └───────────────┘  └────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Components

### 3.1 Multi-Vendor Configuration Normalizer

**Purpose**: Parse any vendor's device configuration into a **canonical security schema** that enables vendor-agnostic compliance checking.

**Design Pattern**: Plugin Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 Config Normalizer                        │
│                                                          │
│  Raw Config ──▶ Vendor Detector ──▶ Parser Plugin ──▶   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │            CANONICAL SECURITY SCHEMA              │   │
│  │                                                    │   │
│  │  {                                                 │   │
│  │    "device": {                                     │   │
│  │      "vendor": "cisco", "model": "ASA-5525",       │   │
│  │      "os_version": "9.16.3", "hostname": "FW-01"   │   │
│  │    },                                              │   │
│  │    "services": {                                   │   │
│  │      "telnet": { "enabled": false },               │   │
│  │      "ssh": { "enabled": true, "version": 2,       │   │
│  │               "timeout": 300, "retries": 3 }       │   │
│  │    },                                              │   │
│  │    "authentication": {                             │   │
│  │      "aaa_model": "tacacs+",                       │   │
│  │      "local_fallback": true,                       │   │
│  │      "password_policy": { ... }                    │   │
│  │    },                                              │   │
│  │    "access_control": { ... },                      │   │
│  │    "logging": { ... },                             │   │
│  │    "encryption": { ... }                           │   │
│  │  }                                                 │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

**Supported Vendors (MVP)**:
1. **Cisco IOS/IOS-XE** — Largest install base in enterprise/government
2. **Palo Alto PAN-OS** — Dominant next-gen firewall
3. **Fortinet FortiOS** — Highest volume firewall vendor

**Extensibility**: New vendors added by implementing a `VendorParser` interface — parser plugin receives raw config text, returns canonical schema objects.

---

### 3.2 AI/NLP Compliance Engine

**Purpose**: Interpret natural-language compliance controls and evaluate them against canonical device schemas.

**Pipeline**:

```
CIS/NIST Control Text
        │
        ▼
┌─────────────────────┐
│  NLP Rule Parser     │  ← LLM interprets control text
│  (Llama 3.x 8B)     │     into structured audit rule
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Structured Rule     │  { "check": "services.telnet.enabled",
│  (JSON Policy)       │    "operator": "equals",
│                      │    "expected": false,
│                      │    "severity": "HIGH",
│                      │    "framework": "CIS",
│                      │    "control_id": "2.1.1" }
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Evaluation Engine   │  ← Runs structured rule against
│  (Rule Evaluator)    │     canonical config schema
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Compliance Result   │  { "control_id": "CIS-2.1.1",
│  (Pass/Fail/NA)      │    "status": "FAIL",
│                      │    "actual": true,
│                      │    "expected": false,
│                      │    "severity": "HIGH",
│                      │    "evidence": "telnet enabled on mgmt interface",
│                      │    "remediation": "set admin-telnet disable" }
└─────────────────────┘
```

**Key Design Decisions**:
- **Hybrid approach**: LLM for initial rule parsing/interpretation + deterministic rule engine for evaluation
- **Human-in-the-loop**: LLM-generated rules are reviewed and approved before production use
- **Caching**: Once a control is interpreted, the structured rule is cached — LLM is not called per-audit
- **On-premises inference**: Quantized Llama 3.x model runs locally — no data exfiltration risk

---

### 3.3 Blockchain Audit Ledger

**Purpose**: Create an immutable, cryptographically verifiable chain of audit evidence.

**Design**:

```
┌──────────────────────────────────────────────────────────────┐
│                    AUDIT EVIDENCE CHAIN                        │
│                                                                │
│  Audit Run #1          Audit Run #2          Audit Run #3     │
│  ┌──────────┐          ┌──────────┐          ┌──────────┐    │
│  │ Block N  │────────▶│ Block N+1│────────▶│ Block N+2│    │
│  │          │          │          │          │          │    │
│  │ Hash:    │          │ Hash:    │          │ Hash:    │    │
│  │ 0xA3F... │          │ 0x7B2... │          │ 0xD9E... │    │
│  │          │          │          │          │          │    │
│  │ Payload: │          │ Payload: │          │ Payload: │    │
│  │ • Config │          │ • Config │          │ • Config │    │
│  │   snapshot│         │   snapshot│         │   snapshot│    │
│  │   hash    │         │   hash    │         │   hash    │    │
│  │ • Audit  │          │ • Audit  │          │ • Audit  │    │
│  │   results │         │   results │         │   results │    │
│  │   hash    │         │   hash    │         │   hash    │    │
│  │ • Timestamp│        │ • Timestamp│        │ • Timestamp│  │
│  │ • Auditor │         │ • Auditor │         │ • Auditor │   │
│  │   identity │        │   identity │        │   identity │  │
│  └──────────┘          └──────────┘          └──────────┘    │
│                                                                │
│  Verification: Any block can be independently verified by      │
│  recomputing the hash chain from genesis.                      │
└──────────────────────────────────────────────────────────────┘
```

**Implementation**: Hyperledger Fabric (permissioned blockchain)
- **Why Hyperledger Fabric**: Permissioned (no mining overhead), enterprise-grade, modular consensus, suitable for government/classified environments
- **Smart Contracts (Chaincode)**: Audit evidence submission, verification, and query
- **Channels**: Segregate audit data by classification level or organizational unit

---

### 3.4 Remediation Advisor

**Purpose**: Generate vendor-specific, actionable remediation guidance for every compliance finding.

**Design**:

```
Compliance Finding
        │
        ├── Vendor: Cisco IOS
        ├── Control: CIS 2.1.1 (Disable Telnet)
        ├── Status: FAIL
        │
        ▼
┌─────────────────────────────────┐
│  Remediation Knowledge Base      │
│  ┌────────────────────────────┐  │
│  │ Vendor: cisco_ios          │  │
│  │ Control: telnet_disable    │  │
│  │                            │  │
│  │ Steps:                     │  │
│  │  1. Enter config mode      │  │
│  │  2. line vty 0 15          │  │
│  │  3. transport input ssh    │  │
│  │  4. exit                   │  │
│  │                            │  │
│  │ Verification:              │  │
│  │  show line vty 0 15        │  │
│  │  → should show SSH only    │  │
│  │                            │  │
│  │ Risk: LOW (service restart │  │
│  │  not required)             │  │
│  │                            │  │
│  │ Rollback:                  │  │
│  │  transport input telnet ssh│  │
│  └────────────────────────────┘  │
└─────────────────────────────────┘
```

**AI-Augmented**: For controls without pre-built remediation playbooks, the LLM generates draft remediation steps based on vendor documentation, flagged for human review before use.

---

### 3.5 Real-Time Compliance Dashboard

**Purpose**: Single pane of glass showing enterprise-wide compliance posture.

**Key Views**:

| View | Content | Audience |
|---|---|---|
| **Executive Overview** | Compliance score (%), trend, risk heat map | CISO, CxO |
| **Device Inventory** | All devices, compliance status, last audit time | Security Ops |
| **Framework Drill-Down** | Per-framework, per-control pass/fail rates | Compliance Team |
| **Finding Explorer** | Individual findings, severity, remediation status | Network Admins |
| **Drift Monitor** | Config changes since last audit, risk classification | SOC Analysts |
| **Blockchain Verifier** | Audit chain explorer, block verification | Auditors |

---

## 4. Data Pipeline Architecture

### 4.1 Ingestion Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA INGESTION PIPELINE                        │
│                                                                   │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Device   │    │ Config   │    │ Normalize│    │ Store &  │  │
│  │ Connect  │───▶│ Extract  │───▶│ & Parse  │───▶│ Version  │  │
│  │          │    │          │    │          │    │          │  │
│  │ SSH/API/ │    │ Running  │    │ Canonical│    │ Postgres │  │
│  │ NETCONF/ │    │ config   │    │ schema   │    │ + S3     │  │
│  │ SNMP     │    │ capture  │    │ objects  │    │          │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │                                               │         │
│       ▼                                               ▼         │
│  ┌──────────┐                                  ┌──────────┐    │
│  │ Credential│                                  │ Change   │    │
│  │ Vault    │                                  │ Detector │    │
│  │ (HashiCorp│                                  │ (Diff    │    │
│  │  Vault)  │                                  │  Engine) │    │
│  └──────────┘                                  └──────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Audit Pipeline

```
Trigger (Schedule / On-Demand / Drift-Detected)
        │
        ▼
┌─ Step 1: Fetch latest canonical config from store
│
├─ Step 2: Load applicable compliance rules (CIS + NIST + STIG + ISO)
│
├─ Step 3: Execute rule evaluation engine
│         ├── Deterministic rules: direct match
│         └── Ambiguous rules: NLP interpretation → cached
│
├─ Step 4: Generate compliance report
│         ├── Per-device results
│         ├── Per-framework summary
│         └── Risk-weighted scoring
│
├─ Step 5: Generate remediation playbooks
│         ├── Vendor-specific steps
│         ├── Priority ranking
│         └── Estimated effort
│
├─ Step 6: Anchor to blockchain
│         ├── Hash config snapshot
│         ├── Hash audit results
│         └── Submit block to Hyperledger
│
└─ Step 7: Notify & dashboard update
          ├── WebSocket push to dashboard
          ├── SIEM integration (syslog/webhook)
          └── Email/Slack alerts for critical findings
```

---

## 5. Technology Stack

### 5.1 Stack Selection & Justification

| Layer | Technology | Justification |
|---|---|---|
| **Frontend** | React 18 + TypeScript + D3.js | Component-based UI, rich data visualization |
| **API** | FastAPI (Python) | Async, auto-docs (OpenAPI), strong typing |
| **Config Parsers** | Python + Textual parsing (TTP, CiscoConfParse) | Rich ecosystem for network config parsing |
| **AI/NLP** | Llama 3.x 8B (quantized, on-prem) + LangChain | Sovereign inference, no data exfiltration |
| **Rule Engine** | Python-based DSL + JSON Schema | Deterministic evaluation, auditable logic |
| **Primary DB** | PostgreSQL 16 + TimescaleDB | ACID, time-series for audit history |
| **Document Store** | MongoDB 7 | Flexible schema for compliance rules |
| **Blockchain** | Hyperledger Fabric 2.5 | Permissioned, enterprise-grade, modular |
| **Message Queue** | Apache Kafka | Event streaming for audit pipeline |
| **Credential Vault** | HashiCorp Vault | Secrets management for device credentials |
| **Orchestration** | Apache Airflow | DAG-based workflow scheduling |
| **Container** | Docker + Kubernetes (K3s) | Deployment consistency, scaling |
| **Monitoring** | Prometheus + Grafana | Pipeline observability |

### 5.2 MVP vs Full Scope

| Feature | MVP (Hackathon Demo) | Full Version |
|---|---|---|
| Vendor Parsers | Cisco IOS, Palo Alto, Fortinet | 15+ vendors |
| Compliance Frameworks | CIS Benchmarks (partial) | CIS + NIST + STIG + ISO |
| AI/NLP | 5-10 demo rules via LLM | Full framework rule coverage |
| Blockchain | Simulated ledger (SQLite) | Hyperledger Fabric production |
| Dashboard | 3 key views | Full 6-view dashboard |
| Device Connectivity | File upload (sample configs) | SSH/API/NETCONF live |
| Remediation | Pre-built for demo rules | AI-generated + knowledge base |

---

## 6. User Flows

### 6.1 Primary Flow: Run Compliance Audit

```
User                     AEGIS                        Blockchain
 │                         │                              │
 │  Upload/Connect Config  │                              │
 │────────────────────────▶│                              │
 │                         │  Parse & Normalize           │
 │                         │──────────────────▶           │
 │                         │                              │
 │                         │  Run Compliance Rules        │
 │                         │──────────────────▶           │
 │                         │                              │
 │                         │  Generate Results            │
 │                         │──────────────────▶           │
 │                         │                              │
 │                         │  Anchor to Blockchain ───────▶│
 │                         │                              │
 │  View Dashboard         │                              │
 │◀────────────────────────│                              │
 │                         │                              │
 │  Download Report        │                              │
 │◀────────────────────────│  (includes blockchain cert)  │
 │                         │                              │
```

### 6.2 Secondary Flow: Verify Audit Integrity

```
Auditor                  AEGIS                    Blockchain
 │                         │                          │
 │  Request Verification   │                          │
 │  (Audit ID + Report)    │                          │
 │────────────────────────▶│                          │
 │                         │  Lookup Block            │
 │                         │─────────────────────────▶│
 │                         │                          │
 │                         │  Recompute Hash          │
 │                         │◀─────────────────────────│
 │                         │                          │
 │  Verification Result    │                          │
 │  (VALID / TAMPERED)     │                          │
 │◀────────────────────────│                          │
```

---

## 7. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| LLM hallucination in rule interpretation | Medium | High | Human review gate + deterministic fallback rules |
| Config parser fails on unknown syntax | High | Medium | Graceful degradation + "unknown" classification |
| Blockchain performance bottleneck | Low | Medium | Async anchoring, batch submissions |
| On-prem LLM inference too slow | Medium | Medium | Quantized models, GPU acceleration, caching |
| Vendor config format changes | Medium | Low | Plugin architecture, version detection |
| Demo data doesn't represent real complexity | Medium | High | Use vendor documentation sample configs |

---

## 8. Success Metrics

| Metric | Target (Demo) | Target (Production) |
|---|---|---|
| Config parse success rate | 95%+ on sample configs | 99%+ on production configs |
| Compliance rule accuracy | 90%+ (NLP-interpreted) | 98%+ (validated + cached) |
| Audit execution time | < 30 seconds (10 devices) | < 5 minutes (10K devices) |
| Blockchain anchoring | Per-audit | Per-audit + per-change |
| False positive rate | < 10% | < 2% |
| Dashboard load time | < 2 seconds | < 3 seconds (at scale) |

---

> **Next Document**: [Architecture Document →](./architecture.md)
