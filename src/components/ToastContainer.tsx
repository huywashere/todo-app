import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types/todo';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map(toast => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 size={18} style={{ color: 'var(--status-completed)', flexShrink: 0 }} />;
            case 'warning':
            case 'error':
              return <AlertCircle size={18} style={{ color: 'var(--priority-urgent)', flexShrink: 0 }} />;
            default:
              return <Info size={18} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />;
          }
        };

        return (
          <div key={toast.id} className={`toast-item ${toast.type} animate-scale-in`}>
            {getIcon()}
            <span style={{ flex: 1 }}>{toast.message}</span>
            {toast.actionLabel && toast.onAction && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.25rem 0.55rem' }}
                onClick={() => {
                  toast.onAction?.();
                  onDismiss(toast.id);
                }}
              >
                {toast.actionLabel}
              </button>
            )}
            <button
              type="button"
              className="action-btn-sm"
              onClick={() => onDismiss(toast.id)}
              title="Đóng thông báo"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
