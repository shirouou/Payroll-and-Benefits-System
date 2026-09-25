import React, { useState, useEffect } from 'react';
import { employeeAPI, payrollAPI, claimsAPI } from '../services/api';
import { formatPeso, getCurrentMonthYear, generatePeriodOptions } from '../utils/helpers';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalPayroll: 0,
    pendingClaims: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentPayroll, setRecentPayroll] = useState([]);
  const [analytics, setAnalytics] = useState({ departments: [], payrollByMonth: [], claimsByStatus: [] });

  useEffect(() => {
    loadDashboardData();
  }, [user?.role]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (user?.role === 'employee') {
        const payrollRes = await payrollAPI.getAll();
        setRecentPayroll(payrollRes.data);
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
        departments: Object.entries(departmentCounts).map(([label, value]) => ({ label, value })),
        payrollByMonth: periods.map(period => ({
          label: period.label.split(' ')[0].slice(0, 3),
          value: payroll.filter(record => record.paymentPeriod === period.value).reduce((sum, record) => sum + (record.netPay || 0), 0),
        })),
        claimsByStatus: ['Pending', 'Approved', 'Rejected', 'Paid'].map(status => ({
          label: status,
          value: claims.filter(claim => claim.status === status).length,
        })),
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const KPICard = ({ label, value, icon }) => (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );

  const BarChart = ({ items, formatValue = value => value }) => {
    const maximum = Math.max(...items.map(item => item.value), 1);
    return (
      <div className="bar-chart">
        {items.map(item => (
          <div className="bar-row" key={item.label}>
            <span className="bar-label">{item.label}</span>
            <div className="bar-track"><span className="bar-fill" style={{ width: `${(item.value / maximum) * 100}%` }} /></div>
            <strong className="bar-value">{formatValue(item.value)}</strong>
          </div>
        ))}
      </div>
    );
  };

  if (user?.role === 'employee') {
    const employee = user.employeeId && typeof user.employeeId === 'object' ? user.employeeId : {};
    return (
      <div className="dashboard employee-dashboard">
        <div className="page-header">
          <h1>My Employee Dashboard</h1>
          <p>View your employee information and payslips.</p>
        </div>
        <div className="kpi-grid">
          <KPICard label="Employee" value={employee.name || user.name} />
          <KPICard label="Department" value={employee.department || 'Not linked'} />
          <KPICard label="Position" value={employee.position || 'Employee'} />
          <KPICard label="Payslips" value={recentPayroll.length} />
        </div>
        <Card title="My Payslips">
          <Table
            columns={[
              { key: 'paymentPeriod', label: 'Period' },
              { key: 'grossSalary', label: 'Gross', render: row => formatPeso(row.grossSalary) },
              { key: 'netPay', label: 'Net pay', render: row => formatPeso(row.netPay) },
              { key: 'status', label: 'Status' },
            ]}
            data={recentPayroll}
            loading={loading}
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome to Oxford Suites Makati Payroll & Benefits System</p>
      </div>

      <div className="kpi-grid">
        <KPICard label="Total Employees" value={stats.totalEmployees} />
        <KPICard label="Active Employees" value={stats.activeEmployees} />
        <KPICard label="This Month Payroll" value={formatPeso(stats.totalPayroll)} />
        <KPICard label="Pending Claims" value={stats.pendingClaims} />
      </div>

      <div className="analytics-grid">
        <Card title="Employees by department">
          <BarChart items={analytics.departments} />
        </Card>
        <Card title="Claims by status">
          <BarChart items={analytics.claimsByStatus} />
        </Card>
        <Card title="Net payroll by month" className="analytics-wide">
          <BarChart items={analytics.payrollByMonth} formatValue={formatPeso} />
        </Card>
      </div>

      <Card title="Recent Payroll Records">
        <Table
          columns={[
            { key: 'employeeId', label: 'Employee', render: (row) => row.employeeId?.name || row.employeeId || 'N/A' },
            { key: 'paymentPeriod', label: 'Period' },
            { key: 'grossSalary', label: 'Gross', render: (row) => formatPeso(row.grossSalary) },
            { key: 'netPay', label: 'Net Pay', render: (row) => formatPeso(row.netPay) },
            { key: 'status', label: 'Status' },
          ]}
          data={recentPayroll}
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
