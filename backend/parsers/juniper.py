"""Juniper JunOS Configuration Parser."""

import re
from typing import Any
from backend.parsers.base import BaseConfigParser, ParsedConfig


class JuniperParser(BaseConfigParser):
    """Parser for Juniper JunOS set syntax and hierarchical configurations."""

    def parse(self, raw_config: str) -> ParsedConfig:
        hostname = "juniper-device"
        interfaces: list[dict[str, Any]] = []
        security_rules: list[dict[str, Any]] = []
        nat_rules: list[dict[str, Any]] = []
        zones: set[str] = set()
        raw_sections: dict[str, str] = {}
        metadata: dict[str, Any] = {"os_version": "JunOS"}

        policy_map: dict[str, dict[str, Any]] = {}

        for line in raw_config.splitlines():
            trimmed = line.strip()
            if not trimmed or trimmed.startswith("#"):
                continue

            # Hostname
            host_match = re.match(r"^set\s+system\s+host-name\s+(\S+)", trimmed, re.IGNORECASE)
            if host_match:
                hostname = host_match.group(1)

            # Zones
            zone_match = re.match(r"^set\s+security\s+zones\s+security-zone\s+(\S+)", trimmed, re.IGNORECASE)
            if zone_match:
                zones.add(zone_match.group(1))

            # Security Policies
            # set security policies from-zone <Z1> to-zone <Z2> policy <NAME> ...
            sec_policy_match = re.match(
                r"^set\s+security\s+policies\s+from-zone\s+(\S+)\s+to-zone\s+(\S+)\s+policy\s+(\S+)\s+(.*)",
                trimmed,
                re.IGNORECASE,
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
                        "rule_id": p_name,
                        "name": p_name,
                        "from_zone": from_z,
                        "to_zone": to_z,
                        "sources": [],
                        "destinations": [],
                        "applications": [],
                        "action": "permit",
                        "is_any_any": False,
                        "raw_commands": [],
                    }
                
                policy_map[key]["raw_commands"].append(trimmed)

                if "then permit" in p_rest.lower():
                    policy_map[key]["action"] = "permit"
                elif "then deny" in p_rest.lower() or "then reject" in p_rest.lower():
                    policy_map[key]["action"] = "deny"

                src_m = re.search(r"match\s+source-address\s+(\S+)", p_rest, re.IGNORECASE)
                if src_m:
                    policy_map[key]["sources"].append(src_m.group(1))
                
                dst_m = re.search(r"match\s+destination-address\s+(\S+)", p_rest, re.IGNORECASE)
                if dst_m:
                    policy_map[key]["destinations"].append(dst_m.group(1))

                app_m = re.search(r"match\s+application\s+(\S+)", p_rest, re.IGNORECASE)
                if app_m:
                    policy_map[key]["applications"].append(app_m.group(1))

            # Firewall filters (stateless ACLs)
            filter_match = re.match(
                r"^set\s+firewall\s+filter\s+(\S+)\s+term\s+(\S+)\s+then\s+(\S+)",
                trimmed,
                re.IGNORECASE,
            )
            if filter_match:
                f_name = filter_match.group(1)
                t_name = filter_match.group(2)
                act = filter_match.group(3)
                security_rules.append({
                    "rule_id": f"{f_name}_{t_name}",
                    "name": f"{f_name}/{t_name}",
                    "action": act,
                    "raw_command": trimmed,
                    "is_any_any": False,
                })

        for p in policy_map.values():
            # Check for any-any permit
            if (
                p["action"] == "permit"
                and ("any" in p["sources"] or not p["sources"])
                and ("any" in p["destinations"] or not p["destinations"])
                and ("any" in p["applications"] or "any-service" in p["applications"] or not p["applications"])
            ):
                p["is_any_any"] = True
            security_rules.append(p)

        return ParsedConfig(
            vendor="juniper",
            device_type="firewall" if security_rules else "router",
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
                "vendor": "juniper",
                "identifier": r.get("rule_id"),
                "name": r.get("name"),
                "from_zone": r.get("from_zone"),
                "to_zone": r.get("to_zone"),
                "sources": r.get("sources"),
                "destinations": r.get("destinations"),
                "action": r.get("action"),
                "is_any_any": r.get("is_any_any", False),
            })
        return rules
