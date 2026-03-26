/**
 * Space debris data service.
 * Fetches debris TLE data from CelesTrak and propagates positions.
 */
import { createSatRec, getPosition } from './propagator';

const DEBRIS_URLS = {
  'cosmos-2251': {
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=cosmos-2251-debris&FORMAT=tle',
    label: 'Cosmos 2251 Debris',
  },
  'iridium-33': {
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=iridium-33-debris&FORMAT=tle',
    label: 'Iridium 33 Debris',
  },
  'fengyun-1c': {
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=1999-025&FORMAT=tle',
    label: 'Fengyun-1C Debris',
  },
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

async function fetchWithTimeout(url, timeoutMs = 4000) {
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

/**
 * Fetch debris TLEs and compute initial positions.
 * Returns array of { id, name, lat, lng, alt, source }.
 */
export async function fetchDebris(maxPerSource = 200) {
  const allDebris = [];

  const promises = Object.entries(DEBRIS_URLS).map(async ([key, config]) => {
    // Try alternative endpoints if primary fails
    const urls = [
      config.url,
      `https://api.celestrak.org/v2/satellite/query?search=${key}&format=tle`,
      `https://www.celestrak.com/NORAD/elements/${key}.txt`,
    ];

    for (const url of urls) {
      try {
        console.log(`[fetchDebris] Fetching ${key}...`);
        const text = await fetchWithTimeout(url, 3000);
        const tles = parseTLE(text).slice(0, maxPerSource);
        
        if (tles.length === 0) continue;
        console.log(`[fetchDebris] ✓ Got ${tles.length} TLEs from ${key}`);

        const items = [];
        for (const tle of tles) {
          try {
            const satrec = createSatRec(tle.tle1, tle.tle2);
            const pos = getPosition(satrec);
            if (!pos) continue;
            const noradId = parseInt(tle.tle1.substring(2, 7)) || Math.random() * 100000;
            items.push({
              id: `debris-${noradId}`,
              noradId,
              name: tle.name,
              source: key,
              sourceLabel: config.label,
              ...pos,
            });
          } catch { /* skip bad TLEs */ }
        }
        console.log(`[fetchDebris] Propagated ${items.length} from ${key}`);
        return items;
      } catch (err) {
        console.warn(`[fetchDebris] Endpoint failed for ${key}:`, err.message);
      }
    }
    
    console.warn(`[fetchDebris] All endpoints failed for ${key}`);
    return [];
  });

  const groups = await Promise.all(promises);
  groups.forEach(g => allDebris.push(...g));
  console.log(`[fetchDebris] Total loaded: ${allDebris.length}`);
  return allDebris;
}
