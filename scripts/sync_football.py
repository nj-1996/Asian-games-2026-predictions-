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
    """Queries and decompresses raw daily schedule items for Football (FBL)."""
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/FBL/schedule/daily/{date_str}"
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
    Extracts match date and 24-hr HH:MM time in JST (Venue Time)
    handling DateTimeRaw (epoch ms, ISO, .NET formats) and fallback fields.
    """
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
        try:
            h_val = float(home_score)
            a_val = float(away_score)
            if h_val > a_val:
                winner = home_name
            elif a_val > h_val:
                winner = away_name
        except (ValueError, TypeError):
            h_win = str(home.get("Winner", "")).lower() in ["true", "1", "y", "yes"]
            a_win = str(away.get("Winner", "")).lower() in ["true", "1", "y", "yes"]
            if h_win:
                winner = home_name
            elif a_win:
                winner = away_name

        round_raw = m.get("UnitDescS") or m.get("UnitDescA") or m.get("PhaseDescS", "Group Stage")

        # Convert "Men Gr.C" or "Gr.C" into "Group C"
        clean_round = re.sub(r'^(?:men|women)\s+gr(?:\.|\s+)\s*([a-z0-9]+)', r'Group \1', round_raw, flags=re.IGNORECASE)
        clean_round = re.sub(r'^gr(?:\.|\s+)\s*([a-z0-9]+)', r'Group \1', clean_round, flags=re.IGNORECASE)


        output.append({
            "round": clean_round,
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
    # Football group stages typically kick off earlier than other sports
    start_date = datetime(2026, 9, 14)
    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(23)]

    all_men = []
    all_women = []

    for d in dates:
        day_data = fetch_api_day(d)
        if day_data:
            sample_item = day_data[0]
            print(f"[{d}] Items: {len(day_data)} | Sample DateTimeRaw: {sample_item.get('DateTimeRaw')}")

        men_parsed = parse_matches(day_data, "Men", date_str=d)
        women_parsed = parse_matches(day_data, "Women", date_str=d)
        all_men.extend(men_parsed)
        all_women.extend(women_parsed)

    os.makedirs("data/football", exist_ok=True)

    with open("data/football/tracker_men.json", "w", encoding="utf-8") as f:
        json.dump({"sport": "Football (Men)", "matches": all_men}, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(all_men)} Men's football fixtures.")

    with open("data/football/tracker_women.json", "w", encoding="utf-8") as f:
        json.dump({"sport": "Football (Women)", "matches": all_women}, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(all_women)} Women's football fixtures.")


if __name__ == "__main__":
    main()
