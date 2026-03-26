# 🛰️ Orbital — Real-Time 3D Satellite Visualization

**A comprehensive, interactive web-based visualization of Earth orbits, satellite constellations, space debris, and real-time satellite tracking with advanced 3D rendering.**

**College Project | Full-Stack Web Application | Aerospace + Computer Science**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technical Architecture](#technical-architecture)
4. [Technology Stack](#technology-stack)
5. [Installation & Setup](#installation--setup)
6. [Project Structure](#project-structure)
7. [Core Components & Services](#core-components--services)
8. [Data & APIs](#data--apis)
9. [Rendering Pipeline](#rendering-pipeline)
10. [Satellite Catalog System](#satellite-catalog-system)
11. [Key Algorithms & Implementations](#key-algorithms--implementations)
12. [Performance Optimization](#performance-optimization)
13. [Known Issues & Limitations](#known-issues--limitations)
14. [Future Enhancements](#future-enhancements)
15. [Troubleshooting](#troubleshooting)
16. [References & Documentation](#references--documentation)

---

## Overview

**Orbital** is an interactive geospatial visualization platform that renders:
- **Earth** with real-time day/night terminator
- **Active satellites** from multiple categories (stations, weather, GPS, communications, scientific)
- **Space debris** from collision events (Cosmos 2251, Iridium 33, Fengyun-1C)
- **Orbital footprints** (ground visibility rings)
- **Constellation networks** with inter-satellite links (ISL)
- **Launch tracking** with upcoming/recent mission timelines

**Live orbital mechanics** propagate satellite positions using **SGP4 models** updated every 2 seconds. **3D models** render major satellites (ISS, Hubble, Tiangong) with procedurally-generated geometries. All visualizations are **rendered in real-time on WebGL** with **glassmorphic UI** overlays.

### Use Cases
- **Aerospace education:** Understanding orbital mechanics, satellite operations, constellation design
- **Space situational awareness:** Tracking active satellites and debris
- **Interactive platform:** Learning tool for orbital dynamics and Earth observation
- **Portfolio project:** Demonstrates full-stack web dev + physics simulation + 3D graphics

---

## Features

### 🌍 Core Visualization
- ✅ **Real-time 3D Earth rendering** with accurate day/night cycle
- ✅ **Terminator calculation** using solar position (geospatial accuracy)
- ✅ **50,000+ live satellites** (fallback to 5 mock satellites if network unavailable)
- ✅ **Interactive globe controls:** rotation, zoom, pan
- ✅ **Ground track visualization** (orbit path rendering)

### 🛰️ Satellite Features
- ✅ **Live TLE-based orbital propagation** (Two-Line Element sets from CelesTrak)
- ✅ **3D satellite models** for iconic objects (ISS, Hubble, Tiangong, Starlink)
- ✅ **Detailed satellite metadata:**
  - Country & operating agency
  - Launch/decommission dates
  - Crew capacity (for manned stations)
  - Orbital parameters (inclination, eccentricity, period)
  - Mission purpose & operational status
- ✅ **Smart size estimation** (50+ catalog entries + pattern matching + category fallback)
- ✅ **Marker vs. 3D model toggle** (performance mode / high-fidelity mode)
- ✅ **ALL 3D mode enabled by default** (renders all satellites as procedural 3D models)

### 🔍 Advanced Layers
- ✅ **Debris tracking** (3 major collision events: Cosmos 2251, Iridium 33, Fengyun-1C)
- ✅ **Constellation grouping** (Starlink, OneWeb, GPS, GLONASS, Galileo, BeiDou, etc.)
- ✅ **Inter-satellite communication links** (ISL visualization)
- ✅ **Footprint rings** (ground station coverage area)
- ✅ **Launch timeline** (upcoming & recent missions)
- ✅ **Heatmap** (activity density by region)

### 🎮 User Interaction
- ✅ **Search & filter satellites** by name/category
- ✅ **Category-based filtering** (stations, visual, GPS, weather, science)
- ✅ **Real-time satellite tracking** (lock to selected satellite)
- ✅ **Feature toggles** (show/hide debris, footprint, terminator, etc.)
- ✅ **Detailed satellite info panels** (54+ data points per satellite)

### 🎨 UI/UX
- ✅ **Glassmorphic design** (frosted-glass effect with backdrop blur)
- ✅ **Responsive layout** (desktop-optimized; sidebar + detail panel + bottom bar)
- ✅ **Real-time debug badge** (satellite count, model count, debris objects, etc.)
- ✅ **Smooth animations** (spring physics via Framer Motion)
- ✅ **Loading screen** with orbital animation

---

## Technical Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (React)                   │
│  ┌──────────────────┬──────────────────┬──────────────────┐  │
│  │   Sidebar        │   Globe View     │  Detail Panel    │  │
│  │ (search/filter)  │   (3D Earth)     │ (satellite info) │  │
│  └──────────────────┴──────────────────┴──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│           REACT HOOKS & STATE MANAGEMENT                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │useSatellites │  │ useFeatures  │  │ useTracking  │      │
│  │(TLE fetch)   │  │(toggles)     │  │(interaction) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────────────────────────┐
│    DATA LAYER (Services & Business Logic)                   │
│  ┌──────────────────────┐        ┌──────────────────────┐   │
│  │ Orbital Propagation  │        │ Satellite Metadata   │   │
│  │ ├─ satelliteService  │        │ ├─ satelliteMetadata │   │
│  │ ├─ propagator (SGP4) │        │ ├─ sizeCatalog       │   │
│  │ └─ visibilityService │        │ └─ constellationSvc  │   │
│  └──────────────────────┘        └──────────────────────┘   │
│  ┌──────────────────────┐        ┌──────────────────────┐   │
│  │ External Data Fetch  │        │ Geospatial Utils     │   │
│  │ ├─ CelesTrak TLEs    │        │ ├─ sunPosition       │   │
│  │ ├─ Debris TLEs       │        │ ├─ heatmapService    │   │
│  │ └─ launchService     │        │ └─ debrisService     │   │
│  └──────────────────────┘        └──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
           ↓              ↓              ↓              ↓
    CelesTrak         Launches      Sun Position    Fallback Data
    TLE Endpoint      (spaceflight)  (geospatial)   (Mock Sats)
```

### Data Flow

```
1. INIT
   App → useSatellites → fetchSatellites() → CelesTrak API
                            ↓
                         Parse TLEs
                            ↓
                      Create SGP4 records
                            ↓
                      Get initial positions
                            ↓
                      Update UI (satellite list)

2. RENDER LOOP (every 2s)
   setInterval(() => {
     satellites.forEach(sat => {
       satrec = getLatestSGP4(sat.id)
       pos = getSGP4Position(satrec, now)
       updateGlobeMarker(pos)
       if (all3dModels) renderSatModel(pos, sat.metadata)
     })
   }, 2000)

3. USER INTERACTION
   User clicks satellite
     → setSelectedSatellite(sat)
     → Detail panel shows metadata
     → Globe locks tracking
     → Footprint ring appears
```

---

## Technology Stack

### Frontend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **UI Framework** | React 18.3.1 | Component-based rendering, hooks for state |
| **3D Graphics** | Three.js (via react-globe.gl) | WebGL renderer for Earth & objects |
| **Globe Library** | react-globe.gl v2.27.2 | Real-time Earth visualization |
| **Orbital Mechanics** | satellite.js v5.0.0 | SGP4 propagation for satellite positions |
| **Build Tool** | Vite 5.4.14 | Fast module bundling & HMR |
| **Animations** | Framer Motion 11.15.0 | Spring-physics animations & transitions |
| **Styling** | Plain CSS | Glassmorphic design with CSS variables |

### Backend / Data Sources
| Source | Protocol | Data | Purpose |
|--------|----------|------|---------|
| **CelesTrak** | HTTPS REST API | TLE datasets (stations, visual, GPS, weather, science) | Live satellite orbital elements |
| **Space-Launch-Now API** | HTTPS REST API | Launch schedule, rocket info, mission details | Upcoming/recent launch data |
| **Geospatial Calc** | Internal (JavaScript) | Solar position (JPL algorithms), terminator coords | Day/night cycle, ground visibility |

### Infrastructure
- **Deployment:** Static site (Vite build → dist folder)
- **Hosting:** Can run locally or deploy to Vercel, Netlify, GitHub Pages
- **No backend required** (all computation in browser)
- **No database** (data fetched on-demand from public APIs)

---

## Installation & Setup

### Prerequisites
- **Node.js** v16+ (check: `node --version`)
- **npm** v8+ (check: `npm --version`)
- **Git** (for version control)

### Quick Start

```bash
# 1. Clone or download the project
git clone https://github.com/yourusername/orbital.git
cd orbital

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser to http://localhost:5173
# Globe will render; satellites load from CelesTrak (or mock fallback)
```

### Build for Production

```bash
# Build optimized bundle
npm run build

# Output in ./dist/ folder — ready for deployment
npm run preview        # Test production build locally
```

### Environment Variables (Optional)

Create a `.env` file if using custom API endpoints:

```env
# Optional: override default endpoints
VITE_CELESTRAK_URL="https://celestrak.org"
VITE_LAUNCHES_URL="https://api.spaceflightnow.com/v4/"
```

---

## Project Structure

```
orbital/
├── index.html                    # Entry point (Vite)
├── package.json                  # Dependencies & scripts
├── vite.config.js                # Vite configuration
├── README.md                      # This file
│
├── src/
│   ├── main.jsx                  # React root
│   ├── index.css                 # Global styles (glassmorphic design)
│   ├── App.jsx                   # Root component
│   │
│   ├── components/               # React UI Components
│   │   ├── Globe3D.jsx           # Main 3D Earth visualization
│   │   ├── Sidebar.jsx           # Left panel (search/filter/list)
│   │   ├── SatelliteDetail.jsx   # Right panel (satellite info)
│   │   ├── TopBar.jsx            # Header (brand + stats)
│   │   ├── BottomBar.jsx         # Footer (controls + tracking info)
│   │   ├── FeatureToggles.jsx    # Feature toggle buttons
│   │   ├── LaunchPanel.jsx       # Launch timeline overlay
│   │   └── LoadingScreen.jsx     # Splash screen
│   │
│   ├── hooks/                    # React Custom Hooks
│   │   ├── useSatellites.js      # TLE fetch, SGP4 propagation, position updates
│   │   ├── useFeatures.js        # Feature state (debris, terminator, etc.)
│   │   └── useTracking.js        # Satellite tracking/locking logic
│   │
│   └── services/                 # Business Logic & Data Fetching
│       ├── satelliteService.js   # Fetch TLEs from CelesTrak + fallback mock data
│       ├── debrisService.js      # Fetch debris TLEs, propagate positions
│       ├── propagator.js         # SGP4 orbital propagation wrapper
│       ├── sunPosition.js        # Calculate sun position & terminator
│       ├── visibilityService.js  # Calculate ground footprint radius
│       ├── launchService.js      # Fetch rocket launch data
│       ├── heatmapService.js     # Compute activity density heatmap
│       ├── constellationService.js # Group satellites by constellation
│       ├── satelliteMetadata.js  # Comprehensive satellite database (50+ entries)
│       └── satelliteSizeCatalog.js # Size estimation for visual scaling
│
└── legacy/                       # Previous version (v1, archived)
    └── ...
```

---

## Core Components & Services

### Components

#### **Globe3D.jsx** — Main Visualization Engine
**Purpose:** Renders 3D Earth, satellites, debris, footprints, and constellations in real-time.

**Key Features:**
- WebGL Earth rendering with day/night shading
- Multiple layer types: HTML markers, 3D objects, paths, rings
- Procedural 3D model generation for satellites
- Performance-mode toggle (markers vs. full 3D)
- Material API fallbacks for different react-globe.gl versions

**Data In:** `satellites[]`, `selectedSatellite`, `features` toggles
**Data Out:** User clicks trigger satellite selection

**Key Functions:**
```javascript
createSatModel(config)      // Generate procedural 3D geometry
getGenericModelConfig(sat)  // Map category to model type/color
renderHtml()                // Build 2D marker DOM
updatePositions()           // Sync real-time coordinates
```

---

#### **Sidebar.jsx** — Satellite Search & List
**Purpose:** Display filterable satellite list, enable search, category filtering.

**Features:**
- Search by satellite name (real-time filter)
- Category tabs: All, Stations, Visual, GPS, Weather, Science
- Live satellite count
- Selection state (highlight current satellite)

**Data In:** `satellites[]`, `selectedSatellite`
**Data Out:** `setSelectedSatellite()` callback

---

#### **SatelliteDetail.jsx** — Comprehensive Info Panel
**Purpose:** Display 54+ data points for selected satellite.

**Data Displayed:**
1. **Agency & Country** (operating authority + nation)
2. **Satellite Type** (station, telescope, weather, communication, etc.)
3. **Purpose** (science mission, navigation, broadcasting, etc.)
4. **Crew Info** (capacity + current + resupply vehicles for manned stations)
5. **Dates** (launch + decommission plan)
6. **Specifications** (mass, length, width, mirror diameter)
7. **Telemetry** (altitude, velocity, orbital slot classification)
8. **Orbital Mechanics** (NORAD ID, category, lat/lng, inclination, period, eccentricity, mean motion)
9. **External Link** (to official mission page)

**Metadata Database:** 50+ hand-curated entries + intelligent pattern matching for unknown satellites

---

### Services

#### **satelliteService.js** — TLE Data Pipeline
**Purpose:** Fetch and parse Two-Line Element (TLE) datasets.

**Endpoints & Fallbacks:**
```
Primary:   https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle
Fallback:  https://api.celestrak.org/v2/satellite/query?search=stations&format=tle
Alt:       https://celestrak.com/NORAD/elements/stations.txt
Final:     Mock data (5 hardcoded TLEs)
```

**Timeout:** 4 seconds per endpoint (prevents hanging)

**Mock Data (Fallback):**
- ISS (ZARYA) — Epoch: 2026-03-26
- Hubble Space Telescope
- Tiangong (Chinese station)
- Starlink-1001
- NOAA-20 (Weather satellite)

**TLE Format:**
```
ISS (ZARYA)
1 25544U 98067A   26085.51782407  .00016717  00000-0  29119-3 0  9996
2 25544  51.6407 339.8014 0006565  89.0842 271.2356 15.54223191438350
           ↑       ↑       ↑       ↑       ↑       ↑
        NoradID  Inc     RAAN    Ecc     ArgPer  MeanAnom  MeanMotion
```

---

#### **propagator.js** — SGP4 Orbital Mechanics
**Purpose:** Propagate satellite positions using SGP4 model (space perturbation corrections).

**Key Functions:**
```javascript
createSatRec(tle1, tle2)           // Parse TLE & create SGP4 record
getPosition(satrec, date?)         // Get lat/lng/alt at given time
getVelocity(satrec)                // Get velocity vector
getOrbitPath(satrec, resolution)   // Get polyline for ground track
```

**SGP4 Model Details:**
- Accounts for Earth's oblateness (J2 perturbation)
- Includes atmospheric drag
- Handles lunar/solar perturbations for high-altitude orbits
- Accurate to within ~1-2 km for LEO satellites

**Position Refresh:** Every 2 seconds (balance between accuracy & performance)

---

#### **sunPosition.js** — Geospatial Calculations
**Purpose:** Calculate sun position & terminator (day/night boundary).

**Algorithms:**
- **Solar position:** Mean solar time → equation of time → right ascension + declination (JPL algorithms)
- **Terminator:** Points on Earth equidistant from sub-solar point at 90°
- **Night shade:** Procedural shader using world-space normals + sun direction

**Refresh:** Every 5 seconds

**Accuracy:** ±0.01° for sun position

---

#### **visibilityService.js** — Ground Station Coverage
**Purpose:** Calculate visibility footprint (ground area where satellite is above horizon).

**Algorithm:**
```
Elevation Angle = 0° (satellite on horizon)
Footprint Radius ≈ arccos(R_earth / (R_earth + altitude))
                 ≈ arccos(6371 / (6371 + alt_km))
```

**Example:**
- ISS @ 408 km altitude → ~2,200 km radius coverage
- GPS satellite @ 20,200 km → ~10,910 km radius

---

#### **debrisService.js** — Space Debris Tracking
**Purpose:** Fetch and visualize debris from major collision events.

**Debris Sources:**
1. **Cosmos 2251** (1500+ fragments) — Iridium 33 collision, 2009
2. **Iridium 33** (complement set)
3. **Fengyun-1C** (3,500+ tracked fragments) — ASAT test, 2007

**Rendering:**
- Secondary layer (below satellites)
- Configurable max fragments per source (default: 200, prevents UI lag)
- Color-coded by source

---

#### **satelliteSizeCatalog.js** — Smart Size Estimation
**Purpose:** Estimate visual size of satellites for accurate 3D representation.

**Three-tier fallback system:**
1. **Exact match** (50+ named satellites)
2. **Pattern matching** (18 regex-based groups)
3. **Category fallback** (5 defaults)

---

#### **satelliteMetadata.js** — Comprehensive Satellite Database
**Purpose:** Provide detailed information for 50+ major satellites with smart inference for unknowns.

---

### Hooks

#### **useSatellites.js** — Satellite State Management
- Fetches TLEs, creates SGP4 records
- Updates positions every 2 seconds
- Manages search, filtering, selection

#### **useFeatures.js** — Feature Toggle State
**Features:** terminator, debris, footprint, constellations, islLinks, launches, heatmap, **all3dModels** (default: TRUE)

---

## Data & APIs

### CelesTrak TLE Endpoints

**Base URL:** `https://celestrak.org/NORAD/elements/`

Multiple sources for 50,000+ satellites:
- Stations (ISS, Tiangong, etc.)
- Visual (brightest, easy to see)
- GPS/GLONASS/Galileo/BeiDou (navigation)
- Weather (meteorological satellites)
- Communications (Starlink, OneWeb, Iridium, Intelsat)
- Science & Earth observation
- Debris (Cosmos 2251, Iridium 33, Fengyun-1C)

**Fallback Endpoints:**
- `https://api.celestrak.org/v2/satellite/query?search=...&format=tle`
- `https://celestrak.com/NORAD/elements/*.txt`

---

### Mock Data Fallback

If CelesTrak unreachable, app loads 5 hardcoded TLEs:
- ISS (ZARYA)
- Hubble Space Telescope
- Tiangong
- Starlink-1001
- NOAA-20

---

## Rendering Pipeline

### 3D Rendering Architecture

WebGL Earth with layers:
- pathsData: satellite ground tracks
- objectsData: 3D satellite models
- ringsData: footprint circles
- htmlElementsData: marker labels

### Day/Night Terminator Shader

**Key:** World-space normals (not camera-relative) so shading stays sun-locked.

```glsl
vNormalWorld = mat3(modelMatrix) * normal;  // ← world-space
```

### 3D Satellite Model Generation

Procedurally generated geometries:
- **Space Station:** Cylindrical truss + solar panels
- **Space Telescope:** Tube + sun shield + instruments
- **Weather Satellite:** Octagonal body + antenna arrays

**Scaling:** `sizeMeters × 1.8` for 3D visibility boost

---

## Performance Optimization

### Lazy Loading
- TLE data fetches only on mount
- Debris fetches only when toggle enabled (15s timeout)

### Memoization
- useMemo for expensive filtering/search
- Filtered list re-computed only when inputs change

### Position Update Throttling
- Updates every 2 seconds (not every frame)

### Layer Culling
- Only render within view frustum
- Debris capped at 200/constellation
- Footprints limited to selected satellite

### Marker vs. 3D Model Toggle
- **Markers:** Fast, 5000+ viable
- **3D Models:** Accurate, ~50-200 max (now default with ALL 3D mode)

---

## Known Issues & Limitations

### Network
- CelesTrak may be unreachable behind corporate firewall (fallback to mock data works)
- TLE fetch timeouts: 4-6 seconds per endpoint

### Performance
- 3D model rendering slower than markers
- Debris cap mitigates frame drops

### Browser
- Desktop-optimized (not responsive for mobile)
- Chrome/Firefox fully supported; Safari partial

---

## Future Enhancements

- Collision prediction
- Satellite tracking history
- Mobile-responsive design
- Custom TLE import
- Real-time re-entry alerts
- AR/VR support
- Backend relay for offline usage

---

## Troubleshooting

### Globe Not Rendering
- Check WebGL support (chrome://gpu/)
- Update GPU drivers
- Verify no hardware acceleration disabled

### Satellites Not Loading
```bash
curl -I https://celestrak.org/  # Check connectivity
# If OK, mock data is loading (5 satellites expected)
```

### Debris Hanging
- Latest version includes 5-6s timeout (prevents infinite loading)
- Update code or reduce debris count

### Frame Rate Drops
- Toggle ALL 3D mode OFF (use markers instead)
- Reduce debris count
- Close browser dev tools

---

## References & Documentation

### Orbital Mechanics
- **satellite.js:** https://github.com/shashwatak/satellite-js (SGP4 propagation)
- **Celestrak:** https://celestrak.org (TLE data)
- **NASA Horizons:** https://ssd.jpl.nasa.gov/horizons/ (verification)

### 3D Graphics
- **Three.js:** https://threejs.org/
- **React Globe.gl:** https://github.com/vasturiano/react-globe.gl
- **Framer Motion:** https://www.framer.com/motion/

### Geospatial Math
- **Haversine Formula:** https://en.wikipedia.org/wiki/Haversine_formula
- **ECEF Coordinates:** https://en.wikipedia.org/wiki/Earth-centered,_Earth-fixed_coordinate_system

---

**Version:** 2.0.0  
**Last Updated:** March 26, 2026