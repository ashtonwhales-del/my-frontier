# Google Gemini Setup for Alex AI

Alex AI now runs on Google Gemini 1.5 Flash — **completely free forever** on the free tier.

## Free Tier Limits
- 15 requests per minute
- 1 million tokens per day
- No credit card required

## Setup Steps

1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Click **"Get API Key"** → **Create API key**
3. Copy the key (starts with `AIza...`)
4. Add to `W:\MyFrontier\.env`:
   ```
   GEMINI_API_KEY=AIza...your_key_here
   ```
5. Add to Railway environment variables:
   - Key: `GEMINI_API_KEY`
   - Value: your key

## Fallback

If `GEMINI_API_KEY` is missing or Gemini fails, Alex automatically falls back to
Anthropic Claude Haiku (requires `ANTHROPIC_API_KEY`). If neither key is set, Alex
returns a 503 with a clear message.

## Model

- **Primary**: `gemini-1.5-flash` — fast, free, 1M context window
- **Fallback**: `claude-haiku-4-5-20251001` — requires `ANTHROPIC_API_KEY`

## Testing

After setting the key, restart the server and send a message to Alex via the app.
Check `logs/api.log` — you should see `model: gemini-1.5-flash` in the response log.
