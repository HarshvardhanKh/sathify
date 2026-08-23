"""
TranscriptAggregator — turns a stream of overlapping ASR chunk transcripts
into one coherent growing transcript, without ever re-emitting duplicated
words.

Overlap detection strategy: token-level longest-suffix/prefix match between
the tail of what we already have and the head of the new chunk (normalized
by lowercasing + stripping punctuation for comparison, but the ORIGINAL
casing/punctuation of the new chunk is kept when appending, so the merged
text still reads naturally).

Example (matches the spec):
  existing: "Hello everyone, today we"
  new:      "today we are going to learn"
  normalized overlap = ["today", "we"] (2 tokens)
  merged:   "Hello everyone, today we are going to learn"
"""
from __future__ import annotations

import logging
import string
import time

from app.models.transcript import FinalizedSegment

logger = logging.getLogger("isl.transcript.aggregator")

_MAX_OVERLAP_TOKENS_TO_CHECK = 12


def _normalize_token(tok: str) -> str:
    return tok.lower().strip(string.punctuation)


def _tokenize(text: str) -> list[str]:
    return text.split()


def find_overlap_length(existing_tokens: list[str], new_tokens: list[str]) -> int:
    """Return how many tokens at the END of `existing_tokens` match the
    START of `new_tokens` (normalized comparison), trying the longest
    possible match first."""
    max_check = min(len(existing_tokens), len(new_tokens), _MAX_OVERLAP_TOKENS_TO_CHECK)
    for size in range(max_check, 0, -1):
        existing_tail = [_normalize_token(t) for t in existing_tokens[-size:]]
        new_head = [_normalize_token(t) for t in new_tokens[:size]]
        if existing_tail == new_head and all(existing_tail):
            return size
    return 0


def merge_with_overlap(existing_text: str, new_text: str) -> str:
    if not existing_text:
        return new_text
    if not new_text:
        return existing_text

    existing_tokens = _tokenize(existing_text)
    new_tokens = _tokenize(new_text)
    overlap = find_overlap_length(existing_tokens, new_tokens)
    merged_tokens = existing_tokens + new_tokens[overlap:]
    return " ".join(merged_tokens)


class TranscriptAggregator:
    def __init__(self) -> None:
        self._stable_transcript: str = ""       # deduplicated, finalized-so-far text
        self._partial_text: str = ""             # latest in-progress (not yet finalized) text
        self._finalized_segments: list[FinalizedSegment] = []
        self._segment_start_ts: float | None = None
        self._last_ts: float | None = None
        self._last_added_text: str = ""

    def add_partial(self, text: str, timestamp: float) -> None:
        """A partial/in-progress transcript for the current chunk — does not
        get merged into the stable transcript, just shown as a live preview."""
        text = text.strip()
        if not text:
            return
        self._partial_text = text
        self._last_ts = timestamp

    def add_final(self, text: str, timestamp: float) -> str:
        """A finalized chunk transcript — merged into the stable transcript
        via overlap detection/dedup. Returns the updated stable transcript."""
        text = text.strip()
        if not text:
            return self._stable_transcript

        if self._segment_start_ts is None:
            self._segment_start_ts = timestamp

        before = self._stable_transcript
        merged = merge_with_overlap(self._stable_transcript, text)
        added_tokens = _tokenize(merged)[len(_tokenize(before)):]
        self._last_added_text = " ".join(added_tokens)
        if added_tokens:
            logger.info("[TRANSCRIPT] +%d new token(s): %r", len(added_tokens), self._last_added_text)
        else:
            logger.info("[TRANSCRIPT] Chunk fully overlapped previous text; nothing new added")

        self._stable_transcript = merged
        self._partial_text = ""
        self._last_ts = timestamp
        return self._stable_transcript

    def get_last_added_text(self) -> str:
        """The NEW (non-overlapping) text contributed by the most recent
        add_final() call — this is what should feed the ContextBuffer, since
        the full stable transcript would double-count overlapping words."""
        return self._last_added_text

    def get_partial(self) -> str:
        """Best current preview: stable transcript + whatever partial text is in flight."""
        if not self._partial_text:
            return self._stable_transcript
        return merge_with_overlap(self._stable_transcript, self._partial_text)

    def get_current_transcript(self) -> str:
        return self._stable_transcript

    def get_finalized_segments(self) -> list[FinalizedSegment]:
        return list(self._finalized_segments)

    def flush(self) -> FinalizedSegment | None:
        """Cut a FinalizedSegment out of the stable transcript accumulated so
        far (used by ContextBuffer when it decides enough context has
        accumulated) and reset the running transcript for the next segment."""
        text = self._stable_transcript.strip()
        if not text:
            return None
        start = self._segment_start_ts if self._segment_start_ts is not None else time.time()
        end = self._last_ts if self._last_ts is not None else start
        segment = FinalizedSegment(text=text, start_timestamp=start, end_timestamp=end)
        self._finalized_segments.append(segment)
        self._stable_transcript = ""
        self._partial_text = ""
        self._segment_start_ts = None
        return segment
