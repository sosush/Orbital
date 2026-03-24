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

export async function fetchSatellites(groupIds = ['stations', 'visual']) {
  const results = [];

  const promises = groupIds.map(async (groupId) => {
    const config = GROUPS[groupId];
    if (!config) return [];
    try {
      const resp = await fetch(config.url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const text = await resp.text();
      const sats = parseTLE(text);
      sats.forEach(s => { s.category = groupId; s.categoryLabel = config.label; });
      return sats;
    } catch (err) {
      console.warn(`Failed to fetch ${groupId}:`, err);
      return [];
    }
  });

  const groups = await Promise.all(promises);
  groups.forEach(g => results.push(...g));

  // Deduplicate by NORAD ID  
  const seen = new Set();
  return results.filter(sat => {
    const id = sat.tle1.substring(2, 7).trim();
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export { GROUPS as SATELLITE_GROUPS };
