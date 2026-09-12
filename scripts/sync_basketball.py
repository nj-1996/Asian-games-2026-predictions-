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


def fetch_api_day(date_str):
    """Queries and decompresses raw daily schedule items."""
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/BKB/schedule/daily/{date_str}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
    except Exception as e:
        print(f"[{date_str}] Request failed: {e}")
        return []

    if resp.status_code != 200:
        return []

    # Check uncompressed JSON
    try:
        data = resp.json()
        if isinstance(data, list):
            return data
    except Exception:
        pass

    # Decompress zlib stream
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
    """
    Extracts match date and 24-hr HH:MM time in JST (Venue Time),
    handling spaces, 'T', ISO strings, UTC offsets, and naming variants.
    """
    match_date = fallback_date
    match_time = ""

    # 1. Check composite date/time fields
    dt_keys = [
        "StartDate", "startDate", "StartDateTime", "startDateTime",
        "DateTime", "dateTime", "UnitDateTime", "unitDateTime",
        "Start", "start", "ScheduleDate", "scheduleDate"
    ]

    raw_dt = None
    for k in dt_keys:
        val = m.get(k)
        if val and isinstance(val, str) and any(c.isdigit() for c in val):
            raw_dt = val.strip()
            break

    if raw_dt:
        # ISO with timezone (e.g. 2026-09-13T01:00:00Z -> converts UTC to 10:00 JST)
        try:
            iso_str = raw_dt.replace("Z", "+00:00")
            dt = datetime.fromisoformat(iso_str)
            if dt.tzinfo is not None:
                dt_jst = dt.astimezone(JST)
                match_date = dt_jst.strftime("%Y-%m-%d")
                match_time = dt_jst.strftime("%H:%M")
            else:
                match_date = dt.strftime("%Y-%m-%d")
                match_time = dt.strftime("%H:%M")
        except Exception:
            # Fallback regex search for date and time strings
            d_match = re.search(r"(\d{4}-\d{2}-\d{2})", raw_dt)
            if d_match:
                match_date = d_match.group(1)
            t_match = re.search(r"[T\s](\d{1,2}:\d{2})(?::\d{2})?", raw_dt)
            if t_match:
                match_time = t_match.group(1).zfill(5)

    # 2. Check standalone time fields if time is still missing
    if not match_time:
        time_keys = [
            "Time", "time", "StartTime", "startTime", "ScheduleTime",
            "scheduleTime", "UnitTime", "unitTime", "TimeVenue", "VenueTime"
        ]
        for k in time_keys:
            val = m.get(k)
            if val and isinstance(val, str):
                val = val.strip()
                t_match = re.search(r"\b(\d{1,2}:\d{2})\b", val)
                if t_match:
                    raw_time = t_match.group(1).zfill(5)
                    if "Z" in val.upper() or "UTC" in val.upper():
                        # Convert UTC HH:MM to JST (+9)
                        h, mins = map(int, raw_time.split(":"))
                        h = (h + 9) % 24
                        match_time = f"{h:02d}:{mins:02d}"
                    else:
                        match_time = raw_time
                    break

    if not match_date:
        match_date = fallback_date

    return match_date, match_time


def parse_matches(raw_matches, gender="Men", date_str=""):
    """Extracts match scores, date, start time, and state for each fixture."""
    output = []
    for m in raw_matches:
        event_desc = (m.get("EventDesc") or "").lower()
        event_code = (m.get("Event") or "").upper()

        if gender == "Women":
            is_target = ("women" in event_desc) or event_code.startswith("W")
        else:
            is_target = (("men" in event_desc and "women" not in event_desc) or event_code.startswith("M"))

        if not is_target:
            continue

        status_raw = m.get("Status", "").upper()
        if status_raw in ["OFFICIAL", "UNCONFIRMED"]:
            status = "Finished"
        elif status_raw in ["LIVE", "IN_PROGRESS", "RUNNING"]:
            status = "Live"
        else:
            status = "Upcoming"

        state_desc = m.get("StatusDesc") or m.get("Period") or status

        match_date, match_time = extract_match_datetime(m, fallback_date=date_str)

        home = m.get("Home", {})
        away = m.get("Away", {})

        home_name = home.get("NameS") or home.get("Name") or "TBD"
        away_name = away.get("NameS") or away.get("Name") or "TBD"

        home_score = home.get("Result", "")
        away_score = away.get("Result", "")
        score_str = f"{home_score} - {away_score}" if (home_score != "" and away_score != "") else "vs"

        winner = ""
        if home.get("Winner"):
            winner = home_name
        elif away.get("Winner"):
            winner = away_name

        round_name = m.get("UnitDescS") or m.get("UnitDescA") or m.get("PhaseDescS", "Group Stage")

        output.append({
            "round": round_name,
            "status": status,
            "state": state_desc,
            "date": match_date,
            "time": match_time,
            "player1": home_name,
            "player2": away_name,
            "score": score_str,
            "winner": winner
        })
    return output


def main():
    start_date = datetime(2026, 9, 10)
    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(17)]

    all_men = []
    all_women = []

    for d in dates:
        day_data = fetch_api_day(d)
        if day_data:
            print(f"[{d}] Found {len(day_data)} items. Sample keys: {list(day_data[0].keys())}")
        men_parsed = parse_matches(day_data, "Men", date_str=d)
        women_parsed = parse_matches(day_data, "Women", date_str=d)
        all_men.extend(men_parsed)
        all_women.extend(women_parsed)

    os.makedirs("data/basketball", exist_ok=True)

    with open("data/basketball/tracker_men.json", "w", encoding="utf-8") as f:
        json.dump({"sport": "Basketball (Men)", "matches": all_men}, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(all_men)} Men's fixtures.")

    with open("data/basketball/tracker_women.json", "w", encoding="utf-8") as f:
        json.dump({"sport": "Basketball (Women)", "matches": all_women}, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(all_women)} Women's fixtures.")


if __name__ == "__main__":
    main()
