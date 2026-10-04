# AEGIS — Security Design Document

> **Document ID**: AEGIS-SEC-001  
> **Version**: 1.0  
> **Classification**: INTERNAL — NTRO Challenge Submission  
> **Last Updated**: 2026-09-28  
> **Predecessor**: [Solution Design](./solution.md)  

---

## 1. Security Design Philosophy

AEGIS is a **security tool auditing security**. Its own security posture must be **beyond reproach**. Any vulnerability in AEGIS itself would undermine trust in every audit it produces.

### 1.1 Security Principles

| # | Principle | Application in AEGIS |
|---|---|---|
| 1 | **Defense in Depth** | Multiple security layers — no single point of failure |
| 2 | **Least Privilege** | Every component runs with minimum required permissions |
| 3 | **Zero Trust** | All internal service communication is authenticated and encrypted |
| 4 | **Data Sovereignty** | No data leaves the sovereign perimeter — on-premises everything |
| 5 | **Immutable Audit Trail** | Blockchain-anchored evidence cannot be altered post-creation |
| 6 | **Separation of Duties** | Audit execution, review, and approval are separate roles |
| 7 | **Secure by Default** | All configuration defaults are hardened |

---

## 2. Threat Model (STRIDE Analysis)

### 2.1 System Boundary

```
┌───────────────────────────────────────────────────────────────────┐
│                        TRUST BOUNDARY                              │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    │
│  │ Dashboard│    │ API GW   │    │ Core     │    │ Blockchain│    │
│  │ (User)   │───▶│ (FastAPI)│───▶│ Engine   │───▶│ Ledger   │    │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    │
│       │                │               │               │          │
│       │                │               │               │          │
│  ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐  │
│  │ Auth     │    │ Rate     │    │ Credential│    │ Consensus│   │
│  │ (OIDC/   │    │ Limiter  │    │ Vault    │    │ Layer    │   │
│  │  SAML)   │    │          │    │ (Vault)  │    │          │   │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘   │
│                                                                     │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ EXTERNAL BOUNDARY ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                                     │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                     │
│  │ Network  │    │ SIEM     │    │ CVE      │                     │
│  │ Devices  │    │ Systems  │    │ Feeds    │                     │
│  │ (SSH/API)│    │          │    │ (NVD)    │                     │
│  └──────────┘    └──────────┘    └──────────┘                     │
└───────────────────────────────────────────────────────────────────┘
```

### 2.2 STRIDE Threat Matrix

| STRIDE Category | Threat | Asset at Risk | Severity | Mitigation |
|---|---|---|---|---|
| **Spoofing** | Attacker impersonates AEGIS to extract device configs | Device credentials | Critical | mTLS between AEGIS and devices; certificate pinning |
| **Spoofing** | Attacker impersonates admin user | Dashboard access | Critical | OIDC/SAML SSO + MFA enforcement |
| **Tampering** | Modification of audit results post-generation | Audit evidence | Critical | Blockchain anchoring; hash chain verification |
| **Tampering** | Modification of compliance rules | Rule database | High | Rule version control + digital signatures |
| **Tampering** | Config manipulation during transit | Device configs | High | TLS 1.3 for all transport; config hash verification |
| **Repudiation** | Admin denies modifying audit rules | Rule change history | High | Signed audit logs; blockchain evidence |
| **Repudiation** | User claims audit was never run | Audit execution | Medium | Blockchain-anchored execution records |
| **Info Disclosure** | Device configs leaked | Running configurations | Critical | Encryption at rest (AES-256); field-level encryption for secrets |
| **Info Disclosure** | Credential vault compromised | Device credentials | Critical | HSM-backed Vault; transit encryption; auto-rotation |
| **Info Disclosure** | LLM model extracts config patterns | Configuration patterns | Medium | On-prem inference; model isolation; no telemetry |
| **Denial of Service** | Audit pipeline overwhelmed | System availability | Medium | Rate limiting; queue-based processing; circuit breakers |
| **Denial of Service** | Blockchain consensus stalled | Audit evidence chain | Medium | Async anchoring; evidence buffering |
| **Elevation of Privilege** | Compromised service escalates to Vault | All credentials | Critical | Network segmentation; mTLS; AppRole per-service |

---

## 3. Authentication & Authorization

### 3.1 User Authentication

```
┌──────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                         │
│                                                                │
│  User ──▶ OIDC Provider (Keycloak / AD FS) ──▶ AEGIS API     │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Authentication Requirements:                          │   │
│  │  • SSO via OIDC 2.0 or SAML 2.0                      │   │
│  │  • MFA enforced for all admin roles                   │   │
│  │  • JWT tokens with 15-minute expiry                   │   │
│  │  • Refresh token rotation (24-hour max)               │   │
│  │  • Session binding to client IP + User-Agent          │   │
│  │  • Failed login lockout (5 attempts → 30-min lock)    │   │
│  └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Role-Based Access Control (RBAC)

| Role | Permissions | Scope |
|---|---|---|
| **System Admin** | Full system configuration, user management | Global |
| **Audit Admin** | Create/schedule audits, manage rules, review results | Org-unit scoped |
| **Security Analyst** | Run audits, view results, generate reports | Device-group scoped |
| **Viewer** | View dashboards and reports (read-only) | Assigned views only |
| **Auditor (External)** | Verify blockchain evidence, view specific audit reports | Audit-ID scoped |
| **API Service Account** | Programmatic access to specific API endpoints | Endpoint-scoped |

### 3.3 Service-to-Service Authentication

| Communication Path | Auth Method |
|---|---|
| API → Core Engine | mTLS (mutual TLS certificates) |
| Core Engine → Database | TLS + username/password (from Vault) |
| Core Engine → Vault | AppRole authentication |
| Core Engine → Blockchain | mTLS + enrollment certificate |
| Core Engine → Kafka | SASL/SCRAM + TLS |
| Connectors → Devices | Per-device credentials (from Vault) |

---

## 4. Data Security

### 4.1 Data Classification

| Classification | Examples | Storage | Access | Retention |
|---|---|---|---|---|
| **Top Secret** | Device credentials, SSH keys | Vault (HSM-backed) | System accounts only | Auto-rotated, no history |
| **Confidential** | Device configs, audit findings | PostgreSQL (encrypted at rest) | Role-based | 7 years (compliance) |
| **Internal** | Compliance rules, remediation guides | MongoDB | Authenticated users | Indefinite |
| **Public** | CIS benchmark metadata, NVD CVE data | Any | Any | Indefinite |

### 4.2 Encryption

| Layer | Standard | Implementation |
|---|---|---|
| **In Transit** | TLS 1.3 | All API, inter-service, and device communication |
| **At Rest** | AES-256-GCM | PostgreSQL TDE, filesystem encryption |
| **Field-Level** | AES-256 + envelope encryption | Passwords, secrets, and sensitive config fields |
| **Blockchain** | SHA-256 hash chains | Audit evidence integrity |
| **Backup** | AES-256 | All backup media encrypted |

### 4.3 Secrets Management

```
┌──────────────────────────────────────────────────────────────┐
│                    SECRETS LIFECYCLE                           │
│                                                                │
│  Creation ──▶ Storage ──▶ Access ──▶ Rotation ──▶ Revocation │
│                                                                │
│  • Generated    • HashiCorp   • AppRole     • Automatic    • Immediate   │
│    by Vault       Vault         per-service   (30-day        revocation   │
│  • Never in     • HSM-backed  • Audit logged  default)     • CRL update  │
│    plain text   • Sealed at   • Lease-based • Zero-         • Audit log   │
│  • Never in       rest                        downtime                    │
│    code/config                                                            │
└──────────────────────────────────────────────────────────────┘
```

### 4.4 Device Configuration Handling

> **Critical**: Device configurations contain the most sensitive data in the system — firewall rules, ACL definitions, credential references, network topology information.

| Security Control | Implementation |
|---|---|
| **Never store raw credentials from configs** | Redact before storage; hash for diff |
| **Configuration isolation** | Each device config stored in separate encrypted partition |
| **Temporary processing** | Configs held in memory during parsing; never written to temp files |
| **Audit trail** | Every config access logged with user, timestamp, and purpose |
| **Data minimization** | Store only canonical schema + hash of raw config; raw config purged after parsing |

---

## 5. Network Security

### 5.1 Network Segmentation

```
┌─────────────────────────────────────────────────────────────────┐
│                     NETWORK ARCHITECTURE                         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  DMZ (User Access Zone)                                  │    │
│  │  ┌──────────────┐  ┌──────────────┐                     │    │
│  │  │  WAF /        │  │  Load        │                     │    │
│  │  │  Reverse Proxy│──│  Balancer    │                     │    │
│  │  └──────────────┘  └──────┬───────┘                     │    │
│  └───────────────────────────┼─────────────────────────────┘    │
│                               │ (TLS 1.3 only)                   │
│  ┌───────────────────────────┼─────────────────────────────┐    │
│  │  Application Zone         │                              │    │
│  │  ┌──────────────┐  ┌─────▼────────┐                     │    │
│  │  │  Dashboard   │  │  API Gateway │                     │    │
│  │  │  (Static)    │  │  (FastAPI)   │                     │    │
│  │  └──────────────┘  └──────┬───────┘                     │    │
│  └───────────────────────────┼─────────────────────────────┘    │
│                               │ (mTLS)                           │
│  ┌───────────────────────────┼─────────────────────────────┐    │
│  │  Processing Zone          │                              │    │
│  │  ┌──────────────┐  ┌─────▼────────┐  ┌──────────────┐  │    │
│  │  │  AI/NLP      │  │  Core Engine │  │  Kafka       │  │    │
│  │  │  Engine      │  │              │  │  Cluster     │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                               │ (mTLS)                           │
│  ┌───────────────────────────┼─────────────────────────────┐    │
│  │  Data Zone                │                              │    │
│  │  ┌──────────────┐  ┌─────▼────────┐  ┌──────────────┐  │    │
│  │  │  PostgreSQL  │  │  MongoDB     │  │  Vault       │  │    │
│  │  │  + Timescale │  │              │  │  (HSM)       │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Blockchain Zone (Isolated)                              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │  Peer Node 1 │  │  Peer Node 2 │  │  Orderer     │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Device Access Zone (Highly Restricted)                  │    │
│  │  ┌──────────────┐                                        │    │
│  │  │  Connector   │ ── SSH/NETCONF/API ──▶ Network Devices│    │
│  │  │  Service     │                                        │    │
│  │  └──────────────┘                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Firewall Rules (Inter-Zone)

| Source Zone | Destination Zone | Protocol | Port | Action |
|---|---|---|---|---|
| DMZ | Application | HTTPS | 443 | ALLOW |
| Application | Processing | gRPC/mTLS | 50051 | ALLOW |
| Processing | Data | PostgreSQL/TLS | 5432 | ALLOW |
| Processing | Data | MongoDB/TLS | 27017 | ALLOW |
| Processing | Blockchain | gRPC/mTLS | 7051 | ALLOW |
| Processing | Device Access | Internal | 8443 | ALLOW |
| Device Access | External Devices | SSH | 22 | ALLOW |
| Device Access | External Devices | NETCONF | 830 | ALLOW |
| ALL | ALL | ANY | ANY | **DENY** (default) |

---

## 6. Application Security

### 6.1 OWASP Top 10 Mitigations

| OWASP Risk | AEGIS Mitigation |
|---|---|
| **A01: Broken Access Control** | RBAC with scope isolation; JWT validation; resource-level authorization |
| **A02: Cryptographic Failures** | TLS 1.3 everywhere; AES-256 at rest; no custom crypto |
| **A03: Injection** | Parameterized queries; input validation; ORM-only DB access |
| **A04: Insecure Design** | Threat modeling (this document); security architecture review |
| **A05: Security Misconfiguration** | Hardened defaults; security headers; CSP; CIS-benchmarked containers |
| **A06: Vulnerable Components** | Dependabot; SCA scanning; SBOM generation; pinned versions |
| **A07: Auth Failures** | MFA; token rotation; session management; lockout policies |
| **A08: Data Integrity Failures** | Blockchain evidence chain; signed artifacts; CI/CD pipeline signing |
| **A09: Logging Failures** | Structured logging; audit trail; SIEM integration; log integrity |
| **A10: SSRF** | Network segmentation; egress filtering; URL validation |

### 6.2 API Security

| Control | Implementation |
|---|---|
| **Rate Limiting** | 100 req/min per user; 1000 req/min per service account |
| **Input Validation** | Pydantic models for all request bodies; regex on path params |
| **Output Filtering** | Response schema enforcement; no sensitive data in error messages |
| **CORS** | Whitelist-only origins; no wildcard |
| **Security Headers** | CSP, HSTS, X-Frame-Options, X-Content-Type-Options |
| **API Versioning** | `/api/v1/` prefix; deprecation policy |

### 6.3 LLM Security

| Threat | Mitigation |
|---|---|
| **Prompt Injection** | Input sanitization; system/user prompt separation; output validation |
| **Data Exfiltration via Model** | On-premises inference; no external API calls; air-gap compatible |
| **Model Tampering** | Hash verification of model weights; signed model packages |
| **Hallucinated Rules** | Human-in-the-loop review; deterministic fallback; confidence scoring |
| **Inference DoS** | Request queuing; timeout limits; GPU resource quotas |

---

## 7. Compliance (Self-Compliance)

AEGIS itself must comply with the frameworks it audits:

| Framework | Relevant Controls | AEGIS Compliance |
|---|---|---|
| **NIST SP 800-53** | AC (Access Control), AU (Audit), IA (Identification), SC (System/Communication) | Implemented via RBAC, audit logs, mTLS, encryption |
| **ISO 27001** | A.9 (Access), A.10 (Cryptography), A.12 (Operations), A.14 (Development) | Implemented via Vault, TLS, monitoring, SDLC |
| **CIS Docker Benchmark** | Container hardening | Non-root containers, read-only filesystems, resource limits |
| **CIS Kubernetes Benchmark** | Cluster hardening | RBAC, network policies, pod security standards |

---

## 8. Incident Response

### 8.1 Security Incident Classification

| Level | Examples | Response Time | Notification |
|---|---|---|---|
| **P1 — Critical** | Credential vault compromise, data breach, blockchain tamper | 15 minutes | CISO + Security Team + NTRO |
| **P2 — High** | Unauthorized access attempt, API exploit, DoS attack | 1 hour | Security Team |
| **P3 — Medium** | Failed auth attempts (excessive), config parse errors | 4 hours | Security Analyst |
| **P4 — Low** | Informational: dependency vulnerability, patch available | 24 hours | Development Team |

### 8.2 Response Procedures

```
Detection ──▶ Triage ──▶ Containment ──▶ Eradication ──▶ Recovery ──▶ Post-Mortem
    │            │            │               │              │             │
    │   Classify │   Isolate  │   Root cause  │   Restore    │   Lessons   │
    │   severity │   affected │   analysis    │   from known │   learned   │
    │            │   systems  │               │   good state │   + improve │
```

---

## 9. Security Testing Requirements

| Test Type | Frequency | Tool/Method | Coverage |
|---|---|---|---|
| **SAST** | Every PR | Semgrep, Bandit (Python) | All application code |
| **DAST** | Weekly | OWASP ZAP | All API endpoints |
| **Dependency Scan** | Daily | Dependabot, Snyk | All dependencies |
| **Container Scan** | Every build | Trivy | All Docker images |
| **Penetration Test** | Quarterly | Manual + automated | Full application |
| **Blockchain Integrity** | Continuous | Automated hash verification | Entire audit chain |
| **Secrets Scan** | Every commit | git-secrets, TruffleHog | All repositories |

---

## 10. Security Monitoring & Logging

### 10.1 Security Events to Monitor

| Event | Log Level | Alert | Retention |
|---|---|---|---|
| Authentication success/failure | INFO/WARN | On failure pattern | 1 year |
| Authorization denial | WARN | Immediate | 1 year |
| Config access (read/write) | INFO | On bulk access | 7 years |
| Audit execution | INFO | On failure | 7 years |
| Blockchain submission | INFO | On failure | Indefinite |
| Rule modification | WARN | Always | 7 years |
| Vault access | INFO | On anomaly | 1 year |
| API rate limit trigger | WARN | On sustained | 90 days |

### 10.2 Log Format (Structured)

```json
{
  "timestamp": "2026-09-28T05:00:00.000Z",
  "level": "WARN",
  "service": "aegis-api",
  "event": "auth.failure",
  "user_id": "user@org.gov.in",
  "source_ip": "10.0.1.50",
  "user_agent": "Mozilla/5.0...",
  "details": {
    "reason": "invalid_mfa_code",
    "attempt_count": 3
  },
  "correlation_id": "req-abc-123",
  "trace_id": "trace-xyz-789"
}
```

---

> **Next Document**: [Architecture Document →](./architecture.md)
