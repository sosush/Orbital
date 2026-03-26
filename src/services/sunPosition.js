/**
 * Solar position calculations for the Solar Terminator feature.
 * Computes subsolar point (lat/lng where the sun is directly overhead).
 */

export function getSunPosition(date = new Date()) {
  // Julian date calculation
  const JD = date.getTime() / 86400000 + 2440587.5;
  const n = JD - 2451545.0; // days since J2000.0

  // Mean longitude and mean anomaly (degrees)
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;

  // Ecliptic longitude (degrees)
  const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * Math.PI / 180;

  // Obliquity of ecliptic
  const epsilon = (23.439 - 0.0000004 * n) * Math.PI / 180;

  // Right ascension and declination
  const sinDec = Math.sin(epsilon) * Math.sin(lambda);
  const dec = Math.asin(sinDec); // declination in radians

  // Equation of time (approximate, in minutes)
  const B = ((360 / 365) * (n - 81)) * Math.PI / 180;
  const EoT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  // Solar hour angle
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const solarTime = utcHours + EoT / 60;
  const hourAngle = (solarTime - 12) * 15; // degrees

  // Subsolar point
  const lat = dec * 180 / Math.PI;
  const lng = -hourAngle;

  return { lat, lng, declination: dec };
}

/**
 * Generate terminator line coordinates (the day/night boundary).
 * Returns an array of [lat, lng] pairs forming the terminator circle.
 */
export function getTerminatorCoords(date = new Date(), numPoints = 180) {
  const sun = getSunPosition(date);
  const coords = [];

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;

    // Terminator is the great circle 90° from subsolar point
    const lat = Math.asin(
      Math.cos(angle) * Math.cos(sun.declination)
    ) * 180 / Math.PI;

    const lng = sun.lng + Math.atan2(
      Math.sin(angle),
      -Math.sin(sun.declination) * Math.cos(angle)
    ) * 180 / Math.PI;

    // Normalize longitude
    const normalizedLng = ((lng + 540) % 360) - 180;
    coords.push([lat, normalizedLng]);
  }

  return coords;
}

/**
 * Generate polygon coordinates for the night side of Earth.
 * Returns array of [lat, lng] for filling the shadow.
 */
export function getNightPolygon(date = new Date(), numPoints = 180) {
  const sun = getSunPosition(date);
  const terminator = getTerminatorCoords(date, numPoints);

  // The night side is opposite the sun
  // We create a polygon that covers the night hemisphere
  const nightCoords = [...terminator];

  // Close the polygon by extending to the pole opposite the sun
  const nightPole = sun.lat > 0 ? -90 : 90;
  nightCoords.push([nightPole, terminator[terminator.length - 1][1]]);
  nightCoords.push([nightPole, terminator[0][1]]);

  return nightCoords;
}
