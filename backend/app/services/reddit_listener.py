import os
import asyncio
import logging
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import SessionLocal
from app.services.social_intake_service import SocialIntakeService
from app.services.whatsapp_media import download_media_from_url

logger = logging.getLogger("civicfix.reddit_listener")


class RedditListener:
    """
    Asynchronous Reddit Intake Listener using PRAW.
    Monitors target subreddits for civic defect submissions and listens to inbox replies
    for follow-up location updates.
    """

    def __init__(self):
        self.client_id = settings.REDDIT_CLIENT_ID
        self.client_secret = settings.REDDIT_CLIENT_SECRET
        self.username = settings.REDDIT_USERNAME
        self.password = settings.REDDIT_PASSWORD
        self.user_agent = settings.REDDIT_USER_AGENT
        self.subreddits_str = settings.REDDIT_SUBREDDITS
        self.is_configured = bool(self.client_id and self.client_secret)
        self._reddit = None

    def get_reddit_client(self):
        """Initializes and returns authenticated PRAW instance if configured."""
        if not self.is_configured:
            return None
        if self._reddit is None:
            try:
                import praw
                self._reddit = praw.Reddit(
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    username=self.username or None,
                    password=self.password or None,
                    user_agent=self.user_agent
                )
                logger.info("PRAW Reddit client authenticated successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize PRAW client: {e}")
                self._reddit = None
        return self._reddit

    async def process_submission(self, submission, db: Session) -> Optional[dict]:
        """
        Parses a PRAW submission, downloads any attached photos, and passes to SocialIntakeService.
        """
        try:
            author_name = str(submission.author.name) if submission.author else "anonymous_redditor"
            title = submission.title or ""
            body = submission.selftext or ""
            full_text = f"{title}\n{body}".strip()
            permalink = f"https://reddit.com{submission.permalink}"
            source_id = str(submission.id)

            # Check for images in post URL or preview
            media_files: List[Tuple[str, str, str]] = []
            url = getattr(submission, "url", "")
            if url and any(url.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                try:
                    media_res = await download_media_from_url(url, filename_prefix=f"reddit_{source_id}")
                    media_files.append(media_res)
                except Exception as e:
                    logger.warning(f"Failed to download Reddit image from {url}: {e}")

            # Hand off to SocialIntakeService
            result = SocialIntakeService.ingest_submission(
                db=db,
                channel="REDDIT",
                source_id=source_id,
                username=author_name,
                text=full_text,
                media_files=media_files,
                source_url=permalink
            )

            # If automated reply is needed and reddit is authenticated, post comment
            if result.get("needs_reply") and self._reddit and result.get("reply_message"):
                try:
                    submission.reply(result["reply_message"])
                    logger.info(f"Posted automated comment on Reddit submission {source_id}")
                except Exception as e:
                    logger.warning(f"Failed to post automated comment on submission {source_id}: {e}")

            return result
        except Exception as e:
            logger.error(f"Error processing Reddit submission: {e}")
            return None

    async def process_comment_reply(self, comment, db: Session) -> Optional[dict]:
        """
        Processes replies to the bot's comments (e.g., when a user replies with a Google Maps link).
        """
        try:
            author_name = str(comment.author.name) if comment.author else "anonymous_redditor"
            # Ignore self comments
            if self.username and author_name.lower() == self.username.lower():
                return None

            body = comment.body or ""
            parent_id = str(comment.parent_id)  # e.g., t3_abc123 (submission) or t1_xyz (comment)
            source_id = str(comment.link_id).replace("t3_", "") if hasattr(comment, "link_id") else parent_id.replace("t3_", "")

            result = SocialIntakeService.ingest_followup(
                db=db,
                channel="REDDIT",
                source_id=source_id,
                username=author_name,
                text=body
            )

            if result.get("needs_reply") and self._reddit and result.get("reply_message"):
                try:
                    comment.reply(result["reply_message"])
                    logger.info(f"Replied to follow-up comment by u/{author_name}")
                except Exception as e:
                    logger.warning(f"Failed to reply to comment by u/{author_name}: {e}")

            return result
        except Exception as e:
            logger.error(f"Error processing Reddit comment reply: {e}")
            return None

    async def run_listener(self, stop_event: asyncio.Event):
        """
        Main asynchronous listener loop. Runs in background tasks during FastAPI lifespan.
        Streams submissions and inbox messages concurrently without blocking the main event loop.
        """
        if not self.is_configured:
            logger.info("Reddit credentials not configured in environment. Reddit listener running in standby.")
            while not stop_event.is_set():
                await asyncio.sleep(5.0)
            return

        reddit = self.get_reddit_client()
        if not reddit:
            return

        subreddits = reddit.subreddit(self.subreddits_str.replace(",", "+"))
        logger.info(f"Reddit listener actively streaming subreddits: r/{self.subreddits_str}")

        loop = asyncio.get_running_loop()

        while not stop_event.is_set():
            try:
                # Run polling in thread executor to prevent blocking async event loop
                def poll_batch():
                    items = []
                    try:
                        # Grab recent new submissions
                        for sub in subreddits.new(limit=5):
                            items.append(("submission", sub))
                    except Exception as e:
                        logger.warning(f"Error polling subreddit: {e}")
                    return items

                items = await loop.run_in_executor(None, poll_batch)
                
                db = SessionLocal()
                try:
                    for item_type, obj in items:
                        if item_type == "submission":
                            await self.process_submission(obj, db)
                finally:
                    db.close()

                # Sleep before next poll or check stop event
                for _ in range(10):
                    if stop_event.is_set():
                        break
                    await asyncio.sleep(1.0)

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in Reddit listener loop: {e}")
                await asyncio.sleep(5.0)

        logger.info("Reddit listener terminated gracefully.")
