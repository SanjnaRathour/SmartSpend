"""
Field-level encryption for sensitive data at rest.
Uses Fernet (AES-128-CBC + HMAC-SHA256 authenticated encryption).
Key is loaded from ENCRYPTION_KEY env var; a dev fallback is provided but
MUST be replaced in production.
"""
import os
import base64
from cryptography.fernet import Fernet, InvalidToken

_DEFAULT_DEV_KEY = "wR5_bLx3fT8QwOq2ZfCnB1mAjKpLhDsPnTqYvXwEeUc="  # dev-only

def _get_key() -> bytes:
    key = os.getenv("ENCRYPTION_KEY", _DEFAULT_DEV_KEY)
    # Validate it's a 32-byte URL-safe b64 string
    try:
        base64.urlsafe_b64decode(key.encode())
    except Exception:
        raise RuntimeError("ENCRYPTION_KEY must be 32-byte URL-safe base64. "
                           "Generate with: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'")
    return key.encode()


_fernet = Fernet(_get_key())


def encrypt(plaintext: str | None) -> str | None:
    if plaintext is None or plaintext == "":
        return plaintext
    return _fernet.encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str | None) -> str | None:
    if ciphertext is None or ciphertext == "":
        return ciphertext
    try:
        return _fernet.decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        # Not encrypted (legacy row) — return as-is
        return ciphertext
