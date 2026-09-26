// ==========================================================================
// Asian Games 2026: Swimming Sport Engine (41 Medal Events: 20 Men | 20 Women | 1 Mixed)
// Tokyo Aquatics Centre 10-Lane Olympic Pool (Standard Layout with Event Dropdown)
// ==========================================================================

(function () {
  window.SPORT_ENGINES = window.SPORT_ENGINES || {};

  var swimmingEventsCache = {};
  var activeSwimmingEventFilter = 'all';

  function escapeAttr(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeHtml(str) {
    return escapeAttr(str);
  }

  function isOfficialStatus(status) {
    return ['OFFICIAL', 'OFFICIAL_RESULTS', 'FINISHED'].includes(String(status || '').toUpperCase());
  }

  function displayPodiumAthletes(medal) {
    if (!medal) return '';
    var entries = Array.isArray(medal.tiedMedalists) ? medal.tiedMedalists : [medal];
    return entries.map(function (entry) { return entry.athlete || 'Unknown'; }).join(' / ');
  }

  function mergeSwimmingEvents(events) {
    var merged = [];
    var byKey = {};
    (events || []).forEach(function (event) {
      if (!event) return;
      var eventName = String(event.name || event.event || '').trim();
      var key = String(event.id || eventName).toLowerCase().replace(/\s+/g, ' ');
      if (!key) return;
      var existing = byKey[key];
      if (!existing) {
        existing = Object.assign({}, event, {
          heats: (event.heats || []).slice(),
          finals: (event.finals || []).slice(),
          dates: (event.dates || []).slice()
        });
        byKey[key] = existing;
        merged.push(existing);
        return;
      }

      var addUnits = function (target, source) {
        var known = new Set(target.map(function (unit) { return unit.id; }));
        (source || []).forEach(function (unit) {
          if (!known.has(unit.id)) {
            target.push(unit);
            known.add(unit.id);
          }
        });
      };
      addUnits(existing.heats, event.heats);
      addUnits(existing.finals, event.finals);
      existing.dates = Array.from(new Set(existing.dates.concat(event.dates || []))).sort();
      if (isOfficialStatus(event.status)) existing.status = 'Official';
      if (!existing.podium || !existing.podium.gold) existing.podium = event.podium || existing.podium;
    });
    return merged;
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

  // --- Main Schedule & Events Renderer (Standard Hub Layout with Event Dropdown) ---
  function renderMatches(events) {
    events = mergeSwimmingEvents(events);
    if (!events || events.length === 0) {
      return '<div class="empty-state">No swimming events data available.</div>';
    }

    // Cache events by ID for instant interactive lookups
    events.forEach(function (ev) {
      swimmingEventsCache[ev.id] = ev;
    });

    var curGender = String((typeof window !== 'undefined' && window.currentGender) || 'men').toLowerCase();

    // Filter events by gender
    var genderEvents = events.filter(function (ev) {
      var evGen = String(ev.gender || '').toLowerCase();
      if (curGender === 'men') return evGen === 'men' || (!evGen && (ev.name || '').includes("Men's"));
      if (curGender === 'women') return evGen === 'women' || (!evGen && (ev.name || '').includes("Women's"));
      if (curGender === 'mixed') return evGen === 'mixed' || (!evGen && (ev.name || '').includes("Mixed"));
      return true;
    });

    if (genderEvents.length === 0) {
      return '<div class="empty-state">No swimming events available for this category.</div>';
    }

    // Validate active filter: default to first event in the category (no 'All Events' option)
    var isValidFilter = genderEvents.some(function (e) { return e.id === activeSwimmingEventFilter; });
    if (!isValidFilter && genderEvents.length > 0) {
      activeSwimmingEventFilter = genderEvents[0].id;
    }

    var filtered = genderEvents.filter(function (e) { return e.id === activeSwimmingEventFilter; });
    if (filtered.length === 0 && genderEvents.length > 0) {
      filtered = [genderEvents[0]];
      activeSwimmingEventFilter = genderEvents[0].id;
    }

    var currentIdx = genderEvents.findIndex(function (e) { return e.id === activeSwimmingEventFilter; });
    var indexDisplay = currentIdx >= 0 ? 'Event ' + (currentIdx + 1) + ' of ' + genderEvents.length : genderEvents.length + ' events';

    // Event Dropdown Filter Bar (Standard layout matching other sports)
    var filterBarHtml = `
      <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1.25rem; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:240px;">
          <span style="font-size:0.75rem; font-weight:700; color:#94a3b8; text-transform:uppercase;">Event:</span>
          <div class="event-selector-wrap" style="flex:1;">
            <select class="event-dropdown" onchange="window.setSwimmingEventFilter(this.value)" style="width:100%; max-width:420px;">
              ${genderEvents.map(function (ev) {
                return '<option value="' + escapeAttr(ev.id) + '" ' + (activeSwimmingEventFilter === ev.id ? 'selected' : '') + '>' + escapeHtml(ev.name || ev.event || 'Swimming Event') + '</option>';
              }).join('')}
            </select>
          </div>
        </div>
        <span style="font-size:0.72rem; color:#64748b; font-weight:600;">
          ${indexDisplay}
        </span>
      </div>
    `;

    return `
      ${filterBarHtml}
      <div class="swimming-events-container" style="display:flex; flex-direction:column; gap:1.25rem;">
        ${filtered.map(renderEventCard).join('')}
      </div>
      <div id="swimming-unit-modal-root"></div>
    `;
  }

  function renderStandingsTable(events) {
    var uniqueEvents = mergeSwimmingEvents(events);
    if (uniqueEvents.length === 0) {
      return '<div class="empty-state">No swimming finals available.</div>';
    }

    var validFilter = uniqueEvents.some(function (event) { return event.id === activeSwimmingEventFilter; });
    if (!validFilter) activeSwimmingEventFilter = uniqueEvents[0].id;
    var selectedEvents = uniqueEvents.filter(function (event) { return event.id === activeSwimmingEventFilter; });
    var filterBarHtml = `
      <div style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.75rem 1rem; margin-bottom:1.25rem; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:8px; flex:1; min-width:240px;">
          <span style="font-size:0.75rem; font-weight:700; color:#94a3b8; text-transform:uppercase;">Event:</span>
          <div class="event-selector-wrap" style="flex:1;">
            <select class="event-dropdown" onchange="window.setSwimmingEventFilter(this.value)" style="width:100%; max-width:420px;">
              ${uniqueEvents.map(function (event) {
                return '<option value="' + escapeAttr(event.id) + '" ' + (activeSwimmingEventFilter === event.id ? 'selected' : '') + '>' + escapeHtml(event.name || event.event || 'Swimming Event') + '</option>';
              }).join('')}
            </select>
          </div>
        </div>
        <span style="font-size:0.72rem; color:#64748b; font-weight:600;">Final results only</span>
      </div>
    `;

    var parseResultTime = function (value) {
      var text = String(value || '').trim();
      if (!text || /^(DNS|DSQ|DNF|DNC|--|Awaiting)$/i.test(text)) return Infinity;
      if (text.includes(':')) {
        var parts = text.split(':');
        return (parseFloat(parts[0]) || 0) * 60 + (parseFloat(parts[1]) || 0);
      }
      var seconds = parseFloat(text);
      return isNaN(seconds) ? Infinity : seconds;
    };

    var getFinalResults = function (event) {
      var finals = event.finals || [];
      var isTimedFinal = /(?:800m|1500m)/i.test(String(event.name || event.event || '')) || finals.length > 1;
      if (!isTimedFinal) return (finals[0] && finals[0].results || []).map(function (result, index) {
        return { result: result, medalRank: String(result.rank || index + 1) };
      });

      var byCompetitor = {};
      finals.forEach(function (finalUnit) {
        (finalUnit.results || []).forEach(function (result) {
          var key = String(result.name || result.country || result.org || '').trim().toLowerCase();
          if (!key) return;
          var time = parseResultTime(result.time);
          if (!byCompetitor[key] || time < byCompetitor[key].time) {
            byCompetitor[key] = { result: result, time: time };
          }
        });
      });
      return Object.keys(byCompetitor).map(function (key) { return byCompetitor[key]; })
        .sort(function (a, b) { return a.time - b.time; })
        .map(function (item, index) { return { result: item.result, medalRank: String(index + 1) }; });
    };

    var sections = selectedEvents.map(function (event) {
      if (!event.finals || event.finals.length === 0) return '';
      var rows = getFinalResults(event).map(function (item) {
          var result = item.result;
          var rank = item.medalRank;
          var medal = rank === '1' ? '🥇' : (rank === '2' ? '🥈' : (rank === '3' ? '🥉' : ''));
          return `<tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
            <td style="padding:8px;text-align:center;font-weight:700;">${medal} ${escapeHtml(rank)}</td>
            <td style="padding:8px;font-weight:600;">${escapeHtml(result.name || 'TBD')}</td>
            <td style="padding:8px;color:#94a3b8;">${escapeHtml(result.country || result.org || '--')}</td>
            <td style="padding:8px;text-align:right;font-family:monospace;color:${result.time ? '#f8fafc' : '#facc15'};">${escapeHtml(result.time || result.irm || 'Awaiting')}</td>
          </tr>`;
        }).join('');
      return `<section style="background:var(--card-bg,#131c2e);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:1rem;overflow:hidden;">
        <div style="padding:.8rem 1rem;font-weight:800;color:#f8fafc;border-bottom:1px solid rgba(255,255,255,0.08);">${escapeHtml(event.name || event.event || 'Swimming Event')}</div>
        <table style="width:100%;border-collapse:collapse;font-size:.82rem;"><thead><tr style="color:#94a3b8;text-transform:uppercase;font-size:.7rem;"><th style="padding:8px;text-align:center;">Rank</th><th style="padding:8px;text-align:left;">Athlete / Team</th><th style="padding:8px;text-align:left;">Country</th><th style="padding:8px;text-align:right;">Final Result</th></tr></thead><tbody>${rows}</tbody></table>
      </section>`;
    }).join('');
    return filterBarHtml + (sections || '<div class="empty-state">No swimming finals available.</div>');
  }

  // --- Render Event Card with Heats & Finals Buttons ---
  function renderEventCard(ev) {
    var eventName = String(ev.name || ev.event || 'Swimming Event');
    var isOfficial = isOfficialStatus(ev.status);
    var isLive = String(ev.status || '').toUpperCase() === 'LIVE';
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
                  ${getFlag(p.gold.country)} ${escapeHtml(displayPodiumAthletes(p.gold))}
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
                  ${getFlag(p.silver.country)} ${escapeHtml(displayPodiumAthletes(p.silver))}
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
                  ${getFlag(p.bronze.country)} ${escapeHtml(displayPodiumAthletes(p.bronze))}
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

    // Heats buttons
    var heatsHtml = (ev.heats || []).map(function (h) {
      var isFin = isOfficialStatus(h.status);
      var timeStr = formatTimeDisplay(h.timeJst, h.timeIst);
      var partCount = h.participantCount || (h.results ? h.results.length : 0);
      return `
        <button 
          class="swm-unit-btn" 
          onclick="window.openSwimmingUnitModal('${escapeAttr(ev.id)}', '${escapeAttr(h.id)}')"
          style="display:inline-flex; align-items:center; gap:6px; background:rgba(30,41,59,0.7); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:7px 12px; color:#cbd5e1; font-size:0.75rem; font-weight:600; cursor:pointer; transition:all 0.15s;"
        >
          <span>🏊</span>
          <span>${h.unitDesc || ('Heat ' + h.unitNum)}</span>
          <span style="color:#64748b; font-size:0.7rem;">(${partCount} swimmers)</span>
          <span style="color:#38bdf8; font-family:monospace; font-size:0.7rem; margin-left:2px;">${timeStr}</span>
          ${isFin ? '<span style="color:#4ade80; font-size:0.68rem;">✓</span>' : ''}
        </button>
      `;
    }).join('');

    // Finals buttons
    var finalsHtml = (ev.finals || []).map(function (f, finalIndex) {
      var isFin = isOfficialStatus(f.status);
      var timeStr = formatTimeDisplay(f.timeJst, f.timeIst);
      var partCount = f.participantCount || (f.results ? f.results.length : 0);
      var finalDescription = String(f.unitDesc || 'Final');
      var isTimedFinal = /(?:800m|1500m)/i.test(eventName);
      var finalLabel = isTimedFinal ? 'Timed Final ' + (finalIndex + 1) : finalDescription;
      var isGoldMedal = !isTimedFinal && finalDescription.toLowerCase().includes('final');
      return `
        <button 
          class="swm-unit-btn swm-final-btn" 
          onclick="window.openSwimmingUnitModal('${escapeAttr(ev.id)}', '${escapeAttr(f.id)}')"
          style="display:inline-flex; align-items:center; gap:6px; background:linear-gradient(135deg, rgba(234,179,8,0.18), rgba(30,41,59,0.85)); border:1px solid rgba(234,179,8,0.4); border-radius:8px; padding:7px 14px; color:#fef08a; font-size:0.75rem; font-weight:700; cursor:pointer; transition:all 0.15s;"
        >
          <span>${isGoldMedal ? '🏆' : '🔥'}</span>
          <span>${escapeHtml(finalLabel)}</span>
          <span style="color:#fde047; font-size:0.7rem;">(${partCount} finalists)</span>
          <span style="color:#38bdf8; font-family:monospace; font-size:0.7rem; margin-left:2px;">${timeStr}</span>
          ${isFin ? '<span style="color:#4ade80; font-size:0.72rem;">✓ Official</span>' : ''}
        </button>
      `;
    }).join('');

    var datesStr = (ev.dates || [ev.date || '']).join(' • ');

    var isRelay = eventName.includes('Relay') || eventName.includes('4 x');
    var isDistance = eventName.includes('800m') || eventName.includes('1500m');
    var ruleText = isDistance
      ? 'Timed Finals across heats • Medals awarded on overall times.'
      : (isRelay 
          ? 'Top 8 teams from heats qualify for Final (Lanes 1–8).' 
          : 'Top 10 swimmers from heats qualify for Final (Lanes 0–9).');

    return `
      <div class="swimming-event-card" style="background:var(--card-bg, #131c2e); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.25rem; transition:border 0.2s;">
        <!-- Header -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:0.75rem;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:1.4rem;">🏊</span>
            <div>
                <div style="font-size:1.05rem; font-weight:800; color:#f8fafc;">${escapeHtml(eventName)}</div>
              <div style="font-size:0.74rem; color:#94a3b8; margin-top:2px;">
                📅 ${datesStr} • 📍 ${ev.venue || 'Tokyo Aquatics Centre'} • <span style="color:#38bdf8;">${ruleText}</span>
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
              Interactive Units (Click to view full results & lane times):
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

    var isFinal = !!unit.isFinal;
    var results = unit.results || [];
    var eventName = String(ev.name || ev.event || 'Swimming Event');
    var isRelay = eventName.includes('Relay') || eventName.includes('4 x');
    var isDistance = eventName.includes('800m') || eventName.includes('1500m');
    var qualNote = isFinal 
      ? 'Tokyo Aquatics Centre Final • Medals decided by official finish times.'
      : (isDistance 
          ? 'Timed Final heat • Official times determine tournament medal standings.'
          : (isRelay 
              ? 'Top 8 fastest relay squads across all heats advance to the Final (Lanes 1–8).' 
              : 'Top 10 fastest swimmers across all heats advance to the Final (Lanes 0–9).'));

    // Helper to normalize names
    function normSwimmerName(name) {
      return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
    }

    function parseSwimmingTime(tStr) {
      if (!tStr) return 999999;
      var s = String(tStr).trim();
      if (s === 'DQ' || s === 'DNS' || s === 'DNF' || s === 'Awaiting' || s === '--') return 999999;
      if (s.includes(':')) {
        var parts = s.split(':');
        var min = parseFloat(parts[0]) || 0;
        var sec = parseFloat(parts[1]) || 0;
        return min * 60 + sec;
      }
      var val = parseFloat(s);
      return isNaN(val) ? 999999 : val;
    }

    // Collect all finalists for this event to identify qualifiers in heats
    var finalistNames = new Set();
    (ev.finals || []).forEach(function (f) {
      (f.results || []).forEach(function (res) {
        if (res.name) {
          finalistNames.add(normSwimmerName(res.name));
        }
      });
    });

    // If finals results aren't populated yet, compute qualifiers from all heats across this event
    if (finalistNames.size === 0 && ev.heats && ev.heats.length > 0) {
      var maxQualifiers = isRelay ? 8 : 10;
      var allHeatSwimmers = [];
      ev.heats.forEach(function (h) {
        (h.results || []).forEach(function (res) {
          var tSec = parseSwimmingTime(res.time);
          if (res.name && tSec < 999999) {
            allHeatSwimmers.push({
              norm: normSwimmerName(res.name),
              timeSec: tSec
            });
          }
        });
      });
      allHeatSwimmers.sort(function (a, b) { return a.timeSec - b.timeSec; });
      allHeatSwimmers.slice(0, maxQualifiers).forEach(function (item) {
        finalistNames.add(item.norm);
      });
    }

    var rowsHtml = results.length === 0 ? `
      <tr>
        <td colspan="7" style="text-align:center; padding:2.5rem 1rem; color:#94a3b8;">
          Start list / Results for this session will be officially updated when available.
        </td>
      </tr>
    ` : results.map(function (r, idx) {
      var normName = normSwimmerName(r.name);
      var isQualified = !isFinal && (finalistNames.has(normName) || (r.qual && r.qual.toUpperCase() === 'Q'));

      // Medals are ONLY shown in Finals - never in Heats
      // Distance events use multiple timed-final heats; medals are assigned
      // only after the overall times are combined in the standings view.
      var isMedalFinal = isFinal && !isDistance;
      var isMedalist = isMedalFinal && (r.rank === '1' || r.rank === '2' || r.rank === '3' || r.medal);
      var medIcon = '';
      if (isMedalFinal) {
        if (r.medal === 'Gold' || r.rank === '1') medIcon = '🥇';
        else if (r.medal === 'Silver' || r.rank === '2') medIcon = '🥈';
        else if (r.medal === 'Bronze' || r.rank === '3') medIcon = '🥉';
      }

      var rankBadge = medIcon 
        ? `<span style="font-size:1.15rem; margin-right:4px;">${medIcon}</span><strong style="color:#f8fafc;">${r.rank}</strong>` 
        : `<strong style="color:#94a3b8;">${r.rank || idx + 1}</strong>`;

      var qualBadge = '';
      if (isFinal) {
        if (r.qual) {
          qualBadge = `<span style="background:rgba(56,189,248,0.18); border:1px solid rgba(56,189,248,0.4); color:#38bdf8; font-weight:700; padding:2px 6px; border-radius:4px; font-size:0.68rem;">${r.qual}</span>`;
        }
      } else {
        // In heats: Mark Q against those who moved to finals
        if (isQualified) {
          qualBadge = `<span style="background:rgba(34,197,94,0.22); border:1px solid rgba(34,197,94,0.6); color:#4ade80; font-weight:800; padding:2px 8px; border-radius:4px; font-size:0.75rem; letter-spacing:0.5px; box-shadow:0 0 6px rgba(34,197,94,0.25);">Q</span>`;
        }
      }

      var recBadge = r.record ? `<span style="background:rgba(234,179,8,0.2); border:1px solid rgba(234,179,8,0.5); color:#facc15; font-weight:800; padding:2px 6px; border-radius:4px; font-size:0.68rem;">${r.record}</span>` : '';

      var splitsCount = (r.splits || []).length;
      var hasSplits = splitsCount > 0;
      var rowId = 'splits-row-' + idx;

      var rowBg = isMedalist 
        ? 'rgba(234,179,8,0.06)' 
        : (isQualified ? 'rgba(34,197,94,0.06)' : 'transparent');

      return `
        <tr style="background:${rowBg}; border-bottom:1px solid rgba(255,255,255,0.06);">
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
          <td style="text-align:center; padding:9px 6px; font-family:monospace; font-weight:700; font-size:0.9rem; color:${r.time ? '#f8fafc' : '#facc15'};">
            ${escapeHtml(r.time || r.irm || 'Awaiting')}
          </td>
          <td style="text-align:center; padding:9px 6px; font-family:monospace; font-size:0.75rem; color:#94a3b8;">
            ${r.diff || '--'}
          </td>
          <td style="text-align:center; padding:9px 6px; font-family:monospace; font-size:0.75rem; color:#cbd5e1;">
            ${r.reaction ? r.reaction + 's' : '--'}
          </td>
          <td style="text-align:center; padding:9px 6px;">
            <div style="display:flex; justify-content:center; gap:4px; flex-wrap:wrap; align-items:center;">
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
            <span>ℹ️ <strong>Rule:</strong> ${qualNote} ${!isFinal ? '<span style="color:#4ade80; font-weight:700; margin-left:6px;">[Q] = Advanced to Final</span>' : ''}</span>
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

  window.setSwimmingEventFilter = function (evId, triggerRender) {
    if (evId !== undefined) {
      activeSwimmingEventFilter = evId;
    }
    if (triggerRender !== false) {
      if (typeof window.renderView === 'function') {
        window.renderView();
      } else if (typeof window.renderMatchesView === 'function') {
        var container = document.getElementById('content-cards');
        var curGen = String((typeof window !== 'undefined' && window.currentGender) || 'men').toLowerCase();
        var dataList = curGen === 'men' 
          ? (window.appData && window.appData.menMatches) 
          : (curGen === 'women' ? (window.appData && window.appData.womenMatches) : (window.appData && window.appData.mixedMatches));
        window.renderMatchesView(container, dataList);
      }
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

    var medalEntries = function (medal) {
      if (!medal) return [];
      if (Array.isArray(medal)) return medal;
      if (Array.isArray(medal.tiedMedalists) && medal.tiedMedalists.length > 0) {
        return medal.tiedMedalists;
      }
      return [medal];
    };

    var addActualMedal = function (medal, medalName, fallbackCountry, eventName) {
      medalEntries(medal).forEach(function (entry) {
        var team = entry.country || entry.org || fallbackCountry;
        actualTally[team] = actualTally[team] || { gold: 0, silver: 0, bronze: 0, total: 0, athletes: [] };
        actualTally[team][medalName] += 1;
        actualTally[team].total += 1;
        actualTally[team].athletes.push({
          medal: medalName,
          athlete: (entry.athlete || 'Unknown') + ' (' + eventName + ')'
        });
      });
    };

    allEvents.forEach(function (ev) {
      var p = ev.podium || {};
      if (p.gold) {
        decidedCount++;
        addActualMedal(p.gold, 'gold', 'China', ev.name);
      }
      if (p.silver) {
        addActualMedal(p.silver, 'silver', 'Japan', ev.name);
      }
      if (p.bronze) {
        addActualMedal(p.bronze, 'bronze', 'Korea', ev.name);
      }
    });

    // Projected medals come from the probabilities stored in predictions.json.
    // Keep this data-driven so the UI cannot drift from the published model.
    var predEvents = (window.appData && window.appData.predictionEvents) || [];
    var projectedTally = {};
    var parseProbability = function (value) {
      if (typeof value === 'number') return value > 1 ? value / 100 : value;
      var parsed = parseFloat(String(value || '').replace('%', ''));
      return isNaN(parsed) ? 0 : parsed / 100;
    };
    var projectedEvents = predEvents.filter(function (event) {
      return curGen === 'all' || String(event.gender || '').toLowerCase() === curGen;
    });
    projectedEvents.forEach(function (event) {
      (event.rankings || []).forEach(function (ranking) {
        var team = ranking.team || ranking.country || ranking.org;
        if (!team) return;
        if (!projectedTally[team]) {
          projectedTally[team] = { gold: 0, silver: 0, bronze: 0, total: 0 };
        }
        projectedTally[team].gold += parseProbability(ranking.gold);
        projectedTally[team].silver += parseProbability(ranking.silver);
        projectedTally[team].bronze += parseProbability(ranking.bronze);
        projectedTally[team].total += parseProbability(ranking.gold) +
          parseProbability(ranking.silver) + parseProbability(ranking.bronze);
      });
    });

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
    var eventCards = allEvents.map(function (ev) {
      var pDef = predEvents.find(function (pe) { return pe.id === ev.id; }) || {};
      var p = ev.podium || {};
      var eventName = String(ev.name || ev.event || 'Swimming Event');
      return {
        id: ev.id,
        name: eventName,
        shortName: eventName,
        icon: '🏊',
        gender: ev.gender,
        type: eventName.includes('Relay') ? 'team' : 'individual',
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
    hasStandings: true,
    renderMatches: renderMatches,
    renderStandingsTable: renderStandingsTable,
    extractMedalAnalytics: extractMedalAnalytics
  };

  window.SPORT_ENGINES['swimming'] = SWIMMING_ENGINE;
  window.SPORT_ENGINES['Swimming'] = SWIMMING_ENGINE;
})();
