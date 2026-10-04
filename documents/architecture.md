# AEGIS — Architecture Document

> **Document ID**: AEGIS-ARCH-001  
> **Version**: 1.0  
> **Classification**: INTERNAL — NTRO Challenge Submission  
> **Last Updated**: 2026-09-28  
> **Predecessor**: [Security Design](./security.md)  

---

## 1. Architecture Overview

AEGIS follows a **modular, event-driven, microservices architecture** designed for:
- **Extensibility**: New vendor parsers and compliance frameworks added without core changes
- **Scalability**: Horizontal scaling of compute-heavy components (parsing, AI inference, rule evaluation)
- **Security**: Defense-in-depth with zone-based network segmentation
- **Auditability**: Every action produces an immutable evidence trail

---

## 2. C4 Architecture Model

### 2.1 Level 1: System Context

```
                              ┌───────────────────┐
                              │   Security Team    │
                              │   (Primary User)   │
                              └─────────┬─────────┘
                                        │ HTTPS
                                        ▼
┌───────────────┐              ┌────────────────────┐              ┌───────────────┐
│  Compliance   │              │                    │              │   Network     │
│  Frameworks   │─────────────▶│       AEGIS        │◀─────────────│   Devices     │
│  (CIS/NIST/   │  Import      │   Compliance       │  SSH/API/    │  (Firewalls,  │
│   STIG/ISO)   │  Rules       │   Auditor System   │  NETCONF     │   Routers,    │
└───────────────┘              │                    │              │   Switches)   │
                               └──────┬─────┬──────┘              └───────────────┘
                                      │     │
                            ┌─────────┘     └──────────┐
                            ▼                          ▼
                   ┌────────────────┐         ┌────────────────┐
                   │  SIEM/SOAR     │         │  Blockchain    │
                   │  (Splunk/      │         │  Network       │
                   │   QRadar)      │         │  (Hyperledger) │
                   └────────────────┘         └────────────────┘
```

### 2.2 Level 2: Container Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              AEGIS SYSTEM                                     │
│                                                                                │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │                        FRONTEND CONTAINER                              │   │
│  │  ┌───────────────────────────────────────────────────────────────┐    │   │
│  │  │  React SPA (TypeScript)                                       │    │   │
│  │  │  • Compliance Dashboard    • Device Inventory                 │    │   │
│  │  │  • Finding Explorer        • Blockchain Verifier              │    │   │
│  │  │  • Drift Monitor           • Report Generator                 │    │   │
│  │  │  ──────────────────────────────────────────────────           │    │   │
│  │  │  Libraries: D3.js, Recharts, TanStack Query                   │    │   │
│  │  └───────────────────────────────────────────────────────────────┘    │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
│           │ HTTPS (REST + WebSocket)                                          │
│           ▼                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │                        API GATEWAY CONTAINER                           │   │
│  │  ┌───────────────────────────────────────────────────────────────┐    │   │
│  │  │  FastAPI (Python 3.12)                                        │    │   │
│  │  │  • Auth Middleware (JWT/OIDC)    • Rate Limiter               │    │   │
│  │  │  • Request Validation            • Response Serialization     │    │   │
│  │  │  • WebSocket Manager             • API Versioning (/v1/)      │    │   │
│  │  │  ──────────────────────────────────────────────────           │    │   │
│  │  │  Endpoints: /audit /devices /compliance /reports              │    │   │
│  │  │             /remediation /blockchain /health                   │    │   │
│  │  └───────────────────────────────────────────────────────────────┘    │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
│           │ gRPC / mTLS                                                       │
│           ▼                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │                     CORE ENGINE CONTAINERS                             │   │
│  │                                                                        │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │   │
│  │  │  CONFIG SERVICE   │  │  AUDIT SERVICE   │  │  REMEDIATION SVC │    │   │
│  │  │                   │  │                   │  │                   │    │   │
│  │  │  • Vendor detect  │  │  • Rule engine    │  │  • KB lookup      │    │   │
│  │  │  • Config parse   │  │  • Framework map  │  │  • LLM-assisted   │    │   │
│  │  │  • Normalization  │  │  • Scoring        │  │  • Playbook gen   │    │   │
│  │  │  • Diff engine    │  │  • Drift detect   │  │  • Priority rank  │    │   │
│  │  │  • Version store  │  │  • Report gen     │  │  • Verification   │    │   │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘    │   │
│  │                                                                        │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                           │   │
│  │  │  AI/NLP SERVICE   │  │  BLOCKCHAIN SVC  │                           │   │
│  │  │                   │  │                   │                           │   │
│  │  │  • LLM inference  │  │  • Evidence hash  │                           │   │
│  │  │  • Rule interpret │  │  • Block submit   │                           │   │
│  │  │  • Config analysis│  │  • Chain verify   │                           │   │
│  │  │  • Anomaly detect │  │  • Certificate    │                           │   │
│  │  └──────────────────┘  └──────────────────┘                           │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
│           │                                                                    │
│           ▼                                                                    │
│  ┌────────────────────────────────────────────────────────────────────────┐   │
│  │                     DATA & INFRASTRUCTURE                              │   │
│  │                                                                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │PostgreSQL│ │MongoDB   │ │ Kafka    │ │ Vault    │ │Hyperledger│   │   │
│  │  │+Timescale│ │          │ │          │ │          │ │ Fabric    │   │   │
│  │  │          │ │ Rules &  │ │ Event    │ │ Secrets  │ │ Audit     │   │   │
│  │  │ Configs  │ │ Knowledge│ │ Stream   │ │ Mgmt     │ │ Ledger    │   │   │
│  │  │ History  │ │ Base     │ │          │ │          │ │           │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Level 3: Component Diagram (Config Service)

```
┌──────────────────────────────────────────────────────────────────┐
│                      CONFIG SERVICE                               │
│                                                                    │
│  ┌──────────────────┐                                             │
│  │  Config Ingestor  │ ← Accepts raw config (file upload / SSH)  │
│  │  • File handler   │                                             │
│  │  • SSH connector   │                                             │
│  │  • API connector   │                                             │
│  └────────┬─────────┘                                             │
│           │                                                        │
│           ▼                                                        │
│  ┌──────────────────┐                                             │
│  │  Vendor Detector  │ ← Fingerprints config to identify vendor  │
│  │  • Signature DB   │                                             │
│  │  • Heuristic      │                                             │
│  │  • ML classifier  │                                             │
│  └────────┬─────────┘                                             │
│           │                                                        │
│           ▼                                                        │
│  ┌──────────────────┐                                             │
│  │  Parser Registry  │ ← Plugin registry for vendor parsers      │
│  │                    │                                             │
│  │  ┌──────────────┐ │                                             │
│  │  │ CiscoIOS     │ │  Interface: VendorParser                   │
│  │  │ Parser       │ │  ┌────────────────────────────────┐        │
│  │  └──────────────┘ │  │  parse(raw: str) → CanonicalCfg│        │
│  │  ┌──────────────┐ │  │  detect(raw: str) → bool       │        │
│  │  │ PaloAlto     │ │  │  version() → str               │        │
│  │  │ Parser       │ │  │  vendor_id() → str             │        │
│  │  └──────────────┘ │  └────────────────────────────────┘        │
│  │  ┌──────────────┐ │                                             │
│  │  │ FortiOS      │ │                                             │
│  │  │ Parser       │ │                                             │
│  │  └──────────────┘ │                                             │
│  └────────┬─────────┘                                             │
│           │                                                        │
│           ▼                                                        │
│  ┌──────────────────┐                                             │
│  │  Schema Normalizer│ ← Transforms parsed data to canonical     │
│  │  • Validation     │                                             │
│  │  • Enrichment     │                                             │
│  │  • Hashing        │                                             │
│  └────────┬─────────┘                                             │
│           │                                                        │
│           ▼                                                        │
│  ┌──────────────────┐                                             │
│  │  Config Store     │ ← Versioned storage with diff tracking    │
│  │  • PostgreSQL     │                                             │
│  │  • Version history│                                             │
│  │  • Diff engine    │                                             │
│  └──────────────────┘                                             │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Architecture

### 3.1 Entity Relationship Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│   Device      │     │  Config      │     │  Audit Run           │
│──────────────│     │──────────────│     │──────────────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)              │
│ hostname     │     │ device_id(FK)│     │ triggered_by         │
│ vendor       │     │ version      │     │ triggered_at         │
│ model        │     │ raw_hash     │     │ completed_at         │
│ os_version   │     │ canonical    │     │ status               │
│ ip_address   │     │ captured_at  │     │ framework_ids        │
│ device_group │     │ source       │     │ device_scope         │
│ location     │     │              │     │ blockchain_block_id  │
│ tags         │     │              │     │                      │
└──────┬───────┘     └──────┬───────┘     └──────┬───────────────┘
       │                    │                     │
       │  1:N               │  1:N                │  1:N
       │                    │                     │
       ▼                    ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│  Credential   │     │  Config Diff │     │  Finding             │
│──────────────│     │──────────────│     │──────────────────────│
│ id (PK)      │     │ id (PK)      │     │ id (PK)              │
│ device_id(FK)│     │ config_v1(FK)│     │ audit_run_id (FK)    │
│ vault_path   │     │ config_v2(FK)│     │ device_id (FK)       │
│ protocol     │     │ diff_json    │     │ control_id           │
│ last_rotated │     │ created_at   │     │ framework            │
└──────────────┘     └──────────────┘     │ status (PASS/FAIL/NA)│
                                           │ severity             │
                                           │ actual_value         │
                                           │ expected_value       │
                                           │ evidence             │
                                           │ remediation_id (FK)  │
                                           └──────────────────────┘

┌──────────────────────┐     ┌──────────────────────┐
│  Compliance Rule      │     │  Remediation          │
│──────────────────────│     │──────────────────────│
│ id (PK)              │     │ id (PK)              │
│ framework            │     │ control_id           │
│ control_id           │     │ vendor               │
│ title                │     │ steps (JSON)         │
│ description (NL)     │     │ verification_cmd     │
│ structured_rule(JSON)│     │ risk_level           │
│ severity             │     │ rollback_steps       │
│ interpretation_source│     │ estimated_time       │
│ last_validated       │     │ source (manual/ai)   │
│ confidence_score     │     │ approved             │
└──────────────────────┘     └──────────────────────┘

┌──────────────────────┐
│  Blockchain Block     │
│──────────────────────│
│ block_id (PK)        │
│ previous_hash        │
│ config_snapshot_hash │
│ audit_results_hash   │
│ timestamp            │
│ auditor_identity     │
│ merkle_root          │
│ signature            │
└──────────────────────┘
```

### 3.2 Data Flow Diagram

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌────────────┐
│ Network │    │ Config   │    │ Canonical │    │ Audit    │    │ Blockchain │
│ Devices │───▶│ Ingest   │───▶│ Store     │───▶│ Engine   │───▶│ Ledger     │
│         │    │          │    │           │    │          │    │            │
│ SSH/API │    │ Parse &  │    │ PostgreSQL│    │ Rule     │    │ Hyperledger│
│ NETCONF │    │ Normalize│    │ +History  │    │ Evaluate │    │ Fabric     │
└─────────┘    └──────────┘    └───────────┘    └──────┬───┘    └────────────┘
                                                       │
                                               ┌───────▼──────┐
                                               │  Findings    │
                                               │  + Reports   │
                                               │  + Alerts    │
                                               └───────┬──────┘
                                                       │
                                          ┌────────────┼────────────┐
                                          ▼            ▼            ▼
                                    ┌──────────┐ ┌──────────┐ ┌──────────┐
                                    │Dashboard │ │ SIEM     │ │ Email/   │
                                    │(WebSocket│ │(Webhook) │ │ Slack    │
                                    │  Push)   │ │          │ │ Alerts   │
                                    └──────────┘ └──────────┘ └──────────┘
```

---

## 4. Event-Driven Architecture

### 4.1 Kafka Topic Design

| Topic | Partitions | Retention | Producers | Consumers |
|---|---|---|---|---|
| `aegis.config.ingested` | 8 | 7 days | Config Service | Audit Service, Drift Detector |
| `aegis.config.changed` | 4 | 30 days | Config Service | Audit Service, Alert Service |
| `aegis.audit.triggered` | 4 | 7 days | API, Scheduler | Audit Service |
| `aegis.audit.completed` | 4 | 30 days | Audit Service | Blockchain Service, Dashboard |
| `aegis.finding.created` | 8 | 90 days | Audit Service | Dashboard, SIEM, Alert Service |
| `aegis.blockchain.anchored` | 2 | Indefinite | Blockchain Service | Dashboard |
| `aegis.alert.critical` | 2 | 30 days | Alert Service | Notification Service |

### 4.2 Event Schema (Example)

```json
{
  "event_id": "evt-2026-09-28-001",
  "event_type": "aegis.audit.completed",
  "timestamp": "2026-09-28T05:00:00.000Z",
  "correlation_id": "audit-run-789",
  "source_service": "audit-service",
  "payload": {
    "audit_run_id": "audit-run-789",
    "device_count": 150,
    "framework": "CIS",
    "summary": {
      "total_controls": 200,
      "passed": 172,
      "failed": 23,
      "not_applicable": 5,
      "compliance_score": 88.2
    },
    "critical_findings": 3,
    "blockchain_pending": true
  }
}
```

---

## 5. Deployment Architecture

### 5.1 Kubernetes Deployment (K3s)

```
┌──────────────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER (K3s)                        │
│                                                                    │
│  Namespace: aegis-frontend                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Deployment: dashboard (replicas: 2)                      │    │
│  │  Service: ClusterIP → Ingress (TLS termination)           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  Namespace: aegis-api                                             │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Deployment: api-gateway (replicas: 2, HPA: 2-8)         │    │
│  │  Service: ClusterIP                                        │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  Namespace: aegis-core                                            │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Deployment: config-service (replicas: 2)                  │    │
│  │  Deployment: audit-service (replicas: 2, HPA: 2-10)       │    │
│  │  Deployment: remediation-service (replicas: 1)             │    │
│  │  Deployment: ai-nlp-service (replicas: 1, GPU node)        │    │
│  │  Deployment: blockchain-service (replicas: 1)              │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  Namespace: aegis-data                                            │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  StatefulSet: postgresql (replicas: 1, PVC: 100Gi)         │    │
│  │  StatefulSet: mongodb (replicas: 1, PVC: 50Gi)             │    │
│  │  StatefulSet: kafka (replicas: 3, PVC: 50Gi each)          │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  Namespace: aegis-infra                                           │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Deployment: vault (replicas: 1, PVC: 10Gi)               │    │
│  │  Deployment: prometheus + grafana                          │    │
│  │  DaemonSet: fluentbit (log collection)                     │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│  Namespace: aegis-blockchain                                      │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  StatefulSet: hlf-peer (replicas: 2)                       │    │
│  │  StatefulSet: hlf-orderer (replicas: 1)                    │    │
│  │  Job: chaincode-deploy                                     │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 5.2 Resource Requirements

| Component | CPU | Memory | Storage | GPU |
|---|---|---|---|---|
| API Gateway | 0.5-2 cores | 512Mi-2Gi | — | — |
| Config Service | 1-4 cores | 1Gi-4Gi | — | — |
| Audit Service | 1-4 cores | 1Gi-4Gi | — | — |
| AI/NLP Service | 2-8 cores | 4Gi-16Gi | 10Gi (model) | 1× (optional) |
| PostgreSQL | 2-4 cores | 4Gi-8Gi | 100Gi | — |
| MongoDB | 1-2 cores | 2Gi-4Gi | 50Gi | — |
| Kafka (per broker) | 1-2 cores | 2Gi-4Gi | 50Gi | — |
| Vault | 0.5-1 core | 256Mi-1Gi | 10Gi | — |
| HLF Peer (per peer) | 0.5-1 core | 512Mi-2Gi | 20Gi | — |

**Minimum Cluster**: 8 cores, 32Gi RAM, 300Gi storage  
**Recommended Cluster**: 16 cores, 64Gi RAM, 500Gi storage + 1 GPU node

---

## 6. API Design

### 6.1 Core API Endpoints

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/v1/devices` | Register a new device | Audit Admin |
| GET | `/api/v1/devices` | List devices with filters | Analyst+ |
| POST | `/api/v1/configs/upload` | Upload device config file | Analyst+ |
| POST | `/api/v1/configs/connect` | Live config fetch via SSH/API | Audit Admin |
| GET | `/api/v1/configs/{device_id}/history` | Config version history | Analyst+ |
| POST | `/api/v1/audits` | Trigger new audit run | Audit Admin |
| GET | `/api/v1/audits/{id}` | Get audit results | Analyst+ |
| GET | `/api/v1/audits/{id}/findings` | List findings for audit | Analyst+ |
| GET | `/api/v1/compliance/score` | Enterprise compliance score | Viewer+ |
| GET | `/api/v1/compliance/{framework}` | Framework-specific report | Analyst+ |
| GET | `/api/v1/remediation/{finding_id}` | Get remediation steps | Analyst+ |
| POST | `/api/v1/blockchain/verify` | Verify audit integrity | Auditor+ |
| GET | `/api/v1/blockchain/chain` | Browse audit chain | Auditor+ |
| WS | `/ws/v1/dashboard` | Real-time dashboard updates | Analyst+ |

### 6.2 API Response Format

```json
{
  "status": "success",
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-28T05:00:00.000Z",
    "request_id": "req-abc-123",
    "pagination": {
      "page": 1,
      "per_page": 50,
      "total": 1234
    }
  }
}
```

---

## 7. Architectural Decision Records (ADRs)

### ADR-001: Canonical Config Schema vs. Per-Vendor Checking

**Decision**: Normalize all vendor configs into a canonical schema before compliance checking.

**Context**: We could either (a) write per-vendor compliance checks or (b) normalize first, then write vendor-agnostic checks.

**Rationale**: Option (b) reduces the compliance rule count from N×M (controls × vendors) to N (controls only). New vendors only require a parser plugin, not re-implementation of all compliance checks.

**Consequence**: Parser accuracy is critical — normalization errors propagate to all downstream checks.

---

### ADR-002: Hybrid AI (LLM + Deterministic) vs. Pure LLM

**Decision**: Use LLM for initial rule interpretation only; execute compliance checks with a deterministic rule engine.

**Context**: An LLM could theoretically perform end-to-end compliance assessment, but hallucination risk and latency are unacceptable for a security tool.

**Rationale**: LLM interprets human-language controls into structured rules (one-time, cached). Deterministic engine evaluates rules against configs (every audit, fast, reliable). Human review gate validates LLM-generated rules before production use.

**Consequence**: Two systems to maintain, but compliance results are reproducible and auditable.

---

### ADR-003: Hyperledger Fabric vs. Public Blockchain

**Decision**: Use Hyperledger Fabric (permissioned) for audit evidence.

**Context**: Public blockchains (Ethereum, etc.) offer decentralization but require gas fees, have latency, and expose data publicly.

**Rationale**: NTRO operates in a sovereign, potentially air-gapped context. Hyperledger Fabric is permissioned (no mining), enterprise-grade, and can run entirely on-premises. No data leaves the organizational boundary.

**Consequence**: No external consensus participation; the organization self-certifies the chain. Mitigated by multi-peer deployment and MSP-based identity management.

---

### ADR-004: PostgreSQL + TimescaleDB vs. Time-Series DB

**Decision**: Use PostgreSQL with TimescaleDB extension for both relational data and time-series audit history.

**Context**: Audit history is time-series data (compliance scores over time, config snapshots). A separate time-series DB (InfluxDB, etc.) adds operational overhead.

**Rationale**: TimescaleDB is a PostgreSQL extension — single database engine for both relational and time-series data. Reduces operational complexity while providing hypertable compression and efficient time-range queries.

**Consequence**: Scale ceiling is lower than purpose-built TSDB, but more than adequate for AEGIS volumes.

---

## 8. Scalability & Performance

### 8.1 Scaling Strategy

| Component | Scaling Approach | Trigger |
|---|---|---|
| API Gateway | Horizontal (HPA) | CPU > 70% or RPS > 500 |
| Config Service | Horizontal | Queue depth > 100 |
| Audit Service | Horizontal (HPA) | Active audits > 5 |
| AI/NLP Service | Vertical (GPU) | Inference queue > 10 |
| PostgreSQL | Vertical + read replicas | Connection count / query latency |
| Kafka | Partition rebalancing | Consumer lag > 1000 |

### 8.2 Performance Targets

| Operation | SLA | Approach |
|---|---|---|
| Config parse (single device) | < 500ms | Compiled parsers, cached regex |
| Full audit (100 devices, CIS) | < 60 seconds | Parallel evaluation, pre-cached rules |
| Dashboard load | < 2 seconds | Pre-aggregated metrics, CDN for static |
| Blockchain verification | < 5 seconds | Indexed block lookup |
| API response (p99) | < 200ms | Connection pooling, query optimization |

---

## 9. Monitoring & Observability

### 9.1 Observability Stack

```
┌───────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY STACK                          │
│                                                                 │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐  │
│  │  Prometheus    │    │  Grafana      │    │  FluentBit    │  │
│  │  (Metrics)     │───▶│  (Dashboards) │    │  (Logs)       │  │
│  │               │    │               │    │  → Loki       │  │
│  └───────────────┘    └───────────────┘    └───────────────┘  │
│                                                                 │
│  Key Dashboards:                                                │
│  • System Health (CPU, Memory, Disk)                            │
│  • API Performance (RPS, Latency, Error Rate)                   │
│  • Audit Pipeline (Throughput, Queue Depth, Duration)           │
│  • Blockchain (Block Rate, Chain Length, Verification)           │
│  • Security (Auth Events, Rate Limits, Anomalies)               │
└───────────────────────────────────────────────────────────────┘
```

### 9.2 Health Check Endpoints

| Endpoint | Checks | Interval |
|---|---|---|
| `/health/liveness` | Process alive | 10s |
| `/health/readiness` | DB connected, Kafka connected, Vault accessible | 30s |
| `/health/deep` | Full dependency check including blockchain peers | 60s |

---

> **Next Document**: [Design Document →](./design.md)
