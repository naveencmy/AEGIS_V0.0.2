"""PostgreSQL-native Background Job Queue using FOR UPDATE SKIP LOCKED."""

import asyncio
import os
import uuid
from typing import Any, Callable, Coroutine
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.config import get_settings
from backend.core.logging import logger
from backend.models.database import AsyncSessionLocal
from backend.models.queue import JobQueue

settings = get_settings()


class QueueService:
    """PostgreSQL-native transaction-safe Job Queue."""

    def __init__(self) -> None:
        self.worker_id = f"worker-{os.getpid()}-{uuid.uuid4().hex[:6]}"
        self._handlers: dict[str, Callable[[dict[str, Any], AsyncSession], Coroutine[Any, Any, None]]] = {}
        self._running = False
        self._task: asyncio.Task | None = None

    def register_handler(
        self,
        job_type: str,
        handler: Callable[[dict[str, Any], AsyncSession], Coroutine[Any, Any, None]],
    ) -> None:
        """Register async processor for specific job_type."""
        self._handlers[job_type] = handler

    async def enqueue(
        self,
        db: AsyncSession,
        job_type: str,
        payload: dict[str, Any],
    ) -> int:
        """Enqueue a new job with row-level transaction safety."""
        sql = text("""
            INSERT INTO job_queue (job_type, payload, status, created_at)
            VALUES (:job_type, CAST(:payload AS jsonb), 'pending', NOW())
            RETURNING id
        """)
        import json
        res = await db.execute(sql, {"job_type": job_type, "payload": json.dumps(payload)})
        job_id = res.scalar_one()
        await db.commit()
        logger.info("Enqueued job", job_id=job_id, job_type=job_type)
        return job_id

    async def dequeue(self, db: AsyncSession) -> dict[str, Any] | None:
        """Dequeue highest priority pending job using FOR UPDATE SKIP LOCKED."""
        select_sql = text("""
            SELECT id, job_type, payload, attempts, max_attempts
            FROM job_queue
            WHERE status = 'pending'
            ORDER BY created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        """)
        res = await db.execute(select_sql)
        row = res.fetchone()
        if not row:
            return None

        job_id, job_type, payload, attempts, max_attempts = row

        update_sql = text("""
            UPDATE job_queue
            SET status = 'processing',
                locked_by = :worker_id,
                locked_at = NOW(),
                attempts = attempts + 1
            WHERE id = :id
        """)
        await db.execute(update_sql, {"worker_id": self.worker_id, "id": job_id})
        await db.commit()

        return {
            "id": job_id,
            "job_type": job_type,
            "payload": payload if isinstance(payload, dict) else {},
            "attempts": attempts + 1,
            "max_attempts": max_attempts,
        }

    async def complete_job(self, db: AsyncSession, job_id: int) -> None:
        sql = text("""
            UPDATE job_queue
            SET status = 'completed',
                processed_at = NOW()
            WHERE id = :id
        """)
        await db.execute(sql, {"id": job_id})
        await db.commit()
        logger.info("Job marked completed", job_id=job_id)

    async def fail_job(self, db: AsyncSession, job_id: int, error_msg: str) -> None:
        sql = text("""
            UPDATE job_queue
            SET status = 'failed',
                processed_at = NOW(),
                payload = jsonb_set(payload, '{error}', to_jsonb(:error::text), true)
            WHERE id = :id
        """)
        await db.execute(sql, {"id": job_id, "error": error_msg})
        await db.commit()
        logger.error("Job marked failed", job_id=job_id, error=error_msg)

    async def _worker_loop(self) -> None:
        logger.info("Starting PostgreSQL Job Queue worker loop", worker_id=self.worker_id)
        while self._running:
            try:
                async with AsyncSessionLocal() as session:
                    job = await self.dequeue(session)
                    if job:
                        job_id = job["id"]
                        job_type = job["job_type"]
                        payload = job["payload"]
                        handler = self._handlers.get(job_type)

                        if handler:
                            try:
                                logger.info("Processing background job", job_id=job_id, job_type=job_type)
                                await handler(payload, session)
                                await self.complete_job(session, job_id)
                            except Exception as e:
                                logger.error("Worker failed processing job", job_id=job_id, error=str(e))
                                await self.fail_job(session, job_id, str(e))
                        else:
                            logger.warn("No handler registered for job type", job_type=job_type)
                            await self.fail_job(session, job_id, f"No handler registered for {job_type}")
                    else:
                        await asyncio.sleep(settings.WORKER_POLL_INTERVAL_SECONDS)
            except Exception as e:
                logger.error("Error in queue worker iteration", error=str(e))
                await asyncio.sleep(settings.WORKER_POLL_INTERVAL_SECONDS)

    def start_worker(self) -> None:
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._worker_loop())

    def stop_worker(self) -> None:
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()


queue_service = QueueService()
