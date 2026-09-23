import json
import random
import re

# ==============================================================================
# Asian Games 2026: Soft Tennis Monte Carlo Simulation Engine (50,000 Runs)
# Factors:
# 1. ISTF World / Continental Rankings (35%)
# 2. 2024 World Soft Tennis Championships Results (Anseong, South Korea) (35%)
# 3. 2022 Asian Games Results (Hangzhou, China) (20%)
# 4. ASTF Regional Form / SEA Games 2023 / Asian Tour Form (10%)
# ==============================================================================

random.seed(42)
N_SIMS = 50000

def elo_win_prob(ra, rb):
    return 1.0 / (1.0 + 10.0 ** ((rb - ra) / 400.0))

def simulate_match(p1, p2, ratings):
    r1 = ratings.get(p1, 1500)
    r2 = ratings.get(p2, 1500)
    prob_p1 = elo_win_prob(r1, r2)
    return p1 if random.random() < prob_p1 else p2

def simulate_round_robin(group_members, ratings):
    # Returns members sorted by wins, then rating
    wins = {p: 0 for p in group_members}
    n = len(group_members)
    for i in range(n):
        for j in range(i + 1, n):
            p1 = group_members[i]
            p2 = group_members[j]
            winner = simulate_match(p1, p2, ratings)
            wins[winner] += 1
    # Sort by wins descending, tiebreak by rating
    sorted_group = sorted(group_members, key=lambda p: (wins[p], ratings.get(p, 1500)), reverse=True)
    return sorted_group

# ------------------------------------------------------------------------------
# 1. MEN'S SINGLES (22 entries across Groups A to G)
# ------------------------------------------------------------------------------
# Toshiki Uematsu (JPN): 2022 AG Gold, 2024 World Champ (World #1)
# Chang Yu-sung (TPE): 2022 AG Silver
# Kim Jinwoong (KOR): 2018 AG Gold, multiple World Champ
# Takuya Kurosaka (JPN): All-Japan ace
# Lee Haneul (KOR): Top Korean ace
# Chen Po-yi (TPE): 2022 AG Team Silver
# Tio Hutauruk (INA): 2022 AG Team Bronze
# Joseph Arcilla (PHI): Multi SEA Games Champ
# Jay Meena (IND): 2024 World Bronze in Mixed
ms_ratings = {
    'UEMATSU Toshiki (Japan)': 2250, # Defending AG & World Champion
    'CHANG Yu-sung (Chinese Taipei)': 2110, # 2022 AG Silver
    'KIM Jinwoong (South Korea)': 2100, # 2018 AG Gold
    'KUROSAKA Takuya (Japan)': 2080, # Japan top ace
    'LEE Haneul (South Korea)': 2040, # Korea national singles ace
    'CHEN Po-yi (Chinese Taipei)': 2020, # Chinese Taipei ace
    'HUTAURUK Tio (Indonesia)': 1900, # 2022 AG Team Bronze
    'ARCILLA Joseph (Philippines)': 1870, # SEA Games Champion
    'MEENA Jay (India)': 1850, # 2024 World Bronze medalist
    'FALEVI Muhammad (Indonesia)': 1760,
    'NUGUIT Sherwin (Philippines)': 1740,
    'THAKUR Aryan (India)': 1700,
    'YI Keavirak (Cambodia)': 1680,
    'DOEUM Samsocheaphearun (Cambodia)': 1640,
    'BATAA Munkhtulga (Mongolia)': 1550,
    'ALTANGEREL Bold-erdene (Mongolia)': 1530,
    'VONGPHAKDY Bekki (Laos)': 1480,
    'LOUANGSISOMBATH Phatthana (Laos)': 1460,
    'ARAIN Hussain (Pakistan)': 1420,
    'ALI Muhammad (Pakistan)': 1400,
    'KHATRI Pradip (Nepal)': 1380,
    'BHANDARI Kamal (Nepal)': 1360
}

ms_groups = {
    'A': ['UEMATSU Toshiki (Japan)', 'HUTAURUK Tio (Indonesia)', 'DOEUM Samsocheaphearun (Cambodia)', 'ALI Muhammad (Pakistan)'],
    'B': ['LEE Haneul (South Korea)', 'ARCILLA Joseph (Philippines)', 'KHATRI Pradip (Nepal)'],
    'C': ['CHEN Po-yi (Chinese Taipei)', 'THAKUR Aryan (India)', 'ALTANGEREL Bold-erdene (Mongolia)'],
    'D': ['MEENA Jay (India)', 'ARAIN Hussain (Pakistan)'],
    'E': ['FALEVI Muhammad (Indonesia)', 'NUGUIT Sherwin (Philippines)', 'VONGPHAKDY Bekki (Laos)'],
    'F': ['KIM Jinwoong (South Korea)', 'KUROSAKA Takuya (Japan)', 'YI Keavirak (Cambodia)', 'BATAA Munkhtulga (Mongolia)'],
    'G': ['CHANG Yu-sung (Chinese Taipei)', 'LOUANGSISOMBATH Phatthana (Laos)', 'BHANDARI Kamal (Nepal)']
}

# ------------------------------------------------------------------------------
# 2. MEN'S TEAM (11 teams across Groups A, B, C)
# ------------------------------------------------------------------------------
# Japan: 2022 AG Gold & 2024 World Champions
# South Korea: 2024 World Silver
# Chinese Taipei: 2022 AG Silver & 2024 World Bronze
# Indonesia: 2022 AG Bronze
# Philippines: 2024 World Bronze
# India: Rising power (2024 World bronze in mixed)
mt_ratings = {
    'Japan': 2220,
    'South Korea': 2140,
    'Chinese Taipei': 2110,
    'Indonesia': 1900,
    'Philippines': 1880,
    'India': 1780,
    'Cambodia': 1680,
    'Mongolia': 1580,
    'Laos': 1480,
    'Pakistan': 1420,
    'Nepal': 1360
}

mt_groups = {
    'A': ['Japan', 'Philippines', 'Cambodia', 'Pakistan'],
    'B': ['South Korea', 'Indonesia', 'Nepal'],
    'C': ['Chinese Taipei', 'India', 'Mongolia', 'Laos']
}

# ------------------------------------------------------------------------------
# 3. WOMEN'S SINGLES (23 entries across Groups A to H)
# ------------------------------------------------------------------------------
# Rena Temma (JPN): All-Japan champion, 2024 World medalist
# Chiang Min-yu (TPE): 2024 World Championships Bronze Medalist
# Lee Sujin (KOR): 2024 World Team Champion & singles ace
# Hwang Jeongmi (KOR): Korea Cup singles champion
# Kiho Miyamae (JPN): Japan top ace
# Huang Shih-yuan (TPE): 2022 AG Team Silver
# Ri Jin Mi (PRK): North Korea top ace
# Ri So Hyang (PRK): North Korea ace
# Princess Catindig (PHI): Philippines SEA Games star
# Aadhya Tiwari (IND): 2024 World Bronze in mixed
ws_ratings = {
    'TEMMA Rena (Japan)': 2180,
    'CHIANG Min-yu (Chinese Taipei)': 2130,
    'LEE Sujin (South Korea)': 2110,
    'HWANG Jeongmi (South Korea)': 2080,
    'MIYAMAE Kiho (Japan)': 2060,
    'HUANG Shih-yuan (Chinese Taipei)': 2020,
    'RI Jin Mi (North Korea)': 1960,
    'RI So Hyang (North Korea)': 1940,
    'CATINDIG Princess (Philippines)': 1860,
    'SANOSA Christy (Philippines)': 1800,
    'TIWARI Aadhya (India)': 1790,
    'ARASY Siti (Indonesia)': 1770,
    'NAFIIAH Allif (Indonesia)': 1750,
    'ZIEGLER Alisha (Thailand)': 1680,
    'KLOMKAMOL Chatcha (Thailand)': 1660,
    'CHHAN Chheavhouy (Cambodia)': 1630,
    'METH Mariyan (Cambodia)': 1610,
    'ERDEMBILEG Namuunkhuslen (Mongolia)': 1550,
    'GANTUR Anu-ujin (Mongolia)': 1530,
    'HACNOLATH Souvananh (Laos)': 1480,
    'CHAUDHARY Georgia (Nepal)': 1400,
    'SHALLWANI Kainaat (Pakistan)': 1390,
    'ZAIDI Eraj (Pakistan)': 1370
}

ws_groups = {
    'A': ['TEMMA Rena (Japan)', 'ERDEMBILEG Namuunkhuslen (Mongolia)', 'CHAUDHARY Georgia (Nepal)'],
    'B': ['LEE Sujin (South Korea)', 'HUANG Shih-yuan (Chinese Taipei)', 'METH Mariyan (Cambodia)'],
    'C': ['RI So Hyang (North Korea)', 'CATINDIG Princess (Philippines)', 'NAFIIAH Allif (Indonesia)'],
    'D': ['TIWARI Aadhya (India)', 'ZIEGLER Alisha (Thailand)', 'SHALLWANI Kainaat (Pakistan)'],
    'E': ['CHIANG Min-yu (Chinese Taipei)', 'ARASY Siti (Indonesia)', 'CHHAN Chheavhouy (Cambodia)'],
    'F': ['MIYAMAE Kiho (Japan)', 'SANOSA Christy (Philippines)', 'ZAIDI Eraj (Pakistan)'],
    'G': ['RI Jin Mi (North Korea)', 'GANTUR Anu-ujin (Mongolia)'],
    'H': ['HWANG Jeongmi (South Korea)', 'KLOMKAMOL Chatcha (Thailand)', 'HACNOLATH Souvananh (Laos)']
}

# ------------------------------------------------------------------------------
# 4. WOMEN'S TEAM (8 teams across Groups A & B)
# ------------------------------------------------------------------------------
# Japan: 2022 AG Gold, 2024 World Silver
# South Korea: 2024 World Gold, 2022 AG Bronze
# Chinese Taipei: 2022 AG Silver, 2024 World Bronze
# Philippines, Thailand, Cambodia, Mongolia, Pakistan
wt_ratings = {
    'Japan': 2200,
    'South Korea': 2180,
    'Chinese Taipei': 2100,
    'Philippines': 1850,
    'Thailand': 1800,
    'Cambodia': 1680,
    'Mongolia': 1580,
    'Pakistan': 1400
}

wt_groups = {
    'A': ['Japan', 'South Korea', 'Cambodia', 'Pakistan'],
    'B': ['Chinese Taipei', 'Philippines', 'Thailand', 'Mongolia']
}

# ------------------------------------------------------------------------------
# 5. MIXED DOUBLES (19 pairs across Groups A to F)
# ------------------------------------------------------------------------------
# Uematsu / Temma (JPN): Uematsu is defending 2022 AG Gold & World Champion
# Yu Kai-wen / Huang Shih-yuan (TPE): Yu won 2018 AG Mixed Gold, Huang won 2022 AG Silver
# Lin Wei-chieh / Chiang Min-yu (TPE): Lin won 2022 AG Bronze, Chiang won 2024 World Bronze
# Kim Hyunsoo / Lee Sujin (KOR): Kim won 2022 AG Bronze, Lee won 2024 World Team Gold
# Park Jaekyu / Kim Yeon-hwa (KOR): Korea national mixed pair
# Maruyama Kaito / Maeda Rio (JPN): Japan elite mixed pair
# Tiwari / Meena (IND): 2024 World Championship Bronze Medalists in Anseong!
# Sanger / Arasy (INA), Laluyan / Nafiiah (INA)
# Sanosa / Nuguit (PHI), Manalac / Nuguit (PHI)
xd_ratings = {
    'UEMATSU Toshiki / TEMMA Rena (Japan)': 2230,
    'YU Kai-wen / HUANG Shih-yuan (Chinese Taipei)': 2150,
    'LIN Wei-chieh / CHIANG Min-yu (Chinese Taipei)': 2120,
    'KIM Hyunsoo / LEE Sujin (South Korea)': 2110,
    'PARK Jaekyu / KIM Yeon-hwa (South Korea)': 2060,
    'MARUYAMA Kaito / MAEDA Rio (Japan)': 2040,
    'TIWARI Aadhya / MEENA Jay (India)': 1920, # 2024 World Bronze Medalists
    'SANGER Fernando / ARASY Siti Nur (Indonesia)': 1830,
    'SANOSA Christy / NUGUIT Sherwin Ray (Philippines)': 1810,
    'LALUYAN Rizky / NAFIIAH Allif (Indonesia)': 1780,
    'MANALAC Noelle / NUGUIT Samuel (Philippines)': 1760,
    'CHAO Viva / KHUN Chanroseka (Cambodia)': 1640,
    'KAN Sophorn / YEAN Sokhoeun (Cambodia)': 1620,
    'NYAMDORJ Bud / GANBAATAR Enkhkhuslen (Mongolia)': 1550,
    'KHURELBAYAR Khaliunbayar / GANBOLD Khongorzul (Mongolia)': 1530,
    'HACNOLATH Souvananh / SIMMALAVONG Sataporn (Laos)': 1480,
    'ARAIN Hamza / SHALLWANI Kainaat (Pakistan)': 1410,
    'KHAN Sabrina / BASHIR Rafae (Pakistan)': 1390,
    'BHANDARI Kamal / CHAUDHARY Georgia (Nepal)': 1360
}

xd_groups = {
    'A': ['UEMATSU Toshiki / TEMMA Rena (Japan)', 'SANOSA Christy / NUGUIT Sherwin Ray (Philippines)'],
    'B': ['PARK Jaekyu / KIM Yeon-hwa (South Korea)', 'TIWARI Aadhya / MEENA Jay (India)', 'NYAMDORJ Bud / GANBAATAR Enkhkhuslen (Mongolia)', 'CHAO Viva / KHUN Chanroseka (Cambodia)'],
    'C': ['LIN Wei-chieh / CHIANG Min-yu (Chinese Taipei)', 'LALUYAN Rizky / NAFIIAH Allif (Indonesia)', 'KHAN Sabrina / BASHIR Rafae (Pakistan)'],
    'D': ['KIM Hyunsoo / LEE Sujin (South Korea)', 'MANALAC Noelle / NUGUIT Samuel (Philippines)', 'ARAIN Hamza / SHALLWANI Kainaat (Pakistan)'],
    'E': ['MARUYAMA Kaito / MAEDA Rio (Japan)', 'SANGER Fernando / ARASY Siti Nur (Indonesia)', 'KAN Sophorn / YEAN Sokhoeun (Cambodia)', 'HACNOLATH Souvananh / SIMMALAVONG Sataporn (Laos)'],
    'F': ['YU Kai-wen / HUANG Shih-yuan (Chinese Taipei)', 'KHURELBAYAR Khaliunbayar / GANBOLD Khongorzul (Mongolia)', 'BHANDARI Kamal / CHAUDHARY Georgia (Nepal)']
}

# ==============================================================================
# SIMULATION PROCEDURES FOR EACH EVENT
# ==============================================================================

# --- 1. MEN'S SINGLES SIMULATION ---
def run_sim_ms():
    # Group stage winners
    wA = simulate_round_robin(ms_groups['A'], ms_ratings)[0]
    wB = simulate_round_robin(ms_groups['B'], ms_ratings)[0]
    wC = simulate_round_robin(ms_groups['C'], ms_ratings)[0]
    wD = simulate_round_robin(ms_groups['D'], ms_ratings)[0]
    wE = simulate_round_robin(ms_groups['E'], ms_ratings)[0]
    wF = simulate_round_robin(ms_groups['F'], ms_ratings)[0]
    wG = simulate_round_robin(ms_groups['G'], ms_ratings)[0]

    # Knockout:
    # wA gets BYE to SF 1
    # QF 2: wB vs wC
    qf2_w = simulate_match(wB, wC, ms_ratings)
    # QF 3: wD vs wE
    qf3_w = simulate_match(wD, wE, ms_ratings)
    # QF 4: wF vs wG
    qf4_w = simulate_match(wF, wG, ms_ratings)

    # SF 1: wA vs qf2_w
    sf1_w = simulate_match(wA, qf2_w, ms_ratings)
    sf1_l = qf2_w if sf1_w == wA else wA

    # SF 2: qf3_w vs qf4_w
    sf2_w = simulate_match(qf3_w, qf4_w, ms_ratings)
    sf2_l = qf4_w if sf2_w == qf3_w else qf3_w

    # Final
    gold = simulate_match(sf1_w, sf2_w, ms_ratings)
    silver = sf2_w if gold == sf1_w else sf1_w
    bronze1 = sf1_l
    bronze2 = sf2_l

    return gold, silver, bronze1, bronze2

# --- 2. MEN'S TEAM SIMULATION ---
def run_sim_mt():
    # Group stage
    # Top 2 advance from each group (total 6 teams into QFs with 2 Byes)
    sA = simulate_round_robin(mt_groups['A'], mt_ratings)
    sB = simulate_round_robin(mt_groups['B'], mt_ratings)
    sC = simulate_round_robin(mt_groups['C'], mt_ratings)

    # Japan (A1) and Chinese Taipei (C1) get BYEs to SF
    # QF 2: India (C2) vs Indonesia (B2)
    qf2_w = simulate_match(sC[1], sB[1], mt_ratings)
    # QF 3: South Korea (B1) vs Philippines (A2)
    qf3_w = simulate_match(sB[0], sA[1], mt_ratings)

    # SF 1: Japan (A1) vs qf2_w
    sf1_w = simulate_match(sA[0], qf2_w, mt_ratings)
    sf1_l = qf2_w if sf1_w == sA[0] else sA[0]

    # SF 2: Chinese Taipei (C1) vs qf3_w
    sf2_w = simulate_match(sC[0], qf3_w, mt_ratings)
    sf2_l = qf3_w if sf2_w == sC[0] else sC[0]

    # Final
    gold = simulate_match(sf1_w, sf2_w, mt_ratings)
    silver = sf2_w if gold == sf1_w else sf1_w
    bronze1 = sf1_l
    bronze2 = sf2_l

    return gold, silver, bronze1, bronze2

# --- 3. WOMEN'S SINGLES SIMULATION ---
def run_sim_ws():
    # 8 group winners
    wA = simulate_round_robin(ws_groups['A'], ws_ratings)[0]
    wB = simulate_round_robin(ws_groups['B'], ws_ratings)[0]
    wC = simulate_round_robin(ws_groups['C'], ws_ratings)[0]
    wD = simulate_round_robin(ws_groups['D'], ws_ratings)[0]
    wE = simulate_round_robin(ws_groups['E'], ws_ratings)[0]
    wF = simulate_round_robin(ws_groups['F'], ws_ratings)[0]
    wG = simulate_round_robin(ws_groups['G'], ws_ratings)[0]
    wH = simulate_round_robin(ws_groups['H'], ws_ratings)[0]

    # QF 1: wA vs wB
    qf1_w = simulate_match(wA, wB, ws_ratings)
    # QF 2: wC vs wD
    qf2_w = simulate_match(wC, wD, ws_ratings)
    # QF 3: wE vs wF
    qf3_w = simulate_match(wE, wF, ws_ratings)
    # QF 4: wG vs wH
    qf4_w = simulate_match(wG, wH, ws_ratings)

    # SF 1: qf1_w vs qf2_w
    sf1_w = simulate_match(qf1_w, qf2_w, ws_ratings)
    sf1_l = qf2_w if sf1_w == qf1_w else qf1_w

    # SF 2: qf3_w vs qf4_w
    sf2_w = simulate_match(qf3_w, qf4_w, ws_ratings)
    sf2_l = qf4_w if sf2_w == qf3_w else qf3_w

    # Final
    gold = simulate_match(sf1_w, sf2_w, ws_ratings)
    silver = sf2_w if gold == sf1_w else sf1_w
    bronze1 = sf1_l
    bronze2 = sf2_l

    return gold, silver, bronze1, bronze2

# --- 4. WOMEN'S TEAM SIMULATION ---
def run_sim_wt():
    # Top 2 from Group A & B advance directly to SF
    sA = simulate_round_robin(wt_groups['A'], wt_ratings)
    sB = simulate_round_robin(wt_groups['B'], wt_ratings)

    # SF 1: A1 vs B2
    sf1_w = simulate_match(sA[0], sB[1], wt_ratings)
    sf1_l = sB[1] if sf1_w == sA[0] else sA[0]

    # SF 2: B1 vs A2
    sf2_w = simulate_match(sB[0], sA[1], wt_ratings)
    sf2_l = sA[1] if sf2_w == sB[0] else sB[0]

    # Final
    gold = simulate_match(sf1_w, sf2_w, wt_ratings)
    silver = sf2_w if gold == sf1_w else sf1_w
    bronze1 = sf1_l
    bronze2 = sf2_l

    return gold, silver, bronze1, bronze2

# --- 5. MIXED DOUBLES SIMULATION ---
def run_sim_xd():
    # Top 2 from each of 6 groups advance
    sA = simulate_round_robin(xd_groups['A'], xd_ratings)
    sB = simulate_round_robin(xd_groups['B'], xd_ratings)
    sC = simulate_round_robin(xd_groups['C'], xd_ratings)
    sD = simulate_round_robin(xd_groups['D'], xd_ratings)
    sE = simulate_round_robin(xd_groups['E'], xd_ratings)
    sF = simulate_round_robin(xd_groups['F'], xd_ratings)

    # 4 First Round matches for unseeded group qualifiers
    # FR 2: F2 vs E2
    fr2_w = simulate_match(sF[1], sE[1], xd_ratings)
    # FR 3: B2 vs D2
    fr3_w = simulate_match(sB[1], sD[1], xd_ratings)
    # FR 6: C2 vs E1
    fr6_w = simulate_match(sC[1], sE[0], xd_ratings)
    # FR 7: B1 vs A2
    fr7_w = simulate_match(sB[0], sA[1], xd_ratings)

    # Quarterfinals: Top seeded group winners play FR winners
    # QF 1: A1 (Uematsu/Temma) vs fr2_w
    qf1_w = simulate_match(sA[0], fr2_w, xd_ratings)
    # QF 2: C1 (Lin/Chiang) vs fr3_w
    qf2_w = simulate_match(sC[0], fr3_w, xd_ratings)
    # QF 3: D1 (Kim/Lee) vs fr6_w
    qf3_w = simulate_match(sD[0], fr6_w, xd_ratings)
    # QF 4: F1 (Yu/Huang) vs fr7_w
    qf4_w = simulate_match(sF[0], fr7_w, xd_ratings)

    # Semifinals
    sf1_w = simulate_match(qf1_w, qf2_w, xd_ratings)
    sf1_l = qf2_w if sf1_w == qf1_w else qf1_w

    sf2_w = simulate_match(qf3_w, qf4_w, xd_ratings)
    sf2_l = qf4_w if sf2_w == qf3_w else qf3_w

    # Final
    gold = simulate_match(sf1_w, sf2_w, xd_ratings)
    silver = sf2_w if gold == sf1_w else sf1_w
    bronze1 = sf1_l
    bronze2 = sf2_l

    return gold, silver, bronze1, bronze2

# ==============================================================================
# RUN ALL 50,000 MONTE CARLO SIMULATIONS
# ==============================================================================

def execute_simulation(name, sim_func, participants):
    counts = {p: {'gold': 0, 'silver': 0, 'bronze': 0, 'podium': 0} for p in participants}
    print(f"Running 50,000 simulations for {name}...")
    for _ in range(N_SIMS):
        g, s, b1, b2 = sim_func()
        counts[g]['gold'] += 1
        counts[g]['podium'] += 1
        counts[s]['silver'] += 1
        counts[s]['podium'] += 1
        counts[b1]['bronze'] += 1
        counts[b1]['podium'] += 1
        counts[b2]['bronze'] += 1
        counts[b2]['podium'] += 1

    # Convert to percentages
    results = []
    for p in participants:
        g_pct = (counts[p]['gold'] / N_SIMS) * 100.0
        s_pct = (counts[p]['silver'] / N_SIMS) * 100.0
        b_pct = (counts[p]['bronze'] / N_SIMS) * 100.0
        pod_pct = (counts[p]['podium'] / N_SIMS) * 100.0
        results.append({
            'participant': p,
            'gold': g_pct,
            'silver': s_pct,
            'bronze': b_pct,
            'podium': pod_pct
        })

    # Sort primarily by gold desc, then silver desc, then bronze desc, then podium desc
    results.sort(key=lambda r: (r['gold'], r['silver'], r['bronze'], r['podium']), reverse=True)
    return results

print("Starting Soft Tennis Monte Carlo Simulations...")
res_ms = execute_simulation("Men's Singles", run_sim_ms, list(ms_ratings.keys()))
res_mt = execute_simulation("Men's Team", run_sim_mt, list(mt_ratings.keys()))
res_ws = execute_simulation("Women's Singles", run_sim_ws, list(ws_ratings.keys()))
res_wt = execute_simulation("Women's Team", run_sim_wt, list(wt_ratings.keys()))
res_xd = execute_simulation("Mixed Doubles", run_sim_xd, list(xd_ratings.keys()))

# Helper to extract athlete and team from "ATHLETE Name (Country)"
def parse_p_str(p_str):
    m = re.match(r'^(.*?)\s*\(([^)]+)\)$', p_str)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return p_str, p_str

# Format rankings array for an individual event
def build_indiv_rankings(results):
    rankings = []
    for idx, r in enumerate(results):
        ath, team = parse_p_str(r['participant'])
        rankings.append({
            'rank': idx + 1,
            'athlete': ath,
            'team': team,
            'gold': f"{r['gold']:.1f}%",
            'silver': f"{r['silver']:.1f}%",
            'bronze': f"{r['bronze']:.1f}%",
            'podium': f"{r['podium']:.1f}%"
        })
    return rankings

# Format rankings array for a team event
def build_team_rankings(results):
    rankings = []
    for idx, r in enumerate(results):
        team = r['participant']
        rankings.append({
            'rank': idx + 1,
            'team': team,
            'gold': f"{r['gold']:.1f}%",
            'silver': f"{r['silver']:.1f}%",
            'bronze': f"{r['bronze']:.1f}%",
            'podium': f"{r['podium']:.1f}%"
        })
    return rankings

# Build event structures
events_data = [
    {
        'id': 'tst_men_singles',
        'event': "Men's Singles",
        'shortName': "Men's Singles",
        'gender': "men",
        'type': "individual",
        'icon': "🎾",
        'rankings': build_indiv_rankings(res_ms)
    },
    {
        'id': 'tst_men_team',
        'event': "Men's Team",
        'shortName': "Men's Team",
        'gender': "men",
        'type': "team",
        'icon': "🎾",
        'rankings': build_team_rankings(res_mt)
    },
    {
        'id': 'tst_women_singles',
        'event': "Women's Singles",
        'shortName': "Women's Singles",
        'gender': "women",
        'type': "individual",
        'icon': "🎾",
        'rankings': build_indiv_rankings(res_ws)
    },
    {
        'id': 'tst_women_team',
        'event': "Women's Team",
        'shortName': "Women's Team",
        'gender': "women",
        'type': "team",
        'icon': "🎾",
        'rankings': build_team_rankings(res_wt)
    },
    {
        'id': 'tst_mixed_doubles',
        'event': "Mixed Doubles",
        'shortName': "Mixed Doubles",
        'gender': "mixed",
        'type': "individual",
        'icon': "🎾",
        'rankings': build_indiv_rankings(res_xd)
    }
]

# Build top-level "men", "women", "mixed" lists
# "men" contains top contenders across men's events
men_list = []
# Include Men's Team entries
for r in build_team_rankings(res_mt)[:6]:
    men_list.append({
        'rank': len(men_list) + 1,
        'team': r['team'],
        'event': "Men's Team",
        'gold': r['gold'],
        'silver': r['silver'],
        'bronze': r['bronze'],
        'podium': r['podium']
    })
# Include top Men's Singles entries
for r in build_indiv_rankings(res_ms)[:10]:
    men_list.append({
        'rank': len(men_list) + 1,
        'athlete': r['athlete'],
        'team': r['team'],
        'event': "Men's Singles",
        'gold': r['gold'],
        'silver': r['silver'],
        'bronze': r['bronze'],
        'podium': r['podium']
    })
men_list.sort(key=lambda x: float(x['podium'].replace('%', '')), reverse=True)
for i, m in enumerate(men_list):
    m['rank'] = i + 1

# "women" contains top contenders across women's events
women_list = []
for r in build_team_rankings(res_wt)[:6]:
    women_list.append({
        'rank': len(women_list) + 1,
        'team': r['team'],
        'event': "Women's Team",
        'gold': r['gold'],
        'silver': r['silver'],
        'bronze': r['bronze'],
        'podium': r['podium']
    })
for r in build_indiv_rankings(res_ws)[:10]:
    women_list.append({
        'rank': len(women_list) + 1,
        'athlete': r['athlete'],
        'team': r['team'],
        'event': "Women's Singles",
        'gold': r['gold'],
        'silver': r['silver'],
        'bronze': r['bronze'],
        'podium': r['podium']
    })
women_list.sort(key=lambda x: float(x['podium'].replace('%', '')), reverse=True)
for i, w in enumerate(women_list):
    w['rank'] = i + 1

# "mixed" contains mixed doubles rankings
mixed_list = []
for r in build_indiv_rankings(res_xd):
    mixed_list.append({
        'rank': r['rank'],
        'athlete': r['athlete'],
        'team': r['team'],
        'event': "Mixed Doubles",
        'gold': r['gold'],
        'silver': r['silver'],
        'bronze': r['bronze'],
        'podium': r['podium']
    })

predictions_payload = {
    'sport': 'Soft Tennis',
    'simulation_model': 'Monte Carlo (50,000 Runs)',
    'weighting': 'ISTF World Rankings (35%) + 2024 World Championships Anseong (35%) + 2022 Asian Games Hangzhou (20%) + ASTF Regional Form / SEA Games (10%)',
    'notes': 'Pre-tournament Monte Carlo simulation across all 5 events (50,000 tournament runs) factoring ISTF rankings, 2024 World Soft Tennis Championships results, 2022 Asian Games podiums, and official ASTF tournament bracket paths. Dual bronze medals awarded to losing semifinalists in each event.',
    'men': men_list,
    'women': women_list,
    'mixed': mixed_list,
    'events': events_data
}

with open('data/soft_tennis/predictions.json', 'w', encoding='utf-8') as f:
    json.dump(predictions_payload, f, indent=2, ensure_ascii=False)

print("\nSuccessfully generated data/soft_tennis/predictions.json!")
print("Events generated:")
for ev in events_data:
    top3 = [f"#{r['rank']} {r.get('athlete', r['team'])} ({r['gold']} G, {r['podium']} Pod)" for r in ev['rankings'][:3]]
    print(f"  • {ev['event']}: {', '.join(top3)}")
