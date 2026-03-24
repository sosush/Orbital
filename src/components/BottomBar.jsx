export default function BottomBar({ selectedSatellite, onRecenter }) {
  return (
    <footer className="bottom-bar">
      <div className="bottom-left">
        <span className="bottom-label">TARGET</span>
        <span className="bottom-value">{selectedSatellite?.name || '—'}</span>
      </div>
      <div className="bottom-right">
        {selectedSatellite && (
          <>
            <span className="bottom-stat mono">{selectedSatellite.alt?.toFixed(0)} KM</span>
            <span className="bottom-divider">|</span>
            <span className="bottom-stat mono">{selectedSatellite.velocity?.toFixed(0)} KM/H</span>
          </>
        )}
        <button className="recenter-btn" onClick={onRecenter}>RECENTER</button>
      </div>
    </footer>
  );
}
