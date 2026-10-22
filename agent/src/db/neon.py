"""Neon (Postgres) persistence layer for the Vercel serverless deployment.

The Vibe-Trading backend originally persisted to SQLite files, which do not
survive on Vercel's ephemeral filesystem. This module provides a thin
psycopg3 connection helper backed by the ``DATABASE_URL`` / ``POSTGRES_URL``
environment variables injected by the Neon integration.

Usage (serverless-safe): open a short-lived connection per operation and
close it in a ``with`` block. Do not hold connections across requests.
"""

from __future__ import annotations

import os
from contextlib import contextmanager
from typing import Iterator

import psycopg
from psycopg.rows import dict_row


def database_url() -> str:
    """Return the Neon connection string, preferring the pooled URL."""
    for key in ("DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING"):
        value = os.environ.get(key)
        if value:
            return value
    raise RuntimeError(
        "No Neon database URL found. Set DATABASE_URL or POSTGRES_URL "
        "(provided by the Neon integration)."
    )


@contextmanager
def connect() -> Iterator[psycopg.Connection]:
    """Open a short-lived psycopg3 connection to Neon.

    Yields a connection with ``dict_row`` row factory. The connection is
    always closed (and rolled back on error) when the block exits.
    """
    conn = psycopg.connect(database_url(), row_factory=dict_row)
    try:
        yield conn
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def execute(sql: str, params: tuple | None = None) -> None:
    """Run a single statement (DDL or DML) and commit."""
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
        conn.commit()


def query(sql: str, params: tuple | None = None) -> list[dict]:
    """Run a SELECT and return rows as dicts."""
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchall()
