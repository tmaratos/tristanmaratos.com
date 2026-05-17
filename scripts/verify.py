from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
terms = ["CNS", "NOCSOC", "github.com", "865-", "denjess", "tristanstuff", "hello@", "mailto:tristan"]
issues = []
for f in list(root.rglob("*.html")) + list(root.rglob("*.js")):
    if "scripts" in f.parts:
        continue
    t = f.read_text(encoding="utf-8", errors="replace")
    for term in terms:
        if term.lower() in t.lower():
            issues.append(f"{f.relative_to(root)}: {term}")
    if re.search(r"<motion", t):
        issues.append(f"{f.relative_to(root)}: motion-tag")

idx = (root / "index.html").read_text(encoding="utf-8")
print("Sensitive/malformed:", issues or "none")
print("Timeline nodes:", idx.count('class="tl-node"'))
print("Project cards:", idx.count('class="project-card'))
