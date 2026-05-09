import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';
import { createSos, getActiveSos, updateSos, autoAssignSos } from '../services/sosService';
import { getSocket } from '../services/socket';
import MapComponent from '../components/MapComponent';

export default function SOSPage() {
  const { user } = useAuth();
  const { toast, addNotif } = useNotif();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [issue, setIssue] = useState(null);
  const [desc, setDesc] = useState('');
  const [loc, setLoc] = useState(null);
  const [locText, setLocText] = useState('Detecting GPS location...');
  const [activeSos, setActiveSos] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    getActiveSos().then(r => {
      if (r.data.sos) { setActiveSos(r.data.sos); setStep(2); }
    }).catch(() => {});
    detectLocation();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user]);

  useEffect(() => {
    if (step === 2 && activeSos) {
      pollRef.current = setInterval(() => {
        if (!activeSos?.sosId) return;
        import('../services/sosService').then(m => {
          m.getSosById(activeSos.sosId).then(r => {
            if (r.data.sos) setActiveSos(r.data.sos);
          }).catch(() => {});
        });
      }, 3000);
      // Socket listener
      const socket = getSocket();
      socket.on('sos:updated', (sos) => { if (sos.sosId === activeSos?.sosId) setActiveSos(sos); });
      return () => { clearInterval(pollRef.current); socket.off('sos:updated'); };
    }
  }, [step, activeSos?.sosId]);

  const detectLocation = () => {
    if (!navigator.geolocation) { setLoc({lat:9.9250,lng:78.1150}); setLocText('GPS not available'); return; }
    navigator.geolocation.getCurrentPosition(p => {
      setLoc({lat:p.coords.latitude,lng:p.coords.longitude});
      setLocText(`${p.coords.latitude.toFixed(4)}, ${p.coords.longitude.toFixed(4)}`);
    }, () => { setLoc({lat:9.9250,lng:78.1150}); setLocText('Kalavasal, Madurai (simulated)'); });
  };

  const triggerSOS = async () => {
    if (!issue) { toast('Select an issue first', 'err'); return; }
    if (!user) { toast('Please sign in first', 'err'); navigate('/login'); return; }
    try {
      const res = await createSos({ issueType: issue, description: desc, location: loc || {lat:9.925,lng:78.115}, locationText: locText });
      setActiveSos(res.data.sos);
      setStep(2);
      addNotif('SOS request sent: ' + issue, 'fa-shield-halved');
      setTimeout(async () => {
        try { const r = await autoAssignSos(res.data.sos.sosId); setActiveSos(r.data.sos); addNotif('Technician assigned!', 'fa-user-check'); } catch(e) {}
      }, 3000);
    } catch(e) { toast(e.response?.data?.message || 'Error', 'err'); }
  };

  const cancelSOS = async () => {
    if (!activeSos) return;
    try {
      await updateSos(activeSos.sosId, {status:'cancelled'});
      toast('SOS cancelled');
      setActiveSos(null); setStep(1); setIssue(null);
    } catch(e) { toast('Error', 'err'); }
  };

  const resetSos = () => { setActiveSos(null); setStep(1); setIssue(null); setDesc(''); };

  const statusMap = {
    'requested': {stage:1,badge:'badge-warn',text:'Searching...'},
    'assigned':  {stage:2,badge:'badge-info',text:'Assigned'},
    'accepted':  {stage:3,badge:'badge-info',text:'Accepted'},
    'on_the_way':{stage:4,badge:'badge-warn',text:'On The Way'},
    'arrived':   {stage:5,badge:'badge-ok',text:'Arrived'},
    'completed': {stage:6,badge:'badge-ok',text:'✓ Completed'},
    'cancelled': {stage:0,badge:'badge-err',text:'Cancelled'}
  };

  const info = activeSos ? (statusMap[activeSos.status] || statusMap.requested) : statusMap.requested;
  const steps = [
    {icon:'fa-broadcast-tower',label:'SOS Requested'},
    {icon:'fa-user-check',label:'Technician Assigned'},
    {icon:'fa-check-circle',label:'Accepted'},
    {icon:'fa-route',label:'On the Way'},
    {icon:'fa-location-dot',label:'Arrived'},
    {icon:'fa-flag-checkered',label:'Completed'}
  ];

  const issues = [
    {key:'accident',icon:'fa-car-burst',color:'var(--err)',label:'Accident'},
    {key:'breakdown',icon:'fa-car-on',color:'var(--warn)',label:'Breakdown'},
    {key:'battery',icon:'fa-battery-empty',color:'var(--warn)',label:'Battery Dead'},
    {key:'tyre',icon:'fa-circle-dot',color:'var(--cyan)',label:'Flat Tyre'},
    {key:'motor',icon:'fa-gear',color:'var(--purple)',label:'Motor Issue'},
    {key:'other',icon:'fa-circle-question',color:'var(--fg2)',label:'Other'}
  ];

  return (
    <div className="pg">
      <div className="ctn">
        <div style={{maxWidth: step === 1 ? '720px' : '100%', margin:'0 auto'}}>
          {step === 1 && (
            <div>
              <div className="gc" style={{padding:'28px',marginBottom:'20px',borderColor:'rgba(255,61,87,.3)'}}>
                <div style={{display:'flex',alignItems:'center',gap:'14px',marginBottom:'6px'}}>
                  <div style={{width:'52px',height:'52px',background:'linear-gradient(135deg,var(--err),#aa0022)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><i className="fa-solid fa-shield-halved" style={{color:'#fff',fontSize:'22px'}}></i></div>
                  <div><h2 style={{color:'var(--err)',fontSize:'22px'}}>Emergency SOS</h2><p style={{color:'var(--fg2)',fontSize:'13px'}}>A technician will be dispatched to your GPS location</p></div>
                </div>
              </div>
              <div className="gc" style={{padding:'24px',marginBottom:'16px'}}>
                <h3 style={{marginBottom:'10px',fontSize:'16px'}}>📍 Your Location</h3>
                <div style={{display:'flex',alignItems:'center',gap:'10px',background:'var(--bg2)',border:'1.5px solid var(--border)',borderRadius:'var(--rs)',padding:'13px 16px'}}>
                  <i className="fa-solid fa-location-dot" style={{color:'var(--accent)'}}></i>
                  <span style={{fontSize:'14px'}}>{locText}</span>
                </div>
              </div>
              <div className="gc" style={{padding:'24px',marginBottom:'16px'}}>
                <h3 style={{marginBottom:'16px',fontSize:'16px'}}>Select Issue Type</h3>
                <div className="sos-issue-grid">
                  {issues.map(i => (
                    <div key={i.key} className={'sos-issue-opt' + (issue === i.key ? ' sel' : '')} onClick={() => { setIssue(i.key); detectLocation(); }}>
                      <i className={`fa-solid ${i.icon}`} style={{color:i.color}}></i>
                      <div style={{fontSize:'12px',fontWeight:600}}>{i.label}</div>
                    </div>
                  ))}
                </div>
                <textarea className="inp" rows="2" style={{resize:'none'}} placeholder="Describe your issue (optional)..." value={desc} onChange={e => setDesc(e.target.value)}></textarea>
              </div>
              <div style={{textAlign:'center',marginBottom:'24px'}}>
                <button className="sos-btn-big" onClick={triggerSOS} disabled={!issue}>
                  <i className="fa-solid fa-shield-halved" style={{fontSize:'28px'}}></i><span>TAP TO SEND SOS</span>
                </button>
                <p style={{color:'var(--fg2)',fontSize:'12px',marginTop:'12px'}}>Select an issue type to enable the SOS button</p>
              </div>
            </div>
          )}

          {step === 2 && activeSos && (
            <div className="nsd-wrapper">
              {/* ====== 2-Column Dashboard Grid ====== */}
              <div className="nsd-grid">

                {/* ====== LEFT COLUMN (40%) ====== */}
                <div className="nsd-left">

                  {/* --- SOS Activity Card --- */}
                  <div className="nsd-card nsd-activity-card">
                    <div className="nsd-activity-header">
                      <div className="nsd-activity-title">
                        <div className="nsd-pulse-ring">
                          <span className="nsd-pulse-dot"></span>
                        </div>
                        <div>
                          <h2 className="nsd-h2">SOS Active</h2>
                          <p className="nsd-req-id">Request ID: <span>{activeSos.sosId}</span></p>
                        </div>
                      </div>
                      <span className={`badge ${info.badge}`}>{info.text}</span>
                    </div>

                    {/* Horizontal Progress Tracker */}
                    <div className="nsd-tracker">
                      {/* Background line */}
                      <div className="nsd-tracker-line">
                        <div className="nsd-tracker-line-fill" style={{width: `${Math.max(0, ((info.stage - 1) / (steps.length - 1)) * 100)}%`}}></div>
                      </div>
                      <div className="nsd-tracker-steps">
                        {steps.map((s, i) => {
                          const isDone = i + 1 < info.stage;
                          const isAct = i + 1 === info.stage;
                          return (
                            <div key={i} className={'nsd-step' + (isDone ? ' done' : isAct ? ' active' : '')}>
                              <div className="nsd-step-circle">
                                {isDone ? <i className="fa-solid fa-check"></i> : <i className={`fa-solid ${s.icon}`}></i>}
                              </div>
                              <span className="nsd-step-label">{s.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* --- Assigned Technician Card --- */}
                  <div className="nsd-card nsd-tech-card">
                    <div className="nsd-tech-header">
                      <i className="fa-solid fa-user-gear"></i>
                      <h3>Assigned Technician</h3>
                    </div>

                    {activeSos.technicianId ? (
                      <div className="nsd-tech-body">
                        <div className="nsd-tech-profile">
                          <div className="nsd-tech-avatar">
                            <span>{activeSos.technicianName?.charAt(0) || 'T'}</span>
                            <div className="nsd-tech-online-dot"></div>
                          </div>
                          <div className="nsd-tech-info">
                            <h4 className="nsd-tech-name">{activeSos.technicianName}</h4>
                            <span className="nsd-tech-role">EV Specialist</span>
                          </div>
                          <span className="nsd-tech-status-badge">
                            <span className="nsd-glow-dot"></span>
                            ASSIGNED
                          </span>
                        </div>

                        {/* OTP Section */}
                        {['accepted','on_the_way','arrived'].includes(activeSos.status) && (
                          <div className="nsd-otp-section">
                            <div className="nsd-otp-label"><i className="fa-solid fa-key"></i> Verification OTP</div>
                            <div className="nsd-otp-code">9999</div>
                            <p className="nsd-otp-hint">Share with technician upon arrival</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="nsd-tech-searching">
                        <div className="nsd-radar">
                          <div className="nsd-radar-ring r1"></div>
                          <div className="nsd-radar-ring r2"></div>
                          <div className="nsd-radar-ring r3"></div>
                          <i className="fa-solid fa-satellite-dish"></i>
                        </div>
                        <div>
                          <h4>Scanning for Technicians</h4>
                          <p>Locating the nearest available EV specialist...</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>

                {/* ====== RIGHT COLUMN (60%) — Live Map ====== */}
                <div className="nsd-right">
                  <div className="nsd-card nsd-map-card">
                    <div className="nsd-map-header">
                      <div className="nsd-map-title">
                        <span className="nsd-live-beacon"></span>
                        <h3>Live Tracking</h3>
                      </div>
                      <div className="nsd-map-badges">
                        {activeSos.technicianName && <span className="badge badge-info">{activeSos.technicianName}</span>}
                        <span className="badge badge-ok"><i className="fa-solid fa-satellite" style={{fontSize:'9px',marginRight:'3px'}}></i> GPS Active</span>
                      </div>
                    </div>
                    <div className="nsd-map-body">
                      <MapComponent
                        center={[activeSos.location?.lat || 9.925, activeSos.location?.lng || 78.115]}
                        zoom={14}
                        userPos={[activeSos.location?.lat || 9.925, activeSos.location?.lng || 78.115]}
                        techPos={activeSos.techLat && activeSos.techLng ? [activeSos.techLat, activeSos.techLng] : null}
                        techName={activeSos.technicianName}
                        showRoute={!!activeSos.techLat}
                        style={{height:'100%',borderRadius:'0 0 18px 18px'}}
                      />
                      {/* Glassmorphism Overlay */}
                      <div className="nsd-map-glass-overlay">
                        <div className="nsd-map-glass-item">
                          <i className="fa-solid fa-location-crosshairs"></i>
                          <div>
                            <span className="nsd-glass-label">Your Location</span>
                            <span className="nsd-glass-value">{locText || 'Detecting...'}</span>
                          </div>
                        </div>
                        {activeSos.status === 'on_the_way' && (
                          <div className="nsd-map-glass-item nsd-eta">
                            <i className="fa-solid fa-clock"></i>
                            <div>
                              <span className="nsd-glass-label">ETA</span>
                              <span className="nsd-glass-value">~8 min</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* ====== STICKY BOTTOM ACTION BAR ====== */}
              <div className="nsd-actionbar">
                {/* Bottom Left — Cancel SOS */}
                <div className="nsd-actionbar-left">
                  {activeSos.status === 'completed' ? (
                    <button className="btn-p" onClick={resetSos}><i className="fa-solid fa-plus"></i> New SOS</button>
                  ) : activeSos.status === 'cancelled' ? (
                    <button className="btn-p" onClick={resetSos}><i className="fa-solid fa-rotate-right"></i> New Request</button>
                  ) : (
                    <button className="nsd-cancel-sos-btn" onClick={cancelSOS}>
                      <i className="fa-solid fa-xmark"></i> Cancel SOS
                    </button>
                  )}
                </div>

                {/* Bottom Center — Floating Call + Chat */}
                <div className="nsd-actionbar-center">
                  {activeSos.technicianId && !['completed','cancelled'].includes(activeSos.status) && (
                    <>
                      <button className="nsd-call-btn" onClick={() => toast('Calling technician...')}>
                        <i className="fa-solid fa-phone"></i>
                        <span>Call</span>
                      </button>
                      <button className="nsd-chat-btn" onClick={() => toast('Opening chat...')}>
                        <i className="fa-solid fa-comment-dots"></i>
                        <span>Chat</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Bottom Right — Cancel Request */}
                <div className="nsd-actionbar-right">
                  {activeSos.status === 'completed' ? (
                    <button className="btn-s" onClick={() => navigate('/dashboard')}><i className="fa-solid fa-gauge-high"></i> Dashboard</button>
                  ) : activeSos.status !== 'cancelled' && (
                    <button className="nsd-cancel-request-btn" onClick={cancelSOS}>
                      <i className="fa-solid fa-ban"></i> Cancel Request
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
