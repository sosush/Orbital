// --- CONFIGURATION ---
const API_URL = 'https://api.wheretheiss.at/v1/satellites/25544';
const POLL_INTERVAL = 2000; // 2 seconds
const TILE_PROVIDER = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

// --- STATE ---
let map;
let issMarker;
let issPath;
let pathCoordinates = [];
let firstLoad = true;
let isLocked = false;
let startTime = Date.now();

// --- DOM ELEMENTS ---
const elLat = document.getElementById('lat');
const elLon = document.getElementById('lon');
const elAlt = document.getElementById('alt');
const elVel = document.getElementById('vel');
const elAltBar = document.getElementById('alt-bar');
const elVelBar = document.getElementById('vel-bar');
const elUptime = document.getElementById('uptime');
const btnRecenter = document.getElementById('recenter-btn');
const bootSequence = document.getElementById('boot-sequence');

// --- INITIALIZATION ---
function initMap() {
    // 1. Initialize Map
    map = L.map('iss-map', {
        zoomControl: false,
        attributionControl: false,
        zoomAnimation: true
    }).setView([0, 0], 3);

    // 2. Add Dark Mode Tiles
    L.tileLayer(TILE_PROVIDER, {
        attribution: TILE_ATTRIBUTION,
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    // 3. Define Custom Icon (More detailed SVG now)
    const issIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="iss-marker-container">
                 <div class="iss-radar-sweep"></div>
                 <div class="iss-axis vertical"></div>
                 <div class="iss-axis horizontal"></div>
                 <div class="iss-core"></div>
               </div>`,
        iconSize: [60, 60],
        iconAnchor: [30, 30]
    });

    // 4. Initialize Marker
    issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);
    issMarker.bindPopup("<b>ISS TARGET</b><br>ORBITAL STATION ALPHA");

    // 5. Initialize Path Line
    issPath = L.polyline([], {
        color: '#00f0ff', // Updated to match CSS var --c-primary
        weight: 2,
        opacity: 0.6,
        dashArray: '5, 10', // Dashed line for a more "tech" look
        lineJoin: 'round'
    }).addTo(map);

    // 6. Break auto-follow when user drags the map
    map.on('dragstart', () => {
        isLocked = false;
    });

    // Start Tracking
    getISS();
    setInterval(getISS, POLL_INTERVAL);
    setInterval(updateUptime, 1000);

    // Hide boot sequence after a delay
    setTimeout(() => {
        bootSequence.classList.add('loaded');
    }, 2500);
}

// --- CORE LOGIC ---
async function getISS() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        const { latitude, longitude, altitude, velocity } = data;

        // update state
        updateHUD(latitude, longitude, altitude, velocity);
        updateMap(latitude, longitude);

    } catch (error) {
        console.error('Error fetching ISS data:', error);
        document.querySelector('.status-indicator').classList.remove('active');
        document.querySelector('.status-indicator').style.backgroundColor = 'red';
        document.querySelector('.connection-status .value').textContent = 'OFFLINE';
        document.querySelector('.connection-status .value').style.color = 'red';
    }
}

function updateHUD(lat, lon, alt, vel) {
    elLat.textContent = lat.toFixed(4);
    elLon.textContent = lon.toFixed(4);
    elAlt.textContent = alt.toFixed(2);
    elVel.textContent = vel.toFixed(2);

    // Visualize bars (normalize roughly: Alt ~400km, Vel ~27600km/h)
    // Clamping percentages to avoid overflow
    const altPercent = Math.min((alt / 450) * 100, 100); 
    const velPercent = Math.min((vel / 28000) * 100, 100);

    elAltBar.style.width = `${altPercent}%`;
    elVelBar.style.width = `${velPercent}%`;
}

function updateMap(lat, lon) {
    const newLatLng = [lat, lon];

    issMarker.setLatLng(newLatLng);

    pathCoordinates.push(newLatLng);
    if (pathCoordinates.length > 500) pathCoordinates.shift();
    issPath.setLatLngs(pathCoordinates);

    if (firstLoad) {
        map.setView(newLatLng, 5); // Zoom in a bit more on load
        firstLoad = false;
    } else if (isLocked) {
        map.panTo(newLatLng);
    }
}

function updateUptime() {
    const diff = Date.now() - startTime;
    const date = new Date(diff);
    const str = date.toISOString().substr(11, 8);
    elUptime.textContent = str;
}

// --- INTERACTION ---
btnRecenter.addEventListener('click', () => {
    const latLng = issMarker.getLatLng();
    map.flyTo(latLng, 5, {
        animate: true,
        duration: 1.5
    });
    isLocked = true;
    
    // Animation visual
    const originalContent = btnRecenter.innerHTML;
    btnRecenter.innerHTML = 'LOCKED';
    btnRecenter.style.background = 'var(--c-primary)';
    btnRecenter.style.color = 'black';
    
    setTimeout(() => {
        isLocked = false; 
        btnRecenter.innerHTML = originalContent;
        btnRecenter.style.background = '';
        btnRecenter.style.color = '';
    }, 2000); 
});


// Start
document.addEventListener('DOMContentLoaded', initMap);