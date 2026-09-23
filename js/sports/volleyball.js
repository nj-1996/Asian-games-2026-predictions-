// ==========================================================================
// Asian Games 2026: Volleyball Sport Engine (FIVB Standings, Bracket & Classification)
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

function findMatchByPattern(matches, pattern) {
  if (!matches) return null;
  return matches.find(m => {
    const s = `${m.round || ''} ${m.stage || ''}`;
    return pattern.test(s);
  }) || null;
}

function resolvePairFromMatch(m, title) {
  if (!m) {
    return { title, t1: 'TBD', t2: 'TBD', winner: 'TBD', loser: 'TBD', isFinished: false, score: '-', status: 'Scheduled' };
  }
  const parsed = typeof parseMatchData === 'function' ? parseMatchData(m) : m;
  const t1 = (parsed.t1 || parsed.player1 || 'TBD').toString().trim();
  const t2 = (parsed.t2 || parsed.player2 || 'TBD').toString().trim();
  const isFinished = parsed.isFinished || (parsed.status && parsed.status.toLowerCase() === 'finished');
  const score = (parsed.score || 'vs').toString();
  const winnerName = parsed.winner || '';

  let w = 'TBD', l = 'TBD';
  if (isFinished && score.includes('-') && !score.includes('vs')) {
    const parts = score.split('-').map(s => Number(s.trim()));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      if (parts[0] > parts[1]) { w = t1; l = t2; }
      else if (parts[1] > parts[0]) { w = t2; l = t1; }
    }
  }
  if (w === 'TBD' && winnerName) {
    if (cleanTeamName(winnerName) === cleanTeamName(t1)) { w = t1; l = t2; }
    else if (cleanTeamName(winnerName) === cleanTeamName(t2)) { w = t2; l = t1; }
  }

  return {
    title,
    t1,
    t2,
    winner: w,
    loser: l,
    isFinished,
    score,
    status: parsed.status || 'Scheduled',
    date: parsed.date || '',
    time: parsed.time || ''
  };
}

window.switchVbBracketTab = function(tabName) {
  window.activeVbBracketTab = tabName;
  const container = document.getElementById('vb-brackets-wrapper');
  if (!container) return;
  const btns = container.querySelectorAll('.vb-bracket-nav button');
  btns.forEach(b => {
    if (b.getAttribute('data-tab') === tabName) b.classList.add('active');
    else b.classList.remove('active');
  });

  const sections = container.querySelectorAll('.vb-bracket-section');
  sections.forEach(sec => {
    if (tabName === 'all' || sec.getAttribute('data-section') === tabName) {
      sec.style.display = 'block';
    } else {
      sec.style.display = 'none';
    }
  });
};

window.SPORT_ENGINES['volleyball'] = {
  icon: '🏐',

  // --- FIVB Standings Engine (3-2-1-0 Point System) & Classification Table ---
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

    // 1. Group / Pool Standings Tables
    const poolTablesHtml = poolKeys.map(grpKey => {
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

    // 2. Tournament Classification & Final Placement Board (Positions 1 to 14/16)
    const placementPairs = isWomen
      ? [
          [1, 2, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:gold|match\s*37)\b/i), 'Gold Medal Final')],
          [3, 4, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:bronze|match\s*36)\b/i), 'Bronze Medal Final')],
          [5, 6, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:5th-6th|match\s*35)\b/i), '5th-6th Place Match')],
          [7, 8, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:7th-8th|match\s*34)\b/i), '7th-8th Place Match')],
          [9, 10, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:9th-10th|match\s*33)\b/i), '9th-10th Place Match')],
          [11, 12, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:11th-12th|match\s*32)\b/i), '11th-12th Place Match')],
          [13, 14, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:13th-14th|match\s*31)\b/i), '13th-14th Place Match')]
        ]
      : [
          [1, 2, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:gold|match\s*48)\b/i), 'Gold Medal Match')],
          [3, 4, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:bronze|match\s*46)\b/i), 'Bronze Medal Match')],
          [5, 6, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:5th\s+place|match\s*44)\b/i), '5th-6th Place Match')],
          [7, 8, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:7th\s+place|match\s*42)\b/i), '7th-8th Place Match')],
          [9, 10, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:9th\s+place|match\s*47)\b/i), '9th-10th Place Match')],
          [11, 12, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:11th\s+place|match\s*45)\b/i), '11th-12th Place Match')],
          [13, 14, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:13th\s+place|match\s*43)\b/i), '13th-14th Place Match')],
          [15, 16, resolvePairFromMatch(findMatchByPattern(matches, /\b(?:15th\s+place|match\s*41)\b/i), '15th-16th Place Match')]
        ];

    const rankingRows = [];
    placementPairs.forEach(([r1, r2, p]) => {
      const isFin = p.isFinished && p.winner !== 'TBD';
      if (isFin) {
        rankingRows.push({
          rank: r1,
          team: p.winner,
          note: `Winner of ${p.title} (${p.score})`,
          isFinished: true
        });
        rankingRows.push({
          rank: r2,
          team: p.loser,
          note: `Runner-up of ${p.title} (${p.score})`,
          isFinished: true
        });
      } else {
        const hasTeams = (p.t1 && p.t1 !== 'TBD') || (p.t2 && p.t2 !== 'TBD');
        const teamLabel = hasTeams ? `${p.t1} / ${p.t2}` : 'TBD';
        const note = `${p.title} • ${p.status || 'Scheduled'}`;
        rankingRows.push({ rank: r1, team: teamLabel, note, isFinished: false });
        rankingRows.push({ rank: r2, team: teamLabel, note, isFinished: false });
      }
    });

    const formatRankBadge = (rank) => {
      if (rank === 1) return '<span style="color:#facc15; font-weight:800;">🥇 1st (Gold)</span>';
      if (rank === 2) return '<span style="color:#cbd5e1; font-weight:800;">🥈 2nd (Silver)</span>';
      if (rank === 3) return '<span style="color:#fb923c; font-weight:800;">🥉 3rd (Bronze)</span>';
      return `<span style="color:#94a3b8; font-weight:700;">${rank}th Place</span>`;
    };

    const classificationTableHtml = `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; margin-bottom:1.5rem; overflow-x:auto;">
        <div style="padding:0.75rem 1rem; font-weight:700; font-size:0.9rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
          <span style="display:flex; align-items:center; gap:6px;">
            <span>🏅</span>
            <span>Final Classification & Rankings (${isWomen ? '1st – 14th Place' : '1st – 16th Place'})</span>
          </span>
          <span style="font-size:0.75rem; color:#94a3b8; font-weight:400;">Position Playoff Results</span>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:left;">
          <thead>
            <tr style="color:#94a3b8; font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05); text-align:left;">
              <th style="padding:0.6rem 0.8rem; width:130px;">Rank</th>
              <th style="padding:0.6rem 0.8rem;">Team</th>
              <th style="padding:0.6rem 0.8rem; text-align:right;">Deciding Match & Status</th>
            </tr>
          </thead>
          <tbody>
            ${rankingRows.map(row => {
              const teamDisplay = row.team.includes('/')
                ? row.team.split('/').map(t => `${typeof getFlagEmoji === 'function' ? getFlagEmoji(t.trim()) : ''} ${t.trim()}`).join(' <span style="color:#64748b; font-size:0.75rem;">vs</span> ')
                : `${typeof getFlagEmoji === 'function' ? getFlagEmoji(row.team) : ''} ${row.team}`;

              return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.03); background:${row.rank <= 3 ? 'rgba(59,130,246,0.03)' : 'transparent'};">
                  <td style="padding:0.6rem 0.8rem; white-space:nowrap;">${formatRankBadge(row.rank)}</td>
                  <td style="padding:0.6rem 0.8rem; font-weight:${row.isFinished ? '700' : '500'};">${teamDisplay}</td>
                  <td style="padding:0.6rem 0.8rem; text-align:right; font-size:0.75rem; color:${row.isFinished ? '#4ade80' : '#94a3b8'};">${row.note}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    return poolTablesHtml + classificationTableHtml;
  },

  // --- Volleyball Knockout & Classification Brackets ---
  renderKnockoutBracket(matches) {
    const list = matches || [];
    const getStage = (m) => ((m.stage || m.round || '') + ' ' + (m.status || '')).toLowerCase();

    const isWomen = (typeof currentGender !== 'undefined' && currentGender === 'women') ||
                    (window.currentGender === 'women') ||
                    list.some(m => {
                      const str = `${m.t1 || m.player1 || ''} ${m.t2 || m.player2 || ''} ${m.stage || m.round || ''}`.toLowerCase();
                      return str.includes('women') || str.includes('nepal') || str.includes('mongolia');
                    });

    const activeTab = window.activeVbBracketTab || 'medals';

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
      const setScores = (m && (m.set_scores || m.setScores)) || (match && (match.set_scores || match.setScores)) || '';

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
          ${setScores ? `<div style="font-size:0.65rem; color:#94a3b8; font-family:monospace; margin-top:4px; text-align:center; border-top:1px dashed rgba(255,255,255,0.06); padding-top:3px;">${setScores}</div>` : ''}
        </div>
      `;
    };

    // --- 1. Championship / Medal Bracket (1st - 4th) ---
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
      if (!isWomen && /\bmatch\s*(39|40)\b/i.test(m.stage || m.round || '')) return true;
      return false;
    };

    const qfMatches = list.filter(isQF);
    const sfMatches = list.filter(isSF);
    const finalMatch = list.find(m => getStage(m).includes('gold') || /\bmatch\s*(37|48)\b/i.test(m.stage || m.round || '') || (getStage(m).includes('final') && !getStage(m).includes('semi') && !getStage(m).includes('quarter') && !getStage(m).includes('bronze')));
    const bronzeMatch = list.find(m => getStage(m).includes('bronze') || /\bmatch\s*(36|46)\b/i.test(m.stage || m.round || '') || getStage(m).includes('3rd'));

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

    const medalsBracketHtml = `
      <div class="vb-bracket-section" data-section="medals" style="${activeTab === 'medals' || activeTab === 'all' ? 'display:block;' : 'display:none;'} margin-bottom:2rem;">
        <div style="font-size:0.85rem; font-weight:700; color:#facc15; margin-bottom:0.75rem; display:flex; align-items:center; gap:6px;">
          <span>🏆</span>
          <span>Championship & Medal Bracket (1st – 4th Place)</span>
        </div>
        <div class="bracket-wrapper" style="padding-top:0.25rem;">
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
      </div>
    `;

    // --- 2. 5th - 8th Place Classification Bracket ---
    const m_5th_sf1 = isWomen
      ? findMatchByPattern(list, /\bmatch\s*25\b/i)
      : findMatchByPattern(list, /\bmatch\s*37\b/i);
    const m_5th_sf2 = isWomen
      ? findMatchByPattern(list, /\bmatch\s*26\b/i)
      : findMatchByPattern(list, /\bmatch\s*38\b/i);
    const m_5th_6th = isWomen
      ? findMatchByPattern(list, /\b(?:5th-6th|match\s*35)\b/i)
      : findMatchByPattern(list, /\b(?:5th\s+place|match\s*44)\b/i);
    const m_7th_8th = isWomen
      ? findMatchByPattern(list, /\b(?:7th-8th|match\s*34)\b/i)
      : findMatchByPattern(list, /\b(?:7th\s+place|match\s*42)\b/i);

    const fifthEighthBracketHtml = `
      <div class="vb-bracket-section" data-section="5th_8th" style="${activeTab === '5th_8th' || activeTab === 'all' ? 'display:block;' : 'display:none;'} margin-bottom:2rem;">
        <div style="font-size:0.85rem; font-weight:700; color:#38bdf8; margin-bottom:0.75rem; display:flex; align-items:center; gap:6px;">
          <span>🏅</span>
          <span>5th – 8th Place Classification</span>
        </div>
        <div class="bracket-wrapper" style="padding-top:0.25rem;">
          <div class="bracket-container" style="min-width:540px;">
            <div class="bracket-round">
              <div class="bracket-round-header">5th–8th Semifinals</div>
              ${renderSlot('Classification SF 1', m_5th_sf1, { t1: 'Loser QF 1', t2: 'Loser QF 4' })}
              ${renderSlot('Classification SF 2', m_5th_sf2, { t1: 'Loser QF 2', t2: 'Loser QF 3' })}
            </div>
            <div class="bracket-round">
              <div class="bracket-round-header">Placement Finals</div>
              ${renderSlot('5th–6th Place Final', m_5th_6th, { t1: 'Winner SF 1', t2: 'Winner SF 2' })}
              ${renderSlot('7th–8th Place Final', m_7th_8th, { t1: 'Loser SF 1', t2: 'Loser SF 2' })}
            </div>
          </div>
        </div>
      </div>
    `;

    // --- 3. 9th - 12th Place Classification Bracket ---
    const m_9th_sf1 = isWomen
      ? findMatchByPattern(list, /\bmatch\s*29\b/i)
      : findMatchByPattern(list, /\bmatch\s*35\b/i);
    const m_9th_sf2 = isWomen
      ? findMatchByPattern(list, /\bmatch\s*30\b/i)
      : findMatchByPattern(list, /\bmatch\s*36\b/i);
    const m_9th_10th = isWomen
      ? findMatchByPattern(list, /\b(?:9th-10th|match\s*33)\b/i)
      : findMatchByPattern(list, /\b(?:9th\s+place|match\s*47)\b/i);
    const m_11th_12th = isWomen
      ? findMatchByPattern(list, /\b(?:11th-12th|match\s*32)\b/i)
      : findMatchByPattern(list, /\b(?:11th\s+place|match\s*45)\b/i);

    const ninthTwelfthBracketHtml = `
      <div class="vb-bracket-section" data-section="9th_12th" style="${activeTab === '9th_12th' || activeTab === 'all' ? 'display:block;' : 'display:none;'} margin-bottom:2rem;">
        <div style="font-size:0.85rem; font-weight:700; color:#a78bfa; margin-bottom:0.75rem; display:flex; align-items:center; gap:6px;">
          <span>🎖️</span>
          <span>9th – 12th Place Classification</span>
        </div>
        <div class="bracket-wrapper" style="padding-top:0.25rem;">
          <div class="bracket-container" style="min-width:540px;">
            <div class="bracket-round">
              <div class="bracket-round-header">9th–12th Semifinals</div>
              ${renderSlot('Classification SF 1', m_9th_sf1, { t1: 'Group 3rd #1', t2: 'Group 3rd #2' })}
              ${renderSlot('Classification SF 2', m_9th_sf2, { t1: 'Group 3rd #3', t2: 'Group 3rd #4' })}
            </div>
            <div class="bracket-round">
              <div class="bracket-round-header">Placement Finals</div>
              ${renderSlot('9th–10th Place Final', m_9th_10th, { t1: 'Winner SF 1', t2: 'Winner SF 2' })}
              ${renderSlot('11th–12th Place Final', m_11th_12th, { t1: 'Loser SF 1', t2: 'Loser SF 2' })}
            </div>
          </div>
        </div>
      </div>
    `;

    // --- 4. 13th - 14th / 16th Place Classification ---
    let thirteenthPlusBracketHtml = '';
    if (isWomen) {
      const m_13th_14th = findMatchByPattern(list, /\b(?:13th-14th|match\s*31)\b/i);
      thirteenthPlusBracketHtml = `
        <div class="vb-bracket-section" data-section="13th_plus" style="${activeTab === '13th_plus' || activeTab === 'all' ? 'display:block;' : 'display:none;'} margin-bottom:2rem;">
          <div style="font-size:0.85rem; font-weight:700; color:#f472b6; margin-bottom:0.75rem; display:flex; align-items:center; gap:6px;">
            <span>🎖️</span>
            <span>13th – 14th Place Classification</span>
          </div>
          <div class="bracket-wrapper" style="padding-top:0.25rem;">
            <div class="bracket-container" style="min-width:320px; max-width:380px;">
              <div class="bracket-round" style="flex:1;">
                <div class="bracket-round-header">Placement Final</div>
                ${renderSlot('13th–14th Place Final', m_13th_14th, { t1: 'Pool C 4th', t2: 'Pool D 4th' })}
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      const m_13th_sf1 = findMatchByPattern(list, /\bmatch\s*33\b/i);
      const m_13th_sf2 = findMatchByPattern(list, /\bmatch\s*34\b/i);
      const m_13th_14th = findMatchByPattern(list, /\b(?:13th\s+place|match\s*43)\b/i);
      const m_15th_16th = findMatchByPattern(list, /\b(?:15th\s+place|match\s*41)\b/i);

      thirteenthPlusBracketHtml = `
        <div class="vb-bracket-section" data-section="13th_plus" style="${activeTab === '13th_plus' || activeTab === 'all' ? 'display:block;' : 'display:none;'} margin-bottom:2rem;">
          <div style="font-size:0.85rem; font-weight:700; color:#f472b6; margin-bottom:0.75rem; display:flex; align-items:center; gap:6px;">
            <span>🎖️</span>
            <span>13th – 16th Place Classification</span>
          </div>
          <div class="bracket-wrapper" style="padding-top:0.25rem;">
            <div class="bracket-container" style="min-width:540px;">
              <div class="bracket-round">
                <div class="bracket-round-header">13th–16th Semifinals</div>
                ${renderSlot('Classification SF 1', m_13th_sf1, { t1: 'Pool 4th #1', t2: 'Pool 4th #2' })}
                ${renderSlot('Classification SF 2', m_13th_sf2, { t1: 'Pool 4th #3', t2: 'Pool 4th #4' })}
              </div>
              <div class="bracket-round">
                <div class="bracket-round-header">Placement Finals</div>
                ${renderSlot('13th–14th Place Final', m_13th_14th, { t1: 'Winner SF 1', t2: 'Winner SF 2' })}
                ${renderSlot('15th–16th Place Final', m_15th_16th, { t1: 'Loser SF 1', t2: 'Loser SF 2' })}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const navPillsHtml = `
      <div class="vb-bracket-nav" style="display:flex; gap:6px; margin-bottom:1.25rem; overflow-x:auto; padding-bottom:4px; -webkit-overflow-scrolling:touch;">
        <button class="sub-nav-btn ${activeTab === 'medals' ? 'active' : ''}" data-tab="medals" onclick="window.switchVbBracketTab('medals')">🏆 1st–4th Medals</button>
        <button class="sub-nav-btn ${activeTab === '5th_8th' ? 'active' : ''}" data-tab="5th_8th" onclick="window.switchVbBracketTab('5th_8th')">🏅 5th–8th Place</button>
        <button class="sub-nav-btn ${activeTab === '9th_12th' ? 'active' : ''}" data-tab="9th_12th" onclick="window.switchVbBracketTab('9th_12th')">🎖️ 9th–12th Place</button>
        <button class="sub-nav-btn ${activeTab === '13th_plus' ? 'active' : ''}" data-tab="13th_plus" onclick="window.switchVbBracketTab('13th_plus')">🎖️ ${isWomen ? '13th–14th Place' : '13th–16th Place'}</button>
        <button class="sub-nav-btn ${activeTab === 'all' ? 'active' : ''}" data-tab="all" onclick="window.switchVbBracketTab('all')">📑 All Brackets</button>
      </div>
    `;

    return `
      <div id="vb-brackets-wrapper">
        ${navPillsHtml}
        ${medalsBracketHtml}
        ${fifthEighthBracketHtml}
        ${ninthTwelfthBracketHtml}
        ${thirteenthPlusBracketHtml}
      </div>
    `;
  }
};
