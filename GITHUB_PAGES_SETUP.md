# GitHub Pages Setup — My Frontier

The `docs/` folder contains the Privacy Policy and Support page that Apple requires for App Store
submission. These two URLs must be live and publicly accessible before you submit your first build.

GitHub Pages hosts them for free directly from this repository.

---

## Step 1: Push the docs/ folder to GitHub

Make sure your latest commit (which includes `docs/`) is pushed to the `main` branch:

```bash
cd W:\MyFrontier
git add docs/
git commit -m "Add privacy policy and support pages for App Store submission"
git push origin main
```

---

## Step 2: Enable GitHub Pages in Repository Settings

1. Go to your GitHub repository: `https://github.com/ashtonwhales-del/my-frontier`
2. Click **Settings** (top navigation bar)
3. In the left sidebar, click **Pages** (under "Code and automation")
4. Under **Source**, select:
   - Branch: `main`
   - Folder: `/docs`
5. Click **Save**

GitHub will display a banner: *"Your site is published at https://ashtonwhales-del.github.io/my-frontier/"*

---

## Step 3: Verify the URLs are Live

Wait 1–2 minutes for the initial deployment, then check:

| Page | URL |
|------|-----|
| Privacy Policy | https://ashtonwhales-del.github.io/my-frontier/privacy-policy.html |
| Support | https://ashtonwhales-del.github.io/my-frontier/support.html |

Both pages should load with the dark navy design matching the app.

---

## Step 4: Add the URLs to App Store Connect

In App Store Connect → My Frontier → App Information:

| Field | Value |
|-------|-------|
| **Privacy Policy URL** | `https://ashtonwhales-del.github.io/my-frontier/privacy-policy.html` |
| **Support URL** | `https://ashtonwhales-del.github.io/my-frontier/support.html` |

These URLs are also already stored in `mobile/app.json` under `expo.extra.privacyPolicyUrl`
and `expo.extra.supportUrl` for reference.

---

## Step 5: Future Updates

To update either page after launch:

1. Edit the HTML file in `docs/` locally
2. `git add docs/ && git commit -m "Update privacy policy" && git push origin main`
3. GitHub Pages redeploys automatically within 1–2 minutes — no App Store resubmission needed

---

## Troubleshooting

**404 on the URL:**
- Confirm GitHub Pages source is set to `main` branch, `/docs` folder (not `/root`)
- Confirm the file names are lowercase: `privacy-policy.html`, `support.html`
- Wait up to 5 minutes — GitHub Pages can be slow on first deploy

**Custom domain (optional, post-launch):**
- Buy `myfrontierapp.com` (~$12/year on Namecheap)
- In GitHub Pages settings → Custom domain → enter `myfrontierapp.com`
- Add a CNAME DNS record pointing to `ashtonwhales-del.github.io`
- Update `mobile/app.json` URLs and resubmit to App Store

---

*Last updated: 2026-04-06 — Phase 11 pre-launch*
