import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';
import { getTechList, getTechJobs, getTechHistory, getTechStats, completeTechJob } from '../services/adminService';
import { updateSos } from '../services/sosService';
import { getStations } from '../services/stationService';
import { getTechServiceRequests, updateServiceRequest } from '../services/serviceApiService';
import { getSocket } from '../services/socket';
import Modal from '../components/Modal';
import MapComponent from '../components/MapComponent';

function relTime(t) {
  const s = Math.floor((Date.now() - new Date(t).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

export default function TechnicianPage() {
  const { user, loginEmail } = useAuth();
  const { toast, addNotif } = useNotif();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tab, setTab] = useState('jobs');
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({totalJobs:0,pending:0,completed:0,earnings:0,rating:4.7});
  const [online, setOnline] = useState(true);
  const [stations, setStations] = useState([]);
  const [techList, setTechList] = useState([]);
  const [selTech, setSelTech] = useState('');
  const [techPass, setTechPass] = useState('');
  const [showServiceMod, setShowServiceMod] = useState(false);
  const [serviceJobId, setServiceJobId] = useState('');
  const [serviceReport, setServiceReport] = useState({problem:'',fix:'',parts:'',cost:'',otp:''});
  
  // Service requests for technician
  const [serviceRequests, setServiceRequests] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [notesData, setNotesData] = useState({id:'',notes:'',estimatedCompletion:''});

  useEffect(() => {
    getTechList().then(r => setTechList(r.data.technicians || [])).catch(() => {});
    if (user && user.role === 'technician') { setIsLoggedIn(true); loadData(); }
  }, [user]);

  const loadData = useCallback(() => {
    getTechJobs().then(r => setJobs(r.data.jobs || [])).catch(() => {});
    getTechHistory().then(r => setHistory(r.data.jobs || [])).catch(() => {});
    getTechStats().then(r => setStats(r.data.stats || stats)).catch(() => {});
    getStations().then(r => setStations(r.data.stations || [])).catch(() => {});
    getTechServiceRequests().then(r => setServiceRequests(r.data.requests || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    const iv = setInterval(loadData, 5000);
    const socket = getSocket();
    socket.on('sos:updated', () => loadData());
    return () => { clearInterval(iv); socket.off('sos:updated'); };
  }, [isLoggedIn]);

  const handleTechLogin = async () => {
    if (!selTech) { toast('Select a technician', 'err'); return; }
    const t = techList.find(x => x._id === selTech);
    if (!t) return;
    if (techPass !== 'tech123') { toast('Invalid password', 'err'); return; }
    try { await loginEmail(t.email, 'tech123'); setIsLoggedIn(true); toast('Welcome, ' + t.name); }
    catch (e) { toast('Login error', 'err'); }
  };

  const acceptJob = async (sosId) => { try { await updateSos(sosId, {status:'accepted'}); toast('Job accepted!'); addNotif('Accepted SOS: '+sosId,'fa-check'); loadData(); } catch(e) {toast('Error','err');} };
  const declineJob = async (sosId) => { try { await updateSos(sosId, {technicianId:null,technicianName:null,status:'requested'}); toast('Job declined'); loadData(); } catch(e) {toast('Error','err');} };
  const onTheWay = async (sosId) => {
    try {
      await updateSos(sosId, {status:'on_the_way',techLat:user?.location?.lat||9.922,techLng:user?.location?.lng||78.098});
      toast('Status: On The Way'); simulateMovement(sosId); loadData();
    } catch(e) {toast('Error','err');}
  };
  const arrived = async (sosId) => { try { await updateSos(sosId, {status:'arrived'}); toast('Status: Arrived'); loadData(); } catch(e) {toast('Error','err');} };
  const openComplete = (sosId) => { setServiceJobId(sosId); setShowServiceMod(true); };
  const submitReport = async () => {
    if (serviceReport.otp !== '9999') { toast('Invalid OTP', 'err'); return; }
    try {
      await completeTechJob({sosId:serviceJobId,report:{problem:serviceReport.problem||'Resolved',fix:serviceReport.fix||'Repaired',parts:serviceReport.parts,cost:parseInt(serviceReport.cost)||0},otp:serviceReport.otp});
      toast('Job completed! ₹'+(serviceReport.cost||0)+' earned');
      setShowServiceMod(false); setServiceReport({problem:'',fix:'',parts:'',cost:'',otp:''}); loadData();
    } catch(e) { toast(e.response?.data?.message||'Error','err'); }
  };

  const simulateMovement = (sosId) => {
    const socket = getSocket();
    let lat = user?.location?.lat || 9.922; let lng = user?.location?.lng || 78.098;
    const iv = setInterval(() => { lat += (Math.random() - 0.3) * 0.001; lng += (Math.random() - 0.3) * 0.001; socket.emit('sos:location-update', {sosId, lat, lng}); }, 1000);
    setTimeout(() => clearInterval(iv), 60000);
  };

  // Service request status updates
  const updateSRStatus = async (id, status) => {
    try { await updateServiceRequest(id, { status }); toast(`Status: ${status}`); loadData(); }
    catch (e) { toast('Error', 'err'); }
  };

  const saveNotes = async () => {
    try {
      await updateServiceRequest(notesData.id, { technicianNotes: notesData.notes, estimatedCompletion: notesData.estimatedCompletion });
      toast('Notes saved'); setShowNotes(false); loadData();
    } catch (e) { toast('Error', 'err'); }
  };

  if (!isLoggedIn) {
    return (
      <div className="pg"><div className="ctn"><div className="auth-wrap"><div className="auth-c"><div className="gc" style={{padding:'36px'}}>
        <h2 className="auth-t">Technician Login</h2>
        <p style={{color:'var(--fg2)',marginBottom:'24px',fontSize:'14px'}}>Select your profile & enter password</p>
        <select className="inp" style={{marginBottom:'14px'}} value={selTech} onChange={e => setSelTech(e.target.value)}>
          <option value="">Select Technician</option>
          {techList.map(t => <option key={t._id} value={t._id}>{t.name} ({t.phone})</option>)}
        </select>
        <input type="password" className="inp" placeholder="Password" style={{marginBottom:'18px'}} value={techPass} onChange={e => setTechPass(e.target.value)} />
        <button className="btn-p" style={{width:'100%'}} onClick={handleTechLogin}>Login</button>
        <p style={{textAlign:'center',marginTop:'12px',color:'var(--muted)',fontSize:'12px'}}>Demo: tech123</p>
      </div></div></div></div></div>
    );
  }

  const getActionBtns = (j) => {
    switch(j.status) {
      case 'assigned': return <div style={{display:'flex',gap:'8px',marginTop:'14px'}}><button className="btn-p" style={{flex:1,fontSize:'13px',padding:'10px'}} onClick={() => acceptJob(j.sosId)}><i className="fa-solid fa-check" style={{marginRight:'6px'}}></i>Accept</button><button className="btn-d" style={{flex:1,fontSize:'13px',padding:'10px'}} onClick={() => declineJob(j.sosId)}><i className="fa-solid fa-times" style={{marginRight:'6px'}}></i>Decline</button></div>;
      case 'accepted': return <div style={{display:'flex',gap:'8px',marginTop:'14px'}}><button className="btn-s" style={{flex:1,fontSize:'13px',padding:'10px'}} onClick={() => window.open(`https://maps.google.com/?q=${j.locationText||'Madurai'}+Madurai`,'_blank')}><i className="fa-solid fa-route" style={{marginRight:'6px'}}></i>Navigate</button><button className="btn-warn" style={{flex:1,fontSize:'13px',padding:'10px'}} onClick={() => onTheWay(j.sosId)}><i className="fa-solid fa-car" style={{marginRight:'6px'}}></i>On The Way</button></div>;
      case 'on_the_way': return <div style={{display:'flex',gap:'8px',marginTop:'14px'}}><button className="btn-cyan" style={{flex:1,fontSize:'13px',padding:'10px'}} onClick={() => arrived(j.sosId)}><i className="fa-solid fa-location-dot" style={{marginRight:'6px'}}></i>Arrived</button></div>;
      case 'arrived': return <div style={{display:'flex',gap:'8px',marginTop:'14px'}}><button className="btn-p" style={{flex:1,fontSize:'13px',padding:'10px'}} onClick={() => openComplete(j.sosId)}><i className="fa-solid fa-check-double" style={{marginRight:'6px'}}></i>Complete Job</button></div>;
      default: return null;
    }
  };

  return (
    <div className="pg">
      <div className="ctn">
        <div className="gc" style={{padding:'20px',marginBottom:'20px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px'}}>
            <div><h3 style={{fontSize:'18px'}}>{user?.name}</h3><p style={{color:'var(--fg2)',fontSize:'13px'}}>{user?.role} · ⭐ {stats.rating}</p></div>
            <div className="td-online-toggle">
              <span style={{fontSize:'13px',color:online?'var(--ok)':'var(--muted)'}}>{online?'Online':'Offline'}</span>
              <label className="toggle"><input type="checkbox" checked={online} onChange={e => { setOnline(e.target.checked); toast(e.target.checked?'Online':'Offline'); }} /><span className="toggle-slider"></span></label>
            </div>
          </div>
        </div>
        <div className="td-stats">
          <div className="gc td-stat"><div className="td-stat-v">{stats.totalJobs}</div><div className="td-stat-l">Total Jobs</div></div>
          <div className="gc td-stat"><div className="td-stat-v">₹{(stats.earnings||0).toLocaleString()}</div><div className="td-stat-l">Earnings</div></div>
          <div className="gc td-stat"><div className="td-stat-v">{stats.rating}</div><div className="td-stat-l">Rating</div></div>
          <div className="gc td-stat"><div className="td-stat-v">{stats.pending}</div><div className="td-stat-l">Pending</div></div>
        </div>
        <div className="td-tabs">
          {['jobs','service-requests','history','map','maintenance'].map(t => (
            <button key={t} className={'td-tab' + (tab === t ? ' act' : '')} onClick={() => setTab(t)} style={{textTransform:'capitalize',fontSize:'12px'}}>{t.replace('-',' ')}</button>
          ))}
        </div>

        {/* SOS Jobs Tab */}
        {tab === 'jobs' && (<div>
          {jobs.length === 0 ? (
            <div className="td-empty"><div className="td-empty-icon"><i className="fa-solid fa-clipboard-list"></i></div><h4 style={{marginBottom:'6px'}}>No Active SOS Jobs</h4><p style={{fontSize:'13px'}}>New SOS requests will appear here</p></div>
          ) : jobs.map(j => {
            const priCls = j.issueType==='accident'?'high':['breakdown','battery'].includes(j.issueType)?'medium':'low';
            const statusBadge = {assigned:'badge-warn',accepted:'badge-info',on_the_way:'badge-warn',arrived:'badge-ok'}[j.status]||'badge-warn';
            return (
              <div key={j.sosId} className={'gc td-job-card ' + (j.status==='assigned'?'new':'active')} style={{marginBottom:'14px'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
                    <div className="td-cust-avatar">{(j.customerName||'C').charAt(0)}</div>
                    <div><h4 style={{fontSize:'15px',marginBottom:'2px'}}>{j.customerName||'Customer'}</h4><p style={{fontSize:'12px',color:'var(--fg2)'}}>{j.issueType}</p></div>
                  </div>
                  <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                    <span className={`badge ${statusBadge}`}>{j.status.replace('_',' ')}</span>
                    <span className={`td-pri ${priCls}`}><span style={{width:'5px',height:'5px',borderRadius:'50%',background:'currentColor',display:'inline-block'}}></span>{priCls}</span>
                  </div>
                </div>
                <div className="td-meta"><i className="fa-solid fa-location-dot"></i><span>{j.locationText||'Customer location'}</span></div>
                <div className="td-meta"><i className="fa-solid fa-clock"></i><span>{relTime(j.createdAt)}</span></div>
                {getActionBtns(j)}
              </div>
            );
          })}
        </div>)}

        {/* Service Requests Tab */}
        {tab === 'service-requests' && (<div>
          <h3 style={{marginBottom:'14px'}}>Assigned Service Requests ({serviceRequests.length})</h3>
          {serviceRequests.length === 0 ? (
            <div className="td-empty"><div className="td-empty-icon"><i className="fa-solid fa-wrench"></i></div><h4 style={{marginBottom:'6px'}}>No Assigned Service Requests</h4><p style={{fontSize:'13px'}}>Requests assigned by admin will appear here</p></div>
          ) : serviceRequests.map(sr => (
            <div key={sr._id} className="gc" style={{padding:'20px',marginBottom:'14px',borderLeft:`3px solid ${sr.status==='completed'?'var(--ok)':sr.status==='in-progress'?'var(--accent)':'var(--warn)'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'8px',marginBottom:'10px'}}>
                <div>
                  <h4 style={{fontSize:'15px',marginBottom:'2px'}}>{sr.customerName}</h4>
                  <span style={{fontSize:'12px',color:'var(--fg2)'}}>{sr.serviceName} · {sr.vehicleModel} · {sr.regNumber}</span>
                </div>
                <span className={'badge '+(sr.status==='completed'?'badge-ok':sr.status==='in-progress'?'badge-info':'badge-warn')}>{sr.status}</span>
              </div>
              <div style={{background:'var(--bg2)',padding:'12px',borderRadius:'var(--rs)',marginBottom:'10px'}}>
                <p style={{fontSize:'13px',color:'var(--fg2)',marginBottom:'6px'}}><strong>Issue:</strong> {sr.issueDescription}</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'6px',fontSize:'12px',color:'var(--fg2)'}}>
                  <span><i className="fa-solid fa-phone" style={{marginRight:'4px',color:'var(--accent)'}}></i>{sr.phone}</span>
                  <span><i className="fa-solid fa-car" style={{marginRight:'4px',color:'var(--accent)'}}></i>{sr.vehicleType}</span>
                  <span><i className="fa-solid fa-calendar" style={{marginRight:'4px',color:'var(--accent)'}}></i>{sr.preferredDate} {sr.preferredSlot}</span>
                  <span><i className="fa-solid fa-location-dot" style={{marginRight:'4px',color:'var(--accent)'}}></i>{sr.serviceLocation}{sr.pickupRequired ? ' (Pickup)' : ''}</span>
                </div>
              </div>
              {sr.technicianNotes && <p style={{fontSize:'12px',color:'var(--cyan)',marginBottom:'8px'}}><i className="fa-solid fa-note-sticky" style={{marginRight:'4px'}}></i>{sr.technicianNotes}</p>}
              {sr.estimatedCompletion && <p style={{fontSize:'12px',color:'var(--fg2)',marginBottom:'8px'}}>Est. Completion: {sr.estimatedCompletion}</p>}
              <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                {sr.status === 'confirmed' && <button className="btn-warn" style={{fontSize:'12px',padding:'8px 14px'}} onClick={() => updateSRStatus(sr._id,'in-progress')}><i className="fa-solid fa-play" style={{marginRight:'4px'}}></i>Start</button>}
                {sr.status === 'in-progress' && <button className="btn-p" style={{fontSize:'12px',padding:'8px 14px'}} onClick={() => updateSRStatus(sr._id,'completed')}><i className="fa-solid fa-check" style={{marginRight:'4px'}}></i>Complete</button>}
                {sr.status !== 'completed' && sr.status !== 'cancelled' && (
                  <button className="btn-s" style={{fontSize:'12px',padding:'8px 14px'}} onClick={() => {setNotesData({id:sr._id,notes:sr.technicianNotes||'',estimatedCompletion:sr.estimatedCompletion||''});setShowNotes(true);}}>
                    <i className="fa-solid fa-note-sticky" style={{marginRight:'4px'}}></i>Add Notes
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>)}

        {/* History Tab */}
        {tab === 'history' && (<div>
          {history.length === 0 ? (
            <div className="td-empty"><div className="td-empty-icon"><i className="fa-solid fa-clipboard-check"></i></div><h4 style={{marginBottom:'6px'}}>No Completed Jobs</h4><p style={{fontSize:'13px'}}>Completed jobs will appear here</p></div>
          ) : history.map(j => (
            <div key={j.sosId} className="gc td-job-card completed" style={{borderLeftColor:'var(--ok)',marginBottom:'14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'12px'}}>
                <div className="td-cust-avatar" style={{background:'linear-gradient(135deg,var(--ok),var(--accent2))'}}>{(j.customerName||'C').charAt(0)}</div>
                <div><h4 style={{fontSize:'15px',marginBottom:'2px'}}>{j.customerName||'Customer'}</h4><p style={{fontSize:'12px',color:'var(--fg2)'}}>{j.issueType}</p></div>
                <span className="td-pri completed" style={{marginLeft:'auto'}}>Done</span>
              </div>
              <div className="td-meta"><i className="fa-solid fa-clock"></i><span>{new Date(j.createdAt).toLocaleString()}</span></div>
              {j.completionReport && (
                <div style={{marginTop:'10px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                  <div className="td-meta"><i className="fa-solid fa-bug"></i><span style={{fontSize:'12px'}}>{j.completionReport.problem}</span></div>
                  <div className="td-meta"><i className="fa-solid fa-screwdriver-wrench"></i><span style={{fontSize:'12px'}}>{j.completionReport.fix}</span></div>
                  <div className="td-meta"><i className="fa-solid fa-indian-rupee-sign"></i><span style={{fontSize:'12px',fontWeight:700,color:'var(--accent)'}}>₹{j.completionReport.cost}</span></div>
                </div>
              )}
            </div>
          ))}
        </div>)}

        {tab === 'map' && (<div className="gc" style={{padding:'16px'}}><MapComponent center={[9.925,78.115]} zoom={13} stations={stations} style={{height:'400px'}} /></div>)}

        {tab === 'maintenance' && (<div>
          {stations.map(s => (
            <div key={s.stationId||s._id} className="td-maint-card">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:'12px'}}>
                <div><h4 style={{fontSize:'14px',marginBottom:'2px'}}>{s.name}</h4><p style={{color:'var(--fg2)',fontSize:'12px'}}>{s.location}</p></div>
                <span className={'badge '+(s.status==='available'?'badge-ok':s.status==='limited'?'badge-warn':'badge-err')}>{s.status}</span>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
                <div className="spc"><div className="spc-v">{s.availableSlots}/{s.totalSlots}</div><div className="spc-l">Slots</div></div>
                <div className="spc"><div className="spc-v">{s.power}kW</div><div className="spc-l">Power</div></div>
              </div>
            </div>
          ))}
        </div>)}
      </div>

      <Modal open={showServiceMod} onClose={() => setShowServiceMod(false)}>
        <h3 style={{marginBottom:'18px'}}>Service Report</h3>
        <input className="inp" placeholder="Problem found" style={{marginBottom:'10px'}} value={serviceReport.problem} onChange={e => setServiceReport({...serviceReport,problem:e.target.value})} />
        <input className="inp" placeholder="Fix applied" style={{marginBottom:'10px'}} value={serviceReport.fix} onChange={e => setServiceReport({...serviceReport,fix:e.target.value})} />
        <input className="inp" placeholder="Parts used" style={{marginBottom:'10px'}} value={serviceReport.parts} onChange={e => setServiceReport({...serviceReport,parts:e.target.value})} />
        <input type="number" className="inp" placeholder="Service cost (₹)" style={{marginBottom:'10px'}} value={serviceReport.cost} onChange={e => setServiceReport({...serviceReport,cost:e.target.value})} />
        <input className="inp" placeholder="Customer OTP (9999)" style={{marginBottom:'18px'}} value={serviceReport.otp} onChange={e => setServiceReport({...serviceReport,otp:e.target.value})} />
        <button className="btn-p" style={{width:'100%'}} onClick={submitReport}>Submit & Complete</button>
      </Modal>

      <Modal open={showNotes} onClose={() => setShowNotes(false)}>
        <h3 style={{marginBottom:'18px'}}><i className="fa-solid fa-note-sticky" style={{color:'var(--cyan)',marginRight:'8px'}}></i>Service Notes</h3>
        <textarea className="inp" placeholder="Technician notes..." rows={4} style={{marginBottom:'10px',resize:'vertical'}} value={notesData.notes} onChange={e => setNotesData({...notesData,notes:e.target.value})}></textarea>
        <input className="inp" placeholder="Estimated completion time (e.g., 2-3 hours)" style={{marginBottom:'14px'}} value={notesData.estimatedCompletion} onChange={e => setNotesData({...notesData,estimatedCompletion:e.target.value})} />
        <button className="btn-p" style={{width:'100%'}} onClick={saveNotes}>Save Notes</button>
      </Modal>
    </div>
  );
}
