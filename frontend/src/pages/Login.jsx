import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const visualImages = [
  '/Lobby.jpg',
  '/Restaurant.jpg',
  '/Room.jpg',
  '/Room2.jpg',
  '/Room3.jpg',
];

export default function Login() {
  const { login, verifyTwoFactorLogin, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [temporaryToken, setTemporaryToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [visualIndex, setVisualIndex] = useState(0);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaContainerRef = useRef(null);
  const captchaWidgetId = useRef(null);

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!captchaRequired || !recaptchaSiteKey) return undefined;

    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !window.grecaptcha || !captchaContainerRef.current || captchaWidgetId.current !== null) return;
      captchaWidgetId.current = window.grecaptcha.render(captchaContainerRef.current, {
        sitekey: recaptchaSiteKey,
        callback: (token) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(''),
      });
    };

    if (window.grecaptcha && window.grecaptcha.render) {
      renderWidget();
      return undefined;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => window.grecaptcha.ready(renderWidget);
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      document.body.removeChild(script);
    };
  }, [captchaRequired, recaptchaSiteKey]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVisualIndex(previous => (previous + 1) % visualImages.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (captchaRequired && !captchaToken) {
        throw new Error('Please complete the CAPTCHA to continue.');
      }

      if (mode === 'register') {
        if (form.password !== form.confirmPassword) throw new Error('Passwords do not match');
        await register(form.name, form.email, form.password);
        setMode('login');
        setError('Account created — please sign in');
      } else {
        const loginResponse = await login(form.email, form.password, captchaRequired ? { token: captchaToken } : null);
        if (loginResponse.requiresTwoFactor) {
          setTemporaryToken(loginResponse.tempToken);
          setTwoFactorToken('');
        }
        setCaptchaRequired(false);
        setCaptchaToken('');
      }
    } catch (requestError) {
      if (requestError.response?.data?.requiresCaptcha) {
        setCaptchaRequired(true);
        setCaptchaToken('');
        if (window.grecaptcha && captchaWidgetId.current !== null) {
          window.grecaptcha.reset(captchaWidgetId.current);
        }
      }
      setError(requestError.response?.data?.message || requestError.message || 'Unable to continue');
    } finally {
      setLoading(false);
    }
  };

  const submitTwoFactor = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!twoFactorToken.trim()) throw new Error('Enter your authenticator code or backup code.');
      await verifyTwoFactorLogin(temporaryToken, twoFactorToken.trim());
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to verify the code');
    } finally {
      setLoading(false);
    }
  };

  const cancelTwoFactor = () => {
    setTemporaryToken('');
    setTwoFactorToken('');
    setError('');
  };

  return (
    <main className="login-page">
      <section
        className="login-visual"
        aria-label="Hotel and restaurant branding"
        style={{ '--login-visual-image': `url(${visualImages[visualIndex]})` }}
      >
        <div className="visual-overlay" />

        <div className="visual-content">
          <div className="brand-mark">Oxford Suites Makati</div>
          <div className="brand-sub">Luxury hospitality group</div>

          <h2>Where guest experience meets operational excellence.</h2>
          <p>
            Manage payroll, benefits, and team access across hotel services and dining operations from one elegant dashboard.
          </p>

          <div className="feature-list">
            <div className="feature-pill">
              <span className="feature-label">Hotel</span>
              <strong>220+ rooms</strong>
            </div>
            <div className="feature-pill">
              <span className="feature-label">Dining</span>
              <strong>3 venues</strong>
            </div>
          </div>
        </div>

        <div className="image-grid" aria-hidden="true">
          <div className="image-card hotel-image" style={{ backgroundImage: `url(${visualImages[(visualIndex + 1) % visualImages.length]})` }} />
          <div className="image-card restaurant-image" style={{ backgroundImage: `url(${visualImages[(visualIndex + 2) % visualImages.length]})` }} />
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="brand-mark">Oxford Suites Makati</div>
          <div className="brand-sub">Payroll &amp; Benefits</div>

          <h1>{temporaryToken ? 'Verify your identity' : mode === 'login' ? 'Sign in' : 'Create account'}</h1>
          <p className="login-help">
            {temporaryToken ? 'Enter the code from your authenticator app to finish signing in.' : mode === 'login' ? 'Use your administrator or HR account to continue.' : 'New accounts are created with employee access.'}
          </p>

          {error && <div className="login-error" role="alert">{error}</div>}

          {temporaryToken ? (
            <>
              <label>
                Authentication code
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9A-Za-z-]+"
                  maxLength="12"
                  autoFocus
                  required
                  value={twoFactorToken}
                  onChange={event => setTwoFactorToken(event.target.value)}
                  placeholder="123456"
                />
              </label>
              <p className="otp-help">You can use a one-time backup code if you cannot access your authenticator.</p>
              <button type="button" className="login-switch" onClick={cancelTwoFactor}>Back to sign in</button>
            </>
          ) : <>
          {mode === 'register' && (
            <label>
              Name
              <input type="text" required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
            </label>
          )}

          <label>
            Email
            <input type="email" required value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
          </label>

          <label>
            Password
            <span className="password-input-wrap">
              <input type={showPassword ? 'text' : 'password'} minLength="8" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
              <button type="button" className="password-toggle" onClick={() => setShowPassword(previous => !previous)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </span>
          </label>

          {mode === 'register' && (
            <label>
              Confirm password
              <span className="password-input-wrap">
                <input type={showConfirmPassword ? 'text' : 'password'} minLength="8" required value={form.confirmPassword} onChange={event => setForm({ ...form, confirmPassword: event.target.value })} />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(previous => !previous)} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={showConfirmPassword}>
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>
          )}

          {captchaRequired && recaptchaSiteKey && (
            <div className="captcha-box">
              <div ref={captchaContainerRef} />
            </div>
          )}

          <button type="submit" disabled={loading || (captchaRequired && !captchaToken)}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
          </>}
        </form>
      </section>
    </main>
  );
}
