'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { 
  AlertTriangle, CheckCircle2, AlertCircle, Info, 
  X, HelpCircle, ArrowRight 
} from 'lucide-react';

export type DialogType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface AlertOptions {
  title: string;
  message: string;
  type?: DialogType;
  buttonText?: string;
  onClose?: () => void;
}

interface ConfirmationContextType {
  confirm: (options: ConfirmOptions) => void;
  showAlert: (options: AlertOptions) => void;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const [alertState, setAlertState] = useState<AlertOptions | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmState(options);
  }, []);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState(options);
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmState) return;
    setLoading(true);
    try {
      await confirmState.onConfirm();
      setConfirmState(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAction = () => {
    if (confirmState?.onCancel) {
      confirmState.onCancel();
    }
    setConfirmState(null);
  };

  const handleCloseAlert = () => {
    if (alertState?.onClose) {
      alertState.onClose();
    }
    setAlertState(null);
  };

  const getIcon = (type: DialogType = 'info') => {
    switch (type) {
      case 'danger':
        return (
          <div className="w-14 h-14 rounded-2xl bg-red-100/80 border border-red-200 text-red-600 flex items-center justify-center shadow-sm">
            <AlertCircle className="w-7 h-7 stroke-[2.5]" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-14 h-14 rounded-2xl bg-amber-100/80 border border-amber-200 text-amber-600 flex items-center justify-center shadow-sm">
            <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
          </div>
        );
      case 'success':
        return (
          <div className="w-14 h-14 rounded-2xl bg-emerald-100/80 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="w-14 h-14 rounded-2xl bg-blue-100/80 border border-blue-200 text-blue-600 flex items-center justify-center shadow-sm">
            <HelpCircle className="w-7 h-7 stroke-[2.5]" />
          </div>
        );
    }
  };

  return (
    <ConfirmationContext.Provider value={{ confirm, showAlert }}>
      {children}

      {/* ─── MODAL XÁC NHẬN THAO TÁC TRỰC TIẾP TRÊN MÀN HÌNH ─── */}
      {confirmState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-center">
              {getIcon(confirmState.type)}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {confirmState.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {confirmState.message}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelAction}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {confirmState.cancelText || 'Hủy bỏ'}
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={loading}
                className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                  confirmState.type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                    : confirmState.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{confirmState.confirmText || 'Xác nhận'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL THÔNG BÁO KẾT QUẢ THAO TÁC TRÊN MÀN HÌNH ─── */}
      {alertState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-center">
              {getIcon(alertState.type)}
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {alertState.title}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {alertState.message}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleCloseAlert}
                className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  alertState.type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                    : alertState.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                    : alertState.type === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                <span>{alertState.buttonText || 'Đồng ý'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmationContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmationProvider');
  }
  return context;
}
