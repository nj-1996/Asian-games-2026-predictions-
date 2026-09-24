// ==========================================================================
// Asian Games 2026: Swimming Sport Engine (41 Medal Events: 20 Men | 20 Women | 1 Mixed)
// Tokyo Aquatics Centre 10-Lane Competition Pool (Heats & Finals Interactive System)
// ==========================================================================

(function () {
  window.SPORT_ENGINES = window.SPORT_ENGINES || {};

  var swimmingEventsCache = {};
  var activeDayFilter = 'all';
  var activeStrokeFilter = 'all';
  var activeSearchQuery = '';

  function escapeAttr(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  var SWM_FLAGS = {
    'China': '🇨🇳', 'CHN': '🇨🇳',
    'Japan': '🇯🇵', 'JPN': '🇯🇵',
    'Korea': '🇰🇷', 'South Korea': '🇰🇷', 'KOR': '🇰🇷',
    'Hong Kong, China': '🇭🇰', 'Hong Kong': '🇭🇰', 'HKG': '🇭🇰',
    'Singapore': '🇸🇬', 'SGP': '🇸🇬',
    'Chinese Taipei': '🇹🇼', 'TPE': '🇹🇼',
    'Thailand': '🇹🇭', 'THA': '🇹🇭',
    'Kazakhstan': '🇰🇿', 'KAZ': '🇰🇿',
    'Vietnam': '🇻🇳', 'VIE': '🇻🇳',
    'India': '🇮🇳', 'IND': '🇮🇳',
    'Philippines': '🇵🇭', 'PHI': '🇵🇭',
    'Malaysia': '🇲🇾', 'MAS': '🇲🇾',
    'Indonesia': '🇮🇩', 'INA': '🇮🇩',
    'Mongolia': '🇲🇳', 'MGL': '🇲🇳',
    'Macau, China': '🇲🇴', 'MAC': '🇲🇴',
    'Qatar': '🇶🇦', 'QAT': '🇶🇦',
    'Kuwait': '🇰🇼', 'KUW': '🇰🇼',
    'Bahrain': '🇧🇭', 'BRN': '🇧🇭',
    'IR Iran': '🇮🇷', 'IRI': '🇮🇷',
    'Uzbekistan': '🇺🇿', 'UZB': 'UZB',
    'Pakistan': '🇵🇰', 'PAK': '🇵🇰'
  };

  function getFlag(c) {
    if (!c) return '🏊';
    return SWM_FLAGS[c] || (typeof window.getFlagEmoji === 'function' ? window.getFlagEmoji(c) : '🏊');
  }

  function formatTimeDisplay(timeJst, timeIst) {
    var tz = (typeof window.currentTimezone !== 'undefined' ? window.currentTimezone : 'JST');
    if (tz === 'IST' && timeIst) {
      return timeIst + ' IST';
    }
    return (timeJst || '--:--') + ' JST';
  }

  // --- Filter and Search Logic ---
  function filterEvents(events, currentGender) {
    if (!Array.isArray(events)) return [];
    var curGen = String(currentGender || (typeof window !== 'undefined' && window.currentGender) || 'men').toLowerCase();

    return events.filter(function (ev) {
      // 1. Gender check
      var evGen = String(ev.gender || '').toLowerCase();
      if (curGen === 'men' && evGen !== 'men') return false;
      if (curGen === 'women' && evGen !== 'women') return false;
      if (curGen === 'mixed' && evGen !== 'mixed') return false;

      // 2. Day Filter
      if (activeDayFilter !== 'all') {
        var hasDay = (ev.dates || []).includes(activeDayFilter) || ev.date === activeDayFilter;
        if (!hasDay) return false;
      }

      // 3. Stroke Filter
      if (activeStrokeFilter !== 'all') {
        var nameLower = (ev.name || '').toLowerCase();
        if (activeStrokeFilter === 'freestyle' && !nameLower.includes('freestyle')) return false;
        if (activeStrokeFilter === 'backstroke' && !nameLower.includes('backstroke')) return false;
        if (activeStrokeFilter === 'breaststroke' && !nameLower.includes('breaststroke')) return false;
        if (activeStrokeFilter === 'butterfly' && !nameLower.includes('butterfly')) return false;
        if (activeStrokeFilter === 'medley' && !nameLower.includes('medley')) return false;
        if (activeStrokeFilter === 'relays' && (!nameLower.includes('relay') && !nameLower.includes('4 x'))) return false;
      }

      // 4. Text Search
      if (activeSearchQuery.trim()) {
        var q = activeSearchQuery.toLowerCase();
        var matchName = (ev.name || '').toLowerCase().includes(q);
        var matchVenue = (ev.venue || '').toLowerCase().includes(q);
        var matchPodium = false;
        if (ev.podium) {
          matchPodium = Object.values(ev.podium).some(function (p) {
            return p && ((p.athlete || '').toLowerCase().includes(q) || (p.country || '').toLowerCase().includes(q));
          });
        }
        var matchAthlete = false;
        (ev.finals || []).concat(ev.heats || []).forEach(function (u) {
          (u.results || []).forEach(function (r) {
            if ((r.name || '').toLowerCase().includes(q) || (r.country || '').toLowerCase().includes(q) || (r.org || '').toLowerCase().includes(q)) {
              matchAthlete = true;
            }
          });
        });
        if (!matchName && !matchVenue && !matchPodium && !matchAthlete) return false;
      }

      return true;
    });
  }

  // --- Main Schedule & Events Renderer ---
  function renderMatches(events) {
    if (!events || events.length === 0) {
      return '<div class="empty-state">No swimming events data available.</div>';
    }

    // Cache events by ID for instant interactive lookups
    events.forEach(function (ev) {
      swimmingEventsCache[ev.id] = ev;
    });

    var curGender = String((typeof window !== 'undefined' && window.currentGender) || 'men').toLowerCase();
    var filtered = filterEvents(events, curGender);

    var genderTitle = curGender === 'men' ? "Men's Events (20 Medal Events)" : (curGender === 'women' ? "Women's Events (20 Medal Events)" : "Mixed Event (1 Medal Event)");

    var dayPills = [
      { id: 'all', label: 'All Days' },
      { id: '2026-09-20', label: 'Day 1 • Sep 20' },
      { id: '2026-09-21', label: 'Day 2 • Sep 21' },
      { id: '2026-09-22', label: 'Day 3 • Sep 22' },
      { id: '2026-09-23', label: 'Day 4 • Sep 23' },
      { id: '2026-09-24', label: 'Day 5 • Sep 24' },
      { id: '2026-09-25', label: 'Day 6 • Sep 25' }
    ].map(function (d) {
      var isActive = activeDayFilter === d.id;
      return '<button style="padding:6px 12px; font-size:0.75rem; font-weight:700; border-radius:8px; border:none; cursor:pointer; transition:all 0.15s; background:' + (isActive ? '#2563eb' : 'rgba(255,255,255,0.06)') + '; color:' + (isActive ? '#ffffff' : '#94a3b8') + ';" onclick="window.setSwimmingDayFilter(\'' + d.id + '\')">' + d.label + '</button>';
    }).join('');

    var strokePills = [
      { id: 'all', label: 'All Strokes' },
      { id: 'freestyle', label: '🏊 Freestyle' },
      { id: 'backstroke', label: '🏊 Backstroke' },
      { id: 'breaststroke', label: '🏊 Breaststroke' },
      { id: 'butterfly', label: '🦋 Butterfly' },
      { id: 'medley', label: '⚡ Medley' },
      { id: 'relays', label: '👥 Relays' }
    ].map(function (s) {
      var isActive = activeStrokeFilter === s.id;
      return '<button style="padding:4px 10px; font-size:0.72rem; font-weight:600; border-radius:6px; border:1px solid ' + (isActive ? '#38bdf8' : 'rgba(255,255,255,0.08)') + '; cursor:pointer; transition:all 0.15s; background:' + (isActive ? 'rgba(56,189,248,0.15)' : 'transparent') + '; color:' + (isActive ? '#38bdf8' : '#94a3b8') + ';" onclick="window.setSwimmingStrokeFilter(\'' + s.id + '\')">' + s.label + '</button>';
    }).join('');

    var html = `
      <!-- Venue & Qualification Rules Banner -->
      <div style="background:linear-gradient(135deg, rgba(37,99,235,0.18), rgba(15,23,42,0.9)); border:1px solid rgba(59,130,246,0.3); border-radius:12px; padding:1.15rem 1.25rem; margin-bottom:1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:0.75rem;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.6rem;">🏊</span>
            <div>
              <div style="font-size:1.05rem; font-weight:800; color:#f8fafc;">Asian Games 2026 Swimming Championships</div>
              <div style="font-size:0.76rem; color:#93c5fd; margin-top:2px;">
                Tokyo Aquatics Centre • 10-Lane Olympic Competition Pool • 41 Medal Events
              </div>
            </div>
          </div>
          <div style="background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:4px 10px; font-size:0.73rem; color:#cbd5e1; font-weight:600;">
            ${genderTitle}
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px; background:rgba(0,0,0,0.3); border-radius:8px; padding:0.75rem 1rem; border:1px solid rgba(255,255,255,0.06); font-size:0.73rem;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:#facc15; font-size:1rem;">🏅</span>
            <div>
              <strong style="color:#f8fafc;">Individual Finals (10 Athletes):</strong>
              <div style="color:#94a3b8;">Top 10 fastest times across heats advance to Final (Lanes 0–9).</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:#38bdf8; font-size:1rem;">👥</span>
            <div>
              <strong style="color:#f8fafc;">Relay Finals (8 Teams):</strong>
              <div style="color:#94a3b8;">Top 8 fastest relay squads advance to Final (Lanes 1–8).</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="color:#4ade80; font-size:1rem;">⏱️</span>
            <div>
              <strong style="color:#f8fafc;">Distance Timed Finals:</strong>
              <div style="color:#94a3b8;">800m & 1500m direct timed heats (Fast Heat in evening).</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1rem; margin-bottom:1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:0.85rem;">
          <div style="display:flex; gap:6px; flex-wrap:wrap; overflow-x:auto;">
            ${dayPills}
          </div>
          <div style="position:relative; min-width:220px;">
            <input 
              type="text" 
              placeholder="🔍 Search athlete, country, event..." 
              value="${activeSearchQuery}"
              oninput="window.setSwimmingSearch(this.value)"
              style="width:100%; background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.12); border-radius:8px; padding:7px 12px; font-size:0.78rem; color:#f8fafc; outline:none;"
            />
          </div>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
          <span style="font-size:0.7rem; font-weight:700; color:#64748b; text-transform:uppercase;">Stroke Filter:</span>
          ${strokePills}
        </div>
      </div>

      <!-- Events List -->
      <div class="swimming-events-container" style="display:flex; flex-direction:column; gap:1.25rem;">
        ${filtered.length === 0 ? `
          <div style="text-align:center; padding:3rem 1rem; color:#94a3b8; background:var(--card-bg, #131c2e); border-radius:12px; border:1px solid rgba(255,255,255,0.08);">
            No swimming events matched your selected filter criteria.
          </div>
        ` : filtered.map(renderEventCard).join('')}
      </div>

      <!-- Modal Root for Clickable Unit Results -->
      <div id="swimming-unit-modal-root"></div>
    `;

    return html;
  }

  // --- Render Single Event Card with Clickable Heats & Finals ---
  function renderEventCard(ev) {
    var isOfficial = ev.status === 'Official';
    var isLive = ev.status === 'Live';
    var statusBadge = isOfficial 
      ? '<span style="background:rgba(74,222,128,0.15); color:#4ade80; border:1px solid rgba(74,222,128,0.3); padding:3px 9px; border-radius:6px; font-size:0.72rem; font-weight:700;">🟢 Official Results</span>'
      : (isLive 
          ? '<span style="background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3); padding:3px 9px; border-radius:6px; font-size:0.72rem; font-weight:700;">🔴 Live in Pool</span>'
          : '<span style="background:rgba(148,163,184,0.15); color:#94a3b8; border:1px solid rgba(148,163,184,0.25); padding:3px 9px; border-radius:6px; font-size:0.72rem; font-weight:600;">⚪ Scheduled</span>');

    var p = ev.podium || {};
    var hasPodium = isOfficial && (p.gold || p.silver || p.bronze);

    var podiumHtml = '';
    if (hasPodium) {
      podiumHtml = `
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:8px; margin:0.85rem 0; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:0.75rem 1rem;">
          ${p.gold ? `
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.3rem;">🥇</span>
              <div>
                <div style="font-size:0.68rem; font-weight:700; color:#facc15; text-transform:uppercase;">Gold Medalist</div>
                <div style="font-size:0.85rem; font-weight:800; color:#f8fafc;">
                  ${getFlag(p.gold.country)} ${p.gold.athlete}
                </div>
                <div style="font-size:0.72rem; color:#94a3b8; font-family:monospace; margin-top:1px;">
                  ${p.gold.time} ${p.gold.record ? `<span style="background:rgba(234,179,8,0.2); color:#facc15; padding:1px 4px; border-radius:3px; font-size:0.65rem; font-weight:700;">${p.gold.record}</span>` : ''}
                </div>
              </div>
            </div>
          ` : ''}
          ${p.silver ? `
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.3rem;">🥈</span>
              <div>
                <div style="font-size:0.68rem; font-weight:700; color:#cbd5e1; text-transform:uppercase;">Silver Medalist</div>
                <div style="font-size:0.85rem; font-weight:800; color:#f8fafc;">
                  ${getFlag(p.silver.country)} ${p.silver.athlete}
                </div>
                <div style="font-size:0.72rem; color:#94a3b8; font-family:monospace; margin-top:1px;">
                  ${p.silver.time}
                </div>
              </div>
            </div>
          ` : ''}
          ${p.bronze ? `
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:1.3rem;">🥉</span>
              <div>
                <div style="font-size:0.68rem; font-weight:700; color:#f59e0b; text-transform:uppercase;">Bronze Medalist</div>
                <div style="font-size:0.85rem; font-weight:800; color:#f8fafc;">
                  ${getFlag(p.bronze.country)} ${p.bronze.athlete}
                </div>
                <div style="font-size:0.72rem; color:#94a3b8; font-family:monospace; margin-top:1px;">
                  ${p.bronze.time}
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }

    // Interactive clickable units (Heats and Finals)
    var heatsHtml = (ev.heats || []).map(function (h) {
      var isFin = h.status === 'OFFICIAL' || h.status === 'Finished';
      var timeStr = formatTimeDisplay(h.timeJst, h.timeIst);
      var partCount = h.participantCount || (h.results ? h.results.length : 0);
      return `
        <button 
          class="swm-unit-btn" 
          onclick="window.openSwimmingUnitModal('${escapeAttr(ev.id)}', '${escapeAttr(h.id)}')"
          style="display:inline-flex; align-items:center; gap:6px; background:rgba(30,41,59,0.7); hover:background:rgba(51,65,85,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:7px 12px; color:#cbd5e1; font-size:0.75rem; font-weight:600; cursor:pointer; transition:all 0.15s;"
        >
          <span>🏊</span>
          <span>${h.unitDesc || ('Heat ' + h.unitNum)}</span>
          <span style="color:#64748b; font-size:0.7rem;">(${partCount} swimmers)</span>
          <span style="color:#38bdf8; font-family:monospace; font-size:0.7rem; margin-left:2px;">${timeStr}</span>
          ${isFin ? '<span style="color:#4ade80; font-size:0.68rem;">✓</span>' : ''}
        </button>
      `;
    }).join('');

    var finalsHtml = (ev.finals || []).map(function (f) {
      var isFin = f.status === 'OFFICIAL' || f.status === 'Finished';
      var timeStr = formatTimeDisplay(f.timeJst, f.timeIst);
      var partCount = f.participantCount || (f.results ? f.results.length : 0);
      var isGoldMedal = f.unitDesc.toLowerCase().includes('final');
      return `
        <button 
          class="swm-unit-btn swm-final-btn" 
          onclick="window.openSwimmingUnitModal('${escapeAttr(ev.id)}', '${escapeAttr(f.id)}')"
          style="display:inline-flex; align-items:center; gap:6px; background:linear-gradient(135deg, rgba(234,179,8,0.18), rgba(30,41,59,0.85)); border:1px solid rgba(234,179,8,0.4); border-radius:8px; padding:7px 14px; color:#fef08a; font-size:0.75rem; font-weight:700; cursor:pointer; transition:all 0.15s;"
        >
          <span>${isGoldMedal ? '🏆' : '🔥'}</span>
          <span>${f.unitDesc}</span>
          <span style="color:#fde047; font-size:0.7rem;">(${partCount} finalists)</span>
          <span style="color:#38bdf8; font-family:monospace; font-size:0.7rem; margin-left:2px;">${timeStr}</span>
          ${isFin ? '<span style="color:#4ade80; font-size:0.72rem;">✓ Official</span>' : ''}
        </button>
      `;
    }).join('');

    var datesStr = (ev.dates || [ev.date || '']).join(' • ');

    return `
      <div class="swimming-event-card" style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.25rem; transition:border 0.2s;">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.75rem;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.4rem;">🏊</span>
            <div>
              <div style="font-size:1.05rem; font-weight:800; color:#f8fafc;">${ev.name}</div>
              <div style="font-size:0.74rem; color:#94a3b8; margin-top:2px;">
                📅 ${datesStr} • 📍 ${ev.venue || 'Tokyo Aquatics Centre'}
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            ${statusBadge}
          </div>
        </div>

        <!-- Official Podium Summary (if completed) -->
        ${podiumHtml}

        <!-- Clickable Heats & Finals Row -->
        <div style="margin-top:0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <span style="font-size:0.72rem; font-weight:700; color:#64748b; text-transform:uppercase;">
              Interactive Units (Click to view full lane results & splits):
            </span>
            <span style="font-size:0.7rem; color:#38bdf8;">
              👆 Click Heat or Final to open results
            </span>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
            ${finalsHtml}
            ${heatsHtml}
          </div>
        </div>
      </div>
    `;
  }

  // --- Interactive Results Modal (Clickable Heats & Finals) ---
  window.openSwimmingUnitModal = function (eventId, unitId) {
    var ev = swimmingEventsCache[eventId];
    if (!ev) return;

    var unit = null;
    (ev.finals || []).forEach(function (f) {
      if (f.id === unitId) unit = f;
    });
    if (!unit) {
      (ev.heats || []).forEach(function (h) {
        if (h.id === unitId) unit = h;
      });
    }
    if (!unit) return;

    var modalRoot = document.getElementById('swimming-unit-modal-root');
    if (!modalRoot) return;

    var isFinal = unit.isFinal;
    var results = unit.results || [];
    var isRelay = (ev.name || '').includes('Relay') || (ev.name || '').includes('4 x');
    var qualNote = isFinal 
      ? 'Tokyo Aquatics Centre Final • Medals decided by official finish times.'
      : (isRelay ? 'Top 8 fastest relay squads across all heats advance to the Final.' : 'Top 10 fastest swimmers across all heats advance to the Final (Lanes 0–9).');

    var rowsHtml = results.length === 0 ? `
      <tr>
        <td colspan="8" style="text-align:center; padding:2.5rem 1rem; color:#94a3b8;">
          Start list / Results for this session will be officially updated when available.
        </td>
      </tr>
    ` : results.map(function (r, idx) {
      var isMedalist = isFinal && (r.rank === '1' || r.rank === '2' || r.rank === '3' || r.medal);
      var medIcon = r.medal === 'Gold' || r.rank === '1' ? '🥇' : (r.medal === 'Silver' || r.rank === '2' ? '🥈' : (r.medal === 'Bronze' || r.rank === '3' ? '🥉' : ''));
      var rankBadge = medIcon ? `<span style="font-size:1.15rem; margin-right:4px;">${medIcon}</span><strong style="color:#f8fafc;">${r.rank}</strong>` : `<strong style="color:#94a3b8;">${r.rank || idx + 1}</strong>`;

      var qualBadge = r.qual ? `<span style="background:rgba(56,189,248,0.18); border:1px solid rgba(56,189,248,0.4); color:#38bdf8; font-weight:700; padding:2px 6px; border-radius:4px; font-size:0.68rem;">${r.qual}</span>` : '';
      var recBadge = r.record ? `<span style="background:rgba(234,179,8,0.2); border:1px solid rgba(234,179,8,0.5); color:#facc15; font-weight:800; padding:2px 6px; border-radius:4px; font-size:0.68rem;">${r.record}</span>` : '';

      var splitsCount = (r.splits || []).length;
      var hasSplits = splitsCount > 0;
      var rowId = 'splits-row-' + idx;

      return `
        <tr style="background:${isMedalist ? 'rgba(234,179,8,0.04)' : 'transparent'}; border-bottom:1px solid rgba(255,255,255,0.06);">
          <td style="text-align:center; padding:9px 6px; font-family:monospace;">${rankBadge}</td>
          <td style="text-align:center; padding:9px 6px;">
            <span style="background:rgba(255,255,255,0.08); border-radius:4px; padding:2px 7px; font-size:0.75rem; font-weight:700; color:#e2e8f0;">Lane ${r.lane || '--'}</span>
          </td>
          <td style="text-align:left; padding:9px 8px; font-weight:600;">
            <div style="display:flex; align-items:center; gap:6px;">
              <span>${getFlag(r.country)}</span>
              <div>
                <span style="color:#f8fafc; font-size:0.85rem;">${r.name || 'TBD'}</span>
                <span style="color:#94a3b8; font-size:0.72rem; font-weight:400; margin-left:4px;">(${r.country || r.org})</span>
              </div>
            </div>
          </td>
          <td style="text-align:center; padding:9px 6px; font-family:monospace; font-weight:700; font-size:0.9rem; color:${r.time ? '#f8fafc' : '#64748b'};">
            ${r.time || 'Awaiting'}
          </td>
          <td style="text-align:center; padding:9px 6px; font-family:monospace; font-size:0.75rem; color:#94a3b8;">
            ${r.diff || '--'}
          </td>
          <td style="text-align:center; padding:9px 6px; font-family:monospace; font-size:0.75rem; color:#cbd5e1;">
            ${r.reaction ? r.reaction + 's' : '--'}
          </td>
          <td style="text-align:center; padding:9px 6px;">
            <div style="display:flex; justify-content:center; gap:4px; flex-wrap:wrap;">
              ${qualBadge}
              ${recBadge}
              ${hasSplits ? `
                <button 
                  onclick="window.toggleSwimmingSplits('${rowId}')" 
                  style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:4px; color:#38bdf8; font-size:0.68rem; padding:2px 6px; cursor:pointer;"
                >
                  ⏱️ Splits
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
        ${hasSplits ? `
          <tr id="${rowId}" style="display:none; background:rgba(0,0,0,0.4); border-bottom:1px solid rgba(255,255,255,0.08);">
            <td colspan="7" style="padding:8px 16px;">
              <div style="font-size:0.7rem; font-weight:700; color:#64748b; margin-bottom:4px; text-transform:uppercase;">Interval Splits:</div>
              <div style="display:flex; flex-wrap:wrap; gap:8px;">
                ${r.splits.map(function (s) {
                  return `
                    <div style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:4px; padding:3px 8px; font-size:0.72rem; font-family:monospace;">
                      <span style="color:#94a3b8;">${s.distance}:</span> <strong style="color:#f8fafc;">${s.split}</strong>
                      <span style="color:#64748b; font-size:0.68rem;">(Acc: ${s.accumulated})</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </td>
          </tr>
        ` : ''}
      `;
    }).join('');

    modalRoot.innerHTML = `
      <div 
        id="swimming-modal-overlay" 
        onclick="if(event.target.id==='swimming-modal-overlay') window.closeSwimmingModal()" 
        style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(11,15,25,0.85); backdrop-filter:blur(6px); z-index:99999; display:flex; justify-content:center; align-items:center; padding:16px;"
      >
        <div style="background:#131c2e; border:1px solid rgba(255,255,255,0.15); border-radius:14px; width:100%; max-width:860px; max-height:90vh; display:flex; flex-direction:column; box-shadow:0 25px 50px -12px rgba(0,0,0,0.6); overflow:hidden;">
          <!-- Modal Header -->
          <div style="padding:1.15rem 1.25rem; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg, rgba(30,58,138,0.25), rgba(19,28,46,0.9));">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.4rem;">${isFinal ? '🏆' : '🏊'}</span>
                <div>
                  <h3 style="margin:0; font-size:1.1rem; font-weight:800; color:#f8fafc;">
                    ${ev.name} • ${unit.unitDesc}
                  </h3>
                  <div style="font-size:0.75rem; color:#93c5fd; margin-top:2px;">
                    📅 ${unit.date} • ⏰ ${formatTimeDisplay(unit.timeJst, unit.timeIst)} • 📍 ${ev.venue || 'Tokyo Aquatics Centre'}
                  </div>
                </div>
              </div>
            </div>
            <button 
              onclick="window.closeSwimmingModal()" 
              style="background:rgba(255,255,255,0.08); border:none; color:#f8fafc; font-size:1.1rem; width:34px; height:34px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s;"
            >
              ✕
            </button>
          </div>

          <!-- Qualification & Pool Note -->
          <div style="background:rgba(0,0,0,0.25); border-bottom:1px solid rgba(255,255,255,0.05); padding:0.6rem 1.25rem; font-size:0.74rem; color:#94a3b8; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <span>ℹ️ <strong>Rule:</strong> ${qualNote}</span>
            <span style="color:#4ade80; font-weight:700;">Status: ${unit.status}</span>
          </div>

          <!-- Table Container -->
          <div style="overflow-y:auto; padding:1rem; flex:1;">
            <table style="width:100%; border-collapse:collapse; font-size:0.8rem;">
              <thead>
                <tr style="background:rgba(0,0,0,0.3); font-size:0.72rem; color:#94a3b8; text-transform:uppercase;">
                  <th style="padding:8px 6px; width:8%; text-align:center;">Rk</th>
                  <th style="padding:8px 6px; width:12%; text-align:center;">Lane</th>
                  <th style="padding:8px 8px; width:38%; text-align:left;">Athlete & NOC</th>
                  <th style="padding:8px 6px; width:14%; text-align:center;">Time</th>
                  <th style="padding:8px 6px; width:10%; text-align:center;">Diff</th>
                  <th style="padding:8px 6px; width:8%; text-align:center;">RT</th>
                  <th style="padding:8px 6px; width:10%; text-align:center;">Qual</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Modal Footer -->
          <div style="padding:0.75rem 1.25rem; border-top:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.25); display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; color:#64748b;">
            <span>Official Timing & Scoring: Asian Games 2026 Aquatics System</span>
            <button 
              onclick="window.closeSwimmingModal()" 
              style="background:#2563eb; color:#fff; border:none; padding:6px 16px; border-radius:6px; font-weight:700; cursor:pointer;"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.style.overflow = 'hidden';
  };

  window.closeSwimmingModal = function () {
    var modalRoot = document.getElementById('swimming-unit-modal-root');
    if (modalRoot) {
      modalRoot.innerHTML = '';
    }
    document.body.style.overflow = '';
  };

  window.toggleSwimmingSplits = function (rowId) {
    var row = document.getElementById(rowId);
    if (!row) return;
    row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
  };

  window.setSwimmingDayFilter = function (day) {
    activeDayFilter = day;
    if (typeof window.renderMatchesView === 'function' && window.currentTab === 'matches') {
      var container = document.getElementById('content-cards');
      var curGen = String((typeof window !== 'undefined' && window.currentGender) || 'men').toLowerCase();
      var dataList = curGen === 'men' ? window.appData.menMatches : (curGen === 'women' ? window.appData.womenMatches : window.appData.mixedMatches);
      window.renderMatchesView(container, dataList);
    }
  };

  window.setSwimmingStrokeFilter = function (stroke) {
    activeStrokeFilter = stroke;
    if (typeof window.renderMatchesView === 'function' && window.currentTab === 'matches') {
      var container = document.getElementById('content-cards');
      var curGen = String((typeof window !== 'undefined' && window.currentGender) || 'men').toLowerCase();
      var dataList = curGen === 'men' ? window.appData.menMatches : (curGen === 'women' ? window.appData.womenMatches : window.appData.mixedMatches);
      window.renderMatchesView(container, dataList);
    }
  };

  window.setSwimmingSearch = function (q) {
    activeSearchQuery = q;
    if (typeof window.renderMatchesView === 'function' && window.currentTab === 'matches') {
      var container = document.getElementById('content-cards');
      var curGen = String((typeof window !== 'undefined' && window.currentGender) || 'men').toLowerCase();
      var dataList = curGen === 'men' ? window.appData.menMatches : (curGen === 'women' ? window.appData.womenMatches : window.appData.mixedMatches);
      window.renderMatchesView(container, dataList);
    }
  };

  // Close modal on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      window.closeSwimmingModal();
    }
  });

  // --- Medal Analytics Engine Hook ---
  function extractMedalAnalytics(menEvents, womenEvents, menPreds, womenPreds, mixedEvents, mixedPreds, currentGender) {
    var curGen = String(currentGender || (typeof window !== 'undefined' && window.currentGender) || 'men').toLowerCase();
    var allEvents = [];
    if (curGen === 'all') {
      allEvents = (menEvents || []).concat(womenEvents || []).concat(mixedEvents || []);
    } else if (curGen === 'men') {
      allEvents = menEvents || [];
    } else if (curGen === 'women') {
      allEvents = womenEvents || [];
    } else {
      allEvents = mixedEvents || [];
    }

    // Actual medals won tally
    var actualTally = {};
    var decidedCount = 0;
    var totalMedalEvents = (allEvents || []).length;

    allEvents.forEach(function (ev) {
      var p = ev.podium || {};
      if (p.gold) {
        decidedCount++;
        var gTeam = p.gold.country || p.gold.org || 'China';
        actualTally[gTeam] = actualTally[gTeam] || { gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
        actualTally[gTeam].gold += 1;
        actualTally[gTeam].total += 1;
        actualTally[gTeam].athletes.push({ medal: '🥇', athlete: p.gold.athlete + ' (' + ev.name + ')' });
      }
      if (p.silver) {
        var sTeam = p.silver.country || p.silver.org || 'Japan';
        actualTally[sTeam] = actualTally[sTeam] || { gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
        actualTally[sTeam].silver += 1;
        actualTally[sTeam].total += 1;
        actualTally[sTeam].athletes.push({ medal: '🥈', athlete: p.silver.athlete + ' (' + ev.name + ')' });
      }
      if (p.bronze) {
        var bTeam = p.bronze.country || p.bronze.org || 'Korea';
        actualTally[bTeam] = actualTally[bTeam] || { gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
        actualTally[bTeam].bronze += 1;
        actualTally[bTeam].total += 1;
        actualTally[bTeam].athletes.push({ medal: '🥉', athlete: p.bronze.athlete + ' (' + ev.name + ')' });
      }
    });

    // Projected medals tally (baseline Monte Carlo expectations)
    var projectedTally = {
      'China': { gold: curGen === 'men' ? 11 : (curGen === 'women' ? 14 : 1), silver: 8, bronze: 6, total: 25 },
      'Japan': { gold: curGen === 'men' ? 5 : (curGen === 'women' ? 4 : 0), silver: 7, bronze: 8, total: 20 },
      'Korea': { gold: curGen === 'men' ? 4 : (curGen === 'women' ? 2 : 0), silver: 4, bronze: 5, total: 11 },
      'Hong Kong, China': { gold: 0, silver: 1, bronze: 1, total: 2 },
      'Singapore': { gold: 0, silver: 0, bronze: 1, total: 1 },
      'Chinese Taipei': { gold: 0, silver: 0, bronze: 1, total: 1 }
    };

    var nations = Array.from(new Set(Object.keys(actualTally).concat(Object.keys(projectedTally))));

    var comparisonTable = nations.map(function (nat) {
      var act = actualTally[nat] || { gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
      var prj = projectedTally[nat] || { gold: 0, silver: 0, bronze: 0, total: 0 };
      var delta = act.total - prj.total;
      var status = delta > 0 ? '🟢 Overperforming' : (delta < 0 ? '🟡 Below Projection' : '⚪ On Pace');

      return {
        name: nat,
        flag: getFlag(nat),
        isHost: nat.toLowerCase().includes('japan'),
        actual: act,
        projected: prj,
        deltaTotal: delta > 0 ? '+' + delta : String(delta),
        status: status,
        athletes: act.athletes
      };
    }).sort(function (a, b) {
      return (b.actual.gold - a.actual.gold) || (b.actual.total - a.actual.total) || (b.projected.gold - a.projected.gold);
    });

    var actualTable = comparisonTable.filter(function (r) { return r.actual.total > 0; });
    var projectedTable = comparisonTable.filter(function (r) { return r.projected.total > 0; }).sort(function (a, b) {
      return (b.projected.gold - a.projected.gold) || (b.projected.total - a.projected.total);
    });

    // Prediction events definitions for podium view
    var predEvents = (window.appData && window.appData.predictionEvents) || [];
    var eventCards = allEvents.map(function (ev) {
      var pDef = predEvents.find(function (pe) { return pe.id === ev.id; }) || {};
      var p = ev.podium || {};
      return {
        id: ev.id,
        name: ev.name,
        shortName: ev.name,
        icon: '🏊',
        gender: ev.gender,
        type: ev.name.includes('Relay') ? 'team' : 'individual',
        status: ev.status,
        rankings: pDef.rankings || [],
        goldScoreInfo: p.gold ? p.gold.time : '',
        bronzeScoreInfo: p.bronze ? p.bronze.time : '',
        actual: {
          gold: p.gold ? { name: p.gold.country, athlete: p.gold.athlete, flag: getFlag(p.gold.country) } : null,
          silver: p.silver ? { name: p.silver.country, athlete: p.silver.athlete, flag: getFlag(p.silver.country) } : null,
          bronze: p.bronze ? { name: p.bronze.country, athlete: p.bronze.athlete, flag: getFlag(p.bronze.country) } : null
        },
        projected: {
          gold: (pDef.rankings && pDef.rankings[0]) ? { name: pDef.rankings[0].team, athlete: pDef.rankings[0].athlete, flag: getFlag(pDef.rankings[0].team), goldProb: pDef.rankings[0].gold } : null,
          silver: (pDef.rankings && pDef.rankings[1]) ? { name: pDef.rankings[1].team, athlete: pDef.rankings[1].athlete, flag: getFlag(pDef.rankings[1].team), silverProb: pDef.rankings[1].silver } : null,
          bronze: (pDef.rankings && pDef.rankings[2]) ? { name: pDef.rankings[2].team, athlete: pDef.rankings[2].athlete, flag: getFlag(pDef.rankings[2].team), bronzeProb: pDef.rankings[2].bronze } : null
        },
        evaluation: {
          decidedCount: p.gold ? 1 : 0,
          exactHits: (p.gold && pDef.rankings && pDef.rankings[0] && (p.gold.athlete === pDef.rankings[0].athlete || p.gold.country === pDef.rankings[0].team)) ? 1 : 0,
          accuracyPct: 100,
          goldHit: (p.gold && pDef.rankings && pDef.rankings[0] && (p.gold.athlete === pDef.rankings[0].athlete || p.gold.country === pDef.rankings[0].team)),
          silverHit: (p.silver && pDef.rankings && pDef.rankings[1] && (p.silver.athlete === pDef.rankings[1].athlete || p.silver.country === pDef.rankings[1].team))
        }
      };
    });

    var exactHits = eventCards.filter(function (e) { return e.evaluation && e.evaluation.goldHit; }).length;
    var accPct = decidedCount > 0 ? Math.round((exactHits / decidedCount) * 100) : null;

    return {
      kpi: {
        decidedMedals: decidedCount * 3,
        totalMedalsInSport: totalMedalEvents * 3,
        accuracyPct: accPct,
        exactHits: exactHits
      },
      comparisonTable: comparisonTable,
      actualTable: actualTable,
      projectedTable: projectedTable,
      events: eventCards
    };
  }

  // --- Engine Definition ---
  var SWIMMING_ENGINE = {
    icon: '🏊',
    hasBracket: false,
    hasStandings: false,
    renderMatches: renderMatches,
    extractMedalAnalytics: extractMedalAnalytics
  };

  window.SPORT_ENGINES['swimming'] = SWIMMING_ENGINE;
  window.SPORT_ENGINES['Swimming'] = SWIMMING_ENGINE;
})();
