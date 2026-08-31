# Security Policy

The AEGIS Engineering and Security Team takes the security of AEGIS-NTRO seriously. As an air-gapped sovereign compliance auditor and cyber defense platform, robust defense-in-depth and zero-trust engineering are top priorities.

---

## Supported Versions

Only the latest active major/minor release receives security patches and vulnerability mitigations:

| Version | Supported          | Security Maintenance |
| ------- | ------------------ | -------------------- |
| 2.0.x   | :white_check_mark: | Full Active Support  |
| 1.x.x   | :x:                | End of Life (EOL)    |

---

## Reporting a Vulnerability

**Please DO NOT report security vulnerabilities through public GitHub issues or discussions.**

If you believe you have found a security vulnerability in AEGIS-NTRO (including prompt injection bypasses, authentication flaws, parser RCEs, or database injection vulnerabilities), please report it via one of the following channels:

1. **GitHub Security Advisory (Preferred)**: Navigate to the repository's **Security** tab and click **"Report a vulnerability"**.
2. **Encrypted Email**: Send details to `security@aegis-ntro.local` with the subject tag `[SECURITY VULNERABILITY] AEGIS-NTRO`.

### What to Include in Your Report

To help us triage and resolve the issue quickly, please provide:
- **Type of Vulnerability** (e.g., Prompt Injection, OWASP LLM01, SQLi, Auth Bypass, Parser Memory Leak)
- **Component Affected** (e.g., Cisco Parser, RAG Fusion Engine, JWT Auth, GBNF Grammar)
- **Step-by-step reproduction steps** or Proof of Concept (PoC) script/payload
- **Potential impact and severity assessment** (CVSS score if calculated)
- **Suggested remediation** (if known)

---

## Response Timeline & SLA

- **Initial Acknowledgment**: Within **24 hours**
- **Triage & Reproduction**: Within **48 hours**
- **Remediation & Patch Release**: Within **7 to 14 business days** depending on severity
- **Public Disclosure**: Coordinated disclosure after release of the fix and validation by the reporter

---

## Security Architectural Guarantees

AEGIS-NTRO is engineered with sovereign zero-trust invariants:
- **100% On-Premise Execution**: No outbound telemetry or external cloud LLM API calls.
- **OWASP LLM Top 10 Defenses**: Pre-flight regex and token sanitizers blocking jailbreak signatures (`DAN`, `ignore previous instructions`, `<<SYS>>`, `[INST]`).
- **PostgreSQL Row-Level Locking**: Concurrency safety without external Redis/MQ brokers.
- **Strict Role-Based Access Control (RBAC)**: Fine-grained token permissions (`admin`, `auditor`, `viewer`).
