// ==========================================================================
// Asian Games 2026: Core Presentation & Shared Dashboard Shell
// ==========================================================================

// --- Mobile Error Boundary ---
window.onerror = function(msg, url, line) {
  const el = document.getElementById('content-cards');
  if (el) {
    el.innerHTML = `
      <div style="background:rgba(239,68,68,0.1); border:1px solid #ef4444; padding:1rem; border-radius:8px; margin-bottom:1rem;">
        <strong style="color:#ef4444;">⚠️ JavaScript Runtime Error:</strong><br>${msg}<br>
        <small style="color:var(--text-muted, #94a3b8);">Line ${line} in ${url ? url.split('/').pop() : 'script'}</small>
      </div>
    `;
  }
  return false;
};

// --- Data Extraction Utility ---
function extractList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.matches)) return raw.matches;
    if (Array.isArray(raw.events)) return raw.events;
    if (Array.isArray(raw.teams)) return raw.teams;
    if (Array.isArray(raw.predictions)) return raw.predictions;
    if (Array.isArray(raw.data)) return raw.data;
  }
  return [];
}

window.SPORT_ENGINES = window.SPORT_ENGINES || {};

// --- Universal Flag Registry & Resolver ---
const FLAG_REGISTRY = {
  // East Asia
  'china': '🇨🇳', 'chn': '🇨🇳', "people's republic of china": '🇨🇳',
  'japan': '🇯🇵', 'jpn': '🇯🇵',
  'korea': '🇰🇷', 'south korea': '🇰🇷', 'kor': '🇰🇷', 'republic of korea': '🇰🇷',
  'north korea': '🇰🇵', 'prk': '🇰🇵', 'dpr korea': '🇰🇵',
  'chinese taipei': '🇹🇼', 'taiwan': '🇹🇼', 'tpe': '🇹🇼',
  'hong kong': '🇭🇰', 'hong kong, china': '🇭🇰', 'hkg': '🇭🇰',
  'macau': '🇲🇴', 'macao': '🇲🇴', 'mac': '🇲🇴',
  'mongolia': '🇲🇳', 'mgl': '🇲🇳',

  // Southeast Asia
  'philippines': '🇵🇭', 'phi': '🇵🇭', 'gilas': '🇵🇭',
  'indonesia': '🇮🇩', 'ina': '🇮🇩', 'idn': '🇮🇩',
  'thailand': '🇹🇭', 'tha': '🇹🇭',
  'malaysia': '🇲🇾', 'mas': '🇲🇾',
  'singapore': '🇸🇬', 'sgp': '🇸🇬',
  'vietnam': '🇻🇳', 'vie': '🇻🇳',
  'myanmar': '🇲🇲', 'mmr': '🇲🇲', 'burma': '🇲🇲',
  'cambodia': '🇰🇭', 'cam': '🇰🇭', 'khm': '🇰🇭',
  'laos': '🇱🇦', 'lao': '🇱🇦',
  'brunei': '🇧🇳', 'bru': '🇧🇳',
  'timor-leste': '🇹🇱', 'timor leste': '🇹🇱', 'tls': '🇹🇱',

  // South Asia
  'india': '🇮🇳', 'ind': '🇮🇳',
  'bangladesh': '🇧🇩', 'ban': '🇧🇩', 'bgd': '🇧🇩',
  'pakistan': '🇵🇰', 'pak': '🇵🇰',
  'sri lanka': '🇱🇰', 'sri': '🇱🇰', 'lka': '🇱🇰',
  'nepal': '🇳🇵', 'nep': '🇳🇵', 'npl': '🇳🇵',
  'maldives': '🇲🇻', 'mdv': '🇲🇻',
  'bhutan': '🇧🇹', 'bhu': '🇧🇹', 'btn': '🇧🇹',
  'afghanistan': '🇦🇫', 'afg': '🇦🇫',

  // Central Asia
  'kazakhstan': '🇰🇿', 'kaz': '🇰🇿',
  'uzbekistan': '🇺🇿', 'uzb': '🇺🇿',
  'kyrgyzstan': '🇰🇬', 'kgz': '🇰🇬', 'kyrgyz republic': '🇰🇬',
  'tajikistan': '🇹🇯', 'tjk': '🇹🇯',
  'turkmenistan': '🇹🇲', 'tkm': '🇹🇲',

  // West Asia / Middle East
  'iran': '🇮🇷', 'ir iran': '🇮🇷', 'iri': '🇮🇷',
  'jordan': '🇯🇴', 'jor': '🇯🇴',
  'lebanon': '🇱🇧', 'lbn': '🇱🇧',
  'saudi arabia': '🇸🇦', 'ksa': '🇸🇦',
  'qatar': '🇶🇦', 'qat': '🇶🇦',
  'bahrain': '🇧🇭', 'brn': '🇧🇭',
  'kuwait': '🇰🇼', 'kuw': '🇰🇼',
  'united arab emirates': '🇦🇪', 'uae': '🇦🇪', 'ua emirates': '🇦🇪', 'are': '🇦🇪',
  'syria': '🇸🇾', 'syr': '🇸🇾',
  'iraq': '🇮🇶', 'irq': '🇮🇶',
  'palestine': '🇵🇸', 'ple': '🇵🇸',
  'oman': '🇴🇲', 'oma': '🇴🇲', 'omn': '🇴🇲',
  'yemen': '🇾🇪', 'yem': '🇾🇪',
  'guam': '🇬🇺', 'gum': '🇬🇺'
};

const SORTED_FLAG_KEYS = Object.keys(FLAG_REGISTRY).sort((a, b) => b.length - a.length);

function getFlagEmoji(teamName) {
  const activeSport = window.currentSport || (typeof currentSport !== 'undefined' ? currentSport : 'basketball');
  const defaultIcon = (window.SPORT_ENGINES && window.SPORT_ENGINES[activeSport]?.icon) || '🏅';

  if (typeof window.getFlag === 'function') return window.getFlag(teamName);
  if (!teamName || typeof teamName !== 'string') return defaultIcon;

  const norm = teamName.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!norm) return defaultIcon;

  if (FLAG_REGISTRY[norm]) return FLAG_REGISTRY[norm];

  for (const key of SORTED_FLAG_KEYS) {
    if (key.length <= 3) {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      if (regex.test(norm)) return FLAG_REGISTRY[key];
    } else {
      if (norm.includes(key)) return FLAG_REGISTRY[key];
    }
  }
  return defaultIcon;
}

// --- Team & Stage Normalizers ---
function cleanTeamName(name) {
  if (!name || typeof name !== 'string') return '';
  let n = name.toLowerCase()
    .replace(/\(host\)/gi, '')
    .replace(/people's republic of/gi, '')
    .replace(/republic of/gi, '')
    .replace(/dpr/gi, '')
    .replace(/^ir\s+/gi, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (n.includes('korea') && !n.includes('north')) return 'korea';
  if (n.includes('iran')) return 'iran';
  if (n.includes('taipei') || n.includes('taiwan')) return 'chinese taipei';
  if (n.includes('hong kong')) return 'hong kong';
  if (n.includes('china')) return 'china';
  if (n.includes('japan')) return 'japan';
  if (n.includes('philippine')) return 'philippines';
  return n;
}

// --- Athlete Name Normalization & Matching Utilities ---
function normalizeAthleteName(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase()
    .replace(/kahramaonova/gi, 'kahramonova')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getAthleteTokens(str) {
  const norm = normalizeAthleteName(str);
  if (!norm) return [];
  return norm.split(' ').filter(Boolean);
}

function areAthletesMatching(name1, name2) {
  if (!name1 || !name2) return false;
  const norm1 = normalizeAthleteName(name1);
  const norm2 = normalizeAthleteName(name2);
  if (norm1 === norm2) return true;

  const strip1 = norm1.replace(/\s+/g, '');
  const strip2 = norm2.replace(/\s+/g, '');
  if (strip1 === strip2) return true;

  const tokens1 = getAthleteTokens(name1);
  const tokens2 = getAthleteTokens(name2);

  if (tokens1.length > 0 && tokens2.length > 0) {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    if (tokens1.length === tokens2.length && tokens1.every(t => set2.has(t))) return true;

    const join1 = tokens1.join('');
    const join2 = tokens2.join('');
    if (join1 === join2 || join1.includes(join2) || join2.includes(join1)) return true;

    let matchCount = 0;
    for (const t of tokens1) {
      if (set2.has(t)) matchCount++;
    }
    if (matchCount >= Math.min(tokens1.length, tokens2.length)) return true;
  }

  return false;
}

function formatAthleteDisplayName(name) {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (/[a-z]/.test(trimmed) && /[A-Z]/.test(trimmed)) {
    return trimmed;
  }
  return trimmed.split(/\s+/).map(part => {
    return part.split('-').map(sub => {
      if (!sub) return '';
      return sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
    }).join('-');
  }).join(' ');
}

function formatContenderDisplay(c) {
  if (!c) return 'TBD';
  if (c.athlete) {
    const rawTeam = c.name || c.team || '';
    const team = rawTeam ? formatTeamDisplayName(rawTeam.replace(/\(host\)/gi, '').trim()) : '';
    return team ? `${c.athlete} (${team})` : c.athlete;
  }
  return c.name || c.team || 'TBD';
}

function formatTeamDisplayName(name) {
  const str = String(name || 'TBD').trim();
  const lower = str.toLowerCase();

  if (lower === 'korea' || lower === 'republic of korea' || lower === 'kor') return 'South Korea';
  if (lower.includes('dpr') || lower === 'north korea' || lower === 'prk') return 'North Korea';
  if (lower === 'ir iran' || lower === 'iran, islamic republic of') return 'Iran';
  if (lower.includes('hong kong')) return 'Hong Kong';

  return str;
}

function formatStageName(stageStr) {
  if (!stageStr || typeof stageStr !== 'string') return 'Group Stage';
  let s = stageStr.replace(/^(men|women)\s+/i, '').trim();

  s = s.replace(/^gr(?:\.|\s+)\s*([a-z0-9]+)/i, 'Group $1');

  if (/1\/4|quarter|qf/i.test(s)) {
    const g = s.match(/g\s*(\d+)/i);
    return g ? `Quarterfinals • Game ${g[1]}` : 'Quarterfinals';
  }

  if (/1\/2|semi|sf/i.test(s)) {
    const g = s.match(/g\s*(\d+)/i);
    return g ? `Semifinals • Game ${g[1]}` : 'Semifinals';
  }

  if (/\b(?:bm|f\s*bm)\b|bronze|3rd/i.test(s)) return 'Bronze Medal Match';
  if (/\b(?:gm|f\s*gm)\b|gold|final/i.test(s)) return 'Gold Medal Match';

  const activeSport = window.currentSport || (typeof currentSport !== 'undefined' ? currentSport : '');
  if (activeSport === 'volleyball') {
    // Women Playoffs
    if (/\bmatch\s*(19|20|21|22)\b/i.test(s)) return `Quarterfinals • ${s.match(/\bmatch\s*\d+\b/i)[0]}`;
    if (/\bmatch\s*(27|28)\b/i.test(s)) return `Semifinals • ${s.match(/\bmatch\s*\d+\b/i)[0]}`;
    if (/\bmatch\s*(25|26)\b/i.test(s)) return `5th-8th Semifinals • ${s.match(/\bmatch\s*\d+\b/i)[0]}`;
    if (/\bmatch\s*(29|30)\b/i.test(s)) return `9th-12th Semifinals • ${s.match(/\bmatch\s*\d+\b/i)[0]}`;
    if (/\bmatch\s*(23|24)\b/i.test(s)) return `Classification • ${s.match(/\bmatch\s*\d+\b/i)[0]}`;
    // Men Playoffs
    if (/\bmatch\s*(37|38)\b/i.test(s)) return `5th-8th Semifinals • ${s.match(/\bmatch\s*\d+\b/i)[0]}`;
    if (/\bmatch\s*(35|36)\b/i.test(s)) return `9th-12th Semifinals • ${s.match(/\bmatch\s*\d+\b/i)[0]}`;
    if (/\bmatch\s*(33|34)\b/i.test(s)) return `13th-16th Semifinals • ${s.match(/\bmatch\s*\d+\b/i)[0]}`;
    if (/\bmatch\s*(39|40)\b/i.test(s)) return `Semifinals • ${s.match(/\bmatch\s*\d+\b/i)[0]}`;
    // Placement Finals
    const placeMatch = s.match(/\b(\d+(?:st|nd|rd|th)(?:-\d+(?:st|nd|rd|th))?\s+place)\b/i);
    if (placeMatch) return `${placeMatch[1]} Match`;
  }

  const grp = s.match(/(?:group|pool)\s+([a-z0-9]+)/i);
  const g = s.match(/(?:game|g)\s*(\d+)/i);

  if (grp && grp[1].toLowerCase() !== 'stage') {
    const groupLetter = grp[1].toUpperCase();
    return g ? `Group ${groupLetter} • Game ${g[1]}` : `Group ${groupLetter}`;
  }

  return s;
}

// --- Universal Actual Competition Finish & Stage Resolver ---
function resolveActualFinish(contender, ev, matches, trackerRaw) {
  if (!contender) return null;
  const ath = contender.athlete || contender.player || '';
  const rawTeam = contender.name || contender.team || contender.country || (typeof contender === 'string' ? contender : '');
  const cln = cleanTeamName(rawTeam);

  // Fallbacks if matches or trackerRaw were omitted
  if ((!matches || matches.length === 0) && typeof window !== 'undefined' && window.appData) {
    matches = (ev && ev.gender === 'women') ? window.appData.womenMatches : window.appData.menMatches;
  }
  if (!trackerRaw && typeof window !== 'undefined' && window.appData) {
    trackerRaw = (ev && ev.gender === 'women') ? window.appData.womenTrackerRaw : window.appData.menTrackerRaw;
  }

  // 1. Check top 3 actual podium in event if available
  if (ev && ev.actual) {
    if (ev.actual.gold) {
      const matchAth = ath && ev.actual.gold.athlete && areAthletesMatching(ath, ev.actual.gold.athlete);
      const matchTeam = !ath && cleanTeamName(ev.actual.gold.name) === cln;
      if (matchAth || matchTeam) {
        return {
          text: '🥇 Gold Medalist (Champion)',
          shortText: '🥇 Gold',
          rank: 1,
          medal: 'gold',
          badgeColor: '#facc15',
          badgeBg: 'rgba(234,179,8,0.12)',
          badgeBorder: 'rgba(234,179,8,0.3)'
        };
      }
    }
    if (ev.actual.silver) {
      const matchAth = ath && ev.actual.silver.athlete && areAthletesMatching(ath, ev.actual.silver.athlete);
      const matchTeam = !ath && cleanTeamName(ev.actual.silver.name) === cln;
      if (matchAth || matchTeam) {
        return {
          text: '🥈 Silver Medalist (Runner-Up)',
          shortText: '🥈 Silver',
          rank: 2,
          medal: 'silver',
          badgeColor: '#cbd5e1',
          badgeBg: 'rgba(203,213,225,0.12)',
          badgeBorder: 'rgba(203,213,225,0.3)'
        };
      }
    }
    const bronzeList = (Array.isArray(ev.actual.bronzes) && ev.actual.bronzes.length > 0)
      ? ev.actual.bronzes
      : (ev.actual.bronze ? [ev.actual.bronze] : []);

    for (const b of bronzeList) {
      const matchAth = ath && b.athlete && areAthletesMatching(ath, b.athlete);
      const matchTeam = !ath && cleanTeamName(b.name) === cln;
      if (matchAth || matchTeam) {
        return {
          text: '🥉 Bronze Medalist (3rd Place)',
          shortText: '🥉 Bronze',
          rank: 3,
          medal: 'bronze',
          badgeColor: '#f59e0b',
          badgeBg: 'rgba(245,158,11,0.12)',
          badgeBorder: 'rgba(245,158,11,0.3)'
        };
      }
    }
  }

  // 2. Individual Athlete with trackerRaw.final_ranks (e.g. Modern Pentathlon)
  if (ath && trackerRaw && Array.isArray(trackerRaw.final_ranks)) {
    for (const r of trackerRaw.final_ranks) {
      if (r && r.name && areAthletesMatching(ath, r.name)) {
        const rank = Number(r.rank);
        const pts = r.total_pts ? `${r.total_pts} pts` : '';
        if (rank === 1) {
          return { text: pts ? `🥇 Gold (Rank 1, ${pts})` : '🥇 Gold Medalist (Rank 1)', shortText: '🥇 Gold', rank: 1, medal: 'gold', badgeColor: '#facc15', badgeBg: 'rgba(234,179,8,0.12)', badgeBorder: 'rgba(234,179,8,0.3)' };
        } else if (rank === 2) {
          return { text: pts ? `🥈 Silver (Rank 2, ${pts})` : '🥈 Silver Medalist (Rank 2)', shortText: '🥈 Silver', rank: 2, medal: 'silver', badgeColor: '#cbd5e1', badgeBg: 'rgba(203,213,225,0.12)', badgeBorder: 'rgba(203,213,225,0.3)' };
        } else if (rank === 3) {
          return { text: pts ? `🥉 Bronze (Rank 3, ${pts})` : '🥉 Bronze Medalist (Rank 3)', shortText: '🥉 Bronze', rank: 3, medal: 'bronze', badgeColor: '#f59e0b', badgeBg: 'rgba(245,158,11,0.12)', badgeBorder: 'rgba(245,158,11,0.3)' };
        } else {
          return { text: pts ? `Rank ${rank} (${pts})` : `Rank ${rank}`, shortText: `Rank ${rank}`, rank: rank, medal: null, badgeColor: rank <= 10 ? '#38bdf8' : '#94a3b8', badgeBg: 'rgba(255,255,255,0.04)', badgeBorder: 'rgba(255,255,255,0.08)' };
        }
      }
    }
  }

  // 3. Team Events in Modern Pentathlon (Men's Team, Women's Team 4th place)
  if (ev && (ev.id === 'mpn_men_team' || ev.id === 'mpn_women_team')) {
    if (cln.includes('japan') && ev.id === 'mpn_men_team') {
      return { text: '4th Place', shortText: '4th Place', rank: 4, badgeColor: '#94a3b8', badgeBg: 'rgba(255,255,255,0.04)', badgeBorder: 'rgba(255,255,255,0.08)' };
    }
    if (cln.includes('kazakhstan') && ev.id === 'mpn_women_team') {
      return { text: '4th Place', shortText: '4th Place', rank: 4, badgeColor: '#94a3b8', badgeBg: 'rgba(255,255,255,0.04)', badgeBorder: 'rgba(255,255,255,0.08)' };
    }
  }

  // 4. Team & Match Sports (Basketball, Football, Volleyball, Cricket, Teqball)
  const matchList = Array.isArray(matches) ? matches : (Array.isArray(trackerRaw?.matches) ? trackerRaw.matches : []);
  if (cln && matchList.length > 0) {
    const evTarget = ev && (ev.name || ev.event) ? cleanTeamName(ev.name || ev.event) : '';
    const teamMatches = matchList.filter(m => {
      if (evTarget && m.event && cleanTeamName(m.event) !== evTarget) return false;
      const p1 = cleanTeamName(m.player1 || m.team1 || '');
      const p2 = cleanTeamName(m.player2 || m.team2 || '');
      if (ath) {
        const a1 = m.athlete1 || '';
        const a2 = m.athlete2 || '';
        if (a1 && typeof areAthletesMatching === 'function' && areAthletesMatching(ath, a1)) return true;
        if (a2 && typeof areAthletesMatching === 'function' && areAthletesMatching(ath, a2)) return true;
      }
      return p1 === cln || p2 === cln;
    });

    if (teamMatches.length > 0) {
      // Find Gold Match
      const hasGoldMatch = teamMatches.find(m => {
        const r = (m.round || m.stage || '').toLowerCase();
        return r.includes('f gm') || r.includes('gold') || (r.includes('final') && !r.includes('semi') && !r.includes('1/2') && !r.includes('quarter') && !r.includes('1/4') && !r.includes('3rd') && !r.includes('bm') && !r.includes('repechage'));
      });
      // Find Bronze Match
      const hasBronzeMatch = teamMatches.find(m => {
        const r = (m.round || m.stage || '').toLowerCase();
        return r.includes('f bm') || r.includes('bronze') || r.includes('3rd');
      });
      // Semifinals
      const hasSemi = teamMatches.find(m => {
        const r = (m.round || m.stage || '').toLowerCase();
        return r.includes('1/2') || r.includes('semi');
      });
      // Repechages
      const hasRepechage = teamMatches.find(m => {
        const r = (m.round || m.stage || '').toLowerCase();
        return r.includes('repechage');
      });
      // Quarterfinals
      const hasQuarter = teamMatches.find(m => {
        const r = (m.round || m.stage || '').toLowerCase();
        return r.includes('1/4') || r.includes('quarter');
      });
      // Round of 16
      const hasRound16 = teamMatches.find(m => {
        const r = (m.round || m.stage || '').toLowerCase();
        return r.includes('1/8') || r.includes('r16');
      });

      if (hasGoldMatch) {
        const isFin = (hasGoldMatch.status || hasGoldMatch.state || '').toLowerCase().includes('finish') || (hasGoldMatch.status || hasGoldMatch.state || '').toLowerCase().includes('official');
        if (isFin) {
          const w = cleanTeamName(hasGoldMatch.winner || '');
          if (w === cln) {
            return { text: '🥇 Gold Medalist (Champion)', shortText: '🥇 Gold', rank: 1, medal: 'gold', badgeColor: '#facc15', badgeBg: 'rgba(234,179,8,0.12)', badgeBorder: 'rgba(234,179,8,0.3)' };
          } else {
            return { text: '🥈 Silver Medalist (Runner-Up)', shortText: '🥈 Silver', rank: 2, medal: 'silver', badgeColor: '#cbd5e1', badgeBg: 'rgba(203,213,225,0.12)', badgeBorder: 'rgba(203,213,225,0.3)' };
          }
        }
      }

      if (hasBronzeMatch) {
        const isFin = (hasBronzeMatch.status || hasBronzeMatch.state || '').toLowerCase().includes('finish') || (hasBronzeMatch.status || hasBronzeMatch.state || '').toLowerCase().includes('official');
        if (isFin) {
          const w = cleanTeamName(hasBronzeMatch.winner || '');
          if (w === cln) {
            return { text: '🥉 Bronze Medalist (3rd Place)', shortText: '🥉 Bronze', rank: 3, medal: 'bronze', badgeColor: '#f59e0b', badgeBg: 'rgba(245,158,11,0.12)', badgeBorder: 'rgba(245,158,11,0.3)' };
          } else {
            return { text: '4th Place (Bronze Match)', shortText: '4th Place', rank: 4, badgeColor: '#a855f7', badgeBg: 'rgba(168,85,247,0.1)', badgeBorder: 'rgba(168,85,247,0.25)' };
          }
        }
      }

      if (hasSemi) {
        const isFin = (hasSemi.status || hasSemi.state || '').toLowerCase().includes('finish') || (hasSemi.status || hasSemi.state || '').toLowerCase().includes('official');
        // If semi is finished and no bronze match exists for this event (e.g. Women's Doubles), the loser is bronze medalist
        const eventHasBronze = matchList.some(m => {
          if (evTarget && m.event && cleanTeamName(m.event) !== evTarget) return false;
          return /bronze/i.test(m.round || m.stage || '');
        });
        if (isFin && !eventHasBronze && cleanTeamName(hasSemi.winner || '') !== cln) {
          return { text: '🥉 Bronze Medalist (Semifinalist)', shortText: '🥉 Bronze', rank: 3, medal: 'bronze', badgeColor: '#f59e0b', badgeBg: 'rgba(245,158,11,0.12)', badgeBorder: 'rgba(245,158,11,0.3)' };
        }
        return { text: 'Semifinals', shortText: 'Semifinals', rank: null, stage: 'semi', badgeColor: '#a855f7', badgeBg: 'rgba(168,85,247,0.1)', badgeBorder: 'rgba(168,85,247,0.25)' };
      }
      if (hasRepechage) {
        return { text: 'Repechages', shortText: 'Repechages', rank: null, stage: 'repechage', badgeColor: '#fb7185', badgeBg: 'rgba(244,63,94,0.1)', badgeBorder: 'rgba(244,63,94,0.25)' };
      }
      if (hasQuarter) {
        return { text: 'Quarterfinals', shortText: 'Quarterfinals', rank: null, stage: 'quarter', badgeColor: '#94a3b8', badgeBg: 'rgba(255,255,255,0.04)', badgeBorder: 'rgba(255,255,255,0.08)' };
      }
      if (hasRound16) {
        return { text: 'Round of 16', shortText: 'Round of 16', rank: null, stage: 'r16', badgeColor: '#64748b', badgeBg: 'rgba(255,255,255,0.03)', badgeBorder: 'rgba(255,255,255,0.06)' };
      }
      return { text: 'Group Stage', shortText: 'Group Stage', rank: null, stage: 'group', badgeColor: '#64748b', badgeBg: 'rgba(255,255,255,0.03)', badgeBorder: 'rgba(255,255,255,0.06)' };
    }
  }

  return null;
}

function parseStatNumber(val) {
  if (val == null) return 0;
  if (typeof val === 'object') {
    val = val.pct || val.prob || val.value || val.val || val.rate || 0;
  }
  let hadPercent = false;
  if (typeof val === 'string') {
    if (val.includes('%')) hadPercent = true;
    val = val.replace('%', '').trim();
  }
  let num = parseFloat(val);
  if (isNaN(num)) return 0;
  if (!hadPercent && num > 0 && num <= 1) {
    num = num * 100;
  }
  return Math.round(num);
}

// Global probability/statistic attribute reader
function getProb(obj, keys) {
  if (!obj) return 0;
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return obj[k];
  }
  return 0;
}

function parseScoreValue(val) {
  if (val == null || val === '' || val === '-') return NaN;
  if (typeof val === 'number') return val;
  const str = String(val).trim();
  const m = str.match(/^(\d+)/);
  if (m) return parseInt(m[1], 10);
  const num = parseFloat(str);
  return isNaN(num) ? NaN : num;
}

// --- Timezone State & Formatter ---
let currentTimezone = localStorage.getItem('app_tz') || 'IST';

function setTimezone(tz) {
  currentTimezone = tz;
  localStorage.setItem('app_tz', tz);
  const container = document.getElementById('content-cards');
  if (container) {
    const matches = currentGender === 'men' ? appData.menMatches : appData.womenMatches;
    renderMatchesView(container, matches);
  }
}

function formatMatchDateTime(dateStr, timeStr) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n) => String(n).padStart(2, '0');

  if (!dateStr && !timeStr) return '';

  if (!timeStr) {
    const parts = dateStr.split('-').map(Number);
    if (parts.length >= 3) {
      return `${months[parts[1] - 1]} ${parts[2]}`;
    }
    return dateStr;
  }

  const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return `${dateStr ? dateStr + ' ' : ''}${timeStr}`;

  let hour = parseInt(timeMatch[1], 10);
  let minute = parseInt(timeMatch[2], 10);

  if (!dateStr) {
    if (currentTimezone === 'IST') {
      minute -= 30;
      if (minute < 0) { minute += 60; hour -= 1; }
      hour -= 3;
      if (hour < 0) hour += 24;
    }
    return `${pad(hour)}:${pad(minute)} ${currentTimezone}`;
  }

  const dateParts = dateStr.split('-').map(Number);
  if (dateParts.length < 3) {
    return `${dateStr} ${timeStr}`;
  }

  let year = dateParts[0];
  let month = dateParts[1] - 1;
  let day = dateParts[2];

  if (currentTimezone === 'IST') {
    minute -= 30;
    if (minute < 0) {
      minute += 60;
      hour -= 1;
    }
    hour -= 3;
    if (hour < 0) {
      hour += 24;
      const prevDate = new Date(year, month, day - 1);
      year = prevDate.getFullYear();
      month = prevDate.getMonth();
      day = prevDate.getDate();
    }
  }

  return `${months[month]} ${day}, ${pad(hour)}:${pad(minute)} ${currentTimezone}`;
}

// --- Universal Match Ingestion ---
function parseMatchData(m) {
  if (!m) return { t1: 'TBD', t2: 'TBD', s1: '-', s2: '-', status: '', time: '', date: '', stage: '', isFinished: false, winner: '' };

  let t1 = m.player1 || m.player_1 || m.team1 || m.team_1 || m.teamA || m.team_a || m.home || m.home_team || '';
  if (!t1 && Array.isArray(m.teams) && m.teams.length > 0) t1 = m.teams[0];
  if (typeof t1 === 'object' && t1 !== null) t1 = t1.name || t1.team || 'TBD';
  t1 = formatTeamDisplayName(t1);

  let t2 = m.player2 || m.player_2 || m.team2 || m.team_2 || m.teamB || m.team_b || m.away || m.away_team || '';
  if (!t2 && Array.isArray(m.teams) && m.teams.length > 1) t2 = m.teams[1];
  if (typeof t2 === 'object' && t2 !== null) t2 = t2.name || t2.team || 'TBD';
  t2 = formatTeamDisplayName(t2);

  let s1 = m.score1 != null ? m.score1 : (m.score_a != null ? m.score_a : (m.home_score != null ? m.home_score : null));
  let s2 = m.score2 != null ? m.score2 : (m.score_b != null ? m.score_b : (m.away_score != null ? m.away_score : null));

  const rawScore = m.score || m.scores || m.result;
  if ((s1 == null || s2 == null) && typeof rawScore === 'string' && rawScore.includes('-')) {
    const parts = rawScore.split('-').map(s => s.trim());
    s1 = parts[0];
    s2 = parts[1];
  }

  s1 = s1 != null && s1 !== '' ? String(s1) : '-';
  s2 = s2 != null && s2 !== '' ? String(s2) : '-';

  const status = String(m.status || m.state || '').trim();
  const lowerStatus = status.toLowerCase();
  const isFinished = lowerStatus.includes('final') || lowerStatus.includes('finished') || (s1 !== '-' && s2 !== '-' && !lowerStatus.includes('live'));

  let winner = '';
  if (m.winner) {
    winner = formatTeamDisplayName(m.winner);
  } else {
    const num1 = parseScoreValue(s1);
    const num2 = parseScoreValue(s2);
    if (!isNaN(num1) && !isNaN(num2)) {
      if (num1 > num2) winner = t1;
      else if (num2 > num1) winner = t2;
    }
  }

  return {
    t1,
    t2,
    s1,
    s2,
    status,
    time: m.time || '',
    date: m.date || '',
    stage: formatStageName(m.round || m.stage || m.group || 'Group Stage'),
    winner,
    isFinished
  };
}

// --- Protected Native Basketball Engine ---
const BASKETBALL_ENGINE = {
  icon: '🏀',
  renderStandingsTable(matches) {
    const parsedMatches = matches.map(m => parseMatchData(m));
    const groupMatches = parsedMatches.filter(m => /group|pool/i.test(m.stage));
    const allGroupFinished = groupMatches.length > 0 && (
      groupMatches.every(m => m.isFinished) ||
      parsedMatches.some(m => /(?:quarter|semi|final|gold|bronze|1\/4|1\/2)/i.test(m.stage) && (m.isFinished || (m.t1 && m.t1 !== 'TBD')))
    );
    const groups = {};

    parsedMatches.forEach(m => {
      const grpMatch = m.stage.match(/Group\s+[A-Za-z0-9]+/i) || m.stage.match(/Pool\s+[A-Za-z0-9]+/i);
      const grpName = grpMatch ? grpMatch[0] : null;

      if (!grpName) return;
      if (!groups[grpName]) groups[grpName] = {};

      if (m.t1 !== 'TBD' && m.t2 !== 'TBD') {
        [m.t1, m.t2].forEach(team => {
          if (!groups[grpName][team]) {
            groups[grpName][team] = { name: team, gp: 0, w: 0, l: 0, pts: 0, pf: 0, pa: 0, diff: 0 };
          }
        });

        if (m.isFinished && m.s1 !== '-' && m.s2 !== '-') {
          const s1 = Number(m.s1);
          const s2 = Number(m.s2);

          groups[grpName][m.t1].gp += 1;
          groups[grpName][m.t2].gp += 1;
          groups[grpName][m.t1].pf += s1;
          groups[grpName][m.t1].pa += s2;
          groups[grpName][m.t2].pf += s2;
          groups[grpName][m.t2].pa += s1;

          const t1Won = m.winner ? cleanTeamName(m.winner) === cleanTeamName(m.t1) : s1 > s2;

          if (t1Won) {
            groups[grpName][m.t1].w += 1;
            groups[grpName][m.t1].pts += 2;
            groups[grpName][m.t2].l += 1;
            groups[grpName][m.t2].pts += 1;
          } else {
            groups[grpName][m.t2].w += 1;
            groups[grpName][m.t2].pts += 2;
            groups[grpName][m.t1].l += 1;
            groups[grpName][m.t1].pts += 1;
          }

          groups[grpName][m.t1].diff = groups[grpName][m.t1].pf - groups[grpName][m.t1].pa;
          groups[grpName][m.t2].diff = groups[grpName][m.t2].pf - groups[grpName][m.t2].pa;
        }
      }
    });

    const groupKeys = Object.keys(groups).sort();
    if (groupKeys.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No group stage data available.</div>`;
    }

    const statusMap = {};
    if (allGroupFinished) {
      const thirdPlaceTeams = [];

      groupKeys.forEach(grpKey => {
        const sorted = Object.values(groups[grpKey]).sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.pf - a.pf);

        sorted.forEach((team, idx) => {
          if (idx < 2) {
            statusMap[team.name] = 'Q';
            statusMap[cleanTeamName(team.name)] = 'Q';
          } else if (idx === 2) {
            thirdPlaceTeams.push(team);
          } else {
            statusMap[team.name] = 'E';
            statusMap[cleanTeamName(team.name)] = 'E';
          }
        });
      });

      thirdPlaceTeams.sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.pf - a.pf);
      thirdPlaceTeams.forEach((team, idx) => {
        const status = idx < 2 ? 'q' : 'E';
        statusMap[team.name] = status;
        statusMap[cleanTeamName(team.name)] = status;
      });
    }

    const badgeStyles = {
      'Q': 'background:rgba(34,197,94,0.18); color:#4ade80; border:1px solid rgba(74,222,128,0.35);',
      'q': 'background:rgba(56,189,248,0.18); color:#38bdf8; border:1px solid rgba(56,189,248,0.35);',
      'E': 'background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(248,113,113,0.25);'
    };

    return groupKeys.map(grpKey => {
      const teams = Object.values(groups[grpKey]).sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.pf - a.pf);

      return `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; margin-bottom:1.5rem; overflow-x:auto;">
          <div style="padding:0.75rem 1rem; font-weight:700; font-size:0.9rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
            <span>${grpKey}</span>
            ${allGroupFinished
              ? `<span style="font-size:0.75rem;"><strong style="color:#4ade80;">Q</strong> Qualified &nbsp;•&nbsp; <strong style="color:#38bdf8;">q</strong> Wildcard &nbsp;•&nbsp; <strong style="color:#f87171;">E</strong> Eliminated</span>`
              : `<span style="font-size:0.75rem; color:#94a3b8; font-weight:400;">Top 2 + best 2 3rd advance</span>`
            }
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:center;">
            <thead>
              <tr style="color:#94a3b8; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);">
                <th style="padding:0.6rem 0.5rem; text-align:left;"># Team</th>
                <th style="padding:0.6rem 0.3rem;">GP</th>
                <th style="padding:0.6rem 0.3rem;">W</th>
                <th style="padding:0.6rem 0.3rem;">L</th>
                <th style="padding:0.6rem 0.3rem;">DIFF</th>
                <th style="padding:0.6rem 0.5rem; font-weight:700; color:#f8fafc;">PTS</th>
              </tr>
            </thead>
            <tbody>
              ${teams.map((t, idx) => {
                const badge = statusMap[t.name] || statusMap[cleanTeamName(t.name)];
                const badgeHtml = badge
                  ? `<span style="display:inline-block; font-size:0.65rem; font-weight:800; padding:1px 5px; border-radius:4px; margin-left:6px; vertical-align:middle; ${badgeStyles[badge]}">${badge}</span>`
                  : '';
                const isEliminated = badge === 'E';

                return `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.03); opacity:${isEliminated ? '0.75' : '1'}; background:${idx < 2 ? 'rgba(59,130,246,0.04)' : 'transparent'};">
                    <td style="padding:0.6rem 0.5rem; text-align:left; font-weight:${idx < 2 ? '700' : '400'};">
                      <span style="display:inline-block; width:16px; color:${idx < 2 ? '#38bdf8' : 'inherit'};">${idx + 1}</span>
                      ${getFlagEmoji(t.name)} ${t.name} ${badgeHtml}
                    </td>
                    <td style="padding:0.6rem 0.3rem;">${t.gp}</td>
                    <td style="padding:0.6rem 0.3rem; color:#4ade80;">${t.w}</td>
                    <td style="padding:0.6rem 0.3rem; color:#f87171;">${t.l}</td>
                    <td style="padding:0.6rem 0.3rem; font-family:monospace; color:${t.diff > 0 ? '+' + t.diff : t.diff};">${t.diff > 0 ? '+' + t.diff : t.diff}</td>
                    <td style="padding:0.6rem 0.5rem; font-weight:700; color:#38bdf8;">${t.pts}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  },
  renderKnockoutBracket(matches) {
    const parsed = matches.map(m => parseMatchData(m));
    const getStage = (m) => (m.stage + ' ' + m.status).toLowerCase();

    const qfMatches = parsed.filter(m => getStage(m).includes('quarter') || getStage(m).includes('qf'));
    const sfMatches = parsed.filter(m => getStage(m).includes('semi') || getStage(m).includes('sf'));
    const finalMatch = parsed.find(m => getStage(m).includes('gold') || /\b(?:gm|f\s*gm)\b/i.test(m.stage) || (getStage(m).includes('final') && !getStage(m).includes('semi') && !getStage(m).includes('quarter') && !getStage(m).includes('bronze')));
    const bronzeMatch = parsed.find(m => getStage(m).includes('bronze') || /\b(?:bm|f\s*bm)\b/i.test(m.stage) || getStage(m).includes('3rd'));

    const getGame = (list, num) => list.find(m => new RegExp(`game\\s*${num}`, 'i').test(m.stage)) || list[num - 1];

    const defaultQF = [
      { title: 'QF 1', t1: '1st Group A', t2: '2nd Group B' },
      { title: 'QF 2', t1: '1st Group C', t2: 'Wildcard 2' },
      { title: 'QF 3', t1: '2nd Group C', t2: '2nd Group A' },
      { title: 'QF 4', t1: '1st Group B', t2: 'Wildcard 1' }
    ];

    const renderSlot = (title, match, fallback, medalType = null) => {
      const t1 = (match && match.t1 && match.t1 !== 'TBD') ? match.t1 : fallback.t1;
      const t2 = (match && match.t2 && match.t2 !== 'TBD') ? match.t2 : fallback.t2;
      const s1 = match ? match.s1 : '-';
      const s2 = match ? match.s2 : '-';
      const isFinished = match ? match.isFinished : false;
      const t1Win = match && match.winner ? cleanTeamName(match.winner) === cleanTeamName(t1) : (isFinished && Number(s1) > Number(s2));
      const t2Win = match && match.winner ? cleanTeamName(match.winner) === cleanTeamName(t2) : (isFinished && Number(s2) > Number(s1));
      const displayDateTime = match ? (formatMatchDateTime(match.date, match.time) || match.status || 'Scheduled') : 'Scheduled';

      return `
        <div class="bracket-match-card">
          <div class="bracket-match-header">
            <span>${title}</span>
            ${medalType ? `<span class="bracket-medal-badge medal-${medalType}">${medalType.toUpperCase()}</span>` : ''}
            <span>${displayDateTime}</span>
          </div>
          <div class="bracket-team-row ${t1Win ? 'winner' : ''}">
            <div class="bracket-team-info"><span>${getFlagEmoji(t1)}</span> <span>${t1}</span></div>
            <span class="bracket-score">${s1}</span>
          </div>
          <div class="bracket-team-row ${t2Win ? 'winner' : ''}">
            <div class="bracket-team-info"><span>${getFlagEmoji(t2)}</span> <span>${t2}</span></div>
            <span class="bracket-score">${s2}</span>
          </div>
        </div>
      `;
    };

    return `
      <div class="bracket-wrapper">
        <div class="bracket-container">
          <div class="bracket-round">
            <div class="bracket-round-header">Quarterfinals</div>
            ${[0, 1, 2, 3].map(i => renderSlot(`QF ${i + 1}`, getGame(qfMatches, i + 1), defaultQF[i])).join('')}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Semifinals</div>
            ${renderSlot('SF 1', getGame(sfMatches, 1), { t1: 'Winner QF 1', t2: 'Winner QF 2' })}
            ${renderSlot('SF 2', getGame(sfMatches, 2), { t1: 'Winner QF 3', t2: 'Winner QF 4' })}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Medal Matches</div>
            ${renderSlot('Gold Medal', finalMatch, { t1: 'Winner SF 1', t2: 'Winner SF 2' }, 'gold')}
            ${renderSlot('Bronze Medal', bronzeMatch, { t1: 'Loser SF 1', t2: 'Loser SF 2' }, 'bronze')}
          </div>
        </div>
      </div>
    `;
  }
};

window.SPORT_ENGINES['basketball'] = BASKETBALL_ENGINE;

// --- Sub-View State Handlers & Global State Resolver ---
function getGlobalAppData() {
  if (typeof window !== 'undefined' && window.appData && (window.appData.menPredictions?.length || window.appData.menMatches?.length || window.appData.womenMatches?.length)) {
    return window.appData;
  }
  if (typeof appData !== 'undefined' && (appData.menPredictions?.length || appData.menMatches?.length || appData.womenMatches?.length)) {
    return appData;
  }
  if (typeof window !== 'undefined' && window.appData) return window.appData;
  if (typeof appData !== 'undefined') return appData;
  return {};
}

let activeMatchesSubView = 'schedule';
let activePredictionsSubView = 'table'; // 'table' | 'event_<id>' | 'odds'
let activeMedalTableMode = 'comparison'; // 'comparison' | 'actual' | 'projected'

if (typeof window !== 'undefined') {
  window.activeMatchesSubView = activeMatchesSubView;
  window.activePredictionsSubView = activePredictionsSubView;
  window.activeMedalTableMode = activeMedalTableMode;
}

function setMatchesSubView(subView) {
  activeMatchesSubView = subView;
  if (typeof window !== 'undefined') window.activeMatchesSubView = subView;
  const container = document.getElementById('content-cards');
  if (container) {
    const data = getGlobalAppData();
    const g = window.currentGender || 'men';
    const matches = g === 'men' ? (data.menMatches || []) : (data.womenMatches || []);
    renderMatchesView(container, matches);
  }
}
window.setMatchesSubView = setMatchesSubView;

function setPredictionsSubView(subView) {
  activePredictionsSubView = subView;
  if (typeof window !== 'undefined') window.activePredictionsSubView = subView;
  const container = document.getElementById('content-cards');
  if (container) {
    const data = getGlobalAppData();
    renderPredictionsView(
      container,
      data.menPredictions,
      data.womenPredictions,
      window.currentGender || 'men',
      data.menMatches,
      data.womenMatches
    );
  }
}
window.setPredictionsSubView = setPredictionsSubView;

function setMedalTableMode(mode) {
  activeMedalTableMode = mode;
  const container = document.getElementById('content-cards');
  if (container) {
    const data = getGlobalAppData();
    renderPredictionsView(
      container,
      data.menPredictions,
      data.womenPredictions,
      window.currentGender || 'men',
      data.menMatches,
      data.womenMatches
    );
  }
}
window.setMedalTableMode = setMedalTableMode;

function setDivisionOddsGender(gender) {
  currentGender = gender;
  window.currentGender = gender;
  const btnMen = document.getElementById('btn-men');
  const btnWomen = document.getElementById('btn-women');
  if (btnMen) btnMen.classList.toggle('active', gender === 'men');
  if (btnWomen) btnWomen.classList.toggle('active', gender === 'women');

  const container = document.getElementById('content-cards');
  if (container) {
    const data = getGlobalAppData();
    renderPredictionsView(
      container,
      data.menPredictions,
      data.womenPredictions,
      gender,
      data.menMatches,
      data.womenMatches
    );
  }
}
window.setDivisionOddsGender = setDivisionOddsGender;

// Global toggle for Detailed Predictions view across all sports
window.toggleDetailedPredictions = function() {
  const tableWrap = document.getElementById('detailed-predictions-table-wrap');
  const arrow = document.getElementById('detailed-pred-arrow');
  if (!tableWrap) return;
  const isHidden = tableWrap.style.display === 'none';
  tableWrap.style.display = isHidden ? 'block' : 'none';
  if (arrow) {
    arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  }
};

// --- Matches Router ---
function renderMatchesView(container, matches) {
  const rawSport = window.currentSport || (typeof currentSport !== 'undefined' ? currentSport : 'basketball');
  const activeSport = String(rawSport).trim().toLowerCase();

  const engine = activeSport === 'basketball'
    ? BASKETBALL_ENGINE
    : (window.SPORT_ENGINES && window.SPORT_ENGINES[activeSport]);

  const hasCustomMatches = engine && typeof engine.renderMatches === 'function';
  const hasStandings = engine && typeof engine.renderStandingsTable === 'function';
  const hasBracket = engine && typeof engine.renderKnockoutBracket === 'function' && engine.hasBracket !== false;
  const hasLeaderboard = engine && typeof engine.renderLeaderboard === 'function';

  const scheduleBtn = `
    <button style="flex:1; padding:7px 4px; font-size:0.75rem; font-weight:600; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${activeMatchesSubView === 'schedule' ? '#2563eb' : 'transparent'}; color:${activeMatchesSubView === 'schedule' ? '#fff' : '#94a3b8'};" onclick="setMatchesSubView('schedule')">📋 Schedule</button>
  `;
  const standingsBtn = `
    <button style="flex:1; padding:7px 4px; font-size:0.75rem; font-weight:600; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${activeMatchesSubView === 'standings' ? '#2563eb' : 'transparent'}; color:${activeMatchesSubView === 'standings' ? '#fff' : '#94a3b8'};" onclick="setMatchesSubView('standings')">📊 Standings</button>
  `;
  const bracketBtn = hasBracket ? `
    <button style="flex:1; padding:7px 4px; font-size:0.75rem; font-weight:600; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${activeMatchesSubView === 'bracket' ? '#2563eb' : 'transparent'}; color:${activeMatchesSubView === 'bracket' ? '#fff' : '#94a3b8'};" onclick="setMatchesSubView('bracket')">🌳 Bracket</button>
  ` : '';
  const leaderboardBtn = hasLeaderboard ? `
    <button style="flex:1; padding:7px 4px; font-size:0.75rem; font-weight:600; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${activeMatchesSubView === 'leaderboard' ? '#2563eb' : 'transparent'}; color:${activeMatchesSubView === 'leaderboard' ? '#fff' : '#94a3b8'};" onclick="setMatchesSubView('leaderboard')">🏆 Results</button>
  ` : '';

  const pillsHeader = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem; gap:8px;">
      <div style="display:flex; background:rgba(15,23,42,0.6); padding:3px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); gap:3px; flex:1;">
        ${scheduleBtn}
        ${standingsBtn}
        ${bracketBtn}
        ${leaderboardBtn}
      </div>
      <div style="display:flex; background:rgba(15,23,42,0.6); padding:3px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); gap:2px;">
        <button style="padding:6px 9px; font-size:0.75rem; font-weight:700; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${currentTimezone === 'IST' ? '#38bdf8' : 'transparent'}; color:${currentTimezone === 'IST' ? '#0f172a' : '#94a3b8'};" onclick="setTimezone('IST')">IST</button>
        <button style="padding:6px 9px; font-size:0.75rem; font-weight:700; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${currentTimezone === 'JST' ? '#38bdf8' : 'transparent'}; color:${currentTimezone === 'JST' ? '#0f172a' : '#94a3b8'};" onclick="setTimezone('JST')">JST</button>
      </div>
    </div>
  `;

  if (!matches || matches.length === 0) {
    container.innerHTML = `${pillsHeader}<div style="text-align:center; padding:3rem 1rem; color:var(--text-muted, #94a3b8);">No matches scheduled or recorded yet for this category.</div>`;
    return;
  }

  let contentHtml = '';
  if (activeMatchesSubView === 'schedule') {
    if (hasCustomMatches) {
      contentHtml = engine.renderMatches(matches);
    } else {
      contentHtml = renderScheduleAndHero(matches);
    }
  } else if (activeMatchesSubView === 'standings') {
    if (hasStandings) {
      contentHtml = engine.renderStandingsTable(matches);
    } else {
      contentHtml = `<div style="padding:2rem; text-align:center; color:#94a3b8;">Standings unavailable.</div>`;
    }
  } else if (activeMatchesSubView === 'bracket') {
    if (hasBracket) {
      contentHtml = engine.renderKnockoutBracket(matches);
    } else {
      contentHtml = `<div style="padding:2rem; text-align:center; color:#94a3b8;">Bracket unavailable.</div>`;
    }
  } else if (activeMatchesSubView === 'leaderboard' && hasLeaderboard) {
    contentHtml = engine.renderLeaderboard(matches);
  }

  container.innerHTML = `${pillsHeader}${contentHtml}`;
}

// --- Schedule & Hero Card ---
function renderScheduleAndHero(matches) {
  const parsed = matches.map(m => parseMatchData(m));

  const liveMatch = parsed.find(m => m.status.toLowerCase().includes('live'));
  const upcomingMatches = parsed.filter(m => !m.isFinished && !m.status.toLowerCase().includes('live'));
  const upcomingWithTeams = upcomingMatches.filter(m => m.t1 !== 'TBD' && m.t2 !== 'TBD');
  const isTournamentComplete = parsed.length > 0 && !liveMatch && upcomingMatches.length === 0;

  let heroTarget = null;
  if (liveMatch) {
    heroTarget = liveMatch;
  } else if (upcomingWithTeams.length > 0) {
    heroTarget = upcomingWithTeams[0];
  } else if (upcomingMatches.length > 0) {
    heroTarget = upcomingMatches[0];
  } else if (isTournamentComplete) {
    const isGoldFinal = (m) => {
      const s = String(m.stage || '').toLowerCase();
      const r = String(m.round || '').toLowerCase();
      if (/quarter|semi|1\/4|1\/2|3rd|bronze|\bbm\b/i.test(s) || /quarter|semi|1\/4|1\/2|3rd|bronze|\bbm\b/i.test(r)) {
        return false;
      }
      return /gold|\bgm\b/i.test(s) || /gold|\bgm\b/i.test(r) || /\bfinal\b/i.test(s) || /\bfinal\b/i.test(r);
    };
    heroTarget = parsed.slice().reverse().find(isGoldFinal) || parsed[parsed.length - 1];
  }

  let heroHtml = '';
  if (heroTarget) {
    const isLive = heroTarget.status.toLowerCase().includes('live');
    const displayDateTime = formatMatchDateTime(heroTarget.date, heroTarget.time) || heroTarget.status || 'Scheduled';
    const activeSport = (window.currentSport || (typeof currentSport !== 'undefined' ? currentSport : 'basketball')).toLowerCase();

    let upcomingLabel = '⏳ NEXT MATCH';
    if (activeSport === 'football') upcomingLabel = '⏳ NEXT KICK-OFF';
    else if (activeSport === 'basketball') upcomingLabel = '⏳ NEXT TIP-OFF';

    let badgeText = upcomingLabel;
    let badgeBg = 'rgba(59,130,246,0.2)';
    let badgeColor = '#60a5fa';

    if (isLive) {
      badgeText = '🔴 LIVE NOW';
      badgeBg = 'rgba(239,68,68,0.2)';
      badgeColor = '#ef4444';
    } else if (isTournamentComplete) {
      badgeText = '🏆 TOURNAMENT COMPLETED';
      badgeBg = 'rgba(250,204,21,0.2)';
      badgeColor = '#facc15';
    }

    const t1Won = heroTarget.isFinished && heroTarget.winner
      ? cleanTeamName(heroTarget.winner) === cleanTeamName(heroTarget.t1)
      : (heroTarget.isFinished && Number(heroTarget.s1) > Number(heroTarget.s2));
    const t2Won = heroTarget.isFinished && heroTarget.winner
      ? cleanTeamName(heroTarget.winner) === cleanTeamName(heroTarget.t2)
      : (heroTarget.isFinished && Number(heroTarget.s2) > Number(heroTarget.s1));

    const subtitle = isTournamentComplete && heroTarget.winner
      ? `Gold Medal Champion: <strong>${heroTarget.winner}</strong> 🥇`
      : `${displayDateTime} • ${heroTarget.stage}`;

    heroHtml = `
      <div style="background:linear-gradient(135deg, rgba(30,58,138,0.4), rgba(15,23,42,0.8)); border:1px solid rgba(59,130,246,0.3); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem; text-align:center;">
        <div style="display:inline-block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; padding:0.2rem 0.65rem; border-radius:9999px; background:${badgeBg}; color:${badgeColor}; margin-bottom:0.75rem;">
          ${badgeText}
        </div>
        <div style="display:flex; justify-content:space-around; align-items:center; margin:0.75rem 0;">
          <div style="flex:1;">
            <div style="font-size:1.8rem;">${getFlagEmoji(heroTarget.t1)}</div>
            <div style="font-weight:700; font-size:1rem; margin-top:0.25rem; color:${t1Won ? '#facc15' : 'inherit'};">
              ${heroTarget.t1}${t1Won ? ' 🥇' : ''}
            </div>
          </div>
          <div style="font-family:monospace; font-size:1.6rem; font-weight:800; min-width:80px;">
            ${heroTarget.s1 !== '-' ? `${heroTarget.s1} : ${heroTarget.s2}` : 'VS'}
          </div>
          <div style="flex:1;">
            <div style="font-size:1.8rem;">${getFlagEmoji(heroTarget.t2)}</div>
            <div style="font-weight:700; font-size:1rem; margin-top:0.25rem; color:${t2Won ? '#facc15' : 'inherit'};">
              ${heroTarget.t2}${t2Won ? ' 🥇' : ''}
            </div>
          </div>
        </div>
        <div style="font-size:0.8rem; color:#94a3b8;">
          ${subtitle}
        </div>
      </div>
    `;
  }

  const cardsHtml = parsed.map(m => {
    const t1Win = m.winner ? cleanTeamName(m.winner) === cleanTeamName(m.t1) : (m.isFinished && Number(m.s1) > Number(m.s2));
    const t2Win = m.winner ? cleanTeamName(m.winner) === cleanTeamName(m.t2) : (m.isFinished && Number(m.s2) > Number(m.s1));
    const displayDateTime = formatMatchDateTime(m.date, m.time) || m.status || '';

    return `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.85rem 1rem; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center;">
        <div style="flex:1;">
          <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.4rem;">
            ${m.stage} • ${displayDateTime}
          </div>
          <div style="display:flex; flex-direction:column; gap:0.25rem;">
            <div style="display:flex; align-items:center; gap:0.5rem; font-weight:${t1Win ? '700' : '500'}; color:${t1Win ? '#38bdf8' : 'inherit'};">
              <span>${getFlagEmoji(m.t1)}</span> <span>${m.t1}</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem; font-weight:${t2Win ? '700' : '500'}; color:${t2Win ? '#38bdf8' : 'inherit'};">
              <span>${getFlagEmoji(m.t2)}</span> <span>${m.t2}</span>
            </div>
          </div>
        </div>
        <div style="font-family:monospace; font-size:1.1rem; font-weight:700; text-align:right; min-width:48px;">
          <div>${m.s1}</div>
          <div>${m.s2}</div>
        </div>
      </div>
    `;
  }).join('');

  return heroHtml + cardsHtml;
}

// --- Universal Sport Medal Analytics & Comparison Engine ---
function extractSportMedalAnalytics(activeSport, menMatches, womenMatches, menPreds, womenPreds) {
  const isPentathlon = activeSport.includes('pentathlon');

  // Allow sport engines to provide their own medal analytics hook
  const engine = window.SPORT_ENGINES && window.SPORT_ENGINES[activeSport];
  if (!isPentathlon && engine && typeof engine.extractMedalAnalytics === 'function') {
    return engine.extractMedalAnalytics(menMatches, womenMatches, menPreds, womenPreds);
  }

  const getProb = (obj, keys) => {
    if (!obj) return 0;
    for (const k of keys) {
      if (obj[k] != null && obj[k] !== '') return obj[k];
    }
    return 0;
  };

  const projectPodium = (list) => {
    if (!Array.isArray(list) || list.length === 0) return [];
    const sorted = [...list].sort((a, b) => {
      const gA = parseStatNumber(getProb(a, ['gold', 'gold_prob', 'gold_pct', 'p_gold']));
      const gB = parseStatNumber(getProb(b, ['gold', 'gold_prob', 'gold_pct', 'p_gold']));
      if (gB !== gA) return gB - gA;
      const sA = parseStatNumber(getProb(a, ['silver', 'silver_prob', 'silver_pct', 'p_silver']));
      const sB = parseStatNumber(getProb(b, ['silver', 'silver_prob', 'silver_pct', 'p_silver']));
      if (sB !== sA) return sB - sA;
      return parseStatNumber(getProb(b, ['bronze', 'bronze_prob', 'bronze_pct', 'p_bronze'])) -
             parseStatNumber(getProb(a, ['bronze', 'bronze_prob', 'bronze_pct', 'p_bronze']));
    });

    const res = [];
    if (sorted[0]) res.push({ medal: 'gold', item: sorted[0] });
    if (sorted[1]) res.push({ medal: 'silver', item: sorted[1] });
    if (sorted[2]) res.push({ medal: 'bronze', item: sorted[2] });
    return res;
  };

  const formatContenderObj = (item, isIndiv) => {
    if (!item) return null;
    const rawName = item.team || item.country || item.name || '';
    const cleaned = cleanTeamName(rawName);
    const displayName = formatTeamDisplayName(rawName.replace(/\(host\)/gi, '').trim());
    const flag = getFlagEmoji(displayName);
    const isHost = rawName.toLowerCase().includes('host');
    const rawAthlete = item.athlete || item.player || '';
    const athlete = isIndiv && rawAthlete ? formatAthleteDisplayName(rawAthlete) : '';
    const goldProb = item.gold || item.gold_prob || '';
    const silverProb = item.silver || item.silver_prob || '';
    const bronzeProb = item.bronze || item.bronze_prob || '';
    return {
      raw: rawName,
      cleaned,
      name: displayName,
      flag,
      isHost,
      athlete,
      goldProb,
      silverProb,
      bronzeProb
    };
  };

  const getParticipatingAthletesList = (gender, rawEvents) => {
    const participants = new Set();
    const trackerRaw = gender === 'men' ? window.appData?.menTrackerRaw : window.appData?.womenTrackerRaw;
    if (trackerRaw && Array.isArray(trackerRaw.final_ranks)) {
      trackerRaw.final_ranks.forEach(r => {
        if (r && r.name) participants.add(r.name);
      });
    }

    const eventList = Array.isArray(rawEvents) ? rawEvents : (Array.isArray(trackerRaw?.matches) ? trackerRaw.matches : []);
    eventList.forEach(m => {
      if (m && Array.isArray(m.competitors)) {
        m.competitors.forEach(c => {
          if (c && c.name) {
            const cln = cleanTeamName(c.name);
            const isCountry = Object.keys(FLAG_REGISTRY).includes(cln) || cln === 'korea';
            if (!isCountry) {
              participants.add(c.name);
            }
          }
        });
      }
    });

    return participants;
  };

  const getPentathlonEventRankings = (gender, type) => {
    if (type === 'team') {
      const evRankings = (window.appData && window.appData.predictionEvents ? window.appData.predictionEvents.find(e => e.gender === gender && e.type === 'team')?.rankings : null) || 
        (menPreds && menPreds.events ? menPreds.events.find(e => e.gender === gender && e.type === 'team')?.rankings : null) || 
        (womenPreds && womenPreds.events ? womenPreds.events.find(e => e.gender === gender && e.type === 'team')?.rankings : null);
      if (evRankings && evRankings.length > 0) return evRankings;
      if (gender === 'men') {
        return [
          { rank: 1, team: "Republic of Korea", gold: "68.0%", silver: "24.5%", bronze: "6.5%", podium: "99.0%" },
          { rank: 2, team: "China", gold: "26.0%", silver: "52.0%", bronze: "18.0%", podium: "96.0%" },
          { rank: 3, team: "Japan (Host)", gold: "6.0%", silver: "23.5%", bronze: "65.5%", podium: "95.0%" },
          { rank: 4, team: "Kazakhstan", gold: "0.0%", silver: "0.0%", bronze: "10.0%", podium: "10.0%" }
        ];
      } else {
        return [
          { rank: 1, team: "China", gold: "51.0%", silver: "44.0%", bronze: "4.5%", podium: "99.5%" },
          { rank: 2, team: "Republic of Korea", gold: "46.0%", silver: "49.0%", bronze: "4.5%", podium: "99.5%" },
          { rank: 3, team: "Japan (Host)", gold: "3.0%", silver: "7.0%", bronze: "85.0%", podium: "95.0%" },
          { rank: 4, team: "Kazakhstan", gold: "0.0%", silver: "0.0%", bronze: "6.0%", podium: "6.0%" }
        ];
      }
    }

    // Individual rankings: Drawn from pre-tournament historical simulation
    let candidatePool = [];
    const predList = gender === 'men' ? (window.appData?.menPredictions || menPreds) : (window.appData?.womenPredictions || womenPreds);
    if (Array.isArray(predList) && predList.length > 0 && (predList[0].athlete || predList[0].player)) {
      candidatePool = predList;
    }
    if (candidatePool.length === 0) {
      const evRankings = (window.appData && window.appData.predictionEvents ? window.appData.predictionEvents.find(e => e.gender === gender && e.type === 'individual')?.rankings : null) || 
        (menPreds && menPreds.events ? menPreds.events.find(e => e.gender === gender && e.type === 'individual')?.rankings : null) || 
        (womenPreds && womenPreds.events ? womenPreds.events.find(e => e.gender === gender && e.type === 'individual')?.rankings : null);
      if (Array.isArray(evRankings) && evRankings.length > 0) {
        candidatePool = evRankings;
      }
    }
    if (candidatePool.length === 0) {
      if (gender === 'men') {
        candidatePool = [
          { rank: 1, athlete: "Jun Woong-tae", team: "Republic of Korea", gold: "45.2%", silver: "31.4%", bronze: "18.1%", podium: "94.7%" },
          { rank: 2, athlete: "Taishu Sato", team: "Japan (Host)", gold: "35.8%", silver: "29.2%", bronze: "21.6%", podium: "86.6%" },
          { rank: 3, athlete: "Luo Shuai", team: "China", gold: "14.1%", silver: "25.8%", bronze: "33.4%", podium: "73.3%" },
          { rank: 4, athlete: "Temirlan Abdraimov", team: "Kazakhstan", gold: "3.4%", silver: "8.2%", bronze: "15.1%", podium: "26.7%" },
          { rank: 5, athlete: "Dmitriy Tretyakov", team: "Uzbekistan", gold: "1.0%", silver: "3.1%", bronze: "6.5%", podium: "10.6%" },
          { rank: 6, athlete: "Samuel German", team: "Philippines", gold: "0.3%", silver: "1.4%", bronze: "3.1%", podium: "4.8%" }
        ];
      } else {
        candidatePool = [
          { rank: 1, athlete: "Seong Seung-min", team: "Republic of Korea", gold: "50.8%", silver: "29.4%", bronze: "14.5%", podium: "94.7%" },
          { rank: 2, athlete: "Zhang Mingyu", team: "China", gold: "37.6%", silver: "39.1%", bronze: "20.4%", podium: "97.1%" },
          { rank: 3, athlete: "Misaki Uchida", team: "Japan (Host)", gold: "7.5%", silver: "18.2%", bronze: "36.8%", podium: "62.5%" },
          { rank: 4, athlete: "Yelena Potapenko", team: "Kazakhstan", gold: "2.6%", silver: "7.5%", bronze: "15.8%", podium: "25.9%" },
          { rank: 5, athlete: "Mehriniso Kahramonova", team: "Uzbekistan", gold: "1.0%", silver: "3.6%", bronze: "6.9%", podium: "11.5%" },
          { rank: 6, athlete: "Princess Honey Arbilon", team: "Philippines", gold: "0.3%", silver: "1.3%", bronze: "3.2%", podium: "4.8%" }
        ];
      }
    }

    // STRICT HISTORICAL FILTER: Must only include confirmed participating athletes in the 2026 tournament
    const rawEvents = gender === 'men' ? menMatches : womenMatches;
    const participants = getParticipatingAthletesList(gender, rawEvents);

    if (participants && participants.size > 0) {
      const filtered = candidatePool.filter(c => {
        const ath = c.athlete || c.player || c.name;
        if (!ath) return true;
        for (const p of participants) {
          if (areAthletesMatching(ath, p)) return true;
        }
        return false;
      });
      if (filtered.length > 0) return filtered;
    }

    return candidatePool;
  };

  const medalEvents = [];

  if (isPentathlon) {
    const pentathlonDefinitions = [
      {
        id: 'mpn_men_indiv',
        name: "Men's Individual",
        shortName: "Men's Indiv",
        icon: "🏃",
        gender: 'men',
        type: 'individual',
        rankings: getPentathlonEventRankings('men', 'individual')
      },
      {
        id: 'mpn_men_team',
        name: "Men's Team",
        shortName: "Men's Team",
        icon: "👥",
        gender: 'men',
        type: 'team',
        rankings: getPentathlonEventRankings('men', 'team')
      },
      {
        id: 'mpn_women_indiv',
        name: "Women's Individual",
        shortName: "Women's Indiv",
        icon: "🏃",
        gender: 'women',
        type: 'individual',
        rankings: getPentathlonEventRankings('women', 'individual')
      },
      {
        id: 'mpn_women_team',
        name: "Women's Team",
        shortName: "Women's Team",
        icon: "👥",
        gender: 'women',
        type: 'team',
        rankings: getPentathlonEventRankings('women', 'team')
      }
    ];

    pentathlonDefinitions.forEach(def => {
      const isIndiv = def.type === 'individual';
      const pPodium = projectPodium(def.rankings);
      const projGold = formatContenderObj(pPodium.find(p => p.medal === 'gold')?.item, isIndiv);
      const projSilver = formatContenderObj(pPodium.find(p => p.medal === 'silver')?.item, isIndiv);
      const projBronze = formatContenderObj(pPodium.find(p => p.medal === 'bronze')?.item, isIndiv);

      const rawEvents = def.gender === 'men' ? menMatches : womenMatches;
      const medalEventObj = (rawEvents || []).find(e => {
        if (!e.is_medal) return false;
        if (isIndiv) {
          return (e.id && e.id.includes('INDIVID')) || (e.competitors && e.competitors.length > 7);
        } else {
          return (e.id && e.id.includes('TEAM')) || (e.competitors && e.competitors.length <= 7);
        }
      }) || (rawEvents || []).find(e => e.is_medal);

      let actualGold = null;
      let actualSilver = null;
      let actualBronze = null;
      let eventStatus = 'Upcoming';
      let matchInfo = '';

      if (medalEventObj && medalEventObj.competitors) {
        eventStatus = medalEventObj.status || 'Official';
        const comps = [...medalEventObj.competitors].sort((a, b) => (Number(a.rank) || 999) - (Number(b.rank) || 999));

        const resolveCountry = (c) => {
          if (!c) return '';
          let cntry = (c.country || '').trim();
          if (!cntry && c.name && c.name.toLowerCase().includes('yano')) return 'Japan';
          if (!cntry && c.name && c.name.toLowerCase().includes('kahramonova')) return 'Uzbekistan';
          if (!cntry && typeof resolveAthleteCountry === 'function') {
            cntry = resolveAthleteCountry(c.name, c.org || '');
          }
          if (cntry.length === 3) {
            const ioc = cntry.toUpperCase();
            if (ioc === 'CHN') return 'China';
            if (ioc === 'KOR') return 'South Korea';
            if (ioc === 'JPN') return 'Japan';
            if (ioc === 'KAZ') return 'Kazakhstan';
            if (ioc === 'UZB') return 'Uzbekistan';
            if (ioc === 'PHI') return 'Philippines';
            if (ioc === 'THA') return 'Thailand';
            if (ioc === 'INA') return 'Indonesia';
          }
          return cntry;
        };

        if (isIndiv) {
          const c1 = comps[0];
          const c2 = comps[1];
          const c3 = comps[2];
          if (c1 && Number(c1.rank) === 1) {
            actualGold = formatContenderObj({ name: resolveCountry(c1), athlete: formatAthleteDisplayName(c1.name) }, true);
          }
          if (c2 && Number(c2.rank) === 2) {
            actualSilver = formatContenderObj({ name: resolveCountry(c2), athlete: formatAthleteDisplayName(c2.name) }, true);
          }
          if (c3 && Number(c3.rank) === 3) {
            actualBronze = formatContenderObj({ name: resolveCountry(c3), athlete: formatAthleteDisplayName(c3.name) }, true);
          }
          matchInfo = `Laser Run / Final: ${medalEventObj.date || ''} at ${medalEventObj.venue || 'Anjo Sports Park'} (${eventStatus})`;
        } else {
          // Team medal event
          const c1 = comps[0];
          const c2 = comps[1];
          const c3 = comps[2];
          if (c1 && Number(c1.rank) === 1) actualGold = formatContenderObj({ name: resolveCountry(c1) }, false);
          if (c2 && Number(c2.rank) === 2) actualSilver = formatContenderObj({ name: resolveCountry(c2) }, false);
          if (c3 && Number(c3.rank) === 3) actualBronze = formatContenderObj({ name: resolveCountry(c3) }, false);

          if (!actualGold) {
            // Team Placings fallback from Individual Results if direct team competitors not populated
            const teamPlacings = {};
            comps.forEach(c => {
              const cName = resolveCountry(c);
              if (!cName) return;
              const cln = cleanTeamName(cName);
              if (!teamPlacings[cln]) teamPlacings[cln] = { name: cName, count: 0, ranks: [] };
              teamPlacings[cln].count += 1;
              teamPlacings[cln].ranks.push(Number(c.rank) || 50);
            });
            const teamList = Object.values(teamPlacings)
              .filter(t => t.count >= 2)
              .map(t => {
                const score = t.ranks.slice(0, 3).reduce((acc, r) => acc + r, 0);
                return { name: t.name, score };
              })
              .sort((a, b) => a.score - b.score);

            if (teamList[0]) actualGold = formatContenderObj({ name: teamList[0].name }, false);
            if (teamList[1]) actualSilver = formatContenderObj({ name: teamList[1].name }, false);
            if (teamList[2]) actualBronze = formatContenderObj({ name: teamList[2].name }, false);
          }
          matchInfo = `Team Final: ${medalEventObj.date || ''} at ${medalEventObj.venue || 'Anjo Sports Park'} (${eventStatus})`;
        }
      }

      medalEvents.push({
        id: def.id,
        name: def.name,
        shortName: def.shortName,
        icon: def.icon,
        gender: def.gender,
        type: def.type,
        status: eventStatus,
        matchInfo,
        goldScoreInfo: matchInfo,
        bronzeScoreInfo: matchInfo,
        rankings: def.rankings || [],
        projected: { gold: projGold, silver: projSilver, bronze: projBronze },
        actual: { gold: actualGold, silver: actualSilver, bronze: actualBronze }
      });
    });
  } else {
    // Team sports (Basketball, Football, Volleyball, Cricket)
    const sportIcon = (window.SPORT_ENGINES && window.SPORT_ENGINES[activeSport]?.icon) || '🏅';
    let menName = "Men's Tournament";
    let menShort = "Men's Team";
    let womenName = "Women's Tournament";
    let womenShort = "Women's Team";

    if (activeSport === 'football') {
      menName = "Men's Tournament (U-23)";
      menShort = "Men's U-23";
      womenName = "Women's Tournament (Senior)";
      womenShort = "Women's Senior";
    }

    const divisions = [
      { id: 'men_team', name: menName, shortName: menShort, icon: sportIcon, gender: 'men', matches: menMatches, preds: menPreds },
      { id: 'women_team', name: womenName, shortName: womenShort, icon: sportIcon, gender: 'women', matches: womenMatches, preds: womenPreds }
    ];

    divisions.forEach(div => {
      const pPodium = projectPodium(div.preds);
      const projGold = formatContenderObj(pPodium.find(p => p.medal === 'gold')?.item, false);
      const projSilver = formatContenderObj(pPodium.find(p => p.medal === 'silver')?.item, false);
      const projBronze = formatContenderObj(pPodium.find(p => p.medal === 'bronze')?.item, false);

      let goldMatch = null;
      let bronzeMatch = null;

      (div.matches || []).forEach(m => {
        const r = (m.round || m.stage || '').toLowerCase();
        if (
          r.includes('gold') ||
          r === 'men f gm' ||
          r === 'women f gm' ||
          (r.includes('final') && !r.includes('semi') && !r.includes('1/2') && !r.includes('quarter') && !r.includes('1/4') && !r.includes('3rd') && !r.includes('5th') && !r.includes('7th') && !r.includes('9th') && !r.includes('11th') && !r.includes('bm') && !r.includes('group') && !r.includes('preliminary'))
        ) {
          goldMatch = m;
        } else if (
          r.includes('bronze') ||
          r.includes('3rd') ||
          r === 'men f bm' ||
          r === 'women f bm'
        ) {
          bronzeMatch = m;
        }
      });

      let actualGold = null;
      let actualSilver = null;
      let actualBronze = null;
      let eventStatus = 'Upcoming';
      let matchInfo = '';
      let goldScoreInfo = '';
      let bronzeScoreInfo = '';

      if (goldMatch) {
        const gStat = (goldMatch.status || '').toLowerCase();
        const gState = (goldMatch.state || '').toLowerCase();
        const isFinished = gStat.includes('finish') || gStat.includes('official') || gState.includes('finish') || gState.includes('official');
        const isLive = gStat.includes('live') || gState.includes('run');

        const t1 = goldMatch.player1 || goldMatch.team1 || 'TBD';
        const t2 = goldMatch.player2 || goldMatch.team2 || 'TBD';
        const s = goldMatch.score || `${goldMatch.score1 || '-'} - ${goldMatch.score2 || '-'}`;

        if (isFinished) {
          eventStatus = 'Finished';
          let w = goldMatch.winner;
          if (!w) {
            const s1 = parseScoreValue(goldMatch.score1 || (goldMatch.score && goldMatch.score.split('-')[0]));
            const s2 = parseScoreValue(goldMatch.score2 || (goldMatch.score && goldMatch.score.split('-')[1]));
            if (s1 > s2) w = t1;
            else if (s2 > s1) w = t2;
          }
          if (w) {
            actualGold = formatContenderObj({ name: w }, false);
            const runnerUp = cleanTeamName(w) === cleanTeamName(t1) ? t2 : t1;
            actualSilver = formatContenderObj({ name: runnerUp }, false);
          }
          goldScoreInfo = `Gold Final: ${t1} ${s} ${t2} (Official)`;
          matchInfo = goldScoreInfo;
        } else if (isLive) {
          eventStatus = 'Live';
          goldScoreInfo = `Gold Final (LIVE): ${t1} ${s} ${t2}`;
          matchInfo = goldScoreInfo;
        } else {
          goldScoreInfo = `Gold Final: ${t1} vs ${t2} (${goldMatch.date || ''} ${goldMatch.time || ''})`;
          matchInfo = goldScoreInfo;
        }
      }

      if (bronzeMatch) {
        const bStat = (bronzeMatch.status || '').toLowerCase();
        const bState = (bronzeMatch.state || '').toLowerCase();
        const isFinished = bStat.includes('finish') || bStat.includes('official') || bState.includes('finish') || bState.includes('official');
        const isLive = bStat.includes('live') || bState.includes('run');

        const t1 = bronzeMatch.player1 || bronzeMatch.team1 || 'TBD';
        const t2 = bronzeMatch.player2 || bronzeMatch.team2 || 'TBD';
        const s = bronzeMatch.score || `${bronzeMatch.score1 || '-'} - ${bronzeMatch.score2 || '-'}`;

        if (isFinished) {
          let w = bronzeMatch.winner;
          if (!w) {
            const s1 = parseScoreValue(bronzeMatch.score1 || (bronzeMatch.score && bronzeMatch.score.split('-')[0]));
            const s2 = parseScoreValue(bronzeMatch.score2 || (bronzeMatch.score && bronzeMatch.score.split('-')[1]));
            if (s1 > s2) w = t1;
            else if (s2 > s1) w = t2;
          }
          if (w) {
            actualBronze = formatContenderObj({ name: w }, false);
          }
          bronzeScoreInfo = `Bronze Match: ${t1} ${s} ${t2} (Official)`;
          matchInfo += (matchInfo ? ' • ' : '') + bronzeScoreInfo;
        } else if (isLive) {
          if (eventStatus !== 'Live') eventStatus = 'Live';
          bronzeScoreInfo = `Bronze Match (LIVE): ${t1} ${s} ${t2}`;
          matchInfo += (matchInfo ? ' • ' : '') + bronzeScoreInfo;
        } else {
          bronzeScoreInfo = `Bronze Match: ${t1} vs ${t2} (${bronzeMatch.date || ''} ${bronzeMatch.time || ''})`;
        }
      }

      let eventRankings = [];
      if (Array.isArray(div.preds)) {
        eventRankings = div.preds;
      } else if (div.preds && Array.isArray(div.preds[div.gender])) {
        eventRankings = div.preds[div.gender];
      } else if (div.preds && Array.isArray(div.preds.rankings)) {
        eventRankings = div.preds.rankings;
      }

      medalEvents.push({
        id: div.id,
        name: div.name,
        shortName: div.shortName,
        icon: div.icon,
        gender: div.gender,
        type: 'team',
        status: eventStatus,
        matchInfo,
        goldScoreInfo,
        bronzeScoreInfo,
        goldMatch,
        bronzeMatch,
        rankings: eventRankings,
        projected: { gold: projGold, silver: projSilver, bronze: projBronze },
        actual: { gold: actualGold, silver: actualSilver, bronze: actualBronze }
      });
    });
  }

  // Standings Maps
  const actualTableMap = {};
  const projectedTableMap = {};

  const medalWeight = { gold: 1, silver: 2, bronze: 3 };

  const recordTableMedal = (tableMap, item, medalType, isIndiv) => {
    if (!item) return;
    const cln = item.cleaned;
    if (!cln) return;
    if (!tableMap[cln]) {
      tableMap[cln] = {
        name: item.name,
        flag: item.flag || getFlagEmoji(item.name),
        isHost: item.isHost,
        gold: 0, silver: 0, bronze: 0, total: 0,
        athletes: []
      };
    }
    tableMap[cln][medalType] += 1;
    tableMap[cln].total += 1;
    if (isIndiv && item.athlete) {
      const medalIcon = medalType === 'gold' ? '🥇' : (medalType === 'silver' ? '🥈' : '🥉');
      if (!tableMap[cln].athletes.some(a => a.athlete === item.athlete && a.medalType === medalType)) {
        tableMap[cln].athletes.push({
          athlete: item.athlete,
          medal: medalIcon,
          medalType: medalType
        });
        tableMap[cln].athletes.sort((a, b) => (medalWeight[a.medalType] || 99) - (medalWeight[b.medalType] || 99));
      }
    }
  };

  let totalDecidedMedals = 0;
  let totalExactHits = 0;
  let totalPodiumHits = 0;
  let totalDecidedGold = 0;
  let totalGoldHits = 0;

  medalEvents.forEach(ev => {
    const isIndiv = ev.type === 'individual';
    // Record projected podium
    recordTableMedal(projectedTableMap, ev.projected.gold, 'gold', isIndiv);
    recordTableMedal(projectedTableMap, ev.projected.silver, 'silver', isIndiv);
    if (Array.isArray(ev.projected.bronzes) && ev.projected.bronzes.length > 0) {
      ev.projected.bronzes.forEach(b => recordTableMedal(projectedTableMap, b, 'bronze', isIndiv));
    } else {
      recordTableMedal(projectedTableMap, ev.projected.bronze, 'bronze', isIndiv);
    }

    // Record actual podium
    recordTableMedal(actualTableMap, ev.actual.gold, 'gold', isIndiv);
    recordTableMedal(actualTableMap, ev.actual.silver, 'silver', isIndiv);
    if (Array.isArray(ev.actual.bronzes) && ev.actual.bronzes.length > 0) {
      ev.actual.bronzes.forEach(b => recordTableMedal(actualTableMap, b, 'bronze', isIndiv));
    } else {
      recordTableMedal(actualTableMap, ev.actual.bronze, 'bronze', isIndiv);
    }

    const projBronzesCleaned = Array.isArray(ev.projected.bronzes) ? ev.projected.bronzes.map(b => b?.cleaned) : [ev.projected.bronze?.cleaned];
    const projTop3 = [ev.projected.gold?.cleaned, ev.projected.silver?.cleaned, ...projBronzesCleaned].filter(Boolean);
    let evDecided = 0;
    let evExact = 0;
    let evPodium = 0;

    let goldHit = null;
    let silverHit = null;
    let bronzeHit = null;

    if (ev.actual.gold) {
      evDecided++;
      totalDecidedMedals++;
      totalDecidedGold++;
      if (ev.actual.gold.cleaned === ev.projected.gold?.cleaned) {
        evExact++;
        totalExactHits++;
        totalGoldHits++;
        goldHit = true;
      } else {
        goldHit = false;
      }
      if (projTop3.includes(ev.actual.gold.cleaned)) {
        evPodium++;
        totalPodiumHits++;
      }
    }

    if (ev.actual.silver) {
      evDecided++;
      totalDecidedMedals++;
      if (ev.actual.silver.cleaned === ev.projected.silver?.cleaned) {
        evExact++;
        totalExactHits++;
        silverHit = true;
      } else {
        silverHit = false;
      }
      if (projTop3.includes(ev.actual.silver.cleaned)) {
        evPodium++;
        totalPodiumHits++;
      }
    }

    if (Array.isArray(ev.actual.bronzes) && ev.actual.bronzes.length > 0) {
      bronzeHit = false;
      ev.actual.bronzes.forEach(b => {
        evDecided++;
        totalDecidedMedals++;
        const matchFound = (Array.isArray(ev.projected.bronzes) && ev.projected.bronzes.some(pb => pb?.cleaned === b?.cleaned)) || (ev.projected.bronze?.cleaned === b?.cleaned);
        if (matchFound) {
          evExact++;
          totalExactHits++;
          bronzeHit = true;
        }
        if (projTop3.includes(b?.cleaned)) {
          evPodium++;
          totalPodiumHits++;
        }
      });
    } else if (ev.actual.bronze) {
      evDecided++;
      totalDecidedMedals++;
      const matchFound = (Array.isArray(ev.projected.bronzes) && ev.projected.bronzes.some(pb => pb?.cleaned === ev.actual.bronze?.cleaned)) || (ev.actual.bronze?.cleaned === ev.projected.bronze?.cleaned);
      if (matchFound) {
        evExact++;
        totalExactHits++;
        bronzeHit = true;
      } else {
        bronzeHit = false;
      }
      if (projTop3.includes(ev.actual.bronze.cleaned)) {
        evPodium++;
        totalPodiumHits++;
      }
    }

    ev.evaluation = {
      decidedCount: evDecided,
      exactHits: evExact,
      podiumHits: evPodium,
      goldHit,
      silverHit,
      bronzeHit,
      accuracyPct: evDecided > 0 ? Math.round((evExact / evDecided) * 100) : null,
      podiumRatePct: evDecided > 0 ? Math.round((evPodium / evDecided) * 100) : null
    };

    const evMatches = ev.gender === 'women' ? womenMatches : menMatches;
    const trackerRaw = ev.gender === 'women' ? window.appData?.womenTrackerRaw : window.appData?.menTrackerRaw;

    if (ev.projected.gold) {
      ev.projected.gold.actualFinish = resolveActualFinish(ev.projected.gold, ev, evMatches, trackerRaw);
    }
    if (ev.projected.silver) {
      ev.projected.silver.actualFinish = resolveActualFinish(ev.projected.silver, ev, evMatches, trackerRaw);
    }
    if (Array.isArray(ev.projected.bronzes)) {
      ev.projected.bronzes.forEach(b => {
        b.actualFinish = resolveActualFinish(b, ev, evMatches, trackerRaw);
      });
    }
    if (ev.projected.bronze) {
      ev.projected.bronze.actualFinish = resolveActualFinish(ev.projected.bronze, ev, evMatches, trackerRaw);
    }

    if (Array.isArray(ev.rankings)) {
      ev.rankings.forEach(c => {
        c.actualFinish = resolveActualFinish(c, ev, evMatches, trackerRaw);
      });
    }
  });

  const totalMedalsInSport = medalEvents.length * 3;

  const actualTable = Object.values(actualTableMap).sort((a, b) =>
    b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || b.total - a.total
  );

  const projectedTable = Object.values(projectedTableMap).sort((a, b) =>
    b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || b.total - a.total
  );

  const allNations = new Set([...Object.keys(actualTableMap), ...Object.keys(projectedTableMap)]);
  const comparisonTable = Array.from(allNations).map(cln => {
    const act = actualTableMap[cln] || { name: '', isHost: false, gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
    const prj = projectedTableMap[cln] || { name: '', isHost: false, gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
    const name = act.name || prj.name || cln;
    const isHost = act.isHost || prj.isHost;
    const flag = getFlagEmoji(name);
    const diffTotal = act.total - prj.total;
    const diffGold = act.gold - prj.gold;

    let status = '⚪ Scheduled';
    if (totalDecidedMedals > 0) {
      if (act.total > 0 && act.total === prj.total && act.gold === prj.gold && act.silver === prj.silver && act.bronze === prj.bronze) {
        status = '🎯 Exact Hit';
      } else if (diffTotal > 0) {
        status = `🟢 Over (+${diffTotal})`;
      } else if (act.total > 0 && diffTotal < 0) {
        status = `🔻 Under (${diffTotal})`;
      } else if (act.total > 0) {
        status = '🟡 Position Shift';
      } else {
        status = '⏳ Pending / Awaiting';
      }
    }

    return {
      cleaned: cln,
      name,
      flag,
      isHost,
      actual: act,
      projected: prj,
      diffTotal,
      diffGold,
      status,
      actualAthletes: act.athletes || [],
      projectedAthletes: prj.athletes || []
    };
  }).sort((a, b) => {
    if (totalDecidedMedals > 0) {
      if (b.actual.gold !== a.actual.gold) return b.actual.gold - a.actual.gold;
      if (b.actual.silver !== a.actual.silver) return b.actual.silver - a.actual.silver;
      if (b.actual.bronze !== a.actual.bronze) return b.actual.bronze - a.actual.bronze;
      if (b.actual.total !== a.actual.total) return b.actual.total - a.actual.total;
    }
    if (b.projected.gold !== a.projected.gold) return b.projected.gold - a.projected.gold;
    if (b.projected.silver !== a.projected.silver) return b.projected.silver - a.projected.silver;
    if (b.projected.bronze !== a.projected.bronze) return b.projected.bronze - a.projected.bronze;
    return b.projected.total - a.projected.total;
  });

  return {
    events: medalEvents,
    actualTable,
    projectedTable,
    comparisonTable,
    kpi: {
      totalMedalsInSport,
      decidedMedals: totalDecidedMedals,
      exactHits: totalExactHits,
      podiumHits: totalPodiumHits,
      decidedGoldEvents: totalDecidedGold,
      goldHits: totalGoldHits,
      accuracyPct: totalDecidedMedals > 0 ? Math.round((totalExactHits / totalDecidedMedals) * 100) : null,
      podiumRatePct: totalDecidedMedals > 0 ? Math.round((totalPodiumHits / totalDecidedMedals) * 100) : null,
      goldAccuracyPct: totalDecidedGold > 0 ? Math.round((totalGoldHits / totalDecidedGold) * 100) : null
    }
  };
}

// --- Predictions & Dynamic Medal Table (All Sports) ---
function renderPredictionsView(container, menPreds, womenPreds, currentGender, menMatches, womenMatches) {
  const activeSport = (window.currentSport || (typeof currentSport !== 'undefined' ? currentSport : 'basketball')).toLowerCase();

  const globalData = getGlobalAppData();
  if (!menMatches || menMatches.length === 0) menMatches = globalData.menMatches || [];
  if (!womenMatches || womenMatches.length === 0) womenMatches = globalData.womenMatches || [];
  if (!menPreds || menPreds.length === 0) menPreds = globalData.menPredictions || [];
  if (!womenPreds || womenPreds.length === 0) womenPreds = globalData.womenPredictions || [];
  if (!currentGender) currentGender = window.currentGender || 'men';

  const analytics = extractSportMedalAnalytics(activeSport, menMatches, womenMatches, menPreds, womenPreds);
  const kpi = analytics.kpi;

  const curSub = (typeof window !== 'undefined' && window.activePredictionsSubView)
    ? window.activePredictionsSubView
    : activePredictionsSubView;

  let isTableActive = curSub === 'table';
  const isOddsActive = curSub === 'odds';
  let activeEvent = null;
  if (!isTableActive && !isOddsActive) {
    const targetId = curSub.startsWith('event_')
      ? curSub.replace('event_', '')
      : curSub;
    activeEvent = analytics.events.find(e => e.id === targetId || ('event_' + e.id) === curSub);
    if (!activeEvent) {
      activePredictionsSubView = 'table';
      if (typeof window !== 'undefined') window.activePredictionsSubView = 'table';
      isTableActive = true;
    }
  }

  // Top Dynamic Navigation Pills Bar
  const pillsHeader = `
    <div style="display:flex; flex-wrap:wrap; gap:6px; background:rgba(15,23,42,0.6); padding:4px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); margin-bottom:1.25rem;">
      <button style="flex:1; min-width:140px; padding:7px 10px; font-size:0.75rem; font-weight:600; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${isTableActive ? '#2563eb' : 'transparent'}; color:${isTableActive ? '#fff' : '#94a3b8'};" onclick="setPredictionsSubView('table')">
        🏅 Full Medal Table
      </button>
      ${analytics.events.map(ev => {
        const isThisEvent = activeEvent && activeEvent.id === ev.id;
        return `
          <button style="flex:1; min-width:115px; padding:7px 10px; font-size:0.75rem; font-weight:600; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${isThisEvent ? '#2563eb' : 'transparent'}; color:${isThisEvent ? '#fff' : '#94a3b8'};" onclick="setPredictionsSubView('event_${ev.id}')">
            ${ev.icon || '🎯'} ${ev.shortName || ev.name}
          </button>
        `;
      }).join('')}
      <button style="flex:1; min-width:115px; padding:7px 10px; font-size:0.75rem; font-weight:600; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${isOddsActive ? '#2563eb' : 'transparent'}; color:${isOddsActive ? '#fff' : '#94a3b8'};" onclick="setPredictionsSubView('odds')">
        📊 Division Odds
      </button>
    </div>
  `;

  // --- SUBVIEW 1: FULL MEDAL TABLE (MAIN UNCLUTTERED VIEW) ---
  if (isTableActive) {
    const accuracyColor = kpi.accuracyPct != null ? (kpi.accuracyPct >= 60 ? '#4ade80' : kpi.accuracyPct >= 30 ? '#facc15' : '#f87171') : '#94a3b8';
    const accuracyDisplay = kpi.accuracyPct != null ? `${kpi.accuracyPct}%` : '--%';
    const decidedDisplay = `${kpi.decidedMedals} of ${kpi.totalMedalsInSport} medals decided`;

    const sportTitle = activeSport.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const unifiedHeaderHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.85rem 1.15rem; margin-bottom:1rem;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.5rem;">${(window.SPORT_ENGINES && window.SPORT_ENGINES[activeSport]?.icon) || '🏅'}</span>
          <div>
            <div style="font-size:1rem; font-weight:800; color:#f8fafc;">${sportTitle} Medal Standings</div>
            <div style="font-size:0.74rem; color:#94a3b8; margin-top:2px;">
              ${decidedDisplay} • Prediction Accuracy: <strong style="color:${accuracyColor};">${accuracyDisplay}</strong>
              ${kpi.decidedMedals > 0 ? `<span style="color:#64748b;"> (${kpi.exactHits}/${kpi.decidedMedals} exact picks)</span>` : ''}
            </div>
          </div>
        </div>
        <div style="display:inline-flex; background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:3px; gap:3px;">
          <button style="padding:5px 12px; font-size:0.75rem; font-weight:600; border-radius:6px; border:none; cursor:pointer; transition:all 0.15s; background:${activeMedalTableMode === 'comparison' ? '#2563eb' : 'transparent'}; color:${activeMedalTableMode === 'comparison' ? '#fff' : '#94a3b8'};" onclick="setMedalTableMode('comparison')">⚖️ Side-by-Side</button>
          <button style="padding:5px 12px; font-size:0.75rem; font-weight:600; border-radius:6px; border:none; cursor:pointer; transition:all 0.15s; background:${activeMedalTableMode === 'actual' ? '#2563eb' : 'transparent'}; color:${activeMedalTableMode === 'actual' ? '#fff' : '#94a3b8'};" onclick="setMedalTableMode('actual')">🏆 Actual</button>
          <button style="padding:5px 12px; font-size:0.75rem; font-weight:600; border-radius:6px; border:none; cursor:pointer; transition:all 0.15s; background:${activeMedalTableMode === 'projected' ? '#2563eb' : 'transparent'}; color:${activeMedalTableMode === 'projected' ? '#fff' : '#94a3b8'};" onclick="setMedalTableMode('projected')">🔮 Projected</button>
        </div>
      </div>
    `;

    let mainTableHtml = '';

    if (activeMedalTableMode === 'comparison') {
      const rows = analytics.comparisonTable;
      const totalActG = rows.reduce((s, r) => s + r.actual.gold, 0);
      const totalActS = rows.reduce((s, r) => s + r.actual.silver, 0);
      const totalActB = rows.reduce((s, r) => s + r.actual.bronze, 0);
      const totalActTot = rows.reduce((s, r) => s + r.actual.total, 0);

      const totalPrjG = rows.reduce((s, r) => s + r.projected.gold, 0);
      const totalPrjS = rows.reduce((s, r) => s + r.projected.silver, 0);
      const totalPrjB = rows.reduce((s, r) => s + r.projected.bronze, 0);
      const totalPrjTot = rows.reduce((s, r) => s + r.projected.total, 0);

      mainTableHtml = `
        <div class="medal-comp-wrap">
          <table class="medal-comp-table">
            <thead>
              <tr style="background:rgba(0,0,0,0.3); font-size:0.74rem;">
                <th rowspan="2" style="text-align:left; padding-left:0.75rem; width:22%;"># Nation</th>
                <th colspan="4" class="col-actual">🏆 ACTUAL MEDALS (LIVE)</th>
                <th colspan="4" class="col-projected">🔮 PROJECTED (SIMULATION)</th>
                <th rowspan="2" style="color:#facc15; width:9%;">Δ Total</th>
                <th rowspan="2" style="color:#94a3b8; width:13%;">Status</th>
              </tr>
              <tr style="background:rgba(0,0,0,0.15); font-size:0.7rem; color:#94a3b8;">
                <th style="color:#facc15;">🥇 G</th>
                <th style="color:#cbd5e1;">🥈 S</th>
                <th style="color:#f59e0b;">🥉 B</th>
                <th style="color:#4ade80; font-weight:700;">Tot</th>
                <th style="color:#facc15;">🥇 G</th>
                <th style="color:#cbd5e1;">🥈 S</th>
                <th style="color:#f59e0b;">🥉 B</th>
                <th style="color:#38bdf8; font-weight:700;">Tot</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r, idx) => {
                const deltaClass = r.diffTotal > 0 ? 'delta-pos' : (r.diffTotal < 0 ? 'delta-neg' : 'delta-zero');
                const deltaSign = r.diffTotal > 0 ? `+${r.diffTotal}` : `${r.diffTotal}`;
                const isExact = r.actual.total > 0 && r.diffTotal === 0 && r.actual.gold === r.projected.gold && r.actual.silver === r.projected.silver;
                const statusBadgeColor = isExact ? '#4ade80' : (r.diffTotal > 0 ? '#38bdf8' : (r.diffTotal < 0 ? '#f87171' : '#94a3b8'));

                return `
                  <tr style="background:${idx < 3 ? 'rgba(59,130,246,0.02)' : 'transparent'};">
                    <td style="text-align:left; font-weight:600; padding-left:0.75rem;">
                      <div style="display:flex; align-items:center;">
                        <span style="display:inline-block; width:16px; color:#94a3b8; font-size:0.75rem;">${idx + 1}</span>
                        <span>${r.flag}</span>
                        <span style="color:#f8fafc; margin-left:3px;">${r.name}${r.isHost ? ' (Host)' : ''}</span>
                      </div>
                      ${(r.projectedAthletes && r.projectedAthletes.length > 0) ? `
                        <div style="font-size:0.68rem; color:#cbd5e1; font-weight:400; margin-left:20px; margin-top:3px; display:flex; flex-wrap:wrap; gap:3px;">
                          ${r.projectedAthletes.map(a => `<span style="white-space:nowrap; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:1px 5px; border-radius:3px;">${a.medal} <strong>${a.athlete}</strong></span>`).join('')}
                        </div>
                      ` : ''}
                    </td>
                    <td style="font-family:monospace; font-weight:${r.actual.gold > 0 ? '700' : '400'}; color:#facc15;" class="col-actual-border">${r.actual.gold}</td>
                    <td style="font-family:monospace; color:#cbd5e1;">${r.actual.silver}</td>
                    <td style="font-family:monospace; color:#f59e0b;">${r.actual.bronze}</td>
                    <td style="font-family:monospace; font-weight:700; color:#4ade80;">${r.actual.total}</td>
                    <td style="font-family:monospace; font-weight:${r.projected.gold > 0 ? '700' : '400'}; color:#facc15;" class="col-projected-border">${r.projected.gold}</td>
                    <td style="font-family:monospace; color:#cbd5e1;">${r.projected.silver}</td>
                    <td style="font-family:monospace; color:#f59e0b;">${r.projected.bronze}</td>
                    <td style="font-family:monospace; font-weight:700; color:#38bdf8;">${r.projected.total}</td>
                    <td>
                      <span class="delta-pill ${deltaClass}">${deltaSign}</span>
                    </td>
                    <td>
                      <span style="font-size:0.68rem; font-weight:600; color:${statusBadgeColor};">${r.status}</span>
                    </td>
                  </tr>
                `;
              }).join('')}
              <tr style="border-top:1px solid rgba(255,255,255,0.15); background:rgba(0,0,0,0.3); font-weight:700; font-size:0.78rem;">
                <td style="text-align:left; padding-left:0.75rem; color:#94a3b8;">Total Medals</td>
                <td style="color:#facc15;">${totalActG}</td>
                <td style="color:#cbd5e1;">${totalActS}</td>
                <td style="color:#f59e0b;">${totalActB}</td>
                <td style="color:#4ade80;">${totalActTot}</td>
                <td style="color:#facc15;">${totalPrjG}</td>
                <td style="color:#cbd5e1;">${totalPrjS}</td>
                <td style="color:#f59e0b;">${totalPrjB}</td>
                <td style="color:#38bdf8;">${totalPrjTot}</td>
                <td style="color:#facc15;">${totalActTot - totalPrjTot >= 0 ? `+${totalActTot - totalPrjTot}` : totalActTot - totalPrjTot}</td>
                <td style="color:#94a3b8; font-size:0.7rem;">${kpi.decidedMedals}/${kpi.totalMedalsInSport} Awarded</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    } else if (activeMedalTableMode === 'actual') {
      const actRows = analytics.actualTable;
      if (actRows.length === 0) {
        mainTableHtml = `
          <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:2.5rem 1rem; text-align:center; color:#94a3b8;">
            <div style="font-size:1.8rem; margin-bottom:0.5rem;">🏅</div>
            <div style="font-weight:700; color:#f8fafc; margin-bottom:0.25rem;">No Medals Decided Yet</div>
            <div style="font-size:0.75rem;">Medal matches for this tournament are currently upcoming or in progress. Check the <strong>Side-by-Side</strong> view to see projected standings!</div>
          </div>
        `;
      } else {
        mainTableHtml = `
          <div class="medal-comp-wrap">
            <table class="medal-comp-table">
              <thead>
                <tr style="background:rgba(0,0,0,0.3); font-size:0.74rem;">
                  <th style="text-align:left; padding-left:0.75rem; width:35%;"># Nation</th>
                  <th style="color:#facc15;">🥇 Gold</th>
                  <th style="color:#cbd5e1;">🥈 Silver</th>
                  <th style="color:#f59e0b;">🥉 Bronze</th>
                  <th style="color:#4ade80; font-weight:700;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${actRows.map((r, idx) => `
                  <tr>
                    <td style="text-align:left; padding-left:0.75rem; font-weight:600;">
                      <div style="display:flex; align-items:center;">
                        <span style="display:inline-block; width:16px; color:#94a3b8;">${idx + 1}</span>
                        <span>${r.flag}</span>
                        <span style="color:#f8fafc; margin-left:3px;">${r.name}${r.isHost ? ' (Host)' : ''}</span>
                      </div>
                      ${(r.athletes && r.athletes.length > 0) ? `
                        <div style="font-size:0.68rem; color:#cbd5e1; font-weight:400; margin-left:20px; margin-top:3px; display:flex; flex-wrap:wrap; gap:3px;">
                          ${r.athletes.map(a => `<span style="white-space:nowrap; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:1px 5px; border-radius:3px;">${a.medal} <strong>${a.athlete}</strong></span>`).join('')}
                        </div>
                      ` : ''}
                    </td>
                    <td style="font-family:monospace; font-weight:${r.gold > 0 ? '700' : '400'}; color:#facc15;">${r.gold}</td>
                    <td style="font-family:monospace; color:#cbd5e1;">${r.silver}</td>
                    <td style="font-family:monospace; color:#f59e0b;">${r.bronze}</td>
                    <td style="font-family:monospace; font-weight:700; color:#4ade80;">${r.total}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } else if (activeMedalTableMode === 'projected') {
      const prjRows = analytics.projectedTable;
      mainTableHtml = `
        <div class="medal-comp-wrap">
          <table class="medal-comp-table">
            <thead>
              <tr style="background:rgba(0,0,0,0.3); font-size:0.74rem;">
                <th style="text-align:left; padding-left:0.75rem; width:35%;"># Nation</th>
                <th style="color:#facc15;">🥇 Gold</th>
                <th style="color:#cbd5e1;">🥈 Silver</th>
                <th style="color:#f59e0b;">🥉 Bronze</th>
                <th style="color:#38bdf8; font-weight:700;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${prjRows.map((r, idx) => `
                <tr>
                  <td style="text-align:left; padding-left:0.75rem; font-weight:600;">
                    <div style="display:flex; align-items:center;">
                      <span style="display:inline-block; width:16px; color:#94a3b8;">${idx + 1}</span>
                      <span>${r.flag}</span>
                      <span style="color:#f8fafc; margin-left:3px;">${r.name}${r.isHost ? ' (Host)' : ''}</span>
                    </div>
                    ${(r.athletes && r.athletes.length > 0) ? `
                      <div style="font-size:0.68rem; color:#cbd5e1; font-weight:400; margin-left:20px; margin-top:3px; display:flex; flex-wrap:wrap; gap:3px;">
                        ${r.athletes.map(a => `<span style="white-space:nowrap; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); padding:1px 5px; border-radius:3px;">${a.medal} <strong>${a.athlete}</strong></span>`).join('')}
                      </div>
                    ` : ''}
                  </td>
                  <td style="font-family:monospace; font-weight:${r.gold > 0 ? '700' : '400'}; color:#facc15;">${r.gold}</td>
                  <td style="font-family:monospace; color:#cbd5e1;">${r.silver}</td>
                  <td style="font-family:monospace; color:#f59e0b;">${r.bronze}</td>
                  <td style="font-family:monospace; font-weight:700; color:#38bdf8;">${r.total}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    // Direct, uncluttered event navigation list allowing the user to explore each event separately
    const formatProjectedPickWithFinish = (pick, hit, medalEmoji) => {
      if (!pick) return 'TBD';
      const base = formatContenderDisplay(pick);
      if (hit) {
        return `${base} <span style="color:#4ade80; font-size:0.7rem; font-weight:700; background:rgba(74,222,128,0.12); border:1px solid rgba(74,222,128,0.25); padding:1px 5px; border-radius:4px;">[🎯 ${medalEmoji}]</span>`;
      }
      if (pick.actualFinish) {
        return `${base} <span style="color:${pick.actualFinish.badgeColor}; font-size:0.7rem; font-weight:700; background:${pick.actualFinish.badgeBg}; border:1px solid ${pick.actualFinish.badgeBorder}; padding:1px 5px; border-radius:4px;">[${pick.actualFinish.shortText}]</span>`;
      }
      return base;
    };

    const eventsListHtml = `
      <div style="margin-top:1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.65rem; flex-wrap:wrap; gap:6px;">
          <div style="font-size:0.85rem; font-weight:700; color:#f8fafc; display:flex; align-items:center; gap:6px;">
            <span>🎯</span> <span>Individual & Team Events in ${activeSport}</span>
          </div>
          <span style="font-size:0.72rem; color:#94a3b8;">Click any event to view dedicated podium, match scores & contender odds</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.6rem;">
          ${analytics.events.map(ev => {
            const isOfficial = ev.status.toLowerCase().includes('finish') || ev.status.toLowerCase().includes('official');
            const isLive = ev.status.toLowerCase().includes('live');
            const statusColor = isOfficial ? '#4ade80' : (isLive ? '#f87171' : '#94a3b8');
            const statusText = isOfficial ? 'Official' : (isLive ? 'Live' : 'Scheduled');

            return `
              <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:0.75rem 1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; transition:border-color 0.2s;" onmouseover="this.style.borderColor='rgba(59,130,246,0.35)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.08)'">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:1.3rem;">${ev.icon || '🏅'}</span>
                  <div>
                    <div style="font-weight:700; font-size:0.9rem; color:#f8fafc;">${ev.name}</div>
                    <div style="font-size:0.73rem; color:#94a3b8; margin-top:3px;">
                      ${ev.actual.gold ? `
                        <div style="margin-bottom:2px;"><span style="color:#4ade80; font-weight:700;">Official:</span> 🥇 <strong style="color:#f8fafc;">${formatContenderDisplay(ev.actual.gold)}</strong> • 🥈 ${formatContenderDisplay(ev.actual.silver)} • 🥉 ${(Array.isArray(ev.actual.bronzes) && ev.actual.bronzes.length > 1) ? ev.actual.bronzes.map(b => formatContenderDisplay(b)).join(' & ') : formatContenderDisplay(ev.actual.bronze)}</div>
                        <div><span style="color:#38bdf8; font-weight:700;">Projected:</span> 🥇 <strong style="color:#f8fafc;">${formatProjectedPickWithFinish(ev.projected.gold, ev.evaluation.goldHit, 'Gold')}</strong> ${ev.projected.gold?.goldProb ? `(${ev.projected.gold.goldProb})` : ''} • 🥈 ${formatProjectedPickWithFinish(ev.projected.silver, ev.evaluation.silverHit, 'Silver')} • 🥉 ${(Array.isArray(ev.projected.bronzes) && ev.projected.bronzes.length > 1) ? ev.projected.bronzes.map(b => formatProjectedPickWithFinish(b, ev.evaluation.bronzeHit, 'Bronze')).join(' & ') : formatProjectedPickWithFinish(ev.projected.bronze, ev.evaluation.bronzeHit, 'Bronze')}</div>
                      ` : `
                        <div><span style="color:#38bdf8; font-weight:700;">Projected Picks:</span> 🥇 <strong style="color:#f8fafc;">${formatContenderDisplay(ev.projected.gold)}</strong> ${ev.projected.gold?.goldProb ? `(${ev.projected.gold.goldProb})` : ''} • 🥈 ${formatContenderDisplay(ev.projected.silver)} • 🥉 ${(Array.isArray(ev.projected.bronzes) && ev.projected.bronzes.length > 1) ? ev.projected.bronzes.map(b => formatContenderDisplay(b)).join(' & ') : formatContenderDisplay(ev.projected.bronze)}</div>
                      `}
                    </div>
                  </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="font-size:0.7rem; font-weight:700; color:${statusColor}; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:3px 8px; border-radius:4px;">${statusText}</span>
                  <button onclick="setPredictionsSubView('event_${ev.id}')" style="background:rgba(37,99,235,0.15); border:1px solid rgba(37,99,235,0.4); color:#38bdf8; padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:700; cursor:pointer;" onmouseover="this.style.background='#2563eb'; this.style.color='#fff';" onmouseout="this.style.background='rgba(37,99,235,0.15)'; this.style.color='#38bdf8';">
                    View Podium & Odds →
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.innerHTML = `${pillsHeader}${unifiedHeaderHtml}${mainTableHtml}${eventsListHtml}`;
    return;
  }

  // --- SUBVIEW 2: DEDICATED SINGLE-EVENT DRILLDOWN ---
  if (activeEvent) {
    const ev = activeEvent;
    const isConcluded = !!(ev.actual && ev.actual.gold);
    const isLive = ev.status.toLowerCase().includes('live');
    const statusBadge = isConcluded 
      ? `<span style="background:rgba(74,222,128,0.15); color:#4ade80; padding:3px 9px; border-radius:4px; font-size:0.72rem; font-weight:700;">🟢 Official Results</span>`
      : (isLive 
          ? `<span style="background:rgba(239,68,68,0.15); color:#f87171; padding:3px 9px; border-radius:4px; font-size:0.72rem; font-weight:700;">🔴 Live in Play</span>`
          : `<span style="background:rgba(148,163,184,0.15); color:#94a3b8; padding:3px 9px; border-radius:4px; font-size:0.72rem; font-weight:600;">⚪ Scheduled</span>`);

    let accuracyBadge = '';
    if (ev.evaluation.decidedCount > 0) {
      const acc = ev.evaluation.accuracyPct;
      const accColor = acc >= 60 ? '#4ade80' : (acc >= 30 ? '#facc15' : '#f87171');
      accuracyBadge = `<span style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:${accColor}; padding:3px 9px; border-radius:4px; font-size:0.72rem; font-weight:700;">Podium Accuracy: ${acc}% (${ev.evaluation.exactHits}/${ev.evaluation.decidedCount} exact)</span>`;
    }

    let podiumSectionHtml = '';

    if (isConcluded) {
      // Official concluded podium showcase
      podiumSectionHtml = `
        <div style="background:linear-gradient(135deg, rgba(30,58,138,0.25), rgba(15,23,42,0.9)); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:1.25rem; margin-bottom:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.6rem; flex-wrap:wrap; gap:6px;">
            <div style="font-size:0.85rem; font-weight:800; color:#4ade80; display:flex; align-items:center; gap:6px;">
              <span>🏆</span> <span>OFFICIAL EVENT PODIUM</span>
            </div>
            <div style="font-size:0.75rem; color:#94a3b8;">
              Competition Concluded • Medals Awarded
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem;">
            <!-- 🥇 GOLD -->
            <div style="background:rgba(234,179,8,0.08); border:1px solid rgba(234,179,8,0.3); border-radius:10px; padding:1rem; text-align:center;">
              <div style="font-size:1.8rem; margin-bottom:4px;">🥇</div>
              <div style="font-size:0.7rem; font-weight:800; color:#facc15; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">GOLD MEDALIST • CHAMPION</div>
              <div style="font-size:2rem; margin-bottom:4px;">${ev.actual.gold.flag}</div>
              <div style="font-weight:800; font-size:1.15rem; color:#f8fafc;">
                ${ev.actual.gold.athlete ? ev.actual.gold.athlete : `${ev.actual.gold.name}${ev.actual.gold.isHost ? ' (Host)' : ''}`}
              </div>
              ${ev.actual.gold.athlete ? `<div style="font-size:0.8rem; color:#94a3b8; font-weight:600; margin-top:2px;">${ev.actual.gold.name}${ev.actual.gold.isHost ? ' (Host)' : ''}</div>` : ''}
              <div style="font-size:0.74rem; color:#94a3b8; margin-top:8px; padding-top:6px; border-top:1px solid rgba(234,179,8,0.15);">
                ${ev.goldScoreInfo || 'Won Gold'}
              </div>
              <div style="font-size:0.72rem; color:${ev.evaluation.goldHit ? '#4ade80' : '#38bdf8'}; margin-top:4px; font-weight:600;">
                ${ev.evaluation.goldHit ? '🎯 Simulation Pick: Exact Gold Hit' : `Projected pick was ${formatContenderDisplay(ev.projected.gold)}${ev.projected.gold?.actualFinish ? ` • Actual: <strong style="color:${ev.projected.gold.actualFinish.badgeColor};">${ev.projected.gold.actualFinish.text}</strong>` : ''}`}
              </div>
            </div>

            <!-- 🥈 SILVER -->
            <div style="background:rgba(203,213,225,0.06); border:1px solid rgba(203,213,225,0.2); border-radius:10px; padding:1rem; text-align:center;">
              <div style="font-size:1.8rem; margin-bottom:4px;">🥈</div>
              <div style="font-size:0.7rem; font-weight:800; color:#cbd5e1; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">SILVER MEDALIST • RUNNER-UP</div>
              <div style="font-size:2rem; margin-bottom:4px;">${ev.actual.silver ? ev.actual.silver.flag : '⚪'}</div>
              <div style="font-weight:800; font-size:1.15rem; color:#f8fafc;">
                ${ev.actual.silver ? (ev.actual.silver.athlete ? ev.actual.silver.athlete : `${ev.actual.silver.name}${ev.actual.silver.isHost ? ' (Host)' : ''}`) : 'TBD'}
              </div>
              ${ev.actual.silver && ev.actual.silver.athlete ? `<div style="font-size:0.8rem; color:#94a3b8; font-weight:600; margin-top:2px;">${ev.actual.silver.name}${ev.actual.silver.isHost ? ' (Host)' : ''}</div>` : ''}
              <div style="font-size:0.74rem; color:#94a3b8; margin-top:8px; padding-top:6px; border-top:1px solid rgba(203,213,225,0.15);">
                Finalist Runner-Up
              </div>
              <div style="font-size:0.72rem; color:${ev.evaluation.silverHit ? '#4ade80' : '#94a3b8'}; margin-top:4px; font-weight:600;">
                ${ev.evaluation.silverHit ? '🎯 Simulation Pick: Exact Silver Hit' : `Projected pick was ${formatContenderDisplay(ev.projected.silver)}${ev.projected.silver?.actualFinish ? ` • Actual: <strong style="color:${ev.projected.silver.actualFinish.badgeColor};">${ev.projected.silver.actualFinish.text}</strong>` : ''}`}
              </div>
            </div>

            <!-- 🥉 BRONZE -->
            ${(Array.isArray(ev.actual.bronzes) && ev.actual.bronzes.length > 1) ? ev.actual.bronzes.map((b, bIdx) => {
              const projPick = (Array.isArray(ev.projected.bronzes) && ev.projected.bronzes[bIdx])
                ? ev.projected.bronzes[bIdx]
                : (ev.projected.bronze || (Array.isArray(ev.projected.bronzes) && ev.projected.bronzes[0]));
              const isExactHit = (Array.isArray(ev.projected.bronzes) && ev.projected.bronzes.some(pb => pb?.cleaned === b?.cleaned)) || (ev.projected.bronze?.cleaned === b?.cleaned);
              return `
              <div style="background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2); border-radius:10px; padding:1rem; text-align:center;">
                <div style="font-size:1.8rem; margin-bottom:4px;">🥉</div>
                <div style="font-size:0.7rem; font-weight:800; color:#f59e0b; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">BRONZE MEDALIST • ${ev.bronzeScoreInfo && ev.bronzeScoreInfo.includes('Bronze Match') ? `BRONZE ${bIdx + 1}` : `SEMIFINALIST`}</div>
                <div style="font-size:2rem; margin-bottom:4px;">${b ? b.flag : '⚪'}</div>
                <div style="font-weight:800; font-size:1.15rem; color:#f8fafc;">
                  ${b ? (b.athlete ? b.athlete : `${b.name}${b.isHost ? ' (Host)' : ''}`) : 'TBD'}
                </div>
                ${b && b.athlete ? `<div style="font-size:0.8rem; color:#94a3b8; font-weight:600; margin-top:2px;">${b.name}${b.isHost ? ' (Host)' : ''}</div>` : ''}
                <div style="font-size:0.74rem; color:#94a3b8; margin-top:8px; padding-top:6px; border-top:1px solid rgba(245,158,11,0.15);">
                  ${ev.bronzeScoreInfo && ev.bronzeScoreInfo.includes('Bronze Match') ? 'Won Bronze Match' : 'Semifinalist Bronze Medalist'}
                </div>
                <div style="font-size:0.72rem; color:${isExactHit ? '#4ade80' : '#94a3b8'}; margin-top:4px; font-weight:600;">
                  ${isExactHit ? '🎯 Simulation Pick: Exact Bronze Hit' : `Projected pick was ${formatContenderDisplay(projPick)}${projPick?.actualFinish ? ` • Actual: <strong style="color:${projPick.actualFinish.badgeColor};">${projPick.actualFinish.text}</strong>` : ''}`}
                </div>
              </div>
            `;
            }).join('') : `
              <div style="background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2); border-radius:10px; padding:1rem; text-align:center;">
                <div style="font-size:1.8rem; margin-bottom:4px;">🥉</div>
                <div style="font-size:0.7rem; font-weight:800; color:#f59e0b; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">BRONZE MEDALIST • 3RD PLACE</div>
                <div style="font-size:2rem; margin-bottom:4px;">${ev.actual.bronze ? ev.actual.bronze.flag : '⚪'}</div>
                <div style="font-weight:800; font-size:1.15rem; color:#f8fafc;">
                  ${ev.actual.bronze ? (ev.actual.bronze.athlete ? ev.actual.bronze.athlete : `${ev.actual.bronze.name}${ev.actual.bronze.isHost ? ' (Host)' : ''}`) : 'TBD'}
                </div>
                ${ev.actual.bronze && ev.actual.bronze.athlete ? `<div style="font-size:0.8rem; color:#94a3b8; font-weight:600; margin-top:2px;">${ev.actual.bronze.name}${ev.actual.bronze.isHost ? ' (Host)' : ''}</div>` : ''}
                <div style="font-size:0.74rem; color:#94a3b8; margin-top:8px; padding-top:6px; border-top:1px solid rgba(245,158,11,0.15);">
                  ${ev.bronzeScoreInfo || 'Won Bronze Match'}
                </div>
                <div style="font-size:0.72rem; color:${ev.evaluation.bronzeHit ? '#4ade80' : '#94a3b8'}; margin-top:4px; font-weight:600;">
                  ${ev.evaluation.bronzeHit ? '🎯 Simulation Pick: Exact Bronze Hit' : `Projected pick was ${formatContenderDisplay(ev.projected.bronze)}${ev.projected.bronze?.actualFinish ? ` • Actual: <strong style="color:${ev.projected.bronze.actualFinish.badgeColor};">${ev.projected.bronze.actualFinish.text}</strong>` : ''}`}
                </div>
              </div>
            `}
          </div>
        </div>
      `;
    } else {
      // Upcoming or in-progress event projected podium banner
      podiumSectionHtml = `
        <div style="background:rgba(30,58,138,0.2); border:1px solid rgba(59,130,246,0.3); border-radius:12px; padding:1.25rem; margin-bottom:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.6rem; flex-wrap:wrap; gap:6px;">
            <div style="font-size:0.85rem; font-weight:800; color:#38bdf8; display:flex; align-items:center; gap:6px;">
              <span>🔮</span> <span>PROJECTED PODIUM FAVORITES</span>
            </div>
            <div style="font-size:0.72rem; color:#94a3b8;">
              Historical Pre-Tournament Simulation • Confirmed 2026 Participants
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem;">
            <!-- Projected 🥇 -->
            <div style="background:rgba(234,179,8,0.06); border:1px solid rgba(234,179,8,0.2); border-radius:10px; padding:1rem; text-align:center;">
              <div style="font-size:1.8rem; margin-bottom:4px;">🥇</div>
              <div style="font-size:0.7rem; font-weight:800; color:#facc15; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">PROJECTED GOLD FAVORITE</div>
              <div style="font-size:2rem; margin-bottom:4px;">${ev.projected.gold ? ev.projected.gold.flag : '⚪'}</div>
              <div style="font-weight:800; font-size:1.15rem; color:#f8fafc;">
                ${ev.projected.gold?.athlete ? ev.projected.gold.athlete : (ev.projected.gold ? `${ev.projected.gold.name}${ev.projected.gold.isHost ? ' (Host)' : ''}` : 'TBD')}
              </div>
              ${ev.projected.gold && ev.projected.gold.athlete ? `<div style="font-size:0.8rem; color:#94a3b8; font-weight:600; margin-top:2px;">${ev.projected.gold.name}${ev.projected.gold.isHost ? ' (Host)' : ''}</div>` : ''}
              <div style="font-size:0.75rem; font-weight:700; color:#facc15; margin-top:8px;">
                ${ev.projected.gold && ev.projected.gold.goldProb ? `${ev.projected.gold.goldProb} Win Probability` : ''}
              </div>
            </div>

            <!-- Projected 🥈 -->
            <div style="background:rgba(203,213,225,0.05); border:1px solid rgba(203,213,225,0.2); border-radius:10px; padding:1rem; text-align:center;">
              <div style="font-size:1.8rem; margin-bottom:4px;">🥈</div>
              <div style="font-size:0.7rem; font-weight:800; color:#cbd5e1; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">PROJECTED SILVER</div>
              <div style="font-size:2rem; margin-bottom:4px;">${ev.projected.silver ? ev.projected.silver.flag : '⚪'}</div>
              <div style="font-weight:800; font-size:1.15rem; color:#f8fafc;">
                ${ev.projected.silver?.athlete ? ev.projected.silver.athlete : (ev.projected.silver ? `${ev.projected.silver.name}${ev.projected.silver.isHost ? ' (Host)' : ''}` : 'TBD')}
              </div>
              ${ev.projected.silver && ev.projected.silver.athlete ? `<div style="font-size:0.8rem; color:#94a3b8; font-weight:600; margin-top:2px;">${ev.projected.silver.name}${ev.projected.silver.isHost ? ' (Host)' : ''}</div>` : ''}
              <div style="font-size:0.75rem; color:#cbd5e1; margin-top:8px;">
                ${ev.projected.silver && ev.projected.silver.silverProb ? `${ev.projected.silver.silverProb} Silver Probability` : ''}
              </div>
            </div>

            <!-- Projected 🥉 -->
            ${(Array.isArray(ev.projected.bronzes) && ev.projected.bronzes.length > 1) ? ev.projected.bronzes.map((pb, pbIdx) => `
              <div style="background:rgba(245,158,11,0.05); border:1px solid rgba(245,158,11,0.2); border-radius:10px; padding:1rem; text-align:center;">
                <div style="font-size:1.8rem; margin-bottom:4px;">🥉</div>
                <div style="font-size:0.7rem; font-weight:800; color:#f59e0b; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">PROJECTED BRONZE ${pbIdx + 1}</div>
                <div style="font-size:2rem; margin-bottom:4px;">${pb ? pb.flag : '⚪'}</div>
                <div style="font-weight:800; font-size:1.15rem; color:#f8fafc;">
                  ${pb?.athlete ? pb.athlete : (pb ? `${pb.name}${pb.isHost ? ' (Host)' : ''}` : 'TBD')}
                </div>
                ${pb && pb.athlete ? `<div style="font-size:0.8rem; color:#94a3b8; font-weight:600; margin-top:2px;">${pb.name}${pb.isHost ? ' (Host)' : ''}</div>` : ''}
                <div style="font-size:0.75rem; color:#f59e0b; margin-top:8px;">
                  ${pb && pb.bronzeProb ? `${pb.bronzeProb} Bronze Probability` : ''}
                </div>
              </div>
            `).join('') : `
              <div style="background:rgba(245,158,11,0.05); border:1px solid rgba(245,158,11,0.2); border-radius:10px; padding:1rem; text-align:center;">
                <div style="font-size:1.8rem; margin-bottom:4px;">🥉</div>
                <div style="font-size:0.7rem; font-weight:800; color:#f59e0b; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">PROJECTED BRONZE</div>
                <div style="font-size:2rem; margin-bottom:4px;">${ev.projected.bronze ? ev.projected.bronze.flag : '⚪'}</div>
                <div style="font-weight:800; font-size:1.15rem; color:#f8fafc;">
                  ${ev.projected.bronze?.athlete ? ev.projected.bronze.athlete : (ev.projected.bronze ? `${ev.projected.bronze.name}${ev.projected.bronze.isHost ? ' (Host)' : ''}` : 'TBD')}
                </div>
                ${ev.projected.bronze && ev.projected.bronze.athlete ? `<div style="font-size:0.8rem; color:#94a3b8; font-weight:600; margin-top:2px;">${ev.projected.bronze.name}${ev.projected.bronze.isHost ? ' (Host)' : ''}</div>` : ''}
                <div style="font-size:0.75rem; color:#f59e0b; margin-top:8px;">
                  ${ev.projected.bronze && ev.projected.bronze.bronzeProb ? `${ev.projected.bronze.bronzeProb} Bronze Probability` : ''}
                </div>
              </div>
            `}
          </div>
        </div>
      `;
    }

    // Contender field rankings for this specific event
    const rankingsList = Array.isArray(ev.rankings) ? ev.rankings : [];
    const sortedRankings = [...rankingsList].sort((a, b) => {
      return parseStatNumber(getProb(b, ['gold', 'gold_prob', 'gold_pct', 'p_gold'])) - 
             parseStatNumber(getProb(a, ['gold', 'gold_prob', 'gold_pct', 'p_gold']));
    });

    let contenderFieldHtml = '';
    if (sortedRankings.length > 0) {
      contenderFieldHtml = `
        <div style="margin-top:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; flex-wrap:wrap; gap:6px;">
            <div style="font-size:0.82rem; font-weight:700; color:#f8fafc; display:flex; align-items:center; gap:6px;">
              <span>📊</span> <span>Contender Field & Win Probabilities (Pre-Tournament Model)</span>
            </div>
            <div style="font-size:0.7rem; color:#94a3b8; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px;">
              Historical Simulation • Confirmed 2026 Participants
            </div>
          </div>
          <div class="medal-comp-wrap">
            <table class="medal-comp-table">
              <thead>
                <tr style="background:rgba(0,0,0,0.3); font-size:0.74rem;">
                  <th style="text-align:left; padding-left:0.75rem; width:${isConcluded ? '28%' : '34%'};"># Contender</th>
                  ${isConcluded ? `<th style="color:#38bdf8; width:18%;">Actual Finish</th>` : ''}
                  <th style="color:#facc15; width:${isConcluded ? '11%' : '13%'};">🥇 Gold %</th>
                  <th style="color:#cbd5e1; width:${isConcluded ? '11%' : '13%'};">🥈 Silver %</th>
                  <th style="color:#f59e0b; width:${isConcluded ? '11%' : '13%'};">🥉 Bronze %</th>
                  <th style="color:#38bdf8; font-weight:700; width:${isConcluded ? '11%' : '13%'};">🏅 Podium %</th>
                  <th style="width:${isConcluded ? '10%' : '14%'};">Odds Distribution</th>
                </tr>
              </thead>
              <tbody>
                ${sortedRankings.map((c, idx) => {
                  const athleteName = c.athlete || c.player || '';
                  const rawTeam = c.team || c.country || c.name || 'Unknown';
                  const team = formatTeamDisplayName(rawTeam.replace(/\(host\)/gi, '').trim());
                  const isHost = rawTeam.toLowerCase().includes('host');

                  const gold = parseStatNumber(getProb(c, ['gold', 'gold_prob', 'gold_pct', 'p_gold']));
                  const silver = parseStatNumber(getProb(c, ['silver', 'silver_prob', 'silver_pct', 'p_silver']));
                  const bronze = parseStatNumber(getProb(c, ['bronze', 'bronze_prob', 'bronze_pct', 'p_bronze']));
                  const rawTot = getProb(c, ['podium', 'total', 'podium_prob']);
                  const total = rawTot ? parseStatNumber(rawTot) : (gold + silver + bronze);

                  return `
                    <tr>
                      <td style="text-align:left; padding-left:0.75rem; font-weight:600;">
                        <span style="display:inline-block; width:16px; color:#94a3b8; font-size:0.75rem;">${idx + 1}</span>
                        <span>${getFlagEmoji(team)}</span>
                        <span style="color:#f8fafc; margin-left:3px;">
                          ${athleteName ? `<strong>${athleteName}</strong> <span style="color:#94a3b8; font-weight:400;">(${team})</span>` : `<strong>${team}</strong>`}${isHost ? ' (Host)' : ''}
                        </span>
                      </td>
                      ${isConcluded ? `
                        <td style="font-size:0.74rem; font-weight:600;">
                          ${c.actualFinish ? `<span style="color:${c.actualFinish.badgeColor}; background:${c.actualFinish.badgeBg}; border:1px solid ${c.actualFinish.badgeBorder}; padding:2px 7px; border-radius:4px; white-space:nowrap;">${c.actualFinish.shortText}</span>` : '<span style="color:#64748b;">--</span>'}
                        </td>
                      ` : ''}
                      <td style="font-family:monospace; font-weight:${gold > 0 ? '700' : '400'}; color:#facc15;">${gold}%</td>
                      <td style="font-family:monospace; color:#cbd5e1;">${silver}%</td>
                      <td style="font-family:monospace; color:#f59e0b;">${bronze}%</td>
                      <td style="font-family:monospace; font-weight:700; color:#38bdf8;">${total}%</td>
                      <td style="padding:0.6rem 0.5rem;">
                        <div style="height:6px; width:100%; background:rgba(255,255,255,0.06); border-radius:999px; overflow:hidden; display:flex;">
                          <div style="width:${gold}%; background:#eab308;"></div>
                          <div style="width:${silver}%; background:#94a3b8;"></div>
                          <div style="width:${bronze}%; background:#d97706;"></div>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    const singleEventHtml = `
      <div style="margin-bottom:0.85rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.3rem;">${ev.icon || '🏅'}</span>
          <div>
            <div style="font-size:0.95rem; font-weight:800; color:#f8fafc;">${ev.name}</div>
            <div style="font-size:0.72rem; color:#94a3b8;">${ev.type === 'individual' ? 'Individual Competition' : 'Team Tournament'} • Asian Games 2026</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          ${accuracyBadge}
          ${statusBadge}
          <button onclick="setPredictionsSubView('table')" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color:#38bdf8; padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer;" onmouseover="this.style.background='rgba(56,189,248,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">
            ← Full Medal Table
          </button>
        </div>
      </div>

      ${podiumSectionHtml}

      ${contenderFieldHtml}

      <!-- Bottom navigation between events -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:1.25rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.06); flex-wrap:wrap; gap:8px;">
        <button onclick="setPredictionsSubView('table')" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:#94a3b8; padding:6px 14px; border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer;">
          ← Return to Full Medal Table
        </button>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${analytics.events.filter(e => e.id !== ev.id).map(otherEv => `
            <button onclick="setPredictionsSubView('event_${otherEv.id}')" style="background:rgba(37,99,235,0.12); border:1px solid rgba(37,99,235,0.3); color:#38bdf8; padding:6px 12px; border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer;">
              Go to ${otherEv.shortName || otherEv.name} →
            </button>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = `${pillsHeader}${singleEventHtml}`;
    return;
  }

  // --- SUBVIEW 3: DIVISION ODDS (CRASH-PROOF & MULTI-GENDER) ---
  const sourceData = currentGender === 'women' ? womenPreds : menPreds;
  let rawList = [];
  if (Array.isArray(sourceData)) {
    rawList = sourceData;
  } else if (sourceData && typeof sourceData === 'object') {
    if (Array.isArray(sourceData[currentGender])) {
      rawList = sourceData[currentGender];
    } else if (Array.isArray(sourceData.rankings)) {
      rawList = sourceData.rankings;
    } else if (Array.isArray(sourceData.predictions)) {
      rawList = sourceData.predictions;
    } else if (Array.isArray(sourceData.events) && sourceData.events[0]) {
      rawList = sourceData.events[0].rankings || sourceData.events[0].predictions || [];
    } else {
      const arrKey = Object.keys(sourceData).find(k => Array.isArray(sourceData[k]));
      if (arrKey) rawList = sourceData[arrKey];
    }
  }

  const oddsHeaderHtml = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:1rem;">
      <button onclick="setPredictionsSubView('table')" style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:#38bdf8; padding:5px 12px; border-radius:6px; font-size:0.75rem; font-weight:600; cursor:pointer;">
        ← Back to Full Medal Table
      </button>
      <div style="display:inline-flex; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:2px; gap:2px;">
        <button style="padding:4px 10px; font-size:0.72rem; font-weight:600; border-radius:6px; border:none; cursor:pointer; transition:all 0.15s; background:${currentGender === 'men' ? '#3b82f6' : 'transparent'}; color:${currentGender === 'men' ? '#fff' : '#94a3b8'};" onclick="setDivisionOddsGender('men')">👨 Men's Division</button>
        <button style="padding:4px 10px; font-size:0.72rem; font-weight:600; border-radius:6px; border:none; cursor:pointer; transition:all 0.15s; background:${currentGender === 'women' ? '#3b82f6' : 'transparent'}; color:${currentGender === 'women' ? '#fff' : '#94a3b8'};" onclick="setDivisionOddsGender('women')">👩 Women's Division</button>
      </div>
    </div>
  `;

  if (!rawList || rawList.length === 0) {
    container.innerHTML = `${pillsHeader}${oddsHeaderHtml}<div style="text-align:center; padding:3rem 1rem; color:#94a3b8; background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px;">No simulation models currently available for this division.</div>`;
    return;
  }

  const sorted = [...rawList].sort((a, b) => {
    return parseStatNumber(getProb(b, ['gold', 'gold_prob', 'gold_pct', 'p_gold'])) - 
           parseStatNumber(getProb(a, ['gold', 'gold_prob', 'gold_pct', 'p_gold']));
  });

  const cardsHtml = `
    ${oddsHeaderHtml}
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
      ${sorted.map(p => {
        const athleteName = p.athlete || p.player || '';
        const rawTeam = p.team || p.country || p.name || 'Unknown';
        const team = formatTeamDisplayName(rawTeam.replace(/\(host\)/gi, '').trim());
        const isHost = rawTeam.toLowerCase().includes('host');

        const divEv = analytics.events.find(e => e.gender === currentGender) || analytics.events[0];
        const divMatches = currentGender === 'women' ? womenMatches : menMatches;
        const trackerRaw = currentGender === 'women' ? window.appData?.womenTrackerRaw : window.appData?.menTrackerRaw;
        const pFinish = p.actualFinish || resolveActualFinish(p, divEv, divMatches, trackerRaw);

        const gold = parseStatNumber(getProb(p, ['gold', 'gold_prob', 'gold_pct', 'p_gold']));
        const silver = parseStatNumber(getProb(p, ['silver', 'silver_prob', 'silver_pct', 'p_silver']));
        const bronze = parseStatNumber(getProb(p, ['bronze', 'bronze_prob', 'bronze_pct', 'p_bronze']));
        const rawTotal = getProb(p, ['podium', 'total', 'podium_prob']);
        const total = rawTotal ? parseStatNumber(rawTotal) : (gold + silver + bronze);

        const finishBadge = pFinish ? `
          <span style="color:${pFinish.badgeColor}; background:${pFinish.badgeBg}; border:1px solid ${pFinish.badgeBorder}; font-size:0.68rem; font-weight:700; padding:1px 6px; border-radius:4px; margin-left:6px; white-space:nowrap;">Actual: ${pFinish.shortText}</span>
        ` : '';

        const titleHtml = athleteName ? `
          <div>
            <div style="font-weight:700; font-size:0.95rem; color:#f8fafc; display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
              <span>${getFlagEmoji(team)}</span> <span>${athleteName}</span>
              ${finishBadge}
            </div>
            <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">
              ${team}${isHost ? ' (Host)' : ''} ${p.rank ? `• Rank #${p.rank}` : ''}
            </div>
          </div>
        ` : `
          <div style="font-weight:700; font-size:1rem; display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
            <span>${getFlagEmoji(team)}</span> <span>${team}${isHost ? ' (Host)' : ''}</span>
            ${finishBadge}
          </div>
        `;

        return `
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem;">
              ${titleHtml}
              <span style="font-size:0.75rem; color:#38bdf8; font-weight:700; white-space:nowrap; margin-left:0.5rem;">Podium: ${total}%</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.4rem;">
              <span>🥇 Gold: <strong>${gold}%</strong></span>
              <span>🥈 Silver: <strong>${silver}%</strong></span>
              <span>🥉 Bronze: <strong>${bronze}%</strong></span>
            </div>
            <div style="height:6px; width:100%; background:rgba(255,255,255,0.06); border-radius:999px; overflow:hidden; display:flex;">
              <div style="width:${gold}%; background:#eab308;"></div>
              <div style="width:${silver}%; background:#94a3b8;"></div>
              <div style="width:${bronze}%; background:#d97706;"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  container.innerHTML = `${pillsHeader}${cardsHtml}`;
}

// --- Modern Pentathlon Calibration Engine (Option 1: Cutoff & Prior Accuracy) ---
function renderPentathlonCalibration(container, predictions, matches) {
  if (!matches || matches.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:3rem 1rem; color:#94a3b8;">Awaiting tournament sessions.</div>`;
    return;
  }

  // Comprehensive Pre-tournament seed priors for Men & Women
  const SEED_PRIORS = {
    // Men's Priors
    'JUN WOONGTAE': 1, 'JUN WOONG TAE': 1, 'SATO TAISHU': 2, 'SEO CHANGWAN': 3,
    'LUO SHUAI': 4, 'MA YUANG': 5, 'CHEN BAILIANG': 6, 'LEE JONGHYEON': 7,
    'TOMITA YOUSUKE': 8, 'SEKIGAWA KAZUAKI': 9, 'LI LIUCHANG': 10,
    'ABDRAIMOV TEMIRLAN': 11, 'KIM YOUNGHA': 12, 'VARYOKHIN TIKHON': 13,
    'CHUVASHOV LEV': 14, 'STADNIK KIRILL': 15, 'TRETYAKOV DMITRIY': 16,
    'GERMAN SAMUEL': 17, 'YOHUANG PHURIT': 18, 'COMALING MICHAEL VER ANTON': 19,
    'MATULATUWA SAMUEL': 20,

    // Women's Priors
    'SEONG SEUNGMIN': 1, 'SEONG SEUNG MIN': 1, 'ZHANG MINGYU': 2, 'KIM SUNWOO': 3,
    'WU XIYAO': 4, 'UCHIDA MISAKI': 5, 'BIAN YUFEI': 6, 'JANG HAEUN': 7,
    'SAITO AYUMU': 8, 'SUZUKI YURI': 9, 'POTAPENKO YELENA': 10, 'OTA NATSUMI': 11,
    'XIE LINZHI': 12, 'AKHMETOVA ANASTASSIYA': 13, 'KIM SOEUN': 14,
    'KAHRAMONOVA MEHRINISO': 15, 'YAKOVLEVA SOFYA': 16, 'ARANZADO SHYRA MAE': 17,
    'ARBILON PRINCESS HONEY': 18, 'PAISANSRISIN PARITA': 19, 'WAHYUNI SRI': 20,
    'FU JING': 4, 'MENG XIN': 5, 'SHIN SUMIN': 6, 'KIM UNJU': 7, 'YANO YUHO': 8,
    'PETROVA YULIANA': 11, 'KAZBEKOVA AYANA': 12, 'CHSHEDROVA DIANA': 13,
    'ABZALOVA SAMIRA': 14, 'BANGUN CAROLINE': 17
  };

  function normalizeName(str) {
    return (str || '').toUpperCase().replace(/[^A-Z]/g, '').trim();
  }

  function getAthletePredictedRank(name, country) {
    const norm = normalizeName(name);
    if (!norm) return 99;

    for (const [key, rank] of Object.entries(SEED_PRIORS)) {
      if (normalizeName(key) === norm) return rank;
    }

    if (Array.isArray(predictions)) {
      for (let i = 0; i < predictions.length; i++) {
        const p = predictions[i];
        const aName = p.athlete || p.player || p.name;
        if (aName && normalizeName(aName) === norm) {
          return p.rank || (i + 1);
        }
      }
    }

    return 24; // Unseeded default
  }

  // Filter completed sessions
  const finishedSessions = matches.filter(s => s.status === 'Official' || s.status === 'Finished');
  const hasFinished = finishedSessions.length > 0;

  function getGroupLeaders(grpLetter) {
    const sessions = finishedSessions.filter(s => {
      const p = (s.round || s.phase || '') + ' ' + (s.group || '');
      return p.toLowerCase().includes(`group ${grpLetter.toLowerCase()}`);
    });
    if (sessions.length === 0) return [];

    const athletes = {};
    sessions.forEach(s => {
      (s.competitors || []).forEach(c => {
        const name = c.name || c.athlete;
        if (!name) return;
        if (!athletes[name]) {
          athletes[name] = { name, country: c.country || '', totalPts: 0 };
        }
        athletes[name].totalPts += (parseInt(c.raw, 10) || parseInt(c.points, 10) || 0);
      });
    });
    return Object.values(athletes).sort((a, b) => b.totalPts - a.totalPts);
  }

  const grpALeaders = getGroupLeaders('A');
  const grpBLeaders = getGroupLeaders('B');

  const topQualifiers = [];
  if (grpALeaders.length > 0) {
    grpALeaders.slice(0, 9).forEach((a, idx) => topQualifiers.push({ ...a, actualRank: idx + 1, group: 'A' }));
  }
  if (grpBLeaders.length > 0) {
    grpBLeaders.slice(0, 9).forEach((a, idx) => topQualifiers.push({ ...a, actualRank: idx + 1, group: 'B' }));
  }

  const eliminatedAthletes = [];
  if (grpALeaders.length > 9) {
    grpALeaders.slice(9).forEach((a, idx) => eliminatedAthletes.push({ ...a, actualRank: idx + 10, group: 'A' }));
  }
  if (grpBLeaders.length > 9) {
    grpBLeaders.slice(9).forEach((a, idx) => eliminatedAthletes.push({ ...a, actualRank: idx + 10, group: 'B' }));
  }

  let correctFavorites = 0;
  let evaluatedSpots = 0;
  const upsetEvents = [];

  if (topQualifiers.length > 0) {
    evaluatedSpots = topQualifiers.length; // 18 qualifiers total

    topQualifiers.forEach(a => {
      const projRank = getAthletePredictedRank(a.name, a.country);
      
      // If expected finalist (projRank <= 18) or default unseeded (#24), count towards accuracy
      if (projRank <= 18 || projRank === 24) {
        correctFavorites++;
      } else {
        // GREEN UPSET: True longshot (proj rank 19+) who broke into Top 9
        upsetEvents.push({
          type: 'underdog_qualified',
          name: a.name,
          country: a.country,
          projRank: projRank,
          actualRank: a.actualRank,
          group: a.group,
          pts: a.totalPts
        });
      }
    });

    // Check for shock exits among strictly tracked seeds (rank 1-12)
    ['A', 'B'].forEach(grp => {
      const grpElims = eliminatedAthletes.filter(e => e.group === grp);
      const bumpedFavorites = grpElims
        .filter(e => {
          const r = getAthletePredictedRank(e.name, e.country);
          return r <= 12 && r !== 24; // Only tracked top-tier favorites who missed the cut
        })
        .sort((x, y) => getAthletePredictedRank(x.name, x.country) - getAthletePredictedRank(y.name, y.country));

      bumpedFavorites.forEach(f => {
        upsetEvents.push({
          type: 'favorite_eliminated',
          name: f.name,
          country: f.country,
          projRank: getAthletePredictedRank(f.name, f.country),
          actualRank: f.actualRank,
          group: f.group,
          pts: f.totalPts
        });
      });
    });
  }

  const accuracy = evaluatedSpots > 0 ? Math.round((correctFavorites / evaluatedSpots) * 100) : '--';
  const finalistsCount = topQualifiers.length > 0 ? `${topQualifiers.length} / 18` : (hasFinished ? `${finishedSessions.length} Sessions` : '0 / 18');
  const upsetsCount = upsetEvents.length;

  container.innerHTML = `
    <!-- Metric Cards -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center;">
        <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.25rem;">Favorite Accuracy</div>
        <div style="font-size:1.6rem; font-weight:800; color:#38bdf8;">${accuracy}${accuracy !== '--' ? '%' : ''}</div>
        <div style="font-size:0.7rem; color:#94a3b8;">${correctFavorites}/${evaluatedSpots} favorites holding cut</div>
      </div>
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center;">
        <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.25rem;">Finalists Decided</div>
        <div style="font-size:1.6rem; font-weight:800; color:#4ade80;">${finalistsCount}</div>
        <div style="font-size:0.7rem; color:#94a3b8;">Top 9 advance from Grp A & B</div>
      </div>
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center;">
        <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.25rem;">Cutoff Upsets</div>
        <div style="font-size:1.6rem; font-weight:800; color:#f87171;">${upsetsCount}</div>
        <div style="font-size:0.7rem; color:#94a3b8;">Underdog qualifiers / exits</div>
      </div>
    </div>

    <!-- Cutoff Upset Tracker Feed -->
    <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
      <div style="font-size:0.85rem; font-weight:700; margin-bottom:0.75rem; color:#38bdf8; display:flex; justify-content:space-between; align-items:center;">
        <span>🎯 Qualification Cutoff & Prior Drift Tracker</span>
        <span style="font-size:0.72rem; color:#94a3b8;">Top 9 Cut Line</span>
      </div>

      ${upsetEvents.length > 0 ? upsetEvents.map(u => {
        const flag = getFlagEmoji(u.country);
        const isUnderdog = u.type === 'underdog_qualified';

        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.85rem;">
            <div>
              <div style="display:flex; align-items:center; gap:0.4rem;">
                <span style="color:${isUnderdog ? '#4ade80' : '#f87171'}; font-size:0.9rem;">${isUnderdog ? '🟢' : '🔴'}</span>
                <span>${flag}</span>
                <span style="font-weight:700; color:#f8fafc;">${u.name}</span>
              </div>
              <div style="font-size:0.72rem; color:#94a3b8; margin-left:1.4rem;">
                ${isUnderdog 
                  ? `Proj Seed #${u.projRank} ➔ Broke into Semi Grp ${u.group} #${u.actualRank} (Q)` 
                  : `Seeded Favorite #${u.projRank} ➔ Slipped to Semi Grp ${u.group} #${u.actualRank} (Missed Cut)`}
              </div>
            </div>
            <span style="font-family:monospace; font-weight:700; font-size:0.85rem; color:${isUnderdog ? '#4ade80' : '#f87171'};">
              ${u.pts.toLocaleString()} pts
            </span>
          </div>
        `;
      }).join('') : `
        <div style="text-align:center; padding:1.5rem 1rem; color:#94a3b8; font-size:0.8rem; line-height:1.45;">
          ${hasFinished 
            ? "✅ All projected favorites held expected qualification positions inside the Top 9 cut line."
            : "⏳ Semifinal sessions are scheduled. As Group A and Group B conclude, qualification cutoff accuracy and underdog breakouts will track here live."}
        </div>
      `}
    </div>
  `;
}

// --- Calibration View (Universal Router) ---
function renderCalibrationView(container, predictions, matches) {
  const activeSport = (window.currentSport || (typeof currentSport !== 'undefined' ? currentSport : 'basketball')).toLowerCase();
  const isPentathlon = activeSport.includes('pentathlon');

  // Modern Pentathlon: Route to Option 1 Cutoff & Qualifier Calibration
  if (isPentathlon) {
    renderPentathlonCalibration(container, predictions, matches);
    return;
  }

  // Check if sport engine provides a custom calibration renderer
  const engine = window.SPORT_ENGINES && window.SPORT_ENGINES[activeSport];
  if (engine && typeof engine.renderCalibration === 'function') {
    engine.renderCalibration(container, predictions, matches);
    return;
  }

  // STANDARD HEAD-TO-HEAD MATCH CALIBRATION (Basketball, Football, Volleyball, Cricket)
  if (!matches || matches.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:3rem 1rem; color:#94a3b8;">Awaiting completed matches.</div>`;
    return;
  }

  const parsed = matches.map(m => parseMatchData(m));
  const finished = parsed.filter(m => m.isFinished && m.s1 !== '-' && m.s2 !== '-');

  let correctFavorites = 0;
  let evaluatedMatches = 0;
  const upsetLogs = [];

  const rankMap = {};
  (predictions || []).forEach((p, idx) => {
    const rawName = p.team || p.country || p.name || '';
    const cleaned = cleanTeamName(rawName);
    if (cleaned) rankMap[cleaned] = idx + 1;
  });

  finished.forEach(m => {
    const s1 = parseScoreValue(m.s1);
    const s2 = parseScoreValue(m.s2);

    let actualWinner = '';
    let actualLoser = '';

    // 1. If match object explicitly records official winner, trust it
    if (m.winner && typeof m.winner === 'string' && m.winner.trim()) {
      const wClean = cleanTeamName(m.winner);
      if (wClean === cleanTeamName(m.t1)) {
        actualWinner = m.t1;
        actualLoser = m.t2;
      } else if (wClean === cleanTeamName(m.t2)) {
        actualWinner = m.t2;
        actualLoser = m.t1;
      } else {
        actualWinner = m.winner.trim();
        actualLoser = (wClean === cleanTeamName(m.t1)) ? m.t2 : m.t1;
      }
    }
    // 2. Otherwise determine winner by parsed scores
    else if (!isNaN(s1) && !isNaN(s2)) {
      if (s1 > s2) {
        actualWinner = m.t1;
        actualLoser = m.t2;
      } else if (s2 > s1) {
        actualWinner = m.t2;
        actualLoser = m.t1;
      } else {
        return; // Tie / draw
      }
    } else {
      return; // Cannot determine winner
    }

    const c1 = cleanTeamName(m.t1);
    const c2 = cleanTeamName(m.t2);
    const r1 = rankMap[c1] || 99;
    const r2 = rankMap[c2] || 99;

    if (r1 !== r2) {
      evaluatedMatches++;
      const fav = r1 < r2 ? m.t1 : m.t2;
      if (cleanTeamName(actualWinner) === cleanTeamName(fav)) {
        correctFavorites++;
      } else {
        const displayScore = (m.s1 !== '-' && m.s2 !== '-') ? `${m.s1} - ${m.s2}` : (m.score || '');
        upsetLogs.push({ winner: actualWinner, loser: actualLoser, score: displayScore });
      }
    }
  });

  const accuracy = evaluatedMatches > 0 ? Math.round((correctFavorites / evaluatedMatches) * 100) : '--';
  const skippedCount = finished.length - evaluatedMatches;

  const medalKpi = typeof extractSportMedalAnalytics === 'function' && window.appData
    ? extractSportMedalAnalytics(activeSport, window.appData.menMatches || [], window.appData.womenMatches || [], window.appData.menPredictions || [], window.appData.womenPredictions || []).kpi
    : null;
  const medalAccDisplay = medalKpi && medalKpi.accuracyPct != null ? `${medalKpi.accuracyPct}%` : '--%';
  const medalAccSub = medalKpi && medalKpi.decidedMedals > 0 
    ? `${medalKpi.exactHits}/${medalKpi.decidedMedals} exact medals`
    : (medalKpi ? `${medalKpi.decidedMedals}/${medalKpi.totalMedalsInSport} decided` : 'Medals');

  container.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center;">
        <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.25rem;">Favorite Accuracy</div>
        <div style="font-size:1.6rem; font-weight:800; color:#38bdf8;">${accuracy}%</div>
        <div style="font-size:0.7rem; color:#94a3b8;">${correctFavorites}/${evaluatedMatches} correct</div>
      </div>
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center; cursor:pointer;" onclick="setTab('predictions')">
        <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.25rem;">Medal Accuracy</div>
        <div style="font-size:1.6rem; font-weight:800; color:#facc15;">${medalAccDisplay}</div>
        <div style="font-size:0.7rem; color:#38bdf8; text-decoration:underline;">${medalAccSub} →</div>
      </div>
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center;">
        <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.25rem;">Completed Matches</div>
        <div style="font-size:1.6rem; font-weight:800; color:#4ade80;">${finished.length}</div>
        <div style="font-size:0.7rem; color:#94a3b8;">${evaluatedMatches} evaluated (${skippedCount} neutral)</div>
      </div>
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center;">
        <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.25rem;">Upsets Recorded</div>
        <div style="font-size:1.6rem; font-weight:800; color:#f87171;">${upsetLogs.length}</div>
        <div style="font-size:0.7rem; color:#94a3b8;">Underdog victories</div>
      </div>
    </div>

    ${upsetLogs.length > 0 ? `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
        <div style="font-size:0.85rem; font-weight:700; margin-bottom:0.75rem; color:#f87171;">⚡ Upset Tracker</div>
        ${upsetLogs.map(u => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.85rem;">
            <div>
              <span style="color:#4ade80; font-weight:700;">${getFlagEmoji(u.winner)} ${u.winner}</span>
              <span style="color:#94a3b8;"> def. </span>
              <span style="color:#94a3b8;">${getFlagEmoji(u.loser)} ${u.loser}</span>
            </div>
            <span style="font-family:monospace; font-weight:700;">${u.score}</span>
          </div>
        `).join('')}
      </div>
    ` : evaluatedMatches > 0 ? `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(74,222,128,0.2); border-radius:10px; padding:1rem; text-align:center; color:#4ade80; font-size:0.85rem;">
        ✅ All projected favorites won their matches (${correctFavorites}/${evaluatedMatches}) with 0 upsets recorded.
      </div>
    ` : finished.length === 0 ? `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1.5rem; text-align:center; color:#94a3b8; font-size:0.85rem; line-height:1.5;">
        ⏳ Tournament matches are scheduled. As matches conclude, calibration accuracy and upset tracking will update here live.
      </div>
    ` : `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1.5rem; text-align:center; color:#94a3b8; font-size:0.85rem; line-height:1.5;">
        ℹ️ Completed matches featured unranked or neutral matchups without an established favorite.
      </div>
    `}
  `;
}

// --- Global App Navigation & State Fallbacks ---
function setTab(tabName) {
  if (typeof window !== 'undefined' && typeof window.setTab === 'function' && window.setTab !== setTab) {
    window.setTab(tabName);
  } else if (typeof renderView === 'function') {
    renderView();
  }
}

function setGender(gender) {
  if (typeof window !== 'undefined' && typeof window.setGender === 'function' && window.setGender !== setGender) {
    window.setGender(gender);
  } else if (typeof renderView === 'function') {
    renderView();
  }
}

function handleSportChange(sportKey) {
  window.currentSport = sportKey;
  localStorage.setItem('app_sport', sportKey);
  if (typeof window !== 'undefined' && typeof window.handleSportChange === 'function' && window.handleSportChange !== handleSportChange) {
    window.handleSportChange(sportKey);
  } else if (typeof loadAllData === 'function') {
    loadAllData();
  }
}
