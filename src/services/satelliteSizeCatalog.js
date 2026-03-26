const EXACT_SIZE_BY_NAME = {
  'ISS (ZARYA)': 109,
  'ISS (NAUKA)': 24,
  'CSS (TIANHE)': 18,
  'TIANGONG': 18,
  'HST': 13.2,
  'HUBBLE SPACE TELESCOPE': 13.2,
  'LANDSAT 8': 4,
  'LANDSAT 9': 4,
  'TERRA': 8.5,
  'AQUA': 8.5,
  'SUOMI NPP': 6.7,
  'JPSS-1': 6.7,
  'NOAA 20': 6.7,
  'NOAA-20': 6.7,
  'NOAA 21': 6.7,
  'NOAA-21': 6.7,
  'NOAA 19': 4.2,
  'NOAA 18': 4.2,
  'NOAA 15': 4.2,
  'METOP-A': 6.5,
  'METOP-B': 6.5,
  'METOP-C': 6.5,
  'GOES 16': 6.1,
  'GOES 17': 6.1,
  'GOES 18': 6.1,
  'GOES 19': 6.1,
  'HIMAWARI-8': 5.2,
  'HIMAWARI-9': 5.2,
  'GALILEO': 4,
  'BEIDOU': 4,
  'GLONASS': 7.2,
  'GPS BIIR': 5.3,
  'GPS BIIF': 5.3,
  'GPS III': 5.6,
  'INMARSAT': 9,
  'INTELSAT': 8,
  'EUTELSAT': 8,
  'SES-': 8,
  'TELSTAR': 8,
  'STARLINK': 3.2,
  'ONEWEB': 1.3,
  'IRIDIUM': 4,
  'ORBCOMM': 1.8,
};

const PATTERN_SIZES = [
  { pattern: /ISS|ZARYA|NAUKA/i, sizeM: 109 },
  { pattern: /TIANGONG|TIANHE|CSS/i, sizeM: 18 },
  { pattern: /HST|HUBBLE/i, sizeM: 13.2 },
  { pattern: /STARLINK/i, sizeM: 3.2 },
  { pattern: /ONEWEB/i, sizeM: 1.3 },
  { pattern: /IRIDIUM/i, sizeM: 4 },
  { pattern: /ORBCOMM/i, sizeM: 1.8 },
  { pattern: /GALILEO/i, sizeM: 4 },
  { pattern: /BEIDOU|BDS/i, sizeM: 4 },
  { pattern: /GLONASS/i, sizeM: 7.2 },
  { pattern: /GPS\s*III|NAVSTAR/i, sizeM: 5.6 },
  { pattern: /GPS\s*BIIF|GPS\s*BIIR/i, sizeM: 5.3 },
  { pattern: /LANDSAT/i, sizeM: 4 },
  { pattern: /NOAA/i, sizeM: 5.5 },
  { pattern: /GOES|HIMAWARI|METEOSAT/i, sizeM: 6 },
  { pattern: /METOP|TERRA|AQUA|JPSS|SUOMI/i, sizeM: 7 },
  { pattern: /INMARSAT|INTELSAT|EUTELSAT|TELSTAR|SES-/i, sizeM: 8 },
  { pattern: /CUBESAT|DOVE|LEMUR/i, sizeM: 0.35 },
  { pattern: /FLOCK/i, sizeM: 0.35 },
];

const CATEGORY_DEFAULTS = {
  stations: 16,
  visual: 5,
  gps: 5.2,
  weather: 6,
  science: 5.5,
};

export function estimateSatelliteSizeMeters(name, category) {
  const normalized = String(name || '').trim().toUpperCase();

  for (const [key, size] of Object.entries(EXACT_SIZE_BY_NAME)) {
    if (normalized.includes(key)) return size;
  }

  for (const item of PATTERN_SIZES) {
    if (item.pattern.test(normalized)) return item.sizeM;
  }

  return CATEGORY_DEFAULTS[category] ?? 5;
}
