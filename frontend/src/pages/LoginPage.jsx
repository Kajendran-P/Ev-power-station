import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotif } from '../context/NotifContext';

export default function LoginPage() {
  const { sendOtp, verifyOtp, loginWithPassword, registerUser } = useAuth();
  const { toast, showProc, hideProc } = useNotif();
  const navigate = useNavigate();

  const [authMode, setAuthMode] = useState('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSignup, setIsSignup] = useState(false);
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPass, setSignupPass] = useState('');
  const otpRefs = useRef([]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (!email || !email.includes('@')) {
      toast('Enter a valid email address', 'err');
      return;
    }
    if (cooldown > 0) {
      toast(`Please wait ${cooldown}s before requesting again`, 'err');
      return;
    }
    showProc('Sending OTP...');
    try {
      await sendOtp(email);
      hideProc();
      setOtpSent(true);
      setCooldown(30);
      setOtp(['', '', '', '', '', '']);
      toast('OTP sent to your email');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e) {
      hideProc();
      toast(e.response?.data?.message || 'Unable to send OTP', 'err');
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]*$/.test(value)) return;
    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) {
      toast('Enter the 6-digit OTP', 'err');
      return;
    }
    if (!email || !email.includes('@')) {
      toast('Enter a valid email address', 'err');
      return;
    }
    showProc('Verifying OTP...');
    try {
      const res = await verifyOtp(email, code);
      hideProc();
      toast(`Welcome ${res.user.email}`);
      navigate('/home');
    } catch (e) {
      hideProc();
      toast(e.response?.data?.message || 'Invalid OTP', 'err');
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast('Enter email and password', 'err');
      return;
    }
    showProc('Logging in...');
    try {
      const res = await loginWithPassword(email, password);
      hideProc();
      toast(`Welcome ${res.user.email}`);
      navigate('/home');
    } catch (e) {
      hideProc();
      toast(e.response?.data?.message || 'Invalid credentials', 'err');
    }
  };

  const handleSignup = async () => {
    if (!signupName || !signupEmail || !signupPass || signupPass.length < 6 || !signupEmail.includes('@')) {
      toast('Complete all fields correctly', 'err');
      return;
    }
    showProc('Creating account...');
    try {
      await registerUser({ name: signupName, email: signupEmail, password: signupPass, role: 'customer' });
      hideProc();
      toast('Account created successfully');
      navigate('/home');
    } catch (e) {
      hideProc();
      toast(e.response?.data?.message || 'Unable to create account', 'err');
    }
  };

  return (
    <div className="pg">
      <div className="auth-wrap">
        <div className="auth-c">
          <div className="gc" style={{ padding: '36px' }}>
            <div style={{ display: 'flex', gap: 0, marginBottom: '28px', background: 'var(--bg2)', borderRadius: 'var(--rs)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <button onClick={() => { setAuthMode('password'); setOtpSent(false); }} style={{ flex: 1, padding: '12px', border: 'none', background: authMode === 'password' ? 'var(--accent)' : 'transparent', color: authMode === 'password' ? '#030A06' : 'var(--fg2)', fontWeight: 700, cursor: 'pointer', transition: 'all .25s', fontFamily: "'Space Grotesk',sans-serif", fontSize: '14px' }}>Password</button>
              <button onClick={() => { setAuthMode('otp'); setOtpSent(false); }} style={{ flex: 1, padding: '12px', border: 'none', background: authMode === 'otp' ? 'var(--accent)' : 'transparent', color: authMode === 'otp' ? '#030A06' : 'var(--fg2)', fontWeight: 600, cursor: 'pointer', transition: 'all .25s', fontFamily: 'inherit', fontSize: '14px' }}>OTP</button>
            </div>

            <h2 className="auth-t">Welcome Back</h2>
            <p style={{ color: 'var(--fg2)', marginBottom: '28px', fontSize: '14px' }}>Sign in with your email and secure access.</p>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--fg2)', fontSize: '13px' }}>Email</label>
              <input type="email" className="inp" placeholder="you@example.com" style={{ marginBottom: '18px' }} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            {authMode === 'password' && (
              <>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--fg2)', fontSize: '13px' }}>Password</label>
                <input type="password" className="inp" placeholder="Enter your password" style={{ marginBottom: '18px' }} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()} />
                <button className="btn-p" style={{ width: '100%' }} onClick={handleEmailLogin}>Sign In</button>
                <p style={{ textAlign: 'center', marginTop: '12px', color: 'var(--muted)', fontSize: '12px' }}>Demo password login: kajendranking25@gmail.com / 25282004</p>
              </>
            )}

            {authMode === 'otp' && (
              <>
                <button className="btn-p" style={{ width: '100%', marginBottom: '18px' }} onClick={handleSendOtp} disabled={cooldown > 0}>{otpSent ? (cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP') : 'Send OTP'}</button>
                {otpSent && (
                  <>
                    <p style={{ fontSize: '13px', color: 'var(--fg2)', marginBottom: '14px', textAlign: 'center' }}>Enter the 6-digit OTP sent to your email.</p>
                    <div className="otp-row" style={{ marginBottom: '18px' }}>
                      {otp.map((value, index) => (
                        <input key={index} className="otp-inp" maxLength="1" value={value} ref={(el) => (otpRefs.current[index] = el)} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} />
                      ))}
                    </div>
                    <button className="btn-p" style={{ width: '100%' }} onClick={handleVerifyOtp}>Verify & Continue</button>
                  </>
                )}
              </>
            )}

            {!isSignup ? (
              <p style={{ textAlign: 'center', marginTop: '18px' }}>
                <a style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: '13px' }} onClick={() => setIsSignup(true)}>Don't have an account? Sign up</a>
              </p>
            ) : (
              <div style={{ marginTop: '18px' }}>
                <h3 className="auth-sub">Create an account</h3>
                <input className="inp" placeholder="Full Name" style={{ marginBottom: '12px' }} value={signupName} onChange={(e) => setSignupName(e.target.value)} />
                <input type="email" className="inp" placeholder="Email" style={{ marginBottom: '12px' }} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                <input type="password" className="inp" placeholder="Password" style={{ marginBottom: '12px' }} value={signupPass} onChange={(e) => setSignupPass(e.target.value)} />
                <button className="btn-p" style={{ width: '100%' }} onClick={handleSignup}>Create Account</button>
                <p style={{ textAlign: 'center', marginTop: '12px' }}>
                  <a style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: '13px' }} onClick={() => setIsSignup(false)}>Already have an account? Sign in</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
