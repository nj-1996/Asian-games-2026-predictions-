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
    """Queries and decompresses raw daily schedule items for Hockey (HOC)."""
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/HOC/schedule/daily/{date_str}"
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


def clean_hockey_round(raw_unit, raw_phase):
    """Normalizes round names into clean, standard display strings."""
    txt = (raw_unit or raw_phase or "Group Stage").strip()

    # Pool matches
    if re.search(r'pool\s*a', txt, re.IGNORECASE):
        return "Pool A"
    if re.search(r'pool\s*b', txt, re.IGNORECASE):
        return "Pool B"

    # Medal finals
    if re.search(r'gold\s*medal', txt, re.IGNORECASE) or re.search(r'\bf\s*gm\b', txt, re.IGNORECASE):
        return "Gold Medal Match"
    if re.search(r'bronze\s*medal', txt, re.IGNORECASE) or re.search(r'\bf\s*bm\b', txt, re.IGNORECASE):
        return "Bronze Medal Match"

    # Semifinals
    if re.search(r'semifinal', txt, re.IGNORECASE) or re.search(r'\bsf\b', txt, re.IGNORECASE):
        sf_match = re.search(r'match\s*(\d+)', txt, re.IGNORECASE)
        return f"Semifinal {sf_match.group(1)}" if sf_match else "Semifinals"

    # Classification matches
    if re.search(r'5th-6th', txt, re.IGNORECASE):
        return "5th-6th Place Match"
    if re.search(r'7th-8th', txt, re.IGNORECASE):
        return "7th-8th Place Match"
    if re.search(r'9th-10th', txt, re.IGNORECASE):
        return "9th-10th Place Match"
    if re.search(r'11th-12th', txt, re.IGNORECASE):
        return "11th-12th Place Match"
    if re.search(r'5th-8th', txt, re.IGNORECASE):
        m_num = re.search(r'match\s*(\d+)', txt, re.IGNORECASE)
        return f"5th-8th Match {m_num.group(1)}" if m_num else "5th-8th Classification"
    if re.search(r'9th-12th', txt, re.IGNORECASE):
        return "9th-12th Classification"

    # Fallback cleanup
    cleaned = re.sub(r'^(?:men|women)\s+', '', txt, flags=re.IGNORECASE)
    return cleaned.strip()


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
        elif status_raw in ["LIVE", "IN_PROGRESS", "RUNNING", "INTERRUPTED"]:
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

        unit_desc = m.get("UnitDesc") or m.get("UnitDescS") or ""
        phase_desc = m.get("PhaseDesc") or m.get("PhaseDescS") or ""
        clean_round = clean_hockey_round(unit_desc, phase_desc)

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
    start_date = datetime(2026, 9, 15)
    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(22)]

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

    os.makedirs("data/hockey", exist_ok=True)

    if len(all_men) > 0:
        with open("data/hockey/tracker_men.json", "w", encoding="utf-8") as f:
            json.dump({"sport": "Hockey (Men)", "matches": all_men}, f, indent=2, ensure_ascii=False)
        print(f"[OK] Saved {len(all_men)} Men's hockey fixtures.")
    else:
        print("[WARN] No Men's fixtures returned from API. Preserving existing tracker_men.json.")

    if len(all_women) > 0:
        with open("data/hockey/tracker_women.json", "w", encoding="utf-8") as f:
            json.dump({"sport": "Hockey (Women)", "matches": all_women}, f, indent=2, ensure_ascii=False)
        print(f"[OK] Saved {len(all_women)} Women's hockey fixtures.")
    else:
        print("[WARN] No Women's fixtures returned from API. Preserving existing tracker_women.json.")


if __name__ == "__main__":
    main()
