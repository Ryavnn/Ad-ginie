import { useState, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function usePublish() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const publishToFacebook = useCallback(async ({ caption, imageUrl, adId }) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/api/publish/facebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          caption,
          image_url: imageUrl,
          ad_id: adId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to publish to Facebook');
      setSuccess('Successfully published to Facebook');
      return data;
    } catch (e) {
      const errorMsg = e.message || String(e);
      setError(errorMsg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishToInstagram = useCallback(async ({ caption, imageUrl, adId }) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/api/publish/instagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          caption,
          image_url: imageUrl,
          ad_id: adId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to publish to Instagram');
      setSuccess('Successfully published to Instagram');
      return data;
    } catch (e) {
      const errorMsg = e.message || String(e);
      setError(errorMsg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishToX = useCallback(async ({ caption, imageUrl, adId }) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/api/publish/x`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          caption,
          image_url: imageUrl,
          ad_id: adId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to publish to X');
      setSuccess('Successfully published to X/Twitter');
      return data;
    } catch (e) {
      const errorMsg = e.message || String(e);
      setError(errorMsg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishToTikTok = useCallback(async ({ caption, imageUrl, adId, videoUrl }) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API_BASE}/api/publish/tiktok`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          caption,
          image_url: imageUrl,
          video_url: videoUrl,
          ad_id: adId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to publish to TikTok');
      setSuccess('Successfully published to TikTok');
      return data;
    } catch (e) {
      const errorMsg = e.message || String(e);
      setError(errorMsg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishToMultiple = useCallback(async ({ caption, imageUrl, platforms, adId }) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const results = {};

    try {
      for (const platform of platforms) {
        try {
          if (platform === 'facebook') {
            results.facebook = await publishToFacebook({ caption, imageUrl, adId });
          } else if (platform === 'instagram') {
            results.instagram = await publishToInstagram({ caption, imageUrl, adId });
          } else if (platform === 'x') {
            results.x = await publishToX({ caption, imageUrl, adId });
          } else if (platform === 'tiktok') {
            results.tiktok = await publishToTikTok({ caption, imageUrl, adId });
          }
        } catch (e) {
          results[platform] = { error: e.message };
        }
      }

      const failedCount = Object.values(results).filter(r => r.error).length;
      if (failedCount === 0) {
        setSuccess(`Successfully published to ${platforms.join(', ')}`);
      } else if (failedCount === platforms.length) {
        throw new Error(`Failed to publish to any platform`);
      } else {
        setSuccess(`Published to ${platforms.length - failedCount} of ${platforms.length} platforms`);
      }

      return results;
    } catch (e) {
      const errorMsg = e.message || String(e);
      setError(errorMsg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [publishToFacebook, publishToInstagram, publishToX, publishToTikTok]);

  const getFacebookPages = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/accounts/facebook/pages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch pages');
      return data.pages || [];
    } catch (e) {
      setError(e.message || String(e));
      return [];
    }
  }, []);

  const getInstagramAccounts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/accounts/instagram/accounts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch accounts');
      return data.accounts || [];
    } catch (e) {
      setError(e.message || String(e));
      return [];
    }
  }, []);

  const getInsights = useCallback(async ({ platform, postId }) => {
    try {
      let endpoint;
      if (platform === 'facebook') {
        endpoint = `/api/insights/facebook/${postId}`;
      } else if (platform === 'instagram') {
        endpoint = `/api/insights/instagram/${postId}`;
      } else if (platform === 'tiktok') {
        endpoint = `/api/insights/tiktok/${postId}`;
      } else {
        endpoint = `/api/insights/x/${postId}`;
      }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch insights');
      return data.insights;
    } catch (e) {
      setError(e.message || String(e));
      return null;
    }
  }, []);

  return {
    loading,
    error,
    success,
    publishToFacebook,
    publishToInstagram,
    publishToX,
    publishToTikTok,
    publishToMultiple,
    getFacebookPages,
    getInstagramAccounts,
    getInsights,
  };
}
