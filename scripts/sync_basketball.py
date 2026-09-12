import json
import zlib
import requests

# Standard headers to emulate a regular browser visit and satisfy server checks
HEADERS = {
    'User-Agent': (
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ),
    'Referer': 'https://results.asiangames2026.org/',
    'Accept': '*/*',
}

# The Bornan backend compresses payload data with zlib, but serves it as
# 'text/plain; charset=utf-8'. This table maps character codepoints back
# to original single-byte values (0-255) to repair the broken binary stream.
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
  """Fetches, reconstructs, and decompresses daily match data from the API."""
  url = f'https://back.results.asiangames2026.org/s/AG2026/en/BKB/schedule/daily/{date_str}'
  resp = requests.get(url, headers=HEADERS)

  # Skip days where no schedule exists or an error occurs
  if resp.status_code != 200:
    return []

  try:
    # Reconstruct original binary bytes from response string
    raw = bytes([CHARMAP.get(c, ord(c) & 0xFF) for c in resp.text])

    # Decompress using zlib with fallback window bits (standard, raw, or gzip)
    decompressed = None
    for wbits in [zlib.MAX_WBITS, -zlib.MAX_WBITS, 16 + zlib.MAX_WBITS]:
      try:
        decompressed = zlib.decompress(raw, wbits)
        break
      except Exception:
        continue

    if not decompressed:
      return []

    # Parse decompressed UTF-8 bytes into Python dictionaries
    return json.loads(decompressed.decode('utf-8'))
  except Exception as e:
    print(f'Error processing {date_str}: {e}')
    return []


def parse_matches(raw_matches, gender='Men'):
  """Extracts and normalizes match records to fit the frontend tracker schema."""
  output = []

  for m in raw_matches:
    # Filter by gender category ('Men' or 'Women')
    if m.get('EventDesc') != gender:
      continue

    # Map status flags to match UI badges: Live, Finished, or Upcoming
    status_raw = m.get('Status', '').upper()
    if status_raw in ['OFFICIAL', 'UNCONFIRMED']:
      status = 'Finished'
    elif status_raw in ['LIVE', 'IN_PROGRESS', 'RUNNING']:
      status = 'Live'
    else:
      status = 'Upcoming'

    # Extract competitor data blocks
    home = m.get('Home', {})
    away = m.get('Away', {})

    # Prefer short country names (NameS), fallback to full name
    home_name = home.get('NameS') or home.get('Name') or 'TBD'
    away_name = away.get('NameS') or away.get('Name') or 'TBD'

    # Format score string
    home_score = home.get('Result', '-')
    away_score = away.get('Result', '-')
    score_str = (
        f'{home_score} - {away_score}' if home_score and away_score else 'vs'
    )

    # Determine winner for highlighting in the UI
    winner = ''
    if home.get('Winner'):
      winner = home_name
    elif away.get('Winner'):
      winner = away_name

    # Round/Unit description hierarchy
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
  # Tournament dates to query
  dates = [
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
      '2026-09-14',
  ]

  all_men = []
  all_women = []

  # Query each tournament day and aggregate fixtures
  for d in dates:
    day_data = fetch_api_day(d)
    all_men.extend(parse_matches(day_data, 'Men'))
    all_women.extend(parse_matches(day_data, 'Women'))

  # Write men's match tracker JSON if records exist
  if all_men:
    with open(
        'data/basketball_men_tracker.json', 'w', encoding='utf-8'
    ) as f:
      json.dump(
          {'sport': 'Basketball (Men)', 'matches': all_men},
          f,
          indent=2,
          ensure_ascii=False,
      )
    print(f'Wrote {len(all_men)} Men fixtures.')

  # Write women's match tracker JSON if records exist
  if all_women:
    with open(
        'data/basketball_women_tracker.json', 'w', encoding='utf-8'
    ) as f:
      json.dump(
          {'sport': 'Basketball (Women)', 'matches': all_women},
          f,
          indent=2,
          ensure_ascii=False,
      )
    print(f'Wrote {len(all_women)} Women fixtures.')


if __name__ == '__main__':
  main()
