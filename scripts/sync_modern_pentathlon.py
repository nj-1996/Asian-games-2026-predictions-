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

ATHLETE_NOC_MAP = {
    # South Korea
    "SEO CHANGWAN": "KOR", "JUN WOONGTAE": "KOR", "LEE JONGHYEON": "KOR", "KIM YOUNGHA": "KOR",
    "KIM SUNWOO": "KOR", "SEONG SEUNGMIN": "KOR", "JANG HAEUN": "KOR", "KIM SOEUN": "KOR",
    # China
    "MA YUANG": "CHN", "CHEN BAILIANG": "CHN", "LUO SHUAI": "CHN", "LI LIUCHANG": "CHN",
    "ZHANG MINGYU": "CHN", "BIAN YUFEI": "CHN", "WU KEBAN": "CHN", "XIE LINZHI": "CHN",
    # Japan
    "SATO TAISHU": "JPN", "TOMITA YOUSUKE": "JPN", "SEKIGAWA KAZUAKI": "JPN", "SHINOKI KAORU": "JPN",
    "UCHIDA MISAKI": "JPN", "OTA NATSUMI": "JPN", "YOSHIDA HANA": "JPN", "SAITO KANA": "JPN",
    # Kazakhstan
    "ABDRAIMOV TEMIRLAN": "KAZ", "GERMAN SAMUEL": "KAZ", "VARYOKHIN TIKHON": "KAZ", "TRETYAKOV DMITRIY": "KAZ",
    "STADNIK KIRILL": "KAZ", "CHUVASHOV LEV": "KAZ", "POTAPENKO YELENA": "KAZ", "AKHMETOVA ANASTASSIYA": "KAZ",
    "YAKOVLEVA SOFYA": "KAZ", "KULIKOVA KRISTINA": "KAZ",
    # Southeast & South Asia
    "COMALING MICHAEL VER ANTON": "PHI", "ANDRINO GILBERT": "PHI",
    "YOHUANG PHURIT": "THA", "THATTHONG PONGKRIT": "THA",
    "MATULATUWA SAMUEL": "INA", "IFSAN MUHAMMAD": "INA",
    "AW JIAN TING": "SGP", "ANSARI TAHIR": "IND",
    "SILVA OSHADA": "SRI", "SHUM CHUN HEI": "HKG",
    # Central & West Asia
    "ERKINBEKOV ATAI": "KGZ", "AMARSANAA BILEGT": "MGL",
    "YARED MICHAEL ANTOINE": "LBN", "GODBOUT JOSEPH ANTHONY": "LBN",
    "ALSUHAIBI MOHAMMAD": "KSA", "ABDALRHMAN ABDLLAH MOHAMMAD": "JOR",
    "ABUSHABAB OMAR": "PLE", "ABUSHABAB ABDALLAH": "PLE"
}


def resolve_country(name, raw_noc=""):
    if raw_noc and str(raw_noc).strip():
        return str(raw_noc).strip()
    if not name:
        return ""
    clean_name = re.sub(r"[^A-Za-z\s]", "", str(name)).strip().upper()
    clean_name = re.sub(r"\s+", " ", clean_name)
    return ATHLETE_NOC_MAP.get(clean_name, "")


def decompress_payload(resp):
    try:
        data = resp.json()
        if isinstance(data, (list, dict)):
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
    return None


def fetch_api_day(date_str):
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/MPN/schedule/daily/{date_str}"
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        if resp.status_code == 200:
            res = decompress_payload(resp)
            if isinstance(res, list):
                return res
    except Exception as e:
        print(f"[{date_str}] Daily schedule request failed: {e}")
    return []


def fetch_unit_results(rsc):
    if not rsc:
        return []
    for endpoint in ["result", "results"]:
        url = f"https://back.results.asiangames2026.org/s/AG2026/en/MPN/{endpoint}/{rsc}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=15)
            if resp.status_code == 200:
                data = decompress_payload(resp)
                if data:
                    if isinstance(data, list):
                        return data
                    if isinstance(data, dict):
                        return (
                            data.get("Competitors")
                            or data.get("Results")
                            or data.get("Units")
                            or data.get("ResultItems")
                            or data.get("Participants")
                            or []
                        )
        except Exception:
            continue
    return []


def extract_rsc(item):
    for key in ["RSC", "Code", "UnitCode", "Unit", "UnitNum", "Id", "ID"]:
        val = item.get(key)
        if val and isinstance(val, str) and re.match(r"^[MW]\.[A-Za-z0-9\-]+\.[A-Za-z0-9\-]+", val.strip()):
            return val.strip()

    for k, v in item.items():
        if isinstance(v, str) and re.match(r"^[MW]\.[A-Za-z0-9\-]+\.[A-Za-z0-9\-]+", v.strip()):
            return v.strip()

    return ""


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


def parse_competitors(raw_list):
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
            or c.get("PrintName")
            or c.get("Name")
            or f"Competitor {rank_val}"
        )
        noc_raw = (
            c.get("NOC")
            or c.get("CountryCode")
            or c.get("Country")
            or c.get("Organisation")
            or c.get("NocCode")
            or ""
        )
        country = resolve_country(name, noc_raw)

        raw_result = (
            c.get("Result")
            or c.get("Victories")
            or c.get("Mark")
            or c.get("Time")
            or c.get("Score")
            or "-"
        )
        pts = (
            c.get("Points")
            or c.get("DisciplinePoints")
            or c.get("ScorePoints")
            or c.get("Victories")
            or "-"
        )
        total_pts = (
            c.get("TotalPoints")
            or c.get("CumulativePoints")
            or pts
        )

        victories = (
            c.get("Victories")
            or c.get("Wins")
            or c.get("Won")
            or c.get("Win")
            or c.get("V")
            or c.get("W")
            or "-"
        )
        defeats = (
            c.get("Defeats")
            or c.get("Losses")
            or c.get("Lost")
            or c.get("Loss")
            or c.get("D")
            or c.get("L")
            or "-"
        )
        penalties = (
            c.get("Penalties")
            or c.get("Penalty")
            or c.get("Pen")
            or c.get("Faults")
            or c.get("PenaltyPoints")
            or "0"
        )

        parsed.append({
            "rank": int(rank_val) if str(rank_val).isdigit() else rank_val,
            "name": str(name).strip(),
            "country": country,
            "raw": str(raw_result).strip(),
            "points": str(pts).strip(),
            "total_pts": str(total_pts).strip(),
            "victories": str(victories).strip(),
            "defeats": str(defeats).strip(),
            "penalties": str(penalties).strip()
        })

    parsed.sort(key=lambda x: int(x["rank"]) if str(x["rank"]).isdigit() else 999)
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

        is_final_phase = ("final" in phase_clean.lower()) and not is_semi
        is_medal = bool(
            is_final_phase
            and ("laser run" in discipline.lower() or item.get("MedalFlag") or "medal" in unit_raw.lower())
        )
        medal_desc = f"{gender}'s Individual & Team Medals" if is_medal else ""

        rsc = extract_rsc(item)
        event_id = rsc or f"{phase_clean}_{discipline}_{ev_date}_{ev_time}".lower().replace(" ", "_")

        competitors = []
        if status in ["Official", "Live"] and rsc:
            full_results = fetch_unit_results(rsc)
            if full_results:
                competitors = parse_competitors(full_results)

        if not competitors:
            competitors = parse_competitors(
                item.get("Competitors")
                or item.get("Results")
                or item.get("Participants")
                or []
            )

        event_payload = {
            "id": event_id,
            "unit_code": rsc,
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

    for d in dates:
        items = fetch_api_day(d)
        print(f"[{d}] Scraped {len(items)} MPN schedule items")
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
