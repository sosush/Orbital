/**
 * Feature toggle panel — floating control to enable/disable visualization layers.
 */
export default function FeatureToggles({ features, onToggle, debrisLoading, launchLoading }) {
  const toggles = [
    { key: 'terminator', label: 'DAY/NIGHT', icon: '☀', description: 'Solar terminator' },
    { key: 'footprint', label: 'FOOTPRINT', icon: '◎', description: 'Visibility cone' },
    { key: 'debris', label: 'DEBRIS', icon: '⚠', description: 'Space junk', loading: debrisLoading },
    { key: 'constellations', label: 'CONSTELLATIONS', icon: '✦', description: 'Group view' },
    { key: 'islLinks', label: 'SAT LINKS', icon: '⚡', description: 'Inter-sat links' },
    { key: 'launches', label: 'LAUNCHES', icon: '🚀', description: 'Live launches', loading: launchLoading },
    { key: 'heatmap', label: 'HEATMAP', icon: '🌡', description: 'Density map' },
    { key: 'all3dModels', label: 'ALL 3D', icon: '◈', description: 'All satellites as 3D models' },
  ];

  return (
    <div className="feature-toggles">
      <div className="feature-toggles-header">
        <span className="feature-toggles-title">LAYERS</span>
      </div>
      <div className="feature-toggles-list">
        {toggles.map(t => (
          <button
            key={t.key}
            className={`feature-toggle-btn${features[t.key] ? ' active' : ''}`}
            onClick={() => onToggle(t.key)}
            title={t.description}
          >
            <span className="feature-toggle-icon">{t.icon}</span>
            <span className="feature-toggle-label">{t.label}</span>
            {t.loading && <span className="feature-toggle-spinner" />}
          </button>
        ))}
      </div>
    </div>
  );
}
