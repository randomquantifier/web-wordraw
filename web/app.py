#!/usr/bin/env python3
"""Flask backend for wordraw (answers-only)."""

from __future__ import annotations

from pathlib import Path
from typing import List, Tuple

from flask import Flask, jsonify, render_template, request

WORDLE_WIDTH = 5
CELL_BLACK = 0
CELL_YELLOW = 1
CELL_GREEN = 2

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
ASSETS_DIR = BASE_DIR / "assets"


def load_words(path: Path) -> List[str]:
    """Load valid 5-letter words from a newline-delimited file."""
    words: List[str] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            w = line.strip().lower()
            if len(w) == WORDLE_WIDTH and w.isalpha():
                words.append(w)
    return words


ANSWERS = sorted(set(load_words(ASSETS_DIR / "answers.txt")))
ANSWER_SET = set(ANSWERS)


def wordle_play(guess: str, answer: str) -> Tuple[int, int, int, int, int]:
    """Score a guess against the answer using Wordle-style rules."""
    remain = list(answer)
    row = [CELL_BLACK] * WORDLE_WIDTH

    for i in range(WORDLE_WIDTH):
        if guess[i] == remain[i]:
            remain[i] = "\0"
            row[i] = CELL_GREEN

    for i in range(WORDLE_WIDTH):
        if row[i] == CELL_GREEN:
            continue
        for j in range(WORDLE_WIDTH):
            if remain[j] == guess[i]:
                remain[j] = "\0"
                row[i] = CELL_YELLOW
                break

    return tuple(row)  # type: ignore[return-value]


def parse_pattern(pattern: str) -> Tuple[int, int, int, int, int]:
    """Convert an 'o/y/g' pattern string into numeric cell states."""
    if len(pattern) != WORDLE_WIDTH:
        raise ValueError("pattern must be five letters long")

    mapping = {"o": CELL_BLACK, "y": CELL_YELLOW, "g": CELL_GREEN}
    row: List[int] = []
    for ch in pattern:
        if ch not in mapping:
            raise ValueError("pattern must only contain 'o', 'y' or 'g'")
        row.append(mapping[ch])
    return tuple(row)  # type: ignore[return-value]


@app.get("/")
def index():
    """Serve the single-page UI."""
    return render_template("index.html")


@app.post("/api/match")
def api_match():
    """Return the first or all matching words for a given pattern."""
    data = request.get_json(silent=True) or {}
    answer = str(data.get("answer", "")).lower()
    pattern = str(data.get("pattern", "")).lower()
    mode = str(data.get("mode", "first")).lower()

    if answer not in ANSWER_SET:
        return jsonify({"ok": False, "error": "invalid answer"}), 400

    try:
        wanted = parse_pattern(pattern)
    except ValueError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400

    if mode not in {"first", "all"}:
        return jsonify({"ok": False, "error": "invalid mode"}), 400

    matches = [w for w in ANSWERS if wordle_play(w, answer) == wanted]
    payload = {
        "ok": True,
        "first": matches[0] if matches else None,
        "all": matches if mode == "all" else None,
    }
    return jsonify(payload)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8080, debug=True)
