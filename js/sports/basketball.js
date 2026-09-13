// --- Sub-View State ---
let matchesSubTab = 'fixtures'; // 'fixtures' | 'standings'

function setMatchesSubTab(subTab) {
  matchesSubTab = subTab;
  const container = document.getElementById('content-cards');
  const matches = currentGender === 'men' ? appData.menMatches : appData.womenMatches;
  renderMatchesView(container, matches);
}

// --- Group Standings Calculator ---
function calculateGroupStandings(matches) {
  const groups = {};

  const ensureTeam = (groupKey, teamName) => {
    if (!groups[groupKey]) groups[groupKey] = {};
    if (!groups[groupKey][teamName]) {
      groups[groupKey][teamName] = {
        team: teamName,
        gp: 0,
        w: 0,
        l: 0,
        pf: 0,
        pa: 0,
        diff: 0,
        pts: 0
      };
    }
    return groups[groupKey][teamName];
  };

  matches.forEach(m => {
        if (!m || !m.round) return;

    // 1. Skip placeholder / unconfirmed matches
    const p1 = (m.player1 || '').trim();
    const p2 = (m.player2 || '').trim();
    if (!p1 || !p2 || /^(tbd|tba)$/i.test(p1) || /^(tbd|tba)$/i.test(p2)) return;

    // 2. Filter out knockout / classification games
    const isKnockout = /(quarter|semi|final|classification|bronze|gold|placement)/i.test(m.round);
    if (isKnockout) return;

    // 3. Only keep matches assigned to Group A, B, C, or D
    const groupMatch = m.round.match(/Group\s+([A-D])/i);
    if (!groupMatch) return;
    const groupKey = `Group ${groupMatch[1].toUpperCase()}`;

    const t1 = ensureTeam(groupKey, p1);
    const t2 = ensureTeam(groupKey, p2);
    

    if (m.status === 'Finished') {
      t1.gp++;
      t2.gp++;

      // Parse score e.g., "85 - 72" or "85-72"
      let s1 = 0, s2 = 0;
      const scoreParts = (m.score || "").match(/(\d+)\s*[-:]\s*(\d+)/);
      if (scoreParts) {
        s1 = parseInt(scoreParts[1], 10);
        s2 = parseInt(scoreParts[2], 10);
        t1.pf += s1;
        t1.pa += s2;
        t2.pf += s2;
        t2.pa += s1;
      }

      const p1Norm = normName(m.player1);
      const p2Norm = normName(m.player2);
      const winNorm = normName(m.winner);

      if (winNorm === p1Norm || s1 > s2) {
        t1.w++;
        t1.pts += 2; // FIBA win: 2 pts
        t2.l++;
        t2.pts += 1; // FIBA loss: 1 pt
      } else if (winNorm === p2Norm || s2 > s1) {
        t2.w++;
        t2.pts += 2;
        t1.l++;
        t1.pts += 1;
      }
    }
  });

  // Calculate differentials and sort
  const result = {};
  Object.keys(groups).sort().forEach(gKey => {
    const list = Object.values(groups[gKey]).map(t => {
      t.diff = t.pf - t.pa;
      return t;
    });

    // Sort: Points -> Point Differential -> Points For
    list.sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.diff !== a.diff) return b.diff - a.diff;
      return b.pf - a.pf;
    });

    result[gKey] = list;
  });

  return result;
}

// --- Render Standings View ---
function renderStandingsTablesHtml(matches) {
  const groups = calculateGroupStandings(matches);
  const groupKeys = Object.keys(groups);

  if (groupKeys.length === 0) {
    return '<div class="empty-state">No group stage data available.</div>';
  }

  return groupKeys.map(gKey => {
    const teams = groups[gKey];
    return `
      <div class="group-title">
        <span>🏀</span> ${gKey}
      </div>
      <div class="table-container">
        <table class="medal-table standings-table">
          <thead>
            <tr>
              <th style="width: 42%;">Team</th>
              <th>GP</th>
              <th>W</th>
              <th>L</th>
              <th>PF</th>
              <th>PA</th>
              <th>+/-</th>
              <th style="font-weight: 800; color: #fff;">PTS</th>
            </tr>
          </thead>
          <tbody>
            ${teams.map((t, idx) => {
              const info = getNOCInfo(t.team);
              const diffClass = t.diff > 0 ? 'diff-pos' : (t.diff < 0 ? 'diff-neg' : 'diff-zero');
              const diffStr = t.diff > 0 ? `+${t.diff}` : `${t.diff}`;
              const isQualifying = idx < 2; // Top 2 advance

              return `
                <tr>
                  <td>
                    <div class="team-cell">
                      <span class="rank-num">${idx + 1}</span>
                      <span class="team-flag">${info.flag}</span>
                      <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${isQualifying ? '<span class="qualify-dot"></span>' : ''}${t.team}
                      </span>
                    </div>
                  </td>
                  <td>${t.gp}</td>
                  <td style="color:#4ade80; font-weight:700;">${t.w}</td>
                  <td style="color:#fb7185;">${t.l}</td>
                  <td>${t.pf}</td>
                  <td>${t.pa}</td>
                  <td class="${diffClass}">${diffStr}</td>
                  <td style="font-weight: 800; color: var(--accent-blue);">${t.pts}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }).join('') + `
    <div style="font-size: 0.68rem; color: var(--text-muted); margin-top: -12px; margin-bottom: 16px; padding-left: 4px;">
      🟢 Top 2 teams advance to Quarterfinals • FIBA Points: Win = 2, Loss = 1
    </div>
  `;
}
// --- Next Match Finder & Banner ---
function renderNextMatchHeroHtml(matches) {
  const upcoming = matches.find(m => m && m.status !== 'Finished');
  if (!upcoming) return '';

  const p1Info = getNOCInfo(upcoming.player1);
  const p2Info = getNOCInfo(upcoming.player2);

  let countdownText = 'Upcoming';
  let isLive = upcoming.status === 'Live';

  if (isLive) {
    countdownText = '🔥 Live Now';
  } else if (upcoming.date && upcoming.time && upcoming.time !== 'TBD') {
    try {
      const matchEpoch = new Date(`${upcoming.date}T${upcoming.time}:00+09:00`).getTime();
      const diffMs = matchEpoch - Date.now();

      if (diffMs <= 0) {
        countdownText = '🔥 In Progress / Starting Soon';
        isLive = true;
      } else {
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        if (diffHrs >= 24) {
          const days = Math.floor(diffHrs / 24);
          const remHrs = diffHrs % 24;
          countdownText = `in ${days}d ${remHrs}h`;
        } else if (diffHrs > 0) {
          countdownText = `in ${diffHrs}h ${diffMins}m`;
        } else {
          countdownText = `in ${diffMins}m`;
        }
      }
    } catch (e) {}
  }

  return `
    <div class="next-match-hero">
      <div class="next-match-label">
        <span>⏱️ Next Tip-Off • ${upcoming.round || 'Basketball'}</span>
        <span class="countdown-timer ${isLive ? 'is-live' : ''}">${countdownText}</span>
      </div>
      <div class="next-match-teams">
        <span>${p1Info.flag} ${upcoming.player1}</span>
        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">VS</span>
        <span>${upcoming.player2} ${p2Info.flag}</span>
      </div>
    </div>
  `;
}


// --- Matches Tab (Fixtures + Standings Sub-Nav) ---
function renderMatchesView(container, matches) {
  const list = extractList(matches);

  // Sub-Navigation Pills
  const subNavHtml = `
    <div class="sub-nav-bar">
      <button class="sub-nav-btn ${matchesSubTab === 'fixtures' ? 'active' : ''}" onclick="setMatchesSubTab('fixtures')">
        📋 Schedule & Scores
      </button>
      <button class="sub-nav-btn ${matchesSubTab === 'standings' ? 'active' : ''}" onclick="setMatchesSubTab('standings')">
        📊 Group Standings
      </button>
    </div>
  `;

  if (matchesSubTab === 'standings') {
    container.innerHTML = subNavHtml + renderStandingsTablesHtml(list);
    return;
  }

  // Fixtures List
  if (!list || list.length === 0) {
    container.innerHTML = subNavHtml + '<div class="empty-state">No matches scheduled or recorded yet for this category.</div>';
    return;
  }

  const matchesHtml = list.map(m => {
    if (!m) return '';
    const p1Info = getNOCInfo(m.player1);
    const p2Info = getNOCInfo(m.player2);
    const p1Norm = normName(m.player1);
    const p2Norm = normName(m.player2);
    const winNorm = normName(m.winner);

    const isP1Winner = m.status === 'Finished' && winNorm && winNorm === p1Norm;
    const isP2Winner = m.status === 'Finished' && winNorm && winNorm === p2Norm;

    let stateBadgeClass = 'state-start';
    let stateText = m.state || (m.status === 'Finished' ? 'Official' : 'Start List');
    if (m.status === 'Finished' || stateText.toLowerCase().includes('official')) {
      stateBadgeClass = 'state-official';
      stateText = 'OFFI';
    } else if (m.status === 'Live') {
      stateBadgeClass = 'state-live';
      stateText = 'LIVE';
    } else {
      stateText = 'START';
    }

    const timeString = formatMatchTime(m.date, m.time);
    const scoreString = m.score && m.score !== '' ? m.score : 'vs';

    return `
      <div class="match-card">
        <div class="match-top">
          <span class="match-round">${m.round || 'Basketball Match'}</span>
          <span class="state-badge ${stateBadgeClass}">${stateText}</span>
        </div>
        <div class="match-time">${timeString}</div>
        <div class="match-body">
          <div class="team-box">
            <span class="team-flag">${p1Info.flag}</span>
            <span class="team-name ${isP1Winner ? 'winner' : ''}">${m.player1 || 'TBD'}</span>
            ${p1Info.code ? `<span class="noc-tag">${p1Info.code}</span>` : ''}
          </div>
          <div class="score-box">${scoreString}</div>
          <div class="team-box team-right">
            <span class="team-flag">${p2Info.flag}</span>
            <span class="team-name ${isP2Winner ? 'winner' : ''}">${m.player2 || 'TBD'}</span>
            ${p2Info.code ? `<span class="noc-tag">${p2Info.code}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

    const heroBanner = renderNextMatchHeroHtml(list);
  container.innerHTML = subNavHtml + heroBanner + matchesHtml;
}

}

// --- Predictions & Medal Table ---
function resolveProjectedPodium(teams) {
  const list = extractList(teams);
  if (list.length === 0) return null;
  const parseVal = (v) => parseFloat(v) || 0;
  const pool = [...list];

  pool.sort((a, b) => parseVal(b.gold) - parseVal(a.gold));
  const gold = pool.shift() || null;

  pool.sort((a, b) => parseVal(b.silver) - parseVal(a.silver));
  const silver = pool.shift() || null;

  pool.sort((a, b) => parseVal(b.bronze) - parseVal(a.bronze));
  const bronze = pool.shift() || null;

  return { gold, silver, bronze };
}

function renderPodiumHtml(title, podium) {
  if (!podium || !podium.gold) return '';
  const gInfo = getNOCInfo(podium.gold ? podium.gold.team : '');
  const sInfo = getNOCInfo(podium.silver ? podium.silver.team : '');
  const bInfo = getNOCInfo(podium.bronze ? podium.bronze.team : '');

  return `
    <div class="tally-header" style="margin-top: 10px;">
      <span>🏅 Projected Podium • ${title}</span>
    </div>
    <div class="podium-spotlight">
      <div class="podium-card silver-card">
        <span class="podium-badge">🥈 Silver</span>
        <div class="podium-flag">${sInfo.flag}</div>
        <div class="podium-team">${podium.silver ? podium.silver.team : 'TBD'}</div>
        <div class="podium-prob">${podium.silver ? (podium.silver.silver || '-') : '-'} Exp.</div>
      </div>
      <div class="podium-card gold-card">
        <span class="podium-badge">🥇 Gold</span>
        <div class="podium-flag">${gInfo.flag}</div>
        <div class="podium-team">${podium.gold ? podium.gold.team : 'TBD'}</div>
        <div class="podium-prob">${podium.gold ? (podium.gold.gold || '-') : '-'} Exp.</div>
      </div>
      <div class="podium-card bronze-card">
        <span class="podium-badge">🥉 Bronze</span>
        <div class="podium-flag">${bInfo.flag}</div>
        <div class="podium-team">${podium.bronze ? podium.bronze.team : 'TBD'}</div>
        <div class="podium-prob">${podium.bronze ? (podium.bronze.bronze || '-') : '-'} Exp.</div>
      </div>
    </div>
  `;
}

function renderSportMedalTally(eventList) {
  const tally = {};
  const ensureEntry = (team) => {
    if (!tally[team]) tally[team] = { team, gold: 0, silver: 0, bronze: 0, total: 0 };
  };

  eventList.forEach(ev => {
    if (!ev.podium) return;
    if (ev.podium.gold && ev.podium.gold.team) {
      ensureEntry(ev.podium.gold.team);
      tally[ev.podium.gold.team].gold += 1;
      tally[ev.podium.gold.team].total += 1;
    }
    if (ev.podium.silver && ev.podium.silver.team) {
      ensureEntry(ev.podium.silver.team);
      tally[ev.podium.silver.team].silver += 1;
      tally[ev.podium.silver.team].total += 1;
    }
    if (ev.podium.bronze && ev.podium.bronze.team) {
      ensureEntry(ev.podium.bronze.team);
      tally[ev.podium.bronze.team].bronze += 1;
      tally[ev.podium.bronze.team].total += 1;
    }
  });

  const sorted = Object.values(tally).sort((a, b) => {
    if (b.gold !== a.gold) return b.gold - a.gold;
    if (b.silver !== a.silver) return b.silver - a.silver;
    if (b.bronze !== a.bronze) return b.bronze - a.bronze;
    return b.total - a.total;
  });

  if (sorted.length === 0) return '';

  return `
    <div class="tally-header">
      <span>🏆 Basketball Projected Medal Table</span>
      <span style="font-size: 0.7rem; color: var(--accent-blue);">${eventList.length} Events Combined</span>
    </div>
    <div class="table-container">
      <table class="medal-table">
        <thead>
          <tr>
            <th style="width: 45%;">Country / NOC</th>
            <th>🥇</th>
            <th>🥈</th>
            <th>🥉</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${sorted.map((row, idx) => {
            const info = getNOCInfo(row.team);
            return `
              <tr>
                <td>
                  <div class="team-cell">
                    <span class="rank-num">${idx + 1}</span>
                    <span class="team-flag">${info.flag}</span>
                    <span style="font-weight: 700;">${row.team}</span>
                    ${info.code ? `<span class="noc-tag">${info.code}</span>` : ''}
                  </div>
                </td>
                <td class="col-gold">${row.gold}</td>
                <td class="col-silver">${row.silver}</td>
                <td class="col-bronze">${row.bronze}</td>
                <td class="col-total">${row.total}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderPredictionsView(container, menPreds, womenPreds, activeGender) {
  const menPodium = resolveProjectedPodium(menPreds);
  const womenPodium = resolveProjectedPodium(womenPreds);

  const allEvents = [];
  if (menPodium) allEvents.push({ eventName: "Men's Tournament", podium: menPodium });
  if (womenPodium) allEvents.push({ eventName: "Women's Tournament", podium: womenPodium });

  const tallyHtml = renderSportMedalTally(allEvents);

  const activePodium = activeGender === 'men' ? menPodium : womenPodium;
  const activeTitle = activeGender === 'men' ? "Men's Tournament" : "Women's Tournament";
  const podiumHtml = renderPodiumHtml(activeTitle, activePodium);

  const activeList = extractList(activeGender === 'men' ? menPreds : womenPreds);
  let tableHtml = '';

  if (activeList.length > 0) {
    tableHtml = `
      <div class="tally-header" style="margin-top: 14px;">
        <span>📊 Monte Carlo Simulation Probabilities</span>
      </div>
      <div class="table-container">
        <table class="medal-table">
          <thead>
            <tr>
              <th>Team</th>
              <th>🥇 Gold</th>
              <th>🥈 Silver</th>
              <th>🥉 Bronze</th>
              <th>Medal</th>
            </tr>
          </thead>
          <tbody>
            ${activeList.map(t => {
              const info = getNOCInfo(t.team);
              return `
                <tr>
                  <td>
                    <div class="team-cell">
                      <span class="rank-num">${t.rank || '-'}</span>
                      <span class="team-flag">${info.flag}</span>
                      <span style="font-weight: 600;">${t.team}</span>
                    </div>
                  </td>
                  <td class="col-gold">${t.gold || '-'}</td>
                  <td class="col-silver">${t.silver || '-'}</td>
                  <td class="col-bronze">${t.bronze || '-'}</td>
                  <td style="font-weight: 800; color: #60a5fa;">${t.podium || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  } else {
    tableHtml = '<div class="empty-state">No simulation projections available for this category yet.</div>';
  }

  container.innerHTML = tallyHtml + podiumHtml + tableHtml;
}

// --- Calibration & Delta View ---
function calculateDeltaBadge(currentVal, initialVal, records) {
  let cur = parseFloat(currentVal) || 0;
  let diff = 0;

  if (initialVal !== undefined && initialVal !== null && initialVal !== "") {
    diff = +(cur - (parseFloat(initialVal) || 0)).toFixed(1);
  } else if (records) {
    diff = +((records.w * 2.8) - (records.l * 3.5)).toFixed(1);
  }

  if (diff > 0) return `<span class="delta-badge delta-pos">+${diff}%</span>`;
  if (diff < 0) return `<span class="delta-badge delta-neg">${diff}%</span>`;
  return `<span class="delta-badge delta-zero">0.0%</span>`;
}

function renderCalibrationView(container, teams, matches) {
  const teamList = extractList(teams);
  const matchList = extractList(matches);

  if (teamList.length === 0) {
    container.innerHTML = '<div class="empty-state">Simulation predictions not found to calibrate against.</div>';
    return;
  }

  const rankMap = {};
  teamList.forEach(t => { rankMap[normName(t.team)] = t.rank; });

  const records = {};
  let finishedCount = 0;
  let favoriteHits = 0;
  const upsets = [];

  matchList.forEach(m => {
    if (!m || m.status !== 'Finished' || !m.winner) return;
    finishedCount++;

    const p1Norm = normName(m.player1);
    const p2Norm = normName(m.player2);
    const wNorm = normName(m.winner);

    records[p1Norm] = records[p1Norm] || { w: 0, l: 0 };
    records[p2Norm] = records[p2Norm] || { w: 0, l: 0 };

    if (wNorm === p1Norm) {
      records[p1Norm].w++;
      records[p2Norm].l++;
    } else {
      records[p2Norm].w++;
      records[p1Norm].l++;
    }

    const r1 = rankMap[p1Norm] || 99;
    const r2 = rankMap[p2Norm] || 99;

    if (r1 !== r2) {
      const favNorm = r1 < r2 ? p1Norm : p2Norm;
      if (wNorm === favNorm) {
        favoriteHits++;
      } else {
        upsets.push({
          winner: m.winner,
          loser: wNorm === p1Norm ? m.player2 : m.player1,
          score: m.score,
          round: m.round
        });
      }
    }
  });

  const accuracy = finishedCount > 0 ? Math.round((favoriteHits / finishedCount) * 100) : 100;
  const alignmentStatus = accuracy >= 75 ? 'Optimal' : (accuracy >= 50 ? 'Moderate' : 'Volatile');

  let kpiHtml = `
    <div class="accuracy-grid">
      <div class="kpi-card">
        <div class="kpi-title">Model Accuracy</div>
        <div class="kpi-val">${accuracy}%</div>
        <div class="kpi-sub">${favoriteHits}/${finishedCount} favorites won</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Upsets Logged</div>
        <div class="kpi-val" style="color: ${upsets.length > 0 ? '#fb7185' : '#4ade80'};">${upsets.length}</div>
        <div class="kpi-sub">${upsets.length === 0 ? 'No deviations' : 'Underdog wins'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Calibration</div>
        <div class="kpi-val" style="color: #60a5fa;">${alignmentStatus}</div>
        <div class="kpi-sub">Sim Alignment</div>
      </div>
    </div>
  `;

  let tableHtml = `
    <div class="tally-header">
      <span>Live Tracking vs Pre-Tournament Model</span>
    </div>
    <div class="table-container">
      <table class="medal-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>W-L</th>
            <th>Trajectory</th>
            <th>🥇 Exp. Gold</th>
            <th>Δ Shift</th>
          </tr>
        </thead>
        <tbody>
          ${teamList.map(t => {
            const teamKey = normName(t.team);
            const rec = records[teamKey] || { w: 0, l: 0 };
            const info = getNOCInfo(t.team);

            let traj = '<span class="pill-status pill-on-track">On Track</span>';
            if (rec.l >= 2) traj = '<span class="pill-status pill-at-risk">At Risk</span>';
            else if (rec.l === 1) traj = '<span class="pill-status pill-contested">Contested</span>';

            const deltaBadge = calculateDeltaBadge(t.gold, t.initial_gold, rec);

            return `
              <tr>
                <td>
                  <div class="team-cell">
                    <span class="rank-num">${t.rank || '-'}</span>
                    <span class="team-flag">${info.flag}</span>
                    <span style="font-weight: 600;">${t.team}</span>
                  </div>
                </td>
                <td style="font-weight: 700;">${rec.w}-${rec.l}</td>
                <td>${traj}</td>
                <td class="col-gold">${t.gold || '-'}</td>
                <td style="white-space: nowrap;">${deltaBadge}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  let upsetsHtml = '';
  if (upsets.length > 0) {
    upsetsHtml = `
      <div style="margin-top: 14px;">
        <div class="tally-header">
          <span style="color: var(--badge-danger);">⚠️ Logged Upsets (Model Deviations)</span>
        </div>
        ${upsets.map(u => {
          const winInfo = getNOCInfo(u.winner);
          const loseInfo = getNOCInfo(u.loser);
          return `
            <div class="match-card" style="border-left: 3px solid var(--badge-danger); padding: 10px 14px;">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                <span><strong>${winInfo.flag} ${u.winner}</strong> def. ${loseInfo.flag} ${u.loser}</span>
                <span style="font-weight: 800; color: #fb7185;">${u.score}</span>
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 3px;">${u.round}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  container.innerHTML = kpiHtml + tableHtml + upsetsHtml;
}
