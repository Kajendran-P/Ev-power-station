import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStations } from '../services/stationService';
import { getTechList } from '../services/adminService';
import MapComponent from '../components/MapComponent';

export default function StationsPage() {
  const navigate = useNavigate();
  const [stations, setStations] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getStations().then(r => setStations(r.data.stations || [])).catch(() => {});
    getTechList().then(r => setWorkers(r.data.technicians || [])).catch(() => {});
  }, []);

  const filtered = stations.filter(s => {
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    if (priceFilter === 'low' && s.pricePerKwh >= 12) return false;
    if (priceFilter === 'mid' && (s.pricePerKwh < 12 || s.pricePerKwh > 18)) return false;
    if (priceFilter === 'high' && s.pricePerKwh <= 18) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.location.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="pg">
      <div className="ctn">
        <div className="sec-hd">
          <h2 className="sec-t">Charging Network</h2>
          <div className="ftabs">
            {[['all','All'],['fast-dc','Fast DC'],['normal-ac','Normal AC'],['bike','Bike']].map(([k,l]) => (
              <button key={k} className={'ftab' + (typeFilter === k ? ' act' : '')} onClick={() => setTypeFilter(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{display:'flex',gap:'8px',marginBottom:'18px',flexWrap:'wrap'}}>
          {[['all','All Prices'],['low','Under ₹12/kWh'],['mid','₹12–18/kWh'],['high','Premium']].map(([k,l]) => (
            <button key={k} className={'pill' + (priceFilter === k ? ' act' : '')} onClick={() => setPriceFilter(k)}>{l}</button>
          ))}
        </div>
        <div className="search-wrap" style={{marginBottom:'20px'}}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input className="inp" placeholder="Search stations..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="sgrid">
          {filtered.length === 0 ? (
            <div style={{gridColumn:'1/-1',textAlign:'center',padding:'60px',color:'var(--fg2)'}}>
              <i className="fa-solid fa-charging-station" style={{fontSize:'40px',marginBottom:'16px',display:'block',opacity:.3}}></i>No stations match your filters
            </div>
          ) : filtered.map(s => {
            const pct = Math.round((s.availableSlots / s.totalSlots) * 100);
            const cls = s.status === 'available' ? 'badge-ok' : s.status === 'limited' ? 'badge-warn' : 'badge-err';
            const ic = s.type === 'bike' ? 'fa-motorcycle' : s.type === 'fast-dc' ? 'fa-bolt' : 'fa-plug';
            const typeColor = s.type === 'fast-dc' ? 'var(--accent)' : s.type === 'normal-ac' ? 'var(--cyan)' : 'var(--purple)';
            return (
              <div key={s.stationId || s._id} className="gc scard" onClick={() => navigate(`/station/${s.stationId}`)}>
                <div className="scard-type">
                  <div className="scard-ic"><i className={`fa-solid ${ic}`} style={{color:typeColor,fontSize:'20px'}}></i></div>
                  <div><h4 style={{fontSize:'15px',marginBottom:'2px'}}>{s.name}</h4>
                    <p style={{color:'var(--fg2)',fontSize:'12px',display:'flex',alignItems:'center',gap:'4px'}}><i className="fa-solid fa-location-dot" style={{color:'var(--accent)',fontSize:'10px'}}></i>{s.location}</p></div>
                </div>
                <div className="specs-g">
                  <div className="spc"><div className="spc-v">{s.power}kW</div><div className="spc-l">Power</div></div>
                  <div className="spc"><div className="spc-v">{s.availableSlots}/{s.totalSlots}</div><div className="spc-l">Slots</div></div>
                  <div className="spc"><div className="spc-v">{s.distance}km</div><div className="spc-l">Distance</div></div>
                  <div className="spc"><div className="spc-v">{pct}%</div><div className="spc-l">Available</div></div>
                </div>
                <div style={{margin:'4px 0 12px'}}><div className="live-bar" style={{position:'relative'}}><div className="live-bar-fill" style={{width:`${pct}%`,position:'relative'}}></div></div></div>
                <div className="sc-ft">
                  <div className="sc-pr">₹{s.pricePerKwh}<span>/kWh</span></div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <span className={`badge ${cls}`}><span style={{width:'6px',height:'6px',borderRadius:'50%',background:'currentColor',display:'inline-block'}}></span>{s.status}</span>
                    <span className="rating"><i className="fa-solid fa-star"></i>{s.rating}</span>
                  </div>
                </div>
                <button className="btn-p" style={{width:'100%',marginTop:'8px'}} onClick={(e) => { e.stopPropagation(); navigate('/stations/book', { state: { station: s } }); }}><i className="fa-solid fa-bolt" style={{marginRight:'8px'}}></i>Book Now</button>
              </div>
            );
          })}
        </div>

        <div style={{marginTop:'36px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px',flexWrap:'wrap',gap:'8px'}}>
            <h3 className="sec-t"><span className="live-dot"></span>Live Station Map</h3>
            <div style={{display:'flex',gap:'16px',fontSize:'12px',color:'var(--fg2)'}}>
              <span><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'var(--ok)',marginRight:'4px'}}></span>Available</span>
              <span><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'var(--warn)',marginRight:'4px'}}></span>Limited</span>
              <span><span style={{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',background:'var(--err)',marginRight:'4px'}}></span>Full</span>
            </div>
          </div>
          {filtered.length > 0 && (
            <MapComponent center={[9.9250, 78.1150]} zoom={13} stations={filtered} workers={workers} userPos={[9.9250, 78.1150]} />
          )}
        </div>
      </div>
    </div>
  );
}
