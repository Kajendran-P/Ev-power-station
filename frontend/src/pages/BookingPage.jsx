import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';
import { getStations } from '../services/stationService';
import { createBooking } from '../services/bookingService';
import PaymentModal from '../components/PaymentModal';

export default function BookingPage() {
  const { user } = useAuth();
  const { toast, showProc, hideProc, addNotif } = useNotif();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [veh, setVeh] = useState(null);
  const [stations, setStations] = useState([]);
  const [selStation, setSelStation] = useState(location.state?.station || null);
  const [dur, setDur] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [payment, setPayment] = useState(null);
  const [total, setTotal] = useState(0);
  const [showPay, setShowPay] = useState(false);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    if (!user) { toast('Please sign in first', 'err'); navigate('/login'); }
  }, [user]);

  const loadStations = () => {
    getStations().then(r => {
      const all = r.data.stations || [];
      const compatible = all.filter(s => {
        if (veh === 'bike') return s.type === 'bike' || s.type === 'normal-ac';
        return s.type === 'fast-dc' || s.type === 'normal-ac';
      });
      setStations(compatible);
    }).catch(() => {});
  };

  const goStep = (n) => {
    if (n === 2) loadStations();
    setStep(n);
  };

  useEffect(() => {
    if (selStation && dur) {
      const hrs = dur / 60;
      const energy = (selStation.power * hrs).toFixed(1);
      const base = energy * selStation.pricePerKwh;
      const gst = base * 0.18;
      const tot = base + gst;
      setTotal(tot);
      setSummary({ station: selStation.name, charger: selStation.typeName, dur: dur + ' min', energy: energy + ' kWh', base: '₹' + base.toFixed(2), gst: '₹' + gst.toFixed(2), total: '₹' + tot.toFixed(2), baseNum: base, gstNum: gst, energyNum: parseFloat(energy) });
    }
  }, [selStation, dur]);

  const completePayment = async () => {
    setShowPay(false);
    showProc('Confirming booking...');
    try {
      const res = await createBooking({
        stationId: selStation.stationId, stationName: selStation.name, vehicleType: veh,
        slot: 'Slot ' + Math.ceil(Math.random() * 5), date: date || 'Today', time: time || 'Now',
        duration: dur, energy: summary.energyNum, basePrice: summary.baseNum, gst: summary.gstNum,
        totalAmount: total, paymentMethod: payment
      });
      hideProc();
      addNotif('Booking confirmed: ' + res.data.booking.bookingId, 'fa-check-circle');
      navigate('/confirmation', { state: { booking: res.data.booking } });
    } catch (e) { hideProc(); toast(e.response?.data?.message || 'Error', 'err'); }
  };

  const stepLabels = ['Vehicle', 'Station', 'Schedule', 'Payment'];

  return (
    <div className="pg">
      <div className="ctn">
        <div style={{maxWidth:'720px',margin:'0 auto'}}>
          <div className="step-ind">
            {stepLabels.map((l, i) => (
              <div key={i} className={'stp' + (i + 1 === step ? ' act' : i + 1 < step ? ' done' : '')}>
                <div className="stp-n">{i + 1}</div><span className="stp-txt">{l}</span>
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="gc" style={{padding:'28px'}}>
              <h3 style={{marginBottom:'20px'}}>Select Vehicle Type</h3>
              <div className="vsel">
                <div className={'vopt' + (veh === 'car' ? ' sel' : '')} onClick={() => setVeh('car')}>
                  <div className="vopt-ic"><i className="fa-solid fa-car" style={{fontSize:'26px',color:'var(--accent)'}}></i></div>
                  <h4>Electric Car</h4><p style={{color:'var(--fg2)',fontSize:'13px',marginTop:'4px'}}>4-wheeler EV</p>
                </div>
                <div className={'vopt' + (veh === 'bike' ? ' sel' : '')} onClick={() => setVeh('bike')}>
                  <div className="vopt-ic"><i className="fa-solid fa-motorcycle" style={{fontSize:'26px',color:'var(--accent)'}}></i></div>
                  <h4>Electric Bike</h4><p style={{color:'var(--fg2)',fontSize:'13px',marginTop:'4px'}}>2-wheeler EV</p>
                </div>
              </div>
              <button className="btn-p" style={{width:'100%',marginTop:'20px'}} disabled={!veh} onClick={() => goStep(2)}>Continue</button>
            </div>
          )}

          {step === 2 && (
            <div className="gc" style={{padding:'28px'}}>
              <h3 style={{marginBottom:'20px'}}>Select Charging Station</h3>
              {stations.map(s => (
                <div key={s.stationId || s._id} className="gc" style={{padding:'14px',marginBottom:'10px',cursor:'pointer',border:`2px solid ${selStation?.stationId === s.stationId ? 'var(--accent)' : 'var(--border)'}`,transition:'all .25s'}} onClick={() => setSelStation(s)}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'8px'}}>
                    <div><h4 style={{fontSize:'14px',marginBottom:'2px'}}>{s.name}</h4><p style={{color:'var(--fg2)',fontSize:'12px'}}>{s.location}</p></div>
                    <div style={{textAlign:'right'}}><div style={{fontSize:'16px',fontWeight:700,color:'var(--accent)'}}>₹{s.pricePerKwh}/kWh</div><div style={{fontSize:'11px',color:'var(--fg2)'}}>{s.availableSlots} slots free</div></div>
                  </div>
                </div>
              ))}
              <div style={{display:'flex',gap:'10px',marginTop:'20px'}}><button className="btn-s" style={{flex:1}} onClick={() => goStep(1)}>Back</button><button className="btn-p" style={{flex:1}} disabled={!selStation} onClick={() => goStep(3)}>Continue</button></div>
            </div>
          )}

          {step === 3 && (
            <div className="gc" style={{padding:'28px'}}>
              <h3 style={{marginBottom:'20px'}}>Schedule Charging</h3>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'18px'}}>
                <div><label style={{display:'block',marginBottom:'6px',color:'var(--fg2)',fontSize:'13px'}}>Date</label><input type="date" className="inp" value={date} onChange={e => setDate(e.target.value)} /></div>
                <div><label style={{display:'block',marginBottom:'6px',color:'var(--fg2)',fontSize:'13px'}}>Time</label><input type="time" className="inp" value={time} onChange={e => setTime(e.target.value)} /></div>
              </div>
              <label style={{display:'block',marginBottom:'10px',color:'var(--fg2)',fontSize:'13px'}}>Duration</label>
              <div className="dgrid">
                {[[30,'30','min'],[60,'1','hr'],[120,'2','hrs'],[180,'3','hrs']].map(([m,v,u]) => (
                  <div key={m} className={'dopt' + (dur === m ? ' sel' : '')} onClick={() => setDur(m)}>
                    <div style={{fontSize:'20px',fontWeight:800}}>{v}</div><div style={{fontSize:'11px',color:'var(--fg2)'}}>{u}</div>
                  </div>
                ))}
              </div>
              {selStation && dur && (
                <div className="sum-card">
                  <h4 style={{marginBottom:'14px',fontSize:'15px'}}>Booking Summary</h4>
                  {[['Station',summary.station],['Charger',summary.charger],['Duration',summary.dur],['Energy (est.)',summary.energy],['Base Price',summary.base],['GST (18%)',summary.gst]].map(([l,v]) => (
                    <div className="sum-row" key={l}><span>{l}</span><span>{v}</span></div>
                  ))}
                  <div className="sum-row"><span className="sum-tot">Total</span><span className="sum-tot">{summary.total}</span></div>
                </div>
              )}
              <div style={{display:'flex',gap:'10px',marginTop:'20px'}}><button className="btn-s" style={{flex:1}} onClick={() => goStep(2)}>Back</button><button className="btn-p" style={{flex:1}} disabled={!dur || !date || !time} onClick={() => goStep(4)}>Proceed to Pay</button></div>
            </div>
          )}

          {step === 4 && (
            <div className="gc" style={{padding:'28px'}}>
              <h3 style={{marginBottom:'20px'}}>Payment Method</h3>
              {[['upi','fa-mobile-screen-button','var(--accent)','UPI','GPay, PhonePe, Paytm'],['card','fa-credit-card','var(--cyan)','Credit / Debit Card','Visa, Mastercard, RuPay'],['wallet','fa-wallet','var(--warn)','VoltWallet',`Balance: ₹${user?.walletBalance || 0}`]].map(([m,ic,clr,t,sub]) => (
                <div key={m} className={'pmeth' + (payment === m ? ' sel' : '')} onClick={() => setPayment(m)}>
                  <div className="pmeth-ic"><i className={`fa-solid ${ic}`} style={{color:clr,fontSize:'18px'}}></i></div>
                  <div><div style={{fontWeight:600,fontSize:'14px'}}>{t}</div><div style={{color:'var(--fg2)',fontSize:'12px'}}>{sub}</div></div>
                </div>
              ))}
              <div style={{display:'flex',gap:'10px',marginTop:'20px'}}><button className="btn-s" style={{flex:1}} onClick={() => goStep(3)}>Back</button><button className="btn-p" style={{flex:1}} disabled={!payment} onClick={() => setShowPay(true)}>Pay ₹{total.toFixed(2)}</button></div>
            </div>
          )}
        </div>
      </div>
      <PaymentModal open={showPay} amount={total} stationName={selStation?.name} onPay={completePayment} onClose={() => setShowPay(false)} />
    </div>
  );
}
