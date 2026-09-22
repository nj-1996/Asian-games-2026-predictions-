// ==========================================================================
// Asian Games 2026: Teqball Sport Engine (FITEQ Standings, Bracket & Schedule)
// ==========================================================================

(function () {
  window.SPORT_ENGINES = window.SPORT_ENGINES || {};

  let activeTeqEventFilter = 'all'; // 'all' | "Men's Singles" | "Men's Doubles" | etc.
  let activeTeqPhaseFilter = 'all'; // 'all' | 'groups' | 'knockout' | 'finals'
  let activeTeqStandingsEvent = 'all';
  let activeTeqBracketEvent = 'all';

  function clean(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }

  function parseMatch(m) {
    const base = typeof parseMatchData === 'function' ? parseMatchData(m) : {};
    const t1 = base.t1 || m.player1 || m.team1 || 'TBD';
    const t2 = base.t2 || m.player2 || m.team2 || 'TBD';
    const s1 = base.s1 || m.score1 || '-';
    const s2 = base.s2 || m.score2 || '-';

    return {
      ...m,
      ...base,
      t1,
      t2,
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

      // Available events for this gender
      const eventSet = new Set(parsedMatches.map(m => m.event).filter(Boolean));
      const eventsList = Array.from(eventSet);

      if (activeTeqEventFilter !== 'all' && !eventSet.has(activeTeqEventFilter)) {
        activeTeqEventFilter = 'all';
      }

      // Filter matches
      let filtered = parsedMatches;
      if (activeTeqEventFilter !== 'all') {
        filtered = filtered.filter(m => m.event === activeTeqEventFilter);
      }

      if (activeTeqPhaseFilter === 'groups') {
        filtered = filtered.filter(m => /group/i.test(m.stage || m.round || ''));
      } else if (activeTeqPhaseFilter === 'knockout') {
        filtered = filtered.filter(m => /quarter|repechage|semi/i.test(m.stage || m.round || ''));
      } else if (activeTeqPhaseFilter === 'finals') {
        filtered = filtered.filter(m => /gold|final|bronze/i.test(m.stage || m.round || ''));
      }

      // Filter Bar HTML
      const eventPills = eventsList.map(ev => {
        const isActive = activeTeqEventFilter === ev;
        return `
          <button style="padding:4px 10px; font-size:0.75rem; font-weight:600; border-radius:6px; border:none; cursor:pointer; transition:all 0.15s; background:${isActive ? '#2563eb' : 'rgba(255,255,255,0.06)'}; color:${isActive ? '#fff' : '#94a3b8'};" onclick="window.setTeqEventFilter('${ev}')">
            ${ev}
          </button>
        `;
      }).join('');

      const filterBarHtml = `
        <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1.25rem; display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="font-size:0.72rem; font-weight:700; color:#64748b; text-transform:uppercase; margin-right:4px;">Event:</span>
            <button style="padding:4px 10px; font-size:0.75rem; font-weight:600; border-radius:6px; border:none; cursor:pointer; transition:all 0.15s; background:${activeTeqEventFilter === 'all' ? '#2563eb' : 'rgba(255,255,255,0.06)'}; color:${activeTeqEventFilter === 'all' ? '#fff' : '#94a3b8'};" onclick="window.setTeqEventFilter('all')">All Events</button>
            ${eventPills}
          </div>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; border-top:1px solid rgba(255,255,255,0.05); padding-top:6px;">
            <span style="font-size:0.72rem; font-weight:700; color:#64748b; text-transform:uppercase; margin-right:4px;">Phase:</span>
            <button style="padding:3px 8px; font-size:0.72rem; font-weight:600; border-radius:5px; border:none; cursor:pointer; background:${activeTeqPhaseFilter === 'all' ? '#38bdf8' : 'transparent'}; color:${activeTeqPhaseFilter === 'all' ? '#0f172a' : '#94a3b8'};" onclick="window.setTeqPhaseFilter('all')">All</button>
            <button style="padding:3px 8px; font-size:0.72rem; font-weight:600; border-radius:5px; border:none; cursor:pointer; background:${activeTeqPhaseFilter === 'groups' ? '#38bdf8' : 'transparent'}; color:${activeTeqPhaseFilter === 'groups' ? '#0f172a' : '#94a3b8'};" onclick="window.setTeqPhaseFilter('groups')">Groups</button>
            <button style="padding:3px 8px; font-size:0.72rem; font-weight:600; border-radius:5px; border:none; cursor:pointer; background:${activeTeqPhaseFilter === 'knockout' ? '#38bdf8' : 'transparent'}; color:${activeTeqPhaseFilter === 'knockout' ? '#0f172a' : '#94a3b8'};" onclick="window.setTeqPhaseFilter('knockout')">Knockout & Repechages</button>
            <button style="padding:3px 8px; font-size:0.72rem; font-weight:600; border-radius:5px; border:none; cursor:pointer; background:${activeTeqPhaseFilter === 'finals' ? '#38bdf8' : 'transparent'}; color:${activeTeqPhaseFilter === 'finals' ? '#0f172a' : '#94a3b8'};" onclick="window.setTeqPhaseFilter('finals')">Medal Matches</button>
            <span style="margin-left:auto; font-size:0.72rem; color:#64748b;">Showing ${filtered.length} of ${parsedMatches.length} matches</span>
          </div>
        </div>
      `;

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

          let stageBadgeBg = 'rgba(255,255,255,0.06)';
          let stageBadgeColor = '#94a3b8';
          let stageBorder = 'rgba(255,255,255,0.08)';

          if (isGold) {
            stageBadgeBg = 'rgba(234,179,8,0.15)';
            stageBadgeColor = '#facc15';
            stageBorder = 'rgba(234,179,8,0.3)';
          } else if (isBronze) {
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
            <div style="background:var(--card-bg, #1e293b); border:1px solid ${isGold ? 'rgba(234,179,8,0.35)' : 'rgba(255,255,255,0.08)'}; border-radius:10px; padding:0.85rem 1rem; margin-bottom:0.75rem; transition:transform 0.15s; position:relative; overflow:hidden;">
              ${isGold ? `<div style="position:absolute; top:0; right:0; background:#eab308; color:#000; font-size:0.62rem; font-weight:800; padding:2px 8px; border-bottom-left-radius:6px;">🥇 GOLD FINAL</div>` : ''}
              ${isBronze ? `<div style="position:absolute; top:0; right:0; background:#f59e0b; color:#000; font-size:0.62rem; font-weight:800; padding:2px 8px; border-bottom-left-radius:6px;">🥉 BRONZE MATCH</div>` : ''}

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
                    ${w1 ? '<span style="color:#22c55e; font-size:0.7rem;">✓</span>' : ''}
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
                    ${w2 ? '<span style="color:#22c55e; font-size:0.7rem;">✓</span>' : ''}
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

      return filterBarHtml + matchesHtml;
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

            if (s1 > s2) {
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

      const eventsAvailable = Object.keys(poolGroups);
      if (activeTeqStandingsEvent !== 'all' && !poolGroups[activeTeqStandingsEvent]) {
        activeTeqStandingsEvent = 'all';
      }

      // Filter tabs
      const filterPills = eventsAvailable.map(ev => {
        const isActive = activeTeqStandingsEvent === ev;
        return `
          <button style="padding:4px 10px; font-size:0.75rem; font-weight:600; border-radius:6px; border:none; cursor:pointer; transition:all 0.15s; background:${isActive ? '#2563eb' : 'rgba(255,255,255,0.06)'}; color:${isActive ? '#fff' : '#94a3b8'};" onclick="window.setTeqStandingsEvent('${ev}')">
            ${ev}
          </button>
        `;
      }).join('');

      const navHtml = `
        <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1.25rem; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span style="font-size:0.72rem; font-weight:700; color:#64748b; text-transform:uppercase; margin-right:4px;">Division:</span>
          <button style="padding:4px 10px; font-size:0.75rem; font-weight:600; border-radius:6px; border:none; cursor:pointer; transition:all 0.15s; background:${activeTeqStandingsEvent === 'all' ? '#2563eb' : 'rgba(255,255,255,0.06)'}; color:${activeTeqStandingsEvent === 'all' ? '#fff' : '#94a3b8'};" onclick="window.setTeqStandingsEvent('all')">All Divisions</button>
          ${filterPills}
        </div>
      `;

      let tablesHtml = '';
      eventsAvailable.forEach(ev => {
        if (activeTeqStandingsEvent !== 'all' && activeTeqStandingsEvent !== ev) return;

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

      const eventsAvailable = Object.keys(byEvent);
      if (activeTeqBracketEvent !== 'all' && !byEvent[activeTeqBracketEvent]) {
        activeTeqBracketEvent = 'all';
      }

      const bracketPills = eventsAvailable.map(ev => {
        const isActive = activeTeqBracketEvent === ev;
        return `
          <button style="padding:4px 10px; font-size:0.75rem; font-weight:600; border-radius:6px; border:none; cursor:pointer; transition:all 0.15s; background:${isActive ? '#2563eb' : 'rgba(255,255,255,0.06)'}; color:${isActive ? '#fff' : '#94a3b8'};" onclick="window.setTeqBracketEvent('${ev}')">
            ${ev}
          </button>
        `;
      }).join('');

      const navHtml = `
        <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1.25rem; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span style="font-size:0.72rem; font-weight:700; color:#64748b; text-transform:uppercase; margin-right:4px;">Division:</span>
          <button style="padding:4px 10px; font-size:0.75rem; font-weight:600; border-radius:6px; border:none; cursor:pointer; transition:all 0.15s; background:${activeTeqBracketEvent === 'all' ? '#2563eb' : 'rgba(255,255,255,0.06)'}; color:${activeTeqBracketEvent === 'all' ? '#fff' : '#94a3b8'};" onclick="window.setTeqBracketEvent('all')">All Divisions</button>
          ${bracketPills}
        </div>
      `;

      let bracketHtml = '';
      eventsAvailable.forEach(ev => {
        if (activeTeqBracketEvent !== 'all' && activeTeqBracketEvent !== ev) return;

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
                ${bronzes.map((m, i) => `
                  <div style="border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:2px; margin-bottom:8px; background:rgba(245,158,11,0.04);">
                    <div style="font-size:0.68rem; font-weight:800; color:#f59e0b; text-align:center; padding:3px;">🥉 BRONZE ${i+1}</div>
                    ${renderBracketCard(m, `Bronze Match ${i+1}`)}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      });

      return navHtml + bracketHtml;
    }
  };

  // Filter setters
  window.setTeqEventFilter = function (ev) {
    activeTeqEventFilter = ev;
    if (typeof renderView === 'function') renderView();
  };

  window.setTeqPhaseFilter = function (phase) {
    activeTeqPhaseFilter = phase;
    if (typeof renderView === 'function') renderView();
  };

  window.setTeqStandingsEvent = function (ev) {
    activeTeqStandingsEvent = ev;
    if (typeof renderView === 'function') renderView();
  };

  window.setTeqBracketEvent = function (ev) {
    activeTeqBracketEvent = ev;
    if (typeof renderView === 'function') renderView();
  };

  // Register in Sport Engine Registry
  window.SPORT_ENGINES['teqball'] = TEQBALL_ENGINE;
  window.SPORT_ENGINES['Teqball'] = TEQBALL_ENGINE;
})();
