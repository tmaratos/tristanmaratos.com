(function () {
  var form = document.getElementById("tm-contact-form");
  if (!form) return;
  var cfg = window.TM_CONTACT_CONFIG || {};
  var endpoint = String(cfg.endpoint || "").trim();
  var siteKey = String(cfg.turnstileSiteKey || "").trim();
  var TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  var statusEl = document.getElementById("tm-contact-status");
  var submitBtn = form.querySelector('button[type="submit"]');
  var btnLabel = submitBtn ? submitBtn.querySelector(".btn-label") : null;
  var turnstileShell = document.getElementById("tm-turnstile-shell");
  var turnstileMount = document.getElementById("tm-turnstile-mount");
  var turnstileNoticeEl = document.getElementById("tm-turnstile-notice");
  var turnstileFootEl = turnstileShell ? turnstileShell.querySelector(".turnstile-foot") : null;
  var turnstileToken = "";
  var turnstileState = "loading";
  var widgetId = null;
  var initPromise = null;
  var renderPromise = null;
  var isRendering = false;
  var retryCount = 0;
  var retryTimer = null;
  var errorDebounceTimer = null;
  var isSubmitting = false;
  var MAX_AUTO_RETRIES = 3;
  var ERROR_DEBOUNCE_MS = 900;
  var MSG_MISSING = "Complete the verification challenge before sending.";
  var MSG_WIDGET_ERROR = "Verification could not load. Refresh the page and try again.";
  var FOOT_DEFAULT =
    "Complete the check above before sending. Your message is delivered over TLS after verification.";
  var FOOT_VERIFIED = "Verification complete. You can send your message when ready.";
  function setLoading(on) {
    isSubmitting = !!on;
    if (!submitBtn) return;
    submitBtn.classList.toggle("is-loading", !!on);
    submitBtn.setAttribute("aria-busy", on ? "true" : "false");
    if (btnLabel) {
      btnLabel.textContent = on ? "Sending…" : "Send message";
    } else {
      submitBtn.textContent = on ? "Sending…" : "Send message";
    }
    updateSubmitAvailability();
  }
  function mapHttp(status) {
    if (status === 429) return "Too many attempts. Please wait and try again.";
    if (status >= 500) return "The service is temporarily unavailable. Please try again shortly.";
    return "Something went wrong. Please try again.";
  }
  function mapError(code) {
    switch (code) {
      case "turnstile_required":
      case "turnstile_invalid":
        return "Verification expired or failed. Please complete the check again.";
      case "invalid_name":
        return "Please enter your name.";
      case "invalid_email":
        return "Please enter a valid email address.";
      case "invalid_company":
        return "Company / organization is too long.";
      case "invalid_subject":
        return "Please enter a subject line.";
      case "invalid_message":
        return "Please enter a message (or shorten it).";
      case "server_misconfigured":
        return "The contact endpoint is not fully configured yet.";
      case "send_failed":
        return "Delivery failed. Please try again shortly.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
  function setStatus(kind, message) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.classList.remove("is-success", "is-error");
    if (kind === "success") statusEl.classList.add("is-success");
    if (kind === "error") statusEl.classList.add("is-error");
    statusEl.textContent = message;
  }
  function clearStatus() {
    if (!statusEl) return;
    statusEl.hidden = true;
    statusEl.textContent = "";
    statusEl.classList.remove("is-success", "is-error");
  }
  function clearTurnstileNotice() {
    if (turnstileNoticeEl) {
      turnstileNoticeEl.hidden = true;
      turnstileNoticeEl.textContent = "";
      turnstileNoticeEl.classList.remove("is-error");
    }
  }
  function showTurnstileNotice(state, message) {
    turnstileState = state;
    if (!turnstileNoticeEl || !message) return;
    turnstileNoticeEl.hidden = false;
    turnstileNoticeEl.classList.add("is-error");
    turnstileNoticeEl.textContent = message;
  }
  function setShellState(state) {
    if (!turnstileShell) return;
    turnstileShell.classList.remove("is-loading", "is-ready", "is-verified", "is-error");
    if (state) turnstileShell.classList.add(state);
    syncMountLayout();
  }
  function syncMountLayout() {
    if (!turnstileMount) return;
    var hasChild = turnstileMount.childElementCount > 0;
    turnstileMount.classList.toggle("has-widget", hasChild);
  }
  function setFootCopy(verified) {
    if (!turnstileFootEl) return;
    turnstileFootEl.textContent = verified ? FOOT_VERIFIED : FOOT_DEFAULT;
  }
  function updateSubmitAvailability() {
    if (!submitBtn) return;
    if (isSubmitting) {
      submitBtn.disabled = true;
      return;
    }
    var canSend = !!getTurnstileToken() && turnstileState !== "widget-error";
    submitBtn.disabled = !canSend;
  }
  function removeStaleTurnstileScripts() {
    document.querySelectorAll('script[src*="challenges.cloudflare.com/turnstile"]').forEach(function (s) {
      if (s.getAttribute("data-tm-turnstile") !== "1") {
        s.parentNode.removeChild(s);
      }
    });
  }
  function apiIsReady() {
    return !!(window.turnstile && typeof window.turnstile.render === "function");
  }

  function loadTurnstileApi() {
    removeStaleTurnstileScripts();

    if (apiIsReady()) {
      return Promise.resolve();
    }

    var existing =
      document.querySelector('script[data-tm-turnstile="1"]') ||
      document.querySelector('script[src*="challenges.cloudflare.com/turnstile"][src*="render=explicit"]');

    function waitForApi(resolve, reject) {
      if (apiIsReady()) {
        resolve();
        return;
      }
      var attempts = 0;
      var timer = setInterval(function () {
        attempts += 1;
        if (apiIsReady()) {
          clearInterval(timer);
          resolve();
        } else if (attempts > 80) {
          clearInterval(timer);
          reject(new Error("Turnstile API timed out"));
        }
      }, 50);
    }

    if (existing) {
      return new Promise(function (resolve, reject) {
        if (apiIsReady()) {
          resolve();
          return;
        }
        existing.addEventListener("load", function () {
          waitForApi(resolve, reject);
        });
        existing.addEventListener("error", function () {
          reject(new Error("Turnstile script failed"));
        });
        waitForApi(resolve, reject);
      });
    }

    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = TURNSTILE_SRC;
      s.setAttribute("data-tm-turnstile", "1");
      s.onload = function () {
        waitForApi(resolve, reject);
      };
      s.onerror = function () {
        reject(new Error("Turnstile script failed"));
      };
      document.head.appendChild(s);
    });
  }
  function destroyWidget() {
    if (widgetId !== null && window.turnstile && typeof window.turnstile.remove === "function") {
      try {
        window.turnstile.remove(widgetId);
      } catch (e) {
        /* ignore */
      }
    }
    widgetId = null;
    if (turnstileMount) {
      turnstileMount.innerHTML = "";
      turnstileMount.classList.remove("has-widget");
    }
  }
  function onTurnstileSuccess(token) {
    if (errorDebounceTimer) {
      clearTimeout(errorDebounceTimer);
      errorDebounceTimer = null;
    }
    turnstileToken = token || "";
    turnstileState = turnstileToken ? "verified" : "ready";
    retryCount = 0;
    clearTurnstileNotice();
    setShellState(turnstileToken ? "is-verified" : "is-ready");
    setFootCopy(!!turnstileToken);
    updateSubmitAvailability();
    syncMountLayout();
  }
  function onTurnstileExpired() {
    turnstileToken = "";
    turnstileState = "expired";
    clearTurnstileNotice();
    setShellState("is-ready");
    setFootCopy(false);
    updateSubmitAvailability();
  }
  function onTurnstileError() {
    turnstileToken = "";
    updateSubmitAvailability();
    if (errorDebounceTimer) clearTimeout(errorDebounceTimer);
    errorDebounceTimer = setTimeout(function () {
      errorDebounceTimer = null;
      if (turnstileToken) return;
      turnstileState = "widget-error";
      scheduleAutoRetry();
    }, ERROR_DEBOUNCE_MS);
  }
  function scheduleAutoRetry() {
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (retryCount >= MAX_AUTO_RETRIES) {
      setShellState("is-error");
      showTurnstileNotice("widget-error", MSG_WIDGET_ERROR);
      updateSubmitAvailability();
      return;
    }
    retryCount += 1;
    setShellState("is-loading");
    clearTurnstileNotice();
    setFootCopy(false);
    updateSubmitAvailability();
    retryTimer = setTimeout(function () {
      retryTimer = null;
      destroyWidget();
      renderWidget()
        .then(function () {
          setShellState("is-ready");
          updateSubmitAvailability();
        })
        .catch(function () {
          scheduleAutoRetry();
        });
    }, 1200 + retryCount * 400);
  }
  function renderWidget() {
    if (!turnstileMount || !siteKey) {
      return Promise.reject(new Error("Mount or site key missing"));
    }
    if (isRendering && renderPromise) return renderPromise;
    isRendering = true;
    renderPromise = loadTurnstileApi()
      .then(function () {
        if (!window.turnstile || typeof window.turnstile.render !== "function") {
          throw new Error("Turnstile render unavailable");
        }
        destroyWidget();
        widgetId = window.turnstile.render(turnstileMount, {
          sitekey: siteKey,
          theme: "dark",
          size: "normal",
          callback: onTurnstileSuccess,
          "expired-callback": onTurnstileExpired,
          "error-callback": onTurnstileError,
        });
        if (widgetId === undefined || widgetId === null) {
          throw new Error("Turnstile render returned no widget id");
        }
        turnstileState = "ready";
        syncMountLayout();
      })
      .finally(function () {
        isRendering = false;
      });
    return renderPromise;
  }
  function initTurnstile() {
    if (initPromise) return initPromise;
    initPromise = renderWidget()
      .then(function () {
        setShellState("is-ready");
        updateSubmitAvailability();
      })
      .catch(function () {
        scheduleAutoRetry();
      });
    return initPromise;
  }
  function resetTurnstile() {
    turnstileToken = "";
    clearTurnstileNotice();
    setFootCopy(false);
    if (widgetId !== null && window.turnstile) {
      try {
        window.turnstile.reset(widgetId);
        turnstileState = "ready";
        setShellState("is-ready");
        updateSubmitAvailability();
        return;
      } catch (e) {
        /* fall through to re-init */
      }
    }
    retryCount = 0;
    initPromise = null;
    renderPromise = null;
    initTurnstile();
  }
  function getTurnstileToken() {
    if (turnstileToken) return turnstileToken;
    if (window.turnstile && widgetId !== null) {
      try {
        return window.turnstile.getResponse(widgetId) || "";
      } catch (e) {
        return "";
      }
    }
    return "";
  }
  function parseResponseBody(text) {
    if (!text || !text.trim()) return {};
    try {
      return JSON.parse(text);
    } catch (e) {
      return { _raw: text };
    }
  }
  function clearFieldErrors() {
    form.querySelectorAll(".form-input, .form-textarea").forEach(function (el) {
      el.removeAttribute("aria-invalid");
    });
  }
  function clientValidate(payload) {
    clearFieldErrors();
    var ok = true;
    function mark(name) {
      var el = form.querySelector('[name="' + name + '"]');
      if (el) el.setAttribute("aria-invalid", "true");
      ok = false;
    }
    if (!payload.name) mark("name");
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) mark("email");
    if (payload.company.length > 160) mark("company");
    if (!payload.subject) mark("subject");
    if (!payload.message) mark("message");
    return ok;
  }
  function boot() {
    if (!endpoint) {
      setStatus("error", "Contact endpoint is not configured. Set TM_CONTACT_CONFIG.endpoint in js/contact-config.js.");
      if (submitBtn) submitBtn.disabled = true;
      return;
    }
    if (!siteKey) {
      setStatus("error", "Turnstile site key is missing. Add your public site key to js/contact-config.js.");
      if (submitBtn) submitBtn.disabled = true;
      return;
    }
    if (!turnstileMount) return;
    setShellState("is-loading");
    clearTurnstileNotice();
    setFootCopy(false);
    updateSubmitAvailability();
    initTurnstile();
  }
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (isSubmitting) return;
    clearStatus();
    var hp = String(new FormData(form).get("company_website") || "").trim();
    if (hp) return;
    if (turnstileState === "loading" || (turnstileState === "widget-error" && retryCount < MAX_AUTO_RETRIES)) {
      try {
        await initTurnstile();
      } catch (err) {
        /* handled in init */
      }
    }
    var fd = new FormData(form);
    var payload = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      company: String(fd.get("company") || "").trim(),
      subject: String(fd.get("subject") || "").trim(),
      message: String(fd.get("message") || "").trim(),
    };
    if (!clientValidate(payload)) {
      setStatus("error", "Please review the highlighted fields.");
      return;
    }
    var token = getTurnstileToken();
    if (!token) {
      if (turnstileState === "widget-error" && retryCount >= MAX_AUTO_RETRIES) {
        showTurnstileNotice("widget-error", MSG_WIDGET_ERROR);
      } else {
        showTurnstileNotice("missing-token-after-submit", MSG_MISSING);
      }
      updateSubmitAvailability();
      return;
    }
    var body = {
      name: payload.name,
      email: payload.email,
      company: payload.company,
      subject: payload.subject,
      message: payload.message,
      turnstileToken: token,
    };
    setLoading(true);
    try {
      var r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(body),
      });
      var text = await r.text();
      var data = parseResponseBody(text);
      if (r.ok) {
        var explicitFail = data.ok === false || data.success === false;
        var errMsg = null;
        if (typeof data.error === "string") errMsg = data.error;
        else if (explicitFail && typeof data.message === "string") errMsg = data.message;
        if (explicitFail || errMsg) {
          setStatus("error", errMsg || mapError(data.code) || "Request could not be completed.");
          resetTurnstile();
        } else {
          setStatus(
            "success",
            "Message received. If a reply is appropriate, you’ll hear back at the address you provided."
          );
          form.reset();
          clearFieldErrors();
          resetTurnstile();
        }
      } else {
        var friendly =
          typeof data.error === "string"
            ? data.error
            : typeof data.message === "string"
              ? data.message
              : mapHttp(r.status);
        if (friendly === mapHttp(r.status) && data.code) friendly = mapError(data.code);
        setStatus("error", friendly);
        resetTurnstile();
      }
    } catch (err) {
      setStatus(
        "error",
        "Could not reach the contact service. If this persists, it may be a network or CORS configuration issue on the worker."
      );
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
