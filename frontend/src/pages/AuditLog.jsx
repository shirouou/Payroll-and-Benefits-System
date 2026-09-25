import React, { useEffect, useState } from 'react';
import apiClient from '../services/api';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';
import '../styles/AuditLog.css';

export default function AuditLog() {
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/audit');
      setEntries(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const visibleEntries = filter === 'all' ? entries : entries.filter(entry => entry.level === filter);

  return (
    <div className="audit-page">
      <div className="page-header">
        <div>
          <h1>Audit Log</h1>
          <p>Review recent authentication, data access, and security events.</p>
        </div>
        <Button variant="ghost" onClick={loadEntries}>Refresh log</Button>
      </div>

      <div className="audit-filters" role="tablist" aria-label="Audit level">
        {['all', 'info', 'warn', 'error'].map(level => (
          <button type="button" key={level} className={filter === level ? 'active' : ''} onClick={() => setFilter(level)}>
            {level === 'all' ? 'All events' : level}
          </button>
        ))}
      </div>

      <Card title="Recent events">
        <Table
          columns={[
            { key: 'timestamp', label: 'Time' },
            { key: 'level', label: 'Level', render: entry => <span className={`audit-level ${entry.level}`}>{entry.level}</span> },
            { key: 'message', label: 'Event' },
          ]}
          data={visibleEntries}
          loading={loading}
        />
      </Card>
    </div>
  );
}
