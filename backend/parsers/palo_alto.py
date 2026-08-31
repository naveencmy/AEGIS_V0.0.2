"""Palo Alto PAN-OS XML Configuration Parser."""

import xml.etree.ElementTree as ET
from typing import Any
from backend.parsers.base import BaseConfigParser, ParsedConfig


class PaloAltoParser(BaseConfigParser):
    """Parser for Palo Alto PAN-OS XML configuration exports."""

    def parse(self, raw_config: str) -> ParsedConfig:
        hostname = "palo-alto-fw"
        interfaces: list[dict[str, Any]] = []
        security_rules: list[dict[str, Any]] = []
        nat_rules: list[dict[str, Any]] = []
        zones: set[str] = set()
        raw_sections: dict[str, str] = {}
        metadata: dict[str, Any] = {
            "panorama_managed": False,
            "threat_prevention_enabled": False,
        }

        try:
            root = ET.fromstring(raw_config)
        except Exception:
            # If plain text or malformed, return minimal fallback
            return ParsedConfig(
                vendor="palo_alto",
                device_type="firewall",
                hostname=hostname,
                security_rules=[],
                raw_sections={"raw": raw_config[:1000]},
            )

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
            interfaces.append({
                "name": if_name,
                "ip_address": ip_addr,
            })

        # Security Rules
        for rule_entry in root.findall(".//rulebase/security/rules/entry"):
            rule_name = rule_entry.get("name", "unnamed")
            
            # Extract source zones
            from_zones = [m.text for m in rule_entry.findall("./from/member") if m.text]
            # Extract destination zones
            to_zones = [m.text for m in rule_entry.findall("./to/member") if m.text]
            # Extract sources
            sources = [m.text for m in rule_entry.findall("./source/member") if m.text]
            # Extract destinations
            destinations = [m.text for m in rule_entry.findall("./destination/member") if m.text]
            # Extract applications
            apps = [m.text for m in rule_entry.findall("./application/member") if m.text]
            # Extract services
            services = [m.text for m in rule_entry.findall("./service/member") if m.text]
            # Extract action
            action_elem = rule_entry.find("./action")
            action = action_elem.text if action_elem is not None and action_elem.text else "allow"
            # Extract disabled status
            disabled_elem = rule_entry.find("./disabled")
            disabled = (disabled_elem.text.lower() == "yes") if disabled_elem is not None and disabled_elem.text else False

            # Check for overly permissive rules (any to any allow, or untrust to trust any-any)
            is_any_any = (
                action == "allow"
                and (not sources or "any" in sources)
                and (not destinations or "any" in destinations)
                and (not apps or "any" in apps)
            )

            security_rules.append({
                "rule_id": rule_name,
                "name": rule_name,
                "from_zones": from_zones,
                "to_zones": to_zones,
                "sources": sources,
                "destinations": destinations,
                "applications": apps,
                "services": services,
                "action": action,
                "disabled": disabled,
                "is_any_any": is_any_any,
            })

        # NAT Rules
        for nat_entry in root.findall(".//rulebase/nat/rules/entry"):
            nat_name = nat_entry.get("name", "unnamed")
            from_zones = [m.text for m in nat_entry.findall("./from/member") if m.text]
            to_zones = [m.text for m in nat_entry.findall("./to/member") if m.text]
            nat_rules.append({
                "rule_id": nat_name,
                "name": nat_name,
                "from_zones": from_zones,
                "to_zones": to_zones,
            })

        return ParsedConfig(
            vendor="palo_alto",
            device_type="firewall",
            hostname=hostname,
            interfaces=interfaces,
            security_rules=security_rules,
            nat_rules=nat_rules,
            zones=sorted(list(zones)),
            raw_sections=raw_sections,
            metadata=metadata,
        )

    def extract_rules(self, parsed: ParsedConfig) -> list[dict[str, Any]]:
        rules = []
        for r in parsed.security_rules:
            rules.append({
                "rule_type": "security_policy",
                "vendor": "palo_alto",
                "identifier": r.get("rule_id"),
                "name": r.get("name"),
                "from": r.get("from_zones"),
                "to": r.get("to_zones"),
                "source": r.get("sources"),
                "destination": r.get("destinations"),
                "application": r.get("applications"),
                "action": r.get("action"),
                "is_any_any": r.get("is_any_any", False),
            })
        return rules
