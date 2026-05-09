const VEHICLE_TYPES = [
  {
    key: 'bike',
    label: 'EV Bike',
    icon: 'fa-motorcycle',
    battery: '1.5 – 4 kWh',
    connector: 'GB/T',
    chargeTime: '2 – 4 hrs',
    desc: '2-Wheeler Electric Scooter / Bike',
    color: 'var(--purple)'
  },
  {
    key: 'car',
    label: 'EV Car',
    icon: 'fa-car',
    battery: '30 – 80 kWh',
    connector: 'CCS2 / Type2',
    chargeTime: '30 min – 8 hrs',
    desc: '4-Wheeler Electric Sedan / SUV',
    color: 'var(--accent)'
  },
  {
    key: 'auto',
    label: 'EV Auto',
    icon: 'fa-van-shuttle',
    battery: '5 – 15 kWh',
    connector: 'GB/T',
    chargeTime: '1 – 3 hrs',
    desc: '3-Wheeler Electric Rickshaw',
    color: 'var(--cyan)'
  },
  {
    key: 'commercial',
    label: 'Commercial EV',
    icon: 'fa-truck',
    battery: '100 – 300 kWh',
    connector: 'CCS2',
    chargeTime: '1 – 5 hrs',
    desc: 'Electric Bus / Truck / Van',
    color: 'var(--warn)'
  }
];

export default function WizardStep2Vehicle({ selectedStation, onSelect, onBack }) {
  return (
    <div className="wz-step wz-step2">
      <div className="wz-step-header">
        <div className="wz-step-badge">Step 2</div>
        <h2 className="wz-step-title">Select Vehicle Type</h2>
        <p className="wz-step-subtitle">Choose your EV category for optimized charging</p>
      </div>

      {/* Selected Station Mini Card */}
      {selectedStation && (
        <div className="wz-selected-station-mini">
          <div className="wz-mini-icon">
            <i className="fa-solid fa-charging-station"></i>
          </div>
          <div className="wz-mini-info">
            <span className="wz-mini-name">{selectedStation.name}</span>
            <span className="wz-mini-loc">{selectedStation.location}</span>
          </div>
          <span className="wz-mini-price">₹{selectedStation.pricePerKwh}/kWh</span>
        </div>
      )}

      {/* Vehicle Type Cards */}
      <div className="wz-vehicle-grid">
        {VEHICLE_TYPES.map(v => (
          <div
            key={v.key}
            className="wz-vehicle-card"
            onClick={() => onSelect(v.key)}
          >
            <div className="wz-vehicle-card-glow" style={{ background: v.color }}></div>
            <div className="wz-vehicle-icon" style={{ borderColor: v.color }}>
              <i className={`fa-solid ${v.icon}`} style={{ color: v.color }}></i>
            </div>
            <h3 className="wz-vehicle-name">{v.label}</h3>
            <p className="wz-vehicle-desc">{v.desc}</p>

            <div className="wz-vehicle-specs">
              <div className="wz-vspec">
                <i className="fa-solid fa-battery-three-quarters"></i>
                <div>
                  <span className="wz-vspec-label">Battery</span>
                  <span className="wz-vspec-val">{v.battery}</span>
                </div>
              </div>
              <div className="wz-vspec">
                <i className="fa-solid fa-plug-circle-bolt"></i>
                <div>
                  <span className="wz-vspec-label">Connector</span>
                  <span className="wz-vspec-val">{v.connector}</span>
                </div>
              </div>
              <div className="wz-vspec">
                <i className="fa-solid fa-clock"></i>
                <div>
                  <span className="wz-vspec-label">Est. Time</span>
                  <span className="wz-vspec-val">{v.chargeTime}</span>
                </div>
              </div>
            </div>

            <button className="btn-p wz-vehicle-select-btn">
              <i className="fa-solid fa-arrow-right"></i>
              Select {v.label}
            </button>
          </div>
        ))}
      </div>

      <div className="wz-step-actions">
        <button className="btn-s" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
          Back to Stations
        </button>
      </div>
    </div>
  );
}
