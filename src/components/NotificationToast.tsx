'use client';

import { useEffect, useState } from 'react';

interface NotificationToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export default function NotificationToast({ 
  message, 
  type = 'info', 
  duration = 3000,
  onClose 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  const typeStyles = {
    success: {
      bg: 'from-emerald-500/90 to-green-600/90',
      border: 'border-emerald-400',
      icon: '✓',
      iconBg: 'bg-emerald-400'
    },
    error: {
      bg: 'from-red-500/90 to-rose-600/90',
      border: 'border-red-400',
      icon: '✕',
      iconBg: 'bg-red-400'
    },
    warning: {
      bg: 'from-amber-500/90 to-orange-600/90',
      border: 'border-amber-400',
      icon: '⚠',
      iconBg: 'bg-amber-400'
    },
    info: {
      bg: 'from-cyan-500/90 to-blue-600/90',
      border: 'border-cyan-400',
      icon: 'ℹ',
      iconBg: 'bg-cyan-400'
    }
  };

  const style = typeStyles[type];

  return (
    <div 
      className={`fixed top-4 right-4 z-[10000] flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r ${style.bg} backdrop-blur-sm border-2 ${style.border} shadow-glow text-white font-semibold ${
        isExiting ? 'animate-slide-right' : 'animate-slide-left'
      }`}
      style={{ minWidth: '300px', maxWidth: '500px' }}
    >
      <div className={`w-10 h-10 rounded-full ${style.iconBg} flex items-center justify-center text-white font-black text-xl animate-bounce-in`}>
        {style.icon}
      </div>
      <div className="flex-1">
        {message}
      </div>
      <button
        onClick={handleClose}
        className="text-white/80 hover:text-white text-2xl leading-none transition-colors hover:scale-110 transform active:scale-95"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

// Toast Manager Hook
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: NotificationToastProps['type'] }>>([]);

  const showToast = (message: string, type: NotificationToastProps['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-[10000] space-y-3">
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ animationDelay: `${index * 0.1}s` }}>
          <NotificationToast
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );

  return { showToast, ToastContainer };
}
