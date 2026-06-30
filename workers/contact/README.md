# Contact form Worker

Cloudflare Worker for [tristanmaratos.com](https://tristanmaratos.com) contact submissions. The static site POSTs JSON to this Worker; the Worker verifies Turnstile, then sends mail via [Resend](https://resend.com).

**Endpoint (production):** `https://tristanmaratos-contact-workercom.aviationministries.workers.dev`

Configured in `js/contact-config.js` on the site.

## Prerequisites

- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install` in this folder)
- Cloudflare account with access to worker `tristanmaratos-contact-workercom`
- Resend API key
- Turnstile **secret** key for widget `tristanmaratos-main` (site key is public in `js/contact-config.js`)

## Environment

| Variable | How to set | Description |
|----------|------------|-------------|
| `RESEND_API_KEY` | **Secret** | Resend API key — never commit |
| `TURNSTILE_SECRET_KEY` | **Secret** | Cloudflare Turnstile secret |
| `RESEND_FROM` | `wrangler.toml` `[vars]` | Sender address (use `onboarding@resend.dev` until domain is verified) |
| `TO_EMAIL` | `wrangler.toml` `[vars]` | Inbox that receives submissions (`tristanstuff@denjess.com`) |

## Deploy

From this directory:

```bash
npm install
```

Set secrets (Wrangler prompts for the value — paste at the terminal, not in git):

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY
```

Deploy:

```bash
npx wrangler deploy
```

## Local development

Create `.dev.vars` in this folder (gitignored) with:

```
RESEND_API_KEY=re_...
TURNSTILE_SECRET_KEY=...
```

Then:

```bash
npx wrangler dev
```

## Request / response

**POST** `application/json`:

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "company": "Acme",
  "subject": "Hello",
  "message": "Message body",
  "turnstileToken": "..."
}
```

**Success:** `200` `{ "ok": true }`

**Errors:** JSON `{ "error": "..." }` with appropriate status (e.g. Turnstile failure `403`, send failure `500`).

## Security

- Do **not** put API keys or Turnstile secrets in this repo.
- Rotate any key that was shared in chat or committed by mistake.
