import os
import hashlib
import uuid
from typing import Tuple
from fastapi import UploadFile, HTTPException
from PIL import Image
from app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB

async def save_upload_file(upload_file: UploadFile, subfolder: str = "evidence") -> Tuple[str, str, str]:
    """
    Validates, computes hash, and saves an uploaded image file.
    Returns: (relative_storage_path, original_filename, sha256_hash)
    """
    ext = os.path.splitext(upload_file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension '{ext}'. Allowed formats: JPG, PNG, WEBP."
        )

    content = await upload_file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size of 15MB.")

    # Compute SHA-256
    file_hash = hashlib.sha256(content).hexdigest()

    # Verify image integrity via PIL
    try:
        from io import BytesIO
        img = Image.open(BytesIO(content))
        img.verify()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted image file: {str(e)}")

    # Target folder
    target_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(target_dir, exist_ok=True)

    unique_filename = f"{uuid.uuid4().hex[:12]}_{file_hash[:8]}{ext}"
    full_path = os.path.join(target_dir, unique_filename)

    with open(full_path, "wb") as f:
        f.write(content)

    # Relative path for portable storage
    rel_path = f"uploads/{subfolder}/{unique_filename}"
    return rel_path, upload_file.filename, file_hash
