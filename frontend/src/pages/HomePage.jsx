import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStations } from '../services/stationService';
import { getTechList } from '../services/adminService';
import MapComponent from '../components/MapComponent';

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [workerCount, setWorkerCount] = useState(0);
  const [carbon, setCarbon] = useState(0);

  useEffect(() => {
    getStations().then(r => setStations(r.data.stations || [])).catch(() => {});
    getTechList().then(r => setWorkerCount(r.data.technicians?.length || 0)).catch(() => {});
    // Animate carbon counter
    let n = 0; const target = 124532;
    const t = setInterval(() => { n = Math.min(n + Math.max(1, Math.floor((target - n) / 40)), target); setCarbon(n); if (n >= target) clearInterval(t); }, 30);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="pg">
      <div className="ctn">
        <div className="hero">
          <div className="hero-eyebrow"><i className="fa-solid fa-bolt"></i> Real-time EV Platform</div>
          <h1 className="hero-t">Power Your Journey<br />with <span>Smart Charging</span></h1>
          <p className="hero-sub">Book EV charging slots, request repair services, and track mechanics in real-time across your city.</p>
          <p style={{color:'var(--accent)',fontWeight:600,marginBottom:'20px'}}>{user ? `Logged in as ${user.email}` : 'Please sign in to continue.'}</p>
          <div className="hero-cta">
            <button className="btn-p" onClick={() => navigate('/stations')}><i className="fa-solid fa-charging-station" style={{marginRight:'8px'}}></i>Find Stations</button>
            <button className="btn-s" onClick={() => navigate('/services')}><i className="fa-solid fa-wrench" style={{marginRight:'8px'}}></i>View Services</button>
            <button className="btn-d" onClick={() => navigate('/sos')}><i className="fa-solid fa-shield-halved" style={{marginRight:'8px'}}></i>Emergency SOS</button>
          </div>
        </div>

        <div className="stats-g">
          <div className="gc stat-card"><div className="stat-v">{stations.length}</div><div className="stat-l">Charging Stations</div></div>
          <div className="gc stat-card"><div className="stat-v">{workerCount}</div><div className="stat-l">Active Mechanics</div></div>
          <div className="gc stat-card"><div className="stat-v">2,847</div><div className="stat-l">Happy Users</div></div>
          <div className="gc stat-card"><div className="stat-v">12.4K</div><div className="stat-l">CO₂ Saved (kg)</div></div>
        </div>

        <div className="qa-grid">
          <div className="gc qa-card" onClick={() => navigate('/booking')}><div className="qa-ic" style={{background:'rgba(0,245,130,.1)',border:'1px solid rgba(0,245,130,.2)'}}><i className="fa-solid fa-calendar-check" style={{color:'var(--accent)'}}></i></div><div style={{fontSize:'13px',fontWeight:600}}>Book Slot</div></div>
          <div className="gc qa-card" onClick={() => navigate('/sos')}><div className="qa-ic" style={{background:'rgba(255,61,87,.1)',border:'1px solid rgba(255,61,87,.2)'}}><i className="fa-solid fa-shield-halved" style={{color:'var(--err)'}}></i></div><div style={{fontSize:'13px',fontWeight:600}}>SOS Help</div></div>
          <div className="gc qa-card" onClick={() => navigate('/services')}><div className="qa-ic" style={{background:'rgba(0,229,255,.1)',border:'1px solid rgba(0,229,255,.2)'}}><i className="fa-solid fa-wrench" style={{color:'var(--cyan)'}}></i></div><div style={{fontSize:'13px',fontWeight:600}}>Services</div></div>
          <div className="gc qa-card" onClick={() => navigate('/stations')}><div className="qa-ic" style={{background:'rgba(123,97,255,.1)',border:'1px solid rgba(123,97,255,.2)'}}><i className="fa-solid fa-map-location-dot" style={{color:'var(--purple)'}}></i></div><div style={{fontSize:'13px',fontWeight:600}}>Find Nearby</div></div>
        </div>

        <div className="carbon-c">
          <p style={{color:'var(--fg2)',marginBottom:'6px',fontSize:'14px'}}>🌿 Total Carbon Emissions Saved by Our Community</p>
          <div className="carbon-v">{carbon.toLocaleString()}</div>
          <div style={{color:'var(--fg2)',fontSize:'13px',marginTop:'4px'}}>kg CO₂ equivalent</div>
        </div>

        <div style={{marginTop:'32px'}}>
          <h3 className="sec-t" style={{marginBottom:'16px'}}><span className="live-dot"></span>Nearby Stations — Live</h3>
          {stations.length > 0 && (
            <MapComponent center={[9.9250, 78.1150]} zoom={13} stations={stations} userPos={[9.9250, 78.1150]} style={{height:'320px'}} />
          )}
        </div>
      </div>
    </div>
  );
}
