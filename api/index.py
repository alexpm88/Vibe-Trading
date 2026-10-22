"""Vercel serverless entry point for the Vibe-Trading FastAPI app.

Vercel's Python runtime imports this module and serves the ASGI ``app``.
The heavy ``api_server`` module is imported lazily so cold starts fail fast
with a clear message if the package is not installed.
"""

from __future__ import annotations

import os


def _load_app():
    # Ensure the agent package (installed with package-dir="agent") is on the
    # path. On Vercel the package is installed into site-packages, so this is
    # a no-op; locally it lets us run from the repo root.
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    agent_dir = os.path.join(repo_root, "agent")
    if os.path.isdir(agent_dir) and agent_dir not in os.sys.path:
        os.sys.path.insert(0, agent_dir)

    from api_server import app  # noqa: PLC0415

    return app


app = _load_app()
