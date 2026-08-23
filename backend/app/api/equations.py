"""POST /api/equations/explain — explains a selected part of an equation.
Structure/navigation itself is computed client-side by a real parser (not
Gemini-dependent, per the master prompt's explicit rule); this endpoint is
only for the optional "Enter -> explain" step."""
from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.ai.gemini_client import gemini_client

router = APIRouter(tags=["equations"])

_SYSTEM_PROMPT = (
    "You explain parts of mathematical equations to students in simple, clear language. "
    "Given the full equation and a specific selected part of it, explain what that part "
    "means and why it's there, in 1-3 sentences. Do not restate the whole equation."
)


class ExplainRequest(BaseModel):
    full_latex: str
    selected_part: str
    age: int = 16


class ExplainResponse(BaseModel):
    explanation: str
    available: bool = True


@router.post("/api/equations/explain", response_model=ExplainResponse)
async def explain_equation_part(req: ExplainRequest):
    message = (
        f"Full equation: {req.full_latex}\nSelected part: {req.selected_part}\n"
        f"Student age: {req.age}"
    )
    result = await gemini_client.generate(_SYSTEM_PROMPT, message)
    if not result.ok:
        return ExplainResponse(
            explanation=f"Explanation unavailable (no working Gemini key): the selected part is {req.selected_part!r}.",
            available=False,
        )
    return ExplainResponse(explanation=result.text or "", available=True)
