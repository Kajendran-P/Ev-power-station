import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';
import { getStations, createStation, updateStation, deleteStation } from '../services/stationService';
import { getAdminStats, getWorkers, addWorker, deleteWorker, getChartData } from '../services/adminService';
import { getAllSos, updateSos, deleteSos } from '../services/sosService';
import { getServices, createService, updateServiceItem, deleteServiceItem, getSparePartsAdmin, createSparePart, updateSparePart, deleteSparePart, getAllServiceRequests, updateServiceRequest, assignTechnician, getAllOrders, updateOrder, getAllPayments, getContactMessages, updateContactMessage } from '../services/serviceApiService';
import Modal from '../components/Modal';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

const chartOpts = {responsive:true,plugins:{legend:{display:false}},scales:{x:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'#7A9E86'}},y:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'#7A9E86'}}}};
const VT_OPTS = ['ev-bike','ev-car','ev-3wheeler','ev-bus-truck','other'];
const SVC_CATS = ['battery','motor','controller','brake-suspension','tyre-wheel','charging-port','wiring-fuse','full-servicing','roadside-assistance'];
const PART_CATS = ['battery','motor','controller','charging','wiring','brake','tyre','sensor','display','other'];

export default function AdminPage() {
  const { user, loginEmail } = useAuth();
  const { toast } = useNotif();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({activeWorkers:0,totalRevenue:0,totalBookings:0,sosCount:0});
  const [stationList, setStationList] = useState([]);
  const [workerList, setWorkerList] = useState([]);
  const [sosList, setSosList] = useState([]);
  const [charts, setCharts] = useState(null);
  const [serviceList, setServiceList] = useState([]);
  const [partsList, setPartsList] = useState([]);
  const [serviceReqs, setServiceReqs] = useState([]);
  const [orderList, setOrderList] = useState([]);
  const [paymentList, setPaymentList] = useState([]);
  const [msgList, setMsgList] = useState([]);

  // Modals
  const [showAddSt, setShowAddSt] = useState(false);
  const [showEditSt, setShowEditSt] = useState(false);
  const [showAddW, setShowAddW] = useState(false);
  const [showAddSvc, setShowAddSvc] = useState(false);
  const [showEditSvc, setShowEditSvc] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);
  const [showEditPart, setShowEditPart] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const [editStation, setEditStation] = useState({});
  const [newStation, setNewStation] = useState({name:'',location:'',type:'fast-dc',typeName:'Fast DC',totalSlots:6,pricePerKwh:15,power:50});
  const [newWorker, setNewWorker] = useState({name:'',phone:'',specialization:'both'});
  const [newSvc, setNewSvc] = useState({name:'',category:'battery',description:'',price:0,estimatedTime:'',vehicleTypesSupported:['ev-bike'],icon:'fa-wrench'});
  const [editSvc, setEditSvc] = useState({});
  const [newPart, setNewPart] = useState({partName:'',category:'battery',description:'',price:0,stock:0,warranty:'',vehicleTypesSupported:['ev-bike'],discount:0});
  const [editPart, setEditPart] = useState({});
  const [assignData, setAssignData] = useState({reqId:'',techId:''});
  const [reqFilter, setReqFilter] = useState('all');

  const loadAll = useCallback(() => {
    getAdminStats().then(r => setStats(r.data.stats || {})).catch(() => {});
    getStations().then(r => setStationList(r.data.stations || [])).catch(() => {});
    getWorkers().then(r => setWorkerList(r.data.workers || [])).catch(() => {});
    getAllSos().then(r => setSosList(r.data.requests || [])).catch(() => {});
    getChartData().then(r => setCharts(r.data.charts || null)).catch(() => {});
    getServices({}).then(r => setServiceList(r.data.services || [])).catch(() => {});
    getSparePartsAdmin().then(r => setPartsList(r.data.parts || [])).catch(() => {});
    getAllServiceRequests({}).then(r => setServiceReqs(r.data.requests || [])).catch(() => {});
    getAllOrders().then(r => setOrderList(r.data.orders || [])).catch(() => {});
    getAllPayments().then(r => setPaymentList(r.data.payments || [])).catch(() => {});
    getContactMessages().then(r => setMsgList(r.data.messages || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (user && user.role === 'admin') { setIsLoggedIn(true); loadAll(); }
  }, [user]);

  const handleLogin = async () => {
    if (!email || !pass) { toast('Enter credentials', 'err'); return; }
    try { const res = await loginEmail(email, pass); if (res.user.role !== 'admin') { toast('Not admin', 'err'); return; } setIsLoggedIn(true); }
    catch (e) { toast('Invalid', 'err'); }
  };

  // Station handlers
  const handleAddStation = async () => { try { await createStation(newStation); setShowAddSt(false); loadAll(); toast('Station added'); } catch(e) { toast('Error','err'); } };
  const handleUpdateStation = async () => { try { await updateStation(editStation.stationId, editStation); setShowEditSt(false); loadAll(); toast('Updated'); } catch(e) { toast('Error','err'); } };
  const handleDeleteStation = async (id) => { if (!window.confirm('Delete?')) return; try { await deleteStation(id); loadAll(); toast('Deleted'); } catch(e) { toast('Error','err'); } };
  const handleAddWorker = async () => { try { await addWorker(newWorker); setShowAddW(false); loadAll(); toast('Technician added'); } catch(e) { toast('Error','err'); } };
  const handleDeleteWorker = async (id) => { if (!window.confirm('Remove?')) return; try { await deleteWorker(id); loadAll(); toast('Removed'); } catch(e) { toast('Error','err'); } };

  // Service CRUD
  const handleAddService = async () => { try { await createService(newSvc); setShowAddSvc(false); loadAll(); toast('Service added'); } catch(e) { toast('Error','err'); } };
  const handleUpdateService = async () => { try { await updateServiceItem(editSvc._id, editSvc); setShowEditSvc(false); loadAll(); toast('Updated'); } catch(e) { toast('Error','err'); } };
  const handleDeleteService = async (id) => { if (!window.confirm('Delete service?')) return; try { await deleteServiceItem(id); loadAll(); toast('Deleted'); } catch(e) { toast('Error','err'); } };

  // Part CRUD
  const handleAddPart = async () => { try { await createSparePart(newPart); setShowAddPart(false); loadAll(); toast('Part added'); } catch(e) { toast('Error','err'); } };
  const handleUpdatePart = async () => { try { await updateSparePart(editPart._id, editPart); setShowEditPart(false); loadAll(); toast('Updated'); } catch(e) { toast('Error','err'); } };
  const handleDeletePart = async (id) => { if (!window.confirm('Delete part?')) return; try { await deleteSparePart(id); loadAll(); toast('Deleted'); } catch(e) { toast('Error','err'); } };

  // Assign technician
  const handleAssign = async () => { try { await assignTechnician(assignData.reqId, { technicianId: assignData.techId }); setShowAssign(false); loadAll(); toast('Technician assigned'); } catch(e) { toast('Error','err'); } };

  // Update service request status
  const updateReqStatus = async (id, status) => { try { await updateServiceRequest(id, { status }); loadAll(); toast('Status updated'); } catch(e) { toast('Error','err'); } };

  // Update order status
  const updateOrderStatus = async (id, orderStatus) => { try { await updateOrder(id, { orderStatus }); loadAll(); toast('Updated'); } catch(e) { toast('Error','err'); } };

  // Update message
  const markMsgResolved = async (id) => { try { await updateContactMessage(id, { status: 'resolved' }); loadAll(); toast('Resolved'); } catch(e) { toast('Error','err'); } };

  const lowStockParts = partsList.filter(p => p.stock < 5);
  const pendingReqs = serviceReqs.filter(r => r.status === 'pending');
  const totalServiceRevenue = serviceReqs.filter(r => r.paymentStatus === 'paid').reduce((s, r) => s + (r.amount || 0), 0);
  const totalOrderRevenue = orderList.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + (o.totalAmount || 0), 0);

  if (!isLoggedIn) {
    return (
      <div className="pg"><div className="ctn"><div className="auth-wrap"><div className="auth-c"><div className="gc" style={{padding:'36px'}}>
        <h2 className="auth-t">Admin Login</h2><p style={{color:'var(--fg2)',marginBottom:'24px',fontSize:'14px'}}>Admin credentials required</p>
        <input type="email" className="inp" placeholder="Email" style={{marginBottom:'14px'}} value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" className="inp" placeholder="Password" style={{marginBottom:'18px'}} value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key==='Enter' && handleLogin()} />
        <button className="btn-p" style={{width:'100%'}} onClick={handleLogin}>Login</button>
        <p style={{textAlign:'center',marginTop:'12px',color:'var(--muted)',fontSize:'12px'}}>Demo: admin@ev.com / admin123</p>
      </div></div></div></div></div>
    );
  }

  const mkDataset = (data, color) => ({data,backgroundColor:color+'22',borderColor:color,borderWidth:2,tension:.4,fill:true,pointBackgroundColor:color,pointRadius:4});
  const TABS = ['overview','stations','workers','services','spare-parts','service-requests','orders','payments','messages','sos'];

  const filteredReqs = reqFilter === 'all' ? serviceReqs : serviceReqs.filter(r => r.status === reqFilter);

  return (
    <div className="pg">
      <div className="ctn">
        <h2 style={{fontSize:'24px',marginBottom:'6px'}}>Admin Dashboard</h2>
        <p style={{color:'var(--fg2)',marginBottom:'20px'}}>Manage your entire EV service network</p>

        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'20px'}}>
          {TABS.map(t => <button key={t} className={'ftab'+(tab===t?' act':'')} onClick={() => setTab(t)} style={{textTransform:'capitalize',fontSize:'12px'}}>{t.replace('-',' ')}</button>)}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (<>
          <div className="astats">
            {[['fa-plug','var(--accent)',stats.activeWorkers+' Active','Technicians'],
              ['fa-indian-rupee-sign','var(--cyan)','₹'+((stats.totalRevenue||0)+totalServiceRevenue+totalOrderRevenue).toLocaleString(),'Total Revenue'],
              ['fa-calendar-check','var(--purple)',stats.totalBookings,'Bookings'],
              ['fa-wrench','var(--warn)',serviceReqs.length,'Service Requests'],
              ['fa-box','#FF6B6B',orderList.length,'Spare Part Orders'],
              ['fa-shield-halved','var(--err)',stats.sosCount,'SOS Requests']
            ].map(([ic,cl,v,l],i)=>(
              <div className="gc" style={{padding:'20px'}} key={i}>
                <div className="astat-ic" style={{color:cl}}><i className={`fa-solid ${ic}`}></i></div>
                <div style={{fontSize:'24px',fontWeight:800,color:cl,fontFamily:"'Space Grotesk',sans-serif"}}>{v}</div>
                <div style={{fontSize:'12px',color:'var(--fg2)',textTransform:'uppercase',letterSpacing:'.6px'}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {(lowStockParts.length > 0 || pendingReqs.length > 0) && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'20px'}}>
              {lowStockParts.length > 0 && (
                <div className="gc" style={{padding:'18px',borderLeft:'3px solid var(--err)'}}>
                  <h4 style={{fontSize:'13px',color:'var(--err)',marginBottom:'8px'}}><i className="fa-solid fa-triangle-exclamation" style={{marginRight:'6px'}}></i>Low Stock Alert ({lowStockParts.length})</h4>
                  {lowStockParts.slice(0,3).map(p => <div key={p._id} style={{fontSize:'12px',color:'var(--fg2)',marginBottom:'4px'}}>{p.partName}: <span style={{color:'var(--err)',fontWeight:700}}>{p.stock}</span> left</div>)}
                </div>
              )}
              {pendingReqs.length > 0 && (
                <div className="gc" style={{padding:'18px',borderLeft:'3px solid var(--warn)'}}>
                  <h4 style={{fontSize:'13px',color:'var(--warn)',marginBottom:'8px'}}><i className="fa-solid fa-clock" style={{marginRight:'6px'}}></i>Pending Requests ({pendingReqs.length})</h4>
                  {pendingReqs.slice(0,3).map(r => <div key={r._id} style={{fontSize:'12px',color:'var(--fg2)',marginBottom:'4px'}}>{r.customerName} — {r.serviceName || 'Service'}</div>)}
                </div>
              )}
            </div>
          )}

          {charts && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'24px'}}>
              <div className="gc chart-wrap"><h4 style={{marginBottom:'12px',fontSize:'14px'}}>Revenue Trend</h4><Line data={{labels:charts.revenue.labels,datasets:[mkDataset(charts.revenue.data,'#00F582')]}} options={chartOpts} /></div>
              <div className="gc chart-wrap"><h4 style={{marginBottom:'12px',fontSize:'14px'}}>Station Usage</h4><Bar data={{labels:charts.usage.labels,datasets:[mkDataset(charts.usage.data,'#00E5FF')]}} options={chartOpts} /></div>
            </div>
          )}
        </>)}

        {/* Stations Tab */}
        {tab === 'stations' && (<div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'14px'}}><h3>Stations ({stationList.length})</h3><button className="btn-p" style={{fontSize:'13px',padding:'9px 18px'}} onClick={() => setShowAddSt(true)}><i className="fa-solid fa-plus" style={{marginRight:'6px'}}></i>Add Station</button></div>
          <div style={{overflowX:'auto'}}><table className="dtbl"><thead><tr><th>ID</th><th>Name</th><th>Location</th><th>Type</th><th>Slots</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {stationList.map(s => (<tr key={s.stationId||s._id}><td style={{color:'var(--accent)',fontWeight:700}}>{s.stationId}</td><td>{s.name}</td><td>{s.location}</td><td><span className="badge badge-info">{s.typeName||s.type}</span></td><td>{s.availableSlots}/{s.totalSlots}</td><td>₹{s.pricePerKwh}</td><td><span className={'badge '+(s.status==='available'?'badge-ok':s.status==='limited'?'badge-warn':'badge-err')}>{s.status}</span></td>
              <td><button className="btn-icon" onClick={() => {setEditStation({...s});setShowEditSt(true);}}><i className="fa-solid fa-pen"></i></button><button className="btn-icon" style={{marginLeft:'4px'}} onClick={() => handleDeleteStation(s.stationId)}><i className="fa-solid fa-trash" style={{color:'var(--err)'}}></i></button></td></tr>))}
          </tbody></table></div>
        </div>)}

        {/* Workers Tab */}
        {tab === 'workers' && (<div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'14px'}}><h3>Technicians ({workerList.length})</h3><button className="btn-p" style={{fontSize:'13px',padding:'9px 18px'}} onClick={() => setShowAddW(true)}><i className="fa-solid fa-plus" style={{marginRight:'6px'}}></i>Add Technician</button></div>
          <div style={{overflowX:'auto'}}><table className="dtbl"><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Earnings</th><th>Actions</th></tr></thead><tbody>
            {workerList.map(w => (<tr key={w._id}><td>{w.name}</td><td>{w.phone}</td><td>{w.email}</td><td style={{color:'var(--accent)',fontWeight:700}}>₹{(w.walletBalance||0).toLocaleString()}</td><td><button className="btn-icon" onClick={() => handleDeleteWorker(w._id)}><i className="fa-solid fa-trash" style={{color:'var(--err)'}}></i></button></td></tr>))}
          </tbody></table></div>
        </div>)}

        {/* Services Tab */}
        {tab === 'services' && (<div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'14px'}}><h3>Services ({serviceList.length})</h3><button className="btn-p" style={{fontSize:'13px',padding:'9px 18px'}} onClick={() => setShowAddSvc(true)}><i className="fa-solid fa-plus" style={{marginRight:'6px'}}></i>Add Service</button></div>
          <div style={{overflowX:'auto'}}><table className="dtbl"><thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Time</th><th>Vehicles</th><th>Actions</th></tr></thead><tbody>
            {serviceList.map(s => (<tr key={s._id}><td>{s.name}</td><td><span className="badge badge-info">{s.category}</span></td><td style={{fontWeight:700}}>₹{s.price}</td><td>{s.estimatedTime}</td><td style={{fontSize:'11px'}}>{s.vehicleTypesSupported?.join(', ')}</td>
              <td style={{display:'flex',gap:'4px'}}><button className="btn-icon" onClick={() => {setEditSvc({...s});setShowEditSvc(true);}}><i className="fa-solid fa-pen"></i></button><button className="btn-icon" onClick={() => handleDeleteService(s._id)}><i className="fa-solid fa-trash" style={{color:'var(--err)'}}></i></button></td></tr>))}
          </tbody></table></div>
        </div>)}

        {/* Spare Parts Tab */}
        {tab === 'spare-parts' && (<div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'14px'}}><h3>Spare Parts ({partsList.length})</h3><button className="btn-p" style={{fontSize:'13px',padding:'9px 18px'}} onClick={() => setShowAddPart(true)}><i className="fa-solid fa-plus" style={{marginRight:'6px'}}></i>Add Part</button></div>
          <div style={{overflowX:'auto'}}><table className="dtbl"><thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Warranty</th><th>Discount</th><th>Actions</th></tr></thead><tbody>
            {partsList.map(p => (<tr key={p._id}><td>{p.partName}</td><td><span className="badge badge-info">{p.category}</span></td><td style={{fontWeight:700}}>₹{p.price?.toLocaleString()}</td><td style={{color:p.stock<5?'var(--err)':'var(--fg)',fontWeight:700}}>{p.stock}</td><td>{p.warranty||'—'}</td><td>{p.discount>0?p.discount+'%':'—'}</td>
              <td style={{display:'flex',gap:'4px'}}><button className="btn-icon" onClick={() => {setEditPart({...p});setShowEditPart(true);}}><i className="fa-solid fa-pen"></i></button><button className="btn-icon" onClick={() => handleDeletePart(p._id)}><i className="fa-solid fa-trash" style={{color:'var(--err)'}}></i></button></td></tr>))}
          </tbody></table></div>
        </div>)}

        {/* Service Requests Tab */}
        {tab === 'service-requests' && (<div>
          <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'10px',marginBottom:'14px'}}>
            <h3>Service Requests ({serviceReqs.length})</h3>
            <select className="inp" style={{maxWidth:'160px',padding:'8px'}} value={reqFilter} onChange={e => setReqFilter(e.target.value)}>
              <option value="all">All Status</option><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="in-progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
            </select>
          </div>
          {filteredReqs.map(r => (
            <div key={r._id} className="gc" style={{padding:'18px',marginBottom:'12px',borderLeft:`3px solid ${r.status==='completed'?'var(--ok)':r.status==='cancelled'?'var(--err)':'var(--warn)'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'8px',marginBottom:'8px'}}>
                <div><h4 style={{fontSize:'14px',marginBottom:'2px'}}>{r.customerName}</h4><span style={{fontSize:'12px',color:'var(--fg2)'}}>{r.serviceName || 'Service'} · {r.vehicleModel} · {r.regNumber}</span></div>
                <div style={{display:'flex',gap:'6px'}}><span className={'badge '+(r.status==='completed'?'badge-ok':r.status==='cancelled'?'badge-err':'badge-warn')}>{r.status}</span><span className={'badge '+(r.paymentStatus==='paid'?'badge-ok':'badge-warn')}>{r.paymentStatus}</span></div>
              </div>
              <p style={{fontSize:'12px',color:'var(--fg2)',marginBottom:'8px'}}><i className="fa-solid fa-comment" style={{marginRight:'6px'}}></i>{r.issueDescription}</p>
              <div style={{display:'flex',gap:'14px',fontSize:'12px',color:'var(--fg2)',marginBottom:'10px',flexWrap:'wrap'}}>
                <span><i className="fa-solid fa-phone" style={{marginRight:'4px'}}></i>{r.phone}</span>
                <span><i className="fa-solid fa-calendar" style={{marginRight:'4px'}}></i>{r.preferredDate} {r.preferredSlot}</span>
                <span><i className="fa-solid fa-location-dot" style={{marginRight:'4px'}}></i>{r.serviceLocation}</span>
                {r.pickupRequired && <span className="badge badge-warn">Pickup</span>}
                {r.technicianName && <span><i className="fa-solid fa-user-gear" style={{marginRight:'4px',color:'var(--cyan)'}}></i>{r.technicianName}</span>}
              </div>
              <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                {!r.technicianId && <button className="btn-p" style={{fontSize:'11px',padding:'6px 12px'}} onClick={() => {setAssignData({reqId:r._id,techId:''});setShowAssign(true);}}>Assign Tech</button>}
                {r.status === 'pending' && <button className="btn-s" style={{fontSize:'11px',padding:'6px 12px'}} onClick={() => updateReqStatus(r._id,'confirmed')}>Confirm</button>}
                {r.status === 'confirmed' && <button className="btn-warn" style={{fontSize:'11px',padding:'6px 12px'}} onClick={() => updateReqStatus(r._id,'in-progress')}>Start</button>}
                {r.status === 'in-progress' && <button className="btn-p" style={{fontSize:'11px',padding:'6px 12px'}} onClick={() => updateReqStatus(r._id,'completed')}>Complete</button>}
                {r.status !== 'cancelled' && r.status !== 'completed' && <button className="btn-d" style={{fontSize:'11px',padding:'6px 12px'}} onClick={() => updateReqStatus(r._id,'cancelled')}>Cancel</button>}
              </div>
            </div>
          ))}
        </div>)}

        {/* Orders Tab */}
        {tab === 'orders' && (<div>
          <h3 style={{marginBottom:'14px'}}>Orders ({orderList.length})</h3>
          <div style={{overflowX:'auto'}}><table className="dtbl"><thead><tr><th>Order ID</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {orderList.map(o => (<tr key={o._id}><td style={{fontSize:'12px',color:'var(--accent)',fontWeight:700}}>#{o._id.slice(-6)}</td><td>{o.customerId?.name||'—'}</td><td style={{fontSize:'12px'}}>{o.items?.map(i=>i.partName).join(', ')}</td><td style={{fontWeight:700}}>₹{o.totalAmount?.toLocaleString()}</td><td><span className={'badge '+(o.paymentStatus==='paid'?'badge-ok':'badge-warn')}>{o.paymentStatus}</span></td><td><span className={'badge '+(o.orderStatus==='delivered'?'badge-ok':o.orderStatus==='cancelled'?'badge-err':'badge-warn')}>{o.orderStatus}</span></td>
              <td><select className="inp" style={{padding:'4px 8px',fontSize:'11px',maxWidth:'100px'}} value={o.orderStatus} onChange={e => updateOrderStatus(o._id, e.target.value)}>
                <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option>
              </select></td></tr>))}
          </tbody></table></div>
        </div>)}

        {/* Payments Tab */}
        {tab === 'payments' && (<div>
          <h3 style={{marginBottom:'14px'}}>All Payments ({paymentList.length})</h3>
          <div style={{overflowX:'auto'}}><table className="dtbl"><thead><tr><th>Date</th><th>Customer</th><th>Type</th><th>Amount</th><th>Status</th><th>Razorpay ID</th></tr></thead><tbody>
            {paymentList.map(p => (<tr key={p._id}><td>{new Date(p.createdAt).toLocaleDateString()}</td><td>{p.customerId?.name||'—'}</td><td><span className="badge badge-info">{p.type}</span></td><td style={{fontWeight:700,color:'var(--accent)'}}>₹{p.amount?.toLocaleString()}</td><td><span className={'badge '+(p.status==='paid'?'badge-ok':p.status==='failed'?'badge-err':'badge-warn')}>{p.status}</span></td><td style={{fontSize:'11px',color:'var(--fg2)'}}>{p.razorpayPaymentId||'—'}</td></tr>))}
          </tbody></table></div>
        </div>)}

        {/* Messages Tab */}
        {tab === 'messages' && (<div>
          <h3 style={{marginBottom:'14px'}}>Contact Messages ({msgList.length})</h3>
          {msgList.map(m => (
            <div key={m._id} className="gc" style={{padding:'18px',marginBottom:'12px',borderLeft:`3px solid ${m.status==='resolved'?'var(--ok)':'var(--warn)'}`}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                <div><h4 style={{fontSize:'14px'}}>{m.name}</h4><span style={{fontSize:'12px',color:'var(--fg2)'}}>{m.email} · {m.phone||'No phone'}</span></div>
                <div style={{display:'flex',gap:'6px',alignItems:'center'}}><span className={'badge '+(m.status==='resolved'?'badge-ok':m.status==='read'?'badge-info':'badge-warn')}>{m.status}</span><span style={{fontSize:'11px',color:'var(--fg2)'}}>{new Date(m.createdAt).toLocaleDateString()}</span></div>
              </div>
              <p style={{fontSize:'13px',color:'var(--fg2)',marginBottom:'10px'}}>{m.message}</p>
              {m.status !== 'resolved' && <button className="btn-p" style={{fontSize:'11px',padding:'6px 14px'}} onClick={() => markMsgResolved(m._id)}>Mark Resolved</button>}
            </div>
          ))}
        </div>)}

        {/* SOS Tab */}
        {tab === 'sos' && (<div>
          <h3 style={{marginBottom:'14px'}}>SOS Requests ({sosList.length})</h3>
          <div style={{overflowX:'auto'}}><table className="dtbl"><thead><tr><th>ID</th><th>Customer</th><th>Issue</th><th>Technician</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {sosList.map(s => (<tr key={s.sosId}><td style={{color:'var(--accent)',fontWeight:700}}>{s.sosId}</td><td>{s.customerName}</td><td>{s.issueType}</td><td>{s.technicianName||'—'}</td><td><span className={'badge '+(s.status==='completed'?'badge-ok':'badge-warn')}>{s.status?.replace('_',' ')}</span></td>
              <td style={{display:'flex',gap:'4px'}}><button className="btn-icon" onClick={() => { updateSos(s.sosId,{status:'completed'}); loadAll(); toast('Closed'); }}><i className="fa-solid fa-check-double" style={{color:'var(--warn)'}}></i></button><button className="btn-icon" onClick={async () => { if(window.confirm('Delete?')) { await deleteSos(s.sosId); loadAll(); toast('Deleted'); }}}><i className="fa-solid fa-trash" style={{color:'var(--err)'}}></i></button></td></tr>))}
          </tbody></table></div>
        </div>)}
      </div>

      {/* ===== MODALS ===== */}
      <Modal open={showAddSt} onClose={() => setShowAddSt(false)}>
        <h3 style={{marginBottom:'18px'}}>Add New Station</h3>
        <input className="inp" placeholder="Station Name" style={{marginBottom:'10px'}} value={newStation.name} onChange={e => setNewStation({...newStation,name:e.target.value})} />
        <input className="inp" placeholder="Location" style={{marginBottom:'10px'}} value={newStation.location} onChange={e => setNewStation({...newStation,location:e.target.value})} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}><input type="number" className="inp" placeholder="Slots" value={newStation.totalSlots} onChange={e => setNewStation({...newStation,totalSlots:parseInt(e.target.value)||6})} /><input type="number" className="inp" placeholder="Price/kWh" value={newStation.pricePerKwh} onChange={e => setNewStation({...newStation,pricePerKwh:parseFloat(e.target.value)||15})} /></div>
        <button className="btn-p" style={{width:'100%'}} onClick={handleAddStation}>Add Station</button>
      </Modal>
      <Modal open={showEditSt} onClose={() => setShowEditSt(false)}>
        <h3 style={{marginBottom:'18px'}}>Edit Station</h3>
        <input className="inp" placeholder="Name" style={{marginBottom:'10px'}} value={editStation.name||''} onChange={e => setEditStation({...editStation,name:e.target.value})} />
        <input className="inp" placeholder="Location" style={{marginBottom:'10px'}} value={editStation.location||''} onChange={e => setEditStation({...editStation,location:e.target.value})} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}><input type="number" className="inp" placeholder="Slots" value={editStation.totalSlots||0} onChange={e => setEditStation({...editStation,totalSlots:parseInt(e.target.value)})} /><input type="number" className="inp" placeholder="Price" value={editStation.pricePerKwh||0} onChange={e => setEditStation({...editStation,pricePerKwh:parseFloat(e.target.value)})} /></div>
        <button className="btn-p" style={{width:'100%'}} onClick={handleUpdateStation}>Update</button>
      </Modal>
      <Modal open={showAddW} onClose={() => setShowAddW(false)}>
        <h3 style={{marginBottom:'18px'}}>Add Technician</h3>
        <input className="inp" placeholder="Full Name" style={{marginBottom:'10px'}} value={newWorker.name} onChange={e => setNewWorker({...newWorker,name:e.target.value})} />
        <input className="inp" placeholder="Phone" style={{marginBottom:'10px'}} value={newWorker.phone} onChange={e => setNewWorker({...newWorker,phone:e.target.value})} />
        <button className="btn-p" style={{width:'100%'}} onClick={handleAddWorker}>Add Technician</button>
      </Modal>
      <Modal open={showAddSvc} onClose={() => setShowAddSvc(false)}>
        <h3 style={{marginBottom:'18px'}}>Add Service</h3>
        <input className="inp" placeholder="Service Name" style={{marginBottom:'10px'}} value={newSvc.name} onChange={e => setNewSvc({...newSvc,name:e.target.value})} />
        <select className="inp" style={{marginBottom:'10px'}} value={newSvc.category} onChange={e => setNewSvc({...newSvc,category:e.target.value})}>{SVC_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <textarea className="inp" placeholder="Description" style={{marginBottom:'10px',resize:'vertical'}} rows={2} value={newSvc.description} onChange={e => setNewSvc({...newSvc,description:e.target.value})}></textarea>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}><input type="number" className="inp" placeholder="Price (₹)" value={newSvc.price} onChange={e => setNewSvc({...newSvc,price:parseInt(e.target.value)||0})} /><input className="inp" placeholder="Est. Time" value={newSvc.estimatedTime} onChange={e => setNewSvc({...newSvc,estimatedTime:e.target.value})} /></div>
        <label style={{fontSize:'12px',color:'var(--fg2)',marginBottom:'4px',display:'block'}}>Vehicle Types</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'14px'}}>{VT_OPTS.map(v => <label key={v} style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'12px',cursor:'pointer'}}><input type="checkbox" checked={newSvc.vehicleTypesSupported?.includes(v)} onChange={e => { const vts = e.target.checked ? [...(newSvc.vehicleTypesSupported||[]),v] : (newSvc.vehicleTypesSupported||[]).filter(x=>x!==v); setNewSvc({...newSvc,vehicleTypesSupported:vts}); }} />{v}</label>)}</div>
        <button className="btn-p" style={{width:'100%'}} onClick={handleAddService}>Add Service</button>
      </Modal>
      <Modal open={showEditSvc} onClose={() => setShowEditSvc(false)}>
        <h3 style={{marginBottom:'18px'}}>Edit Service</h3>
        <input className="inp" placeholder="Name" style={{marginBottom:'10px'}} value={editSvc.name||''} onChange={e => setEditSvc({...editSvc,name:e.target.value})} />
        <select className="inp" style={{marginBottom:'10px'}} value={editSvc.category||''} onChange={e => setEditSvc({...editSvc,category:e.target.value})}>{SVC_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <textarea className="inp" placeholder="Description" style={{marginBottom:'10px',resize:'vertical'}} rows={2} value={editSvc.description||''} onChange={e => setEditSvc({...editSvc,description:e.target.value})}></textarea>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}><input type="number" className="inp" placeholder="Price" value={editSvc.price||0} onChange={e => setEditSvc({...editSvc,price:parseInt(e.target.value)||0})} /><input className="inp" placeholder="Est. Time" value={editSvc.estimatedTime||''} onChange={e => setEditSvc({...editSvc,estimatedTime:e.target.value})} /></div>
        <button className="btn-p" style={{width:'100%'}} onClick={handleUpdateService}>Update</button>
      </Modal>
      <Modal open={showAddPart} onClose={() => setShowAddPart(false)}>
        <h3 style={{marginBottom:'18px'}}>Add Spare Part</h3>
        <input className="inp" placeholder="Part Name" style={{marginBottom:'10px'}} value={newPart.partName} onChange={e => setNewPart({...newPart,partName:e.target.value})} />
        <select className="inp" style={{marginBottom:'10px'}} value={newPart.category} onChange={e => setNewPart({...newPart,category:e.target.value})}>{PART_CATS.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <textarea className="inp" placeholder="Description" style={{marginBottom:'10px',resize:'vertical'}} rows={2} value={newPart.description} onChange={e => setNewPart({...newPart,description:e.target.value})}></textarea>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
          <input type="number" className="inp" placeholder="Price (₹)" value={newPart.price} onChange={e => setNewPart({...newPart,price:parseInt(e.target.value)||0})} />
          <input type="number" className="inp" placeholder="Stock" value={newPart.stock} onChange={e => setNewPart({...newPart,stock:parseInt(e.target.value)||0})} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
          <input className="inp" placeholder="Warranty" value={newPart.warranty} onChange={e => setNewPart({...newPart,warranty:e.target.value})} />
          <input type="number" className="inp" placeholder="Discount %" value={newPart.discount} onChange={e => setNewPart({...newPart,discount:parseInt(e.target.value)||0})} />
        </div>
        <label style={{fontSize:'12px',color:'var(--fg2)',marginBottom:'4px',display:'block'}}>Vehicle Types</label>
        <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'14px'}}>{VT_OPTS.map(v => <label key={v} style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'12px',cursor:'pointer'}}><input type="checkbox" checked={newPart.vehicleTypesSupported?.includes(v)} onChange={e => { const vts = e.target.checked ? [...(newPart.vehicleTypesSupported||[]),v] : (newPart.vehicleTypesSupported||[]).filter(x=>x!==v); setNewPart({...newPart,vehicleTypesSupported:vts}); }} />{v}</label>)}</div>
        <button className="btn-p" style={{width:'100%'}} onClick={handleAddPart}>Add Part</button>
      </Modal>
      <Modal open={showEditPart} onClose={() => setShowEditPart(false)}>
        <h3 style={{marginBottom:'18px'}}>Edit Spare Part</h3>
        <input className="inp" placeholder="Part Name" style={{marginBottom:'10px'}} value={editPart.partName||''} onChange={e => setEditPart({...editPart,partName:e.target.value})} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'10px'}}>
          <input type="number" className="inp" placeholder="Price" value={editPart.price||0} onChange={e => setEditPart({...editPart,price:parseInt(e.target.value)||0})} />
          <input type="number" className="inp" placeholder="Stock" value={editPart.stock||0} onChange={e => setEditPart({...editPart,stock:parseInt(e.target.value)||0})} />
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}}>
          <input className="inp" placeholder="Warranty" value={editPart.warranty||''} onChange={e => setEditPart({...editPart,warranty:e.target.value})} />
          <input type="number" className="inp" placeholder="Discount %" value={editPart.discount||0} onChange={e => setEditPart({...editPart,discount:parseInt(e.target.value)||0})} />
        </div>
        <button className="btn-p" style={{width:'100%'}} onClick={handleUpdatePart}>Update</button>
      </Modal>
      <Modal open={showAssign} onClose={() => setShowAssign(false)}>
        <h3 style={{marginBottom:'18px'}}>Assign Technician</h3>
        <select className="inp" style={{marginBottom:'14px'}} value={assignData.techId} onChange={e => setAssignData({...assignData,techId:e.target.value})}>
          <option value="">Select Technician</option>
          {workerList.map(w => <option key={w._id} value={w._id}>{w.name} ({w.phone})</option>)}
        </select>
        <button className="btn-p" style={{width:'100%'}} onClick={handleAssign}>Assign</button>
      </Modal>
    </div>
  );
}
