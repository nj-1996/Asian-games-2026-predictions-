// ==========================================================================
// Asian Games 2026: Volleyball Sport Engine (FIVB Standings & Bracket)
// ==========================================================================

window.SPORT_ENGINES = window.SPORT_ENGINES || {};

// Dynamic partition of preliminary round-robin fixtures into isolated pools
function buildVolleyballPools(matches) {
  const prelimMatches = [];
  const teamAdj = {};
  const teamDisplayNames = {};

  function registerTeam(t) {
    const key = t.toLowerCase();
    if (!teamAdj[key]) teamAdj[key] = new Set();
    if (!teamDisplayNames[key]) teamDisplayNames[key] = t;
  }

  matches.forEach(rawM => {
    const m = typeof parseMatchData === 'function' ? parseMatchData(rawM) : rawM;
    const t1 = (m.t1 || m.player1 || rawM.player1 || '').toString().trim();
    const t2 = (m.t2 || m.player2 || rawM.player2 || '').toString().trim();

    if (!t1 || !t2 || t1 === 'TBD' || t2 === 'TBD') return;

    const roundStr = (m.stage || m.round || rawM.round || '').toString().toLowerCase();
    // Exclude knockout and classification fixtures from pool formation
    if (/(?:place|medal|final|semi|quarter|qf|sf)/.test(roundStr)) return;

    prelimMatches.push({ m, rawM, t1, t2, roundStr });
    registerTeam(t1);
    registerTeam(t2);
    teamAdj[t1.toLowerCase()].add(t2.toLowerCase());
    teamAdj[t2.toLowerCase()].add(t1.toLowerCase());
  });

  // Breadth-First Search to isolate connected components
  const visited = new Set();
  const components = [];

  Object.keys(teamAdj).forEach(teamKey => {
    if (visited.has(teamKey)) return;
    const comp = [];
    const queue = [teamKey];
    visited.add(teamKey);

    while (queue.length > 0) {
      const curr = queue.shift();
      comp.push(curr);
      teamAdj[curr].forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }
    components.push(comp);
  });

  // Assign standard pool designations (Pool A, Pool B, etc.)
  const poolAssignments = {};
  const usedPools = new Set();
  const unassignedComps = [];

  components.forEach(comp => {
    const compSet = new Set(comp);
    let detectedPool = null;

    // 1. Direct label check from fixture metadata
    for (const item of prelimMatches) {
      if (compSet.has(item.t1.toLowerCase())) {
        const match = item.roundStr.match(/(?:pool|group)\s+([a-d0-9]+)/i);
        if (match) {
          detectedPool = `Pool ${match[1].toUpperCase()}`;
          break;
        }
      }
    }

    // 2. Anchor seeded nations if metadata is generic (e.g. "Match 1")
    if (!detectedPool) {
      if (compSet.has('japan')) detectedPool = 'Pool A';
      else if (compSet.has('thailand') || compSet.has('ir iran') || compSet.has('iran')) detectedPool = 'Pool B';
      else if (compSet.has('vietnam') || compSet.has('qatar') || compSet.has('india')) detectedPool = 'Pool C';
      else if (compSet.has('china') || compSet.has('korea') || compSet.has('south korea') || compSet.has('chinese taipei')) detectedPool = 'Pool D';
    }

    if (detectedPool && !usedPools.has(detectedPool)) {
      poolAssignments[detectedPool] = comp;
      usedPools.add(detectedPool);
    } else {
      unassignedComps.push(comp);
    }
  });

  const availablePoolNames = ['Pool A', 'Pool B', 'Pool C', 'Pool D', 'Pool E', 'Pool F'];
  unassignedComps.forEach(comp => {
    const nextPool = availablePoolNames.find(p => !usedPools.has(p)) || `Pool ${usedPools.size + 1}`;
    poolAssignments[nextPool] = comp;
    usedPools.add(nextPool);
  });

  const teamToPool = {};
  Object.entries(poolAssignments).forEach(([poolName, teamList]) => {
    teamList.forEach(teamKey => {
      teamToPool[teamKey] = poolName;
    });
  });

  return { prelimMatches, teamToPool, poolAssignments, teamDisplayNames };
}

window.SPORT_ENGINES['volleyball'] = {
  icon: '🏐',

  // --- FIVB Standings Engine (3-2-1-0 Point System) ---
  renderStandingsTable(matches) {
    if (!matches || matches.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No group stage data available.</div>`;
    }

    const { prelimMatches, teamToPool, poolAssignments, teamDisplayNames } = buildVolleyballPools(matches);
    const poolKeys = Object.keys(poolAssignments).sort();

    if (poolKeys.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No group stage fixtures scheduled.</div>`;
    }

    // Initialize clean tables with zero ghost teams
    const groups = {};
    poolKeys.forEach(poolName => {
      groups[poolName] = {};
      poolAssignments[poolName].forEach(teamKey => {
        const displayName = teamDisplayNames[teamKey] || teamKey;
        groups[poolName][displayName] = {
          name: displayName,
          gp: 0, w: 0, l: 0, pts: 0, sw: 0, sl: 0, diff: 0
        };
      });
    });

    // Score calculations
    prelimMatches.forEach(({ m, rawM, t1, t2 }) => {
      const poolName = teamToPool[t1.toLowerCase()];
      if (!poolName || !groups[poolName]) return;

      const team1Entry = groups[poolName][teamDisplayNames[t1.toLowerCase()]];
      const team2Entry = groups[poolName][teamDisplayNames[t2.toLowerCase()]];
      if (!team1Entry || !team2Entry) return;

      let s1 = m.s1 !== undefined && m.s1 !== '-' ? m.s1 : null;
      let s2 = m.s2 !== undefined && m.s2 !== '-' ? m.s2 : null;
      const scoreStr = (m.score || rawM.score || '').toString();

      if (s1 === null && scoreStr.includes('-') && !scoreStr.includes('vs')) {
        const parts = scoreStr.split('-').map(s => s.trim());
        if (!isNaN(parts[0]) && !isNaN(parts[1])) {
          s1 = parts[0];
          s2 = parts[1];
        }
      }

      const isFinished = m.isFinished || (m.status && m.status.toLowerCase() === 'finished') || (rawM.status && rawM.status.toLowerCase() === 'finished');

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

    return poolKeys.map(grpKey => {
      const teams = Object.values(groups[grpKey]).sort((a, b) => 
        b.pts - a.pts || b.w - a.w || b.diff - a.diff || b.sw - a.sw || a.name.localeCompare(b.name)
      );

      return `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; margin-bottom:1.5rem; overflow-x:auto;">
          <div style="padding:0.75rem 1rem; font-weight:700; font-size:0.9rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
            <span>${grpKey}</span>
            <span style="font-size:0.75rem; color:#94a3b8; font-weight:400;">Top 2 advance to Round of 12</span>
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
              ${teams.map((t, idx) => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.03); background:${idx < 2 ? 'rgba(59,130,246,0.04)' : 'transparent'};">
                  <td style="padding:0.6rem 0.5rem; text-align:left; font-weight:${idx < 2 ? '700' : '400'};">
                    <span style="display:inline-block; width:16px; color:${idx < 2 ? '#38bdf8' : 'inherit'};">${idx + 1}</span>
                    ${typeof getFlagEmoji === 'function' ? getFlagEmoji(t.name) : ''} ${t.name}
                  </td>
                  <td style="padding:0.6rem 0.3rem;">${t.gp}</td>
                  <td style="padding:0.6rem 0.3rem; color:#4ade80;">${t.w}</td>
                  <td style="padding:0.6rem 0.3rem; color:#f87171;">${t.l}</td>
                  <td style="padding:0.6rem 0.3rem;">${t.sw}</td>
                  <td style="padding:0.6rem 0.3rem;">${t.sl}</td>
                  <td style="padding:0.6rem 0.3rem; font-family:monospace; color:${t.diff > 0 ? '#4ade80' : t.diff < 0 ? '#f87171' : 'inherit'};">${t.diff > 0 ? '+' + t.diff : t.diff}</td>
                  <td style="padding:0.6rem 0.5rem; font-weight:700; color:#38bdf8;">${t.pts}</td>
                </tr>
              `).join('')}
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

    const qfMatches = list.filter(m => getStage(m).includes('quarter') || getStage(m).includes('qf'));
    const sfMatches = list.filter(m => getStage(m).includes('semi') || getStage(m).includes('sf'));
    const finalMatch = list.find(m => getStage(m).includes('gold') || (getStage(m).includes('final') && !getStage(m).includes('semi') && !getStage(m).includes('quarter') && !getStage(m).includes('bronze')));
    const bronzeMatch = list.find(m => getStage(m).includes('bronze') || getStage(m).includes('3rd'));

    const getGame = (items, num) => items.find(m => new RegExp(`game\\s*${num}`, 'i').test(m.stage || m.round || '')) || items[num - 1];

    const defaultQF = [
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
