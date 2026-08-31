"""Unit tests for multi-vendor network configuration parsers."""

from backend.parsers.cisco_ios import CiscoIOSParser
from backend.parsers.palo_alto import PaloAltoParser
from backend.parsers.juniper import JuniperParser
from backend.parsers.fortinet import FortinetParser


def test_cisco_ios_parser():
    cisco_raw = """
hostname edge-asa-01
interface GigabitEthernet0/0
 nameif outside
 security-level 0
 ip address 203.0.113.1 255.255.255.0
interface GigabitEthernet0/1
 nameif inside
 security-level 100
 ip address 192.168.1.1 255.255.255.0
access-list OUTSIDE_IN extended permit ip any any
access-list DMZ_IN extended permit tcp any host 172.16.1.10 eq 443
logging enable
"""
    parser = CiscoIOSParser()
    parsed = parser.parse(cisco_raw)

    assert parsed.hostname == "edge-asa-01"
    assert parsed.vendor == "cisco"
    assert len(parsed.interfaces) == 2
    assert len(parsed.security_rules) == 2
    assert any(r.get("is_any_any") for r in parsed.security_rules)
    assert parsed.metadata.get("logging_enabled") is True

    rules = parser.extract_rules(parsed)
    assert len(rules) == 2


def test_palo_alto_parser():
    palo_raw = """<?xml version="1.0" encoding="UTF-8"?>
<config version="10.2.0">
  <devices>
    <entry name="localhost.localdomain">
      <system><hostname>pan-os-dc-fw01</hostname></system>
      <vsys>
        <entry name="vsys1">
          <zone><entry name="untrust"/><entry name="trust"/></zone>
          <rulebase>
            <security>
              <rules>
                <entry name="ALLOW_ALL">
                  <to><member>trust</member></to>
                  <from><member>untrust</member></from>
                  <source><member>any</member></source>
                  <destination><member>any</member></destination>
                  <action>allow</action>
                </entry>
              </rules>
            </security>
          </rulebase>
        </entry>
      </vsys>
    </entry>
  </devices>
</config>"""
    parser = PaloAltoParser()
    parsed = parser.parse(palo_raw)

    assert parsed.hostname == "pan-os-dc-fw01"
    assert parsed.vendor == "palo_alto"
    assert len(parsed.security_rules) == 1
    assert parsed.security_rules[0]["name"] == "ALLOW_ALL"
    assert parsed.security_rules[0]["is_any_any"] is True


def test_juniper_parser():
    juniper_raw = """
set system host-name srx-perimeter-01
set security zones security-zone untrust
set security zones security-zone trust
set security policies from-zone untrust to-zone trust policy PERMIT_ANY match source-address any
set security policies from-zone untrust to-zone trust policy PERMIT_ANY match destination-address any
set security policies from-zone untrust to-zone trust policy PERMIT_ANY match application any
set security policies from-zone untrust to-zone trust policy PERMIT_ANY then permit
"""
    parser = JuniperParser()
    parsed = parser.parse(juniper_raw)

    assert parsed.hostname == "srx-perimeter-01"
    assert parsed.vendor == "juniper"
    assert len(parsed.security_rules) == 1
    assert parsed.security_rules[0]["is_any_any"] is True


def test_fortinet_parser():
    fortinet_raw = """
config system global
    set hostname FGT-60F-Edge
end
config firewall policy
    edit 1
        set name "ALL_INBOUND"
        set srcintf "wan1"
        set dstintf "internal"
        set srcaddr "all"
        set dstaddr "all"
        set action accept
        set schedule "always"
        set service "ALL"
    next
end
"""
    parser = FortinetParser()
    parsed = parser.parse(fortinet_raw)

    assert parsed.hostname == "FGT-60F-Edge"
    assert parsed.vendor == "fortinet"
    assert len(parsed.security_rules) == 1
    assert parsed.security_rules[0]["is_any_any"] is True
