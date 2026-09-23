// ==========================================================================
// Asian Games 2026: Soft Tennis Sport Engine (Singles, Doubles, Team)
// ==========================================================================

(function () {
  window.SPORT_ENGINES = window.SPORT_ENGINES || {};

  let activeSoftTennisEventFilter = null;
  let activeSoftTennisPhaseFilter = 'all'; // 'all' | 'groups' | 'knockout' | 'finals'
  let activeSoftTennisStandingsEvent = null;
  let activeSoftTennisBracketEvent = null;
  let activeSoftTennisCalibrationEvent = null;

  function clean(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }

  function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function parseMatch(m) {
    const base = typeof parseMatchData === 'function' ? parseMatchData(m) : {};

    let country1 = m.team1 || m.team_1 || '';
    let athlete1 = m.athlete1 || '';
    if (m.player1 && m.player1.includes('(')) {
      const m1 = m.player1.match(/^(.*?)\s*\(([^)]+)\)/);
      if (m1) {
        if (!country1) country1 = m1[1].trim();
        if (!athlete1) athlete1 = m1[2].trim();
      }
    }
    if (!country1) country1 = m.player1 || base.t1 || 'TBD';

    let country2 = m.team2 || m.team_2 || '';
    let athlete2 = m.athlete2 || '';
    if (m.player2 && m.player2.includes('(')) {
      const m2 = m.player2.match(/^(.*?)\s*\(([^)]+)\)/);
      if (m2) {
        if (!country2) country2 = m2[1].trim();
        if (!athlete2) athlete2 = m2[2].trim();
      }
    }
    if (!country2) country2 = m.player2 || base.t2 || 'TBD';

    const t1 = typeof formatTeamDisplayName === 'function' ? formatTeamDisplayName(country1) : country1;
    const t2 = typeof formatTeamDisplayName === 'function' ? formatTeamDisplayName(country2) : country2;

    let s1 = (m.score1 != null && m.score1 !== '') ? String(m.score1) : '';
    let s2 = (m.score2 != null && m.score2 !== '') ? String(m.score2) : '';
    if ((!s1 || !s2) && m.score && String(m.score).includes('-')) {
      const parts = String(m.score).split('-').map(x => x.trim());
      if (!s1 && parts[0] !== undefined) s1 = parts[0];
      if (!s2 && parts[1] !== undefined) s2 = parts[1];
    }
    if (!s1) s1 = base.s1 || '-';
    if (!s2) s2 = base.s2 || '-';

    const rawRound = m.round || m.stage || '';
    const rawStage = m.stage || m.round || '';
    const isFinished = Boolean(base.isFinished || (m.status || '').toLowerCase().includes('finish') || (m.status || '').toLowerCase().includes('official') || (m.state || '').toLowerCase().includes('official'));

    return {
      ...m,
      ...base,
      t1,
      t2,
      team1: t1,
      team2: t2,
      athlete1,
      athlete2,
      s1,
      s2,
      rawRound,
      rawStage,
      round: rawRound || base.stage || 'Match',
      stage: rawRound || base.stage || 'Match',
      winner: m.winner || base.winner || '',
      state: m.state || base.state || '',
      status: m.status || base.status || '',
      date: base.date || m.date || '',
      time: base.time || m.time || '',
      event: m.event || '',
      phase: m.phase || '',
      court: m.court || '',
      set_scores: m.set_scores || m.setScores || '',
      isFinished
    };
  }

  function renderSoftTennisEventHero(evName, evMatches) {
    if (!evMatches || evMatches.length === 0) return '';

    const liveMatch = evMatches.find(m => (m.status || '').toLowerCase().includes('live') || (m.state || '').toLowerCase().includes('live'));
    const finalMatch = evMatches.find(m => /gold|final/i.test(m.stage || m.round || '') && !/semi|quarter|bronze/i.test(m.stage || m.round || ''));
    const sfMatches = evMatches.filter(m => /semi|sf/i.test(m.stage || m.round || ''));

    if (liveMatch) {
      const f1 = getFlagEmoji(liveMatch.team1 || liveMatch.t1);
      const f2 = getFlagEmoji(liveMatch.team2 || liveMatch.t2);
      return `
        <div style="background:linear-gradient(135deg, rgba(239,68,68,0.18), rgba(15,23,42,0.9)); border:1px solid rgba(239,68,68,0.4); border-radius:12px; padding:1.25rem; position:relative; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.3);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:6px;">
            <span style="font-size:0.95rem; font-weight:800; color:#f8fafc; display:flex; align-items:center; gap:6px;">
              <span>🎾</span> <span>${evName}</span>
            </span>
            <span style="display:inline-block; font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; padding:2px 8px; border-radius:9999px; background:rgba(239,68,68,0.25); color:#ef4444; border:1px solid rgba(239,68,68,0.4);">
              🔴 LIVE NOW
            </span>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-around; margin:0.75rem 0; gap:12px; text-align:center;">
            <div style="flex:1; min-width:0;">
              <div style="font-size:1.8rem; line-height:1.2;">${f1}</div>
              <div style="font-weight:700; font-size:1rem; color:#f8fafc; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${liveMatch.team1 || liveMatch.t1}
              </div>
              ${liveMatch.athlete1 ? `<div style="font-size:0.72rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${liveMatch.athlete1}</div>` : ''}
            </div>
            <div style="text-align:center; min-width:70px;">
              <div style="font-size:0.68rem; color:#ef4444; font-weight:700; text-transform:uppercase; margin-bottom:2px;">${liveMatch.stage}</div>
              <div style="font-family:monospace; font-size:1.5rem; font-weight:800; color:#f8fafc;">
                ${liveMatch.s1 !== '-' ? `${liveMatch.s1} - ${liveMatch.s2}` : 'vs'}
              </div>
              ${liveMatch.set_scores ? `<div style="font-size:0.68rem; color:#94a3b8; font-family:monospace; margin-top:2px;">${liveMatch.set_scores}</div>` : ''}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:1.8rem; line-height:1.2;">${f2}</div>
              <div style="font-weight:700; font-size:1rem; color:#f8fafc; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${liveMatch.team2 || liveMatch.t2}
              </div>
              ${liveMatch.athlete2 ? `<div style="font-size:0.72rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${liveMatch.athlete2}</div>` : ''}
            </div>
          </div>
        </div>
      `;
    }

    // If Gold match exists
    if (finalMatch) {
      const isFin = finalMatch.isFinished;
      const t1 = finalMatch.team1 || finalMatch.t1;
      const t2 = finalMatch.team2 || finalMatch.t2;
      const wClean = cleanTeamName(finalMatch.winner || '');
      const goldTeam = wClean ? (wClean === cleanTeamName(t1) ? t1 : t2) : t1;
      const silverTeam = wClean ? (wClean === cleanTeamName(t1) ? t2 : t1) : t2;
      const goldAthlete = goldTeam === t1 ? finalMatch.athlete1 : finalMatch.athlete2;
      const silverAthlete = silverTeam === t1 ? finalMatch.athlete1 : finalMatch.athlete2;

      // Extract bronze medalists from semifinal losers
      const bronzes = [];
      sfMatches.forEach(sf => {
        if (sf.isFinished) {
          const sfWinner = cleanTeamName(sf.winner || '');
          const sfLoser = (sfWinner === cleanTeamName(sf.team1)) ? sf.team2 : sf.team1;
          const sfLoserAth = (sfWinner === cleanTeamName(sf.team1)) ? sf.athlete2 : sf.athlete1;
          if (sfLoser && sfLoser !== 'TBD') bronzes.push({ team: sfLoser, athlete: sfLoserAth });
        }
      });

      return `
        <div style="background:linear-gradient(135deg, rgba(250,204,21,0.12), rgba(15,23,42,0.85)); border:1px solid rgba(250,204,21,0.35); border-radius:12px; padding:1.25rem; position:relative; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.3);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:6px;">
            <span style="font-size:0.95rem; font-weight:800; color:#f8fafc; display:flex; align-items:center; gap:6px;">
              <span>🎾</span> <span>${evName}</span>
            </span>
            <span style="display:inline-block; font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; padding:2px 8px; border-radius:9999px; background:${isFin ? 'rgba(34,197,94,0.2)' : 'rgba(250,204,21,0.2)'}; color:${isFin ? '#4ade80' : '#facc15'}; border:1px solid ${isFin ? 'rgba(34,197,94,0.35)' : 'rgba(250,204,21,0.35)'};">
              ${isFin ? '🏆 CHAMPION DECIDED' : '🥇 GOLD MEDAL MATCH'}
            </span>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-around; margin:0.75rem 0; gap:12px; text-align:center;">
            <div style="flex:1; min-width:0;">
              <div style="font-size:1.8rem; line-height:1.2;">${getFlagEmoji(goldTeam)}</div>
              <div style="font-weight:700; font-size:1rem; color:#f8fafc; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${goldTeam} ${isFin ? '🥇' : ''}
              </div>
              ${goldAthlete ? `<div style="font-size:0.72rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${goldAthlete}</div>` : ''}
            </div>
            <div style="text-align:center; min-width:70px;">
              <div style="font-size:0.65rem; color:#facc15; font-weight:700; text-transform:uppercase;">${finalMatch.stage}</div>
              <div style="font-family:monospace; font-size:1.4rem; font-weight:800; color:#f8fafc;">
                ${finalMatch.s1 !== '-' ? `${finalMatch.s1} - ${finalMatch.s2}` : 'vs'}
              </div>
              ${finalMatch.set_scores ? `<div style="font-size:0.68rem; color:#94a3b8; font-family:monospace; margin-top:2px;">${finalMatch.set_scores}</div>` : ''}
              <div style="font-size:0.68rem; color:#94a3b8;">${formatMatchDateTime(finalMatch.date, finalMatch.time)}</div>
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:1.8rem; line-height:1.2;">${getFlagEmoji(silverTeam)}</div>
              <div style="font-weight:700; font-size:1rem; color:#cbd5e1; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${silverTeam} ${isFin ? '🥈' : ''}
              </div>
              ${silverAthlete ? `<div style="font-size:0.72rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${silverAthlete}</div>` : ''}
            </div>
          </div>
          ${bronzes.length > 0 ? `
            <div style="background:rgba(0,0,0,0.25); border-radius:8px; padding:6px 10px; font-size:0.72rem; margin-top:0.6rem; border:1px solid rgba(255,255,255,0.05); display:flex; justify-content:space-between; align-items:center;">
              <span style="color:#f59e0b; font-weight:700;">🥉 Bronze Medalists:</span>
              <span style="color:#f8fafc; font-weight:600;">
                ${bronzes.map(b => `${getFlagEmoji(b.team)} ${b.team}${b.athlete ? ` (${b.athlete})` : ''}`).join(' &nbsp;•&nbsp; ')}
              </span>
            </div>
          ` : ''}
        </div>
      `;
    }

    return '';
  }

  const SOFT_TENNIS_ENGINE = {
    icon: '🎾',
    hasBracket: true,

    // --- Matches & Schedule Renderer ---
    renderMatches(matches) {
      if (!matches || matches.length === 0) {
        return `<div style="text-align:center; padding:3rem 1rem; color:#94a3b8;">No matches scheduled for Soft Tennis.</div>`;
      }

      const parsedMatches = matches.map(m => parseMatch(m));
      const currentGender = window.currentGender || 'men';

      // Available events for this gender
      const rawEvents = Array.from(new Set(parsedMatches.map(m => m.event).filter(Boolean)));
      const score = (ev) => {
        const s = (ev || '').toLowerCase();
        if (s.includes('singles')) return 1;
        if (s.includes('team')) return 2;
        if (s.includes('doubles')) return 3;
        return 10;
      };
      const eventsList = rawEvents.sort((a, b) => score(a) - score(b) || a.localeCompare(b));

      if (!activeSoftTennisEventFilter || !eventsList.includes(activeSoftTennisEventFilter)) {
        activeSoftTennisEventFilter = eventsList[0] || '';
      }

      // Filter matches by selected event
      let filtered = activeSoftTennisEventFilter ? parsedMatches.filter(m => m.event === activeSoftTennisEventFilter) : parsedMatches;

      if (activeSoftTennisPhaseFilter === 'groups') {
        filtered = filtered.filter(m => /group/i.test(m.stage || m.round || ''));
      } else if (activeSoftTennisPhaseFilter === 'knockout') {
        filtered = filtered.filter(m => /first\s*round|round\s*of|quarter|semi|qf|sf/i.test(m.stage || m.round || ''));
      } else if (activeSoftTennisPhaseFilter === 'finals') {
        filtered = filtered.filter(m => /gold|final/i.test(m.stage || m.round || '') && !/semi|quarter|first/i.test(m.stage || m.round || ''));
      }

      // Event Selector & Phase Filter Bar (Rendered FIRST)
      const filterBarHtml = `
        <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1.25rem; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:0.75rem; font-weight:700; color:#94a3b8; text-transform:uppercase;">Event:</span>
              <div class="event-selector-wrap">
                <select class="event-dropdown" onchange="window.setSoftTennisEventFilter(this.value)">
                  ${eventsList.map(ev => `<option value="${escapeAttr(ev)}" ${activeSoftTennisEventFilter === ev ? 'selected' : ''}>${ev}</option>`).join('')}
                </select>
              </div>
            </div>
            <span style="font-size:0.72rem; color:#64748b;">Showing ${filtered.length} of ${parsedMatches.length} matches</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; border-top:1px solid rgba(255,255,255,0.05); padding-top:6px;">
            <span style="font-size:0.72rem; font-weight:700; color:#64748b; text-transform:uppercase; margin-right:4px;">Phase:</span>
            <button style="padding:3px 8px; font-size:0.72rem; font-weight:600; border-radius:5px; border:none; cursor:pointer; background:${activeSoftTennisPhaseFilter === 'all' ? '#38bdf8' : 'transparent'}; color:${activeSoftTennisPhaseFilter === 'all' ? '#0f172a' : '#94a3b8'};" onclick="window.setSoftTennisPhaseFilter('all')">All</button>
            <button style="padding:3px 8px; font-size:0.72rem; font-weight:600; border-radius:5px; border:none; cursor:pointer; background:${activeSoftTennisPhaseFilter === 'groups' ? '#38bdf8' : 'transparent'}; color:${activeSoftTennisPhaseFilter === 'groups' ? '#0f172a' : '#94a3b8'};" onclick="window.setSoftTennisPhaseFilter('groups')">Groups</button>
            <button style="padding:3px 8px; font-size:0.72rem; font-weight:600; border-radius:5px; border:none; cursor:pointer; background:${activeSoftTennisPhaseFilter === 'knockout' ? '#38bdf8' : 'transparent'}; color:${activeSoftTennisPhaseFilter === 'knockout' ? '#0f172a' : '#94a3b8'};" onclick="window.setSoftTennisPhaseFilter('knockout')">Knockout</button>
            <button style="padding:3px 8px; font-size:0.72rem; font-weight:600; border-radius:5px; border:none; cursor:pointer; background:${activeSoftTennisPhaseFilter === 'finals' ? '#38bdf8' : 'transparent'}; color:${activeSoftTennisPhaseFilter === 'finals' ? '#0f172a' : '#94a3b8'};" onclick="window.setSoftTennisPhaseFilter('finals')">Medal Matches</button>
          </div>
        </div>
      `;

      // Hero Banner (Rendered AFTER event selector)
      let heroHtml = '';
      if (activeSoftTennisEventFilter) {
        const evMatches = parsedMatches.filter(m => m.event === activeSoftTennisEventFilter);
        heroHtml = `
          <div style="margin-bottom:1.25rem;">
            ${renderSoftTennisEventHero(activeSoftTennisEventFilter, evMatches)}
          </div>
        `;
      }

      // Group matches by Date
      const byDate = {};
      filtered.forEach(m => {
        const d = m.date || 'Scheduled';
        if (!byDate[d]) byDate[d] = [];
        byDate[d].push(m);
      });

      let matchesHtml = '';
      Object.keys(byDate).sort().forEach(d => {
        const dayMatches = byDate[d];
        matchesHtml += `
          <div style="margin-bottom:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.4rem 0.2rem; margin-bottom:0.6rem; border-bottom:1px solid rgba(255,255,255,0.08);">
              <span style="font-weight:700; font-size:0.85rem; color:#f8fafc;">📅 ${d}</span>
              <span style="font-size:0.72rem; color:#64748b;">${dayMatches.length} match${dayMatches.length > 1 ? 'es' : ''}</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:10px;">
              ${dayMatches.map(m => {
                const isFin = m.isFinished;
                const isLive = (m.status || '').toLowerCase().includes('live');
                const isDelayed = (m.state || '').toLowerCase().includes('delayed');
                const s1 = m.s1 !== '-' ? m.s1 : '-';
                const s2 = m.s2 !== '-' ? m.s2 : '-';
                const cWinner = cleanTeamName(m.winner || '');
                const t1Win = cWinner ? cWinner === cleanTeamName(m.t1) : (isFin && Number(s1) > Number(s2));
                const t2Win = cWinner ? cWinner === cleanTeamName(m.t2) : (isFin && Number(s2) > Number(s1));

                let badgeColor = '#94a3b8';
                let badgeBg = 'rgba(255,255,255,0.05)';
                let badgeText = m.state || m.status || 'Scheduled';

                if (isFin) {
                  badgeColor = '#4ade80';
                  badgeBg = 'rgba(34,197,94,0.15)';
                  badgeText = 'Official';
                } else if (isLive) {
                  badgeColor = '#ef4444';
                  badgeBg = 'rgba(239,68,68,0.2)';
                  badgeText = 'Live';
                } else if (isDelayed) {
                  badgeColor = '#facc15';
                  badgeBg = 'rgba(250,204,21,0.15)';
                  badgeText = 'Delayed';
                }

                return `
                  <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.85rem; display:flex; flex-direction:column; gap:6px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; color:#94a3b8; border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:4px;">
                      <span style="font-weight:600; color:#cbd5e1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:65%;" title="${escapeAttr(m.stage)}">
                        ${m.stage}
                      </span>
                      <div style="display:flex; align-items:center; gap:6px;">
                        <span>${m.court}</span>
                        <span style="font-weight:700; padding:1px 6px; border-radius:4px; font-size:0.65rem; color:${badgeColor}; background:${badgeBg};">
                          ${badgeText}
                        </span>
                      </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:5px; margin-top:2px;">
                      <div style="display:flex; justify-content:space-between; align-items:center; ${t1Win ? 'font-weight:700; color:#4ade80;' : 'color:#f8fafc;'}">
                        <div style="display:flex; align-items:center; gap:6px; min-width:0; overflow:hidden;">
                          <span style="font-size:1.1rem;">${getFlagEmoji(m.t1)}</span>
                          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.85rem;">
                            ${m.t1} ${m.athlete1 ? `<span style="font-size:0.72rem; font-weight:normal; color:#94a3b8;">(${m.athlete1})</span>` : ''}
                          </span>
                        </div>
                        <span style="font-family:monospace; font-size:1rem; font-weight:700; margin-left:8px;">${s1}</span>
                      </div>

                      <div style="display:flex; justify-content:space-between; align-items:center; ${t2Win ? 'font-weight:700; color:#4ade80;' : 'color:#f8fafc;'}">
                        <div style="display:flex; align-items:center; gap:6px; min-width:0; overflow:hidden;">
                          <span style="font-size:1.1rem;">${getFlagEmoji(m.t2)}</span>
                          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.85rem;">
                            ${m.t2} ${m.athlete2 ? `<span style="font-size:0.72rem; font-weight:normal; color:#94a3b8;">(${m.athlete2})</span>` : ''}
                          </span>
                        </div>
                        <span style="font-family:monospace; font-size:1rem; font-weight:700; margin-left:8px;">${s2}</span>
                      </div>
                    </div>

                    ${m.set_scores ? `
                      <div style="font-size:0.68rem; color:#94a3b8; font-family:monospace; margin-top:2px; text-align:right; border-top:1px dashed rgba(255,255,255,0.06); padding-top:3px;">
                        Sets: ${m.set_scores}
                      </div>
                    ` : ''}

                    <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.68rem; color:#64748b; margin-top:2px; padding-top:4px; border-top:1px solid rgba(255,255,255,0.03);">
                      <span>${m.time ? formatMatchDateTime(m.date, m.time) : 'Time TBD'}</span>
                      ${m.winner ? `<span style="color:#4ade80; font-weight:600;">Winner: ${m.winner}</span>` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      });

      return `
        <div>
          ${filterBarHtml}
          ${heroHtml}
          ${matchesHtml}
        </div>
      `;
    },

    // --- Standings Engine ---
    renderStandingsTable(matches) {
      if (!matches || matches.length === 0) {
        return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No match data available for Soft Tennis standings.</div>`;
      }

      const parsedMatches = matches.map(m => parseMatch(m));
      const rawEvents = Array.from(new Set(parsedMatches.map(m => m.event).filter(Boolean)));
      const score = (ev) => {
        const s = (ev || '').toLowerCase();
        if (s.includes('singles')) return 1;
        if (s.includes('team')) return 2;
        if (s.includes('doubles')) return 3;
        return 10;
      };
      const eventsList = rawEvents.sort((a, b) => score(a) - score(b) || a.localeCompare(b));

      if (!activeSoftTennisStandingsEvent || !eventsList.includes(activeSoftTennisStandingsEvent)) {
        activeSoftTennisStandingsEvent = (activeSoftTennisEventFilter && eventsList.includes(activeSoftTennisEventFilter))
          ? activeSoftTennisEventFilter
          : (eventsList[0] || '');
      }

      const eventMatches = parsedMatches.filter(m => m.event === activeSoftTennisStandingsEvent);
      const groups = {};

      eventMatches.forEach(m => {
        const rawStage = String(m.stage || m.round || '');
        const grpMatch = rawStage.match(/group\s*([a-z0-9]+)/i);
        if (!grpMatch) return;

        const grpName = `Group ${grpMatch[1].toUpperCase()}`;
        if (!groups[grpName]) groups[grpName] = {};

        const teamA = m.t1;
        const teamB = m.t2;

        if (teamA && teamB && teamA !== 'TBD' && teamB !== 'TBD') {
          [teamA, teamB].forEach(team => {
            if (!groups[grpName][team]) {
              const ath = (team === teamA) ? m.athlete1 : m.athlete2;
              groups[grpName][team] = { name: team, athlete: ath, mp: 0, w: 0, l: 0, gw: 0, gl: 0, gd: 0, pts: 0 };
            }
          });

          if (m.isFinished && m.s1 !== '-' && m.s2 !== '-') {
            const s1 = Number(m.s1);
            const s2 = Number(m.s2);
            const t1Obj = groups[grpName][teamA];
            const t2Obj = groups[grpName][teamB];

            t1Obj.mp += 1;
            t2Obj.mp += 1;
            t1Obj.gw += s1;
            t1Obj.gl += s2;
            t2Obj.gw += s2;
            t2Obj.gl += s1;

            if (s1 > s2) {
              t1Obj.w += 1;
              t1Obj.pts += 2;
              t2Obj.l += 1;
            } else if (s2 > s1) {
              t2Obj.w += 1;
              t2Obj.pts += 2;
              t1Obj.l += 1;
            }

            t1Obj.gd = t1Obj.gw - t1Obj.gl;
            t2Obj.gd = t2Obj.gw - t2Obj.gl;
          }
        }
      });

      const groupKeys = Object.keys(groups).sort();

      const eventPickerHtml = `
        <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1.25rem; display:flex; align-items:center; gap:8px;">
          <span style="font-size:0.75rem; font-weight:700; color:#94a3b8; text-transform:uppercase;">Event:</span>
          <div class="event-selector-wrap">
            <select class="event-dropdown" onchange="window.setSoftTennisStandingsEvent(this.value)">
              ${eventsList.map(ev => `<option value="${escapeAttr(ev)}" ${activeSoftTennisStandingsEvent === ev ? 'selected' : ''}>${ev}</option>`).join('')}
            </select>
          </div>
        </div>
      `;

      if (groupKeys.length === 0) {
        return `
          ${eventPickerHtml}
          <div style="text-align:center; padding:2rem; color:#94a3b8;">No group stage matches recorded for this event.</div>
        `;
      }

      const evLower = (activeSoftTennisStandingsEvent || '').toLowerCase();
      const isWomen = evLower.includes("women");
      const isTeam = evLower.includes("team");
      const isDoubles = evLower.includes("doubles") || evLower.includes("mixed");
      const isSingles = evLower.includes("singles");
      const isTeamOrMixed = isTeam || isDoubles;
      const qualifyingCount = isTeamOrMixed ? 2 : 1;

      let qualifierNote = 'Group winner advances (Q)';
      if (isWomen && isTeam) {
        qualifierNote = 'Top 2 advance directly to Semifinals (Q)';
      } else if (isDoubles) {
        qualifierNote = 'Top 2 advance to First Round (12 teams qualify; 4 seeds get QF BYEs) (Q)';
      } else if (isTeamOrMixed) {
        qualifierNote = 'Top 2 advance to Knockout Stage (Q)';
      } else if (!isWomen && isSingles) {
        qualifierNote = 'Group winner advances (Group A winner receives QF BYE) (Q)';
      } else if (isWomen && isSingles) {
        qualifierNote = 'Group winner advances to Quarterfinals (Q)';
      }

      const tablesHtml = groupKeys.map(grpKey => {
        const teams = Object.values(groups[grpKey]).sort((a, b) => b.pts - a.pts || b.w - a.w || b.gd - a.gd || b.gw - a.gw);

        return `
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; margin-bottom:1.25rem; overflow-x:auto;">
            <div style="padding:0.65rem 1rem; font-weight:700; font-size:0.85rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
              <span>${grpKey}</span>
              <span style="font-size:0.72rem; color:#94a3b8; font-weight:400;">${qualifierNote}</span>
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:0.82rem; text-align:center;">
              <thead>
                <tr style="color:#94a3b8; font-size:0.72rem; border-bottom:1px solid rgba(255,255,255,0.05);">
                  <th style="padding:0.5rem; text-align:left;"># Contender</th>
                  <th style="padding:0.5rem 0.25rem;">MP</th>
                  <th style="padding:0.5rem 0.25rem;">W</th>
                  <th style="padding:0.5rem 0.25rem;">L</th>
                  <th style="padding:0.5rem 0.25rem;">GW</th>
                  <th style="padding:0.5rem 0.25rem;">GL</th>
                  <th style="padding:0.5rem 0.25rem;">GD</th>
                  <th style="padding:0.5rem 0.35rem; font-weight:700; color:#f8fafc;">PTS</th>
                </tr>
              </thead>
              <tbody>
                ${teams.map((t, idx) => {
                  const isQ = idx < qualifyingCount;
                  return `
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.03); background:${isQ ? 'rgba(59,130,246,0.05)' : 'transparent'};">
                      <td style="padding:0.55rem 0.5rem; text-align:left; font-weight:${isQ ? '700' : '400'};">
                        <span style="display:inline-block; width:16px; color:${isQ ? '#38bdf8' : 'inherit'};">${idx + 1}</span>
                        ${getFlagEmoji(t.name)} ${t.name} ${t.athlete ? `<span style="font-size:0.7rem; color:#94a3b8;">(${t.athlete})</span>` : ''}
                        ${isQ ? '<span style="display:inline-block; font-size:0.62rem; font-weight:800; padding:1px 4px; border-radius:3px; margin-left:4px; background:rgba(34,197,94,0.18); color:#4ade80; border:1px solid rgba(74,222,128,0.35);">Q</span>' : ''}
                      </td>
                      <td style="padding:0.55rem 0.25rem;">${t.mp}</td>
                      <td style="padding:0.55rem 0.25rem; color:#4ade80;">${t.w}</td>
                      <td style="padding:0.55rem 0.25rem; color:#f87171;">${t.l}</td>
                      <td style="padding:0.55rem 0.25rem;">${t.gw}</td>
                      <td style="padding:0.55rem 0.25rem;">${t.gl}</td>
                      <td style="padding:0.55rem 0.25rem; font-family:monospace; color:${t.gd > 0 ? '#4ade80' : t.gd < 0 ? '#f87171' : 'inherit'};">${t.gd > 0 ? '+' + t.gd : t.gd}</td>
                      <td style="padding:0.55rem 0.35rem; font-weight:700; color:#38bdf8;">${t.pts}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }).join('');

      return `
        <div>
          ${eventPickerHtml}
          ${tablesHtml}
        </div>
      `;
    },

    // --- Knockout Bracket Engine ---
    renderKnockoutBracket(matches) {
      if (!matches || matches.length === 0) {
        return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No knockout fixtures available for Soft Tennis.</div>`;
      }

      const parsedMatches = matches.map(m => parseMatch(m));
      const rawEvents = Array.from(new Set(parsedMatches.map(m => m.event).filter(Boolean)));
      const score = (ev) => {
        const s = (ev || '').toLowerCase();
        if (s.includes('singles')) return 1;
        if (s.includes('team')) return 2;
        if (s.includes('doubles')) return 3;
        return 10;
      };
      const eventsList = rawEvents.sort((a, b) => score(a) - score(b) || a.localeCompare(b));

      if (!activeSoftTennisBracketEvent || !eventsList.includes(activeSoftTennisBracketEvent)) {
        activeSoftTennisBracketEvent = (activeSoftTennisEventFilter && eventsList.includes(activeSoftTennisEventFilter))
          ? activeSoftTennisEventFilter
          : (eventsList[0] || '');
      }

      const eventMatches = parsedMatches.filter(m => m.event === activeSoftTennisBracketEvent);
      const findRound = (pattern) => eventMatches.find(m =>
        pattern.test(m.round || '') ||
        pattern.test(m.stage || '') ||
        pattern.test(m.match || '') ||
        pattern.test(m.phase || '') ||
        pattern.test(m.rawRound || '')
      );

      const renderSlot = (title, match, fallback, medalType = null) => {
        const t1 = (match && match.t1 && match.t1 !== 'TBD') ? match.t1 : (fallback ? fallback.t1 : 'TBD');
        const t2 = (match && match.t2 && match.t2 !== 'TBD') ? match.t2 : (fallback ? fallback.t2 : 'TBD');
        const ath1 = match ? (match.athlete1 || (match.player1 && match.player1.includes('(') ? match.player1.replace(/\s*\([^)]*\)/g, '').trim() : '')) : (fallback ? (fallback.ath1 || '') : '');
        const ath2 = match ? (match.athlete2 || (match.player2 && match.player2.includes('(') ? match.player2.replace(/\s*\([^)]*\)/g, '').trim() : '')) : (fallback ? (fallback.ath2 || '') : '');
        const s1 = match ? (match.s1 != null && match.s1 !== '' ? match.s1 : '-') : '-';
        const s2 = match ? (match.s2 != null && match.s2 !== '' ? match.s2 : '-') : '-';
        const isFin = match ? (match.isFinished || (match.status || '').toLowerCase().includes('finish') || (match.state || '').toLowerCase().includes('official')) : false;

        const cWinner = match && match.winner ? cleanTeamName(match.winner) : '';
        const t1Win = cWinner ? (cWinner === cleanTeamName(t1) || (ath1 && cWinner === cleanTeamName(ath1)) || cleanTeamName(t1).includes(cWinner) || (ath1 && cleanTeamName(ath1).includes(cWinner))) : (isFin && Number(s1) > Number(s2));
        const t2Win = cWinner ? (cWinner === cleanTeamName(t2) || (ath2 && cWinner === cleanTeamName(ath2)) || cleanTeamName(t2).includes(cWinner) || (ath2 && cleanTeamName(ath2).includes(cWinner))) : (isFin && Number(s2) > Number(s1));

        let badgeHtml = '';
        if (isFin) {
          badgeHtml = `<span style="font-size:0.62rem; font-weight:800; padding:1px 6px; border-radius:4px; background:rgba(74,222,128,0.18); color:#4ade80; border:1px solid rgba(74,222,128,0.35);">OFFICIAL</span>`;
        } else if (match && ((match.status || '').toLowerCase().includes('live') || (match.state || '').toLowerCase().includes('running'))) {
          badgeHtml = `<span style="font-size:0.62rem; font-weight:800; padding:1px 6px; border-radius:4px; background:rgba(239,68,68,0.22); color:#ef4444; border:1px solid rgba(239,68,68,0.4);">LIVE</span>`;
        } else {
          const dt = match ? (formatMatchDateTime(match.date, match.time) || match.status || 'Scheduled') : 'Scheduled';
          badgeHtml = `<span>${dt}</span>`;
        }

        return `
          <div class="bracket-match-card">
            <div class="bracket-match-header">
              <span>${title}</span>
              ${medalType ? `<span class="bracket-medal-badge medal-${medalType}">${medalType.toUpperCase()}</span>` : ''}
              ${badgeHtml}
            </div>
            <div class="bracket-team-row ${t1Win ? 'winner' : ''}">
              <div class="bracket-team-info">
                <span>${getFlagEmoji(t1)}</span>
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t1} ${ath1 ? `<small style="color:#94a3b8; font-size:0.68rem;">(${ath1})</small>` : ''}</span>
              </div>
              <span class="bracket-score">${s1}</span>
            </div>
            <div class="bracket-team-row ${t2Win ? 'winner' : ''}">
              <div class="bracket-team-info">
                <span>${getFlagEmoji(t2)}</span>
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${t2} ${ath2 ? `<small style="color:#94a3b8; font-size:0.68rem;">(${ath2})</small>` : ''}</span>
              </div>
              <span class="bracket-score">${s2}</span>
            </div>
            ${match && match.set_scores ? `
              <div style="font-size:0.65rem; color:#94a3b8; font-family:monospace; margin-top:4px; text-align:center; border-top:1px dashed rgba(255,255,255,0.06); padding-top:3px;">
                ${match.set_scores}
              </div>
            ` : ''}
          </div>
        `;
      };

      const renderByeSlot = (title, teamName, athleteName, note) => {
        return `
          <div class="bracket-match-card" style="border:1px dashed rgba(56,189,248,0.35); background:rgba(56,189,248,0.04);">
            <div class="bracket-match-header">
              <span>${title}</span>
              <span style="font-size:0.62rem; font-weight:800; padding:1px 6px; border-radius:4px; background:rgba(56,189,248,0.2); color:#38bdf8;">BYE</span>
            </div>
            <div class="bracket-team-row winner">
              <div class="bracket-team-info">
                <span>${getFlagEmoji(teamName)}</span>
                <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${teamName} ${athleteName ? `<small style="color:#94a3b8; font-size:0.68rem;">(${athleteName})</small>` : ''}</span>
              </div>
              <span class="bracket-score" style="font-size:0.65rem; color:#38bdf8; font-weight:700;">ADV</span>
            </div>
            <div class="bracket-team-row" style="opacity:0.4;">
              <div class="bracket-team-info">
                <span>—</span>
                <span style="font-style:italic; font-size:0.75rem;">${note || 'Direct Bye'}</span>
              </div>
              <span class="bracket-score">—</span>
            </div>
          </div>
        `;
      };

      const eventPickerHtml = `
        <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1.25rem; display:flex; align-items:center; gap:8px;">
          <span style="font-size:0.75rem; font-weight:700; color:#94a3b8; text-transform:uppercase;">Event:</span>
          <div class="event-selector-wrap">
            <select class="event-dropdown" onchange="window.setSoftTennisBracketEvent(this.value)">
              ${eventsList.map(ev => `<option value="${escapeAttr(ev)}" ${activeSoftTennisBracketEvent === ev ? 'selected' : ''}>${ev}</option>`).join('')}
            </select>
          </div>
        </div>
      `;

      const evName = activeSoftTennisBracketEvent || '';
      const evLower = evName.toLowerCase();
      const isWomen = evLower.includes("women");
      const isTeam = evLower.includes("team");
      const isSingles = evLower.includes("singles");
      const isDoubles = evLower.includes("doubles") || evLower.includes("mixed");

      const finalMatch = findRound(/gold|\bfinal\b/i) || eventMatches.find(m => /(?:gold\s*medal|\bfinal\b)/i.test(m.stage || m.round || m.match || '') && !/semi|quarter|first/i.test(m.stage || m.round || m.match || ''));
      const sf1 = findRound(/semifinal\s*1\b|sf\s*1\b/i);
      const sf2 = findRound(/semifinal\s*2\b|sf\s*2\b/i);

      let bracketRoundsHtml = '';
      let footnotes = ['* In Soft Tennis, both semifinal losers are awarded Bronze medals (no bronze playoff).'];

      if (isWomen && isSingles) {
        const qf1 = findRound(/quarterfinal\s*1\b|qf\s*1\b/i);
        const qf2 = findRound(/quarterfinal\s*2\b|qf\s*2\b/i);
        const qf3 = findRound(/quarterfinal\s*3\b|qf\s*3\b/i);
        const qf4 = findRound(/quarterfinal\s*4\b|qf\s*4\b/i);

        footnotes.unshift("* In Women's Singles, all 8 preliminary group winners advanced to the Quarterfinals (no BYEs).");

        bracketRoundsHtml = `
          <div class="bracket-round">
            <div class="bracket-round-header">Quarterfinals</div>
            ${renderSlot('QF 1', qf1, { t1: 'Japan', ath1: 'TEMMA Rena', t2: 'South Korea', ath2: 'LEE Sujin' })}
            ${renderSlot('QF 2', qf2, { t1: 'North Korea', ath1: 'RI So Hyang', t2: 'Thailand', ath2: 'ZIEGLER Alisha' })}
            ${renderSlot('QF 3', qf3, { t1: 'Chinese Taipei', ath1: 'CHIANG Min-yu', t2: 'Japan', ath2: 'MIYAMAE Kiho' })}
            ${renderSlot('QF 4', qf4, { t1: 'North Korea', ath1: 'RI Jin Mi', t2: 'South Korea', ath2: 'HWANG Jeongmi' })}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Semifinals (Bronze)</div>
            ${renderSlot('SF 1', sf1, { t1: 'Japan', ath1: 'TEMMA Rena', t2: 'North Korea', ath2: 'RI So Hyang' }, 'bronze')}
            ${renderSlot('SF 2', sf2, { t1: 'Japan', ath1: 'MIYAMAE Kiho', t2: 'North Korea', ath2: 'RI Jin Mi' }, 'bronze')}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Gold Medal Match</div>
            ${renderSlot('Gold Medal', finalMatch, { t1: 'Japan', ath1: 'TEMMA Rena', t2: 'North Korea', ath2: 'RI Jin Mi' }, 'gold')}
          </div>
        `;
      } else if (isWomen && isTeam) {
        footnotes.unshift("* In Women's Team, the top 2 teams from Group A and Group B advanced directly to the Semifinals (no Quarterfinals).");

        bracketRoundsHtml = `
          <div class="bracket-round">
            <div class="bracket-round-header">Semifinals (Bronze)</div>
            ${renderSlot('SF 1 (A1 vs B2)', sf1, { t1: 'Japan', t2: 'Philippines' }, 'bronze')}
            ${renderSlot('SF 2 (B1 vs A2)', sf2, { t1: 'Chinese Taipei', t2: 'South Korea' }, 'bronze')}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Gold Medal Match</div>
            ${renderSlot('Gold Medal', finalMatch, { t1: 'Japan', t2: 'Chinese Taipei' }, 'gold')}
          </div>
        `;
      } else if (!isWomen && isSingles) {
        const qf2 = findRound(/quarterfinal\s*2\b|qf\s*2\b/i);
        const qf3 = findRound(/quarterfinal\s*3\b|qf\s*3\b/i);
        const qf4 = findRound(/quarterfinal\s*4\b|qf\s*4\b/i);

        footnotes.unshift("* In Men's Singles, Japan's Toshiki Uematsu (Group A Winner / #1 Seed) received a direct BYE in QF 1 into Semifinal 1.");

        bracketRoundsHtml = `
          <div class="bracket-round">
            <div class="bracket-round-header">Quarterfinals</div>
            ${renderByeSlot('QF 1 • Direct BYE', 'Japan', 'UEMATSU Toshiki', 'Seed 1 (Direct to SF1)')}
            ${renderSlot('QF 2', qf2, { t1: 'South Korea', ath1: 'LEE Haneul', t2: 'Chinese Taipei', ath2: 'CHEN Po-yi' })}
            ${renderSlot('QF 3', qf3, { t1: 'India', ath1: 'MEENA Jay', t2: 'Philippines', ath2: 'NUGUIT Sherwin' })}
            ${renderSlot('QF 4', qf4, { t1: 'Japan', ath1: 'KUROSAKA Takuya', t2: 'Chinese Taipei', ath2: 'CHANG Yu-sung' })}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Semifinals (Bronze)</div>
            ${renderSlot('SF 1', sf1, { t1: 'Japan', ath1: 'UEMATSU Toshiki', t2: 'Chinese Taipei', ath2: 'CHEN Po-yi' }, 'bronze')}
            ${renderSlot('SF 2', sf2, { t1: 'India', ath1: 'MEENA Jay', t2: 'Japan', ath2: 'KUROSAKA Takuya' }, 'bronze')}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Gold Medal Match</div>
            ${renderSlot('Gold Medal', finalMatch, { t1: 'Winner SF 1', t2: 'Winner SF 2' }, 'gold')}
          </div>
        `;
      } else if (!isWomen && isTeam) {
        const qf2 = findRound(/quarterfinal\s*2\b|qf\s*2\b/i);
        const qf3 = findRound(/quarterfinal\s*3\b|qf\s*3\b/i);

        footnotes.unshift("* In Men's Team, group winners Japan (Group A) and Chinese Taipei (Group C) received direct BYEs into the Semifinals.");

        bracketRoundsHtml = `
          <div class="bracket-round">
            <div class="bracket-round-header">Quarterfinals</div>
            ${renderByeSlot('QF 1 • Direct BYE', 'Japan', '', 'Group A Winner (Direct to SF1)')}
            ${renderSlot('QF 2', qf2, { t1: 'India', t2: 'Indonesia' })}
            ${renderSlot('QF 3', qf3, { t1: 'South Korea', t2: 'Philippines' })}
            ${renderByeSlot('QF 4 • Direct BYE', 'Chinese Taipei', '', 'Group C Winner (Direct to SF2)')}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Semifinals (Bronze)</div>
            ${renderSlot('SF 1', sf1, { t1: 'Japan', t2: 'Indonesia' }, 'bronze')}
            ${renderSlot('SF 2', sf2, { t1: 'Chinese Taipei', t2: 'South Korea' }, 'bronze')}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Gold Medal Match</div>
            ${renderSlot('Gold Medal', finalMatch, { t1: 'Japan', t2: 'Chinese Taipei' }, 'gold')}
          </div>
        `;
      } else if (isDoubles) {
        // Mixed Doubles
        const r16_2 = findRound(/first\s*round\s*match\s*2\b|r16\s*match\s*2\b/i);
        const r16_3 = findRound(/first\s*round\s*match\s*3\b|r16\s*match\s*3\b/i);
        const r16_6 = findRound(/first\s*round\s*match\s*6\b|r16\s*match\s*6\b/i);
        const r16_7 = findRound(/first\s*round\s*match\s*7\b|r16\s*match\s*7\b/i);

        const qf1 = findRound(/quarterfinal\s*1\b|qf\s*1\b/i);
        const qf2 = findRound(/quarterfinal\s*2\b|qf\s*2\b/i);
        const qf3 = findRound(/quarterfinal\s*3\b|qf\s*3\b/i);
        const qf4 = findRound(/quarterfinal\s*4\b|qf\s*4\b/i);

        footnotes.unshift("* In Mixed Doubles, 12 teams qualified from the preliminary groups (top 2 from Groups A–F). The top 4 seeded group winners received direct BYEs into the Quarterfinals, while the remaining 8 teams competed in the First Round for the remaining 4 QF berths.");

        bracketRoundsHtml = `
          <div class="bracket-round">
            <div class="bracket-round-header">First Round</div>
            ${renderByeSlot('First Round Match 1 • Direct BYE', 'Japan', 'UEMATSU Toshiki / TEMMA Rena', 'Group A Winner • Seed 1 (Direct to QF1)')}
            ${renderSlot('First Round Match 2', r16_2, { t1: 'Nepal', ath1: 'BHANDARI Kamal / CHAUDHARY Georgia', t2: 'Indonesia', ath2: 'SANGER Fernando / ARASY Siti Nur' })}
            ${renderSlot('First Round Match 3', r16_3, { t1: 'South Korea', ath1: 'PARK Jaekyu / KIM Yeon-hwa', t2: 'Philippines', ath2: 'MANALAC Noelle / NUGUIT Samuel' })}
            ${renderByeSlot('First Round Match 4 • Direct BYE', 'Chinese Taipei', 'LIN Wei-chieh / CHIANG Min-yu', 'Group C Winner • Seed (Direct to QF2)')}
            ${renderByeSlot('First Round Match 5 • Direct BYE', 'South Korea', 'KIM Hyunsoo / LEE Sujin', 'Group D Winner • Seed (Direct to QF3)')}
            ${renderSlot('First Round Match 6', r16_6, { t1: 'Indonesia', ath1: 'LALUYAN Rizky / NAFIIAH Allif', t2: 'Japan', ath2: 'MARUYAMA Kaito / MAEDA Rio' })}
            ${renderSlot('First Round Match 7', r16_7, { t1: 'India', ath1: 'TIWARI Aadhya / MEENA Jay', t2: 'Philippines', ath2: 'SANOSA Christy / NUGUIT Sherwin Ray' })}
            ${renderByeSlot('First Round Match 8 • Direct BYE', 'Chinese Taipei', 'YU Kai-wen / HUANG Shih-yuan', 'Group F Winner • Seed (Direct to QF4)')}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Quarterfinals</div>
            ${renderSlot('QF 1', qf1, { t1: 'Japan', ath1: 'UEMATSU Toshiki / TEMMA Rena', t2: 'Indonesia', ath2: 'SANGER Fernando / ARASY Siti Nur' })}
            ${renderSlot('QF 2', qf2, { t1: 'South Korea', ath1: 'PARK Jaekyu / KIM Yeon-hwa', t2: 'Chinese Taipei', ath2: 'LIN Wei-chieh / CHIANG Min-yu' })}
            ${renderSlot('QF 3', qf3, { t1: 'South Korea', ath1: 'KIM Hyunsoo / LEE Sujin', t2: 'Japan', ath2: 'MARUYAMA Kaito / MAEDA Rio' })}
            ${renderSlot('QF 4', qf4, { t1: 'Philippines', ath1: 'SANOSA Christy / NUGUIT Sherwin Ray', t2: 'Chinese Taipei', ath2: 'YU Kai-wen / HUANG Shih-yuan' })}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Semifinals (Bronze)</div>
            ${renderSlot('SF 1', sf1, { t1: 'Japan', ath1: 'UEMATSU Toshiki / TEMMA Rena', t2: 'South Korea', ath2: 'PARK Jaekyu / KIM Yeon-hwa' }, 'bronze')}
            ${renderSlot('SF 2', sf2, { t1: 'Japan', ath1: 'MARUYAMA Kaito / MAEDA Rio', t2: 'Chinese Taipei', ath2: 'YU Kai-wen / HUANG Shih-yuan' }, 'bronze')}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Gold Medal Match</div>
            ${renderSlot('Gold Medal', finalMatch, { t1: 'Japan', ath1: 'UEMATSU Toshiki / TEMMA Rena', t2: 'Chinese Taipei', ath2: 'YU Kai-wen / HUANG Shih-yuan' }, 'gold')}
          </div>
        `;
      } else {
        const qfMatches = eventMatches.filter(m => /quarter|qf/i.test(m.stage || m.round || ''));
        const getGame = (list, num) => list.find(m => new RegExp(`match\\s*${num}|qf\\s*${num}|sf\\s*${num}`, 'i').test(m.stage || m.round)) || list[num - 1];

        bracketRoundsHtml = `
          ${qfMatches.length > 0 ? `
            <div class="bracket-round">
              <div class="bracket-round-header">Quarterfinals</div>
              ${[0, 1, 2, 3].map(i => renderSlot(`QF ${i + 1}`, getGame(qfMatches, i + 1), { t1: 'TBD', t2: 'TBD' })).join('')}
            </div>
          ` : ''}
          <div class="bracket-round">
            <div class="bracket-round-header">Semifinals (Bronze)</div>
            ${renderSlot('SF 1', getGame(sfMatches, 1), { t1: 'TBD', t2: 'TBD' }, 'bronze')}
            ${renderSlot('SF 2', getGame(sfMatches, 2), { t1: 'TBD', t2: 'TBD' }, 'bronze')}
          </div>
          <div class="bracket-round">
            <div class="bracket-round-header">Gold Medal Match</div>
            ${renderSlot('Gold Medal', finalMatch, { t1: 'Winner SF 1', t2: 'Winner SF 2' }, 'gold')}
          </div>
        `;
      }

      return `
        <div>
          ${eventPickerHtml}
          <div class="bracket-wrapper">
            <div class="bracket-container">
              ${bracketRoundsHtml}
            </div>
          </div>
          <div style="text-align:center; font-size:0.72rem; color:#94a3b8; margin-top:0.75rem; display:flex; flex-direction:column; gap:3px;">
            ${footnotes.map(fn => `<span>${fn}</span>`).join('')}
          </div>
        </div>
      `;
    },

    // --- Medal Analytics Engine (Predictions & Standings) ---
    extractMedalAnalytics(menMatches, womenMatches, menPreds, womenPreds, mixedMatches, mixedPreds, currentGender) {
      const predEvents = (window.appData && Array.isArray(window.appData.predictionEvents))
        ? window.appData.predictionEvents : [];

      const getProb = (obj, keys) => {
        if (!obj) return 0;
        for (const k of keys) { if (obj[k] != null && obj[k] !== '') return obj[k]; }
        return 0;
      };

      const parseP = (v) => {
        if (v == null) return 0;
        if (typeof v === 'number') return v;
        return parseFloat(('' + v).replace('%', '')) || 0;
      };

      const projectPodium = (list) => {
        if (!Array.isArray(list) || list.length === 0) return [];
        const sorted = [...list].sort((a, b) => {
          const gA = parseP(getProb(a, ['gold', 'gold_prob', 'p_gold']));
          const gB = parseP(getProb(b, ['gold', 'gold_prob', 'p_gold']));
          if (gB !== gA) return gB - gA;
          const sA = parseP(getProb(a, ['silver', 'silver_prob', 'p_silver']));
          const sB = parseP(getProb(b, ['silver', 'silver_prob', 'p_silver']));
          if (sB !== sA) return sB - sA;
          const bA = parseP(getProb(a, ['bronze', 'bronze_prob', 'p_bronze']));
          const bB = parseP(getProb(b, ['bronze', 'bronze_prob', 'p_bronze']));
          return bB - bA;
        });
        const res = [];
        if (sorted[0]) res.push({ medal: 'gold', item: sorted[0] });
        if (sorted[1]) res.push({ medal: 'silver', item: sorted[1] });
        if (sorted[2]) res.push({ medal: 'bronze', item: sorted[2] });
        if (sorted[3]) res.push({ medal: 'bronze', item: sorted[3] });
        return res;
      };

      const formatC = (item, isIndiv) => {
        if (!item) return null;
        let rawName = item.team || item.country || item.name || '';
        if (rawName.includes('(')) {
          const match = rawName.match(/\(([^)]+)\)/);
          if (match && match[1]) rawName = match[1].trim();
        }
        const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(rawName) : '🎾';
        const displayName = typeof formatTeamDisplayName === 'function' ? formatTeamDisplayName(rawName.replace(/\(host\)/gi, '').trim()) : rawName.replace(/\(host\)/gi, '').trim();
        const athlete = isIndiv ? (item.athlete || item.player || '') : '';
        const cleaned = typeof cleanTeamName === 'function' ? cleanTeamName(rawName) : rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return { raw: rawName, cleaned, name: displayName, flag, athlete, isHost: false, goldProb: item.gold || '', silverProb: item.silver || '', bronzeProb: item.bronze || '' };
      };

      const resolveActuals = (eventName, allMatches) => {
        const targetClean = clean(eventName);
        const matches = allMatches
          .map(m => parseMatch(m))
          .filter(m => clean(m.event) === targetClean);

        const finalMatch = matches.find(m => {
          const r = (m.round || m.stage || m.match || '').toLowerCase();
          return /(?:gold|\bfinal\b)/i.test(r) && !/semi|quarter|bronze|repechage/i.test(r);
        });

        let gold = null, silver = null, bronze = null;
        const bronzes = [];
        let status = 'Upcoming', matchInfo = '', goldScoreInfo = '', bronzeScoreInfo = '';

        if (finalMatch && finalMatch.isFinished) {
          status = 'Finished';
          const winner = finalMatch.winner || finalMatch.t1;
          const isT1Winner = clean(winner) === clean(finalMatch.t1) || clean(winner) === clean(finalMatch.team1) || clean(winner) === clean(finalMatch.athlete1) || clean(finalMatch.t1).includes(clean(winner));
          const winTeam = isT1Winner ? (finalMatch.team1 || finalMatch.t1) : (finalMatch.team2 || finalMatch.t2);
          const loseTeam = isT1Winner ? (finalMatch.team2 || finalMatch.t2) : (finalMatch.team1 || finalMatch.t1);
          const gAthleteRaw = isT1Winner ? finalMatch.athlete1 : finalMatch.athlete2;
          const sAthleteRaw = isT1Winner ? finalMatch.athlete2 : finalMatch.athlete1;

          gold = formatC({ team: winTeam, athlete: gAthleteRaw }, !eventName.toLowerCase().includes('team'));
          silver = formatC({ team: loseTeam, athlete: sAthleteRaw }, !eventName.toLowerCase().includes('team'));
          const s = finalMatch.score || `${finalMatch.s1 || '-'} - ${finalMatch.s2 || '-'}`;
          goldScoreInfo = `Final: ${finalMatch.t1} ${s} ${finalMatch.t2} (Official)`;
          matchInfo = goldScoreInfo;
        } else if (finalMatch) {
          const s = `${finalMatch.date || ''} ${finalMatch.time || ''}`.trim();
          goldScoreInfo = `Final: ${finalMatch.t1} vs ${finalMatch.t2}${s ? ' — ' + s : ''}`;
          matchInfo = goldScoreInfo;
        }

        // Semifinal losers receive Bronze in Soft Tennis
        const semiMatches = matches.filter(m => {
          const r = (m.round || m.stage || '').toLowerCase();
          return /semi/i.test(r);
        });
        semiMatches.forEach((sm, sIdx) => {
          if (sm.isFinished) {
            const sWinner = sm.winner || sm.t1;
            const isW1 = clean(sWinner) === clean(sm.t1) || clean(sWinner) === clean(sm.team1) || clean(sWinner) === clean(sm.athlete1) || clean(sm.t1).includes(clean(sWinner));
            const sLoserTeam = isW1 ? (sm.team2 || sm.t2) : (sm.team1 || sm.t1);
            const lAthlete = isW1 ? sm.athlete2 : sm.athlete1;
            const bObj = formatC({ team: sLoserTeam, athlete: lAthlete }, !eventName.toLowerCase().includes('team'));
            bronzes.push(bObj);
            if (!bronze) bronze = bObj;
            const line = `Bronze (SF ${sIdx + 1}): ${sLoserTeam}${lAthlete ? ` (${lAthlete})` : ''}`;
            bronzeScoreInfo += (bronzeScoreInfo ? ' • ' : '') + line;
          }
        });

        if (bronzeScoreInfo) {
          matchInfo += (matchInfo ? ' • ' : '') + bronzeScoreInfo;
        }

        return { gold, silver, bronze, bronzes, status, matchInfo, goldScoreInfo, bronzeScoreInfo };
      };

      const curGen = String(currentGender || (typeof window !== 'undefined' && window.currentGender) || 'men').toLowerCase();
      const allMatchesBoth = [...(menMatches || []), ...(womenMatches || []), ...(mixedMatches || [])];
      const medalEvents = [];

      const allEventDefs = [
        { id: 'tst_men_singles',   event: "Men's Singles",   gender: 'men',   icon: '🎾', shortName: "Men's Singles", isTeam: false },
        { id: 'tst_men_team',      event: "Men's Team",      gender: 'men',   icon: '🎾', shortName: "Men's Team", isTeam: true },
        { id: 'tst_mixed_doubles', event: "Mixed Doubles",   gender: 'mixed', icon: '🎾', shortName: "Mixed Doubles", isTeam: false },
        { id: 'tst_women_singles', event: "Women's Singles", gender: 'women', icon: '🎾', shortName: "Women's Singles", isTeam: false },
        { id: 'tst_women_team',    event: "Women's Team",    gender: 'women', icon: '🎾', shortName: "Women's Team", isTeam: true }
      ];

      const tstEventDefs = allEventDefs.filter(d => (curGen === 'all' ? true : d.gender === curGen));

      tstEventDefs.forEach(def => {
        let predEvent = predEvents.find(e => e.id === def.id || clean(e.event || e.name || '') === clean(def.event));
        let rankings = predEvent ? (predEvent.rankings || []) : [];
        if (!rankings || rankings.length === 0) {
          const pool = def.gender === 'women'
            ? (womenPreds || [])
            : (def.gender === 'mixed' ? (mixedPreds || window.appData?.mixedPredictions || menPreds || []) : (menPreds || []));
          if (Array.isArray(pool)) {
            rankings = pool.filter(p => clean(p.event || '') === clean(def.event));
          }
        }
        const podium = projectPodium(rankings);
        const projGold = formatC(podium[0]?.item, !def.isTeam);
        const projSilver = formatC(podium[1]?.item, !def.isTeam);
        const projBronze1 = formatC(podium[2]?.item, !def.isTeam);
        const projBronze2 = formatC(podium[3]?.item, !def.isTeam);
        const projBronzes = [projBronze1, projBronze2].filter(Boolean);
        const projBronze = projBronze1;

        const matchPool = def.gender === 'women'
          ? (womenMatches || [])
          : (def.gender === 'mixed' ? (mixedMatches || window.appData?.mixedMatches || allMatchesBoth || []) : (menMatches || []));
        const { gold: actualGold, silver: actualSilver, bronze: actualBronze, bronzes: actualBronzes, status, matchInfo, goldScoreInfo, bronzeScoreInfo } = resolveActuals(def.event, matchPool);

        medalEvents.push({
          id: def.id,
          name: def.event,
          shortName: def.shortName,
          icon: def.icon,
          gender: def.gender,
          type: def.isTeam ? 'team' : 'individual',
          status,
          matchInfo,
          goldScoreInfo,
          bronzeScoreInfo,
          rankings,
          projected: { gold: projGold, silver: projSilver, bronze: projBronze, bronzes: projBronzes },
          actual: { gold: actualGold, silver: actualSilver, bronze: actualBronze, bronzes: actualBronzes }
        });
      });

      // Build medal tables & KPI
      const actualTableMap = {};
      const projectedTableMap = {};
      const medalWeight = { gold: 1, silver: 2, bronze: 3 };
      let totalDecidedMedals = 0, totalExactHits = 0, totalPodiumHits = 0;
      let totalDecidedGold = 0, totalGoldHits = 0;

      const recordMedal = (tableMap, item, type) => {
        if (!item) return;
        const cln = item.cleaned;
        if (!cln) return;
        if (!tableMap[cln]) tableMap[cln] = { name: item.name, flag: item.flag || '🎾', isHost: false, gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
        tableMap[cln][type] += 1;
        tableMap[cln].total += 1;
        if (item.athlete) {
          const icon = type === 'gold' ? '🥇' : type === 'silver' ? '🥈' : '🥉';
          if (!tableMap[cln].athletes.some(a => a.athlete === item.athlete && a.medalType === type)) {
            tableMap[cln].athletes.push({ athlete: item.athlete, medal: icon, medalType: type });
            tableMap[cln].athletes.sort((a, b) => (medalWeight[a.medalType] || 99) - (medalWeight[b.medalType] || 99));
          }
        }
      };

      medalEvents.forEach(ev => {
        recordMedal(projectedTableMap, ev.projected.gold, 'gold');
        recordMedal(projectedTableMap, ev.projected.silver, 'silver');
        if (Array.isArray(ev.projected.bronzes) && ev.projected.bronzes.length > 0) {
          ev.projected.bronzes.forEach(b => recordMedal(projectedTableMap, b, 'bronze'));
        } else {
          recordMedal(projectedTableMap, ev.projected.bronze, 'bronze');
        }

        recordMedal(actualTableMap, ev.actual.gold, 'gold');
        recordMedal(actualTableMap, ev.actual.silver, 'silver');
        if (Array.isArray(ev.actual.bronzes) && ev.actual.bronzes.length > 0) {
          ev.actual.bronzes.forEach(b => recordMedal(actualTableMap, b, 'bronze'));
        } else if (ev.actual.bronze) {
          recordMedal(actualTableMap, ev.actual.bronze, 'bronze');
        }

        const projBronzesCleaned = Array.isArray(ev.projected.bronzes) ? ev.projected.bronzes.map(b => b?.cleaned) : [ev.projected.bronze?.cleaned];
        const projTop3 = [ev.projected.gold?.cleaned, ev.projected.silver?.cleaned, ...projBronzesCleaned].filter(Boolean);
        let evDecided = 0, evExact = 0, evPodium = 0;

        if (ev.actual.gold) {
          evDecided++; totalDecidedMedals++; totalDecidedGold++;
          if (ev.actual.gold.cleaned === ev.projected.gold?.cleaned) { evExact++; totalExactHits++; totalGoldHits++; }
          if (projTop3.includes(ev.actual.gold.cleaned)) { evPodium++; totalPodiumHits++; }
        }
        if (ev.actual.silver) {
          evDecided++; totalDecidedMedals++;
          if (ev.actual.silver.cleaned === ev.projected.silver?.cleaned) { evExact++; totalExactHits++; }
          if (projTop3.includes(ev.actual.silver.cleaned)) { evPodium++; totalPodiumHits++; }
        }
        let bronzeHitVal = null;
        if (Array.isArray(ev.actual.bronzes) && ev.actual.bronzes.length > 0) {
          bronzeHitVal = false;
          ev.actual.bronzes.forEach(b => {
            evDecided++; totalDecidedMedals++;
            const hit = (Array.isArray(ev.projected.bronzes) && ev.projected.bronzes.some(pb => pb.cleaned === b.cleaned)) || (ev.projected.bronze?.cleaned === b.cleaned);
            if (hit) { evExact++; totalExactHits++; bronzeHitVal = true; }
            if (projTop3.includes(b.cleaned)) { evPodium++; totalPodiumHits++; }
          });
        } else if (ev.actual.bronze) {
          evDecided++; totalDecidedMedals++;
          const hit = (Array.isArray(ev.projected.bronzes) && ev.projected.bronzes.some(pb => pb.cleaned === ev.actual.bronze.cleaned)) || (ev.projected.bronze?.cleaned === ev.actual.bronze.cleaned);
          if (hit) { evExact++; totalExactHits++; bronzeHitVal = true; } else { bronzeHitVal = false; }
          if (projTop3.includes(ev.actual.bronze.cleaned)) { evPodium++; totalPodiumHits++; }
        }

        ev.evaluation = {
          decidedCount: evDecided, exactHits: evExact, podiumHits: evPodium,
          goldHit: ev.actual.gold ? ev.actual.gold.cleaned === ev.projected.gold?.cleaned : null,
          silverHit: ev.actual.silver ? ev.actual.silver.cleaned === ev.projected.silver?.cleaned : null,
          bronzeHit: bronzeHitVal,
          accuracyPct: evDecided > 0 ? Math.round((evExact / evDecided) * 100) : null,
          podiumRatePct: evDecided > 0 ? Math.round((evPodium / evDecided) * 100) : null
        };

        const matchPool = ev.gender === 'women'
          ? womenMatches
          : (ev.gender === 'mixed' ? (mixedMatches || window.appData?.mixedMatches || allMatchesBoth) : menMatches);
        const allProjPicks = [ev.projected.gold, ev.projected.silver, ...(Array.isArray(ev.projected.bronzes) ? ev.projected.bronzes : [ev.projected.bronze])];
        allProjPicks.forEach(pick => {
          if (!pick) return;
          if (typeof resolveActualFinish === 'function') {
            pick.actualFinish = resolveActualFinish(pick, ev, matchPool, null);
          }
        });
        if (Array.isArray(ev.rankings)) {
          ev.rankings.forEach(c => {
            const cObj = formatC(c, !ev.name.toLowerCase().includes('team'));
            if (typeof resolveActualFinish === 'function') {
              c.actualFinish = resolveActualFinish(cObj, ev, matchPool, null);
            }
          });
        }
      });

      const totalMedalsInSport = medalEvents.reduce((acc, ev) => {
        const bCount = (Array.isArray(ev.actual?.bronzes) && ev.actual.bronzes.length > 0)
          ? ev.actual.bronzes.length
          : 2;
        return acc + 2 + bCount;
      }, 0);
      const actualTable = Object.values(actualTableMap).sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze);
      const projectedTable = Object.values(projectedTableMap).sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze);

      const allNations = new Set([...Object.keys(actualTableMap), ...Object.keys(projectedTableMap)]);
      const comparisonTable = Array.from(allNations).map(cln => {
        const act = actualTableMap[cln] || { name: '', gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
        const prj = projectedTableMap[cln] || { name: '', gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
        const name = act.name || prj.name || cln;
        const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(name) : '🎾';
        const diffTotal = act.total - prj.total;
        let status = '⚪ Scheduled';
        if (totalDecidedMedals > 0) {
          if (act.total > 0 && act.total === prj.total && act.gold === prj.gold && act.silver === prj.silver && act.bronze === prj.bronze) status = '🎯 Exact Hit';
          else if (diffTotal > 0) status = `🟢 Over (+${diffTotal})`;
          else if (act.total > 0 && diffTotal < 0) status = `🔻 Under (${diffTotal})`;
          else if (act.total > 0) status = '🟡 Position Shift';
          else status = '⏳ Pending / Awaiting';
        }
        return { cleaned: cln, name, flag, isHost: false, actual: act, projected: prj, diffTotal, diffGold: act.gold - prj.gold, status, actualAthletes: act.athletes || [], projectedAthletes: prj.athletes || [] };
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
    },

    // --- Calibration View (Soft Tennis) ---
    renderCalibration(container, predictions, matches) {
      const predEvents = (window.appData && Array.isArray(window.appData.predictionEvents))
        ? window.appData.predictionEvents : [];

      const allMatchesRaw = [
        ...(window.appData?.menMatches || []),
        ...(window.appData?.womenMatches || []),
        ...(window.appData?.mixedMatches || []),
        ...(Array.isArray(matches) ? matches : [])
      ];
      const seenIds = new Set();
      const allMatches = [];
      allMatchesRaw.forEach(m => {
        const id = m.id || `${m.event}_${m.round}_${m.match}_${m.team1}_${m.team2}`;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          allMatches.push(parseMatch(m));
        }
      });

      const finishedMatches = allMatches.filter(m => m.isFinished);
      const gender = (typeof currentGender !== 'undefined' ? currentGender : window.currentGender) || 'men';
      let eventsAvailable = [];
      if (gender === 'men') {
        eventsAvailable = ["Men's Singles", "Men's Team"];
      } else if (gender === 'women') {
        eventsAvailable = ["Women's Singles", "Women's Team"];
      } else if (gender === 'mixed') {
        eventsAvailable = ["Mixed Doubles"];
      } else {
        eventsAvailable = ["Men's Singles", "Men's Team"];
      }

      if (!activeSoftTennisCalibrationEvent || activeSoftTennisCalibrationEvent === 'all' || !eventsAvailable.includes(activeSoftTennisCalibrationEvent)) {
        activeSoftTennisCalibrationEvent = eventsAvailable[0] || '';
      }

      const eventRankMap = {};
      predEvents.forEach(ev => {
        const evName = clean(ev.event || ev.name || '');
        const rMap = {};
        (ev.rankings || []).forEach((c, idx) => {
          const tClean = clean(c.team || c.country || '');
          const aClean = clean(c.athlete || c.player || '');
          if (tClean) rMap[tClean] = idx + 1;
          if (aClean) rMap[aClean] = idx + 1;
        });
        eventRankMap[evName] = rMap;
      });

      let evalMatches = finishedMatches.filter(m => clean(m.event) === clean(activeSoftTennisCalibrationEvent));

      let evaluatedMatches = 0;
      let correctFavorites = 0;
      const upsetLogs = [];

      evalMatches.forEach(m => {
        const evClean = clean(m.event || '');
        const rMap = eventRankMap[evClean] || {};

        const t1Clean = clean(m.team1 || m.t1 || '');
        const t2Clean = clean(m.team2 || m.t2 || '');
        const a1Clean = clean(m.athlete1 || '');
        const a2Clean = clean(m.athlete2 || '');

        const r1 = rMap[a1Clean] || rMap[t1Clean] || 99;
        const r2 = rMap[a2Clean] || rMap[t2Clean] || 99;

        if (r1 !== r2) {
          evaluatedMatches++;
          const favTeam = r1 < r2 ? (m.team1 || m.t1) : (m.team2 || m.t2);
          const dogTeam = r1 < r2 ? (m.team2 || m.t2) : (m.team1 || m.t1);
          const favAth = r1 < r2 ? m.athlete1 : m.athlete2;
          const dogAth = r1 < r2 ? m.athlete2 : m.athlete1;
          const favRank = Math.min(r1, r2);
          const dogRank = Math.max(r1, r2);

          let rawWinner = m.winner || '';
          if (rawWinner.includes('(')) {
            const match = rawWinner.match(/\(([^)]+)\)/);
            if (match && match[1]) rawWinner = match[1];
          }
          const wClean = clean(rawWinner);

          const favWon = wClean && (wClean === clean(favTeam) || (favAth && wClean === clean(favAth)) || clean(favTeam).includes(wClean));

          if (favWon) {
            correctFavorites++;
          } else {
            upsetLogs.push({
              event: m.event,
              round: m.stage || m.round,
              score: m.score || `${m.s1 || ''}-${m.s2 || ''}`,
              winner: dogTeam,
              winnerAth: dogAth,
              loser: favTeam,
              loserAth: favAth,
              favRank,
              dogRank
            });
          }
        }
      });

      const favoriteAccPct = evaluatedMatches > 0 ? Math.round((correctFavorites / evaluatedMatches) * 100) : null;
      const favAccDisplay = favoriteAccPct != null ? `${favoriteAccPct}%` : '--%';
      const favAccColor = favoriteAccPct != null ? (favoriteAccPct >= 70 ? '#4ade80' : favoriteAccPct >= 50 ? '#facc15' : '#f87171') : '#94a3b8';

      const curGen = String(gender).toLowerCase();
      const analytics = SOFT_TENNIS_ENGINE.extractMedalAnalytics(
        window.appData?.menMatches,
        window.appData?.womenMatches,
        window.appData?.menPredictions,
        window.appData?.womenPredictions,
        window.appData?.mixedMatches,
        window.appData?.mixedPredictions,
        curGen
      );
      const kpi = analytics.kpi;
      const medalAccPct = kpi.accuracyPct;
      const medalAccDisplay = medalAccPct != null ? `${medalAccPct}%` : '--%';
      const medalAccColor = medalAccPct != null ? (medalAccPct >= 60 ? '#4ade80' : medalAccPct >= 30 ? '#facc15' : '#f87171') : '#94a3b8';

      const eventPickerHtml = `
        <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1.25rem; display:flex; align-items:center; gap:8px;">
          <span style="font-size:0.75rem; font-weight:700; color:#94a3b8; text-transform:uppercase;">Event:</span>
          <div class="event-selector-wrap">
            <select class="event-dropdown" onchange="window.setSoftTennisCalibrationEvent(this.value)">
              ${eventsAvailable.map(ev => `<option value="${escapeAttr(ev)}" ${activeSoftTennisCalibrationEvent === ev ? 'selected' : ''}>${ev}</option>`).join('')}
            </select>
          </div>
        </div>
      `;

      container.innerHTML = `
        ${eventPickerHtml}

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; margin-bottom:1.25rem;">
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.85rem; text-align:center;">
            <div style="font-size:0.68rem; color:#94a3b8; font-weight:700; text-transform:uppercase;">Medal Accuracy</div>
            <div style="font-size:1.4rem; font-weight:800; color:${medalAccColor}; margin-top:2px;">${medalAccDisplay}</div>
            <div style="font-size:0.68rem; color:#64748b;">${kpi.exactHits || 0} / ${kpi.decidedMedals || 0} Medals Exact</div>
          </div>
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.85rem; text-align:center;">
            <div style="font-size:0.68rem; color:#94a3b8; font-weight:700; text-transform:uppercase;">Favorite Accuracy</div>
            <div style="font-size:1.4rem; font-weight:800; color:${favAccColor}; margin-top:2px;">${favAccDisplay}</div>
            <div style="font-size:0.68rem; color:#64748b;">${correctFavorites} / ${evaluatedMatches} Matches Won</div>
          </div>
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.85rem; text-align:center;">
            <div style="font-size:0.68rem; color:#94a3b8; font-weight:700; text-transform:uppercase;">Upsets Recorded</div>
            <div style="font-size:1.4rem; font-weight:800; color:${upsetLogs.length > 0 ? '#f87171' : '#4ade80'}; margin-top:2px;">${upsetLogs.length}</div>
            <div style="font-size:0.68rem; color:#64748b;">Rank Discrepancies</div>
          </div>
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.85rem; text-align:center;">
            <div style="font-size:0.68rem; color:#94a3b8; font-weight:700; text-transform:uppercase;">Finished Matches</div>
            <div style="font-size:1.4rem; font-weight:800; color:#38bdf8; margin-top:2px;">${evalMatches.length}</div>
            <div style="font-size:0.68rem; color:#64748b;">In ${activeSoftTennisCalibrationEvent}</div>
          </div>
        </div>

        ${upsetLogs.length > 0 ? `
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
            <div style="font-size:0.85rem; font-weight:700; margin-bottom:0.75rem; color:#f87171; display:flex; justify-content:space-between; align-items:center;">
              <span>⚡ Soft Tennis Upset Tracker</span>
              <span style="font-size:0.72rem; color:#94a3b8; font-weight:400;">Pre-Tournament Favorites vs Official Match Results</span>
            </div>
            ${upsetLogs.map(u => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.82rem; flex-wrap:wrap; gap:8px;">
                <div>
                  <div style="display:flex; align-items:center; gap:6px;">
                    <span style="font-size:0.68rem; font-weight:700; background:rgba(255,255,255,0.06); padding:2px 6px; border-radius:3px; color:#38bdf8;">${u.event}</span>
                    <span style="font-size:0.68rem; color:#64748b;">${u.round}</span>
                  </div>
                  <div style="margin-top:3px;">
                    <span style="color:#4ade80; font-weight:700;">${getFlagEmoji(u.winner)} ${u.winner}</span>
                    ${u.winnerAth ? `<span style="color:#94a3b8; font-size:0.72rem;"> (${u.winnerAth})</span>` : ''}
                    <span style="color:#94a3b8;"> def. </span>
                    <span style="color:#f87171; font-weight:600;">${getFlagEmoji(u.loser)} ${u.loser}</span>
                    ${u.loserAth ? `<span style="color:#94a3b8; font-size:0.72rem;"> (${u.loserAth})</span>` : ''}
                    <span style="font-size:0.68rem; color:#facc15; margin-left:4px;">[Fav #${u.favRank} vs #${u.dogRank}]</span>
                  </div>
                </div>
                <span style="font-family:monospace; font-weight:700; color:#cbd5e1; font-size:0.85rem;">${u.score || ''}</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(74,222,128,0.2); border-radius:10px; padding:1rem; text-align:center; color:#4ade80; font-size:0.85rem;">
            ${evaluatedMatches > 0 ? `✅ All projected favorites won their matches (${correctFavorites}/${evaluatedMatches}) with 0 upsets recorded.` : `Awaiting predictions or evaluated matches for ${activeSoftTennisCalibrationEvent}.`}
          </div>
        `}
      `;
    }
  };

  window.SPORT_ENGINES['soft_tennis'] = SOFT_TENNIS_ENGINE;

  window.setSoftTennisEventFilter = function(evName, rerender = true) {
    activeSoftTennisEventFilter = evName;
    activeSoftTennisStandingsEvent = evName;
    activeSoftTennisBracketEvent = evName;
    activeSoftTennisCalibrationEvent = evName;
    if (rerender && typeof renderView === 'function') renderView();
  };

  window.setSoftTennisPhaseFilter = function(phase, rerender = true) {
    activeSoftTennisPhaseFilter = phase;
    if (rerender && typeof renderView === 'function') renderView();
  };

  window.setSoftTennisStandingsEvent = function(evName, rerender = true) {
    activeSoftTennisStandingsEvent = evName;
    if (rerender && typeof renderView === 'function') renderView();
  };

  window.setSoftTennisBracketEvent = function(evName, rerender = true) {
    activeSoftTennisBracketEvent = evName;
    if (rerender && typeof renderView === 'function') renderView();
  };

  window.setSoftTennisCalibrationEvent = function(evName, rerender = true) {
    activeSoftTennisCalibrationEvent = evName;
    if (rerender && typeof renderView === 'function') renderView();
  };
})();
