"""Parser Service for dispatching vendor-specific configuration parsing."""

from typing import Any
from backend.parsers.base import BaseConfigParser, ParsedConfig
from backend.parsers.cisco_ios import CiscoIOSParser
from backend.parsers.palo_alto import PaloAltoParser
from backend.parsers.juniper import JuniperParser
from backend.parsers.fortinet import FortinetParser


class ParserService:
    """Service to parse network configurations across all supported vendors."""

    def __init__(self) -> None:
        self._parsers: dict[str, BaseConfigParser] = {
            "cisco": CiscoIOSParser(),
            "cisco_ios": CiscoIOSParser(),
            "cisco_asa": CiscoIOSParser(),
            "palo_alto": PaloAltoParser(),
            "paloalto": PaloAltoParser(),
            "pan_os": PaloAltoParser(),
            "juniper": JuniperParser(),
            "junos": JuniperParser(),
            "fortinet": FortinetParser(),
            "fortios": FortinetParser(),
        }

    def get_parser(self, vendor: str) -> BaseConfigParser:
        normalized_vendor = vendor.lower().strip().replace("-", "_")
        if normalized_vendor not in self._parsers:
            # Default to Cisco IOS parser if vendor is ambiguous
            return self._parsers["cisco"]
        return self._parsers[normalized_vendor]

    def parse_config(self, vendor: str, raw_config: str) -> ParsedConfig:
        parser = self.get_parser(vendor)
        return parser.parse(raw_config)

    def extract_rules(self, vendor: str, parsed: ParsedConfig) -> list[dict[str, Any]]:
        parser = self.get_parser(vendor)
        return parser.extract_rules(parsed)


parser_service = ParserService()
