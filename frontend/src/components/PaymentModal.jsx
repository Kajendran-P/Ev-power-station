export default function PaymentModal({ open, amount, stationName, onPay }) {
  if (!open) return null;
  const amt = '₹' + (amount || 0).toFixed(2);
  return (
    <div className={'rzp-overlay' + (open ? ' act' : '')}>
      <div className="rzp-card">
        <div className="rzp-header">
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'10px'}}>
            <i className="fa-solid fa-lock" style={{fontSize:'13px',color:'var(--fg2)'}}></i>
            <span style={{fontSize:'12px',color:'var(--fg2)'}}>Secured by Razorpay</span>
          </div>
          <div style={{fontSize:'32px',fontWeight:800,fontFamily:"'Space Grotesk',sans-serif",color:'var(--accent)'}}>{amt}</div>
          <div style={{fontSize:'13px',color:'var(--fg2)',marginTop:'4px'}}>{stationName || 'VoltReserve'}</div>
        </div>
        <div className="rzp-body">
          <input className="rzp-input" placeholder="Card Number" defaultValue="4111 1111 1111 1111" readOnly />
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
            <input className="rzp-input" placeholder="MM/YY" defaultValue="12/28" readOnly />
            <input className="rzp-input" placeholder="CVV" defaultValue="123" readOnly />
          </div>
          <button className="rzp-btn" onClick={onPay}>Pay {amt}</button>
          <div className="rzp-secure"><i className="fa-solid fa-shield-halved"></i> 256-bit SSL Encrypted</div>
        </div>
      </div>
    </div>
  );
}
