"""
FastAPI entrypoint. Wires together the API routers, the /ws/live websocket
endpoint, and (for zero-friction local testing) serves the minimal static
frontend directly from this same server — so `uvicorn app.main:app --reload`
plus opening http://localhost:8000/ is the entire "how to run" story.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import animations as animations_api
from app.api import classroom as classroom_api
from app.api import documents as documents_api
from app.api import dost as dost_api
from app.api import equations as equations_api
from app.api import pipeline as pipeline_api
from app.api import status as status_api
from app.api import text as text_api
from app.config import settings
from app.pipeline.manager import pipeline_manager
from app.websocket.manager import websocket_manager

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("isl.main")

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[STARTUP] ISL Live backend starting up")
    yield
    logger.info("[SHUTDOWN] Stopping pipeline if running...")
    try:
        await pipeline_manager.stop()
    except Exception as e:  # noqa: BLE001
        logger.warning("[SHUTDOWN] Error stopping pipeline: %s", e)
    logger.info("[SHUTDOWN] Done")


app = FastAPI(title="ISL Live", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pipeline_api.router)
app.include_router(status_api.router)
app.include_router(text_api.router)
app.include_router(animations_api.router)
app.include_router(dost_api.router)
app.include_router(documents_api.router)
app.include_router(equations_api.router)
app.include_router(classroom_api.router)


@app.websocket("/ws/live")
async def ws_live(websocket: WebSocket):
    await websocket_manager.handle_connection(websocket)


if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
else:
    logger.warning("[STARTUP] Frontend directory not found at %s; static UI not served", FRONTEND_DIR)
