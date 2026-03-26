/**
 * Live Launch Panel — displays upcoming and recent launches.
 */
import { useState, useEffect } from 'react';
import { getCountdown } from '../services/launchService';

export default function LaunchPanel({ launchData, loading, onClose, onFlyTo }) {
  const [countdowns, setCountdowns] = useState({});

  // Update countdowns every second
  useEffect(() => {
    if (!launchData.upcoming?.length) return;
    const tick = () => {
      const cd = {};
      for (const launch of launchData.upcoming) {
        cd[launch.id] = getCountdown(launch.net);
      }
      setCountdowns(cd);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [launchData.upcoming]);

  return (
    <div className="launch-panel glass-panel">
      <div className="launch-panel-header">
        <span className="launch-panel-title">
          <span className="launch-icon">🚀</span> LIVE LAUNCHES
        </span>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      {loading && (
        <div className="launch-loading">
          <span className="feature-toggle-spinner" />
          <span>FETCHING LAUNCH DATA...</span>
        </div>
      )}

      {launchData.upcoming?.length > 0 && (
        <div className="launch-section">
          <span className="launch-section-title">UPCOMING</span>
          {launchData.upcoming.map(launch => (
            <div
              key={launch.id}
              className="launch-item"
              onClick={() => launch.padLat && onFlyTo?.(launch.padLat, launch.padLng)}
            >
              <div className="launch-item-top">
                <span className="launch-countdown mono accent">
                  {countdowns[launch.id] || '...'}
                </span>
                <span className={`launch-status ${launch.status?.toLowerCase()}`}>
                  {launch.status}
                </span>
              </div>
              <div className="launch-name">{launch.name}</div>
              <div className="launch-meta">
                <span>{launch.provider}</span>
                <span className="launch-divider">•</span>
                <span>{launch.padLocation}</span>
              </div>
              {launch.orbit && (
                <div className="launch-orbit mono">{launch.orbit}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {launchData.recent?.length > 0 && (
        <div className="launch-section">
          <span className="launch-section-title">RECENT</span>
          {launchData.recent.map(launch => (
            <div key={launch.id} className="launch-item past">
              <div className="launch-item-top">
                <span className={`launch-result ${launch.success ? 'success' : 'fail'}`}>
                  {launch.success ? '✓ SUCCESS' : '✗ FAILED'}
                </span>
              </div>
              <div className="launch-name">{launch.name}</div>
              <div className="launch-meta">
                <span>{launch.provider}</span>
                <span className="launch-divider">•</span>
                <span>{new Date(launch.net).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && launchData.upcoming?.length === 0 && launchData.recent?.length === 0 && (
        <div className="launch-empty">NO LAUNCH DATA AVAILABLE</div>
      )}
    </div>
  );
}
