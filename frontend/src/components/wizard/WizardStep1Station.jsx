import { useState, useMemo } from 'react';

export default function WizardStep1Station({ stations, loading, onSelect }) {
  const [search, setSearch] = useState('');
  const [chargerFilter, setChargerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nearest');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...stations];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        (s.area && s.area.toLowerCase().includes(q))
      );
    }
    if (chargerFilter !== 'all') {
      list = list.filter(s => {
        if (chargerFilter === 'fast') return s.type === 'fast-dc' || (s.chargerTypes && s.chargerTypes.includes('fast'));
        if (chargerFilter === 'normal') return s.type === 'normal-ac' || (s.chargerTypes && s.chargerTypes.includes('normal'));
        return true;
      });
    }
    if (sortBy === 'nearest') list.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    else if (sortBy === 'cheapest') list.sort((a, b) => a.pricePerKwh - b.pricePerKwh);
    else if (sortBy === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return list;
  }, [stations, search, chargerFilter, sortBy]);

  return (
    <div className="wz-step wz-step1">
      <div className="wz-step-header">
        <div className="wz-step-badge">Step 1</div>
        <h2 className="wz-step-title">Select Charging Station</h2>
        <p className="wz-step-subtitle">Choose a nearby station to power up your EV</p>
      </div>

      {/* Search & Filter */}
      <div className="wz-search-bar">
        <div className="wz-search-wrap">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            className="inp"
            placeholder="Search stations by name or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className={'btn-icon wz-filter-btn' + (showFilters ? ' active' : '')}
          onClick={() => setShowFilters(!showFilters)}
        >
          <i className="fa-solid fa-sliders"></i>
        </button>
      </div>

      {showFilters && (
        <div className="wz-filters">
          <div className="wz-filter-row">
            <span className="wz-filter-label">Type</span>
            <div className="wz-filter-chips">
              {[['all', 'All'], ['fast', 'Fast DC'], ['normal', 'Normal AC']].map(([k, l]) => (
                <button key={k} className={'pill' + (chargerFilter === k ? ' act' : '')} onClick={() => setChargerFilter(k)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="wz-filter-row">
            <span className="wz-filter-label">Sort</span>
            <div className="wz-filter-chips">
              {[['nearest', 'Nearest'], ['cheapest', 'Cheapest'], ['rating', 'Top Rated']].map(([k, l]) => (
                <button key={k} className={'pill' + (sortBy === k ? ' act' : '')} onClick={() => setSortBy(k)}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="wz-station-count">
        <i className="fa-solid fa-charging-station"></i>
        <span>{filtered.length} station{filtered.length !== 1 ? 's' : ''} available</span>
      </div>

      {/* Station Cards */}
      <div className="wz-station-list">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="wz-station-card skeleton">
              <div className="skel-line w60"></div>
              <div className="skel-line w40"></div>
              <div className="skel-line w80"></div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="wz-empty">
            <i className="fa-solid fa-charging-station"></i>
            <p>No stations match your search</p>
          </div>
        ) : (
          filtered.map(s => {
            const statusCls = s.status === 'available' ? 'badge-ok' : s.status === 'limited' ? 'badge-warn' : 'badge-err';
            const statusDot = s.status === 'available' ? 'avail' : s.status === 'limited' ? 'limited' : 'full';
            return (
              <div key={s.stationId || s._id} className="wz-station-card">
                <div className="wz-station-card-top">
                  <div className="wz-station-icon">
                    <i className="fa-solid fa-bolt"></i>
                    <span className={`wz-avail-dot ${statusDot}`}></span>
                  </div>
                  <div className="wz-station-info">
                    <h4>{s.name}</h4>
                    <p className="wz-station-loc">
                      <i className="fa-solid fa-location-dot"></i>
                      {s.location}
                    </p>
                  </div>
                  <span className={`badge ${statusCls}`}>
                    <span className="badge-dot"></span>
                    {s.status}
                  </span>
                </div>

                <div className="wz-station-specs">
                  <div className="wz-spec">
                    <i className="fa-solid fa-bolt"></i>
                    <span>{s.power}kW</span>
                  </div>
                  <div className="wz-spec">
                    <i className="fa-solid fa-plug"></i>
                    <span>{s.availableSlots}/{s.totalSlots} Slots</span>
                  </div>
                  <div className="wz-spec">
                    <i className="fa-solid fa-star" style={{ color: 'var(--warn)' }}></i>
                    <span>{s.rating}</span>
                  </div>
                  <div className="wz-spec">
                    <i className="fa-solid fa-clock"></i>
                    <span style={{ fontSize: '10px' }}>{s.workingHours || '6AM-11PM'}</span>
                  </div>
                </div>

                <div className="wz-station-foot">
                  <div className="wz-station-price">
                    <span className="wz-price-val">₹{s.pricePerKwh}</span>
                    <span className="wz-price-unit">/kWh</span>
                  </div>
                  <button
                    className="btn-p btn-sm wz-select-btn"
                    onClick={() => onSelect(s)}
                    disabled={s.availableSlots <= 0}
                  >
                    <i className="fa-solid fa-bolt"></i>
                    {s.availableSlots <= 0 ? 'Full' : 'Select Station'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
