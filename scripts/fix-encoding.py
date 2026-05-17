"""Fix UTF-8 mojibake (smart quotes, dashes, arrows, etc.) in site HTML."""
from pathlib import Path

# Order: longer / more specific sequences first
REPLACEMENTS = [
    ("â€™", "\u2019"),  # right single quote (apostrophe)
    ("â€œ", "\u201c"),  # left double quote
    ("â€\u009d", "\u201d"),  # right double quote (if present)
    ("â€¢", "\u2022"),  # bullet
    ("â†’", "\u2192"),  # arrow
    ("â€“", "\u2013"),  # en dash
    ("â€”", "\u2014"),  # em dash
    ("Â®", "\u00ae"),  # registered sign
    ("Ã©", "\u00e9"),  # e acute
    ("\u00c2\u00b7", "\u00b7"),  # middle dot (alternate mojibake)
]

root = Path(__file__).resolve().parents[1]
patterns = ("*.html", "*.js", "*.css")

for pattern in patterns:
    for path in root.rglob(pattern):
        if "node_modules" in path.parts or ".git" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        original = text
        for bad, good in REPLACEMENTS:
            text = text.replace(bad, good)
        if text != original:
            path.write_text(text, encoding="utf-8", newline="\n")
            print(f"fixed {path.relative_to(root)}")
