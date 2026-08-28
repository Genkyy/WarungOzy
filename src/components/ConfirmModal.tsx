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
    warning: <AlertTriangle className="w-6 h-6 text-[#D4A017]" />,
    danger: <AlertTriangle className="w-6 h-6 text-[#B84B3E]" />,
    info: <Info className="w-6 h-6 text-[#D97706]" />,
  };

  const iconBg = {
    warning: 'bg-[#FFFBEB] border-[#D4A017]/30',
    danger: 'bg-[#FDF2F0] border-[#B84B3E]/30',
    info: 'bg-[#FEF3C7] border-[#D97706]/30',
  };

  const confirmBtnStyles = {
    warning: 'bg-[#D4A017] hover:bg-[#B45309] text-white font-bold',
    danger: 'bg-[#B84B3E] hover:opacity-90 text-white font-bold',
    info: 'bg-[#D97706] hover:bg-[#B45309] text-white font-bold',
  };

  const handleConfirm = () => {
    onConfirm();
    hideConfirm();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header & Body */}
          <div className="p-6 space-y-4 bg-white">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl border ${iconBg[type]} shrink-0`}>
                {icons[type]}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#2A2622]">{title}</h3>
                <p className="text-xs text-[#8A8175] leading-relaxed">{message}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-[#E8E2D8] bg-[#FAF7F2] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={hideConfirm}
              className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] bg-white text-[#8A8175] hover:text-[#2A2622] font-semibold text-xs transition-all min-h-[42px]"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`px-5 py-2.5 rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95 min-h-[42px] ${confirmBtnStyles[type]}`}
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
