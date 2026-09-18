// ==========================================================================
// Asian Games 2026: Modern Pentathlon Sport Engine (Decoupled Plugin)
// ==========================================================================

window.SPORT_ENGINES = window.SPORT_ENGINES || {};

let activePentathlonEvents = [];
let activePhaseGroup = '';
let activeDiscipline = '';

function getDisciplineIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('overall')) return '⭐';
  if (n.includes('fencing')) return '🤺';
  if (n.includes('obstacle')) return '🏃';
  if (n.includes('swimming')) return '🏊';
  if (n.includes('laser') || n.includes('shoot')) return '🎯';
  return '🏅';
}

function renderPentathlonHero(nextSession) {
  if (!nextSession) return '';
  const disc = nextSession.discipline || nextSession.round || 'Modern Pentathlon';
  const icon = getDisciplineIcon(disc);
  const phase = nextSession.phase || nextSession.round || 'Upcoming';

  const isSemi = /semi|sf|seed/i.test(phase) || /semi|sf|seed/i.test(nextSession.round || '');
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
          🥇 Medal Decider
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
    let pName = ev.round || ev.phase || 'Schedule';
    if (ev.group && !pName.includes(ev.group)) {
      pName = `${pName} (${ev.group})`;
    } else if (pName === 'SF' || pName.toLowerCase() === 'semi-final') {
      const hour = parseInt((ev.time || '00:00').split(':')[0], 10);
      pName = hour < 13 ? 'Semi-final (Group A)' : 'Semi-final (Group B)';
    }

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

          const isSemiOrSeed = /semi|sf|seed/i.test(phaseHeader) || /semi|sf|seed/i.test(ev.phase || '') || /semi|sf|seed/i.test(ev.round || '');
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
                    🥇 Medal
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

  const relatedEvents = activePentathlonEvents.filter(ev => {
    let pName = ev.round || ev.phase || 'Schedule';
    if (ev.group && !pName.includes(ev.group)) pName = `${pName} (${ev.group})`;
    else if (pName === 'SF' || pName.toLowerCase() === 'semi-final') {
      const hour = parseInt((ev.time || '00:00').split(':')[0], 10);
      pName = hour < 13 ? 'Semi-final (Group A)' : 'Semi-final (Group B)';
    }
    return pName === phase;
  });

  const availableDisciplines = relatedEvents.length > 1
    ? ['⭐ Overall', ...relatedEvents.map(e => e.discipline || e.round)]
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
        onclick="window.selectMpnDiscipline('${safeD}')"
        style="white-space:nowrap; padding:0.4rem 0.85rem; font-size:0.75rem; font-weight:600; border-radius:20px; border:none; cursor:pointer; transition:all 0.15s ease; ${isSelected ? 'background:#2563eb; color:#ffffff;' : 'background:rgba(255,255,255,0.06); color:#94a3b8;'}"
      >
        ${getDisciplineIcon(d)} ${d}
      </button>
    `;
  }).join('');
}

window.selectMpnDiscipline = function(discEncoded) {
  const disc = decodeURIComponent(discEncoded);
  activeDiscipline = disc;

  const relatedEvents = activePentathlonEvents.filter(ev => {
    let pName = ev.round || ev.phase || 'Schedule';
    if (ev.group && !pName.includes(ev.group)) pName = `${pName} (${ev.group})`;
    return pName === activePhaseGroup;
  });

  const availableDisciplines = relatedEvents.length > 1
    ? ['⭐ Overall', ...relatedEvents.map(e => e.discipline || e.round)]
    : relatedEvents.map(e => e.discipline || e.round);

  renderDisciplineTabs(availableDisciplines, disc);
  loadDisciplineView(relatedEvents, disc);
};

function loadDisciplineView(events, discipline) {
  const content = document.getElementById('mpn-sheet-content');
  if (!content) return;

  // View 1: Overall Group Cumulative Standings
  if (discipline === '⭐ Overall') {
    document.getElementById('mpn-sheet-subtitle').innerText = 'Combined Cumulative Points Standings';

    const athleteTotals = {};
    events.forEach(ev => {
      (ev.competitors || []).forEach(c => {
        const name = c.name;
        if (!athleteTotals[name]) {
          athleteTotals[name] = {
            name,
            country: c.country || '',
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
        <span style="font-size:0.75rem; color:#38bdf8; font-weight:600;">Top 9 Advance</span>
      </div>

      <div style="display:grid; grid-template-columns: 32px 1fr 65px 70px; font-size:0.7rem; font-weight:700; color:#64748b; padding-bottom:0.5rem; border-bottom:1px solid rgba(255,255,255,0.08); text-transform:uppercase;">
        <span>#</span>
        <span>Athlete</span>
        <span style="text-align:center;">Events</span>
        <span style="text-align:right;">Total Pts</span>
      </div>

      <div style="font-size:0.82rem;">
        ${overallList.map((item, idx) => {
          const rank = idx + 1;
          const isCutoff = rank === 9;

          return `
            <div style="display:grid; grid-template-columns: 32px 1fr 65px 70px; align-items:center; padding:0.7rem 0; border-bottom:1px solid rgba(255,255,255,0.04);">
              <span style="font-weight:700; color:${rank <= 9 ? '#38bdf8' : '#64748b'};">${rank}</span>
              <div>
                <div style="font-weight:600; color:#f8fafc;">${item.name}</div>${item.country ? `<span style="font-size:0.7rem; color:#64748b;">${item.country}</span>` : ''}
              </div>
              <span style="text-align:center; font-size:0.75rem; color:#94a3b8;">${item.eventsCount} / 4</span>
              <span style="text-align:right; font-weight:700; color:#4ade80; font-size:0.9rem;">${item.totalPts}</span>
            </div>
            ${isCutoff ? `
              <div style="display:flex; align-items:center; margin:0.5rem 0; gap:0.5rem;">
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

  // View 2: Single Discipline Standings
  const targetEvent = events.find(e => (e.discipline || e.round) === discipline) || events[0] || {};
  const isFinished = targetEvent.status === 'Official' || targetEvent.status === 'Finished';
  const isLive = targetEvent.status === 'Live';

  document.getElementById('mpn-sheet-subtitle').innerText = 
    `${targetEvent.date || ''} • ${targetEvent.time || ''} • ${targetEvent.venue || 'Anjo Sports Park'}`;

  const competitors = targetEvent.competitors || [];

  if (competitors.length === 0) {
    content.innerHTML = `
      <div style="text-align:center; padding:2.5rem 1rem; color:#94a3b8;">
        <div style="font-size:2rem; margin-bottom:0.5rem;">⏱️</div>
        <div style="font-size:0.95rem; font-weight:600; color:#f8fafc; margin-bottom:0.25rem;">Session Scheduled</div>
        <div style="font-size:0.8rem; line-height:1.4;">Official standings and points will appear here once the session finishes.</div>
      </div>
    `;
    return;
  }

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
        const noc = c.country || '';
        const pts = (c.raw && c.raw !== '0') ? c.raw : (c.points !== '-' ? c.points : '0');

        return `
          <div style="display:grid; grid-template-columns: 32px 1fr 80px; align-items:center; padding:0.7rem 0; border-bottom:1px solid rgba(255,255,255,0.04);">
            <span style="font-weight:700; color:#94a3b8;">${rank}</span>
            <div>
              <div style="font-weight:600; color:#f8fafc;">${name}</div>${noc ? `<span style="font-size:0.7rem; color:#64748b;">${noc}</span>` : ''}
            </div>
            <span style="text-align:right; font-weight:700; color:#4ade80; font-size:0.9rem;">+${pts} pts</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

window.SPORT_ENGINES['modern_pentathlon'] = {
  icon: '🎯',
  hasBracket: false,

  renderMatches(data) {
    return renderPentathlonTimeline(data);
  },

  renderStandingsTable(data) {
    return `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.5rem; margin-bottom:1.5rem; text-align:center;">
        <div style="font-size:1.8rem; margin-bottom:0.5rem;">🎯 🤺 🏃 🏊</div>
        <div style="font-weight:700; font-size:1rem; margin-bottom:0.25rem;">Modern Pentathlon Leaderboard</div>
        <div style="color:#94a3b8; font-size:0.82rem; max-width:440px; margin:0 auto; line-height:1.4;">
          Tap any session in the Matches tab to view individual discipline points, heat timings, and overall semi-final progression.
        </div>
      </div>
      ${renderPentathlonTimeline(data)}
    `;
  },

  renderKnockoutBracket() {
    return `<div style="text-align:center; padding:2rem; color:#94a3b8;">Modern Pentathlon uses cumulative point totals across phases rather than a knockout bracket. View the Matches tab for the session timetable.</div>`;
  }
};
