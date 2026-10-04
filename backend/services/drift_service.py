"""
AEGIS-NTRO — Sovereign Configuration Drift Detection & Security Impact Classifier.
Compares successive device configuration revisions, performs line-level and semantic diffing,
and classifies security regressions (e.g., newly opened wildcard ACEs, disabled encryption).
"""

from __future__ import annotations

import difflib
import re
from typing import Any, Optional
from pydantic import BaseModel, Field

from backend.parsers.base import ParsedConfig
from backend.services.parser_service import parser_service


class DriftLine(BaseModel):
    change_type: str  # ADDED | REMOVED | UNCHANGED
    line_number: Optional[int] = None
    content: str
    security_impact: Optional[str] = None  # CRITICAL | HIGH | MEDIUM | LOW | INFO
    impact_description: Optional[str] = None


class SemanticDriftItem(BaseModel):
    category: str  # ACL | SERVICE | AUTH | CRYPTO | SNMP | LOGGING
    action: str    # INTRODUCED_VIOLATION | RESOLVED_VIOLATION | MODIFIED_POLICY
    severity: str  # CRITICAL | HIGH | MEDIUM | LOW
    description: str
    remediation_advice: Optional[str] = None


class DriftAnalysisReport(BaseModel):
    vendor: str
    hostname: str
    total_added_lines: int
    total_removed_lines: int
    drift_severity: str  # CRITICAL | HIGH | MEDIUM | LOW | NONE
    security_regressions_detected: int
    security_improvements_detected: int
    semantic_drift: list[SemanticDriftItem] = Field(default_factory=list)
    line_diff: list[DriftLine] = Field(default_factory=list)
    summary: str


class DriftService:
    """Service to compute diffs and detect compliance drift across configuration revisions."""

    def analyze_drift(
        self,
        vendor: str,
        baseline_config: str,
        current_config: str,
        hostname: str = "network-device",
    ) -> DriftAnalysisReport:
        """Perform line-level diffing and security regression classification."""
        base_lines = [l.strip() for l in baseline_config.splitlines() if l.strip()]
        curr_lines = [l.strip() for l in current_config.splitlines() if l.strip()]

        # 1. Line-level unified diff
        matcher = difflib.SequenceMatcher(None, base_lines, curr_lines)
        diff_lines: list[DriftLine] = []
        added_count = 0
        removed_count = 0
        semantic_items: list[SemanticDriftItem] = []

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == "equal":
                for idx, line in enumerate(curr_lines[j1:j2], start=j1 + 1):
                    diff_lines.append(DriftLine(change_type="UNCHANGED", line_number=idx, content=line))
            elif tag == "insert":
                for idx, line in enumerate(curr_lines[j1:j2], start=j1 + 1):
                    added_count += 1
                    impact, desc, cat = self._classify_line_risk(line, is_addition=True)
                    diff_lines.append(
                        DriftLine(
                            change_type="ADDED",
                            line_number=idx,
                            content=line,
                            security_impact=impact,
                            impact_description=desc,
                        )
                    )
                    if impact in ["CRITICAL", "HIGH", "MEDIUM"]:
                        semantic_items.append(
                            SemanticDriftItem(
                                category=cat,
                                action="INTRODUCED_VIOLATION",
                                severity=impact,
                                description=f"Newly added configuration line '{line}': {desc}",
                                remediation_advice=f"Revert or constrain '{line}' to adhere to least privilege.",
                            )
                        )
            elif tag == "delete":
                for idx, line in enumerate(base_lines[i1:i2], start=i1 + 1):
                    removed_count += 1
                    impact, desc, cat = self._classify_line_risk(line, is_addition=False)
                    diff_lines.append(
                        DriftLine(
                            change_type="REMOVED",
                            line_number=idx,
                            content=line,
                            security_impact=impact,
                            impact_description=desc,
                        )
                    )
                    if impact in ["CRITICAL", "HIGH"]:
                        semantic_items.append(
                            SemanticDriftItem(
                                category=cat,
                                action="REMOVED_SECURITY_CONTROL",
                                severity=impact,
                                description=f"Removed baseline hardening line '{line}': {desc}",
                                remediation_advice=f"Restore baseline security control '{line}'.",
                            )
                        )
            elif tag == "replace":
                for idx, line in enumerate(base_lines[i1:i2], start=i1 + 1):
                    removed_count += 1
                    diff_lines.append(DriftLine(change_type="REMOVED", line_number=idx, content=line))
                for idx, line in enumerate(curr_lines[j1:j2], start=j1 + 1):
                    added_count += 1
                    impact, desc, cat = self._classify_line_risk(line, is_addition=True)
                    diff_lines.append(
                        DriftLine(
                            change_type="ADDED",
                            line_number=idx,
                            content=line,
                            security_impact=impact,
                            impact_description=desc,
                        )
                    )
                    if impact in ["CRITICAL", "HIGH", "MEDIUM"]:
                        semantic_items.append(
                            SemanticDriftItem(
                                category=cat,
                                action="INTRODUCED_VIOLATION",
                                severity=impact,
                                description=f"Replaced configuration line with '{line}': {desc}",
                                remediation_advice=f"Validate replaced parameter against compliance baseline.",
                            )
                        )

        # 2. Overall drift severity calculation
        criticals = sum(1 for s in semantic_items if s.severity == "CRITICAL")
        highs = sum(1 for s in semantic_items if s.severity == "HIGH")
        mediums = sum(1 for s in semantic_items if s.severity == "MEDIUM")

        if criticals > 0:
            overall_sev = "CRITICAL"
        elif highs > 0:
            overall_sev = "HIGH"
        elif mediums > 0:
            overall_sev = "MEDIUM"
        elif added_count > 0 or removed_count > 0:
            overall_sev = "LOW"
        else:
            overall_sev = "NONE"

        summary = (
            f"Configuration drift analysis: {added_count} lines added, {removed_count} lines removed. "
            f"Detected {len(semantic_items)} security-impacting modifications ({criticals} critical, {highs} high). "
            f"Overall posture status: {overall_sev}."
        )

        return DriftAnalysisReport(
            vendor=vendor,
            hostname=hostname,
            total_added_lines=added_count,
            total_removed_lines=removed_count,
            drift_severity=overall_sev,
            security_regressions_detected=len(semantic_items),
            security_improvements_detected=0,
            semantic_drift=semantic_items,
            line_diff=diff_lines,
            summary=summary,
        )

    def _classify_line_risk(self, line: str, is_addition: bool) -> tuple[str, str, str]:
        """Classify security impact of an added or removed configuration directive."""
        s = line.strip().lower()

        # Wildcard ACEs
        if "permit ip any any" in s or "allow any any" in s or ("srcaddr all" in s and "dstaddr all" in s):
            if is_addition:
                return "CRITICAL", "Wildcard permit all rule introduced — violates perimeter flow control (NIST AC-4, SC-7)", "ACL"
            return "LOW", "Wildcard permit all rule removed — positive hardening", "ACL"

        # Telnet
        if "telnet" in s and ("transport input" in s or "enable" in s or "service" in s):
            if is_addition:
                return "CRITICAL", "Cleartext Telnet protocol enabled — violates NIST AC-17 and IA-5", "SERVICE"
            return "LOW", "Telnet disabled — positive hardening", "SERVICE"

        # SNMP Community Strings
        if "snmp" in s and ("public" in s or "private" in s):
            if is_addition:
                return "CRITICAL", "Default SNMP community string configured — violates NIST IA-5, SC-8", "SNMP"
            return "LOW", "Default SNMP community string removed", "SNMP"

        # Password encryption disabled
        if "no service password-encryption" in s or "password-encryption disable" in s:
            if is_addition:
                return "HIGH", "Password encryption explicitly disabled — exposes plaintext credentials (NIST IA-5)", "AUTH"
            return "LOW", "Disabled password encryption flag removed", "AUTH"

        # SSH 0.0.0.0 (Wildcard SSH access)
        if "ssh 0.0.0.0 0.0.0.0" in s:
            if is_addition:
                return "HIGH", "SSH access opened to entire internet (0.0.0.0/0) — violates NIST AC-17", "SERVICE"
            return "LOW", "Wildcard SSH access rule removed", "SERVICE"

        # Weak crypto
        if any(c in s for c in ["3des", "des", "md5", "group 1", "group 2"]):
            if is_addition:
                return "HIGH", "Deprecated legacy cryptography (DES/3DES/MD5) introduced — violates NIST SC-13", "CRYPTO"
            return "LOW", "Legacy cryptographic policy removed", "CRYPTO"

        # Logging removed
        if not is_addition and ("logging" in s or "syslog" in s):
            return "HIGH", "Logging or SIEM telemetry configuration removed — violates NIST AU-6, AU-8", "LOGGING"

        # General info
        return "INFO", "General configuration update", "GENERAL"


drift_service = DriftService()
