// ==========================================================================
// Asian Games 2026: Football Engine (Men: Groups A-D | Women: Groups E-G)
// ==========================================================================

const footballEngine = {
  // --- Standings Calculator & Table Generator ---
  renderStandingsTable(matches) {
    const parsedMatches = matches.map(m => parseMatchData(m));
    const groupMatches = parsedMatches.filter(m => /group|pool/i.test(m.stage));
    const allGroupFinished = groupMatches.length > 0 && groupMatches.every(m => m.isFinished);

    const groups = {};

    parsedMatches.forEach(m => {
      const grpMatch = m.stage.match(/Group\s+[A-Za-z0-9]+/i) || m.stage.match(/Pool\s+[A-Za-z0-9]+/i);
      const grpName = grpMatch ? grpMatch[0] : (m.stage.toLowerCase().includes('group') ? m.stage : null);

      if (!grpName) return;
      if (!groups[grpName]) groups[grpName] = {};

      if (m.t1 !== 'TBD' && m.t2 !== 'TBD') {
        [m.t1, m.t2].forEach(team => {
          if (!groups[grpName][team]) {
            groups[grpName][team] = { name: team, gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
          }
        });

        if (m.isFinished && m.s1 !== '-' && m.s2 !== '-') {
          const s1 = Number(m.s1);
          const s2 = Number(m.s2);
          const t1 = groups[grpName][m.t1];
          const t2 = groups[grpName][m.t2];

          t1.gp += 1;
          t2.gp += 1;
          t1.gf += s1;
          t1.ga += s2;
          t2.gf += s2;
          t2.ga += s1;

          if (s1 > s2) {
            t1.w += 1;
            t1.pts += 3;
            t2.l += 1;
          } else if (s2 > s1) {
            t2.w += 1;
            t2.pts += 3;
            t1.l += 1;
          } else {
            t1.d += 1;
            t2.d += 1;
            t1.pts += 1;
            t2.pts += 1;
          }

          t1.gd = t1.gf - t1.ga;
          t2.gd = t2.gf - t2.ga;
        }
      }
    });

    const groupKeys = Object.keys(groups).sort();
    if (groupKeys.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No football group data available.</div>`;
    }

    // Identify tournament branch: Women's uses groups E, F, G; Men's uses A, B, C, D
    const isWomenDivision = groupKeys.some(k => /group\s+[efg]/i.test(k));
    const statusMap = {};

    if (allGroupFinished) {
      if (isWomenDivision) {
        // Women: Top 2 advance (Q) + top 2 of the three 3rd-placed teams (q)
        const thirdPlaceTeams = [];

        groupKeys.forEach(grpKey => {
          const sorted = Object.values(groups[grpKey]).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
          sorted.forEach((team, idx) => {
            if (idx < 2) statusMap[team.name] = 'Q';
            else if (idx === 2) thirdPlaceTeams.push(team);
            else statusMap[team.name] = 'E';
          });
        });

        thirdPlaceTeams.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
        thirdPlaceTeams.forEach((team, idx) => {
          statusMap[team.name] = idx < 2 ? 'q' : 'E';
        });
      } else {
        // Men: Top 2 advance directly (Q) from each group (A-D)
        groupKeys.forEach(grpKey => {
          const sorted = Object.values(groups[grpKey]).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
          sorted.forEach((team, idx) => {
            statusMap[team.name] = idx < 2 ? 'Q' : 'E';
          });
        });
      }
    }

    const badgeStyles = {
      'Q': 'background:rgba(34,197,94,0.18); color:#4ade80; border:1px solid rgba(74,222,128,0.35);',
      'q': 'background:rgba(56,189,248,0.18); color:#38bdf8; border:1px solid rgba(56,189,248,0.35);',
      'E': 'background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(248,113,113,0.25);'
    };

    const qualifierRuleText = isWomenDivision ? 'Top 2 + best 2 3rd advance' : 'Top 2 advance to Quarterfinals';

    return groupKeys.map(grpKey => {
      const teams = Object.values(groups[grpKey]).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

      return `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; margin-bottom:1.5rem; overflow-x:auto;">
          <div style="padding:0.75rem 1rem; font-weight:700; font-size:0.9rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
            <span>${grpKey}</span>
            <span style="font-size:0.75rem; color:#94a3b8; font-weight:400;">${qualifierRuleText}</span>
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
                const badge = statusMap[t.name];
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

  // --- Knockout Bracket Engine (Quarterfinals -> Semifinals -> Finals) ---
  renderKnockoutBracket(matches) {
    const parsed = matches.map(m => parseMatchData(m));
    const getStage = (m) => (m.stage + ' ' + m.status).toLowerCase();

    const qfMatches = parsed.filter(m => getStage(m).includes('quarter') || getStage(m).includes('qf') || getStage(m).includes('1/4'));
    const sfMatches = parsed.filter(m => getStage(m).includes('semi') || getStage(m).includes('sf') || getStage(m).includes('1/2'));
    const finalMatch = parsed.find(m => getStage(m).includes('gold') || (getStage(m).includes('final') && !getStage(m).includes('semi') && !getStage(m).includes('quarter') && !getStage(m).includes('bronze')));
    const bronzeMatch = parsed.find(m => getStage(m).includes('bronze') || getStage(m).includes('3rd'));

    const getGame = (list, num) => list.find(m => new RegExp(`game\\s*${num}|qf\\s*${num}`, 'i').test(m.stage)) || list[num - 1];

    const isWomen = parsed.some(m => /group\s+[efg]/i.test(m.stage));

    // Default seedings
    const defaultQF = isWomen
      ? [
          { title: 'QF 1', t1: '1st Group E', t2: '2nd Group F' },
          { title: 'QF 2', t1: '1st Group G', t2: 'Wildcard 2' },
          { title: 'QF 3', t1: '2nd Group G', t2: '2nd Group E' },
          { title: 'QF 4', t1: '1st Group F', t2: 'Wildcard 1' }
        ]
      : [
          { title: 'QF 1', t1: '1st Group A', t2: '2nd Group B' },
          { title: 'QF 2', t1: '1st Group C', t2: '2nd Group D' },
          { title: 'QF 3', t1: '1st Group B', t2: '2nd Group A' },
          { title: 'QF 4', t1: '1st Group D', t2: '2nd Group C' }
        ];

    const renderSlot = (title, match, fallback, medalType = null) => {
      const t1 = (match && match.t1 && match.t1 !== 'TBD') ? match.t1 : fallback.t1;
      const t2 = (match && match.t2 && match.t2 !== 'TBD') ? match.t2 : fallback.t2;
      const s1 = match ? match.s1 : '-';
      const s2 = match ? match.s2 : '-';
      const isFinished = match ? match.isFinished : false;
      const t1Win = match && match.winner ? match.winner.toLowerCase() === t1.toLowerCase() : (isFinished && Number(s1) > Number(s2));
      const t2Win = match && match.winner ? match.winner.toLowerCase() === t2.toLowerCase() : (isFinished && Number(s2) > Number(s1));
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
