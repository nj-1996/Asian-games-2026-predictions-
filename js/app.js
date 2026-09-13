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
// Requests all candidate paths simultaneously and returns the first valid 200 OK
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
    // If every candidate path returns 404, gracefully return null
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

    // Support combined predictions format or standalone files
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
  }, 3000);
}

// --- GitHub Workflow Remote Dispatcher ---
async function triggerGitHubWorkflowIfAvailable() {
  const repo = 'nj-1996/Asian-games-2026-predictions-';
  let token = localStorage.getItem('gh_sync_token');

  if (!token && confirm("Trigger GitHub Scraper Action directly?\n\nTap OK to enter your Personal Access Token (stored only on your phone), or Cancel to just re-fetch latest data.")) {
    token = prompt("Paste your GitHub Personal Access Token (classic with 'repo' or fine-grained with 'actions:write'):");
    if (token && token.trim()) {
      token = token.trim();
      localStorage.setItem('gh_sync_token', token);
    }
  }

  if (!token) return false;

  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/tracker_cron.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ref: 'main' })
    });

    return res.ok || res.status === 204;
  } catch (err) {
    console.warn("Workflow dispatch error:", err);
    return false;
  }
}

// --- Interactive Live Sync Handler ---
async function handleManualSync() {
  if (isSyncing) return;
  isSyncing = true;

  const btn = document.getElementById('live-sync-btn');
  const indicator = document.getElementById('sync-indicator');
  const label = document.getElementById('sync-label');

  // 1. Enter Syncing State
  btn.classList.add('is-syncing');
  btn.classList.remove('is-success');
  if (indicator) indicator.style.display = 'none';

  // Trigger remote GitHub Actions runner
  await triggerGitHubWorkflowIfAvailable();

  // 2. Countdown Timer (14s scraper runtime window)
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

  await new Promise(r => setTimeout(r, 14000));
  clearInterval(timer);

  // 3. Reload latest datasets concurrently
  label.innerHTML = `<span class="sync-spin-icon">🔄</span> Reloading...`;
  await loadAllData();

  // 4. Success State Feedback
  btn.classList.remove('is-syncing');
  btn.classList.add('is-success');
  label.innerHTML = `✓ Synced`;
  showToast("✅ Fetch complete! Dashboard updated.");

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

// --- Global View Router ---
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
