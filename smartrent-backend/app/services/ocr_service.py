"""OCR Service — Extract meter reading from image using Google Cloud Vision API."""
import re
import base64
import httpx
from typing import Optional
from app.core.config import settings


class OCRResult:
    def __init__(self, value: float, confidence: float, raw_text: str):
        self.value = value
        self.confidence = confidence
        self.raw_text = raw_text


async def extract_meter_reading(image_bytes: bytes) -> Optional[OCRResult]:
    """
    Call Google Cloud Vision API to extract meter reading from image.
    Falls back to a mock value when credentials are not configured (for demo).
    """
    if not settings.GOOGLE_APPLICATION_CREDENTIALS:
        # ── DEMO MODE: return mock value ──
        return OCRResult(value=1234.5, confidence=0.95, raw_text="1234.5 kWh (demo)")

    try:
        encoded = base64.b64encode(image_bytes).decode("utf-8")
        payload = {
            "requests": [
                {
                    "image": {"content": encoded},
                    "features": [{"type": "TEXT_DETECTION", "maxResults": 10}],
                }
            ]
        }

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://vision.googleapis.com/v1/images:annotate?key={settings.GOOGLE_CLOUD_PROJECT}",
                json=payload,
                timeout=15.0,
            )
            resp.raise_for_status()
            data = resp.json()

        full_text: str = (
            data.get("responses", [{}])[0]
            .get("fullTextAnnotation", {})
            .get("text", "")
        )

        # Extract the largest number from the OCR text (likely the meter value)
        numbers = re.findall(r"\d+[\.,]?\d*", full_text.replace(",", "."))
        if not numbers:
            return None

        # Pick the longest numeric match as the main reading
        best = max(numbers, key=lambda x: len(x.replace(".", "")))
        value = float(best.replace(",", "."))
        confidence = 0.85  # Estimated

        return OCRResult(value=value, confidence=confidence, raw_text=full_text[:200])

    except Exception as e:
        print(f"[OCR] Error: {e}")
        return None
