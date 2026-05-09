import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStation } from '../services/stationService';
import MapComponent from '../components/MapComponent';

export default function StationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [station, setStation] = useState(null);

  useEffect(() => {
    getStation(id).then(r => setStation(r.data.station)).catch(() => navigate('/stations'));
  }, [id]);

  if (!station) return <div className="pg"><div className="ctn"><p style={{color:'var(--fg2)',textAlign:'center',padding:'60px'}}>Loading...</p></div></div>;

  const cls = station.status === 'available' ? 'badge-ok' : station.status === 'limited' ? 'badge-warn' : 'badge-err';

  return (
    <div className="pg">
      <div className="ctn">
        <button onClick={() => navigate('/stations')} style={{display:'flex',alignItems:'center',gap:'8px',background:'none',border:'none',color:'var(--fg2)',cursor:'pointer',fontSize:'14px',marginBottom:'20px',fontFamily:"'Outfit',sans-serif"}}><i className="fa-solid fa-arrow-left"></i>Back to Stations</button>
        <div className="st-detail-grid">
          <div>
            <div className="gc" style={{padding:'28px',marginBottom:'20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',flexWrap:'wrap',gap:'12px',marginBottom:'20px'}}>
                <div>
                  <h2 style={{fontSize:'24px',marginBottom:'6px'}}>{station.name}</h2>
                  <p style={{color:'var(--fg2)',fontSize:'14px',display:'flex',alignItems:'center',gap:'6px'}}><i className="fa-solid fa-location-dot" style={{color:'var(--accent)'}}></i>{station.location}</p>
                </div>
                <span className={`badge ${cls}`}>{station.status.charAt(0).toUpperCase() + station.status.slice(1)}</span>
              </div>
              <div className="specs-g">
                <div className="spc"><div className="spc-v">{station.power}kW</div><div className="spc-l">Power</div></div>
                <div className="spc"><div className="spc-v">{station.pricePerKwh}/kWh</div><div className="spc-l">Price (₹)</div></div>
                <div className="spc"><div className="spc-v">{station.availableSlots}/{station.totalSlots}</div><div className="spc-l">Slots</div></div>
                <div className="spc"><div className="spc-v">{station.rating}⭐</div><div className="spc-l">Rating</div></div>
              </div>
              <button className="btn-p" style={{width:'100%',marginTop:'16px'}} onClick={() => navigate('/booking', { state: { station } })}><i className="fa-solid fa-bolt" style={{marginRight:'8px'}}></i>Book This Station</button>
            </div>
            <div className="gc" style={{padding:'22px',marginBottom:'20px'}}>
              <h3 style={{marginBottom:'14px',fontSize:'16px'}}>Charger Slots</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(100px,1fr))',gap:'8px'}}>
                {Array.from({length: station.totalSlots}, (_, i) => {
                  const avail = i < station.availableSlots;
                  return (
                    <div key={i} style={{padding:'10px',borderRadius:'8px',textAlign:'center',border:`1.5px solid ${avail?'var(--accent)':'var(--border)'}`,background:avail?'rgba(0,245,130,.06)':'var(--bg2)'}}>
                      <i className="fa-solid fa-plug" style={{color:avail?'var(--accent)':'var(--muted)',fontSize:'16px',display:'block',marginBottom:'4px'}}></i>
                      <div style={{fontSize:'11px',color:avail?'var(--fg)':'var(--muted)'}}>Slot {i+1}</div>
                      <div style={{fontSize:'10px',color:avail?'var(--ok)':'var(--err)'}}>{avail?'Free':'Used'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div>
            <div className="gc" style={{padding:'20px',marginBottom:'20px'}}>
              <h3 style={{marginBottom:'14px',fontSize:'16px'}}>Station Map</h3>
              <MapComponent center={[station.lat, station.lng]} zoom={15} stations={[station]} userPos={[9.9250, 78.1150]} style={{height:'260px',borderRadius:'12px'}} />
            </div>
            <div className="gc" style={{padding:'20px'}}>
              <h3 style={{marginBottom:'14px',fontSize:'16px'}}>Reviews</h3>
              {(station.reviews || []).map((r, i) => (
                <div key={i} style={{padding:'12px 0',borderBottom:'1px solid var(--border)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                    <span style={{fontWeight:600,fontSize:'13px'}}>{r.name}</span>
                    <span className="rating"><i className="fa-solid fa-star"></i>{r.rating?.toFixed(1)}</span>
                  </div>
                  <p style={{color:'var(--fg2)',fontSize:'13px'}}>{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
