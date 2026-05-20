/* Shared HTML fragments — edit once for sitewide header/footer */
window.__CHUNKS = {
  header: `
  <a href="#main" class="skip-link">Skip to content</a>
  <header class="site-header">
    <div class="shell header-inner">
      <a class="brand" href="/" aria-label="Tristan Maratos — Home">
        <img src="/assets/logo.svg" alt="Tristan Maratos logo" class="site-logo" />
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" data-nav-toggle>
        <span></span><span></span><span></span>
        <span class="visually-hidden">Menu</span>
      </button>
      <nav class="site-nav" id="primary-nav" aria-label="Primary">
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/experience/">Experience</a></li>
          <li><a href="/education/">Education</a></li>
          <li><a href="/projects/">Projects</a></li>
          <li><a href="/services/">Services</a></li>
          <li><a href="/aviation/">Aviation &amp; Leadership</a></li>
          <li><a href="/about/">About</a></li>
          <li><a href="/contact/">Contact</a></li>
        </ul>
      </nav>
    </div>
  </header>`,
  footer: `
  <footer class="site-footer">
    <div class="shell footer-grid">
      <div class="footer-col">
        <h3>Let’s Connect</h3>
        <div class="social-row">
          <a href="https://www.linkedin.com/in/tristan-maratos" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.8v2h.1c.5-1 1.8-2.1 3.7-2.1 3.9 0 4.6 2.6 4.6 5.9V23h-4v-7.6c0-1.8 0-4.1-2.5-4.1-2.5 0-2.9 2-2.9 4v7.7h-4V8.5z"/></svg>
          </a>
          <a href="/contact/" aria-label="Contact form">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
          </a>
        </div>
        <p>Serious inquiries welcome. Use the secure contact form for collaboration.</p>
        <ul class="footer-links">
          <li><a href="/projects/">Projects</a></li>
          <li><a href="/services/">Services</a></li>
          <li><a href="/aviation/">Aviation &amp; CAP</a></li>
          <li><a href="/contact/">Contact</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h3>Certifications &amp; Training</h3>
        <ul>
          <li>Private Pilot License (ASEL) — 215+ hours</li>
          <li>Instrument Rating (IFR) — in progress</li>
          <li>2nd Lieutenant, Civil Air Patrol — Aerospace Education Officer</li>
        </ul>
      </div>
      <div class="footer-col">
        <h3>Location</h3>
        <p>Knoxville, Tennessee metro — open to relocation for the right systems leadership role.</p>
      </div>
      <div class="footer-col">
        <h3>Operating Philosophy</h3>
        <p>Build calm operations: measurable reliability, honest architecture, and teams equipped with clarity under pressure.</p>
      </div>
    </div>
    <p class="footer-bottom">© <span data-year></span> Tristan Maratos. All rights reserved.</p>
  </footer>`
};
