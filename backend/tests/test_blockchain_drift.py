"""Unit tests for Cryptographic Blockchain Evidence Service and Configuration Drift Engine."""

import pytest
from backend.services.blockchain_service import compute_merkle_root, sha256_hash
from backend.services.drift_service import drift_service


def test_sha256_and_merkle_root():
    h1 = sha256_hash("FINDING_001_PERMIT_ALL")
    h2 = sha256_hash("FINDING_002_TELNET_ENABLED")
    h3 = sha256_hash("FINDING_003_DEFAULT_SNMP")

    # Deterministic Merkle Root
    merkle_1 = compute_merkle_root([h1, h2, h3])
    merkle_2 = compute_merkle_root([h1, h2, h3])

    assert len(merkle_1) == 64
    assert merkle_1 == merkle_2

    # Tampering one leaf modifies the root
    h1_tampered = sha256_hash("FINDING_001_TAMPERED")
    merkle_tampered = compute_merkle_root([h1_tampered, h2, h3])
    assert merkle_tampered != merkle_1


def test_drift_service_security_classification():
    baseline = """
hostname CORE-01
service password-encryption
line vty 0 15
 transport input ssh
access-list IN extended deny ip any any log
"""
    drifted = """
hostname CORE-01
no service password-encryption
telnet 0.0.0.0 0.0.0.0 outside
snmp-server community public RO
line vty 0 15
 transport input telnet ssh
access-list IN extended permit ip any any
"""
    report = drift_service.analyze_drift("cisco_ios", baseline, drifted, "CORE-01")

    assert report.drift_severity == "CRITICAL"
    assert report.security_regressions_detected >= 3
    assert any(s.category == "ACL" and s.severity == "CRITICAL" for s in report.semantic_drift)
    assert any(s.category == "SERVICE" and s.severity == "CRITICAL" for s in report.semantic_drift)
    assert any(s.category == "SNMP" and s.severity == "CRITICAL" for s in report.semantic_drift)
