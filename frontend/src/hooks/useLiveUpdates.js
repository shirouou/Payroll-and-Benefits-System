import { useEffect, useRef, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const MIN_RETRY_MS = 2000;
const MAX_RETRY_MS = 30000;
const DEBOUNCE_MS = 400;

const readAccessToken = () => (
  sessionStorage.getItem('payroll_auth_token_session')
  || sessionStorage.getItem('payroll_auth_token')
  || localStorage.getItem('payroll_auth_token')
);

/**
 * Calls onChange whenever the server reports a data change (and after reconnecting,
 * to catch anything missed). Returns the connection state: 'connecting' | 'live' | 'offline'.
 * A fetch stream is used instead of EventSource so the bearer token can be sent.
 */
export const useLiveUpdates = (onChange, enabled = true) => {
  const [status, setStatus] = useState('connecting');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!enabled) return undefined;

    const controller = new AbortController();
    let retryDelay = MIN_RETRY_MS;
    let retryTimer;
    let debounceTimer;
    let stopped = false;

    const notify = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => onChangeRef.current?.(), DEBOUNCE_MS);
    };

    const connect = async () => {
      try {
        setStatus('connecting');
        const token = readAccessToken();
        const response = await fetch(`${API_BASE_URL}/events`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error(`Live updates unavailable (${response.status})`);

        setStatus('live');
        retryDelay = MIN_RETRY_MS;
        notify();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const messages = buffer.split('\n\n');
          buffer = messages.pop();
          if (messages.some(message => message.includes('data:'))) notify();
        }
      } catch (error) {
        if (stopped) return;
      }
      if (stopped) return;
      setStatus('offline');
      retryTimer = setTimeout(connect, retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS);
    };

    connect();

    return () => {
      stopped = true;
      controller.abort();
      clearTimeout(retryTimer);
      clearTimeout(debounceTimer);
    };
  }, [enabled]);

  return status;
};

export default useLiveUpdates;
