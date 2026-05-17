from pathlib import Path

p = Path(__file__).resolve().parents[1] / "index.html"
text = p.read_text(encoding="utf-8")
marker_start = '        <div class="split-bottom">'
marker_end = '          <aside class="panel panel-pad" aria-labelledby="live-title">'
start = text.index(marker_start)
end = text.index(marker_end)

new_block = """        <motion class="split-bottom projects-showcase">
          <div class="projects-showcase-main">
            <p class="showcase-intro">
              Three standalone apps under one parent company standard.
              <strong>Steward</strong> is the shared guide—clear rules, real data, not random chat.
            </p>

            <article class="project-card project-card--featured pc-cfo">
              <span class="pc-badge">Flagship · Finance · Coming soon</span>
              <h3 class="pc-title">CFO</h3>
              <p class="pc-tagline">The financial operating system</p>
              <p class="pc-desc">
                Financial OS on your machine, powered by Steward—not thin budgeting. Interpret, plan, and decide from
                structured data and transparent rules.
              </p>
              <div class="tech-tags tech-tags--compact">
                <span>Finance</span>
                <span>Local-first</span>
                <span>Steward</span>
                <span>Coming soon</span>
              </div>
              <a class="pc-cta" href="/projects/#cfo">View product page <span aria-hidden="true">→</span></a>
            </article>

            <article class="project-card project-card--secondary pc-eden">
              <span class="pc-badge">Research · Coming soon</span>
              <h3 class="pc-title">Eden</h3>
              <p class="pc-tagline">Research intelligence and prioritization</p>
              <p class="pc-desc">
                Standalone research workspace: gather sources, compare claims, and manage citations. Steward helps
                prioritize what fits your question.
              </p>
              <div class="tech-tags tech-tags--compact">
                <span>Research</span>
                <span>Citations</span>
                <span>Steward</span>
                <span>Coming soon</span>
              </div>
              <a class="pc-cta" href="/projects/#eden">View product page <span aria-hidden="true">→</span></a>
            </article>

            <article class="project-card project-card--secondary pc-ledger">
              <span class="pc-badge">Identity &amp; documents · Coming soon</span>
              <h3 class="pc-title">Ledger</h3>
              <p class="pc-tagline">Secure vault. Exact-fill documents.</p>
              <p class="pc-desc">
                Encrypted identity vault and document assistant—for example, spouses sharing a household file. Steward
                lines up form fields with stored values; blanks stay blank if no data is supplied.
              </p>
              <div class="tech-tags tech-tags--compact">
                <span>Vault</span>
                <span>Documents</span>
                <span>Steward</span>
                <span>Coming soon</span>
              </div>
              <a class="pc-cta" href="/projects/#ledger">View product page <span aria-hidden="true">→</span></a>
            </article>

            <div class="projects-compare" aria-label="Product comparison">
              <h3 class="projects-compare-title">Compare at a glance</h3>
              <ul class="projects-compare-list">
                <li><strong>CFO</strong> — money, plans, projections; not research or identity</li>
                <li><strong>Eden</strong> — sources, claims, citations; not a finance dashboard</li>
                <li><strong>Ledger</strong> — secure vault and exact-fill; no invented field values</li>
              </ul>
            </div>
          </div>

          <aside class="live-deployments" aria-labelledby="live-title">
"""

new_block = new_block.replace("<motion", "<div")
text = text[:start] + new_block + text[end + len(marker_end) :]
p.write_text(text, encoding="utf-8")
print("Patched index.html projects section")
