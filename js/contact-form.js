(function () {
  "use strict";

  var form = document.getElementById("tm-contact-form");
  if (!form) return;

  var cfg = window.TM_CONTACT_CONFIG || {};
  var endpoint = String(cfg.endpoint || "").trim();

  var statusEl = document.getElementById("tm-contact-status");
  var submitBtn = form.querySelector('button[type="submit"]');
  var btnLabel = submitBtn ? submitBtn.querySelector(".btn-label") : null;
  var isSubmitting = false;

  var MSG_MISSING = "Complete the verification challenge before sending.";

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

  function getTurnstileToken() {
    var el = document.querySelector('[name="cf-turnstile-response"]');
    return el && el.value ? String(el.value).trim() : "";
  }

  function updateSubmitAvailability() {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting || !getTurnstileToken();
  }

  function resetTurnstile() {
    if (window.turnstile && typeof window.turnstile.reset === "function") {
      try {
        window.turnstile.reset();
      } catch (e) {
        /* ignore */
      }
    }
    updateSubmitAvailability();
  }

  function watchTurnstileResponse() {
    var input = document.querySelector('[name="cf-turnstile-response"]');
    if (input) {
      input.addEventListener("change", updateSubmitAvailability);
      input.addEventListener("input", updateSubmitAvailability);
      updateSubmitAvailability();
      return;
    }

    var observer = new MutationObserver(function () {
      input = document.querySelector('[name="cf-turnstile-response"]');
      if (!input) return;
      observer.disconnect();
      input.addEventListener("change", updateSubmitAvailability);
      input.addEventListener("input", updateSubmitAvailability);
      updateSubmitAvailability();
    });

    observer.observe(form, { childList: true, subtree: true });
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

  function initForm() {
    if (!endpoint) {
      setStatus("error", "Contact endpoint is not configured. Set TM_CONTACT_CONFIG.endpoint in js/contact-config.js.");
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    watchTurnstileResponse();
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (isSubmitting) return;

    clearStatus();

    var hp = String(new FormData(form).get("company_website") || "").trim();
    if (hp) return;

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
      setStatus("error", MSG_MISSING);
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
    document.addEventListener("DOMContentLoaded", initForm);
  } else {
    initForm();
  }
})();
