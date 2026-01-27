'use client';

import { useState, useCallback, useMemo } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', duration = 5000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast = { id, message, type, duration };
    
    setToasts(prev => [newToast, ...prev]); // New toasts appear at the top
    
    // Auto-remove after duration
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);

    // Return a function to dismiss the toast manually
    return () => {
      clearTimeout(timer);
      setToasts(prev => prev.filter(toast => toast.id !== id));
    };
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const ToastContainer = useMemo(() => {
    return function ToastContainerComponent() {
      if (toasts.length === 0) return null;

      return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`border rounded-lg p-4 shadow-lg animate-in slide-in-from-right-full duration-300 ${
                toast.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : toast.type === 'error' 
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : toast.type === 'warning' 
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
              onClick={() => removeToast(toast.id)}
            >
              <div className="flex items-start space-x-3">
                <span className="text-lg mt-0.5">
                  {toast.type === 'success' ? '✅' :
                   toast.type === 'error' ? '❌' :
                   toast.type === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium break-words">{toast.message}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeToast(toast.id);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-lg"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          
          {toasts.length > 3 && (
            <div className="text-center">
              <button
                onClick={clearAllToasts}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      );
    };
  }, [toasts, removeToast, clearAllToasts]);

  return { 
    addToast, 
    removeToast, 
    clearAllToasts, 
    ToastContainer,
    toasts // Expose toasts for debugging if needed
  };
}