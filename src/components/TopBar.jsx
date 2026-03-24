import { useState, useEffect } from 'react';

export default function TopBar({ satelliteCount, isConnected }) {
  const [uptime, setUptime] = useState('00:00:00');
  const [utc, setUtc] = useState('');

  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const d = Date.now() - start;
      const h = String(Math.floor(d / 3600000)).padStart(2, '0');
      const m = String(Math.floor((d % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((d % 60000) / 1000)).padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
      setUtc(new Date().toISOString().slice(11, 19) + ' UTC');
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        <h1 className="brand">ORBITAL</h1>
        <span className="brand-sub">TRACKER</span>
      </div>
      <div className="top-bar-right">
        <div className="stat">
          <span className="stat-label">T+</span>
          <span className="stat-value mono">{uptime}</span>
        </div>
        <div className="stat">
          <span className="stat-label">UTC</span>
          <span className="stat-value mono">{utc}</span>
        </div>
        <div className="stat">
          <span className="stat-label">SATS</span>
          <span className="stat-value mono">{satelliteCount}</span>
        </div>
        <div className="uplink-status">
          <span className="status-dot" data-active={String(isConnected)} />
          <span>{isConnected ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>
    </header>
  );
}
