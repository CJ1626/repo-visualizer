import hashlib
import json
import os
import pathlib

CACHE_DIR = pathlib.Path(__file__).parent.parent / "cache"


def content_hash(content: str) -> str:
    """Return the SHA-256 hex digest of the given string."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def get_cached(hash_key: str) -> dict | None:
    """
    Read CACHE_DIR/<hash_key>.json and return the parsed dict.
    Returns None if the file does not exist or cannot be read/parsed.
    """
    cache_file = CACHE_DIR / f"{hash_key}.json"
    try:
        with open(cache_file, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return None


def set_cached(hash_key: str, data: dict) -> None:
    """
    Ensure CACHE_DIR exists, then write data as JSON to CACHE_DIR/<hash_key>.json.
    """
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / f"{hash_key}.json"
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
