import { useLocation, useNavigate } from 'react-router-dom';
import { useNotif } from '../context/NotifContext';
import { useMemo } from 'react';

export default function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useNotif();
  const booking = location.state?.booking;

  const qrPattern = useMemo(() => {
    const p = [];
    for (let i = 0; i < 49; i++) p.push(Math.random() > 0.45);
    [0,1,2,3,4,5,6,7,14,21,28,35,42,43,44,45,46,47,48].forEach(i => { if (i < 49) p[i] = true; });
    return p;
  }, []);

  if (!booking) return <div className="pg"><div className="ctn" style={{textAlign:'center',paddingTop:'80px'}}><p style={{color:'var(--fg2)'}}>No booking data</p><button className="btn-p" onClick={() => navigate('/booking')} style={{marginTop:'20px'}}>Book Now</button></div></div>;

  return (
    <div className="pg">
      <div className="ctn">
        <div style={{maxWidth:'520px',margin:'0 auto',textAlign:'center',paddingTop:'40px'}}>
          <div className="success-ic"><i className="fa-solid fa-check" style={{fontSize:'38px',color:'#030A06'}}></i></div>
          <h2 style={{fontSize:'26px',marginBottom:'6px'}}>Booking Confirmed!</h2>
          <p style={{color:'var(--fg2)'}}>Your charging slot has been reserved</p>
          <div className="bk-id">{booking.bookingId}</div>
          <div className="gc" style={{textAlign:'left',margin:'20px 0'}}>
            <div className="sum-row"><span>Station</span><span>{booking.stationName}</span></div>
            <div className="sum-row"><span>Slot</span><span>{booking.slot}</span></div>
            <div className="sum-row"><span>Date & Time</span><span>{booking.date} {booking.time}</span></div>
            <div className="sum-row"><span>Duration</span><span>{booking.duration} min</span></div>
            <div className="sum-row"><span>Payment ID</span><span>{booking.paymentId}</span></div>
            <div className="sum-row"><span className="sum-tot">Amount</span><span className="sum-tot">₹{booking.totalAmount?.toFixed(2)}</span></div>
          </div>
          <div className="qr-wrap">
            <div className="qr-inner">
              {qrPattern.map((p, i) => <div key={i} className={'qr-cell' + (p ? '' : ' w')}></div>)}
            </div>
          </div>
          <p style={{fontSize:'12px',color:'var(--fg2)',marginBottom:'20px'}}>Scan QR at charging station to start</p>
          <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
            <button className="btn-p" onClick={() => toast('Invoice sent to your email')}><i className="fa-solid fa-download" style={{marginRight:'8px'}}></i>Download Invoice</button>
            <button className="btn-s" onClick={() => navigate('/dashboard')}>View Bookings</button>
          </div>
        </div>
      </div>
    </div>
  );
}
