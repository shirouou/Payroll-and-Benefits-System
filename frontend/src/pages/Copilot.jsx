import React, { useEffect, useRef, useState } from 'react';
import apiClient from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import '../styles/Copilot.css';

const suggestionsByRole = {
  admin: [
    'How many employees are in the system?',
    'Which payroll records are still draft?',
    'Summarize the payroll and net pay.',
    'Run a compliance check.',
  ],
  hr: [
    'Show department headcount.',
    'List employees with missing linked accounts.',
    'Run a compliance check.',
    'Which employees are still active?',
  ],
  payroll: [
    'Which payroll records are still draft?',
    'Summarize the payroll and net pay.',
    'Show payroll exceptions.',
    'Check claim approvals and pending payments.',
  ],
  employee: [
    'Show my payroll summary.',
    'What claims are pending?',
    'How much have I been approved this period?',
    'Review my payslips.',
  ],
};

export default function Copilot() {
  const toast = useToast();
  const { user } = useAuth();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('Ask a question about employees, payroll, claims, or compliance.');
  const [intent, setIntent] = useState('');
  const [source, setSource] = useState('');
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi, I can help with payroll, HR summaries, and compliance checks.' },
  ]);
  const messageEndRef = useRef(null);
  const suggestions = suggestionsByRole[user?.role] || suggestionsByRole.admin;

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  const clearHistory = async () => {
    try {
      await apiClient.delete('/copilot/history');
      setMessages([{ role: 'assistant', text: 'Conversation cleared. Ask a new HR or payroll question.' }]);
      setAnswer('Ask a question about employees, payroll, claims, or compliance.');
      setIntent('');
      setSource('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to clear conversation');
    }
  };

  const runCompliance = async () => {
    try {
      const response = await apiClient.get('/copilot/compliance');
      setFindings(response.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to run compliance check');
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await apiClient.get('/copilot/history');
        const history = response.data?.data || [];
        if (history.length) {
          setMessages(history.map(item => ({ role: item.role, text: item.text, source: item.source })));
        }
      } catch (error) {
        console.error('Failed to load Copilot history:', error);
      }
    };

    runCompliance();
    loadHistory();
  }, []);

  const askCopilot = async event => {
    event?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    const nextQuestion = trimmed;
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', text: nextQuestion }]);
    setMessages(prev => [...prev, { role: 'assistant', text: 'Working on that…', pending: true }]);

    try {
      setLoading(true);
      const response = await apiClient.post('/copilot/query', { question: nextQuestion });
      setAnswer(response.data.answer);
      setIntent(response.data.intent);
      setSource(response.data.source || 'rule-based');
      if (response.data.findings) setFindings(response.data.findings);
      setMessages(prev => [
        ...prev.filter(message => !message.pending),
        { role: 'assistant', text: response.data.answer, source: response.data.source || 'rule-based' },
      ]);
    } catch (error) {
      const message = error.response?.data?.message || 'Unable to process Copilot question';
      toast.error(message);
      setMessages(prev => [
        ...prev.filter(message => !message.pending),
        { role: 'assistant', text: 'I could not answer that question right now. Please try a different HR or payroll question.', source: 'error' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="copilot-page">
      <div className="page-header">
        <div>
          <h1>AI Copilot & Compliance</h1>
          <p>{user?.role ? `Signed in as ${user.role}. Ask HR, payroll, or employee questions.` : 'Ask approved payroll questions and review automated compliance findings.'}</p>
        </div>
        <div className="header-actions">
          <Button size="sm" variant="ghost" onClick={runCompliance}>Refresh checks</Button>
          <Button size="sm" variant="ghost" onClick={clearHistory}>Clear chat</Button>
        </div>
      </div>

      <div className="copilot-grid">
        <Card title="Natural language assistant">
          <div className="message-list">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`message-bubble ${message.role} ${message.pending ? 'pending' : ''}`}>
                <div className="message-meta">
                  {message.role === 'assistant' ? 'AI Copilot' : 'You'}
                  {message.source && <span>{message.source}</span>}
                </div>
                <p>{message.text}</p>
              </div>
            ))}
            <div ref={messageEndRef} aria-hidden="true" />
          </div>

          <form onSubmit={askCopilot} className="copilot-form">
            <label htmlFor="copilot-question">Question</label>
            <textarea id="copilot-question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Example: Which payroll records are still draft?" rows="4" />
            <Button type="submit" variant="primary" className="copilot-submit" loading={loading}>Ask Copilot</Button>
          </form>

          <div className="suggestion-list">
            {suggestions.map(suggestion => <button type="button" key={suggestion} onClick={() => setQuestion(suggestion)}>{suggestion}</button>)}
          </div>

          <div className="copilot-answer" aria-live="polite">
            {intent && <span className="intent-label">Intent: {intent}</span>}
            {source && <span className="source-label">Source: {source}</span>}
            <p>{answer}</p>
          </div>
        </Card>

        <Card title="Compliance findings">
          {findings.length ? <div className="finding-list">{findings.map((finding, index) => <div className={`finding ${finding.severity}`} key={`${finding.rule}-${index}`}><strong>{finding.severity}</strong><p>{finding.message}</p></div>)}</div> : <div className="compliance-clear">No compliance findings detected.</div>}
        </Card>
      </div>
    </div>
  );
}
