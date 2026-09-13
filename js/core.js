// --- Mobile Error Boundary ---
window.onerror = function(msg, url, line) {
  const el = document.getElementById('content-cards');
  if (el) {
    el.innerHTML = `
      <div class="error-box">
        <strong>⚠️ JavaScript Runtime Error:</strong><br>${msg}<br>
        <small style="color:var(--text-muted);">Line ${line} in ${url ? url.split('/').pop() : 'script'}</small>
      </div>
    `;
  }
  return false;
};

// --- Country / NOC Catalog ---
const NOC_MAP = {
  "bahrain": { code: "BRN", flag: "🇧🇭", name: "Bahrain" },
  "china": { code: "CHN", flag: "🇨🇳", name: "China" },
  "chinese taipei": { code: "TPE", flag: "🇹🇼", name: "Chinese Taipei" },
  "taipei": { code: "TPE", flag: "🇹🇼", name: "Chinese Taipei" },
  "hong kong": { code: "HKG", flag: "🇭🇰", name: "Hong Kong" },
  "hong kong, china": { code: "HKG", flag: "🇭🇰", name: "Hong Kong, China" },
  "india": { code: "IND", flag: "🇮🇳", name: "India" },
  "indonesia": { code: "INA", flag: "🇮🇩", name: "Indonesia" },
  "iran": { code: "IRI", flag: "🇮🇷", name: "IR Iran" },
  "ir iran": { code: "IRI", flag: "🇮🇷", name: "IR Iran" },
  "japan": { code: "JPN", flag: "🇯🇵", name: "Japan" },
  "jordan": { code: "JOR", flag: "🇯🇴", name: "Jordan" },
  "kazakhstan": { code: "KAZ", flag: "🇰🇿", name: "Kazakhstan" },
  "korea": { code: "KOR", flag: "🇰🇷", name: "Korea" },
  "south korea": { code: "KOR", flag: "🇰🇷", name: "South Korea" },
  "kuwait": { code: "KUW", flag: "🇰🇼", name: "Kuwait" },
  "lebanon": { code: "LBN", flag: "🇱🇧", name: "Lebanon" },
  "macau": { code: "MAC", flag: "🇲🇴", name: "Macau" },
  "malaysia": { code: "MAS", flag: "🇲🇾", name: "Malaysia" },
  "mongolia": { code: "MGL", flag: "🇲🇳", name: "Mongolia" },
  "philippines": { code: "PHI", flag: "🇵🇭", name: "Philippines" },
  "qatar": { code: "QAT", flag: "🇶🇦", name: "Qatar" },
  "saudi arabia": { code: "KSA", flag: "🇸🇦", name: "Saudi Arabia" },
  "singapore": { code: "SGP", flag: "🇸🇬", name: "Singapore" },
  "thailand": { code: "THA", flag: "🇹🇭", name: "Thailand" },
  "united arab emirates": { code: "UAE", flag: "🇦🇪", name: "UAE" },
  "uae": { code: "UAE", flag: "🇦🇪", name: "UAE" },
  "uzbekistan": { code: "UZB", flag: "🇺🇿", name: "Uzbekistan" }
};

function normName(name) {
  if (!name || typeof name !== 'string') return "";
  return name.trim().toLowerCase()
    .replace(/\s*\(host\)/gi, "")
    .replace(/^republic of korea/gi, "korea")
    .replace(/^south korea/gi, "korea")
    .replace(/^ir\s+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getNOCInfo(teamName) {
  if (!teamName || typeof teamName !== 'string') return { code: "", flag: "🏳️", name: "" };
  const raw = teamName.trim().toLowerCase();
  const norm = normName(teamName);
  return NOC_MAP[raw] || NOC_MAP[norm] || {
    code: teamName.slice(0, 3).toUpperCase(),
    flag: "🏀",
    name: teamName
  };
}

function extractList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.matches)) return raw.matches;
    if (Array.isArray(raw.teams)) return raw.teams;
    if (Array.isArray(raw.predictions)) return raw.predictions;
    if (Array.isArray(raw.data)) return raw.data;
  }
  return [];
}

function formatMatchTime(dateStr, timeStr) {
  if (!dateStr || !timeStr || timeStr === "TBD" || timeStr === "00:00") {
    if (dateStr) {
      const parts = dateStr.split('-');
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `📅 ${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]} • Time TBD`;
    }
    return "📅 Date TBD";
  }

  try {
    const jstIso = `${dateStr}T${timeStr}:00+09:00`;
    const matchDate = new Date(jstIso);
    if (isNaN(matchDate.getTime())) return `📅 ${dateStr} • ${timeStr}`;

    const day = matchDate.getDate();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = months[matchDate.getMonth()];

    let hours = matchDate.getHours();
    const minutes = matchDate.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    const hourStr = hours.toString().padStart(2, '0');

    const offsetMin = -matchDate.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const absMin = Math.abs(offsetMin);
    const offH = Math.floor(absMin / 60);
    const offM = (absMin % 60).toString().padStart(2, '0');
    const tzStr = `GMT${sign}${offH}:${offM}`;

    return `📅 ${day} ${month} • ${hourStr}:${minutes} ${ampm} (${tzStr})`;
  } catch (e) {
    return `📅 ${dateStr} • ${timeStr}`;
  }
}
