// ==========================================================================
// Asian Games 2026: Handball Engine (Men: 9 Teams | Women: 7 Teams)
// ==========================================================================

window.SPORT_ENGINES = window.SPORT_ENGINES || {};
window.SPORT_ENGINES['handball'] = {
  icon: '🤾',

  // --- Standings Calculator & Table Generator ---
  renderStandingsTable(matches) {
    if (!matches || matches.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No handball match data available.</div>`;
    }

    const parsedMatches = matches.map(m => (typeof parseMatchData === 'function' ? parseMatchData(m) : m));
    const groups = {};

    parsedMatches.forEach(m => {
      const rawStage = String(m.stage || m.round || '');
      // Match "Group A", "Group B", "Group", "Pool A", etc.
      const grpMatch = rawStage.match(/(?:group|pool|gr\.?)\s*([a-z0-9]*)/i);
      if (!grpMatch && !/group|preliminary/i.test(rawStage)) return;

      let grpKey = 'Group Stage';
      if (grpMatch && grpMatch[1]) {
        grpKey = `Group ${grpMatch[1].toUpperCase()}`;
      } else if (/group|preliminary/i.test(rawStage)) {
        grpKey = 'Preliminary Pool';
      }

      if (!groups[grpKey]) groups[grpKey] = {};

      const t1 = m.t1 || m.player1 || m.team1;
      const t2 = m.t2 || m.player2 || m.team2;

      if (t1 && t2 && t1 !== 'TBD' && t2 !== 'TBD' && !t1.includes('Place') && !t2.includes('Place') && !t1.includes('Group') && !t2.includes('Group')) {
        [t1, t2].forEach(team => {
          if (!groups[grpKey][team]) {
            groups[grpKey][team] = { name: team, gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
          }
        });

        const isFin = m.isFinished || String(m.status || m.state || '').toLowerCase().includes('finish') || String(m.status || m.state || '').toLowerCase().includes('official');
        const s1 = Number(m.s1 != null ? m.s1 : m.score1);
        const s2 = Number(m.s2 != null ? m.s2 : m.score2);

        if (isFin && !isNaN(s1) && !isNaN(s2)) {
          const team1 = groups[grpKey][t1];
          const team2 = groups[grpKey][t2];

          team1.gp += 1;
          team2.gp += 1;
          team1.gf += s1;
          team1.ga += s2;
          team2.gf += s2;
          team2.ga += s1;

          // Official Handball Scoring: Win = 2 pts, Draw = 1 pt, Loss = 0 pts
          if (s1 > s2) {
            team1.w += 1;
            team1.pts += 2;
            team2.l += 1;
          } else if (s2 > s1) {
            team2.w += 1;
            team2.pts += 2;
            team1.l += 1;
          } else {
            team1.d += 1;
            team2.d += 1;
            team1.pts += 1;
            team2.pts += 1;
          }

          team1.gd = team1.gf - team1.ga;
          team2.gd = team2.gf - team2.ga;
        }
      }
    });

    const groupKeys = Object.keys(groups).sort();
    if (groupKeys.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No preliminary group data found for handball.</div>`;
    }

    const badgeStyles = {
      'Q': 'background:rgba(34,197,94,0.18); color:#4ade80; border:1px solid rgba(74,222,128,0.35);',
      'E': 'background:rgba(148,163,184,0.15); color:#94a3b8; border:1px solid rgba(148,163,184,0.25);'
    };

    const isMen = (window.currentGender === 'men') || (typeof currentGender !== 'undefined' && currentGender === 'men') || groupKeys.length > 1;

    return groupKeys.map(grpKey => {
      const teams = Object.values(groups[grpKey]);
      teams.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

      // Qualification rules:
      // Men: Top 4 from each group advance to Quarterfinals (Q), 5th eliminated (E)
      // Women: Top 4 from single group advance to Semifinals (Q), 5th-7th eliminated (E)
      const qCutoff = 4;
      const subtitleText = isMen
        ? 'Top 4 teams advance to the Quarterfinals'
        : 'Top 4 teams advance directly to the Semifinals';

      return `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.75rem;">
            <div style="font-weight:700; font-size:1.1rem; color:#f8fafc; display:flex; align-items:center; gap:0.5rem;">
              <span>🤾</span> <span>${grpKey}</span>
            </div>
            <span style="font-size:0.75rem; color:#94a3b8;">${subtitleText}</span>
          </div>

          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.85rem;">
              <thead>
                <tr style="color:#94a3b8; border-bottom:1px solid rgba(255,255,255,0.1); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em;">
                  <th style="padding:8px 6px; text-align:center; width:28px;">#</th>
                  <th style="padding:8px 6px;">Team</th>
                  <th style="padding:8px 6px; text-align:center;">GP</th>
                  <th style="padding:8px 6px; text-align:center;">W</th>
                  <th style="padding:8px 6px; text-align:center;">D</th>
                  <th style="padding:8px 6px; text-align:center;">L</th>
                  <th style="padding:8px 6px; text-align:center;">GF</th>
                  <th style="padding:8px 6px; text-align:center;">GA</th>
                  <th style="padding:8px 6px; text-align:center;">GD</th>
                  <th style="padding:8px 6px; text-align:center; font-weight:700; color:#f8fafc;">Pts</th>
                  <th style="padding:8px 6px; text-align:center; width:36px;">Adv</th>
                </tr>
              </thead>
              <tbody>
                ${teams.map((t, idx) => {
                  const rank = idx + 1;
                  const qualifies = rank <= qCutoff;
                  const status = qualifies ? 'Q' : 'E';
                  const badgeStyle = badgeStyles[status] || '';

                  const badgeHtml = `<span style="display:inline-block; font-size:0.65rem; font-weight:700; padding:2px 5px; border-radius:4px; ${badgeStyle}">${status}</span>`;

                  return `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04); background:${qualifies ? 'rgba(34,197,94,0.03)' : 'transparent'};">
                      <td style="padding:10px 6px; text-align:center; color:#94a3b8; font-weight:600;">${rank}</td>
                      <td style="padding:10px 6px; font-weight:600; color:#f8fafc;">
                        ${typeof getFlagEmoji === 'function' ? getFlagEmoji(t.name) : ''} ${t.name}
                      </td>
                      <td style="padding:10px 6px; text-align:center; color:#cbd5e1;">${t.gp}</td>
                      <td style="padding:10px 6px; text-align:center; color:#cbd5e1;">${t.w}</td>
                      <td style="padding:10px 6px; text-align:center; color:#cbd5e1;">${t.d}</td>
                      <td style="padding:10px 6px; text-align:center; color:#cbd5e1;">${t.l}</td>
                      <td style="padding:10px 6px; text-align:center; color:#cbd5e1;">${t.gf}</td>
                      <td style="padding:10px 6px; text-align:center; color:#cbd5e1;">${t.ga}</td>
                      <td style="padding:10px 6px; text-align:center; font-weight:600; color:${t.gd > 0 ? '#4ade80' : (t.gd < 0 ? '#f87171' : '#94a3b8')};">
                        ${t.gd > 0 ? `+${t.gd}` : t.gd}
                      </td>
                      <td style="padding:10px 6px; text-align:center; font-weight:800; color:#38bdf8; font-size:0.95rem;">${t.pts}</td>
                      <td style="padding:10px 6px; text-align:center;">${badgeHtml}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');
  },

  // --- Knockout Bracket Engine ---
  renderKnockoutBracket(matches) {
    if (!matches || matches.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No knockout fixtures available.</div>`;
    }

    const parsed = matches.map(m => (typeof parseMatchData === 'function' ? parseMatchData(m) : m));
    const getStage = (m) => String(m.stage || m.round || '').toLowerCase();

    const qfMatches = parsed.filter(m => getStage(m).includes('quarter') || getStage(m).includes('qf') || getStage(m).includes('1/4'));
    const sfMatches = parsed.filter(m => getStage(m).includes('semi') || getStage(m).includes('sf') || getStage(m).includes('1/2'));
    const finalMatch = parsed.find(m => getStage(m).includes('gold') || (getStage(m).includes('final') && !getStage(m).includes('semi') && !getStage(m).includes('quarter') && !getStage(m).includes('bronze')));
    const bronzeMatch = parsed.find(m => getStage(m).includes('bronze') || getStage(m).includes('3rd'));

    const getGame = (list, num) => list.find(m => new RegExp(`(?:match|qf|sf|quarterfinal|semifinal)\\s*${num}`, 'i').test(m.stage || m.round)) || list[num - 1];

    const renderSlot = (title, match, fallback, medalType = null) => {
      const t1 = (match && match.t1 && match.t1 !== 'TBD') ? match.t1 : (fallback ? fallback.t1 : 'TBD');
      const t2 = (match && match.t2 && match.t2 !== 'TBD') ? match.t2 : (fallback ? fallback.t2 : 'TBD');
      const s1 = match ? (match.s1 != null ? match.s1 : '-') : '-';
      const s2 = match ? (match.s2 != null ? match.s2 : '-') : '-';
      const isFinished = match ? match.isFinished : false;

      const cWinner = match && match.winner ? cleanTeamName(match.winner) : '';
      const t1Win = cWinner ? cWinner === cleanTeamName(t1) : (isFinished && Number(s1) > Number(s2));
      const t2Win = cWinner ? cWinner === cleanTeamName(t2) : (isFinished && Number(s2) > Number(s1));
      const displayDateTime = match ? (formatMatchDateTime(match.date, match.time) || match.status || 'Scheduled') : 'Scheduled';
      const setScores = match ? (match.set_scores || match.setScores || '') : '';

      return `
        <div class="bracket-match-card">
          <div class="bracket-match-header">
            <span>${title}</span>
            ${medalType ? `<span class="bracket-medal-badge medal-${medalType}">${medalType.toUpperCase()}</span>` : ''}
            <span>${displayDateTime}</span>
          </div>
          <div class="bracket-team-row ${t1Win ? 'winner' : ''}">
            <div class="bracket-team-info"><span>${typeof getFlagEmoji === 'function' ? getFlagEmoji(t1) : ''}</span> <span>${t1}</span></div>
            <span class="bracket-score">${s1}</span>
          </div>
          <div class="bracket-team-row ${t2Win ? 'winner' : ''}">
            <div class="bracket-team-info"><span>${typeof getFlagEmoji === 'function' ? getFlagEmoji(t2) : ''}</span> <span>${t2}</span></div>
            <span class="bracket-score">${s2}</span>
          </div>
          ${setScores ? `<div style="font-size:0.65rem; color:#94a3b8; font-family:monospace; text-align:right; margin-top:3px; padding-right:6px;">${setScores}</div>` : ''}
        </div>
      `;
    };

    const hasQFs = qfMatches.length > 0;

    if (hasQFs) {
      // Men's 8-team Knockout Bracket: QF -> SF -> Finals
      return `
        <div class="bracket-wrapper">
          <div class="bracket-container">
            <div class="bracket-round">
              <div class="bracket-round-header">Quarterfinals</div>
              ${renderSlot('QF 1', getGame(qfMatches, 1), { t1: '1st Group A', t2: '4th Group B' })}
              ${renderSlot('QF 2', getGame(qfMatches, 2), { t1: '2nd Group B', t2: '3rd Group A' })}
              ${renderSlot('QF 3', getGame(qfMatches, 3), { t1: '1st Group B', t2: '4th Group A' })}
              ${renderSlot('QF 4', getGame(qfMatches, 4), { t1: '2nd Group A', t2: '3rd Group B' })}
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

    // Women's 4-team Knockout Bracket: SF -> Finals
    return `
      <div class="bracket-wrapper">
        <div class="bracket-container">
          <div class="bracket-round">
            <div class="bracket-round-header">Semifinals</div>
            ${renderSlot('SF 1', getGame(sfMatches, 1), { t1: '1st Place', t2: '4th Place' })}
            ${renderSlot('SF 2', getGame(sfMatches, 2), { t1: '2nd Place', t2: '3rd Place' })}
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
