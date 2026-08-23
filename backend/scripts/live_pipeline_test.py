"""
Phase 11/22/23 live end-to-end test: starts the real system_audio pipeline,
listens on /ws/live for N seconds while real audio plays, prints every
event with a timestamp, then stops and reports measured (not estimated)
latency from PIPELINE_METRICS.
"""
import asyncio
import json
import sys
import time

import httpx
import websockets

DURATION = float(sys.argv[1]) if len(sys.argv) > 1 else 25.0


async def main():
    async with websockets.connect("ws://127.0.0.1:8000/ws/live") as ws:
        async with httpx.AsyncClient(timeout=150.0) as client:
            print(f"Starting system_audio pipeline for {DURATION:.0f}s...")
            r = await client.post("http://127.0.0.1:8000/api/pipeline/start", json={"mode": "system_audio"})
            print(f"start response: {r.json()}")

        t_start = time.time()
        events = []
        try:
            while time.time() - t_start < DURATION:
                remaining = DURATION - (time.time() - t_start)
                raw = await asyncio.wait_for(ws.recv(), timeout=max(0.1, remaining))
                evt = json.loads(raw)
                events.append(evt)
                t = time.strftime("%H:%M:%S")
                if evt["type"] in ("ASR_PARTIAL", "TRANSCRIPT_UPDATED", "TRANSCRIPT_FINAL"):
                    print(f"[{t}] {evt['type']}: {evt['data'].get('text', '')!r}")
                elif evt["type"] == "CONTEXT_READY":
                    print(f"[{t}] CONTEXT_READY ({evt['data'].get('reason')}): {evt['data'].get('text', '')!r}")
                elif evt["type"] == "ISL_TRANSLATION":
                    print(f"[{t}] ISL_TRANSLATION: {evt['data'].get('gloss_sequence')}")
                elif evt["type"] == "MOTION_SEQUENCE":
                    print(f"[{t}] MOTION_SEQUENCE: {len(evt['data'].get('items', []))} item(s), "
                          f"expression={evt['data'].get('expression')}")
                elif evt["type"] == "PIPELINE_ERROR":
                    print(f"[{t}] *** PIPELINE_ERROR: {evt['data']}")
                elif evt["type"] == "PIPELINE_METRICS":
                    pass  # summarized at the end
        except asyncio.TimeoutError:
            pass

        async with httpx.AsyncClient(timeout=150.0) as client:
            r = await client.post("http://127.0.0.1:8000/api/pipeline/stop")
            print(f"\nstop response: {r.json()}")

    print(f"\nTotal events received: {len(events)}")
    types_seen = {}
    for e in events:
        types_seen[e["type"]] = types_seen.get(e["type"], 0) + 1
    print("Event type counts:", types_seen)

    metrics_events = [e for e in events if e["type"] == "PIPELINE_METRICS"]
    if metrics_events:
        last = metrics_events[-1]["data"]
        print("\nFinal measured latency (ms, from PipelineMetrics):")
        print(json.dumps(last.get("last_run_ms", {}), indent=2))
        print("\nAverages over this run:")
        print(json.dumps(last.get("averages_ms", {}), indent=2))
    else:
        print("\nNo PIPELINE_METRICS events received — no context segment was "
              "finalized during this run (need more/clearer speech, or a longer duration).")


asyncio.run(main())
