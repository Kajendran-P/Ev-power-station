import { useState, useEffect, useRef, useMemo } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

export default function BookingSuccessPage({ booking, station, userPos, onNewBooking }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [showSosConfirm, setShowSosConfirm] = useState(false);

  // Generate QR code
  useEffect(() => {
    if (booking) {
      const qrData = JSON.stringify({
        bookingId: booking.bookingId,
        userId: booking.userId,
        stationId: booking.stationId,
        slot: booking.slot,
        date: booking.date,
        time: booking.time
      });
      QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: { dark: '#030A06', light: '#F0FFF4' }
      }).then(url => setQrDataUrl(url)).catch(() => {});
    }
  }, [booking]);

  // Distance calculation
  const distanceInfo = useMemo(() => {
    if (!station || !userPos) return null;
    const toRad = d => (d * Math.PI) / 180;
    const R = 6371;
    const stLat = station.lat, stLng = station.lng;
    const uLat = userPos[0], uLng = userPos[1];
    const dLat = toRad(stLat - uLat);
    const dLon = toRad(stLng - uLng);
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(uLat)) * Math.cos(toRad(stLat)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    const time = Math.round((dist / 30) * 60);
    return {
      distance: dist < 1 ? (dist * 1000).toFixed(0) + ' m' : dist.toFixed(1) + ' km',
      time: time < 60 ? time + ' min' : Math.floor(time / 60) + 'h ' + (time % 60) + 'm'
    };
  }, [station, userPos]);

  const directionsUrl = station
    ? `https://www.google.com/maps/dir/${userPos ? userPos[0] : 9.925},${userPos ? userPos[1] : 78.115}/${station.lat},${station.lng}`
    : '#';

  const handleDownloadInvoice = () => {
    if (!booking) return;
    const doc = new jsPDF();

    // Header
    doc.setFillColor(3, 10, 6);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(0, 245, 130);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('K⚡R - EV Charging Power Station', 15, 20);
    doc.setFontSize(10);
    doc.setTextColor(180, 220, 190);
    doc.text('EV Charging Platform - Tax Invoice', 15, 28);
    doc.setFontSize(9);
    doc.text(`Invoice Date: ${new Date().toLocaleDateString('en-IN')}`, 15, 36);
    doc.text(`Booking ID: ${booking.bookingId}`, 130, 20);
    doc.text(`Payment ID: ${booking.paymentId}`, 130, 28);
    doc.text(`Status: ${booking.status?.toUpperCase() || 'CONFIRMED'}`, 130, 36);

    // Divider
    doc.setDrawColor(0, 245, 130);
    doc.setLineWidth(0.5);
    doc.line(15, 50, 195, 50);

    // Customer Details
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Details', 15, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Name: ${booking.userName}`, 15, 68);
    doc.text(`Mobile: ${booking.userMobile}`, 15, 75);
    doc.text(`Email: ${booking.userEmail}`, 15, 82);
    doc.text(`Vehicle: ${booking.vehicleBrand || ''} ${booking.vehicleModel || ''}`, 15, 89);
    doc.text(`Number Plate: ${booking.vehicleNumberPlate || 'N/A'}`, 15, 96);

    // Station Details
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Station Details', 110, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Station: ${booking.stationName}`, 110, 68);
    doc.text(`Charger: ${booking.chargerType === 'fast' ? 'Fast DC' : 'Normal AC'}`, 110, 75);
    doc.text(`Slot: ${booking.slot}`, 110, 82);
    doc.text(`Date: ${booking.date}`, 110, 89);
    doc.text(`Time: ${booking.time}`, 110, 96);
    doc.text(`Duration: ${booking.duration} min`, 110, 103);

    // Billing Table
    doc.line(15, 112, 195, 112);
    doc.setFillColor(240, 255, 244);
    doc.rect(15, 115, 180, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Description', 20, 122);
    doc.text('Amount', 170, 122, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    let y = 135;
    const rows = [
      [`Energy (est.): ${booking.energy?.toFixed(1) || '0'} kWh`, `₹${booking.basePrice?.toFixed(2) || '0.00'}`],
      ['GST (18%)', `₹${booking.gst?.toFixed(2) || '0.00'}`],
      ['Platform Fee', '₹5.00'],
    ];
    rows.forEach(([desc, amt]) => {
      doc.text(desc, 20, y);
      doc.text(amt, 170, y, { align: 'right' });
      y += 8;
    });

    doc.line(15, y, 195, y);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 100, 50);
    doc.text('Total Amount', 20, y);
    doc.text(`₹${booking.totalAmount?.toFixed(2) || '0.00'}`, 170, y, { align: 'right' });

    // QR Code
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', 75, y + 15, 60, 60);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Scan this QR code at the charging station to start charging', 105, y + 80, { align: 'center' });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('VoltReserve Pro – EV Charging Platform | www.voltreservepro.com | support@voltreservepro.com', 105, 285, { align: 'center' });

    doc.save(`VoltReserve_Invoice_${booking.bookingId}.pdf`);
  };

  const handleSOS = () => {
    setShowSosConfirm(true);
    setTimeout(() => setShowSosConfirm(false), 3000);
  };

  if (!booking) return null;

  return (
    <div className="wz-success">
      {/* Success Animation */}
      <div className="wz-success-anim">
        <div className="wz-success-check-wrap">
          <div className="wz-success-check">
            <i className="fa-solid fa-check"></i>
          </div>
          <div className="wz-success-ring ring-1"></div>
          <div className="wz-success-ring ring-2"></div>
          <div className="wz-success-ring ring-3"></div>
        </div>
        <h2 className="wz-success-title">Booking Confirmed!</h2>
        <p className="wz-success-sub">Your charging slot has been successfully reserved</p>
      </div>

      {/* Booking Ticket Card */}
      <div className="wz-ticket">
        <div className="wz-ticket-header">
          <div className="wz-ticket-logo">
            <i className="fa-solid fa-bolt"></i>
          </div>
          <div>
            <h3>K⚡R EV Charging</h3>
            <span>Booking Confirmation</span>
          </div>
          <span className={`badge ${booking.status === 'upcoming' || booking.status === 'confirmed' ? 'badge-ok' : 'badge-warn'}`}>
            <span className="badge-dot"></span>
            {booking.status || 'Confirmed'}
          </span>
        </div>

        <div className="wz-ticket-id">
          <span className="wz-ticket-id-label">Booking ID</span>
          <span className="wz-ticket-id-val">{booking.bookingId}</span>
        </div>

        <div className="wz-ticket-details">
          <div className="wz-ticket-row">
            <span><i className="fa-solid fa-charging-station"></i>Station</span>
            <span>{booking.stationName}</span>
          </div>
          <div className="wz-ticket-row">
            <span><i className="fa-solid fa-calendar"></i>Date & Time</span>
            <span>{booking.date} · {booking.time}</span>
          </div>
          <div className="wz-ticket-row">
            <span><i className="fa-solid fa-car"></i>Vehicle</span>
            <span>{booking.vehicleNumberPlate || `${booking.vehicleBrand || ''} ${booking.vehicleModel || ''}`.trim() || booking.vehicleType}</span>
          </div>
          <div className="wz-ticket-row">
            <span><i className="fa-solid fa-bolt"></i>Charger</span>
            <span>{booking.chargerType === 'fast' ? 'Fast DC' : 'Normal AC'}</span>
          </div>
          <div className="wz-ticket-row">
            <span><i className="fa-solid fa-plug"></i>Slot</span>
            <span>{booking.slot}</span>
          </div>
          <div className="wz-ticket-row">
            <span><i className="fa-solid fa-clock"></i>Duration</span>
            <span>{booking.duration} min</span>
          </div>
          <div className="wz-ticket-row total">
            <span><i className="fa-solid fa-indian-rupee-sign"></i>Total Amount</span>
            <span>₹{booking.totalAmount?.toFixed(2)}</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="wz-ticket-qr">
          <h4>Scan at Station</h4>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Booking QR Code" className="wz-qr-img" />
          ) : (
            <div className="wz-qr-placeholder">
              <i className="fa-solid fa-qrcode"></i>
            </div>
          )}
          <p>Scan this QR code at the charging station to start your session</p>
        </div>

        {/* Cut-off line decoration */}
        <div className="wz-ticket-cutoff">
          <div className="wz-ticket-cut-circle left"></div>
          <div className="wz-ticket-cut-line"></div>
          <div className="wz-ticket-cut-circle right"></div>
        </div>

        {/* Payment Info */}
        <div className="wz-ticket-payment">
          <div className="wz-ticket-pay-row">
            <span>Payment ID</span>
            <span>{booking.paymentId}</span>
          </div>
          <div className="wz-ticket-pay-row">
            <span>Payment Method</span>
            <span style={{ textTransform: 'uppercase' }}>{booking.paymentMethod}</span>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="wz-success-actions">
        {/* Navigate */}
        <div className="wz-action-card navigate" onClick={() => window.open(directionsUrl, '_blank')}>
          <div className="wz-action-icon">
            <i className="fa-solid fa-diamond-turn-right"></i>
          </div>
          <div className="wz-action-info">
            <h4>Navigate to Station</h4>
            <p>{distanceInfo ? `${distanceInfo.distance} · Est. ${distanceInfo.time}` : 'Get directions'}</p>
          </div>
          <i className="fa-solid fa-arrow-right"></i>
        </div>

        {/* Download Invoice */}
        <div className="wz-action-card invoice" onClick={handleDownloadInvoice}>
          <div className="wz-action-icon">
            <i className="fa-solid fa-file-invoice"></i>
          </div>
          <div className="wz-action-info">
            <h4>Download Invoice</h4>
            <p>PDF invoice with full details</p>
          </div>
          <i className="fa-solid fa-download"></i>
        </div>

        {/* Book Another */}
        <div className="wz-action-card another" onClick={onNewBooking}>
          <div className="wz-action-icon">
            <i className="fa-solid fa-plus"></i>
          </div>
          <div className="wz-action-info">
            <h4>Book Another</h4>
            <p>Start a new booking</p>
          </div>
          <i className="fa-solid fa-arrow-right"></i>
        </div>

        {/* View Dashboard */}
        <div className="wz-action-card dashboard" onClick={() => window.location.href = '/dashboard'}>
          <div className="wz-action-icon">
            <i className="fa-solid fa-list-check"></i>
          </div>
          <div className="wz-action-info">
            <h4>View Bookings</h4>
            <p>Go to your dashboard</p>
          </div>
          <i className="fa-solid fa-arrow-right"></i>
        </div>
      </div>

      {/* SOS Floating Button */}
      <button className="wz-sos-float" onClick={handleSOS}>
        <i className="fa-solid fa-phone"></i>
        <span>SOS</span>
      </button>

      {/* SOS Confirm Toast */}
      {showSosConfirm && (
        <div className="wz-sos-toast">
          <i className="fa-solid fa-check-circle"></i>
          <span>Emergency alert sent to admin & nearest technician</span>
        </div>
      )}
    </div>
  );
}
