# APCDS Control Center (PWA)

Static, dependency-free dashboard for the APCDS crowd-safety system. Plain HTML/CSS/JS — no build step.

## Run locally
```bash
npx serve .          # or: python3 -m http.server 3000
```
Service workers need `localhost` or HTTPS.

## Deploy to Vercel
```bash
git init && git add . && git commit -m "APCDS dashboard"
# push to GitHub, then import the repo at vercel.com/new
# Framework preset: Other — no build command, no output directory.
```

## Modes
- **Demo** (default): simulated data, works anywhere, including offline.
- **Live**: set the Dashboard API URL (`http://127.0.0.1:8000`) and video feed URL in ⚙ Settings.
  Your Python backend (`dashboard_api.py`, core server) must run on your own machine — it needs camera,
  mic and serial hardware, so it can't run on Vercel. Browsers allow an HTTPS site to call
  `http://localhost`, but for a backend on another machine expose it via HTTPS (e.g. Cloudflare Tunnel);
  the FastAPI CORS config already allows any origin.

## PWA
Manifest, icons and `sw.js` are included. After deploying, open the site in Chrome/Edge and use
"Install app" (or Share → Add to Home Screen on iOS). Bump `VERSION` in `sw.js` when you change cached files.
