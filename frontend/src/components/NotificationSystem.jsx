import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X, ShieldAlert, Lock } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  const showConfirm = useCallback((title, message, onConfirm, type = 'warning', requirePassword = null) => {
    setConfirm({ title, message, onConfirm, type, requirePassword });
    setPasswordInput('');
    setPasswordError('');
  }, []);

  const handleConfirm = async () => {
    if (confirm?.requirePassword && !passwordInput) {
      setPasswordError('Authorization password is required');
      return;
    }
    if (confirm?.onConfirm) {
      try {
        await confirm.onConfirm(passwordInput);
        setConfirm(null);
        setPasswordInput('');
        setPasswordError('');
      } catch (err) {
        setPasswordError(err.message);
      }
    } else {
      setConfirm(null);
      setPasswordInput('');
      setPasswordError('');
    }
  };

  const handleCancel = () => {
    setConfirm(null);
    setPasswordInput('');
    setPasswordError('');
  };

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-10 left-1/2 z-[9999] pointer-events-none">
          <div className={`
            flex items-center space-x-3 px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] 
            border-2 backdrop-blur-sm transition-all duration-500 animate-slide-down-fade pointer-events-auto
            ${toast.type === 'success' ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#14532d]' : 
              toast.type === 'error' ? 'bg-[#fef2f2] border-[#fecaca] text-[#7f1d1d]' : 
              'bg-[#fffbeb] border-[#fef3c7] text-[#78350f]'}
          `}>
            <div className={`p-2 rounded-full shadow-sm ${
              toast.type === 'success' ? 'bg-white text-[#22c55e]' : 
              toast.type === 'error' ? 'bg-white text-[#ef4444]' : 
              'bg-white text-[#f59e0b]'
            }`}>
              {toast.type === 'success' ? <CheckCircle size={20} /> : 
               toast.type === 'error' ? <AlertCircle size={20} /> : 
               <AlertTriangle size={20} />}
            </div>
            <div className="flex flex-col">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 opacity-60 ${
                toast.type === 'success' ? 'text-[#15803d]' : 
                toast.type === 'error' ? 'text-[#b91c1c]' : 
                'text-[#b45309]'
              }`}>
                {toast.type === 'success' ? 'System Success' : toast.type === 'error' ? 'Security Alert' : 'System Notice'}
              </span>
              <span className="text-sm font-black tracking-tight">{toast.message}</span>
            </div>
            <button 
              onClick={() => setToast(null)} 
              className={`ml-4 p-1 rounded-full transition-colors ${
                toast.type === 'success' ? 'hover:bg-[#dcfce7] text-[#15803d]/50' : 
                toast.type === 'error' ? 'hover:bg-[#fee2e2] text-[#b91c1c]/50' : 
                'hover:bg-[#fef3c7] text-[#b45309]/50'
              }`}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-backdrop" onClick={handleCancel}></div>
          <div className="bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-200 w-full max-w-md overflow-hidden relative z-10 animate-scale-in">
            <div className={`h-2 w-full ${
              confirm.type === 'danger' ? 'bg-red-600' : 
              confirm.type === 'warning' ? 'bg-amber-500' : 
              'bg-[#8A1538]'
            }`}></div>
            <div className="p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className={`p-4 rounded-2xl ${
                  confirm.type === 'danger' ? 'bg-red-50 text-red-600' : 
                  confirm.type === 'warning' ? 'bg-amber-50 text-amber-600' : 
                  'bg-red-50 text-[#8A1538]'
                }`}>
                  {confirm.type === 'danger' ? <ShieldAlert size={32} /> : 
                   confirm.type === 'warning' ? <AlertTriangle size={32} /> : 
                   <Info size={32} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                    {confirm.title || 'Are you sure?'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Authorization Required</p>
                </div>
              </div>
              
              <p className={`text-slate-600 font-medium leading-relaxed ${confirm.requirePassword ? 'mb-5' : 'mb-8'}`}>
                {confirm.message}
              </p>
              
              {confirm.requirePassword && (
                <div className="mb-8 animate-fade-in text-left">
                  <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">Authorization Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={16} className="text-slate-400" />
                    </div>
                    <input 
                      type="password" 
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      className={`w-full pl-10 pr-3 py-3 border ${passwordError ? 'border-red-300 focus:ring-red-500/20' : 'border-slate-300 focus:ring-[#8A1538]/20 focus:border-[#8A1538]'} rounded-xl text-sm outline-none focus:ring-2 transition-all font-medium`}
                      placeholder="Enter password to confirm"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-red-500 text-xs font-bold mt-2 flex items-center"><AlertCircle size={12} className="mr-1" /> {passwordError}</p>
                  )}
                </div>
              )}
              
              <div className="flex space-x-3">
                <button 
                  onClick={handleCancel}
                  className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirm}
                  className={`flex-1 px-6 py-4 rounded-2xl text-white font-black shadow-lg transition-all active:scale-[0.98] ${
                    confirm.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 
                    confirm.type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 
                    'bg-[#8A1538] hover:bg-[#6D0F2A] shadow-red-200'
                  }`}
                >
                  Confirm Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};
