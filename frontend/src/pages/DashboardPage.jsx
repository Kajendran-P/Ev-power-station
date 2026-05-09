import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';
import { getMyBookings } from '../services/bookingService';
import { getMySos } from '../services/sosService';
import { addToWallet } from '../services/authService';
import { getMyServiceRequests, getMyOrders, getMyPayments, getMyInvoices, rateServiceRequest, downloadInvoice, createPaymentOrder, verifyPayment, generateInvoice } from '../services/serviceApiService';

export default function DashboardPage() {
  const { user, logout, updateUser } = useAuth();
  const { toast } = useNotif();
  const navigate = useNavigate();
  const [tab, setTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [sosHistory, setSosHistory] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [addAmt, setAddAmt] = useState('');
  const [ratingData, setRatingData] = useState({ id: null, rating: 5, feedback: '' });
  const [showRate, setShowRate] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadAll();
  }, [user]);

  const loadAll = () => {
    getMyBookings().then(r => setBookings(r.data.bookings || [])).catch(() => {});
    getMySos().then(r => setSosHistory(r.data.requests || [])).catch(() => {});
    getMyServiceRequests().then(r => setServiceRequests(r.data.requests || [])).catch(() => {});
    getMyOrders().then(r => setOrders(r.data.orders || [])).catch(() => {});
    getMyPayments().then(r => setPayments(r.data.payments || [])).catch(() => {});
    getMyInvoices().then(r => setInvoices(r.data.invoices || [])).catch(() => {});
  };

  const handleAddMoney = async () => {
    const a = parseInt(addAmt);
    if (!a || a < 10) { toast('Min ₹10', 'err'); return; }
    try { const res = await addToWallet(a); updateUser({ walletBalance: res.data.walletBalance }); toast('₹' + a + ' added!'); setAddAmt(''); }
    catch (e) { toast('Error', 'err'); }
  };

  const handleRate = async () => {
    try {
      await rateServiceRequest(ratingData.id, { rating: ratingData.rating, feedback: ratingData.feedback });
      toast('Thank you for your feedback!');
      setShowRate(false);
      loadAll();
    } catch (e) { toast('Error', 'err'); }
  };

  const handleDownloadInvoice = async (invoiceId) => {
    try {
      const res = await downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast('Invoice downloaded');
    } catch (e) { toast('Download failed', 'err'); }
  };

  const handlePayService = async (sr) => {
    try {
      const payRes = await createPaymentOrder({ amount: sr.amount, type: 'service', relatedId: sr._id });
      const { orderId: rzpOrderId, keyId, paymentId } = payRes.data;
      const options = {
        key: keyId, amount: sr.amount * 100, currency: 'INR',
        name: 'K⚡R EV Charging Power Station', description: sr.serviceName || 'EV Service',
        order_id: rzpOrderId,
        handler: async (response) => {
          try {
            await verifyPayment({ razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature, paymentId });
            await generateInvoice({ serviceRequestId: sr._id, razorpayPaymentId: response.razorpay_payment_id });
            toast('Payment successful!'); loadAll();
          } catch (e) { toast('Payment verification failed', 'err'); }
        },
        prefill: { name: user?.name, email: user?.email, contact: user?.phone || '' },
        theme: { color: '#00F582' }
      };
      if (window.Razorpay) new window.Razorpay(options).open();
      else toast('Razorpay not loaded', 'err');
    } catch (e) { toast('Payment failed', 'err'); }
  };

  const statusBadge = (s) => {
    const m = { pending: 'badge-warn', confirmed: 'badge-info', 'in-progress': 'badge-warn', completed: 'badge-ok', cancelled: 'badge-err', paid: 'badge-ok', failed: 'badge-err', shipped: 'badge-info', delivered: 'badge-ok' };
    return m[s] || 'badge-warn';
  };

  if (!user) return null;

  const TABS = [
    { key: 'bookings', icon: 'fa-calendar-check', label: 'My Bookings' },
    { key: 'services', icon: 'fa-wrench', label: 'My Services' },
    { key: 'orders', icon: 'fa-box', label: 'My Orders' },
    { key: 'payments', icon: 'fa-credit-card', label: 'My Payments' },
    { key: 'sos', icon: 'fa-shield-halved', label: 'SOS History' },
    { key: 'profile', icon: 'fa-user', label: 'Profile' }
  ];

  return (
    <div className="pg">
      <div className="ctn">
        <div className="dash-g">
          <div className="gc sidebar">
            <div className="u-avatar">{user.name?.charAt(0).toUpperCase()}</div>
            <h3 style={{ textAlign: 'center', marginTop: '14px', fontSize: '17px' }}>{user.name}</h3>
            <p style={{ textAlign: 'center', color: 'var(--fg2)', fontSize: '13px' }}>{user.email || user.phone}</p>
            <div className="wallet-c">
              <p style={{ color: 'var(--fg2)', fontSize: '12px', marginBottom: '4px' }}>Wallet Balance</p>
              <div className="wallet-b">₹{(user.walletBalance || 0).toLocaleString()}</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <input type="number" className="inp" placeholder="Amount" style={{ fontSize: '13px', flex: 1 }} value={addAmt} onChange={e => setAddAmt(e.target.value)} />
                <button className="btn-p" style={{ padding: '8px 14px', fontSize: '13px' }} onClick={handleAddMoney}>Add</button>
              </div>
            </div>
            <div className="smenu">
              {TABS.map(t => (
                <div key={t.key} className={'smi' + (tab === t.key ? ' act' : '')} onClick={() => setTab(t.key)}>
                  <i className={`fa-solid ${t.icon}`}></i>{t.label}
                </div>
              ))}
              <div className="smi" onClick={() => { logout(); navigate('/login'); }}><i className="fa-solid fa-right-from-bracket"></i>Sign Out</div>
            </div>
          </div>
          <div>
            {/* Bookings Tab */}
            {tab === 'bookings' && (
              <div>
                <div className="sec-hd"><h2 className="sec-t">My Bookings</h2><span className="badge badge-info">{bookings.length} total</span></div>
                {bookings.length === 0 ? (
                  <div className="gc" style={{ padding: '48px', textAlign: 'center' }}><i className="fa-solid fa-calendar" style={{ fontSize: '36px', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}></i><p style={{ color: 'var(--fg2)' }}>No bookings yet</p><button className="btn-p" style={{ marginTop: '16px' }} onClick={() => navigate('/stations/book')}>Book Now</button></div>
                ) : (
                  <div className="dash-booking-list">
                    {bookings.map(b => (
                      <div key={b.bookingId} className="gc dash-booking-card">
                        {/* Card Header */}
                        <div className="dash-bk-header">
                          <div className="dash-bk-id">
                            <i className="fa-solid fa-bolt" style={{ color: 'var(--accent)', marginRight: '6px' }}></i>
                            <span>{b.bookingId}</span>
                          </div>
                          <span className={'badge ' + (b.status === 'upcoming' ? 'badge-info' : b.status === 'completed' ? 'badge-ok' : b.status === 'cancelled' ? 'badge-err' : 'badge-warn')}>{b.status}</span>
                        </div>

                        {/* Main Content Row */}
                        <div className="dash-bk-body">
                          {/* Left: Details */}
                          <div className="dash-bk-details">
                            <div className="dash-bk-station">
                              <i className="fa-solid fa-charging-station"></i>
                              <span>{b.stationName}</span>
                            </div>
                            <div className="dash-bk-info-grid">
                              <div className="dash-bk-info-item">
                                <i className="fa-solid fa-calendar"></i>
                                <span>{b.date}</span>
                              </div>
                              <div className="dash-bk-info-item">
                                <i className="fa-solid fa-clock"></i>
                                <span>{b.time} · {b.duration}min</span>
                              </div>
                              <div className="dash-bk-info-item">
                                <i className="fa-solid fa-car"></i>
                                <span>{b.vehicleNumberPlate || b.vehicleType || '—'}</span>
                              </div>
                              <div className="dash-bk-info-item">
                                <i className="fa-solid fa-bolt"></i>
                                <span>{b.chargerType === 'fast' ? 'Fast DC' : 'Normal AC'} · {b.slot}</span>
                              </div>
                            </div>
                          </div>

                          {/* Center: QR Code */}
                          <div className="dash-bk-qr-section">
                            <div className="dash-bk-qr-box">
                              <i className="fa-solid fa-qrcode"></i>
                            </div>
                            <span className="dash-bk-qr-label">Scan at Station</span>
                          </div>

                          {/* Right: Amount */}
                          <div className="dash-bk-amount">
                            <span className="dash-bk-price">₹{b.totalAmount?.toFixed(2)}</span>
                            <span className="dash-bk-price-label">Total</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Services Tab */}
            {tab === 'services' && (
              <div>
                <div className="sec-hd"><h2 className="sec-t">My Service Requests</h2><span className="badge badge-info">{serviceRequests.length} total</span></div>
                {serviceRequests.length === 0 ? (
                  <div className="gc" style={{ padding: '48px', textAlign: 'center' }}><i className="fa-solid fa-wrench" style={{ fontSize: '36px', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}></i><p style={{ color: 'var(--fg2)' }}>No service requests yet</p><button className="btn-p" style={{ marginTop: '16px' }} onClick={() => navigate('/services')}>Browse Services</button></div>
                ) : serviceRequests.map(sr => (
                  <div key={sr._id} className="gc" style={{ padding: '20px', marginBottom: '14px', borderLeft: `3px solid ${sr.status === 'completed' ? 'var(--ok)' : sr.status === 'cancelled' ? 'var(--err)' : 'var(--warn)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', marginBottom: '4px' }}>{sr.serviceName || 'EV Service'}</h4>
                        <span style={{ fontSize: '12px', color: 'var(--fg2)' }}>{sr.vehicleModel} · {sr.regNumber}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span className={`badge ${statusBadge(sr.status)}`}>{sr.status}</span>
                        <span className={`badge ${statusBadge(sr.paymentStatus)}`}>{sr.paymentStatus}</span>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '8px', fontSize: '13px', color: 'var(--fg2)', marginBottom: '10px' }}>
                      <span><i className="fa-solid fa-calendar" style={{ marginRight: '6px', color: 'var(--accent)' }}></i>{sr.preferredDate}</span>
                      <span><i className="fa-solid fa-clock" style={{ marginRight: '6px', color: 'var(--accent)' }}></i>{sr.preferredSlot}</span>
                      <span><i className="fa-solid fa-location-dot" style={{ marginRight: '6px', color: 'var(--accent)' }}></i>{sr.serviceLocation}</span>
                      {sr.technicianName && <span><i className="fa-solid fa-user-gear" style={{ marginRight: '6px', color: 'var(--cyan)' }}></i>{sr.technicianName}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {sr.paymentStatus === 'pending' && sr.status !== 'cancelled' && sr.amount > 0 && (
                        <button className="btn-p" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => handlePayService(sr)}>
                          <i className="fa-solid fa-credit-card" style={{ marginRight: '6px' }}></i>Pay ₹{sr.amount}
                        </button>
                      )}
                      {sr.status === 'completed' && !sr.rating && (
                        <button className="btn-s" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => { setRatingData({ id: sr._id, rating: 5, feedback: '' }); setShowRate(true); }}>
                          <i className="fa-solid fa-star" style={{ marginRight: '6px' }}></i>Rate Service
                        </button>
                      )}
                      {sr.invoiceId && (
                        <button className="btn-icon" onClick={() => handleDownloadInvoice(sr.invoiceId)} title="Download Invoice">
                          <i className="fa-solid fa-file-pdf" style={{ color: 'var(--accent)' }}></i>
                        </button>
                      )}
                      {sr.rating && <span style={{ fontSize: '13px', color: 'var(--warn)' }}>{'★'.repeat(sr.rating)}{'☆'.repeat(5 - sr.rating)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Orders Tab */}
            {tab === 'orders' && (
              <div>
                <div className="sec-hd"><h2 className="sec-t">My Orders</h2><span className="badge badge-info">{orders.length} total</span></div>
                {orders.length === 0 ? (
                  <div className="gc" style={{ padding: '48px', textAlign: 'center' }}><i className="fa-solid fa-box" style={{ fontSize: '36px', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}></i><p style={{ color: 'var(--fg2)' }}>No orders yet</p><button className="btn-p" style={{ marginTop: '16px' }} onClick={() => navigate('/spare-parts')}>Shop Parts</button></div>
                ) : orders.map(o => (
                  <div key={o._id} className="gc" style={{ padding: '20px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <div><h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Order #{o._id.slice(-8).toUpperCase()}</h4><span style={{ fontSize: '12px', color: 'var(--fg2)' }}>{new Date(o.createdAt).toLocaleDateString()}</span></div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span className={`badge ${statusBadge(o.orderStatus)}`}>{o.orderStatus}</span>
                        <span className={`badge ${statusBadge(o.paymentStatus)}`}>{o.paymentStatus}</span>
                      </div>
                    </div>
                    {o.items?.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px', borderBottom: '1px solid var(--border)' }}>
                        <span>{item.partName} × {item.quantity}</span>
                        <span style={{ fontWeight: 700 }}>₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent)' }}>Total: ₹{o.totalAmount?.toLocaleString()}</span>
                      {o.invoiceId && <button className="btn-icon" onClick={() => handleDownloadInvoice(o.invoiceId)} title="Download Invoice"><i className="fa-solid fa-file-pdf" style={{ color: 'var(--accent)' }}></i></button>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payments Tab */}
            {tab === 'payments' && (
              <div>
                <div className="sec-hd"><h2 className="sec-t">Payment History</h2><span className="badge badge-info">{payments.length} total</span></div>
                {payments.length === 0 ? (
                  <div className="gc" style={{ padding: '48px', textAlign: 'center' }}><p style={{ color: 'var(--fg2)' }}>No payments yet</p></div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="dtbl"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th><th>Razorpay ID</th></tr></thead><tbody>
                      {payments.map(p => (
                        <tr key={p._id}><td>{new Date(p.createdAt).toLocaleDateString()}</td><td><span className="badge badge-info">{p.type}</span></td><td style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{p.amount?.toLocaleString()}</td><td><span className={`badge ${statusBadge(p.status)}`}>{p.status}</span></td><td style={{ fontSize: '12px', color: 'var(--fg2)' }}>{p.razorpayPaymentId || '—'}</td></tr>
                      ))}
                    </tbody></table>
                  </div>
                )}
                {invoices.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <h3 style={{ marginBottom: '14px' }}><i className="fa-solid fa-file-invoice" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>My Invoices</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="dtbl"><thead><tr><th>Invoice #</th><th>Date</th><th>Amount</th><th>Download</th></tr></thead><tbody>
                        {invoices.map(inv => (
                          <tr key={inv._id}><td style={{ color: 'var(--accent)', fontWeight: 700 }}>{inv.invoiceNumber}</td><td>{new Date(inv.createdAt).toLocaleDateString()}</td><td style={{ fontWeight: 700 }}>₹{inv.totalAmount?.toLocaleString()}</td><td><button className="btn-p" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => handleDownloadInvoice(inv._id)}><i className="fa-solid fa-download" style={{ marginRight: '4px' }}></i>PDF</button></td></tr>
                        ))}
                      </tbody></table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SOS Tab */}
            {tab === 'sos' && (
              <div>
                <div className="sec-hd"><h2 className="sec-t">SOS History</h2><span className="badge badge-err">{sosHistory.length} requests</span></div>
                {sosHistory.length === 0 ? (
                  <div className="gc" style={{ padding: '48px', textAlign: 'center' }}><p style={{ color: 'var(--fg2)' }}>No SOS requests</p></div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="dtbl"><thead><tr><th>ID</th><th>Issue</th><th>Technician</th><th>Status</th><th>Date</th></tr></thead><tbody>
                      {sosHistory.map(s => (
                        <tr key={s.sosId}><td><span style={{ color: 'var(--accent)', fontWeight: 700 }}>{s.sosId}</span></td><td>{s.issueType}</td><td>{s.technicianName || '—'}</td><td><span className={'badge ' + (['completed'].includes(s.status) ? 'badge-ok' : ['cancelled'].includes(s.status) ? 'badge-err' : 'badge-warn')}>{s.status}</span></td><td>{new Date(s.createdAt).toLocaleDateString()}</td></tr>
                      ))}
                    </tbody></table>
                  </div>
                )}
              </div>
            )}

            {/* Profile Tab */}
            {tab === 'profile' && (
              <div className="gc" style={{ padding: '28px', maxWidth: '480px' }}>
                <h3 style={{ marginBottom: '18px' }}>Profile</h3>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--fg2)', fontSize: '13px' }}>Name</label>
                <input className="inp" defaultValue={user.name} readOnly style={{ marginBottom: '12px' }} />
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--fg2)', fontSize: '13px' }}>Email</label>
                <input className="inp" defaultValue={user.email || 'Not set'} readOnly style={{ marginBottom: '12px' }} />
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--fg2)', fontSize: '13px' }}>Phone</label>
                <input className="inp" defaultValue={user.phone || 'Not set'} readOnly style={{ marginBottom: '12px' }} />
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--fg2)', fontSize: '13px' }}>Role</label>
                <input className="inp" defaultValue={user.role} readOnly />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <div className={'modal-ov' + (showRate ? ' act' : '')} onClick={e => { if (e.target === e.currentTarget) setShowRate(false); }}>
        <div className="modal-c" style={{ maxWidth: '400px' }}>
          <h3 style={{ marginBottom: '18px' }}><i className="fa-solid fa-star" style={{ color: 'var(--warn)', marginRight: '8px' }}></i>Rate Service</h3>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '18px' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} style={{ fontSize: '32px', cursor: 'pointer', color: n <= ratingData.rating ? 'var(--warn)' : 'var(--muted)', transition: 'all .2s' }} onClick={() => setRatingData({ ...ratingData, rating: n })}>★</span>
            ))}
          </div>
          <textarea className="inp" placeholder="Your feedback (optional)" rows={3} style={{ resize: 'vertical', marginBottom: '14px' }} value={ratingData.feedback} onChange={e => setRatingData({ ...ratingData, feedback: e.target.value })}></textarea>
          <button className="btn-p" style={{ width: '100%' }} onClick={handleRate}>Submit Rating</button>
        </div>
      </div>
    </div>
  );
}
