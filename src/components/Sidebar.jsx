export default function Sidebar({
  satellites,
  categories,
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  selectedSatellite,
  onSelectSatellite,
  totalCount,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">SATELLITES</span>
        <span className="satellite-count">{totalCount}</span>
      </div>

      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="SEARCH NAME OR NORAD ID..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <div className="categories">
        {categories.map(cat => (
          <button
            key={cat.id}
            className={`category-btn${activeCategory === cat.id ? ' active' : ''}`}
            onClick={() => onCategoryChange(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="satellite-list">
        {satellites.map(sat => (
          <button
            key={sat.id}
            className={`satellite-item${selectedSatellite?.id === sat.id ? ' selected' : ''}`}
            onClick={() => onSelectSatellite(sat)}
          >
            <span className="sat-name">{sat.name}</span>
            <span className="sat-alt mono">{sat.alt?.toFixed(0)} KM</span>
          </button>
        ))}
        {satellites.length === 0 && (
          <div style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: '.75rem', letterSpacing: '.1em' }}>
            NO SATELLITES FOUND
          </div>
        )}
      </div>
    </aside>
  );
}
