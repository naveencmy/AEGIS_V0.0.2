"""Unit tests for multi-vendor network configuration parsers and canonical AST models."""

from backend.parsers.cisco_ios import CiscoIOSParser
from backend.parsers.palo_alto import PaloAltoParser
from backend.parsers.juniper import JuniperParser
from backend.parsers.fortinet import FortinetParser


def test_cisco_ios_parser():
    cisco_raw = """
hostname edge-asa-01
version 15.7
service password-encryption
aaa new-model
access-list OUTSIDE_IN extended permit ip any any
access-list DMZ_IN extended permit tcp any host 172.16.1.10 eq 443
snmp-server community public RO
line vty 0 15
 transport input ssh
 exec-timeout 10 0
"""
    parser = CiscoIOSParser()
    parsed = parser.parse(cisco_raw)

    assert parsed.hostname == "edge-asa-01"
    assert parsed.vendor == "cisco_ios"
    assert parsed.aaa.aaa_model is True
    assert parsed.aaa.password_encryption_enabled is True
    assert len(parsed.security_rules) >= 2
    assert any(r.is_any_any for r in parsed.security_rules)

    rules = parser.extract_rules(parsed)
    assert len(rules) >= 2


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
    assert parsed.security_rules[0].rule_name == "ALLOW_ALL"
    assert parsed.security_rules[0].is_any_any is True


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
    assert parsed.security_rules[0].is_any_any is True


def test_fortinet_parser():
    fortinet_raw = """
config system global
    set hostname FGT-60F-Edge
    set admin-telnet enable
end
config firewall policy
    edit 1
        set name "ALL_INBOUND"
        set srcintf "wan1"
        set dstintf "internal"
        set srcaddr "all"
        set dstaddr "all"
        set action accept
        set service "ALL"
    next
end
"""
    parser = FortinetParser()
    parsed = parser.parse(fortinet_raw)

    assert parsed.hostname == "FGT-60F-Edge"
    assert parsed.vendor == "fortinet"
    assert any(r.rule_id == "FORTI-SVC-TELNET" for r in parsed.security_rules)
    assert any(r.is_any_any for r in parsed.security_rules)
