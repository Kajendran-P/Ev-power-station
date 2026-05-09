import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('vr_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authService.getMe().then(res => {
        setUser(res.data.user);
      }).catch(() => {
        localStorage.removeItem('vr_token');
        setToken(null);
      }).finally(() => setLoading(false));
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, [token]);

  const loginWithToken = (tkn, usr) => {
    localStorage.setItem('vr_token', tkn);
    setToken(tkn);
    setUser(usr);
  };

  const sendOtp = async (email) => {
    const res = await authService.sendOtp(email);
    return res.data;
  };

  const verifyOtp = async (email, otp) => {
    const res = await authService.verifyOtp(email, otp);
    loginWithToken(res.data.token, res.data.user);
    return res.data;
  };

  const loginWithPassword = async (email, password) => {
    const res = await authService.loginWithPassword(email, password);
    loginWithToken(res.data.token, res.data.user);
    return res.data;
  };

  const loginEmail = async (email, password) => {
    return loginWithPassword(email, password);
  };

  const registerUser = async (data) => {
    const res = await authService.register(data);
    loginWithToken(res.data.token, res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('vr_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, sendOtp, verifyOtp, loginWithPassword, loginEmail, registerUser, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
