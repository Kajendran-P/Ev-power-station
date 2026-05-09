import { useNotif } from '../context/NotifContext';

export default function Toast() {
  const { toastMsg, toastType, showToast } = useNotif();
  return (
    <div className={'toast-container' + (showToast ? ' show' : '') + (toastType === 'err' ? ' toast-err' : '')}>
      <i className={toastType === 'err' ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-circle-check'} style={{color: toastType === 'err' ? 'var(--err)' : 'var(--accent)'}}></i>
      <span>{toastMsg}</span>
    </div>
  );
}
