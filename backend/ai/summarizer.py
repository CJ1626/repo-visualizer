import os
import requests

from ai.cache import content_hash, get_cached, set_cached

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openrouter/free"

MOCK_SUMMARY = (
    "**[MOCK - no API key set]** This file appears to contain source code. "
    "Set OPENROUTER_API_KEY in backend/.env to enable real AI summaries."
)


def _call_openrouter(content: str) -> str:
    """
    Send content to OpenRouter and return the assistant's response text.
    If OPENROUTER_API_KEY is not set, returns a mock summary instead.
    Raises requests.HTTPError on non-2xx responses.
    """
    api_key = os.environ.get("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        return MOCK_SUMMARY

    # Truncate to 4000 chars to stay within context limits for the free model
    truncated = content[:4000]

    prompt = (
        "Explain what this code does in 3 simple sentences. "
        "Be concise and focus on purpose, not syntax.\n\n"
        f"```\n{truncated}\n```"
    )

    response = requests.post(
        OPENROUTER_API_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Repo Visualizer",
        },
        json={
            "model": MODEL,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]


def summarize(filepath: str) -> dict:
    """
    Return an AI-generated summary for the file at filepath.

    Checks the local file-based cache first; on a miss calls OpenRouter,
    stores the result, then returns it.

    Returns:
        {"summary": str, "cached": bool}

    Raises:
        Exception with a descriptive message on any failure.
    """
    try:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
    except OSError as e:
        raise Exception(f"Could not read file '{filepath}': {e}") from e

    hash_key = content_hash(content)

    cached = get_cached(hash_key)
    if cached is not None:
        return {"summary": cached["summary"], "cached": True}

    try:
        summary_text = _call_openrouter(content)
    except requests.HTTPError as e:
        raise Exception(
            f"OpenRouter API request failed ({e.response.status_code}): {e.response.text}"
        ) from e
    except requests.RequestException as e:
        raise Exception(f"Network error calling OpenRouter: {e}") from e

    set_cached(hash_key, {"summary": summary_text})
    return {"summary": summary_text, "cached": False}
