#!/usr/bin/env python3
"""One-off fixes for resume sync and encoding."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FONT = (
    'href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500'
    "&family=Inter:wght@400;500;600;700;800"
    "&family=Space+Grotesk:wght@500;600;700&display=swap\""
)


def fix_html(path: Path) -> bool:
    t = path.read_text(encoding="utf-8", errors="replace")
    orig = t
    t = re.sub(
        r'href="https://fonts\.googleapis\.com/css2\?[^"]*"',
        FONT,
        t,
    )
    t = t.replace("Aug 2022 \ufffd Mar 2023", "Aug 2022 \u2013 Mar 2023")
    t = t.replace("Knoxville, TN \ufffd Travel-center", "Knoxville, TN \u00b7 Travel-center")
    t = t.replace(
        "Security Analyst & IT Technician",
        "Security Analyst &amp; IT Technician",
    )
    t = t.replace(
        "Bachelor of Science, Information Technology \u2014 technical management lens",
        "B.S. Computer Information Systems \u2014 Cybersecurity Programming (GPA 3.83, Aug 2024)",
    )
    t = t.replace('class="project-card pc-cfo"', 'class="project-card pc-finance"')
    t = t.replace('class="project-card pc-sentinel"', 'class="project-card pc-flightclub"')
    if t != orig:
        path.write_text(t, encoding="utf-8")
        return True
    return False


def fix_css() -> bool:
    p = ROOT / "css" / "ops-ui.css"
    t = p.read_text(encoding="utf-8")
    orig = t
    t = t.replace(".pc-cfo", ".pc-finance").replace(".pc-sentinel", ".pc-flightclub")
    if t != orig:
        p.write_text(t, encoding="utf-8")
        return True
    return False


if __name__ == "__main__":
    changed = []
    for html in ROOT.rglob("*.html"):
        if fix_html(html):
            changed.append(html.relative_to(ROOT))
    if fix_css():
        changed.append("css/ops-ui.css")
    print("Updated:", ", ".join(str(c) for c in changed) or "(none)")
