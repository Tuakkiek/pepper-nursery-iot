import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className={`toast-item ${t.type}`}
          onClick={() => onDismiss(t.id)}
          style={{ cursor: 'pointer' }}
        >
          {t.type === 'success' && <CheckCircle2 size={18} />}
          {t.type === 'error' && <AlertCircle size={18} />}
          {t.type === 'info' && <Info size={18} />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

