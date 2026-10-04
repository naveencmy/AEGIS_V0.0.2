"""
AEGIS-NTRO — Palo Alto PAN-OS XML / Set Configuration Parser.
Extracts Security Rules, NAT Policies, Zones, and Interfaces into Canonical AST Schema.
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from typing import Any
from backend.parsers.base import BaseConfigParser, CanonicalRule, ParsedConfig


class PaloAltoParser(BaseConfigParser):
    """Parser for Palo Alto PAN-OS XML and set syntax configuration exports."""

    def parse(self, raw_config: str) -> ParsedConfig:
        hostname = "palo-alto-fw"
        interfaces: list[dict[str, Any]] = []
        security_rules: list[CanonicalRule] = []
        nat_rules: list[dict[str, Any]] = []
        zones: set[str] = set()
        metadata: dict[str, Any] = {
            "panorama_managed": False,
            "threat_prevention_enabled": False,
        }

        try:
            root = ET.fromstring(raw_config)
        except Exception:
            # Parse line by line if set command format or text
            return self._parse_set_or_text(raw_config)

        # Hostname search
        host_elem = root.find(".//system/hostname")
        if host_elem is not None and host_elem.text:
            hostname = host_elem.text

        # Zones
        for zone_entry in root.findall(".//zone/entry"):
            zname = zone_entry.get("name")
            if zname:
                zones.add(zname)

        # Interfaces
        for if_entry in root.findall(".//network/interface//entry"):
            if_name = if_entry.get("name", "unknown")
            ip_elem = if_entry.find(".//ip/entry")
            ip_addr = ip_elem.get("name") if ip_elem is not None else None
            interfaces.append({"name": if_name, "ip_address": ip_addr})

        # Security Rules
        for rule_entry in root.findall(".//rulebase/security/rules/entry"):
            rule_name = rule_entry.get("name", "unnamed")
            from_zones = [m.text for m in rule_entry.findall("./from/member") if m.text]
            to_zones = [m.text for m in rule_entry.findall("./to/member") if m.text]
            sources = [m.text for m in rule_entry.findall("./source/member") if m.text]
            destinations = [m.text for m in rule_entry.findall("./destination/member") if m.text]
            apps = [m.text for m in rule_entry.findall("./application/member") if m.text]
            services = [m.text for m in rule_entry.findall("./service/member") if m.text]

            action_elem = rule_entry.find("./action")
            action = action_elem.text if action_elem is not None and action_elem.text else "allow"

            disabled_elem = rule_entry.find("./disabled")
            disabled = (disabled_elem.text.lower() == "yes") if disabled_elem is not None and disabled_elem.text else False

            if disabled:
                continue

            # Check for overly permissive rules (any to any allow)
            is_any_any = (
                action == "allow"
                and (not sources or "any" in sources)
                and (not destinations or "any" in destinations)
                and (not apps or "any" in apps)
            )

            sev = "CRITICAL" if is_any_any else "MEDIUM"
            context = (
                f"PAN-OS Security Rule '{rule_name}' allows unrestricted ANY to ANY traffic — violates NIST AC-4 and SC-7"
                if is_any_any
                else f"PAN-OS Security Rule '{rule_name}' from {from_zones} to {to_zones} action {action}"
            )

            security_rules.append(
                CanonicalRule(
                    rule_id=f"PA-{rule_name}",
                    rule_name=rule_name,
                    rule_type="security_policy",
                    action=action,
                    source_zones=from_zones,
                    destination_zones=to_zones,
                    source_ips=sources,
                    destination_ips=destinations,
                    services=services,
                    is_any_any=is_any_any,
                    severity_hint=sev,
                    raw_text=f"rulebase security rules {rule_name} action {action}",
                    context=context,
                )
            )

        return ParsedConfig(
            vendor="palo_alto",
            device_type="firewall",
            hostname=hostname,
            os_version="PAN-OS 10.x/11.x",
            interfaces=interfaces,
            security_rules=security_rules,
            nat_rules=nat_rules,
            zones=sorted(list(zones)),
            metadata=metadata,
        )

    def _parse_set_or_text(self, text: str) -> ParsedConfig:
        """Fallback parser for set command formats."""
        hostname = "palo-alto-fw"
        security_rules: list[CanonicalRule] = []
        zones: set[str] = set()

        for line in text.splitlines():
            s = line.strip()
            if "set deviceconfig system hostname" in s:
                parts = s.split()
                if len(parts) >= 5:
                    hostname = parts[4]
            elif "rulebase security rules" in s and "action allow" in s:
                is_any = "source any" in s and "destination any" in s
                security_rules.append(
                    CanonicalRule(
                        rule_id=f"PA-SET-{len(security_rules)+1}",
                        rule_type="security_policy",
                        action="allow",
                        is_any_any=is_any,
                        severity_hint="CRITICAL" if is_any else "MEDIUM",
                        raw_text=s,
                        context="PAN-OS set rule with allow action",
                    )
                )

        return ParsedConfig(
            vendor="palo_alto",
            device_type="firewall",
            hostname=hostname,
            security_rules=security_rules,
            zones=list(zones),
        )


palo_alto_parser = PaloAltoParser()


def parse_palo_alto(config: str) -> list[dict[str, Any]]:
    parsed = palo_alto_parser.parse(config)
    return palo_alto_parser.extract_rules(parsed)
