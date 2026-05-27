import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 3500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Render Area */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            const isInfo = toast.type === 'info';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md ${
                  isSuccess
                    ? 'bg-emerald-500/90 text-white border-emerald-400/30'
                    : isError
                    ? 'bg-rose-500/90 text-white border-rose-400/30'
                    : 'bg-amber-500/90 text-white border-amber-400/30'
                }`}
              >
                <div>
                  {isSuccess && <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />}
                  {isError && <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />}
                  {isInfo && <Info className="w-5 h-5 mt-0.5 shrink-0" />}
                </div>
                <div className="flex-1 text-sm font-medium pr-2">
                  {toast.message}
                </div>
                <button
                  onClick={() => dismissToast(toast.id)}
                  className="text-white/70 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
