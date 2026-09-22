import logging
import httpx
from typing import Tuple, Optional
from app.services.storage_service import save_raw_bytes
from app.core.config import settings

logger = logging.getLogger("civicfix.whatsapp_media")

async def download_meta_whatsapp_media(
    media_id: str,
    access_token: Optional[str] = None,
    subfolder: str = "social_ingest"
) -> Tuple[str, str, str]:
    """
    Downloads media from Meta WhatsApp Cloud API via two-step resolution:
    1. Query https://graph.facebook.com/v20.0/{media_id} with Bearer token to get media URL and mime type.
    2. Download binary payload and save via storage_service.save_raw_bytes.
    
    Returns: (relative_storage_path, original_filename, sha256_hash)
    """
    token = access_token or settings.WHATSAPP_ACCESS_TOKEN
    if not token:
        raise ValueError("Meta WhatsApp access token is missing or not configured.")

    async with httpx.AsyncClient() as client:
        # Step 1: Get media metadata
        meta_url = f"https://graph.facebook.com/v20.0/{media_id}"
        headers = {"Authorization": f"Bearer {token}"}
        resp = await client.get(meta_url, headers=headers, timeout=10.0)
        if resp.status_code != 200:
            logger.error(f"Failed to fetch Meta media metadata for {media_id}: {resp.status_code} {resp.text}")
            raise RuntimeError(f"Meta Graph API media lookup failed: {resp.status_code}")

        data = resp.json()
        download_url = data.get("url")
        mime_type = data.get("mime_type", "image/jpeg")

        if not download_url:
            raise RuntimeError("Meta Graph API response did not contain a download URL.")

        # Step 2: Download raw binary
        media_resp = await client.get(download_url, headers=headers, timeout=20.0)
        if media_resp.status_code != 200:
            logger.error(f"Failed to download binary from {download_url}: {media_resp.status_code}")
            raise RuntimeError(f"Media binary download failed: {media_resp.status_code}")

        content = media_resp.content

    # Determine filename extension
    ext = ".jpg"
    if "png" in mime_type:
        ext = ".png"
    elif "webp" in mime_type:
        ext = ".webp"

    filename = f"whatsapp_{media_id}{ext}"
    return save_raw_bytes(content=content, orig_filename=filename, subfolder=subfolder)


async def download_media_from_url(
    url: str,
    auth_header: Optional[str] = None,
    filename_prefix: str = "media",
    subfolder: str = "social_ingest"
) -> Tuple[str, str, str]:
    """
    Downloads media binary from a public or authenticated URL (e.g. Twilio MediaUrl, Reddit CDN).
    
    Returns: (relative_storage_path, original_filename, sha256_hash)
    """
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header

    async with httpx.AsyncClient(follow_redirects=True) as client:
        resp = await client.get(url, headers=headers, timeout=20.0)
        if resp.status_code != 200:
            logger.error(f"Failed to download media from URL {url}: {resp.status_code}")
            raise RuntimeError(f"Media URL download failed with status {resp.status_code}")

        content = resp.content
        content_type = resp.headers.get("content-type", "image/jpeg").lower()

    ext = ".jpg"
    if "png" in content_type or url.lower().endswith(".png"):
        ext = ".png"
    elif "webp" in content_type or url.lower().endswith(".webp"):
        ext = ".webp"

    filename = f"{filename_prefix}_{abs(hash(url)) % 1000000}{ext}"
    return save_raw_bytes(content=content, orig_filename=filename, subfolder=subfolder)
