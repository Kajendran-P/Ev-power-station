import { useMemo } from 'react';

export default function BookingSuccessModal({ open, booking, station, userPos, onClose }) {
  if (!open || !booking) return null;

  const stLat = booking.stationLat || station?.lat || 0;
  const stLng = booking.stationLng || station?.lng || 0;
  const uLat = userPos ? userPos[0] : 9.9250;
  const uLng = userPos ? userPos[1] : 78.1150;

  // Haversine distance calculation
  const distanceInfo = useMemo(() => {
    const toRad = d => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(stLat - uLat);
    const dLon = toRad(stLng - uLng);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(uLat)) * Math.cos(toRad(stLat)) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    const time = Math.round((dist / 30) * 60); // ~30 km/h avg city speed
    return {
      distance: dist < 1 ? (dist * 1000).toFixed(0) + ' m' : dist.toFixed(1) + ' km',
      time: time < 60 ? time + ' min' : Math.floor(time / 60) + 'h ' + (time % 60) + 'm'
    };
  }, [stLat, stLng, uLat, uLng]);

  const directionsUrl = `https://www.google.com/maps/dir/${uLat},${uLng}/${stLat},${stLng}`;

  const handleDirections = () => {
    window.open(directionsUrl, '_blank');
  };

  return (
    <div className={'bsuccess-overlay' + (open ? ' act' : '')}>
      <div className="bsuccess-modal">
        {/* Close button */}
        <button className="bsuccess-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        {/* Success animation */}
        <div className="bsuccess-icon">
          <div className="bsuccess-check">
            <i className="fa-solid fa-check"></i>
          </div>
          <div className="bsuccess-ring ring-1"></div>
          <div className="bsuccess-ring ring-2"></div>
          <div className="bsuccess-ring ring-3"></div>
        </div>

        <h2 className="bsuccess-title">Booking Confirmed!</h2>
        <p className="bsuccess-sub">Your charging slot has been successfully reserved</p>

        {/* Booking ID */}
        <div className="bsuccess-id">{booking.bookingId}</div>

        {/* Details */}
        <div className="bsuccess-details">
          <div className="bsuccess-row">
            <span><i className="fa-solid fa-charging-station"></i>Station</span>
            <span>{booking.stationName}</span>
          </div>
          <div className="bsuccess-row">
            <span><i className="fa-solid fa-plug"></i>Slot</span>
            <span>{booking.slot}</span>
          </div>
          <div className="bsuccess-row">
            <span><i className="fa-solid fa-calendar"></i>Date & Time</span>
            <span>{booking.date} · {booking.time}</span>
          </div>
          <div className="bsuccess-row">
            <span><i className="fa-solid fa-clock"></i>Duration</span>
            <span>{booking.duration} min</span>
          </div>
          <div className="bsuccess-row">
            <span><i className="fa-solid fa-bolt"></i>Charger</span>
            <span>{booking.chargerType === 'fast' ? 'Fast DC' : 'Normal AC'}</span>
          </div>
          <div className="bsuccess-row">
            <span><i className="fa-solid fa-credit-card"></i>Payment</span>
            <span>{booking.paymentId}</span>
          </div>
          <div className="bsuccess-row total">
            <span><i className="fa-solid fa-indian-rupee-sign"></i>Total</span>
            <span>₹{booking.totalAmount?.toFixed(2)}</span>
          </div>
        </div>

        {/* Directions Card */}
        <div className="bsuccess-directions">
          <div className="bsuccess-dir-info">
            <div className="bsuccess-dir-icon">
              <i className="fa-solid fa-diamond-turn-right"></i>
            </div>
            <div>
              <h4>Get Directions</h4>
              <p>{distanceInfo.distance} · Est. {distanceInfo.time}</p>
            </div>
          </div>
          <button className="btn-p bsuccess-dir-btn" onClick={handleDirections}>
            <i className="fa-solid fa-map-location-dot"></i>
            Navigate to Station
          </button>
        </div>

        {/* Action Buttons */}
        <div className="bsuccess-actions">
          <button className="btn-s" onClick={onClose}>
            <i className="fa-solid fa-plus"></i>
            Book Another
          </button>
          <button className="btn-p" onClick={() => { onClose(); window.location.href = '/dashboard'; }}>
            <i className="fa-solid fa-list-check"></i>
            View Bookings
          </button>
        </div>
      </div>
    </div>
  );
}
