import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

const CONNECTOR_MAP = {
  bike: 'GB/T',
  car: 'CCS2 / Type2',
  auto: 'GB/T',
  commercial: 'CCS2'
};

export default function WizardStep3Details({ selectedStation, vehicleType, onSubmit, onBack }) {
  const { user } = useAuth();

  // Vehicle details
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [numberPlate, setNumberPlate] = useState('');
  const [currentBattery, setCurrentBattery] = useState(20);
  const [targetBattery, setTargetBattery] = useState(80);
  const [phone, setPhone] = useState('');

  // Booking details
  const [chargerType, setChargerType] = useState('normal');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(60);
  const [errors, setErrors] = useState({});

  // Pre-fill from profile
  useEffect(() => {
    if (user) {
      setPhone(user.phone || '');
    }
  }, [user]);

  // Set default date and time
  useEffect(() => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    setDate(`${yyyy}-${mm}-${dd}`);
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(Math.ceil(now.getMinutes() / 15) * 15 % 60).padStart(2, '0');
    setTime(`${hh}:${mi}`);
  }, []);

  // Generate slot options
  const slotOptions = useMemo(() => {
    if (!selectedStation) return [];
    return Array.from({ length: selectedStation.totalSlots }, (_, i) => ({
      label: `Slot ${i + 1}`,
      available: i < selectedStation.availableSlots,
      status: i < selectedStation.availableSlots
        ? (i < Math.floor(selectedStation.availableSlots * 0.3) ? 'limited' : 'available')
        : 'full'
    }));
  }, [selectedStation]);

  // Auto-select first available slot
  useEffect(() => {
    if (slotOptions.length > 0 && !selectedSlot) {
      const first = slotOptions.find(s => s.available);
      if (first) setSelectedSlot(first.label);
    }
  }, [slotOptions, selectedSlot]);

  const connectorType = CONNECTOR_MAP[vehicleType] || 'CCS2';

  const validate = () => {
    const errs = {};
    if (!vehicleBrand.trim()) errs.vehicleBrand = 'Required';
    if (!vehicleModel.trim()) errs.vehicleModel = 'Required';
    if (!numberPlate.trim()) errs.numberPlate = 'Required';
    if (!phone.trim()) errs.phone = 'Required';
    if (!selectedSlot) errs.slot = 'Select a slot';
    if (!date) errs.date = 'Select a date';
    if (!time) errs.time = 'Select a time';
    if (currentBattery >= targetBattery) errs.battery = 'Target must be higher than current';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = () => {
    if (!validate()) return;
    onSubmit({
      vehicleBrand,
      vehicleModel,
      vehicleNumberPlate: numberPlate,
      currentBatteryPercent: currentBattery,
      targetBatteryPercent: targetBattery,
      phone,
      connectorType,
      chargerType,
      slot: selectedSlot,
      date,
      time,
      duration
    });
  };

  return (
    <div className="wz-step wz-step3">
      <div className="wz-step-header">
        <div className="wz-step-badge">Step 3</div>
        <h2 className="wz-step-title">Vehicle Details & Slot</h2>
        <p className="wz-step-subtitle">Enter your vehicle information and select a charging slot</p>
      </div>

      {/* Selected Station Mini */}
      {selectedStation && (
        <div className="wz-selected-station-mini">
          <div className="wz-mini-icon"><i className="fa-solid fa-charging-station"></i></div>
          <div className="wz-mini-info">
            <span className="wz-mini-name">{selectedStation.name}</span>
            <span className="wz-mini-loc">{selectedStation.location}</span>
          </div>
          <span className="wz-mini-price">₹{selectedStation.pricePerKwh}/kWh</span>
        </div>
      )}

      <div className="wz-form-sections">
        {/* Vehicle Details Section */}
        <div className="wz-form-section">
          <h3 className="wz-form-section-title">
            <i className="fa-solid fa-car"></i>
            Vehicle Information
          </h3>
          <div className="wz-form-grid">
            <div className="wz-form-field">
              <label>Vehicle Brand</label>
              <input className="inp" placeholder="e.g. Tata, MG, Ather" value={vehicleBrand} onChange={e => setVehicleBrand(e.target.value)} />
              {errors.vehicleBrand && <span className="field-error">{errors.vehicleBrand}</span>}
            </div>
            <div className="wz-form-field">
              <label>Vehicle Model</label>
              <input className="inp" placeholder="e.g. Nexon EV, ZS EV" value={vehicleModel} onChange={e => setVehicleModel(e.target.value)} />
              {errors.vehicleModel && <span className="field-error">{errors.vehicleModel}</span>}
            </div>
            <div className="wz-form-field">
              <label>Number Plate</label>
              <input className="inp" placeholder="e.g. TN 01 AB 1234" value={numberPlate} onChange={e => setNumberPlate(e.target.value)} />
              {errors.numberPlate && <span className="field-error">{errors.numberPlate}</span>}
            </div>
            <div className="wz-form-field">
              <label>Phone Number</label>
              <input className="inp" placeholder="+91 XXXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
          </div>

          {/* Battery Level */}
          <div className="wz-battery-section">
            <div className="wz-battery-field">
              <label>Current Battery</label>
              <div className="wz-battery-slider">
                <input type="range" min="0" max="100" value={currentBattery} onChange={e => setCurrentBattery(Number(e.target.value))} className="wz-range" />
                <span className="wz-battery-val" style={{ color: currentBattery < 20 ? 'var(--err)' : currentBattery < 50 ? 'var(--warn)' : 'var(--ok)' }}>{currentBattery}%</span>
              </div>
              <div className="wz-battery-bar">
                <div className="wz-battery-bar-fill" style={{
                  width: `${currentBattery}%`,
                  background: currentBattery < 20 ? 'var(--err)' : currentBattery < 50 ? 'var(--warn)' : 'var(--ok)'
                }}></div>
              </div>
            </div>
            <div className="wz-battery-arrow">
              <i className="fa-solid fa-arrow-right"></i>
            </div>
            <div className="wz-battery-field">
              <label>Target Battery</label>
              <div className="wz-battery-slider">
                <input type="range" min="0" max="100" value={targetBattery} onChange={e => setTargetBattery(Number(e.target.value))} className="wz-range" />
                <span className="wz-battery-val" style={{ color: 'var(--ok)' }}>{targetBattery}%</span>
              </div>
              <div className="wz-battery-bar">
                <div className="wz-battery-bar-fill" style={{ width: `${targetBattery}%`, background: 'var(--ok)' }}></div>
              </div>
            </div>
          </div>
          {errors.battery && <span className="field-error" style={{ textAlign: 'center', display: 'block' }}>{errors.battery}</span>}

          {/* Connector Type (auto-detected) */}
          <div className="wz-connector-info">
            <i className="fa-solid fa-plug-circle-bolt"></i>
            <span>Connector Type: <strong>{connectorType}</strong></span>
          </div>
        </div>

        {/* Booking Details Section */}
        <div className="wz-form-section">
          <h3 className="wz-form-section-title">
            <i className="fa-solid fa-calendar-check"></i>
            Booking Details
          </h3>

          {/* Charger Type */}
          <div className="wz-charger-toggle">
            <button
              className={'wz-charger-opt' + (chargerType === 'normal' ? ' selected' : '')}
              onClick={() => setChargerType('normal')}
            >
              <div className="wz-charger-opt-icon"><i className="fa-solid fa-plug"></i></div>
              <div>
                <span className="wz-charger-label">Normal AC</span>
                <span className="wz-charger-sub">Standard charging · ₹{selectedStation?.pricePerKwh}/kWh</span>
              </div>
            </button>
            <button
              className={'wz-charger-opt' + (chargerType === 'fast' ? ' selected' : '')}
              onClick={() => setChargerType('fast')}
            >
              <div className="wz-charger-opt-icon fast"><i className="fa-solid fa-bolt"></i></div>
              <div>
                <span className="wz-charger-label">Fast DC</span>
                <span className="wz-charger-sub">Rapid charging · ₹{((selectedStation?.pricePerKwh || 0) * 1.5).toFixed(1)}/kWh</span>
              </div>
            </button>
          </div>

          {/* Slot Selection Grid */}
          <div className="wz-slot-section">
            <label>Select Charging Slot</label>
            <div className="wz-slot-grid">
              {slotOptions.map(s => (
                <button
                  key={s.label}
                  className={`wz-slot-item ${s.status}${selectedSlot === s.label ? ' selected' : ''}`}
                  disabled={!s.available}
                  onClick={() => setSelectedSlot(s.label)}
                >
                  <i className={`fa-solid ${s.available ? 'fa-plug-circle-check' : 'fa-plug-circle-xmark'}`}></i>
                  <span>{s.label}</span>
                  <span className="wz-slot-status">{s.available ? (s.status === 'limited' ? 'Limited' : 'Open') : 'Busy'}</span>
                </button>
              ))}
            </div>
            {errors.slot && <span className="field-error">{errors.slot}</span>}
            <div className="wz-slot-legend">
              <span><span className="wz-slot-dot available"></span>Available</span>
              <span><span className="wz-slot-dot limited"></span>Limited</span>
              <span><span className="wz-slot-dot full"></span>Occupied</span>
            </div>
          </div>

          {/* Date & Time */}
          <div className="wz-datetime-grid">
            <div className="wz-form-field">
              <label>Date</label>
              <input type="date" className="inp" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
              {errors.date && <span className="field-error">{errors.date}</span>}
            </div>
            <div className="wz-form-field">
              <label>Time</label>
              <input type="time" className="inp" value={time} onChange={e => setTime(e.target.value)} />
              {errors.time && <span className="field-error">{errors.time}</span>}
            </div>
          </div>

          {/* Duration */}
          <div className="wz-form-field">
            <label>Charging Duration</label>
            <div className="wz-duration-grid">
              {[[30, '30 min'], [60, '1 hour'], [90, '1.5 hrs'], [120, '2 hours'], [180, '3 hours']].map(([m, lbl]) => (
                <button
                  key={m}
                  className={'wz-duration-opt' + (duration === m ? ' selected' : '')}
                  onClick={() => setDuration(m)}
                >
                  <span className="wz-dur-val">{lbl.split(' ')[0]}</span>
                  <span className="wz-dur-unit">{lbl.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="wz-step-actions">
        <button className="btn-s" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
          Back
        </button>
        <button className="btn-p" onClick={handleContinue}>
          Continue to Payment
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
