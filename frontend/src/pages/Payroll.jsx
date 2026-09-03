import React, { useState, useEffect } from 'react';
import { payrollAPI, employeeAPI } from '../services/api';
import { formatPeso, getCurrentMonthYear, generatePeriodOptions } from '../utils/helpers';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import '../styles/Payroll.css';

export const Payroll = () => {
  const [payroll, setPayroll] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentMonthYear());
  const [formData, setFormData] = useState({
    employeeId: '',
    paymentPeriod: getCurrentMonthYear(),
    basicSalary: '',
    allowance: 0,
    overtime: 0,
    bonusAmount: 0,
  });

  useEffect(() => {
    loadPayroll();
    loadEmployees();
  }, [selectedPeriod]);

  const loadPayroll = async () => {
    try {
      setLoading(true);
      const response = await payrollAPI.getByPeriod(selectedPeriod);
      setPayroll(response.data);
    } catch (error) {
      console.error('Failed to load payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeeAPI.getByStatus('Active');
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : name === 'employeeId' ? value : Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await payrollAPI.create(formData);
      setShowModal(false);
      resetForm();
      loadPayroll();
    } catch (error) {
      console.error('Failed to create payroll:', error);
      alert('Error creating payroll');
    }
  };

  const handleRunBatch = async () => {
    if (window.confirm(`Run payroll for all employees in ${selectedPeriod}?`)) {
      try {
        await payrollAPI.runBatch({ paymentPeriod: selectedPeriod });
        loadPayroll();
        alert('Batch payroll executed successfully');
      } catch (error) {
        console.error('Failed to run batch payroll:', error);
        alert('Error running batch payroll');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      paymentPeriod: selectedPeriod,
      basicSalary: '',
      allowance: 0,
      overtime: 0,
      bonusAmount: 0,
    });
  };

  const getEmployeeName = (id) => {
    if (id && typeof id === 'object') return id.name || 'N/A';
    const emp = employees.find(e => e._id === id);
    return emp?.name || 'N/A';
  };

  const totalGross = payroll.reduce((sum, p) => sum + (p.grossSalary || 0), 0);
  const totalNet = payroll.reduce((sum, p) => sum + (p.netPay || 0), 0);

  return (
    <div className="payroll-page">
      <div className="page-header">
        <div>
          <h1>Payroll Management</h1>
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            {generatePeriodOptions(12).map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="header-actions">
          <Button variant="brass" onClick={handleRunBatch}>
            Run Batch Payroll
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            + Add Manual Entry
          </Button>
        </div>
      </div>

      <div className="payroll-summary">
        <div className="summary-card">
          <div className="summary-label">Total Gross</div>
          <div className="summary-value">{formatPeso(totalGross)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Net</div>
          <div className="summary-value">{formatPeso(totalNet)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Payroll Count</div>
          <div className="summary-value">{payroll.length}</div>
        </div>
      </div>

      <Card title="Payroll Records">
        <Table
          columns={[
            { key: 'employeeId', label: 'Employee', render: (row) => getEmployeeName(row.employeeId) },
            { key: 'basicSalary', label: 'Basic', render: (row) => formatPeso(row.basicSalary) },
            { key: 'grossSalary', label: 'Gross', render: (row) => formatPeso(row.grossSalary) },
            { key: 'withholdingTax', label: 'Tax', render: (row) => formatPeso(row.withholdingTax) },
            { key: 'netPay', label: 'Net Pay', render: (row) => formatPeso(row.netPay) },
            { key: 'status', label: 'Status' },
          ]}
          data={payroll}
          loading={loading}
          actions={(row) => (
            <div className="action-buttons">
              <Button size="sm" variant="ghost">View</Button>
            </div>
          )}
        />
      </Card>

      <Modal
        title="Add Manual Payroll Entry"
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Employee</label>
            <select
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Basic Salary</label>
              <input
                type="number"
                name="basicSalary"
                value={formData.basicSalary}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Allowance</label>
              <input
                type="number"
                name="allowance"
                value={formData.allowance}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Overtime</label>
              <input
                type="number"
                name="overtime"
                value={formData.overtime}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Bonus</label>
              <input
                type="number"
                name="bonusAmount"
                value={formData.bonusAmount}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Payroll
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Payroll;
