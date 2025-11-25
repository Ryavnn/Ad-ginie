import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useAds() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/ads`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch ads');
      const data = await res.json();
      setAds(data.ads || []);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const createAd = async (adData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/ads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(adData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create ad');
      await fetchAds();
      return data.ad;
    } catch (e) {
      setError(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const updateAd = async (adId, adData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/ads/${adId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(adData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update ad');
      await fetchAds();
      return data.ad;
    } catch (e) {
      setError(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const deleteAd = async (adId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/ads/${adId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete ad');
      await fetchAds();
      return true;
    } catch (e) {
      setError(e.message || String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    ads,
    loading,
    error,
    fetchAds,
    createAd,
    updateAd,
    deleteAd,
  };
}
