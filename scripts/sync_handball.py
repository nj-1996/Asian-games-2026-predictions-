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

CHARMAP = {}
for b in range(256):
    try:
        CHARMAP[bytes([b]).decode("cp1252")] = b
    except Exception:
        try:
            CHARMAP[bytes([b]).decode("latin1")] = b
        except Exception:
            pass

ORG_MAP = {
    "CHN": "China",
    "JPN": "Japan",
    "KOR": "Korea",
    "HKG": "Hong Kong, China",
    "QAT": "Qatar",
    "BRN": "Bahrain",
    "KUW": "Kuwait",
    "KAZ": "Kazakhstan",
    "IRI": "IR Iran",
    "UZB": "Uzbekistan",
    "VIE": "Vietnam",
    "IND": "India",
    "THA": "Thailand",
    "KSA": "Saudi Arabia",
}


def clean_team_name(org, raw_name):
    if org and org.upper() in ORG_MAP:
        return ORG_MAP[org.upper()]
    if not raw_name or raw_name.upper() == "TBD":
        return "TBD"
    n = raw_name.strip()
    n = re.sub(r"\(.*?\)", "", n).strip()
    n = re.sub(r"^People's Republic of\s*", "", n, flags=re.I).strip()
    n = re.sub(r"^Republic of\s*", "", n, flags=re.I).strip()
    n = re.sub(r"^Islamic Republic of\s*", "", n, flags=re.I).strip()
    return n or "TBD"


def fetch_api_day(date_str):
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/HBL/schedule/daily/{date_str}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=12, verify=False)
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
                dec = zlib.decompress(raw, wbits)
                return json.loads(dec.decode("utf-8"))
            except Exception:
                continue

    return []


def normalize_round_title(unit_desc, phase_desc, gender):
    u = unit_desc or phase_desc or ""
    
    # Quarterfinals
    qf = re.search(r"Quarterfinal.*?(\d+)", u, re.I)
    if qf:
        return f"Quarterfinal {qf.group(1)}"
    
    # Semifinals
    sf = re.search(r"Semifinal.*?(\d+)", u, re.I)
    if sf:
        return f"Semifinal {sf.group(1)}"
    
    # Finals
    if re.search(r"gold", u, re.I):
        return "Gold Medal Match"
    if re.search(r"bronze|3rd", u, re.I):
        return "Bronze Medal Match"
        
    # Group stages
    grp = re.search(r"Group\s*([A-Za-z0-9]+)", u, re.I)
    if grp:
        return f"Preliminary Round - Group {grp.group(1).upper()}"
        
    if "women" in (gender or "").lower() or "women" in u.lower():
        return "Preliminary Round - Group Stage"
        
    return u or "Preliminary Round"


def parse_match_item(m, target_gender, fallback_date):
    event_desc = (m.get("EventDesc") or "").lower()
    event_code = (m.get("Event") or "").upper()

    if target_gender.lower() == "women":
        is_target = ("women" in event_desc) or event_code.startswith("W")
    else:
        is_target = (("men" in event_desc and "women" not in event_desc) or event_code.startswith("M"))

    if not is_target:
        return None

    raw_dt = m.get("DateTimeRaw") or m.get("StartDateTime") or m.get("StartDate") or ""
    match_date = fallback_date
    match_time = ""

    if raw_dt:
        try:
            iso_clean = raw_dt.replace("Z", "+00:00")
            dt = datetime.fromisoformat(iso_clean)
            if dt.tzinfo is not None:
                dt = dt.astimezone(JST)
            match_date = dt.strftime("%Y-%m-%d")
            match_time = dt.strftime("%H:%M")
        except Exception:
            if len(raw_dt) >= 10 and re.match(r"^\d{4}-\d{2}-\d{2}", raw_dt):
                match_date = raw_dt[:10]
            if len(raw_dt) >= 16 and ":" in raw_dt[11:16]:
                match_time = raw_dt[11:16]

    home = m.get("Home", {})
    away = m.get("Away", {})

    home_name = clean_team_name(home.get("Org"), home.get("Name"))
    away_name = clean_team_name(away.get("Org"), away.get("Name"))

    status_raw = (m.get("Status") or "").upper()
    state_desc = m.get("StatusDesc") or "Scheduled"

    if status_raw in ["OFFICIAL", "FINISHED", "UNCONFIRMED"]:
        status = "Finished"
    elif status_raw in ["LIVE", "IN_PROGRESS", "RUNNING"]:
        status = "Live"
    else:
        status = "Upcoming"

    h_res = str(home.get("Result", "")).strip() if home.get("Result") is not None else ""
    a_res = str(away.get("Result", "")).strip() if away.get("Result") is not None else ""

    if h_res != "" and a_res != "":
        score_str = f"{h_res} - {a_res}"
        score1 = h_res
        score2 = a_res
    else:
        score_str = "vs"
        score1 = "-"
        score2 = "-"

    # Extract Half-time splits
    h_splits = [str(s.get("Res")) for s in home.get("Splits", []) if s.get("Res") is not None]
    a_splits = [str(s.get("Res")) for s in away.get("Splits", []) if s.get("Res") is not None]
    set_scores = ""
    if len(h_splits) >= 1 and len(a_splits) >= 1:
        set_scores = f"HT: {h_splits[0]}-{a_splits[0]}"

    winner = ""
    if status == "Finished" and score1 != "-" and score2 != "-":
        try:
            h_num = int(score1)
            a_num = int(score2)
            if h_num > a_num:
                winner = home_name
            elif a_num > h_num:
                winner = away_name
        except Exception:
            pass

    unit_desc = m.get("UnitDesc") or m.get("UnitDescS") or ""
    phase_desc = m.get("PhaseDesc") or m.get("PhaseDescS") or ""
    round_title = normalize_round_title(unit_desc, phase_desc, target_gender)
    venue = m.get("VenueDesc") or "Kasugai City Gymnasium"

    return {
        "round": round_title,
        "status": status,
        "state": state_desc,
        "date": match_date,
        "time": match_time,
        "player1": home_name,
        "player2": away_name,
        "score": score_str,
        "score1": score1,
        "score2": score2,
        "set_scores": set_scores,
        "winner": winner,
        "venue": venue,
        "_key": m.get("Key") or m.get("ResCode") or f"{match_date}_{match_time}_{home_name}_{away_name}"
    }


def main():
    start_date = datetime(2026, 9, 18)
    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(15)]

    raw_items_by_date = []
    print("Fetching Handball schedule from official results API...")

    for d in dates:
        items = fetch_api_day(d)
        if items:
            print(f"[{d}] Found {len(items)} items")
            raw_items_by_date.append((d, items))

    men_matches = []
    women_matches = []
    seen_men = set()
    seen_women = set()

    for d, items in raw_items_by_date:
        for it in items:
            m_parsed = parse_match_item(it, "Men", fallback_date=d)
            if m_parsed:
                k = m_parsed["_key"]
                if k not in seen_men:
                    seen_men.add(k)
                    del m_parsed["_key"]
                    men_matches.append(m_parsed)

            w_parsed = parse_match_item(it, "Women", fallback_date=d)
            if w_parsed:
                k = w_parsed["_key"]
                if k not in seen_women:
                    seen_women.add(k)
                    del w_parsed["_key"]
                    women_matches.append(w_parsed)

    os.makedirs("data/handball", exist_ok=True)

    if men_matches:
        with open("data/handball/tracker_men.json", "w", encoding="utf-8") as f:
            json.dump({"sport": "Handball (Men)", "matches": men_matches}, f, indent=2, ensure_ascii=False)
        print(f"[OK] Saved {len(men_matches)} official Men's Handball matches to data/handball/tracker_men.json")

    if women_matches:
        with open("data/handball/tracker_women.json", "w", encoding="utf-8") as f:
            json.dump({"sport": "Handball (Women)", "matches": women_matches}, f, indent=2, ensure_ascii=False)
        print(f"[OK] Saved {len(women_matches)} official Women's Handball matches to data/handball/tracker_women.json")


if __name__ == "__main__":
    main()
