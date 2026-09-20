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

  const grp = s.match(/(?:group|pool)\s+([a-z0-9]+)/i);
  const g = s.match(/(?:game|g)\s*(\d+)/i);

  if (grp && grp[1].toLowerCase() !== 'stage') {
    const groupLetter = grp[1].toUpperCase();
    return g ? `Group ${groupLetter} • Game ${g[1]}` : `Group ${groupLetter}`;
  }

  return s;
}

function parseStatNumber(val) {
  if (val == null) return 0;
  if (typeof val === 'object') {
    val = val.pct || val.prob || val.value || val.val || val.rate || 0;
  }
  if (typeof val === 'string') {
    val = val.replace('%', '').trim();
  }
  let num = parseFloat(val);
  if (isNaN(num)) return 0;
  if (num > 0 && num <= 1) {
    num = num * 100;
  }
  return Math.round(num);
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

    return groupKeys.map(grpKey => {
      const teams = Object.values(groups[grpKey]).sort((a, b) => b.pts - a.pts || b.diff - a.diff || b.pf - a.pf);

      return `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; margin-bottom:1.5rem; overflow-x:auto;">
          <div style="padding:0.75rem 1rem; font-weight:700; font-size:0.9rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
            <span>${grpKey}</span>
            <span style="font-size:0.75rem; color:#94a3b8; font-weight:400;">Top 2 + best 2 3rd advance</span>
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
              ${teams.map((t, idx) => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.03); background:${idx < 2 ? 'rgba(59,130,246,0.04)' : 'transparent'};">
                  <td style="padding:0.6rem 0.5rem; text-align:left; font-weight:${idx < 2 ? '700' : '400'};">
                    <span style="display:inline-block; width:16px; color:${idx < 2 ? '#38bdf8' : 'inherit'};">${idx + 1}</span>
                    ${getFlagEmoji(t.name)}${t.name}
                  </td>
                  <td style="padding:0.6rem 0.3rem;">${t.gp}</td>
                  <td style="padding:0.6rem 0.3rem; color:#4ade80;">${t.w}</td>
                  <td style="padding:0.6rem 0.3rem; color:#f87171;">${t.l}</td>
                  <td style="padding:0.6rem 0.3rem; font-family:monospace; color:${t.diff > 0 ? '+'+t.diff : t.diff};">${t.diff > 0 ? '+' + t.diff : t.diff}</td>
                  <td style="padding:0.6rem 0.5rem; font-weight:700; color:#38bdf8;">${t.pts}</td>
                </tr>
              `).join('')}
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

// --- Sub-View State Handlers ---
let activeMatchesSubView = 'schedule';
let activePredictionsSubView = 'table';

function setMatchesSubView(subView) {
  activeMatchesSubView = subView;
  const container = document.getElementById('content-cards');
  if (container) {
    const matches = currentGender === 'men' ? appData.menMatches : appData.womenMatches;
    renderMatchesView(container, matches);
  }
}

function setPredictionsSubView(subView) {
  activePredictionsSubView = subView;
  const container = document.getElementById('content-cards');
  if (container) {
    renderPredictionsView(container, appData.menPredictions, appData.womenPredictions, currentGender);
  }
}

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

// --- Predictions & Dynamic Medal Table (All Sports) ---
function renderPredictionsView(container, menPreds, womenPreds, currentGender) {
  const activeSport = (window.currentSport || (typeof currentSport !== 'undefined' ? currentSport : 'basketball')).toLowerCase();
  const isPentathlon = activeSport.includes('pentathlon');

  const pillsHeader = `
    <div style="display:flex; background:rgba(15,23,42,0.6); padding:3px; border-radius:10px; border:1px solid rgba(255,255,255,0.08); margin-bottom:1.25rem; gap:3px;">
      <button style="flex:1; padding:7px 4px; font-size:0.75rem; font-weight:600; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${activePredictionsSubView === 'table' ? '#2563eb' : 'transparent'}; color:${activePredictionsSubView === 'table' ? '#fff' : '#94a3b8'};" onclick="setPredictionsSubView('table')">🏅 Projected Medal Table</button>
      <button style="flex:1; padding:7px 4px; font-size:0.75rem; font-weight:600; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${activePredictionsSubView === 'odds' ? '#2563eb' : 'transparent'}; color:${activePredictionsSubView === 'odds' ? '#fff' : '#94a3b8'};" onclick="setPredictionsSubView('odds')">🎯 Division Odds</button>
    </div>
  `;

  const getProb = (obj, keys) => {
    for (const k of keys) {
      if (obj && obj[k] != null && obj[k] !== '') return obj[k];
    }
    return 0;
  };

  if (activePredictionsSubView === 'table') {
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
      if (sorted[0]) res.push({ item: sorted[0], medal: 'gold' });
      if (sorted[1]) res.push({ item: sorted[1], medal: 'silver' });
      if (sorted[2]) res.push({ item: sorted[2], medal: 'bronze' });
      return res;
    };

    const tableMap = {};
    const recordMedal = (predObj, medalType) => {
      if (!predObj) return;
      const rawName = predObj.team || predObj.country || predObj.name || (typeof predObj === 'string' ? predObj : '');
      if (!rawName) return;
      const cleaned = cleanTeamName(rawName);
      const displayName = formatTeamDisplayName(rawName.replace(/\(host\)/gi, '').trim());

      if (!tableMap[cleaned]) {
        tableMap[cleaned] = { name: displayName, isHost: rawName.toLowerCase().includes('host'), gold: 0, silver: 0, bronze: 0, total: 0 };
      }
      tableMap[cleaned][medalType] += 1;
      tableMap[cleaned].total += 1;
    };

    const mData = menPreds || [];
    const wData = womenPreds || [];

    // Assemble event list dynamically for ANY sport
    let detailedEventsList = [];

    if (isPentathlon) {
      // Modern Pentathlon: 4 medal events (12 medals)
      detailedEventsList = [
        {
          name: "Men's Individual",
          type: "individual",
          rankings: [
            { rank: 1, athlete: "Jun Woong-tae", team: "Republic of Korea", gold: "45.2%", silver: "31.4%", bronze: "18.1%" },
            { rank: 2, athlete: "Taishu Sato", team: "Japan (Host)", gold: "35.8%", silver: "29.2%", bronze: "21.6%" },
            { rank: 3, athlete: "Luo Shuai", team: "China", gold: "14.1%", silver: "25.8%", bronze: "33.4%" },
            { rank: 4, athlete: "Temirlan Abdraimov", team: "Kazakhstan", gold: "3.4%", silver: "8.2%", bronze: "15.1%" }
          ]
        },
        {
          name: "Men's Team",
          type: "team",
          rankings: [
            { rank: 1, team: "Republic of Korea", gold: "68.0%", silver: "24.5%", bronze: "6.5%" },
            { rank: 2, team: "China", gold: "26.0%", silver: "52.0%", bronze: "18.0%" },
            { rank: 3, team: "Japan (Host)", gold: "6.0%", silver: "23.5%", bronze: "65.5%" },
            { rank: 4, team: "Kazakhstan", gold: "0.0%", silver: "0.0%", bronze: "10.0%" }
          ]
        },
        {
          name: "Women's Individual",
          type: "individual",
          rankings: [
            { rank: 1, athlete: "Seong Seung-min", team: "Republic of Korea", gold: "50.8%", silver: "29.4%", bronze: "14.5%" },
            { rank: 2, athlete: "Zhang Mingyu", team: "China", gold: "37.6%", silver: "39.1%", bronze: "20.4%" },
            { rank: 3, athlete: "Misaki Uchida", team: "Japan (Host)", gold: "7.5%", silver: "18.2%", bronze: "36.8%" },
            { rank: 4, athlete: "Yelena Potapenko", team: "Kazakhstan", gold: "2.6%", silver: "7.5%", bronze: "15.8%" }
          ]
        },
        {
          name: "Women's Team",
          type: "team",
          rankings: [
            { rank: 1, team: "China", gold: "51.0%", silver: "44.0%", bronze: "4.5%" },
            { rank: 2, team: "Republic of Korea", gold: "46.0%", silver: "49.0%", bronze: "4.5%" },
            { rank: 3, team: "Japan (Host)", gold: "3.0%", silver: "7.0%", bronze: "85.0%" },
            { rank: 4, team: "Kazakhstan", gold: "0.0%", silver: "0.0%", bronze: "6.0%" }
          ]
        }
      ];
    } else {
      // Team Sports (Basketball, Volleyball, Football): 2 medal events (6 medals)
      const menLabel = activeSport === 'football' ? "Men's Tournament (U-23)" : "Men's Tournament";
      const womenLabel = activeSport === 'football' ? "Women's Tournament (Senior)" : "Women's Tournament";

      detailedEventsList = [
        { name: menLabel, type: "team", rankings: mData },
        { name: womenLabel, type: "team", rankings: wData }
      ];
    }

    // Tally medals across all active events
    detailedEventsList.forEach(ev => {
      projectPodium(ev.rankings).forEach(res => recordMedal(res.item, res.medal));
    });

    const sortedTable = Object.values(tableMap).sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || b.total - a.total);

    if (sortedTable.length === 0) {
      container.innerHTML = `${pillsHeader}<div style="text-align:center; padding:3rem 1rem; color:#94a3b8;">No prediction models available to construct medal table.</div>`;
      return;
    }

    const totalGold = sortedTable.reduce((sum, t) => sum + t.gold, 0);
    const totalSilver = sortedTable.reduce((sum, t) => sum + t.silver, 0);
    const totalBronze = sortedTable.reduce((sum, t) => sum + t.bronze, 0);
    const grandTotal = totalGold + totalSilver + totalBronze;
    const eventCount = grandTotal / 3;

    const subtitleLabel = eventCount > 2
      ? `across ${eventCount} medal events`
      : (activeSport === 'football' ? "Men's U-23 & Women's Senior" : "Men's & Women's Divisions");

    function formatContender(item, isIndiv, isGold) {
      if (!item) return '-';
      const countryRaw = item.team || item.country || item.name || '';
      const countryName = formatTeamDisplayName(countryRaw.replace(/\(host\)/gi, '').trim());
      const flag = getFlagEmoji(countryName);
      const isHost = countryRaw.toLowerCase().includes('host');
      const hostSuffix = isHost ? ' (Host)' : '';
      const goldProb = isGold ? (item.gold || item.gold_prob || '') : '';

      if (isIndiv) {
        const athleteName = item.athlete || item.player || '';
        if (athleteName) {
          return `
            <div>
              <div style="font-weight:700; color:#f8fafc;">${athleteName}</div>
              <div style="font-size:0.72rem; color:#94a3b8; display:flex; align-items:center; gap:0.25rem; margin-top:1px;">
                <span>${flag}</span> <span>${countryName}${hostSuffix}</span>
                ${goldProb ? `<span style="color:#facc15; font-weight:700; margin-left:3px;">(${goldProb})</span>` : ''}
              </div>
            </div>
          `;
        }
      }

      return `
        <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;">
          <span>${flag}</span>
          <span style="font-weight:700; color:#f8fafc;">${countryName}${hostSuffix}</span>
          ${goldProb ? `<span style="color:#facc15; font-weight:700; font-size:0.75rem;">(${goldProb})</span>` : ''}
        </div>
      `;
    }

    const tableHtml = `
      <div style="margin-bottom:1rem; text-align:center; font-size:0.75rem; color:#94a3b8;">
        Projected distribution of all <strong>${grandTotal} medals</strong> (${subtitleLabel}).
      </div>

      <!-- Main Projected Medal Standings Table -->
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:center;">
          <thead>
            <tr style="color:#94a3b8; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.15);">
              <th style="padding:0.7rem 0.5rem; text-align:left;"># Nation</th>
              <th style="padding:0.7rem 0.4rem; color:#facc15;">🥇 Gold</th>
              <th style="padding:0.7rem 0.4rem; color:#cbd5e1;">🥈 Silver</th>
              <th style="padding:0.7rem 0.4rem; color:#f59e0b;">🥉 Bronze</th>
              <th style="padding:0.7rem 0.5rem; font-weight:700; color:#38bdf8;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sortedTable.map((t, idx) => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.03); background:${idx < 3 ? 'rgba(59,130,246,0.03)' : 'transparent'};">
                <td style="padding:0.65rem 0.5rem; text-align:left; font-weight:${idx < 3 ? '700' : '400'};">
                  <span style="display:inline-block; width:18px; font-weight:700; color:${idx === 0 ? '#facc15' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#f59e0b' : '#94a3b8'};">${idx + 1}</span>${getFlagEmoji(t.name)} ${t.name}${t.isHost ? ' (Host)' : ''}
                </td>
                <td style="padding:0.65rem 0.4rem; font-family:monospace; font-weight:${t.gold > 0 ? '700' : '400'}; color:#facc15;">${t.gold}</td>
                <td style="padding:0.65rem 0.4rem; font-family:monospace; color:#cbd5e1;">${t.silver}</td>
                <td style="padding:0.65rem 0.4rem; font-family:monospace; color:#f59e0b;">${t.bronze}</td>
                <td style="padding:0.65rem 0.5rem; font-family:monospace; font-weight:700; color:#38bdf8;">${t.total}</td>
              </tr>
            `).join('')}
            <tr style="border-top:1px solid rgba(255,255,255,0.12); background:rgba(0,0,0,0.25); font-weight:700; font-size:0.8rem;">
              <td style="padding:0.65rem 0.5rem; text-align:left; color:#94a3b8;">Total Medals Awarded</td>
              <td style="padding:0.65rem 0.4rem; color:#facc15;">${totalGold}</td>
              <td style="padding:0.65rem 0.4rem; color:#cbd5e1;">${totalSilver}</td>
              <td style="padding:0.65rem 0.4rem; color:#f59e0b;">${totalBronze}</td>
              <td style="padding:0.65rem 0.5rem; color:#38bdf8;">${grandTotal}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Detailed Predictions Toggle Button (All Sports) -->
      <div style="margin-top:1.25rem; text-align:center;">
        <button 
          id="btn-detailed-predictions"
          onclick="toggleDetailedPredictions()" 
          style="background:rgba(37,99,235,0.15); border:1px solid rgba(59,130,246,0.35); color:#38bdf8; padding:0.55rem 1.15rem; border-radius:20px; font-size:0.8rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.2s;"
        >
          <span>📊 Detailed Predictions</span>
          <span id="detailed-pred-arrow" style="transition:transform 0.2s; font-size:0.85rem;">▾</span>
        </button>
      </div>

      <!-- Collapsible Detailed Event-Wise Predictions View -->
      <div id="detailed-predictions-table-wrap" style="display:none; margin-top:1.25rem;">
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; overflow-x:auto;">
          <div style="padding:0.85rem 1rem; font-weight:700; font-size:0.9rem; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); display:flex; justify-content:space-between; align-items:center;">
            <span>🎯 Event-Wise Predicted Winners & Podium</span>
            <span style="font-size:0.72rem; color:#94a3b8;">Ante-Post Model</span>
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:0.82rem; text-align:left;">
            <thead>
              <tr style="color:#94a3b8; font-size:0.72rem; border-bottom:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.2);">
                <th style="padding:0.75rem 0.65rem; width:28%;">Event</th>
                <th style="padding:0.75rem 0.65rem; color:#facc15; width:34%;">🥇 Predicted Winner (Gold)</th>
                <th style="padding:0.75rem 0.5rem; color:#cbd5e1; width:20%;">🥈 Silver</th>
                <th style="padding:0.75rem 0.5rem; color:#f59e0b; width:18%;">🥉 Bronze</th>
              </tr>
            </thead>
            <tbody>
              ${detailedEventsList.map((ev, idx) => {
                const podium = projectPodium(ev.rankings);
                const goldItem = podium.find(p => p.medal === 'gold')?.item;
                const silverItem = podium.find(p => p.medal === 'silver')?.item;
                const bronzeItem = podium.find(p => p.medal === 'bronze')?.item;
                const isIndiv = ev.type === 'individual';

                return `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.04); background:${idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'};">
                    <td style="padding:0.75rem 0.65rem;">
                      <div style="font-weight:700; color:#f8fafc;">${ev.name}</div>
                      <span style="font-size:0.68rem; padding:1px 6px; border-radius:4px; font-weight:600; background:${isIndiv ? 'rgba(56,189,248,0.15); color:#38bdf8;' : 'rgba(168,85,247,0.15); color:#c084fc;'}">
                        ${isIndiv ? 'Individual' : 'Team Event'}
                      </span>
                    </td>
                    <td style="padding:0.75rem 0.65rem;">
                      ${formatContender(goldItem, isIndiv, true)}
                    </td>
                    <td style="padding:0.75rem 0.5rem;">
                      ${formatContender(silverItem, isIndiv, false)}
                    </td>
                    <td style="padding:0.75rem 0.5rem;">
                      ${formatContender(bronzeItem, isIndiv, false)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    container.innerHTML = `${pillsHeader}${tableHtml}`;
    return;
  }

  const sourceData = currentGender === 'men' ? menPreds : womenPreds;
  let preds = sourceData;
  if (sourceData && sourceData.events) {
    preds = sourceData.events[0]?.predictions || sourceData.events[0]?.data || sourceData.events[0]?.rankings || [];
  }

  if (!preds || preds.length === 0) {
    container.innerHTML = `${pillsHeader}<div style="text-align:center; padding:3rem 1rem; color:#94a3b8;">No simulation models available.</div>`;
    return;
  }

  const sorted = [...preds].sort((a, b) => {
    return parseStatNumber(getProb(b, ['gold', 'gold_prob', 'gold_pct', 'p_gold'])) - parseStatNumber(getProb(a, ['gold', 'gold_prob', 'gold_pct', 'p_gold']));
  });

  const cardsHtml = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
      ${sorted.map(p => {
        const rawTeam = p.team || p.country || p.name || 'Unknown';
        const team = formatTeamDisplayName(rawTeam.replace(/\(host\)/gi, '').trim());
        const isHost = rawTeam.toLowerCase().includes('host');

        const gold = parseStatNumber(getProb(p, ['gold', 'gold_prob', 'gold_pct', 'p_gold']));
        const silver = parseStatNumber(getProb(p, ['silver', 'silver_prob', 'silver_pct', 'p_silver']));
        const bronze = parseStatNumber(getProb(p, ['bronze', 'bronze_prob', 'bronze_pct', 'p_bronze']));
        const rawTotal = getProb(p, ['podium', 'total', 'podium_prob']);
        const total = rawTotal ? parseStatNumber(rawTotal) : (gold + silver + bronze);

        return `
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
              <div style="font-weight:700; font-size:1rem; display:flex; align-items:center; gap:0.5rem;">
                <span>${getFlagEmoji(team)}</span> <span>${team}${isHost ? ' (Host)' : ''}</span>
              </div>
              <span style="font-size:0.75rem; color:#38bdf8; font-weight:700;">Podium: ${total}%</span>
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

  container.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center;">
        <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.25rem;">Favorite Accuracy</div>
        <div style="font-size:1.6rem; font-weight:800; color:#38bdf8;">${accuracy}%</div>
        <div style="font-size:0.7rem; color:#94a3b8;">${correctFavorites}/${evaluatedMatches} correct</div>
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

// --- Global App Navigation & State Handlers ---
function setTab(tabName) {
  activeTab = tabName;
  const container = document.getElementById('content-cards');
  if (container && typeof renderCurrentView === 'function') {
    renderCurrentView(container);
  } else {
    window.location.reload();
  }
}

function setGender(gender) {
  currentGender = gender;
  const container = document.getElementById('content-cards');
  if (container && typeof renderCurrentView === 'function') {
    renderCurrentView(container);
  } else {
    window.location.reload();
  }
}

function handleSportChange(sportKey) {
  window.currentSport = sportKey;
  localStorage.setItem('app_sport', sportKey);
  activeMatchesSubView = 'schedule';
  if (typeof initApp === 'function') {
    initApp();
  } else {
    window.location.reload();
  }
}
