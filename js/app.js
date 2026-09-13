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

// --- Resilient Fetch Prober ---
async function fetchJsonAnywhere(paths) {
  for (const path of paths) {
    try {
      const res = await fetch(`${path}?t=${Date.now()}`);
      if (res.ok) {
        const parsed = await res.json();
        if (parsed) return parsed;
      }
    } catch (e) {}
  }
  return null;
}

async function loadAllData() {
  try {
    const menTrackerRaw = await fetchJsonAnywhere([
      'data/basketball/tracker_men.json',
      'tracker_men.json',
      'data/tracker_men.json'
    ]);
    appData.menMatches = extractList(menTrackerRaw);

    const womenTrackerRaw = await fetchJsonAnywhere([
      'data/basketball/tracker_women.json',
      'tracker_women.json',
      'data/tracker_women.json'
    ]);
    appData.womenMatches = extractList(womenTrackerRaw);

    const predRaw = await fetchJsonAnywhere([
      'data/basketball/predictions.json',
      'predictions.json',
      'data/predictions.json',
      'data/basketball/predictions_men.json'
    ]);

    if (predRaw && !Array.isArray(predRaw) && (predRaw.men || predRaw.women)) {
      appData.menPredictions = extractList(predRaw.men);
      appData.womenPredictions = extractList(predRaw.women);
    } else {
      appData.menPredictions = extractList(predRaw);
      const womenPredRaw = await fetchJsonAnywhere([
        'data/basketball/predictions_women.json',
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
  }, 3000);
}

// --- Live Sync Button & Remote Workflow Dispatcher ---
async function triggerGitHubWorkflowIfAvailable() {
  const repo = 'nj-1996/Asian-games-2026-predictions-';
  let token = localStorage.getItem('gh_sync_token');

  // If no token exists yet, offer the user a prompt to save one for 1-tap remote workflow triggering
  if (!token && confirm("Trigger GitHub Scraper Action directly?\n\nTap OK to enter your Personal Access Token (stored only on your phone), or Cancel to just re-fetch the latest data.")) {
    token = prompt("Paste your GitHub Personal Access Token (classic with 'repo' or fine-grained with 'actions:write'):");
    if (token && token.trim()) {
      token = token.trim();
      localStorage.setItem('gh_sync_token', token);
    }
  }

  if (!token) return false;

  try {
    // Attempt triggering common workflow files (tracker.yml, scrape.yml, or main.yml)
    const workflowFiles = ['tracker.yml', 'scrape.yml', 'main.yml'];
    let triggered = false;

    for (const wf of workflowFiles) {
      const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${wf}/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ref: 'main' })
      });

      if (res.ok || res.status === 204) {
        triggered = true;
        break;
      }
    }

    return triggered;
  } catch (err) {
    console.warn("Workflow dispatch error:", err);
    return false;
  }
}

async function handleManualSync() {
  if (isSyncing) return;
  isSyncing = true;

  const btn = document.getElementById('live-sync-btn');
  const indicator = document.getElementById('sync-indicator');
  const label = document.getElementById('sync-label');

  // 1. Enter Fetching State
  btn.classList.add('is-syncing');
  btn.classList.remove('is-success');
  if (indicator) indicator.style.display = 'none';

  // Optional workflow trigger via GitHub API
  await triggerGitHubWorkflowIfAvailable();

  // 2. Countdown Timer (14 seconds to allow the action to run / poll fresh data)
  let remainingSeconds = 14;
  label.innerHTML = `<span class="sync-spin-icon">🔄</span> Fetching (${remainingSeconds}s)...`;

  const timer = setInterval(() => {
    remainingSeconds--;
    if (remainingSeconds > 0) {
      label.innerHTML = `<span class="sync-spin-icon">🔄</span> Fetching (${remainingSeconds}s)...`;
    } else {
      clearInterval(timer);
    }
  }, 1000);

  // Wait 14 seconds for scraping/generation
  await new Promise(r => setTimeout(r, 14000));
  clearInterval(timer);

  // 3. Re-fetch all data files with cache-busting
  label.innerHTML = `<span class="sync-spin-icon">🔄</span> Reloading...`;
  await loadAllData();

  // 4. Success State
  btn.classList.remove('is-syncing');
  btn.classList.add('is-success');
  label.innerHTML = `✓ Synced`;
  showToast("✅ Fetch complete! Dashboard updated.");

  // Reset to idle after 3 seconds
  setTimeout(() => {
    btn.classList.remove('is-success');
    label.innerHTML = `Live Sync`;
    if (indicator) indicator.style.display = 'inline-block';
    isSyncing = false;
  }, 3000);
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
