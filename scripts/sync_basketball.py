import json
import zlib
from datetime import datetime, timedelta
import requests

HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ),
    'Referer': 'https://results.asiangames2026.org/',
    'Accept': '*/*',
}

# Reverse charmap to rebuild single-byte stream from UTF-8/CP1252 text
CHARMAP = {}
for b in range(256):
  try:
    CHARMAP[bytes([b]).decode('cp1252')] = b
  except Exception:
    try:
      CHARMAP[bytes([b]).decode('latin1')] = b
    except Exception:
      pass


def fetch_api_day(date_str):
  url = f'https://back.results.asiangames2026.org/s/AG2026/en/BKB/schedule/daily/{date_str}'
  try:
    resp = requests.get(url, headers=HEADERS, timeout=15)
  except Exception as e:
    print(f'[{date_str}] Network request error: {e}')
    return []

  if resp.status_code != 200:
    print(f'[{date_str}] HTTP {resp.status_code} (No games scheduled)')
    return []

  # 1. Fallback: check if the server returned plain uncompressed JSON
  try:
    data = resp.json()
    if isinstance(data, list):
      print(f'[{date_str}] Direct JSON fetched: {len(data)} items')
      return data
  except Exception:
    pass

  # 2. Decompress zlib payload (trying CP1252 mapped text and raw content)
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
      data = json.loads(decompressed.decode('utf-8'))
      print(f'[{date_str}] Decompressed: {len(data)} items')
      return data
    except Exception as e:
      print(f'[{date_str}] JSON parse error after decompress: {e}')
      return []

  print(f'[{date_str}] Failed to decode or decompress payload')
  return []


def parse_matches(raw_matches, gender='Men'):
  output = []
  for m in raw_matches:
    if m.get('EventDesc') != gender:
      continue

    status_raw = m.get('Status', '').upper()
    if status_raw in ['OFFICIAL', 'UNCONFIRMED']:
      status = 'Finished'
    elif status_raw in ['LIVE', 'IN_PROGRESS', 'RUNNING']:
      status = 'Live'
    else:
      status = 'Upcoming'

    home = m.get('Home', {})
    away = m.get('Away', {})

    home_name = home.get('NameS') or home.get('Name') or 'TBD'
    away_name = away.get('NameS') or away.get('Name') or 'TBD'

    home_score = home.get('Result', '')
    away_score = away.get('Result', '')
    score_str = (
        f'{home_score} - {away_score}' if home_score and away_score else 'vs'
    )

    winner = ''
    if home.get('Winner'):
      winner = home_name
    elif away.get('Winner'):
      winner = away_name

    round_name = (
        m.get('UnitDescS')
        or m.get('UnitDescA')
        or m.get('PhaseDescS', 'Group Stage')
    )

    output.append({
        'round': round_name,
        'status': status,
        'player1': home_name,
        'player2': away_name,
        'score': score_str,
        'winner': winner,
    })
  return output


def main():
  # Scan through the tournament schedule (Sept 10 through Sept 26, 2026)
  start_date = datetime(2026, 9, 10)
  dates = [
      (start_date + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(17)
  ]

  all_men = []
  all_women = []

  for d in dates:
    day_data = fetch_api_day(d)
    men_fixtures = parse_matches(day_data, 'Men')
    women_fixtures = parse_matches(day_data, 'Women')

    if men_fixtures or women_fixtures:
      print(f' -> {d}: Found {len(men_fixtures)} Men, {len(women_fixtures)} Women')

    all_men.extend(men_fixtures)
    all_women.extend(women_fixtures)

  if all_men:
    with open('data/basketball_men_tracker.json', 'w', encoding='utf-8') as f:
      json.dump(
          {'sport': 'Basketball (Men)', 'matches': all_men},
          f,
          indent=2,
          ensure_ascii=False,
      )
    print(f'Total Men matches saved: {len(all_men)}')

  if all_women:
    with open('data/basketball_women_tracker.json', 'w', encoding='utf-8') as f:
      json.dump(
          {'sport': 'Basketball (Women)', 'matches': all_women},
          f,
          indent=2,
          ensure_ascii=False,
      )
    print(f'Total Women matches saved: {len(all_women)}')


if __name__ == '__main__':
  main()
    
