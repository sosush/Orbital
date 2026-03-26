import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchSatellites, SATELLITE_GROUPS } from '../services/satelliteService';
import { createSatRec, getPosition, getOrbitPath } from '../services/propagator';
import { estimateSatelliteSizeMeters } from '../services/satelliteSizeCatalog';

export function useSatellites() {
  const [rawSatellites, setRawSatellites] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const satRecsRef = useRef(new Map());

  // Load TLEs
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sats = await fetchSatellites(['stations', 'visual', 'gps', 'weather']);
        if (cancelled) return;

        const processed = [];
        for (const sat of sats) {
          try {
            const satrec = createSatRec(sat.tle1, sat.tle2);
            const pos = getPosition(satrec);
            if (!pos) continue;

            const noradId = parseInt(sat.tle1.substring(2, 7));
            satRecsRef.current.set(noradId, satrec);

            processed.push({
              id: noradId,
              name: sat.name,
              noradId,
              category: sat.category,
              categoryLabel: sat.categoryLabel,
              sizeM: estimateSatelliteSizeMeters(sat.name, sat.category),
              inclination: parseFloat(sat.tle2.substring(8, 16)) || 0,
              eccentricity: parseFloat('0.' + sat.tle2.substring(26, 33)) || 0,
              meanMotion: parseFloat(sat.tle2.substring(52, 63)) || 14,
              period: (24 * 60) / (parseFloat(sat.tle2.substring(52, 63)) || 14),
              ...pos,
            });
          } catch { /* skip bad TLEs */ }
        }

        setRawSatellites(processed);
        setPositions(processed);
        setLoading(false);
        console.log('[useSatellites] Loaded', processed.length, 'satellites');
      } catch (err) {
        if (!cancelled) { setError(err.message); setLoading(false); console.error('[useSatellites] Error:', err); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Refresh positions every 2s
  useEffect(() => {
    if (rawSatellites.length === 0) return;
    const iv = setInterval(() => {
      const now = new Date();
      setPositions(rawSatellites.map(sat => {
        const satrec = satRecsRef.current.get(sat.id);
        if (!satrec) return sat;
        const pos = getPosition(satrec, now);
        return pos ? { ...sat, ...pos } : sat;
      }));
    }, 2000);
    return () => clearInterval(iv);
  }, [rawSatellites]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = positions;
    if (activeCategory !== 'all') list = list.filter(s => s.category === activeCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || String(s.noradId).includes(q));
    }
    return list;
  }, [positions, activeCategory, searchQuery]);

  // Selected satellite with orbit path
  const selectedSatellite = useMemo(() => {
    if (selectedId == null) return null;
    const sat = positions.find(s => s.id === selectedId);
    if (!sat) return null;
    const satrec = satRecsRef.current.get(sat.id);
    const orbitPath = satrec ? getOrbitPath(satrec, sat.period || 90) : [];
    return { ...sat, orbitPath };
  }, [selectedId, positions]);

  const selectSatellite = useCallback((sat) => setSelectedId(sat?.id ?? null), []);

  const categories = useMemo(() => [
    { id: 'all', label: 'All' },
    ...Object.entries(SATELLITE_GROUPS).map(([id, { label }]) => ({ id, label })),
  ], []);

  return {
    satellites: filtered,
    totalCount: positions.length,
    selectedSatellite,
    selectSatellite,
    searchQuery, setSearchQuery,
    activeCategory, setActiveCategory,
    loading, error, categories,
  };
}
