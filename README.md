# 🏅 Asian Games 2026 — Analytics & Tracker Hub

> **Live Dashboard:**  
> ### 🔗 [Launch Live Dashboard](https://nj-1996.github.io/Asian-games-2026-predictions-/)

---

### Overview

Automated tracking, Monte Carlo medal simulations, and live performance calibration for the 2026 Asian Games basketball tournament. Hosted statically on GitHub Pages with automated, serverless data pipelines powered by GitHub Actions.

* **📊 Live Match Tracker & Hero Banner:** Real-time scores, match schedules, start times, and period states synced automatically every 30 minutes. Includes a dynamic **Next Match** hero banner with a live countdown timer until the next tip-off.
* **📋 FIBA Group Standings Engine:** Automatic standings calculation implementing official FIBA tournament table rules (2 pts for a win, 1 pt for a loss, point differential, and top-2 qualification status indicators).
* **🎯 50,000-Run Medal Projections:** Monte Carlo simulations weighted by FIBA World Rankings, FIBA Asia Cup 2025 results, 2023 Asian Games data, regional Margin of Victory (MoV), and a +3.8-point home-court boost for Japan.
* **📈 Real-Time Calibration:** Browser-side model verification tracking Favorite Win Rate (accuracy %, evaluated across completed tournament matches), Contender Trajectories (*On Track*, *Contested*, *At Risk*), and live Upset Logs.
* **⚡ On-Demand Live Sync:** One-tap header button that invokes the GitHub Actions scraper via authenticated `workflow_dispatch` with an interactive 14-second countdown spinner and toast feedback.
* **🚀 Parallelized Data Loading:** Concurrent asset resolution using `Promise.all` and `Promise.any` across data subpaths, completely eliminating sequential 404 network stalls.
* **🔄 Automated Cache-Busting:** Dynamic loader passing execution timestamps (`?v=Date.now()`) to guarantee mobile devices immediately pull updated code and data without manual version bumps.

---

### Repository Structure

```text
├── .github/workflows/
│   ├── tracker_cron.yml      # Background 30-min cron & manual workflow_dispatch trigger
│   └── sample.yml            # Sandbox testing workflow
├── css/
│   └── style.css             # Mobile-first UI, responsive tables, & sync animations
├── data/
│   └── basketball/
│       ├── predictions.json  # 50,000 Monte Carlo simulation outputs
│       ├── tracker_men.json  # Parsed live men's fixtures & scores
│       └── tracker_women.json# Parsed live women's fixtures & scores
├── js/
│   ├── core.js               # Shared utilities (NOC codes, flag assets, name normalizers)
│   ├── app.js                # State machine, parallel data loaders & API sync dispatcher
│   └── sports/
│       └── basketball.js     # Fixtures, standings engine, countdown hero & calibration
├── scripts/
│   └── sync_basketball.py    # API fetch, zlib decompression, & parser
├── index.html                # Application shell with deferred parallel asset loader
└── README.md
