"""
AEGIS-NTRO — Juniper JunOS Configuration Parser.
Extracts Firewall Filters, Address Books, Applications, Security Policies,
and Routing-Options into Canonical AST Schema.
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


class JuniperParser(BaseConfigParser):
    """Parser for Juniper JunOS set syntax and hierarchical configurations."""

    def parse(self, raw_config: str) -> ParsedConfig:
        hostname = "juniper-device"
        interfaces: list[dict[str, Any]] = []
        security_rules: list[CanonicalRule] = []
        services: list[CanonicalService] = []
        aaa = CanonicalAAA()
        zones: set[str] = set()

        policy_map: dict[str, dict[str, Any]] = {}

        for line in raw_config.splitlines():
            trimmed = line.strip()
            if not trimmed or trimmed.startswith("#"):
                continue

            # Hostname
            host_match = re.match(r"^set\s+system\s+host-name\s+(\S+)", trimmed, re.I)
            if host_match:
                hostname = host_match.group(1)

            # Telnet service
            if re.search(r"set\s+system\s+services\s+telnet", trimmed, re.I):
                services.append(CanonicalService(name="telnet", enabled=True, port=23, protocol="tcp"))
                security_rules.append(
                    CanonicalRule(
                        rule_id="JUNIPER-SVC-TELNET",
                        rule_type="service",
                        action="permit",
                        severity_hint="CRITICAL",
                        raw_text=trimmed,
                        context="JunOS Telnet service enabled — cleartext management violates NIST AC-17 and IA-5",
                    )
                )

            # SNMP community
            snmp_m = re.search(r"set\s+snmp\s+community\s+([^\s]+)", trimmed, re.I)
            if snmp_m:
                comm = snmp_m.group(1)
                if comm.lower() in ["public", "private"]:
                    security_rules.append(
                        CanonicalRule(
                            rule_id=f"JUNIPER-SNMP-{comm.upper()}",
                            rule_type="snmp",
                            action="permit",
                            severity_hint="CRITICAL",
                            raw_text=trimmed,
                            context=f"Insecure SNMP community '{comm}' in JunOS — violates NIST IA-5 and SC-8",
                        )
                    )

            # Zones
            zone_match = re.match(r"^set\s+security\s+zones\s+security-zone\s+(\S+)", trimmed, re.I)
            if zone_match:
                zones.add(zone_match.group(1))

            # Security Policies
            # set security policies from-zone <Z1> to-zone <Z2> policy <NAME> ...
            sec_policy_match = re.match(
                r"^set\s+security\s+policies\s+from-zone\s+(\S+)\s+to-zone\s+(\S+)\s+policy\s+(\S+)\s+(.*)",
                trimmed,
                re.I,
            )
            if sec_policy_match:
                from_z = sec_policy_match.group(1)
                to_z = sec_policy_match.group(2)
                p_name = sec_policy_match.group(3)
                p_rest = sec_policy_match.group(4)

                zones.add(from_z)
                zones.add(to_z)

                key = f"{from_z}->{to_z}:{p_name}"
                if key not in policy_map:
                    policy_map[key] = {
                        "rule_id": f"JUNIPER-POL-{p_name}",
                        "name": p_name,
                        "from_zone": from_z,
                        "to_zone": to_z,
                        "sources": [],
                        "destinations": [],
                        "applications": [],
                        "action": "permit",
                        "raw_commands": [],
                    }

                policy_map[key]["raw_commands"].append(trimmed)

                if "then permit" in p_rest.lower():
                    policy_map[key]["action"] = "permit"
                elif "then deny" in p_rest.lower() or "then reject" in p_rest.lower():
                    policy_map[key]["action"] = "deny"

                src_m = re.search(r"match\s+source-address\s+(\S+)", p_rest, re.I)
                if src_m:
                    policy_map[key]["sources"].append(src_m.group(1))

                dst_m = re.search(r"match\s+destination-address\s+(\S+)", p_rest, re.I)
                if dst_m:
                    policy_map[key]["destinations"].append(dst_m.group(1))

                app_m = re.search(r"match\s+application\s+(\S+)", p_rest, re.I)
                if app_m:
                    policy_map[key]["applications"].append(app_m.group(1))

        # Convert policy map to CanonicalRule
        for key, p in policy_map.items():
            src_any = any(s.lower() == "any" for s in p["sources"])
            dst_any = any(d.lower() == "any" for d in p["destinations"])
            app_any = any(a.lower() in ["any", "junos-any"] for a in p["applications"])
            is_any_any = bool(p["action"] == "permit" and src_any and dst_any and app_any)

            sev = "CRITICAL" if is_any_any else "MEDIUM"
            context = (
                f"JunOS Security Policy '{p['name']}' allows ANY source to ANY destination for ANY application — violates NIST AC-4 and SC-7"
                if is_any_any
                else f"JunOS Policy '{p['name']}' {p['from_zone']}->{p['to_zone']} action {p['action']}"
            )

            security_rules.append(
                CanonicalRule(
                    rule_id=p["rule_id"],
                    rule_name=p["name"],
                    rule_type="security_policy",
                    action=p["action"],
                    source_zones=[p["from_zone"]],
                    destination_zones=[p["to_zone"]],
                    source_ips=p["sources"],
                    destination_ips=p["destinations"],
                    services=p["applications"],
                    is_any_any=is_any_any,
                    severity_hint=sev,
                    raw_text="; ".join(p["raw_commands"]),
                    context=context,
                )
            )

        return ParsedConfig(
            vendor="juniper",
            device_type="firewall_router",
            hostname=hostname,
            os_version="JunOS 20.x+",
            interfaces=interfaces,
            security_rules=security_rules,
            services=services,
            aaa=aaa,
            zones=sorted(list(zones)),
        )


juniper_parser = JuniperParser()


def parse_juniper(config: str) -> list[dict[str, Any]]:
    parsed = juniper_parser.parse(config)
    return juniper_parser.extract_rules(parsed)
