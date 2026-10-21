# LUMIA — laser hair removal studio, Prague

[![CI](https://github.com/Snickersman2005/lumia-project-Web-/actions/workflows/ci.yml/badge.svg)](https://github.com/Snickersman2005/lumia-project-Web-/actions/workflows/ci.yml)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Snickersman2005/lumia-project-Web-)

Website and online booking system for a laser hair removal studio in Prague: service catalogue, price list, specialists, before/after gallery, reviews, FAQ, real-time booking with Google Calendar sync, client self-service (reschedule / cancel / erase data) and an admin panel.

**Stack:** Node.js 20+ with zero runtime dependencies, vanilla JS front end, JSON storage, `node:test`, Docker, GitHub Actions.

## Built for the Czech / EU market

| Area | Implementation |
|---|---|
| Languages | Czech (default), English, Russian, Ukrainian. Language-specific URLs `/cs/ /en/ /ru/ /uk/`, `Accept-Language` negotiation, `hreflang`, canonical, translated content editable in the admin |
| Local SEO | schema.org `BeautySalon` JSON-LD (address, geo, opening hours, offers in CZK), Open Graph, `sitemap.xml` with alternates, `robots.txt` |
| Czech calendar | Public holidays under Act No. 245/2000 Sb. (incl. Good Friday and Easter Monday computed from the Easter algorithm) are closed for booking; time zone `Europe/Prague` |
| Phone numbers | Normalised to E.164: `777 123 456` → `+420777123456`; other EU numbers accepted |
| Legal | Company name, IČO, DIČ and VAT note (`ceny vč. DPH` / `neplátce DPH`) in the footer |
| GDPR | Privacy policy in 4 languages, consent version + timestamp stored with each booking, data minimisation in the shared calendar, right to erasure via the client's personal link, automatic anonymisation after `RETENTION_MONTHS`, CSV export for access requests, before/after photos only with written consent, EXIF/GPS stripped from uploads |
| Cookies | Consent banner with equal "Accept / Decline"; Google Fonts and the Google Maps embed load only after consent; route links for Google Maps, Mapy.cz and Apple Maps |
| Accessibility | Skip link, semantic landmarks, keyboard-operable controls, `prefers-reduced-motion` |

## Architecture

Feature-based layout: each feature owns its routes and domain logic; shared infrastructure lives in `core/`.

```
server.js                     entry point, graceful shutdown
src/
  app.js                      composition: core + feature registration
  core/
    config.js                 environment / .env loading
    http.js                   router, HttpError, JSON body parsing
    security.js               sessions, rate limiter, security headers, CSRF origin check
    store.js                  JSON store: atomic writes, backup, schema migration
    log.js                    structured JSON logs
  shared/
    time.js                   time zone helpers, Czech public holidays
    validate.js               input validation and normalisation
    csv.js                    Excel-friendly CSV with formula-injection protection
  features/
    catalog/                  public data, reviews
    booking/                  availability, slot calculation, booking
    manage/                   client self-service by secret link
    admin/                    admin auth, settings, CRUD, export
    media/                    before/after uploads (image validation, metadata stripping)
    seo/                      localised pages, JSON-LD, sitemap
    gdpr/                     retention and anonymisation
    integrations/             Google Calendar (service account JWT), Telegram
public/                       front end (site, admin, privacy, manage)
test/                         unit + HTTP integration tests
```

## Security

- **Injection / XSS:** strict server-side whitelists per entity; output escaped on the client; JSON-LD escaped for `<script>` context; CSP `script-src 'self'` without inline scripts.
- **CSRF:** `SameSite=Strict` session cookie, `Origin`/`Referer` check on writes, JSON-only request bodies (blocks HTML form posts).
- **Authentication:** server-side revocable sessions (8 h), constant-time password comparison, login rate limit (10 / 15 min), generated 24-char password if none configured.
- **Broken access control:** admin routes are declared with `auth: 'admin'` and checked centrally in the router; the client link uses a 128-bit token compared in constant time.
- **Headers:** CSP, HSTS (behind HTTPS), X-Frame-Options, COOP/CORP, Permissions-Policy, nosniff.
- **Input handling:** body size limits (413), malformed JSON (400), strict date/time/phone/e-mail validation, image type detection by magic bytes, path-traversal-safe static serving.
- **Secrets:** nothing hard-coded; configuration via environment (`.env.example`); `data/`, `.env` and keys are git-ignored.
- **Operations:** request timeouts, ETag caching, health check, logs without query strings or personal data, non-root read-only Docker container.

Known limits (business decisions, not implemented): e-mail/SMS confirmation, promo code rules, payment/deposits.

## Deploy

One click on **Deploy to Render** above creates a free web service from `render.yaml` (Frankfurt region, health check `/healthz`, generated admin password in the service's *Environment* tab). The free plan sleeps after inactivity and resets the database to demo data on restart.

## Run

```bash
npm start            # http://localhost:3000  (admin: /admin)
npm test             # 24 unit + integration tests
```

Docker with automatic HTTPS (Caddy):

```bash
cp .env.example .env   # set BASE_URL, DOMAIN, ADMIN_PASSWORD
docker compose up -d
```

### Google Calendar
Create a service account with the Google Calendar API enabled, put its JSON key into `data/google-service-account.json` (or `GOOGLE_SERVICE_ACCOUNT_FILE`), share the salon calendar with the service account e-mail ("Make changes to events") and set the calendar ID in the admin settings or `GOOGLE_CALENDAR_ID`.

## Licence
MIT
