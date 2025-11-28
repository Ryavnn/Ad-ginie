import React, { useEffect, useState, createContext } from 'react';

// NotificationContext provides access to in-app notifications and helper methods.
export const NotificationContext = createContext({});

const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Request permission for native notifications (graceful)
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        Notification.requestPermission().catch(() => {});
      } catch (e) {}
    }

    const handler = (e) => {
      const { title, message, type } = e.detail || {};
      const id = Date.now() + Math.random();

      // Show native notification if allowed
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification(title || (type === 'error' ? 'Error' : 'Notification'), {
            body: message || '',
          });
        } catch (err) {
          // ignore
        }
      }

      // Add toast to in-app list (unread). Keep as history for the panel.
      setToasts((t) => [...t, { id, title, message, type, read: false, createdAt: Date.now() }]);
    };

    window.addEventListener('adgenie-notification', handler);
    return () => window.removeEventListener('adgenie-notification', handler);
  }, []);

  const addNotification = ({ title, message, type = 'info' }) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, message, type, read: false, createdAt: Date.now() }]);
  };

  const markRead = (id) => setToasts((t) => t.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setToasts((t) => t.map((n) => ({ ...n, read: true })));
  const clearAll = () => setToasts([]);

  const unreadCount = toasts.filter((t) => !t.read).length;

  return (
    <NotificationContext.Provider value={{ toasts, addNotification, markRead, markAllRead, clearAll, unreadCount }}>
      {children}

      {/* Toast container (temporary popups) */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.slice(-5).map((t) => (
          <div key={t.id} style={{ minWidth: 260, background: t.type === 'error' ? '#FEF2F2' : '#ECFEFF', border: '1px solid', borderColor: t.type === 'error' ? '#FCA5A5' : '#67E8F9', color: '#0f172a', padding: '12px 14px', borderRadius: 12, boxShadow: '0 6px 18px rgba(2,6,23,0.08)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title || (t.type === 'error' ? 'Error' : 'Notification')}</div>
            <div style={{ fontSize: 13 }}>{t.message}</div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
