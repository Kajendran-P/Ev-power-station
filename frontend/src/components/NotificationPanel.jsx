import { useNotif } from '../context/NotifContext';
import { useEffect, useRef } from 'react';

function relTime(t) {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

export default function NotificationPanel() {
  const { notifications, showPanel, clearNotifs, closePanel } = useNotif();
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (showPanel && ref.current && !ref.current.contains(e.target) && !e.target.closest('.notif-btn')) {
        closePanel();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [showPanel, closePanel]);

  return (
    <div className={'notif-panel' + (showPanel ? ' open' : '')} ref={ref}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',borderBottom:'1px solid var(--border)'}}>
        <h4 style={{fontSize:'15px'}}>Notifications</h4>
        <button onClick={clearNotifs} style={{background:'none',border:'none',color:'var(--accent)',cursor:'pointer',fontSize:'12px'}}>Clear all</button>
      </div>
      <div>
        {notifications.length === 0 ? (
          <p style={{textAlign:'center',color:'var(--muted)',padding:'36px 0',fontSize:'14px'}}>No notifications</p>
        ) : (
          notifications.slice(0, 10).map((n, i) => (
            <div className="notif-item" key={i}>
              <div className="notif-ic"><i className={`fa-solid ${n.icon}`} style={{fontSize:'14px'}}></i></div>
              <div>
                <p style={{fontSize:'13px',lineHeight:'1.5'}}>{n.msg}</p>
                <p style={{fontSize:'11px',color:'var(--muted)',marginTop:'3px'}}>{relTime(n.time)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
