import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fetchDebris } from '../services/debrisService';
import { fetchUpcomingLaunches, fetchRecentLaunches } from '../services/launchService';
import { getSunPosition, getTerminatorCoords } from '../services/sunPosition';
import { getFootprintRadius } from '../services/visibilityService';
import { groupByConstellation, computeISLLinks } from '../services/constellationService';

export function useFeatures(satellites, selectedSatellite) {
  const [features, setFeatures] = useState({
    terminator: false,
    debris: false,
    footprint: true,
    constellations: false,
    islLinks: false,
    launches: false,
    heatmap: false,
    all3dModels: true,
  });

  const [debrisData, setDebrisData] = useState([]);
  const [debrisLoading, setDebrisLoading] = useState(false);
  const [launchData, setLaunchData] = useState({ upcoming: [], recent: [] });
  const [launchLoading, setLaunchLoading] = useState(false);
  const [tick, setTick] = useState(0);

  const toggleFeature = useCallback((key) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Time tick for terminator updates.
  useEffect(() => {
    if (!features.terminator) return;
    const iv = setInterval(() => setTick(t => t + 1), 5000);
    return () => clearInterval(iv);
  }, [features.terminator]);

  // --- Solar Terminator ---
  const terminatorData = useMemo(() => {
    if (!features.terminator) return { coords: [], sunPos: null };
    const now = new Date();
    const sunPos = getSunPosition(now);
    const coords = getTerminatorCoords(now);
    return { coords, sunPos };
  }, [features.terminator, tick]);

  // --- Debris ---
  useEffect(() => {
    if (features.debris && debrisData.length === 0 && !debrisLoading) {
      setDebrisLoading(true);
      console.log('[useFeatures] Debris feature enabled, starting fetch...');
      
      const timeoutId = setTimeout(() => {
        console.warn('[useFeatures] Debris fetch timeout after 15s');
        setDebrisLoading(false);
      }, 15000);
      
      fetchDebris(150)
        .then(data => {
          clearTimeout(timeoutId);
          console.log('[useFeatures] Debris loaded:', data.length, 'objects');
          setDebrisData(data);
          setDebrisLoading(false);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          console.error('[useFeatures] Debris fetch error:', err);
          setDebrisLoading(false);
        });
    }
  }, [features.debris, debrisData.length, debrisLoading]);

  // --- Visibility Footprint (ring-based) ---
  const footprintData = useMemo(() => {
    if (!features.footprint) return [];
    const targetSat = selectedSatellite || satellites[0];
    if (!targetSat) return [];
    const radius = getFootprintRadius(targetSat.alt);
    return [{
      lat: targetSat.lat,
      lng: targetSat.lng,
      radius,
    }];
  }, [features.footprint, selectedSatellite?.id, satellites]);

  // --- Constellation Grouping ---
  const constellationData = useMemo(() => {
    if (!features.constellations) return { groups: new Map() };
    return { groups: groupByConstellation(satellites) };
  }, [features.constellations, satellites]);

  // --- ISL Links as path coords (not arcs, so they go at satellite altitude) ---
  const islLinksData = useMemo(() => {
    if (!features.islLinks) return [];
    const groups = groupByConstellation(satellites);
    const allLinks = [];
    for (const [, group] of groups) {
      if (group.satellites.length < 3) continue;
      const sats = group.satellites.slice(0, 50);
      const links = computeISLLinks(sats, group.info.maxLinkDist, 2);
      links.forEach(l => { l.color = group.info.color; });
      allLinks.push(...links);
    }
    return allLinks;
  }, [features.islLinks, satellites]);

  // --- Live Launches ---
  useEffect(() => {
    if (features.launches && launchData.upcoming.length === 0 && !launchLoading) {
      setLaunchLoading(true);
      Promise.all([
        fetchUpcomingLaunches(8),
        fetchRecentLaunches(3),
      ]).then(([upcoming, recent]) => {
        setLaunchData({ upcoming, recent });
        setLaunchLoading(false);
      }).catch(() => setLaunchLoading(false));
    }
  }, [features.launches, launchData.upcoming.length, launchLoading]);

  return {
    features,
    toggleFeature,
    terminatorData,
    debrisData: features.debris ? debrisData : [],
    debrisLoading,
    footprintData,
    constellationData,
    islLinksData,
    launchData: features.launches ? launchData : { upcoming: [], recent: [] },
    launchLoading,
  };
}
