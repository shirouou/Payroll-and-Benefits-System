import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (form.password !== form.confirmPassword) throw new Error('Passwords do not match');
        await register(form.name, form.email, form.password);
        setMode('login');
        setError('Account created — please sign in');
      } else {
        await login(form.email, form.password);
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || 'Unable to continue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Hotel and restaurant branding">
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
          <div className="image-card hotel-image" />
          <div className="image-card restaurant-image" />
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="brand-mark">Oxford Suites Makati</div>
          <div className="brand-sub">Payroll &amp; Benefits</div>

          <h1>{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
          <p className="login-help">
            {mode === 'login' ? 'Use your administrator or HR account to continue.' : 'New accounts are created with viewer access.'}
          </p>

          {error && <div className="login-error" role="alert">{error}</div>}

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
            <input type="password" minLength="8" required value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
          </label>

          {mode === 'register' && (
            <label>
              Confirm password
              <input type="password" minLength="8" required value={form.confirmPassword} onChange={event => setForm({ ...form, confirmPassword: event.target.value })} />
            </label>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          <button type="button" className="login-switch" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
