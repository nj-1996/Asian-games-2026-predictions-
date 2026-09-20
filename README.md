# 🏅 Asian Games 2026 — Analytics & Tracker Hub

> **Live Dashboard:**  
> ### 🔗 [Launch Live Dashboard](https://nj-1996.github.io/Asian-games-2026-predictions-/)

---

### Overview

Automated tracking, Monte Carlo medal simulations, and live performance calibration for the 2026 Asian Games. Hosted statically on GitHub Pages with automated, serverless data pipelines powered by GitHub Actions.

**Supported sports:** 🏀 Basketball · ⚽ Football · 🏐 Volleyball · 🎯 Modern Pentathlon · 🏏 Cricket — switchable from the header dropdown.

* **📊 Live Match Tracker & Hero Banner:** Real-time scores, match schedules, start times, and period states synced automatically every 30 minutes. Includes a dynamic **Next Match** hero banner with a live countdown timer until the next tip-off.
* **📋 Sport-Specific Views:** Per-sport engines driven by `window.SPORT_ENGINES`. Basketball implements official **FIBA group standings** (2 pts for a win, 1 pt for a loss, point differential, and top-2 qualification indicators) plus a knockout bracket; Modern Pentathlon uses a dedicated cutoff/prior-accuracy calibration model.
* **🎯 50,000-Run Medal Projections:** Monte Carlo simulations weighted by FIBA World Rankings, FIBA Asia Cup 2025 results, 2023 Asian Games data, regional Margin of Victory (MoV), and a +3.8-point home-court boost for Japan.
* **📈 Real-Time Calibration:** Browser-side model verification tracking Favorite Win Rate (accuracy %, evaluated across completed tournament matches), Contender Trajectories (*On Track*, *Contested*, *At Risk*), and live Upset Logs.
* **⚡ On-Demand Live Sync:** One-tap header button that triggers the GitHub Actions scraper via authenticated `workflow_dispatch`, polls the run to completion, and reports status with a countdown spinner and toast feedback.
* **🕒 Timezone-Aware Schedule:** Match times are normalized to venue time (JST) by the scrapers and converted client-side (default IST) with automatic date rollover.
* **🚀 Parallelized Data Loading:** Concurrent asset resolution using `Promise.all` and `Promise.any` across data subpaths, completely eliminating sequential 404 network stalls.
* **🔄 Automated Cache-Busting:** Dynamic loader passing execution timestamps (`?v=Date.now()`) to guarantee mobile devices immediately pull updated code and data without manual version bumps.

---

### Repository Structure

```text
├── .github/workflows/
│   ├── tracker_cron.yml            # Background 30-min cron & manual workflow_dispatch trigger
│   └── sample.yml                  # Sandbox workflow that decodes one raw API day
├── css/
│   └── style.css                   # Mobile-first UI, responsive tables, & sync animations
├── data/
│   ├── api_sample.json             # Decoded raw API snapshot (debug reference)
│   └── <sport>/                    # One folder per sport
│       ├── predictions.json        # Monte Carlo simulation outputs
│       ├── tracker_men.json        # Parsed live men's fixtures & scores
│       └── tracker_women.json      # Parsed live women's fixtures & scores
├── js/
│   ├── core.js                     # Shared utilities (flag registry, name/stage
│   │                               #   normalizers, time formatting, universal
│   │                               #   renderers & view router)
│   ├── app.js                      # State machine, parallel data loaders & API sync dispatcher
│   └── sports/
│       ├── basketball.js           # FIBA standings engine & knockout bracket
│       ├── football.js
│       ├── volleyball.js
│       ├── modern_pentathlon.js    # Cutoff & prior-accuracy calibration model
│       └── cricket.js
├── scripts/
│   ├── sync_basketball.py          # API fetch, zlib decompression, & parser
│   ├── sync_football.py
│   ├── sync_volleyball.py
│   ├── sync_modern_pentathlon.py
│   └── sync_cricket.py
├── index.html                      # Application shell with cache-busted script loader
└── README.md
```

> **Data flow:** GitHub Actions runs the `sync_*.py` scrapers every 30 minutes → each script decompresses and parses the official AG2026 results API → updated `tracker_*.json` files are committed back → GitHub Pages serves fresh data to the client, which fetches it concurrently and renders the active tab.

---

### Running Locally

The dashboard is fully static — serve the repo root over HTTP (not `file://`) so the data fetches work:

```bash
python -m http.server 8000   # then open http://localhost:8000
```

To refresh data manually, run any scraper (requires `pip install requests`):

```bash
python scripts/sync_basketball.py
```
