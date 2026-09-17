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

window.SPORT_ENGINES['modern_pentathlon'] = {
  icon: '🎯',

  // --- Session Timeline / Event Schedule ---
  renderMatches(events) {
    const list = (events && events.events) ? events.events : (Array.isArray(events) ? events : []);
    if (list.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No session timetable available.</div>`;
    }

    const phases = {};
    list.forEach(ev => {
      const pName = ev.phase || 'Competition Schedule';
      if (!phases[pName]) phases[pName] = [];
      phases[pName].push(ev);
    });

    return Object.entries(phases).map(([phaseName, phaseEvents]) => `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:1.5rem; overflow:hidden;">
        <div style="padding:0.75rem 1rem; font-weight:700; font-size:0.95rem; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); display:flex; justify-content:space-between; align-items:center;">
          <span>${phaseName}</span>
          <span style="font-size:0.75rem; color:#94a3b8; font-weight:400;">${phaseEvents[0]?.venue || 'Anjo Sports Park'}</span>
        </div>
        <div>
          ${phaseEvents.map(ev => {
            const isFinished = ev.status === 'Official' || ev.status === 'Finished';
            const isLive = ev.status === 'Live';
            const icon = getDisciplineIcon(ev.discipline);

            return `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.8rem 1rem; border-bottom:1px solid rgba(255,255,255,0.03);">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                  <span style="font-size:1.2rem; line-height:1;">${icon}</span>
                  <div>
                    <div style="font-size:0.85rem; font-weight:600; color:#f8fafc;">${ev.discipline}</div>
                    <div style="font-size:0.75rem; color:#94a3b8;">${ev.date} •${ev.time}</div>
                  </div>
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  ${ev.is_medal ? `<span style="font-size:0.75rem; background:rgba(234,179,8,0.15); color:#facc15; border:1px solid rgba(234,179,8,0.3); padding:2px 6px; border-radius:4px; font-weight:600;">Medal Event</span>` : ''}
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
  },

  // --- Leaderboard View (Individual & Team Standings) ---
  renderStandingsTable(data) {
    const athletes = (data && data.leaderboard) ? data.leaderboard : [];
    if (athletes.length === 0) {
      return `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.5rem; text-align:center;">
          <div style="font-size:1.5rem; margin-bottom:0.5rem;">🎯 🤺 🏃 🏊</div>
          <div style="font-weight:700; font-size:0.95rem; margin-bottom:0.25rem;">Modern Pentathlon Standings</div>
          <div style="color:#94a3b8; font-size:0.8rem; max-width:400px; margin:0 auto;">
            Official individual and team point standings will populate as scores for Fencing, Obstacle, Swimming, and Laser Run are registered.
          </div>
        </div>
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

  // Pentathlon does not use a knockout tree
  renderKnockoutBracket() {
    return `<div style="text-align:center; padding:2rem; color:#94a3b8;">Modern Pentathlon uses cumulative points scoring instead of a knockout bracket. Check the Leaderboard tab for standings.</div>`;
  }
};
