import React, { useEffect, useState, createContext, useRef } from 'react';

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
      setToasts((t) => [...t, { id, title, message, type, read: false, createdAt: Date.now(), persistent: false }]);
    };

    window.addEventListener('adgenie-notification', handler);
    return () => window.removeEventListener('adgenie-notification', handler);
  }, []);

  const addNotification = ({ title, message, type = 'info' }) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, message, type, read: false, createdAt: Date.now(), persistent: false }]);
  };

  const markRead = (id) => setToasts((t) => t.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () => setToasts((t) => t.map((n) => ({ ...n, read: true })));
  const clearAll = () => setToasts([]);

  // Remove a specific notification (from screen/history)
  const removeNotification = (id) => {
    setToasts((t) => t.filter((n) => n.id !== id));
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  };

  const timersRef = useRef({});

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((to) => clearTimeout(to));
      timersRef.current = {};
    };
  }, []);

  // Start auto-dismiss timers for non-persistent toasts
  useEffect(() => {
    toasts.forEach((t) => {
      if (t.persistent) return;
      if (!timersRef.current[t.id]) {
        timersRef.current[t.id] = setTimeout(() => {
          setToasts((cur) => cur.filter((n) => n.id !== t.id));
          delete timersRef.current[t.id];
        }, 6000);
      }
    });
  }, [toasts]);

  const unreadCount = toasts.filter((t) => !t.read).length;

  return (
    <NotificationContext.Provider value={{ toasts, addNotification, markRead, markAllRead, clearAll, unreadCount }}>
      {children}

      {/* Toast container (temporary popups) */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.slice(-5).map((t) => (
          <div
            key={t.id}
            onMouseEnter={() => {
              if (timersRef.current[t.id]) {
                clearTimeout(timersRef.current[t.id]);
                delete timersRef.current[t.id];
              }
            }}
            onMouseLeave={() => {
              if (!t.persistent && !timersRef.current[t.id]) {
                timersRef.current[t.id] = setTimeout(() => {
                  setToasts((cur) => cur.filter((n) => n.id !== t.id));
                  delete timersRef.current[t.id];
                }, 4000);
              }
            }}
            style={{
              position: 'relative',
              minWidth: 260,
              background: t.type === 'error' ? '#FEF2F2' : '#ECFEFF',
              border: '1px solid',
              borderColor: t.type === 'error' ? '#FCA5A5' : '#67E8F9',
              color: '#0f172a',
              padding: '12px 14px',
              borderRadius: 12,
              boxShadow: '0 6px 18px rgba(2,6,23,0.08)'
            }}
          >
            <button
              onClick={() => removeNotification(t.id)}
              aria-label="Dismiss notification"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: '14px'
              }}
            >
              ×
            </button>

            <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.title || (t.type === 'error' ? 'Error' : 'Notification')}</div>
            <div style={{ fontSize: 13 }}>{t.message}</div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
