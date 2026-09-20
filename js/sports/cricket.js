// ==========================================================================
// Asian Games 2026: Cricket Sport Engine (Decoupled Plugin)
// ==========================================================================

(function () {
  window.SPORT_ENGINES = window.SPORT_ENGINES || {};

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

  const clean = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();

  const parseMatch = (m) => {
    const base = typeof parseMatchData === 'function' ? parseMatchData(m) : {};
    
    let s1 = base.s1 || m.score1 || '-';
    let s2 = base.s2 || m.score2 || '-';
    
    const rawScore = m.score || base.score || '';
    if (rawScore && !m.score1 && !m.score2) {
        if (rawScore.includes(' - ')) {
            const parts = rawScore.split(' - ');
            if (parts.length === 4) {
                s1 = parts[0].trim() + ' - ' + parts[1].trim();
                s2 = parts[2].trim() + ' - ' + parts[3].trim();
            } else if (parts.length === 2) {
                s1 = parts[0].trim();
                s2 = parts[1].trim();
            } else {
                s1 = rawScore;
            }
        }
    }

    return {
      ...m,
      ...base,
      t1: base.t1 || m.player1 || m.team1 || 'TBD',
      t2: base.t2 || m.player2 || m.team2 || 'TBD',
      s1: s1,
      s2: s2,
      winner: m.winner || base.winner || '',
      state: m.state || base.state || '',
      status: m.status || base.status || '',
      stage: base.stage || m.round || m.stage || 'Match',
      date: base.date || m.date || '',
      time: base.time || m.time || '',
      isFinished: base.isFinished || (m.status || '').toLowerCase().includes('finish') || (m.status || '').toLowerCase().includes('official')
    };
  };

  const CRICKET_ENGINE = {
    icon: '🏏',
    hasBracket: true,

    renderMatches(matches) {
      if (!matches || matches.length === 0) {
        return `<div style="text-align:center; padding:3rem 1rem; color:#94a3b8;">No matches scheduled for Cricket.</div>`;
      }

      const parsed = matches.map(m => parseMatch(m));
      const todayStr = '2026-09-20';

      const liveSession = parsed.find(s => (s.status || '').toLowerCase().includes('live') || (s.state || '').toLowerCase().includes('live'));
      const upcomingSessions = parsed.filter(s => !s.isFinished && (s.date || '') >= todayStr);
      const heroTarget = liveSession || upcomingSessions[0] || parsed.find(s => !s.isFinished) || parsed[0];

      let heroHtml = '';
      if (heroTarget) {
        const isLive = (heroTarget.status || '').toLowerCase().includes('live') || (heroTarget.state || '').toLowerCase().includes('live');
        const displayDateTime = formatMatchDateTime(heroTarget.date, heroTarget.time) || heroTarget.status || 'Scheduled';

        heroHtml = `
          <div style="background:linear-gradient(135deg, rgba(30,58,138,0.4), rgba(15,23,42,0.8)); border:1px solid rgba(59,130,246,0.3); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem; text-align:center;">
            <div style="display:inline-block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; padding:0.2rem 0.65rem; border-radius:9999px; background:${isLive ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}; color:${isLive ? '#ef4444' : '#60a5fa'}; margin-bottom:0.75rem;">
              ${isLive ? '🔴 LIVE NOW' : '⏳ NEXT MATCH'}
            </div>
            <div style="display:flex; justify-content:center; align-items:center; gap:1rem; margin-bottom:0.5rem;">
              <div style="font-weight:700; font-size:1rem; color:#f8fafc; display:flex; align-items:center; gap:0.4rem;">
                <span>${getFlagEmoji(heroTarget.t1)}</span> ${heroTarget.t1}
              </div>
              <span style="color:#94a3b8; font-weight:600; font-size:0.85rem;">VS</span>
              <div style="font-weight:700; font-size:1rem; color:#f8fafc; display:flex; align-items:center; gap:0.4rem;">
                <span>${getFlagEmoji(heroTarget.t2)}</span> ${heroTarget.t2}
              </div>
            </div>
            <div style="font-size:0.8rem; color:#94a3b8;">
              ${displayDateTime} • ${heroTarget.stage}
            </div>
          </div>
        `;
      }

      const cardsHtml = parsed.map(s => {
        const displayDateTime = formatMatchDateTime(s.date, s.time) || s.status || 'Scheduled';
        const isOfficial = s.isFinished;
        const isLive = (s.status || '').toLowerCase().includes('live');
        
        const stateCombined = ((s.state || '') + ' ' + (s.status || '')).toLowerCase();
        const isCancelled = stateCombined.includes('cancel') || stateCombined.includes('rain') || stateCombined.includes('abandon') || (isOfficial && s.winner && s.s1 === '-' && s.s2 === '-');

        // Resilient check: Award the win if it's official OR cancelled, as long as a winner is provided
        const t1Win = (isOfficial || isCancelled) && s.winner && clean(s.winner) === clean(s.t1);
        const t2Win = (isOfficial || isCancelled) && s.winner && clean(s.winner) === clean(s.t2);

        return `
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.85rem 1rem; margin-bottom:0.75rem;">
            <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.3rem; display:flex; justify-content:space-between; align-items:center;">
              <span>${s.stage} • ${displayDateTime}</span>
              <span style="color:${isCancelled ? '#f59e0b' : isLive ? '#ef4444' : isOfficial ? '#4ade80' : '#38bdf8'}; font-weight:600;">
                ${isCancelled ? 'Cancelled (Rain)' : (s.status || 'Scheduled')}
              </span>
            </div>

            ${isCancelled ? `
              <div style="font-size:0.78rem; color:#94a3b8; margin:0.35rem 0 0.5rem 0; display:flex; align-items:center; gap:0.35rem; line-height:1.4;">
                <span>🌧️</span> <span>Match cancelled due to rain. <strong>${s.winner}</strong> advanced due to higher seeding.</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.25rem 0;">
                <div style="font-weight:${t1Win ? '700' : '400'}; font-size:0.9rem; color:${t1Win ? '#38bdf8' : '#64748b'}; display:flex; align-items:center; gap:0.4rem;">
                  <span>${getFlagEmoji(s.t1)}</span> ${s.t1}${t1Win ? '<span style="color:#4ade80; font-size:0.85rem;">✓</span>' : ''}
                </div>
                <span style="font-size:0.72rem; padding:2px 8px; border-radius:6px; font-weight:600; background:${t1Win ? 'rgba(56,189,248,0.15)' : 'rgba(239,68,68,0.1)'}; color:${t1Win ? '#38bdf8' : '#ef4444'};">
                  ${t1Win ? 'Advanced (Seeding)' : 'Eliminated'}
                </span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.25rem 0;">
                <div style="font-weight:${t2Win ? '700' : '400'}; font-size:0.9rem; color:${t2Win ? '#38bdf8' : '#64748b'}; display:flex; align-items:center; gap:0.4rem;">
                  <span>${getFlagEmoji(s.t2)}</span> ${s.t2}${t2Win ? '<span style="color:#4ade80; font-size:0.85rem;">✓</span>' : ''}
                </div>
                <span style="font-size:0.72rem; padding:2px 8px; border-radius:6px; font-weight:600; background:${t2Win ? 'rgba(56,189,248,0.15)' : 'rgba(239,68,68,0.1)'}; color:${t2Win ? '#38bdf8' : '#ef4444'};">
                  ${t2Win ? 'Advanced (Seeding)' : 'Eliminated'}
                </span>
              </div>
            ` : `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.25rem 0;">
                <div style="font-weight:${t1Win ? '700' : isOfficial ? '400' : '600'}; font-size:0.9rem; color:${t1Win ? '#38bdf8' : isOfficial ? '#64748b' : '#f8fafc'}; display:flex; align-items:center; gap:0.4rem;">
                  <span>${getFlagEmoji(s.t1)}</span> ${s.t1}${t1Win ? '<span style="color:#4ade80; font-size:0.85rem;">✓</span>' : ''}
                </div>
                <span style="font-family:monospace; font-weight:${t1Win ? '700' : '500'}; color:${t1Win ? '#38bdf8' : isOfficial ? '#64748b' : '#f8fafc'};">${s.s1}</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.25rem 0;">
                <div style="font-weight:${t2Win ? '700' : isOfficial ? '400' : '600'}; font-size:0.9rem; color:${t2Win ? '#38bdf8' : isOfficial ? '#64748b' : '#f8fafc'}; display:flex; align-items:center; gap:0.4rem;">
                  <span>${getFlagEmoji(s.t2)}</span> ${s.t2}${t2Win ? '<span style="color:#4ade80; font-size:0.85rem;">✓</span>' : ''}
                </div>
                <span style="font-family:monospace; font-weight:${t2Win ? '700' : '500'}; color:${t2Win ? '#38bdf8' : isOfficial ? '#64748b' : '#f8fafc'};">${s.s2}</span>
              </div>
            `}
          </div>
        `;
      }).join('');

      return heroHtml + cardsHtml;
    },

    renderStandingsTable(matches) {
      const parsedMatches = matches.map(m => parseMatch(m));
      const groups = {};

      parsedMatches.forEach(m => {
        const grpMatch = (m.stage || '').match(/Group\s+[A-Za-z0-9]+/i);
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

            const t1Won = m.winner ? clean(m.winner) === clean(m.t1) : true;
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
      const parsed = matches.map(m => parseMatch(m));
      const getStage = (m) => ((m.stage || '') + ' ' + (m.status || '')).toLowerCase();

      const qfMatches = parsed.filter(m => getStage(m).includes('quarter') || getStage(m).includes('qf'));
      const sfMatches = parsed.filter(m => getStage(m).includes('semi') || getStage(m).includes('sf'));
      const finalMatch = parsed.find(m => getStage(m).includes('gold') || (getStage(m).includes('final') && !getStage(m).includes('semi') && !getStage(m).includes('quarter') && !getStage(m).includes('bronze')));
      const bronzeMatch = parsed.find(m => getStage(m).includes('bronze') || getStage(m).includes('3rd'));

      const getGame = (list, num) => list.find(m => new RegExp(`game\\s*${num}`, 'i').test(m.stage || '')) || list[num - 1];

      const defaultQF = [
        { title: 'QF 1', t1: 'Pakistan', t2: '2nd Group B' },
        { title: 'QF 2', t1: 'India', t2: '2nd Group A' },
        { title: 'QF 3', t1: 'Sri Lanka', t2: '1st Group A' },
        { title: 'QF 4', t1: 'Bangladesh', t2: '1st Group B' }
      ];

      const renderSlot = (title, match, fallback, medalType = null) => {
        const t1 = (match && match.t1 && match.t1 !== 'TBD') ? match.t1 : fallback.t1;
        const t2 = (match && match.t2 && match.t2 !== 'TBD') ? match.t2 : fallback.t2;
        
        const stateCombined = match ? ((match.state || '') + ' ' + (match.status || '')).toLowerCase() : '';
        const isCancelled = match && (stateCombined.includes('cancel') || stateCombined.includes('rain') || stateCombined.includes('abandon') || (match.isFinished && match.winner && match.s1 === '-' && match.s2 === '-'));

        const isFinished = match ? match.isFinished : false;
        
        // Resilient check for bracket advancement
        const t1Win = (isFinished || isCancelled) && match.winner && clean(match.winner) === clean(t1);
        const t2Win = (isFinished || isCancelled) && match.winner && clean(match.winner) === clean(t2);

        const s1 = isCancelled ? (t1Win ? 'ADV' : '-') : (match ? match.s1 : '-');
        const s2 = isCancelled ? (t2Win ? 'ADV' : '-') : (match ? match.s2 : '-');

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
              <span class="bracket-score" ${isCancelled && t1Win ? 'style="font-size:0.75rem; color:#4ade80; font-weight:700;"' : ''}>${s1}</span>
            </div>
            <div class="bracket-team-row ${t2Win ? 'winner' : ''}">
              <div class="bracket-team-info"><span>${getFlagEmoji(t2)}</span> <span>${t2}</span></div>
              <span class="bracket-score" ${isCancelled && t2Win ? 'style="font-size:0.75rem; color:#4ade80; font-weight:700;"' : ''}>${s2}</span>
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

  window.SPORT_ENGINES['cricket'] = CRICKET_ENGINE;
})();
