import { useState, useMemo } from 'react';

export default function WizardStep4Payment({ selectedStation, vehicleType, bookingDetails, onPay, onBack }) {
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [payStep, setPayStep] = useState('select'); // 'select' | 'processing' | 'done'

  // Price calculation
  const pricing = useMemo(() => {
    if (!selectedStation || !bookingDetails) return null;
    const hrs = bookingDetails.duration / 60;
    const energy = parseFloat((selectedStation.power * hrs).toFixed(1));
    const multiplier = bookingDetails.chargerType === 'fast' ? 1.5 : 1.0;
    const base = energy * selectedStation.pricePerKwh * multiplier;
    const platformFee = 5;
    const gst = base * 0.18;
    const total = base + gst + platformFee;
    return {
      energy,
      base: base.toFixed(2),
      platformFee: platformFee.toFixed(2),
      gst: gst.toFixed(2),
      total: total.toFixed(2),
      baseNum: base,
      gstNum: gst,
      totalNum: total,
      energyNum: energy,
      platformFeeNum: platformFee
    };
  }, [selectedStation, bookingDetails]);

  const handlePay = () => {
    setPayStep('processing');
    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setPayStep('done');
      setProcessing(false);
      setTimeout(() => {
        onPay({
          paymentMethod,
          pricing
        });
      }, 800);
    }, 2500);
  };

  const PAYMENT_METHODS = [
    { key: 'upi', icon: 'fa-mobile-screen-button', label: 'UPI', sub: 'GPay · PhonePe · Paytm', color: 'var(--accent)' },
    { key: 'card', icon: 'fa-credit-card', label: 'Card', sub: 'Debit / Credit Card', color: 'var(--cyan)' },
    { key: 'wallet', icon: 'fa-wallet', label: 'Wallet', sub: 'VoltReserve Wallet', color: 'var(--purple)' },
    { key: 'cash', icon: 'fa-money-bill-wave', label: 'Cash', sub: 'Pay at Station', color: 'var(--warn)' }
  ];

  return (
    <div className="wz-step wz-step4">
      <div className="wz-step-header">
        <div className="wz-step-badge">Step 4</div>
        <h2 className="wz-step-title">Billing & Payment</h2>
        <p className="wz-step-subtitle">Review your booking and complete payment</p>
      </div>

      {payStep === 'processing' && (
        <div className="wz-pay-processing">
          <div className="wz-pay-spinner">
            <div className="wz-pay-spinner-ring"></div>
            <i className="fa-solid fa-lock"></i>
          </div>
          <h3>Processing Payment</h3>
          <p>Verifying with {paymentMethod === 'upi' ? 'UPI' : paymentMethod === 'card' ? 'Card Provider' : paymentMethod === 'wallet' ? 'Wallet' : 'Station'}...</p>
          <div className="wz-pay-progress">
            <div className="wz-pay-progress-fill"></div>
          </div>
        </div>
      )}

      {payStep === 'done' && (
        <div className="wz-pay-success-anim">
          <div className="wz-pay-check">
            <i className="fa-solid fa-check"></i>
          </div>
          <h3>Payment Successful!</h3>
        </div>
      )}

      {payStep === 'select' && (
        <>
          {/* Billing Summary */}
          <div className="wz-billing-card">
            <div className="wz-billing-header">
              <i className="fa-solid fa-receipt"></i>
              <h3>Billing Summary</h3>
            </div>

            <div className="wz-billing-details">
              <div className="wz-billing-item">
                <div className="wz-billing-item-left">
                  <i className="fa-solid fa-charging-station"></i>
                  <span>Station</span>
                </div>
                <span className="wz-billing-item-val">{selectedStation?.name}</span>
              </div>
              <div className="wz-billing-item">
                <div className="wz-billing-item-left">
                  <i className="fa-solid fa-bolt"></i>
                  <span>Charger Type</span>
                </div>
                <span className="wz-billing-item-val">{bookingDetails?.chargerType === 'fast' ? 'Fast DC' : 'Normal AC'}</span>
              </div>
              <div className="wz-billing-item">
                <div className="wz-billing-item-left">
                  <i className="fa-solid fa-clock"></i>
                  <span>Duration</span>
                </div>
                <span className="wz-billing-item-val">{bookingDetails?.duration} min</span>
              </div>
              <div className="wz-billing-item">
                <div className="wz-billing-item-left">
                  <i className="fa-solid fa-calendar"></i>
                  <span>Date & Time</span>
                </div>
                <span className="wz-billing-item-val">{bookingDetails?.date} · {bookingDetails?.time}</span>
              </div>
              <div className="wz-billing-item">
                <div className="wz-billing-item-left">
                  <i className="fa-solid fa-plug"></i>
                  <span>Slot</span>
                </div>
                <span className="wz-billing-item-val">{bookingDetails?.slot}</span>
              </div>
              <div className="wz-billing-item">
                <div className="wz-billing-item-left">
                  <i className="fa-solid fa-car"></i>
                  <span>Vehicle</span>
                </div>
                <span className="wz-billing-item-val">{bookingDetails?.vehicleNumberPlate}</span>
              </div>
            </div>

            <div className="wz-billing-divider"></div>

            {pricing && (
              <div className="wz-billing-pricing">
                <div className="wz-billing-row">
                  <span>Energy (est.)</span>
                  <span>{pricing.energy} kWh</span>
                </div>
                <div className="wz-billing-row">
                  <span>Rate</span>
                  <span>₹{selectedStation?.pricePerKwh}/kWh {bookingDetails?.chargerType === 'fast' ? '× 1.5' : ''}</span>
                </div>
                <div className="wz-billing-row">
                  <span>Base Amount</span>
                  <span>₹{pricing.base}</span>
                </div>
                <div className="wz-billing-row">
                  <span>GST (18%)</span>
                  <span>₹{pricing.gst}</span>
                </div>
                <div className="wz-billing-row">
                  <span>Platform Fee</span>
                  <span>₹{pricing.platformFee}</span>
                </div>
                {bookingDetails?.chargerType === 'fast' && (
                  <div className="wz-billing-row highlight">
                    <span>Fast Charge Premium</span>
                    <span>×1.5</span>
                  </div>
                )}
                <div className="wz-billing-total">
                  <span>Total Amount</span>
                  <span>₹{pricing.total}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="wz-payment-section">
            <h3 className="wz-form-section-title">
              <i className="fa-solid fa-wallet"></i>
              Payment Method
            </h3>
            <div className="wz-payment-grid">
              {PAYMENT_METHODS.map(m => (
                <button
                  key={m.key}
                  className={'wz-payment-option' + (paymentMethod === m.key ? ' selected' : '')}
                  onClick={() => setPaymentMethod(m.key)}
                >
                  <div className="wz-payment-icon" style={{ color: m.color }}>
                    <i className={`fa-solid ${m.icon}`}></i>
                  </div>
                  <span className="wz-payment-label">{m.label}</span>
                  <span className="wz-payment-sub">{m.sub}</span>
                  {paymentMethod === m.key && <div className="wz-payment-check"><i className="fa-solid fa-circle-check"></i></div>}
                </button>
              ))}
            </div>
          </div>

          {/* Security badge */}
          <div className="wz-secure-badge">
            <i className="fa-solid fa-shield-halved"></i>
            <span>Your payment is protected with 256-bit SSL encryption</span>
          </div>

          <div className="wz-step-actions">
            <button className="btn-s" onClick={onBack}>
              <i className="fa-solid fa-arrow-left"></i>
              Back
            </button>
            <button className="btn-p wz-pay-btn" onClick={handlePay} disabled={processing}>
              <i className="fa-solid fa-lock"></i>
              Pay ₹{pricing?.total || '0.00'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
