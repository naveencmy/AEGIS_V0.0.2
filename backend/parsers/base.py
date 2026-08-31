"""Base Parser Interface and Data Structures."""

from abc import ABC, abstractmethod
from typing import Any
from pydantic import BaseModel, Field


class ParsedConfig(BaseModel):
    """Normalized parsed configuration data model."""
    vendor: str
    device_type: str = "firewall"
    hostname: str = "unknown"
    interfaces: list[dict[str, Any]] = Field(default_factory=list)
    security_rules: list[dict[str, Any]] = Field(default_factory=list)
    nat_rules: list[dict[str, Any]] = Field(default_factory=list)
    zones: list[str] = Field(default_factory=list)
    raw_sections: dict[str, str] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)


class BaseConfigParser(ABC):
    """Abstract Base Class for multi-vendor network device config parsers."""

    @abstractmethod
    def parse(self, raw_config: str) -> ParsedConfig:
        """Parse raw device configuration into normalized ParsedConfig schema."""
        pass

    @abstractmethod
    def extract_rules(self, parsed: ParsedConfig) -> list[dict[str, Any]]:
        """Extract flat security & filter rule objects for audit evaluation."""
        pass
