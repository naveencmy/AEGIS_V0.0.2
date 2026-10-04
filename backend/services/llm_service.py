"""Local LLM service — llama.cpp / Mistral-7B with sovereign mock fallback.

Every answer must be grounded in retrieved controls.
If MOCK_LLM=true, a deterministic rule-based response is produced instead.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from backend.config import get_settings
from backend.models.framework import FrameworkControl

logger = logging.getLogger(__name__)
settings = get_settings()

_llm = None  # lazy singleton


def _get_llm():
    global _llm
    if _llm is not None:
        return _llm
    if settings.MOCK_LLM:
        return None
    try:
        from llama_cpp import Llama
        _llm = Llama(
            model_path=str(settings.LLM_MODEL_PATH),
            n_ctx=settings.LLM_N_CTX,
            n_gpu_layers=settings.LLM_N_GPU_LAYERS,
            verbose=False,
        )
        logger.info("Mistral-7B model loaded", extra={"path": str(settings.LLM_MODEL_PATH)})
    except Exception as e:
        logger.warning("LLM unavailable — sovereign rule engine active", extra={"error": str(e)})
    return _llm


# ─── Prompt templates ─────────────────────────────────────────────────────────

QUERY_PROMPT = """<s>[INST] You are AEGIS-NTRO, a sovereign AI compliance auditor. Answer ONLY using the regulatory controls provided below. Every claim must cite a control_id. If the context does not contain sufficient information, say "Insufficient regulatory context available."

REGULATORY CONTEXT:
{context}

USER QUERY: {query}

Provide a concise, accurate answer with explicit control citations (e.g., "Per NIST AC-4, ..."). [/INST]"""


AUDIT_PROMPT = """<s>[INST] You are AEGIS-NTRO. Analyse the device configuration rules below and identify non-compliance violations against the regulatory controls provided. Return ONLY a valid JSON array of finding objects.

REGULATORY CONTROLS:
{controls_context}

DEVICE CONFIGURATION RULES TO AUDIT:
{device_rules}

Return JSON array with this exact schema (no other text):
[
  {{
    "control_id": "string",
    "framework": "string",
    "severity": "CRITICAL|HIGH|MEDIUM|LOW",
    "finding_title": "string (max 100 chars)",
    "finding_description": "string",
    "device_rule_reference": "string",
    "remediation": "string",
    "citation_source": "string",
    "citation_section": "string",
    "citation_page": "string or null",
    "citation_url": "string or null",
    "confidence_score": 0.0-1.0
  }}
]
[/INST]"""


class LLMService:
    """Sovereign local LLM reasoning service."""

    async def generate_query_answer(
        self,
        query: str,
        retrieved: list[FrameworkControl],
    ) -> tuple[str, float]:
        """Generate a cited compliance answer from retrieved controls."""
        if not retrieved:
            return (
                "**No regulatory context found.** The knowledge base may not contain controls relevant to this query. "
                "Please ensure the framework data has been ingested.",
                0.0,
            )

        context = self._build_context(retrieved)

        llm = _get_llm()
        if llm is not None:
            return await self._llm_answer(llm, query, context, retrieved)

        # Sovereign rule-based fallback
        return self._rule_based_answer(query, retrieved), 0.92

    async def generate_audit_findings(
        self,
        device_rules: list[dict[str, Any]],
        retrieved_controls: list[FrameworkControl],
        vendor: str,
        frameworks: list[str],
    ) -> list[dict[str, Any]]:
        """Generate compliance findings for parsed device rules."""
        if not device_rules:
            return []

        llm = _get_llm()
        if llm is not None:
            return await self._llm_audit(llm, device_rules, retrieved_controls, vendor)

        # Sovereign deterministic fallback
        return self._deterministic_audit(device_rules, retrieved_controls, vendor, frameworks)

    # ── Private: LLM paths ────────────────────────────────────────────────────

    async def _llm_answer(self, llm, query: str, context: str, retrieved) -> tuple[str, float]:
        prompt = QUERY_PROMPT.format(context=context[:3000], query=query)
        try:
            result = llm(prompt, max_tokens=settings.LLM_MAX_TOKENS, temperature=settings.LLM_TEMPERATURE, echo=False)
            text   = result["choices"][0]["text"].strip()
            conf   = min(1.0, len(retrieved) / 5 * 0.9)
            return text, round(conf, 2)
        except Exception as e:
            logger.warning("LLM inference error", extra={"error": str(e)})
            return self._rule_based_answer(query, retrieved), 0.80

    async def _llm_audit(self, llm, device_rules, controls, vendor) -> list[dict[str, Any]]:
        controls_ctx = self._build_context(controls)
        rules_text   = "\n".join(f"- {r['rule_text']} [{r.get('rule_type','')}]" for r in device_rules[:20])
        prompt = AUDIT_PROMPT.format(controls_context=controls_ctx[:2500], device_rules=rules_text)
        try:
            result = llm(prompt, max_tokens=settings.LLM_MAX_TOKENS, temperature=0.0, echo=False)
            raw    = result["choices"][0]["text"].strip()
            # Extract JSON from response
            match  = re.search(r"\[.*\]", raw, re.DOTALL)
            if match:
                return json.loads(match.group())
        except Exception as e:
            logger.warning("LLM audit error", extra={"error": str(e)})
        return self._deterministic_audit(device_rules, controls, vendor, [])

    # ── Private: Sovereign rule-based paths ───────────────────────────────────

    def _rule_based_answer(self, query: str, retrieved: list[FrameworkControl]) -> str:
        """Deterministic answer built from retrieved control text."""
        lines = ["**Regulatory Analysis (Sovereign Rule Engine)**\n"]
        for ctrl in retrieved[:4]:
            lines.append(f"**{ctrl.control_id}** ({ctrl.framework}) — *{ctrl.title}*")
            lines.append(f"\n{ctrl.description[:400]}")
            if ctrl.guidance:
                lines.append(f"\n> **Guidance:** {ctrl.guidance[:300]}")
            lines.append("\n---")
        lines.append(
            "\n*This response is grounded in authoritative regulatory controls "
            "from the AEGIS-NTRO knowledge base. All claims are citation-backed.*"
        )
        return "\n".join(lines)

    def _deterministic_audit(
        self,
        device_rules: list[dict[str, Any]],
        controls: list[FrameworkControl],
        vendor: str,
        frameworks: list[str],
    ) -> list[dict[str, Any]]:
        """Map parser-extracted rules to nearest regulatory control via severity hint."""
        findings = []
        ctrl_by_sev = {c.severity or "MEDIUM": c for c in controls}

        # Control ID lookup patterns
        RULE_CONTROL_MAP = {
            "acl":     ("AC-4",  "Information Flow Enforcement"),
            "service": ("AC-17", "Remote Access"),
            "snmp":    ("IA-5",  "Authenticator Management"),
            "auth":    ("IA-5",  "Authenticator Management"),
            "crypto":  ("SC-8",  "Transmission Confidentiality and Integrity"),
            "nat":     ("SC-7",  "Boundary Protection"),
            "policy":  ("AC-4",  "Information Flow Enforcement"),
        }

        for rule in device_rules[:15]:  # cap at 15 findings
            rule_type = rule.get("rule_type", "acl")
            sev       = rule.get("severity_hint", "MEDIUM")
            ctrl_id, ctrl_title = RULE_CONTROL_MAP.get(rule_type, ("CM-7", "Least Functionality"))

            # Find matching control in retrieved set
            matched_ctrl = next(
                (c for c in controls if c.control_id == ctrl_id),
                controls[0] if controls else None,
            )

            framework = matched_ctrl.framework if matched_ctrl else (frameworks[0] if frameworks else "NIST_800_53_R5")
            citation_src = f"{framework.replace('_', ' ')}"

            findings.append({
                "control_id":            ctrl_id,
                "framework":             framework,
                "severity":              sev,
                "finding_title":         f"{sev.capitalize()} violation: {rule.get('context', '')[:80]}",
                "finding_description":   rule.get("context", ""),
                "device_rule_reference": rule.get("rule_text", "")[:500],
                "remediation":           matched_ctrl.guidance[:500] if matched_ctrl and matched_ctrl.guidance else
                                         f"Remediate per {ctrl_id} ({ctrl_title}) requirements.",
                "citation_source":       citation_src,
                "citation_section":      f"Control {ctrl_id}",
                "citation_page":         matched_ctrl.source_page if matched_ctrl else None,
                "citation_url":          matched_ctrl.source_url if matched_ctrl else None,
                "confidence_score":      0.88 if matched_ctrl else 0.60,
            })

        return findings

    def _build_context(self, controls: list[FrameworkControl]) -> str:
        parts = []
        for c in controls:
            parts.append(
                f"[{c.framework} | {c.control_id}] {c.title}\n"
                f"{c.description[:350]}"
                + (f"\nGuidance: {c.guidance[:200]}" if c.guidance else "")
            )
        return "\n\n".join(parts)


llm_service = LLMService()
