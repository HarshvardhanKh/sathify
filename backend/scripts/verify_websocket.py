"""One-off verification: connect to /ws/live, trigger a mock pipeline run via
HTTP, and print the first N events received over the socket."""
import asyncio
import json

import httpx
import websockets


async def main():
    async with websockets.connect("ws://127.0.0.1:8000/ws/live") as ws:
        async with httpx.AsyncClient() as client:
            await client.post("http://127.0.0.1:8000/api/pipeline/start", json={"mode": "mock"})

        events = []
        try:
            for _ in range(15):
                raw = await asyncio.wait_for(ws.recv(), timeout=6.0)
                evt = json.loads(raw)
                events.append(evt["type"])
                print(f"  {evt['type']}: {json.dumps(evt['data'])[:120]}")
        except asyncio.TimeoutError:
            pass

        async with httpx.AsyncClient() as client:
            await client.post("http://127.0.0.1:8000/api/pipeline/stop")

        print(f"\nTotal events received: {len(events)}")
        print(f"Event types seen: {sorted(set(events))}")


asyncio.run(main())
