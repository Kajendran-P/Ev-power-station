import { useState, useMemo } from 'react';

export default function StationList({ stations = [], selectedStation, onSelect, loading }) {
  const [search, setSearch] = useState('');
  const [chargerFilter, setChargerFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [slotFilter, setSlotFilter] = useState('all');
  const [sortBy, setSortBy] = useState('nearest');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...stations];

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        (s.area && s.area.toLowerCase().includes(q))
      );
    }

    // Charger type filter
    if (chargerFilter !== 'all') {
      list = list.filter(s => {
        if (chargerFilter === 'fast') return s.type === 'fast-dc' || (s.chargerTypes && s.chargerTypes.includes('fast'));
        if (chargerFilter === 'normal') return s.type === 'normal-ac' || (s.chargerTypes && s.chargerTypes.includes('normal'));
        if (chargerFilter === 'bike') return s.type === 'bike';
        return true;
      });
    }

    // Price filter
    if (priceFilter === 'low') list = list.filter(s => s.pricePerKwh < 12);
    else if (priceFilter === 'mid') list = list.filter(s => s.pricePerKwh >= 12 && s.pricePerKwh <= 18);
    else if (priceFilter === 'high') list = list.filter(s => s.pricePerKwh > 18);

    // Slot availability filter
    if (slotFilter === 'available') list = list.filter(s => s.availableSlots > 0);
    else if (slotFilter === 'many') list = list.filter(s => s.availableSlots >= 3);

    // Sort
    if (sortBy === 'nearest') list.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    else if (sortBy === 'cheapest') list.sort((a, b) => a.pricePerKwh - b.pricePerKwh);
    else if (sortBy === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    return list;
  }, [stations, search, chargerFilter, priceFilter, slotFilter, sortBy]);

  return (
    <div className="slist-panel">
      {/* Search */}
      <div className="slist-search">
        <div className="search-wrap" style={{ maxWidth: '100%' }}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            className="inp"
            placeholder="Search stations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          className={'btn-icon slist-filter-toggle' + (showFilters ? ' active' : '')}
          onClick={() => setShowFilters(!showFilters)}
          title="Toggle Filters"
        >
          <i className="fa-solid fa-sliders"></i>
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="slist-filters">
          <div className="slist-filter-group">
            <label className="slist-filter-label">Charger Type</label>
            <div className="slist-chips">
              {[['all', 'All'], ['fast', 'Fast DC'], ['normal', 'Normal AC'], ['bike', 'Bike']].map(([k, l]) => (
                <button key={k} className={'pill' + (chargerFilter === k ? ' act' : '')} onClick={() => setChargerFilter(k)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="slist-filter-group">
            <label className="slist-filter-label">Price Range</label>
            <div className="slist-chips">
              {[['all', 'All'], ['low', '< ₹12'], ['mid', '₹12–18'], ['high', '₹18+']].map(([k, l]) => (
                <button key={k} className={'pill' + (priceFilter === k ? ' act' : '')} onClick={() => setPriceFilter(k)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="slist-filter-group">
            <label className="slist-filter-label">Availability</label>
            <div className="slist-chips">
              {[['all', 'All'], ['available', 'Has Slots'], ['many', '3+ Slots']].map(([k, l]) => (
                <button key={k} className={'pill' + (slotFilter === k ? ' act' : '')} onClick={() => setSlotFilter(k)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="slist-filter-group">
            <label className="slist-filter-label">Sort By</label>
            <div className="slist-chips">
              {[['nearest', 'Nearest'], ['cheapest', 'Cheapest'], ['rating', 'Top Rated']].map(([k, l]) => (
                <button key={k} className={'pill' + (sortBy === k ? ' act' : '')} onClick={() => setSortBy(k)}>{l}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="slist-count">
        <span>{filtered.length} station{filtered.length !== 1 ? 's' : ''} found</span>
      </div>

      {/* Station cards */}
      <div className="slist-items">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="slist-item skeleton">
              <div className="skel-line w60"></div>
              <div className="skel-line w40"></div>
              <div className="skel-line w80"></div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="slist-empty">
            <i className="fa-solid fa-charging-station"></i>
            <p>No stations match your filters</p>
          </div>
        ) : (
          filtered.map(s => {
            const isSelected = selectedStation?.stationId === s.stationId;
            const statusCls = s.status === 'available' ? 'badge-ok' : s.status === 'limited' ? 'badge-warn' : 'badge-err';
            const ic = s.type === 'bike' ? 'fa-motorcycle' : s.type === 'fast-dc' ? 'fa-bolt' : 'fa-plug';
            const typeColor = s.type === 'fast-dc' ? 'var(--accent)' : s.type === 'normal-ac' ? 'var(--cyan)' : 'var(--purple)';

            return (
              <div
                key={s.stationId || s._id}
                className={'slist-item' + (isSelected ? ' selected' : '')}
                onClick={() => onSelect(s)}
              >
                <div className="slist-item-top">
                  <div className="slist-item-icon" style={{ borderColor: typeColor }}>
                    <i className={`fa-solid ${ic}`} style={{ color: typeColor }}></i>
                  </div>
                  <div className="slist-item-info">
                    <h4 className="slist-item-name">{s.name}</h4>
                    <p className="slist-item-loc">
                      <i className="fa-solid fa-location-dot"></i>
                      {s.location}
                    </p>
                  </div>
                  <span className={`badge ${statusCls}`}>
                    <span className="badge-dot"></span>
                    {s.status}
                  </span>
                </div>

                <div className="slist-item-specs">
                  <div className="slist-spec">
                    <i className="fa-solid fa-bolt"></i>
                    <span>{s.power}kW</span>
                  </div>
                  <div className="slist-spec">
                    <i className="fa-solid fa-plug"></i>
                    <span>{s.availableSlots}/{s.totalSlots}</span>
                  </div>
                  <div className="slist-spec">
                    <i className="fa-solid fa-route"></i>
                    <span>{s.distance || '–'}km</span>
                  </div>
                  <div className="slist-spec">
                    <i className="fa-solid fa-star" style={{ color: 'var(--warn)' }}></i>
                    <span>{s.rating}</span>
                  </div>
                </div>

                <div className="slist-item-foot">
                  <span className="slist-price">₹{s.pricePerKwh}<small>/kWh</small></span>
                  <button
                    className={isSelected ? "btn-p btn-sm" : "btn-s btn-sm"}
                    onClick={(e) => { e.stopPropagation(); onSelect(s); }}
                  >
                    {isSelected ? '✓ Selected' : 'Select'}
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
