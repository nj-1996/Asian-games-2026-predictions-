// ==========================================================================
// Asian Games 2026: Volleyball Sport Engine (FIVB Standings & Bracket)
// ==========================================================================

window.SPORT_ENGINES = window.SPORT_ENGINES || {};

const VOLLEYBALL_POOLS_WOMEN = {
  'Pool A': ['Japan', 'Indonesia', 'Nepal'],
  'Pool B': ['China', 'Kazakhstan', 'Philippines'],
  'Pool C': ['Thailand', 'Chinese Taipei', 'Mongolia', 'Kyrgyzstan'],
  'Pool D': ['Korea', 'Vietnam', 'Hong Kong, China', 'Qatar']
};

const VOLLEYBALL_POOLS_MEN = {
  'Pool A': ['Japan', 'Pakistan', 'Kazakhstan', 'Uzbekistan'],
  'Pool B': ['IR Iran', 'Indonesia', 'Thailand', 'Kyrgyzstan'],
  'Pool C': ['Qatar', 'India', 'Vietnam', 'Hong Kong, China'],
  'Pool D': ['China', 'Korea', 'Chinese Taipei', 'Philippines']
};

function normalizeVbTeam(name) {
  if (!name || typeof name !== 'string') return '';
  const n = name.toLowerCase().trim();
  if (n.includes('korea') && !n.includes('north')) return 'korea';
  if (n.includes('hong kong')) return 'hong kong';
  if (n.includes('iran')) return 'iran';
  if (n.includes('taipei') || n.includes('taiwan')) return 'chinese taipei';
  return n.replace(/[^a-z0-9]/g, '');
}

function buildVolleyballPools(matches) {
  const parsedMatches = (matches || []).map(m => typeof parseMatchData === 'function' ? parseMatchData(m) : m);

  // Detect whether dataset represents Women's or Men's draw
  const isWomen = (typeof currentGender !== 'undefined' && currentGender === 'women') ||
                  (window.currentGender === 'women') ||
                  parsedMatches.some(m => {
                    const str = `${m.t1 || m.player1 || ''} ${m.t2 || m.player2 || ''} ${m.stage || m.round || ''}`.toLowerCase();
                    return str.includes('women') || str.includes('nepal') || str.includes('mongolia');
                  });

  const officialPools = isWomen ? VOLLEYBALL_POOLS_WOMEN : VOLLEYBALL_POOLS_MEN;
  const teamToPool = {};
  const teamDisplayNames = {};

  Object.entries(officialPools).forEach(([poolName, teams]) => {
    teams.forEach(team => {
      const normKey = normalizeVbTeam(team);
      teamToPool[normKey] = poolName;
      teamToPool[team.toLowerCase()] = poolName;
      teamDisplayNames[normKey] = team;
      teamDisplayNames[team.toLowerCase()] = team;
    });
  });

  const getTeamPool = (name) => {
    if (!name) return null;
    return teamToPool[normalizeVbTeam(name)] || teamToPool[name.toLowerCase()] || null;
  };

  const prelimMatches = [];

  parsedMatches.forEach(m => {
    const t1 = (m.t1 || m.player1 || '').toString().trim();
    const t2 = (m.t2 || m.player2 || '').toString().trim();
    if (!t1 || !t2 || t1 === 'TBD' || t2 === 'TBD') return;

    const roundStr = (m.stage || m.round || '').toString().toLowerCase();
    // Exclude explicit classification or medal rounds
    if (/(?:place|medal|final|semi|quarter|qf|sf|1\/4|1\/2)/.test(roundStr)) return;

    const p1 = getTeamPool(t1);
    const p2 = getTeamPool(t2);

    // Intra-pool match: both teams belong to the same official pool
    if (p1 && p2 && p1 === p2) {
      prelimMatches.push({ m, t1, t2, pool: p1, roundStr });
    }
  });

  return {
    isWomen,
    prelimMatches,
    poolAssignments: officialPools,
    teamToPool,
    teamDisplayNames
  };
}

window.SPORT_ENGINES['volleyball'] = {
  icon: '🏐',

  // --- FIVB Standings Engine (3-2-1-0 Point System) ---
  renderStandingsTable(matches) {
    if (!matches || matches.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No group stage data available.</div>`;
    }

    const { isWomen, prelimMatches, poolAssignments } = buildVolleyballPools(matches);
    const poolKeys = Object.keys(poolAssignments).sort();

    if (poolKeys.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No group stage fixtures scheduled.</div>`;
    }

    const groups = {};
    poolKeys.forEach(poolName => {
      groups[poolName] = {};
      poolAssignments[poolName].forEach(team => {
        groups[poolName][team] = {
          name: team,
          gp: 0, w: 0, l: 0, pts: 0, sw: 0, sl: 0, diff: 0
        };
      });
    });

    prelimMatches.forEach(({ m, t1, t2, pool }) => {
      const poolGroup = groups[pool];
      if (!poolGroup) return;

      const norm1 = normalizeVbTeam(t1);
      const norm2 = normalizeVbTeam(t2);

      const t1Key = Object.keys(poolGroup).find(k => normalizeVbTeam(k) === norm1) || t1;
      const t2Key = Object.keys(poolGroup).find(k => normalizeVbTeam(k) === norm2) || t2;

      const team1Entry = poolGroup[t1Key];
      const team2Entry = poolGroup[t2Key];
      if (!team1Entry || !team2Entry) return;

      let s1 = m.s1 !== undefined && m.s1 !== '-' ? m.s1 : null;
      let s2 = m.s2 !== undefined && m.s2 !== '-' ? m.s2 : null;
      const scoreStr = (m.score || '').toString();

      if (s1 === null && scoreStr.includes('-') && !scoreStr.includes('vs')) {
        const parts = scoreStr.split('-').map(s => s.trim());
        if (!isNaN(parts[0]) && !isNaN(parts[1])) {
          s1 = parts[0];
          s2 = parts[1];
        }
      }

      const isFinished = m.isFinished || (m.status && m.status.toLowerCase() === 'finished');

      if (isFinished && s1 !== null && s2 !== null) {
        const score1 = Number(s1);
        const score2 = Number(s2);

        team1Entry.gp += 1;
        team2Entry.gp += 1;
        team1Entry.sw += score1;
        team1Entry.sl += score2;
        team2Entry.sw += score2;
        team2Entry.sl += score1;

        // FIVB 3-2-1-0 Point System
        if (score1 > score2) {
          team1Entry.w += 1;
          team2Entry.l += 1;
          if (score2 === 2) {
            team1Entry.pts += 2;
            team2Entry.pts += 1;
          } else {
            team1Entry.pts += 3;
          }
        } else if (score2 > score1) {
          team2Entry.w += 1;
          team1Entry.l += 1;
          if (score1 === 2) {
            team2Entry.pts += 2;
            team1Entry.pts += 1;
          } else {
            team2Entry.pts += 3;
          }
        }

        team1Entry.diff = team1Entry.sw - team1Entry.sl;
        team2Entry.diff = team2Entry.sw - team2Entry.sl;
      }
    });

    // Check if group stage is finished
    const allGroupFinished = prelimMatches.length > 0 && prelimMatches.every(p => p.m.isFinished || (p.m.status && p.m.status.toLowerCase() === 'finished'));

    const statusMap = {};
    if (allGroupFinished) {
      poolKeys.forEach(grpKey => {
        const sorted = Object.values(groups[grpKey]).sort((a, b) => 
          b.pts - a.pts || b.w - a.w || b.diff - a.diff || b.sw - a.sw || a.name.localeCompare(b.name)
        );
        sorted.forEach((team, idx) => {
          const status = idx < 2 ? 'Q' : 'E';
          statusMap[team.name] = status;
          statusMap[normalizeVbTeam(team.name)] = status;
        });
      });
    }

    const badgeStyles = {
      'Q': 'background:rgba(34,197,94,0.18); color:#4ade80; border:1px solid rgba(74,222,128,0.35);',
      'E': 'background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(248,113,113,0.25);'
    };

    const qualifierRuleText = isWomen ? 'Top 2 advance to Quarterfinals' : 'Top 2 advance to Round of 12';

    return poolKeys.map(grpKey => {
      const teams = Object.values(groups[grpKey]).sort((a, b) => 
        b.pts - a.pts || b.w - a.w || b.diff - a.diff || b.sw - a.sw || a.name.localeCompare(b.name)
      );

      return `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; margin-bottom:1.5rem; overflow-x:auto;">
          <div style="padding:0.75rem 1rem; font-weight:700; font-size:0.9rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
            <span>${grpKey}</span>
            ${allGroupFinished
              ? `<span style="font-size:0.75rem;"><strong style="color:#4ade80;">Q</strong> Qualified &nbsp;•&nbsp; <strong style="color:#f87171;">E</strong> Eliminated</span>`
              : `<span style="font-size:0.75rem; color:#94a3b8; font-weight:400;">${qualifierRuleText}</span>`
            }
          </div>
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:center;">
            <thead>
              <tr style="color:#94a3b8; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);">
                <th style="padding:0.6rem 0.5rem; text-align:left;"># Team</th>
                <th style="padding:0.6rem 0.3rem;">GP</th>
                <th style="padding:0.6rem 0.3rem;">W</th>
                <th style="padding:0.6rem 0.3rem;">L</th>
                <th style="padding:0.6rem 0.3rem;">SW</th>
                <th style="padding:0.6rem 0.3rem;">SL</th>
                <th style="padding:0.6rem 0.3rem;">DIFF</th>
                <th style="padding:0.6rem 0.5rem; font-weight:700; color:#f8fafc;">PTS</th>
              </tr>
            </thead>
            <tbody>
              ${teams.map((t, idx) => {
                const badge = statusMap[t.name] || statusMap[normalizeVbTeam(t.name)];
                const badgeHtml = badge
                  ? `<span style="display:inline-block; font-size:0.65rem; font-weight:800; padding:1px 5px; border-radius:4px; margin-left:6px; vertical-align:middle; ${badgeStyles[badge]}">${badge}</span>`
                  : '';
                const isEliminated = badge === 'E';

                return `
                  <tr style="border-bottom:1px solid rgba(255,255,255,0.03); opacity:${isEliminated ? '0.75' : '1'}; background:${idx < 2 ? 'rgba(59,130,246,0.04)' : 'transparent'};">
                    <td style="padding:0.6rem 0.5rem; text-align:left; font-weight:${idx < 2 ? '700' : '400'};">
                      <span style="display:inline-block; width:16px; color:${idx < 2 ? '#38bdf8' : 'inherit'};">${idx + 1}</span>
                      ${typeof getFlagEmoji === 'function' ? getFlagEmoji(t.name) : ''} ${t.name} ${badgeHtml}
                    </td>
                    <td style="padding:0.6rem 0.3rem;">${t.gp}</td>
                    <td style="padding:0.6rem 0.3rem; color:#4ade80;">${t.w}</td>
                    <td style="padding:0.6rem 0.3rem; color:#f87171;">${t.l}</td>
                    <td style="padding:0.6rem 0.3rem;">${t.sw}</td>
                    <td style="padding:0.6rem 0.3rem;">${t.sl}</td>
                    <td style="padding:0.6rem 0.3rem; font-family:monospace; color:${t.diff > 0 ? '#4ade80' : t.diff < 0 ? '#f87171' : 'inherit'};">${t.diff > 0 ? '+' + t.diff : t.diff}</td>
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

  // --- Volleyball Knockout Bracket ---
  renderKnockoutBracket(matches) {
    const list = matches || [];
    const getStage = (m) => ((m.stage || m.round || '') + ' ' + (m.status || '')).toLowerCase();

    const isWomen = (typeof currentGender !== 'undefined' && currentGender === 'women') ||
                    (window.currentGender === 'women') ||
                    list.some(m => {
                      const str = `${m.t1 || m.player1 || ''} ${m.t2 || m.player2 || ''} ${m.stage || m.round || ''}`.toLowerCase();
                      return str.includes('women') || str.includes('nepal') || str.includes('mongolia');
                    });

    const isQF = (m) => {
      const st = getStage(m);
      if (st.includes('quarter') || st.includes('qf') || st.includes('1/4')) return true;
      if (isWomen && /\bmatch\s*(19|20|21|22)\b/i.test(m.stage || m.round || '')) return true;
      return false;
    };

    const isSF = (m) => {
      const st = getStage(m);
      if (st.includes('semi') || st.includes('sf') || st.includes('1/2')) return true;
      if (isWomen && /\bmatch\s*(27|28)\b/i.test(m.stage || m.round || '')) return true;
      return false;
    };

    const qfMatches = list.filter(isQF);
    const sfMatches = list.filter(isSF);
    const finalMatch = list.find(m => getStage(m).includes('gold') || /\bmatch\s*37\b/i.test(m.stage || m.round || '') || (getStage(m).includes('final') && !getStage(m).includes('semi') && !getStage(m).includes('quarter') && !getStage(m).includes('bronze')));
    const bronzeMatch = list.find(m => getStage(m).includes('bronze') || /\bmatch\s*36\b/i.test(m.stage || m.round || '') || getStage(m).includes('3rd'));

    const getGame = (items, num) => {
      if (isWomen) {
        const matchNums = [19, 21, 22, 20];
        const targetNum = matchNums[num - 1];
        const found = items.find(m => new RegExp(`\\bmatch\\s*${targetNum}\\b`, 'i').test(m.stage || m.round || ''));
        if (found) return found;
      }
      return items.find(m => new RegExp(`game\\s*${num}`, 'i').test(m.stage || m.round || '')) || items[num - 1];
    };

    const getSFGame = (items, num) => {
      if (isWomen) {
        const matchNums = [27, 28];
        const targetNum = matchNums[num - 1];
        const found = items.find(m => new RegExp(`\\bmatch\\s*${targetNum}\\b`, 'i').test(m.stage || m.round || ''));
        if (found) return found;
      }
      return items.find(m => new RegExp(`game\\s*${num}`, 'i').test(m.stage || m.round || '')) || items[num - 1];
    };

    const defaultQF = isWomen
      ? [
          { title: 'QF 1', t1: '1st Pool A', t2: '2nd Pool C' },
          { title: 'QF 2', t1: '1st Pool C', t2: '2nd Pool A' },
          { title: 'QF 3', t1: '1st Pool B', t2: '2nd Pool D' },
          { title: 'QF 4', t1: '1st Pool D', t2: '2nd Pool B' }
        ]
      : [
          { title: 'QF 1', t1: '1st Pool A', t2: '2nd Pool B' },
          { title: 'QF 2', t1: '1st Pool C', t2: '2nd Pool D' },
          { title: 'QF 3', t1: '1st Pool B', t2: '2nd Pool A' },
          { title: 'QF 4', t1: '1st Pool D', t2: '2nd Pool C' }
        ];

    const renderSlot = (title, match, fallback, medalType = null) => {
      const m = match ? (typeof parseMatchData === 'function' ? parseMatchData(match) : match) : null;
      const t1 = (m && (m.t1 || m.player1) && (m.t1 || m.player1) !== 'TBD') ? (m.t1 || m.player1) : fallback.t1;
      const t2 = (m && (m.t2 || m.player2) && (m.t2 || m.player2) !== 'TBD') ? (m.t2 || m.player2) : fallback.t2;

      let s1 = m && m.s1 !== undefined ? m.s1 : '-';
      let s2 = m && m.s2 !== undefined ? m.s2 : '-';
      if (s1 === '-' && m && m.score && m.score.includes('-') && !m.score.includes('vs')) {
        const parts = m.score.split('-').map(s => s.trim());
        s1 = parts[0];
        s2 = parts[1];
      }

      const isFinished = m ? (m.isFinished || (m.status && m.status.toLowerCase() === 'finished')) : false;
      const t1Win = m && m.winner ? (typeof cleanTeamName === 'function' ? cleanTeamName(m.winner) === cleanTeamName(t1) : m.winner === t1) : (isFinished && Number(s1) > Number(s2));
      const t2Win = m && m.winner ? (typeof cleanTeamName === 'function' ? cleanTeamName(m.winner) === cleanTeamName(t2) : m.winner === t2) : (isFinished && Number(s2) > Number(s1));

      const dt = m ? (typeof formatMatchDateTime === 'function' ? formatMatchDateTime(m.date, m.time) : `${m.date} ${m.time}`) : 'Scheduled';

      return `
        <div class="bracket-match-card">
          <div class="bracket-match-header">
            <span>${title}</span>
            ${medalType ? `<span class="bracket-medal-badge medal-${medalType}">${medalType.toUpperCase()}</span>` : ''}
            <span>${dt || 'Scheduled'}</span>
          </div>
          <div class="bracket-team-row ${t1Win ? 'winner' : ''}">
            <div class="bracket-team-info"><span>${typeof getFlagEmoji === 'function' ? getFlagEmoji(t1) : ''}</span> <span>${t1}</span></div>
            <span class="bracket-score">${s1}</span>
          </div>
          <div class="bracket-team-row ${t2Win ? 'winner' : ''}">
            <div class="bracket-team-info"><span>${typeof getFlagEmoji === 'function' ? getFlagEmoji(t2) : ''}</span> <span>${t2}</span></div>
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
            ${renderSlot('SF 1', getSFGame(sfMatches, 1), { t1: 'Winner QF 1', t2: 'Winner QF 4' })}
            ${renderSlot('SF 2', getSFGame(sfMatches, 2), { t1: 'Winner QF 2', t2: 'Winner QF 3' })}
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
