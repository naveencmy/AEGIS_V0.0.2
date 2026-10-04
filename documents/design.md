# AEGIS — Software Requirements Specification & Software Design Specification

> **Document ID**: AEGIS-SRS-SDS-001  
> **Version**: 1.0  
> **Classification**: INTERNAL — NTRO Challenge Submission  
> **Last Updated**: 2026-09-28  
> **Standards**: IEEE 830-1998 (SRS), IEEE 1016-2009 (SDS)  
> **Predecessor**: [Architecture Document](./architecture.md)  

---

# PART I: SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

---

## 1. Introduction

### 1.1 Purpose

This SRS defines the functional and non-functional requirements for **AEGIS** (Automated Enterprise Governance & Inspection System) — an AI-driven, multi-vendor network security compliance auditor. This document serves as the contractual agreement between product, engineering, and evaluation teams regarding what the system will do.

### 1.2 Scope

AEGIS is a software system that:
- Ingests network device configurations from multiple vendors
- Normalizes configurations into a canonical security schema
- Evaluates configurations against multiple compliance frameworks using AI/NLP
- Generates tamper-proof audit reports anchored to a blockchain ledger
- Provides vendor-specific remediation guidance
- Presents real-time compliance posture through a web dashboard

**In Scope**: Network device configuration auditing, compliance rule evaluation, blockchain evidence, remediation advice, dashboard visualization.

**Out of Scope**: Active network scanning (Nmap-style), vulnerability exploitation, device configuration changes (push), endpoint security agent management.

### 1.3 Definitions & Acronyms

See [Context Document — Glossary](./context.md#8-glossary).

### 1.4 References

| Reference | Description |
|---|---|
| CIS Benchmarks | Center for Internet Security hardening benchmarks for network devices |
| NIST SP 800-53 Rev. 5 | Security and Privacy Controls for Information Systems |
| DISA STIGs | Security Technical Implementation Guides for DoD systems |
| ISO/IEC 27001:2022 | Information security management systems |
| IEEE 830-1998 | Recommended Practice for SRS |
| IEEE 1016-2009 | Software Design Descriptions |

---

## 2. Overall Description

### 2.1 Product Perspective

AEGIS operates as a **standalone system** that integrates with:
- **Network devices** (data source — read-only access)
- **Compliance framework databases** (reference data)
- **SIEM/SOAR platforms** (downstream consumer)
- **Blockchain network** (evidence storage)

AEGIS does **not** replace firewalls, IDS/IPS, or SIEM systems. It complements them by providing compliance assessment and evidence integrity.

### 2.2 Product Functions (High-Level)

| # | Function | Priority |
|---|---|---|
| F1 | Multi-vendor configuration ingestion and parsing | **Must Have** |
| F2 | Configuration normalization to canonical schema | **Must Have** |
| F3 | Compliance rule evaluation (CIS Benchmarks) | **Must Have** |
| F4 | AI/NLP-based compliance rule interpretation | **Must Have** |
| F5 | Blockchain-anchored audit evidence | **Must Have** |
| F6 | Vendor-specific remediation guidance | **Should Have** |
| F7 | Real-time compliance dashboard | **Should Have** |
| F8 | Configuration drift detection | **Should Have** |
| F9 | Multi-framework simultaneous auditing (NIST, STIG, ISO) | **Could Have** |
| F10 | SIEM/SOAR integration | **Could Have** |
| F11 | Automated config fetching (live SSH/API) | **Could Have** |
| F12 | Risk-weighted compliance scoring | **Could Have** |

### 2.3 User Classes and Characteristics

| User Class | Technical Level | Usage Frequency | Primary Tasks |
|---|---|---|---|
| Security Engineer | High | Daily | Run audits, review findings, configure rules |
| CISO / Security Director | Medium | Weekly | Review compliance posture, executive reports |
| Compliance Officer | Medium | Monthly | Verify audit integrity, framework reports |
| Network Administrator | High | Per-finding | Review remediation guidance, apply fixes |
| External Auditor | Medium | Quarterly | Verify blockchain evidence, audit trail |
| System Administrator | High | Setup + maintenance | Deploy, configure, monitor system |

### 2.4 Operating Environment

| Aspect | Requirement |
|---|---|
| **Deployment** | On-premises (air-gap compatible) or private cloud |
| **OS** | Linux (Ubuntu 22.04 LTS or RHEL 9+) |
| **Container Runtime** | Docker 24+ / Containerd 1.7+ |
| **Orchestration** | Kubernetes (K3s for lightweight, K8s for production) |
| **Minimum Hardware** | 8 cores, 32GB RAM, 300GB SSD |
| **Recommended Hardware** | 16 cores, 64GB RAM, 500GB NVMe + 1 GPU (for AI inference) |
| **Network** | HTTPS (TLS 1.3), SSH (for device connectivity) |
| **Browser** | Chrome 120+, Firefox 120+, Edge 120+ |

### 2.5 Design and Implementation Constraints

| Constraint | Rationale |
|---|---|
| Data sovereignty: no external API calls for AI inference | NTRO requirement — classified configurations |
| On-premises blockchain (no public chain) | Air-gap compatibility |
| Python as primary backend language | Ecosystem for network config parsing + AI/ML |
| Open-source technologies preferred | Government procurement, transparency |
| Must function without GPU (degraded performance acceptable) | Budget flexibility |

### 2.6 Assumptions and Dependencies

| # | Assumption |
|---|---|
| A1 | CIS Benchmark PDFs can be programmatically parsed for control extraction |
| A2 | Sample device configs from vendor documentation are sufficient for demo |
| A3 | Llama 3.x 8B quantized model provides adequate accuracy for rule interpretation |
| A4 | Hyperledger Fabric SDK for Python is stable and supports required operations |
| A5 | SSH/NETCONF access to devices can be simulated for demo environment |

---

## 3. Functional Requirements

### FR-001: Device Registration

| Attribute | Value |
|---|---|
| **ID** | FR-001 |
| **Title** | Register Network Device |
| **Priority** | Must Have |
| **Description** | System shall allow users to register network devices with metadata (hostname, vendor, model, OS version, IP address, device group, location). |
| **Input** | Device metadata (JSON/form) |
| **Processing** | Validate metadata, check for duplicates, store in database |
| **Output** | Device ID, confirmation |
| **Acceptance Criteria** | 1. Device registered with unique ID. 2. Duplicate hostname+IP rejected. 3. Vendor validated against supported list. |

---

### FR-002: Configuration Upload

| Attribute | Value |
|---|---|
| **ID** | FR-002 |
| **Title** | Upload Device Configuration |
| **Priority** | Must Have |
| **Description** | System shall accept device configuration files via file upload (text/XML/JSON). System shall auto-detect vendor from config content. |
| **Input** | Configuration file + optional device_id |
| **Processing** | 1. Receive file. 2. Auto-detect vendor via fingerprinting. 3. Validate format. 4. Store raw config (encrypted). 5. Trigger parsing pipeline. |
| **Output** | Config ID, detected vendor, parse status |
| **Acceptance Criteria** | 1. Files up to 10MB accepted. 2. Vendor detected with 95%+ accuracy. 3. Invalid files rejected with clear error. 4. Config stored encrypted at rest. |

---

### FR-003: Configuration Parsing & Normalization

| Attribute | Value |
|---|---|
| **ID** | FR-003 |
| **Title** | Parse and Normalize Configuration |
| **Priority** | Must Have |
| **Description** | System shall parse vendor-specific configs into a canonical security schema covering: services, authentication, access control, logging, encryption, management access. |
| **Input** | Raw config (text) + vendor ID |
| **Processing** | 1. Load vendor parser plugin. 2. Parse raw config into structured data. 3. Map to canonical schema. 4. Validate schema completeness. 5. Compute config hash. 6. Store versioned canonical config. |
| **Output** | Canonical config (JSON), parse confidence score, unmapped sections list |
| **Supported Vendors (MVP)** | Cisco IOS/IOS-XE, Palo Alto PAN-OS, Fortinet FortiOS |
| **Acceptance Criteria** | 1. Parser extracts ≥90% of security-relevant config sections. 2. Canonical schema validates against JSON Schema. 3. Parse completes in <500ms per config. 4. Unsupported sections logged, not silently dropped. |

---

### FR-004: Compliance Rule Management

| Attribute | Value |
|---|---|
| **ID** | FR-004 |
| **Title** | Manage Compliance Rules |
| **Priority** | Must Have |
| **Description** | System shall store compliance rules mapped to framework controls. Rules can be manually defined (structured JSON) or AI-interpreted from natural language. |
| **Input** | Framework ID + control text (natural language) or structured rule (JSON) |
| **Processing** | 1. If NL: send to LLM for interpretation → structured rule. 2. Validate structured rule against schema. 3. Store with framework mapping, severity, and confidence. |
| **Output** | Rule ID, structured rule, confidence score, source (manual/AI) |
| **Acceptance Criteria** | 1. AI-interpreted rules flagged for human review before production. 2. Rules versioned with change history. 3. Confidence score ≥0.8 required for auto-approval. |

---

### FR-005: Compliance Audit Execution

| Attribute | Value |
|---|---|
| **ID** | FR-005 |
| **Title** | Execute Compliance Audit |
| **Priority** | Must Have |
| **Description** | System shall evaluate canonical device configs against selected compliance framework rules, producing per-device, per-control pass/fail/NA results. |
| **Input** | Audit scope (device list + framework list) |
| **Processing** | 1. Fetch latest canonical configs for scoped devices. 2. Load applicable rules for scoped frameworks. 3. For each (device, rule): evaluate rule against canonical config. 4. Generate finding record (pass/fail/NA + evidence). 5. Compute compliance scores. 6. Generate audit report. |
| **Output** | Audit run ID, findings list, compliance scores, report |
| **Acceptance Criteria** | 1. All in-scope devices evaluated. 2. Each finding includes evidence (actual vs. expected). 3. Compliance score calculated as (passed / (passed + failed)) × 100. 4. Audit completes in <60s for 100 devices. |

---

### FR-006: Blockchain Evidence Anchoring

| Attribute | Value |
|---|---|
| **ID** | FR-006 |
| **Title** | Anchor Audit Evidence to Blockchain |
| **Priority** | Must Have |
| **Description** | System shall compute cryptographic hashes of audit results and config snapshots, and submit them as blocks to the Hyperledger Fabric ledger, creating an immutable evidence chain. |
| **Input** | Audit run results + config snapshot hashes |
| **Processing** | 1. Compute SHA-256 hash of config snapshot. 2. Compute SHA-256 hash of audit results. 3. Compute Merkle root of evidence set. 4. Submit block to Hyperledger via chaincode. 5. Record block ID and transaction hash. |
| **Output** | Block ID, transaction hash, blockchain certificate |
| **Acceptance Criteria** | 1. Every completed audit has a blockchain block. 2. Block includes all evidence hashes. 3. Block is verifiable independently. 4. Submission completes in <10s. |

---

### FR-007: Blockchain Verification

| Attribute | Value |
|---|---|
| **ID** | FR-007 |
| **Title** | Verify Audit Evidence Integrity |
| **Priority** | Must Have |
| **Description** | System shall allow any authorized user to verify that a specific audit's results have not been tampered with by recomputing hashes and comparing with the blockchain record. |
| **Input** | Audit run ID |
| **Processing** | 1. Fetch audit results from database. 2. Recompute SHA-256 hashes. 3. Query blockchain for the corresponding block. 4. Compare computed hashes with stored hashes. 5. Verify block chain integrity (previous hash linkage). |
| **Output** | Verification result (VALID / TAMPERED / MISSING), details |
| **Acceptance Criteria** | 1. VALID if all hashes match and chain is intact. 2. TAMPERED if any hash mismatch detected. 3. MISSING if no blockchain record exists. 4. Detailed report showing which element was tampered. |

---

### FR-008: AI/NLP Rule Interpretation

| Attribute | Value |
|---|---|
| **ID** | FR-008 |
| **Title** | Interpret Compliance Rules via NLP |
| **Priority** | Must Have |
| **Description** | System shall use an on-premises LLM to interpret natural-language compliance control descriptions into structured, executable audit rules. |
| **Input** | Control text (e.g., "Ensure SSH idle timeout is ≤ 300 seconds") |
| **Processing** | 1. Preprocess control text. 2. Send to LLM with structured output prompt. 3. Parse LLM response into rule JSON. 4. Validate rule schema. 5. Assign confidence score. 6. Flag for human review if confidence < 0.8. |
| **Output** | Structured rule (JSON), confidence score, review status |
| **Acceptance Criteria** | 1. LLM processes control in <5s. 2. Output conforms to rule JSON schema. 3. Confidence scoring differentiates clear vs. ambiguous controls. 4. Results are cached — same control text returns cached rule. |

---

### FR-009: Remediation Guidance

| Attribute | Value |
|---|---|
| **ID** | FR-009 |
| **Title** | Provide Vendor-Specific Remediation |
| **Priority** | Should Have |
| **Description** | For each compliance finding (FAIL), system shall provide vendor-specific remediation steps, verification commands, risk assessment, and rollback instructions. |
| **Input** | Finding ID (includes device vendor + control ID) |
| **Processing** | 1. Lookup remediation knowledge base for (vendor, control). 2. If found: return pre-built playbook. 3. If not found: generate via LLM (flagged as AI-generated). 4. Include verification command and rollback steps. |
| **Output** | Remediation playbook (steps, verification, risk, rollback) |
| **Acceptance Criteria** | 1. Pre-built playbooks for all MVP vendor + CIS control combinations. 2. AI-generated playbooks clearly labeled. 3. Each playbook includes verification command. |

---

### FR-010: Compliance Dashboard

| Attribute | Value |
|---|---|
| **ID** | FR-010 |
| **Title** | Real-Time Compliance Dashboard |
| **Priority** | Should Have |
| **Description** | System shall provide a web-based dashboard showing enterprise-wide compliance posture with drill-down capabilities. |
| **Views** | 1. Executive Overview (compliance %, trend, heat map). 2. Device Inventory (all devices + status). 3. Framework Drill-Down (per-control pass/fail). 4. Finding Explorer (individual findings). 5. Blockchain Verifier (audit chain browser). |
| **Real-Time** | Dashboard updates via WebSocket push on new audit completion or critical finding. |
| **Acceptance Criteria** | 1. Dashboard loads in <2s. 2. Real-time updates within 5s of event. 3. Responsive design (desktop + tablet). 4. Export to PDF/CSV. |

---

### FR-011: Configuration Drift Detection

| Attribute | Value |
|---|---|
| **ID** | FR-011 |
| **Title** | Detect Configuration Drift |
| **Priority** | Should Have |
| **Description** | System shall compare the latest configuration of a device with its previous version and identify security-relevant changes. |
| **Input** | Device ID (triggered on new config ingestion) |
| **Processing** | 1. Fetch current and previous canonical configs. 2. Compute structural diff. 3. Classify changes by security impact (critical/high/medium/low/info). 4. Alert if critical/high changes detected. |
| **Output** | Drift report (changed fields, security impact, timestamp) |
| **Acceptance Criteria** | 1. Drift detected within 1 minute of config ingestion. 2. Security impact classification is accurate. 3. Alert generated for critical/high drift. |

---

## 4. Non-Functional Requirements

### NFR-001: Performance

| Metric | Requirement |
|---|---|
| Config parse time (single device) | ≤ 500ms |
| Full audit (100 devices, CIS) | ≤ 60 seconds |
| Dashboard initial load | ≤ 2 seconds |
| API response (p95) | ≤ 200ms |
| API response (p99) | ≤ 500ms |
| LLM rule interpretation | ≤ 5 seconds per control |
| Blockchain verification | ≤ 5 seconds |

### NFR-002: Scalability

| Metric | Requirement |
|---|---|
| Devices supported | 10,000+ |
| Concurrent users | 100+ |
| Compliance rules | 10,000+ |
| Audit history | 7 years retention |
| Config versions per device | Unlimited |

### NFR-003: Availability

| Metric | Requirement |
|---|---|
| System uptime | 99.5% (planned maintenance excluded) |
| Recovery Time Objective (RTO) | ≤ 4 hours |
| Recovery Point Objective (RPO) | ≤ 1 hour |
| Graceful degradation | AI service down → deterministic rules only |

### NFR-004: Security

See [Security Design Document](./security.md) for full details.

| Metric | Requirement |
|---|---|
| Authentication | OIDC/SAML + MFA |
| Authorization | RBAC with scope isolation |
| Encryption in transit | TLS 1.3 |
| Encryption at rest | AES-256-GCM |
| Secrets management | HashiCorp Vault (HSM-backed) |
| Audit logging | All security events, 1-year retention |
| Blockchain integrity | SHA-256 hash chain, continuous verification |

### NFR-005: Usability

| Metric | Requirement |
|---|---|
| Time to first audit (new user) | ≤ 15 minutes |
| Learning curve | Productive within 1 day (with documentation) |
| Accessibility | WCAG 2.1 Level AA |
| Documentation | API docs (OpenAPI), user guide, admin guide |

### NFR-006: Maintainability

| Metric | Requirement |
|---|---|
| Code coverage | ≥ 80% |
| Documentation | All public APIs documented |
| New vendor parser addition | ≤ 1 developer-week |
| New compliance framework addition | ≤ 2 developer-weeks |
| Modular architecture | Each service independently deployable |

### NFR-007: Portability

| Metric | Requirement |
|---|---|
| Container-based | All components containerized (Docker) |
| Orchestration | Kubernetes-compatible (K3s, K8s, OpenShift) |
| OS independence | Linux (any major distro) |
| Air-gap deployment | Fully functional without internet |

---

## 5. Interface Requirements

### 5.1 User Interfaces

| Interface | Technology | Description |
|---|---|---|
| Web Dashboard | React + TypeScript | Primary user interface for all user classes |
| CLI Tool | Python (Click) | Admin tool for device registration, bulk operations |
| API Explorer | Swagger UI (auto-generated) | Developer interface for API testing |

### 5.2 Hardware Interfaces

| Interface | Protocol | Purpose |
|---|---|---|
| Network Devices | SSH (port 22) | Configuration extraction |
| Network Devices | NETCONF (port 830) | Structured config extraction |
| Network Devices | REST API (HTTPS) | Vendor API-based extraction |
| Network Devices | SNMP (port 161/162) | Device discovery and metadata |

### 5.3 Software Interfaces

| Interface | Protocol | Purpose |
|---|---|---|
| PostgreSQL | TCP/5432 (TLS) | Primary data store |
| MongoDB | TCP/27017 (TLS) | Compliance rules & knowledge base |
| Apache Kafka | TCP/9093 (SASL/TLS) | Event streaming |
| HashiCorp Vault | HTTPS/8200 | Secrets management |
| Hyperledger Fabric | gRPC/7051 (mTLS) | Blockchain operations |
| SIEM/SOAR | Syslog/Webhook | Alert forwarding |

### 5.4 Communication Interfaces

| Interface | Protocol | Format |
|---|---|---|
| REST API | HTTPS | JSON |
| WebSocket | WSS | JSON events |
| Event Bus | Kafka Protocol | JSON (Avro optional) |
| SIEM Integration | Syslog (RFC 5424) / Webhook | CEF / JSON |
| Email Alerts | SMTP/TLS | HTML |

---

# PART II: SOFTWARE DESIGN SPECIFICATION (SDS)

---

## 6. Design Overview

### 6.1 Design Methodology

AEGIS follows a **Domain-Driven Design (DDD)** approach with the following bounded contexts:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BOUNDED CONTEXTS                                  │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Device      │  │  Compliance  │  │  Evidence    │              │
│  │   Management  │  │  Audit       │  │  Chain       │              │
│  │               │  │              │  │              │              │
│  │  • Device     │  │  • Rule      │  │  • Block     │              │
│  │  • Config     │  │  • Finding   │  │  • Evidence  │              │
│  │  • Credential │  │  • AuditRun  │  │  • Verify    │              │
│  │  • Parser     │  │  • Score     │  │  • Chain     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   AI/NLP     │  │  Remediation │  │  Presentation│              │
│  │   Engine     │  │              │  │              │              │
│  │               │  │  • Playbook  │  │  • Dashboard │              │
│  │  • Interpret  │  │  • Step      │  │  • Report    │              │
│  │  • Classify   │  │  • Verify    │  │  • Alert     │              │
│  │  • Cache      │  │  • Rollback  │  │  • Export    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Design Patterns Used

| Pattern | Where | Why |
|---|---|---|
| **Plugin / Strategy** | Vendor parsers | Extensibility without modifying core |
| **Event Sourcing** | Config changes, audit events | Complete history, replay capability |
| **CQRS** | Audit writes vs. dashboard reads | Optimize read/write paths independently |
| **Chain of Responsibility** | Config → Parse → Normalize → Validate | Sequential processing with clear stages |
| **Observer** | Event bus (Kafka) | Decoupled notification of state changes |
| **Builder** | Report generation | Complex object construction with multiple formats |
| **Repository** | All data access | Abstraction over storage details |
| **Circuit Breaker** | Device connectivity, AI inference | Graceful degradation on failure |
| **Cache-Aside** | NLP rule interpretation | Avoid redundant LLM calls |

---

## 7. Module Design

### 7.1 Config Service Module

```python
# Module: aegis.config
#
# Responsibilities:
# - Device registration and management
# - Config ingestion (upload and live fetch)
# - Vendor detection and parser selection
# - Config normalization to canonical schema
# - Config versioning and diff tracking

class VendorParser(ABC):
    """Abstract base class for vendor-specific config parsers."""
    
    @abstractmethod
    def detect(self, raw_config: str) -> float:
        """Return confidence (0-1) that this parser handles the config."""
        pass
    
    @abstractmethod
    def parse(self, raw_config: str) -> CanonicalConfig:
        """Parse raw config text into canonical security schema."""
        pass
    
    @abstractmethod
    def vendor_id(self) -> str:
        """Return vendor identifier (e.g., 'cisco_ios')."""
        pass
    
    @abstractmethod
    def supported_versions(self) -> list[str]:
        """Return list of supported OS versions."""
        pass


class CiscoIOSParser(VendorParser):
    """Parser for Cisco IOS/IOS-XE configurations."""
    # Uses CiscoConfParse library + custom extraction rules
    # Handles: interfaces, ACLs, AAA, services, logging, crypto


class PaloAltoParser(VendorParser):
    """Parser for Palo Alto PAN-OS configurations."""
    # Handles: XML-based set commands, security profiles, zones


class FortiOSParser(VendorParser):
    """Parser for Fortinet FortiOS configurations."""
    # Handles: config blocks, system global, firewall policy


class ConfigService:
    """Orchestrates config ingestion, parsing, and storage."""
    
    def ingest(self, raw_config: str, device_id: str | None) -> ConfigResult
    def detect_vendor(self, raw_config: str) -> VendorDetection
    def parse_config(self, raw_config: str, vendor: str) -> CanonicalConfig
    def store_config(self, config: CanonicalConfig) -> str  # returns config_id
    def get_diff(self, device_id: str) -> ConfigDiff
    def get_history(self, device_id: str, limit: int) -> list[ConfigVersion]
```

### 7.2 Audit Service Module

```python
# Module: aegis.audit
#
# Responsibilities:
# - Load compliance rules for target frameworks
# - Execute rule evaluation against canonical configs
# - Generate compliance findings and scores
# - Trigger blockchain anchoring
# - Generate audit reports

class RuleEvaluator:
    """Deterministic rule evaluation engine."""
    
    def evaluate(self, rule: ComplianceRule, config: CanonicalConfig) -> Finding:
        """Evaluate a single rule against a canonical config."""
        # Supports operators: equals, not_equals, contains, not_contains,
        # greater_than, less_than, exists, not_exists, matches_regex,
        # in_list, not_in_list
        pass
    
    def evaluate_batch(
        self, rules: list[ComplianceRule], config: CanonicalConfig
    ) -> list[Finding]:
        """Evaluate multiple rules in parallel."""
        pass


class AuditService:
    """Orchestrates compliance audit execution."""
    
    def trigger_audit(self, scope: AuditScope) -> AuditRun
    def get_audit_status(self, audit_id: str) -> AuditStatus
    def get_findings(self, audit_id: str, filters: FindingFilter) -> list[Finding]
    def get_compliance_score(self, audit_id: str) -> ComplianceScore
    def generate_report(self, audit_id: str, format: ReportFormat) -> Report
    def detect_drift(self, device_id: str) -> DriftReport


class ComplianceScore:
    """Compliance scoring model."""
    total_controls: int
    passed: int
    failed: int
    not_applicable: int
    score_percentage: float  # (passed / (passed + failed)) * 100
    by_severity: dict[str, SeverityBreakdown]
    by_category: dict[str, CategoryBreakdown]
    risk_weighted_score: float  # CVSS-weighted compliance score
```

### 7.3 AI/NLP Service Module

```python
# Module: aegis.ai
#
# Responsibilities:
# - Interpret natural-language compliance controls
# - Generate structured audit rules from text
# - Anomaly detection on config patterns
# - Remediation suggestion generation
# - Confidence scoring and caching

class NLPRuleInterpreter:
    """Interprets compliance control text into structured rules."""
    
    def __init__(self, model_path: str, cache: RuleCache):
        self.llm = LocalLLM(model_path)  # On-premises Llama 3.x
        self.cache = cache
    
    def interpret(self, control_text: str, framework: str) -> InterpretedRule:
        """Convert natural language control to structured rule."""
        # 1. Check cache first
        # 2. If miss: LLM inference with structured output prompt
        # 3. Validate output schema
        # 4. Score confidence
        # 5. Cache result
        # 6. Flag for review if confidence < 0.8
        pass
    
    def batch_interpret(
        self, controls: list[ControlText]
    ) -> list[InterpretedRule]:
        """Batch interpretation with progress tracking."""
        pass


class AnomalyDetector:
    """ML-based anomaly detection on config patterns."""
    
    def detect_anomalies(self, config: CanonicalConfig) -> list[Anomaly]:
        """Identify unusual config patterns that may indicate compromise."""
        pass


class RemediationGenerator:
    """AI-assisted remediation playbook generation."""
    
    def generate(
        self, finding: Finding, vendor: str
    ) -> RemediationPlaybook:
        """Generate vendor-specific remediation for a finding."""
        pass
```

### 7.4 Blockchain Service Module

```python
# Module: aegis.blockchain
#
# Responsibilities:
# - Compute evidence hashes
# - Submit evidence blocks to Hyperledger Fabric
# - Verify evidence integrity
# - Browse audit chain

class BlockchainService:
    """Manages audit evidence on Hyperledger Fabric."""
    
    def __init__(self, fabric_config: FabricConfig):
        self.gateway = HLFGateway(fabric_config)
    
    def anchor_audit(self, audit_run: AuditRun) -> BlockRecord:
        """Hash and submit audit evidence to blockchain."""
        # 1. Compute SHA-256 of config snapshots
        # 2. Compute SHA-256 of audit results
        # 3. Compute Merkle root
        # 4. Submit via chaincode
        # 5. Return block record
        pass
    
    def verify_audit(self, audit_id: str) -> VerificationResult:
        """Verify integrity of a specific audit."""
        # 1. Fetch audit data from database
        # 2. Recompute all hashes
        # 3. Fetch block from chain
        # 4. Compare hashes
        # 5. Verify chain linkage
        pass
    
    def get_chain(self, page: int, size: int) -> list[BlockSummary]:
        """Browse the audit evidence chain."""
        pass


class EvidenceHasher:
    """Computes cryptographic hashes for evidence integrity."""
    
    @staticmethod
    def hash_config(config: CanonicalConfig) -> str:
        """SHA-256 hash of canonical config."""
        pass
    
    @staticmethod
    def hash_findings(findings: list[Finding]) -> str:
        """SHA-256 hash of findings set."""
        pass
    
    @staticmethod
    def merkle_root(hashes: list[str]) -> str:
        """Compute Merkle root of hash list."""
        pass
```

---

## 8. Database Design

### 8.1 PostgreSQL Schema

```sql
-- Core device management
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostname VARCHAR(255) NOT NULL,
    vendor VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    os_version VARCHAR(50),
    ip_address INET,
    device_group VARCHAR(100),
    location VARCHAR(255),
    tags JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hostname, ip_address)
);

-- Configuration versions (TimescaleDB hypertable)
CREATE TABLE configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id),
    version INTEGER NOT NULL,
    raw_hash VARCHAR(64) NOT NULL,  -- SHA-256 of raw config
    canonical JSONB NOT NULL,        -- Canonical security schema
    parse_confidence FLOAT,
    unmapped_sections TEXT[],
    source VARCHAR(50),              -- 'upload', 'ssh', 'api', 'netconf'
    captured_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
SELECT create_hypertable('configs', 'captured_at');

-- Audit runs
CREATE TABLE audit_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    triggered_by VARCHAR(255) NOT NULL,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'PENDING',
    frameworks TEXT[] NOT NULL,
    device_scope UUID[],             -- NULL = all devices
    total_devices INTEGER,
    total_controls INTEGER,
    blockchain_block_id VARCHAR(255),
    blockchain_tx_hash VARCHAR(255)
);

-- Compliance findings (TimescaleDB hypertable)
CREATE TABLE findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_run_id UUID REFERENCES audit_runs(id),
    device_id UUID REFERENCES devices(id),
    control_id VARCHAR(50) NOT NULL,
    framework VARCHAR(50) NOT NULL,
    status VARCHAR(10) NOT NULL,     -- 'PASS', 'FAIL', 'NA'
    severity VARCHAR(10),            -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    actual_value TEXT,
    expected_value TEXT,
    evidence TEXT,
    remediation_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
SELECT create_hypertable('findings', 'created_at');

-- Compliance scores (aggregate, TimescaleDB)
CREATE TABLE compliance_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_run_id UUID REFERENCES audit_runs(id),
    device_id UUID REFERENCES devices(id),
    framework VARCHAR(50),
    total_controls INTEGER,
    passed INTEGER,
    failed INTEGER,
    not_applicable INTEGER,
    score_percentage FLOAT,
    risk_weighted_score FLOAT,
    computed_at TIMESTAMPTZ DEFAULT NOW()
);
SELECT create_hypertable('compliance_scores', 'computed_at');

-- Blockchain evidence records
CREATE TABLE blockchain_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_run_id UUID REFERENCES audit_runs(id),
    block_number BIGINT,
    previous_hash VARCHAR(64),
    config_snapshot_hash VARCHAR(64),
    audit_results_hash VARCHAR(64),
    merkle_root VARCHAR(64),
    timestamp TIMESTAMPTZ,
    auditor_identity VARCHAR(255),
    signature TEXT,
    transaction_hash VARCHAR(255)
);
```

### 8.2 MongoDB Collections

```javascript
// compliance_rules collection
{
  "_id": ObjectId(),
  "framework": "CIS",
  "control_id": "2.1.1",
  "title": "Ensure Telnet is disabled",
  "description": "Telnet is an insecure protocol...",
  "severity": "HIGH",
  "category": "services",
  "structured_rule": {
    "check": "services.telnet.enabled",
    "operator": "equals",
    "expected": false
  },
  "interpretation_source": "manual",  // or "ai"
  "confidence_score": 1.0,
  "review_status": "approved",
  "version": 1,
  "created_at": ISODate(),
  "updated_at": ISODate()
}

// remediation_playbooks collection
{
  "_id": ObjectId(),
  "control_id": "2.1.1",
  "vendor": "cisco_ios",
  "steps": [
    {"order": 1, "command": "configure terminal", "description": "Enter config mode"},
    {"order": 2, "command": "line vty 0 15", "description": "Select VTY lines"},
    {"order": 3, "command": "transport input ssh", "description": "Allow SSH only"},
    {"order": 4, "command": "end", "description": "Exit config mode"}
  ],
  "verification_command": "show line vty 0 15 | include Allowed",
  "expected_verification": "Allowed input transports are ssh",
  "risk_level": "LOW",
  "rollback_steps": [
    {"order": 1, "command": "line vty 0 15"},
    {"order": 2, "command": "transport input telnet ssh"}
  ],
  "estimated_time_minutes": 5,
  "source": "manual",
  "approved": true
}
```

---

## 9. Canonical Security Schema Definition

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AEGIS Canonical Security Schema v1.0",
  "type": "object",
  "required": ["device", "services", "authentication"],
  "properties": {
    "device": {
      "type": "object",
      "properties": {
        "vendor": { "type": "string" },
        "model": { "type": "string" },
        "os_version": { "type": "string" },
        "hostname": { "type": "string" },
        "serial_number": { "type": "string" }
      }
    },
    "services": {
      "type": "object",
      "properties": {
        "telnet": { "$ref": "#/$defs/service_status" },
        "ssh": {
          "allOf": [
            { "$ref": "#/$defs/service_status" },
            { "properties": {
                "version": { "type": "integer", "enum": [1, 2] },
                "timeout": { "type": "integer" },
                "retries": { "type": "integer" },
                "ciphers": { "type": "array", "items": { "type": "string" } }
              }
            }
          ]
        },
        "http": { "$ref": "#/$defs/service_status" },
        "https": { "$ref": "#/$defs/service_status" },
        "snmp": {
          "allOf": [
            { "$ref": "#/$defs/service_status" },
            { "properties": {
                "version": { "type": "string", "enum": ["v1", "v2c", "v3"] },
                "community_strings": { "type": "array" }
              }
            }
          ]
        },
        "ntp": { "$ref": "#/$defs/service_status" },
        "syslog": { "$ref": "#/$defs/service_status" }
      }
    },
    "authentication": {
      "type": "object",
      "properties": {
        "aaa_model": { "type": "string" },
        "method_lists": { "type": "array" },
        "local_fallback": { "type": "boolean" },
        "password_policy": {
          "type": "object",
          "properties": {
            "min_length": { "type": "integer" },
            "complexity": { "type": "boolean" },
            "max_age_days": { "type": "integer" }
          }
        },
        "login_banner": { "type": "string" },
        "exec_timeout": { "type": "integer" }
      }
    },
    "access_control": {
      "type": "object",
      "properties": {
        "acls": { "type": "array" },
        "management_acl": { "type": "object" },
        "vty_access_class": { "type": "string" }
      }
    },
    "logging": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" },
        "destinations": { "type": "array" },
        "severity_level": { "type": "string" },
        "buffered_size": { "type": "integer" },
        "timestamps": { "type": "boolean" }
      }
    },
    "encryption": {
      "type": "object",
      "properties": {
        "password_encryption": { "type": "boolean" },
        "key_management": { "type": "object" },
        "ipsec_policies": { "type": "array" },
        "tls_profiles": { "type": "array" }
      }
    },
    "management": {
      "type": "object",
      "properties": {
        "console_access": { "type": "object" },
        "aux_port": { "$ref": "#/$defs/service_status" },
        "management_interface": { "type": "object" },
        "cdp_enabled": { "type": "boolean" },
        "lldp_enabled": { "type": "boolean" }
      }
    }
  },
  "$defs": {
    "service_status": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean" },
        "port": { "type": "integer" },
        "interface_bindings": { "type": "array", "items": { "type": "string" } }
      }
    }
  }
}
```

---

## 10. Traceability Matrix

| Requirement | Architecture Component | Module | Database | Test Suite |
|---|---|---|---|---|
| FR-001 | Config Service | `aegis.config.DeviceManager` | `devices` table | `test_device_registration` |
| FR-002 | Config Service | `aegis.config.ConfigIngestor` | `configs` table | `test_config_upload` |
| FR-003 | Config Service | `aegis.config.VendorParser` | `configs` table | `test_config_parsing` |
| FR-004 | AI/NLP Service + Audit | `aegis.ai.NLPRuleInterpreter` | `compliance_rules` | `test_rule_management` |
| FR-005 | Audit Service | `aegis.audit.AuditService` | `audit_runs`, `findings` | `test_audit_execution` |
| FR-006 | Blockchain Service | `aegis.blockchain.BlockchainService` | `blockchain_records` | `test_blockchain_anchor` |
| FR-007 | Blockchain Service | `aegis.blockchain.BlockchainService` | `blockchain_records` | `test_blockchain_verify` |
| FR-008 | AI/NLP Service | `aegis.ai.NLPRuleInterpreter` | `compliance_rules` | `test_nlp_interpret` |
| FR-009 | Remediation Service | `aegis.remediation.RemediationService` | `remediation_playbooks` | `test_remediation` |
| FR-010 | Frontend + API | React Dashboard | All (read) | `test_dashboard_e2e` |
| FR-011 | Config Service | `aegis.config.DriftDetector` | `configs` (diff) | `test_drift_detection` |

---

## 11. Project Directory Structure

```
aegis/
├── docs/                          # Documentation
│   ├── context.md
│   ├── problem.md
│   ├── solution.md
│   ├── security.md
│   ├── architecture.md
│   └── design.md                  # This document (SRS + SDS)
├── src/
│   ├── aegis/                     # Main Python package
│   │   ├── __init__.py
│   │   ├── config/                # Config Service
│   │   │   ├── __init__.py
│   │   │   ├── models.py          # Device, Config, CanonicalConfig
│   │   │   ├── service.py         # ConfigService orchestrator
│   │   │   ├── ingestor.py        # File/SSH/API ingest
│   │   │   ├── detector.py        # Vendor auto-detection
│   │   │   ├── normalizer.py      # Canonical schema normalizer
│   │   │   ├── diff.py            # Config diff engine
│   │   │   └── parsers/           # Vendor parser plugins
│   │   │       ├── __init__.py
│   │   │       ├── base.py        # VendorParser ABC
│   │   │       ├── cisco_ios.py
│   │   │       ├── palo_alto.py
│   │   │       └── fortios.py
│   │   ├── audit/                 # Audit Service
│   │   │   ├── __init__.py
│   │   │   ├── models.py          # AuditRun, Finding, Score
│   │   │   ├── service.py         # AuditService orchestrator
│   │   │   ├── evaluator.py       # Rule evaluation engine
│   │   │   ├── scorer.py          # Compliance scoring
│   │   │   └── reporter.py        # Report generation
│   │   ├── ai/                    # AI/NLP Service
│   │   │   ├── __init__.py
│   │   │   ├── interpreter.py     # NLP rule interpretation
│   │   │   ├── anomaly.py         # Anomaly detection
│   │   │   ├── remediation_gen.py # AI remediation generation
│   │   │   └── llm.py             # Local LLM wrapper
│   │   ├── blockchain/            # Blockchain Service
│   │   │   ├── __init__.py
│   │   │   ├── service.py         # Blockchain operations
│   │   │   ├── hasher.py          # Evidence hashing
│   │   │   └── fabric.py          # Hyperledger Fabric SDK
│   │   ├── remediation/           # Remediation Service
│   │   │   ├── __init__.py
│   │   │   ├── service.py
│   │   │   └── knowledge_base.py
│   │   ├── api/                   # FastAPI application
│   │   │   ├── __init__.py
│   │   │   ├── main.py            # FastAPI app entry
│   │   │   ├── routes/
│   │   │   │   ├── devices.py
│   │   │   │   ├── configs.py
│   │   │   │   ├── audits.py
│   │   │   │   ├── compliance.py
│   │   │   │   ├── remediation.py
│   │   │   │   ├── blockchain.py
│   │   │   │   └── health.py
│   │   │   ├── middleware/
│   │   │   │   ├── auth.py
│   │   │   │   ├── rate_limit.py
│   │   │   │   └── logging.py
│   │   │   └── schemas/           # Pydantic request/response models
│   │   ├── db/                    # Database
│   │   │   ├── postgres.py
│   │   │   ├── mongodb.py
│   │   │   └── migrations/
│   │   └── common/                # Shared utilities
│   │       ├── config.py          # App configuration
│   │       ├── logging.py
│   │       ├── exceptions.py
│   │       └── constants.py
│   └── frontend/                  # React Dashboard
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── services/          # API clients
│       │   └── types/
│       ├── package.json
│       └── tsconfig.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── chaincode/                     # Hyperledger Fabric chaincode
│   └── audit_evidence/
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
├── k8s/                           # Kubernetes manifests
├── data/                          # Sample configs for demo
│   ├── sample_configs/
│   │   ├── cisco_ios_sample.txt
│   │   ├── palo_alto_sample.xml
│   │   └── fortios_sample.conf
│   └── compliance_rules/
│       └── cis_benchmarks/
├── README.md
├── pyproject.toml
└── Makefile
```

---

---

# PART III: UI/UX DESIGN SPECIFICATION & COMPONENT SYSTEM

---

## 13. Visual Design Philosophy & Cyber-Defense Aesthetic

AEGIS implements a **Military-Grade Cyber-SOC Design System** engineered for high-stakes intelligence, security operations, and regulatory audit workflows. Built on the principles of **high-density data clarity, visual hierarchy, and instant cognitive comprehension**, the interface balances futuristic cyber aesthetics with zero-clutter tactical utility.

Inspired by industry-leading design systems (VibeCurb, TasteSkill, SitePeel, GetDesign.md, Duply.ai), AEGIS achieves visual excellence through:
- **Atmospheric Depth**: Deep obsidian layered surfaces (`#070A0F` to `#111827`) with subtle glassmorphism and ambient border glows.
- **Semantic Luminance**: Purpose-driven neon accents highlighting real-time security postures, cryptographic proofs, and critical anomalies.
- **Tactical Typography**: Crisp pairing of technical monospace (`JetBrains Mono` / `Geist Mono`) for configs, hashes, and AST schemas with modern humanist sans-serif (`Plus Jakarta Sans` / `Inter`) for UI and metrics.
- **Fluid Micro-Interactions**: Real-time WebSocket pulse indicators, smooth layout morphs, interactive Merkle tree expansions, and instant terminal command copy actions.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                AEGIS COLOR SYSTEM MATRIX                                │
├───────────────────┬───────────────────┬───────────────────┬────────────────────────────┤
│ SURFACE & CANVAS  │ SEMANTIC STATES   │ CRYPTOGRAPHIC & AI│ SYNTAX & DATA ACCENTS      │
│ Deep Obsidian     │ Defense Emerald   │ Hyperledger Cyan  │ Cisco Teal: #00BCEB        │
│ #070A0F (Base)    │ #10B981 (Compliant│ #00F0FF (Chain/Led│ Palo Alto Orange: #FA582D  │
│                   │                   │                   │                            │
│ Surface Slate     │ Critical Crimson  │ Neural Violet     │ Fortinet Red: #EE3124      │
│ #0F172A (Cards)   │ #EF4444 (Non-Comp)│ #8B5CF6 (AI/NLP)  │                            │
│                   │                   │                   │ Juniper Blue: #84BD00      │
│ Elevated Border   │ Warning Amber     │ Merkle Gold       │ JSON Key: #93C5FD          │
│ #1E293B (Glow)    │ #F59E0B (Drift)   │ #FBBF24 (Proof)   │ JSON String: #86EFAC       │
└───────────────────┴───────────────────┴───────────────────┴────────────────────────────┘
```

---

## 14. Design Tokens & Core Theme Specification

### 14.1 Color Tokens

```css
:root {
  /* Surface & Background Hierarchy */
  --bg-canvas: #070a0f;
  --bg-surface-subtle: #0b0f17;
  --bg-surface: #0f172a;
  --bg-surface-elevated: #162036;
  --bg-surface-glass: rgba(15, 23, 42, 0.75);
  --bg-surface-active: #1e293b;

  /* Border & Dividers */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: #1e293b;
  --border-highlight: #334155;
  --border-glow-cyan: rgba(0, 240, 255, 0.35);
  --border-glow-emerald: rgba(16, 185, 129, 0.35);
  --border-glow-crimson: rgba(239, 68, 68, 0.35);

  /* Primary Typography */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;
  --text-disabled: #475569;
  --text-inverse: #070a0f;

  /* Semantic State Tokens */
  --color-success: #10b981;
  --color-success-bg: rgba(16, 185, 129, 0.12);
  --color-warning: #f59e0b;
  --color-warning-bg: rgba(245, 158, 11, 0.12);
  --color-danger: #ef4444;
  --color-danger-bg: rgba(239, 68, 68, 0.12);
  --color-info: #0284c7;
  --color-info-bg: rgba(2, 132, 199, 0.12);

  /* Special Feature Accents */
  --color-blockchain: #00f0ff;
  --color-blockchain-bg: rgba(0, 240, 255, 0.1);
  --color-ai-nlp: #a855f7;
  --color-ai-nlp-bg: rgba(168, 85, 247, 0.12);
  --color-drift: #fb923c;
  --color-drift-bg: rgba(251, 146, 60, 0.12);

  /* Vendor Identity Accents */
  --vendor-cisco: #00bceb;
  --vendor-paloalto: #fa582d;
  --vendor-fortinet: #ee3124;
  --vendor-juniper: #84bd00;
  --vendor-checkpoint: #ec008c;
}
```

### 14.2 Typography Hierarchy

| Level | Font Family | Size / Weight | Line Height | Tracking | Usage |
|---|---|---|---|---|---|
| **Display (H1)** | Plus Jakarta Sans | 32px / 700 SemiBold | 40px | -0.02em | Main Dashboard Header, Critical Alerts |
| **Section (H2)** | Plus Jakarta Sans | 22px / 600 SemiBold | 28px | -0.01em | Module Title, Card Group Header |
| **Card Title (H3)** | Plus Jakarta Sans | 16px / 600 Medium | 24px | 0.0em | Widget Titles, Device Names, Panel Headers |
| **Body (Default)** | Inter / Sans | 14px / 400 Regular | 20px | 0.0em | Descriptions, Explanations, Tables |
| **Body Small** | Inter / Sans | 12px / 500 Medium | 16px | +0.01em | Metadata, Timestamps, Labels, Badges |
| **Code / Hash** | JetBrains Mono | 13px / 500 Medium | 18px | 0.0em | Block Hashes, CLI Commands, Merkle Roots |
| **Schema Tree** | Geist Mono | 12px / 400 Regular | 16px | 0.0em | Canonical JSON, AST Nodes, Diffs |

---

## 15. Core Screen Architecture & Layouts

### 15.1 Global Shell & Navigation Framework

The application adopts an ultra-responsive three-tier command layout:
1. **Top Security Telemetry Bar (48px)**:
   - System Health Indicator (Green pulse: "Hyperledger Peer Connected | AI In-Memory Model Ready | 0 Unhandled Drifts")
   - Global Search Bar with `Ctrl+K` Command Palette (instant jump to device, finding, CVE, or block hash)
   - Scope Selector (All Networks, Defense DMZ, Core Backbone, Edge Firewalls)
   - User Profile & Cryptographic Key Session Badge (mTLS Auth Level 3)
2. **Left Navigation Ribbon (64px Collapsed / 240px Expanded)**:
   - **Dashboard**: Global Compliance Posture & Threat Matrix
   - **Devices & Configs**: Ingestion Hub, Vendor Parser Studio & Live Drift
   - **Audit Engine**: Compliance Run Orchestrator & Multi-Framework Matrix
   - **AI Rule Studio**: NLP Natural Language to Rule Compiler
   - **Blockchain Ledger**: Merkle Proof Browser & External Auditor Portal
   - **Remediation**: Automated CLI Playbooks & Rollback Sandbox
   - **Settings & Vault**: HashiCorp Vault Keys, Node Topology, RBAC
3. **Main Content Canvas (Fluid with 12-Column Grid)**:
   - Dynamic viewport supporting dense multi-column inspection, split diff editors, and full-screen telemetry graph modes.

---

### 15.2 Screen 1: Executive Security Posture & Fleet Overview

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [AEGIS] [Global Scope: All Fleets ▼]   [ 🔍 Search devices, CVEs, block hashes... (Ctrl+K) ]  [🟢 Peer OK] [Admin Cert] │
├──────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 📊   │ ┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────┐│
│ 🖥️   │ │ FLEET COMPLIANCE POSTURE  │ │ REAL-TIME AUDIT METRICS   │ │ BLOCKCHAIN EVIDENCE CHAIN │ │ DRIFT ALERTS (24h)││
│ ⚡   │ │   94.2%  ▲ +2.1% this wk  │ │ 1,248 Devices Audited     │ │ Block #48,291             │ │ ⚠️ 3 Critical Drift││
│ 🧠   │ │   [ Radial Gauge 94.2% ]  │ │ 18,420 Controls Evaluated │ │ Root: 0x9f8c...3a1e (OK)  │ │ 12 Auto-Remediated││
│ 🔗   │ │   1,176 Pass | 72 Fail    │ │ 4 Frameworks Active       │ │ Last Anchored: 2m ago     │ │ 0 Unverified      ││
│ 🛠️   │ └───────────────────────────┘ └───────────────────────────┘ └───────────────────────────┘ └───────────────────┘│
│ ⚙️   │ ┌──────────────────────────────────────────────────────────────┐ ┌──────────────────────────────────────────────┐│
│      │ │ MULTI-VENDOR FLEET COMPLIANCE BREAKDOWN                      │ │ FRAMEWORK COMPLIANCE RADAR                   ││
│      │ │ Vendor       Total  Pass   Fail   Compliance  Status         │ │   CIS Benchmarks v8.0 : 96.4% ████████████░  ││
│      │ │ Cisco IOS     520    498    22      95.7%    🟢 NOMINAL     │ │   NIST SP 800-53 r5   : 92.8% ███████████░░  ││
│      │ │ Palo Alto     340    328    12      96.4%    🟢 NOMINAL     │ │   DISA STIG           : 89.5% ██████████░░░  ││
│      │ │ Fortinet      280    252    28      90.0%    🟡 ATTENTION   │ │   ISO 27001:2022      : 98.1% ████████████░  ││
│      │ │ Juniper       108     98    10      90.7%    🟡 ATTENTION   │ └──────────────────────────────────────────────┘│
│      │ └──────────────────────────────────────────────────────────────┘ ┌──────────────────────────────────────────────┐│
│      │ ┌──────────────────────────────────────────────────────────────┐ │ REAL-TIME BLOCKCHAIN ANCHOR FEED            ││
│      │ │ CRITICAL COMPLIANCE FAILURES REQUIRING ACTION                │ │ [14:22:01] Block #48291 • Tx 0x7a2... Verified││
│      │ │ Device: edge-fw-palo-01 | CIS 3.2.1 Telnet Plaintext Enabled │ │ [14:20:15] Block #48290 • Tx 0x11c... Verified││
│      │ │ [Remediate Playbook] [View Canonical AST] [Inspect Chain]    │ │ [14:18:02] Block #48289 • Tx 0x89e... Verified││
│      │ └──────────────────────────────────────────────────────────────┘ └──────────────────────────────────────────────┘│
└──────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 15.3 Screen 2: Multi-Vendor Ingestion & Canonical Normalizer Studio

This screen enables security engineers and auditors to upload raw configs, observe real-time AI parsing into the Canonical Security Schema, and inspect configuration drifts side-by-side.

#### Interactive Features:
1. **Dual-Pane Interactive Config Viewer**:
   - Left Pane: Raw Vendor Syntax (Cisco IOS running-config, Palo Alto XML/Set-commands, FortiOS hierarchical blocks) with custom syntax highlighting.
   - Right Pane: Canonical JSON AST Representation with interactive node highlighting (clicking an ACL in raw CLI highlights the normalized `access_control.acls[0]` JSON structure).
2. **Parser Confidence & Section Health Widget**:
   - Confidence Score Gauge: `99.4% Confidence (CiscoIOSParser v2.4)`
   - Unmapped Sections Counter: `0 Critical unmapped | 2 Informational banners skipped`
3. **Live Drift & Time Machine Diff View**:
   - Visual red/green structural inline and split diff with severity tags (`CRITICAL: Telnet enabled in v3 vs disabled in v2`).

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ INGESTION & CANONICAL NORMALIZER STUDIO                                                 [Upload Config] [Fetch Live]   │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Device: [ core-switch-cisco-01 ▼ ]  |  Vendor Detected: [ Cisco IOS-XE (99.8% Match) ]  |  Hash: sha256:d8a2...3f1e    │
├──────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────┤
│ RAW VENDOR CONFIG (CISCO IOS)                                │ CANONICAL SECURITY SCHEMA (JSON AST)                    │
│ 1: hostname core-switch-cisco-01                             │ {                                                       │
│ 2: !                                                         │   "device": {                                           │
│ 3: service password-encryption                               │     "vendor": "cisco_ios",                              │
│ 4: !                                                         │     "hostname": "core-switch-cisco-01"                  │
│ 5: line vty 0 4                                              │   },                                                    │
│ 6:  transport input ssh                                      │   "services": {                                         │
│ 7:  exec-timeout 5 0                                         │     "ssh": { "enabled": true, "timeout": 300 },         │
│ 8:  access-class 10 in                                       │     "telnet": { "enabled": false }                      │
│ 9: !                                                         │   },                                                    │
│ 10: snmp-server community ******* RO 50                      │   "access_control": {                                   │
│                                                              │     "vty_access_class": "10"                            │
│                                                              │   }                                                     │
│                                                              │ }                                                       │
├──────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────┤
│ [🟢 Parser Complete in 142ms]  [Canonical Validation: PASSED (Draft 2020-12)]  [Drift Status: 1 Mod from Baseline v1.2]│
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 15.4 Screen 3: AI/NLP Semantic Rule Studio & Compliance Cross-Walk

Enables security architects to transform human-readable regulatory standards (e.g., "Ensure all admin interfaces timeout after 5 minutes of inactivity") into deterministic AST verification rules.

#### Key UX Components:
1. **Natural Language Rule Compiler Sandbox**:
   - Input Box: Textarea supporting rich markdown and copy-pasted STIG/CIS benchmark requirements.
   - Live Token Stream Visualizer: Shows LLM reasoning tokens and AST JSON generation with zero hallucination guardrails.
   - Confidence Metric: High-confidence rules (`≥ 0.95`) marked **AUTO-DEPLOYABLE**, while low-confidence rules (`< 0.80`) trigger an inline **Human-in-the-Loop (HITL) Verification Drawer**.
2. **Framework Cross-Walk Matrix Table**:
   - Dynamic pivot table mapping a single canonical check (`services.ssh.timeout <= 300`) to multiple compliance standards simultaneously:
     - **CIS Cisco Benchmark v8.0**: Control 2.2.3
     - **NIST SP 800-53 Rev. 5**: AC-12 Session Termination
     - **DISA STIG**: NET0812
     - **ISO/IEC 27001:2022**: A.8.19 Access Control

---

### 15.5 Screen 4: Cryptographic Evidence Verifier & Chain Explorer

A dedicated trust portal providing undeniable mathematical proof of audit integrity for internal teams and external regulators.

#### Key UX Components:
1. **Interactive Merkle Tree Graph**:
   - Visual interactive SVG graph displaying the entire cryptographic tree for any selected audit run:
     - Leaf 1: Raw Config SHA-256
     - Leaf 2: Canonical Schema SHA-256
     - Leaf 3: Rule Set Evaluator Hash
     - Leaf 4: Execution Finding Hash
     - Combined Parent: Merkle Root (`0x3e7a...8b99`) anchored to Hyperledger Block.
2. **Auditor "Drop & Verify" Tool**:
   - Independent verification portal where auditors drop a downloaded `.aegis-proof` certificate. The browser calculates client-side SHA-256 hashes in WebAssembly and verifies the digital signature directly against the local or remote Hyperledger peer.
3. **One-Click Verifiable Regulatory Export**:
   - PDF/JSON-LD with embedded cryptographically verifiable QR codes for government defense audits.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CRYPTOGRAPHIC AUDIT VERIFIER & HYPERLEDGER CHAIN EXPLORER                               [Export Verification Certificate]│
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Target Audit Run: [ AUD-2026-0928-88192 ▼ ]  |  Block Index: #48,291  |  Timestamp: 2026-09-28T05:22:14 UTC           │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ MERKLE EVIDENCE PROOF TREE                                                                                             │
│                                                                                                                        │
│                             ┌───────────────────────────────────────┐                                                  │
│                             │     MERKLE ROOT ANCHOR ON LEDGER      │                                                  │
│                             │   0x9f8c4e21a73b9012cd894ef32109ab76  │                                                  │
│                             └───────────────────┬───────────────────┘                                                  │
│                                                 │                                                                      │
│                       ┌─────────────────────────┴─────────────────────────┐                                            │
│                       ▼                                                   ▼                                            │
│          ┌─────────────────────────┐                         ┌─────────────────────────┐                               │
│          │   CONFIG DATA PARENT    │                         │   AUDIT RESULT PARENT   │                               │
│          │   0x4b71...a932 (VALID) │                         │   0xd810...56e1 (VALID) │                               │
│          └────────────┬────────────┘                         └────────────┬────────────┘                               │
│                       │                                                   │                                            │
│           ┌───────────┴───────────┐                           ┌───────────┴───────────┐                                │
│           ▼                       ▼                           ▼                       ▼                                │
│  ┌─────────────────┐     ┌─────────────────┐         ┌─────────────────┐     ┌─────────────────┐                       │
│  │ Raw Config Hash │     │ Canonical AST   │         │ Findings Set    │     │ Rule Set Hash   │                       │
│  │ 0x1a89...ef42   │     │ 0x88de...3102   │         │ 0x77cf...4019   │     │ 0x55aa...9911   │                       │
│  └─────────────────┘     └─────────────────┘         └─────────────────┘     └─────────────────┘                       │
├────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ INTEGRITY STATUS: 🟢 CRYPTOGRAPHICALLY VALID (100% Non-Repudiation Guaranteed) | Signed by: PKI CA: NTRO-GOV-SUB-CA-01│
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 15.6 Screen 5: Automated Remediation Playbook Engine

Provides engineers with validated remediation commands, risk impact analysis, and instant rollback safety.

#### Key UX Components:
1. **Remediation Action Card**:
   - Risk Badge (`LOW RISK - Zero Traffic Disruption Expected`).
   - Copy-to-Clipboard single line CLI command & bulk batch script format.
2. **Pre-Execution Blast Radius Simulator**:
   - Analyzes whether applying the command will disconnect active sessions, break routing adjacencies, or invalidate existing NAT translations.
3. **Verification Command & Rollback Scripts**:
   - Exact CLI verification queries and deterministic undo scripts ready for deployment.

---

## 16. Micro-Interactions, Motion Design & Accessibility (WCAG 2.1 AAA)

### 16.1 Micro-Interactions & State Transitions
- **Audit Running State**: Subtle glowing neon cyan scanning laser effect across table rows during active rule evaluation.
- **Verification Pulse**: Instant transition from pending spinner to checkmark badge with emerald shimmer when cryptographic integrity validates.
- **Drift Alert Badge**: Amber pulsating border indicating fresh, unacknowledged configuration changes.
- **Code Copy Feedback**: 1.2s tooltip confirmation `"Copied Command to Clipboard"` with haptic micro-state.

### 16.2 Accessibility & Ergonomic Standards
- **Contrast Ratios**: Exceeds WCAG 2.1 AAA standards (Minimum 7:1 contrast ratio for all text elements against `#070A0F` background).
- **Keyboard Navigation**: Full keyboard accessibility (`Tab`, `Shift+Tab`, `Arrow` keys for AST schema navigation, `Escape` for modal dismissal, `Ctrl+K` for global launcher).
- **Screen Reader Support**: Complete ARIA attributes (`aria-expanded`, `aria-live="polite"`, `role="treegrid"`) across all custom components.
- **Reduced Motion Support**: `@media (prefers-reduced-motion: reduce)` disables scanning lasers, matrix pulses, and animated gauge transitions.

---

## 17. Revision History

| Version | Date | Author | Description |
|---|---|---|---|
| 1.0 | 2026-09-28 | Product & Engineering Team | Initial SRS/SDS for NTRO challenge |
| 1.1 | 2026-09-28 | Senior Product Designer & UI/UX Lead | Added Part III: Complete UI/UX Specification & SOC Design System |

---

> **Document Suite Complete**  
> [Context](./context.md) → [Problem](./problem.md) → [Solution](./solution.md) → [Security](./security.md) → [Architecture](./architecture.md) → [Design (SRS + SDS + UI/UX)](./design.md)

