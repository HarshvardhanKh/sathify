"""One-off verification: connect to /ws/live, trigger text processing, and
confirm MOTION_SEQUENCE + AVATAR_SEQUENCE_READY both arrive with
animation_id/expression populated."""
import asyncio
import json

import httpx
import websockets


async def main():
    async with websockets.connect("ws://127.0.0.1:8000/ws/live") as ws:
        async with httpx.AsyncClient() as client:
            await client.post("http://127.0.0.1:8000/api/text/process", json={
                "text": "What is your name?", "language": "auto",
            })

        seen = []
        try:
            for _ in range(20):
                raw = await asyncio.wait_for(ws.recv(), timeout=5.0)
                evt = json.loads(raw)
                seen.append(evt["type"])
                if evt["type"] in ("MOTION_SEQUENCE", "AVATAR_SEQUENCE_READY"):
                    print(f"{evt['type']}: expression={evt['data'].get('expression')} "
                          f"items={[(i['sign_id'], i['animation_id']) for i in evt['data'].get('items', [])]}")
        except asyncio.TimeoutError:
            pass
        print("\nEvent types seen:", seen)
        assert "MOTION_SEQUENCE" in seen, "MOTION_SEQUENCE missing!"
        assert "AVATAR_SEQUENCE_READY" in seen, "AVATAR_SEQUENCE_READY missing!"
        print("OK: both motion events present")


asyncio.run(main())
