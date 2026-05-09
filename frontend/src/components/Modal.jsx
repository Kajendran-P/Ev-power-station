import { useEffect } from 'react';

export default function Modal({ open, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <div className={'modal-ov' + (open ? ' act' : '')} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-c">
        {children}
      </div>
    </div>
  );
}
