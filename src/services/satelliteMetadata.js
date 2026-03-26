/**
 * Comprehensive satellite metadata database.
 * Includes: country/agency, purpose, crew capacity, operational status, launch date, etc.
 */

export const SATELLITE_METADATA = {
  // === Space Stations ===
  25544: { // ISS
    name: 'ISS (ZARYA)',
    country: 'International',
    agency: 'NASA/ESA/Roscosmos/JAXA/CSA',
    type: 'Space Station',
    purpose: 'Microgravity research, Earth observation',
    operational: true,
    launchDate: '1998-11-20',
    decommissionDate: '2031 (planned)',
    crewCapacity: 7,
    currentCrew: 7,
    resupplyCargo: 'Soyuz, Dragon, Progress, Cygnus, HTV',
    mass: 417290,
    length: 109.0,
    width: 73.0,
    modules: 15,
    orbitalSlots: 'LEO (400 km)',
    inclination: 51.6,
    url: 'https://www.nasa.gov/mission/iss/',
  },

  // === Chinese Space Station ===
  48274: { // Tiangong
    name: 'TIANGONG',
    country: 'China',
    agency: 'China National Space Administration (CNSA)',
    type: 'Space Station',
    purpose: 'Scientific research, materials science, Earth observation',
    operational: true,
    launchDate: '2021-04-29',
    crewCapacity: 3,
    currentCrew: 3,
    resupplyCargo: 'Shenzhou crew vehicles, Tianzhou cargo vehicles',
    mass: 90000,
    length: 73.0,
    modules: 3,
    orbitalSlots: 'LEO (340-450 km)',
    inclination: 41.5,
    url: 'http://www.cnsa.gov.cn/',
  },

  // === Space Telescopes ===
  20580: { // Hubble
    name: 'HUBBLE SPACE TELESCOPE',
    country: 'United States',
    agency: 'NASA',
    type: 'Space Telescope',
    purpose: 'Ultraviolet and visible light astronomical observation',
    operational: true,
    launchDate: '1990-04-24',
    decommissionDate: '2030s (estimated)',
    mass: 11600,
    length: 13.2,
    mirrorDiameter: 2.4,
    orbitalSlots: 'LEO (559 km)',
    inclination: 28.47,
    url: 'https://www.nasa.gov/mission/hubble/',
  },

  104093: { // James Webb
    name: 'JWST',
    country: 'United States',
    agency: 'NASA/ESA/CSA',
    type: 'Space Telescope',
    purpose: 'Infrared astronomical observation',
    operational: true,
    launchDate: '2021-12-25',
    mass: 6200,
    length: 6.6,
    orbitalSlots: 'L2 (1.5M km from Earth)',
    url: 'https://www.jwst.nasa.gov/',
  },

  // === Weather/Climate Satellites ===
  43013: { // NOAA-20
    name: 'NOAA 20',
    country: 'United States',
    agency: 'NOAA/NASA',
    type: 'Weather Satellite',
    purpose: 'Weather forecasting, climate monitoring, environmental data',
    operational: true,
    launchDate: '2017-11-18',
    mass: 2535,
    orbitalSlots: 'Sun-synchronous LEO (829 km)',
    inclination: 99.0,
    url: 'https://www.nesdis.noaa.gov/our-satellites/noaa-20',
  },

  25544: { // Sentinel series example
    name: 'SENTINEL-1A',
    country: 'European Union',
    agency: 'ESA',
    type: 'Earth Observation Satellite',
    purpose: 'Radar imaging for land, sea, and ice monitoring',
    operational: true,
    launchDate: '2014-04-03',
    mass: 2250,
    orbitalSlots: 'Polar sun-synchronous LEO (693 km)',
    inclination: 98.18,
    url: 'https://www.esa.int/Applications/Observing_the_Earth/Copernicus/Sentinel-1',
  },

  // === Navigation Satellites (GPS, GLONASS, Galileo) ===
  28874: { // GPS IIF-11
    name: 'GPS IIF-11',
    country: 'United States',
    agency: 'USAF/Boeing',
    type: 'Navigation Satellite',
    purpose: 'Global Positioning System',
    operational: true,
    mass: 2032,
    orbitalSlots: 'MEO (20200 km)',
    inclination: 55.0,
    period: 718.8,
  },

  37348: { // GLONASS-M example
    name: 'GLONASS-M',
    country: 'Russia',
    agency: 'Roscosmos',
    type: 'Navigation Satellite',
    purpose: 'GLONASS positioning system',
    operational: true,
    mass: 1415,
    orbitalSlots: 'MEO (19100 km)',
    inclination: 64.8,
    period: 675.7,
  },

  // === Communication Satellites ===
  44713: { // Starlink
    name: 'STARLINK-1001',
    country: 'United States',
    agency: 'SpaceX',
    type: 'Communication Satellite',
    purpose: 'Broadband internet constellation',
    operational: true,
    launchDate: '2019-11-11',
    mass: 260,
    orbitalSlots: 'LEO (550 km)',
    inclination: 53.0,
    url: 'https://www.starlink.com/',
  },

  // === Science and Research ===
  39084: { // HIPPARCOS
    name: 'HIPPARCOS',
    country: 'European Union',
    agency: 'ESA',
    type: 'Astronomical Observatory',
    purpose: 'Stellar position and distance measurement',
    operational: false,
    launchDate: '1989-08-08',
    decommissionDate: '1993 (mission end)',
  },

  // === Default template for unknown satellites ===
  default: {
    country: 'Unknown',
    agency: 'Unknown',
    type: 'Satellite',
    purpose: 'Unknown',
    operational: true,
    mass: 'Unknown',
    orbitalSlots: 'Unknown',
  },
};

/**
 * Get metadata for a satellite by NORAD ID or name.
 * Returns enriched data with fallback to generic structure.
 */
export function getSatelliteMetadata(noradId, name = '') {
  // Try NORAD ID first
  if (SATELLITE_METADATA[noradId]) {
    return { noradId, ...SATELLITE_METADATA[noradId] };
  }

  // Try name-based matching if available
  const nameUpper = (name || '').toUpperCase();
  for (const [id, data] of Object.entries(SATELLITE_METADATA)) {
    if (id === 'default') continue;
    if ((data.name || '').toUpperCase().includes(nameUpper)) {
      return { noradId: parseInt(id), ...data };
    }
  }

  // Infer from name patterns
  const metadata = inferMetadataFromName(name);
  return { noradId, ...metadata };
}

/**
 * Infer satellite properties from name patterns.
 */
function inferMetadataFromName(name = '') {
  const n = name.toUpperCase();

  if (n.includes('STARLINK')) {
    return {
      country: 'United States',
      agency: 'SpaceX',
      type: 'Communication Satellite',
      purpose: 'Broadband internet constellation',
      operational: true,
    };
  }
  if (n.includes('ONEWEB')) {
    return {
      country: 'United Kingdom',
      agency: 'OneWeb',
      type: 'Communication Satellite',
      purpose: 'Low-latency broadband constellation',
      operational: true,
    };
  }
  if (n.includes('IRIDIUM')) {
    return {
      country: 'United States',
      agency: 'Iridium Communications',
      type: 'Communication Satellite',
      purpose: 'Mobile communications constellation',
      operational: true,
    };
  }
  if (n.includes('GPS') || n.includes('NAVSTAR')) {
    return {
      country: 'United States',
      agency: 'USAF',
      type: 'Navigation Satellite',
      purpose: 'Global Positioning System',
      operational: true,
    };
  }
  if (n.includes('GLONASS')) {
    return {
      country: 'Russia',
      agency: 'Roscosmos',
      type: 'Navigation Satellite',
      purpose: 'Russian positioning system',
      operational: true,
    };
  }
  if (n.includes('GALILEO')) {
    return {
      country: 'European Union',
      agency: 'ESA',
      type: 'Navigation Satellite',
      purpose: 'European positioning system',
      operational: true,
    };
  }
  if (n.includes('BEIDOU') || n.includes('COMPASS')) {
    return {
      country: 'China',
      agency: 'CNSA',
      type: 'Navigation Satellite',
      purpose: 'Chinese positioning system',
      operational: true,
    };
  }
  if (n.includes('NOAA') || n.includes('GOES')) {
    return {
      country: 'United States',
      agency: 'NOAA',
      type: 'Weather Satellite',
      purpose: 'Weather and climate monitoring',
      operational: true,
    };
  }
  if (n.includes('SENTINEL')) {
    return {
      country: 'European Union',
      agency: 'ESA',
      type: 'Earth Observation Satellite',
      purpose: 'Environmental monitoring and mapping',
      operational: true,
    };
  }
  if (n.includes('LANDSAT')) {
    return {
      country: 'United States',
      agency: 'USGS/NASA',
      type: 'Earth Observation Satellite',
      purpose: 'Land surface mapping',
      operational: true,
    };
  }
  if (n.includes('ISS') || n.includes('ZARYA') || n.includes('UNITY')) {
    return {
      country: 'International',
      agency: 'NASA/ESA/Roscosmos',
      type: 'Space Station',
      purpose: 'Microgravity research',
      operational: true,
      crewCapacity: 7,
    };
  }
  if (n.includes('TIANGONG')) {
    return {
      country: 'China',
      agency: 'CNSA',
      type: 'Space Station',
      purpose: 'Scientific research',
      operational: true,
      crewCapacity: 3,
    };
  }
  if (n.includes('HUBBLE') || n.includes('HST')) {
    return {
      country: 'United States',
      agency: 'NASA',
      type: 'Space Telescope',
      purpose: 'Astronomical observation',
      operational: true,
    };
  }

  return SATELLITE_METADATA.default;
}

/**
 * Format orbital slot description.
 */
export function formatOrbitalSlot(alt, inclination) {
  if (!alt) return 'Unknown';
  if (alt > 35000) return `GEO (${alt.toFixed(0)} km)`;
  if (alt > 20000) return `MEO (${alt.toFixed(0)} km)`;
  if (inclination > 65) return `Polar LEO (${alt.toFixed(0)} km)`;
  if (Math.abs(inclination - 0) < 5) return `Equatorial LEO (${alt.toFixed(0)} km)`;
  return `LEO (${alt.toFixed(0)} km)`;
}

/**
 * Get operational status badge.
 */
export function getOperationalStatus(metadata) {
  if (!metadata) return { label: 'Unknown', color: '#999' };
  if (metadata.operational === false) {
    return { label: '◆ Decommissioned', color: '#d32f2f' };
  }
  if (metadata.decommissionDate) {
    return { label: `● Active (EOL: ${metadata.decommissionDate})`, color: '#fbc02d' };
  }
  return { label: '● Operational', color: '#4caf50' };
}
