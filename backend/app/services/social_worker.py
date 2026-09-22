import asyncio
import logging
from typing import Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.case import Case
from app.services.reddit_listener import RedditListener

logger = logging.getLogger("civicfix.social_worker")


class SocialWorker:
    """
    Background Task Coordinator for social intake and periodic tasks.
    Manages Reddit listener task and background maintenance jobs with graceful shutdown.
    """

    def __init__(self):
        self._stop_event = asyncio.Event()
        self._tasks = []
        self._reddit_listener = RedditListener()

    async def start(self):
        """Starts background tasks."""
        self._stop_event.clear()
        logger.info("Starting SocialWorker background services...")

        # 1. Start Reddit Listener Task
        reddit_task = asyncio.create_task(
            self._reddit_listener.run_listener(self._stop_event),
            name="reddit_listener_task"
        )
        self._tasks.append(reddit_task)

        # 2. Start Periodic Location & Notification Cleaner Task
        cleaner_task = asyncio.create_task(
            self._run_maintenance_loop(),
            name="social_maintenance_task"
        )
        self._tasks.append(cleaner_task)

        logger.info(f"SocialWorker started {len(self._tasks)} background tasks.")

    async def stop(self):
        """Gracefully stops all background tasks."""
        logger.info("Stopping SocialWorker background services...")
        self._stop_event.set()

        for task in self._tasks:
            if not task.done():
                task.cancel()

        # Await completion
        await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info("SocialWorker stopped gracefully.")

    async def _run_maintenance_loop(self):
        """
        Runs periodic maintenance every 60 seconds:
        - Logs status of unresolved PENDING cases older than 48 hours.
        """
        while not self._stop_event.is_set():
            try:
                db: Session = SessionLocal()
                try:
                    cutoff = datetime.utcnow() - timedelta(hours=48)
                    stale_cases = (
                        db.query(Case)
                        .filter(
                            Case.location_status == "PENDING",
                            Case.created_at < cutoff
                        )
                        .all()
                    )
                    if stale_cases:
                        logger.info(f"SocialWorker Maintenance: Found {len(stale_cases)} stale PENDING cases awaiting location.")
                finally:
                    db.close()

                # Sleep with interruption check
                for _ in range(60):
                    if self._stop_event.is_set():
                        break
                    await asyncio.sleep(1.0)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in SocialWorker maintenance loop: {e}")
                await asyncio.sleep(10.0)


# Global singleton instance
social_worker = SocialWorker()
