"""Prompts package."""
from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parent

COMPLIANCE_AUDIT_PROMPT = (PROMPTS_DIR / "compliance_audit.txt").read_text(encoding="utf-8")
GAP_ANALYSIS_PROMPT = (PROMPTS_DIR / "gap_analysis.txt").read_text(encoding="utf-8")

__all__ = ["COMPLIANCE_AUDIT_PROMPT", "GAP_ANALYSIS_PROMPT", "PROMPTS_DIR"]
