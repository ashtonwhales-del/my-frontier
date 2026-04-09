# Railway Environment Variables Required

Go to railway.app → your project → web service → Variables tab.
Add ALL of these if not already present:

| Variable | Value | Required? |
|----------|-------|-----------|
| GEMINI_API_KEY | your_key_from_aistudio.google.com | YES — Alex AI |
| APP_SECRET | your_value_matching_constants.ts | YES — auth |
| ENV | production | YES |
| ANTHROPIC_API_KEY | optional fallback | NO (Gemini is primary) |

## Getting your Gemini API key (free)
1. Go to aistudio.google.com
2. Click "Get API Key" → "Create API key"
3. Copy the key (starts with AIza...)
4. Paste into Railway Variables as GEMINI_API_KEY

## Verifying after deploy
Visit: https://web-production-3f67e.up.railway.app/health

Expected response:
```json
{
  "status": "ok",
  "gemini": "configured",
  ...
}
```

If you see `"gemini": "MISSING"` — the key is not set in Railway.

## Local testing
W:\MyFrontier\.env must contain:
```
GEMINI_API_KEY=AIza...your_key
```
