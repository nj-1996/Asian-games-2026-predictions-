// ==========================================================================
// Asian Games 2026: Basketball Sport Engine (FIBA Standings & Bracket Rules)
// ==========================================================================

window.SPORT_ENGINES = window.SPORT_ENGINES || {};

window.SPORT_ENGINES['basketball'] = {
  icon: '🏀',

  // --- FIBA Standings Engine ---
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

  // --- Basketball Knockout Bracket ---
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
