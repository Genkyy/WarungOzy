import React from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, Check } from 'lucide-react';

export const ConfirmModal: React.FC = () => {
  const { confirmModalConfig, hideConfirm } = usePOSStore();

  if (!confirmModalConfig || !confirmModalConfig.isOpen) return null;

  const {
    title,
    message,
    confirmText = 'Ya, Lanjutkan',
    cancelText = 'Batal',
    type = 'warning',
    onConfirm
  } = confirmModalConfig;

  const icons = {
    warning: <AlertTriangle className="w-6 h-6 text-amber-400" />,
    danger: <AlertTriangle className="w-6 h-6 text-rose-400" />,
    info: <Info className="w-6 h-6 text-cyan-400" />,
  };

  const iconBg = {
    warning: 'bg-amber-500/10 border-amber-500/30',
    danger: 'bg-rose-500/10 border-rose-500/30',
    info: 'bg-cyan-500/10 border-cyan-500/30',
  };

  const confirmBtnStyles = {
    warning: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white font-bold',
    info: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold',
  };

  const handleConfirm = () => {
    onConfirm();
    hideConfirm();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-[#151c2c] border border-[#232d42] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header & Body */}
          <div className="p-6 space-y-4 bg-[#151c2c]">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl border ${iconBg[type]} shrink-0`}>
                {icons[type]}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">{title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-[#232d42] bg-[#0f172a] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={hideConfirm}
              className="px-4 py-2.5 rounded-xl border border-[#232d42] bg-[#151c2c] text-slate-400 hover:text-white font-medium text-xs transition-all"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`px-5 py-2.5 rounded-xl text-xs shadow-lg flex items-center gap-1.5 transition-all active:scale-95 ${confirmBtnStyles[type]}`}
            >
              <Check className="w-4 h-4" />
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
