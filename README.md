# 💸 Ef Calculator

> A financial-health calculator for freelance video editors. Answer ~9 quick questions, get your score (0–100), real benchmark against 15M Indian freelancers, and personalized recommendations.

**Live demo:** _coming soon — enable GitHub Pages after pushing_

---

## ✨ Features

- **Wizard flow** — one question at a time, top progress bar
- **Slider + click-to-type** — every number is a slider AND an editable input
- **Composite score (0–100)** across 6 dimensions: profit margin, savings rate, emergency fund, debt health, goal progress, income diversity
- **Real benchmark** — "You're better than X people in India" (based on NASSCOM 2024 freelancer pop. estimate)
- **Live adjustment** — drag any slider on the result screen to see your score react
- **Custom expenses** — add unlimited custom expense categories with `+` button
- **Monthly + Yearly** breakdown
- **Google sign-in** (mandatory) — pure client-side, no backend
- **WhatsApp capture** — collect contact for follow-up
- **Auto-save to Google Sheet** via Apps Script
- **Downloadable PDF report** (via browser print)
- **WhatsApp share** — send your score to friends
- **Mobile-first dark UI** with orange/amber gradient accent

---

## 🛠️ Setup (one-time, ~10 minutes)

### 1. Google OAuth Client (for sign-in)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - Fill app name, support email
   - Scopes: leave default
   - Add yourself as a test user
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:5500` (for local dev)
     - `https://YOUR_USERNAME.github.io` (after deploy)
5. Copy the **Client ID** (looks like `1234567890-abc...apps.googleusercontent.com`)
6. Open `index.html` → replace `YOUR_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com` with your client ID

### 2. Google Sheet + Apps Script (for saving data)

1. Create a new Google Sheet → name it whatever
2. Copy the **Sheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_THE_ID`**`/edit`
3. In the Sheet: **Extensions → Apps Script**
4. Delete the boilerplate, paste contents of [`apps-script.gs`](./apps-script.gs)
5. Replace `PASTE_YOUR_GOOGLE_SHEET_ID_HERE` with your Sheet ID
6. Save (💾 icon)
7. **Deploy → New deployment**
   - Type: **Web app**
   - Description: "Ef Calculator endpoint"
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Click **Deploy** → authorize (will warn "unsafe" because it's your own script — click Advanced → Go to project)
9. Copy the **Web App URL** (ends in `/exec`)
10. Open `index.html` → replace `YOUR_APPS_SCRIPT_WEB_APP_URL` with that URL

### 3. Deploy to GitHub Pages

If repo is already created and pushed:

```bash
# Enable Pages
gh api -X POST repos/$(gh api user --jq .login)/ef-calculator/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

Or manually: **Repo → Settings → Pages → Source: `main` / root → Save**.

After enabling, your app lives at: `https://YOUR_USERNAME.github.io/ef-calculator/`

Remember: **add this URL to OAuth Authorized JS Origins** (Step 1.4).

---

## 🧪 Local development

Open `index.html` directly in a browser, OR serve with any static server:

```bash
# Python 3
python -m http.server 5500

# Node
npx serve -p 5500
```

Then visit `http://localhost:5500`.

> Note: Google sign-in only works on `http://localhost` and HTTPS — opening the `file://` URL won't authorize.

---

## 📊 Score formula

```
Score (0–100) = sum of:
  Profit Margin     (25 max) — (income - expense) / income → 40%+ margin = full marks
  Savings Rate      (20 max) — investments / income → 20% = full marks
  Emergency Fund    (20 max) — fund / (6 × monthly expenses) = full marks
  Debt Health       (15 max) — 1 - (EMI / income) → no EMI = full
  Goal Progress     (10 max) — income / target income
  Income Diversity  (10 max) — 1 stream = 2, 2 = 5, 3 = 8, 4+ = 10
```

Stages: 🚨 Critical (0–24) · ⚠️ At Risk (25–39) · ⚖️ Stable (40–54) · 📈 Growing (55–69) · 💎 Thriving (70–84) · 🏆 Elite (85–100)

---

## 🛡️ Privacy

- Google sign-in is used only to label the report — no Drive/Gmail scopes requested
- All inputs stored locally in `localStorage` (your browser only)
- Submitted reports go to **your own** Google Sheet (you control it)
- No third-party analytics, no tracking, no cookies

---

## 🧱 Tech stack

- **Frontend:** Single-file vanilla HTML/CSS/JS (no build step)
- **Charts:** [Chart.js 4.4](https://www.chartjs.org/) (CDN)
- **Auth:** [Google Identity Services](https://developers.google.com/identity/gsi/web) (client-side, free)
- **Storage:** Google Apps Script Web App → Google Sheet (free, zero infra)
- **Hosting:** GitHub Pages

---

## 📄 License

MIT — see [LICENSE](./LICENSE)
