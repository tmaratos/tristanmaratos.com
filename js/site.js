(function () {
  function normalizePath(pathname) {
    var p = pathname.replace(/\/index\.html$/i, "");
    if (p.length > 1 && p.endsWith("/")) {
      p = p.slice(0, -1);
    }
    if (!p) {
      p = "/";
    }
    return p;
  }

  var chunks = window.__CHUNKS || {};
  var headerHost = document.getElementById("site-header");
  var footerHost = document.getElementById("site-footer");

  if (headerHost && chunks.header) {
    headerHost.innerHTML = chunks.header;
  }
  if (footerHost && chunks.footer) {
    footerHost.innerHTML = chunks.footer;
  }

  var yearEls = document.querySelectorAll("[data-year]");
  var y = new Date().getFullYear();
  yearEls.forEach(function (el) {
    el.textContent = String(y);
  });

  var path = normalizePath(window.location.pathname);
  var links = document.querySelectorAll(".site-nav a[href]");
  links.forEach(function (a) {
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#") {
      return;
    }
    try {
      var u = new URL(href, window.location.origin);
      if (u.origin !== window.location.origin) {
        return;
      }
      var hp = normalizePath(u.pathname);
      if (hp === path) {
        a.classList.add("is-active");
      }
    } catch (e) {
      /* ignore */
    }
  });

  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var nodes = document.querySelectorAll("[data-tl-node]");
  if (nodes.length) {
    nodes.forEach(function (node) {
      var activate = function () {
        nodes.forEach(function (n) {
          n.classList.remove("is-selected");
        });
        node.classList.add("is-selected");
      };
      node.addEventListener("click", activate);
      node.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
    });
    nodes[0].classList.add("is-selected");
  }
})();
