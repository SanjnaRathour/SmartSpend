from crypto_util import encrypt, decrypt


def test_roundtrip():
    plaintext = "Zomato biryani order — ₹350"
    ct = encrypt(plaintext)
    assert ct != plaintext
    assert decrypt(ct) == plaintext


def test_none_passthrough():
    assert encrypt(None) is None
    assert decrypt(None) is None


def test_empty_passthrough():
    assert encrypt("") == ""
    assert decrypt("") == ""


def test_legacy_unencrypted_row():
    # If a row was stored before encryption was enabled, decrypt should return as-is
    assert decrypt("legacy plain text") == "legacy plain text"


def test_different_ciphertexts_each_time():
    ct1 = encrypt("same text")
    ct2 = encrypt("same text")
    # Fernet uses random IV → each encryption produces unique ciphertext
    assert ct1 != ct2
    assert decrypt(ct1) == decrypt(ct2) == "same text"
