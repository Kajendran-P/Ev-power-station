import { useNavigate } from 'react-router-dom';
export default function SOSFloatButton() {
  const navigate = useNavigate();
  return (
    <button className="sos-btn" onClick={() => navigate('/sos')} title="Emergency SOS">
      <i className="fa-solid fa-phone"></i>
      <span className="sos-btn-label">SOS</span>
    </button>
  );
}
