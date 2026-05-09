import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';
import { getServices, createServiceRequest, sendContactMessage } from '../services/serviceApiService';
import Modal from '../components/Modal';

const VEHICLE_TYPES = [
  { key: 'all', label: 'All Vehicles', icon: 'fa-layer-group' },
  { key: 'ev-bike', label: 'EV Bike', icon: 'fa-motorcycle' },
  { key: 'ev-car', label: 'EV Car', icon: 'fa-car' },
  { key: 'ev-3wheeler', label: 'EV 3-Wheeler', icon: 'fa-truck-monster' },
  { key: 'ev-bus-truck', label: 'EV Bus / Truck', icon: 'fa-bus' },
  { key: 'other', label: 'Other EV', icon: 'fa-charging-station' }
];

const CATEGORIES = [
  { key: 'all', label: 'All Services', icon: 'fa-th-large' },
  { key: 'battery', label: 'Battery', icon: 'fa-battery-half' },
  { key: 'motor', label: 'Motor', icon: 'fa-gear' },
  { key: 'controller', label: 'Controller', icon: 'fa-microchip' },
  { key: 'brake-suspension', label: 'Brake & Suspension', icon: 'fa-gauge-high' },
  { key: 'tyre-wheel', label: 'Tyre & Wheel', icon: 'fa-circle-dot' },
  { key: 'charging-port', label: 'Charging Port', icon: 'fa-plug' },
  { key: 'wiring-fuse', label: 'Wiring & Fuse', icon: 'fa-code-branch' },
  { key: 'full-servicing', label: 'Full Service', icon: 'fa-car-side' },
  { key: 'roadside-assistance', label: 'Roadside Assist', icon: 'fa-screwdriver-wrench' }
];

const TIME_SLOTS = ['9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM'];

export default function ServicesPage() {
  const { user } = useAuth();
  const { toast } = useNotif();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [vehicleType, setVehicleType] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showApply, setShowApply] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    customerName: '', phone: '', email: '', vehicleType: 'ev-bike',
    vehicleModel: '', regNumber: '', issueDescription: '',
    preferredDate: '', preferredSlot: '', pickupRequired: false,
    serviceLocation: 'station', vehicleImage: null
  });

  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });

  useEffect(() => {
    loadServices();
  }, [vehicleType, category, search]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const params = {};
      if (vehicleType !== 'all') params.vehicleType = vehicleType;
      if (category !== 'all') params.category = category;
      if (search) params.search = search;
      const res = await getServices(params);
      setServices(res.data.services || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openApply = (svc) => {
    if (!user) { toast('Please sign in first', 'err'); navigate('/login'); return; }
    setSelectedService(svc);
    setForm(f => ({ ...f, customerName: user.name || '', email: user.email || '', phone: user.phone || '' }));
    setShowApply(true);
  };

  const handleApply = async () => {
    if (!form.customerName || !form.phone || !form.vehicleModel || !form.regNumber || !form.issueDescription || !form.preferredDate || !form.preferredSlot) {
      toast('Please fill all required fields', 'err'); return;
    }
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'vehicleImage' && v) fd.append('vehicleImage', v);
        else fd.append(k, v);
      });
      fd.append('serviceId', selectedService._id);
      fd.append('serviceName', selectedService.name);
      fd.append('amount', selectedService.price);
      await createServiceRequest(fd);
      toast('Service request submitted successfully!');
      setShowApply(false);
      setForm({ customerName: '', phone: '', email: '', vehicleType: 'ev-bike', vehicleModel: '', regNumber: '', issueDescription: '', preferredDate: '', preferredSlot: '', pickupRequired: false, serviceLocation: 'station', vehicleImage: null });
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to submit request', 'err');
    }
  };

  const handleContact = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) { toast('Fill required fields', 'err'); return; }
    try {
      await sendContactMessage(contactForm);
      toast('Message sent successfully!');
      setShowContact(false);
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (e) { toast('Failed to send', 'err'); }
  };

  const getCategoryColor = (cat) => {
    const colors = { battery: 'var(--accent)', motor: 'var(--cyan)', controller: 'var(--purple)', 'brake-suspension': 'var(--warn)', 'tyre-wheel': '#FF6B6B', 'charging-port': '#4ecdc4', 'wiring-fuse': '#FFE66D', 'full-servicing': 'var(--accent)', 'roadside-assistance': 'var(--err)' };
    return colors[cat] || 'var(--accent)';
  };

  return (
    <div className="pg">
      <div className="ctn">
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="hero-eyebrow"><i className="fa-solid fa-wrench"></i> Professional EV Service</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', marginBottom: '8px' }}>
            EV Service & <span style={{ background: 'linear-gradient(135deg,var(--accent),var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Repair Center</span>
          </h2>
          <p style={{ color: 'var(--fg2)', maxWidth: '600px', margin: '0 auto', fontSize: '15px' }}>
            Professional service for all EV types — Bikes, Cars, 3-Wheelers, Buses & more
          </p>
        </div>
        
        {/* Vehicle Type Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
          {VEHICLE_TYPES.map(v => (
            <button key={v.key} className={'ftab' + (vehicleType === v.key ? ' act' : '')} onClick={() => setVehicleType(v.key)}>
              <i className={`fa-solid ${v.icon}`} style={{ marginRight: '6px' }}></i>{v.label}
            </button>
          ))}
        </div>

        {/* Search + Category Filter */}
        <div className="filter-bar" style={{ marginBottom: '24px' }}>
          <div className="search-wrap" style={{ maxWidth: '400px' }}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input className="inp" placeholder="Search services..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="inp" value={category} onChange={e => setCategory(e.target.value)} style={{ maxWidth: '200px' }}>
            {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>

        {/* Category Quick Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '10px', marginBottom: '28px' }}>
          {CATEGORIES.slice(1).map(c => (
            <div key={c.key} className={'gc svc-cat-card' + (category === c.key ? ' active' : '')} onClick={() => setCategory(category === c.key ? 'all' : c.key)}
              style={{ padding: '14px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all .25s', borderColor: category === c.key ? getCategoryColor(c.key) : undefined }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${getCategoryColor(c.key)}15`, border: `1px solid ${getCategoryColor(c.key)}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <i className={`fa-solid ${c.icon}`} style={{ color: getCategoryColor(c.key), fontSize: '16px' }}></i>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: category === c.key ? 'var(--fg)' : 'var(--fg2)' }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Service Cards */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--fg2)' }}>
            <div className="spin-ring" style={{ width: '40px', height: '40px', margin: '0 auto 14px' }}></div>
            Loading services...
          </div>
        ) : services.length === 0 ? (
          <div className="gc" style={{ padding: '60px', textAlign: 'center' }}>
            <i className="fa-solid fa-wrench" style={{ fontSize: '40px', color: 'var(--muted)', marginBottom: '14px', display: 'block' }}></i>
            <p style={{ color: 'var(--fg2)' }}>No services found for this filter</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px', marginBottom: '40px' }}>
            {services.map(s => (
              <div key={s._id} className="gc svc-card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${getCategoryColor(s.category)}, transparent)` }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div className="svc-ic" style={{ background: `${getCategoryColor(s.category)}12`, borderColor: `${getCategoryColor(s.category)}25` }}>
                    <i className={`fa-solid ${s.icon || 'fa-wrench'}`} style={{ color: getCategoryColor(s.category) }}></i>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '15px', marginBottom: '2px' }}>{s.name}</h4>
                    <span className="badge badge-info" style={{ fontSize: '9px' }}>{s.category.replace('-', ' ')}</span>
                  </div>
                </div>
                <p style={{ color: 'var(--fg2)', fontSize: '13px', lineHeight: '1.55', marginBottom: '12px', minHeight: '40px' }}>{s.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                  {(s.vehicleTypesSupported || []).map(vt => (
                    <span key={vt} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: 'var(--bg2)', color: 'var(--fg2)', border: '1px solid var(--border)' }}>
                      {VEHICLE_TYPES.find(v => v.key === vt)?.label || vt}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent)', fontFamily: "'Space Grotesk',sans-serif" }}>₹{s.price?.toLocaleString()}</span>
                  <span style={{ fontSize: '12px', color: 'var(--fg2)' }}><i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>{s.estimatedTime}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-p" style={{ flex: 1, fontSize: '13px', padding: '10px' }} onClick={() => openApply(s)}>
                    <i className="fa-solid fa-paper-plane" style={{ marginRight: '6px' }}></i>Apply Service
                  </button>
                  <button className="btn-s" style={{ padding: '10px 14px', fontSize: '13px' }} onClick={() => { setSelectedService(s); setShowDetail(true); }}>
                    <i className="fa-solid fa-info-circle"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Support & Contact Section */}
        <div className="gc" style={{ padding: '32px', marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '6px' }}><i className="fa-solid fa-headset" style={{ color: 'var(--cyan)', marginRight: '10px' }}></i>Support & Contact</h3>
          <p style={{ color: 'var(--fg2)', fontSize: '14px', marginBottom: '24px' }}>Need help? Reach out to our support team anytime.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            <a href="tel:+918870404468" className="gc" style={{ padding: '18px', textAlign: 'center', textDecoration: 'none', cursor: 'pointer' }}>
              <i className="fa-solid fa-phone" style={{ fontSize: '22px', color: 'var(--accent)', marginBottom: '8px', display: 'block' }}></i>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)' }}>+91 8870404468</span><br />
              <span style={{ fontSize: '11px', color: 'var(--fg2)' }}>Call Support</span>
            </a>
            <a href="https://wa.me/918870404468?text=Hi%20I%20need%20help%20with%20EV%20service" target="_blank" rel="noreferrer" className="gc" style={{ padding: '18px', textAlign: 'center', textDecoration: 'none', cursor: 'pointer' }}>
              <i className="fa-brands fa-whatsapp" style={{ fontSize: '22px', color: '#25D366', marginBottom: '8px', display: 'block' }}></i>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)' }}>WhatsApp</span><br />
              <span style={{ fontSize: '11px', color: 'var(--fg2)' }}>8870404468</span>
            </a>
            <a href="mailto:kajendranking25@gmail.com" className="gc" style={{ padding: '18px', textAlign: 'center', textDecoration: 'none', cursor: 'pointer' }}>
              <i className="fa-solid fa-envelope" style={{ fontSize: '22px', color: 'var(--purple)', marginBottom: '8px', display: 'block' }}></i>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)' }}>Email</span><br />
              <span style={{ fontSize: '11px', color: 'var(--fg2)' }}>kajendranking25@gmail.com</span>
            </a>
            <a href="sms:+918870404468" className="gc" style={{ padding: '18px', textAlign: 'center', textDecoration: 'none', cursor: 'pointer' }}>
              <i className="fa-solid fa-message" style={{ fontSize: '22px', color: 'var(--warn)', marginBottom: '8px', display: 'block' }}></i>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)' }}>Message</span><br />
              <span style={{ fontSize: '11px', color: 'var(--fg2)' }}>8870404468</span>
            </a>
            <div className="gc" style={{ padding: '18px', textAlign: 'center', cursor: 'pointer' }} onClick={() => setShowContact(true)}>
              <i className="fa-solid fa-paper-plane" style={{ fontSize: '22px', color: 'var(--cyan)', marginBottom: '8px', display: 'block' }}></i>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)' }}>Contact Form</span><br />
              <span style={{ fontSize: '11px', color: 'var(--fg2)' }}>Send a message</span>
            </div>
          </div>
          <button className="btn-s" onClick={() => { setContactForm(f => ({ ...f, type: 'technician-support' })); setShowContact(true); }}>
            <i className="fa-solid fa-user-gear" style={{ marginRight: '8px' }}></i>Technician Support Request
          </button>
        </div>

        {/* Apply Service Modal */}
        <Modal open={showApply} onClose={() => setShowApply(false)}>
          <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
            <h3 style={{ marginBottom: '4px' }}>
              <i className="fa-solid fa-paper-plane" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>Apply for Service
            </h3>
            {selectedService && <p style={{ color: 'var(--fg2)', fontSize: '13px', marginBottom: '18px' }}>{selectedService.name} — ₹{selectedService.price}</p>}
            <div style={{ display: 'grid', gap: '10px' }}>
              <input className="inp" placeholder="Customer Name *" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input className="inp" placeholder="Phone Number *" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                <input className="inp" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <select className="inp" value={form.vehicleType} onChange={e => setForm({ ...form, vehicleType: e.target.value })}>
                {VEHICLE_TYPES.slice(1).map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input className="inp" placeholder="Vehicle Model *" value={form.vehicleModel} onChange={e => setForm({ ...form, vehicleModel: e.target.value })} />
                <input className="inp" placeholder="Reg. Number *" value={form.regNumber} onChange={e => setForm({ ...form, regNumber: e.target.value })} />
              </div>
              <textarea className="inp" placeholder="Problem Description *" rows={3} style={{ resize: 'vertical' }} value={form.issueDescription} onChange={e => setForm({ ...form, issueDescription: e.target.value })}></textarea>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input type="date" className="inp" value={form.preferredDate} onChange={e => setForm({ ...form, preferredDate: e.target.value })} />
                <select className="inp" value={form.preferredSlot} onChange={e => setForm({ ...form, preferredSlot: e.target.value })}>
                  <option value="">Select Time Slot</option>
                  {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '13px', color: 'var(--fg2)' }}>Pickup Required?</label>
                  <label className="toggle" style={{ width: '44px', height: '24px' }}>
                    <input type="checkbox" checked={form.pickupRequired} onChange={e => setForm({ ...form, pickupRequired: e.target.checked })} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <select className="inp" value={form.serviceLocation} onChange={e => setForm({ ...form, serviceLocation: e.target.value })}>
                  <option value="station">At Station</option>
                  <option value="home">Home Service</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', color: 'var(--fg2)', marginBottom: '4px', display: 'block' }}>Upload Vehicle Image (optional)</label>
                <input type="file" accept="image/*" className="inp" style={{ padding: '8px' }} onChange={e => setForm({ ...form, vehicleImage: e.target.files[0] })} />
              </div>
            </div>
            <button className="btn-p" style={{ width: '100%', marginTop: '16px' }} onClick={handleApply}>
              <i className="fa-solid fa-check" style={{ marginRight: '8px' }}></i>Submit Service Request
            </button>
          </div>
        </Modal>

        {/* Service Details Modal */}
        <Modal open={showDetail} onClose={() => setShowDetail(false)}>
          {selectedService && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
                <div className="svc-ic" style={{ background: `${getCategoryColor(selectedService.category)}12`, borderColor: `${getCategoryColor(selectedService.category)}25` }}>
                  <i className={`fa-solid ${selectedService.icon || 'fa-wrench'}`} style={{ color: getCategoryColor(selectedService.category), fontSize: '24px' }}></i>
                </div>
                <div>
                  <h3 style={{ fontSize: '18px' }}>{selectedService.name}</h3>
                  <span className="badge badge-info">{selectedService.category.replace('-', ' ')}</span>
                </div>
              </div>
              <p style={{ color: 'var(--fg2)', fontSize: '14px', lineHeight: '1.6', marginBottom: '18px' }}>{selectedService.description}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
                <div className="spc"><div className="spc-v">₹{selectedService.price?.toLocaleString()}</div><div className="spc-l">Price</div></div>
                <div className="spc"><div className="spc-v">{selectedService.estimatedTime}</div><div className="spc-l">Est. Time</div></div>
              </div>
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '13px', color: 'var(--fg2)', marginBottom: '8px' }}>Supported Vehicle Types</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(selectedService.vehicleTypesSupported || []).map(vt => (
                    <span key={vt} className="badge badge-ok">{VEHICLE_TYPES.find(v => v.key === vt)?.label || vt}</span>
                  ))}
                </div>
              </div>
              <button className="btn-p" style={{ width: '100%' }} onClick={() => { setShowDetail(false); openApply(selectedService); }}>
                <i className="fa-solid fa-paper-plane" style={{ marginRight: '8px' }}></i>Apply for This Service
              </button>
            </div>
          )}
        </Modal>

        {/* Contact Form Modal */}
        <Modal open={showContact} onClose={() => setShowContact(false)}>
          <h3 style={{ marginBottom: '18px' }}><i className="fa-solid fa-envelope" style={{ color: 'var(--cyan)', marginRight: '8px' }}></i>Send Message</h3>
          <div style={{ display: 'grid', gap: '10px' }}>
            <input className="inp" placeholder="Your Name *" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} />
            <input className="inp" placeholder="Email *" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} />
            <input className="inp" placeholder="Phone" value={contactForm.phone} onChange={e => setContactForm({ ...contactForm, phone: e.target.value })} />
            <textarea className="inp" placeholder="Your Message *" rows={4} style={{ resize: 'vertical' }} value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })}></textarea>
          </div>
          <button className="btn-p" style={{ width: '100%', marginTop: '14px' }} onClick={handleContact}>
            <i className="fa-solid fa-paper-plane" style={{ marginRight: '8px' }}></i>Send Message
          </button>
        </Modal>
      </div>
    </div>
  );
}
