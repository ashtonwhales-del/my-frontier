# Security Documentation — My Frontier

This document describes the current security posture, known limitations, and hardening steps required before App Store production launch.

## Current Security Controls

| Control | Status | Notes |
|---|---|---|
| Anthropic API key moved to backend | Done | Key lives in `.env`, never shipped in the app binary |
| X-App-Secret header on all requests | Done | Prevents casual scraping; see limitations below |
| CORS lockdown in production | Done | Controlled by `ENV` variable; restrict to your domain |
| Per-endpoint rate limiting | Done | Token bucket per IP — `/optimize` 3/5min, `/advisor` 10/min |
| Input validation (length, range, types) | Done | Both Pydantic layer and manual checks in `api.py` |
| Prompt injection filtering | Done | Regex blocks `ignore previous instructions`, `system:`, etc. |
| HTML tag stripping on name field | Done | Prevents stored XSS via name input |
| Request logging (no PII) | Done | Logs to `logs/api.log` with daily rotation; never logs portfolio data |
| AsyncStorage read validation | Done | Validates or clears corrupted stored values |
| ErrorBoundary in mobile app | Done | Catches render errors; never exposes stack traces to users |

## Known Security Limitations

### 1. No SSL Certificate Pinning
**Risk:** A man-in-the-middle attacker on the same network could intercept API traffic between the mobile app and backend.

**Action required before launch:**
Install `react-native-ssl-pinning` and pin to your server's TLS certificate or public key:
```bash
npx expo install react-native-ssl-pinning
```
Then replace `fetch` calls in `api.ts` with the pinned fetch from that library.

### 2. APP_SECRET is Obfuscation, Not Authentication
**Risk:** The `APP_SECRET` value is bundled inside the app binary. A determined attacker can extract it with reverse engineering tools and use it to call the API directly.

**What it does:** Prevents casual scraping and drive-by abuse. It is not a substitute for user authentication.

**Hardening options for production:**
- Implement short-lived signed tokens (JWT) generated per-session on a dedicated auth endpoint
- Add device attestation (Apple DeviceCheck / Google Play Integrity API)
- Use a WAF (Web Application Firewall) in front of the API

### 3. Rate Limiting is In-Memory Only
**Risk:** Rate limit state is stored in Python process memory. It resets on server restart and does not work across multiple server instances.

**Action required for production:**
Replace the in-memory `_rate_buckets` dict with a Redis-backed rate limiter (e.g., `slowapi` with Redis storage) if running more than one server process.

### 4. No User Authentication
**Risk:** Any device with the `APP_SECRET` can call any endpoint. There is no per-user identity or session isolation.

**Current mitigation:** Rate limiting per IP.

**Future:** Implement anonymous session tokens or sign-in with Apple/Google for the Pro tier.

## How to Rotate APP_SECRET

If the `APP_SECRET` is compromised or you want to rotate it:

1. Generate a new 32-character random string:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(24))"
   ```
2. Update `APP_SECRET` in `W:\MyFrontier\.env` on the server.
3. Update `APP_SECRET` in `mobile/src/constants.ts`.
4. Redeploy the server first, then release a new app build.
5. The old value will stop working immediately on the server side. Users on old app versions will get HTTP 403 until they update.

## Steps to Harden Before Production

1. **Implement SSL certificate pinning** in `mobile/src/api.ts` (see above)
2. **Switch to Redis-backed rate limiting** — install `slowapi` + `redis`
3. **Set `ENV=production`** on the server so CORS is locked to your domain
4. **Enable HTTPS only** on the server — redirect HTTP to HTTPS, set HSTS headers
5. **Rotate `APP_SECRET`** from the placeholder value in `.env`
6. **Set real `ANTHROPIC_API_KEY`** — never use a test/demo key in production
7. **Add WAF rules** to block common attack patterns at the infrastructure level
8. **Review AdMob data collection** in the app's App Store privacy nutrition labels — be accurate about what AdMob collects
9. **Enable Expo Updates security** — sign OTA updates with your Expo account credentials

## Responsible Disclosure

If you discover a security vulnerability in My Frontier, please email support@myfrontierapp.com before disclosing publicly. We will acknowledge receipt within 48 hours.
