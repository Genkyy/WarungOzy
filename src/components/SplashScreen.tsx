import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinished: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinished }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Memuat Basis Data IndexedDB...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(40);
      setStatusText('Menyiapkan Katalog Produk & Barcode...');
    }, 300);

    const timer2 = setTimeout(() => {
      setProgress(80);
      setStatusText('Menyesuaikan Tata Letak iPad & Mobile...');
    }, 600);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Siap!');
    }, 900);

    const timer4 = setTimeout(() => {
      onFinished();
    }, 1100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onFinished]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0f19] overflow-hidden select-none">
      {/* Main Center Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.25 }}
        className="relative z-10 w-full max-w-sm mx-4 bg-[#151c2c] p-8 rounded-3xl border border-[#232d42] shadow-2xl flex flex-col items-center text-center"
      >
        {/* Animated Brand Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20 mb-5 relative border border-cyan-400/30">
          <Store className="w-10 h-10 text-white" />
          <div className="absolute -top-1 -right-1 bg-cyan-400 p-1.5 rounded-full text-slate-950 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Store Title */}
        <h1 className="text-2xl font-black text-white tracking-wide mb-1 font-sans">
          Warung Ozy
        </h1>
        <p className="text-xs text-cyan-400 font-bold mb-6 flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          POS Kasir iPad & Mobile
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-[#0b0f19] border border-[#232d42] h-2.5 rounded-full overflow-hidden mb-3 relative">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.3 }}
          />
        </div>

        {/* Status Text & Percentage */}
        <div className="flex items-center justify-between w-full text-[11px] text-slate-400 font-bold">
          <span className="truncate">{statusText}</span>
          <span className="font-mono font-black text-cyan-400 ml-2">{progress}%</span>
        </div>
      </motion.div>
    </div>
  );
};
