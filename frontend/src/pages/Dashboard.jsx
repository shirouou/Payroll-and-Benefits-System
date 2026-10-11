import React, { useCallback, useEffect, useState } from 'react';
import { employeeAPI, payrollAPI, claimsAPI } from '../services/api';
import { formatPeso, getCurrentMonthYear, generatePeriodOptions } from '../utils/helpers';
import { useLiveUpdates } from '../hooks/useLiveUpdates';
import Card from '../components/Card';
import Table from '../components/Table';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const CLAIM_STATUSES = ['Pending', 'Approved', 'Rejected', 'Paid'];
const LIVE_LABELS = { live: 'Live', connecting: 'Connecting', offline: 'Reconnecting' };

const compactPeso = value => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(value || 0);

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const StatusBadge = ({ status }) => (
  <span className={`dash-badge ${String(status || '').toLowerCase()}`}>{status || 'N/A'}</span>
);

const KPICard = ({ label, value, hint, tone = 'default', glyph }) => (
  <div className={`kpi-card kpi-${tone}`}>
    <div className="kpi-top">
      <span className="kpi-label">{label}</span>
      <span className="kpi-glyph" aria-hidden="true">{glyph}</span>
    </div>
    <div className="kpi-value">{value}</div>
    {hint && <div className="kpi-hint">{hint}</div>}
  </div>
);

const EmptyChart = () => <div className="chart-empty">No data to display yet</div>;

const BarChart = ({ items, formatValue = value => value, showShare = false, toneFor }) => {
  if (!items.length || items.every(item => item.value === 0)) return <EmptyChart />;
  const maximum = Math.max(...items.map(item => item.value), 1);
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <div className="bar-chart">
      {items.map(item => (
        <div className="bar-row" key={item.label}>
          <span className="bar-label" title={item.label}>{item.label}</span>
          <div className="bar-track">
            <span className={`bar-fill ${toneFor ? toneFor(item) : ''}`} style={{ width: `${(item.value / maximum) * 100}%` }} />
          </div>
          <strong className="bar-value">
            {formatValue(item.value)}
            {showShare && <small>{Math.round((item.value / total) * 100)}%</small>}
          </strong>
        </div>
      ))}
    </div>
  );
};

const ColumnChart = ({ items, formatValue }) => {
  if (!items.length || items.every(item => item.value === 0)) return <EmptyChart />;
  const maximum = Math.max(...items.map(item => item.value), 1);
  return (
    <div className="column-chart" role="img" aria-label="Net payroll by month">
      {items.map(item => (
        <div className="column" key={item.label}>
          <span className="column-value">{formatValue(item.value)}</span>
          <div className="column-track">
            <span className="column-fill" style={{ height: `${Math.max((item.value / maximum) * 100, item.value ? 3 : 0)}%` }} />
          </div>
          <span className="column-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

const LiveIndicator = ({ status, updatedAt }) => (
  <div className="live-indicator">
    <span className={`live-pill ${status}`}><span className="live-dot" />{LIVE_LABELS[status]}</span>
    {updatedAt && <span className="live-updated">Updated {updatedAt.toLocaleTimeString('en-PH')}</span>}
  </div>
);

export const Dashboard = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalPayroll: 0,
    pendingClaims: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentPayroll, setRecentPayroll] = useState([]);
  const [analytics, setAnalytics] = useState({ departments: [], payrollByMonth: [], claimsByStatus: [] });
  const [updatedAt, setUpdatedAt] = useState(null);

  const loadDashboardData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      if (isEmployee) {
        const payrollRes = await payrollAPI.getAll();
        setRecentPayroll(payrollRes.data);
        setUpdatedAt(new Date());
        return;
      }
      const [empRes, activeRes, payrollRes, claimsRes] = await Promise.all([
        employeeAPI.getAll(),
        employeeAPI.getByStatus('Active'),
        payrollAPI.getAll(),
        claimsAPI.getAll(),
      ]);

      const employees = empRes.data;
      const activeEmployees = activeRes.data;
      const payroll = payrollRes.data;
      const claims = claimsRes.data;

      const totalPayroll = payroll
        .filter(p => p.paymentPeriod === getCurrentMonthYear())
        .reduce((sum, p) => sum + (p.netPay || 0), 0);

      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        totalPayroll,
        pendingClaims: claims.filter(claim => claim.status === 'Pending').length,
      });

      setRecentPayroll(payroll.slice(0, 10));
      const departmentCounts = employees.reduce((counts, employee) => {
        counts[employee.department] = (counts[employee.department] || 0) + 1;
        return counts;
      }, {});
      const periods = generatePeriodOptions(6).reverse();
      setAnalytics({
        departments: Object.entries(departmentCounts)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value),
        payrollByMonth: periods.map(period => ({
          label: period.label.split(' ')[0].slice(0, 3),
          value: payroll.filter(record => record.paymentPeriod === period.value).reduce((sum, record) => sum + (record.netPay || 0), 0),
        })),
        claimsByStatus: CLAIM_STATUSES.map(status => ({
          label: status,
          value: claims.filter(claim => claim.status === status).length,
        })),
      });
      setUpdatedAt(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [isEmployee]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const liveStatus = useLiveUpdates(() => loadDashboardData({ silent: true }), Boolean(user));

  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const firstName = (user?.name || '').split(' ')[0];

  if (isEmployee) {
    const employee = user.employeeId && typeof user.employeeId === 'object' ? user.employeeId : {};
    return (
      <div className="dashboard employee-dashboard">
        <div className="dash-header">
          <div>
            <span className="dash-eyebrow">{today}</span>
            <h1>{getGreeting()}, {firstName || 'there'}</h1>
            <p>View your employee information and payslips.</p>
          </div>
          <LiveIndicator status={liveStatus} updatedAt={updatedAt} />
        </div>
        <div className="kpi-grid">
          <KPICard label="Employee" value={employee.name || user.name} glyph="♟" />
          <KPICard label="Department" value={employee.department || 'Not linked'} glyph="▣" />
          <KPICard label="Position" value={employee.position || 'Employee'} glyph="✦" />
          <KPICard label="Payslips" value={recentPayroll.length} hint="Available to view" glyph="▤" />
        </div>
        <Card title="My Payslips">
          <Table
            columns={[
              { key: 'paymentPeriod', label: 'Period' },
              { key: 'grossSalary', label: 'Gross', render: row => formatPeso(row.grossSalary), className: 'num-cell' },
              { key: 'netPay', label: 'Net pay', render: row => formatPeso(row.netPay), className: 'num-cell' },
              { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
            ]}
            data={recentPayroll}
            loading={loading}
          />
        </Card>
      </div>
    );
  }

  const inactiveCount = Math.max(stats.totalEmployees - stats.activeEmployees, 0);
  const activeShare = stats.totalEmployees ? Math.round((stats.activeEmployees / stats.totalEmployees) * 100) : 0;
  const currentMonthLabel = generatePeriodOptions(1)[0].label;

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <span className="dash-eyebrow">{today}</span>
          <h1>{getGreeting()}, {firstName || 'there'}</h1>
          <p>Oxford Suites Makati workforce, payroll and benefits at a glance.</p>
        </div>
        <LiveIndicator status={liveStatus} updatedAt={updatedAt} />
      </div>

      <div className="kpi-grid">
        <KPICard label="Total Employees" value={stats.totalEmployees} hint={`${inactiveCount} not currently active`} glyph="♟" />
        <KPICard label="Active Employees" value={stats.activeEmployees} hint={`${activeShare}% of workforce`} glyph="✓" />
        <KPICard label="This Month Payroll" value={formatPeso(stats.totalPayroll)} hint={`Net pay · ${currentMonthLabel}`} glyph="▣" />
        <KPICard
          label="Pending Claims"
          value={stats.pendingClaims}
          hint={stats.pendingClaims ? 'Awaiting review' : 'All caught up'}
          tone={stats.pendingClaims ? 'alert' : 'default'}
          glyph="▤"
        />
      </div>

      <div className="analytics-grid">
        <Card title="Employees by department">
          <BarChart items={analytics.departments} showShare />
        </Card>
        <Card title="Claims by status">
          <BarChart items={analytics.claimsByStatus} toneFor={item => `tone-${item.label.toLowerCase()}`} />
        </Card>
        <Card title="Net payroll by month" className="analytics-wide">
          <ColumnChart items={analytics.payrollByMonth} formatValue={compactPeso} />
        </Card>
      </div>

      <Card title="Recent Payroll Records">
        <Table
          columns={[
            { key: 'employeeId', label: 'Employee', render: (row) => row.employeeId?.name || row.employeeId || 'N/A' },
            { key: 'paymentPeriod', label: 'Period' },
            { key: 'grossSalary', label: 'Gross', render: (row) => formatPeso(row.grossSalary), className: 'num-cell' },
            { key: 'netPay', label: 'Net Pay', render: (row) => formatPeso(row.netPay), className: 'num-cell' },
            { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
          ]}
          data={recentPayroll}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
