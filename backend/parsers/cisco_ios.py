"""
AEGIS-NTRO — Cisco IOS / ASA Enterprise Configuration Parser.
Extracts ACLs, Services (Telnet/SSH/HTTP/SNMP), AAA, Crypto (IKE/IPSec),
and Logging into Canonical Security AST Schema.
"""

from __future__ import annotations

import re
from typing import Any
from backend.parsers.base import (
    BaseConfigParser,
    CanonicalAAA,
    CanonicalCrypto,
    CanonicalRule,
    CanonicalService,
    ParsedConfig,
)


class CiscoIOSParser(BaseConfigParser):
    """Parser for Cisco IOS, IOS-XE, and ASA running-config format."""

    def parse(self, raw_config: str) -> ParsedConfig:
        hostname = "cisco-router"
        os_version = "Cisco IOS"
        interfaces: list[dict[str, Any]] = []
        security_rules: list[CanonicalRule] = []
        services: list[CanonicalService] = []
        aaa = CanonicalAAA()
        crypto_list: list[CanonicalCrypto] = []
        logging_servers: list[str] = []
        snmp_communities: list[str] = []
        unmapped_lines: list[str] = []

        lines = raw_config.splitlines()
        current_interface: dict[str, Any] | None = None

        for line in lines:
            s = line.strip()
            if not s or s.startswith("!"):
                continue

            # Hostname
            host_m = re.match(r"^hostname\s+(\S+)", s, re.I)
            if host_m:
                hostname = host_m.group(1)
                continue

            # Version
            ver_m = re.match(r"^version\s+(\S+)", s, re.I)
            if ver_m:
                os_version = f"Cisco IOS {ver_m.group(1)}"
                continue

            # AAA Configuration
            if re.search(r"^aaa\s+new-model", s, re.I):
                aaa.aaa_model = True
            elif re.search(r"^aaa\s+authentication\s+login", s, re.I):
                aaa.authentication_login = s
            elif re.search(r"^aaa\s+authentication\s+enable", s, re.I):
                aaa.authentication_enable = s
            elif re.search(r"^aaa\s+accounting", s, re.I):
                aaa.accounting = True
            elif re.search(r"^service\s+password-encryption", s, re.I):
                aaa.password_encryption_enabled = True
            elif re.search(r"^no\s+service\s+password-encryption", s, re.I):
                aaa.password_encryption_enabled = False
                security_rules.append(
                    CanonicalRule(
                        rule_id="CISCO-AUTH-PWD-ENC",
                        rule_type="auth",
                        action="deny",
                        severity_hint="HIGH",
                        raw_text=s,
                        context="Password encryption explicitly disabled (no service password-encryption) — violates NIST IA-5 and CIS 3.2.1",
                    )
                )

            # Exec Timeout
            exec_m = re.match(r"^exec-timeout\s+(\d+)\s*(\d*)", s, re.I)
            if exec_m:
                mins = int(exec_m.group(1))
                secs = int(exec_m.group(2)) if exec_m.group(2) else 0
                aaa.exec_timeout_seconds = mins * 60 + secs

            # Logging Servers
            log_m = re.match(r"^logging\s+host\s+(\S+)|^logging\s+server\s+(\S+)|^logging\s+(\d+\.\d+\.\d+\.\d+)", s, re.I)
            if log_m:
                srv = log_m.group(1) or log_m.group(2) or log_m.group(3)
                if srv:
                    logging_servers.append(srv)

            # SNMP Community Strings
            snmp_m = re.search(r"snmp-server\s+community\s+([^\s]+)", s, re.I)
            if snmp_m:
                comm = snmp_m.group(1)
                snmp_communities.append(comm)
                if comm.lower() in ["public", "private"]:
                    security_rules.append(
                        CanonicalRule(
                            rule_id=f"CISCO-SNMP-{comm.upper()}",
                            rule_type="snmp",
                            action="permit",
                            severity_hint="CRITICAL",
                            raw_text=s,
                            context=f"Default/insecure SNMP community string '{comm}' detected — violates NIST IA-5, SC-8 and CIS 2.4.2",
                        )
                    )

            # Telnet / Remote Management
            if re.search(r"^telnet\s+", s, re.I) or re.search(r"transport\s+input\s+.*telnet", s, re.I):
                services.append(CanonicalService(name="telnet", enabled=True, port=23, protocol="tcp"))
                security_rules.append(
                    CanonicalRule(
                        rule_id="CISCO-SVC-TELNET",
                        rule_type="service",
                        action="permit",
                        severity_hint="CRITICAL",
                        raw_text=s,
                        context="Cleartext Telnet management protocol enabled — violates NIST AC-17, IA-5 and CIS 2.1.1",
                    )
                )

            # SSH on any interface / open
            if re.search(r"^ssh\s+0\.0\.0\.0\s+0\.0\.0\.0", s, re.I):
                services.append(CanonicalService(name="ssh", enabled=True, port=22, protocol="tcp"))
                security_rules.append(
                    CanonicalRule(
                        rule_id="CISCO-SVC-SSH-WILDCARD",
                        rule_type="service",
                        action="permit",
                        severity_hint="HIGH",
                        raw_text=s,
                        context="SSH administrative access permitted from wildcard 0.0.0.0/0 — violates NIST AC-17 and CIS 3.3.1",
                    )
                )

            # Access Control Lists (Extended / Standard)
            # e.g., access-list OUTSIDE_IN extended permit ip any any
            # e.g., ip access-list extended DMZ ...
            acl_m = re.search(r"(?:access-list\s+(\S+)\s+(?:extended|standard)?\s*|(?:ip\s+access-list\s+extended\s+(\S+)))\s*(permit|deny)\s+(ip|tcp|udp|icmp|any)\s+(.+)", s, re.I)
            if acl_m:
                acl_name = acl_m.group(1) or acl_m.group(2) or "ACL"
                action = acl_m.group(3).lower()
                proto = acl_m.group(4)
                target = acl_m.group(5)

                is_any_any = bool(re.search(r"\bany\s+any\b", target, re.I) or re.search(r"0\.0\.0\.0\s+0\.0\.0\.0\s+0\.0\.0\.0\s+0\.0\.0\.0", target))
                sev = "CRITICAL" if (is_any_any and action == "permit") else "MEDIUM"
                context_msg = "Unrestricted wildcard permit ip any any violates perimeter flow enforcement (NIST AC-4, SC-7)" if is_any_any else f"Access rule {action.upper()} {proto} {target}"

                security_rules.append(
                    CanonicalRule(
                        rule_id=f"ACL-{acl_name}-{len(security_rules)+1}",
                        rule_name=acl_name,
                        rule_type="acl",
                        action=action,
                        is_any_any=is_any_any,
                        severity_hint=sev,
                        raw_text=s,
                        context=context_msg,
                    )
                )
                continue

            # Crypto Policies (IKE / IPsec)
            if re.search(r"crypto\s+ikev1\s+policy|crypto\s+isakmp\s+policy", s, re.I):
                crypto_list.append(CanonicalCrypto(ike_version="v1"))
            elif re.search(r"encryption\s+(des|3des)\b", s, re.I):
                security_rules.append(
                    CanonicalRule(
                        rule_id="CISCO-CRYPTO-WEAK-CIPHER",
                        rule_type="crypto",
                        action="permit",
                        severity_hint="HIGH",
                        raw_text=s,
                        context="Deprecated weak encryption cipher (DES/3DES) in crypto policy — violates NIST SC-13 and FIPS 140-3",
                    )
                )
            elif re.search(r"\bhash\s+md5\b", s, re.I):
                security_rules.append(
                    CanonicalRule(
                        rule_id="CISCO-CRYPTO-MD5",
                        rule_type="crypto",
                        action="permit",
                        severity_hint="HIGH",
                        raw_text=s,
                        context="Insecure MD5 cryptographic hash in IKE policy — violates NIST SC-13 and PCI-DSS 2.2.7",
                    )
                )
            elif re.search(r"\bgroup\s+[12]\b", s, re.I):
                security_rules.append(
                    CanonicalRule(
                        rule_id="CISCO-CRYPTO-WEAK-DH",
                        rule_type="crypto",
                        action="permit",
                        severity_hint="MEDIUM",
                        raw_text=s,
                        context="Weak Diffie-Hellman group (1/2) with < 2048-bit modulus — violates NIST SC-8",
                    )
                )

        return ParsedConfig(
            vendor="cisco_ios",
            device_type="router_firewall",
            hostname=hostname,
            os_version=os_version,
            interfaces=interfaces,
            security_rules=security_rules,
            services=services,
            aaa=aaa,
            crypto=crypto_list,
            logging_servers=logging_servers,
            snmp_communities=snmp_communities,
            metadata={"total_lines": len(lines)},
        )


# Global singleton and helper function for backward compatibility
cisco_parser = CiscoIOSParser()


def parse_cisco(config: str) -> list[dict[str, Any]]:
    """Legacy helper returning flat rule list for backward compatibility."""
    parsed = cisco_parser.parse(config)
    return cisco_parser.extract_rules(parsed)


def parse_device_config(vendor: str, raw_config: str) -> list[dict[str, Any]]:
    """Universal dispatcher utilizing ParserService."""
    from backend.services.parser_service import parser_service
    parsed = parser_service.parse_config(vendor, raw_config)
    return parser_service.extract_rules(vendor, parsed)
