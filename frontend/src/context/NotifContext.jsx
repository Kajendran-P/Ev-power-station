import { createContext, useContext, useState, useCallback, useRef } from 'react';

const NotifContext = createContext();
// eslint-disable-next-line react-refresh/only-export-components
export const useNotif = () => useContext(NotifContext);

export function NotifProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [toastType, setToastType] = useState('ok');
  const [showToast, setShowToast] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [procText, setProcText] = useState('Processing...');
  const toastTimer = useRef(null);

  const toast = useCallback((msg, type = 'ok') => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setShowToast(false), 3000);
  }, []);

  const addNotif = useCallback((msg, icon = 'fa-bell') => {
    setNotifications(prev => [{ msg, icon, time: Date.now() }, ...prev]);
  }, []);

  const clearNotifs = useCallback(() => {
    setNotifications([]);
  }, []);

  const togglePanel = useCallback(() => {
    setShowPanel(prev => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setShowPanel(false);
  }, []);

  const showProc = useCallback((msg = 'Processing...') => {
    setProcText(msg);
    setProcessing(true);
  }, []);

  const hideProc = useCallback(() => {
    setProcessing(false);
  }, []);

  return (
    <NotifContext.Provider value={{
      notifications, showPanel, toastMsg, toastType, showToast,
      processing, procText,
      toast, addNotif, clearNotifs, togglePanel, closePanel,
      showProc, hideProc
    }}>
      {children}
    </NotifContext.Provider>
  );
}
