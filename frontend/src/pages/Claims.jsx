import React, { useEffect, useState } from 'react';
import { claimsAPI, hmoAPI } from '../services/api';
import { formatDate, formatPeso } from '../utils/helpers';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import '../styles/Claims.css';

const emptyForm = {
  enrollmentId: '',
  employeeId: '',
  claimDate: new Date().toISOString().slice(0, 10),
  serviceDate: '',
  provider: '',
  description: '',
  claimAmount: '',
};

const getReferenceName = reference => (
  reference && typeof reference === 'object' ? reference.name : reference
);

export default function Claims() {
  const toast = useToast();
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const [claims, setClaims] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [approvalClaim, setApprovalClaim] = useState(null);
  const [approvalAmount, setApprovalAmount] = useState('');
  const [approvalError, setApprovalError] = useState('');
  const [rejectionClaim, setRejectionClaim] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [reasonClaim, setReasonClaim] = useState(null);

  useEffect(() => {
    loadData();
  }, [isEmployee]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [claimsResponse, enrollmentsResponse] = await Promise.all([
        claimsAPI.getAll(),
        isEmployee ? claimsAPI.getAvailableEnrollments() : hmoAPI.enrollments.getAll(),
      ]);
      setClaims(claimsResponse.data);
      setEnrollments(enrollmentsResponse.data);
    } catch (error) {
      console.error('Failed to load claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = event => {
    const { name, value } = event.target;
    setFormData(previous => ({
      ...previous,
      [name]: name === 'claimAmount' ? (value === '' ? '' : Number(value)) : value,
    }));
  };

  const handleEnrollmentChange = event => {
    const enrollmentId = event.target.value;
    const enrollment = enrollments.find(item => item._id === enrollmentId);
    setFormData(previous => ({
      ...previous,
      enrollmentId,
      employeeId: getReferenceName(enrollment?.employeeId) ? enrollment.employeeId?._id || enrollment.employeeId : '',
    }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    try {
      await claimsAPI.create(formData);
      setShowModal(false);
      setFormData(emptyForm);
      loadData();
      toast.success('Claim submitted successfully');
    } catch (error) {
      const message = error.response?.data?.message;
      toast.error(Array.isArray(message) ? message.join(', ') : message || 'Error submitting claim');
    }
  };

  const approveClaim = async claim => {
    setApprovalClaim(claim);
    setApprovalAmount(String(claim.claimAmount));
    setApprovalError('');
  };

  const closeApprovalModal = () => {
    setApprovalClaim(null);
    setApprovalAmount('');
    setApprovalError('');
  };

  const submitApproval = async event => {
    event.preventDefault();
    const amount = Number(approvalAmount);
    const claimAmount = Number(approvalClaim?.claimAmount);

    if (!Number.isFinite(amount) || amount < 0 || amount > claimAmount) {
      setApprovalError(`Enter an amount between ₱0.00 and ${formatPeso(claimAmount)}.`);
      return;
    }

    try {
      await claimsAPI.approve(approvalClaim._id, { approvedAmount: amount });
      closeApprovalModal();
      loadData();
      toast.success('Claim approved successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error approving claim');
    }
  };

  const rejectClaim = async claim => {
    setRejectionClaim(claim);
    setRejectionReason(claim.notes || '');
    setRejectionError('');
  };

  const closeRejectionModal = () => {
    setRejectionClaim(null);
    setRejectionReason('');
    setRejectionError('');
  };

  const submitRejection = async event => {
    event.preventDefault();
    const notes = rejectionReason.trim();
    if (!notes) {
      setRejectionError('Please provide a reason for rejecting this claim.');
      return;
    }

    try {
      await claimsAPI.reject(rejectionClaim._id, { notes });
      closeRejectionModal();
      loadData();
      toast.success('Claim rejected');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error rejecting claim');
    }
  };

  const visibleClaims = filter === 'All' ? claims : claims.filter(claim => claim.status === filter);
  const pendingCount = claims.filter(claim => claim.status === 'Pending').length;
  const approvedTotal = claims
    .filter(claim => claim.status === 'Approved' || claim.status === 'Paid')
    .reduce((total, claim) => total + (claim.approvedAmount || 0), 0);

  return (
    <div className="claims-page">
      <div className="page-header">
        <div>
          <h1>{isEmployee ? 'My Claims' : 'Claims & Reimbursement'}</h1>
          <p>{isEmployee ? 'Submit and track your benefit reimbursement requests.' : 'Review employee medical and benefit reimbursement requests.'}</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>+ Submit Claim</Button>
      </div>

      <div className="claims-summary">
        <div className="summary-card"><span>Pending review</span><strong>{pendingCount}</strong></div>
        <div className="summary-card"><span>Total claims</span><strong>{claims.length}</strong></div>
        <div className="summary-card"><span>Approved value</span><strong>{formatPeso(approvedTotal)}</strong></div>
      </div>

      <div className="claim-filters" role="tablist" aria-label="Claim status">
        {['All', 'Pending', 'Approved', 'Rejected', 'Paid'].map(status => (
          <button
            type="button"
            key={status}
            className={filter === status ? 'active' : ''}
            onClick={() => setFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <Card title="Claims Register">
        <Table
          columns={[
            ...(!isEmployee ? [{ key: 'employeeId', label: 'Employee', render: claim => getReferenceName(claim.employeeId) || 'N/A' }] : []),
            { key: 'provider', label: 'Provider' },
            { key: 'serviceDate', label: 'Service date', render: claim => formatDate(claim.serviceDate) },
            { key: 'claimAmount', label: 'Claim amount', render: claim => formatPeso(claim.claimAmount) },
            { key: 'approvedAmount', label: 'Approved', render: claim => formatPeso(claim.approvedAmount) },
            { key: 'status', label: 'Status', render: claim => <span className={`claim-status ${claim.status.toLowerCase()}`}>{claim.status}</span> },
          ]}
          data={visibleClaims}
          loading={loading}
          actions={claim => {
            if (!isEmployee && claim.status === 'Pending') {
              return (
                <div className="action-buttons">
                  <Button size="sm" variant="primary" onClick={() => approveClaim(claim)}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => rejectClaim(claim)}>Reject</Button>
                </div>
              );
            }
            if (isEmployee && claim.status === 'Rejected') {
              return <Button size="sm" variant="ghost" onClick={() => setReasonClaim(claim)}>View reason</Button>;
            }
            return null;
          }}
        />
      </Card>

      <Modal title="Submit Benefit Claim" isOpen={showModal} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{isEmployee ? 'HMO enrollment' : 'Enrolled employee'}</label>
            <select name="enrollmentId" value={formData.enrollmentId} onChange={handleEnrollmentChange} required>
              <option value="">Select employee</option>
              {enrollments.map(enrollment => (
                <option key={enrollment._id} value={enrollment._id}>
                  {getReferenceName(enrollment.employeeId) || 'Employee'}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Claim date</label><input type="date" name="claimDate" value={formData.claimDate} onChange={handleInputChange} required /></div>
            <div className="form-group"><label>Service date</label><input type="date" name="serviceDate" value={formData.serviceDate} onChange={handleInputChange} required /></div>
          </div>
          <div className="form-group"><label>Provider</label><input type="text" name="provider" value={formData.provider} onChange={handleInputChange} required /></div>
          <div className="form-group"><label>Description</label><textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" required /></div>
          <div className="form-group"><label>Claim amount (PHP)</label><input type="number" name="claimAmount" min="0" value={formData.claimAmount} onChange={handleInputChange} required /></div>
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Submit Claim</Button>
          </div>
        </form>
      </Modal>

      <Modal title="Approve Claim" isOpen={Boolean(approvalClaim)} onClose={closeApprovalModal} size="sm">
        {approvalClaim && (
          <form onSubmit={submitApproval}>
            <div className="approval-summary">
              <div><span>Employee</span><strong>{getReferenceName(approvalClaim.employeeId) || 'N/A'}</strong></div>
              <div><span>Provider</span><strong>{approvalClaim.provider}</strong></div>
              <div><span>Claim amount</span><strong>{formatPeso(approvalClaim.claimAmount)}</strong></div>
            </div>
            <div className="form-group">
              <label htmlFor="approved-amount">Approved amount (PHP)</label>
              <input
                id="approved-amount"
                type="number"
                min="0"
                max={approvalClaim.claimAmount}
                step="0.01"
                value={approvalAmount}
                onChange={event => {
                  setApprovalAmount(event.target.value);
                  setApprovalError('');
                }}
                required
                autoFocus
              />
              <small className="field-hint">You may approve the full claim or a partial amount.</small>
              {approvalError && <div className="form-error">{approvalError}</div>}
            </div>
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={closeApprovalModal}>Cancel</Button>
              <Button type="submit" variant="primary">Confirm Approval</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal title="Reject Claim" isOpen={Boolean(rejectionClaim)} onClose={closeRejectionModal} size="sm">
        {rejectionClaim && (
          <form onSubmit={submitRejection}>
            <div className="approval-summary rejection-summary">
              <div><span>Employee</span><strong>{getReferenceName(rejectionClaim.employeeId) || 'N/A'}</strong></div>
              <div><span>Provider</span><strong>{rejectionClaim.provider}</strong></div>
              <div><span>Claim amount</span><strong>{formatPeso(rejectionClaim.claimAmount)}</strong></div>
            </div>
            <div className="form-group">
              <label htmlFor="rejection-reason">Reason for rejection</label>
              <textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={event => {
                  setRejectionReason(event.target.value);
                  setRejectionError('');
                }}
                rows="4"
                placeholder="Explain why this claim cannot be approved"
                autoFocus
                required
              />
              {rejectionError && <div className="form-error">{rejectionError}</div>}
            </div>
            <div className="form-actions">
              <Button type="button" variant="ghost" onClick={closeRejectionModal}>Cancel</Button>
              <Button type="submit" variant="danger">Confirm Rejection</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal title="Claim rejection reason" isOpen={Boolean(reasonClaim)} onClose={() => setReasonClaim(null)} size="sm">
        {reasonClaim && (
          <div className="rejection-details">
            <div className="approval-summary rejection-summary">
              <div><span>Provider</span><strong>{reasonClaim.provider}</strong></div>
              <div><span>Claim amount</span><strong>{formatPeso(reasonClaim.claimAmount)}</strong></div>
              <div><span>Status</span><strong className="rejection-label">Rejected</strong></div>
            </div>
            <div className="rejection-reason" role="alert">
              <span>Reason provided by HR or an administrator</span>
              <p>{reasonClaim.notes || 'No rejection reason was provided.'}</p>
            </div>
            <div className="form-actions">
              <Button type="button" variant="primary" onClick={() => setReasonClaim(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
