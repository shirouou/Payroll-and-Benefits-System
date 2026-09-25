import React, { useState, useEffect } from 'react';
import { hmoAPI, employeeAPI } from '../services/api';
import { formatPeso, formatDate } from '../utils/helpers';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { useToast } from '../context/ToastContext';
import '../styles/HMO.css';

export const HMO = () => {
  const toast = useToast();
  const [tabs, setTabs] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('plan'); // 'plan' or 'enrollment'
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, enrollmentsRes, empRes] = await Promise.all([
        hmoAPI.plans.getAll(),
        hmoAPI.enrollments.getAll(),
        employeeAPI.getByStatus('Active'),
      ]);
      setPlans(plansRes.data);
      setEnrollments(enrollmentsRes.data);
      setEmployees(empRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error(error.response?.data?.message || 'HMO data could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : 
               ['coverage', 'premium', 'dependents'].includes(name) ? Number(value) : value,
    }));
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await hmoAPI.plans.update(editingId, formData);
      } else {
        await hmoAPI.plans.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
      toast.success(editingId ? 'HMO plan updated successfully' : 'HMO plan created successfully');
    } catch (error) {
      console.error('Failed to save plan:', error);
      toast.error(error.response?.data?.message || 'Error saving plan');
    }
  };

  const handleEnrollmentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await hmoAPI.enrollments.update(editingId, formData);
      } else {
        await hmoAPI.enrollments.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
      toast.success(editingId ? 'Enrollment updated successfully' : 'Employee enrolled successfully');
    } catch (error) {
      console.error('Failed to save enrollment:', error);
      toast.error(error.response?.data?.message || 'Error saving enrollment');
    }
  };

  const handleDelete = async (id, type) => {
    const record = type === 'plan'
      ? plans.find(plan => plan._id === id)
      : enrollments.find(enrollment => enrollment._id === id);
    setDeleteItem({
      id,
      type: type === 'plan' ? 'HMO plan' : 'enrollment',
      name: type === 'plan' ? record?.name : `${getEmployeeName(record?.employeeId)} enrollment`,
      reason: type === 'plan' ? 'the plan is obsolete or was created for testing' : 'the enrollment is no longer active or was created for testing',
      deleteType: type,
    });
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      if (deleteItem.deleteType === 'plan') {
        await hmoAPI.plans.delete(deleteItem.id);
      } else {
        await hmoAPI.enrollments.delete(deleteItem.id);
      }
      setDeleteItem(null);
      await loadData();
      toast.success(`${deleteItem.deleteType === 'plan' ? 'HMO plan' : 'Enrollment'} deleted successfully`);
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error(error.response?.data?.message || 'The item was not deleted. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({});
  };

  const openPlanModal = (plan = null) => {
    setModalType('plan');
    if (plan) {
      setEditingId(plan._id);
      setFormData(plan);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const openEnrollmentModal = (enrollment = null) => {
    setModalType('enrollment');
    if (enrollment) {
      setEditingId(enrollment._id);
      setFormData(enrollment);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const getEmployeeName = (id) => {
    if (id && typeof id === 'object') return id.name || 'N/A';
    const emp = employees.find(e => e._id === id);
    return emp?.name || 'N/A';
  };

  const getPlanName = (id) => {
    if (id && typeof id === 'object') return id.name || 'N/A';
    const plan = plans.find(p => p._id === id);
    return plan?.name || 'N/A';
  };

  const totalEnrolled = enrollments.filter(e => e.status === 'Active').length;
  const totalPremium = enrollments
    .filter(e => e.status === 'Active')
    .reduce((sum, e) => {
      const plan = plans.find(p => p._id === e.planId);
      return sum + (plan?.premium || 0);
    }, 0);

  return (
    <div className="hmo-page">
      <div className="page-header">
        <h1>HMO & Benefits Administration</h1>
      </div>

      <div className="hmo-summary">
        <div className="summary-card">
          <div className="summary-label">HMO Plans</div>
          <div className="summary-value">{plans.length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Employees Enrolled</div>
          <div className="summary-value">{totalEnrolled}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Monthly Premium Cost</div>
          <div className="summary-value">{formatPeso(totalPremium)}</div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${tabs === 'plans' ? 'active' : ''}`}
          onClick={() => setTabs('plans')}
        >
          HMO Plans
        </button>
        <button
          className={`tab ${tabs === 'enrollments' ? 'active' : ''}`}
          onClick={() => setTabs('enrollments')}
        >
          Enrollments
        </button>
      </div>

      {tabs === 'plans' && (
        <Card 
          title="HMO Plans"
          action={
            <Button variant="primary" onClick={() => openPlanModal()}>
              + Add Plan
            </Button>
          }
        >
          <Table
            columns={[
              { key: 'name', label: 'Plan Name' },
              { key: 'description', label: 'Description' },
              { key: 'coverage', label: 'Annual Coverage', render: (row) => formatPeso(row.coverage) },
              { key: 'premium', label: 'Monthly Premium', render: (row) => formatPeso(row.premium) },
              { key: 'status', label: 'Status' },
            ]}
            data={plans}
            loading={loading}
            actions={(row) => (
              <div className="action-buttons">
                <Button size="sm" variant="ghost" onClick={() => openPlanModal(row)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(row._id, 'plan')}>Delete</Button>
              </div>
            )}
          />
        </Card>
      )}

      {tabs === 'enrollments' && (
        <Card
          title="Employee Enrollments"
          action={
            <Button variant="primary" onClick={() => openEnrollmentModal()}>
              + Enroll Employee
            </Button>
          }
        >
          <Table
            columns={[
              { key: 'employeeId', label: 'Employee', render: (row) => getEmployeeName(row.employeeId) },
              { key: 'planId', label: 'Plan', render: (row) => getPlanName(row.planId) },
              { key: 'dependents', label: 'Dependents' },
              { key: 'dateEnrolled', label: 'Enrolled Since', render: (row) => formatDate(row.dateEnrolled) },
              { key: 'status', label: 'Status' },
            ]}
            data={enrollments}
            loading={loading}
            actions={(row) => (
              <div className="action-buttons">
                <Button size="sm" variant="ghost" onClick={() => openEnrollmentModal(row)}>Edit</Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(row._id, 'enrollment')}>Delete</Button>
              </div>
            )}
          />
        </Card>
      )}

      <Modal
        title={modalType === 'plan' ? (editingId ? 'Edit Plan' : 'Add HMO Plan') : (editingId ? 'Edit Enrollment' : 'Enroll Employee')}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      >
        {modalType === 'plan' ? (
          <form onSubmit={handlePlanSubmit}>
            <div className="form-group">
              <label>Plan Name</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Annual Coverage (₱)</label>
                <input
                  type="number"
                  name="coverage"
                  value={formData.coverage || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Monthly Premium (₱)</label>
                <input
                  type="number"
                  name="premium"
                  value={formData.premium || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">{editingId ? 'Update' : 'Create'}</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleEnrollmentSubmit}>
            <div className="form-group">
              <label>Employee</label>
              <select
                name="employeeId"
                value={formData.employeeId || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Plan</label>
              <select
                name="planId"
                value={formData.planId || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Plan</option>
                {plans.map(plan => (
                  <option key={plan._id} value={plan._id}>{plan.name}</option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Number of Dependents</label>
                <input
                  type="number"
                  name="dependents"
                  value={formData.dependents || 0}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Enrollment Date</label>
                <input
                  type="date"
                  name="dateEnrolled"
                  value={formData.dateEnrolled || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" variant="primary">{editingId ? 'Update' : 'Enroll'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <DeleteConfirmationModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default HMO;
