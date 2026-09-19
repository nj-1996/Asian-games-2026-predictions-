// ==========================================================================
// Asian Games 2026: Cricket Sport Engine (Decoupled Plugin)
// ==========================================================================

(function () {
  window.SPORT_ENGINES = window.SPORT_ENGINES || {};

  // --- Smart Fetch Interceptor for Custom Tracker Filenames ---
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    const activeSport = window.currentSport || localStorage.getItem('app_sport');
    if (activeSport === 'cricket' && typeof url === 'string') {
      if (url.includes('women_matches.json')) {
        url = url.replace('women_matches.json', 'tracker_women.json');
      } else if (url.includes('men_matches.json')) {
        url = url.replace('men_matches.json', 'tracker_men.json');
      }
    }
    return originalFetch.apply(this, arguments);
  };

  const CRICKET_ENGINE = {
    icon: '🏏',
    hasBracket: true,

    renderStandingsTable(matches) {
      const parsedMatches = matches.map(m => parseMatchData(m));
      const groups = {};

      parsedMatches.forEach(m => {
        const grpMatch = m.stage.match(/Group\s+[A-Za-z0-9]+/i);
        const grpName = grpMatch ? grpMatch[0] : null;

        if (!grpName) return;
        if (!groups[grpName]) groups[grpName] = {};

        if (m.t1 !== 'TBD' && m.t2 !== 'TBD') {
          [m.t1, m.t2].forEach(team => {
            if (!groups[grpName][team]) {
              groups[grpName][team] = { name: team, p: 0, w: 0, l: 0, pts: 0, nrr: '0.00' };
            }
          });

          if (m.isFinished && m.s1 !== '-' && m.s2 !== '-') {
            groups[grpName][m.t1].p += 1;
            groups[grpName][m.t2].p += 1;

            const t1Won = m.winner ? cleanTeamName(m.winner) === cleanTeamName(m.t1) : true;
            if (t1Won) {
              groups[grpName][m.t1].w += 1;
              groups[grpName][m.t1].pts += 2;
              groups[grpName][m.t2].l += 1;
            } else {
              groups[grpName][m.t2].w += 1;
              groups[grpName][m.t2].pts += 2;
              groups[grpName][m.t1].l += 1;
            }
          }
        }
      });

      const groupKeys = Object.keys(groups).sort();
      if (groupKeys.length === 0) {
        const isWomen = (typeof currentGender !== 'undefined' ? currentGender : window.currentGender) === 'women';
        if (isWomen) {
          return `
            <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(59,130,246,0.2); border-radius:12px; padding:2rem 1.5rem; text-align:center; margin-top:1rem;">
              <div style="font-size:2rem; margin-bottom:0.75rem;">ℹ️</div>
              <div style="font-weight:700; font-size:1rem; color:#f8fafc; margin-bottom:0.4rem;">Direct Knockout Format</div>
              <div style="font-size:0.85rem; color:#94a3b8; line-height:1.5; max-width:380px; margin:0 auto;">
                Women's Cricket starts directly from the Quarterfinals and does not feature a group stage. Use the <strong>Bracket</strong> or <strong>Schedule</strong> tab to view fixtures and results.
              </div>
            </div>
          `;
        }
        return `<div style="text-align:center; padding:2rem; color:#94a3b8;">Group stage standings will update as matches complete.</div>`;
      }

      return groupKeys.map(grpKey => {
        const teams = Object.values(groups[grpKey]).sort((a, b) => b.pts - a.pts || b.w - a.w);

        return `
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; margin-bottom:1.5rem; overflow-x:auto;">
            <div style="padding:0.75rem 1rem; font-weight:700; font-size:0.9rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
              <span>${grpKey} Standings</span>
              <span style="font-size:0.75rem; color:#94a3b8; font-weight:400;">Top teams advance to Quarterfinals</span>
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:center;">
              <thead>
                <tr style="color:#94a3b8; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);">
                  <th style="padding:0.6rem 0.5rem; text-align:left;"># Team</th>
                  <th style="padding:0.6rem 0.3rem;">P</th>
                  <th style="padding:0.6rem 0.3rem;">W</th>
                  <th style="padding:0.6rem 0.3rem;">L</th>
                  <th style="padding:0.6rem 0.5rem; font-weight:700; color:#f8fafc;">PTS</th>
                </tr>
              </thead>
              <tbody>
                ${teams.map((t, idx) => `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.03); background:${idx < 2 ? 'rgba(59,130,246,0.04)' : 'transparent'};">
                    <td style="padding:0.6rem 0.5rem; text-align:left; font-weight:${idx < 2 ? '700' : '400'};">
                      <span style="display:inline-block; width:16px; color:${idx < 2 ? '#38bdf8' : 'inherit'};">${idx + 1}</span>
                      ${getFlagEmoji(t.name)}${t.name}
                    </td>
                    <td style="padding:0.6rem 0.3rem;">${t.p}</td>
                    <td style="padding:0.6rem 0.3rem; color:#4ade80;">${t.w}</td>
                    <td style="padding:0.6rem 0.3rem; color:#f87171;">${t.l}</td>
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
        { title: 'QF 1', t1: 'Pakistan', t2: '2nd Group B' },
        { title: 'QF 2', t1: 'India', t2: '2nd Group A' },
        { title: 'QF 3', t1: 'Sri Lanka', t2: '1st Group A' },
        { title: 'QF 4', t1: 'Bangladesh', t2: '1st Group B' }
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

      const hasQF = qfMatches.length > 0;

      return `
        <div class="bracket-wrapper">
          <div class="bracket-container">
            ${hasQF ? `
              <div class="bracket-round">
                <div class="bracket-round-header">Quarterfinals</div>
                ${[0, 1, 2, 3].map(i => renderSlot(`QF ${i + 1}`, getGame(qfMatches, i + 1), defaultQF[i])).join('')}
              </div>
            ` : ''}
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

  window.SPORT_ENGINES['cricket'] = CRICKET_ENGINES = CRICKET_ENGINE;
})();
