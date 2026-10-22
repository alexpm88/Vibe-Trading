#!/usr/bin/env python3
"""Create the Neon (Postgres) schema for the Vibe-Trading serverless backend.

Run from the repo root:

    python scripts/migrate_neon.py

The script is idempotent: it creates tables only if they do not exist. It
uses the same ``src.db.neon`` connection helper as the application, so it
honors DATABASE_URL / POSTGRES_URL from the environment.
"""

from __future__ import annotations

import os
import sys

# Make the agent package importable when run from the repo root.
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "agent"))

from src.db.neon import execute  # noqa: E402

# Core tables backing the API stores that were migrated from SQLite.
SCHEMA: list[str] = [
    """
    CREATE TABLE IF NOT EXISTS sessions (
        id          TEXT PRIMARY KEY,
        title       TEXT NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        data        JSONB NOT NULL DEFAULT '{}'::jsonb
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS br_data (
        id          TEXT PRIMARY KEY,
        symbol      TEXT NOT NULL,
        start_date  TEXT,
        end_date    TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        data        JSONB NOT NULL DEFAULT '{}'::jsonb
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS goals (
        id          TEXT PRIMARY KEY,
        session_id  TEXT NOT NULL,
        content     TEXT NOT NULL,
        status      TEXT NOT NULL DEFAULT 'active',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS scheduled_runs (
        id          TEXT PRIMARY KEY,
        playbook    TEXT NOT NULL,
        schedule    TEXT NOT NULL,
        enabled     BOOLEAN NOT NULL DEFAULT true,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
    """,
]


def main() -> int:
    for ddl in SCHEMA:
        execute(ddl)
    print("Neon schema ready: sessions, br_data, goals, scheduled_runs")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
