# AEGIS-NTRO v2.0.0-RC1
## Sovereign AI-Driven Multi-Vendor Network Security Compliance Auditor
**Target: SIH26155 | Organization: NTRO | Theme: Blockchain & Cybersecurity**

---

## 1. Executive Summary

**AEGIS-NTRO** is a sovereign, 100% on-premise, citation-native network compliance auditing platform designed for high-security defense and national research infrastructures (NTRO). It ingests multi-vendor router and firewall configurations (**Cisco IOS/ASA, Palo Alto PAN-OS, Juniper JunOS, Fortinet FortiOS**), evaluates them against authoritative regulatory frameworks (**NIST SP 800-53 Rev 5, CIS Controls v8, ISO/IEC 27001:2022, PCI-DSS 4.0**), and delivers zero-hallucination, cited compliance audit findings with exact publication names, section numbers, and page numbers.

### Core Architectural Mandate: PostgreSQL is the ONLY Database
No external vector stores (ChromaDB, Pinecone, Qdrant), no external caching or message brokers (Redis, RabbitMQ, Kafka), and no document databases (MongoDB).
- **Dense Vector Search**: `pgvector` extension with HNSW indexing ($m=16, ef=64$) over BAAI/bge-m3 1024-dim embeddings.
- **Sparse Full-Text Search**: Native `tsvector` + GIN indexes with weighted rank execution.
- **Hybrid Fusion**: Reciprocal Rank Fusion (RRF with $k=60$) combined with cross-encoder re-ranking.
- **Async Job Queue**: PostgreSQL row-level locking via `SELECT ... FOR UPDATE SKIP LOCKED`.
- **Structured Documents**: Flexible JSONB storage with indexable schemas.

---

## 2. System Architecture

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         LAYER 5: PRESENTATION                            │
│  React 18.3 + Vite + Tailwind CSS + Lucide Icons                         │
│  Dark Obsidian Theme (#0A0E17) + Indigo (#6366F1) + Cyan (#06B6D4)       │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────────┐
│                      LAYER 4: API GATEWAY                                │
│  FastAPI (Python 3.11, async, Pydantic v2)                               │
│  - /api/v1/compliance/audit, /api/v1/compliance/query                    │
│  - /api/v1/devices/upload, /api/v1/frameworks/search                     │
│  JWT Auth & RBAC, SlowAPI Rate Limiting, OWASP LLM Prompt Guards        │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────────┐
│                    LAYER 3: AI REASONING ENGINE                          │
│  llama.cpp (Mistral 7B Instruct v0.3 Q4_K_M) + GBNF Schema Enforcement   │
│  Citation-native reasoning with deterministic sovereign fallback mode    │
└──────────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────────┐
│                   LAYER 2: RAG RETRIEVAL ENGINE                          │
│  PostgreSQL 16 + pgvector (Cosine) + tsvector (BM25) + RRF + Cross-Encoder│
└──────────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────────┐
│                   LAYER 1: MULTI-VENDOR INGESTION                        │
│  Cisco IOS/ASA, PAN-OS XML, JunOS Set Syntax, FortiOS Show Parsers       │
│  PostgreSQL FOR UPDATE SKIP LOCKED Worker Queue                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Quick Start (Production Docker Deployment)

### 3.1 Run via Docker Compose
```bash
# 1. Clone & enter repository
git clone https://github.com/naveencmy/AEGIS.git
cd AEGIS_V0.1

# 2. Copy environment template
cp .env.example .env

# 3. Launch all services (PostgreSQL + pgvector, Backend, Frontend)
docker-compose up -d --build
```
- **Web UI**: [http://localhost:3000](http://localhost:3000)
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **PostgreSQL**: `localhost:5432` (`aegis` / `aegis_ntro`)

---

## 4. Local Development Setup

### 4.1 Backend (Python 3.11)
```bash
# Install Poetry & dependencies
poetry install

# Run database migrations
poetry run alembic upgrade head

# Start FastAPI dev server
poetry run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4.2 Frontend (Node 20+)
```bash
cd frontend
npm install
npm run dev
```

---

## 5. Demonstration Scenarios (SIH26155 Pre-Cached Demo)

### Scenario 1: Cisco ASA Edge Firewall vs NIST 800-53 Rev 5
1. Go to the **Compliance Audit** tab in the UI.
2. Click **"Load Cisco ASA Sample"**.
3. Select **NIST SP 800-53 Rev 5** and click **Execute Sovereign Compliance Audit**.
4. **Result**: Identifies critical violation `access-list OUTSIDE_IN extended permit ip any any` with citation:
   - **Control ID**: `AC-4` (Information Flow Enforcement)
   - **Citation**: `NIST SP 800-53 Rev 5, Page 47`
   - **Remediation**: Actionable ACL tightening steps.

### Scenario 2: Ad-Hoc Natural Language Regulatory Query
1. Open the **RAG Assistant** tab.
2. Ask: *"What does NIST SC-7 require for boundary protection and default deny?"*
3. **Result**: Delivers cited answer referencing NIST SP 800-53 Rev 5 Control SC-7 with live clickable citation badges and source page numbers.

### Scenario 3: Multi-Framework Audit (Palo Alto vs CIS v8 + ISO 27001)
1. In the **Compliance Audit** tab, click **"Load Palo Alto Sample"**.
2. Check **CIS Controls v8** and **ISO/IEC 27001:2022**.
3. Click **Execute Sovereign Compliance Audit**.
4. **Result**: Generates unified findings highlighting `ALLOW_ALL_INBOUND` with dual citations for CIS Control 4.1 / 4.2 and ISO 27001:2022 Control A.8.20.

---

## 6. Security & Guardrails

- **Zero Data Exfiltration**: Runs 100% locally on sovereign air-gapped infrastructure.
- **OWASP LLM Top 10 Guards**: Blocks prompt injections, jailbreaks (`DAN`, `ignore previous instructions`), and malicious delimiters (`<<|`, `[INST]`).
- **Hallucination Prevention**: All LLM generated control IDs are validated against ground truth PostgreSQL database records before presentation.
- **RBAC**: Multi-role token security (`admin`, `auditor`, `viewer`).

---

## 7. Project Structure

```text
AEGIS_V0.1/
├── .github/workflows/ci.yml       # CI Pipeline
├── alembic/                       # Async DB migrations
│   ├── versions/0001_initial_schema.py
│   └── env.py
├── backend/
│   ├── main.py                    # FastAPI app factory
│   ├── config.py                  # Pydantic settings
│   ├── core/                      # Security, logging, exceptions
│   ├── models/                    # SQLAlchemy 2.0 async + pgvector models
│   ├── parsers/                   # Cisco, Palo Alto, Juniper, Fortinet parsers
│   ├── prompts/                   # Citation prompts & GBNF grammar
│   ├── routers/                   # Audit, Devices, Frameworks, Health APIs
│   ├── schemas/                   # Pydantic v2 schemas
│   ├── services/                  # RAG, LLM, Parsers, Queue, Audit services
│   ├── utils/                     # Prompt injection guards & sanitizers
│   └── tests/                     # Pytest suite
├── frontend/
│   ├── src/
│   │   ├── components/            # AuditUpload, AuditQuery, ComplianceReport, FindingTable, CitationCard, Layout
│   │   ├── hooks/                 # useAudit, useFrameworks
│   │   ├── lib/                   # API client & utils
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js         # Obsidian + Indigo theme
│   └── vite.config.js
├── data/
│   ├── frameworks/                # NIST, CIS, ISO datasets
│   └── samples/                   # Sample configs
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── nginx.conf
│   └── init-scripts/01-init-extensions.sql
├── docker-compose.yml
├── pyproject.toml
└── README.md
```

---
**NTRO SIH26155 &bull; AEGIS-NTRO Sovereign Cybersecurity Engineering Team**
# AEGIS_V0.0.2
