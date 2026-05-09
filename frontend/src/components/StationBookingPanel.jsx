import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export default function StationBookingPanel({ station, onBookingSuccess }) {
  const { user } = useAuth();

  const [vehicleType, setVehicleType] = useState('car');
  const [slot, setSlot] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [chargerType, setChargerType] = useState('normal');
  const [duration, setDuration] = useState(60);
  const [userName, setUserName] = useState('');
  const [userMobile, setUserMobile] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill user details from auth
  useEffect(() => {
    if (user) {
      setUserName(user.name || '');
      setUserMobile(user.phone || '');
      setUserEmail(user.email || '');
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

  // Set default slot when station changes
  useEffect(() => {
    if (station && station.availableSlots > 0) {
      setSlot('Slot 1');
    }
  }, [station]);

  // Generate available slot options
  const slotOptions = useMemo(() => {
    if (!station) return [];
    return Array.from({ length: station.totalSlots }, (_, i) => ({
      label: `Slot ${i + 1}`,
      available: i < station.availableSlots
    }));
  }, [station]);

  // Price calculation
  const pricing = useMemo(() => {
    if (!station || !duration) return null;
    const hrs = duration / 60;
    const energy = parseFloat((station.power * hrs).toFixed(1));
    const multiplier = chargerType === 'fast' ? 1.5 : 1.0;
    const base = energy * station.pricePerKwh * multiplier;
    const gst = base * 0.18;
    const total = base + gst;
    return {
      energy,
      base: base.toFixed(2),
      gst: gst.toFixed(2),
      total: total.toFixed(2),
      baseNum: base,
      gstNum: gst,
      totalNum: total,
      energyNum: energy
    };
  }, [station, duration, chargerType]);

  const validate = () => {
    const errs = {};
    if (!station) errs.station = 'Please select a station';
    if (!date) errs.date = 'Select a date';
    if (!time) errs.time = 'Select a time';
    if (!slot) errs.slot = 'Select a slot';
    if (!userName.trim()) errs.userName = 'Enter your name';
    if (!userMobile.trim()) errs.userMobile = 'Enter your mobile';
    if (!userEmail.trim()) errs.userEmail = 'Enter your email';
    if (station && station.availableSlots <= 0) errs.station = 'No slots available';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      const { createBooking } = await import('../services/bookingService');
      const res = await createBooking({
        stationId: station.stationId,
        stationName: station.name,
        vehicleType,
        slot,
        date,
        time,
        duration,
        chargerType,
        energy: pricing.energyNum,
        basePrice: pricing.baseNum,
        gst: pricing.gstNum,
        totalAmount: pricing.totalNum,
        userName,
        userMobile,
        userEmail,
        paymentMethod
      });

      setSubmitting(false);
      if (onBookingSuccess) {
        onBookingSuccess(res.data.booking, station);
      }
    } catch (err) {
      setSubmitting(false);
      setErrors({ submit: err.response?.data?.message || 'Booking failed. Please try again.' });
    }
  };

  if (!station) {
    return (
      <div className="bpanel-empty">
        <div className="bpanel-empty-icon">
          <i className="fa-solid fa-hand-pointer"></i>
        </div>
        <h3>Select a Station</h3>
        <p>Click on any station from the list or map to start booking</p>
      </div>
    );
  }

  const isFull = station.availableSlots <= 0;

  return (
    <div className="bpanel">
      {/* Station Header */}
      <div className="bpanel-station-header">
        <div className="bpanel-station-title">
          <h3>{station.name}</h3>
          <span className={`badge ${station.status === 'available' ? 'badge-ok' : station.status === 'limited' ? 'badge-warn' : 'badge-err'}`}>
            <span className="badge-dot"></span>
            {station.status}
          </span>
        </div>
        <p className="bpanel-station-addr">
          <i className="fa-solid fa-location-dot"></i>
          {station.address || station.location}
        </p>
      </div>

      {/* Station Info Pills */}
      <div className="bpanel-info-grid">
        <div className="bpanel-info-item">
          <i className="fa-solid fa-plug-circle-check"></i>
          <div>
            <span className="bpanel-info-val">{station.availableSlots}/{station.totalSlots}</span>
            <span className="bpanel-info-label">Slots</span>
          </div>
        </div>
        <div className="bpanel-info-item">
          <i className="fa-solid fa-star" style={{ color: 'var(--warn)' }}></i>
          <div>
            <span className="bpanel-info-val">{station.rating}</span>
            <span className="bpanel-info-label">Rating</span>
          </div>
        </div>
        <div className="bpanel-info-item">
          <i className="fa-solid fa-clock"></i>
          <div>
            <span className="bpanel-info-val" style={{ fontSize: '11px' }}>{station.workingHours || '6AM-11PM'}</span>
            <span className="bpanel-info-label">Hours</span>
          </div>
        </div>
        <div className="bpanel-info-item">
          <i className="fa-solid fa-bolt"></i>
          <div>
            <span className="bpanel-info-val">{station.power}kW</span>
            <span className="bpanel-info-label">Power</span>
          </div>
        </div>
      </div>

      {isFull && (
        <div className="bpanel-full-alert">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>All slots are currently occupied. Please try another station.</span>
        </div>
      )}

      {/* Booking Form */}
      <div className={'bpanel-form' + (isFull ? ' disabled' : '')}>
        <h4 className="bpanel-section-title">
          <i className="fa-solid fa-calendar-check"></i>
          Book Charging Slot
        </h4>

        {/* Vehicle Type */}
        <div className="bpanel-field">
          <label>Vehicle Type</label>
          <div className="bpanel-vehicle-grid">
            {[
              ['bike', 'fa-motorcycle', 'Bike'],
              ['car', 'fa-car', 'Car'],
              ['auto', 'fa-van-shuttle', 'Auto'],
              ['commercial', 'fa-truck', 'Commercial']
            ].map(([val, ic, lbl]) => (
              <button
                key={val}
                className={'bpanel-vtype' + (vehicleType === val ? ' selected' : '')}
                onClick={() => setVehicleType(val)}
              >
                <i className={`fa-solid ${ic}`}></i>
                <span>{lbl}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Slot Selection */}
        <div className="bpanel-field">
          <label>Charging Slot</label>
          <select className="inp" value={slot} onChange={e => setSlot(e.target.value)}>
            <option value="">Select Slot</option>
            {slotOptions.map(s => (
              <option key={s.label} value={s.label} disabled={!s.available}>
                {s.label} {s.available ? '(Available)' : '(Occupied)'}
              </option>
            ))}
          </select>
          {errors.slot && <span className="field-error">{errors.slot}</span>}
        </div>

        {/* Date & Time */}
        <div className="bpanel-row">
          <div className="bpanel-field">
            <label>Date</label>
            <input type="date" className="inp" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
            {errors.date && <span className="field-error">{errors.date}</span>}
          </div>
          <div className="bpanel-field">
            <label>Time</label>
            <input type="time" className="inp" value={time} onChange={e => setTime(e.target.value)} />
            {errors.time && <span className="field-error">{errors.time}</span>}
          </div>
        </div>

        {/* Charger Type */}
        <div className="bpanel-field">
          <label>Charger Type</label>
          <div className="bpanel-charger-toggle">
            <button
              className={'bpanel-charger-opt' + (chargerType === 'normal' ? ' selected' : '')}
              onClick={() => setChargerType('normal')}
            >
              <i className="fa-solid fa-plug"></i>
              <div>
                <span className="ch-label">Normal</span>
                <span className="ch-sub">Standard AC charging</span>
              </div>
            </button>
            <button
              className={'bpanel-charger-opt' + (chargerType === 'fast' ? ' selected' : '')}
              onClick={() => setChargerType('fast')}
            >
              <i className="fa-solid fa-bolt"></i>
              <div>
                <span className="ch-label">Fast</span>
                <span className="ch-sub">DC fast · 1.5× rate</span>
              </div>
            </button>
          </div>
        </div>

        {/* Duration */}
        <div className="bpanel-field">
          <label>Duration</label>
          <div className="bpanel-dur-grid">
            {[[30, '30m'], [60, '1hr'], [90, '1.5hr'], [120, '2hr'], [180, '3hr']].map(([m, lbl]) => (
              <button key={m} className={'bpanel-dur' + (duration === m ? ' selected' : '')} onClick={() => setDuration(m)}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* Price Calculation */}
        {pricing && (
          <div className="bpanel-price-card">
            <div className="bpanel-price-head">
              <i className="fa-solid fa-receipt"></i>
              <span>Price Estimate</span>
            </div>
            <div className="bpanel-price-row"><span>Energy (est.)</span><span>{pricing.energy} kWh</span></div>
            <div className="bpanel-price-row"><span>Base Price</span><span>₹{pricing.base}</span></div>
            <div className="bpanel-price-row"><span>GST (18%)</span><span>₹{pricing.gst}</span></div>
            {chargerType === 'fast' && (
              <div className="bpanel-price-row highlight"><span>Fast Charge Premium</span><span>×1.5</span></div>
            )}
            <div className="bpanel-price-total">
              <span>Total Amount</span>
              <span>₹{pricing.total}</span>
            </div>
          </div>
        )}

        {/* User Details */}
        <h4 className="bpanel-section-title" style={{ marginTop: '20px' }}>
          <i className="fa-solid fa-user"></i>
          Your Details
        </h4>
        <div className="bpanel-field">
          <label>Full Name</label>
          <input className="inp" placeholder="Enter your name" value={userName} onChange={e => setUserName(e.target.value)} />
          {errors.userName && <span className="field-error">{errors.userName}</span>}
        </div>
        <div className="bpanel-row">
          <div className="bpanel-field">
            <label>Mobile</label>
            <input className="inp" placeholder="+91 XXXXXXXXXX" value={userMobile} onChange={e => setUserMobile(e.target.value)} />
            {errors.userMobile && <span className="field-error">{errors.userMobile}</span>}
          </div>
          <div className="bpanel-field">
            <label>Email</label>
            <input className="inp" type="email" placeholder="email@example.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} />
            {errors.userEmail && <span className="field-error">{errors.userEmail}</span>}
          </div>
        </div>

        {/* Payment Method */}
        <h4 className="bpanel-section-title" style={{ marginTop: '20px' }}>
          <i className="fa-solid fa-wallet"></i>
          Payment Method
        </h4>
        <div className="bpanel-payment-grid">
          {[
            ['upi', 'fa-mobile-screen-button', 'UPI', 'GPay / PhonePe'],
            ['card', 'fa-credit-card', 'Card', 'Visa / Mastercard'],
            ['cash', 'fa-money-bill-wave', 'Cash', 'Pay at station']
          ].map(([val, ic, lbl, sub]) => (
            <button
              key={val}
              className={'bpanel-pay-opt' + (paymentMethod === val ? ' selected' : '')}
              onClick={() => setPaymentMethod(val)}
            >
              <i className={`fa-solid ${ic}`}></i>
              <span className="pay-label">{lbl}</span>
              <span className="pay-sub">{sub}</span>
            </button>
          ))}
        </div>

        {/* Error message */}
        {errors.submit && (
          <div className="bpanel-error">
            <i className="fa-solid fa-circle-exclamation"></i>
            {errors.submit}
          </div>
        )}

        {/* Submit Button */}
        <button
          className="btn-p bpanel-submit"
          disabled={isFull || submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <span className="btn-spinner"></span>
              Processing Booking...
            </>
          ) : (
            <>
              <i className="fa-solid fa-bolt"></i>
              Confirm Booking {pricing ? `· ₹${pricing.total}` : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
