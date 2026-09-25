import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../services/api';
import { formatDate, calculateMonthsWorked } from '../utils/helpers';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { useToast } from '../context/ToastContext';
import '../styles/Employees.css';

export const Employees = () => {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [showReportPassword, setShowReportPassword] = useState(false);
  const [reportForm, setReportForm] = useState({
    reportType: 'employee-list',
    status: 'All',
    department: '',
    password: '',
    confirmPassword: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    basicSalary: '',
    allowance: '',
    dateHired: '',
    status: 'Active',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getAll();
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to load employees:', error);
      toast.error(error.response?.data?.message || 'Employees could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await employeeAPI.update(editingId, formData);
      } else {
        await employeeAPI.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadEmployees();
      toast.success(editingId ? 'Employee updated successfully' : 'Employee created successfully');
    } catch (error) {
      console.error('Failed to save employee:', error);
      const message = error.response?.data?.message;
      toast.error(Array.isArray(message) ? message.join(', ') : message || 'Error saving employee');
    }
  };

  const handleEdit = (employee) => {
    setEditingId(employee._id);
    setFormData(employee);
    setShowModal(true);
  };

  const handleDelete = employee => {
    setDeleteItem({
      id: employee._id,
      type: 'employee',
      name: employee.name,
      reason: 'the employee record is no longer needed for this demo',
    });
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await employeeAPI.delete(deleteItem.id);
      setDeleteItem(null);
      await loadEmployees();
      toast.success('Employee deleted successfully');
    } catch (error) {
      console.error('Failed to delete employee:', error);
      toast.error(error.response?.data?.message || 'Employee was not deleted. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      position: '',
      department: '',
      basicSalary: '',
      allowance: '',
      dateHired: '',
      status: 'Active',
    });
  };

  const closeReportModal = () => {
    setShowReportModal(false);
    setReportError('');
    setShowReportPassword(false);
    setReportForm(previous => ({ ...previous, password: '', confirmPassword: '' }));
  };

  const exportReport = async event => {
    event.preventDefault();
    if (reportForm.password.length < 8) {
      setReportError('Use a PDF password with at least 8 characters.');
      return;
    }
    if (reportForm.password !== reportForm.confirmPassword) {
      setReportError('The PDF passwords do not match.');
      return;
    }
    if (reportForm.department.trim() && !employees.some(employee => employee.department?.toLowerCase() === reportForm.department.trim().toLowerCase())) {
      setReportError('No employees were found for that department. Clear the field or choose an existing department.');
      return;
    }

    try {
      setReportLoading(true);
      setReportError('');
      const response = await employeeAPI.exportReport({
        reportType: reportForm.reportType,
        status: reportForm.status,
        department: reportForm.department.trim(),
        password: reportForm.password,
      });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportForm.reportType}-report.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      closeReportModal();
      toast.success('Password-protected PDF downloaded successfully');
    } catch (error) {
      const message = error.response?.data?.message;
      setReportError(typeof message === 'string' ? message : 'Report could not be generated. Please try again.');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="employees-page">
      <div className="page-header">
        <h1>Employee Management</h1>
        <div className="header-actions">
          <Button variant="brass" onClick={() => setShowReportModal(true)}>Export Reports</Button>
          <Button variant="primary" onClick={() => { resetForm(); setShowModal(true); }}>+ Add Employee</Button>
        </div>
      </div>

      <Card title="Employees">
        <Table
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'position', label: 'Position' },
            { key: 'department', label: 'Department' },
            { key: 'basicSalary', label: 'Salary', render: (row) => `₱${Number(row.basicSalary).toLocaleString()}` },
            { key: 'status', label: 'Status' },
          ]}
          data={employees}
          loading={loading}
          actions={(row) => (
            <div className="action-buttons">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => handleEdit(row)}
              >
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="danger"
                onClick={() => handleDelete(row)}
              >
                Delete
              </Button>
            </div>
          )}
        />
      </Card>

      <Modal
        title={editingId ? 'Edit Employee' : 'Add Employee'}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
              />
            </div>
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

          <div className="form-group">
            <label>Date Hired</label>
            <input
              type="date"
              name="dateHired"
              value={formData.dateHired}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="On Leave">On Leave</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingId ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <DeleteConfirmationModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />

      <Modal title="Export Employee Report" isOpen={showReportModal} onClose={closeReportModal} size="sm">
        <form onSubmit={exportReport}>
          <p className="report-description">Download a PDF report. The file will be password-protected and excludes sensitive identity and banking fields.</p>
          <div className="form-group">
            <label htmlFor="report-type">Report type</label>
            <select id="report-type" value={reportForm.reportType} onChange={event => setReportForm(previous => ({ ...previous, reportType: event.target.value }))}>
              <option value="employee-list">Employee directory</option>
              <option value="salary">Salary report</option>
              <option value="department-summary">Department summary</option>
              <option value="status-summary">Status summary</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="report-status">Status</label>
              <select id="report-status" value={reportForm.status} onChange={event => setReportForm(previous => ({ ...previous, status: event.target.value }))}>
                <option>All</option><option>Active</option><option>Inactive</option><option>On Leave</option><option>Suspended</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="report-department">Department</label>
              <input id="report-department" name="reportDepartment" autoComplete="off" value={reportForm.department} onChange={event => setReportForm(previous => ({ ...previous, department: event.target.value }))} placeholder="All departments" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="report-password">PDF password</label>
            <div className="password-input-wrap">
              <input id="report-password" type={showReportPassword ? 'text' : 'password'} minLength="8" value={reportForm.password} onChange={event => setReportForm(previous => ({ ...previous, password: event.target.value }))} required />
              <button type="button" className="password-toggle" onClick={() => setShowReportPassword(previous => !previous)} aria-label={showReportPassword ? 'Hide PDF password' : 'Show PDF password'}>
                {showReportPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="report-confirm-password">Confirm PDF password</label>
            <div className="password-input-wrap">
              <input id="report-confirm-password" type={showReportPassword ? 'text' : 'password'} minLength="8" value={reportForm.confirmPassword} onChange={event => setReportForm(previous => ({ ...previous, confirmPassword: event.target.value }))} required />
              <button type="button" className="password-toggle" onClick={() => setShowReportPassword(previous => !previous)} aria-label={showReportPassword ? 'Hide confirmed PDF password' : 'Show confirmed PDF password'}>
                {showReportPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {reportError && <div className="form-error">{reportError}</div>}
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={closeReportModal}>Cancel</Button>
            <Button type="submit" variant="primary" loading={reportLoading}>Download PDF</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Employees;
