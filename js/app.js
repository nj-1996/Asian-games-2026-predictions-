// --- Application State ---
let currentSport = localStorage.getItem('app_sport') || 'basketball';
let currentTab = 'matches';
let currentGender = 'men';
window.currentSport = currentSport;
window.currentGender = currentGender;
let isSyncing = false;
let appData = {
  menMatches: [],
  womenMatches: [],
  mixedMatches: [],
  menPredictions: [],
  womenPredictions: [],
  mixedPredictions: [],
  predictionEvents: []
};
window.appData = appData;

// --- Fast Concurrent Multi-Path Resolver ---
async function fetchFastJson(paths) {
  if (!Array.isArray(paths) || paths.length === 0) return null;
  const fetchAttempt = async (p) => {
    const res = await fetch(`${p}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`404: ${p}`);
    const data = await res.json();
    if (!data) throw new Error(`Empty: ${p}`);
    return data;
  };

  try {
    return await fetchAttempt(paths[0]);
  } catch (err) {
    if (paths.length === 1) return null;
    try {
      return await Promise.any(paths.slice(1).map(p => fetchAttempt(p)));
    } catch (e) {
      return null;
    }
  }
}

// --- Parallelized Tournament Data Loader ---
let currentLoadId = 0;
async function loadAllData() {
  const loadId = ++currentLoadId;
  try {
    const sport = currentSport;

    const [menTrackerRaw, womenTrackerRaw, mixedTrackerRaw, predRaw] = await Promise.all([
      fetchFastJson([
        `data/${sport}/tracker_men.json`,
        `data/${sport}/tracker.json`,
        `data/tracker_men.json`,
        `tracker_men.json`
      ]),
      fetchFastJson([
        `data/${sport}/tracker_women.json`,
        `data/tracker_women.json`,
        `tracker_women.json`
      ]),
      fetchFastJson([
        `data/${sport}/tracker_mixed.json`,
        `data/tracker_mixed.json`,
        `tracker_mixed.json`
      ]),
      fetchFastJson([
        `data/${sport}/predictions.json`,
        `data/${sport}/predictions_men.json`,
        `data/predictions.json`,
        `predictions.json`
      ])
    ]);

    if (loadId !== currentLoadId) return;

    const rawMen = extractList(menTrackerRaw) || [];
    const rawWomen = extractList(womenTrackerRaw) || [];
    const rawMixed = extractList(mixedTrackerRaw) || [];

    const isMixedMatch = (m) => {
      const ev = String(m.event || m.name || m.gender || m.round || m.discipline || '').toLowerCase();
      return ev.includes('mixed');
    };

    // Collect all mixed matches from rawMixed, rawMen, and rawWomen
    const allMatches = [...rawMixed, ...rawMen, ...rawWomen];
    const mixedMatchMap = new Map();
    allMatches.filter(isMixedMatch).forEach(m => {
      const id = m.id || `${m.event}_${m.team1 || m.t1}_${m.team2 || m.t2}_${m.date}_${m.time}`;
      if (!mixedMatchMap.has(id)) mixedMatchMap.set(id, m);
    });
    const detectedMixedMatches = Array.from(mixedMatchMap.values());

    appData.predictionEvents = (predRaw && Array.isArray(predRaw.events)) ? predRaw.events : [];
    const hasMixedInPredictions = appData.predictionEvents.some(e => String(e.name || e.event || '').toLowerCase().includes('mixed'));
    const hasMixed = detectedMixedMatches.length > 0 || hasMixedInPredictions;

    if (hasMixed) {
      appData.mixedMatches = detectedMixedMatches;
      appData.menMatches = rawMen.filter(m => !isMixedMatch(m));
      appData.womenMatches = rawWomen.filter(m => !isMixedMatch(m));
    } else {
      appData.mixedMatches = [];
      appData.menMatches = rawMen;
      appData.womenMatches = rawWomen;
    }

    appData.menTrackerRaw = menTrackerRaw;
    appData.womenTrackerRaw = womenTrackerRaw;
    appData.mixedTrackerRaw = mixedTrackerRaw;

    if (predRaw && !Array.isArray(predRaw) && (predRaw.men || predRaw.women || predRaw.mixed)) {
      appData.menPredictions = extractList(predRaw.men);
      appData.womenPredictions = extractList(predRaw.women);
      appData.mixedPredictions = extractList(predRaw.mixed);
    } else {
      appData.menPredictions = extractList(predRaw);
      const [womenPredRaw, mixedPredRaw] = await Promise.all([
        fetchFastJson([
          `data/${sport}/predictions_women.json`,
          `data/predictions_women.json`,
          `predictions_women.json`
        ]),
        fetchFastJson([
          `data/${sport}/predictions_mixed.json`,
          `data/predictions_mixed.json`,
          `predictions_mixed.json`
        ])
      ]);
      if (loadId !== currentLoadId) return;
      appData.womenPredictions = extractList(womenPredRaw);
      appData.mixedPredictions = extractList(mixedPredRaw);
    }

    // Toggle Mixed Button visibility
    const btnMixed = document.getElementById('btn-mixed');
    if (btnMixed) {
      btnMixed.style.display = hasMixed ? '' : 'none';
    }

    // Reset currentGender to 'men' if currently 'mixed' but this sport has no mixed events
    if (currentGender === 'mixed' && !hasMixed) {
      currentGender = 'men';
      window.currentGender = 'men';
      const btnMen = document.getElementById('btn-men');
      const btnWomen = document.getElementById('btn-women');
      if (btnMen) btnMen.classList.add('active');
      if (btnWomen) btnWomen.classList.remove('active');
      if (btnMixed) btnMixed.classList.remove('active');
    }

    window.appData = appData;
  } catch (err) {
    if (loadId !== currentLoadId) return;
    console.error("Load failed:", err);
  } finally {
    if (loadId === currentLoadId) {
      renderView();
    }
  }
}

// --- Toast Notification Helper ---
function showToast(message) {
  const toast = document.getElementById('sync-toast');
  if (!toast) return;
  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

// --- GitHub API Polling Engine ---
const REPO = 'nj-1996/Asian-games-2026-predictions-';

async function fetchRecentWorkflowRuns(token) {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/actions/runs?per_page=6`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.workflow_runs || [];
  } catch (e) {
    return [];
  }
}

// Polls a workflow until complete or timeout
async function pollRunStatus(token, matchFn, onTick, maxWaitMs = 50000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const runs = await fetchRecentWorkflowRuns(token);
    const target = runs.find(matchFn);

    const elapsed = Math.round((Date.now() - start) / 1000);
    if (onTick) onTick(elapsed, target);

    if (target && target.status === 'completed') {
      return { completed: true, conclusion: target.conclusion, run: target };
    }
    await new Promise(r => setTimeout(r, 2500));
  }
  return { completed: false, timeout: true };
}

// --- Smart Live Sync Orchestrator ---
async function handleManualSync() {
  if (isSyncing) return;
  isSyncing = true;

  const btn = document.getElementById('live-sync-btn');
  const indicator = document.getElementById('sync-indicator');
  const label = document.getElementById('sync-label');

  btn.classList.add('is-syncing');
  btn.classList.remove('is-success');
  if (indicator) indicator.style.display = 'none';

  let token = localStorage.getItem('gh_sync_token');

  // If no token exists, prompt user
  if (!token && confirm("Trigger live GitHub scraper?\n\nTap OK to enter your Personal Access Token (stored safely on this phone), or Cancel to reload cached data.")) {
    token = prompt("Paste your GitHub Personal Access Token:");
    if (token && token.trim()) {
      token = token.trim();
      localStorage.setItem('gh_sync_token', token);
    }
  }

  // Fallback: If still no token, do an instant cache-busting re-fetch
  if (!token) {
    label.innerHTML = `<span class="sync-spin-icon">🔄</span> Reloading...`;
    await loadAllData();
    btn.classList.remove('is-syncing');
    btn.classList.add('is-success');
    label.innerHTML = `✓ Reloaded`;
    showToast("Cached data reloaded.");
    setTimeout(() => {
      btn.classList.remove('is-success');
      label.innerHTML = `Live Sync`;
      if (indicator) indicator.style.display = 'inline-block';
      isSyncing = false;
    }, 2500);
    return;
  }

  const triggerTime = Date.now();

  try {
    // 1. Dispatch scraper workflow
    label.innerHTML = `<span class="sync-spin-icon">🔄</span> Dispatching...`;
    const dispatchRes = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/tracker_cron.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ref: 'main' })
    });

    if (!dispatchRes.ok && dispatchRes.status !== 204) {
      throw new Error(`Dispatch failed (${dispatchRes.status})`);
    }

    // 2. Poll the scraper run (tracker_cron.yml)
    const scraperResult = await pollRunStatus(
      token,
      run => run.name.toLowerCase().includes('match tracker') && new Date(run.created_at).getTime() >= triggerTime - 12000,
      (elapsed) => {
        label.innerHTML = `<span class="sync-spin-icon">🔄</span> Scraping (${elapsed}s)...`;
      },
      35000
    );

    // 3. Check if Pages deployment is needed
    label.innerHTML = `<span class="sync-spin-icon">🔄</span> Verifying diff...`;
    await new Promise(r => setTimeout(r, 3000)); // Brief pause for GitHub to register commit

    const recentRuns = await fetchRecentWorkflowRuns(token);
    const hasDeployment = recentRuns.some(
      run => run.name.toLowerCase().includes('pages') && new Date(run.created_at).getTime() >= triggerTime
    );

    if (hasDeployment) {
      // 4. Poll Pages deployment until completed
      await pollRunStatus(
        token,
        run => run.name.toLowerCase().includes('pages') && new Date(run.created_at).getTime() >= triggerTime,
        (elapsed) => {
          label.innerHTML = `<span class="sync-spin-icon">🔄</span> Deploying (${elapsed}s)...`;
        },
        45000
      );
    }

    // 5. Fetch fresh data and update UI
    label.innerHTML = `<span class="sync-spin-icon">🔄</span> Updating...`;
    await loadAllData();

    btn.classList.remove('is-syncing');
    btn.classList.add('is-success');
    label.innerHTML = `✓ Synced`;
    showToast(hasDeployment ? "✅ New scores scraped & deployed!" : "✅ Scraper verified: Scores already up to date.");

  } catch (err) {
    console.error("Sync error:", err);
    await loadAllData();
    btn.classList.remove('is-syncing');
    label.innerHTML = `Sync Complete`;
    showToast("Sync finished with direct reload.");
  } finally {
    setTimeout(() => {
      btn.classList.remove('is-success');
      label.innerHTML = `Live Sync`;
      if (indicator) indicator.style.display = 'inline-block';
      isSyncing = false;
    }, 3000);
  }
}

// --- Navigation Handlers ---
async function handleSportChange(sport, force) {
  if (sport === currentSport && !force) return;
  currentSport = sport;
  window.currentSport = sport;
  localStorage.setItem('app_sport', sport);

  const sel = document.getElementById('sport-select');
  if (sel && sel.value !== sport) sel.value = sport;

  if (typeof window.setMatchesSubView === 'function') {
    window.setMatchesSubView('schedule');
  } else if (typeof activeMatchesSubView !== 'undefined') {
    activeMatchesSubView = 'schedule';
  }
  if (typeof window.activeMatchesSubView !== 'undefined') {
    window.activeMatchesSubView = 'schedule';
  }

  if (typeof window.setPredictionsSubView === 'function') {
    window.setPredictionsSubView('table');
  } else if (typeof activePredictionsSubView !== 'undefined') {
    activePredictionsSubView = 'table';
  }
  if (typeof window.activePredictionsSubView !== 'undefined') {
    window.activePredictionsSubView = 'table';
  }

  if (typeof window.setTeqEventFilter === 'function') {
    window.setTeqEventFilter(null, false);
  }
  if (typeof window.setTeqStandingsEvent === 'function') {
    window.setTeqStandingsEvent(null, false);
  }
  if (typeof window.setTeqBracketEvent === 'function') {
    window.setTeqBracketEvent(null, false);
  }
  if (typeof window.setTeqCalibrationEvent === 'function') {
    window.setTeqCalibrationEvent(null, false);
  }
  if (typeof window.setScheduleEventFilter === 'function') {
    window.setScheduleEventFilter(null, false);
  }
  if (typeof window.setMpnEventFilter === 'function') {
    window.setMpnEventFilter('individual', false);
  }
  if (typeof window.setSoftTennisEventFilter === 'function') {
    window.setSoftTennisEventFilter(null, false);
  }
  if (typeof window.setSoftTennisStandingsEvent === 'function') {
    window.setSoftTennisStandingsEvent(null, false);
  }
  if (typeof window.setSoftTennisBracketEvent === 'function') {
    window.setSoftTennisBracketEvent(null, false);
  }
  if (typeof window.setSoftTennisCalibrationEvent === 'function') {
    window.setSoftTennisCalibrationEvent(null, false);
  }
  window.activePredictionsEventFilter = null;
  window.activeUniversalEventFilter = null;

  await loadAllData();
}

function setTab(tab) {
  currentTab = tab;
  window.currentTab = tab;
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.id === `tab-${tab}`);
  });

  renderView();
}

function setGender(gender) {
  currentGender = gender;
  window.currentGender = gender;
  const btnMen = document.getElementById('btn-men');
  const btnWomen = document.getElementById('btn-women');
  const btnMixed = document.getElementById('btn-mixed');
  if (btnMen) btnMen.classList.toggle('active', gender === 'men');
  if (btnWomen) btnWomen.classList.toggle('active', gender === 'women');
  if (btnMixed) btnMixed.classList.toggle('active', gender === 'mixed');

  if (typeof window.setTeqEventFilter === 'function') {
    window.setTeqEventFilter(null, false);
  }
  if (typeof window.setTeqStandingsEvent === 'function') {
    window.setTeqStandingsEvent(null, false);
  }
  if (typeof window.setTeqBracketEvent === 'function') {
    window.setTeqBracketEvent(null, false);
  }
  if (typeof window.setTeqCalibrationEvent === 'function') {
    window.setTeqCalibrationEvent(null, false);
  }
  if (typeof window.setScheduleEventFilter === 'function') {
    window.setScheduleEventFilter(null, false);
  }
  if (typeof window.setMpnEventFilter === 'function') {
    window.setMpnEventFilter('individual', false);
  }
  if (typeof window.setSoftTennisEventFilter === 'function') {
    window.setSoftTennisEventFilter(null, false);
  }
  if (typeof window.setSoftTennisStandingsEvent === 'function') {
    window.setSoftTennisStandingsEvent(null, false);
  }
  if (typeof window.setSoftTennisBracketEvent === 'function') {
    window.setSoftTennisBracketEvent(null, false);
  }
  if (typeof window.setSoftTennisCalibrationEvent === 'function') {
    window.setSoftTennisCalibrationEvent(null, false);
  }
  window.activePredictionsEventFilter = null;
  window.activeUniversalEventFilter = null;

  renderView();
}

window.handleSportChange = handleSportChange;
window.setTab = setTab;
window.setGender = setGender;
window.handleManualSync = handleManualSync;


// --- Global Router ---
function renderView() {
  const container = document.getElementById('content-cards');
  if (!container) return;

  const matches = currentGender === 'men'
    ? appData.menMatches
    : (currentGender === 'women' ? appData.womenMatches : appData.mixedMatches);
  const predictions = currentGender === 'men'
    ? appData.menPredictions
    : (currentGender === 'women' ? appData.womenPredictions : appData.mixedPredictions);

  if (currentTab === 'matches') {
    renderMatchesView(container, matches);
  } else if (currentTab === 'predictions') {
    renderPredictionsView(
      container,
      appData.menPredictions,
      appData.womenPredictions,
      currentGender,
      appData.menMatches,
      appData.womenMatches,
      appData.mixedPredictions,
      appData.mixedMatches
    );
  } else if (currentTab === 'calibration') {
    renderCalibrationView(container, predictions, matches);
  }
}

// --- Sport Engine Registry & Universal Dispatchers ---
window.SPORT_ENGINES = window.SPORT_ENGINES || {};

// Register baseline basketball engine if not already populated
window.SPORT_ENGINES['basketball'] = window.SPORT_ENGINES['basketball'] || (typeof BASKETBALL_ENGINE !== 'undefined' ? BASKETBALL_ENGINE : {
  icon: '🏀',
  renderStandingsTable: typeof renderStandingsTable === 'function' ? renderStandingsTable : null,
  renderKnockoutBracket: typeof renderKnockoutBracket === 'function' ? renderKnockoutBracket : null
});

// Universal Standings Dispatcher
window.renderStandingsTable = function(matches) {
  const engine = window.SPORT_ENGINES[currentSport] || window.SPORT_ENGINES['basketball'];
  if (engine && typeof engine.renderStandingsTable === 'function') {
    return engine.renderStandingsTable(matches);
  }
  return '<div class="empty-state">Standings view not available for this sport.</div>';
};

// Universal Bracket Dispatcher
window.renderKnockoutBracket = function(matches) {
  const engine = window.SPORT_ENGINES[currentSport] || window.SPORT_ENGINES['basketball'];
  if (engine && typeof engine.renderKnockoutBracket === 'function') {
    return engine.renderKnockoutBracket(matches);
  }
  return '<div class="empty-state">Bracket view not available for this sport.</div>';
};

// Universal Sport Icon & Flag Fallback Dispatcher
if (typeof getFlagEmoji === 'function') {
  const _baseGetFlagEmoji = getFlagEmoji;
  const isNationalFlag = (str) => typeof str === 'string' && /[\uD83C][\uDDE6-\uDDFF]/.test(str);

  window.getFlagEmoji = function(teamName) {
    const resolved = _baseGetFlagEmoji(teamName);
    if (isNationalFlag(resolved)) return resolved;

    const engine = window.SPORT_ENGINES[currentSport] || window.SPORT_ENGINES['basketball'];
    return engine && engine.icon ? engine.icon : '🏅';
  };
}

// --- Initialize App ---
function initSportSync() {
  const sportSelect = document.getElementById('sport-select');
  if (sportSelect) {
    sportSelect.value = currentSport;
  }
}

// Synchronize UI immediately since DOM is already parsed by the dynamic loader
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSportSync);
} else {
  initSportSync();
}

loadAllData();

// Periodic background auto-refresh (every 60 seconds when tab is active)
setInterval(() => {
  if (!isSyncing && typeof document !== 'undefined' && document.visibilityState !== 'hidden') {
    loadAllData();
  }
}, 60000);

// Instant re-fetch whenever the user returns to the tab
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !isSyncing) {
      loadAllData();
    }
  });
}
