import { useRef, useEffect, useCallback, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

const EARTH_BLUE_MARBLE = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg';
const EARTH_WATER       = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-water.png';
const EARTH_CLOUDS      = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-clouds10k.png';
const NIGHT_SKY         = 'https://cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png';

// ── Coordinate conversion matching three-globe internals ──
function polar2Cart(lat, lng, R) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (90 - lng) * Math.PI / 180;
  return new THREE.Vector3(
    R * Math.sin(phi) * Math.cos(theta),
    R * Math.cos(phi),
    R * Math.sin(phi) * Math.sin(theta)
  );
}

// ── Visual altitude scale ──
function visualAlt(altKm) {
  return Math.log(1 + altKm / 200) * 0.08;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function satVisualSizePx(sizeM = 4) {
  return clamp(4 + Math.log1p(sizeM) * 2.3, 4, 16);
}

// ── Iconic satellite identification ──
const ICONIC_MODELS = [
  { match: 'ISS (ZARYA)', shape: 'station', color: '#FFD700', scale: 2.0 },
  { match: 'ISS (NAUKA)', shape: 'station', color: '#FFD700', scale: 1.8 },
  { match: 'TIANGONG', shape: 'station', color: '#EF4444', scale: 1.8 },
  { match: 'CSS (TIANHE)', shape: 'station', color: '#EF4444', scale: 1.8 },
  { match: 'HST', shape: 'telescope', color: '#C084FC', scale: 1.6 },
  { match: 'GOES', shape: 'weather', color: '#F97316', scale: 1.4 },
  { match: 'NOAA', shape: 'weather', color: '#F59E0B', scale: 1.3 },
  { match: 'TERRA', shape: 'science', color: '#3B82F6', scale: 1.3 },
  { match: 'AQUA', shape: 'science', color: '#06B6D4', scale: 1.3 },
  { match: 'LANDSAT', shape: 'science', color: '#22C55E', scale: 1.3 },
];

function getIconicConfig(name) {
  const upper = name.toUpperCase();
  for (const cfg of ICONIC_MODELS) {
    if (upper.includes(cfg.match)) return cfg;
  }
  return null;
}

function getGenericModelConfig(sat) {
  const byCategory = {
    stations: { shape: 'station', color: '#E5E7EB' },
    weather: { shape: 'weather', color: '#F97316' },
    science: { shape: 'science', color: '#22C55E' },
    gps: { shape: 'science', color: '#10B981' },
    visual: { shape: 'telescope', color: '#60A5FA' },
  };
  const base = byCategory[sat.category] || { shape: 'science', color: '#94A3B8' };
  return { ...base, scale: 0.9 };
}

// ── Create procedural Three.js 3D satellite model ──
function createSatModel(cfg) {
  const g = new THREE.Group();
  const s = cfg.scale || 1;
  const col = new THREE.Color(cfg.color);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: col, metalness: 0.55, roughness: 0.4, emissive: col, emissiveIntensity: 0.62,
  });
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x1a237e, metalness: 0.5, roughness: 0.2,
    emissive: new THREE.Color(0x1a237e), emissiveIntensity: 0.35, side: THREE.DoubleSide,
  });

  switch (cfg.shape) {
    case 'station': {
      // Central module
      g.add(new THREE.Mesh(new THREE.BoxGeometry(1.2*s, 0.5*s, 0.5*s), bodyMat));
      // Truss
      g.add(new THREE.Mesh(new THREE.BoxGeometry(4*s, 0.08*s, 0.08*s), bodyMat));
      // 4 solar panels
      for (const sx of [-1, 1]) {
        for (const offset of [0.6, 1.5]) {
          const p = new THREE.Mesh(new THREE.BoxGeometry(0.05*s, 1.8*s, 0.9*s), panelMat);
          p.position.set(sx * offset * s, 0, 0);
          g.add(p);
        }
      }
      break;
    }
    case 'telescope': {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.35*s, 0.4*s, 2.5*s, 12), bodyMat);
      g.add(tube);
      for (const sx of [-1, 1]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.06*s, 1.6*s, 0.8*s), panelMat);
        p.position.set(sx * 0.9*s, 0, 0);
        g.add(p);
      }
      const aperture = new THREE.Mesh(
        new THREE.RingGeometry(0.1*s, 0.35*s, 16),
        new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide })
      );
      aperture.position.y = 1.3*s;
      aperture.rotation.x = Math.PI / 2;
      g.add(aperture);
      break;
    }
    case 'weather': {
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5*s, 0.5*s, 1*s, 16), bodyMat));
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03*s, 0.03*s, 0.7*s, 6), bodyMat);
      ant.position.y = 0.85*s;
      g.add(ant);
      const dish = new THREE.Mesh(
        new THREE.SphereGeometry(0.2*s, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        bodyMat
      );
      dish.position.y = 1.2*s; dish.rotation.x = Math.PI;
      g.add(dish);
      break;
    }
    case 'science': {
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6*s, 0.8*s, 0.5*s), bodyMat));
      for (const sx of [-1, 1]) {
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.05*s, 0.7*s, 1.2*s), panelMat);
        p.position.set(sx * 0.9*s, 0, 0);
        g.add(p);
      }
      break;
    }
    default: {
      g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.4*s), bodyMat));
    }
  }

  // No per-model dynamic light: all-3D mode may contain hundreds of models,
  // and many point lights can break or severely degrade WebGL rendering.
  return g;
}

// ═══════════════════════════════════════════════════════════
export default function Globe3D({
  satellites, selectedSatellite, onSatelliteClick, onRecenter,
  terminatorData, debrisData, footprintData, constellationData,
  islLinksData, launchData, features,
}) {
  const globeEl = useRef();
  const recenterRef = useRef(null);
  const terminatorRef = useRef(null);
  const nightOverlayRef = useRef(null);
  const sunLightRef = useRef(null);
  const modelsRef = useRef(new Map());
  const constellationRingsRef = useRef([]);

  // Debug: log satellite data whenever it changes
  useEffect(() => {
    console.log('[Globe3D] Satellites updated:', satellites?.length || 0, 'items');
    satellites?.slice(0, 3).forEach(s => console.log('  -', s.name, '(sizeM:', s.sizeM, ')', 'cat:', s.category));
  }, [satellites?.length]);
  const debrisTemplate = useMemo(() => new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xFF5A5A, transparent: true, opacity: 0.92 })
  ), []);

  // ── Initial setup ──
  useEffect(() => {
    const globe = globeEl.current;
    if (!globe) return;
    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 120;
    controls.maxDistance = 600;
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });

    // Clouds
    new THREE.TextureLoader().load(EARTH_CLOUDS, tex => {
      const R = globe.getGlobeRadius();
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(R * 1.004, 72, 72),
        new THREE.MeshPhongMaterial({ map: tex, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
      );
      globe.scene().add(mesh);
      (function spin() { mesh.rotation.y -= 0.00012; requestAnimationFrame(spin); })();
    });
  }, []);

  // ── Fly to selected ──
  useEffect(() => {
    if (!selectedSatellite || !globeEl.current) return;
    globeEl.current.controls().autoRotate = false;
    globeEl.current.pointOfView({ lat: selectedSatellite.lat, lng: selectedSatellite.lng, altitude: 0.8 }, 1200);
  }, [selectedSatellite?.id]);

  // ── Recenter ──
  useEffect(() => {
    recenterRef.current = () => {
      if (!globeEl.current) return;
      if (selectedSatellite) {
        globeEl.current.pointOfView({ lat: selectedSatellite.lat, lng: selectedSatellite.lng, altitude: 0.8 }, 800);
      } else {
        globeEl.current.controls().autoRotate = true;
        globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
      }
    };
  }, [selectedSatellite]);
  useEffect(() => { if (onRecenter) onRecenter.current = () => recenterRef.current?.(); }, [onRecenter]);

  // ══════════════════════════════════════════════════════
  // SOLAR TERMINATOR — custom Three.js mesh with correct coords
  // ══════════════════════════════════════════════════════
  useEffect(() => {
    const globe = globeEl.current;
    if (!globe) return;
    const scene = globe.scene();

    // Clean old
    if (terminatorRef.current) {
      scene.remove(terminatorRef.current);
      terminatorRef.current.traverse(c => { c.geometry?.dispose(); c.material?.dispose(); });
      terminatorRef.current = null;
    }

    if (!features?.terminator || !terminatorData?.coords?.length || !terminatorData.sunPos) {
      if (nightOverlayRef.current) {
        scene.remove(nightOverlayRef.current);
        nightOverlayRef.current.geometry?.dispose();
        nightOverlayRef.current.material?.dispose();
        nightOverlayRef.current = null;
      }
      return;
    }

    const R = globe.getGlobeRadius() * 1.001;
    const sunPos = terminatorData.sunPos;
    const coords = terminatorData.coords;

    // Move directional light to real subsolar direction.
    const sunVec = polar2Cart(sunPos.lat, sunPos.lng, 1).normalize();
    if (sunLightRef.current) {
      sunLightRef.current.position.copy(sunVec.clone().multiplyScalar(220));
      sunLightRef.current.target.position.set(0, 0, 0);
      sunLightRef.current.target.updateMatrixWorld();
    }

    // Anti-solar point (center of night)
    const center = polar2Cart(-sunPos.lat, ((sunPos.lng + 180 + 540) % 360) - 180, R);

    // Terminator ring vertices
    const verts = [center.x, center.y, center.z];
    for (const [lat, lng] of coords) {
      const p = polar2Cart(lat, lng, R);
      verts.push(p.x, p.y, p.z);
    }

    // Fan triangles from center to ring
    const idx = [];
    const n = coords.length;
    for (let i = 1; i < n; i++) idx.push(0, i, i + 1);
    idx.push(0, n, 1);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: 0x000020, transparent: true, opacity: 0.5,
      side: THREE.DoubleSide, depthWrite: false,
    }));
    scene.add(mesh);
    terminatorRef.current = mesh;

    // Night-side shading overlay that darkens the hemisphere opposite the sun.
    if (!nightOverlayRef.current) {
      const nightGeo = new THREE.SphereGeometry(R * 1.002, 96, 96);
      const nightMat = new THREE.ShaderMaterial({
        uniforms: {
          sunDirection: { value: sunVec.clone() },
          nightOpacity: { value: 0.58 },
          terminatorSoftness: { value: 0.16 },
        },
        vertexShader: `
          varying vec3 vWorldNormal;
          void main() {
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 sunDirection;
          uniform float nightOpacity;
          uniform float terminatorSoftness;
          varying vec3 vWorldNormal;
          void main() {
            float nDotS = dot(normalize(vWorldNormal), normalize(sunDirection));
            float nightFactor = smoothstep(terminatorSoftness, -terminatorSoftness, nDotS);
            vec3 tint = vec3(0.02, 0.04, 0.12);
            gl_FragColor = vec4(tint, nightFactor * nightOpacity);
          }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      nightOverlayRef.current = new THREE.Mesh(nightGeo, nightMat);
      scene.add(nightOverlayRef.current);
    } else {
      nightOverlayRef.current.material.uniforms.sunDirection.value.copy(sunVec);
    }
  }, [features?.terminator, terminatorData]);

  // ══════════════════════════════════════════════════════
  // 3D SATELLITE MODELS — real Three.js geometry
  // ══════════════════════════════════════════════════════
  useEffect(() => {
    const globe = globeEl.current;
    if (!globe || !satellites.length) return;
    const scene = globe.scene();
    const R = globe.getGlobeRadius();
    const desiredIds = new Set();

    for (const sat of satellites) {
      const cfg = getIconicConfig(sat.name) || (features?.all3dModels ? getGenericModelConfig(sat) : null);
      if (!cfg) continue;
      desiredIds.add(sat.id);

      // Create model if it doesn't exist yet
      if (!modelsRef.current.has(sat.id)) {
        const model = createSatModel(cfg);
        scene.add(model);
        modelsRef.current.set(sat.id, model);
      }

      // Update position
      const model = modelsRef.current.get(sat.id);
      const alt = R * (1 + visualAlt(sat.alt));
      const pos = polar2Cart(sat.lat, sat.lng, alt);
      model.position.copy(pos);
      const boost = features?.all3dModels ? 1.8 : 1;
      const sizeFactor = clamp((Math.log1p(sat.sizeM || 4) / Math.log(10)) * boost, 0.7, 3.4);
      model.scale.setScalar(sizeFactor);

      // Orient: face outward from globe center
      const up = pos.clone().normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
      model.setRotationFromQuaternion(quat);
    }

    // Remove models no longer needed in current render mode.
    for (const [id, model] of modelsRef.current.entries()) {
      if (desiredIds.has(id)) continue;
      scene.remove(model);
      model.traverse(c => { c.geometry?.dispose(); c.material?.dispose(); });
      modelsRef.current.delete(id);
    }
  }, [satellites, features?.all3dModels]);

  // Cleanup 3D models on unmount
  useEffect(() => () => {
    const globe = globeEl.current;
    if (!globe) return;
    const scene = globe.scene();
    for (const [, m] of modelsRef.current) {
      scene.remove(m);
      m.traverse(c => { c.geometry?.dispose(); c.material?.dispose(); });
    }
    modelsRef.current.clear();

    if (nightOverlayRef.current) {
      scene.remove(nightOverlayRef.current);
      nightOverlayRef.current.geometry?.dispose();
      nightOverlayRef.current.material?.dispose();
      nightOverlayRef.current = null;
    }

    debrisTemplate.geometry?.dispose();
    debrisTemplate.material?.dispose();
  }, []);

  // ══════════════════════════════════════════════════════
  // CONSTELLATION RINGS — tilted orbital plane rings
  // ══════════════════════════════════════════════════════
  useEffect(() => {
    const globe = globeEl.current;
    if (!globe) return;
    const scene = globe.scene();

    // Clean old rings
    for (const r of constellationRingsRef.current) {
      scene.remove(r);
      r.geometry?.dispose();
      r.material?.dispose();
    }
    constellationRingsRef.current = [];

    if (!features?.constellations || !constellationData?.groups?.size) return;

    const R = globe.getGlobeRadius();

    for (const [, group] of constellationData.groups) {
      if (group.satellites.length < 3) continue;

      let totalAlt = 0, totalInc = 0;
      for (const sat of group.satellites) {
        totalAlt += sat.alt || 400;
        totalInc += sat.inclination || 0;
      }
      const avgAlt = totalAlt / group.satellites.length;
      const avgInc = totalInc / group.satellites.length;
      const ringR = R * (1 + visualAlt(avgAlt));

      const geo = new THREE.TorusGeometry(ringR, 0.15, 6, 256);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(group.info.color),
        transparent: true, opacity: 0.25, side: THREE.DoubleSide, depthWrite: false,
      });
      const ring = new THREE.Mesh(geo, mat);

      // Torus lies in XY by default; rotate to XZ (equatorial), then tilt by inclination
      ring.rotation.x = Math.PI / 2;
      ring.rotation.z = avgInc * Math.PI / 180;

      scene.add(ring);
      constellationRingsRef.current.push(ring);
    }
  }, [features?.constellations, constellationData]);

  // ══════════════════════════════════════════════════════
  // DATA: orbit paths + ISL links merged into pathsData
  // ══════════════════════════════════════════════════════
  const pathsData = useMemo(() => {
    const paths = [];

    // Orbit path for selected satellite
    if (selectedSatellite?.orbitPath?.length) {
      paths.push({ coords: selectedSatellite.orbitPath, color: 'rgba(255,255,255,0.4)', _type: 'orbit' });
    }

    // ISL links as 2-point paths at satellite altitudes
    if (features?.islLinks && islLinksData?.length) {
      for (const link of islLinksData) {
        paths.push({
          coords: [
            [link.startLat, link.startLng, link.startAlt],
            [link.endLat, link.endLng, link.endAlt],
          ],
          color: link.color || 'rgba(0, 240, 255, 0.6)',
          _type: 'isl',
        });
      }
    }
    return paths;
  }, [selectedSatellite?.orbitPath, features?.islLinks, islLinksData]);

  // ══════════════════════════════════════════════════════
  // HTML ELEMENT: satellite widgets (non-iconic ones only get dot; iconic get label only)
  // ══════════════════════════════════════════════════════
  const htmlData = useMemo(() => {
    const data = satellites.map(s => ({ ...s, _type: 'sat' }));

    // Debris fallback markers: guarantees visibility even if objects layer is unsupported.
    if (features?.debris && debrisData?.length) {
      for (const d of debrisData.slice(0, 260)) {
        data.push({ ...d, _type: 'debris' });
      }
    }

    // Launch pads
    if (features?.launches && launchData) {
      const seen = new Set();
      for (const l of [...(launchData.upcoming || []), ...(launchData.recent || [])]) {
        if (l.padLat != null && l.padLng != null) {
          const key = `${l.padLat.toFixed(1)},${l.padLng.toFixed(1)}`;
          if (!seen.has(key)) {
            seen.add(key);
            data.push({ lat: l.padLat, lng: l.padLng, alt: 0, name: l.padName, id: `pad-${key}`, _type: 'pad' });
          }
        }
      }
    }
    return data;
  }, [satellites, features?.debris, debrisData, features?.launches, launchData]);

  const renderHtml = useCallback((d) => {
    if (d._type === 'pad') {
      const el = document.createElement('div');
      el.className = 'launch-pad-marker';
      el.innerHTML = `<div class="launch-pad-icon">🚀</div><div class="launch-pad-label">${d.name}</div>`;
      return el;
    }

    if (d._type === 'debris') {
      const el = document.createElement('div');
      el.className = 'debris-dot';
      return el;
    }

    // Satellite
    const el = document.createElement('div');
    const isSelected = selectedSatellite && d.id === selectedSatellite.id;
    const isIconic = !!getIconicConfig(d.name);
    const showAsModel = isIconic || features?.all3dModels;
    const coreSizePx = satVisualSizePx(d.sizeM || 4);
    const hideCore = isIconic && !features?.all3dModels;
    el.className = `sat-widget ${isSelected ? 'selected' : ''} cat-${d.category}${hideCore ? ' has-model' : ''}`;
    el.style.setProperty('--sat-core-size', `${coreSizePx}px`);

    if (!hideCore) {
      const core = document.createElement('div');
      core.className = 'sat-core';
      core.style.width = `${coreSizePx}px`;
      core.style.height = `${coreSizePx}px`;
      if (features?.all3dModels) {
        core.style.opacity = '0.45';
        core.style.boxShadow = '0 0 8px rgba(255,255,255,0.45)';
      }
      el.appendChild(core);
    }

    const label = document.createElement('div');
    label.className = 'sat-label';
    label.textContent = d.name;
    if (features?.all3dModels && !isSelected) {
      label.style.opacity = '0';
    }
    el.appendChild(label);

    if (isSelected) {
      const ring = document.createElement('div');
      ring.className = 'sat-ring';
      el.appendChild(ring);
    }

    el.onclick = () => onSatelliteClick?.(d);
    return el;
  }, [selectedSatellite?.id, onSatelliteClick, features?.all3dModels]);

  // ══════════════════════════════════════════════════════
  // DEBRIS as object spheres (floating points, not radial spikes)
  // ══════════════════════════════════════════════════════
  const debrisObjects = useMemo(() => {
    if (!features?.debris || !debrisData?.length) return [];
    return debrisData;
  }, [features?.debris, debrisData]);

  const debrisHtmlCount = useMemo(() => {
    if (!features?.debris || !debrisData?.length) return 0;
    return Math.min(debrisData.length, 260);
  }, [features?.debris, debrisData]);

  // ══════════════════════════════════════════════════════
  // FOOTPRINT as ringsData (pulsing expanding rings)
  // ══════════════════════════════════════════════════════
  const ringsData = useMemo(() => {
    if (!features?.footprint || !footprintData?.length) return [];
    return footprintData;
  }, [features?.footprint, footprintData]);

  // ══════════════════════════════════════════════════════
  // HEATMAP as hexBinPoints (the globe does the binning)
  // ══════════════════════════════════════════════════════
  const hexBinPoints = useMemo(() => {
    if (!features?.heatmap) return [];
    return satellites.map(s => ({ lat: s.lat, lng: s.lng }));
  }, [features?.heatmap, satellites]);

  return (
    <div className="globe-container">
      <Globe
        ref={globeEl}
        globeImageUrl={EARTH_BLUE_MARBLE}
        bumpImageUrl={EARTH_WATER}
        backgroundImageUrl={NIGHT_SKY}
        showAtmosphere={true}
        atmosphereColor="#00E5FF"
        atmosphereAltitude={0.25}
        animateIn={true}

        // ── Globe material ──
        onGlobeReady={() => {
          try {
            const globe = globeEl.current;
            const scene = globe.scene();
            let mat = typeof globe.globeMaterial === 'function' ? globe.globeMaterial() : globe._globeMesh?.material;
            if (mat && mat.bumpScale !== undefined) {
              mat.bumpScale = 15;
              new THREE.TextureLoader().load(EARTH_WATER, tex => {
                mat.specularMap = tex;
                mat.specular = new THREE.Color('#333333');
                mat.shininess = 25;
              });
            }
            const dl = scene.children.find(o => o.type === 'DirectionalLight');
            if (dl) { dl.intensity = 2.0; sunLightRef.current = dl; }
            const al = scene.children.find(o => o.type === 'AmbientLight');
            if (al) { al.intensity = 0.15; }
          } catch (err) {
            console.warn('[Globe3D] Error in onGlobeReady:', err);
          }
        }}

        // ── Map labels ──
        tilesData={[{ lat: 0, lng: 0, url: 'https://{s}.basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}.png' }]}
        tileLat="lat" tileLng="lng" tileAltitude={() => 0.005} tileUrl="url"

        // ── Satellite HTML widgets ──
        htmlElementsData={htmlData}
        htmlElement={renderHtml}
        htmlLat="lat" htmlLng="lng"
        htmlAltitude={d => {
          if (d._type === 'pad') return 0.01;
          if (d._type === 'debris') return visualAlt(d.alt || 400);
          return visualAlt(d.alt);
        }}

        // ── Orbit paths + ISL links ──
        pathsData={pathsData}
        pathPoints="coords"
        pathPointLat={p => p[0]}
        pathPointLng={p => p[1]}
        pathPointAlt={p => visualAlt(p[2])}
        pathColor={d => d.color}
        pathStroke={d => d._type === 'isl' ? 0.6 : 1.5}
        pathDashLength={d => d._type === 'isl' ? 0.3 : 0.02}
        pathDashGap={d => d._type === 'isl' ? 0.15 : 0.01}
        pathDashAnimateTime={d => d._type === 'isl' ? 3000 : 60000}

        // ── Debris (floating 3D dots) ──
        objectsData={debrisObjects}
        objectLat="lat"
        objectLng="lng"
        objectAltitude={d => visualAlt(d.alt || 400)}
        objectFacesSurface={false}
        objectThreeObject={() => debrisTemplate.clone()}

        // ── Footprint rings ──
        ringsData={ringsData}
        ringLat={d => d.lat}
        ringLng={d => d.lng}
        ringMaxRadius={d => d.radius}
        ringAltitude={0.003}
        ringResolution={96}
        ringPropagationSpeed={18}
        ringRepeatPeriod={2200}
        ringColor={() => t => `rgba(0, 240, 255, ${(1 - t) * 0.7})`}

        // ── Heatmap hex bins ──
        hexBinPointsData={hexBinPoints}
        hexBinPointLat={d => d.lat}
        hexBinPointLng={d => d.lng}
        hexBinResolution={3}
        hexTopColor={d => {
          const w = Math.min(d.sumWeight / 8, 1);
          return `rgba(0, 240, 255, ${0.4 + w * 0.6})`;
        }}
        hexSideColor={d => {
          const w = Math.min(d.sumWeight / 8, 1);
          return `rgba(0, 240, 255, ${0.15 + w * 0.35})`;
        }}
        hexAltitude={d => Math.max(d.sumWeight * 0.004, 0.002)}
        hexBinMerge={true}
        hexTransitionDuration={300}
      />

      {/* Terminator legend */}
      {features?.terminator && terminatorData?.sunPos && (
        <div className="terminator-legend">
          <span className="terminator-sun-icon">☀</span>
          <span className="terminator-legend-text">
            Subsolar: {terminatorData.sunPos.lat.toFixed(1)}°, {terminatorData.sunPos.lng.toFixed(1)}°
          </span>
        </div>
      )}

      {/* Debris counter */}
      {features?.debris && debrisObjects.length > 0 && (
        <div className="debris-counter">
          <span className="debris-counter-icon">⚠</span>
          <span className="debris-counter-text">{debrisObjects.length} DEBRIS OBJECTS</span>
        </div>
      )}

      {/* Constellation legend */}
      {features?.constellations && constellationData?.groups?.size > 0 && (
        <div className="constellation-legend">
          {[...constellationData.groups.entries()].map(([name, group]) => (
            <div key={name} className="constellation-legend-item">
              <span className="constellation-color-dot" style={{ background: group.info.color }} />
              <span>{name}</span>
              <span className="constellation-count mono">{group.satellites.length}</span>
            </div>
          ))}
        </div>
      )}

      {(features?.debris || features?.footprint || features?.all3dModels) && (
        <div className="render-debug-badge">
          <div className="render-debug-title">LAYER DEBUG</div>
          <div className="render-debug-row">
            <span>Satellites total</span>
            <span className="mono">{satellites?.length || 0}</span>
          </div>
          <div className="render-debug-row">
            <span>3D models active</span>
            <span className="mono">{modelsRef.current?.size || 0}</span>
          </div>
          <div className="render-debug-row">
            <span>Debris fetched</span>
            <span className="mono">{debrisData?.length || 0}</span>
          </div>
          <div className="render-debug-row">
            <span>Debris 3D objects</span>
            <span className="mono">{debrisObjects.length}</span>
          </div>
          <div className="render-debug-row">
            <span>Footprint rings</span>
            <span className="mono">{ringsData.length}</span>
          </div>
          <div className="render-debug-row">
            <span>Tracking sat</span>
            <span className="mono">{selectedSatellite?.id ?? 'auto'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
