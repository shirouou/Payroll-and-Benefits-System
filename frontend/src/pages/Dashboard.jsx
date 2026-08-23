import React, { useState, useEffect } from 'react';
import { employeeAPI, payrollAPI } from '../services/api';
import { formatPeso, getCurrentMonthYear } from '../utils/helpers';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import '../styles/Dashboard.css';

export const Dashboard = () => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalPayroll: 0,
    pendingClaims: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentPayroll, setRecentPayroll] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [empRes, activeRes, payrollRes] = await Promise.all([
        employeeAPI.getAll(),
        employeeAPI.getByStatus('Active'),
        payrollAPI.getAll(),
      ]);

      const employees = empRes.data;
      const activeEmployees = activeRes.data;
      const payroll = payrollRes.data;

      const totalPayroll = payroll
        .filter(p => p.paymentPeriod === getCurrentMonthYear())
        .reduce((sum, p) => sum + (p.netPay || 0), 0);

      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeEmployees.length,
        totalPayroll,
        pendingClaims: 0, // To be updated when claims endpoint is ready
      });

      setRecentPayroll(payroll.slice(0, 10));
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

      <Card title="Recent Payroll Records">
        <Table
          columns={[
            { key: 'employeeId', label: 'Employee' },
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
