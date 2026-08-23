"""Listen on /ws/live for N seconds against an ALREADY-RUNNING pipeline
(does not start/stop it) — used here to sample the small-model transcript
quality without re-triggering another cold model load."""
import asyncio
import json
import sys
import time

import websockets

DURATION = float(sys.argv[1]) if len(sys.argv) > 1 else 15.0


async def main():
    async with websockets.connect("ws://127.0.0.1:8000/ws/live") as ws:
        t_start = time.time()
        try:
            while time.time() - t_start < DURATION:
                remaining = DURATION - (time.time() - t_start)
                raw = await asyncio.wait_for(ws.recv(), timeout=max(0.1, remaining))
                evt = json.loads(raw)
                if evt["type"] == "CONTEXT_READY":
                    print(f"CONTEXT_READY: {evt['data'].get('text', '')!r}")
                elif evt["type"] == "ISL_TRANSLATION":
                    print(f"  -> gloss: {evt['data'].get('gloss_sequence')}")
                elif evt["type"] == "PIPELINE_METRICS":
                    last = evt["data"].get("last_run_ms", {})
                    print(f"  [metrics] asr={last.get('asr'):.1f}ms translation={last.get('translation'):.2f}ms")
        except asyncio.TimeoutError:
            pass


asyncio.run(main())
