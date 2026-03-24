export default function SatelliteDetail({ satellite, onClose, onTrack }) {
  if (!satellite) return null;

  const rows = [
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
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {/* Big telemetry */}
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

      {/* Data grid */}
      <div className="detail-grid">
        {rows.map(([label, value, isMono]) => (
          <div className="detail-item" key={label}>
            <span className="detail-label">{label}</span>
            <span className={`detail-value${isMono ? ' mono' : ''}`}>{value ?? '—'}</span>
          </div>
        ))}
      </div>

      <button className="track-btn" onClick={onTrack}>TRACK SATELLITE</button>
    </div>
  );
}
