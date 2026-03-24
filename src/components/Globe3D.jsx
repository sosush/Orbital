import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';

// High-res realistic earth assets
const EARTH_BLUE_MARBLE = '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const EARTH_NIGHT       = '//unpkg.com/three-globe/example/img/earth-night.jpg';
const EARTH_WATER       = '//unpkg.com/three-globe/example/img/earth-water.png';
const EARTH_CLOUDS      = '//unpkg.com/three-globe/example/img/earth-clouds10k.png';
const NIGHT_SKY         = '//unpkg.com/three-globe/example/img/night-sky.png';

function visualAlt(altKm) {
  // Logarithmic scale so LEO and MEO/GEO are both visible
  return Math.log(1 + altKm / 200) * 0.08;
}

export default function Globe3D({ satellites, selectedSatellite, onSatelliteClick, onRecenter }) {
  const globeEl = useRef();
  const recenterRef = useRef(null);
  const [clouds, setClouds] = useState(null);

  // Initial setup & Clouds
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

    // Set initial view
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 });

    // Add Clouds layer
    const CLOUDS_ALT = 0.004;
    const CLOUDS_ROTATION_SPEED = -0.006; // deg/frame
    
    new THREE.TextureLoader().load(EARTH_CLOUDS, cloudsTexture => {
      const cloudsObj = new THREE.Mesh(
        new THREE.SphereGeometry(globe.getGlobeRadius() * (1 + CLOUDS_ALT), 72, 72),
        new THREE.MeshPhongMaterial({ map: cloudsTexture, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
      );
      setClouds(cloudsObj);
      globe.scene().add(cloudsObj);

      (function rotateClouds() {
        cloudsObj.rotation.y += CLOUDS_ROTATION_SPEED * Math.PI / 180;
        requestAnimationFrame(rotateClouds);
      })();
    });

  }, []);

  // Fly to selected satellite
  useEffect(() => {
    if (!selectedSatellite || !globeEl.current) return;
    const controls = globeEl.current.controls();
    controls.autoRotate = false;
    globeEl.current.pointOfView(
      { lat: selectedSatellite.lat, lng: selectedSatellite.lng, altitude: 0.8 },
      1200
    );
  }, [selectedSatellite?.id]);

  // Expose recenter
  useEffect(() => {
    recenterRef.current = () => {
      if (!globeEl.current) return;
      if (selectedSatellite) {
        globeEl.current.pointOfView(
          { lat: selectedSatellite.lat, lng: selectedSatellite.lng, altitude: 0.8 },
          800
        );
      } else {
        const controls = globeEl.current.controls();
        controls.autoRotate = true;
        globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 1000);
      }
    };
  }, [selectedSatellite]);

  // Wire up external recenter
  useEffect(() => {
    if (onRecenter) onRecenter.current = () => recenterRef.current?.();
  }, [onRecenter]);

  // Orbit path for selected satellite
  const pathsData = useMemo(() => {
    if (!selectedSatellite?.orbitPath?.length) return [];
    return [{ coords: selectedSatellite.orbitPath }];
  }, [selectedSatellite?.orbitPath]);

  // HTML Element for satellites (Widget/Icon)
  const renderSatelliteWidget = useCallback((d) => {
    const el = document.createElement('div');
    const isSelected = selectedSatellite && d.id === selectedSatellite.id;
    
    el.className = `sat-widget ${isSelected ? 'selected' : ''} cat-${d.category}`;
    
    // Core dot
    const core = document.createElement('div');
    core.className = 'sat-core';
    el.appendChild(core);

    // Label
    const label = document.createElement('div');
    label.className = 'sat-label';
    label.textContent = d.name;
    el.appendChild(label);

    // Pulsing ring for selected
    if (isSelected) {
      const ring = document.createElement('div');
      ring.className = 'sat-ring';
      el.appendChild(ring);
    }

    el.onclick = () => {
      if (onSatelliteClick) onSatelliteClick(d);
    };

    return el;
  }, [selectedSatellite?.id, onSatelliteClick]);

  return (
    <div className="globe-container">
      <Globe
        ref={globeEl}
        globeImageUrl={EARTH_BLUE_MARBLE}
        bumpImageUrl={EARTH_WATER}
        backgroundImageUrl={NIGHT_SKY}
        showAtmosphere={true}
        atmosphereColor="#00E5FF" // Bright electric cyan tone
        atmosphereAltitude={0.25}
        animateIn={true}
        
        // HTML Widgets instead of Points
        htmlElementsData={satellites}
        htmlElement={renderSatelliteWidget}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={d => visualAlt(d.alt)}
        
        // Custom globe material for Day/Night specular
        onGlobeReady={() => {
          const globeMaterial = globeEl.current.globeMaterial();
          globeMaterial.bumpScale = 15;
          new THREE.TextureLoader().load(EARTH_WATER, texture => {
            globeMaterial.specularMap = texture;
            globeMaterial.specular = new THREE.Color('#333333');
            globeMaterial.shininess = 25;
          });

          // Tweak internal lights for a more cinematic look
          const scene = globeEl.current.scene();
          const dLight = scene.children.find(obj => obj.type === 'DirectionalLight');
          if (dLight) {
            dLight.intensity = 2.0; 
            dLight.position.set(1, 0.5, 1).normalize();
          }
          const aLight = scene.children.find(obj => obj.type === 'AmbientLight');
          if (aLight) {
            aLight.intensity = 0.15; // Darker night side
          }
        }}

        // Maps / Labels configuration (Tile layer for borders/cities)
        tilesData={[{
          lat: 0, lng: 0, 
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/light_only_labels/{z}/{x}/{y}.png'
        }]}
        tileLat="lat"
        tileLng="lng"
        tileAltitude={() => 0.005} // Slightly above clouds
        tileUrl="url"
        
        // Orbit path
        pathsData={pathsData}
        pathPoints="coords"
        pathPointLat={p => p[0]}
        pathPointLng={p => p[1]}
        pathPointAlt={p => visualAlt(p[2])}
        pathColor={() => 'rgba(255, 255, 255, 0.4)'}
        pathStroke={1.5}
        pathDashLength={0.02}
        pathDashGap={0.01}
        pathDashAnimateTime={60000}
      />
    </div>
  );
}
