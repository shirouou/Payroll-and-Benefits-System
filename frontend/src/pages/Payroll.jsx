import React, { useState, useEffect } from 'react';
import { payrollAPI, employeeAPI } from '../services/api';
import { formatPeso, getCurrentMonthYear, generatePeriodOptions } from '../utils/helpers';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import '../styles/Payroll.css';

export const Payroll = () => {
  const toast = useToast();
  const [payroll, setPayroll] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentMonthYear());
  const [formData, setFormData] = useState({
    employeeId: '',
    paymentPeriod: getCurrentMonthYear(),
    basicSalary: '',
    workingDays: 22,
    daysWorked: 22,
    daysOff: 0,
    paidLeave: 0,
    unpaidLeave: 0,
    holidayDays: 0,
    overtimeHours: 0,
    overtimeRate: 0,
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
      toast.success('Payroll entry created successfully');
    } catch (error) {
      console.error('Failed to create payroll:', error);
      toast.error(error.response?.data?.message || 'Error creating payroll');
    }
  };

  const handleRunBatch = () => {
    setConfirmation({ type: 'batch' });
  };

  const closeConfirmation = () => {
    setConfirmation(null);
  };

  const confirmAction = async () => {
    const action = confirmation;
    closeConfirmation();

    try {
      if (action.type === 'batch') {
        await payrollAPI.runBatch({ paymentPeriod: selectedPeriod });
        loadPayroll();
        toast.success('Batch payroll executed successfully');
      } else {
        await payrollAPI.update(action.record._id, { status: action.status });
        loadPayroll();
        toast.success(`Payroll marked as ${action.status}`);
      }
    } catch (error) {
      const message = action.type === 'batch'
        ? 'Error running batch payroll'
        : `Error marking payroll as ${action.status}`;
      toast.error(error.response?.data?.message || message);
    }
  };

  const updateStatus = async (record, status) => {
    setConfirmation({ type: 'status', record, status });
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      paymentPeriod: selectedPeriod,
      basicSalary: '',
      workingDays: 22,
      daysWorked: 22,
      daysOff: 0,
      paidLeave: 0,
      unpaidLeave: 0,
      holidayDays: 0,
      overtimeHours: 0,
      overtimeRate: 0,
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

  const getEmployee = payrollRecord => {
    if (payrollRecord?.employeeId && typeof payrollRecord.employeeId === 'object') return payrollRecord.employeeId;
    return employees.find(employee => employee._id === payrollRecord?.employeeId) || {};
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
          <Button variant="primary" onClick={handleRunBatch}>
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
            { key: 'daysWorked', label: 'Days worked', render: (row) => `${row.daysWorked ?? 22} / ${row.workingDays ?? 22}` },
            { key: 'overtimeHours', label: 'OT hours', render: (row) => `${row.overtimeHours ?? 0} hrs` },
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
              <Button size="sm" variant="ghost" onClick={() => setSelectedPayroll(row)}>View Payslip</Button>
              {row.status === 'Draft' && <Button size="sm" variant="primary" onClick={() => updateStatus(row, 'Approved')}>Approve</Button>}
              {row.status === 'Approved' && <Button size="sm" variant="brass" onClick={() => updateStatus(row, 'Paid')}>Mark Paid</Button>}
              {row.status !== 'Paid' && row.status !== 'Voided' && <Button size="sm" variant="danger" onClick={() => updateStatus(row, 'Voided')}>Void</Button>}
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
              <label>Working days</label>
              <input type="number" name="workingDays" min="1" value={formData.workingDays} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Days worked</label>
              <input type="number" name="daysWorked" min="0" max={formData.workingDays} value={formData.daysWorked} onChange={handleInputChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group"><label>Days off</label><input type="number" name="daysOff" min="0" value={formData.daysOff} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Paid leave days</label><input type="number" name="paidLeave" min="0" value={formData.paidLeave} onChange={handleInputChange} /></div>
            <div className="form-group"><label>Unpaid leave days</label><input type="number" name="unpaidLeave" min="0" value={formData.unpaidLeave} onChange={handleInputChange} /></div>
          </div>

          <div className="form-row">
            <div className="form-group"><label>Holiday days</label><input type="number" name="holidayDays" min="0" value={formData.holidayDays} onChange={handleInputChange} /></div>
            <div className="form-group"><label>OT hours</label><input type="number" name="overtimeHours" min="0" step="0.5" value={formData.overtimeHours} onChange={handleInputChange} /></div>
            <div className="form-group"><label>OT rate</label><input type="number" name="overtimeRate" min="0" step="0.01" value={formData.overtimeRate} onChange={handleInputChange} /></div>
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

      <Modal
        title="Employee Payslip"
        isOpen={Boolean(selectedPayroll)}
        onClose={() => setSelectedPayroll(null)}
        size="lg"
      >
        {selectedPayroll && (() => {
          const employee = getEmployee(selectedPayroll);
          const deductions = selectedPayroll.deductions || [];
          return (
            <div className="payslip-modal">
              <div className="payslip-heading">
                <div>
                  <strong>Oxford Suites Makati</strong>
                  <span>Payroll &amp; Benefits</span>
                </div>
                <div className="payslip-period">
                  <span>Pay period</span>
                  <strong>{selectedPayroll.paymentPeriod}</strong>
                </div>
              </div>
              <div className="payslip-employee">
                <div><span>Employee</span><strong>{employee.name || getEmployeeName(selectedPayroll.employeeId)}</strong></div>
                <div><span>Position</span><strong>{employee.position || 'N/A'}</strong></div>
                <div><span>Department</span><strong>{employee.department || 'N/A'}</strong></div>
                <div><span>Status</span><strong>{selectedPayroll.status}</strong></div>
                <div><span>Days worked</span><strong>{selectedPayroll.daysWorked ?? 22} / {selectedPayroll.workingDays ?? 22}</strong></div>
                <div><span>Leave / holidays</span><strong>{selectedPayroll.paidLeave ?? 0} paid, {selectedPayroll.unpaidLeave ?? 0} unpaid, {selectedPayroll.holidayDays ?? 0} holiday</strong></div>
              </div>
              <div className="payslip-columns">
                <section><h3>Earnings</h3>
                  <p><span>Monthly basic salary</span><strong>{formatPeso(selectedPayroll.basicSalary)}</strong></p>
                  <p><span>Attendance-adjusted basic</span><strong>{formatPeso(selectedPayroll.proratedBasicSalary ?? selectedPayroll.basicSalary)}</strong></p>
                  <p><span>Allowance</span><strong>{formatPeso(selectedPayroll.allowance)}</strong></p>
                  <p><span>Overtime</span><strong>{formatPeso(selectedPayroll.overtime)}</strong></p>
                  <p><span>OT hours / rate</span><strong>{selectedPayroll.overtimeHours ?? 0} hrs @ {formatPeso(selectedPayroll.overtimeRate)}</strong></p>
                  <p><span>Bonus</span><strong>{formatPeso(selectedPayroll.bonusAmount)}</strong></p>
                  <p className="payslip-total"><span>Gross pay</span><strong>{formatPeso(selectedPayroll.grossSalary)}</strong></p>
                </section>
                <section><h3>Deductions</h3>
                  {deductions.length ? deductions.map(deduction => <p key={deduction.name}><span>{deduction.name}</span><strong>{formatPeso(deduction.amount)}</strong></p>) : <p><span>No deductions</span><strong>{formatPeso(0)}</strong></p>}
                  <p className="payslip-total"><span>Total deductions</span><strong>{formatPeso(deductions.reduce((total, deduction) => total + (deduction.amount || 0), 0))}</strong></p>
                </section>
              </div>
              <div className="payslip-net"><span>Net pay</span><strong>{formatPeso(selectedPayroll.netPay)}</strong></div>
              <div className="payslip-actions"><Button variant="primary" onClick={() => window.print()}>Print Payslip</Button></div>
            </div>
          );
        })()}
      </Modal>

      <Modal
        title={confirmation?.type === 'batch' ? 'Run Batch Payroll' : `Mark Payroll as ${confirmation?.status || ''}`}
        isOpen={Boolean(confirmation)}
        onClose={closeConfirmation}
        size="sm"
      >
        {confirmation?.type === 'batch' ? (
          <div className="payroll-confirmation">
            <p>Run payroll for all active employees for <strong>{selectedPeriod}</strong>?</p>
            <div className="confirmation-detail">
              <span>Employees included</span>
              <strong>{employees.length}</strong>
            </div>
            <p className="confirmation-warning">This will create approved payroll records for the selected period.</p>
          </div>
        ) : (
          <div className="payroll-confirmation">
            <p>Mark the payroll record for <strong>{getEmployeeName(confirmation?.record?.employeeId)}</strong> as <strong>{confirmation?.status}</strong>?</p>
            <div className="confirmation-detail">
              <span>Pay period</span>
              <strong>{confirmation?.record?.paymentPeriod}</strong>
            </div>
            <div className="confirmation-detail">
              <span>Net pay</span>
              <strong>{formatPeso(confirmation?.record?.netPay)}</strong>
            </div>
          </div>
        )}
        <div className="form-actions">
          <Button type="button" variant="ghost" onClick={closeConfirmation}>Cancel</Button>
          <Button type="button" variant="primary" onClick={confirmAction}>Confirm</Button>
        </div>
      </Modal>
    </div>
  );
};

export default Payroll;
