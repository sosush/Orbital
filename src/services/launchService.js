/**
 * Live Launch Tracker service.
 * Fetches upcoming and recent launches from Launch Library 2 API.
 */

const LL2_BASE = 'https://ll.thespacedevs.com/2.2.0';

/**
 * Fetch upcoming launches.
 * Returns simplified launch objects.
 */
export async function fetchUpcomingLaunches(limit = 10) {
  try {
    const resp = await fetch(`${LL2_BASE}/launch/upcoming/?limit=${limit}&mode=detailed&format=json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    return (data.results || []).map(launch => ({
      id: launch.id,
      name: launch.name,
      status: launch.status?.abbrev || 'Unknown',
      statusName: launch.status?.name || 'Unknown',
      net: launch.net, // No Earlier Than
      windowStart: launch.window_start,
      windowEnd: launch.window_end,
      rocket: launch.rocket?.configuration?.name || 'Unknown',
      rocketFamily: launch.rocket?.configuration?.family || '',
      provider: launch.launch_service_provider?.name || 'Unknown',
      providerType: launch.launch_service_provider?.type || '',
      mission: launch.mission?.name || 'No mission name',
      missionDescription: launch.mission?.description || '',
      missionType: launch.mission?.type || '',
      orbit: launch.mission?.orbit?.name || '',
      orbitAbbrev: launch.mission?.orbit?.abbrev || '',
      padName: launch.pad?.name || 'Unknown',
      padLocation: launch.pad?.location?.name || 'Unknown',
      padLat: launch.pad?.latitude ? parseFloat(launch.pad.latitude) : null,
      padLng: launch.pad?.longitude ? parseFloat(launch.pad.longitude) : null,
      image: launch.image || null,
      webcastLive: launch.webcast_live || false,
      videoUrls: (launch.vidURLs || []).map(v => v.url),
    }));
  } catch (err) {
    console.warn('Failed to fetch launches:', err);
    return [];
  }
}

/**
 * Fetch recent past launches.
 */
export async function fetchRecentLaunches(limit = 5) {
  try {
    const resp = await fetch(`${LL2_BASE}/launch/previous/?limit=${limit}&mode=detailed&format=json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    return (data.results || []).map(launch => ({
      id: launch.id,
      name: launch.name,
      status: launch.status?.abbrev || 'Unknown',
      statusName: launch.status?.name || 'Unknown',
      net: launch.net,
      rocket: launch.rocket?.configuration?.name || 'Unknown',
      provider: launch.launch_service_provider?.name || 'Unknown',
      mission: launch.mission?.name || 'No mission name',
      missionType: launch.mission?.type || '',
      orbit: launch.mission?.orbit?.name || '',
      padName: launch.pad?.name || 'Unknown',
      padLocation: launch.pad?.location?.name || 'Unknown',
      padLat: launch.pad?.latitude ? parseFloat(launch.pad.latitude) : null,
      padLng: launch.pad?.longitude ? parseFloat(launch.pad.longitude) : null,
      success: launch.status?.abbrev === 'Success',
    }));
  } catch (err) {
    console.warn('Failed to fetch recent launches:', err);
    return [];
  }
}

/**
 * Get countdown string from a NET date.
 */
export function getCountdown(netDateString) {
  const net = new Date(netDateString);
  const now = new Date();
  const diff = net - now;

  if (diff <= 0) return 'LAUNCHED';

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  if (days > 0) return `T-${days}D ${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `T-${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
