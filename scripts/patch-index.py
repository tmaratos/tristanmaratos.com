from pathlib import Path
import re

p = Path(r"c:\tristanmaratos.com\index.html")
c = p.read_text(encoding="utf-8", errors="replace")

skills = r"""
            <div class="skill-grid-inner">
              <motion class="skill-block">
                <h3>Languages</h3>
                <ul>
                  <li>C#, .NET 8</li>
                  <li>Python</li>
                  <li>HTML5, CSS3, JavaScript (ES6+)</li>
                  <li>Bash / PowerShell scripting</li>
                </ul>
              </motion>
              <div class="skill-block">
                <h3>Frameworks &amp; patterns</h3>
                <ul>
                  <li>MVVM architecture</li>
                  <li>Modular layered application design</li>
                  <li>Role-aware web platforms</li>
                </ul>
              </motion>
              <div class="skill-block">
                <h3>Operations &amp; tools</h3>
                <ul>
                  <li>Splunk · Netreo · VMware</li>
                  <li>Linux CLI · Windows Server</li>
                  <li>HL7 messaging · RFID telemetry</li>
                  <li>Citrix · remote diagnostics</li>
                </ul>
              </motion>
              <div class="skill-block">
                <h3>Core strengths</h3>
                <ul>
                  <li>Root cause analysis &amp; log investigation</li>
                  <li>Incident escalation workflows</li>
                  <li>Structured investigative documentation</li>
                  <li>Cross-team technical collaboration</li>
                </ul>
              </motion>
            </motion>""".replace("motion", "div")

projects = r"""
            <div class="project-stack">
              <article class="project-card pc-cfo">
                <div class="project-thumb" aria-hidden="true"></div>
                <div>
                  <span class="pc-badge">Desktop · .NET 8</span>
                  <h3 class="pc-title">Financial Planning Application</h3>
                  <p class="pc-desc">
                    Local-first desktop app in C# and .NET 8 for proactive financial planning — four explicit layers
                    (UI, business logic, service, data) with MathNet.Numerics and Tesseract OCR integration.
                  </p>
                  <div class="tech-tags">
                    <span>C#</span>
                    <span>.NET 8</span>
                    <span>MVVM</span>
                    <span>Excel datastore</span>
                  </div>
                  <div class="pc-actions">
                    <a href="/projects/#financial-planning">Deep dive</a>
                  </div>
                </div>
              </article>
              <article class="project-card pc-sentinel">
                <motion class="project-thumb" aria-hidden="true"></div>
                <div>
                  <span class="pc-badge">Web platform</span>
                  <h3 class="pc-title">Flight Club Web Platform</h3>
                  <p class="pc-desc">
                    HTML5, CSS3, and modern JavaScript web application with modular architecture for conditional access
                    and scalable feature expansion — collaborative development with Git.
                  </p>
                  <div class="tech-tags">
                    <span>HTML5</span>
                    <span>CSS3</span>
                    <span>JavaScript</span>
                    <span>Modular JS</span>
                  </div>
                  <div class="pc-actions">
                    <a href="/projects/#flight-club">Deep dive</a>
                  </div>
                </div>
              </article>
            </div>""".replace("motion", "div")

c, n1 = re.subn(
    r'<div class="skill-grid-inner">.*?</div>\s*<a class="btn btn-ghost" href="/projects/">',
    skills.strip() + "\n            <a class=\"btn btn-ghost\" href=\"/projects/\">",
    c,
    count=1,
    flags=re.S,
)

c, n2 = re.subn(
    r'<div class="project-stack">.*?</motion>\s*<aside class="panel panel-pad" aria-labelledby="live-title">',
    projects.strip() + '\n          <aside class="panel panel-pad" aria-labelledby="live-title">',
    c,
    count=1,
    flags=re.S,
)
if n2 == 0:
    c, n2 = re.subn(
        r'<div class="project-stack">.*?</div>\s*</div>\s*<aside class="panel panel-pad" aria-labelledby="live-title">',
        projects.strip() + '\n          <aside class="panel panel-pad" aria-labelledby="live-title">',
        c,
        count=1,
        flags=re.S,
    )

p.write_text(c, encoding="utf-8")
print("skills", n1, "projects", n2)
