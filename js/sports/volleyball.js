// ==========================================================================
// Asian Games 2026: Volleyball Sport Engine (FIVB Standings & Bracket)
// ==========================================================================

window.SPORT_ENGINES = window.SPORT_ENGINES || {};

// Official Asian Games 2026 Men's Preliminary Pools
const VOLLEYBALL_KNOWN_POOLS = {
  // Pool A
  'japan': 'Pool A', 'pakistan': 'Pool A', 'kazakhstan': 'Pool A', 'uzbekistan': 'Pool A',
  // Pool B
  'ir iran': 'Pool B', 'iran': 'Pool B', 'indonesia': 'Pool B', 'thailand': 'Pool B', 'kyrgyzstan': 'Pool B',
  // Pool C
  'qatar': 'Pool C', 'india': 'Pool C', 'vietnam': 'Pool C', 'hong kong, china': 'Pool C', 'hong kong': 'Pool C',
  // Pool D
  'china': 'Pool D', 'korea': 'Pool D', 'south korea': 'Pool D', 'chinese taipei': 'Pool D', 'philippines': 'Pool D'
};

function resolveVolleyballPool(m) {
  const roundStr = (m.round || m.stage || '').toString();
  
  // 1. Direct match if the scraper contains "Pool X" or "Group X"
  const directMatch = roundStr.match(/(?:Group|Pool)\s+([A-Za-z0-9]+)/i);
  if (directMatch) return `Pool ${directMatch[1].toUpperCase()}`;

  // Exclude classification and knockout games
  const isKnockoutOrPlacement = /(?:place|medal|final|semi|quarter|qf|sf)/i.test(roundStr);
  if (isKnockoutOrPlacement) return null;

  // 2. Lookup known seeds
  const t1 = (m.player1 || m.t1 || '').toString().trim().toLowerCase();
  const t2 = (m.player2 || m.t2 || '').toString().trim().toLowerCase();

  if (VOLLEYBALL_KNOWN_POOLS[t1]) return VOLLEYBALL_KNOWN_POOLS[t1];
  if (VOLLEYBALL_KNOWN_POOLS[t2]) return VOLLEYBALL_KNOWN_POOLS[t2];

  return null;
}

window.SPORT_ENGINES['volleyball'] = {
  icon: '🏐',

  // --- FIVB Standings Engine (3-2-1-0 Point System) ---
  renderStandingsTable(matches) {
    if (!matches || matches.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No group stage data available.</div>`;
    }

    const groups = {};

    // 1. Assign pools to matches
    matches.forEach(rawM => {
      const m = typeof parseMatchData === 'function' ? parseMatchData(rawM) : rawM;
      const t1 = m.t1 || m.player1 || rawM.player1;
      const t2 = m.t2 || m.player2 || rawM.player2;

      if (!t1 || !t2 || t1 === 'TBD' || t2 === 'TBD') return;

      const grpName = resolveVolleyballPool(m);
      if (!grpName) return;

      if (!groups[grpName]) groups[grpName] = {};

      [t1, t2].forEach(team => {
        if (!groups[grpName][team]) {
          groups[grpName][team] = { name: team, gp: 0, w: 0, l: 0, pts: 0, sw: 0, sl: 0, diff: 0 };
        }
      });

      // Resolve score strings
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

        groups[grpName][t1].gp += 1;
        groups[grpName][t2].gp += 1;
        groups[grpName][t1].sw += score1;
        groups[grpName][t1].sl += score2;
        groups[grpName][t2].sw += score2;
        groups[grpName][t2].sl += score1;

        // FIVB 3-2-1-0 Point System
        if (score1 > score2) {
          groups[grpName][t1].w += 1;
          groups[grpName][t2].l += 1;
          if (score2 === 2) {
            groups[grpName][t1].pts += 2;
            groups[grpName][t2].pts += 1;
          } else {
            groups[grpName][t1].pts += 3;
          }
        } else if (score2 > score1) {
          groups[grpName][t2].w += 1;
          groups[grpName][t1].l += 1;
          if (score1 === 2) {
            groups[grpName][t2].pts += 2;
            groups[grpName][t1].pts += 1;
          } else {
            groups[grpName][t2].pts += 3;
          }
        }

        groups[grpName][t1].diff = groups[grpName][t1].sw - groups[grpName][t1].sl;
        groups[grpName][t2].diff = groups[grpName][t2].sw - groups[grpName][t2].sl;
      }
    });

    const groupKeys = Object.keys(groups).sort();
    if (groupKeys.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No group stage data available.</div>`;
    }

    return groupKeys.map(grpKey => {
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
