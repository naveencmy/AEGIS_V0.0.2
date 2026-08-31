"""Fortinet FortiOS Configuration Parser."""

import re
from typing import Any
from backend.parsers.base import BaseConfigParser, ParsedConfig


class FortinetParser(BaseConfigParser):
    """Parser for Fortinet FortiOS configuration files."""

    def parse(self, raw_config: str) -> ParsedConfig:
        hostname = "fortigate-fw"
        interfaces: list[dict[str, Any]] = []
        security_rules: list[dict[str, Any]] = []
        nat_rules: list[dict[str, Any]] = []
        zones: set[str] = set()
        raw_sections: dict[str, str] = {}
        metadata: dict[str, Any] = {"os_version": "FortiOS"}

        in_firewall_policy = False
        current_policy: dict[str, Any] | None = None

        for line in raw_config.splitlines():
            trimmed = line.strip()
            if not trimmed or trimmed.startswith("#"):
                continue

            # Hostname
            host_match = re.match(r"^set\s+hostname\s+[\"\']?([^\"\'\s]+)[\"\']?", trimmed, re.IGNORECASE)
            if host_match:
                hostname = host_match.group(1)

            # Detect firewall policy block
            if trimmed.lower() == "config firewall policy":
                in_firewall_policy = True
                continue

            if in_firewall_policy:
                if trimmed.lower() == "end":
                    if current_policy:
                        security_rules.append(current_policy)
                        current_policy = None
                    in_firewall_policy = False
                    continue

                edit_match = re.match(r"^edit\s+(\d+)", trimmed, re.IGNORECASE)
                if edit_match:
                    if current_policy:
                        security_rules.append(current_policy)
                    pid = edit_match.group(1)
                    current_policy = {
                        "rule_id": f"policy_{pid}",
                        "name": f"Policy {pid}",
                        "srcintf": [],
                        "dstintf": [],
                        "srcaddr": [],
                        "dstaddr": [],
                        "action": "accept",
                        "service": [],
                        "schedule": "always",
                        "status": "enable",
                        "is_any_any": False,
                    }
                    continue

                if trimmed.lower() == "next":
                    if current_policy:
                        # Check any-any
                        src_any = any(s.lower() == "all" for s in current_policy["srcaddr"])
                        dst_any = any(d.lower() == "all" for d in current_policy["dstaddr"])
                        svc_any = any(sv.lower() == "all" for sv in current_policy["service"])
                        if current_policy["action"] == "accept" and src_any and dst_any and svc_any:
                            current_policy["is_any_any"] = True
                        security_rules.append(current_policy)
                        current_policy = None
                    continue

                if current_policy:
                    set_match = re.match(r"^set\s+(\S+)\s+(.*)", trimmed, re.IGNORECASE)
                    if set_match:
                        key = set_match.group(1).lower()
                        val = set_match.group(2).replace('"', '').strip()
                        values = val.split()
                        
                        if key == "name":
                            current_policy["name"] = val
                        elif key == "srcintf":
                            current_policy["srcintf"] = values
                            for z in values:
                                zones.add(z)
                        elif key == "dstintf":
                            current_policy["dstintf"] = values
                            for z in values:
                                zones.add(z)
                        elif key == "srcaddr":
                            current_policy["srcaddr"] = values
                        elif key == "dstaddr":
                            current_policy["dstaddr"] = values
                        elif key == "action":
                            current_policy["action"] = val.lower()
                        elif key == "service":
                            current_policy["service"] = values
                        elif key == "status":
                            current_policy["status"] = val.lower()

        if current_policy:
            security_rules.append(current_policy)

        return ParsedConfig(
            vendor="fortinet",
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
                "rule_type": "firewall_policy",
                "vendor": "fortinet",
                "identifier": r.get("rule_id"),
                "name": r.get("name"),
                "srcintf": r.get("srcintf"),
                "dstintf": r.get("dstintf"),
                "srcaddr": r.get("srcaddr"),
                "dstaddr": r.get("dstaddr"),
                "action": r.get("action"),
                "service": r.get("service"),
                "is_any_any": r.get("is_any_any", False),
            })
        return rules
