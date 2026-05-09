import { useNotif } from '../context/NotifContext';

export default function ProcessingOverlay() {
  const { processing, procText } = useNotif();
  return (
    <div className={'overlay' + (processing ? ' act' : '')}>
      <div style={{textAlign:'center'}}>
        <div className="spin-ring"></div>
        <h3 style={{fontSize:'18px'}}>{procText}</h3>
        <p style={{color:'var(--fg2)',marginTop:'8px',fontSize:'14px'}}>Please wait</p>
      </div>
    </div>
  );
}
