const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildHtml({ name, email, company, subject, message }) {
  const companyRow = company
    ? `<tr><th align="left">Company</th><td>${escapeHtml(company)}</td></tr>`
    : "";

  return `<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5;">
  <h2>New contact form message</h2>
  <table cellpadding="6" cellspacing="0" border="0">
    <tr><th align="left">Name</th><td>${escapeHtml(name)}</td></tr>
    <tr><th align="left">Email</th><td>${escapeHtml(email)}</td></tr>
    ${companyRow}
    <tr><th align="left">Subject</th><td>${escapeHtml(subject)}</td></tr>
  </table>
  <h3>Message</h3>
  <p style="white-space: pre-wrap;">${escapeHtml(message)}</p>
</body>
</html>`;
}

function validatePayload(body) {
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim();
  const company = String(body?.company || "").trim();
  const subject = String(body?.subject || "").trim();
  const message = String(body?.message || "").trim();
  const turnstileToken = String(body?.turnstileToken || "").trim();

  if (!turnstileToken) {
    return { error: "Missing turnstile token", code: "turnstile_required", status: 400 };
  }
  if (!name) {
    return { error: "Invalid name", code: "invalid_name", status: 400 };
  }
  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Invalid email", code: "invalid_email", status: 400 };
  }
  if (company.length > 160) {
    return { error: "Invalid company", code: "invalid_company", status: 400 };
  }
  if (!subject) {
    return { error: "Invalid subject", code: "invalid_subject", status: 400 };
  }
  if (!message || message.length > 10000) {
    return { error: "Invalid message", code: "invalid_message", status: 400 };
  }

  return { name, email, company, subject, message, turnstileToken };
}

function checkConfig(env) {
  const missing = [];
  if (!env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
  if (!env.TURNSTILE_SECRET_KEY) missing.push("TURNSTILE_SECRET_KEY");
  if (!env.TO_EMAIL) missing.push("TO_EMAIL");
  return missing;
}

async function verifyTurnstile(token, secret, remoteIp) {
  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (remoteIp) form.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!response.ok) return false;

  const result = await response.json();
  return result.success === true;
}

async function sendEmail(env, payload) {
  const from = env.RESEND_FROM || "Tristan Maratos <onboarding@resend.dev>";
  const { name, email, company, subject, message } = payload;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: env.TO_EMAIL,
      reply_to: email,
      subject: `[TM Site] ${subject}`,
      html: buildHtml({ name, email, company, subject, message }),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Resend API error", response.status, detail);
    return false;
  }

  return true;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const missing = checkConfig(env);
    if (missing.length > 0) {
      console.error("Worker misconfigured, missing:", missing.join(", "));
      return jsonResponse({ error: "Server misconfigured" }, 500);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const validated = validatePayload(body);
    if (validated.error) {
      return jsonResponse(
        { error: validated.error, code: validated.code },
        validated.status
      );
    }

    const remoteIp = request.headers.get("CF-Connecting-IP") || "";
    const turnstileOk = await verifyTurnstile(
      validated.turnstileToken,
      env.TURNSTILE_SECRET_KEY,
      remoteIp
    );

    if (!turnstileOk) {
      return jsonResponse({ error: "Turnstile verification failed" }, 403);
    }

    const sent = await sendEmail(env, validated);
    if (!sent) {
      return jsonResponse({ error: "Email send failed" }, 500);
    }

    return jsonResponse({ ok: true });
  },
};
