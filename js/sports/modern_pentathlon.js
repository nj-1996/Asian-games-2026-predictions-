// ==========================================================================
// Asian Games 2026: Modern Pentathlon Sport Engine (Decoupled Plugin)
// ==========================================================================

(function () {
  window.SPORT_ENGINES = window.SPORT_ENGINES || {};

  var activePentathlonEvents = [];
  var activePhaseGroup = '';
  var activeDiscipline = '';
  var activeMpnStandingsTab = 'individual';
  var mpnPredictionsCache = null;

  var MPN_NOC_TO_COUNTRY = {
    KOR: 'South Korea', CHN: 'China', JPN: 'Japan', KAZ: 'Kazakhstan',
    PHI: 'Philippines', UZB: 'Uzbekistan', LBN: 'Lebanon', THA: 'Thailand',
    INA: 'Indonesia', KUW: 'Kuwait', PLE: 'Palestine', KGZ: 'Kyrgyzstan',
    MGL: 'Mongolia', SRI: 'Sri Lanka', UAE: 'United Arab Emirates',
    MAS: 'Malaysia', SGP: 'Singapore', HKG: 'Hong Kong', IND: 'India',
    TPE: 'Chinese Taipei', VIE: 'Vietnam', PRK: 'North Korea', IRI: 'Iran',
    BRN: 'Bahrain', JOR: 'Jordan', KSA: 'Saudi Arabia', QAT: 'Qatar', NEP: 'Nepal'
  };

  var MPN_ATHLETE_NOC = {
    // South Korea
    'SEO CHANGWAN': 'South Korea', 'JUN WOONGTAE': 'South Korea', 'JUN WOONG TAE': 'South Korea',
    'LEE JONGHYEON': 'South Korea', 'KIM YOUNGHA': 'South Korea',
    'KIM SUNWOO': 'South Korea', 'SEONG SEUNGMIN': 'South Korea', 'SEONG SEUNG MIN': 'South Korea',
    'JANG HAEUN': 'South Korea', 'KIM SOEUN': 'South Korea',
    'KIM UNJU': 'South Korea', 'SHIN SUMIN': 'South Korea',

    // China
    'MA YUANG': 'China', 'CHEN BAILIANG': 'China',
    'LUO SHUAI': 'China', 'LI LIUCHANG': 'China',
    'ZHANG MINGYU': 'China', 'BIAN YUFEI': 'China',
    'WU KEBAN': 'China', 'XIE LINZHI': 'China',
    'WU XIYAO': 'China', 'FU JING': 'China', 'MENG XIN': 'China',

    // Japan
    'SATO TAISHU': 'Japan', 'TOMITA YOUSUKE': 'Japan',
    'SEKIGAWA KAZUAKI': 'Japan', 'SHINOKI KAORU': 'Japan',
    'UCHIDA MISAKI': 'Japan', 'OTA NATSUMI': 'Japan',
    'YOSHIDA HANA': 'Japan', 'SAITO KANA': 'Japan',
    'SAITO AYUMU': 'Japan', 'SUZUKI YURI': 'Japan',
    'YANO YUHO': 'Japan',

    // Kazakhstan
    'ABDRAIMOV TEMIRLAN': 'Kazakhstan', 'VARYOKHIN TIKHON': 'Kazakhstan',
    'STADNIK KIRILL': 'Kazakhstan', 'CHUVASHOV LEV': 'Kazakhstan',
    'POTAPENKO YELENA': 'Kazakhstan', 'AKHMETOVA ANASTASSIYA': 'Kazakhstan',
    'YAKOVLEVA SOFYA': 'Kazakhstan', 'KULIKOVA KRISTINA': 'Kazakhstan',
    'CHSHEDROVA DIANA': 'Kazakhstan', 'KAZBEKOVA AYANA': 'Kazakhstan',
    'PETROVA YULIANA': 'Kazakhstan',

    // Philippines
    'GERMAN SAMUEL': 'Philippines', 'GODBOUT JOSEPH ANTHONY': 'Philippines',
    'COMALING MICHAEL VER ANTON': 'Philippines', 'ANDRINO GILBERT': 'Philippines',
    'ARBILON PRINCESS HONEY': 'Philippines', 'ARANZADO SHYRA MAE': 'Philippines',
    'SEVILLA JULIANA SHANE': 'Philippines',

    // Uzbekistan
    'TRETYAKOV DMITRIY': 'Uzbekistan', 'KAHRAMONOVA MEHRINISO': 'Uzbekistan',
    'KAHRAMAONOVA MEHRINISO': 'Uzbekistan',
    'ABZALOVA SAMIRA': 'Uzbekistan', 'OSMANOVA RIANA': 'Uzbekistan',

    // West & Central Asia
    'YARED MICHAEL ANTOINE': 'Lebanon',
    'ALSUHAIBI MOHAMMAD': 'Kuwait',
    'ABD ALHUSSAIN RETAJ': 'Kuwait',
    'ALTHUWAINI HABARI': 'Kuwait',
    'ABDALRHMAN ABDLLAH MOHAMMAD': 'United Arab Emirates',
    'ABUSHABAB OMAR': 'Palestine', 'ABUSHABAB ABDALLAH': 'Palestine',
    'ERKINBEKOV ATAI': 'Kyrgyzstan', 'SHTUKINA MARIIA': 'Kyrgyzstan',
    'AMARSANAA BILEGT': 'Mongolia',

    // Southeast & South Asia
    'YOHUANG PHURIT': 'Thailand', 'THATTHONG PONGKRIT': 'Thailand',
    'PAISANSRISIN PARITA': 'Thailand', 'PAISANGRISIN PARITA': 'Thailand',
    'WITSAPHAN CHANANAN': 'Thailand', 'TRONGTORKIT APHISARAPORN': 'Thailand',
    'MATULATUWA SAMUEL': 'Indonesia', 'IFSAN MUHAMMAD': 'Indonesia',
    'BANGUN CAROLINE': 'Indonesia', 'WAHYUNI SRI': 'Indonesia',
    'QALBI NURFA INAYAH NURUL': 'Indonesia',
    'AW JIAN TING': 'Malaysia',
    'ANSARI TAHIR': 'Singapore', 'LIM PEI YAO': 'Singapore',
    'SILVA OSHADA': 'Sri Lanka', 'KUMARI GAYANI': 'Sri Lanka',
    'SHUM CHUN HEI': 'Hong Kong', 'LIU HEI YU': 'Hong Kong'
  };

  function resolveAthleteCountry(name, fallbackNoc) {
    var cleanNoc = (fallbackNoc || '').toUpperCase().trim();
    if (MPN_NOC_TO_COUNTRY[cleanNoc]) return MPN_NOC_TO_COUNTRY[cleanNoc];
    var knownCountries = Object.values(MPN_NOC_TO_COUNTRY);
    if (knownCountries.includes(fallbackNoc)) return fallbackNoc;
    if (!name) return fallbackNoc || '';
    var key = name.toUpperCase().replace(/[^A-Z\s]/g, '').replace(/\s+/g, ' ').trim();
    return MPN_ATHLETE_NOC[key] || fallbackNoc || '';
  }

  function getDisciplineIcon(name) {
    var n = (name || '').toLowerCase();
    if (n.includes('overall')) return '⭐';
    if (n.includes('team')) return '👥';
    if (n.includes('fencing')) return '🤺';
    if (n.includes('obstacle')) return '🏃';
    if (n.includes('swimming')) return '🏊';
    if (n.includes('laser') || n.includes('shoot')) return '🎯';
    return '🏅';
  }

  function getNormalizedPhaseGroup(ev) {
    var pName = ev.round || ev.phase || 'Schedule';
    if (ev.group && !pName.includes(ev.group)) return pName + ' (' + ev.group + ')';
    if (pName === 'SF' || pName.toLowerCase() === 'semi-final') {
      var hour = parseInt((ev.time || '00:00').split(':')[0], 10);
      return hour < 13 ? 'Semi-final (Group A)' : 'Semi-final (Group B)';
    }
    return pName;
  }

  function renderPentathlonHero(list, isWomen) {
    if (!list || list.length === 0) return '';
    var isTournamentComplete = list.every(function(ev) { return ev.status === 'Official' || ev.status === 'Finished'; });
    var liveSession = list.find(function(ev) { return (ev.status || '').toLowerCase() === 'live'; });
    var nextSession = liveSession || list.find(function(ev) { return ev.status !== 'Official' && ev.status !== 'Finished'; });

    if (isTournamentComplete) {
      if (isWomen) {
        return `
          <div style="background:linear-gradient(135deg, rgba(30,58,138,0.4), rgba(15,23,42,0.85)); border:1px solid rgba(234,179,8,0.35); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem; text-align:center; box-shadow:0 4px 15px rgba(0,0,0,0.3);">
            <div style="display:inline-block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; padding:0.25rem 0.75rem; border-radius:9999px; background:rgba(250,204,21,0.2); color:#facc15; margin-bottom:0.75rem;">
              🏆 TOURNAMENT COMPLETED
            </div>
            <div style="font-size:1.15rem; font-weight:700; color:#f8fafc; margin-bottom:0.3rem;">
              Individual Champion: <span style="color:#facc15;">Seong Seung-min 🇰🇷 (1,492 pts)</span> 🥇
            </div>
            <div style="font-size:0.8rem; color:#94a3b8; margin-bottom:0.6rem;">
              🥈 Silver: Zhang Mingyu 🇨🇳 (1,460 pts) • 🥉 Bronze: Wu Xiyao 🇨🇳 (1,447 pts)
            </div>
            <div style="display:inline-block; font-size:0.78rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); padding:4px 12px; border-radius:16px; color:#cbd5e1;">
              👥 Team Champions: 🥇 China (4,318 pts) • 🥈 South Korea (4,271 pts) • 🥉 Japan (4,169 pts)
            </div>
          </div>
        `;
      } else {
        return `
          <div style="background:linear-gradient(135deg, rgba(30,58,138,0.4), rgba(15,23,42,0.85)); border:1px solid rgba(234,179,8,0.35); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem; text-align:center; box-shadow:0 4px 15px rgba(0,0,0,0.3);">
            <div style="display:inline-block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; padding:0.25rem 0.75rem; border-radius:9999px; background:rgba(250,204,21,0.2); color:#facc15; margin-bottom:0.75rem;">
              🏆 TOURNAMENT COMPLETED
            </div>
            <div style="font-size:1.15rem; font-weight:700; color:#f8fafc; margin-bottom:0.3rem;">
              Individual Champion: <span style="color:#facc15;">Li Liuchang 🇨🇳 (1,598 pts)</span> 🥇
            </div>
            <div style="font-size:0.8rem; color:#94a3b8; margin-bottom:0.6rem;">
              🥈 Silver: Jun Woong-tae 🇰🇷 (1,595 pts) • 🥉 Bronze: Lee Jong-hyeon 🇰🇷 (1,593 pts)
            </div>
            <div style="display:inline-block; font-size:0.78rem; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); padding:4px 12px; border-radius:16px; color:#cbd5e1;">
              👥 Team Champions: 🥇 South Korea (4,779 pts) • 🥈 China (4,768 pts) • 🥉 Kazakhstan (4,647 pts)
            </div>
          </div>
        `;
      }
    }

    if (!nextSession) nextSession = list[0];
    var disc = nextSession.discipline || nextSession.round || 'Modern Pentathlon';
    var icon = getDisciplineIcon(disc);
    var phase = getNormalizedPhaseGroup(nextSession);
    var isSemi = /semi|sf|seed/i.test(phase);
    var isMedalDecider = Boolean(nextSession.is_medal) && !isSemi;
    var dateTimeFormatted = typeof formatMatchDateTime === 'function' 
      ? formatMatchDateTime(nextSession.date, nextSession.time) 
      : (nextSession.date + ' ' + nextSession.time);
    var isLive = (nextSession.status || '').toLowerCase() === 'live';

    return `
      <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
        <div style="font-size: 0.75rem; font-weight: 700; color: ${isLive ? '#ef4444' : '#38bdf8'}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
          ${isLive ? '🔴 LIVE NOW' : '⏳ Next Session'}
        </div>
        <div style="font-size: 2.2rem; line-height: 1; margin: 0.25rem 0;">
          ${icon}
        </div>
        <div style="font-size: 1.1rem; font-weight: 700; color: #f8fafc; margin-top: 0.4rem;">
          ${disc}
        </div>
        <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.2rem;">
          ${dateTimeFormatted} • ${nextSession.venue || 'Anjo Sports Park'}
        </div>
        ${isMedalDecider ? `
          <div style="display:inline-block; margin-top:0.6rem; font-size:0.75rem; background:rgba(234,179,8,0.15); color:#facc15; border:1px solid rgba(234,179,8,0.3); padding:2px 8px; border-radius:12px; font-weight:600;">
            🥇 Individual & Team Medal Decider
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderPentathlonTimeline(items) {
    var list = Array.isArray(items) ? items : (items && (items.events || items.matches)) || [];
    if (!list || list.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No session timetable available.</div>`;
    }

    activePentathlonEvents = list;
    var isWomen = (typeof currentGender !== 'undefined' && currentGender === 'women') ||
                  (window.currentGender === 'women') ||
                  (list[0] && list[0].id && list[0].id.startsWith('W.'));

    var phaseMap = {};
    list.forEach(function(ev) {
      var pName = getNormalizedPhaseGroup(ev);
      if (!phaseMap[pName]) phaseMap[pName] = [];
      phaseMap[pName].push(ev);
    });

    var timelineHtml = Object.entries(phaseMap).map(function(entry) {
      var phaseHeader = entry[0];
      var sessions = entry[1];
      return `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:1.5rem; overflow:hidden;">
          <div style="padding:0.75rem 1rem; font-weight:700; font-size:0.95rem; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02); display:flex; justify-content:space-between; align-items:center;">
            <span>${phaseHeader}</span>
            <span style="font-size:0.75rem; color:#94a3b8; font-weight:400;">${sessions[0]?.venue || 'Anjo Sports Park'}</span>
          </div>
          <div>
            ${sessions.map(function(ev) {
              var isFinished = ev.status === 'Official' || ev.status === 'Finished';
              var isLive = (ev.status || '').toLowerCase() === 'live';
              var disc = ev.discipline || ev.round || 'Session';
              var icon = getDisciplineIcon(disc);
              var isSemiOrSeed = /semi|sf|seed/i.test(phaseHeader);
              var isMedalSession = Boolean(ev.is_medal) && !isSemiOrSeed;
              var safePhase = encodeURIComponent(phaseHeader);
              var safeDisc = encodeURIComponent(disc);
              var dateTimeFormatted = typeof formatMatchDateTime === 'function'
                ? formatMatchDateTime(ev.date, ev.time)
                : (ev.date + ' ' + ev.time);

              return `
                <div 
                  onclick="window.openMpnSheet('${safePhase}', '${safeDisc}')"
                  style="display:flex; justify-content:space-between; align-items:center; padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.03); cursor:pointer; -webkit-tap-highlight-color:rgba(255,255,255,0.05); transition:background 0.15s ease;"
                >
                  <div style="display:flex; align-items:center; gap:0.75rem;">
                    <span style="font-size:1.25rem; line-height:1;">${icon}</span>
                    <div>
                      <div style="font-size:0.85rem; font-weight:600; color:#f8fafc;">${disc}</div>
                      <div style="font-size:0.75rem; color:#94a3b8;">${dateTimeFormatted}</div>
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:0.6rem;">
                    ${isMedalSession ? `
                      <span style="font-size:0.75rem; background:rgba(234,179,8,0.15); color:#facc15; border:1px solid rgba(234,179,8,0.3); padding:2px 6px; border-radius:4px; font-weight:600;">
                        🥇 Medals
                      </span>
                    ` : ''}
                    <span style="font-size:0.75rem; font-weight:600; color:${isLive ? '#ef4444' : isFinished ? '#4ade80' : '#94a3b8'};">
                      ${ev.status}
                    </span>
                    <span style="color:#64748b; font-size:1rem; line-height:1; font-weight:700;">›</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    return renderPentathlonHero(list, isWomen) + timelineHtml + renderBottomSheetTemplate();
  }

  function renderBottomSheetTemplate() {
    return `
      <div id="mpn-sheet-backdrop" onclick="window.closeMpnSheet()" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(2px); z-index:9998; opacity:0; transition:opacity 0.25s ease;"></div>
      <div id="mpn-bottom-sheet" style="position:fixed; bottom:0; left:0; right:0; max-height:85vh; height:auto; background:#0f172a; border-top:1px solid rgba(255,255,255,0.15); border-radius:20px 20px 0 0; z-index:9999; transform:translateY(100%); transition:transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); display:flex; flex-direction:column; box-shadow:0 -10px 25px rgba(0,0,0,0.5); overflow:hidden;">
        <div style="padding:0.75rem 0 0.25rem 0; display:flex; justify-content:center; cursor:pointer;" onclick="window.closeMpnSheet()">
          <div style="width:36px; height:4px; border-radius:2px; background:#475569;"></div>
        </div>
        <div style="padding:0.5rem 1.25rem 0.75rem; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.06);">
          <div>
            <h3 id="mpn-sheet-title" style="margin:0; font-size:1.05rem; font-weight:700; color:#f8fafc;">Details</h3>
            <span id="mpn-sheet-subtitle" style="font-size:0.75rem; color:#94a3b8;">Anjo Sports Park</span>
          </div>
          <button onclick="window.closeMpnSheet()" style="background:rgba(255,255,255,0.08); border:none; color:#cbd5e1; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-size:1rem; cursor:pointer;">✕</button>
        </div>
        <div id="mpn-discipline-tabs" style="display:flex; gap:0.5rem; overflow-x:auto; padding:0.75rem 1.25rem; background:rgba(255,255,255,0.02); border-bottom:1px solid rgba(255,255,255,0.05); scrollbar-width:none;"></div>
        <div id="mpn-sheet-content" style="flex:1; overflow-y:auto; padding:1rem 1.25rem 2rem;"></div>
      </div>
    `;
  }

  window.openMpnSheet = function (phaseEncoded, discEncoded) {
    var phase = decodeURIComponent(phaseEncoded);
    var disc = decodeURIComponent(discEncoded);
    activePhaseGroup = phase;
    activeDiscipline = disc;

    var backdrop = document.getElementById('mpn-sheet-backdrop');
    var sheet = document.getElementById('mpn-bottom-sheet');
    if (!backdrop || !sheet) return;

    document.getElementById('mpn-sheet-title').innerText = phase;
    
    var eventsPool = (activePentathlonEvents && activePentathlonEvents.length > 0)
      ? activePentathlonEvents
      : ((window.currentGender === 'women' ? window.appData?.womenMatches : window.appData?.menMatches) || []);

    var relatedEvents = eventsPool.filter(function(ev) { return getNormalizedPhaseGroup(ev) === phase; });
    
    var availableDisciplines = [];
    if (relatedEvents.length > 1) {
      availableDisciplines.push('Overall');
      relatedEvents.forEach(function(e) {
        var d = e.discipline || e.round;
        if (d && !availableDisciplines.includes(d)) availableDisciplines.push(d);
      });
    } else if (relatedEvents.length === 1) {
      availableDisciplines.push(relatedEvents[0].discipline || relatedEvents[0].round);
    }

    renderDisciplineTabs(availableDisciplines, disc);
    loadDisciplineView(relatedEvents, disc);

    backdrop.style.display = 'block';
    setTimeout(function() {
      backdrop.style.opacity = '1';
      sheet.style.transform = 'translateY(0)';
    }, 10);
  };

  window.closeMpnSheet = function () {
    var backdrop = document.getElementById('mpn-sheet-backdrop');
    var sheet = document.getElementById('mpn-bottom-sheet');
    if (!sheet) return;
    backdrop.style.opacity = '0';
    sheet.style.transform = 'translateY(100%)';
    setTimeout(function() { backdrop.style.display = 'none'; }, 250);
  };

  function renderDisciplineTabs(disciplines, selected) {
    var tabsContainer = document.getElementById('mpn-discipline-tabs');
    if (!tabsContainer) return;
    tabsContainer.innerHTML = disciplines.map(function(d) {
      var isSelected = d === selected;
      var safeD = encodeURIComponent(d);
      return `
        <button 
          id="mpn-tab-${safeD}"
          onclick="window.selectMpnDiscipline('${safeD}')"
          style="white-space:nowrap; padding:0.4rem 0.85rem; font-size:0.75rem; font-weight:600; border-radius:20px; border:none; cursor:pointer; transition:all 0.15s ease; ${isSelected ? 'background:#2563eb; color:#ffffff;' : 'background:rgba(255,255,255,0.06); color:#94a3b8;'}"
        >
          ${getDisciplineIcon(d)} ${d}
        </button>
      `;
    }).join('');
  }

  window.selectMpnDiscipline = function (discEncoded) {
    var disc = decodeURIComponent(discEncoded);
    activeDiscipline = disc;
    var eventsPool = (activePentathlonEvents && activePentathlonEvents.length > 0)
      ? activePentathlonEvents
      : ((window.currentGender === 'women' ? window.appData?.womenMatches : window.appData?.menMatches) || []);

    var relatedEvents = eventsPool.filter(function(ev) { return getNormalizedPhaseGroup(ev) === activePhaseGroup; });
    var availableDisciplines = [];
    if (relatedEvents.length > 1) {
      availableDisciplines.push('Overall');
      relatedEvents.forEach(function(e) {
        var d = e.discipline || e.round;
        if (d && !availableDisciplines.includes(d)) availableDisciplines.push(d);
      });
    } else if (relatedEvents.length === 1) {
      availableDisciplines.push(relatedEvents[0].discipline || relatedEvents[0].round);
    }

    renderDisciplineTabs(availableDisciplines, disc);
    loadDisciplineView(relatedEvents, disc);
  };

  function buildGroupStandings(sessions, isFinal) {
    var athletes = {};
    // Exclude team events so team entities never pollute individual standings!
    var individualSessions = (sessions || []).filter(function(s) {
      var d = (s.discipline || s.round || '').toLowerCase();
      return !d.includes('team');
    });

    individualSessions.forEach(function(s) {
      var disc = (s.discipline || s.round || '').toLowerCase();
      (s.competitors || []).forEach(function(c) {
        var name = c.name;
        if (!name) return;
        if (!athletes[name]) {
          athletes[name] = {
            name: name,
            country: resolveAthleteCountry(name, c.country),
            fence: '-', obstacle: '-', swim: '-', laser: '-', total: 0,
            laserRank: 999,
            officialTotal: 0
          };
        }
        var pts = parseInt(c.points, 10) || parseInt(c.raw, 10) || 0;
        if (disc.includes('fencing')) athletes[name].fence = pts;
        else if (disc.includes('obstacle')) athletes[name].obstacle = pts;
        else if (disc.includes('swim')) athletes[name].swim = pts;
        else if (disc.includes('laser')) {
          athletes[name].laser = pts;
          if (c.rank) athletes[name].laserRank = parseInt(c.rank, 10);
        }
        if (c.total_pts && parseInt(c.total_pts, 10) > 0) {
          athletes[name].officialTotal = parseInt(c.total_pts, 10);
        }
      });
    });

    Object.values(athletes).forEach(function(a) {
      if (a.officialTotal > 0) {
        a.total = a.officialTotal;
      } else {
        var f = parseInt(a.fence, 10) || 0;
        var o = parseInt(a.obstacle, 10) || 0;
        var s = parseInt(a.swim, 10) || 0;
        var l = parseInt(a.laser, 10) || 0;
        a.total = f + o + s + l;
      }
    });

    var resultList = Object.values(athletes);
    // In modern pentathlon, the Laser Run finish order determines the medal classification
    if (isFinal && resultList.some(function(a) { return a.laserRank < 999; })) {
      return resultList.sort(function(a, b) { return a.laserRank - b.laserRank; });
    }

    return resultList.sort(function(a, b) { return b.total - a.total; });
  }

  function loadDisciplineView(events, discipline) {
    var content = document.getElementById('mpn-sheet-content');
    if (!content) return;

    var isFinal = activePhaseGroup === 'Final';

    if (discipline === 'Overall') {
      document.getElementById('mpn-sheet-subtitle').innerText = isFinal
        ? 'Official Final Classification (Medal Round)'
        : 'Combined Cumulative Points Standings';

      var individualEvents = events.filter(function(ev) {
        var d = (ev.discipline || ev.round || '').toLowerCase();
        return !d.includes('team');
      });

      var athleteTotals = {};
      individualEvents.forEach(function(ev) {
        var discName = (ev.discipline || ev.round || '').toLowerCase();
        (ev.competitors || []).forEach(function(c) {
          var name = c.name;
          if (!name) return;
          if (!athleteTotals[name]) {
            athleteTotals[name] = {
              name: name,
              country: resolveAthleteCountry(name, c.country),
              totalPts: 0,
              eventsCount: 0,
              laserRank: 999,
              officialTotal: 0,
              fence: 0, obstacle: 0, swim: 0, laser: 0
            };
          }
          var ptsNum = parseInt(c.points, 10) || parseInt(c.raw, 10) || 0;
          if (discName.includes('fencing')) athleteTotals[name].fence = ptsNum;
          else if (discName.includes('obstacle')) athleteTotals[name].obstacle = ptsNum;
          else if (discName.includes('swim')) athleteTotals[name].swim = ptsNum;
          else if (discName.includes('laser')) athleteTotals[name].laser = ptsNum;

          athleteTotals[name].eventsCount += 1;
          if (c.total_pts && parseInt(c.total_pts, 10) > 0) {
            athleteTotals[name].officialTotal = parseInt(c.total_pts, 10);
          }
          if (discName.includes('laser') && c.rank) {
            athleteTotals[name].laserRank = parseInt(c.rank, 10);
          }
        });
      });

      Object.values(athleteTotals).forEach(function(a) {
        if (a.officialTotal > 0) {
          a.totalPts = a.officialTotal;
        } else {
          a.totalPts = a.fence + a.obstacle + a.swim + a.laser;
        }
      });

      var overallList = Object.values(athleteTotals);
      if (isFinal && overallList.some(function(a) { return a.laserRank < 999; })) {
        overallList.sort(function(a, b) { return a.laserRank - b.laserRank; });
      } else {
        overallList.sort(function(a, b) { return b.totalPts - a.totalPts; });
      }

      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; font-weight:700;">
            ${isFinal ? 'Individual Medal Standings' : 'Combined Standings'}
          </span>
          <span style="font-size:0.75rem; color:${isFinal ? '#facc15' : '#38bdf8'}; font-weight:600;">
            ${isFinal ? 'Official Medal Round' : 'Top 9 Advance to Final (Q)'}
          </span>
        </div>
        <div style="display:grid; grid-template-columns: 32px 1fr 65px 75px; font-size:0.7rem; font-weight:700; color:#64748b; padding-bottom:0.5rem; border-bottom:1px solid rgba(255,255,255,0.08); text-transform:uppercase;">
          <span>#</span><span>Athlete</span><span style="text-align:center;">Events</span><span style="text-align:right;">Total Pts</span>
        </div>
        <div style="font-size:0.82rem;">
          ${overallList.map(function(item, idx) {
            var rank = idx + 1;
            var isCutoff = !isFinal && rank === 9;
            var flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(item.country) : '';
            var medal = isFinal && (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '');
            var isPodium = isFinal && rank <= 3;
            return `
              <div style="display:grid; grid-template-columns: 32px 1fr 65px 75px; align-items:center; padding:0.7rem 0; border-bottom:1px solid rgba(255,255,255,0.04); background:${isPodium ? 'rgba(234,179,8,0.04)' : 'transparent'};">
                <span style="font-weight:700; color:${isPodium ? '#facc15' : rank <= 9 && !isFinal ? '#38bdf8' : '#94a3b8'};">${medal || rank}</span>
                <div>
                  <div style="font-weight:600; color:#f8fafc; display:flex; align-items:center; gap:0.35rem;">
                    <span>${flag}</span> <span>${item.name}</span>
                  </div>
                  ${item.country ? `<div style="font-size:0.7rem; color:#94a3b8; margin-left:1.35rem;">${item.country}</div>` : ''}
                </div>
                <span style="text-align:center; font-size:0.75rem; color:#94a3b8;">${item.eventsCount} / 4</span>
                <span style="text-align:right; font-weight:700; color:#4ade80; font-size:0.9rem;">${item.totalPts.toLocaleString()}</span>
              </div>
              ${isCutoff ? `
                <div style="display:flex; align-items:center; margin:0.6rem 0; gap:0.5rem;">
                  <div style="flex:1; height:1px; background:#ef4444;"></div>
                  <span style="font-size:0.65rem; font-weight:700; color:#ef4444; letter-spacing:0.05em;">FINAL QUALIFICATION CUTOFF</span>
                  <div style="flex:1; height:1px; background:#ef4444;"></div>
                </div>
              ` : ''}
            `;
          }).join('')}
        </div>
      `;
      return;
    }

    var targetEvent = events.find(function(e) { return (e.discipline || e.round) === discipline; }) || events[0] || {};
    var isLive = (targetEvent.status || '').toLowerCase() === 'live';
    var dateTimeFormatted = typeof formatMatchDateTime === 'function'
      ? formatMatchDateTime(targetEvent.date, targetEvent.time)
      : (targetEvent.date + ' • ' + targetEvent.time);
    document.getElementById('mpn-sheet-subtitle').innerText = dateTimeFormatted + ' • ' + (targetEvent.venue || 'Anjo Sports Park');

    var competitors = targetEvent.competitors || [];
    if (competitors.length === 0) {
      content.innerHTML = `
        <div style="text-align:center; padding:2.5rem 1rem; color:#94a3b8;">
          <div style="font-size:2rem; margin-bottom:0.5rem;">⏱️</div>
          <div style="font-size:0.95rem; font-weight:600; color:#f8fafc; margin-bottom:0.25rem;">Session Scheduled</div>
          <div style="font-size:0.8rem; line-height:1.4;">Official standings will appear here once the session finishes.</div>
        </div>
      `;
      return;
    }

    var isTeamEvent = (discipline || '').toLowerCase().includes('team');
    if (isTeamEvent) {
      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; font-weight:700;">Official Team Results</span>
          <span style="font-size:0.75rem; color:${isLive ? '#ef4444' : '#4ade80'}; font-weight:600;">${targetEvent.status}</span>
        </div>
        <div style="display:grid; grid-template-columns: 32px 1fr 90px; font-size:0.7rem; font-weight:700; color:#64748b; padding-bottom:0.5rem; border-bottom:1px solid rgba(255,255,255,0.08); text-transform:uppercase;">
          <span>#</span><span>Nation</span><span style="text-align:right;">Total Score</span>
        </div>
        <div style="font-size:0.82rem;">
          ${competitors.map(function(c, i) {
            var rank = c.rank || (i + 1);
            var medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
            var name = c.name || `Team ${rank}`;
            var flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(name) : '';
            var pts = (c.raw && c.raw !== '0') ? c.raw : (c.points !== '-' ? c.points : '0');
            var numPts = parseInt(pts, 10);
            var displayPts = isNaN(numPts) ? pts : numPts.toLocaleString();
            return `
              <div style="display:grid; grid-template-columns: 32px 1fr 90px; align-items:center; padding:0.75rem 0; border-bottom:1px solid rgba(255,255,255,0.04); background:${rank <= 3 ? 'rgba(234,179,8,0.04)' : 'transparent'};">
                <span style="font-weight:700; font-size:1rem; color:${rank <= 3 ? '#facc15' : '#94a3b8'};">${medal || rank}</span>
                <div style="font-weight:600; color:#f8fafc; display:flex; align-items:center; gap:0.45rem;">
                  <span style="font-size:1.15rem;">${flag}</span> <span>${name}</span>
                </div>
                <span style="text-align:right; font-weight:700; color:#4ade80; font-size:0.95rem; font-family:monospace;">${displayPts} pts</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
      return;
    }

    var isFencingSeeding = /seeding/i.test(discipline) || /seeding/i.test(targetEvent.discipline || '') || /seeding/i.test(targetEvent.round || '');

    if (isFencingSeeding) {
      var totalBouts = competitors.length > 1 ? competitors.length - 1 : 35;
      var sortedCompetitors = competitors.map(function(c, idx) {
        var originalRank = c.rank !== undefined ? parseInt(c.rank, 10) : (idx + 1);
        var v = (c.victories !== undefined && c.victories !== null && c.victories !== '') ? String(c.victories) : '-';
        var d = (c.defeats !== undefined && c.defeats !== null && c.defeats !== '') ? String(c.defeats) : '-';
        var pen = (c.penalties !== undefined && c.penalties !== null && c.penalties !== '') ? String(c.penalties) : '0';

        if ((v === '-' || !/^\d+$/.test(v)) && /^\d+$/.test(d)) {
          v = String(Math.max(0, totalBouts - parseInt(d, 10)));
        } else if ((d === '-' || !/^\d+$/.test(d)) && /^\d+$/.test(v)) {
          d = String(Math.max(0, totalBouts - parseInt(v, 10)));
        }

        return {
          ...c,
          victories: v, defeats: d, penalties: pen,
          originalRank: isNaN(originalRank) ? 999 : originalRank,
          numV: parseInt(v, 10) || 0,
          numD: parseInt(d, 10) || 0,
          numPen: parseInt(pen, 10) || 0
        };
      }).sort(function(a, b) {
        if (b.numV !== a.numV) return b.numV - a.numV;
        if (a.numD !== b.numD) return a.numD - b.numD;
        if (a.numPen !== b.numPen) return a.numPen - b.numPen;
        return a.originalRank - b.originalRank;
      });

      content.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
          <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; font-weight:700;">Fencing Seeding Round</span>
          <span style="font-size:0.75rem; color:${isLive ? '#ef4444' : '#4ade80'}; font-weight:600;">${targetEvent.status}</span>
        </div>
        <div style="display:grid; grid-template-columns: 28px 1fr 38px 38px 44px; font-size:0.7rem; font-weight:700; color:#64748b; padding-bottom:0.5rem; border-bottom:1px solid rgba(255,255,255,0.08); text-transform:uppercase; text-align:center;">
          <span style="text-align:left;">#</span><span style="text-align:left;">Athlete</span><span>V</span><span>D</span><span style="text-align:right;">Pen</span>
        </div>
        <div style="font-size:0.82rem;">
          ${sortedCompetitors.map(function(c, i) {
            var rank = i + 1;
            var name = c.name || `Competitor ${rank}`;
            var country = resolveAthleteCountry(name, c.country);
            var flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(country) : '';
            return `
              <div style="display:grid; grid-template-columns: 28px 1fr 38px 38px 44px; align-items:center; padding:0.65rem 0; border-bottom:1px solid rgba(255,255,255,0.04); text-align:center;">
                <span style="text-align:left; font-weight:700; color:#94a3b8;">${rank}</span>
                <div style="text-align:left;">
                  <div style="font-weight:600; color:#f8fafc; display:flex; align-items:center; gap:0.35rem;">
                    <span>${flag}</span> <span>${name}</span>
                  </div>
                  ${country ? `<div style="font-size:0.7rem; color:#94a3b8; margin-left:1.35rem;">${country}</div>` : ''}
                </div>
                <span style="font-family:monospace; color:#4ade80; font-weight:600;">${c.victories}</span>
                <span style="font-family:monospace; color:#f87171; font-weight:600;">${c.defeats}</span>
                <span style="font-family:monospace; color:${c.penalties !== '0' && c.penalties !== '-' ? '#fbbf24' : '#94a3b8'}; text-align:right;">${c.penalties}</span>
              </div>
            `;
          }).join('')}
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
        <span style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; color:#94a3b8; font-weight:700;">Discipline Results</span>
        <span style="font-size:0.75rem; color:${isLive ? '#ef4444' : '#4ade80'}; font-weight:600;">${targetEvent.status}</span>
      </div>
      <div style="display:grid; grid-template-columns: 32px 1fr 80px; font-size:0.7rem; font-weight:700; color:#64748b; padding-bottom:0.5rem; border-bottom:1px solid rgba(255,255,255,0.08); text-transform:uppercase;">
        <span>#</span><span>Athlete</span><span style="text-align:right;">Points</span>
      </div>
      <div style="font-size:0.82rem;">
        ${competitors.map(function(c, i) {
          var rank = c.rank || (i + 1);
          var name = c.name || `Competitor ${rank}`;
          var country = resolveAthleteCountry(name, c.country);
          var flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(country) : '';
          var pts = (c.raw && c.raw !== '0') ? c.raw : (c.points !== '-' ? c.points : '0');
          return `
            <div style="display:grid; grid-template-columns: 32px 1fr 80px; align-items:center; padding:0.7rem 0; border-bottom:1px solid rgba(255,255,255,0.04);">
              <span style="font-weight:700; color:#94a3b8;">${rank}</span>
              <div>
                <div style="font-weight:600; color:#f8fafc; display:flex; align-items:center; gap:0.35rem;">
                  <span>${flag}</span> <span>${name}</span>
                </div>
                ${country ? `<div style="font-size:0.7rem; color:#94a3b8; margin-left:1.35rem;">${country}</div>` : ''}
              </div>
              <span style="text-align:right; font-weight:700; color:#4ade80; font-size:0.9rem;">+${pts} pts</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderGroupTable(title, athletes, isFinal) {
    return `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:1.5rem; overflow-x:auto;">
        <div style="padding:0.85rem 1rem; font-weight:700; font-size:0.95rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center;">
          <span>${title}</span>
          <span style="font-size:0.75rem; color:${isFinal ? '#facc15' : '#38bdf8'}; font-weight:600;">
            ${isFinal ? '🥇 Official Medal Classification' : 'Top 9 Advance (Q)'}
          </span>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:center;">
          <thead>
            <tr style="color:#94a3b8; font-size:0.72rem; border-bottom:1px solid rgba(255,255,255,0.05); background:rgba(0,0,0,0.15);">
              <th style="padding:0.65rem 0.5rem; text-align:left;"># Athlete</th>
              <th style="padding:0.65rem 0.3rem;">Fence</th>
              <th style="padding:0.65rem 0.3rem;">Obstacle</th>
              <th style="padding:0.65rem 0.3rem;">Swim</th>
              <th style="padding:0.65rem 0.3rem;">Laser</th>
              <th style="padding:0.65rem 0.5rem; font-weight:700; color:#f8fafc;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${athletes.map(function(a, idx) {
              var rank = idx + 1;
              var isQualified = !isFinal && rank <= 9;
              var flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(a.country) : '';
              var isPodium = isFinal && rank <= 3;
              var medal = isFinal && (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '');
              return `
                <tr style="border-bottom:${rank === 9 && !isFinal ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.03)'}; background:${isPodium ? 'rgba(234,179,8,0.06)' : isQualified ? 'rgba(56,189,248,0.03)' : 'transparent'};">
                  <td style="padding:0.65rem 0.5rem; text-align:left;">
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                      <span style="display:inline-block; width:22px; font-weight:700; font-size:${isPodium ? '1rem' : '0.85rem'}; color:${isPodium ? '#facc15' : isQualified ? '#38bdf8' : '#94a3b8'};">${medal || rank}</span>
                      <div>
                        <div style="font-weight:600; color:#f8fafc; display:flex; align-items:center; gap:0.35rem;">
                          <span>${flag}</span> <span>${a.name}</span>${isQualified ? `<span style="font-size:0.65rem; background:rgba(56,189,248,0.2); color:#38bdf8; padding:1px 5px; border-radius:4px; font-weight:700;">Q</span>` : ''}
                        </div>
                        ${a.country ? `<div style="font-size:0.7rem; color:#94a3b8; margin-left:1.35rem;">${a.country}</div>` : ''}
                      </div>
                    </div>
                  </td>
                  <td style="padding:0.65rem 0.3rem; font-family:monospace; color:#cbd5e1;">${a.fence}</td>
                  <td style="padding:0.65rem 0.3rem; font-family:monospace; color:#cbd5e1;">${a.obstacle}</td>
                  <td style="padding:0.65rem 0.3rem; font-family:monospace; color:#cbd5e1;">${a.swim}</td>
                  <td style="padding:0.65rem 0.3rem; font-family:monospace; color:#cbd5e1;">${a.laser}</td>
                  <td style="padding:0.65rem 0.5rem; font-family:monospace; font-weight:700; color:#4ade80;">${a.total.toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderOfficialTeamView(finalStandings, semiAStandings, semiBStandings, allEvents, isWomen) {
    var teamEvent = (allEvents || []).find(function(ev) {
      var d = (ev.discipline || '').toLowerCase();
      return d.includes('team final') || d.includes('team');
    });

    if (teamEvent && teamEvent.competitors && teamEvent.competitors.length > 0) {
      var athletesByCountry = {};
      (finalStandings || []).forEach(function(a) {
        var c = a.country || '';
        if (c) {
          if (!athletesByCountry[c]) athletesByCountry[c] = [];
          athletesByCountry[c].push(a);
        }
      });

      return `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:1.5rem; overflow:hidden;">
          <div style="padding:0.85rem 1rem; font-weight:700; font-size:0.95rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02);">
            <span>👥 Official Team Medal Classification</span>
            <span style="font-size:0.75rem; color:#facc15; font-weight:600;">Final Results</span>
          </div>
          <div style="padding:0.75rem 1rem; background:rgba(234,179,8,0.08); border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.75rem; color:#cbd5e1; line-height:1.4;">
            🥇 Official Team Medals are awarded based on cumulative scores of each nation's finalists in the Medal Round on September 20.
          </div>
          <div style="font-size:0.85rem;">
            ${teamEvent.competitors.map(function(c, idx) {
              var rank = c.rank || (idx + 1);
              var medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
              var countryName = c.name;
              var flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(countryName) : '';
              var pts = parseInt(c.raw, 10) || parseInt(c.points, 10) || 0;
              var athletes = athletesByCountry[countryName] || athletesByCountry[resolveAthleteCountry(countryName, countryName)] || [];
              return `
                <div style="padding:0.9rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); background:${rank <= 3 ? 'rgba(234,179,8,0.04)' : 'transparent'};">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                      <span style="font-weight:700; font-size:1.1rem; width:24px;">${medal || rank}</span>
                      <span style="font-size:1.2rem;">${flag}</span>
                      <span style="font-weight:700; color:#f8fafc; font-size:0.95rem;">${countryName}</span>
                    </div>
                    <span style="font-family:monospace; font-weight:700; font-size:1.05rem; color:#4ade80;">${pts.toLocaleString()} pts</span>
                  </div>
                  ${athletes.length > 0 ? `
                    <div style="margin-left:2rem; font-size:0.75rem; color:#94a3b8;">
                      ${athletes.map(function(a) { return a.name; }).join(' • ')}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    var qualifiedA = (semiAStandings || []).slice(0, 9);
    var qualifiedB = (semiBStandings || []).slice(0, 9);
    var all18Qualifiers = [...qualifiedA, ...qualifiedB];

    var nationCounts = {};
    all18Qualifiers.forEach(function(a) {
      var c = a.country || 'Other';
      if (!nationCounts[c]) nationCounts[c] = { country: c, athletes: [] };
      nationCounts[c].athletes.push(a);
    });

    var contenders = Object.values(nationCounts).filter(function(n) { return n.athletes.length >= 3; });
    var nonContenders = Object.values(nationCounts).filter(function(n) { return n.athletes.length < 3; });

    contenders.sort(function(a, b) { return b.athletes.length - a.athletes.length; });
    nonContenders.sort(function(a, b) { return b.athletes.length - a.athletes.length; });

    return `
      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:1.5rem; overflow:hidden;">
        <div style="padding:0.85rem 1rem; font-weight:700; font-size:0.95rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02);">
          <span>👥 Team Medal Contenders (18-Athlete Final)</span>
          <span style="font-size:0.75rem; color:#38bdf8; font-weight:600;">Qualification Status</span>
        </div>
        <div style="padding:0.85rem 1rem; background:rgba(56,189,248,0.05); border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.8rem; color:#94a3b8; line-height:1.45;">
          ℹ️ <strong>Official Team Rule:</strong> Modern Pentathlon team medals are awarded strictly based on cumulative points scored in the <strong>Final on September 20</strong>. Only nations that qualify a full squad of <strong>3 athletes</strong> into the Final contend for Team medals.
        </div>
        <div style="padding:0.75rem 1rem 0.25rem 1rem;">
          <span style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; color:#4ade80; font-weight:700;">
            Eligible for Team Medals (3 Finalists Qualified)
          </span>
        </div>
        <div style="font-size:0.85rem;">
          ${contenders.length > 0 ? contenders.map(function(team) {
            var flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(team.country) : '';
            return `
              <div style="padding:0.75rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); background:rgba(74,222,128,0.03);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                  <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span style="font-size:1.15rem;">${flag}</span>
                    <span style="font-weight:700; color:#f8fafc;">${team.country}</span>
                  </div>
                  <span style="font-size:0.75rem; background:rgba(74,222,128,0.15); color:#4ade80; border:1px solid rgba(74,222,128,0.3); padding:2px 8px; border-radius:12px; font-weight:700;">
                    ${team.athletes.length} Finalists
                  </span>
                </div>
                <div style="margin-left:1.8rem; font-size:0.75rem; color:#94a3b8;">
                  ${team.athletes.map(function(a) { return a.name; }).join(' • ')}
                </div>
              </div>
            `;
          }).join('') : `
            <div style="padding:1rem; text-align:center; color:#94a3b8; font-size:0.8rem;">
              Qualification in progress. Finalists will appear here once semifinals conclude.
            </div>
          `}
          ${nonContenders.length > 0 ? `
            <div style="padding:0.75rem 1rem 0.25rem 1rem; margin-top:0.5rem;">
              <span style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; color:#ef4444; font-weight:700;">
                Ineligible for Team Medals (&lt; 3 Finalists)
              </span>
            </div>
            ${nonContenders.map(function(team) {
              var flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(team.country) : '';
              return `
                <div style="padding:0.65rem 1rem; border-bottom:1px solid rgba(255,255,255,0.03); display:flex; justify-content:space-between; align-items:center; opacity:0.65;">
                  <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span>${flag}</span>
                    <span style="color:#cbd5e1;">${team.country}</span>
                  </div>
                  <span style="font-size:0.75rem; color:#94a3b8;">${team.athletes.length} finalist${team.athletes.length > 1 ? 's' : ''} (DNQ)</span>
                </div>
              `;
            }).join('')}
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderPredictionsLayout(predData, isWomen) {
    if (!predData) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">Loading statistical predictions...</div>`;
    }
    var individual = (isWomen ? predData.women : predData.men) || [];
    if (!Array.isArray(individual) || individual.length === 0) {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No predictions available.</div>`;
    }

    var top3 = individual.slice(0, 3);
    var teamEvent = (predData.events || []).find(function(e) {
      return (isWomen ? e.event.includes("Women's Team") : e.event.includes("Men's Team"));
    });
    var teamList = teamEvent ? (teamEvent.rankings || []) : [];

    return `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:1rem; margin-bottom:1.5rem;">
        ${top3.map(function(a, idx) {
          var medal = idx === 0 ? '🥇 Gold Favorite' : idx === 1 ? '🥈 Silver Contender' : '🥉 Bronze Contender';
          var medalColor = idx === 0 ? '#facc15' : idx === 1 ? '#cbd5e1' : '#f59e0b';
          var flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(a.team || a.country) : '';
          var winProb = a.gold || a.win_prob || '0%';
          var podProb = a.podium || a.medal_prob || '0%';
          return `
            <div style="background:var(--card-bg, #1e293b); border:1px solid ${medalColor}40; border-radius:12px; padding:1.2rem; box-shadow:0 4px 15px rgba(0,0,0,0.25);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                <span style="font-size:0.75rem; font-weight:700; color:${medalColor}; text-transform:uppercase; letter-spacing:0.05em;">${medal}</span>
                <span style="font-size:0.75rem; background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:12px; font-weight:700; color:#38bdf8;">${winProb} Win</span>
              </div>
              <div style="font-size:1.15rem; font-weight:700; color:#f8fafc; margin-bottom:0.2rem; display:flex; align-items:center; gap:0.4rem;">
                <span>${flag}</span> <span>${a.athlete || a.name}</span>
              </div>
              <div style="font-size:0.75rem; color:#94a3b8; margin-bottom:0.75rem;">${a.team || a.country}</div>
              <div style="margin-top:0.6rem;">
                <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:#94a3b8; margin-bottom:0.25rem;">
                  <span>Podium Probability</span>
                  <span style="font-weight:700; color:#cbd5e1;">${podProb}</span>
                </div>
                <div style="height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden;">
                  <div style="width:${parseInt(podProb, 10) || 0}%; height:100%; background:${medalColor};"></div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:1.5rem; overflow-x:auto;">
        <div style="padding:0.85rem 1rem; font-weight:700; font-size:0.95rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02);">
          <span>🔮 Individual Medal Projections</span>
          <span style="font-size:0.72rem; color:#94a3b8;">Monte Carlo Simulation (50,000 Runs)</span>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:0.85rem; text-align:center;">
          <thead>
            <tr style="color:#94a3b8; font-size:0.72rem; border-bottom:1px solid rgba(255,255,255,0.05); background:rgba(0,0,0,0.15);">
              <th style="padding:0.65rem 0.6rem; text-align:left;"># Contender</th>
              <th style="padding:0.65rem 0.4rem; color:#facc15;">🥇 Gold</th>
              <th style="padding:0.65rem 0.4rem; color:#cbd5e1;">🥈 Silver</th>
              <th style="padding:0.65rem 0.4rem; color:#f59e0b;">🥉 Bronze</th>
              <th style="padding:0.65rem 0.5rem; text-align:right; color:#38bdf8;">Podium</th>
            </tr>
          </thead>
          <tbody>
            ${individual.map(function(a, idx) {
              var rank = a.rank || (idx + 1);
              var flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(a.team || a.country) : '';
              return `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.03); background:${rank <= 3 ? 'rgba(234,179,8,0.03)' : 'transparent'};">
                  <td style="padding:0.65rem 0.6rem; text-align:left;">
                    <div style="display:flex; align-items:center; gap:0.4rem;">
                      <span style="width:18px; font-weight:700; color:${rank === 1 ? '#facc15' : rank === 2 ? '#cbd5e1' : rank === 3 ? '#f59e0b' : '#94a3b8'};">${rank}</span>
                      <div>
                        <div style="font-weight:600; color:#f8fafc; display:flex; align-items:center; gap:0.35rem;">
                          <span>${flag}</span> <span>${a.athlete || a.name}</span>
                        </div>
                        <div style="font-size:0.7rem; color:#94a3b8; margin-left:1.35rem;">${a.team || a.country}</div>
                      </div>
                    </div>
                  </td>
                  <td style="padding:0.65rem 0.4rem; font-family:monospace; color:#facc15; font-weight:700;">${a.gold}</td>
                  <td style="padding:0.65rem 0.4rem; font-family:monospace; color:#cbd5e1;">${a.silver}</td>
                  <td style="padding:0.65rem 0.4rem; font-family:monospace; color:#f59e0b;">${a.bronze}</td>
                  <td style="padding:0.65rem 0.5rem; text-align:right; font-weight:700; color:#38bdf8;">${a.podium}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      ${teamList.length > 0 ? `
        <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; margin-bottom:1.5rem; overflow:hidden;">
          <div style="padding:0.85rem 1rem; font-weight:700; font-size:0.95rem; border-bottom:1px solid rgba(255,255,255,0.06); display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02);">
            <span>👥 Team Medal Projections</span>
            <span style="font-size:0.72rem; color:#facc15;">3 Finalists Required</span>
          </div>
          <div style="font-size:0.85rem;">
            ${teamList.map(function(team, idx) {
              var medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
              var flag = typeof getFlagEmoji === 'function' ? getFlagEmoji(team.team || team.country) : '';
              return `
                <div style="padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); background:${idx <= 2 ? 'rgba(234,179,8,0.03)' : 'transparent'};">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
                    <div style="display:flex; align-items:center; gap:0.5rem;">
                      <span style="font-weight:700; width:22px;">${medal || idx + 1}</span>
                      <span style="font-size:1.15rem;">${flag}</span>
                      <span style="font-weight:700; color:#f8fafc;">${team.team || team.country}</span>
                    </div>
                    <div style="display:flex; gap:0.75rem; font-family:monospace; font-size:0.82rem;">
                      <span style="color:#facc15;">🥇 ${team.gold}</span>
                      <span style="color:#cbd5e1;">🥈 ${team.silver}</span>
                      <span style="color:#f59e0b;">🥉 ${team.bronze}</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }

  window.setMpnStandingsTab = function (tab) {
    activeMpnStandingsTab = tab;
    var bIndiv = document.getElementById('mpn-tab-btn-indiv');
    var bTeam = document.getElementById('mpn-tab-btn-team');
    var cIndiv = document.getElementById('mpn-indiv-content');
    var cTeam = document.getElementById('mpn-team-content');

    if (tab === 'team') {
      if (bIndiv) { bIndiv.style.background = 'transparent'; bIndiv.style.color = '#94a3b8'; }
      if (bTeam) { bTeam.style.background = '#2563eb'; bTeam.style.color = '#ffffff'; }
      if (cIndiv) cIndiv.style.display = 'none';
      if (cTeam) cTeam.style.display = 'block';
    } else {
      if (bIndiv) { bIndiv.style.background = '#2563eb'; bIndiv.style.color = '#ffffff'; }
      if (bTeam) { bTeam.style.background = 'transparent'; bTeam.style.color = '#94a3b8'; }
      if (cIndiv) cIndiv.style.display = 'block';
      if (cTeam) cTeam.style.display = 'none';
    }
  };

  var engineDefinition = {
    icon: '🎯',
    hasBracket: false,

    renderMatches: function (data) {
      try {
        return renderPentathlonTimeline(data);
      } catch (err) {
        console.error("MPN renderMatches error:", err);
        return `<div style="text-align:center; padding:2rem; color:#94a3b8;">Error displaying timetable.</div>`;
      }
    },

    renderStandingsTable: function (data) {
      try {
        var list = Array.isArray(data) ? data : (data && (data.events || data.matches)) || [];
        if (!list || list.length === 0) {
          return `<div style="text-align:center; padding:2rem; color:#94a3b8;">No standings data available.</div>`;
        }

        var isWomen = (typeof currentGender !== 'undefined' && currentGender === 'women') ||
                      (window.currentGender === 'women') ||
                      (data && data.sport && data.sport.toLowerCase().includes('women')) ||
                      (list[0] && list[0].id && list[0].id.startsWith('W.')) ||
                      (list[0] && list[0].discipline && list[0].discipline.toLowerCase().includes('women')) ||
                      (list[0] && list[0].round && list[0].round.toLowerCase().includes('women'));

        var groupAEvents = list.filter(function(ev) { return getNormalizedPhaseGroup(ev).includes('Group A'); });
        var groupBEvents = list.filter(function(ev) { return getNormalizedPhaseGroup(ev).includes('Group B'); });
        var finalEvents = list.filter(function(ev) { return getNormalizedPhaseGroup(ev) === 'Final' && (ev.competitors || []).length > 0; });

        var groupAStandings = buildGroupStandings(groupAEvents, false);
        var groupBStandings = buildGroupStandings(groupBEvents, false);
        var finalStandings = finalEvents.length > 0 ? buildGroupStandings(finalEvents, true) : [];

        var indivHtml = '';
        if (finalStandings.length > 0) indivHtml += renderGroupTable('Final Classification', finalStandings, true);
        if (groupAStandings.length > 0) indivHtml += renderGroupTable('Semi-final • Group A', groupAStandings, false);
        if (groupBStandings.length > 0) indivHtml += renderGroupTable('Semi-final • Group B', groupBStandings, false);

        var teamHtml = renderOfficialTeamView(finalStandings, groupAStandings, groupBStandings, list, isWomen);

        return `
          <div style="background:var(--card-bg, #1e293b); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.25rem; margin-bottom:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem; margin-bottom:0.75rem;">
              <div style="font-weight:700; font-size:1.05rem; display:flex; align-items:center; gap:0.5rem;">
                <span>🎯 Modern Pentathlon ${isWomen ? "(Women)" : "(Men)"} Standings</span>
              </div>
              <div style="display:inline-flex; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:20px; padding:3px; gap:4px;">
                <button id="mpn-tab-btn-indiv" onclick="window.setMpnStandingsTab('individual')" style="border:none; padding:0.35rem 0.85rem; border-radius:16px; font-size:0.75rem; font-weight:700; cursor:pointer; transition:all 0.15s ease; ${activeMpnStandingsTab === 'individual' ? 'background:#2563eb; color:#ffffff;' : 'background:transparent; color:#94a3b8;'}">
                  👤 Individual
                </button>
                <button id="mpn-tab-btn-team" onclick="window.setMpnStandingsTab('team')" style="border:none; padding:0.35rem 0.85rem; border-radius:16px; font-size:0.75rem; font-weight:700; cursor:pointer; transition:all 0.15s ease; ${activeMpnStandingsTab === 'team' ? 'background:#2563eb; color:#ffffff;' : 'background:transparent; color:#94a3b8;'}">
                  👥 Team Event
                </button>
              </div>
            </div>
            <p style="color:#94a3b8; font-size:0.82rem; margin:0; line-height:1.4;">
              The top 9 athletes from Group A and top 9 from Group B advance to the 18-athlete Final. Team medals are determined strictly by the aggregate points of each nation's finalists in the medal session.
            </p>
          </div>

          <div id="mpn-standings-view-container">
            <div id="mpn-indiv-content" style="display:${activeMpnStandingsTab === 'individual' ? 'block' : 'none'};">
              ${indivHtml}
            </div>
            <div id="mpn-team-content" style="display:${activeMpnStandingsTab === 'team' ? 'block' : 'none'};">
              ${teamHtml}
            </div>
          </div>
          ${renderBottomSheetTemplate()}
        `;
      } catch (err) {
        console.error("MPN renderStandingsTable error:", err);
        return `<div style="text-align:center; padding:2rem; color:#94a3b8;">Error displaying standings.</div>`;
      }
    },

    renderPredictions: function (data) {
      try {
        var isWomen = (typeof currentGender !== 'undefined' && currentGender === 'women') ||
                      (window.currentGender === 'women') ||
                      (data && data.sport && data.sport.toLowerCase().includes('women')) ||
                      (activePentathlonEvents[0] && (activePentathlonEvents[0].id && activePentathlonEvents[0].id.startsWith('W.')));

        if (data && (data.men || data.women)) {
          mpnPredictionsCache = data;
          return renderPredictionsLayout(data, isWomen);
        }

        if (mpnPredictionsCache) {
          return renderPredictionsLayout(mpnPredictionsCache, isWomen);
        }

        setTimeout(function() {
          fetch('data/modern_pentathlon/predictions.json')
            .then(function(r) { return r.json(); })
            .then(function(pData) {
              mpnPredictionsCache = pData;
              var target = document.getElementById('predictions-container') || document.getElementById('content-cards');
              if (target) target.innerHTML = renderPredictionsLayout(pData, isWomen);
            })
            .catch(function(e) { console.error("Could not fetch predictions.json", e); });
        }, 50);

        return `<div id="mpn-pred-loading" style="text-align:center; padding:2.5rem; color:#94a3b8;">Loading statistical predictions...</div>`;
      } catch (err) {
        console.error("MPN renderPredictions error:", err);
        return `<div style="text-align:center; padding:2rem; color:#94a3b8;">Error displaying predictions.</div>`;
      }
    },

    renderKnockoutBracket: function () {
      return `<div style="text-align:center; padding:2rem; color:#94a3b8;">Modern Pentathlon uses cumulative point totals across phases rather than a knockout bracket. View the Matches tab for the session timetable.</div>`;
    }
  };

  // Register across all potential sport keys used by router
  window.SPORT_ENGINES['modern_pentathlon'] = engineDefinition;
  window.SPORT_ENGINES['modern-pentathlon'] = engineDefinition;
  window.SPORT_ENGINES['Modern Pentathlon'] = engineDefinition;
})();
