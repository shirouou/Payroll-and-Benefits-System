import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Payroll from './pages/Payroll';
import HMO from './pages/HMO';
import Claims from './pages/Claims';
import Bonuses from './pages/Bonuses';
import AuditLog from './pages/AuditLog';
import Copilot from './pages/Copilot';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/Toast';
import Modal from './components/Modal';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!user) return <Login />;

  const handleLogout = () => {
    setShowLogoutModal(false);
    logout();
  };

  const navGroups = [
    {
      label: 'Main',
      items: [
        { path: '/', label: 'Dashboard', icon: '◔', roles: ['admin', 'hr', 'payroll', 'viewer', 'employee'] },
        { path: '/payroll', label: 'Payroll', icon: '▣', roles: ['admin', 'hr', 'payroll'] },
        { path: '/claims', label: 'Claims & Reimbursement', icon: '▤', roles: ['admin', 'hr', 'payroll', 'employee'] },
        { path: '/hmo', label: 'HMO & Benefits', icon: '♡', roles: ['admin', 'hr'] },
      ],
    },
    {
      label: 'Manage',
      items: [
        { path: '/employees', label: 'Employee Management', icon: '♟', roles: ['admin', 'hr'] },
        { path: '/bonuses', label: 'Bonus Plans', icon: '✦', roles: ['admin', 'hr'] },
        { path: '/audit', label: 'Audit Log', icon: '⌁', roles: ['admin'] },
        { path: '/copilot', label: 'AI Copilot', icon: '✧', roles: ['admin', 'hr', 'payroll', 'employee'] },
      ],
    },
  ].map(group => ({ ...group, items: group.items.filter(item => hasRole(...item.roles)) })).filter(group => group.items.length);

  return (
    <div className={`app ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><span>Oxford Suites</span><span>Makati</span></div>
          <div className="brand-sub">Payroll & Benefits</div>
        </div>

        <nav className="nav">
          {navGroups.map(group => (
            <div className="nav-group" key={group.label}>
              <div className="nav-group-label">{group.label}</div>
              {group.items.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="profile-avatar">{user.name?.charAt(0) || 'A'}</div>
            <div className="profile-copy">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>
            <button type="button" className="logout-button" onClick={() => setShowLogoutModal(true)} aria-label="Sign out" title="Sign out">↪</button>
          </div>
        </div>
      </aside>

      <Modal title="Confirm logout" isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} size="sm">
        <div className="logout-confirmation">
          <p>Are you sure you want to log out?</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary btn-md" onClick={() => setShowLogoutModal(false)}>Cancel</button>
            <button type="button" className="btn btn-primary btn-md" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </Modal>

      <main className="main">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed(previous => !previous)}
          aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<ProtectedRoute allowedRoles={['admin', 'hr']}><Employees /></ProtectedRoute>} />
            <Route path="/payroll" element={<ProtectedRoute allowedRoles={['admin', 'hr', 'payroll']}><Payroll /></ProtectedRoute>} />
            <Route path="/hmo" element={<ProtectedRoute allowedRoles={['admin', 'hr']}><HMO /></ProtectedRoute>} />
            <Route path="/claims" element={<ProtectedRoute allowedRoles={['admin', 'hr', 'payroll', 'employee']}><Claims /></ProtectedRoute>} />
            <Route path="/bonuses" element={<ProtectedRoute allowedRoles={['admin', 'hr']}><Bonuses /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute allowedRoles={['admin']}><AuditLog /></ProtectedRoute>} />
            <Route path="/copilot" element={<ProtectedRoute allowedRoles={['admin', 'hr', 'payroll', 'employee']}><Copilot /></ProtectedRoute>} />
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
