import { useEffect, useState } from 'react';
import { useModal } from '../../context/ModalContext';

const ICONS = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

const TYPE_STYLES = {
  success: {
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.35)',
    accent: '#10b981',
    text: '#d1fae5',
    bar: '#10b981',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)',
    accent: '#ef4444',
    text: '#fee2e2',
    bar: '#ef4444',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.35)',
    accent: '#f59e0b',
    text: '#fef3c7',
    bar: '#f59e0b',
  },
  info: {
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.35)',
    accent: '#6366f1',
    text: '#e0e7ff',
    bar: '#6366f1',
  },
};

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const s = TYPE_STYLES[toast.type] || TYPE_STYLES.success;

  useEffect(() => {
    // trigger slide-in on mount
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => onDismiss(toast.id), 280);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.7rem',
        padding: '0.75rem 1rem',
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: '10px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
        minWidth: '260px',
        maxWidth: '360px',
        position: 'relative',
        overflow: 'hidden',
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(-16px) scale(0.96)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.34,1.4,0.64,1), opacity 0.2s ease',
        cursor: 'default',
        pointerEvents: 'all',
      }}
    >
      {/* Left accent bar */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        background: s.bar,
        borderRadius: '10px 0 0 10px',
      }} />

      {/* Icon */}
      <div style={{
        flexShrink: 0,
        marginTop: '1px',
        color: s.accent,
        display: 'flex',
        alignItems: 'center',
      }}>
        {ICONS[toast.type] || ICONS.success}
      </div>

      {/* Message */}
      <div style={{
        flex: 1,
        fontSize: '0.84rem',
        fontWeight: 500,
        color: s.text,
        lineHeight: 1.4,
        wordBreak: 'break-word',
      }}>
        {toast.message}
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification"
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          color: s.accent,
          cursor: 'pointer',
          padding: '0',
          display: 'flex',
          alignItems: 'center',
          opacity: 0.7,
          transition: 'opacity 0.15s',
          marginTop: '1px',
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default function Toast() {
  const { toasts, dismissToast } = useModal();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      id="toast-stack"
      style={{
        position: 'fixed',
        top: '20px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 99999,
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
