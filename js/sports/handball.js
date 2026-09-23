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

      let grpKey = null;
      if (/group\s*a\b/i.test(rawStage)) {
        grpKey = 'Group A';
      } else if (/group\s*b\b/i.test(rawStage)) {
        grpKey = 'Group B';
      } else if (/women/i.test(window.currentGender || '') || /round-robin|group\s*stage/i.test(rawStage)) {
        grpKey = "Women's Round-Robin";
      }

      if (!grpKey) return;
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
      'E': 'background:rgba(148,163,184,0.15); color:#94a3b8; border:1px solid rgba(148,163,184,0.25);',
      'gold': 'background:rgba(250,204,21,0.2); color:#facc15; border:1px solid rgba(250,204,21,0.4);',
      'silver': 'background:rgba(226,232,240,0.2); color:#e2e8f0; border:1px solid rgba(226,232,240,0.4);',
      'bronze': 'background:rgba(217,119,6,0.2); color:#f59e0b; border:1px solid rgba(217,119,6,0.4);',
      'neutral': 'background:rgba(148,163,184,0.12); color:#94a3b8; border:1px solid rgba(148,163,184,0.2);'
    };

    const isMen = (window.currentGender === 'men') || (typeof currentGender !== 'undefined' && currentGender === 'men') || groupKeys.length > 1;

    return groupKeys.map(grpKey => {
      const teams = Object.values(groups[grpKey]);
      teams.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

      const isWomenRoundRobin = grpKey === "Women's Round-Robin";
      const subtitleText = isWomenRoundRobin
        ? '7-nation round-robin (Medals decided by final standings: 🥇 Gold, 🥈 Silver, 🥉 Bronze)'
        : 'Top 4 teams advance to the Quarterfinals';

      return `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.75rem; flex-wrap:wrap; gap:6px;">
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
                  <th style="padding:8px 6px; text-align:center; min-width:44px;">${isWomenRoundRobin ? 'Rank' : 'Adv'}</th>
                </tr>
              </thead>
              <tbody>
                ${teams.map((t, idx) => {
                  const rank = idx + 1;
                  let badgeHtml = '';

                  if (isWomenRoundRobin) {
                    if (rank === 1) {
                      badgeHtml = `<span style="display:inline-block; font-size:0.65rem; font-weight:700; padding:2px 6px; border-radius:4px; ${badgeStyles['gold']}">🥇 Gold</span>`;
                    } else if (rank === 2) {
                      badgeHtml = `<span style="display:inline-block; font-size:0.65rem; font-weight:700; padding:2px 6px; border-radius:4px; ${badgeStyles['silver']}">🥈 Silver</span>`;
                    } else if (rank === 3) {
                      badgeHtml = `<span style="display:inline-block; font-size:0.65rem; font-weight:700; padding:2px 6px; border-radius:4px; ${badgeStyles['bronze']}">🥉 Bronze</span>`;
                    } else {
                      badgeHtml = `<span style="display:inline-block; font-size:0.65rem; font-weight:600; padding:2px 6px; border-radius:4px; ${badgeStyles['neutral']}">${rank}th</span>`;
                    }
                  } else {
                    const qualifies = rank <= 4;
                    const status = qualifies ? 'Q' : 'E';
                    const badgeStyle = badgeStyles[status] || '';
                    badgeHtml = `<span style="display:inline-block; font-size:0.65rem; font-weight:700; padding:2px 5px; border-radius:4px; ${badgeStyle}">${status}</span>`;
                  }

                  const rowHighlight = isWomenRoundRobin
                    ? (rank <= 3 ? 'rgba(250,204,21,0.03)' : 'transparent')
                    : (rank <= 4 ? 'rgba(34,197,94,0.03)' : 'transparent');

                  return `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.04); background:${rowHighlight};">
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

    const hasQFs = qfMatches.length > 0;
    const hasSFs = sfMatches.length > 0;
    const hasFinals = finalMatch != null || bronzeMatch != null;

    if (!hasQFs && !hasSFs && !hasFinals) {
      return `
        <div style="text-align:center; padding:3rem 1.5rem; color:#94a3b8; background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin:1rem 0;">
          <div style="font-size:2.5rem; margin-bottom:0.75rem;">🏅</div>
          <div style="font-weight:700; font-size:1.15rem; color:#f8fafc; margin-bottom:0.5rem;">Women's Round-Robin Tournament</div>
          <div style="max-width:520px; margin:0 auto; font-size:0.85rem; line-height:1.6; color:#94a3b8;">
            The Women's Handball tournament is contested as a direct single round-robin group of 7 nations. Medals are awarded based on final group standings:
            <div style="margin-top:0.85rem; font-weight:700; color:#38bdf8; font-size:0.9rem;">
              🥇 1st: Gold &bull; 🥈 2nd: Silver &bull; 🥉 3rd: Bronze
            </div>
            <div style="margin-top:0.75rem; font-size:0.8rem; color:#64748b;">
              Check the <strong>Standings</strong> tab for live points, goal difference, and standings.
            </div>
          </div>
        </div>
      `;
    }

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

    // 4-team Knockout Bracket: SF -> Finals
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
  },

  // --- Medal Analytics Engine (Predictions & Standings) ---
  extractMedalAnalytics(menMatches, womenMatches, menPreds, womenPreds, mixedMatches, mixedPreds, currentGender) {
    const curGen = String(currentGender || (typeof window !== 'undefined' && window.currentGender) || 'men').toLowerCase();

    const clean = (name) => {
      if (!name || typeof name !== 'string') return '';
      return (typeof cleanTeamName === 'function' ? cleanTeamName(name) : name.toLowerCase().replace(/[^a-z0-9]/g, '')).trim();
    };

    const formatC = (item) => {
      if (!item) return null;
      let rawName = item.team || item.country || item.name || '';
      const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(rawName) : '🤾';
      const displayName = typeof formatTeamDisplayName === 'function' ? formatTeamDisplayName(rawName.replace(/\(host\)/gi, '').trim()) : rawName.replace(/\(host\)/gi, '').trim();
      const cleaned = clean(rawName);
      return {
        raw: rawName,
        cleaned,
        name: displayName,
        flag,
        isHost: rawName.toLowerCase().includes('host'),
        goldProb: item.gold || '',
        silverProb: item.silver || '',
        bronzeProb: item.bronze || ''
      };
    };

    const getProbNumber = (v) => {
      if (v == null) return 0;
      if (typeof v === 'number') return v;
      return parseFloat(String(v).replace('%', '')) || 0;
    };

    const projectPodium = (list) => {
      if (!Array.isArray(list) || list.length === 0) return [];
      const sorted = [...list].sort((a, b) => {
        const gA = getProbNumber(a.gold);
        const gB = getProbNumber(b.gold);
        if (gB !== gA) return gB - gA;
        const sA = getProbNumber(a.silver);
        const sB = getProbNumber(b.silver);
        if (sB !== sA) return sB - sA;
        return getProbNumber(b.bronze) - getProbNumber(a.bronze);
      });
      const res = [];
      if (sorted[0]) res.push({ medal: 'gold', item: sorted[0] });
      if (sorted[1]) res.push({ medal: 'silver', item: sorted[1] });
      if (sorted[2]) res.push({ medal: 'bronze', item: sorted[2] });
      return res;
    };

    const eventDefs = [
      { id: 'hbl_men', name: "Men's Tournament", shortName: "Men's", gender: 'men', icon: '🤾' },
      { id: 'hbl_women', name: "Women's Tournament", shortName: "Women's", gender: 'women', icon: '🤾' }
    ];

    const activeEvents = curGen === 'women'
      ? eventDefs.filter(e => e.gender === 'women')
      : (curGen === 'men' ? eventDefs.filter(e => e.gender === 'men') : eventDefs);

    const medalEvents = [];
    const actualTableMap = {};
    const projectedTableMap = {};

    let totalDecidedMedals = 0;
    let totalExactHits = 0;
    let totalPodiumHits = 0;
    let totalDecidedGold = 0;
    let totalGoldHits = 0;

    activeEvents.forEach(def => {
      const isMen = def.gender === 'men';
      const mList = isMen ? (menMatches || []) : (womenMatches || []);
      const pList = isMen ? (menPreds || []) : (womenPreds || []);

      const pPodium = projectPodium(pList);
      const projGold = formatC(pPodium.find(p => p.medal === 'gold')?.item);
      const projSilver = formatC(pPodium.find(p => p.medal === 'silver')?.item);
      const projBronze = formatC(pPodium.find(p => p.medal === 'bronze')?.item);

      let actualGold = null;
      let actualSilver = null;
      let actualBronze = null;
      let status = 'Upcoming';
      let matchInfo = '';
      let goldScoreInfo = '';
      let bronzeScoreInfo = '';

      if (isMen) {
        const parsed = mList.map(m => (typeof parseMatchData === 'function' ? parseMatchData(m) : m));
        const finalMatch = parsed.find(m => /gold|\bfinal\b/i.test(m.stage || m.round || '') && !/semi|quarter|bronze/i.test(m.stage || m.round || ''));
        const bronzeMatch = parsed.find(m => /bronze|3rd/i.test(m.stage || m.round || ''));

        if (finalMatch && finalMatch.isFinished) {
          status = 'Finished';
          const w = finalMatch.winner || (Number(finalMatch.s1) > Number(finalMatch.s2) ? finalMatch.t1 : finalMatch.t2);
          const l = clean(w) === clean(finalMatch.t1) ? finalMatch.t2 : finalMatch.t1;
          actualGold = formatC({ team: w });
          actualSilver = formatC({ team: l });
          goldScoreInfo = `Gold Final: ${finalMatch.t1} ${finalMatch.s1}-${finalMatch.s2} ${finalMatch.t2} (Official)`;
          matchInfo = goldScoreInfo;
        } else if (finalMatch) {
          goldScoreInfo = `Gold Final: ${finalMatch.t1} vs ${finalMatch.t2} (${finalMatch.date} ${finalMatch.time})`;
          matchInfo = goldScoreInfo;
          if (mList.some(m => m.isFinished)) status = 'Live';
        }

        if (bronzeMatch && bronzeMatch.isFinished) {
          const w = bronzeMatch.winner || (Number(bronzeMatch.s1) > Number(bronzeMatch.s2) ? bronzeMatch.t1 : bronzeMatch.t2);
          actualBronze = formatC({ team: w });
          bronzeScoreInfo = `Bronze Match: ${bronzeMatch.t1} ${bronzeMatch.s1}-${bronzeMatch.s2} ${bronzeMatch.t2} (Official)`;
          matchInfo += (matchInfo ? ' • ' : '') + bronzeScoreInfo;
        } else if (bronzeMatch) {
          bronzeScoreInfo = `Bronze Match: ${bronzeMatch.t1} vs ${bronzeMatch.t2} (${bronzeMatch.date} ${bronzeMatch.time})`;
        }
      } else {
        const table = {};
        let finishedCount = 0;
        mList.forEach(m => {
          const t1 = m.player1 || m.t1;
          const t2 = m.player2 || m.t2;
          if (!t1 || !t2 || t1 === 'TBD' || t2 === 'TBD') return;
          if (!table[t1]) table[t1] = { name: t1, pts: 0, gd: 0, gf: 0, ga: 0, gp: 0 };
          if (!table[t2]) table[t2] = { name: t2, pts: 0, gd: 0, gf: 0, ga: 0, gp: 0 };

          const isFin = m.status === 'Finished' || String(m.state || '').toLowerCase().includes('official');
          if (isFin && m.score1 != null && m.score2 != null && m.score1 !== '-' && m.score2 !== '-') {
            finishedCount++;
            const s1 = Number(m.score1);
            const s2 = Number(m.score2);
            table[t1].gp++; table[t2].gp++;
            table[t1].gf += s1; table[t1].ga += s2;
            table[t2].gf += s2; table[t2].ga += s1;
            if (s1 > s2) { table[t1].pts += 2; }
            else if (s2 > s1) { table[t2].pts += 2; }
            else { table[t1].pts += 1; table[t2].pts += 1; }
            table[t1].gd = table[t1].gf - table[t1].ga;
            table[t2].gd = table[t2].gf - table[t2].ga;
          }
        });

        const sortedStandings = Object.values(table).sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
        if (finishedCount >= 21) {
          status = 'Finished';
          if (sortedStandings[0]) actualGold = formatC({ team: sortedStandings[0].name });
          if (sortedStandings[1]) actualSilver = formatC({ team: sortedStandings[1].name });
          if (sortedStandings[2]) actualBronze = formatC({ team: sortedStandings[2].name });
          matchInfo = `Round-Robin Completed • Champion: ${sortedStandings[0]?.name || ''} 🥇`;
        } else if (finishedCount > 0) {
          status = 'Live';
          const leader = sortedStandings[0]?.name || 'Japan';
          matchInfo = `${finishedCount} of 21 matches completed • Current Leader: ${leader}`;
        }
      }

      const recordMedal = (tableMap, item, type) => {
        if (!item || !item.cleaned) return;
        const cln = item.cleaned;
        if (!tableMap[cln]) tableMap[cln] = { name: item.name, flag: item.flag || '🤾', isHost: item.isHost, gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
        tableMap[cln][type] += 1;
        tableMap[cln].total += 1;
      };

      recordMedal(projectedTableMap, projGold, 'gold');
      recordMedal(projectedTableMap, projSilver, 'silver');
      recordMedal(projectedTableMap, projBronze, 'bronze');

      if (actualGold) recordMedal(actualTableMap, actualGold, 'gold');
      if (actualSilver) recordMedal(actualTableMap, actualSilver, 'silver');
      if (actualBronze) recordMedal(actualTableMap, actualBronze, 'bronze');

      const projTop3 = [projGold?.cleaned, projSilver?.cleaned, projBronze?.cleaned].filter(Boolean);
      let evDecided = 0, evExact = 0, evPodium = 0;

      if (actualGold) {
        evDecided++; totalDecidedMedals++; totalDecidedGold++;
        if (actualGold.cleaned === projGold?.cleaned) { evExact++; totalExactHits++; totalGoldHits++; }
        if (projTop3.includes(actualGold.cleaned)) { evPodium++; totalPodiumHits++; }
      }
      if (actualSilver) {
        evDecided++; totalDecidedMedals++;
        if (actualSilver.cleaned === projSilver?.cleaned) { evExact++; totalExactHits++; }
        if (projTop3.includes(actualSilver.cleaned)) { evPodium++; totalPodiumHits++; }
      }
      if (actualBronze) {
        evDecided++; totalDecidedMedals++;
        if (actualBronze.cleaned === projBronze?.cleaned) { evExact++; totalExactHits++; }
        if (projTop3.includes(actualBronze.cleaned)) { evPodium++; totalPodiumHits++; }
      }

      medalEvents.push({
        id: def.id,
        name: def.name,
        shortName: def.shortName,
        gender: def.gender,
        icon: def.icon,
        type: 'team',
        status,
        matchInfo,
        goldScoreInfo,
        bronzeScoreInfo,
        rankings: pList,
        projected: { gold: projGold, silver: projSilver, bronze: projBronze },
        actual: { gold: actualGold, silver: actualSilver, bronze: actualBronze },
        evaluation: {
          decidedCount: evDecided,
          exactHits: evExact,
          podiumHits: evPodium,
          goldHit: actualGold ? actualGold.cleaned === projGold?.cleaned : null,
          silverHit: actualSilver ? actualSilver.cleaned === projSilver?.cleaned : null,
          bronzeHit: actualBronze ? actualBronze.cleaned === projBronze?.cleaned : null,
          accuracyPct: evDecided > 0 ? Math.round((evExact / evDecided) * 100) : null,
          podiumRatePct: evDecided > 0 ? Math.round((evPodium / evDecided) * 100) : null
        }
      });
    });

    const totalMedalsInSport = activeEvents.length * 3;
    const actualTable = Object.values(actualTableMap).sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze);
    const projectedTable = Object.values(projectedTableMap).sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze);

    const allNations = new Set([...Object.keys(actualTableMap), ...Object.keys(projectedTableMap)]);
    const comparisonTable = Array.from(allNations).map(cln => {
      const act = actualTableMap[cln] || { name: '', gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
      const prj = projectedTableMap[cln] || { name: '', gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
      const name = act.name || prj.name || cln;
      const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(name) : '🤾';
      const diffTotal = act.total - prj.total;

      let status = '⚪ Scheduled';
      if (totalDecidedMedals > 0) {
        if (act.total === prj.total && act.gold === prj.gold && act.silver === prj.silver && act.bronze === prj.bronze) {
          status = '🟢 Exact Match';
        } else if (act.total >= prj.total) {
          status = '🟡 Met/Exceeded';
        } else {
          status = '🔴 Behind';
        }
      }

      return {
        key: cln,
        cleaned: cln,
        name,
        flag,
        isHost: name.toLowerCase().includes('japan'),
        actual: act,
        projected: prj,
        diffTotal,
        status,
        projectedAthletes: []
      };
    }).sort((a, b) => {
      if (b.actual.gold !== a.actual.gold) return b.actual.gold - a.actual.gold;
      if (b.actual.silver !== a.actual.silver) return b.actual.silver - a.actual.silver;
      if (b.actual.bronze !== a.actual.bronze) return b.actual.bronze - a.actual.bronze;
      if (b.projected.gold !== a.projected.gold) return b.projected.gold - a.projected.gold;
      return b.projected.silver - a.projected.silver;
    });

    return {
      events: medalEvents,
      actualTable,
      projectedTable,
      comparisonTable,
      kpi: {
        totalMedalsInSport,
        decidedMedals: totalDecidedMedals,
        exactHits: totalExactHits,
        podiumHits: totalPodiumHits,
        decidedGoldEvents: totalDecidedGold,
        goldHits: totalGoldHits,
        accuracyPct: totalDecidedMedals > 0 ? Math.round((totalExactHits / totalDecidedMedals) * 100) : null,
        podiumRatePct: totalDecidedMedals > 0 ? Math.round((totalPodiumHits / totalDecidedMedals) * 100) : null,
        goldAccuracyPct: totalDecidedGold > 0 ? Math.round((totalGoldHits / totalDecidedGold) * 100) : null
      }
    };
  }
};
