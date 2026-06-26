import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, X, Info } from 'lucide-react';

type DialogOptions = {
  title?: string;
  message: string;
  type?: 'alert' | 'confirm' | 'success' | 'error';
  confirmText?: string;
  cancelText?: string;
};

interface DialogContextType {
  showAlert: (message: string, type?: 'alert' | 'success' | 'error', title?: string) => void;
  showConfirm: (message: string, title?: string, confirmText?: string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within a DialogProvider');
  return context;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialogs, setDialogs] = useState<(DialogOptions & { id: string; resolve?: (val: boolean) => void })[]>([]);

  const showAlert = (message: string, type: 'alert' | 'success' | 'error' = 'alert', title?: string) => {
    setDialogs(prev => [...prev, { id: Math.random().toString(), message, type, title }]);
  };

  const showConfirm = (message: string, title?: string, confirmText = 'Ndio'): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogs(prev => [...prev, { id: Math.random().toString(), message, type: 'confirm', title, confirmText, resolve }]);
    });
  };

  const closeDialog = (id: string, result: boolean = false) => {
    setDialogs(prev => {
      const dialog = prev.find(d => d.id === id);
      if (dialog?.resolve) dialog.resolve(result);
      return prev.filter(d => d.id !== id);
    });
  };

  const isBrowser = typeof document !== 'undefined';

  const portalContent = (
    <AnimatePresence>
      {dialogs.map((dialog) => (
        <div 
          key={dialog.id} 
          className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" 
          style={{ zIndex: 1000005 }}
        >
          {/* Prevent clicks on the background overlay or close the non-confirm notifications gently */}
          <div 
            className="absolute inset-0" 
            onClick={() => {
              if (dialog.type !== 'confirm') {
                closeDialog(dialog.id, true);
              }
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm relative z-[1000006] border border-slate-100"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                {dialog.type === 'error' ? (
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                    <X size={20} />
                  </div>
                ) : dialog.type === 'success' ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                ) : dialog.type === 'confirm' ? (
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Info size={20} />
                  </div>
                )}
                <h3 className="text-lg font-bold text-slate-800">
                  {dialog.title || (dialog.type === 'confirm' ? 'Thibitisha' : dialog.type === 'error' ? 'Kosa' : dialog.type === 'success' ? 'Imefanikiwa' : 'Taarifa')}
                </h3>
              </div>
              <p className="text-slate-600 font-medium leading-relaxed mb-6 text-sm">
                {dialog.message}
              </p>
              <div className="flex justify-end gap-3">
                {dialog.type === 'confirm' && (
                  <button
                    onClick={() => closeDialog(dialog.id, false)}
                    className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer text-sm"
                  >
                    {dialog.cancelText || 'Hapana'}
                  </button>
                )}
                <button
                  onClick={() => closeDialog(dialog.id, true)}
                  className={`px-5 py-2 font-bold text-white rounded-xl transition cursor-pointer text-sm ${
                    dialog.type === 'error' ? 'bg-red-600 hover:bg-red-700 shadow-sm' :
                    dialog.type === 'confirm' ? 'bg-primary hover:bg-primary/95 shadow-sm' :
                    dialog.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm' :
                    'bg-blue-600 hover:bg-blue-700 shadow-sm'
                  }`}
                >
                  {dialog.type === 'confirm' ? dialog.confirmText : 'Sawa'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      ))}
    </AnimatePresence>
  );

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {isBrowser ? createPortal(portalContent, document.body) : portalContent}
    </DialogContext.Provider>
  );
}
