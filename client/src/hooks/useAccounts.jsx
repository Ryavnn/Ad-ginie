import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/accounts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch accounts');
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const connectAccount = async ({ provider, username, token }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ provider, username, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to connect account');
      await fetchAccounts();
      return data.account;
    } catch (e) {
      setError(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const disconnectAccount = async (accountId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to disconnect account');
      await fetchAccounts();
      return true;
    } catch (e) {
      setError(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    accounts,
    loading,
    error,
    fetchAccounts,
    connectAccount,
    disconnectAccount,
  };
}
