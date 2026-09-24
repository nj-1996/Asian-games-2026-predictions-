import json
import os
import re
import zlib
from concurrent.futures import ThreadPoolExecutor
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
IST = timezone(timedelta(hours=5, minutes=30))

CHARMAP = {}
for b in range(256):
    try:
        CHARMAP[bytes([b]).decode("cp1252")] = b
    except Exception:
        try:
            CHARMAP[bytes([b]).decode("latin1")] = b
        except Exception:
            pass

ORG_MAP = {
    "CHN": "China",
    "JPN": "Japan",
    "KOR": "Korea",
    "HKG": "Hong Kong, China",
    "QAT": "Qatar",
    "BRN": "Bahrain",
    "KUW": "Kuwait",
    "KAZ": "Kazakhstan",
    "IRI": "IR Iran",
    "UZB": "Uzbekistan",
    "VIE": "Vietnam",
    "IND": "India",
    "THA": "Thailand",
    "SGP": "Singapore",
    "TPE": "Chinese Taipei",
    "MAS": "Malaysia",
    "PHI": "Philippines",
    "INA": "Indonesia",
    "MGL": "Mongolia",
    "MAC": "Macau, China",
    "MDV": "Maldives",
    "NEP": "Nepal",
    "PAK": "Pakistan",
    "PLE": "Palestine",
    "PRK": "DPR Korea",
    "SRI": "Sri Lanka",
    "SYR": "Syria",
    "TJK": "Tajikistan",
    "TLS": "Timor-Leste",
    "TKM": "Turkmenistan",
    "UAE": "United Arab Emirates",
    "YEM": "Yemen",
    "CAM": "Cambodia",
    "LAO": "Laos",
    "BRU": "Brunei",
    "BHU": "Bhutan",
    "BAN": "Bangladesh",
    "AFG": "Afghanistan",
    "OMA": "Oman",
    "KSA": "Saudi Arabia",
    "JOR": "Jordan",
    "IRQ": "Iraq",
    "LBN": "Lebanon",
}

def clean_org(code):
    if not code:
        return ""
    code_up = code.upper().strip()
    return ORG_MAP.get(code_up, code_up)

def decompress_payload(resp):
    try:
        data = resp.json()
        if isinstance(data, (dict, list)):
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
                dec = zlib.decompress(raw, wbits)
                return json.loads(dec.decode("utf-8"))
            except Exception:
                continue
    return None

def fetch_daily_schedule(session, date_str):
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/SWM/schedule/daily/{date_str}"
    try:
        resp = session.get(url, headers=HEADERS, timeout=12, verify=False)
        if resp.status_code == 200:
            data = decompress_payload(resp)
            if isinstance(data, list):
                return data
    except Exception as e:
        print(f"[{date_str}] Schedule error: {e}")
    return []

def fetch_unit_result(session, res_code):
    url = f"https://back.results.asiangames2026.org/s/AG2026/en/SWM/results/{res_code}"
    try:
        resp = session.get(url, headers=HEADERS, timeout=10, verify=False)
        if resp.status_code == 200:
            return decompress_payload(resp)
    except Exception:
        pass
    return None

def parse_iso_time(dt_str):
    if not dt_str:
        return "", "", ""
    try:
        clean_dt = dt_str.replace("Z", "+00:00")
        dt_val = datetime.fromisoformat(clean_dt)
        dt_jst = dt_val.astimezone(JST)
        dt_ist = dt_val.astimezone(IST)
        return (
            dt_jst.strftime("%Y-%m-%d"),
            dt_jst.strftime("%H:%M"),
            dt_ist.strftime("%H:%M"),
        )
    except Exception:
        parts = dt_str.split("T")
        date_p = parts[0]
        time_p = parts[1][:5] if len(parts) > 1 else ""
        return date_p, time_p, time_p

def parse_competitors(comp_list):
    parsed = []
    for c in comp_list or []:
        res_info = c.get("Results") if isinstance(c.get("Results"), dict) else {}
        
        # Lane & Rank
        lane = c.get("Lane") or c.get("StartOrder") or ""
        rk_val = c.get("Rk") or c.get("RkPo") or res_info.get("Rk") or res_info.get("RkPo")
        rk_str = str(rk_val) if rk_val not in (None, "") else ""
        
        # Result / Time
        result_time = c.get("Result") or res_info.get("Result") or ""
        diff_str = c.get("Diff") or res_info.get("Diff") or ""
        
        # Athlete Name & Org
        name = c.get("Name") or ""
        org_code = c.get("Org") or ""
        country = clean_org(org_code)
        
        # Medal (ME_GOLD, ME_SILVER, ME_BRONZE)
        raw_med = c.get("Medal") or res_info.get("Medal") or ""
        medal = ""
        if "GOLD" in raw_med:
            medal = "Gold"
        elif "SILVER" in raw_med:
            medal = "Silver"
        elif "BRONZE" in raw_med:
            medal = "Bronze"

        # Qualification (Q, q)
        qual = c.get("Qualified") or res_info.get("Qual") or ""

        # Records (GR, AR, WR)
        rec = c.get("RecordBest") or c.get("RecordInd") or ""

        # Extensions
        ext_map = {}
        for ext in c.get("Extensions") or []:
            code = ext.get("Code")
            val = ext.get("Value")
            if code and val:
                ext_map[code] = val
        
        reaction = ext_map.get("Reaction", "")
        birth_year = ext_map.get("BirthYear", "")
        qt = ext_map.get("QT", "")

        # Splits
        splits_out = []
        for s in c.get("Splits") or []:
            dist = s.get("Distance")
            split_res = s.get("Result")
            accum_res = s.get("AcumulatedResult")
            leg_rk = s.get("LegRk") or s.get("Rk")
            if dist:
                splits_out.append({
                    "distance": str(dist) + "m",
                    "split": split_res or "",
                    "accumulated": accum_res or "",
                    "rank": str(leg_rk) if leg_rk else ""
                })

        parsed.append({
            "lane": str(lane),
            "rank": rk_str,
            "name": name,
            "org": org_code,
            "country": country,
            "time": result_time,
            "diff": diff_str,
            "medal": medal,
            "qual": qual,
            "record": rec,
            "reaction": reaction,
            "birthYear": birth_year,
            "qualifyingTime": qt,
            "splits": splits_out,
            "irm": c.get("IRM", "OK")
        })

    # Sort competitors by rank if available, otherwise by lane
    def sort_key(item):
        rk = item["rank"]
        if rk and rk.isdigit():
            return (0, int(rk))
        if item["lane"] and item["lane"].isdigit():
            return (1, int(item["lane"]))
        return (2, 99)

    parsed.sort(key=sort_key)
    return parsed

def sync_swimming():
    print("Fetching Asian Games 2026 Swimming (SWM) official data...")
    session = requests.Session()
    dates = [
        "2026-09-20", "2026-09-21", "2026-09-22",
        "2026-09-23", "2026-09-24", "2026-09-25"
    ]

    all_schedule_items = []
    for d in dates:
        items = fetch_daily_schedule(session, d)
        print(f"[{d}] Retrieved {len(items)} swimming units/events")
        all_schedule_items.extend(items)

    print(f"Total schedule units collected: {len(all_schedule_items)}")

    # Fetch detailed results for each unit in parallel
    res_codes = [it.get("ResCode") for it in all_schedule_items if it.get("ResCode")]
    unique_res_codes = list(set(res_codes))
    print(f"Fetching detailed unit results for {len(unique_res_codes)} unique units...")

    unit_results_map = {}
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(fetch_unit_result, session, code): code for code in unique_res_codes}
        completed = 0
        for fut in futures:
            code = futures[fut]
            try:
                res_data = fut.result()
                if res_data:
                    unit_results_map[code] = res_data
            except Exception as e:
                pass
            completed += 1
            if completed % 30 == 0 or completed == len(unique_res_codes):
                print(f"  Processed {completed}/{len(unique_res_codes)} unit results...")

    # Group into Events
    events_dict = {}

    for item in all_schedule_items:
        ev_code = item.get("Event")
        if not ev_code:
            continue

        ev_desc = item.get("EventDesc") or ""
        phase_desc = item.get("PhaseDesc") or item.get("PhaseDescA") or ""
        unit_desc = item.get("UnitDesc") or item.get("PhaseDesc") or ""
        res_code = item.get("ResCode") or ""
        dt_raw = item.get("DateTimeRaw") or ""
        date_str, time_jst, time_ist = parse_iso_time(dt_raw)
        venue = item.get("VenueDesc") or "Tokyo Aquatics Centre"
        status = item.get("Status") or "SCHEDULED"

        # Determine gender
        if ev_desc.startswith("Men's"):
            gender = "men"
        elif ev_desc.startswith("Women's"):
            gender = "women"
        elif ev_desc.startswith("Mixed"):
            gender = "mixed"
        else:
            gender = "men"

        if ev_code not in events_dict:
            events_dict[ev_code] = {
                "id": ev_code,
                "name": ev_desc,
                "gender": gender,
                "venue": venue,
                "dates": set(),
                "status": "Scheduled",
                "heats": [],
                "finals": [],
                "podium": {
                    "gold": None,
                    "silver": None,
                    "bronze": None
                }
            }

        ev_entry = events_dict[ev_code]
        if date_str:
            ev_entry["dates"].add(date_str)

        # Get detailed competitors
        unit_data = unit_results_map.get(res_code, {})
        raw_competitors = unit_data.get("Competitors") if unit_data else item.get("Results")
        parsed_comp = parse_competitors(raw_competitors)

        is_final = "Final" in unit_desc or "FNL" in res_code
        unit_status = item.get("Status") or (unit_data.get("Info", {}).get("Status") if unit_data else "SCHEDULED")

        unit_obj = {
            "id": res_code,
            "unitDesc": unit_desc,
            "phase": phase_desc,
            "unitNum": item.get("UnitNum") or "",
            "date": date_str,
            "timeJst": time_jst,
            "timeIst": time_ist,
            "status": unit_status,
            "isFinal": is_final,
            "participantCount": len(parsed_comp),
            "results": parsed_comp
        }

        if is_final:
            ev_entry["finals"].append(unit_obj)
            if unit_status in ("OFFICIAL", "Finished", "OFFICIAL_RESULTS"):
                ev_entry["status"] = "Official"
                for c in parsed_comp:
                    if c["medal"] == "Gold" or c["rank"] == "1":
                        if not ev_entry["podium"]["gold"]:
                            ev_entry["podium"]["gold"] = {
                                "athlete": c["name"],
                                "country": c["country"],
                                "org": c["org"],
                                "time": c["time"],
                                "record": c["record"]
                            }
                    elif c["medal"] == "Silver" or c["rank"] == "2":
                        if not ev_entry["podium"]["silver"]:
                            ev_entry["podium"]["silver"] = {
                                "athlete": c["name"],
                                "country": c["country"],
                                "org": c["org"],
                                "time": c["time"]
                            }
                    elif c["medal"] == "Bronze" or c["rank"] == "3":
                        if not ev_entry["podium"]["bronze"]:
                            ev_entry["podium"]["bronze"] = {
                                "athlete": c["name"],
                                "country": c["country"],
                                "org": c["org"],
                                "time": c["time"]
                            }
        else:
            ev_entry["heats"].append(unit_obj)

    # Finalize event formatting
    formatted_events = []
    for ev_code, ev in events_dict.items():
        ev["dates"] = sorted(list(ev["dates"]))
        ev["date"] = ev["dates"][0] if ev["dates"] else ""
        
        # Sort heats by unitNum or time
        ev["heats"].sort(key=lambda u: (u["date"], u["timeJst"], u["unitNum"]))
        ev["finals"].sort(key=lambda u: (u["date"], u["timeJst"]))

        # Event level status
        if any(f["status"] in ("OFFICIAL", "Finished") for f in ev["finals"]):
            ev["status"] = "Official"
        elif any(f["status"] == "LIVE" or any(h["status"] == "LIVE" for h in ev["heats"]) for f in ev["finals"]):
            ev["status"] = "Live"
        elif any(h["status"] in ("OFFICIAL", "Finished") for h in ev["heats"]):
            ev["status"] = "Heats Completed"
        else:
            ev["status"] = "Scheduled"

        formatted_events.append(ev)

    # Sort events: Men, Women, Mixed, and alphabetically/chronologically
    men_events = [e for e in formatted_events if e["gender"] == "men"]
    women_events = [e for e in formatted_events if e["gender"] == "women"]
    mixed_events = [e for e in formatted_events if e["gender"] == "mixed"]

    men_events.sort(key=lambda x: (x["date"], x["name"]))
    women_events.sort(key=lambda x: (x["date"], x["name"]))
    mixed_events.sort(key=lambda x: (x["date"], x["name"]))

    print(f"\nFinal Tally:")
    print(f"  Men's Events: {len(men_events)} (Expected 20)")
    print(f"  Women's Events: {len(women_events)} (Expected 20)")
    print(f"  Mixed Events: {len(mixed_events)} (Expected 1)")

    # Save outputs
    os.makedirs("data/swimming", exist_ok=True)

    men_output = {
        "sport": "Swimming",
        "gender": "men",
        "totalEvents": len(men_events),
        "events": men_events
    }
    with open("data/swimming/tracker_men.json", "w", encoding="utf-8") as f:
        json.dump(men_output, f, indent=2, ensure_ascii=False)

    women_output = {
        "sport": "Swimming",
        "gender": "women",
        "totalEvents": len(women_events),
        "events": women_events
    }
    with open("data/swimming/tracker_women.json", "w", encoding="utf-8") as f:
        json.dump(women_output, f, indent=2, ensure_ascii=False)

    mixed_output = {
        "sport": "Swimming",
        "gender": "mixed",
        "totalEvents": len(mixed_events),
        "events": mixed_events
    }
    with open("data/swimming/tracker_mixed.json", "w", encoding="utf-8") as f:
        json.dump(mixed_output, f, indent=2, ensure_ascii=False)

    # Also unified tracker.json
    all_output = {
        "sport": "Swimming",
        "totalEvents": len(formatted_events),
        "events": formatted_events,
        "men": men_events,
        "women": women_events,
        "mixed": mixed_events
    }
    with open("data/swimming/tracker.json", "w", encoding="utf-8") as f:
        json.dump(all_output, f, indent=2, ensure_ascii=False)

    print("\n[OK] Successfully generated data/swimming/ trackers!")

if __name__ == "__main__":
    sync_swimming()
