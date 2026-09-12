# 🏅 Asian Games 2026 — Analytics & Tracker Hub

> **Live Dashboard:**  
> ### 🔗 [Launch Live Dashboard](https://nj-1996.github.io/Asian-games-2026-predictions-/)

---

### Overview
Automated tracking, Monte Carlo medal simulations, and live performance calibration for the 2026 Asian Games.

* **📊 Live Match Tracker:** Real-time scores, match schedules, start times, and period states synced automatically every 30 minutes via background GitHub Actions.
* **🎯 Medal Projections:** 50,000-run Monte Carlo simulations weighted by FIBA World Rankings, FIBA Asia Cup 2025 results, 2023 Asian Games data, regional Margin of Victory (MoV), and a +3.8-point home-court boost for Japan.
* **📈 Real-Time Calibration:** Browser-side model verification tracking Favorite Win Rate (accuracy %), Contender Trajectories (*On Track*, *Contested*, *At Risk*), and live Upset Logs against actual tournament results.

---

### Repository Structure

```text
├── .github/workflows/
│   ├── tracker_cron.yml      # Background 30-min automated score sync
│   └── sample.yml            # Sandbox testing workflow
├── data/
│   └── basketball/
│       ├── predictions.json  # 50,000 Monte Carlo simulation outputs
│       ├── tracker_men.json  # Parsed live men's fixtures & scores
│       └── tracker_women.json# Parsed live women's fixtures & scores
├── scripts/
│   └── sync_basketball.py   # API fetch, zlib decompression, & parser
├── index.html                # Frontend dashboard (Tracker, Predictions, Calibration)
└── README.md
