/**
 * Satellite visibility / ground station footprint calculations.
 * Computes the visibility circle (ground trace) of a satellite.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculate the half-angle of the visibility cone from a satellite at given altitude.
 * This is the angular radius of the footprint on the Earth's surface.
 * @param {number} altKm - Satellite altitude in km
 * @param {number} minElevation - Minimum elevation angle in degrees (default 0 = horizon)
 * @returns {number} Angular radius in degrees
 */
export function getFootprintRadius(altKm, minElevation = 0) {
  const elevRad = minElevation * Math.PI / 180;
  const rho = Math.asin(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + altKm));
  const eta = Math.acos(Math.sin(elevRad + rho) / Math.cos(elevRad));
  const lambdaRad = Math.PI / 2 - elevRad - eta;
  return lambdaRad * 180 / Math.PI;
}

/**
 * Generate footprint polygon (circle on sphere) for a satellite.
 * @param {number} lat - Subsatellite latitude in degrees
 * @param {number} lng - Subsatellite longitude in degrees
 * @param {number} altKm - Altitude in km
 * @param {number} numPoints - Number of polygon vertices
 * @returns {Array<[number, number]>} Array of [lat, lng] pairs
 */
export function getFootprintPolygon(lat, lng, altKm, numPoints = 72) {
  const angularRadius = getFootprintRadius(altKm);
  const latRad = lat * Math.PI / 180;
  const lngRad = lng * Math.PI / 180;
  const dRad = angularRadius * Math.PI / 180;

  const coords = [];
  for (let i = 0; i <= numPoints; i++) {
    const bearing = (i / numPoints) * 2 * Math.PI;

    const pLat = Math.asin(
      Math.sin(latRad) * Math.cos(dRad) +
      Math.cos(latRad) * Math.sin(dRad) * Math.cos(bearing)
    );

    const pLng = lngRad + Math.atan2(
      Math.sin(bearing) * Math.sin(dRad) * Math.cos(latRad),
      Math.cos(dRad) - Math.sin(latRad) * Math.sin(pLat)
    );

    coords.push([
      pLat * 180 / Math.PI,
      ((pLng * 180 / Math.PI) + 540) % 360 - 180,
    ]);
  }

  return coords;
}

/**
 * Check if a ground point is within a satellite's footprint.
 */
export function isPointInFootprint(groundLat, groundLng, satLat, satLng, satAlt) {
  const angularRadius = getFootprintRadius(satAlt);
  const dLat = (groundLat - satLat) * Math.PI / 180;
  const dLng = (groundLng - satLng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(groundLat * Math.PI / 180) *
    Math.cos(satLat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const angularDist = c * 180 / Math.PI;
  return angularDist <= angularRadius;
}
