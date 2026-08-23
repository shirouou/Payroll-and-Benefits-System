import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import HMO from './pages/HMO';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import './styles/App.css';

function AppContent() {
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!user) return <Login />;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/employees', label: 'Employees', icon: '👥' },
    { path: '/payroll', label: 'Payroll', icon: '💰' },
    { path: '/hmo', label: 'HMO & Benefits', icon: '🏥' },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">Oxford Suites Makati</div>
          <div className="brand-sub">Payroll & Benefits</div>
        </div>

        <nav className="nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p>{user.name} ({user.role})</p>
          <button type="button" className="logout-button" onClick={logout}>Sign out</button>
          <p>© 2026 Oxford Suites Makati</p>
          <p>Payroll System v1.0</p>
        </div>
      </aside>

      <main className="main">
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/hmo" element={<HMO />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
