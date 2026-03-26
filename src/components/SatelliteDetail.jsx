import { getSatelliteMetadata, formatOrbitalSlot, getOperationalStatus } from '../services/satelliteMetadata';

export default function SatelliteDetail({ satellite, onClose, onTrack }) {
  if (!satellite) return null;

  const metadata = getSatelliteMetadata(satellite.noradId, satellite.name);
  const opStatus = getOperationalStatus(metadata);
  const orbitalSlot = formatOrbitalSlot(satellite.alt, satellite.inclination);

  // Orbital mechanics
  const orbitalRows = [
    ['NORAD ID',      satellite.noradId,                          true],
    ['CATEGORY',      satellite.categoryLabel,                    false],
    ['LATITUDE',      satellite.lat?.toFixed(4) + '°',            true],
    ['LONGITUDE',     satellite.lng?.toFixed(4) + '°',            true],
    ['INCLINATION',   satellite.inclination?.toFixed(2) + '°',    true],
    ['PERIOD',        satellite.period?.toFixed(1) + ' MIN',      true],
    ['ECCENTRICITY',  satellite.eccentricity?.toFixed(6),         true],
    ['MEAN MOTION',   satellite.meanMotion?.toFixed(4) + ' REV/D',true],
  ];

  const altPct = Math.min((satellite.alt || 0) / 2000 * 100, 100);
  const velPct = Math.min((satellite.velocity || 0) / 30000 * 100, 100);

  return (
    <div className="detail-panel">
      <div className="detail-header">
        <h2 className="detail-name">{satellite.name}</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="op-badge" style={{ color: opStatus.color }}>
            {opStatus.label}
          </span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Status & Agency */}
      {metadata && (
        <div className="detail-section">
          <div className="detail-item full">
            <span className="detail-label">AGENCY</span>
            <span className="detail-value">{metadata.agency || 'Unknown'}</span>
          </div>
          <div className="detail-item full">
            <span className="detail-label">COUNTRY</span>
            <span className="detail-value">{metadata.country || 'Unknown'}</span>
          </div>
          {metadata.type && (
            <div className="detail-item full">
              <span className="detail-label">TYPE</span>
              <span className="detail-value">{metadata.type}</span>
            </div>
          )}
          {metadata.purpose && (
            <div className="detail-item full">
              <span className="detail-label">PURPOSE</span>
              <span className="detail-value">{metadata.purpose}</span>
            </div>
          )}
        </div>
      )}

      {/* Crew info for manned stations */}
      {metadata?.crewCapacity && (
        <div className="detail-section">
          <div className="detail-item">
            <span className="detail-label">CREW CAPACITY</span>
            <span className="detail-value accent">{metadata.crewCapacity} astronauts</span>
          </div>
          {metadata.currentCrew && (
            <div className="detail-item">
              <span className="detail-label">CURRENT CREW</span>
              <span className="detail-value accent">{metadata.currentCrew} aboard</span>
            </div>
          )}
          {metadata.resupplyCargo && (
            <div className="detail-item full">
              <span className="detail-label">RESUPPLY VEHICLES</span>
              <span className="detail-value" style={{ fontSize: '0.9em' }}>
                {metadata.resupplyCargo}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Dates */}
      {metadata?.launchDate && (
        <div className="detail-section">
          <div className="detail-item">
            <span className="detail-label">LAUNCH DATE</span>
            <span className="detail-value mono">{metadata.launchDate}</span>
          </div>
          {metadata.decommissionDate && (
            <div className="detail-item">
              <span className="detail-label">DECOMMISSION</span>
              <span className="detail-value mono">{metadata.decommissionDate}</span>
            </div>
          )}
        </div>
      )}

      {/* Mass & Dimensions */}
      {(metadata?.mass || metadata?.length) && (
        <div className="detail-section">
          {metadata.mass && (
            <div className="detail-item">
              <span className="detail-label">MASS</span>
              <span className="detail-value mono">
                {typeof metadata.mass === 'number' ? `${metadata.mass.toLocaleString()} kg` : metadata.mass}
              </span>
            </div>
          )}
          {metadata.length && (
            <div className="detail-item">
              <span className="detail-label">LENGTH</span>
              <span className="detail-value mono">{metadata.length.toFixed(1)} m</span>
            </div>
          )}
          {metadata.width && (
            <div className="detail-item">
              <span className="detail-label">WIDTH</span>
              <span className="detail-value mono">{metadata.width.toFixed(1)} m</span>
            </div>
          )}
          {metadata.mirrorDiameter && (
            <div className="detail-item">
              <span className="detail-label">MIRROR DIAMETER</span>
              <span className="detail-value mono">{metadata.mirrorDiameter.toFixed(1)} m</span>
            </div>
          )}
        </div>
      )}

      {/* Telemetry */}
      <div className="detail-section">
        <div className="detail-item full">
          <span className="detail-label">ALTITUDE</span>
          <span className="detail-value lg mono accent">{satellite.alt?.toFixed(2)} KM</span>
          <div className="data-bar"><div className="data-bar-fill" style={{ width: `${altPct}%` }} /></div>
        </div>
        <div className="detail-item full">
          <span className="detail-label">VELOCITY</span>
          <span className="detail-value lg mono accent">{satellite.velocity?.toFixed(2)} KM/H</span>
          <div className="data-bar"><div className="data-bar-fill" style={{ width: `${velPct}%` }} /></div>
        </div>
        <div className="detail-item full">
          <span className="detail-label">ORBITAL SLOT</span>
          <span className="detail-value mono">{orbitalSlot}</span>
        </div>
      </div>

      {/* Orbital mechanics grid */}
      <div className="detail-section">
        <div className="detail-grid">
          {orbitalRows.map(([label, value, isMono]) => (
            <div className="detail-item" key={label}>
              <span className="detail-label">{label}</span>
              <span className={`detail-value${isMono ? ' mono' : ''}`}>{value ?? '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {metadata?.url && (
        <a href={metadata.url} target="_blank" rel="noopener noreferrer" className="detail-link">
          📖 More Information
        </a>
      )}

      <button className="track-btn" onClick={onTrack}>TRACK SATELLITE</button>
    </div>
  );
}
