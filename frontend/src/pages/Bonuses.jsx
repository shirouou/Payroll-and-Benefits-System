import React, { useEffect, useState } from 'react';
import { bonusesAPI } from '../services/api';
import { formatPeso } from '../utils/helpers';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { useToast } from '../context/ToastContext';
import '../styles/Bonuses.css';

const emptyForm = {
  name: '',
  description: '',
  bonusType: 'Fixed Amount',
  amount: '',
  applicableTo: '',
  bonusMonth: '12',
  status: 'Active',
};

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function Bonuses() {
  const toast = useToast();
  const [bonuses, setBonuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    loadBonuses();
  }, []);

  const loadBonuses = async () => {
    try {
      setLoading(true);
      const response = await bonusesAPI.getAll();
      setBonuses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to load bonus plans:', error);
      toast.error(error.response?.data?.message || 'Bonus plans could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = bonus => {
    if (bonus) {
      setEditingId(bonus._id);
      setFormData({
        ...bonus,
        applicableTo: Array.isArray(bonus.applicableTo) ? bonus.applicableTo.join(', ') : '',
        bonusMonth: String(bonus.bonusMonth || 12),
      });
    } else {
      setEditingId(null);
      setFormData(emptyForm);
    }
    setShowModal(true);
  };

  const handleInputChange = event => {
    const { name, value } = event.target;
    setFormData(previous => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    const payload = {
      ...formData,
      amount: Number(formData.amount),
      bonusMonth: Number(formData.bonusMonth),
      applicableTo: formData.applicableTo
        .split(',')
        .map(value => value.trim())
        .filter(Boolean),
    };

    try {
      if (editingId) {
        await bonusesAPI.update(editingId, payload);
      } else {
        await bonusesAPI.create(payload);
      }
      setShowModal(false);
      loadBonuses();
      toast.success(editingId ? 'Bonus plan updated successfully' : 'Bonus plan created successfully');
    } catch (error) {
      const message = error.response?.data?.message;
      toast.error(Array.isArray(message) ? message.join(', ') : message || 'Error saving bonus plan');
    }
  };

  const handleDelete = async bonus => {
    setDeleteItem({
      id: bonus._id,
      type: 'bonus plan',
      name: bonus.name,
      reason: 'the bonus plan is obsolete or was created for testing',
    });
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      await bonusesAPI.delete(deleteItem.id);
      setDeleteItem(null);
      await loadBonuses();
      toast.success('Bonus plan deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bonus plan was not deleted. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const activePlans = bonuses.filter(bonus => bonus.status === 'Active').length;

  return (
    <div className="bonuses-page">
      <div className="page-header">
        <div>
          <h1>Bonus Plans</h1>
          <p>Configure recurring incentives for departments and positions.</p>
        </div>
        <Button variant="primary" onClick={() => openModal()}>+ Add Bonus Plan</Button>
      </div>

      <div className="bonuses-summary">
        <div className="summary-card"><span>Total plans</span><strong>{bonuses.length}</strong></div>
        <div className="summary-card"><span>Active plans</span><strong>{activePlans}</strong></div>
        <div className="summary-card"><span>Scheduled next</span><strong>{bonuses.filter(bonus => bonus.bonusMonth === new Date().getMonth() + 1).length}</strong></div>
      </div>

      <Card title="Bonus Plan Register">
        <Table
          columns={[
            { key: 'name', label: 'Plan name' },
            { key: 'bonusType', label: 'Type' },
            { key: 'amount', label: 'Amount', render: bonus => bonus.bonusType === 'Percentage' ? `${bonus.amount}%` : formatPeso(bonus.amount) },
            { key: 'applicableTo', label: 'Applies to', render: bonus => bonus.applicableTo?.length ? bonus.applicableTo.join(', ') : 'All employees' },
            { key: 'bonusMonth', label: 'Bonus month', render: bonus => months[bonus.bonusMonth - 1] || 'Not set' },
            { key: 'status', label: 'Status' },
          ]}
          data={bonuses}
          loading={loading}
          actions={bonus => (
            <div className="action-buttons">
              <Button size="sm" variant="ghost" onClick={() => openModal(bonus)}>Edit</Button>
              <Button size="sm" variant="danger" onClick={() => handleDelete(bonus)}>Delete</Button>
            </div>
          )}
        />
      </Card>

      <Modal title={editingId ? 'Edit Bonus Plan' : 'Add Bonus Plan'} isOpen={showModal} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Plan name</label><input name="name" value={formData.name} onChange={handleInputChange} required /></div>
          <div className="form-group"><label>Description</label><textarea name="description" value={formData.description || ''} onChange={handleInputChange} rows="3" /></div>
          <div className="form-row">
            <div className="form-group"><label>Bonus type</label><select name="bonusType" value={formData.bonusType} onChange={handleInputChange}><option>Fixed Amount</option><option>Percentage</option><option>Performance</option></select></div>
            <div className="form-group"><label>Amount</label><input type="number" name="amount" min="0" value={formData.amount} onChange={handleInputChange} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Bonus month</label><select name="bonusMonth" value={formData.bonusMonth} onChange={handleInputChange}>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></div>
            <div className="form-group"><label>Status</label><select name="status" value={formData.status} onChange={handleInputChange}><option>Active</option><option>Inactive</option></select></div>
          </div>
          <div className="form-group"><label>Departments or positions</label><input name="applicableTo" value={formData.applicableTo} onChange={handleInputChange} placeholder="All, Finance, Manager" /><small>Separate multiple entries with commas.</small></div>
          <div className="form-actions"><Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" variant="primary">{editingId ? 'Update Plan' : 'Create Plan'}</Button></div>
        </form>
      </Modal>

      <DeleteConfirmationModal
        item={deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
