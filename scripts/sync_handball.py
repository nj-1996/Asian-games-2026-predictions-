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


def fetch_api_day(date_str):
    """Queries and decompresses raw daily schedule items for Handball (HBL)."""
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/HBL/schedule/daily/{date_str}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, verify=False)
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
                decomp = zlib.decompress(raw, wbits)
                data = json.loads(decomp.decode("utf-8"))
                if isinstance(data, list):
                    return data
            except Exception:
                continue

    return []


def clean_team_name(name):
    if not name:
        return ""
    n = re.sub(r"\(.*?\)", "", name).strip()
    n = re.sub(r"People's Republic of\s*", "", n, flags=re.I).strip()
    n = re.sub(r"Republic of\s*", "", n, flags=re.I).strip()
    return n


def parse_matches(items, gender="Men", date_str=""):
    """Parses raw API unit items into dashboard match schema."""
    output = []
    target_gender = gender.lower()

    for item in items:
        event_desc = item.get("EventDesc") or item.get("DisciplineName") or ""
        unit_desc = item.get("UnitDesc") or ""
        combined = f"{event_desc} {unit_desc}".lower()

        if target_gender not in combined:
            continue

        competitors = item.get("Competitors") or []
        if len(competitors) < 2:
            continue

        home_raw = competitors[0].get("CompetitorName") or competitors[0].get("Description") or "TBD"
        away_raw = competitors[1].get("CompetitorName") or competitors[1].get("Description") or "TBD"

        home_name = clean_team_name(home_raw)
        away_name = clean_team_name(away_raw)

        home_score = competitors[0].get("Result") or "-"
        away_score = competitors[1].get("Result") or "-"

        score_str = f"{home_score} - {away_score}" if (home_score != "-" and away_score != "-") else "vs"

        state_code = item.get("UnitStatus") or item.get("Status") or "SCHEDULED"
        state_desc = item.get("UnitStatusDesc") or "Scheduled"

        status = "Upcoming"
        if state_code in ["FINISHED", "OFFICIAL", "UNCONFIRMED"]:
            status = "Finished"
        elif state_code in ["IN_PROGRESS", "RUNNING", "LIVE"]:
            status = "Live"

        start_raw = item.get("StartDate") or item.get("StartDateTime") or ""
        match_date = date_str
        match_time = ""
        if start_raw:
            try:
                dt = datetime.fromisoformat(start_raw.replace("Z", "+00:00")).astimezone(JST)
                match_date = dt.strftime("%Y-%m-%d")
                match_time = dt.strftime("%H:%M")
            except Exception:
                pass

        winner = ""
        if status == "Finished" and home_score != "-" and away_score != "-":
            try:
                h_val = int(home_score)
                a_val = int(away_score)
                if h_val > a_val:
                    winner = home_name
                elif a_val > h_val:
                    winner = away_name
            except Exception:
                pass

        clean_round = unit_desc or event_desc

        output.append({
            "round": clean_round,
            "status": status,
            "state": state_desc,
            "date": match_date,
            "time": match_time,
            "player1": home_name,
            "player2": away_name,
            "score": score_str,
            "score1": home_score,
            "score2": away_score,
            "winner": winner
        })

    return output


def main():
    start_date = datetime(2026, 9, 19)
    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(12)]

    all_men = []
    all_women = []

    for d in dates:
        day_data = fetch_api_day(d)
        if day_data:
            sample_item = day_data[0]
            print(f"[{d}] Items: {len(day_data)} | Sample: {sample_item.get('EventDesc')} - {sample_item.get('UnitDesc')}")

        men_parsed = parse_matches(day_data, "Men", date_str=d)
        women_parsed = parse_matches(day_data, "Women", date_str=d)
        all_men.extend(men_parsed)
        all_women.extend(women_parsed)

    os.makedirs("data/handball", exist_ok=True)

    if len(all_men) > 0:
        with open("data/handball/tracker_men.json", "w", encoding="utf-8") as f:
            json.dump({"sport": "Handball (Men)", "matches": all_men}, f, indent=2, ensure_ascii=False)
        print(f"[OK] Saved {len(all_men)} Men's handball fixtures.")
    else:
        print("[WARN] No Men's fixtures returned from API. Preserving existing tracker_men.json.")

    if len(all_women) > 0:
        with open("data/handball/tracker_women.json", "w", encoding="utf-8") as f:
            json.dump({"sport": "Handball (Women)", "matches": all_women}, f, indent=2, ensure_ascii=False)
        print(f"[OK] Saved {len(all_women)} Women's handball fixtures.")
    else:
        print("[WARN] No Women's fixtures returned from API. Preserving existing tracker_women.json.")


if __name__ == "__main__":
    main()
