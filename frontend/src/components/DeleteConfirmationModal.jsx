import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import '../styles/DeleteConfirmationModal.css';

export default function DeleteConfirmationModal({ item, onClose, onConfirm, loading = false }) {
  const [verification, setVerification] = useState('');

  if (!item) return null;

  const isVerified = verification === 'DELETE';

  const close = () => {
    setVerification('');
    onClose();
  };

  const confirm = event => {
    event.preventDefault();
    if (isVerified) onConfirm();
  };

  return (
    <Modal title={`Delete ${item.type}`} isOpen={Boolean(item)} onClose={close} size="sm">
      <form onSubmit={confirm}>
        <div className="delete-confirmation">
          <p><strong>{item.name}</strong> is being removed because {item.reason}.</p>
          <p className="delete-warning">This action is permanent and will take effect immediately after confirmation. Related records may prevent deletion to protect payroll and benefits history.</p>
          <div className="form-group">
            <label htmlFor="delete-verification">Type DELETE to verify</label>
            <input
              id="delete-verification"
              value={verification}
              onChange={event => setVerification(event.target.value)}
              autoComplete="off"
              autoFocus
              required
            />
          </div>
        </div>
        <div className="form-actions">
          <Button type="button" variant="ghost" onClick={close}>Cancel</Button>
          <Button type="submit" variant="danger" disabled={!isVerified} loading={loading}>Delete Permanently</Button>
        </div>
      </form>
    </Modal>
  );
}
