const GROUPS = {
  stations: { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle', label: 'Stations' },
  visual: { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle', label: 'Visual' },
  weather: { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=weather&FORMAT=tle', label: 'Weather' },
  gps: { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle', label: 'GPS' },
  science: { url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=science&FORMAT=tle', label: 'Science' },
};

function parseTLE(tleText) {
  const lines = tleText.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const sats = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    if (!lines[i + 1].startsWith('1') || !lines[i + 2].startsWith('2')) continue;
    sats.push({
      name: lines[i].replace(/^0\s+/, ''),
      tle1: lines[i + 1],
      tle2: lines[i + 2],
    });
  }
  return sats;
}

async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { signal: controller.signal, mode: 'cors' });
    clearTimeout(timeoutId);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

const MOCK_SATELLITES = [
  { name: 'ISS (ZARYA)', tle1: '1 25544U 98067A   26085.51782407  .00016717  00000-0  29119-3 0  9996', tle2: '2 25544  51.6407 339.8014 0006565  89.0842 271.2356 15.54223191438350', category: 'stations', categoryLabel: 'Stations' },
  { name: 'HUBBLE SPACE TELESCOPE', tle1: '1 20580U 90037B   26085.40476852  .00001537  00000-0  67850-4 0  9993', tle2: '2 20580  28.4699 184.9199 0002825 267.8702  92.1832 15.09705278756380', category: 'visual', categoryLabel: 'Visual' },
  { name: 'TIANGONG', tle1: '1 48274U 21035A   26085.51505787  .00002411  00000-0  13435-3 0  9993', tle2: '2 48274  41.4709 192.1863 0002141  68.9861 291.2109 15.51994262209810', category: 'stations', categoryLabel: 'Stations' },
  { name: 'STARLINK-1001', tle1: '1 44713U 19070A   26085.52341597  .00000726  00000-0  39104-4 0  9991', tle2: '2 44713  53.0538 162.2945 0001343  97.2174 262.9595 15.06238256337877', category: 'visual', categoryLabel: 'Visual' },
  { name: 'NOAA 20', tle1: '1 43013U 17073A   26085.42025694  .00000213  00000-0  98856-5 0  9999', tle2: '2 43013  99.0045  97.2879 0014885 182.4055 177.7430 14.12542230525621', category: 'weather', categoryLabel: 'Weather' },
];

export async function fetchSatellites(groupIds = ['stations', 'visual']) {
  const results = [];
  const promises = groupIds.map(async (groupId) => {
    const config = GROUPS[groupId];
    if (!config) return [];
    
    // Try multiple endpoints in fallback order
    const urls = [
      config.url,
      `https://api.celestrak.org/v2/satellite/query?search=${groupId.includes('stations') ? 'stations' : groupId}&format=tle`,
      `https://www.celestrak.com/NORAD/elements/${groupId.replace('gps-ops', 'gps')}.txt`,
    ];
    
    for (const url of urls) {
      try {
        console.log(`[fetchSatellites] Fetching ${groupId} from: ${url}`);
        const text = await fetchWithTimeout(url, 4000);
        const sats = parseTLE(text);
        if (sats.length > 0) {
          console.log(`[fetchSatellites] ✓ Got ${sats.length} ${groupId} satellites`);
          sats.forEach(s => { s.category = groupId; s.categoryLabel = config.label; });
          return sats;
        }
      } catch (err) {
        console.warn(`[fetchSatellites] Endpoint failed (${groupId}):`, err.message);
      }
    }
    
    console.warn(`[fetchSatellites] All endpoints failed for ${groupId}, using mock fallback`);
    return MOCK_SATELLITES.filter(s => s.category === groupId);
  });
  
  const groups = await Promise.all(promises);
  groups.forEach(g => results.push(...g));
  const seen = new Set();
  return results.filter(sat => {
    const id = sat.tle1?.substring(2, 7).trim() || sat.name;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export { GROUPS as SATELLITE_GROUPS };
