# My Frontier

Personalized ETF portfolio builder powered by Nobel Prize-winning mean-variance optimization. Not financial advice.

## Project Overview

My Frontier has two components:

| Component | Stack | Purpose |
|---|---|---|
| `optimizer.py` / `api.py` | Python + FastAPI | Downloads ETF price data, runs portfolio optimization, serves results via REST API |
| `mobile/` | React Native + Expo | iOS/Android app — user-facing questionnaire, results display, AI advisor chat |

## Running Locally

### 1. Backend (Python API)

```bash
# Install dependencies
pip install -r requirements.txt

# Create your .env file (copy from the template)
cp .env .env.local   # then edit with real values

# Start the API server (default: http://localhost:8000)
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://<your-local-ip>:8000`. Check `/health` to verify.

### 2. Mobile App (Expo)

```bash
cd mobile

# Install dependencies
npm install

# Install native packages
npx expo install @react-native-community/netinfo expo-updates

# Start the Expo dev server
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i` for iOS simulator / `a` for Android emulator.

**Update `mobile/src/api.ts`** — change `BASE_URL` to your machine's local IP address (e.g., `http://192.168.1.X:8000`). The emulator cannot reach `localhost`.

## Environment Variables

Create `W:\MyFrontier\.env` (never commit this file):

| Variable | Description | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic API key for the AI advisor | Yes |
| `APP_SECRET` | 32-char random string — must match `APP_SECRET` in `mobile/src/constants.ts` | Yes |
| `ENV` | `development` or `production` — controls CORS policy | Yes |

## Deploying to Production

1. **Backend**: Deploy `api.py` + `optimizer.py` to a cloud server (e.g., Railway, Render, AWS). Set all environment variables. Set `ENV=production`.
2. **CORS**: Update `api.py` `_allowed_origins` to your real app domain.
3. **Mobile**: Update `BASE_URL` in `mobile/src/api.ts` to your production API URL. Build with `npx expo build` or EAS Build.
4. **APP_SECRET**: Rotate before production. Generate a new 32-char string, update `.env` on the server and `constants.ts` in the app, then redeploy both.

## App Store Submission Checklist

- [ ] Replace `APP_SECRET` placeholder with a production-generated value
- [ ] Set real `GEMINI_API_KEY` in server `.env`
- [ ] Update `BASE_URL` in `api.ts` to production URL
- [ ] Update AdMob app IDs in `app.json` to real production IDs
- [ ] Implement SSL certificate pinning (see `SECURITY.md`)
- [ ] Replace App Store rating URL placeholder in `AboutScreen.tsx`
- [ ] Replace privacy policy URL placeholder in `app.json`
- [ ] Verify all screens have correct back navigation
- [ ] Test on physical iOS and Android devices
- [ ] Confirm `ENV=production` on the server
- [ ] Run `npx expo doctor` — resolve any warnings
- [ ] Submit for App Store review with accurate privacy nutrition labels
