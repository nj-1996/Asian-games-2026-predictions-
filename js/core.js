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
    if (Array.isArray(raw.teams)) return raw.teams;
    if (Array.isArray(raw.predictions)) return raw.predictions;
    if (Array.isArray(raw.data)) return raw.data;
  }
  return [];
}

window.SPORT_ENGINES = window.SPORT_ENGINES || {};

// --- Universal Flag Registry & Resolver ---
const FLAG_REGISTRY = {
  'china': '🇨🇳', 'chn': '🇨🇳', "people's republic of china": '🇨🇳',
  'japan': '🇯🇵', 'jpn': '🇯🇵',
  'korea': '🇰🇷', 'south korea': '🇰🇷', 'kor': '🇰🇷', 'republic of korea': '🇰🇷',
  'north korea': '🇰🇵', 'prk': '🇰🇵', 'dpr korea': '🇰🇵',
  'chinese taipei': '🇹🇼', 'taiwan': '🇹🇼', 'tpe': '🇹🇼',
  'hong kong': '🇭🇰', 'hong kong, china': '🇭🇰', 'hkg': '🇭🇰',
  'macau': '🇲🇴', 'macao': '🇲🇴', 'mac': '🇲🇴',
  'mongolia': '🇲🇳', 'mgl': '🇲🇳',
  'philippines': '🇵🇭', 'phi': '🇵🇭', 'gilas': '🇵🇭',
  'indonesia': '🇮🇩', 'ina': '🇮🇩', 'idn': '🇮🇩',
  'thailand': '🇹🇭', 'tha': '🇹🇭',
  'malaysia': '🇲🇾', 'mas': '🇲🇾',
  'singapore': '🇸🇬', 'sgp': '🇸🇬',
  'vietnam': '🇻🇳', 'vie': '🇻🇳',
  'india': '🇮🇳', 'ind': '🇮🇳',
  'kazakhstan': '🇰🇿', 'kaz': '🇰🇿',
  'uzbekistan': '🇺🇿', 'uzb': '🇺🇿',
  'turkmenistan': '🇹🇲', 'tkm': '🇹🇲',
  'iran': '🇮🇷', 'ir iran': '🇮🇷', 'iri': '🇮🇷',
  'jordan': '🇯🇴', 'jor': '🇯🇴',
  'lebanon': '🇱🇧', 'lbn': '🇱🇧',
  'saudi arabia': '🇸🇦', 'ksa': '🇸🇦',
  'qatar': '🇶🇦', 'qat': '🇶🇦',
  'bahrain': '🇧🇭', 'brn': '🇧🇭',
  'kuwait': '🇰🇼', 'kuw': '🇰🇼',
  'united arab emirates': '🇦🇪', 'uae': '🇦🇪',
  'syria': '🇸🇾', 'syr': '🇸🇾',
  'iraq': '🇮🇶', 'irq': '🇮🇶',
  'palestine': '🇵🇸', 'ple': '🇵🇸',
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

  if (/bronze|3rd/i.test(s)) return 'Bronze Medal Match';
  if (/gold|final/i.test(s)) return 'Gold Medal Match';

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
  const num1 = parseFloat(s1);
  const num2 = parseFloat(s2);
  if (!isNaN(num1) && !isNaN(num2)) {
    if (num1 > num2) winner = t1;
    else if (num2 > num1) winner = t2;
    else if (m.winner) winner = formatTeamDisplayName(m.winner);
  } else if (m.winner) {
    winner = formatTeamDisplayName(m.winner);
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

// --- Matches Router (Direct Native Routing) ---
function renderMatchesView(container, matches) {
  const rawSport = window.currentSport || (typeof currentSport !== 'undefined' ? currentSport : 'basketball');
  const activeSport = String(rawSport).trim().toLowerCase();
  
  // Get engine from registry, with a native fallback for basketball
  const engine = window.SPORT_ENGINES && window.SPORT_ENGINES[activeSport];

  const hasStandings = true;
  const hasBracket = true;
  const hasLeaderboard = engine && typeof engine.renderLeaderboard === 'function';

  const scheduleBtn = `
    <button style="flex:1; padding:7px 4px; font-size:0.75rem; font-weight:600; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${activeMatchesSubView === 'schedule' ? '#2563eb' : 'transparent'}; color:${activeMatchesSubView === 'schedule' ? '#fff' : '#94a3b8'};" onclick="setMatchesSubView('schedule')">📋 Schedule</button>
  `;
  const standingsBtn = `
    <button style="flex:1; padding:7px 4px; font-size:0.75rem; font-weight:600; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${activeMatchesSubView === 'standings' ? '#2563eb' : 'transparent'}; color:${activeMatchesSubView === 'standings' ? '#fff' : '#94a3b8'};" onclick="setMatchesSubView('standings')">📊 Standings</button>
  `;
  const bracketBtn = `
    <button style="flex:1; padding:7px 4px; font-size:0.75rem; font-weight:600; border-radius:7px; border:none; cursor:pointer; transition:all 0.2s; background:${activeMatchesSubView === 'bracket' ? '#2563eb' : 'transparent'}; color:${activeMatchesSubView === 'bracket' ? '#fff' : '#94a3b8'};" onclick="setMatchesSubView('bracket')">🌳 Bracket</button>
  `;
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
    contentHtml = renderScheduleAndHero(matches);
  } else if (activeMatchesSubView === 'standings') {
    // Directly call the embedded standalone functions, no object lookup needed
    if (activeSport === 'basketball') {
      contentHtml = window.SPORT_ENGINES['basketball'].renderStandingsTable(matches);
    } else if (engine && typeof engine.renderStandingsTable === 'function') {
      contentHtml = engine.renderStandingsTable(matches);
    } else {
      contentHtml = `<div style="padding:2rem; text-align:center; color:#94a3b8;">Standings unavailable for this sport.</div>`;
    }
  } else if (activeMatchesSubView === 'bracket') {
    if (activeSport === 'basketball') {
      contentHtml = window.SPORT_ENGINES['basketball'].renderKnockoutBracket(matches);
    } else if (engine && typeof engine.renderKnockoutBracket === 'function') {
      contentHtml = engine.renderKnockoutBracket(matches);
    } else {
      contentHtml = `<div style="padding:2rem; text-align:center; color:#94a3b8;">Bracket unavailable for this sport.</div>`;
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
  const heroTarget = liveMatch || upcomingWithTeams[0] || upcomingMatches[0] || parsed[0];

  let heroHtml = '';
  if (heroTarget) {
    const isLive = heroTarget.status.toLowerCase().includes('live');
    const displayDateTime = formatMatchDateTime(heroTarget.date, heroTarget.time) || heroTarget.status || 'Scheduled';
    const activeSport = window.currentSport || (typeof currentSport !== 'undefined' ? currentSport : 'basketball');
    const upcomingLabel = activeSport === 'football' ? '⏳ NEXT KICK-OFF' : '⏳ NEXT TIP-OFF';

    heroHtml = `
      <div style="background:linear-gradient(135deg, rgba(30,58,138,0.4), rgba(15,23,42,0.8)); border:1px solid rgba(59,130,246,0.3); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem; text-align:center;">
        <div style="display:inline-block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; padding:0.2rem 0.65rem; border-radius:9999px; background:${isLive ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}; color:${isLive ? '#ef4444' : '#60a5fa'}; margin-bottom:0.75rem;">
          ${isLive ? '🔴 LIVE NOW' : upcomingLabel}
        </div>
        <div style="display:flex; justify-content:space-around; align-items:center; margin:0.75rem 0;">
          <div style="flex:1;">
            <div style="font-size:1.8rem;">${getFlagEmoji(heroTarget.t1)}</div>
            <div style="font-weight:700; font-size:1rem; margin-top:0.25rem;">${heroTarget.t1}</div>
          </div>
          <div style="font-family:monospace; font-size:1.6rem; font-weight:800; min-width:80px;">
            ${heroTarget.s1 !== '-' ? `${heroTarget.s1} : ${heroTarget.s2}` : 'VS'}
          </div>
          <div style="flex:1;">
            <div style="font-size:1.8rem;">${getFlagEmoji(heroTarget.t2)}</div>
            <div style="font-weight:700; font-size:1rem; margin-top:0.25rem;">${heroTarget.t2}</div>
          </div>
        </div>
        <div style="font-size:0.8rem; color:#94a3b8;">
          ${displayDateTime} • ${heroTarget.stage}
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

// --- Predictions & Dynamic Medal Table (Supports Multi-Event) ---
function renderPredictionsView(container, menPreds, womenPreds, currentGender) {
  const activeSport = window.currentSport || (typeof currentSport !== 'undefined' ? currentSport : 'basketball');

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
      if (sorted[0]) res.push({ team: sorted[0], medal: 'gold' });
      if (sorted[1]) res.push({ team: sorted[1], medal: 'silver' });
      if (sorted[2]) res.push({ team: sorted[2], medal: 'bronze' });
      return res;
    };

    const tableMap = {};
    const recordMedal = (predObj, medalType) => {
      if (!predObj) return;
      const rawName = predObj.team || predObj.country || predObj.name || '';
      if (!rawName) return;
      const cleaned = cleanTeamName(rawName);
      const displayName = formatTeamDisplayName(rawName.replace(/\(host\)/gi, '').trim());

      if (!tableMap[cleaned]) {
        tableMap[cleaned] = { name: displayName, isHost: rawName.toLowerCase().includes('host'), gold: 0, silver: 0, bronze: 0, total: 0 };
      }
      tableMap[cleaned][medalType] += 1;
      tableMap[cleaned].total += 1;
    };

    // Support single-tournament arrays or nested events arrays
    const mData = menPreds || [];
    const wData = womenPreds || [];

    if (mData.events && Array.isArray(mData.events)) {
      mData.events.forEach(evt => projectPodium(evt.predictions || evt.data).forEach(item => recordMedal(item.team, item.medal)));
    } else {
      projectPodium(mData).forEach(item => recordMedal(item.team, item.medal));
    }
    
    if (wData.events && Array.isArray(wData.events)) {
      wData.events.forEach(evt => projectPodium(evt.predictions || evt.data).forEach(item => recordMedal(item.team, item.medal)));
    } else {
      projectPodium(wData).forEach(item => recordMedal(item.team, item.medal));
    }

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

    const subtitleLabel = eventCount > 2 ? `across ${eventCount} medal events` : (activeSport === 'football' ? "Men's U-23 & Women's Senior" : "Men's & Women's Divisions");

    const tableHtml = `
      <div style="margin-bottom:1rem; text-align:center; font-size:0.75rem; color:#94a3b8;">
        Projected distribution of all <strong>${grandTotal} medals</strong> (${subtitleLabel}).
      </div>
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
                  <span style="display:inline-block; width:18px; font-weight:700; color:${idx === 0 ? '#facc15' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#f59e0b' : '#94a3b8'};">${idx + 1}</span>
                  ${getFlagEmoji(t.name)} ${t.name}${t.isHost ? ' (Host)' : ''}
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
    `;
    container.innerHTML = `${pillsHeader}${tableHtml}`;
    return;
  }

  const sourceData = currentGender === 'men' ? menPreds : womenPreds;
  let preds = sourceData;
  if (sourceData && sourceData.events) {
    // For now, if it's a multi-event format but in odds view, just show the first event
    preds = sourceData.events[0]?.predictions || sourceData.events[0]?.data || [];
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

// --- Calibration View (Evaluated vs Neutral Transparency) ---
function renderCalibrationView(container, predictions, matches) {
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
    const s1 = Number(m.s1);
    const s2 = Number(m.s2);
    if (isNaN(s1) || isNaN(s2)) return;

    let actualWinner = '';
    let actualLoser = '';
    let winScore = 0;
    let loseScore = 0;

    if (s1 > s2) { actualWinner = m.t1; actualLoser = m.t2; winScore = s1; loseScore = s2; } 
    else if (s2 > s1) { actualWinner = m.t2; actualLoser = m.t1; winScore = s2; loseScore = s1; } 
    else if (m.winner) { actualWinner = m.winner.trim(); actualLoser = cleanTeamName(actualWinner) === cleanTeamName(m.t1) ? m.t2 : m.t1; winScore = s1; loseScore = s2; } 
    else { return; }

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
        upsetLogs.push({ winner: actualWinner, loser: actualLoser, score: `${winScore} - ${loseScore}` });
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
    ` : ''}
  `;
}

// --- Permanent Embedded Basketball Engine ---
window.SPORT_ENGINES = window.SPORT_ENGINES || {};
window.SPORT_ENGINES['basketball'] = {
  icon: '🏀',
  renderStandingsTable(matches) {
    const parsedMatches = matches.map(m => parseMatchData(m));
    const groupMatches = parsedMatches.filter(m => /group|pool/i.test(m.stage));
    const allGroupFinished = groupMatches.length > 0 && groupMatches.every(m => m.isFinished);
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
                    ${getFlagEmoji(t.name)} ${t.name}
                  </td>
                  <td style="padding:0.6rem 0.3rem;">${t.gp}</td>
                  <td style="padding:0.6rem 0.3rem; color:#4ade80;">${t.w}</td>
                  <td style="padding:0.6rem 0.3rem; color:#f87171;">${t.l}</td>
                  <td style="padding:0.6rem 0.3rem; font-family:monospace; color:${t.diff > 0 ? '#4ade80' : t.diff < 0 ? '#f87171' : 'inherit'};">${t.diff > 0 ? '+' + t.diff : t.diff}</td>
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
    const finalMatch = parsed.find(m => getStage(m).includes('gold') || (getStage(m).includes('final') && !getStage(m).includes('semi') && !getStage(m).includes('quarter') && !getStage(m).includes('bronze')));
    const bronzeMatch = parsed.find(m => getStage(m).includes('bronze') || getStage(m).includes('3rd'));

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
      const t1Win = match && match.winner ? cleanTeamName(match.winner) === cleanTestName(t1) : (isFinished && Number(s1) > Number(s2));
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
