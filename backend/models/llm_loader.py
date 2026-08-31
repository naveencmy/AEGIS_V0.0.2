"""
IP-SAKTI Sahayak — LLM Loader
Triple-fallback strategy:
  1. Primary:  llama-cpp-python (loads GGUF directly, fully sovereign)
  2. Fallback: Ollama HTTP API (local Mistral via Ollama)
  3. Demo:     Returns None — chain uses mock responses
"""

import logging
from typing import Optional, Any
from pathlib import Path

import httpx

from backend.config import settings

logger = logging.getLogger("ipsakti.models.llm_loader")


class LLMLoader:
    """
    Manages LLM lifecycle with lazy loading and triple fallback.
    """

    def __init__(self):
        self._llm = None
        self._backend: str = "none"
        self._loaded: bool = False
        self._error: Optional[str] = None

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def backend(self) -> str:
        return self._backend

    def load(self) -> bool:
        """
        Attempt to load the LLM. Returns True on success.
        Tries llama-cpp-python first, then Ollama, then gives up (demo mode).
        """
        if self._loaded:
            return True

        if settings.DEMO_MODE:
            logger.info("DEMO_MODE=true — LLM loading skipped. Mock responses active.")
            self._backend = "demo"
            self._loaded = False
            return False

        # ── Strategy 1: llama-cpp-python ─────────────────────────
        model_path = Path(settings.LLM_MODEL_PATH)
        if model_path.exists() and model_path.is_file():
            try:
                from llama_cpp import Llama
                logger.info(f"Loading LLM via llama-cpp-python: {model_path.name}...")
                self._llm = Llama(
                    model_path=str(model_path),
                    n_ctx=settings.LLM_N_CTX,
                    n_threads=settings.LLM_N_THREADS,
                    n_gpu_layers=settings.LLM_N_GPU_LAYERS,
                    use_mlock=settings.LLM_USE_MLOCK,
                    seed=settings.LLM_SEED,
                    verbose=False,
                )
                self._backend = "llama_cpp"
                self._loaded = True
                logger.info(f"LLM loaded via llama-cpp-python ({model_path.name})")
                return True
            except Exception as e:
                logger.warning(f"llama-cpp-python failed: {e}")
                self._error = str(e)

        # ── Strategy 2: Ollama HTTP API ──────────────────────────
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                if resp.status_code == 200:
                    models = [m.get("name", "") for m in resp.json().get("models", [])]
                    if any(settings.OLLAMA_MODEL in m for m in models):
                        self._backend = "ollama"
                        self._loaded = True
                        logger.info(f"LLM available via Ollama: {settings.OLLAMA_MODEL}")
                        return True
                    else:
                        logger.warning(
                            f"Ollama running but model '{settings.OLLAMA_MODEL}' not found. "
                            f"Available: {models}"
                        )
        except Exception as e:
            logger.warning(f"Ollama not available: {e}")

        # ── Strategy 3: Demo fallback ────────────────────────────
        logger.warning(
            "No LLM backend available. Falling back to demo/mock mode. "
            "Responses will use pre-cached answers."
        )
        self._backend = "demo"
        self._loaded = False
        return False

    def generate(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        """
        Generate a response from the LLM.
        Returns the raw text output, or None if generation fails.
        """
        if not self._loaded:
            return None

        if self._backend == "llama_cpp":
            return self._generate_llama_cpp(system_prompt, user_prompt)
        elif self._backend == "ollama":
            return self._generate_ollama(system_prompt, user_prompt)

        return None

    def _generate_llama_cpp(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        """Generate via llama-cpp-python."""
        try:
            full_prompt = (
                f"[INST] {system_prompt}\n\n{user_prompt} [/INST]"
            )
            output = self._llm(
                full_prompt,
                max_tokens=settings.LLM_MAX_TOKENS,
                temperature=settings.LLM_TEMPERATURE,
                top_p=settings.LLM_TOP_P,
                stop=["[INST]", "</s>"],
                echo=False,
            )
            if output and output.get("choices"):
                return output["choices"][0].get("text", "").strip()
        except Exception as e:
            logger.error(f"llama-cpp-python generation error: {e}")
        return None

    def _generate_ollama(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        """Generate via Ollama HTTP API."""
        try:
            with httpx.Client(timeout=settings.LLM_TIMEOUT_SECONDS) as client:
                resp = client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": f"{system_prompt}\n\n{user_prompt}",
                        "stream": False,
                        "options": {
                            "temperature": settings.LLM_TEMPERATURE,
                            "top_p": settings.LLM_TOP_P,
                            "seed": settings.LLM_SEED,
                            "num_predict": settings.LLM_MAX_TOKENS,
                        }
                    }
                )
                if resp.status_code == 200:
                    return resp.json().get("response", "").strip()
        except Exception as e:
            logger.error(f"Ollama generation error: {e}")
        return None

    def get_status(self) -> dict[str, Any]:
        """Return LLM status for the /health endpoint."""
        return {
            "loaded": self._loaded,
            "backend": self._backend,
            "model_path": settings.LLM_MODEL_PATH if self._backend == "llama_cpp" else None,
            "ollama_model": settings.OLLAMA_MODEL if self._backend == "ollama" else None,
            "error": self._error,
        }


# Module-level singleton
llm_loader = LLMLoader()
