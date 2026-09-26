import json
import os
import re
import urllib.request
import zlib
from datetime import datetime, timezone, timedelta

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://results.asiangames2026.org/",
    "Accept": "*/*",
}

JST = timezone(timedelta(hours=9))

NOC_MAP = {
    "CAM": "Cambodia",
    "INA": "Indonesia",
    "IND": "India",
    "IRQ": "Iraq",
    "JPN": "Japan",
    "KGZ": "Kyrgyzstan",
    "KOR": "South Korea",
    "KUW": "Kuwait",
    "LAO": "Laos",
    "LBN": "Lebanon",
    "MGL": "Mongolia",
    "MYA": "Myanmar",
    "PHI": "Philippines",
    "THA": "Thailand",
    "VIE": "Vietnam",
    "SGP": "Singapore",
    "MAS": "Malaysia",
    "BRN": "Bahrain",
    "CHN": "China",
    "TPE": "Chinese Taipei",
    "HKG": "Hong Kong, China",
    "MAC": "Macau, China",
    "KSA": "Saudi Arabia",
    "UAE": "United Arab Emirates",
    "QAT": "Qatar",
    "UZB": "Uzbekistan",
    "KAZ": "Kazakhstan"
}

CHARMAP = {}
for b in range(256):
    try:
        CHARMAP[bytes([b]).decode("cp1252")] = b
    except Exception:
        try:
            CHARMAP[bytes([b]).decode("latin1")] = b
        except Exception:
            pass


def decompress_payload(raw_content):
    if not raw_content:
        return None
    try:
        return json.loads(raw_content.decode("utf-8"))
    except Exception:
        pass

    text = raw_content.decode("utf-8", errors="replace")
    candidates = [
        raw_content,
        bytes([CHARMAP.get(c, ord(c) & 0xFF) for c in text])
    ]

    for raw in candidates:
        for wbits in [zlib.MAX_WBITS, -zlib.MAX_WBITS, 16 + zlib.MAX_WBITS]:
            try:
                dec = zlib.decompress(raw, wbits)
                return json.loads(dec.decode("utf-8"))
            except Exception:
                continue
    return None


def fetch_day_schedule(date_str):
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/TEQ/schedule/daily/{date_str}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read()
            data = decompress_payload(content)
            if isinstance(data, list):
                return data
    except Exception as e:
        print(f"[{date_str}] Fetch error: {e}")
    return []


def format_athlete_name(name):
    if not name:
        return ""
    # E.g. "EIDAN Zaid" -> "Zaid Eidan" or "SAKAMOTO Yuina" -> "Yuina Sakamoto"
    parts = name.strip().split()
    if len(parts) == 2 and parts[0].isupper() and not parts[1].isupper():
        return f"{parts[1]} {parts[0].capitalize()}"
    return name.title()


def format_team_display(team_obj):
    if not team_obj:
        return "TBD", "TBD", ""
    org = team_obj.get("Org", "").strip().upper()
    country = NOC_MAP.get(org, org)
    raw_name = team_obj.get("Name", "").strip()

    if "/" in raw_name:
        # Doubles pair: e.g. "THAOSIRI Sorrasak / CHANLIANG Jirati"
        members = [format_athlete_name(m.strip()) for m in raw_name.split("/")]
        pair_str = " / ".join(members)
        display = f"{pair_str} ({country})"
        short_display = pair_str
        return display, short_display, country

    athlete = format_athlete_name(raw_name)
    display = f"{athlete} ({country})" if athlete else country
    return display, athlete or country, country


def parse_match(raw_item):
    h = raw_item.get("Home", {})
    a = raw_item.get("Away", {})

    p1_display, p1_name, c1 = format_team_display(h)
    p2_display, p2_name, c2 = format_team_display(a)

    s1 = str(h.get("Result", "-")).strip()
    s2 = str(a.get("Result", "-")).strip()

    dt_str = raw_item.get("DateTimeRaw", "")
    date_val = ""
    time_val = ""
    if dt_str:
        try:
            dt = datetime.fromisoformat(dt_str)
            date_val = dt.strftime("%Y-%m-%d")
            time_val = dt.strftime("%H:%M")
        except Exception:
            date_val = dt_str[:10]
            time_val = dt_str[11:16]

    # Extract set scores
    set_scores = ""
    for ext in raw_item.get("Extensions", []):
        if ext.get("Code") == "ResultDetailWinner":
            set_scores = ext.get("Value", "").strip()
            break

    if not set_scores:
        splits1 = [sp.get("Res", "") for sp in h.get("Splits", []) if sp.get("Res")]
        splits2 = [sp.get("Res", "") for sp in a.get("Splits", []) if sp.get("Res")]
        if splits1 and splits2:
            pairs = [f"{s1}-{s2}" for s1, s2 in zip(splits1, splits2)]
            set_scores = ", ".join(pairs)

    duration = ""
    for ext in raw_item.get("Extensions", []):
        if ext.get("Code") == "DurationHHMM":
            duration = ext.get("Value", "").strip()
            break

    is_finished = str(raw_item.get("Status", "")).upper() in ["OFFICIAL", "FINISHED"] or bool(raw_item.get("ShowResults"))
    winner = ""
    if is_finished:
        if h.get("Winner"):
            winner = c1
        elif a.get("Winner"):
            winner = c2
        elif s1.isdigit() and s2.isdigit():
            if int(s1) > int(s2):
                winner = c1
            elif int(s2) > int(s1):
                winner = c2

    round_desc = raw_item.get("PhaseDesc", "") or raw_item.get("UnitDesc", "")
    table_desc = raw_item.get("LocDesc", "") or raw_item.get("VenueDesc", "")

    event_desc = raw_item.get("EventDesc", "") or raw_item.get("Event", "")

    return {
        "id": raw_item.get("ResCode") or raw_item.get("Key"),
        "event": event_desc,
        "round": round_desc,
        "phase": raw_item.get("PhaseDescA") or raw_item.get("PhaseDesc", ""),
        "match": raw_item.get("UnitDescA") or raw_item.get("UnitDesc", ""),
        "court": table_desc,
        "date": date_val,
        "time": time_val,
        "status": "Finished" if is_finished else "Upcoming",
        "state": "Official" if is_finished else "Scheduled",
        "player1": p1_display,
        "player2": p2_display,
        "team1": c1,
        "team2": c2,
        "athlete1": p1_name,
        "athlete2": p2_name,
        "org1": h.get("Org", ""),
        "org2": a.get("Org", ""),
        "score": f"{s1} - {s2}" if (s1 != "-" and s2 != "-") else "vs",
        "score1": s1,
        "score2": s2,
        "set_scores": set_scores,
        "duration": duration,
        "winner": winner
    }


def main():
    dates = ["2026-09-17", "2026-09-18", "2026-09-19", "2026-09-20"]
    all_raw = []
    print("Fetching official Teqball schedule...")
    for d in dates:
        items = fetch_day_schedule(d)
        print(f"  {d}: {len(items)} items")
        all_raw.extend(items)

    parsed_matches = [parse_match(m) for m in all_raw]
    print(f"Total parsed matches: {len(parsed_matches)}")

    # Classify matches by division cleanly
    men_matches = [
        m for m in parsed_matches
        if "men" in m["event"].lower() and "women" not in m["event"].lower()
    ]
    women_matches = [
        m for m in parsed_matches
        if "women" in m["event"].lower()
    ]
    mixed_matches = [m for m in parsed_matches if "mixed" in m["event"].lower()]

    out_dir = os.path.join(os.path.dirname(__file__), "..", "data", "teqball")
    os.makedirs(out_dir, exist_ok=True)
    legacy_tracker = os.path.join(out_dir, "tracker.json")
    if os.path.exists(legacy_tracker):
        os.remove(legacy_tracker)

    with open(os.path.join(out_dir, "tracker_men.json"), "w", encoding="utf-8") as f:
        json.dump({"sport": "Teqball (Men)", "matches": men_matches}, f, indent=2, ensure_ascii=False)

    with open(os.path.join(out_dir, "tracker_women.json"), "w", encoding="utf-8") as f:
        json.dump({"sport": "Teqball (Women)", "matches": women_matches}, f, indent=2, ensure_ascii=False)

    with open(os.path.join(out_dir, "tracker_mixed.json"), "w", encoding="utf-8") as f:
        json.dump({"sport": "Teqball (Mixed)", "matches": mixed_matches}, f, indent=2, ensure_ascii=False)

    print(f"Successfully generated Teqball trackers in {out_dir}:")
    print(f"  tracker_men.json: {len(men_matches)} matches")
    print(f"  tracker_women.json: {len(women_matches)} matches")
    print(f"  tracker_mixed.json: {len(mixed_matches)} matches")


if __name__ == "__main__":
    main()
