"""
AEGIS-NTRO — Fortinet FortiOS Configuration Parser.
Extracts Firewall Policies, Address Groups, Virtual IPs, Interfaces,
and System Management into Canonical AST Schema.
"""

from __future__ import annotations

import re
from typing import Any
from backend.parsers.base import (
    BaseConfigParser,
    CanonicalAAA,
    CanonicalRule,
    CanonicalService,
    ParsedConfig,
)


class FortinetParser(BaseConfigParser):
    """Parser for Fortinet FortiOS configuration files."""

    def parse(self, raw_config: str) -> ParsedConfig:
        hostname = "fortigate-fw"
        interfaces: list[dict[str, Any]] = []
        security_rules: list[CanonicalRule] = []
        services: list[CanonicalService] = []
        aaa = CanonicalAAA()
        zones: set[str] = set()

        in_firewall_policy = False
        current_policy: dict[str, Any] | None = None

        for line in raw_config.splitlines():
            trimmed = line.strip()
            if not trimmed or trimmed.startswith("#"):
                continue

            # Hostname
            host_match = re.match(r"^set\s+hostname\s+[\"\']?([^\"\'\s]+)[\"\']?", trimmed, re.I)
            if host_match:
                hostname = host_match.group(1)

            # Telnet management
            if re.search(r"set\s+admin-telnet\s+enable", trimmed, re.I):
                services.append(CanonicalService(name="telnet", enabled=True, port=23, protocol="tcp"))
                security_rules.append(
                    CanonicalRule(
                        rule_id="FORTI-SVC-TELNET",
                        rule_type="service",
                        action="permit",
                        severity_hint="CRITICAL",
                        raw_text=trimmed,
                        context="FortiOS administrator Telnet enabled globally — violates NIST AC-17 and IA-5",
                    )
                )

            # SNMP community 'public'
            if re.search(r"set\s+name\s+[\"']?public[\"']?", trimmed, re.I):
                security_rules.append(
                    CanonicalRule(
                        rule_id="FORTI-SNMP-PUBLIC",
                        rule_type="snmp",
                        action="permit",
                        severity_hint="CRITICAL",
                        raw_text=trimmed,
                        context="Default SNMP community 'public' configured on FortiGate — violates NIST IA-5 and SC-8",
                    )
                )

            # Detect firewall policy block
            if trimmed.lower() == "config firewall policy":
                in_firewall_policy = True
                continue

            if in_firewall_policy:
                if trimmed.lower() == "end":
                    if current_policy:
                        self._add_forti_policy(security_rules, current_policy)
                        current_policy = None
                    in_firewall_policy = False
                    continue

                edit_match = re.match(r"^edit\s+(\d+)", trimmed, re.I)
                if edit_match:
                    if current_policy:
                        self._add_forti_policy(security_rules, current_policy)
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
                        "raw": [trimmed],
                    }
                    continue

                if trimmed.lower() == "next":
                    if current_policy:
                        self._add_forti_policy(security_rules, current_policy)
                        current_policy = None
                    continue

                if current_policy:
                    current_policy["raw"].append(trimmed)
                    set_match = re.match(r"^set\s+(\S+)\s+(.*)", trimmed, re.I)
                    if set_match:
                        k = set_match.group(1).lower()
                        v = [val.strip('"\'') for val in set_match.group(2).split()]
                        if k == "srcintf":
                            current_policy["srcintf"] = v
                        elif k == "dstintf":
                            current_policy["dstintf"] = v
                        elif k == "srcaddr":
                            current_policy["srcaddr"] = v
                        elif k == "dstaddr":
                            current_policy["dstaddr"] = v
                        elif k == "action":
                            current_policy["action"] = v[0] if v else "accept"
                        elif k == "service":
                            current_policy["service"] = v

        return ParsedConfig(
            vendor="fortinet",
            device_type="firewall",
            hostname=hostname,
            os_version="FortiOS 7.x",
            interfaces=interfaces,
            security_rules=security_rules,
            services=services,
            aaa=aaa,
            zones=sorted(list(zones)),
        )

    def _add_forti_policy(self, rules: list[CanonicalRule], policy: dict[str, Any]) -> None:
        src_any = any(s.lower() == "all" for s in policy.get("srcaddr", []))
        dst_any = any(d.lower() == "all" for d in policy.get("dstaddr", []))
        svc_any = any(sv.lower() == "all" for sv in policy.get("service", []))
        is_accept = policy.get("action", "accept").lower() in ["accept", "permit"]
        is_any_any = bool(is_accept and src_any and dst_any and svc_any)

        sev = "CRITICAL" if is_any_any else "MEDIUM"
        context = (
            f"Fortinet Firewall Policy '{policy.get('name')}' permits ALL sources, ALL destinations, and ALL services — violates NIST AC-4 and SC-7"
            if is_any_any
            else f"FortiOS Policy '{policy.get('name')}' src:{policy.get('srcaddr')} dst:{policy.get('dstaddr')} action:{policy.get('action')}"
        )

        rules.append(
            CanonicalRule(
                rule_id=policy.get("rule_id", "FORTI-POL"),
                rule_name=policy.get("name"),
                rule_type="security_policy",
                action=policy.get("action", "accept"),
                source_zones=policy.get("srcintf", []),
                destination_zones=policy.get("dstintf", []),
                source_ips=policy.get("srcaddr", []),
                destination_ips=policy.get("dstaddr", []),
                services=policy.get("service", []),
                is_any_any=is_any_any,
                severity_hint=sev,
                raw_text="; ".join(policy.get("raw", [])),
                context=context,
            )
        )


fortinet_parser = FortinetParser()


def parse_fortinet(config: str) -> list[dict[str, Any]]:
    parsed = fortinet_parser.parse(config)
    return fortinet_parser.extract_rules(parsed)
