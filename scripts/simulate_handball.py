import json
import random
import math

# ==============================================================================
# Asian Games 2026: Handball Monte Carlo Simulation Engine (50,000 Runs)
# Inputs:
# 1. 2026 Asian Men's Handball Championship (Kuwait, Jan 2026)
#    - 1st: Bahrain, 2nd: Qatar, 3rd: Kuwait, 4th: Japan, 5th: Korea, 6th: Iran
# 2. 2024 Asian Women's Handball Championship (New Delhi, Dec 2024)
#    - 1st: Japan, 2nd: Korea, 3rd: Kazakhstan, 5th: China, 7th: Hong Kong
# 3. 2022 Asian Games (Hangzhou, 2023)
#    - Men: 1st: Qatar, 2nd: Bahrain, 3rd: Kuwait, 4th: Japan, 5th: Korea, 6th: Iran
#    - Women: 1st: Japan, 2nd: Korea, 3rd: China, 4th: Kazakhstan, 6th: Hong Kong
# 4. IHF World Rankings / AHF Continental Rankings
#    - Men: Bahrain, Qatar, Japan, Kuwait, Korea, Iran, China, Kazakhstan, Hong Kong
#    - Women: Japan (World #18), Korea (World #20), China (World #39), Kazakhstan (World #45)
# Home Court Advantage: Japan +60 Elo rating boost (+2.5 goals)
# ==============================================================================

random.seed(20260924)
N_SIMS = 50000

# ------------------------------------------------------------------------------
# Baseline Ratings
# ------------------------------------------------------------------------------
# Men's Tournament
MEN_RATINGS = {
    "Bahrain": 2180,           # 2026 Asian Champion, 2022 AG Silver, AHF #1
    "Qatar": 2160,             # 2022 AG Gold, 2026 Asian Runner-up, multi-time champion
    "Japan (Host)": 2130,      # 2024 Olympic Qualifiers Champion, 4th in 2026 & 2022, +60 Home Boost
    "Kuwait": 2040,            # 2026 Asian Bronze, 2022 AG Bronze
    "Republic of Korea": 1990, # 5th in 2026 Asian Champ & 2022 AG, 6x AG champion
    "IR Iran": 1880,           # 6th in 2026 Asian Champ & 2022 AG
    "China": 1780,             # 7th in 2022 AG, 10th in 2024
    "Kazakhstan": 1640,        # 8th in 2022 AG, 14th in 2024
    "Hong Kong, China": 1580,  # 9th in 2022 AG, 13th in 2024
}

# Women's Tournament
WOMEN_RATINGS = {
    "Japan (Host)": 2240,      # 2024 Asian Champion, 2022 AG Gold, World #18, +60 Home Boost
    "Republic of Korea": 2210, # 2024 Asian Runner-up (24-25), 2022 AG Silver, World #20, 7x AG Gold
    "China": 1990,             # 2022 AG Bronze, 5th in 2024 Asian Champ, World #39
    "Kazakhstan": 1950,        # 2024 Asian Bronze, 4th in 2022 AG, World #45
    "Hong Kong, China": 1710,  # 7th in 2024 Asian Champ, 6th in 2022 AG
    "Vietnam": 1630,           # SEA regional contender
    "Uzbekistan": 1560,        # 7th in 2022 AG, developing team
}

def elo_prob(ra, rb):
    return 1.0 / (1.0 + 10.0 ** ((rb - ra) / 400.0))

def sim_handball_match(t1, t2, ratings, allow_draw=True):
    r1 = ratings[t1]
    r2 = ratings[t2]
    p1_win = elo_prob(r1, r2)
    
    # In handball group stages, ~7-8% draw probability when evenly matched
    if allow_draw:
        draw_prob = 0.075 * math.exp(-((r1 - r2) ** 2) / (2 * (160 ** 2)))
        p_t1 = p1_win * (1.0 - draw_prob)
        p_t2 = (1.0 - p1_win) * (1.0 - draw_prob)
        
        val = random.random()
        if val < p_t1:
            # t1 wins
            gd = max(1, int(random.gauss((r1 - r2) / 35.0, 4.0)))
            return t1, t2, gd
        elif val < p_t1 + draw_prob:
            # draw
            return None, None, 0
        else:
            # t2 wins
            gd = max(1, int(random.gauss((r2 - r1) / 35.0, 4.0)))
            return t2, t1, gd
    else:
        # Knockout match must have a winner (overtime / penalties)
        if random.random() < p1_win:
            return t1, t2, 1
        else:
            return t2, t1, 1

# ------------------------------------------------------------------------------
# 1. Men's Simulation (Group A & Group B -> QF -> SF -> Finals)
# ------------------------------------------------------------------------------
def sim_men_tournament():
    # Group A (4 teams)
    grp_a = ["China", "Japan (Host)", "Hong Kong, China", "Qatar"]
    # Group B (5 teams)
    grp_b = ["IR Iran", "Kuwait", "Kazakhstan", "Bahrain", "Republic of Korea"]
    
    def sim_group(teams):
        pts = {t: 0 for t in teams}
        gd = {t: 0 for t in teams}
        n = len(teams)
        for i in range(n):
            for j in range(i + 1, n):
                t1, t2 = teams[i], teams[j]
                w, l, diff = sim_handball_match(t1, t2, MEN_RATINGS, allow_draw=True)
                if w is None:
                    pts[t1] += 1
                    pts[t2] += 1
                else:
                    pts[w] += 2
                    gd[w] += diff
                    gd[l] -= diff
        # Sort by points desc, then gd desc, then rating desc
        return sorted(teams, key=lambda t: (pts[t], gd[t], MEN_RATINGS[t]), reverse=True)

    sorted_a = sim_group(grp_a)
    sorted_b = sim_group(grp_b)
    
    # Quarterfinals: Top 4 from Group A and Top 4 from Group B
    # QF 1: A1 vs B4
    qf1_w, _, _ = sim_handball_match(sorted_a[0], sorted_b[3], MEN_RATINGS, allow_draw=False)
    # QF 2: B2 vs A3
    qf2_w, _, _ = sim_handball_match(sorted_b[1], sorted_a[2], MEN_RATINGS, allow_draw=False)
    # QF 3: B1 vs A4
    qf3_w, _, _ = sim_handball_match(sorted_b[0], sorted_a[3], MEN_RATINGS, allow_draw=False)
    # QF 4: A2 vs B3
    qf4_w, _, _ = sim_handball_match(sorted_a[1], sorted_b[2], MEN_RATINGS, allow_draw=False)
    
    # Semifinals
    sf1_w, sf1_l, _ = sim_handball_match(qf1_w, qf2_w, MEN_RATINGS, allow_draw=False)
    sf2_w, sf2_l, _ = sim_handball_match(qf3_w, qf4_w, MEN_RATINGS, allow_draw=False)
    
    # Finals
    gold, silver, _ = sim_handball_match(sf1_w, sf2_w, MEN_RATINGS, allow_draw=False)
    bronze, _, _ = sim_handball_match(sf1_l, sf2_l, MEN_RATINGS, allow_draw=False)
    
    return gold, silver, bronze

# ------------------------------------------------------------------------------
# 2. Women's Simulation (Single Round-Robin Group of 7 Teams)
# ------------------------------------------------------------------------------
def sim_women_tournament():
    teams = list(WOMEN_RATINGS.keys())
    pts = {t: 0 for t in teams}
    gd = {t: 0 for t in teams}
    n = len(teams)
    
    for i in range(n):
        for j in range(i + 1, n):
            t1, t2 = teams[i], teams[j]
            w, l, diff = sim_handball_match(t1, t2, WOMEN_RATINGS, allow_draw=True)
            if w is None:
                pts[t1] += 1
                pts[t2] += 1
            else:
                pts[w] += 2
                gd[w] += diff
                gd[l] -= diff
                
    ranked = sorted(teams, key=lambda t: (pts[t], gd[t], WOMEN_RATINGS[t]), reverse=True)
    return ranked[0], ranked[1], ranked[2]

# ------------------------------------------------------------------------------
# Run Monte Carlo Simulations
# ------------------------------------------------------------------------------
def run_all_simulations():
    print(f"Running {N_SIMS:,} Monte Carlo simulations for Men's Handball...")
    men_tally = {t: {"gold": 0, "silver": 0, "bronze": 0} for t in MEN_RATINGS}
    for _ in range(N_SIMS):
        g, s, b = sim_men_tournament()
        men_tally[g]["gold"] += 1
        men_tally[s]["silver"] += 1
        men_tally[b]["bronze"] += 1
        
    print(f"Running {N_SIMS:,} Monte Carlo simulations for Women's Handball...")
    women_tally = {t: {"gold": 0, "silver": 0, "bronze": 0} for t in WOMEN_RATINGS}
    for _ in range(N_SIMS):
        g, s, b = sim_women_tournament()
        women_tally[g]["gold"] += 1
        women_tally[s]["silver"] += 1
        women_tally[b]["bronze"] += 1

    def format_results(tally):
        rows = []
        for team, counts in tally.items():
            g_pct = (counts["gold"] / N_SIMS) * 100.0
            s_pct = (counts["silver"] / N_SIMS) * 100.0
            b_pct = (counts["bronze"] / N_SIMS) * 100.0
            podium_pct = g_pct + s_pct + b_pct
            rows.append({
                "team": team,
                "gold_num": g_pct,
                "silver_num": s_pct,
                "bronze_num": b_pct,
                "podium_num": podium_pct,
                "gold": f"{g_pct:.1f}%",
                "silver": f"{s_pct:.1f}%",
                "bronze": f"{b_pct:.1f}%",
                "podium": f"{podium_pct:.1f}%"
            })
        # Sort by gold desc, then silver desc, then bronze desc
        rows.sort(key=lambda r: (r["gold_num"], r["silver_num"], r["bronze_num"]), reverse=True)
        for idx, r in enumerate(rows, 1):
            r["rank"] = idx
            del r["gold_num"]
            del r["silver_num"]
            del r["bronze_num"]
            del r["podium_num"]
        return rows

    men_preds = format_results(men_tally)
    women_preds = format_results(women_tally)

    output = {
        "sport": "Handball",
        "simulation_model": "Monte Carlo (50,000 Runs)",
        "weighting": "IHF World Rankings + 2026 Asian Men's Championship (Kuwait) + 2024 Asian Women's Championship (New Delhi) + 2022 Asian Games (Hangzhou) + Goal Differential",
        "home_court_boost": "+2.5 goals / +60 Elo (Japan)",
        "notes": "50,000 tournament simulations modeling round-robin group phase and knockout bracket. Dual bronzes not applicable (single bronze playoff).",
        "men": men_preds,
        "women": women_preds,
        "events": [
            {
                "id": "hbl_men",
                "event": "Men's Tournament",
                "gender": "men",
                "type": "team",
                "rankings": men_preds
            },
            {
                "id": "hbl_women",
                "event": "Women's Tournament",
                "gender": "women",
                "type": "team",
                "rankings": women_preds
            }
        ]
    }

    with open("data/handball/predictions.json", "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    print("[OK] Successfully generated data/handball/predictions.json")

    print("\n--- MEN'S SIMULATION RESULTS ---")
    for r in men_preds:
        print(f"{r['rank']}. {r['team']:18} | Gold: {r['gold']:6} | Silver: {r['silver']:6} | Bronze: {r['bronze']:6} | Podium: {r['podium']:6}")

    print("\n--- WOMEN'S SIMULATION RESULTS ---")
    for r in women_preds:
        print(f"{r['rank']}. {r['team']:18} | Gold: {r['gold']:6} | Silver: {r['silver']:6} | Bronze: {r['bronze']:6} | Podium: {r['podium']:6}")

if __name__ == "__main__":
    run_all_simulations()
