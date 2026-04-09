# Deploy to Render (Free)

## Step-by-step (~10 minutes)

### 1. Create Render account
- Go to **render.com** → sign up free with GitHub

### 2. New Web Service
- Click **"New +"** → **"Web Service"**
- Connect repo: **ashtonwhales-del/my-frontier**
- Branch: **main**

### 3. Configure the service
| Setting | Value |
|---------|-------|
| Name | `my-frontier-api` |
| Runtime | Python |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn api:app --host 0.0.0.0 --port $PORT` |
| Instance Type | **Free** |

### 4. Environment Variables
Add these in the "Environment" tab before deploying:

| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | your key from aistudio.google.com |
| `APP_SECRET` | same value as in your local `.env` |
| `ENV` | `production` |

### 5. Deploy
- Click **"Create Web Service"**
- Wait ~3 minutes for first deploy
- Your URL: **https://my-frontier-api.onrender.com**

### 6. Verify
```
GET https://my-frontier-api.onrender.com/health
```
Expected:
```json
{"status":"ok","gemini":"configured","categories":99,"etfs_in_universe":321}
```

### 7. Update local .env
In `mobile/.env`, update:
```
EXPO_PUBLIC_API_URL=https://my-frontier-api.onrender.com
```
The hardcoded fallback in `mobile/src/api.ts` already points to this URL,
so even if `.env` is missing the app will hit Render.

### 8. Cancel Railway
Once Render is confirmed working, cancel Railway to stop charges:
- railway.app → your project → Settings → Delete Service

## Free tier notes
- Render free tier **spins down after 15 minutes of inactivity**
- First request after spin-down takes ~30 seconds (cold start)
- The app's existing `withRetry` wrapper handles this automatically
- Zero cost as long as you stay under 750 hours/month (free tier limit)
