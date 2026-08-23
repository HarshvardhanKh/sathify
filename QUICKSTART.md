# ISL Live

Real-time Indian Sign Language accessibility pipeline. This is the
**functional core**: Text / Audio File / Live System Audio / Mock →
ASR → transcript aggregation → context buffering → language detection →
normalization → rule-based ISL gloss translation → sign resolution →
motion sequence → WebSocket → a minimal test frontend.

No polished UI, no Electron, no 3D avatar yet — see "What is real vs
placeholder" below.

## Quick start

```bash
cd isl-live/backend
uv venv --python 3.11 .venv
uv pip install --python .venv/Scripts/python.exe -r requirements.txt
.venv/Scripts/python.exe -m spacy download en_core_web_sm

.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

Then open **http://localhost:8000/** — the frontend is served by the same
process (no separate dev server needed). Type a sentence and press
**PROCESS**, or click **START (mock demo)** to see the streaming path run
against a scripted transcript.

Run the test suite:

```bash
.venv/Scripts/python.exe -m pytest tests/ -v
```

## Project layout

See `backend/app/` — organized exactly per the modular architecture
(`api/`, `core/`, `models/`, `pipeline/`, `services/{input,asr,transcript,
language,normalization,translation,signs,motion}`, `websocket/`).
`backend/data/signs/` holds the data-driven sign vocabulary (JSON, not
hardcoded in Python). `backend/scripts/` holds standalone investigation/
verification scripts (WASAPI loopback debugging, websocket smoke test).

## Known limitation: live system audio

Windows WASAPI loopback capture is isolated behind `SystemAudioInput` and
is still being debugged independently — see
`backend/scripts/step1_test_wasapi_loopback.py` and the investigation notes
in that file's docstring. It does not block the rest of the system: Text,
Mock, and Audio File input all exercise the identical downstream pipeline.
