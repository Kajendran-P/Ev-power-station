import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, togglePanel } = useNotif();
  const navigate = useNavigate();

  return (
    <nav className="nav">
      <div className="nav-in">
        <div className="logo" onClick={() => navigate('/home')}>
          <div className="logo-ic"><i className="fa-solid fa-bolt" style={{color:'#030A06',fontSize:'16px'}}></i></div>
          <h3 className="logo-sub">EV Charging Power Station</h3>
        </div>
        <div className="nav-lks">
          <NavLink to="/home" className={({isActive}) => 'nav-lk' + (isActive ? ' act' : '')}>Home</NavLink>
          <NavLink to="/stations" className={({isActive}) => 'nav-lk' + (isActive ? ' act' : '')}>Stations</NavLink>
          <NavLink to="/services" className={({isActive}) => 'nav-lk' + (isActive ? ' act' : '')}>Services</NavLink>
          <NavLink to="/spare-parts" className={({isActive}) => 'nav-lk' + (isActive ? ' act' : '')}>Spare Parts</NavLink>
          <NavLink to="/dashboard" className={({isActive}) => 'nav-lk' + (isActive ? ' act' : '')}>Dashboard</NavLink>
          <NavLink to="/technician" className={({isActive}) => 'nav-lk' + (isActive ? ' act' : '')}>Technician</NavLink>
          <NavLink to="/admin" className={({isActive}) => 'nav-lk' + (isActive ? ' act' : '')}>Admin</NavLink>
        </div>
        <div className="nav-r">
          {user ? (
            <>
              <div className="nav-user-pill">
                <div className="nav-user-avatar">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="nav-user-info">
                  <span className="nav-user-name">{user.name || user.email}</span>
                  <span className="nav-user-status">
                    <span className="nav-online-dot"></span>
                    Online
                  </span>
                </div>
              </div>
              <button className="btn-p btn-sm nav-logout-btn" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
            </>
          ) : (
            <button className="btn-p btn-sm" onClick={() => navigate('/login')}>Sign In</button>
          )}
          <div className="notif-btn" onClick={togglePanel} title="Notifications">
            <i className="fa-solid fa-bell" style={{fontSize:'15px'}}></i>
            {notifications.length > 0 && <div className="notif-dot"></div>}
          </div>
        </div>
      </div>
    </nav>
  );
}
