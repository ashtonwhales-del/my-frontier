# Keep Render Awake — Free with UptimeRobot

Render free tier sleeps after 15 minutes of inactivity.
UptimeRobot pings it every 5 minutes — keeps it awake 24/7 for $0.

## Setup (5 minutes)

1. Go to **uptimerobot.com** → sign up free (no credit card)
2. Click **"Add New Monitor"**
3. Fill in:
   | Field | Value |
   |-------|-------|
   | Monitor Type | HTTP(s) |
   | Friendly Name | My Frontier API |
   | URL | `https://my-frontier-api.onrender.com/health` |
   | Monitoring Interval | **5 minutes** |
4. Click **"Create Monitor"**

Done. Your backend now stays warm 24/7.

## What this fixes
- Without UptimeRobot: first user request after 15min idle → 30s cold start
- With UptimeRobot: server is always warm → responses in 1–3s

## Bonus: free alerts
UptimeRobot will email you if the server goes down.
Add your email in the "Alert Contacts" section.

## Cost
- UptimeRobot free tier: up to 50 monitors, 5-minute intervals → **$0/month**
- Render free tier: 750 hours/month → **$0/month**
- Total backend cost: **$0/month**
