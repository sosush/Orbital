import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from 'satellite.js';

export function createSatRec(tle1, tle2) {
  return twoline2satrec(tle1, tle2);
}

export function getPosition(satrec, date = new Date()) {
  const posVel = propagate(satrec, date);

  if (!posVel.position || typeof posVel.position === 'boolean') return null;

  const gmst = gstime(date);
  const geo = eciToGeodetic(posVel.position, gmst);

  const speed = Math.sqrt(
    posVel.velocity.x ** 2 + posVel.velocity.y ** 2 + posVel.velocity.z ** 2
  );

  return {
    lat: degreesLat(geo.latitude),
    lng: degreesLong(geo.longitude),
    alt: geo.height,
    velocity: speed * 3600, // km/s → km/h
  };
}

export function getOrbitPath(satrec, periodMinutes = 90, steps = 180) {
  const now = Date.now();
  const coords = [];

  for (let i = 0; i <= steps; i++) {
    const t = new Date(now + (i / steps) * periodMinutes * 60000);
    const pos = getPosition(satrec, t);
    if (pos) coords.push([pos.lat, pos.lng, pos.alt]);
  }

  return coords;
}
