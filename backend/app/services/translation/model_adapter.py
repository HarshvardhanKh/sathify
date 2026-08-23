"""
ModelISLTranslator adapter — the integration point for a real sentence-level
ISL translation model/checkpoint.

RESEARCH FINDING (see conversation research pass before this file was last
touched): as of this writing, NO SUITABLE LOCAL PRETRAINED MODEL WAS FOUND.
Every project with "ISL" in its name that was investigated (iSign,
ISLTranslate, CISLR, cdsteameight/ISL-SignLanguageTranslation) is either a
*recognition* system (video/pose -> label, the opposite direction from what
this pipeline needs) or a dataset with no released inference weights. A
usable English->gloss T5 checkpoint exists on Hugging Face
(t5-english-to-asl-gloss-aslg-pc12-only-v1) but targets American Sign
Language — a different, mutually-unintelligible language from ISL — so
using it and labeling the output "ISL" would be a fabrication, not a
shortcut. This adapter is therefore intentionally a documented, honest
no-op: `is_available()` returns False, and HybridISLTranslator correctly
falls through to the semantic/rule-based path every time.

This is NOT dead code — it is the exact seam a real model plugs into later
(e.g. if AI4Bharat's ASSIST project or a similar effort ships a usable
English/Hindi -> ISL-gloss checkpoint). Concrete integration goes in
`_load()`; until a checkpoint path is configured, this stays unavailable
and is never called by HybridISLTranslator.
"""
from __future__ import annotations

import logging
from pathlib import Path

from app.models.translation import ISLTranslation

logger = logging.getLogger("isl.translation.model_adapter")


class ModelISLTranslator:
    def __init__(self, checkpoint_path: str | Path | None = None, model_name: str | None = None) -> None:
        self._checkpoint_path = Path(checkpoint_path) if checkpoint_path else None
        self._model_name = model_name
        self._model = None
        self._load_attempted = False

    @property
    def model_name(self) -> str | None:
        return self._model_name

    def is_available(self) -> bool:
        if self._checkpoint_path is None:
            return False
        if not self._load_attempted:
            self._try_load()
        return self._model is not None

    def _try_load(self) -> None:
        self._load_attempted = True
        if self._checkpoint_path is None or not self._checkpoint_path.exists():
            logger.info("[TRANSLATION] No ISL model checkpoint configured/found; "
                        "ModelISLTranslator stays unavailable (see research notes "
                        "in this file's docstring).")
            return
        # Placeholder: real integration would load the checkpoint here, e.g.
        #   self._model = SomeISLModel.load(self._checkpoint_path)
        logger.warning("[TRANSLATION] Checkpoint found at %s but no loader is "
                        "implemented yet for it.", self._checkpoint_path)

    async def translate(self, text: str, source_language: str) -> ISLTranslation:
        raise NotImplementedError(
            "ModelISLTranslator has no model integrated yet; check is_available() first."
        )
