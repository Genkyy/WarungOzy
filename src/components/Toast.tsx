import React from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Toast: React.FC = () => {
  const { toastMessage, toastType, hideToast } = usePOSStore();

  if (!toastMessage) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#1F8A5F]" />,
    error: <AlertCircle className="w-5 h-5 text-[#C4432B]" />,
    info: <Info className="w-5 h-5 text-[#1F8A5F]" />,
  };

  const bgStyles = {
    success: 'bg-emerald-50 border-emerald-300 text-[#1F8A5F]',
    error: 'bg-rose-50 border-rose-300 text-[#C4432B]',
    info: 'bg-white border-[#E4E6DF] text-[#1C1F1B]',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-20 right-6 z-50 pointer-events-auto"
      >
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-kasir-lg backdrop-blur-md ${bgStyles[toastType]}`}>
          {icons[toastType]}
          <span className="text-xs font-bold pr-2">{toastMessage}</span>
          <button
            onClick={hideToast}
            className="p-1 rounded-lg hover:bg-black/5 text-[#6B7268] hover:text-[#1C1F1B] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
