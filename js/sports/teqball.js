// ==========================================================================
// Asian Games 2026: Teqball Sport Engine (FITEQ Standings, Bracket & Schedule)
// ==========================================================================

(function () {
  window.SPORT_ENGINES = window.SPORT_ENGINES || {};

  let activeTeqEventFilter = null; // defaults to first event in active category
  let activeTeqPhaseFilter = 'all'; // 'all' | 'groups' | 'knockout' | 'finals'
  let activeTeqStandingsEvent = null;
  let activeTeqBracketEvent = null;
  let activeTeqCalibrationEvent = null;

  function clean(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }

  function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function parseMatch(m) {
    const base = typeof parseMatchData === 'function' ? parseMatchData(m) : {};

    // Extract country / national team name
    let country1 = m.team1 || m.team_1 || '';
    if (!country1 && m.player1 && m.player1.includes('(')) {
      const match = m.player1.match(/\(([^)]+)\)/);
      if (match) country1 = match[1];
    }
    if (!country1) country1 = base.t1 || 'TBD';

    let country2 = m.team2 || m.team_2 || '';
    if (!country2 && m.player2 && m.player2.includes('(')) {
      const match = m.player2.match(/\(([^)]+)\)/);
      if (match) country2 = match[1];
    }
    if (!country2) country2 = base.t2 || 'TBD';

    const t1 = typeof formatTeamDisplayName === 'function' ? formatTeamDisplayName(country1) : country1;
    const t2 = typeof formatTeamDisplayName === 'function' ? formatTeamDisplayName(country2) : country2;

    const athlete1 = m.athlete1 || (m.player1 ? m.player1.replace(/\s*\([^)]*\)/g, '').trim() : '');
    const athlete2 = m.athlete2 || (m.player2 ? m.player2.replace(/\s*\([^)]*\)/g, '').trim() : '');

    const s1 = base.s1 || m.score1 || '-';
    const s2 = base.s2 || m.score2 || '-';

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
      winner: m.winner || base.winner || '',
      state: m.state || base.state || '',
      status: m.status || base.status || '',
      stage: base.stage || m.round || m.stage || 'Match',
      date: base.date || m.date || '',
      time: base.time || m.time || '',
      event: m.event || '',
      phase: m.phase || '',
      court: m.court || '',
      set_scores: m.set_scores || '',
      duration: m.duration || '',
      isFinished: base.isFinished || (m.status || '').toLowerCase().includes('finish') || (m.status || '').toLowerCase().includes('official')
    };
  }

  function renderTeqballEventHeroCard(evName, evMatches, isSingleView) {
    if (!evMatches || evMatches.length === 0) return '';

    const liveMatch = evMatches.find(m => (m.status || '').toLowerCase().includes('live') || (m.state || '').toLowerCase().includes('live'));
    const upcomingMatch = evMatches.find(m => !m.isFinished && !((m.status || '').toLowerCase().includes('live')));
    const finalMatch = evMatches.find(m => /gold|final/i.test(m.stage || m.round || '') && !/semi|quarter|bronze/i.test(m.stage || m.round || ''));

    if (liveMatch) {
      const f1 = getFlagEmoji(liveMatch.team1 || liveMatch.t1);
      const f2 = getFlagEmoji(liveMatch.team2 || liveMatch.t2);
      return `
        <div style="background:linear-gradient(135deg, rgba(239,68,68,0.18), rgba(15,23,42,0.9)); border:1px solid rgba(239,68,68,0.4); border-radius:12px; padding:1.25rem; position:relative; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.3);">

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:6px;">
            <span style="font-size:0.95rem; font-weight:800; color:#f8fafc; display:flex; align-items:center; gap:6px;">
              <span>🏓</span> <span>${evName}</span>
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
              ${liveMatch.athlete1 ? `<div style="font-size:0.74rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeAttr(liveMatch.athlete1)}">${liveMatch.athlete1}</div>` : ''}
            </div>
            <div style="text-align:center; min-width:80px;">
              <div style="font-size:0.68rem; font-weight:700; color:#ef4444; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:2px;">
                ${liveMatch.stage || liveMatch.round}
              </div>
              <div style="font-family:monospace; font-size:1.5rem; font-weight:800; color:#ef4444; letter-spacing:1px;">
                ${liveMatch.s1 !== '-' ? `${liveMatch.s1} : ${liveMatch.s2}` : 'LIVE'}
              </div>
              ${liveMatch.set_scores ? `<div style="font-size:0.68rem; color:#94a3b8; font-family:monospace; margin-top:2px;">${liveMatch.set_scores}</div>` : ''}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:1.8rem; line-height:1.2;">${f2}</div>
              <div style="font-weight:700; font-size:1rem; color:#f8fafc; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${liveMatch.team2 || liveMatch.t2}
              </div>
              ${liveMatch.athlete2 ? `<div style="font-size:0.74rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeAttr(liveMatch.athlete2)}">${liveMatch.athlete2}</div>` : ''}
            </div>
          </div>
          <div style="font-size:0.75rem; color:#94a3b8; text-align:center; margin-top:0.4rem;">
            ${liveMatch.court ? `${liveMatch.court} • ` : ''}⏱️ In Progress
          </div>
        </div>
      `;
    }

    if (upcomingMatch) {
      const f1 = getFlagEmoji(upcomingMatch.team1 || upcomingMatch.t1);
      const f2 = getFlagEmoji(upcomingMatch.team2 || upcomingMatch.t2);
      const timeDisplay = (typeof formatDisplayTime === 'function')
        ? formatDisplayTime(upcomingMatch.time, upcomingMatch.date)
        : `${upcomingMatch.time} JST`;

      return `
        <div style="background:linear-gradient(135deg, rgba(30,58,138,0.35), rgba(15,23,42,0.9)); border:1px solid rgba(59,130,246,0.35); border-radius:12px; padding:1.25rem; position:relative; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.3);">

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:6px;">
            <span style="font-size:0.95rem; font-weight:800; color:#f8fafc; display:flex; align-items:center; gap:6px;">
              <span>🏓</span> <span>${evName}</span>
            </span>
            <span style="display:inline-block; font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; padding:2px 8px; border-radius:9999px; background:rgba(59,130,246,0.2); color:#60a5fa; border:1px solid rgba(59,130,246,0.35);">
              ⏳ NEXT MATCH
            </span>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-around; margin:0.75rem 0; gap:12px; text-align:center;">
            <div style="flex:1; min-width:0;">
              <div style="font-size:1.8rem; line-height:1.2;">${f1}</div>
              <div style="font-weight:700; font-size:1rem; color:#f8fafc; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${upcomingMatch.team1 || upcomingMatch.t1}
              </div>
              ${upcomingMatch.athlete1 ? `<div style="font-size:0.74rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeAttr(upcomingMatch.athlete1)}">${upcomingMatch.athlete1}</div>` : ''}
            </div>
            <div style="text-align:center; min-width:80px;">
              <div style="font-size:0.68rem; font-weight:700; color:#38bdf8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:2px;">
                ${upcomingMatch.stage || upcomingMatch.round}
              </div>
              <div style="font-family:monospace; font-size:1.3rem; font-weight:800; color:#94a3b8;">
                VS
              </div>
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:1.8rem; line-height:1.2;">${f2}</div>
              <div style="font-weight:700; font-size:1rem; color:#f8fafc; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${upcomingMatch.team2 || upcomingMatch.t2}
              </div>
              ${upcomingMatch.athlete2 ? `<div style="font-size:0.74rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeAttr(upcomingMatch.athlete2)}">${upcomingMatch.athlete2}</div>` : ''}
            </div>
          </div>
          <div style="font-size:0.75rem; color:#94a3b8; text-align:center; margin-top:0.4rem;">
            📅 ${timeDisplay} ${upcomingMatch.court ? `• ${upcomingMatch.court}` : ''}
          </div>
        </div>
      `;
    }

    // Concluded state
    let goldTeam = '', goldAthlete = '', silverTeam = '', silverAthlete = '';
    let finalScoreDisplay = '-', finalSetScores = '';

    if (finalMatch) {
      const w1 = clean(finalMatch.winner) === clean(finalMatch.team1 || finalMatch.t1) || clean(finalMatch.winner) === clean(finalMatch.athlete1);
      goldTeam = w1 ? (finalMatch.team1 || finalMatch.t1) : (finalMatch.team2 || finalMatch.t2);
      goldAthlete = w1 ? (finalMatch.athlete1 || finalMatch.player1 || '') : (finalMatch.athlete2 || finalMatch.player2 || '');
      silverTeam = w1 ? (finalMatch.team2 || finalMatch.t2) : (finalMatch.team1 || finalMatch.t1);
      silverAthlete = w1 ? (finalMatch.athlete2 || finalMatch.player2 || '') : (finalMatch.athlete1 || finalMatch.player1 || '');

      finalScoreDisplay = w1 ? `${finalMatch.s1} : ${finalMatch.s2}` : `${finalMatch.s2} : ${finalMatch.s1}`;
      finalSetScores = finalMatch.set_scores || '';
    }

    const fGold = getFlagEmoji(goldTeam);
    const fSilver = getFlagEmoji(silverTeam);

    // Extract Bronzes
    const bronzeMatches = evMatches.filter(m => /bronze/i.test(m.stage || m.round || ''));
    const semis = evMatches.filter(m => /semi/i.test(m.stage || m.round || ''));
    let bronzesList = [];

    if (bronzeMatches.length > 0) {
      bronzesList = bronzeMatches.map(bm => {
        const bw1 = clean(bm.winner) === clean(bm.team1 || bm.t1) || clean(bm.winner) === clean(bm.athlete1);
        return {
          team: bw1 ? (bm.team1 || bm.t1) : (bm.team2 || bm.t2),
          athlete: bw1 ? (bm.athlete1 || bm.player1 || '') : (bm.athlete2 || bm.player2 || '')
        };
      });
    } else if (semis.length > 0 && semis.every(s => s.isFinished)) {
      bronzesList = semis.map(sm => {
        const sw1 = clean(sm.winner) === clean(sm.team1 || sm.t1) || clean(sm.winner) === clean(sm.athlete1);
        return {
          team: sw1 ? (sm.team2 || sm.t2) : (sm.team1 || sm.t1),
          athlete: sw1 ? (sm.athlete2 || sm.player2 || '') : (sm.athlete1 || sm.player1 || '')
        };
      });
    }

    return `
      <div style="background:linear-gradient(135deg, rgba(202,138,4,0.15), rgba(15,23,42,0.9)); border:1px solid rgba(234,179,8,0.32); border-radius:12px; padding:1.15rem; position:relative; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 4px 20px rgba(0,0,0,0.3);">
        <div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; flex-wrap:wrap; gap:6px;">
            <span style="font-size:0.95rem; font-weight:800; color:#f8fafc; display:flex; align-items:center; gap:6px;">
              <span>🏓</span> <span>${evName}</span>
            </span>
            <span style="display:inline-block; font-size:0.68rem; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; padding:2px 8px; border-radius:9999px; background:rgba(234,179,8,0.2); color:#facc15; border:1px solid rgba(234,179,8,0.35);">
              🏆 EVENT CONCLUDED
            </span>
          </div>

          <!-- Gold vs Silver Center Matchup -->
          <div style="display:flex; align-items:center; justify-content:space-around; margin:0.75rem 0; gap:12px; text-align:center;">
            <!-- Champion (Gold) -->
            <div style="flex:1; min-width:0;">
              <div style="font-size:1.8rem; line-height:1.2;">${fGold}</div>
              <div style="font-weight:800; font-size:1rem; color:#facc15; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${goldTeam} 🥇
              </div>
              ${goldAthlete && goldAthlete !== goldTeam ? `<div style="font-size:0.72rem; color:#cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeAttr(goldAthlete)}">${goldAthlete}</div>` : ''}
            </div>

            <!-- Score Display -->
            <div style="text-align:center; min-width:80px;">
              <div style="font-size:0.65rem; font-weight:700; color:#facc15; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:2px;">
                Gold Final
              </div>
              <div style="font-family:monospace; font-size:1.4rem; font-weight:800; color:#f8fafc; letter-spacing:1px;">
                ${finalScoreDisplay}
              </div>
              ${finalSetScores ? `<div style="font-size:0.65rem; color:#94a3b8; font-family:monospace; margin-top:2px;">${finalSetScores}</div>` : ''}
            </div>

            <!-- Runner-up (Silver) -->
            <div style="flex:1; min-width:0; opacity:0.85;">
              <div style="font-size:1.8rem; line-height:1.2;">${fSilver}</div>
              <div style="font-weight:700; font-size:0.95rem; color:#cbd5e1; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${silverTeam} 🥈
              </div>
              ${silverAthlete && silverAthlete !== silverTeam ? `<div style="font-size:0.72rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeAttr(silverAthlete)}">${silverAthlete}</div>` : ''}
            </div>
          </div>
        </div>

        <!-- Podium Breakdown Table / Bar -->
        <div style="background:rgba(0,0,0,0.25); border-radius:8px; padding:8px 10px; font-size:0.74rem; margin-top:0.6rem; display:flex; flex-direction:column; gap:5px; border:1px solid rgba(255,255,255,0.05);">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <span style="color:#facc15; font-weight:700; display:flex; align-items:center; gap:5px; white-space:nowrap;">
              <span>🥇</span> <span>Gold:</span>
            </span>
            <span style="color:#f8fafc; font-weight:600; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${fGold} ${goldTeam} ${goldAthlete && goldAthlete !== goldTeam ? `<span style="color:#94a3b8; font-size:0.7rem; font-weight:normal;">(${goldAthlete})</span>` : ''}
            </span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <span style="color:#cbd5e1; font-weight:700; display:flex; align-items:center; gap:5px; white-space:nowrap;">
              <span>🥈</span> <span>Silver:</span>
            </span>
            <span style="color:#cbd5e1; font-weight:600; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${fSilver} ${silverTeam} ${silverAthlete && silverAthlete !== silverTeam ? `<span style="color:#94a3b8; font-size:0.7rem; font-weight:normal;">(${silverAthlete})</span>` : ''}
            </span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <span style="color:#f59e0b; font-weight:700; display:flex; align-items:center; gap:5px; white-space:nowrap;">
              <span>🥉</span> <span>Bronze:</span>
            </span>
            <div style="color:#f59e0b; font-weight:600; text-align:right; display:flex; flex-direction:column; gap:2px; overflow:hidden;">
              ${bronzesList.length > 0 ? bronzesList.map(b => `
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${getFlagEmoji(b.team)} ${b.team} ${b.athlete && b.athlete !== b.team ? `<span style="color:#94a3b8; font-size:0.7rem; font-weight:normal;">(${b.athlete})</span>` : ''}
                </span>
              `).join('') : '<span style="color:#64748b;">TBD</span>'}
            </div>
          </div>
        </div>

        ${!isSingleView ? `
          <div style="margin-top:8px; text-align:right;">
            <button style="background:transparent; border:none; color:#38bdf8; font-size:0.72rem; font-weight:600; cursor:pointer; padding:2px 4px;" data-event="${escapeAttr(evName)}" onclick="window.setTeqEventFilter(this.getAttribute('data-event'))">
              View ${evName} Schedule &rarr;
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  const TEQBALL_ENGINE = {
    icon: '🏓',
    hasBracket: true,

    // --- Schedule & Matches Renderer ---
    renderMatches(matches) {
      if (!matches || matches.length === 0) {
        return `<div style="text-align:center; padding:3rem 1rem; color:#94a3b8;">No matches scheduled for Teqball.</div>`;
      }

      const parsedMatches = matches.map(m => parseMatch(m));
      const currentGender = window.currentGender || 'men';

      // Available events for this category
      const rawEvents = Array.from(new Set(parsedMatches.map(m => m.event).filter(Boolean)));
      const score = (ev) => {
        const s = (ev || '').toLowerCase();
        if (s.includes('singles')) return 1;
        if (s.includes('doubles') && !s.includes('mixed')) return 2;
        if (s.includes('mixed')) return 3;
        if (s.includes('team')) return 4;
        return 10;
      };
      const eventsList = rawEvents.sort((a, b) => score(a) - score(b) || a.localeCompare(b));

      if (!activeTeqEventFilter || activeTeqEventFilter === 'all' || !eventsList.includes(activeTeqEventFilter)) {
        activeTeqEventFilter = eventsList[0] || '';
      }

      // Filter matches by selected event
      let filtered = activeTeqEventFilter ? parsedMatches.filter(m => m.event === activeTeqEventFilter) : parsedMatches;

      if (activeTeqPhaseFilter === 'groups') {
        filtered = filtered.filter(m => /group/i.test(m.stage || m.round || ''));
      } else if (activeTeqPhaseFilter === 'knockout') {
        filtered = filtered.filter(m => /quarter|repechage|semi/i.test(m.stage || m.round || ''));
      } else if (activeTeqPhaseFilter === 'finals') {
        filtered = filtered.filter(m => {
          const r = (m.stage || m.round || '').toLowerCase();
          if (/gold|final|bronze/i.test(r)) return true;
          if (/semi/i.test(r) && clean(m.event).includes('womensdoubles')) return true;
          return false;
        });
      }

      // Event Selector Dropdown & Phase Filters HTML (Rendered FIRST)
      const filterBarHtml = `
        <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1.25rem; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:0.75rem; font-weight:700; color:#94a3b8; text-transform:uppercase;">Event:</span>
              <div class="event-selector-wrap">
                <select class="event-dropdown" onchange="window.setTeqEventFilter(this.value)">
                  ${eventsList.map(ev => `<option value="${escapeAttr(ev)}" ${activeTeqEventFilter === ev ? 'selected' : ''}>${ev}</option>`).join('')}
                </select>
              </div>
            </div>
            <span style="font-size:0.72rem; color:#64748b;">Showing ${filtered.length} of ${parsedMatches.length} matches</span>
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; border-top:1px solid rgba(255,255,255,0.05); padding-top:6px;">
            <span style="font-size:0.72rem; font-weight:700; color:#64748b; text-transform:uppercase; margin-right:4px;">Phase:</span>
            <button style="padding:3px 8px; font-size:0.72rem; font-weight:600; border-radius:5px; border:none; cursor:pointer; background:${activeTeqPhaseFilter === 'all' ? '#38bdf8' : 'transparent'}; color:${activeTeqPhaseFilter === 'all' ? '#0f172a' : '#94a3b8'};" onclick="window.setTeqPhaseFilter('all')">All</button>
            <button style="padding:3px 8px; font-size:0.72rem; font-weight:600; border-radius:5px; border:none; cursor:pointer; background:${activeTeqPhaseFilter === 'groups' ? '#38bdf8' : 'transparent'}; color:${activeTeqPhaseFilter === 'groups' ? '#0f172a' : '#94a3b8'};" onclick="window.setTeqPhaseFilter('groups')">Groups</button>
            <button style="padding:3px 8px; font-size:0.72rem; font-weight:600; border-radius:5px; border:none; cursor:pointer; background:${activeTeqPhaseFilter === 'knockout' ? '#38bdf8' : 'transparent'}; color:${activeTeqPhaseFilter === 'knockout' ? '#0f172a' : '#94a3b8'};" onclick="window.setTeqPhaseFilter('knockout')">Knockout & Repechages</button>
            <button style="padding:3px 8px; font-size:0.72rem; font-weight:600; border-radius:5px; border:none; cursor:pointer; background:${activeTeqPhaseFilter === 'finals' ? '#38bdf8' : 'transparent'}; color:${activeTeqPhaseFilter === 'finals' ? '#0f172a' : '#94a3b8'};" onclick="window.setTeqPhaseFilter('finals')">Medal Matches</button>
          </div>
        </div>
      `;

      // Hero Banner HTML (Rendered AFTER event selection)
      let heroHtml = '';
      if (activeTeqEventFilter) {
        const evMatches = parsedMatches.filter(m => m.event === activeTeqEventFilter);
        heroHtml = `
          <div style="margin-bottom:1.25rem;">
            ${renderTeqballEventHeroCard(activeTeqEventFilter, evMatches, true)}
          </div>
        `;
      }


      let eventNoticeHtml = '';
      if (clean(activeTeqEventFilter).includes('womensdoubles')) {
        eventNoticeHtml = `
          <div style="background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.25); border-radius:8px; padding:0.65rem 0.95rem; margin-bottom:1rem; font-size:0.75rem; color:#f8fafc; display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.2rem;">🥉</span>
            <div>
              <strong>Tournament Notice:</strong> In Women's Doubles, there was no separate 3rd-place playoff match. Both losing semifinalists (<strong>Cambodia 🇰🇭</strong> and <strong>Lebanon 🇱🇧</strong>) were officially awarded Bronze medals directly from the semifinals.
            </div>
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
        const dateObj = new Date(d);
        const dayLabel = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
          : d;

        const cards = dayMatches.map(m => {
          const isGold = /gold|final/i.test(m.stage || m.round || '') && !/semi|quarter|bronze/i.test(m.stage || m.round || '');
          const isBronze = /bronze/i.test(m.stage || m.round || '');
          const isRepechage = /repechage/i.test(m.stage || m.round || '');
          const isSemi = /semi/i.test(m.stage || m.round || '');
          const isQuarter = /quarter/i.test(m.stage || m.round || '');
          const isWdSemi = isSemi && clean(m.event).includes('womensdoubles');

          let stageBadgeBg = 'rgba(255,255,255,0.06)';
          let stageBadgeColor = '#94a3b8';
          let stageBorder = 'rgba(255,255,255,0.08)';

          if (isGold) {
            stageBadgeBg = 'rgba(234,179,8,0.15)';
            stageBadgeColor = '#facc15';
            stageBorder = 'rgba(234,179,8,0.3)';
          } else if (isBronze || isWdSemi) {
            stageBadgeBg = 'rgba(245,158,11,0.15)';
            stageBadgeColor = '#f59e0b';
            stageBorder = 'rgba(245,158,11,0.3)';
          } else if (isSemi) {
            stageBadgeBg = 'rgba(168,85,247,0.15)';
            stageBadgeColor = '#c084fc';
            stageBorder = 'rgba(168,85,247,0.3)';
          } else if (isRepechage) {
            stageBadgeBg = 'rgba(244,63,94,0.15)';
            stageBadgeColor = '#fb7185';
            stageBorder = 'rgba(244,63,94,0.3)';
          } else if (isQuarter) {
            stageBadgeBg = 'rgba(56,189,248,0.12)';
            stageBadgeColor = '#38bdf8';
            stageBorder = 'rgba(56,189,248,0.25)';
          }

          const f1 = getFlagEmoji(m.team1 || m.t1);
          const f2 = getFlagEmoji(m.team2 || m.t2);

          const w1 = clean(m.winner) === clean(m.team1 || m.t1);
          const w2 = clean(m.winner) === clean(m.team2 || m.t2);

          const timeDisplay = (typeof formatDisplayTime === 'function')
            ? formatDisplayTime(m.time, m.date)
            : `${m.time} JST`;

          return `
            <div style="background:var(--card-bg, #1e293b); border:1px solid ${isGold ? 'rgba(234,179,8,0.35)' : isBronze || isWdSemi ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)'}; border-radius:10px; padding:0.85rem 1rem; margin-bottom:0.75rem; transition:transform 0.15s; position:relative; overflow:hidden;">
              ${isGold ? `<div style="position:absolute; top:0; right:0; background:#eab308; color:#000; font-size:0.62rem; font-weight:800; padding:2px 8px; border-bottom-left-radius:6px;">🥇 GOLD FINAL</div>` : ''}
              ${isBronze ? `<div style="position:absolute; top:0; right:0; background:#f59e0b; color:#000; font-size:0.62rem; font-weight:800; padding:2px 8px; border-bottom-left-radius:6px;">🥉 BRONZE MATCH</div>` : ''}
              ${isWdSemi ? `<div style="position:absolute; top:0; right:0; background:#f59e0b; color:#000; font-size:0.62rem; font-weight:800; padding:2px 8px; border-bottom-left-radius:6px;">🥉 BRONZE DECIDER (LOSER AWARDS BRONZE)</div>` : ''}

              <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.74rem; margin-bottom:8px; gap:8px;">
                <span style="background:${stageBadgeBg}; color:${stageBadgeColor}; border:1px solid ${stageBorder}; padding:2px 7px; border-radius:4px; font-weight:700;">
                  ${m.stage || m.round}
                </span>
                <span style="color:#64748b; font-size:0.72rem;">
                  ${timeDisplay} ${m.court ? `• ${m.court}` : ''} ${m.duration ? `• ⏱️ ${m.duration}` : ''}
                </span>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                <!-- Team 1 -->
                <div style="flex:1; display:flex; flex-direction:column; gap:2px; opacity:${w2 ? '0.6' : '1'};">
                  <div style="display:flex; align-items:center; gap:6px; font-weight:${w1 ? '700' : '600'}; font-size:0.88rem; color:${w1 ? '#f8fafc' : '#cbd5e1'};">
                    <span style="font-size:1.1rem;">${f1}</span>
                    <span>${m.team1 || m.t1}</span>
                    ${w1 ? '<span style="color:#22c55e; font-size:0.7rem;">✓</span>' : (isWdSemi && m.isFinished && !w1 ? '<span style="color:#f59e0b; font-size:0.68rem; font-weight:700; margin-left:4px; padding:1px 5px; border-radius:3px; background:rgba(245,158,11,0.15);">🥉 Bronze</span>' : '')}
                  </div>
                  ${m.athlete1 && m.athlete1 !== m.team1 ? `<div style="font-size:0.72rem; color:#94a3b8; padding-left:1.5rem;">${m.athlete1}</div>` : ''}
                </div>

                <!-- Sets Score -->
                <div style="text-align:center; min-width:65px;">
                  <div style="font-size:1.15rem; font-weight:800; color:#f8fafc; font-family:monospace; letter-spacing:1px;">
                    ${m.s1} : ${m.s2}
                  </div>
                  ${m.set_scores ? `<div style="font-size:0.68rem; color:#94a3b8; font-family:monospace; margin-top:2px;">${m.set_scores}</div>` : ''}
                </div>

                <!-- Team 2 -->
                <div style="flex:1; display:flex; flex-direction:column; align-items:flex-end; gap:2px; opacity:${w1 ? '0.6' : '1'}; text-align:right;">
                  <div style="display:flex; align-items:center; gap:6px; font-weight:${w2 ? '700' : '600'}; font-size:0.88rem; color:${w2 ? '#f8fafc' : '#cbd5e1'};">
                    ${w2 ? '<span style="color:#22c55e; font-size:0.7rem;">✓</span>' : (isWdSemi && m.isFinished && !w2 ? '<span style="color:#f59e0b; font-size:0.68rem; font-weight:700; margin-right:4px; padding:1px 5px; border-radius:3px; background:rgba(245,158,11,0.15);">🥉 Bronze</span>' : '')}
                    <span>${m.team2 || m.t2}</span>
                    <span style="font-size:1.1rem;">${f2}</span>
                  </div>
                  ${m.athlete2 && m.athlete2 !== m.team2 ? `<div style="font-size:0.72rem; color:#94a3b8; padding-right:1.5rem;">${m.athlete2}</div>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');

        matchesHtml += `
          <div style="margin-bottom:1.5rem;">
            <div style="font-size:0.82rem; font-weight:800; color:#cbd5e1; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
              <span>📅 ${dayLabel}</span>
              <span style="height:1px; flex:1; background:rgba(255,255,255,0.08);"></span>
              <span style="font-size:0.72rem; color:#64748b;">${dayMatches.length} Matches</span>
            </div>
            ${cards}
          </div>
        `;
      });

      return filterBarHtml + heroHtml + eventNoticeHtml + matchesHtml;
    },

    // --- Standings & Groups Renderer ---
    renderStandingsTable(matches) {
      const parsedMatches = (matches || []).map(m => parseMatch(m));
      const groupMatches = parsedMatches.filter(m => /group/i.test(m.stage || m.round || ''));

      if (groupMatches.length === 0) {
        return `<div style="text-align:center; padding:3rem 1rem; color:#94a3b8;">No group stage matches found for Teqball.</div>`;
      }

      // Group by Event -> Group Pool
      const poolGroups = {};
      groupMatches.forEach(m => {
        const ev = m.event || 'Teqball';
        const grpMatch = (m.stage || m.round || '').match(/group\s*([a-z0-9]+)/i);
        const grpName = grpMatch ? `Group ${grpMatch[1].toUpperCase()}` : 'Group Stage';

        if (!poolGroups[ev]) poolGroups[ev] = {};
        if (!poolGroups[ev][grpName]) poolGroups[ev][grpName] = {};

        const t1 = m.team1 || m.t1;
        const t2 = m.team2 || m.t2;

        if (t1 && t2 && t1 !== 'TBD' && t2 !== 'TBD') {
          [ { t: t1, ath: m.athlete1 }, { t: t2, ath: m.athlete2 } ].forEach(({ t, ath }) => {
            if (!poolGroups[ev][grpName][t]) {
              poolGroups[ev][grpName][t] = {
                name: t,
                athlete: ath || '',
                mp: 0,
                w: 0,
                l: 0,
                sw: 0,
                sl: 0,
                sd: 0,
                pw: 0,
                pl: 0,
                pd: 0,
                pts: 0
              };
            }
          });

          if (m.isFinished && m.s1 !== '-' && m.s2 !== '-') {
            const s1 = Number(m.s1) || 0;
            const s2 = Number(m.s2) || 0;
            const item1 = poolGroups[ev][grpName][t1];
            const item2 = poolGroups[ev][grpName][t2];

            item1.mp += 1;
            item2.mp += 1;

            item1.sw += s1;
            item1.sl += s2;
            item2.sw += s2;
            item2.sl += s1;

            const wClean = clean(m.winner);
            const c1 = clean(t1);
            const c2 = clean(t2);

            if (wClean === c1) {
              item1.w += 1;
              item1.pts += 2;
              item2.l += 1;
            } else if (wClean === c2) {
              item2.w += 1;
              item2.pts += 2;
              item1.l += 1;
            } else if (s1 > s2) {
              item1.w += 1;
              item1.pts += 2;
              item2.l += 1;
            } else if (s2 > s1) {
              item2.w += 1;
              item2.pts += 2;
              item1.l += 1;
            }

            // Parse set points from set_scores (e.g. "12-8, 12-8")
            if (m.set_scores) {
              const sets = m.set_scores.split(/,\s*/);
              sets.forEach(setStr => {
                const parts = setStr.split('-').map(p => parseInt(p.trim(), 10));
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  item1.pw += parts[0];
                  item1.pl += parts[1];
                  item2.pw += parts[1];
                  item2.pl += parts[0];
                }
              });
            }

            item1.sd = item1.sw - item1.sl;
            item2.sd = item2.sw - item2.sl;
            item1.pd = item1.pw - item1.pl;
            item2.pd = item2.pw - item2.pl;
          }
        }
      });

      const rawEvents = Object.keys(poolGroups);
      const score = (ev) => {
        const s = (ev || '').toLowerCase();
        if (s.includes('singles')) return 1;
        if (s.includes('doubles') && !s.includes('mixed')) return 2;
        if (s.includes('mixed')) return 3;
        if (s.includes('team')) return 4;
        return 10;
      };
      const eventsAvailable = rawEvents.sort((a, b) => score(a) - score(b) || a.localeCompare(b));

      if (!activeTeqStandingsEvent || activeTeqStandingsEvent === 'all' || !eventsAvailable.includes(activeTeqStandingsEvent)) {
        activeTeqStandingsEvent = eventsAvailable[0] || '';
      }

      const navHtml = eventsAvailable.length > 0 ? `
        <div class="event-filter-bar" style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.6rem 1rem; margin-bottom:1.25rem; display:flex; align-items:center; gap:8px;">
          <label style="font-size:0.75rem; font-weight:700; color:#64748b; text-transform:uppercase;">Select Event:</label>
          <select class="event-dropdown" onchange="window.setTeqStandingsEvent(this.value)">
            ${eventsAvailable.map(ev => `
              <option value="${escapeAttr(ev)}" ${activeTeqStandingsEvent === ev ? 'selected' : ''}>${ev}</option>
            `).join('')}
          </select>
        </div>
      ` : '';

      let tablesHtml = '';
      eventsAvailable.forEach(ev => {
        if (activeTeqStandingsEvent && activeTeqStandingsEvent !== ev) return;

        const groupsObj = poolGroups[ev];
        let groupTablesHtml = '';

        Object.keys(groupsObj).sort().forEach(grpName => {
          const teamsList = Object.values(groupsObj[grpName]).sort((a, b) => {
            if (b.pts !== a.pts) return b.pts - a.pts;
            if (b.sd !== a.sd) return b.sd - a.sd;
            return b.pd - a.pd;
          });

          const rowsHtml = teamsList.map((t, idx) => {
            const isQual = idx < 2;
            const flag = getFlagEmoji(t.name);
            return `
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.78rem; background:${isQual ? 'rgba(37,99,235,0.04)' : 'transparent'};">
                <td style="padding:8px; font-weight:700; color:${isQual ? '#38bdf8' : '#64748b'}; text-align:center; width:30px;">
                  ${idx + 1}
                </td>
                <td style="padding:8px; font-weight:600; color:#f8fafc;">
                  <div style="display:flex; align-items:center; gap:7px;">
                    <span style="font-size:1.1rem;">${flag}</span>
                    <div>
                      <div>${t.name} ${isQual ? '<span style="color:#22c55e; font-size:0.65rem; background:rgba(34,197,94,0.12); padding:1px 4px; border-radius:3px;">Q</span>' : ''}</div>
                      ${t.athlete && t.athlete !== t.name ? `<div style="font-size:0.68rem; color:#94a3b8;">${t.athlete}</div>` : ''}
                    </div>
                  </div>
                </td>
                <td style="padding:8px; text-align:center; color:#cbd5e1;">${t.mp}</td>
                <td style="padding:8px; text-align:center; color:#4ade80; font-weight:600;">${t.w}</td>
                <td style="padding:8px; text-align:center; color:#f87171;">${t.l}</td>
                <td style="padding:8px; text-align:center; color:#94a3b8;">${t.sw}-${t.sl}</td>
                <td style="padding:8px; text-align:center; font-weight:600; color:${t.sd > 0 ? '#4ade80' : t.sd < 0 ? '#f87171' : '#94a3b8'};">${t.sd > 0 ? `+${t.sd}` : t.sd}</td>
                <td style="padding:8px; text-align:center; color:#94a3b8;">${t.pw}-${t.pl}</td>
                <td style="padding:8px; text-align:center; color:${t.pd > 0 ? '#4ade80' : t.pd < 0 ? '#f87171' : '#94a3b8'};">${t.pd > 0 ? `+${t.pd}` : t.pd}</td>
                <td style="padding:8px; text-align:center; font-weight:800; color:#facc15; background:rgba(234,179,8,0.06); font-size:0.85rem;">${t.pts}</td>
              </tr>
            `;
          }).join('');

          groupTablesHtml += `
            <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; margin-bottom:1.25rem;">
              <div style="font-size:0.85rem; font-weight:800; color:#f8fafc; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
                <span>${grpName}</span>
                <span style="font-size:0.7rem; font-weight:600; color:#38bdf8;">Top 2 advance to Knockouts</span>
              </div>
              <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; text-align:left;">
                  <thead>
                    <tr style="border-bottom:1px solid rgba(255,255,255,0.08); font-size:0.7rem; color:#64748b; text-transform:uppercase;">
                      <th style="padding:6px 8px; text-align:center;">#</th>
                      <th style="padding:6px 8px;">Nation / Athletes</th>
                      <th style="padding:6px 8px; text-align:center;">MP</th>
                      <th style="padding:6px 8px; text-align:center;">W</th>
                      <th style="padding:6px 8px; text-align:center;">L</th>
                      <th style="padding:6px 8px; text-align:center;">Sets</th>
                      <th style="padding:6px 8px; text-align:center;">Diff</th>
                      <th style="padding:6px 8px; text-align:center;">Pts</th>
                      <th style="padding:6px 8px; text-align:center;">Diff</th>
                      <th style="padding:6px 8px; text-align:center; color:#facc15;">Table Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rowsHtml}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        });

        tablesHtml += `
          <div style="margin-bottom:2rem;">
            <div style="font-size:0.95rem; font-weight:800; color:#f8fafc; border-left:3px solid #38bdf8; padding-left:8px; margin-bottom:12px;">
              🏓 ${ev}
            </div>
            ${groupTablesHtml}
          </div>
        `;
      });

      return navHtml + tablesHtml;
    },

    // --- Bracket & Repechages Renderer ---
    renderKnockoutBracket(matches) {
      const parsedMatches = (matches || []).map(m => parseMatch(m));
      const koMatches = parsedMatches.filter(m => /quarter|repechage|semi|final|gold|bronze/i.test(m.stage || m.round || ''));

      if (koMatches.length === 0) {
        return `<div style="text-align:center; padding:3rem 1rem; color:#94a3b8;">No knockout matches found.</div>`;
      }

      // Group by Event
      const byEvent = {};
      koMatches.forEach(m => {
        const ev = m.event || 'Teqball';
        if (!byEvent[ev]) byEvent[ev] = [];
        byEvent[ev].push(m);
      });

      const rawEvents = Object.keys(byEvent);
      const score = (ev) => {
        const s = (ev || '').toLowerCase();
        if (s.includes('singles')) return 1;
        if (s.includes('doubles') && !s.includes('mixed')) return 2;
        if (s.includes('mixed')) return 3;
        if (s.includes('team')) return 4;
        return 10;
      };
      const eventsAvailable = rawEvents.sort((a, b) => score(a) - score(b) || a.localeCompare(b));

      if (!activeTeqBracketEvent || activeTeqBracketEvent === 'all' || !eventsAvailable.includes(activeTeqBracketEvent)) {
        activeTeqBracketEvent = eventsAvailable[0] || '';
      }

      const navHtml = eventsAvailable.length > 0 ? `
        <div class="event-filter-bar" style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.6rem 1rem; margin-bottom:1.25rem; display:flex; align-items:center; gap:8px;">
          <label style="font-size:0.75rem; font-weight:700; color:#64748b; text-transform:uppercase;">Select Event:</label>
          <select class="event-dropdown" onchange="window.setTeqBracketEvent(this.value)">
            ${eventsAvailable.map(ev => `
              <option value="${escapeAttr(ev)}" ${activeTeqBracketEvent === ev ? 'selected' : ''}>${ev}</option>
            `).join('')}
          </select>
        </div>
      ` : '';

      let bracketHtml = '';
      eventsAvailable.forEach(ev => {
        if (activeTeqBracketEvent && activeTeqBracketEvent !== ev) return;

        const evMatches = byEvent[ev];
        const quarters = evMatches.filter(m => /quarter/i.test(m.stage || m.round || ''));
        const repechages = evMatches.filter(m => /repechage/i.test(m.stage || m.round || ''));
        const semis = evMatches.filter(m => /semi/i.test(m.stage || m.round || ''));
        const bronzes = evMatches.filter(m => /bronze/i.test(m.stage || m.round || ''));
        const finalMatch = evMatches.find(m => /gold|final/i.test(m.stage || m.round || '') && !/semi|quarter|bronze/i.test(m.stage || m.round || ''));

        const renderBracketCard = (m, label) => {
          if (!m) return '';
          const w1 = clean(m.winner) === clean(m.team1 || m.t1);
          const w2 = clean(m.winner) === clean(m.team2 || m.t2);
          const f1 = getFlagEmoji(m.team1 || m.t1);
          const f2 = getFlagEmoji(m.team2 || m.t2);

          return `
            <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 10px; margin-bottom:8px; font-size:0.75rem;">
              <div style="display:flex; justify-content:space-between; color:#64748b; font-size:0.68rem; margin-bottom:4px;">
                <span>${label || m.match || m.stage}</span>
                <span>${m.court || ''}</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px; opacity:${w2 ? '0.6' : '1'};">
                <span style="display:flex; align-items:center; gap:5px; font-weight:${w1 ? '700' : '600'}; color:${w1 ? '#f8fafc' : '#cbd5e1'};">
                  <span>${f1}</span>
                  <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${m.team1 || m.t1}</span>
                </span>
                <span style="font-family:monospace; font-weight:800; color:${w1 ? '#4ade80' : '#94a3b8'};">${m.s1}</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; opacity:${w1 ? '0.6' : '1'};">
                <span style="display:flex; align-items:center; gap:5px; font-weight:${w2 ? '700' : '600'}; color:${w2 ? '#f8fafc' : '#cbd5e1'};">
                  <span>${f2}</span>
                  <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:110px;">${m.team2 || m.t2}</span>
                </span>
                <span style="font-family:monospace; font-weight:800; color:${w2 ? '#4ade80' : '#94a3b8'};">${m.s2}</span>
              </div>
              ${m.set_scores ? `<div style="font-size:0.65rem; color:#64748b; font-family:monospace; margin-top:4px; text-align:center;">${m.set_scores}</div>` : ''}
            </div>
          `;
        };

        bracketHtml += `
          <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.25rem; margin-bottom:1.75rem;">
            <div style="font-size:0.95rem; font-weight:800; color:#f8fafc; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
              <span>🏓 ${ev} • Knockout Tree</span>
            </div>
            
            <div style="display:flex; gap:16px; overflow-x:auto; padding-bottom:8px;">
              <!-- Quarterfinals -->
              ${quarters.length > 0 ? `
                <div style="min-width:180px; flex:1;">
                  <div style="font-size:0.72rem; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:8px; text-align:center;">Quarterfinals</div>
                  ${quarters.map((m, i) => renderBracketCard(m, `QF ${i+1}`)).join('')}
                </div>
              ` : ''}

              <!-- Repechages -->
              ${repechages.length > 0 ? `
                <div style="min-width:180px; flex:1;">
                  <div style="font-size:0.72rem; font-weight:700; color:#fb7185; text-transform:uppercase; margin-bottom:8px; text-align:center;">⚡ Repechages</div>
                  ${repechages.map((m, i) => renderBracketCard(m, `Repechage ${i+1}`)).join('')}
                </div>
              ` : ''}

              <!-- Semifinals -->
              ${semis.length > 0 ? `
                <div style="min-width:180px; flex:1;">
                  <div style="font-size:0.72rem; font-weight:700; color:#c084fc; text-transform:uppercase; margin-bottom:8px; text-align:center;">Semifinals</div>
                  ${semis.map((m, i) => renderBracketCard(m, `SF ${i+1}`)).join('')}
                </div>
              ` : ''}

              <!-- Medal Finals -->
              <div style="min-width:200px; flex:1;">
                <div style="font-size:0.72rem; font-weight:700; color:#facc15; text-transform:uppercase; margin-bottom:8px; text-align:center;">Medal Deciders</div>
                ${finalMatch ? `
                  <div style="border:1px solid rgba(234,179,8,0.4); border-radius:8px; padding:2px; margin-bottom:10px; background:rgba(234,179,8,0.05);">
                    <div style="font-size:0.68rem; font-weight:800; color:#facc15; text-align:center; padding:3px;">🥇 GOLD FINAL</div>
                    ${renderBracketCard(finalMatch, 'Championship')}
                  </div>
                ` : ''}
                ${bronzes.length > 0 ? bronzes.map((m, i) => `
                  <div style="border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:2px; margin-bottom:8px; background:rgba(245,158,11,0.04);">
                    <div style="font-size:0.68rem; font-weight:800; color:#f59e0b; text-align:center; padding:3px;">🥉 BRONZE ${i+1}</div>
                    ${renderBracketCard(m, `Bronze Match ${i+1}`)}
                  </div>
                `).join('') : (semis.length > 0 && semis.every(s => s.isFinished) ? `
                  <div style="border:1px solid rgba(245,158,11,0.35); border-radius:8px; padding:8px 10px; margin-bottom:8px; background:rgba(245,158,11,0.04); font-size:0.75rem;">
                    <div style="font-size:0.68rem; font-weight:800; color:#f59e0b; text-align:center; margin-bottom:6px; letter-spacing:0.04em;">🥉 BRONZE MEDALISTS (Semifinalists)</div>
                    ${semis.map((sm, idx) => {
                      const w1 = clean(sm.winner) === clean(sm.team1 || sm.t1) || clean(sm.winner) === clean(sm.athlete1);
                      const loserTeam = w1 ? (sm.team2 || sm.t2) : (sm.team1 || sm.t1);
                      const loserAthlete = w1 ? sm.athlete2 : sm.athlete1;
                      const f = getFlagEmoji(loserTeam);
                      return `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 0; ${idx > 0 ? 'border-top:1px solid rgba(255,255,255,0.06);' : ''}">
                          <div style="display:flex; align-items:center; gap:6px;">
                            <span>${f}</span>
                            <span style="font-weight:700; color:#f8fafc;">${loserTeam}</span>
                            ${loserAthlete ? `<span style="font-size:0.68rem; color:#94a3b8;">(${loserAthlete})</span>` : ''}
                          </div>
                          <span style="font-size:0.7rem; font-weight:700; color:#f59e0b; background:rgba(245,158,11,0.15); padding:1px 6px; border-radius:4px;">Bronze</span>
                        </div>
                      `;
                    }).join('')}
                    <div style="font-size:0.65rem; color:#94a3b8; margin-top:4px; text-align:center;">Both semifinal losers awarded Bronze</div>
                  </div>
                ` : '')}
              </div>
            </div>
          </div>
        `;
      });

      return navHtml + bracketHtml;
    },

    // --- Medal Analytics Hook (for Predictions & Calibration) ---
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
          const gA = parseP(getProb(a, ['gold', 'gold_prob']));
          const gB = parseP(getProb(b, ['gold', 'gold_prob']));
          if (gB !== gA) return gB - gA;
          const sA = parseP(getProb(a, ['silver', 'silver_prob']));
          const sB = parseP(getProb(b, ['silver', 'silver_prob']));
          if (sB !== sA) return sB - sA;
          const bA = parseP(getProb(a, ['bronze', 'bronze_prob']));
          const bB = parseP(getProb(b, ['bronze', 'bronze_prob']));
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
        const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(rawName) : '🏅';
        const displayName = typeof formatTeamDisplayName === 'function' ? formatTeamDisplayName(rawName.replace(/\(host\)/gi, '').trim()) : rawName.replace(/\(host\)/gi, '').trim();
        const athlete = isIndiv ? (item.athlete || item.player || '') : '';
        const cleaned = typeof cleanTeamName === 'function' ? cleanTeamName(rawName) : rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return { raw: rawName, cleaned, name: displayName, flag, athlete, isHost: false, goldProb: item.gold || '', silverProb: item.silver || '', bronzeProb: item.bronze || '' };
      };

      // Find actual gold/silver/bronze from match data for a specific event
      const resolveActuals = (eventName, allMatches) => {
        const targetClean = clean(eventName);
        const matches = allMatches
          .map(m => parseMatch(m))
          .filter(m => clean(m.event) === targetClean);

        const finalMatch = matches.find(m => {
          const r = (m.round || m.stage || '').toLowerCase();
          return /\bfinal\b/i.test(r) && !/semi|quarter|bronze|repechage/i.test(r);
        });

        const bronzeMatches = matches.filter(m => {
          const r = (m.round || m.stage || '').toLowerCase();
          return /bronze/i.test(r);
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

          gold = formatC({ team: winTeam, athlete: gAthleteRaw }, true);
          silver = formatC({ team: loseTeam, athlete: sAthleteRaw }, true);
          const s = finalMatch.score || `${finalMatch.s1 || '-'} - ${finalMatch.s2 || '-'}`;
          goldScoreInfo = `Final: ${finalMatch.t1} ${s} ${finalMatch.t2} (Official)`;
          matchInfo = goldScoreInfo;
        } else if (finalMatch) {
          const s = `${finalMatch.date || ''} ${finalMatch.time || ''}`.trim();
          goldScoreInfo = `Final: ${finalMatch.t1} vs ${finalMatch.t2}${s ? ' — ' + s : ''}`;
          matchInfo = goldScoreInfo;
        }

        // Process bronze matches (if scheduled/played)
        if (bronzeMatches.length > 0) {
          bronzeMatches.forEach((bm, bIdx) => {
            if (bm.isFinished) {
              const bWinner = bm.winner || bm.t1;
              const isB1 = clean(bWinner) === clean(bm.t1) || clean(bWinner) === clean(bm.team1) || clean(bWinner) === clean(bm.athlete1) || clean(bm.t1).includes(clean(bWinner));
              const bTeam = isB1 ? (bm.team1 || bm.t1) : (bm.team2 || bm.t2);
              const bAthlete = isB1 ? bm.athlete1 : bm.athlete2;
              const bObj = formatC({ team: bTeam, athlete: bAthlete }, true);
              bronzes.push(bObj);
              if (!bronze) bronze = bObj;
              const bS = bm.score || `${bm.s1 || '-'} - ${bm.s2 || '-'}`;
              const line = `Bronze ${bIdx + 1}: ${bm.t1} ${bS} ${bm.t2} (Official)`;
              bronzeScoreInfo += (bronzeScoreInfo ? ' • ' : '') + line;
            }
          });
        } else {
          // No bronze match (e.g. Women's Doubles) - Losing Semifinalists receive Bronze
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
              const bObj = formatC({ team: sLoserTeam, athlete: lAthlete }, true);
              bronzes.push(bObj);
              if (!bronze) bronze = bObj;
              const line = `Bronze (SF ${sIdx + 1}): ${sLoserTeam} (${lAthlete || sLoserTeam})`;
              bronzeScoreInfo += (bronzeScoreInfo ? ' • ' : '') + line;
            }
          });
        }

        if (bronzeScoreInfo) {
          matchInfo += (matchInfo ? ' • ' : '') + bronzeScoreInfo;
        }

        return { gold, silver, bronze, bronzes, status, matchInfo, goldScoreInfo, bronzeScoreInfo };
      };

      const curGen = String(currentGender || (typeof window !== 'undefined' && window.currentGender) || 'men').toLowerCase();
      const allMatchesBoth = [...(menMatches || []), ...(womenMatches || []), ...(mixedMatches || [])];
      const medalEvents = [];

      const allEventDefs = [
        { id: 'teq_men_singles',    event: "Men's Singles",    gender: 'men',    icon: '🏓', shortName: "Men's Singles" },
        { id: 'teq_men_doubles',    event: "Men's Doubles",    gender: 'men',    icon: '🏓', shortName: "Men's Doubles" },
        { id: 'teq_mixed_doubles',  event: "Mixed Doubles",    gender: 'mixed',  icon: '🏓', shortName: "Mixed Doubles" },
        { id: 'teq_women_singles',  event: "Women's Singles",  gender: 'women',  icon: '🏓', shortName: "Women's Singles" },
        { id: 'teq_women_doubles',  event: "Women's Doubles",  gender: 'women',  icon: '🏓', shortName: "Women's Doubles" }
      ];

      const teqEventDefs = allEventDefs.filter(d => (curGen === 'all' ? true : d.gender === curGen));

      teqEventDefs.forEach(def => {
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
        const projGold = formatC(podium[0]?.item, true);
        const projSilver = formatC(podium[1]?.item, true);
        const projBronze1 = formatC(podium[2]?.item, true);
        const projBronze2 = formatC(podium[3]?.item, true);
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
          type: 'individual',
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
        if (!tableMap[cln]) tableMap[cln] = { name: item.name, flag: item.flag || '🏓', isHost: false, gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
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

        // Resolve actual finish for projected picks
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
            const cObj = formatC(c, true);
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
      const isSportFinished = totalMedalsInSport > 0 && totalDecidedMedals >= totalMedalsInSport;
      const actualTable = Object.values(actualTableMap).sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze);
      const projectedTable = Object.values(projectedTableMap).sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze);

      const allNations = new Set([...Object.keys(actualTableMap), ...Object.keys(projectedTableMap)]);
      const comparisonTable = Array.from(allNations).map(cln => {
        const act = actualTableMap[cln] || { name: '', gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
        const prj = projectedTableMap[cln] || { name: '', gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
        const name = act.name || prj.name || cln;
        const flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(name) : '🏓';
        const diffTotal = act.total - prj.total;

        const hasRemainingEvents = medalEvents.some(ev => {
          const isEvFinished = ev.status === 'Finished' || (ev.actual?.gold && ev.actual?.silver && (ev.actual?.bronze || (ev.actual?.bronzes && ev.actual.bronzes.length > 0)));
          if (isEvFinished) return false;
          const inProj = ev.projected?.gold?.cleaned === cln ||
                         ev.projected?.silver?.cleaned === cln ||
                         ev.projected?.bronze?.cleaned === cln ||
                         (Array.isArray(ev.projected?.bronzes) && ev.projected.bronzes.some(b => b?.cleaned === cln));
          const inRank = Array.isArray(ev.rankings) && ev.rankings.some(r => {
            const rCln = r.cleaned || clean(r.team || r.country || r.name || '');
            return rCln === cln;
          });
          return inProj || inRank;
        });

        const isNationDone = isSportFinished || !hasRemainingEvents;

        let status = '⚪ Scheduled';
        if (totalDecidedMedals > 0) {
          if (act.total === prj.total && act.gold === prj.gold && act.silver === prj.silver && act.bronze === prj.bronze) {
            status = (act.total > 0 || isNationDone) ? '🎯 Exact Hit' : '⚪ Scheduled';
          } else if (diffTotal > 0) {
            status = `🟢 Over (+${diffTotal})`;
          } else if (diffTotal < 0) {
            if (isNationDone || act.total > 0) {
              status = `🔻 Under (${diffTotal})`;
            } else {
              status = '⏳ Pending / Awaiting';
            }
          } else if (act.total > 0) {
            status = '🟡 Position Shift';
          } else {
            status = isNationDone ? '🎯 Exact Hit' : '⏳ Pending / Awaiting';
          }
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

    // --- Calibration View (Multi-Event Favorite Accuracy & Upset Tracker) ---
    renderCalibration(container, predictions, matches) {
      const predEvents = (window.appData && Array.isArray(window.appData.predictionEvents))
        ? window.appData.predictionEvents : [];

      // Combine all finished matches across men, women, and mixed (deduplicated by ID)
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

      // Event definitions strictly for active gender
      const gender = (typeof currentGender !== 'undefined' ? currentGender : window.currentGender) || 'men';
      let eventsAvailable = [];
      if (gender === 'men') {
        eventsAvailable = ["Men's Singles", "Men's Doubles"];
      } else if (gender === 'women') {
        eventsAvailable = ["Women's Singles", "Women's Doubles"];
      } else if (gender === 'mixed') {
        eventsAvailable = ["Mixed Doubles"];
      } else {
        eventsAvailable = ["Men's Singles", "Men's Doubles"];
      }

      if (!activeTeqCalibrationEvent || activeTeqCalibrationEvent === 'all' || !eventsAvailable.includes(activeTeqCalibrationEvent)) {
        activeTeqCalibrationEvent = eventsAvailable[0] || '';
      }

      // Build event ranking map
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

      // Filter matches by selected event (defaults to first event of gender, no 'all')
      let evalMatches = finishedMatches.filter(m => clean(m.event) === clean(activeTeqCalibrationEvent));

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
          const isT1Winner = wClean === t1Clean || clean(m.winner) === clean(m.t1);
          const isT2Winner = wClean === t2Clean || clean(m.winner) === clean(m.t2);

          let actualWinnerTeam = m.winner;
          let actualLoserTeam = '';
          if (isT1Winner) {
            actualWinnerTeam = m.team1 || m.t1;
            actualLoserTeam = m.team2 || m.t2;
          } else if (isT2Winner) {
            actualWinnerTeam = m.team2 || m.t2;
            actualLoserTeam = m.team1 || m.t1;
          }

          const favWon = (r1 < r2 && isT1Winner) || (r2 < r1 && isT2Winner);

          if (favWon) {
            correctFavorites++;
          } else {
            const displayScore = m.set_scores || (m.s1 !== '-' && m.s2 !== '-' ? `${m.s1} - ${m.s2}` : m.score);
            upsetLogs.push({
              event: m.event,
              round: m.stage || m.round,
              winner: actualWinnerTeam || (r1 < r2 ? dogTeam : favTeam),
              winnerAth: r1 < r2 ? dogAth : favAth,
              loser: favTeam,
              loserAth: favAth,
              score: displayScore,
              favRank,
              dogRank
            });
          }
        }
      });

      const accuracy = evaluatedMatches > 0 ? Math.round((correctFavorites / evaluatedMatches) * 100) : '--';
      const skippedCount = evalMatches.length - evaluatedMatches;

      // Get medal KPI from extractMedalAnalytics strictly for active gender
      const medalKpi = this.extractMedalAnalytics(
        window.appData?.menMatches || [],
        window.appData?.womenMatches || [],
        window.appData?.menPredictions || [],
        window.appData?.womenPredictions || [],
        window.appData?.mixedMatches || [],
        window.appData?.mixedPredictions || [],
        gender
      ).kpi;

      const medalAccDisplay = medalKpi && medalKpi.accuracyPct != null ? `${medalKpi.accuracyPct}%` : '--%';
      const medalAccSub = medalKpi && medalKpi.decidedMedals > 0
        ? `${medalKpi.exactHits}/${medalKpi.decidedMedals} exact medals`
        : (medalKpi ? `${medalKpi.decidedMedals}/${medalKpi.totalMedalsInSport} decided` : 'Medals');

      const navHtml = eventsAvailable.length > 0 ? `
        <div class="event-filter-bar" style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.6rem 1rem; margin-bottom:1.25rem; display:flex; align-items:center; gap:8px;">
          <label style="font-size:0.75rem; font-weight:700; color:#64748b; text-transform:uppercase;">Select Event:</label>
          <select class="event-dropdown" onchange="window.setTeqCalibrationEvent(this.value)">
            ${eventsAvailable.map(ev => `
              <option value="${escapeAttr(ev)}" ${activeTeqCalibrationEvent === ev ? 'selected' : ''}>${ev}</option>
            `).join('')}
          </select>
        </div>
      ` : '';

      container.innerHTML = `
        ${navHtml}
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center;">
            <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.25rem;">Favorite Accuracy</div>
            <div style="font-size:1.6rem; font-weight:800; color:#38bdf8;">${accuracy}%</div>
            <div style="font-size:0.7rem; color:#94a3b8;">${correctFavorites}/${evaluatedMatches} correct</div>
          </div>
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center; cursor:pointer;" onclick="setTab('predictions')">
            <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.25rem;">Medal Accuracy</div>
            <div style="font-size:1.6rem; font-weight:800; color:#facc15;">${medalAccDisplay}</div>
            <div style="font-size:0.7rem; color:#38bdf8; text-decoration:underline;">${medalAccSub} →</div>
          </div>
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center;">
            <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.25rem;">Completed Matches</div>
            <div style="font-size:1.6rem; font-weight:800; color:#4ade80;">${evalMatches.length}</div>
            <div style="font-size:0.7rem; color:#94a3b8;">${evaluatedMatches} evaluated (${skippedCount} neutral)</div>
          </div>
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem; text-align:center;">
            <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.25rem;">Upsets Recorded</div>
            <div style="font-size:1.6rem; font-weight:800; color:#f87171;">${upsetLogs.length}</div>
            <div style="font-size:0.7rem; color:#94a3b8;">Underdog victories</div>
          </div>
        </div>

        ${upsetLogs.length > 0 ? `
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:1rem;">
            <div style="font-size:0.85rem; font-weight:700; margin-bottom:0.75rem; color:#f87171; display:flex; justify-content:space-between; align-items:center;">
              <span>⚡ Teqball Upset Tracker</span>
              <span style="font-size:0.72rem; color:#94a3b8; font-weight:400;">Pre-Tournament Simulation Favorites vs Official Match Results</span>
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
            ✅ All projected favorites won their matches (${correctFavorites}/${evaluatedMatches}) with 0 upsets recorded.
          </div>
        `}
      `;
    }
  };

  // Filter setters
  window.setTeqEventFilter = function (ev, renderAfter) {
    activeTeqEventFilter = ev;
    if (renderAfter !== false && typeof renderView === 'function') renderView();
  };

  window.setTeqPhaseFilter = function (phase) {
    activeTeqPhaseFilter = phase;
    if (typeof renderView === 'function') renderView();
  };

  window.setTeqStandingsEvent = function (ev, renderAfter) {
    activeTeqStandingsEvent = ev;
    if (renderAfter !== false && typeof renderView === 'function') renderView();
  };

  window.setTeqBracketEvent = function (ev, renderAfter) {
    activeTeqBracketEvent = ev;
    if (renderAfter !== false && typeof renderView === 'function') renderView();
  };

  window.setTeqCalibrationEvent = function (ev, renderAfter) {
    activeTeqCalibrationEvent = ev;
    if (renderAfter !== false && typeof renderView === 'function') renderView();
  };

  // Register in Sport Engine Registry
  window.SPORT_ENGINES['teqball'] = TEQBALL_ENGINE;
  window.SPORT_ENGINES['Teqball'] = TEQBALL_ENGINE;
})();
