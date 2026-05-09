import API from './api';
export const sendOtp = (email) => API.post('/auth/send-otp', { email });
export const verifyOtp = (email, otp) => API.post('/auth/verify-otp', { email, otp });
export const loginWithPassword = (email, password) => API.post('/auth/login-password', { email, password });
export const login = loginWithPassword;
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);
export const addToWallet = (amount) => API.put('/auth/wallet', { amount });
