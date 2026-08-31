"""Cisco IOS and ASA Configuration Parser."""

import re
from typing import Any
from backend.parsers.base import BaseConfigParser, ParsedConfig


class CiscoIOSParser(BaseConfigParser):
    """Parser for Cisco IOS and Cisco ASA firewall configurations."""

    def parse(self, raw_config: str) -> ParsedConfig:
        lines = [line.strip() for line in raw_config.splitlines() if line.strip() and not line.strip().startswith("!")]
        
        hostname = "cisco-device"
        interfaces: list[dict[str, Any]] = []
        security_rules: list[dict[str, Any]] = []
        nat_rules: list[dict[str, Any]] = []
        zones: set[str] = set()
        raw_sections: dict[str, str] = {}
        metadata: dict[str, Any] = {
            "ssh_enabled": False,
            "telnet_enabled": False,
            "logging_enabled": False,
            "aaa_enabled": False,
            "password_encryption": False,
        }

        current_interface: dict[str, Any] | None = None
        current_section_name: str = "global"
        current_section_lines: list[str] = []

        for line in raw_config.splitlines():
            trimmed = line.strip()
            if not trimmed or trimmed.startswith("!"):
                continue

            # Hostname
            host_match = re.match(r"^hostname\s+(\S+)", trimmed, re.IGNORECASE)
            if host_match:
                hostname = host_match.group(1)

            # Security features metadata
            if re.match(r"^aaa\s+new-model", trimmed, re.IGNORECASE):
                metadata["aaa_enabled"] = True
            if re.match(r"^service\s+password-encryption", trimmed, re.IGNORECASE):
                metadata["password_encryption"] = True
            if re.match(r"^logging\s+enable", trimmed, re.IGNORECASE) or re.match(r"^logging\s+host", trimmed, re.IGNORECASE):
                metadata["logging_enabled"] = True
            if re.match(r"^telnet\s+", trimmed, re.IGNORECASE):
                metadata["telnet_enabled"] = True
            if re.match(r"^ssh\s+", trimmed, re.IGNORECASE) or re.match(r"^crypto\s+key\s+generate\s+rsa", trimmed, re.IGNORECASE):
                metadata["ssh_enabled"] = True

            # Zone extraction
            zone_match = re.match(r"^zone-pair\s+security\s+(\S+)\s+source\s+(\S+)\s+destination\s+(\S+)", trimmed, re.IGNORECASE)
            if zone_match:
                zones.add(zone_match.group(2))
                zones.add(zone_match.group(3))

            # Interfaces
            if trimmed.startswith("interface "):
                if current_interface:
                    interfaces.append(current_interface)
                if current_section_name and current_section_lines:
                    raw_sections[current_section_name] = "\n".join(current_section_lines)
                current_section_name = trimmed
                current_section_lines = [trimmed]
                
                if_name = trimmed.replace("interface ", "").strip()
                current_interface = {
                    "name": if_name,
                    "ip_address": None,
                    "subnet_mask": None,
                    "nameif": None,
                    "security_level": None,
                    "shutdown": False,
                    "zone": None,
                }
                continue
            
            if current_interface and line.startswith(" "):
                current_section_lines.append(trimmed)
                if trimmed.lower() == "shutdown":
                    current_interface["shutdown"] = True
                
                ip_match = re.match(r"^ip\s+address\s+(\S+)\s+(\S+)", trimmed, re.IGNORECASE)
                if ip_match:
                    current_interface["ip_address"] = ip_match.group(1)
                    current_interface["subnet_mask"] = ip_match.group(2)
                
                nameif_match = re.match(r"^nameif\s+(\S+)", trimmed, re.IGNORECASE)
                if nameif_match:
                    current_interface["nameif"] = nameif_match.group(1)
                    zones.add(nameif_match.group(1))
                
                sec_match = re.match(r"^security-level\s+(\d+)", trimmed, re.IGNORECASE)
                if sec_match:
                    current_interface["security_level"] = int(sec_match.group(1))

                zone_member_match = re.match(r"^zone-member\s+security\s+(\S+)", trimmed, re.IGNORECASE)
                if zone_member_match:
                    current_interface["zone"] = zone_member_match.group(1)
                    zones.add(zone_member_match.group(1))
                continue
            else:
                if current_interface:
                    interfaces.append(current_interface)
                    current_interface = None

            # Access Control Lists (ACLs)
            acl_match = re.match(
                r"^access-list\s+(\S+)\s+(?:extended\s+)?(permit|deny)\s+(\S+)\s+(.*?)$",
                trimmed,
                re.IGNORECASE,
            )
            if acl_match:
                acl_name = acl_match.group(1)
                action = acl_match.group(2).lower()
                protocol = acl_match.group(3).lower()
                rest = acl_match.group(4)
                
                # Check for risky open any-any
                is_any_any = bool(re.search(r"\bany\s+any\b", rest, re.IGNORECASE))
                
                security_rules.append({
                    "rule_id": f"{acl_name}_{len(security_rules) + 1}",
                    "name": acl_name,
                    "action": action,
                    "protocol": protocol,
                    "definition": rest,
                    "is_any_any": is_any_any,
                    "raw_command": trimmed,
                })

            # NAT Rules
            nat_match = re.match(r"^(?:ip\s+)?nat\s+(.*)", trimmed, re.IGNORECASE)
            if nat_match:
                nat_rules.append({
                    "rule_id": f"nat_{len(nat_rules) + 1}",
                    "definition": nat_match.group(1),
                    "raw_command": trimmed,
                })

        if current_interface:
            interfaces.append(current_interface)
        if current_section_name and current_section_lines:
            raw_sections[current_section_name] = "\n".join(current_section_lines)

        return ParsedConfig(
            vendor="cisco",
            device_type="firewall" if any(i.get("nameif") for i in interfaces) or "asa" in hostname.lower() else "router",
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
                "vendor": "cisco",
                "identifier": r.get("rule_id"),
                "name": r.get("name"),
                "action": r.get("action"),
                "protocol": r.get("protocol"),
                "details": r.get("raw_command"),
                "is_any_any": r.get("is_any_any", False),
            })
        for n in parsed.nat_rules:
            rules.append({
                "rule_type": "nat_rule",
                "vendor": "cisco",
                "identifier": n.get("rule_id"),
                "details": n.get("raw_command"),
            })
        return rules
