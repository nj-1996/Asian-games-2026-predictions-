import json
import os
import zlib
from datetime import datetime, timedelta
import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://results.asiangames2026.org/",
    "Accept": "*/*",
}

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

        # Extract detailed state/quarter if available
        state_desc = m.get("StatusDesc") or m.get("Period") or status

        # Extract date and time
        start_raw = m.get("StartDate", "")
        match_date = date_str
        match_time = m.get("Time") or m.get("StartTime") or ""

        if "T" in start_raw:
            parts = start_raw.split("T")
            if not match_date:
                match_date = parts[0]
            if not match_time and len(parts) > 1:
                match_time = parts[1][:5]

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
        all_men.extend(parse_matches(day_data, "Men", date_str=d))
        all_women.extend(parse_matches(day_data, "Women", date_str=d))

    os.makedirs("data/basketball", exist_ok=True)

    with open("data/basketball/tracker_men.json", "w", encoding="utf-8") as f:
        json.dump({"sport": "Basketball (Men)", "matches": all_men}, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(all_men)} Men's fixtures.")

    with open("data/basketball/tracker_women.json", "w", encoding="utf-8") as f:
        json.dump({"sport": "Basketball (Women)", "matches": all_women}, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(all_women)} Women's fixtures.")


if __name__ == "__main__":
    main()
