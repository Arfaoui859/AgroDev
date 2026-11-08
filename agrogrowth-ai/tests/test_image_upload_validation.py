import asyncio
import io
import sys
from pathlib import Path

import pytest
from fastapi import HTTPException
from PIL import Image

AI_ROOT = Path(__file__).resolve().parents[1]
if str(AI_ROOT) not in sys.path:
    sys.path.insert(0, str(AI_ROOT))

from image_diagnosis import main as image_main


class FakeUpload:
    def __init__(self, data: bytes, content_type="image/png", filename="upload.png"):
        self.data = data
        self.content_type = content_type
        self.filename = filename
        self.requested_size = None

    async def read(self, size=-1):
        self.requested_size = size
        if size is None or size < 0:
            return self.data
        return self.data[:size]


def make_image(image_format: str) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (32, 32), (50, 130, 60)).save(
        buffer, format=image_format
    )
    return buffer.getvalue()


@pytest.mark.parametrize(
    ("image_format", "expected_mime"),
    [
        ("PNG", "image/png"),
        ("JPEG", "image/jpeg"),
    ],
)
def test_valid_images_are_accepted_and_mime_is_detected(
    image_format, expected_mime
):
    upload = FakeUpload(
        make_image(image_format),
        content_type="text/plain",  # Do not trust the client-supplied MIME.
    )

    data, detected_mime = asyncio.run(
        image_main._read_validated_image(upload)
    )

    assert data
    assert detected_mime == expected_mime


def test_text_file_disguised_as_jpeg_is_rejected():
    upload = FakeUpload(
        b"This is not an image",
        content_type="image/jpeg",
        filename="leaf.jpg",
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(image_main._read_validated_image(upload))

    assert exc.value.status_code == 400


def test_corrupted_image_is_rejected():
    upload = FakeUpload(b"\x89PNG\r\n\x1a\ncorrupted-image-data")

    with pytest.raises(HTTPException) as exc:
        asyncio.run(image_main._read_validated_image(upload))

    assert exc.value.status_code == 400


def test_empty_upload_is_rejected():
    upload = FakeUpload(b"")

    with pytest.raises(HTTPException) as exc:
        asyncio.run(image_main._read_validated_image(upload))

    assert exc.value.status_code == 400


def test_oversized_upload_is_rejected_with_bounded_read(monkeypatch):
    monkeypatch.setattr(image_main, "MAX_UPLOAD_SIZE", 16)
    upload = FakeUpload(b"x" * 100)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(image_main._read_validated_image(upload))

    assert exc.value.status_code == 413
    assert upload.requested_size == 17


def test_endpoint_preserves_upload_validation_status():
    upload = FakeUpload(
        b"not-an-image",
        content_type="image/jpeg",
        filename="fake.jpg",
    )

    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            image_main.detect_plant_disease(
                upload,
                plant_type="tomato",
            )
        )

    assert exc.value.status_code == 400
