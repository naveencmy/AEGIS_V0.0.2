"""
AEGIS-NTRO — Sovereign Mock Responses for Demo / Fallback Mode.
Pre-cached, citation-rich network compliance responses for offline / air-gapped demo stability.
Covers Cisco IOS/ASA, Palo Alto PAN-OS, Fortinet FortiOS, Juniper JunOS vs
NIST SP 800-53 Rev 5, CIS Controls v8, ISO 27001:2022, and PCI-DSS v4.0.
"""

from typing import Any, Optional

DEMO_RESPONSES: dict[str, dict[str, Any]] = {
    # ── Demo Query 1: Unrestricted ACLs & Boundary Protection ────────────
    "What are the mandatory requirements for boundary protection and default-deny under NIST SC-7?": {
        "answer": (
            "Under **NIST SP 800-53 Rev. 5 Control SC-7 (Boundary Protection)**, the information system must "
            "monitor and control communications at external boundary and key internal boundaries. "
            "Specifically, **SC-7(5) (Deny by Default / Allow by Exception)** mandates that network security appliances "
            "deny network communications traffic by default and allow traffic only by explicit exception "
            "[NIST SP 800-53 Rev. 5, Control SC-7(5), p.312].\n\n"
            "Key architectural mandates include:\n"
            "1. **Default-Deny Posture**: All ingress and egress traffic at network boundaries must terminate on a default "
            "implicit or explicit deny rule (`deny ip any any log`). Overly permissive rules such as `permit ip any any` "
            "strictly violate SC-7(5) and AC-4 [NIST SP 800-53 Rev. 5, Control AC-4, p.47].\n"
            "2. **Demarcation of Managed Interfaces**: Managed interfaces connecting to untrusted networks must route traffic "
            "through dedicated security gateways or stateful inspection filters with cryptographic isolation [NIST SP 800-53 Rev. 5, Control SC-7(7), p.314].\n"
            "3. **Stateful Inspection & Flow Enforcement**: Inter-zone routing between trust tiers (e.g., DMZ to Internal LAN) "
            "must enforce unidirectional state synchronization and validate layer-4 to layer-7 protocol compliance."
        ),
        "citations": [
            {
                "source_title": "NIST SP 800-53 Rev. 5",
                "section": "SC-7 (Boundary Protection)",
                "page": "312",
                "authority": "NIST",
                "regime": "Federal / Defense",
                "relevance_score": 0.98,
                "chunk_id": "nist-sc-7",
                "full_text": "Control SC-7(5): The information system denies network communications traffic by default and allows network communications traffic by exception for designated boundaries."
            },
            {
                "source_title": "NIST SP 800-53 Rev. 5",
                "section": "AC-4 (Information Flow Enforcement)",
                "page": "47",
                "authority": "NIST",
                "regime": "Federal / Defense",
                "relevance_score": 0.94,
                "chunk_id": "nist-ac-4",
                "full_text": "Control AC-4: The information system enforces approved authorizations for controlling the flow of information within the system and between connected systems."
            },
            {
                "source_title": "CIS Controls v8",
                "section": "Control 4.4 (Firewall Architecture)",
                "page": "28",
                "authority": "Center for Internet Security",
                "regime": "Industry Standard",
                "relevance_score": 0.90,
                "chunk_id": "cis-4-4",
                "full_text": "Safeguard 4.4: Enforce automatic default-deny access control policies at all enterprise network ingress and egress points."
            }
        ],
        "regime_tags": ["NIST_800_53_R5", "CIS_v8"],
        "confidence": "high",
        "language_detected": "en"
    },

    # ── Demo Query 2: Remote Access & Insecure Protocols ─────────────────
    "Why is Telnet prohibited and what are the SSH requirements under CIS Controls and NIST AC-17?": {
        "answer": (
            "Cleartext management protocols such as **Telnet (TCP port 23)** and **HTTP (TCP port 80)** transmit administrative "
            "credentials and configuration payloads in unencrypted plaintext, exposing sessions to eavesdropping, replay, and "
            "man-in-the-middle (MITM) credential harvesting [NIST SP 800-53 Rev. 5, Control IA-5, p.142].\n\n"
            "Under **CIS Controls v8 Safeguard 4.1** and **NIST SP 800-53 Control AC-17 (Remote Access)**:\n"
            "1. **Prohibit Insecure Management**: Cleartext protocols must be disabled globally across all administrative "
            "interfaces (`no telnet server`, `transport input ssh`, or `set admin-telnet disable`) [CIS Controls v8, Control 4.1, p.26].\n"
            "2. **Enforce SSHv2 with Strong Ciphers**: Remote interactive sessions must strictly require **SSH Version 2** "
            "using FIPS 140-3 validated cryptographic ciphers (AES-GCM, ChaCha20-Poly1305) and SHA-2/SHA-3 hashing [NIST SP 800-53 Rev. 5, Control SC-13, p.328].\n"
            "3. **Access Control Lists on VTY Lines**: Interactive management must be constrained to designated bastion / jump "
            "hosts via source-filtered access lists [CIS Cisco IOS Benchmark v4.0, Section 1.2.2, p.18]."
        ),
        "citations": [
            {
                "source_title": "CIS Controls v8",
                "section": "Safeguard 4.1 (Secure Network Infrastructure)",
                "page": "26",
                "authority": "CIS",
                "regime": "Industry Standard",
                "relevance_score": 0.96,
                "chunk_id": "cis-4-1",
                "full_text": "Safeguard 4.1: Ensure network infrastructure devices are administered using secure, encrypted protocols (SSHv2, HTTPS, TLS 1.3) with cleartext management strictly disabled."
            },
            {
                "source_title": "NIST SP 800-53 Rev. 5",
                "section": "AC-17 (Remote Access)",
                "page": "82",
                "authority": "NIST",
                "regime": "Federal / Defense",
                "relevance_score": 0.93,
                "chunk_id": "nist-ac-17",
                "full_text": "Control AC-17(2): The information system enforces cryptographic protection for remote access sessions using strong encryption mechanisms."
            },
            {
                "source_title": "PCI-DSS v4.0",
                "section": "Requirement 2.2.7",
                "page": "64",
                "authority": "PCI SSC",
                "regime": "Payment Card Industry",
                "relevance_score": 0.89,
                "chunk_id": "pci-2-2-7",
                "full_text": "Requirement 2.2.7: All non-console administrative access must be encrypted using strong cryptography."
            }
        ],
        "regime_tags": ["CIS_v8", "NIST_800_53_R5", "PCI_DSS_4.0"],
        "confidence": "high",
        "language_detected": "en"
    },

    # ── Demo Query 3: SNMP Hardening & Credentials ──────────────────────
    "What are the compliance requirements for SNMP community strings and SNMPv3?": {
        "answer": (
            "SNMP versions 1 and 2c communicate community strings in cleartext and lack cryptographic message authentication. "
            "Using default community strings such as `public` or `private` allows unauthenticated adversaries to extract device routing "
            "tables, interface IP schemes, and cryptographic parameters [NIST SP 800-53 Rev. 5, Control IA-5, p.145].\n\n"
            "Under **NIST SP 800-53 Control SC-8** and **CIS Benchmarks**:\n"
            "1. **Eliminate SNMPv1/v2c**: Legacy SNMP daemons must be removed from production infrastructure.\n"
            "2. **Mandate SNMPv3 with authPriv**: SNMPv3 must be configured with both authentication (SHA-256 or SHA-512) and "
            "privacy encryption (AES-128 or AES-256) [CIS Cisco IOS Benchmark, Section 2.4.1, p.38].\n"
            "3. **Remove Default Communities**: Any occurrence of `snmp-server community public` or `private` must be deleted "
            "immediately as a CRITICAL severity finding [PCI-DSS v4.0, Requirement 2.1, p.58]."
        ),
        "citations": [
            {
                "source_title": "NIST SP 800-53 Rev. 5",
                "section": "SC-8 (Transmission Confidentiality and Integrity)",
                "page": "315",
                "authority": "NIST",
                "regime": "Federal / Defense",
                "relevance_score": 0.95,
                "chunk_id": "nist-sc-8",
                "full_text": "Control SC-8: Protect the integrity and confidentiality of transmitted administrative and telemetry information."
            },
            {
                "source_title": "PCI-DSS v4.0",
                "section": "Requirement 2.1",
                "page": "58",
                "authority": "PCI SSC",
                "regime": "Payment Card Industry",
                "relevance_score": 0.92,
                "chunk_id": "pci-2-1",
                "full_text": "Requirement 2.1: Always change vendor-supplied defaults and remove or disable unnecessary default accounts, passwords, and SNMP community strings."
            }
        ],
        "regime_tags": ["NIST_800_53_R5", "PCI_DSS_4.0", "CIS_v8"],
        "confidence": "high",
        "language_detected": "en"
    }
}


def get_mock_response(query: str) -> Optional[dict[str, Any]]:
    """Retrieve pre-cached mock response if query matches closely, or return generic sovereign answer."""
    query_clean = query.strip().lower()

    # Exact or substring match
    for key, data in DEMO_RESPONSES.items():
        if key.lower() in query_clean or query_clean in key.lower():
            return data

    # Keyword based matching
    if any(k in query_clean for k in ["sc-7", "boundary", "default-deny", "wildcard", "permit ip any any", "firewall"]):
        return DEMO_RESPONSES["What are the mandatory requirements for boundary protection and default-deny under NIST SC-7?"]

    if any(k in query_clean for k in ["telnet", "ssh", "ac-17", "cleartext", "remote access"]):
        return DEMO_RESPONSES["Why is Telnet prohibited and what are the SSH requirements under CIS Controls and NIST AC-17?"]

    if any(k in query_clean for k in ["snmp", "community", "public", "private", "snmpv3"]):
        return DEMO_RESPONSES["What are the compliance requirements for SNMP community strings and SNMPv3?"]

    # Generic sovereign compliance fallback
    return {
        "answer": (
            f"Regarding your query on **network security compliance**: In accordance with **NIST SP 800-53 Rev. 5** "
            "and **CIS Controls v8**, all multi-vendor routing, switching, and firewall appliances must maintain "
            "hardened baseline configurations. Administrative access must be cryptographically protected (SSHv2, TLS 1.3), "
            "perimeter boundaries must enforce default-deny policies, and audit logging must be enabled to centralized SIEM servers "
            "[NIST SP 800-53 Rev. 5, Control AC-4, p.47; Control SC-7, p.312]."
        ),
        "citations": [
            {
                "source_title": "NIST SP 800-53 Rev. 5",
                "section": "AC-4 (Information Flow Enforcement)",
                "page": "47",
                "authority": "NIST",
                "regime": "Federal / Defense",
                "relevance_score": 0.90,
                "chunk_id": "nist-ac-4-gen",
                "full_text": "Control AC-4: Enforce approved authorizations for controlling the flow of information across network interfaces."
            }
        ],
        "regime_tags": ["NIST_800_53_R5", "CIS_v8"],
        "confidence": "medium",
        "language_detected": "en"
    }
