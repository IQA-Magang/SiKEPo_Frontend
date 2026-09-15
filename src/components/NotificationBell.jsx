import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, Package, Clock, ExternalLink } from 'lucide-react';
import { notificationApi, getCurrentUser } from '../utils/api.js';

export default function NotificationBell({ onNavigate }) {
  const user = getCurrentUser();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const drawerRef = useRef(null);

  const isManager = user?.role === 'manager';

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    if (isManager && user?.user_id) {
      loadNotifications();
      // Polling setiap 30 detik agar notifikasi real-time tanpa ubah backend
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.user_id, isManager]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function loadNotifications() {
    if (!user?.user_id || !isManager) return;
    setLoading(true);
    try {
      const res = await notificationApi.getByUserId(user.user_id);
      setNotifications(res.data || []);
    } catch {
      // Gracefully ignore error jika offline atau role tidak sesuai
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkRead(notif) {
    if (!notif.is_read) {
      try {
        await notificationApi.markRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
      } catch {
        // ignore
      }
    }

    if (notif.peralatan_id && onNavigate) {
      setOpen(false);
      onNavigate(`/peralatan/detail/${notif.peralatan_id}`);
    }
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.is_read);
    await Promise.allSettled(unread.map((n) => notificationApi.markRead(n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }

  function formatTime(dateStr) {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = Math.floor((now - d) / 1000);
      if (diff < 60) return 'Baru saja';
      if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
      return `${Math.floor(diff / 86400)} hari lalu`;
    } catch {
      return '';
    }
  }

  return (
    <div style={{ position: 'relative' }} ref={drawerRef}>
      <button
        className="icon-badge-button"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open && isManager) loadNotifications();
        }}
        title="Notifikasi Masuk"
        id="btn-notif-bell"
        aria-label="Notifikasi"
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              background: '#FFFFFF',
              color: '#E30613',
              fontSize: '10px',
              fontWeight: 800,
              padding: '1px 5px',
              borderRadius: '9999px',
              border: '2px solid #E30613',
              lineHeight: 1.2,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : (
          <span className="notification-dot" />
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '52px',
            right: 0,
            width: '360px',
            maxHeight: '480px',
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.15)',
            zIndex: 300,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {/* Dropdown Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderBottom: '1px solid #F3F4F6',
              background: '#FAFAFA',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '14px', color: '#111111' }}>Notifikasi</strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: '#FEF2F2',
                    color: '#DC2626',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid #FCA5A5',
                  }}
                >
                  {unreadCount} Baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#DC2626',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onClick={markAllRead}
              >
                <CheckCheck size={14} /> Tandai Dibaca
              </button>
            )}
          </div>

          {/* Notification List */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
            {!isManager ? (
              <div style={{ padding: '28px 20px', textAlign: 'center', color: '#6B7280' }}>
                <p style={{ fontSize: '13px', margin: 0, fontWeight: 500 }}>
                  Notifikasi alur masuk peralatan ditujukan khusus untuk akun <strong>Manager Lab</strong>.
                </p>
              </div>
            ) : loading && notifications.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>
                <div className="spinner-mini" style={{ margin: '0 auto 8px' }} />
                <span style={{ fontSize: '12.5px' }}>Memeriksa notifikasi lab...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: '#9CA3AF' }}>
                <Bell size={28} style={{ opacity: 0.35, margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontSize: '13px', margin: 0 }}>Belum ada notifikasi baru untuk Anda</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkRead(n)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 18px',
                    borderBottom: '1px solid #F9FAFB',
                    cursor: 'pointer',
                    background: n.is_read ? '#FFFFFF' : '#FEF2F2',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = n.is_read ? '#F9FAFB' : '#FEE2E2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = n.is_read ? '#FFFFFF' : '#FEF2F2')}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: n.is_read ? '#F3F4F6' : '#DC2626',
                      color: n.is_read ? '#6B7280' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Package size={16} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: n.is_read ? 600 : 700,
                          color: '#111111',
                        }}
                      >
                        {n.title}
                      </span>
                      {!n.is_read && (
                        <span
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#DC2626',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>

                    <p
                      style={{
                        fontSize: '12px',
                        color: '#4B5563',
                        margin: '3px 0 6px',
                        lineHeight: 1.4,
                      }}
                    >
                      {n.message}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: '#9CA3AF',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {formatTime(n.created_at)}
                      </span>
                      {n.peralatan_id && (
                        <span style={{ color: '#DC2626', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          Buka Alat <ExternalLink size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
