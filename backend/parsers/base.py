"""
AEGIS-NTRO — Canonical Security AST Schema & Base Parser Interface.
Defines normalized representation for Cisco, Palo Alto, Fortinet, and Juniper configurations.
"""

from abc import ABC, abstractmethod
from typing import Any, Optional
from pydantic import BaseModel, Field


class CanonicalService(BaseModel):
    name: str
    enabled: bool
    port: Optional[int] = None
    protocol: Optional[str] = None
    properties: dict[str, Any] = Field(default_factory=dict)


class CanonicalAAA(BaseModel):
    aaa_model: bool = False
    authentication_login: Optional[str] = None
    authentication_enable: Optional[str] = None
    accounting: bool = False
    exec_timeout_seconds: Optional[int] = None
    password_encryption_enabled: bool = False


class CanonicalCrypto(BaseModel):
    ike_version: Optional[str] = None
    encryption_algorithm: Optional[str] = None
    hash_algorithm: Optional[str] = None
    dh_group: Optional[int] = None
    is_fips_compliant: bool = True


class CanonicalRule(BaseModel):
    rule_id: str
    rule_name: Optional[str] = None
    rule_type: str  # acl | security_policy | nat | filter | service | snmp | auth | crypto
    action: str  # permit | deny | allow | drop | reject
    source_zones: list[str] = Field(default_factory=list)
    destination_zones: list[str] = Field(default_factory=list)
    source_ips: list[str] = Field(default_factory=list)
    destination_ips: list[str] = Field(default_factory=list)
    services: list[str] = Field(default_factory=list)
    is_any_any: bool = False
    severity_hint: str = "MEDIUM"  # CRITICAL | HIGH | MEDIUM | LOW
    raw_text: str = ""
    context: str = ""


class ParsedConfig(BaseModel):
    """Normalized Canonical Configuration Data Model across all vendors."""
    vendor: str
    device_type: str = "firewall"
    hostname: str = "unknown"
    os_version: Optional[str] = None
    interfaces: list[dict[str, Any]] = Field(default_factory=list)
    zones: list[str] = Field(default_factory=list)
    security_rules: list[CanonicalRule] = Field(default_factory=list)
    nat_rules: list[dict[str, Any]] = Field(default_factory=list)
    services: list[CanonicalService] = Field(default_factory=list)
    aaa: CanonicalAAA = Field(default_factory=CanonicalAAA)
    crypto: list[CanonicalCrypto] = Field(default_factory=list)
    logging_servers: list[str] = Field(default_factory=list)
    snmp_communities: list[str] = Field(default_factory=list)
    raw_sections: dict[str, str] = Field(default_factory=dict)
    unmapped_lines: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class BaseConfigParser(ABC):
    """Abstract Base Class for multi-vendor network device config parsers."""

    @abstractmethod
    def parse(self, raw_config: str) -> ParsedConfig:
        """Parse raw device configuration into normalized ParsedConfig schema."""
        pass

    def extract_rules(self, parsed: ParsedConfig) -> list[dict[str, Any]]:
        """Extract flat security & filter rule objects for hybrid RAG audit evaluation."""
        rules = []
        for r in parsed.security_rules:
            rules.append({
                "rule_id": r.rule_id,
                "rule_name": r.rule_name,
                "rule_text": r.raw_text,
                "rule_type": r.rule_type,
                "severity_hint": r.severity_hint,
                "action": r.action,
                "is_any_any": r.is_any_any,
                "context": r.context or f"{r.rule_type.upper()} {r.action}: {r.raw_text}",
            })
        return rules
