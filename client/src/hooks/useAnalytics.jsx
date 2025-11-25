import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAnalytics() {
  const [kpis, setKpis] = useState([]);
  const [platformAnalytics, setPlatformAnalytics] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchKpis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/analytics/kpis`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch KPIs');
      const data = await res.json();
      setKpis(data.kpis || []);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPlatformAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/analytics/platform`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch platform analytics');
      const data = await res.json();
      setPlatformAnalytics(data.analytics || []);
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  const fetchActivities = useCallback(async (limit = 10) => {
    try {
      const res = await fetch(`${API_BASE}/api/activities?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch activities');
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  useEffect(() => {
    fetchKpis();
    fetchPlatformAnalytics();
    fetchActivities();
  }, [fetchKpis, fetchPlatformAnalytics, fetchActivities]);

  return {
    kpis,
    platformAnalytics,
    activities,
    loading,
    error,
    fetchKpis,
    fetchPlatformAnalytics,
    fetchActivities,
  };
}
