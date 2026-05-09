import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';
import { getSpareParts, createOrder, generateInvoice } from '../services/serviceApiService';

const VEHICLE_TYPES = [
  { key: 'all', label: 'All Vehicles', icon: 'fa-layer-group' },
  { key: 'ev-bike', label: 'EV Bike', icon: 'fa-motorcycle' },
  { key: 'ev-car', label: 'EV Car', icon: 'fa-car' },
  { key: 'ev-3wheeler', label: 'EV 3-Wheeler', icon: 'fa-truck-monster' },
  { key: 'ev-bus-truck', label: 'EV Bus / Truck', icon: 'fa-bus' },
  { key: 'other', label: 'Other EV', icon: 'fa-charging-station' }
];

const PART_CATEGORIES = [
  { key: 'all', label: 'All Parts' },
  { key: 'battery', label: 'Battery' },
  { key: 'motor', label: 'Motor' },
  { key: 'controller', label: 'Controller' },
  { key: 'charging', label: 'Charging' },
  { key: 'wiring', label: 'Wiring' },
  { key: 'brake', label: 'Brake' },
  { key: 'tyre', label: 'Tyre' },
  { key: 'sensor', label: 'Sensor' },
  { key: 'display', label: 'Display' },
  { key: 'other', label: 'Other' }
];

export default function SparePartsPage() {
  const { user } = useAuth();
  const { toast } = useNotif();
  const [parts, setParts] = useState([]);
  const [vehicleType, setVehicleType] = useState('all');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');

  useEffect(() => { loadParts(); }, [vehicleType, category, search]);

  const loadParts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (vehicleType !== 'all') params.vehicleType = vehicleType;
      if (category !== 'all') params.category = category;
      if (search) params.search = search;
      const res = await getSpareParts(params);
      setParts(res.data.parts || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const addToCart = (part) => {
    setCart(prev => {
      const existing = prev.find(i => i.partId === part._id);
      if (existing) return prev.map(i => i.partId === part._id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { partId: part._id, partName: part.partName, price: part.price, quantity: 1, maxStock: part.stock }];
    });
    toast(`${part.partName} added to cart`);
  };

  const removeFromCart = (partId) => setCart(prev => prev.filter(i => i.partId !== partId));
  const updateQty = (partId, qty) => {
    if (qty < 1) return removeFromCart(partId);
    setCart(prev => prev.map(i => i.partId === partId ? { ...i, quantity: Math.min(qty, i.maxStock) } : i));
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleCheckout = async () => {
    if (!user) { toast('Please sign in', 'err'); return; }
    if (cart.length === 0) { toast('Cart is empty', 'err'); return; }

    try {
      setPaying(true);

      if (paymentMethod === 'cash') {
        // Cash on Delivery — create order with COD status
        const orderRes = await createOrder({ items: cart, totalAmount: cartTotal, paymentMethod: 'cash' });
        const orderId = orderRes.data.order._id;
        await generateInvoice({ orderId, paymentMethod: 'cash' });
        toast('Order placed! Pay cash on delivery. Invoice generated.');
        setCart([]);
        setShowCart(false);
        setPaying(false);
        return;
      }

      // UPI flow (default)
      const orderRes = await createOrder({ items: cart, totalAmount: cartTotal, paymentMethod: 'upi' });
      const orderId = orderRes.data.order._id;
      const upiId = 'kajendranking25@oksbi';
      const upiName = 'KR Charging Power Station';
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${cartTotal}&cu=INR&tn=SparePartsOrder-${orderId}`;
      window.open(upiLink, '_blank');
      await generateInvoice({ orderId, paymentMethod: 'upi' });
      toast('UPI payment initiated! Invoice generated. Complete payment in your UPI app.');
      setCart([]);
      setShowCart(false);
      setPaying(false);
    } catch (e) {
      toast(e.response?.data?.message || 'Checkout failed', 'err');
      setPaying(false);
    }
  };

  const buyNow = (part) => {
    if (!user) { toast('Please sign in first', 'err'); return; }
    setCart([{ partId: part._id, partName: part.partName, price: part.price, quantity: 1, maxStock: part.stock }]);
    setShowCart(true);
  };

  const getCatIcon = (c) => {
    const icons = { battery: 'fa-battery-half', motor: 'fa-gear', controller: 'fa-microchip', charging: 'fa-plug', wiring: 'fa-code-branch', brake: 'fa-gauge-high', tyre: 'fa-circle', sensor: 'fa-satellite-dish', display: 'fa-display', other: 'fa-box' };
    return icons[c] || 'fa-box';
  };

  const PAY_METHODS = [
    { key: 'upi', label: 'UPI', icon: 'fa-mobile-screen', color: '#6739B7', desc: 'GPay / PhonePe / Paytm' },
    { key: 'cash', label: 'Cash', icon: 'fa-money-bill-wave', color: '#2ECC71', desc: 'Cash on Delivery' }
  ];

  return (
    <div className="pg">
      <div className="ctn">
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="hero-eyebrow"><i className="fa-solid fa-box-open"></i> Genuine EV Parts</div>
          <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', marginBottom: '8px' }}>
            EV Spare Parts <span style={{ background: 'linear-gradient(135deg,var(--accent),var(--cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Store</span>
          </h2>
          <p style={{ color: 'var(--fg2)', maxWidth: '600px', margin: '0 auto', fontSize: '15px' }}>
            Genuine spare parts for all EV types with warranty & fast delivery
          </p>
        </div>

        {/* Cart button */}
        <div style={{ position: 'fixed', bottom: '100px', right: '28px', zIndex: 500 }}>
          <button className="btn-p" style={{ borderRadius: '50%', width: '60px', height: '60px', padding: 0, position: 'relative', boxShadow: '0 8px 30px var(--glow)' }} onClick={() => setShowCart(true)}>
            <i className="fa-solid fa-cart-shopping" style={{ fontSize: '20px' }}></i>
            {cart.length > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: 'var(--err)', color: '#fff', borderRadius: '50%', width: '22px', height: '22px', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cart.reduce((s, i) => s + i.quantity, 0)}</span>}
          </button>
        </div>

        {/* Vehicle Type Filter */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '20px' }}>
          {VEHICLE_TYPES.map(v => (
            <button key={v.key} className={'ftab' + (vehicleType === v.key ? ' act' : '')} onClick={() => setVehicleType(v.key)}>
              <i className={`fa-solid ${v.icon}`} style={{ marginRight: '6px' }}></i>{v.label}
            </button>
          ))}
        </div>

        {/* Search + Category */}
        <div className="filter-bar" style={{ marginBottom: '24px' }}>
          <div className="search-wrap" style={{ maxWidth: '400px' }}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input className="inp" placeholder="Search spare parts..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="inp" value={category} onChange={e => setCategory(e.target.value)} style={{ maxWidth: '200px' }}>
            {PART_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <span className="badge badge-ok">{parts.length} parts</span>
        </div>

        {/* Parts Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--fg2)' }}>
            <div className="spin-ring" style={{ width: '40px', height: '40px', margin: '0 auto 14px' }}></div>Loading parts...
          </div>
        ) : parts.length === 0 ? (
          <div className="gc" style={{ padding: '60px', textAlign: 'center' }}>
            <i className="fa-solid fa-box-open" style={{ fontSize: '40px', color: 'var(--muted)', marginBottom: '14px', display: 'block' }}></i>
            <p style={{ color: 'var(--fg2)' }}>No spare parts found for this filter</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
            {parts.map(p => (
              <div key={p._id} className="gc svc-card" style={{ position: 'relative', overflow: 'hidden' }}>
                {p.discount > 0 && <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--err)', color: '#fff', padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>{p.discount}% OFF</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div className="svc-ic">
                    <i className={`fa-solid ${getCatIcon(p.category)}`} style={{ color: 'var(--accent)' }}></i>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '14px', marginBottom: '2px', lineHeight: '1.3' }}>{p.partName}</h4>
                    <span className="badge badge-info" style={{ fontSize: '9px' }}>{p.category}</span>
                  </div>
                </div>
                <p style={{ color: 'var(--fg2)', fontSize: '12px', lineHeight: '1.5', marginBottom: '10px', minHeight: '36px' }}>{p.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                  {(p.vehicleTypesSupported || []).map(vt => (
                    <span key={vt} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '8px', background: 'var(--bg2)', color: 'var(--fg2)', border: '1px solid var(--border)' }}>
                      {VEHICLE_TYPES.find(v => v.key === vt)?.label || vt}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                  <div className="spc" style={{ padding: '8px' }}><div className="spc-v" style={{ fontSize: '14px' }}>₹{p.price?.toLocaleString()}</div><div className="spc-l">Price</div></div>
                  <div className="spc" style={{ padding: '8px' }}><div className="spc-v" style={{ fontSize: '14px', color: p.stock < 5 ? 'var(--err)' : 'var(--accent)' }}>{p.stock}</div><div className="spc-l">Stock</div></div>
                  <div className="spc" style={{ padding: '8px' }}><div className="spc-v" style={{ fontSize: '11px' }}>{p.warranty || 'N/A'}</div><div className="spc-l">Warranty</div></div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-s" style={{ flex: 1, fontSize: '12px', padding: '9px' }} onClick={() => addToCart(p)} disabled={p.stock === 0}>
                    <i className="fa-solid fa-cart-plus" style={{ marginRight: '4px' }}></i>Add to Cart
                  </button>
                  <button className="btn-p" style={{ flex: 1, fontSize: '12px', padding: '9px' }} onClick={() => buyNow(p)} disabled={p.stock === 0}>
                    <i className="fa-solid fa-bolt" style={{ marginRight: '4px' }}></i>Buy Now
                  </button>
                </div>
                {p.stock === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,12,10,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r)' }}><span className="badge badge-err" style={{ fontSize: '13px', padding: '8px 16px' }}>Out of Stock</span></div>}
              </div>
            ))}
          </div>
        )}

        {/* Cart Modal */}
        <div className={'modal-ov' + (showCart ? ' act' : '')} onClick={e => { if (e.target === e.currentTarget) setShowCart(false); }}>
          <div className="modal-c" style={{ maxWidth: '540px' }}>
            <h3 style={{ marginBottom: '18px' }}><i className="fa-solid fa-cart-shopping" style={{ color: 'var(--accent)', marginRight: '8px' }}></i>Shopping Cart</h3>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <i className="fa-solid fa-cart-shopping" style={{ fontSize: '40px', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}></i>
                <p style={{ color: 'var(--fg2)' }}>Your cart is empty</p>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.partId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '14px', marginBottom: '2px' }}>{item.partName}</h4>
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>₹{item.price?.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button className="btn-icon" style={{ width: '30px', height: '30px' }} onClick={() => updateQty(item.partId, item.quantity - 1)}>-</button>
                      <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                      <button className="btn-icon" style={{ width: '30px', height: '30px' }} onClick={() => updateQty(item.partId, item.quantity + 1)}>+</button>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--accent)', minWidth: '70px', textAlign: 'right' }}>₹{(item.price * item.quantity).toLocaleString()}</span>
                    <button className="btn-icon" style={{ width: '30px', height: '30px' }} onClick={() => removeFromCart(item.partId)}>
                      <i className="fa-solid fa-trash" style={{ color: 'var(--err)', fontSize: '12px' }}></i>
                    </button>
                  </div>
                ))}
                <div style={{ borderTop: '2px solid var(--accent)', paddingTop: '14px', marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600 }}>Total</span>
                  <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)', fontFamily: "'Space Grotesk',sans-serif" }}>₹{cartTotal.toLocaleString()}</span>
                </div>

                {/* Payment Method Selector */}
                <div style={{ marginTop: '18px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg2)', marginBottom: '10px' }}>
                    <i className="fa-solid fa-wallet" style={{ marginRight: '6px', color: 'var(--accent)' }}></i>Select Payment Method
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {PAY_METHODS.map(pm => (
                      <div
                        key={pm.key}
                        onClick={() => setPaymentMethod(pm.key)}
                        style={{
                          padding: '14px 8px',
                          textAlign: 'center',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all .25s',
                          background: paymentMethod === pm.key ? `${pm.color}15` : 'var(--bg2)',
                          border: paymentMethod === pm.key ? `2px solid ${pm.color}` : '2px solid var(--border)',
                          transform: paymentMethod === pm.key ? 'scale(1.03)' : 'scale(1)',
                        }}
                      >
                        <i className={`fa-solid ${pm.icon}`} style={{ fontSize: '20px', color: pm.color, marginBottom: '6px', display: 'block' }}></i>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: paymentMethod === pm.key ? 'var(--fg)' : 'var(--fg2)', display: 'block', marginBottom: '2px' }}>{pm.label}</span>
                        <span style={{ fontSize: '9px', color: 'var(--fg2)' }}>{pm.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="btn-p" style={{ width: '100%', marginTop: '16px', padding: '14px' }} onClick={handleCheckout} disabled={paying}>
                  {paying ? <><div className="spin-ring" style={{ width: '20px', height: '20px', margin: '0 auto', borderWidth: '2px' }}></div></> :
                    paymentMethod === 'cash' ? <><i className="fa-solid fa-money-bill-wave" style={{ marginRight: '8px' }}></i>Place Order — Cash on Delivery</> :
                    <><i className="fa-solid fa-mobile-screen" style={{ marginRight: '8px' }}></i>Pay ₹{cartTotal.toLocaleString()} via UPI</>}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
