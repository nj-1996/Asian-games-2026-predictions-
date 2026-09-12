import json
import zlib
from datetime import datetime, timedelta
import requests

# Request headers to mirror modern browser client
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://results.asiangames2026.org/",
    "Accept": "*/*",
}

# The backend returns zlib-compressed streams disguised as text/plain with UTF-8/CP1252 encoding.
# This table maps codepoints back into raw 0-255 bytes.
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
    """Fetches and unpacks match records for a single tournament day."""
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/BKB/schedule/daily/{date_str}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
    except Exception as e:
        print(f"[{date_str}] HTTP request failed: {e}")
        return []

    if resp.status_code != 200:
        return []

    # 1. Check if the response is already uncompressed JSON
    try:
        data = resp.json()
        if isinstance(data, list):
            print(f"[{date_str}] Direct JSON fetched: {len(data)} items")
            return data
    except Exception:
        pass

    # 2. Rebuild raw binary candidates and decompress
    candidates = []
    try:
        candidates.append(bytes([CHARMAP.get(c, ord(c) & 0xFF) for c in resp.text]))
    except Exception:
        pass
    candidates.append(resp.content)

    decompressed = None
    for raw in candidates:
        for wbits in [zlib.MAX_WBITS, -zlib.MAX_WBITS, 16 + zlib.MAX_WBITS]:
            try:
                decompressed = zlib.decompress(raw, wbits)
                break
            except Exception:
                continue
        if decompressed:
            break

    if decompressed:
        try:
            data = json.loads(decompressed.decode("utf-8"))
            print(f"[{date_str}] Decompressed: {len(data)} items")
            return data
        except Exception as e:
            print(f"[{date_str}] JSON decoding failed: {e}")
            return []

    print(f"[{date_str}] Failed to decode payload.")
    return []


def parse_matches(raw_matches, gender="Men"):
    """Normalizes API matches for a specified division (Men or Women)."""
    output = []
    for m in raw_matches:
        event_desc = (m.get("EventDesc") or "").lower()
        event_code = (m.get("Event") or "").upper()

        # Differentiate between Men's and Women's divisions
        if gender == "Women":
            is_target = ("women" in event_desc) or event_code.startswith("W")
        else:
            is_target = (("men" in event_desc and "women" not in event_desc) or event_code.startswith("M"))

        if not is_target:
            continue

        # Map API status strings to display status
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
    # Scan all Asian Games 2026 basketball tournament dates (Sept 10 - Sept 26, 2026)
    start_date = datetime(2026, 9, 10)
    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(17)]

    all_men = []
    all_women = []

    for d in dates:
        day_data = fetch_api_day(d)
        men_matches = parse_matches(day_data, "Men")
        women_matches = parse_matches(day_data, "Women")

        if men_matches or women_matches:
            print(f" -> {d}: Found {len(men_matches)} Men, {len(women_matches)} Women")

        all_men.extend(men_matches)
        all_women.extend(women_matches)

    # Save Men's match data
    if all_men:
        with open("data/basketball_men_tracker.json", "w", encoding="utf-8") as f:
            json.dump({"sport": "Basketball (Men)", "matches": all_men}, f, indent=2, ensure_ascii=False)
        print(f"Successfully saved {len(all_men)} Men's fixtures.")

    # Save Women's match data
    if all_women:
        with open("data/basketball_women_tracker.json", "w", encoding="utf-8") as f:
            json.dump({"sport": "Basketball (Women)", "matches": all_women}, f, indent=2, ensure_ascii=False)
        print(f"Successfully saved {len(all_women)} Women's fixtures.")


if __name__ == "__main__":
    main()
    
