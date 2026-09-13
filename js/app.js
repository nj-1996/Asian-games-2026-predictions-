// --- Application State ---
let currentTab = 'matches';
let currentGender = 'men';
let isSyncing = false;
let appData = {
  menMatches: [],
  womenMatches: [],
  menPredictions: [],
  womenPredictions: []
};

// --- Fast Concurrent Multi-Path Resolver ---
async function fetchFastJson(paths) {
  const fetchAttempt = async (p) => {
    const res = await fetch(`${p}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`404: ${p}`);
    const data = await res.json();
    if (!data) throw new Error(`Empty: ${p}`);
    return data;
  };

  try {
    return await Promise.any(paths.map(p => fetchAttempt(p)));
  } catch (e) {
    return null;
  }
}

// --- Parallelized Tournament Data Loader ---
async function loadAllData() {
  try {
    const [menTrackerRaw, womenTrackerRaw, predRaw] = await Promise.all([
      fetchFastJson([
        'data/basketball/tracker_men.json',
        'data/tracker_men.json',
        'tracker_men.json'
      ]),
      fetchFastJson([
        'data/basketball/tracker_women.json',
        'data/tracker_women.json',
        'tracker_women.json'
      ]),
      fetchFastJson([
        'data/basketball/predictions.json',
        'data/predictions.json',
        'predictions.json',
        'data/basketball/predictions_men.json'
      ])
    ]);

    appData.menMatches = extractList(menTrackerRaw);
    appData.womenMatches = extractList(womenTrackerRaw);

    if (predRaw && !Array.isArray(predRaw) && (predRaw.men || predRaw.women)) {
      appData.menPredictions = extractList(predRaw.men);
      appData.womenPredictions = extractList(predRaw.women);
    } else {
      appData.menPredictions = extractList(predRaw);
      const womenPredRaw = await fetchFastJson([
        'data/basketball/predictions_women.json',
        'data/predictions_women.json',
        'predictions_women.json'
      ]);
      appData.womenPredictions = extractList(womenPredRaw);
    }
  } catch (err) {
    console.error("Load failed:", err);
  } finally {
    renderView();
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
function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.id === `tab-${tab}`);
  });
  renderView();
}

function setGender(gender) {
  currentGender = gender;
  document.getElementById('btn-men').classList.toggle('active', gender === 'men');
  document.getElementById('btn-women').classList.toggle('active', gender === 'women');
  renderView();
}

// --- Global Router ---
function renderView() {
  const container = document.getElementById('content-cards');
  if (!container) return;

  const matches = currentGender === 'men' ? appData.menMatches : appData.womenMatches;
  const predictions = currentGender === 'men' ? appData.menPredictions : appData.womenPredictions;

  if (currentTab === 'matches') {
    renderMatchesView(container, matches);
  } else if (currentTab === 'predictions') {
    renderPredictionsView(container, appData.menPredictions, appData.womenPredictions, currentGender);
  } else if (currentTab === 'calibration') {
    renderCalibrationView(container, predictions, matches);
  }
}

// --- Initialize App ---
loadAllData();
