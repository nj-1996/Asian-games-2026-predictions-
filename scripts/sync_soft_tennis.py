import json
import os
import re
import zlib
from datetime import datetime, timedelta, timezone
import requests
import urllib3

urllib3.disable_warnings()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://results.asiangames2026.org/",
    "Accept": "*/*",
}

JST = timezone(timedelta(hours=9))

# Rebuild single-byte array from CP1252/UTF-8 transcoded characters
CHARMAP = {}
for b in range(256):
    try:
        CHARMAP[bytes([b]).decode("cp1252")] = b
    except Exception:
        try:
            CHARMAP[bytes([b]).decode("latin1")] = b
        except Exception:
            pass

ORG_TO_COUNTRY = {
    "JPN": "Japan",
    "KOR": "South Korea",
    "TPE": "Chinese Taipei",
    "PRK": "North Korea",
    "PHI": "Philippines",
    "IND": "India",
    "CAM": "Cambodia",
    "NEP": "Nepal",
    "MGL": "Mongolia",
    "INA": "Indonesia",
    "THA": "Thailand",
    "PAK": "Pakistan",
    "VIE": "Vietnam",
    "LAO": "Laos",
    "CHN": "China",
    "MAS": "Malaysia",
    "TLS": "Timor-Leste"
}

def resolve_country(org_code, raw_name):
    if org_code and org_code.upper() in ORG_TO_COUNTRY:
        return ORG_TO_COUNTRY[org_code.upper()]
    return raw_name or "TBD"

def fetch_api_day(date_str):
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/TST/schedule/daily/{date_str}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, verify=False)
    except Exception as e:
        print(f"[{date_str}] Request failed: {e}")
        return []

    if resp.status_code != 200:
        return []

    try:
        data = resp.json()
        if isinstance(data, list):
            return data
    except Exception:
        pass

    candidates = []
    try:
        candidates.append(bytes([CHARMAP.get(c, ord(c) & 0xFF) for c in resp.text]))
    except Exception:
        pass
    candidates.append(resp.content)

    for raw in candidates:
        for wbits in [zlib.MAX_WBITS, -zlib.MAX_WBITS, 16 + zlib.MAX_WBITS]:
            try:
                decompressed = zlib.decompress(raw, wbits)
                return json.loads(decompressed.decode("utf-8"))
            except Exception:
                continue

    return []

def extract_match_datetime(m, fallback_date=""):
    match_date = fallback_date
    match_time = ""

    raw = m.get("DateTimeRaw") or m.get("StartDate") or m.get("StartDateTime") or ""

    if raw:
        raw_str = str(raw).strip()
        dot_net_match = re.search(r"/Date\((\d+)", raw_str)
        if dot_net_match:
            ts = float(dot_net_match.group(1)) / 1000.0
            dt = datetime.fromtimestamp(ts, tz=JST)
            return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M")

        if isinstance(raw, (int, float)) or raw_str.isdigit():
            ts = float(raw_str)
            if ts > 1e11:
                ts /= 1000.0
            dt = datetime.fromtimestamp(ts, tz=JST)
            return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M")

        if any(c.isdigit() for c in raw_str):
            try:
                iso_clean = raw_str.replace("Z", "+00:00")
                dt = datetime.fromisoformat(iso_clean)
                if dt.tzinfo is not None:
                    dt = dt.astimezone(JST)
                return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M")
            except Exception:
                d_match = re.search(r"(\d{4}-\d{2}-\d{2})", raw_str)
                if d_match:
                    match_date = d_match.group(1)
                t_match = re.search(r"[T\s](\d{1,2}:\d{2})(?::\d{2})?", raw_str)
                if t_match:
                    match_time = t_match.group(1).zfill(5)

    if not match_time:
        for k in ["Time", "StartTime", "ScheduleTime", "UnitTime"]:
            val = m.get(k)
            if val and isinstance(val, str):
                t_match = re.search(r"\b(\d{1,2}:\d{2})\b", val.strip())
                if t_match:
                    match_time = t_match.group(1).zfill(5)
                    break

    return match_date or fallback_date, match_time

def clean_round_name(unit_desc, phase_desc):
    txt = (unit_desc or phase_desc or "Preliminary").strip()
    txt = re.sub(r"^(?:men's|women's|mixed)\s+(?:singles|doubles|team)\s+", "", txt, flags=re.IGNORECASE)

    if re.search(r"gold\s*medal", txt, re.IGNORECASE) or re.search(r"\bf\s*gm\b", txt, re.IGNORECASE):
        return "Gold Medal Match"
    if re.search(r"bronze\s*medal", txt, re.IGNORECASE) or re.search(r"\bf\s*bm\b", txt, re.IGNORECASE):
        return "Bronze Medal Match"
    if re.search(r"semifinal", txt, re.IGNORECASE) or re.search(r"\bsf\b", txt, re.IGNORECASE):
        m_num = re.search(r"match\s*(\d+)", txt, re.IGNORECASE)
        return f"Semifinal {m_num.group(1)}" if m_num else "Semifinals"
    if re.search(r"quarterfinal", txt, re.IGNORECASE) or re.search(r"\bqf\b", txt, re.IGNORECASE):
        m_num = re.search(r"match\s*(\d+)", txt, re.IGNORECASE)
        return f"Quarterfinal {m_num.group(1)}" if m_num else "Quarterfinals"

    grp_match = re.search(r"group\s*([a-z0-9]+)", txt, re.IGNORECASE)
    if grp_match:
        m_num = re.search(r"match\s*(\d+)", txt, re.IGNORECASE)
        return f"Group {grp_match.group(1).upper()}" + (f" • Match {m_num.group(1)}" if m_num else "")

    return txt

def parse_soft_tennis_match(m, date_str):
    event = m.get("EventDesc") or "Soft Tennis"
    status_raw = (m.get("Status") or "").upper()

    if status_raw in ["OFFICIAL", "UNCONFIRMED"]:
        status = "Finished"
    elif status_raw in ["LIVE", "IN_PROGRESS", "RUNNING"]:
        status = "Live"
    else:
        status = "Upcoming"

    state_desc = m.get("StatusDesc") or status

    match_date, match_time = extract_match_datetime(m, fallback_date=date_str)

    home = m.get("Home", {})
    away = m.get("Away", {})

    home_org = (home.get("Org") or "").upper()
    away_org = (away.get("Org") or "").upper()

    home_team = resolve_country(home_org, home.get("Name"))
    away_team = resolve_country(away_org, away.get("Name"))

    is_team_event = "team" in event.lower()
    
    if is_team_event:
        player1 = home_team
        player2 = away_team
        athlete1 = ""
        athlete2 = ""
    else:
        athlete1 = home.get("Name") or home.get("NameS") or "TBD"
        athlete2 = away.get("Name") or away.get("NameS") or "TBD"
        player1 = f"{athlete1} ({home_team})" if home_team != "TBD" else athlete1
        player2 = f"{athlete2} ({away_team})" if away_team != "TBD" else athlete2

    home_score = home.get("Result", "")
    away_score = away.get("Result", "")
    score_str = f"{home_score} - {away_score}" if (home_score != "" and away_score != "") else "vs"

    winner = ""
    try:
        h_val = float(home_score)
        a_val = float(away_score)
        if h_val > a_val:
            winner = home_team
        elif a_val > h_val:
            winner = away_team
    except (ValueError, TypeError):
        pass

    if not winner:
        if str(home.get("Winner", "")).lower() in ["true", "1", "y", "yes"]:
            winner = home_team
        elif str(away.get("Winner", "")).lower() in ["true", "1", "y", "yes"]:
            winner = away_team

    unit_desc = m.get("UnitDesc") or m.get("UnitDescS") or ""
    phase_desc = m.get("PhaseDesc") or m.get("PhaseDescS") or ""
    clean_round = clean_round_name(unit_desc, phase_desc)

    court = m.get("LocDescS") or m.get("LocDesc") or m.get("VenueDescS") or "Court"

    return {
        "id": m.get("Key") or m.get("ResCode") or f"{event}_{match_date}_{match_time}",
        "event": event,
        "round": clean_round,
        "phase": phase_desc,
        "match": unit_desc,
        "court": court,
        "date": match_date,
        "time": match_time,
        "status": status,
        "state": state_desc,
        "player1": player1,
        "player2": player2,
        "athlete1": athlete1,
        "athlete2": athlete2,
        "team1": home_team,
        "team2": away_team,
        "org1": home_org,
        "org2": away_org,
        "score": score_str,
        "score1": str(home_score) if home_score != "" else "-",
        "score2": str(away_score) if away_score != "" else "-",
        "winner": winner
    }

def main():
    start_date = datetime(2026, 9, 15)
    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(22)]

    all_men = []
    all_women = []
    all_mixed = []

    for d in dates:
        day_data = fetch_api_day(d)
        if day_data:
            print(f"[{d}] Retrieved {len(day_data)} items from TST endpoint.")

        for m in day_data:
            ev = (m.get("EventDesc") or "").lower()
            parsed = parse_soft_tennis_match(m, d)

            if "mixed" in ev:
                all_mixed.append(parsed)
            elif "women" in ev:
                all_women.append(parsed)
            else:
                all_men.append(parsed)

    os.makedirs("data/soft_tennis", exist_ok=True)

    if len(all_men) > 0:
        with open("data/soft_tennis/tracker_men.json", "w", encoding="utf-8") as f:
            json.dump({"sport": "Soft Tennis (Men)", "matches": all_men}, f, indent=2, ensure_ascii=False)
        print(f"[OK] Saved {len(all_men)} Men's soft tennis fixtures.")

    if len(all_women) > 0:
        with open("data/soft_tennis/tracker_women.json", "w", encoding="utf-8") as f:
            json.dump({"sport": "Soft Tennis (Women)", "matches": all_women}, f, indent=2, ensure_ascii=False)
        print(f"[OK] Saved {len(all_women)} Women's soft tennis fixtures.")

    if len(all_mixed) > 0:
        with open("data/soft_tennis/tracker_mixed.json", "w", encoding="utf-8") as f:
            json.dump({"sport": "Soft Tennis (Mixed)", "matches": all_mixed}, f, indent=2, ensure_ascii=False)
        print(f"[OK] Saved {len(all_mixed)} Mixed Doubles soft tennis fixtures.")

    # Initialize predictions.json with event definitions
    pred_path = "data/soft_tennis/predictions.json"
    if not os.path.exists(pred_path):
        initial_pred = {
            "sport": "Soft Tennis",
            "simulation_model": "Pending user inputs",
            "events": [
                { "id": "tst_men_singles", "name": "Men's Singles", "gender": "men" },
                { "id": "tst_men_team", "name": "Men's Team", "gender": "men" },
                { "id": "tst_women_singles", "name": "Women's Singles", "gender": "women" },
                { "id": "tst_women_team", "name": "Women's Team", "gender": "women" },
                { "id": "tst_mixed_doubles", "name": "Mixed Doubles", "gender": "mixed" }
            ],
            "men": [],
            "women": [],
            "mixed": []
        }
        with open(pred_path, "w", encoding="utf-8") as f:
            json.dump(initial_pred, f, indent=2, ensure_ascii=False)
        print("[OK] Initialized data/soft_tennis/predictions.json skeleton.")

if __name__ == "__main__":
    main()
