// ==========================================================================
// Asian Games 2026: Modern Pentathlon Sport Engine (Decoupled Plugin)
// ==========================================================================

window.SPORT_ENGINES = window.SPORT_ENGINES || {};

function getDisciplineIcon(name) {
  const n = (name || '').toLowerCase();
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
      ${nextSession.is_medal ? `
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

  // Find next upcoming session for Hero Card
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
        ${sessions.map(ev => {
          const isFinished = ev.status === 'Official' || ev.status === 'Finished';
          const isLive = ev.status === 'Live';
          const disc = ev.discipline || ev.round || 'Session';
          const icon = getDisciplineIcon(disc);

          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.03);">
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <span style="font-size:1.25rem; line-height:1;">${icon}</span>
                <div>
                  <div style="font-size:0.85rem; font-weight:600; color:#f8fafc;">${disc}</div>
                  <div style="font-size:0.75rem; color:#94a3b8;">${ev.date} •${ev.time}</div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                ${ev.is_medal ? `
                  <span style="font-size:0.75rem; background:rgba(234,179,8,0.15); color:#facc15; border:1px solid rgba(234,179,8,0.3); padding:2px 6px; border-radius:4px; font-weight:600;">
                    🥇 Medal
                  </span>
                ` : ''}
                <span style="font-size:0.75rem; font-weight:600; color:${isLive ? '#ef4444' : isFinished ? '#4ade80' : '#94a3b8'};">
                  ${ev.status}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');

  return renderPentathlonHero(nextSession) + timelineHtml;
}

window.SPORT_ENGINES['modern_pentathlon'] = {
  icon: '🎯',

  renderMatches(data) {
    return renderPentathlonTimeline(data);
  },

  renderStandingsTable(data) {
    return `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.5rem; margin-bottom:1.5rem; text-align:center;">
        <div style="font-size:1.8rem; margin-bottom:0.5rem;">🎯 🤺 🏃 🏊</div>
        <div style="font-weight:700; font-size:1rem; margin-bottom:0.25rem;">Modern Pentathlon Leaderboard</div>
        <div style="color:#94a3b8; font-size:0.82rem; max-width:440px; margin:0 auto; line-height:1.4;">
          Individual and Team classifications will populate here as official scores for Fencing, Obstacle, Swimming, and Laser Run are registered.
        </div>
      </div>
      ${renderPentathlonTimeline(data)}
    `;
  },

  renderKnockoutBracket() {
    return `<div style="text-align:center; padding:2rem; color:#94a3b8;">Modern Pentathlon uses cumulative point totals across phases rather than a knockout bracket. View the Matches tab for the session timetable.</div>`;
  }
};
