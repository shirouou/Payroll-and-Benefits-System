import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import HMO from './pages/HMO';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/Toast';
import './styles/App.css';

function AccessDenied() {
  const { logout } = useAuth();

  return (
    <div className="access-denied">
      <div className="card">
        <h2>Access denied</h2>
        <p>Your role does not have permission to view this section.</p>
        <button type="button" onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}

function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <AccessDenied />;

  return children;
}

function AppContent() {
  const location = useLocation();
  const { user, logout, hasRole } = useAuth();

  if (!user) return <Login />;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊', roles: ['admin', 'hr', 'payroll', 'viewer'] },
    { path: '/employees', label: 'Employees', icon: '👥', roles: ['admin', 'hr'] },
    { path: '/payroll', label: 'Payroll', icon: '💰', roles: ['admin', 'hr', 'payroll'] },
    { path: '/hmo', label: 'HMO & Benefits', icon: '🏥', roles: ['admin', 'hr'] },
  ].filter(item => hasRole(...item.roles));

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
            <Route path="/employees" element={<ProtectedRoute allowedRoles={['admin', 'hr']}><Employees /></ProtectedRoute>} />
            <Route path="/payroll" element={<ProtectedRoute allowedRoles={['admin', 'hr', 'payroll']}><Payroll /></ProtectedRoute>} />
            <Route path="/hmo" element={<ProtectedRoute allowedRoles={['admin', 'hr']}><HMO /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <AppContent />
          <ToastContainer />
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
