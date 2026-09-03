import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../services/api';
import { formatDate, calculateMonthsWorked } from '../utils/helpers';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import '../styles/Employees.css';

export const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
    } catch (error) {
      console.error('Failed to save employee:', error);
      const message = error.response?.data?.message;
      alert(Array.isArray(message) ? message.join(', ') : message || 'Error saving employee');
    }
  };

  const handleEdit = (employee) => {
    setEditingId(employee._id);
    setFormData(employee);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await employeeAPI.delete(id);
        loadEmployees();
      } catch (error) {
        console.error('Failed to delete employee:', error);
        alert('Error deleting employee');
      }
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

  return (
    <div className="employees-page">
      <div className="page-header">
        <h1>Employee Management</h1>
        <Button 
          variant="primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          + Add Employee
        </Button>
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
                onClick={() => handleDelete(row._id)}
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
    </div>
  );
};

export default Employees;
