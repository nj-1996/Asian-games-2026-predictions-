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
    try:
        CHARMAP[bytes([b]).decode("cp1252")] = b
    except Exception:
        try:
            CHARMAP[bytes([b]).decode("latin1")] = b
        except Exception:
            pass


def fetch_api_day(date_str):
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/MPN/schedule/daily/{date_str}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
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
                decompressed = zlib.decompress(raw, wbits)
                return json.loads(decompressed.decode("utf-8"))
            except Exception:
                continue

    return []


def extract_match_datetime(m, fallback_date=""):
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


def parse_competitors(item):
    raw_list = (
        item.get("Competitors")
        or item.get("Results")
        or item.get("Participants")
        or item.get("Competitor")
        or []
    )
    if not isinstance(raw_list, list):
        return []

    parsed = []
    for idx, c in enumerate(raw_list):
        if not isinstance(c, dict):
            continue

        rank_val = c.get("Rank") or c.get("Order") or c.get("Position") or (idx + 1)
        name = (
            c.get("CompetitorName")
            or c.get("AthleteName")
            or c.get("Name")
            or c.get("PrintName")
            or "Unknown Athlete"
        )
        noc = c.get("NOC") or c.get("CountryCode") or c.get("Country") or ""
        raw_result = (
            c.get("Result")
            or c.get("Mark")
            or c.get("Time")
            or c.get("Score")
            or "-"
        )
        pts = (
            c.get("Points")
            or c.get("DisciplinePoints")
            or c.get("ScorePoints")
            or "-"
        )
        total_pts = (
            c.get("TotalPoints")
            or c.get("CumulativePoints")
            or pts
        )

        parsed.append({
            "rank": rank_val,
            "name": name,
            "country": noc,
            "raw": str(raw_result),
            "points": str(pts),
            "total_pts": str(total_pts)
        })

    return parsed


def parse_events(raw_items, gender="Men", date_str=""):
    output = []
    for item in raw_items:
        desc = (item.get("EventDesc") or item.get("DisciplineDesc") or "").lower()
        code = (item.get("Event") or item.get("Discipline") or "").upper()

        if gender == "Women":
            is_target = ("women" in desc) or code.startswith("W")
        else:
            is_target = ("men" in desc and "women" not in desc) or code.startswith("M")

        if not is_target:
            continue

        phase_raw = item.get("PhaseDescS") or item.get("PhaseDesc") or item.get("Phase") or "Preliminary"
        unit_raw = item.get("UnitDescS") or item.get("UnitDesc") or item.get("UnitDescA") or ""
        status_raw = str(item.get("Status", "")).upper()

        if status_raw in ["OFFICIAL", "FINISHED", "UNCONFIRMED"]:
            status = "Official"
        elif status_raw in ["LIVE", "IN_PROGRESS", "RUNNING"]:
            status = "Live"
        else:
            status = "Scheduled"

        ev_date, ev_time = extract_match_datetime(item, fallback_date=date_str)
        venue = item.get("VenueDesc") or item.get("Venue") or "Anjo Sports Park"

        # Differentiate Semi-Final Group A vs Group B by start hour
        group = ""
        phase_clean = phase_raw.strip()
        is_semi = phase_clean.upper() == "SF" or "semi" in phase_clean.lower()

        if is_semi:
            hour = int(ev_time.split(":")[0]) if ev_time and ":" in ev_time else 0
            group = "Group A" if hour < 13 else "Group B"
            phase_clean = f"Semi-final ({group})"
        elif "seed" in phase_clean.lower():
            phase_clean = "Fencing Seeding Round"
        elif "final" in phase_clean.lower():
            phase_clean = "Final"

        discipline = unit_raw if unit_raw else phase_raw

        # Strictly exclude semi-finals, preliminaries, and seeding from medal tags
        is_final_phase = ("final" in phase_clean.lower()) and not is_semi
        is_medal = bool(
            is_final_phase
            and ("laser run" in discipline.lower() or item.get("MedalFlag") or "medal" in unit_raw.lower())
        )
        medal_desc = f"{gender}'s Individual & Team Medals" if is_medal else ""

        unit_code = item.get("Unit") or item.get("UnitCode") or ""
        event_id = unit_code or f"{phase_clean}_{discipline}_{ev_date}_{ev_time}".lower().replace(" ", "_")

        competitors = parse_competitors(item)

        event_payload = {
            "id": event_id,
            "unit_code": unit_code,
            "round": phase_clean,
            "phase": phase_clean,
            "group": group,
            "discipline": discipline,
            "status": status,
            "date": ev_date,
            "time": ev_time,
            "venue": venue,
            "is_medal": is_medal,
            "medal_desc": medal_desc,
            "competitors": competitors
        }
        output.append(event_payload)

    return output


def main():
    start_date = datetime(2026, 9, 15)
    dates = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(8)]

    all_men = []
    all_women = []
    sample_dumped = False

    for d in dates:
        items = fetch_api_day(d)
        print(f"[{d}] Scraped {len(items)} MPN schedule items")

        # Dump the first completed raw payload to inspect actual feed keys
        if not sample_dumped and items:
            for it in items:
                st = str(it.get("Status", "")).upper()
                if st in ["OFFICIAL", "FINISHED"]:
                    with open("mpn_raw_sample.json", "w", encoding="utf-8") as sf:
                        json.dump(it, sf, indent=2, ensure_ascii=False)
                    print(f"--> Saved raw sample item to mpn_raw_sample.json from date {d}")
                    sample_dumped = True
                    break

        all_men.extend(parse_events(items, "Men", date_str=d))
        all_women.extend(parse_events(items, "Women", date_str=d))

    os.makedirs("data/modern_pentathlon", exist_ok=True)

    if len(all_men) > 0:
        with open("data/modern_pentathlon/tracker_men.json", "w", encoding="utf-8") as f:
            json.dump({
                "sport": "Modern Pentathlon (Men)",
                "events": all_men,
                "matches": all_men
            }, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(all_men)} Men's pentathlon sessions.")

    if len(all_women) > 0:
        with open("data/modern_pentathlon/tracker_women.json", "w", encoding="utf-8") as f:
            json.dump({
                "sport": "Modern Pentathlon (Women)",
                "events": all_women,
                "matches": all_women
            }, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(all_women)} Women's pentathlon sessions.")


if __name__ == "__main__":
    main()
