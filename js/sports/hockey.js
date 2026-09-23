// ==========================================================================
// Asian Games 2026: Field Hockey Engine (Men & Women)
// ==========================================================================

window.SPORT_ENGINES = window.SPORT_ENGINES || {};
window.SPORT_ENGINES['hockey'] = {
  icon: '🏑',

  // --- Standings Calculator & Table Generator ---
  renderStandingsTable(matches) {
    if (!matches || matches.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No hockey match data available.</div>`;
    }

    const parsedMatches = matches.map(m => (typeof parseMatchData === 'function' ? parseMatchData(m) : m));
    const pools = {};

    parsedMatches.forEach(m => {
      const rawStage = String(m.stage || m.round || '');
      const poolMatch = rawStage.match(/(?:group|pool|gr\.?)\s*([a-z0-9]+)/i);
      if (!poolMatch) return;

      const poolKey = `Pool ${poolMatch[1].toUpperCase()}`;
      if (!pools[poolKey]) pools[poolKey] = {};

      const t1 = m.t1 || m.player1 || m.team1;
      const t2 = m.t2 || m.player2 || m.team2;

      if (t1 && t2 && t1 !== 'TBD' && t2 !== 'TBD') {
        [t1, t2].forEach(team => {
          if (!pools[poolKey][team]) {
            pools[poolKey][team] = { name: team, gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
          }
        });

        const isFin = m.isFinished || String(m.status || m.state || '').toLowerCase().includes('finish') || String(m.status || m.state || '').toLowerCase().includes('official');
        const s1 = Number(m.s1 != null ? m.s1 : m.score1);
        const s2 = Number(m.s2 != null ? m.s2 : m.score2);

        if (isFin && !isNaN(s1) && !isNaN(s2)) {
          const team1 = pools[poolKey][t1];
          const team2 = pools[poolKey][t2];

          team1.gp += 1;
          team2.gp += 1;
          team1.gf += s1;
          team1.ga += s2;
          team2.gf += s2;
          team2.ga += s1;

          if (s1 > s2) {
            team1.w += 1;
            team1.pts += 3;
            team2.l += 1;
          } else if (s2 > s1) {
            team2.w += 1;
            team2.pts += 3;
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

    const poolKeys = Object.keys(pools).sort();
    if (poolKeys.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No pool data found for hockey.</div>`;
    }

    const badgeStyles = {
      'Q': 'background:rgba(34,197,94,0.18); color:#4ade80; border:1px solid rgba(74,222,128,0.35);',
      '5-8': 'background:rgba(56,189,248,0.18); color:#38bdf8; border:1px solid rgba(56,189,248,0.35);',
      '9-12': 'background:rgba(148,163,184,0.15); color:#94a3b8; border:1px solid rgba(148,163,184,0.25);'
    };

    return poolKeys.map(poolKey => {
      // FIH ranking criteria: PTS -> Wins -> GD -> GF
      const teams = Object.values(pools[poolKey]).sort((a, b) => (
        b.pts - a.pts || b.w - a.w || b.gd - a.gd || b.gf - a.gf
      ));

      return `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; margin-bottom:1.5rem; overflow-x:auto;">
          <div style="padding:0.75rem 1rem; font-weight:700; font-size:0.9rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
            <span>${poolKey}</span>
            <span style="font-size:0.75rem; color:#94a3b8; font-weight:400;">Top 2 advance to Semifinals</span>
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:center;">
            <thead>
              <tr style="color:#94a3b8; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);">
                <th style="padding:0.6rem 0.5rem; text-align:left;"># Team</th>
                <th style="padding:0.6rem 0.25rem;">GP</th>
                <th style="padding:0.6rem 0.25rem;">W</th>
                <th style="padding:0.6rem 0.25rem;">D</th>
                <th style="padding:0.6rem 0.25rem;">L</th>
                <th style="padding:0.6rem 0.25rem;">GF</th>
                <th style="padding:0.6rem 0.25rem;">GA</th>
                <th style="padding:0.6rem 0.25rem;">GD</th>
                <th style="padding:0.6rem 0.45rem; font-weight:700; color:#f8fafc;">PTS</th>
              </tr>
            </thead>
            <tbody>
              ${teams.map((t, idx) => {
                let badge = '';
                if (idx < 2) badge = 'Q';
                else if (idx < 4) badge = '5-8';
                else badge = '9-12';

                const badgeHtml = badge
                  ? `<span style="display:inline-block; font-size:0.65rem; font-weight:800; padding:1px 5px; border-radius:4px; margin-left:6px; vertical-align:middle; ${badgeStyles[badge]}">${badge}</span>`
                  : '';
                const isQualifier = idx < 2;

                return `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.03); background:${isQualifier ? 'rgba(59,130,246,0.04)' : 'transparent'};">
                    <td style="padding:0.6rem 0.5rem; text-align:left; font-weight:${isQualifier ? '700' : '400'};">
                      <span style="display:inline-block; width:16px; color:${isQualifier ? '#38bdf8' : 'inherit'};">${idx + 1}</span>
                      ${getFlagEmoji(t.name)} ${t.name} ${badgeHtml}
                    </td>
                    <td style="padding:0.6rem 0.25rem;">${t.gp}</td>
                    <td style="padding:0.6rem 0.25rem; color:#4ade80;">${t.w}</td>
                    <td style="padding:0.6rem 0.25rem; color:#94a3b8;">${t.d}</td>
                    <td style="padding:0.6rem 0.25rem; color:#f87171;">${t.l}</td>
                    <td style="padding:0.6rem 0.25rem;">${t.gf}</td>
                    <td style="padding:0.6rem 0.25rem;">${t.ga}</td>
                    <td style="padding:0.6rem 0.25rem; font-family:monospace; color:${t.gd > 0 ? '#4ade80' : t.gd < 0 ? '#f87171' : 'inherit'};">${t.gd > 0 ? '+' + t.gd : t.gd}</td>
                    <td style="padding:0.6rem 0.45rem; font-weight:700; color:#38bdf8;">${t.pts}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  },

  // --- Knockout Bracket Engine (Semifinals -> Finals & Classification) ---
  renderKnockoutBracket(matches) {
    if (!matches || matches.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No knockout fixtures available.</div>`;
    }

    const parsed = matches.map(m => (typeof parseMatchData === 'function' ? parseMatchData(m) : m));
    const getStage = (m) => String(m.stage || m.round || '').toLowerCase();

    const sfMatches = parsed.filter(m => getStage(m).includes('semi') || getStage(m).includes('sf') || getStage(m).includes('1/2'));
    const finalMatch = parsed.find(m => getStage(m).includes('gold') || (getStage(m).includes('final') && !getStage(m).includes('semi') && !getStage(m).includes('quarter') && !getStage(m).includes('bronze') && !getStage(m).includes('classification')));
    const bronzeMatch = parsed.find(m => getStage(m).includes('bronze') || getStage(m).includes('3rd'));

    // Placement finals
    const match56 = parsed.find(m => getStage(m).includes('5th-6th') || getStage(m).includes('5-6'));
    const match78 = parsed.find(m => getStage(m).includes('7th-8th') || getStage(m).includes('7-8'));
    const match910 = parsed.find(m => getStage(m).includes('9th-10th') || getStage(m).includes('9-10'));
    const match1112 = parsed.find(m => getStage(m).includes('11th-12th') || getStage(m).includes('11-12'));

    const getGame = (list, num) => list.find(m => new RegExp(`match\\s*${num}|sf\\s*${num}|game\\s*${num}`, 'i').test(m.stage || m.round)) || list[num - 1];

    const defaultSF1 = { t1: '1st Pool A', t2: '2nd Pool B' };
    const defaultSF2 = { t1: '1st Pool B', t2: '2nd Pool A' };

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

    let classificationHtml = '';
    if (match56 || match78 || match910 || match1112) {
      classificationHtml = `
        <div style="margin-top:2rem;">
          <div style="font-weight:700; font-size:1rem; margin-bottom:1rem; color:#f8fafc; display:flex; align-items:center; gap:0.5rem;">
            <span>🎖️ Classification Matches</span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1rem;">
            ${match56 ? renderSlot('5th-6th Place Match', match56, { t1: 'TBD', t2: 'TBD' }) : ''}
            ${match78 ? renderSlot('7th-8th Place Match', match78, { t1: 'TBD', t2: 'TBD' }) : ''}
            ${match910 ? renderSlot('9th-10th Place Match', match910, { t1: 'TBD', t2: 'TBD' }) : ''}
            ${match1112 ? renderSlot('11th-12th Place Match', match1112, { t1: 'TBD', t2: 'TBD' }) : ''}
          </div>
        </div>
      `;
    }

    return `
      <div class="bracket-wrapper">
        <div class="bracket-container" style="justify-content:center;">
          <div class="bracket-round">
            <div class="bracket-round-header">Semifinals</div>
            ${renderSlot('SF 1', getGame(sfMatches, 1), defaultSF1)}
            ${renderSlot('SF 2', getGame(sfMatches, 2), defaultSF2)}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Medal Matches</div>
            ${renderSlot('Gold Medal', finalMatch, { t1: 'Winner SF 1', t2: 'Winner SF 2' }, 'gold')}
            ${renderSlot('Bronze Medal', bronzeMatch, { t1: 'Loser SF 1', t2: 'Loser SF 2' }, 'bronze')}
          </div>
        </div>
        ${classificationHtml}
      </div>
    `;
  }
};
