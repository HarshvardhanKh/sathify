"""
RuleBasedISLTranslator — the "semantic_hybrid" strategy (see research notes
in model_adapter.py: no downloadable pretrained English/Hindi -> ISL-gloss
model exists anywhere, verified before writing this file — this IS the
primary translation strategy, not a stopgap).

For English, uses spaCy's dependency parse + NER to pull out a structured
semantic representation across the categories called out as required:
GREETING, TIME, SUBJECT, LOCATION, NAMED_ENTITY, NUMBER, OBJECT/CONCEPT,
ACTION, NEGATION, QUESTION — then renders it as a gloss sequence in a fixed
canonical order approximating ISL's topic-fronted, wh-final tendencies.
This does not claim to be linguistically verified ISL grammar — see
`translation_method`, `confidence_type`, and `warnings` on the result.

For Hindi, no dependency parser is wired up yet (spaCy ships no official
Hindi pipeline), so this falls back to simple content-word extraction
(stopword removal only, order preserved), with confidence and warnings
reflecting that honestly. Both paths sit behind BaseISLTranslator so a real
model can replace either without touching anything downstream.
"""
from __future__ import annotations

import asyncio
import logging
import re
from functools import lru_cache

import spacy
from spacy.language import Language
from spacy.tokens import Doc

from app.models.translation import ISLTranslation, SemanticUnit
from app.services.translation.base import BaseISLTranslator

logger = logging.getLogger("isl.translation.rule_based")

_TIME_KEYWORDS = {
    "today", "tomorrow", "yesterday", "now", "later", "tonight",
    "morning", "evening", "afternoon", "night", "soon", "yet",
}
_LOCATIVE_PREPS = {"in", "at", "to", "near", "inside", "outside", "on", "into"}
_PRONOUN_GLOSS = {
    "i": "I", "me": "I", "we": "WE", "us": "WE", "you": "YOU",
    "he": "HE", "him": "HE", "she": "SHE", "her": "SHE",
    "they": "THEY", "them": "THEY", "it": "IT",
}
_WH_TAGS = {"WP", "WP$", "WRB", "WDT"}
_NAMED_ENTITY_LABELS = {
    "PERSON", "ORG", "GPE", "NORP", "FAC", "PRODUCT", "EVENT", "WORK_OF_ART", "LAW", "LANGUAGE",
}
_NUMBER_ENT_LABELS = {"CARDINAL", "QUANTITY"}

_HINDI_STOPWORDS = {
    "है", "हैं", "था", "थे", "थी", "को", "के", "की", "का", "में", "से", "पर",
    "और", "एक", "यह", "वह", "हम", "तुम", "आप", "ने", "भी", "ही", "तो",
}


def _gloss(text: str) -> str:
    """Uppercase, underscore-joined gloss token. Unicode-aware (\\w, not
    A-Za-z0-9 only) so non-Latin scripts (e.g. Devanagari for the Hindi
    fallback) aren't silently stripped to an empty string — a real bug this
    fixed: the ASCII-only version turned every Hindi token into ''."""
    return re.sub(r"[^\w]+", "_", text.strip(), flags=re.UNICODE).strip("_").upper()


@lru_cache(maxsize=1)
def _load_spacy_model() -> Language:
    logger.info("[TRANSLATION] Loading spaCy en_core_web_sm model...")
    return spacy.load("en_core_web_sm")


class _EnglishSemanticExtractor:
    """Pulls SemanticUnits out of a spaCy dependency parse + NER."""

    def extract(self, text: str) -> tuple[list[SemanticUnit], list[str]]:
        nlp = _load_spacy_model()
        doc = nlp(text)

        consumed: set[int] = set()
        units: list[SemanticUnit] = []

        # Order matters: entities/concepts/greetings/wh-words claim their
        # tokens before the generic role extractors run, so e.g. "Steve
        # Jobs" becomes one NAMED_ENTITY instead of a dropped/split token.
        self._extract_named_entities(doc, units, consumed)
        self._extract_concepts(doc, units, consumed)
        self._extract_greeting(doc, units, consumed)
        wh_found = self._extract_question_wh(doc, units, consumed)
        self._extract_time(doc, units, consumed)
        self._extract_subject(doc, units, consumed)
        self._extract_location(doc, units, consumed)
        self._extract_number(doc, units, consumed)
        self._extract_object(doc, units, consumed)
        self._extract_action(doc, units, consumed)
        self._extract_negation(doc, units, consumed)
        if not wh_found and text.rstrip().endswith("?"):
            # Yes/no question with no wh-word: ISL marks this with a
            # non-manual signal (raised eyebrows/head tilt) we can't express
            # in gloss text, so emit an explicit question-marker token.
            units.append(SemanticUnit(type="QUESTION", value="Q", source_tokens=[]))

        unknown = self._find_unknown(doc, consumed)
        return units, unknown

    @staticmethod
    def _extract_named_entities(doc: Doc, units: list[SemanticUnit], consumed: set[int]) -> None:
        """Real NER spans (PERSON/ORG/GPE/...) become ONE NAMED_ENTITY unit
        each, so multi-word names ('Steve Jobs') aren't dropped or split —
        each is later fingerspelled as a unit by SignResolver if unknown."""
        for ent in doc.ents:
            if ent.label_ not in _NAMED_ENTITY_LABELS:
                continue
            tokens = [t for t in ent if not t.is_punct]
            if not tokens or any(t.i in consumed for t in tokens):
                continue
            value = _gloss(" ".join(t.text for t in tokens))
            units.append(SemanticUnit(type="NAMED_ENTITY", value=value,
                                       source_tokens=[t.text for t in tokens]))
            consumed.update(t.i for t in tokens)

    @staticmethod
    def _extract_concepts(doc: Doc, units: list[SemanticUnit], consumed: set[int]) -> None:
        """Multi-word technical noun phrases ('artificial intelligence',
        'machine learning', 'computer science') become a single CONCEPT unit
        rather than being split token by token."""
        for chunk in doc.noun_chunks:
            content_tokens = [t for t in chunk if not t.is_stop and t.pos_ in ("NOUN", "PROPN", "ADJ")]
            if len(content_tokens) < 2:
                continue
            if any(t.i in consumed for t in content_tokens):
                continue
            value = _gloss(" ".join(t.text for t in content_tokens))
            units.append(SemanticUnit(type="CONCEPT", value=value,
                                       source_tokens=[t.text for t in content_tokens]))
            consumed.update(t.i for t in content_tokens)

    @staticmethod
    def _extract_greeting(doc: Doc, units: list[SemanticUnit], consumed: set[int]) -> None:
        """Interjections ('Hello', 'Hi', 'Hey') plus, heuristically, the word
        immediately following them ('everyone', 'guys') as the addressee —
        spaCy attaches both directly to the main clause's ROOT so they can't
        be told apart from other npadvmod children by dependency alone."""
        for token in doc:
            if token.i in consumed or token.pos_ != "INTJ":
                continue
            units.append(SemanticUnit(type="GREETING", value=_gloss(token.text), source_tokens=[token.text]))
            consumed.add(token.i)

            next_tok = doc[token.i + 1] if token.i + 1 < len(doc) else None
            if (
                next_tok is not None
                and next_tok.i not in consumed
                and not next_tok.is_punct
                and next_tok.lemma_.lower() not in _TIME_KEYWORDS
                and next_tok.pos_ in ("PRON", "NOUN", "PROPN")
            ):
                units.append(SemanticUnit(type="GREETING", value=_gloss(next_tok.text), source_tokens=[next_tok.text]))
                consumed.add(next_tok.i)

    @staticmethod
    def _extract_question_wh(doc: Doc, units: list[SemanticUnit], consumed: set[int]) -> bool:
        """Wh-words (what/who/where/when/why/how/which) become an explicit
        QUESTION unit, claimed before SUBJECT/OBJECT would otherwise grab
        them as an ordinary pronoun."""
        found = False
        for token in doc:
            if token.i in consumed or token.tag_ not in _WH_TAGS:
                continue
            units.append(SemanticUnit(type="QUESTION", value=_gloss(token.text), source_tokens=[token.text]))
            consumed.add(token.i)
            found = True
        return found

    @staticmethod
    def _extract_time(doc: Doc, units: list[SemanticUnit], consumed: set[int]) -> None:
        for token in doc:
            if token.i in consumed:
                continue
            is_time = token.ent_type_ in ("DATE", "TIME") or token.lemma_.lower() in _TIME_KEYWORDS
            if is_time:
                units.append(SemanticUnit(type="TIME", value=_gloss(token.text), source_tokens=[token.text]))
                consumed.add(token.i)

    @staticmethod
    def _extract_subject(doc: Doc, units: list[SemanticUnit], consumed: set[int]) -> None:
        for token in doc:
            if token.i in consumed:
                continue
            if token.dep_ in ("nsubj", "nsubjpass"):
                gloss = _PRONOUN_GLOSS.get(token.text.lower(), _gloss(token.lemma_))
                units.append(SemanticUnit(type="SUBJECT", value=gloss, source_tokens=[token.text]))
                consumed.add(token.i)

    @staticmethod
    def _extract_location(doc: Doc, units: list[SemanticUnit], consumed: set[int]) -> None:
        for token in doc:
            if token.i in consumed:
                continue
            if token.dep_ == "pobj" and token.head.dep_ == "prep" and token.head.text.lower() in _LOCATIVE_PREPS:
                if token.ent_type_ in ("GPE", "LOC", "FAC", "ORG") or token.pos_ in ("NOUN", "PROPN"):
                    units.append(SemanticUnit(type="LOCATION", value=_gloss(token.text), source_tokens=[token.text]))
                    consumed.add(token.i)
                    consumed.add(token.head.i)

    @staticmethod
    def _extract_number(doc: Doc, units: list[SemanticUnit], consumed: set[int]) -> None:
        for token in doc:
            if token.i in consumed:
                continue
            if token.like_num or token.ent_type_ in _NUMBER_ENT_LABELS:
                units.append(SemanticUnit(type="NUMBER", value=_gloss(token.text), source_tokens=[token.text]))
                consumed.add(token.i)

    @staticmethod
    def _extract_object(doc: Doc, units: list[SemanticUnit], consumed: set[int]) -> None:
        for token in doc:
            if token.i in consumed:
                continue
            if token.dep_ in ("dobj", "attr", "oprd") and token.pos_ in ("NOUN", "PROPN"):
                units.append(SemanticUnit(type="OBJECT", value=_gloss(token.text), source_tokens=[token.text]))
                consumed.add(token.i)

    @staticmethod
    def _extract_action(doc: Doc, units: list[SemanticUnit], consumed: set[int]) -> None:
        root = next((t for t in doc if t.dep_ == "ROOT"), None)
        if root is None:
            return
        verb = root if root.pos_ == "VERB" else next(
            (c for c in root.children if c.pos_ == "VERB"), None
        )
        if verb is None:
            return
        # Periphrastic constructions ("going to learn", "want to study"): the
        # ROOT is a semantically light verb and the real action is its xcomp
        # infinitive — prefer that.
        xcomp_verb = next((c for c in verb.children if c.dep_ == "xcomp" and c.pos_ == "VERB"), None)
        if xcomp_verb is not None:
            verb = xcomp_verb
        if verb.i in consumed:
            return
        units.append(SemanticUnit(type="ACTION", value=_gloss(verb.lemma_), source_tokens=[verb.text]))
        consumed.add(verb.i)

    @staticmethod
    def _extract_negation(doc: Doc, units: list[SemanticUnit], consumed: set[int]) -> None:
        for token in doc:
            if token.i in consumed:
                continue
            if token.dep_ == "neg":
                units.append(SemanticUnit(type="NEGATION", value="NOT", source_tokens=[token.text]))
                consumed.add(token.i)

    @staticmethod
    def _find_unknown(doc: Doc, consumed: set[int]) -> list[str]:
        unknown = []
        for token in doc:
            if token.i in consumed or token.is_stop or token.is_punct or token.is_space:
                continue
            if token.pos_ in ("NOUN", "PROPN", "VERB", "ADJ"):
                unknown.append(token.text)
        return unknown


# TIME/SUBJECT front the clause (topic), NAMED_ENTITY/NUMBER/OBJECT/CONCEPT
# form the comment, ACTION and NEGATION follow the predicate, QUESTION
# (wh-word or "Q" marker) goes clause-final — a common ISL question-formation
# pattern. This is a fixed heuristic, not verified ISL syntax.
_CANONICAL_ORDER = [
    "GREETING", "TIME", "SUBJECT", "LOCATION", "NAMED_ENTITY", "NUMBER",
    "OBJECT", "CONCEPT", "ACTION", "NEGATION", "MODIFIER", "OTHER", "QUESTION",
]


def _units_to_gloss_sequence(units: list[SemanticUnit]) -> list[str]:
    order_index = {t: i for i, t in enumerate(_CANONICAL_ORDER)}
    ordered = sorted(units, key=lambda u: order_index.get(u.type, len(_CANONICAL_ORDER)))
    return [u.value for u in ordered]


class RuleBasedISLTranslator(BaseISLTranslator):
    async def translate(self, text: str, source_language: str) -> ISLTranslation:
        text = text.strip()
        if not text:
            return ISLTranslation(
                source_text=text, normalized_text=text, source_language=source_language,
                translation_method="semantic_hybrid", model_name=None, model_available=False,
                fallback_used=True, confidence=0.0, confidence_type="heuristic",
                warnings=["Empty input text."],
            )

        if source_language == "hi":
            return await asyncio.to_thread(self._translate_hindi_fallback, text, source_language)
        return await asyncio.to_thread(self._translate_english, text, source_language)

    def _translate_english(self, text: str, source_language: str) -> ISLTranslation:
        extractor = _EnglishSemanticExtractor()
        units, unknown = extractor.extract(text)
        gloss_sequence = _units_to_gloss_sequence(units)
        return ISLTranslation(
            source_text=text,
            normalized_text=text,
            source_language=source_language,
            semantic_units=units,
            gloss_sequence=gloss_sequence,
            unknown_words=unknown,
            translation_method="semantic_hybrid",
            model_name=None,
            model_available=False,
            fallback_used=True,
            confidence=0.45 if gloss_sequence else 0.1,
            confidence_type="heuristic",
            warnings=[
                "This is an approximate ISL gloss representation.",
                "Word order follows a fixed heuristic (see canonical order in "
                "rule_based.py), not verified ISL grammar.",
                "No pretrained English/Hindi -> ISL-gloss model exists locally or "
                "publicly as of this research pass (see model_adapter.py).",
            ],
        )

    def _translate_hindi_fallback(self, text: str, source_language: str) -> ISLTranslation:
        # Deliberately does NOT run tokens through _gloss(): that function's
        # underscore-joining regex is built for merging multi-word English
        # phrases and fragments Devanagari conjuncts (vowel signs / virama
        # are not \w in Python's re), e.g. "आर्टिफिशियल" -> "आर_ट_फ_श_यल".
        # Hindi content words don't need that joining, so they're kept intact
        # (just strip surrounding punctuation).
        tokens = [t for t in re.split(r"\s+", text) if t]
        content_tokens = []
        for tok in tokens:
            stripped = tok.strip("।.,!?\"'()[]")
            if stripped and stripped not in _HINDI_STOPWORDS:
                content_tokens.append(stripped)
        units = [SemanticUnit(type="OTHER", value=t, source_tokens=[t]) for t in content_tokens]
        gloss_sequence = [u.value for u in units]
        return ISLTranslation(
            source_text=text,
            normalized_text=text,
            source_language=source_language,
            semantic_units=units,
            gloss_sequence=gloss_sequence,
            unknown_words=[],
            translation_method="rule_based_fallback",
            model_name=None,
            model_available=False,
            fallback_used=True,
            confidence=0.2,
            confidence_type="heuristic",
            warnings=[
                "Hindi rule-based translation is a minimal placeholder: stopword "
                "removal only, no dependency parsing or grammar restructuring yet.",
                "Do not treat this as linguistically correct ISL.",
            ],
        )
