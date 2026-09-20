import json
import os
import re
import zlib
from datetime import datetime, timedelta, timezone
import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://results.asiangames2026.org/",
    "Accept": "*/*",
}

JST = timezone(timedelta(hours=9))

CHARMAP = {}
for b in range(256):
    try: CHARMAP[bytes([b]).decode("cp1252")] = b
    except Exception:
        try: CHARMAP[bytes([b]).decode("latin1")] = b
        except Exception: pass

def fetch_api_day(date_str):
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/CKT/schedule/daily/{date_str}"
    try: resp = requests.get(url, headers=HEADERS, timeout=15)
    except Exception: return []
    if resp.status_code != 200: return []
    try:
        data = resp.json()
        if isinstance(data, list): return data
    except Exception: pass
    
    candidates = []
    try: candidates.append(bytes([CHARMAP.get(c, ord(c) & 0xFF) for c in resp.text]))
    except Exception: pass
    candidates.append(resp.content)

    for raw in candidates:
        for wbits in [zlib.MAX_WBITS, -zlib.MAX_WBITS, 16 + zlib.MAX_WBITS]:
            try: return json.loads(zlib.decompress(raw, wbits).decode("utf-8"))
            except Exception: continue
    return []

def extract_match_datetime(m, fallback_date=""):
    match_date, match_time = fallback_date, ""
    raw = m.get("DateTimeRaw") or m.get("StartDate") or m.get("StartDateTime") or ""
    
    if raw:
        raw_str = str(raw).strip()
        dot_net_match = re.search(r"/Date\((\d+)", raw_str)
        if dot_net_match:
            dt = datetime.fromtimestamp(float(dot_net_match.group(1)) / 1000.0, tz=JST)
            return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M")
        
        if isinstance(raw, (int, float)) or raw_str.isdigit():
            ts = float(raw_str)
            if ts > 1e11: ts /= 1000.0
            dt = datetime.fromtimestamp(ts, tz=JST)
            return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M")
            
        if any(c.isdigit() for c in raw_str):
            try:
                dt = datetime.fromisoformat(raw_str.replace("Z", "+00:00"))
                if dt.tzinfo is not None: dt = dt.astimezone(JST)
                return dt.strftime("%Y-%m-%d"), dt.strftime("%H:%M")
            except Exception:
                d_match = re.search(r"(\d{4}-\d{2}-\d{2})", raw_str)
                if d_match: match_date = d_match.group(1)
                t_match = re.search(r"[T\s](\d{1,2}:\d{2})(?::\d{2})?", raw_str)
                if t_match: match_time = t_match.group(1).zfill(5)

    if not match_time:
        for k in ["Time", "StartTime", "ScheduleTime", "UnitTime"]:
            val = m.get(k)
            if val and isinstance(val, str):
                t_match = re.search(r"\b(\d{1,2}:\d{2})\b", val.strip())
                if t_match:
                    match_time = t_match.group(1).zfill(5)
                    break
    return match_date or fallback_date, match_time

def parse_matches(raw_matches, gender="Men", date_str=""):
    output = []
    for m in raw_matches:
        event_desc, event_code, sub_desc = (m.get("EventDesc") or "").lower(), (m.get("Event") or "").upper(), (m.get("SubEventDesc") or "").lower()
        
        if gender == "Women":
            is_target = ("women" in event_desc) or ("women" in sub_desc) or event_code.startswith("W")
        else:
            is_target = (("men" in event_desc and "women" not in event_desc) or ("men" in sub_desc and "women" not in sub_desc) or event_code.startswith("M"))
            if not is_target and "women" not in event_desc and "women" not in sub_desc: is_target = True
        
        if not is_target: continue

        status_raw = m.get("Status", "").upper()
        if status_raw in ["OFFICIAL", "UNCONFIRMED", "CANCELLED", "ABANDONED"]: status = "Finished"
        elif status_raw in ["LIVE", "IN_PROGRESS", "RUNNING"]: status = "Live"
        else: status = "Upcoming"

        state_desc = m.get("StatusDesc") or m.get("Period") or status
        match_date, match_time = extract_match_datetime(m, fallback_date=date_str)

        home, away = m.get("Home", {}), m.get("Away", {})
        home_name = home.get("NameS") or home.get("Name") or "TBD"
        away_name = away.get("NameS") or away.get("Name") or "TBD"

        home_raw = str(home.get("Result", "")).strip()
        away_raw = str(away.get("Result", "")).strip()
        
        # 1. UI Format: Ensure slash notation
        home_score_ui = home_raw.replace(" - ", "/").replace("-", "/")
        away_score_ui = away_raw.replace(" - ", "/").replace("-", "/")

        # 2. Calibration Format: Extract leading integer via Regex
        home_runs_match = re.search(r'^(\d+)', home_raw)
        home_runs = home_runs_match.group(1) if home_runs_match else ""
        
        away_runs_match = re.search(r'^(\d+)', away_raw)
        away_runs = away_runs_match.group(1) if away_runs_match else ""

        # Score string contains exactly one hyphen for calibration logic
        score_calib = f"{home_runs} - {away_runs}" if (home_runs != "" and away_runs != "") else "vs"

        winner = ""
        try:
            if str(home.get("Winner", "")).lower() in ["true", "1", "y", "yes"]: winner = home_name
            elif str(away.get("Winner", "")).lower() in ["true", "1", "y", "yes"]: winner = away_name
        except Exception: pass
        
        output.append({
            "round": m.get("UnitDescS") or m.get("UnitDescA") or m.get("PhaseDescS", "Group Stage"),
            "status": status,
            "state": state_desc,
            "date": match_date,
            "time": match_time,
            "player1": home_name,
            "player2": away_name,
            "score": score_calib,
            "score1": home_score_ui if home_score_ui else "-",
            "score2": away_score_ui if away_score_ui else "-",
            "winner": winner
        })
    return output

def main():
    start_date = datetime(2026, 9, 15)
    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(20)]
    all_men, all_women = [], []

    for d in dates:
        day_data = fetch_api_day(d)
        all_men.extend(parse_matches(day_data, "Men", date_str=d))
        all_women.extend(parse_matches(day_data, "Women", date_str=d))

    os.makedirs("data/cricket", exist_ok=True)
    if len(all_men) > 0:
        with open("data/cricket/tracker_men.json", "w", encoding="utf-8") as f:
            json.dump({"sport": "Cricket (Men)", "matches": all_men}, f, indent=2, ensure_ascii=False)
    if len(all_women) > 0:
        with open("data/cricket/tracker_women.json", "w", encoding="utf-8") as f:
            json.dump({"sport": "Cricket (Women)", "matches": all_women}, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    main()
