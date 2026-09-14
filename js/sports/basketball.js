// --- Flag Resolver Fallback ---
function getFlagEmoji(teamName) {
  if (typeof window.getFlag === 'function') return window.getFlag(teamName);
  if (!teamName || typeof teamName !== 'string') return '🏀';

  const norm = teamName.toLowerCase().trim();
  const flagMap = {
    'china': '🇨🇳', 'chn': '🇨🇳',
    'japan': '🇯🇵', 'jpn': '🇯🇵',
    'philippines': '🇵🇭', 'phi': '🇵🇭',
    'korea': '🇰🇷', 'south korea': '🇰🇷', 'kor': '🇰🇷',
    'iran': '🇮🇷', 'iri': '🇮🇷',
    'jordan': '🇯🇴', 'jor': '🇯🇴',
    'lebanon': '🇱🇧', 'lbn': '🇱🇧',
    'chinese taipei': '🇹🇼', 'taiwan': '🇹🇼', 'tpe': '🇹🇼',
    'saudi arabia': '🇸🇦', 'ksa': '🇸🇦',
    'kazakhstan': '🇰🇿', 'kaz': '🇰🇿',
    'india': '🇮🇳', 'ind': '🇮🇳',
    'indonesia': '🇮🇩', 'ina': '🇮🇩',
    'thailand': '🇹🇭', 'tha': '🇹🇭',
    'hong kong': '🇭🇰', 'hkg': '🇭🇰',
    'bahrain': '🇧🇭', 'brn': '🇧🇭',
    'mongolia': '🇲🇳', 'mgl': '🇲🇳',
    'qatar': '🇶🇦', 'qat': '🇶🇦',
    'syria': '🇸🇾', 'syr': '🇸🇾',
    'uae': '🇦🇪', 'united arab emirates': '🇦🇪',
    'kuwait': '🇰🇼', 'kuw': '🇰🇼',
    'guam': '🇬🇺', 'gum': '🇬🇺',
    'malaysia': '🇲🇾', 'mas': '🇲🇾',
    'singapore': '🇸🇬', 'sgp': '🇸🇬'
  };

  for (const [key, emoji] of Object.entries(flagMap)) {
    if (norm.includes(key)) return emoji;
  }
  return '🏀';
}

// --- Basketball Sub-View State ---
let activeMatchesSubView = 'schedule'; // 'schedule' | 'standings' | 'bracket'

// --- View Switcher ---
function setMatchesSubView(subView) {
  activeMatchesSubView = subView;
  const container = document.getElementById('content-cards');
  if (container) {
    const matches = currentGender === 'men' ? appData.menMatches : appData.womenMatches;
    renderMatchesView(container, matches);
  }
}

// --- Main Matches Router ---
function renderMatchesView(container, matches) {
  const pillsHeader = `
    <div class="subnav-pills" style="display:flex; gap:0.5rem; justify-content:center; margin-bottom:1rem; flex-wrap:wrap;">
      <button class="subnav-pill ${activeMatchesSubView === 'schedule' ? 'active' : ''}" onclick="setMatchesSubView('schedule')">📋 Schedule & Scores</button>
      <button class="subnav-pill ${activeMatchesSubView === 'standings' ? 'active' : ''}" onclick="setMatchesSubView('standings')">📊 Group Standings</button>
      <button class="subnav-pill ${activeMatchesSubView === 'bracket' ? 'active' : ''}" onclick="setMatchesSubView('bracket')">🌳 Bracket</button>
    </div>
  `;

  if (!matches || matches.length === 0) {
    container.innerHTML = `
      ${pillsHeader}
      <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted, #94a3b8);">
        No matches scheduled or recorded yet for this category.
      </div>`;
    return;
  }

  let contentHtml = '';
  if (activeMatchesSubView === 'schedule') {
    contentHtml = renderScheduleAndHero(matches);
  } else if (activeMatchesSubView === 'standings') {
    contentHtml = renderStandingsTable(matches);
  } else if (activeMatchesSubView === 'bracket') {
    contentHtml = renderKnockoutBracket(matches);
  }

  container.innerHTML = `${pillsHeader}${contentHtml}`;
}

// --- Next Match Hero Banner & Schedule List ---
function renderScheduleAndHero(matches) {
  const liveMatch = matches.find(m => (m.status || '').toLowerCase().includes('live'));
  const upcomingMatches = matches
    .filter(m => {
      const s = (m.status || '').toLowerCase();
      return !s.includes('final') && !s.includes('finished') && !s.includes('live');
    })
    .sort((a, b) => new Date(a.date || a.timestamp || 0) - new Date(b.date || b.timestamp || 0));

  const heroTarget = liveMatch || upcomingMatches[0];
  let heroHtml = '';

  if (heroTarget) {
    const isLive = (heroTarget.status || '').toLowerCase().includes('live');
    const t1 = heroTarget.team1 || heroTarget.home_team || 'TBD';
    const t2 = heroTarget.team2 || heroTarget.away_team || 'TBD';
    const s1 = heroTarget.score1 != null ? heroTarget.score1 : '-';
    const s2 = heroTarget.score2 != null ? heroTarget.score2 : '-';

    heroHtml = `
      <div class="hero-card" style="background:linear-gradient(135deg, rgba(30,58,138,0.4), rgba(15,23,42,0.7)); border:1px solid rgba(59,130,246,0.3); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem; text-align:center;">
        <div style="display:inline-block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; padding:0.2rem 0.6rem; border-radius:9999px; background:${isLive ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}; color:${isLive ? '#ef4444' : '#60a5fa'}; margin-bottom:0.75rem;">
          ${isLive ? '🔴 LIVE NOW' : '⏳ NEXT TIP-OFF'}
        </div>
        <div style="display:flex; justify-content:space-around; align-items:center; margin:0.75rem 0;">
          <div style="flex:1;">
            <div style="font-size:1.8rem;">${getFlagEmoji(t1)}</div>
            <div style="font-weight:700; font-size:1.1rem; margin-top:0.25rem;">${t1}</div>
          </div>
          <div style="font-family:monospace; font-size:1.6rem; font-weight:800; min-width:80px;">
            ${isLive ? `${s1} : ${s2}` : 'VS'}
          </div>
          <div style="flex:1;">
            <div style="font-size:1.8rem;">${getFlagEmoji(t2)}</div>
            <div style="font-weight:700; font-size:1.1rem; margin-top:0.25rem;">${t2}</div>
          </div>
        </div>
        <div style="font-size:0.8rem; color:var(--text-muted, #94a3b8);">
          ${heroTarget.time || heroTarget.date || 'Scheduled'} • ${heroTarget.group || heroTarget.stage || 'Asian Games'}
        </div>
      </div>
    `;
  }

  const cardsHtml = matches.map(m => {
    const t1 = m.team1 || m.home_team || 'TBD';
    const t2 = m.team2 || m.away_team || 'TBD';
    const s1 = m.score1 != null ? m.score1 : '-';
    const s2 = m.score2 != null ? m.score2 : '-';
    const isFinished = (m.status || '').toLowerCase().includes('final') || (m.status || '').toLowerCase().includes('finished');
    const t1Win = isFinished && Number(s1) > Number(s2);
    const t2Win = isFinished && Number(s2) > Number(s1);

    return `
      <div class="match-card" style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.85rem 1rem; margin-bottom:0.75rem; display:flex; justify-content:space-between; align-items:center;">
        <div style="flex:1;">
          <div style="font-size:0.75rem; color:var(--text-muted, #94a3b8); margin-bottom:0.4rem;">
            ${m.stage || m.group || 'Group Stage'} • ${m.time || m.status || ''}
          </div>
          <div style="display:flex; flex-direction:column; gap:0.25rem;">
            <div style="display:flex; align-items:center; gap:0.5rem; font-weight:${t1Win ? '700' : '500'}; color:${t1Win ? '#38bdf8' : 'inherit'};">
              <span>${getFlagEmoji(t1)}</span> <span>${t1}</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem; font-weight:${t2Win ? '700' : '500'}; color:${t2Win ? '#38bdf8' : 'inherit'};">
              <span>${getFlagEmoji(t2)}</span> <span>${t2}</span>
            </div>
          </div>
        </div>
        <div style="font-family:monospace; font-size:1.1rem; font-weight:700; text-align:right; min-width:48px;">
          <div>${s1}</div>
          <div>${s2}</div>
        </div>
      </div>
    `;
  }).join('');

  return heroHtml + cardsHtml;
}

// --- FIBA Group Standings Engine ---
function renderStandingsTable(matches) {
  const groups = {};

  matches.forEach(m => {
    const rawGrp = m.group || m.stage || '';
    if (!rawGrp.toLowerCase().includes('group')) return;
    const grpName = rawGrp.trim();
    if (!groups[grpName]) groups[grpName] = {};

    const t1 = m.team1 || m.home_team;
    const t2 = m.team2 || m.away_team;
    if (!t1 || !t2) return;

    [t1, t2].forEach(team => {
      if (!groups[grpName][team]) {
        groups[grpName][team] = { name: team, gp: 0, w: 0, l: 0, pts: 0, pf: 0, pa: 0, diff: 0 };
      }
    });

    const isFinished = (m.status || '').toLowerCase().includes('final') || (m.status || '').toLowerCase().includes('finished');
    if (isFinished && m.score1 != null && m.score2 != null) {
      const s1 = Number(m.score1);
      const s2 = Number(m.score2);

      groups[grpName][t1].gp += 1;
      groups[grpName][t2].gp += 1;
      groups[grpName][t1].pf += s1;
      groups[grpName][t1].pa += s2;
      groups[grpName][t2].pf += s2;
      groups[grpName][t2].pa += s1;

      if (s1 > s2) {
        groups[grpName][t1].w += 1;
        groups[grpName][t1].pts += 2;
        groups[grpName][t2].l += 1;
        groups[grpName][t2].pts += 1;
      } else {
        groups[grpName][t2].w += 1;
        groups[grpName][t2].pts += 2;
        groups[grpName][t1].l += 1;
        groups[grpName][t1].pts += 1;
      }

      groups[grpName][t1].diff = groups[grpName][t1].pf - groups[grpName][t1].pa;
      groups[grpName][t2].diff = groups[grpName][t2].pf - groups[grpName][t2].pa;
    }
  });

  const groupKeys = Object.keys(groups).sort();
  if (groupKeys.length === 0) {
    return `<div style="text-align:center; padding:2rem; color:var(--text-muted, #94a3b8);">No group stage data available.</div>`;
  }

  return groupKeys.map(grpKey => {
    const teams = Object.values(groups[grpKey]).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.diff !== a.diff) return b.diff - a.diff;
      return b.pf - a.pf;
    });

    return `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; margin-bottom:1.5rem; overflow-x:auto;">
        <div style="padding:0.75rem 1rem; font-weight:700; font-size:0.9rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between;">
          <span>${grpKey}</span>
          <span style="font-size:0.75rem; color:var(--text-muted, #94a3b8); font-weight:400;">Top 2 advance</span>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:center;">
          <thead>
            <tr style="color:var(--text-muted, #94a3b8); font-size:0.75rem; border-bottom:1px solid rgba(255,255,255,0.05);">
              <th style="padding:0.6rem 0.5rem; text-align:left;"># Team</th>
              <th style="padding:0.6rem 0.3rem;">GP</th>
              <th style="padding:0.6rem 0.3rem;">W</th>
              <th style="padding:0.6rem 0.3rem;">L</th>
              <th style="padding:0.6rem 0.3rem;">PF</th>
              <th style="padding:0.6rem 0.3rem;">PA</th>
              <th style="padding:0.6rem 0.3rem;">DIFF</th>
              <th style="padding:0.6rem 0.5rem; font-weight:700; color:var(--text-main, #f8fafc);">PTS</th>
            </tr>
          </thead>
          <tbody>
            ${teams.map((t, idx) => `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.03); background:${idx < 2 ? 'rgba(59,130,246,0.04)' : 'transparent'};">
                <td style="padding:0.6rem 0.5rem; text-align:left; font-weight:${idx < 2 ? '700' : '400'};">
                  <span style="display:inline-block; width:16px; color:${idx < 2 ? '#38bdf8' : 'inherit'};">${idx + 1}</span>
                  ${getFlagEmoji(t.name)} ${t.name}
                </td>
                <td style="padding:0.6rem 0.3rem;">${t.gp}</td>
                <td style="padding:0.6rem 0.3rem; color:#4ade80;">${t.w}</td>
                <td style="padding:0.6rem 0.3rem; color:#f87171;">${t.l}</td>
                <td style="padding:0.6rem 0.3rem;">${t.pf}</td>
                <td style="padding:0.6rem 0.3rem;">${t.pa}</td>
                <td style="padding:0.6rem 0.3rem; font-family:monospace; color:${t.diff > 0 ? '#4ade80' : t.diff < 0 ? '#f87171' : 'inherit'};">${t.diff > 0 ? '+' + t.diff : t.diff}</td>
                <td style="padding:0.6rem 0.5rem; font-weight:700; color:#38bdf8;">${t.pts}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }).join('');
}

// --- Knockout Bracket Engine ---
function renderKnockoutBracket(matches) {
  const getStage = (m) => ((m.stage || m.round || m.group || '') + ' ' + (m.status || '')).toLowerCase();

  const qfMatches = matches.filter(m => getStage(m).includes('quarter') || getStage(m).includes('qf'));
  const sfMatches = matches.filter(m => getStage(m).includes('semi') || getStage(m).includes('sf'));
  const finalMatch = matches.find(m => getStage(m).includes('gold') || (getStage(m).includes('final') && !getStage(m).includes('semi') && !getStage(m).includes('quarter') && !getStage(m).includes('bronze')));
  const bronzeMatch = matches.find(m => getStage(m).includes('bronze') || getStage(m).includes('3rd'));

  const defaultQF = [
    { title: 'QF 1', t1: '1st Group A', t2: '2nd Group B' },
    { title: 'QF 2', t1: '1st Group C', t2: '2nd Group D' },
    { title: 'QF 3', t1: '1st Group B', t2: '2nd Group A' },
    { title: 'QF 4', t1: '1st Group D', t2: '2nd Group C' }
  ];

  const renderSlot = (title, match, fallback, medalType = null) => {
    const t1 = match ? (match.team1 || match.home_team || 'TBD') : fallback.t1;
    const t2 = match ? (match.team2 || match.away_team || 'TBD') : fallback.t2;
    const s1 = match && match.score1 != null ? match.score1 : '-';
    const s2 = match && match.score2 != null ? match.score2 : '-';
    const isFinished = match && ((match.status || '').toLowerCase().includes('final') || (match.status || '').toLowerCase().includes('finished'));
    const t1Win = isFinished && Number(s1) > Number(s2);
    const t2Win = isFinished && Number(s2) > Number(s1);

    const f1 = getFlagEmoji(t1);
    const f2 = getFlagEmoji(t2);

    return `
      <div class="bracket-match-card">
        <div class="bracket-match-header">
          <span>${title}</span>
          ${medalType ? `<span class="bracket-medal-badge medal-${medalType}">${medalType.toUpperCase()}</span>` : ''}
          <span>${match ? (match.time || match.status || '') : 'Scheduled'}</span>
        </div>
        <div class="bracket-team-row ${t1Win ? 'winner' : ''}">
          <div class="bracket-team-info"><span>${f1}</span> <span>${t1}</span></div>
          <span class="bracket-score">${s1}</span>
        </div>
        <div class="bracket-team-row ${t2Win ? 'winner' : ''}">
          <div class="bracket-team-info"><span>${f2}</span> <span>${t2}</span></div>
          <span class="bracket-score">${s2}</span>
        </div>
      </div>
    `;
  };

  return `
    <div class="bracket-wrapper">
      <div class="bracket-container">
        <!-- Quarterfinals -->
        <div class="bracket-round">
          <div class="bracket-round-header">Quarterfinals</div>
          ${[0, 1, 2, 3].map(i => renderSlot(`QF ${i + 1}`, qfMatches[i], defaultQF[i])).join('')}
        </div>

        <!-- Semifinals -->
        <div class="bracket-round">
          <div class="bracket-round-header">Semifinals</div>
          ${renderSlot('SF 1', sfMatches[0], { t1: 'Winner QF 1', t2: 'Winner QF 2' })}
          ${renderSlot('SF 2', sfMatches[1], { t1: 'Winner QF 3', t2: 'Winner QF 4' })}
        </div>

        <!-- Medal Matches -->
        <div class="bracket-round">
          <div class="bracket-round-header">Medal Matches</div>
          ${renderSlot('Gold Medal', finalMatch, { t1: 'Winner SF 1', t2: 'Winner SF 2' }, 'gold')}
          ${renderSlot('Bronze Medal', bronzeMatch, { t1: 'Loser SF 1', t2: 'Loser SF 2' }, 'bronze')}
        </div>
      </div>
    </div>
  `;
}

// --- Predictions View ---
function renderPredictionsView(container, menPreds, womenPreds, currentGender) {
  const preds = currentGender === 'men' ? menPreds : womenPreds;

  if (!preds || preds.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted, #94a3b8);">
        No simulation projection models available for this division.
      </div>`;
    return;
  }

  const sorted = [...preds].sort((a, b) => (b.gold_prob || b.gold || 0) - (a.gold_prob || a.gold || 0));

  container.innerHTML = `
    <div style="margin-bottom:1rem; text-align:center; font-size:0.8rem; color:var(--text-muted, #94a3b8);">
      Monte Carlo simulation (50,000 runs) weighted by FIBA Rank, MoV, and Host Boost.
    </div>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
      ${sorted.map(p => {
        const team = p.team || p.country || 'Unknown';
        const gold = Math.round((p.gold_prob || p.gold || 0) * 100);
        const silver = Math.round((p.silver_prob || p.silver || 0) * 100);
        const bronze = Math.round((p.bronze_prob || p.bronze || 0) * 100);
        const total = gold + silver + bronze;

        return `
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
              <div style="font-weight:700; font-size:1rem; display:flex; align-items:center; gap:0.5rem;">
                <span>${getFlagEmoji(team)}</span> <span>${team}</span>
              </div>
              <span style="font-size:0.75rem; color:#38bdf8; font-weight:700;">Podium: ${total}%</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.4rem;">
              <span>🥇 Gold: <strong>${gold}%</strong></span>
              <span>🥈 Silver: <strong>${silver}%</strong></span>
              <span>🥉 Bronze: <strong>${bronze}%</strong></span>
            </div>
            <div style="height:6px; width:100%; background:rgba(255,255,255,0.06); border-radius:999px; overflow:hidden; display:flex;">
              <div style="width:${gold}%; background:#eab308;"></div>
              <div style="width:${silver}%; background:#94a3b8;"></div>
              <div style="width:${bronze}%; background:#d97706;"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// --- Model Calibration View ---
function renderCalibrationView(container, predictions, matches) {
  if (!matches || matches.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted, #94a3b8);">
        Awaiting completed matches to evaluate prediction calibration.
      </div>`;
    return;
  }

  const finished = matches.filter(m => {
    const s = (m.status || '').toLowerCase();
    return (s.includes('final') || s.includes('finished')) && m.score1 != null && m.score2 != null;
  });

  let correctFavorites = 0;
  let evaluatedMatches = 0;
  const upsetLogs = [];

  const rankMap = {};
  (predictions || []).forEach((p, idx) => {
    rankMap[p.team || p.country] = idx + 1;
  });

  finished.forEach(m => {
    const t1 = m.team1 || m.home_team;
    const t2 = m.team2 || m.away_team;
    const s1 = Number(m.score1);
    const s2 = Number(m.score2);
    const r1 = rankMap[t1] || 99;
    const r2 = rankMap[t2] || 99;

    if (r1 !== r2) {
      evaluatedMatches++;
      const fav = r1 < r2 ? t1 : t2;
      const actualWinner = s1 > s2 ? t1 : t2;

      if (fav === actualWinner) {
        correctFavorites++;
      } else {
        upsetLogs.push({
          winner: actualWinner,
          loser: actualWinner === t1 ? t2 : t1,
          score: `${s1} - ${s2}`,
          upsetSeed: Math.max(r1, r2)
        });
      }
    }
  });

  const accuracy = evaluatedMatches > 0 ? Math.round((correctFavorites / evaluatedMatches) * 100) : '--';

  container.innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center;">
        <div style="font-size:0.75rem; color:var(--text-muted, #94a3b8); margin-bottom:0.25rem;">Favorite Accuracy</div>
        <div style="font-size:1.6rem; font-weight:800; color:#38bdf8;">${accuracy}%</div>
        <div style="font-size:0.7rem; color:var(--text-muted, #94a3b8);">${correctFavorites}/${evaluatedMatches} correct</div>
      </div>
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center;">
        <div style="font-size:0.75rem; color:var(--text-muted, #94a3b8); margin-bottom:0.25rem;">Completed Matches</div>
        <div style="font-size:1.6rem; font-weight:800; color:#4ade80;">${finished.length}</div>
        <div style="font-size:0.7rem; color:var(--text-muted, #94a3b8);">Evaluated</div>
      </div>
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center;">
        <div style="font-size:0.75rem; color:var(--text-muted, #94a3b8); margin-bottom:0.25rem;">Upsets Recorded</div>
        <div style="font-size:1.6rem; font-weight:800; color:#f87171;">${upsetLogs.length}</div>
        <div style="font-size:0.7rem; color:var(--text-muted, #94a3b8);">Underdog victories</div>
      </div>
    </div>

    ${upsetLogs.length > 0 ? `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
        <div style="font-size:0.85rem; font-weight:700; margin-bottom:0.75rem; color:#f87171;">⚡ Upset Tracker</div>
        ${upsetLogs.map(u => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.85rem;">
            <div>
              <span style="color:#4ade80; font-weight:700;">${getFlagEmoji(u.winner)} ${u.winner}</span>
              <span style="color:var(--text-muted, #94a3b8);"> def. </span>
              <span style="color:#94a3b8;">${getFlagEmoji(u.loser)} ${u.loser}</span>
            </div>
            <span style="font-family:monospace; font-weight:700;">${u.score}</span>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}
