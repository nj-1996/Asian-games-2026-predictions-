// --- Application State ---
let currentTab = 'matches';
let currentGender = 'men';
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
