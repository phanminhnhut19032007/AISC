"""VietQR Service — Generate VietQR payment codes for invoices."""
from app.core.config import settings
import urllib.parse


VIETQR_BANK_MAP = {
    "MB": "970422",
    "VCB": "970436",
    "TCB": "970407",
    "ACB": "970416",
    "BIDV": "970418",
    "VTB": "970415",
    "TPB": "970423",
    "MSB": "970426",
    "OCB": "970448",
    "SHB": "970443",
}


def generate_vietqr_content(amount: int, reference: str, description: str) -> str:
    """
    Generate VietQR EMVCo-compatible QR string.
    Format: https://img.vietqr.io/image/{bank}-{account}-compact.jpg?amount={amount}&addInfo={desc}
    Returns a URL that renders as a QR code image.
    """
    bank_code = settings.VIETQR_BANK_CODE
    account_number = settings.VIETQR_ACCOUNT_NUMBER or "0000000000"
    account_name = settings.VIETQR_ACCOUNT_NAME or "CHU TRO"

    encoded_desc = urllib.parse.quote(f"{reference} {description}"[:50])

    qr_url = (
        f"https://img.vietqr.io/image/{bank_code}-{account_number}-compact2.jpg"
        f"?amount={amount}"
        f"&addInfo={encoded_desc}"
        f"&accountName={urllib.parse.quote(account_name)}"
    )
    return qr_url


def generate_demo_vietqr(amount: int, room_number: str, month: int, year: int) -> str:
    """Convenience wrapper for demo/testing."""
    ref = f"SRRENT{room_number}T{month:02d}{str(year)[-2:]}"
    desc = f"Tien phong {room_number} T{month}/{year}"
    return generate_vietqr_content(amount=amount, reference=ref, description=desc)
