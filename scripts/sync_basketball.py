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

# Reverse CP1252/UTF-8 character map to reconstruct raw binary bytes
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
    """Fetches and decompresses schedule/results for a single tournament day."""
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/BKB/schedule/daily/{date_str}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
    except Exception as e:
        print(f"[{date_str}] HTTP request failed: {e}")
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

    # Reconstruct binary payload from transcoded CP1252 text
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


def parse_matches(raw_matches, gender="Men"):
    """Normalizes API matches for a specified division (Men or Women)."""
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
            "player1": home_name,
            "player2": away_name,
            "score": score_str,
            "winner": winner
        })
    return output


def main():
    # Full tournament date range (Sept 10 - Sept 26, 2026)
    start_date = datetime(2026, 9, 10)
    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(17)]

    all_men = []
    all_women = []

    for d in dates:
        day_data = fetch_api_day(d)
        men_matches = parse_matches(day_data, "Men")
        women_matches = parse_matches(day_data, "Women")
        all_men.extend(men_matches)
        all_women.extend(women_matches)

    # Ensure target directory exists
    os.makedirs("data/basketball", exist_ok=True)

    # Write Men's matches
    with open("data/basketball/tracker_men.json", "w", encoding="utf-8") as f:
        json.dump({"sport": "Basketball (Men)", "matches": all_men}, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(all_men)} Men's matches to data/basketball/tracker_men.json")

    # Write Women's matches
    with open("data/basketball/tracker_women.json", "w", encoding="utf-8") as f:
        json.dump({"sport": "Basketball (Women)", "matches": all_women}, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(all_women)} Women's matches to data/basketball/tracker_women.json")


if __name__ == "__main__":
    main()
