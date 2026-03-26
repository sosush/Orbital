/**
 * Constellation grouping & inter-satellite link calculations.
 * Groups satellites by constellation family and computes ISL links.
 */

// Known constellation patterns (name substring matching)
const CONSTELLATION_PATTERNS = [
  { pattern: 'STARLINK', name: 'Starlink', color: '#00B4D8', maxLinkDist: 2000 },
  { pattern: 'ONEWEB', name: 'OneWeb', color: '#F97316', maxLinkDist: 2500 },
  { pattern: 'IRIDIUM', name: 'Iridium', color: '#8B5CF6', maxLinkDist: 4000 },
  { pattern: 'GPS', name: 'GPS', color: '#10B981', maxLinkDist: 50000 },
  { pattern: 'NAVSTAR', name: 'GPS (NAVSTAR)', color: '#10B981', maxLinkDist: 50000 },
  { pattern: 'GALILEO', name: 'Galileo', color: '#3B82F6', maxLinkDist: 50000 },
  { pattern: 'BEIDOU', name: 'BeiDou', color: '#EF4444', maxLinkDist: 50000 },
  { pattern: 'GLONASS', name: 'GLONASS', color: '#F59E0B', maxLinkDist: 50000 },
  { pattern: 'COSMOS', name: 'Cosmos', color: '#6366F1', maxLinkDist: 5000 },
  { pattern: 'GLOBALSTAR', name: 'Globalstar', color: '#EC4899', maxLinkDist: 3000 },
];

/**
 * Identify which constellation a satellite belongs to.
 */
export function identifyConstellation(name) {
  const upperName = name.toUpperCase();
  for (const c of CONSTELLATION_PATTERNS) {
    if (upperName.includes(c.pattern)) return c;
  }
  return null;
}

/**
 * Group satellites by constellation.
 * Returns a Map<constellationName, { info, satellites[] }>
 */
export function groupByConstellation(satellites) {
  const groups = new Map();

  for (const sat of satellites) {
    const constellation = identifyConstellation(sat.name);
    if (!constellation) continue;

    if (!groups.has(constellation.name)) {
      groups.set(constellation.name, {
        info: constellation,
        satellites: [],
      });
    }
    groups.get(constellation.name).satellites.push(sat);
  }

  return groups;
}

/**
 * Group satellites into approximate orbital planes based on RAAN/inclination.
 * Uses inclination from TLE data to cluster satellites.
 */
export function groupByOrbitalPlane(satellites, inclinationTolerance = 2) {
  const planes = [];
  const assigned = new Set();

  for (const sat of satellites) {
    if (assigned.has(sat.id)) continue;

    const plane = [sat];
    assigned.add(sat.id);

    for (const other of satellites) {
      if (assigned.has(other.id)) continue;
      if (Math.abs(sat.inclination - other.inclination) < inclinationTolerance) {
        plane.push(other);
        assigned.add(other.id);
      }
    }

    if (plane.length > 1) {
      planes.push(plane);
    }
  }

  return planes;
}

/**
 * Compute inter-satellite links for a constellation.
 * Connects each satellite to its nearest neighbors within maxLinkDist.
 * Uses haversine + altitude for 3D distance approximation.
 */
export function computeISLLinks(satellites, maxLinkDist = 5000, maxLinksPerSat = 4) {
  const EARTH_R = 6371;
  const links = [];
  const linkCounts = new Map();

  // Sort by longitude for spatial locality
  const sorted = [...satellites].sort((a, b) => a.lng - b.lng);

  for (let i = 0; i < sorted.length; i++) {
    const s1 = sorted[i];
    const count1 = linkCounts.get(s1.id) || 0;
    if (count1 >= maxLinksPerSat) continue;

    const distances = [];

    for (let j = i + 1; j < sorted.length; j++) {
      const s2 = sorted[j];
      const count2 = linkCounts.get(s2.id) || 0;
      if (count2 >= maxLinksPerSat) continue;

      // Quick longitude filter
      if (Math.abs(s1.lng - s2.lng) > 60) continue;

      // 3D distance approximation
      const dLat = (s2.lat - s1.lat) * Math.PI / 180;
      const dLng = (s2.lng - s1.lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(s1.lat * Math.PI / 180) *
        Math.cos(s2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
      const surfaceDist = 2 * EARTH_R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const altDiff = Math.abs((s1.alt || 0) - (s2.alt || 0));
      const dist3D = Math.sqrt(surfaceDist ** 2 + altDiff ** 2);

      if (dist3D <= maxLinkDist) {
        distances.push({ sat: s2, dist: dist3D });
      }
    }

    // Take closest neighbors
    distances.sort((a, b) => a.dist - b.dist);
    const remaining = maxLinksPerSat - count1;

    for (let k = 0; k < Math.min(remaining, distances.length); k++) {
      const { sat: s2 } = distances[k];
      links.push({
        startLat: s1.lat,
        startLng: s1.lng,
        startAlt: s1.alt,
        endLat: s2.lat,
        endLng: s2.lng,
        endAlt: s2.alt,
      });
      linkCounts.set(s1.id, (linkCounts.get(s1.id) || 0) + 1);
      linkCounts.set(s2.id, (linkCounts.get(s2.id) || 0) + 1);
    }
  }

  return links;
}
