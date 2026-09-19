// ==========================================================================
// Asian Games 2026: Modern Pentathlon Sport Engine (Decoupled Plugin)
// ==========================================================================

window.SPORT_ENGINES = window.SPORT_ENGINES || {};

let activePentathlonEvents = [];
let activePhaseGroup = '';
let activeDiscipline = '';
let activeMpnStandingsTab = 'individual'; // 'individual' | 'team'

const MPN_NOC_TO_COUNTRY = {
  KOR: 'South Korea',
  CHN: 'China',
  JPN: 'Japan',
  KAZ: 'Kazakhstan',
  PHI: 'Philippines',
  UZB: 'Uzbekistan',
  LBN: 'Lebanon',
  THA: 'Thailand',
  INA: 'Indonesia',
  KUW: 'Kuwait',
  PLE: 'Palestine',
  KGZ: 'Kyrgyzstan',
  MGL: 'Mongolia',
  SRI: 'Sri Lanka',
  UAE: 'United Arab Emirates',
  MAS: 'Malaysia',
  SGP: 'Singapore',
  HKG: 'Hong Kong',
  IND: 'India',
  TPE: 'Chinese Taipei',
  VIE: 'Vietnam',
  PRK: 'North Korea',
  IRI: 'Iran',
  BRN: 'Bahrain',
  JOR: 'Jordan',
  KSA: 'Saudi Arabia',
  QAT: 'Qatar',
  NEP: 'Nepal'
};

// Official 2026 Asiad Athlete Nationality Registry
const MPN_ATHLETE_NOC = {
  // South Korea
  'SEO CHANGWAN': 'South Korea', 'JUN WOONGTAE': 'South Korea',
  'LEE JONGHYEON': 'South Korea', 'KIM YOUNGHA': 'South Korea',
  'KIM SUNWOO': 'South Korea', 'SEONG SEUNGMIN': 'South Korea',
  'JANG HAEUN': 'South Korea', 'KIM SOEUN': 'South Korea',
  'KIM UNJU': 'South Korea', 'SHIN SUMIN': 'South Korea',

  // China
  'MA YUANG': 'China', 'CHEN BAILIANG': 'China',
  'LUO SHUAI': 'China', 'LI LIUCHANG': 'China',
  'ZHANG MINGYU': 'China', 'BIAN YUFEI': 'China',
  'WU KEBAN': 'China', 'XIE LINZHI': 'China',
  'WU XIYAO': 'China', 'FU JING': 'China', 'MENG XIN': 'China',

  // Japan
  'SATO TAISHU': 'Japan', 'TOMITA YOUSUKE': 'Japan',
  'SEKIGAWA KAZUAKI': 'Japan', 'SHINOKI KAORU': 'Japan',
  'UCHIDA MISAKI': 'Japan', 'OTA NATSUMI': 'Japan',
  'YOSHIDA HANA': 'Japan', 'SAITO KANA': 'Japan',
  'SAITO AYUMU': 'Japan', 'SUZUKI YURI': 'Japan',

  // Kazakhstan
  'ABDRAIMOV TEMIRLAN': 'Kazakhstan', 'VARYOKHIN TIKHON': 'Kazakhstan',
  'STADNIK KIRILL': 'Kazakhstan', 'CHUVASHOV LEV': 'Kazakhstan',
  'POTAPENKO YELENA': 'Kazakhstan', 'AKHMETOVA ANASTASSIYA': 'Kazakhstan',
  'YAKOVLEVA SOFYA': 'Kazakhstan', 'KULIKOVA KRISTINA': 'Kazakhstan',
  'CHSHEDROVA DIANA': 'Kazakhstan', 'KAZBEKOVA AYANA': 'Kazakhstan',

  // Philippines
  'GERMAN SAMUEL': 'Philippines', 'GODBOUT JOSEPH ANTHONY': 'Philippines',
  'COMALING MICHAEL VER ANTON': 'Philippines', 'ANDRINO GILBERT': 'Philippines',
  'ARBILON PRINCESS HONEY': 'Philippines', 'ARANZADO SHYRA MAE': 'Philippines',
  'SEVILLA JULIANA SHANE': 'Philippines',

  // Uzbekistan
  'TRETYAKOV DMITRIY': 'Uzbekistan', 'KAHRAMONOVA MEHRINISO': 'Uzbekistan',
  'ABZALOVA SAMIRA': 'Uzbekistan', 'OSMANOVA RIANA': 'Uzbekistan',

  // West & Central Asia
  'YARED MICHAEL ANTOINE': 'Lebanon',
  'ALSUHAIBI MOHAMMAD': 'Kuwait',
  'ABDALRHMAN ABDLLAH MOHAMMAD': 'United Arab Emirates',
  'ABUSHABAB OMAR': 'Palestine', 'ABUSHABAB ABDALLAH': 'Palestine',
  'ERKINBEKOV ATAI': 'Kyrgyzstan', 'AMARSANAA BILEGT': 'Mongolia',

  // Southeast & South Asia
  'YOHUANG PHURIT': 'Thailand', 'THATTHONG PONGKRIT': 'Thailand',
  'PAISANSRISIN PARITA': 'Thailand', 'PAISANGRISIN PARITA': 'Thailand',
  'WITSAPHAN CHANANAN': 'Thailand',
  'MATULATUWA SAMUEL': 'Indonesia', 'IFSAN MUHAMMAD': 'Indonesia',
  'BANGUN CAROLINE': 'Indonesia', 'WAHYUNI SRI': 'Indonesia',
  'AW JIAN TING': 'Malaysia',
  'ANSARI TAHIR': 'Singapore',
  'SILVA OSHADA': 'Sri Lanka', 'KUMARI GAYANI': 'Sri Lanka',
  'SHUM CHUN HEI': 'Hong Kong', 'LIU HEI YU': 'Hong Kong'
};

function resolveAthleteCountry(name, fallbackNoc = '') {
  const cleanNoc = (fallbackNoc || '').toUpperCase().trim();
  if (MPN_NOC_TO_COUNTRY[cleanNoc]) {
    return MPN_NOC_TO_COUNTRY[cleanNoc];
  }
  const knownCountries = Object.values(MPN_NOC_TO_COUNTRY);
  if (knownCountries.includes(fallbackNoc)) {
    return fallbackNoc;
  }
  if (!name) return fallbackNoc;
  const key = name.toUpperCase().replace(/[^A-Z\s]/g, '').replace(/\s+/g, ' ').trim();
  return MPN_ATHLETE_NOC[key] || fallbackNoc || '';
}

function getDisciplineIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('overall')) return '⭐';
  if (n.includes('team')) return '👥';
  if (n.includes('fencing')) return '🤺';
  if (n.includes('obstacle')) return '🏃';
  if (n.includes('swimming')) return '🏊';
  if (n.includes('laser') || n.includes('shoot')) return '🎯';
  return '🏅';
}

function getNormalizedPhaseGroup(ev) {
  let pName = ev.round || ev.phase || 'Schedule';
  if (ev.group && !pName.includes(ev.group)) {
    return `${pName} (${ev.group})`;
  }
  if (pName === 'SF' || pName.toLowerCase() === 'semi-final') {
    const hour = parseInt((ev.time || '00:00').split(':')[0], 10);
    return hour < 13 ? 'Semi-final (Group A)' : 'Semi-final (Group B)';
  }
  return pName;
}

function renderPentathlonHero(nextSession) {
  if (!nextSession) return '';
  const disc = nextSession.discipline || nextSession.round || 'Modern Pentathlon';
  const icon = getDisciplineIcon(disc);
  const phase = getNormalizedPhaseGroup(nextSession);

  const isSemi = /semi|sf|seed/i.test(phase);
  const isMedalDecider = Boolean(nextSession.is_medal) && !isSemi;

  return `
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
      <div style="font-size: 0.75rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
        ⏳ Next Session
      </div>
      <div style="font-size: 2.2rem; line-height: 1; margin: 0.25rem 0;">
        ${icon}
      </div>
      <div style="font-size: 1.1rem; font-weight: 700; color: #f8fafc; margin-top: 0.4rem;">
        ${disc}
      </div>
      <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.2rem;">
        ${phase} • ${nextSession.date} ${nextSession.time} • ${nextSession.venue || 'Anjo Sports Park'}
      </div>
      ${isMedalDecider ? `
        <div style="display:inline-block; margin-top:0.6rem; font-size:0.75rem; background:rgba(234,179,8,0.15); color:#facc15; border:1px solid rgba(234,179,8,0.3); padding:2px 8px; border-radius:12px; font-weight:600;">
          🥇 Individual & Team Medal Decider
        </div>
      ` : ''}
    </div>
  `;
}

function renderPentathlonTimeline(items) {
  const list = Array.isArray(items) ? items : (items?.events || items?.matches || []);
  if (!list || list.length === 0) {
    return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No session timetable available.</div>`;
  }

  activePentathlonEvents = list;
  const nextSession = list.find(ev => ev.status !== 'Official' && ev.status !== 'Finished') || list[0];

  const phaseMap = {};
  list.forEach(ev => {
    const pName = getNormalizedPhaseGroup(ev);
    if (!phaseMap[pName]) phaseMap[pName] = [];
    phaseMap[pName].push(ev);
  });

  const timelineHtml = Object.entries(phaseMap).map(([phaseHeader, sessions]) => `
    <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:1.5rem; overflow:hidden;">
      <div style="padding:0.75rem 1rem; font-weight:700; font-size:0.95rem; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); display:flex; justify-content:space-between; align-items:center;">
        <span>${phaseHeader}</span>
        <span style="font-size:0.75rem; color:#94a3b8; font-weight:400;">${sessions[0]?.venue || 'Anjo Sports Park'}</span>
      </div>
      <div>
        ${sessions.map((ev) => {
          const isFinished = ev.status === 'Official' || ev.status === 'Finished';
          const isLive = ev.status === 'Live';
          const disc = ev.discipline || ev.round || 'Session';
          const icon = getDisciplineIcon(disc);

          const isSemiOrSeed = /semi|sf|seed/i.test(phaseHeader);
          const isMedalSession = Boolean(ev.is_medal) && !isSemiOrSeed;

          const safePhase = encodeURIComponent(phaseHeader);
          const safeDisc = encodeURIComponent(disc);

          return `
            <div 
              onclick="window.openMpnSheet('${safePhase}', '${safeDisc}')"
              style="display:flex; justify-content:space-between; align-items:center; padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.03); cursor:pointer; -webkit-tap-highlight-color:rgba(255,255,255,0.05); transition:background 0.15s ease;"
            >
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <span style="font-size:1.25rem; line-height:1;">${icon}</span>
                <div>
                  <div style="font-size:0.85rem; font-weight:600; color:#f8fafc;">${disc}</div>
                  <div style="font-size:0.75rem; color:#94a3b8;">${ev.date} •${ev.time}</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:0.6rem;">
                ${isMedalSession ? `
                  <span style="font-size:0.75rem; background:rgba(234,179,8,0.15); color:#facc15; border:1px solid rgba(234,179,8,0.3); padding:2px 6px; border-radius:4px; font-weight:600;">
                    🥇 Medals
                  </span>
                ` : ''}
                <span style="font-size:0.75rem; font-weight:600; color:${isLive ? '#ef4444' : isFinished ? '#4ade80' : '#94a3b8'};">
                  ${ev.status}
                </span>
                <span style="color:#64748b; font-size:1rem; line-height:1; font-weight:700;">›</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');

  return renderPentathlonHero(nextSession) + timelineHtml + renderBottomSheetTemplate();
}

function renderBottomSheetTemplate() {
  return `
    <div id="mpn-sheet-backdrop" 
      onclick="window.closeMpnSheet()"
      style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(2px); z-index:9998; opacity:0; transition:opacity 0.25s ease;"
    ></div>

    <div id="mpn-bottom-sheet" 
      style="position:fixed; bottom:0; left:0; right:0; max-height:85vh; height:auto; background:#0f172a; border-top:1px solid rgba(255,255,255,0.15); border-radius:20px 20px 0 0; z-index:9999; transform:translateY(100%); transition:transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); display:flex; flex-direction:column; box-shadow:0 -10px 25px rgba(0,0,0,0.5); overflow:hidden;"
    >
      <div style="padding:0.75rem 0 0.25rem 0; display:flex; justify-content:center; cursor:pointer;" onclick="window.closeMpnSheet()">
        <div style="width:36px; height:4px; border-radius:2px; background:#475569;"></div>
      </div>

      <div style="padding:0.5rem 1.25rem 0.75rem; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06);">
        <div>
          <h3 id="mpn-sheet-title" style="margin:0; font-size:1.05rem; font-weight:700; color:#f8fafc;">Details</h3>
          <span id="mpn-sheet-subtitle" style="font-size:0.75rem; color:#94a3b8;">Anjo Sports Park</span>
        </div>
        <button 
          onclick="window.closeMpnSheet()" 
          style="background:rgba(255,255,255,0.08); border:none; color:#cbd5e1; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-size:1rem; cursor:pointer;"
        >✕</button>
      </div>

      <div id="mpn-discipline-tabs" style="display:flex; gap:0.5rem; overflow-x:auto; padding:0.75rem 1.25rem; background:rgba(255,255,255,0.02); border-bottom:1px solid rgba(255,255,255,0.05); scrollbar-width:none;">
      </div>

      <div id="mpn-sheet-content" style="flex:1; overflow-y:auto; padding:1rem 1.25rem 2rem;">
      </div>
    </div>
  `;
}

window.openMpnSheet = function(phaseEncoded, discEncoded) {
  const phase = decodeURIComponent(phaseEncoded);
  const disc = decodeURIComponent(discEncoded);

  activePhaseGroup = phase;
  activeDiscipline = disc;

  const backdrop = document.getElementById('mpn-sheet-backdrop');
  const sheet = document.getElementById('mpn-bottom-sheet');
  if (!backdrop || !sheet) return;

  document.getElementById('mpn-sheet-title').innerText = phase;

  const relatedEvents = activePentathlonEvents.filter(ev => getNormalizedPhaseGroup(ev) === phase);

  const availableDisciplines = relatedEvents.length > 1
    ? ['Overall', ...relatedEvents.map(e => e.discipline || e.round)]
    : relatedEvents.map(e => e.discipline || e.round);

  renderDisciplineTabs(availableDisciplines, disc);
  loadDisciplineView(relatedEvents, disc);

  backdrop.style.display = 'block';
  setTimeout(() => {
    backdrop.style.opacity = '1';
    sheet.style.transform = 'translateY(0)';
  }, 10);
};

window.closeMpnSheet = function() {
  const backdrop = document.getElementById('mpn-sheet-backdrop');
  const sheet = document.getElementById('mpn-bottom-sheet');
  if (!sheet) return;

  backdrop.style.opacity = '0';
  sheet.style.transform = 'translateY(100%)';
  setTimeout(() => {
    backdrop.style.display = 'none';
  }, 250);
};

function renderDisciplineTabs(disciplines, selected) {
  const tabsContainer = document.getElementById('mpn-discipline-tabs');
  if (!tabsContainer) return;

  tabsContainer.innerHTML = disciplines.map(d => {
    const isSelected = d === selected;
    const safeD = encodeURIComponent(d);
    return `
      <button 
        id="mpn-tab-${safeD}"
        onclick="window.selectMpnDiscipline('${safeD}')"
        style="white-space:nowrap; padding:0.4rem 0.85rem; font-size:0.75rem; font-weight:600; border-radius:20px; border:none; cursor:pointer; transition:all 0.15s ease; ${isSelected ? 'background:#2563eb; color:#ffffff;' : 'background:rgba(255,255,255,0.06); color:#94a3b8;'}"
      >
        ${getDisciplineIcon(d)} ${d}
      </button>
    `;
  }).join('');

  setTimeout(() => {
    const activeBtn = document.getElementById(`mpn-tab-${encodeURIComponent(selected)}`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, 50);
}

window.selectMpnDiscipline = function(discEncoded) {
  const disc = decodeURIComponent(discEncoded);
  activeDiscipline = disc;

  const relatedEvents = activePentathlonEvents.filter(ev => getNormalizedPhaseGroup(ev) === activePhaseGroup);

  const availableDisciplines = relatedEvents.length > 1
    ? ['Overall', ...relatedEvents.map(e => e.discipline || e.round)]
    : relatedEvents.map(e => e.discipline || e.round);

  renderDisciplineTabs(availableDisciplines, disc);
  loadDisciplineView(relatedEvents, disc);
};

function buildGroupStandings(sessions) {
  const athletes = {};

  sessions.forEach(s => {
    const disc = (s.discipline || s.round || '').toLowerCase();
    (s.competitors || []).forEach(c => {
      const name = c.name;
      if (!athletes[name]) {
        athletes[name] = {
          name,
          country: resolveAthleteCountry(name, c.country),
          fence: '-',
          obstacle: '-',
          swim: '-',
          laser: '-',
          total: 0
        };
      }
      const pts = parseInt(c.raw, 10) || parseInt(c.points, 10) || 0;
      if (disc.includes('fencing')) athletes[name].fence = pts;
      else if (disc.includes('obstacle')) athletes[name].obstacle = pts;
      else if (disc.includes('swim')) athletes[name].swim = pts;
      else if (disc.includes('laser')) athletes[name].laser = pts;
      athletes[name].total += pts;
    });
  });

  return Object.values(athletes).sort((a, b) => b.total - a.total);
}

function loadDisciplineView(events, discipline) {
  const content = document.getElementById('mpn-sheet-content');
  if (!content) return;

  // 1. Cumulative Individual Standings inside drawer
  if (discipline === 'Overall') {
    document.getElementById('mpn-sheet-subtitle').innerText = 'Combined Cumulative Points Standings';

    const athleteTotals = {};
    events.forEach(ev => {
      (ev.competitors || []).forEach(c => {
        const name = c.name;
        if (!athleteTotals[name]) {
          const country = resolveAthleteCountry(name, c.country);
          athleteTotals[name] = {
            name,
            country,
            totalPts: 0,
            eventsCount: 0
          };
        }
        const ptsNum = parseInt(c.raw, 10) || parseInt(c.points, 10) || 0;
        athleteTotals[name].totalPts += ptsNum;
        athleteTotals[name].eventsCount += 1;
      });
    });

    const overallList = Object.values(athleteTotals).sort((a, b) => b.totalPts - a.totalPts);

    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
        <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; font-weight:700;">Combined Standings</span>
        <span style="font-size:0.75rem; color:#38bdf8; font-weight:600;">Top 9 Advance to Final</span>
      </div>

      <div style="display:grid; grid-template-columns: 32px 1fr 65px 75px; font-size:0.7rem; font-weight:700; color:#64748b; padding-bottom:0.5rem; border-bottom:1px solid rgba(255,255,255,0.08); text-transform:uppercase;">
        <span>#</span>
        <span>Athlete</span>
        <span style="text-align:center;">Events</span>
        <span style="text-align:right;">Total Pts</span>
      </div>

      <div style="font-size:0.82rem;">
        ${overallList.map((item, idx) => {
          const rank = idx + 1;
          const isCutoff = rank === 9;
          const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(item.country) : '';

          return `
            <div style="display:grid; grid-template-columns: 32px 1fr 65px 75px; align-items:center; padding:0.7rem 0; border-bottom:1px solid rgba(255,255,255,0.04);">
              <span style="font-weight:700; color:${rank <= 9 ? '#38bdf8' : '#64748b'};">${rank}</span>
              <div>
                <div style="font-weight:600; color:#f8fafc; display:flex; align-items:center; gap:0.35rem;">
                  <span>${flag}</span> <span>${item.name}</span>
                </div>
                ${item.country ? `<div style="font-size:0.7rem; color:#94a3b8; margin-left:1.35rem;">${item.country}</div>` : ''}
              </div>
              <span style="text-align:center; font-size:0.75rem; color:#94a3b8;">${item.eventsCount} / 4</span>
              <span style="text-align:right; font-weight:700; color:#4ade80; font-size:0.9rem;">${item.totalPts}</span>
            </div>
            ${isCutoff ? `
              <div style="display:flex; align-items:center; margin:0.6rem 0; gap:0.5rem;">
                <div style="flex:1; height:1px; background:#ef4444;"></div>
                <span style="font-size:0.65rem; font-weight:700; color:#ef4444; letter-spacing:0.05em;">FINAL QUALIFICATION CUTOFF</span>
                <div style="flex:1; height:1px; background:#ef4444;"></div>
              </div>
            ` : ''}
          `;
        }).join('')}
      </div>
    `;
    return;
  }

  // 2. Single Discipline Standings inside drawer
  const targetEvent = events.find(e => (e.discipline || e.round) === discipline) || events[0] || {};
  const isLive = targetEvent.status === 'Live';

  document.getElementById('mpn-sheet-subtitle').innerText = 
    `${targetEvent.date || ''} • ${targetEvent.time || ''} • ${targetEvent.venue || 'Anjo Sports Park'}`;

  const competitors = targetEvent.competitors || [];

  if (competitors.length === 0) {
    content.innerHTML = `
      <div style="text-align:center; padding:2.5rem 1rem; color:#94a3b8;">
        <div style="font-size:2rem; margin-bottom:0.5rem;">⏱️</div>
        <div style="font-size:0.95rem; font-weight:600; color:#f8fafc; margin-bottom:0.25rem;">Session Scheduled</div>
        <div style="font-size:0.8rem; line-height:1.4;">Official standings will appear here once the session finishes.</div>
      </div>
    `;
    return;
  }

  const isFencingSeeding = /seeding/i.test(discipline) || /seeding/i.test(targetEvent.discipline || '') || /seeding/i.test(targetEvent.round || '');

  if (isFencingSeeding) {
    const totalBouts = competitors.length > 1 ? competitors.length - 1 : 35;

    const sortedCompetitors = competitors.map((c, idx) => {
      const originalRank = c.rank !== undefined ? parseInt(c.rank, 10) : (idx + 1);
      let v = (c.victories !== undefined && c.victories !== null && c.victories !== '') ? String(c.victories) : '-';
      let d = (c.defeats !== undefined && c.defeats !== null && c.defeats !== '') ? String(c.defeats) : '-';
      const pen = (c.penalties !== undefined && c.penalties !== null && c.penalties !== '') ? String(c.penalties) : '0';

      if ((v === '-' || !/^\d+$/.test(v)) && /^\d+$/.test(d)) {
        v = String(Math.max(0, totalBouts - parseInt(d, 10)));
      } else if ((d === '-' || !/^\d+$/.test(d)) && /^\d+$/.test(v)) {
        d = String(Math.max(0, totalBouts - parseInt(v, 10)));
      }

      return {
        ...c,
        victories: v,
        defeats: d,
        penalties: pen,
        originalRank: isNaN(originalRank) ? 999 : originalRank,
        numV: parseInt(v, 10) || 0,
        numD: parseInt(d, 10) || 0,
        numPen: parseInt(pen, 10) || 0
      };
    }).sort((a, b) => {
      if (b.numV !== a.numV) return b.numV - a.numV;
      if (a.numD !== b.numD) return a.numD - b.numD;
      if (a.numPen !== b.numPen) return a.numPen - b.numPen;
      return a.originalRank - b.originalRank;
    });

    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
        <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; font-weight:700;">Fencing Seeding Round</span>
        <span style="font-size:0.75rem; color:${isLive ? '#ef4444' : '#4ade80'}; font-weight:600;">${targetEvent.status}</span>
      </div>

      <div style="display:grid; grid-template-columns: 28px 1fr 38px 38px 44px; font-size:0.7rem; font-weight:700; color:#64748b; padding-bottom:0.5rem; border-bottom:1px solid rgba(255,255,255,0.08); text-transform:uppercase; text-align:center;">
        <span style="text-align:left;">#</span>
        <span style="text-align:left;">Athlete</span>
        <span>V</span>
        <span>D</span>
        <span style="text-align:right;">Pen</span>
      </div>

      <div style="font-size:0.82rem;">
        ${sortedCompetitors.map((c, i) => {
          const rank = i + 1;
          const name = c.name || `Competitor ${rank}`;
          const country = resolveAthleteCountry(name, c.country);
          const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(country) : '';

          return `
            <div style="display:grid; grid-template-columns: 28px 1fr 38px 38px 44px; align-items:center; padding:0.65rem 0; border-bottom:1px solid rgba(255,255,255,0.04); text-align:center;">
              <span style="text-align:left; font-weight:700; color:#94a3b8;">${rank}</span>
              <div style="text-align:left;">
                <div style="font-weight:600; color:#f8fafc; display:flex; align-items:center; gap:0.35rem;">
                  <span>${flag}</span> <span>${name}</span>
                </div>
                ${country ? `<div style="font-size:0.7rem; color:#94a3b8; margin-left:1.35rem;">${country}</div>` : ''}
              </div>
              <span style="font-family:monospace; color:#4ade80; font-weight:600;">${c.victories}</span>
              <span style="font-family:monospace; color:#f87171; font-weight:600;">${c.defeats}</span>
              <span style="font-family:monospace; color:${c.penalties !== '0' && c.penalties !== '-' ? '#fbbf24' : '#94a3b8'}; text-align:right;">${c.penalties}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
    return;
  }

  // Standard Single Discipline Table (Obstacle, Swim, Laser Run)
  content.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
      <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; font-weight:700;">Discipline Results</span>
      <span style="font-size:0.75rem; color:${isLive ? '#ef4444' : '#4ade80'}; font-weight:600;">${targetEvent.status}</span>
    </div>

    <div style="display:grid; grid-template-columns: 32px 1fr 80px; font-size:0.7rem; font-weight:700; color:#64748b; padding-bottom:0.5rem; border-bottom:1px solid rgba(255,255,255,0.08); text-transform:uppercase;">
      <span>#</span>
      <span>Athlete</span>
      <span style="text-align:right;">Points</span>
    </div>

    <div style="font-size:0.82rem;">
      ${competitors.map((c, i) => {
        const rank = c.rank || (i + 1);
        const name = c.name || `Competitor ${rank}`;
        const country = resolveAthleteCountry(name, c.country);
        const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(country) : '';
        const pts = (c.raw && c.raw !== '0') ? c.raw : (c.points !== '-' ? c.points : '0');

        return `
          <div style="display:grid; grid-template-columns: 32px 1fr 80px; align-items:center; padding:0.7rem 0; border-bottom:1px solid rgba(255,255,255,0.04);">
            <span style="font-weight:700; color:#94a3b8;">${rank}</span>
            <div>
              <div style="font-weight:600; color:#f8fafc; display:flex; align-items:center; gap:0.35rem;">
                <span>${flag}</span> <span>${name}</span>
              </div>
              ${country ? `<div style="font-size:0.7rem; color:#94a3b8; margin-left:1.35rem;">${country}</div>` : ''}
            </div>
            <span style="text-align:right; font-weight:700; color:#4ade80; font-size:0.9rem;">+${pts} pts</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderGroupTable(title, athletes, isFinal = false) {
  return `
    <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:1.5rem; overflow-x:auto;">
      <div style="padding:0.85rem 1rem; font-weight:700; font-size:0.95rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
        <span>${title}</span>
        <span style="font-size:0.75rem; color:${isFinal ? '#facc15' : '#38bdf8'}; font-weight:600;">
          ${isFinal ? 'Official Medal Round' : 'Top 9 Advance (Q)'}
        </span>
      </div>
      <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:center;">
        <thead>
          <tr style="color:#94a3b8; font-size:0.72rem; border-bottom:1px solid rgba(255,255,255,0.05); background:rgba(0,0,0,0.15);">
            <th style="padding:0.65rem 0.5rem; text-align:left;"># Athlete</th>
            <th style="padding:0.65rem 0.3rem;">Fence</th>
            <th style="padding:0.65rem 0.3rem;">Obstacle</th>
            <th style="padding:0.65rem 0.3rem;">Swim</th>
            <th style="padding:0.65rem 0.3rem;">Laser</th>
            <th style="padding:0.65rem 0.5rem; font-weight:700; color:#f8fafc;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${athletes.map((a, idx) => {
            const rank = idx + 1;
            const isQualified = !isFinal && rank <= 9;
            const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(a.country) : '';
            const isPodium = isFinal && rank <= 3;

            return `
              <tr style="border-bottom:${rank === 9 && !isFinal ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.03)'}; background:${isPodium ? 'rgba(234,179,8,0.06)' : isQualified ? 'rgba(56,189,248,0.03)' : 'transparent'};">
                <td style="padding:0.65rem 0.5rem; text-align:left;">
                  <div style="display:flex; align-items:center; gap:0.4rem;">
                    <span style="display:inline-block; width:18px; font-weight:700; color:${isPodium ? (rank === 1 ? '#facc15' : rank === 2 ? '#cbd5e1' : '#f59e0b') : isQualified ? '#38bdf8' : '#94a3b8'};">
                      ${rank}
                    </span>
                    <div>
                      <div style="font-weight:600; color:#f8fafc; display:flex; align-items:center; gap:0.35rem;">
                        <span>${flag}</span> <span>${a.name}</span>${isQualified ? `<span style="font-size:0.65rem; background:rgba(56,189,248,0.2); color:#38bdf8; padding:1px 5px; border-radius:4px; font-weight:700;">Q</span>` : ''}
                      </div>
                      ${a.country ? `<div style="font-size:0.7rem; color:#94a3b8; margin-left:1.35rem;">${a.country}</div>` : ''}
                    </div>
                  </div>
                </td>
                <td style="padding:0.65rem 0.3rem; font-family:monospace; color:#cbd5e1;">${a.fence}</td>
                <td style="padding:0.65rem 0.3rem; font-family:monospace; color:#cbd5e1;">${a.obstacle}</td>
                <td style="padding:0.65rem 0.3rem; font-family:monospace; color:#cbd5e1;">${a.swim}</td>
                <td style="padding:0.65rem 0.3rem; font-family:monospace; color:#cbd5e1;">${a.laser}</td>
                <td style="padding:0.65rem 0.5rem; font-family:monospace; font-weight:700; color:#4ade80;">${a.total}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Official UIPM Team Medal Classification Engine
function renderOfficialTeamView(finalStandings, semiAStandings, semiBStandings) {
  const hasFinalScores = finalStandings && finalStandings.length > 0 && finalStandings.some(a => a.total > 0);

  // 1. Final Medal Decider View: Aggregate points of the 3 finalists per nation
  if (hasFinalScores) {
    const nationFinalists = {};
    finalStandings.forEach(a => {
      const c = a.country || 'Other';
      if (!nationFinalists[c]) nationFinalists[c] = [];
      nationFinalists[c].push(a);
    });

    const medalContenders = [];
    const dnqTeams = [];

    Object.entries(nationFinalists).forEach(([country, athletes]) => {
      athletes.sort((a, b) => b.total - a.total);
      if (athletes.length >= 3) {
        const top3 = athletes.slice(0, 3);
        const totalPts = top3.reduce((s, x) => s + x.total, 0);
        medalContenders.push({ country, top3, totalPts });
      } else {
        dnqTeams.push({ country, athletes, count: athletes.length });
      }
    });

    medalContenders.sort((a, b) => b.totalPts - a.totalPts);

    return `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:1.5rem; overflow:hidden;">
        <div style="padding:0.85rem 1rem; font-weight:700; font-size:0.95rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02);">
          <span>👥 Official Team Medal Classification</span>
          <span style="font-size:0.75rem; color:#facc15; font-weight:600;">Final Results</span>
        </div>

        <div style="padding:0.75rem 1rem; background:rgba(234,179,8,0.08); border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.75rem; color:#cbd5e1; line-height:1.4;">
          🥇 Official Team Medals are awarded exclusively to countries with 3 athletes competing in the 18-person Final, ranked by cumulative Final score.
        </div>

        <div style="font-size:0.85rem;">
          ${medalContenders.map((team, idx) => {
            const rank = idx + 1;
            const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(team.country) : '';
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

            return `
              <div style="padding:0.9rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); background:${rank <= 3 ? 'rgba(234,179,8,0.04)' : 'transparent'};">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                  <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span style="font-weight:700; font-size:1.1rem; width:24px;">${medal || rank}</span>
                    <span style="font-size:1.2rem;">${flag}</span>
                    <span style="font-weight:700; color:#f8fafc; font-size:0.95rem;">${team.country}</span>
                  </div>
                  <span style="font-family:monospace; font-weight:700; font-size:1.05rem; color:#4ade80;">
                    ${team.totalPts.toLocaleString()} pts
                  </span>
                </div>
                <div style="margin-left:2rem; padding-left:0.5rem; border-left:2px solid rgba(255,255,255,0.1); font-size:0.75rem; color:#94a3b8; display:flex; flex-direction:column; gap:0.2rem;">
                  ${team.top3.map(a => `
                    <div style="display:flex; justify-content:space-between;">
                      <span>• ${a.name}</span>
                      <span style="font-family:monospace; color:#cbd5e1;">${a.total.toLocaleString()} pts</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}

          ${dnqTeams.length > 0 ? `
            <div style="padding:0.6rem 1rem; background:rgba(0,0,0,0.2); font-size:0.7rem; color:#64748b; font-weight:700; text-transform:uppercase;">
              Ineligible for Team Podium (&lt; 3 Finalists)
            </div>
            ${dnqTeams.map(t => {
              const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(t.country) : '';
              return `
                <div style="padding:0.65rem 1rem; border-bottom:1px solid rgba(255,255,255,0.02); display:flex; justify-content:space-between; align-items:center; opacity:0.6;">
                  <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span>${flag}</span>
                    <span style="color:#cbd5e1; font-size:0.82rem;">${t.country}</span>
                  </div>
                  <span style="font-size:0.75rem; color:#ef4444; font-weight:600;">
                    ${t.count} finalist${t.count > 1 ? 's' : ''} (DNQ)
                  </span>
                </div>
              `;
            }).join('')}
          ` : ''}
        </div>
      </div>
    `;
  }

  // 2. Semifinal Stage: Identify which nations have 3 qualifiers contending for Team Medals
  const qualifiedA = (semiAStandings || []).slice(0, 9);
  const qualifiedB = (semiBStandings || []).slice(0, 9);
  const all18Qualifiers = [...qualifiedA, ...qualifiedB];

  const nationCounts = {};
  all18Qualifiers.forEach(a => {
    const c = a.country || 'Other';
    if (!nationCounts[c]) nationCounts[c] = { country: c, athletes: [] };
    nationCounts[c].athletes.push(a);
  });

  const contenders = Object.values(nationCounts).filter(n => n.athletes.length >= 3);
  const nonContenders = Object.values(nationCounts).filter(n => n.athletes.length < 3);

  contenders.sort((a, b) => b.athletes.length - a.athletes.length);
  nonContenders.sort((a, b) => b.athletes.length - a.athletes.length);

  return `
    <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:1.5rem; overflow:hidden;">
      <div style="padding:0.85rem 1rem; font-weight:700; font-size:0.95rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02);">
        <span>👥 Team Medal Contenders (18-Athlete Final)</span>
        <span style="font-size:0.75rem; color:#38bdf8; font-weight:600;">Qualification Status</span>
      </div>

      <div style="padding:0.85rem 1rem; background:rgba(56,189,248,0.05); border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.8rem; color:#94a3b8; line-height:1.45;">
        ℹ️ <strong>Official Team Rule:</strong> Modern Pentathlon team medals are awarded strictly based on cumulative points scored in the <strong>Final on September 20</strong>. Only nations that successfully qualify a full squad of <strong>3 athletes</strong> into the Final are eligible to contend for Team medals.
      </div>

      <div style="padding:0.75rem 1rem 0.25rem 1rem;">
        <span style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; color:#4ade80; font-weight:700;">
          Eligible for Team Medals (3 Finalists Qualified)
        </span>
      </div>

      <div style="font-size:0.85rem;">
        ${contenders.length > 0 ? contenders.map(team => {
          const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(team.country) : '';
          return `
            <div style="padding:0.75rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); background:rgba(74,222,128,0.03);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="font-size:1.15rem;">${flag}</span>
                  <span style="font-weight:700; color:#f8fafc;">${team.country}</span>
                </div>
                <span style="font-size:0.75rem; background:rgba(74,222,128,0.15); color:#4ade80; border:1px solid rgba(74,222,128,0.3); padding:2px 8px; border-radius:12px; font-weight:700;">
                  3 / 3 Finalists
                </span>
              </div>
              <div style="margin-left:1.8rem; font-size:0.75rem; color:#94a3b8;">
                ${team.athletes.map(a => a.name).join(' • ')}
              </div>
            </div>
          `;
        }).join('') : `
          <div style="padding:1rem; text-align:center; color:#94a3b8; font-size:0.8rem;">
            Qualification in progress. Finalists will appear here once semifinals conclude.
          </div>
        `}

        ${nonContenders.length > 0 ? `
          <div style="padding:0.75rem 1rem 0.25rem 1rem; margin-top:0.5rem;">
            <span style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; color:#ef4444; font-weight:700;">
              Ineligible for Team Medals (&lt; 3 Finalists)
            </span>
          </div>
          ${nonContenders.map(team => {
            const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(team.country) : '';
            return `
              <div style="padding:0.65rem 1rem; border-bottom:1px solid rgba(255,255,255,0.03); display:flex; justify-content:space-between; align-items:center; opacity:0.65;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span>${flag}</span>
                  <span style="color:#cbd5e1;">${team.country}</span>
                </div>
                <span style="font-size:0.75rem; color:#94a3b8;">
                  ${team.athletes.length} finalist${team.athletes.length > 1 ? 's' : ''} (DNQ)
                </span>
              </div>
            `;
          }).join('')}
        ` : ''}
      </div>
    </div>
  `;
}

window.setMpnStandingsTab = function(tab) {
  activeMpnStandingsTab = tab;
  const bIndiv = document.getElementById('mpn-tab-btn-indiv');
  const bTeam = document.getElementById('mpn-tab-btn-team');
  const cIndiv = document.getElementById('mpn-indiv-content');
  const cTeam = document.getElementById('mpn-team-content');

  if (tab === 'team') {
    if (bIndiv) { bIndiv.style.background = 'transparent'; bIndiv.style.color = '#94a3b8'; }
    if (bTeam) { bTeam.style.background = '#2563eb'; bTeam.style.color = '#ffffff'; }
    if (cIndiv) cIndiv.style.display = 'none';
    if (cTeam) cTeam.style.display = 'block';
  } else {
    if (bIndiv) { bIndiv.style.background = '#2563eb'; bIndiv.style.color = '#ffffff'; }
    if (bTeam) { bTeam.style.background = 'transparent'; bTeam.style.color = '#94a3b8'; }
    if (cIndiv) cIndiv.style.display = 'block';
    if (cTeam) cTeam.style.display = 'none';
  }
};

window.SPORT_ENGINES['modern_pentathlon'] = {
  icon: '🎯',
  hasBracket: false,

  renderMatches(data) {
    return renderPentathlonTimeline(data);
  },

  renderStandingsTable(data) {
    const list = Array.isArray(data) ? data : (data?.events || data?.matches || []);
    if (!list || list.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No standings data available.</div>`;
    }

    const groupAEvents = list.filter(ev => getNormalizedPhaseGroup(ev).includes('Group A'));
    const groupBEvents = list.filter(ev => getNormalizedPhaseGroup(ev).includes('Group B'));
    const finalEvents = list.filter(ev => getNormalizedPhaseGroup(ev) === 'Final' && (ev.competitors || []).length > 0);

    const groupAStandings = buildGroupStandings(groupAEvents);
    const groupBStandings = buildGroupStandings(groupBEvents);
    const finalStandings = finalEvents.length > 0 ? buildGroupStandings(finalEvents) : [];

    let indivHtml = '';
    if (finalStandings.length > 0) {
      indivHtml += renderGroupTable('Final Classification', finalStandings, true);
    }
    if (groupAStandings.length > 0) {
      indivHtml += renderGroupTable('Semi-final • Group A', groupAStandings, false);
    }
    if (groupBStandings.length > 0) {
      indivHtml += renderGroupTable('Semi-final • Group B', groupBStandings, false);
    }

    const teamHtml = renderOfficialTeamView(finalStandings, groupAStandings, groupBStandings);

    return `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:0.75rem;">
          <div style="font-weight:700; font-size:1.05rem; display:flex; align-items:center; gap:0.5rem;">
            <span>🎯 Modern Pentathlon Standings</span>
          </div>

          <!-- Standings View Selector: Individual vs. Team Event -->
          <div style="display:inline-flex; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:3px; gap:4px;">
            <button 
              id="mpn-tab-btn-indiv" 
              onclick="window.setMpnStandingsTab('individual')"
              style="border:none; padding:0.35rem 0.9rem; border-radius:16px; font-size:0.75rem; font-weight:700; cursor:pointer; transition:all 0.15s ease; ${activeMpnStandingsTab === 'individual' ? 'background:#2563eb; color:#ffffff;' : 'background:transparent; color:#94a3b8;'}"
            >
              👤 Individual
            </button>
            <button 
              id="mpn-tab-btn-team" 
              onclick="window.setMpnStandingsTab('team')"
              style="border:none; padding:0.35rem 0.9rem; border-radius:16px; font-size:0.75rem; font-weight:700; cursor:pointer; transition:all 0.15s ease; ${activeMpnStandingsTab === 'team' ? 'background:#2563eb; color:#ffffff;' : 'background:transparent; color:#94a3b8;'}"
            >
              👥 Team Event
            </button>
          </div>
        </div>

        <p style="color:#94a3b8; font-size:0.82rem; margin:0; line-height:1.4;">
          The top 9 athletes from Group A and top 9 from Group B advance to the 18-athlete Final. Team medals are determined strictly by the aggregate points of each nation's 3 finalists in the medal session.
        </p>
      </div>

      <div id="mpn-standings-view-container">
        <div id="mpn-indiv-content" style="display:${activeMpnStandingsTab === 'individual' ? 'block' : 'none'};">
          ${indivHtml}
        </div>
        <div id="mpn-team-content" style="display:${activeMpnStandingsTab === 'team' ? 'block' : 'none'};">
          ${teamHtml}
        </div>
      </div>
    `;
  },

  renderKnockoutBracket() {
    return `<div style="text-align:center; padding:2rem; color:#94a3b8;">Modern Pentathlon uses cumulative point totals across phases rather than a knockout bracket. View the Matches tab for the session timetable.</div>`;
  }
};
