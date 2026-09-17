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
  if (n.includes('riding') || n.includes('equestrian')) return '🏇';
  return '🏅';
}

function renderPentathlonSessions(items) {
  const list = Array.isArray(items) ? items : (items?.events || items?.matches || []);
  if (!list || list.length === 0) {
    return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No session timetable available.</div>`;
  }

  const phaseMap = {};
  list.forEach(ev => {
    let pName = ev.round || ev.phase || 'Competition Schedule';

    // Auto-split morning vs afternoon semifinals if generic
    if (ev.group && !pName.includes(ev.group)) {
      pName = `${pName} (${ev.group})`;
    } else if (pName === 'SF' || pName.toLowerCase() === 'semi-final') {
      const hour = parseInt((ev.time || '00:00').split(':')[0], 10);
      pName = hour < 13 ? 'Semi-final (Group A)' : 'Semi-final (Group B)';
    }

    if (!phaseMap[pName]) phaseMap[pName] = [];
    phaseMap[pName].push(ev);
  });

  return Object.entries(phaseMap).map(([phaseHeader, sessions]) => `
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
          const medalLabel = ev.medal_desc || 'Medal Event';

          return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.8rem 1rem; border-bottom:1px solid rgba(255,255,255,0.03);">
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
                    🥇 ${medalLabel}
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
}

window.SPORT_ENGINES['modern_pentathlon'] = {
  icon: '🎯',

  // --- Session Timeline / Matches Tab ---
  renderMatches(data) {
    return renderPentathlonSessions(data);
  },

  // --- Leaderboard View / Standings Tab ---
  renderStandingsTable(data) {
    const athletes = (data && data.leaderboard) ? data.leaderboard : [];

    if (athletes.length === 0) {
      return `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.5rem; margin-bottom:1.5rem; text-align:center;">
          <div style="font-size:1.8rem; margin-bottom:0.5rem;">🎯 🤺 🏃 🏊</div>
          <div style="font-weight:700; font-size:1rem; margin-bottom:0.25rem;">Modern Pentathlon Leaderboard</div>
          <div style="color:#94a3b8; font-size:0.82rem; max-width:440px; margin:0 auto; line-height:1.4;">
            Individual and Team point classifications will automatically populate here once scores for Fencing, Obstacle, Swimming, and Laser Run are registered at Anjo Sports Park.
          </div>
        </div>
        ${renderPentathlonSessions(data)}
      `;
    }

    return `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; margin-bottom:1.5rem; overflow-x:auto;">
        <div style="padding:0.75rem 1rem; font-weight:700; font-size:0.9rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
          <span>Individual Final Classification</span>
          <span style="font-size:0.75rem; color:#94a3b8;">UIPM 2026 Point System</span>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:center;">
          <thead>
            <tr style="color:#94a3b8; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);">
              <th style="padding:0.6rem 0.5rem; text-align:left;"># Athlete</th>
              <th style="padding:0.6rem 0.3rem;">Fence</th>
              <th style="padding:0.6rem 0.3rem;">Obstacle</th>
              <th style="padding:0.6rem 0.3rem;">Swim</th>
              <th style="padding:0.6rem 0.3rem;">Laser</th>
              <th style="padding:0.6rem 0.5rem; font-weight:700; color:#f8fafc;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${athletes.map((a, idx) => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.03); background:${idx < 3 ? 'rgba(234,179,8,0.04)' : 'transparent'};">
                <td style="padding:0.6rem 0.5rem; text-align:left; font-weight:${idx < 3 ? '700' : '400'};">
                  <span style="display:inline-block; width:18px; color:${idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#d97706' : '#94a3b8'};">${idx + 1}</span>${typeof getFlagEmoji === 'function' ? getFlagEmoji(a.nation) : ''} ${a.name} <span style="font-size:0.75rem; color:#94a3b8;">(${a.nation})</span>
                </td>
                <td style="padding:0.6rem 0.3rem;">${a.fencing || '-'}</td>
                <td style="padding:0.6rem 0.3rem;">${a.obstacle || '-'}</td>
                <td style="padding:0.6rem 0.3rem;">${a.swimming || '-'}</td>
                <td style="padding:0.6rem 0.3rem;">${a.laser_run || '-'}</td>
                <td style="padding:0.6rem 0.5rem; font-weight:700; color:#38bdf8;">${a.total || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // --- Knockout Bracket Tab ---
  renderKnockoutBracket() {
    return `<div style="text-align:center; padding:2rem; color:#94a3b8;">Modern Pentathlon uses cumulative point totals across phases rather than a knockout bracket. View the Matches tab for the session timetable.</div>`;
  }
};
