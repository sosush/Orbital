/**
 * Satellite density heatmap calculations.
 * Generates heatmap data for satellite distribution on the globe.
 */

/**
 * Generate heatmap data points from satellite positions.
 * Groups satellites into grid cells and returns weighted points.
 * @param {Array} satellites - Array of satellite objects with lat, lng, alt
 * @param {number} resolution - Grid resolution in degrees
 * @returns {Array<{lat, lng, weight}>} Heatmap data points
 */
export function generateHeatmapData(satellites, resolution = 5) {
  const grid = new Map();

  for (const sat of satellites) {
    // Snap to grid cell
    const cellLat = Math.round(sat.lat / resolution) * resolution;
    const cellLng = Math.round(sat.lng / resolution) * resolution;
    const key = `${cellLat},${cellLng}`;

    if (!grid.has(key)) {
      grid.set(key, { lat: cellLat, lng: cellLng, count: 0, totalAlt: 0 });
    }
    const cell = grid.get(key);
    cell.count += 1;
    cell.totalAlt += sat.alt || 0;
  }

  // Convert to weighted points
  const points = [];
  let maxCount = 0;
  for (const cell of grid.values()) {
    maxCount = Math.max(maxCount, cell.count);
  }

  for (const cell of grid.values()) {
    // Weight normalized to [0.1, 1.0]
    const weight = 0.1 + 0.9 * (cell.count / Math.max(maxCount, 1));
    points.push({
      lat: cell.lat,
      lng: cell.lng,
      weight,
      count: cell.count,
      avgAlt: cell.totalAlt / cell.count,
    });
  }

  return points;
}

/**
 * Generate altitude distribution histogram data.
 * @param {Array} satellites
 * @param {number} binSize - Bin size in km
 * @returns {Array<{minAlt, maxAlt, count, percentage}>}
 */
export function getAltitudeDistribution(satellites, binSize = 100) {
  const bins = new Map();

  for (const sat of satellites) {
    const alt = sat.alt || 0;
    const binStart = Math.floor(alt / binSize) * binSize;
    const key = binStart;

    if (!bins.has(key)) {
      bins.set(key, { minAlt: binStart, maxAlt: binStart + binSize, count: 0 });
    }
    bins.get(key).count += 1;
  }

  const total = satellites.length || 1;
  const sorted = [...bins.values()]
    .sort((a, b) => a.minAlt - b.minAlt)
    .map(bin => ({
      ...bin,
      percentage: (bin.count / total * 100).toFixed(1),
    }));

  return sorted;
}
