import React, { useEffect } from 'react';
import { Search, Barcode, Printer, RefreshCw } from 'lucide-react';
import { usePOSStore } from '../store/usePOSStore';

export const Header: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    fetchMasterData
  } = usePOSStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('main-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-16 bg-[#0f172a]/90 border-b border-[#232d42] px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 z-10 shrink-0 select-none">
      {/* Search Input Bar */}
      <div className="flex-1 max-w-xl relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          id="main-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari produk / scan barcode... (Ctrl+K)"
          className="w-full bg-[#151c2c] border border-[#232d42] rounded-xl pl-9 pr-8 sm:pr-16 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-all"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1">
          <kbd className="bg-[#232d42] text-slate-400 text-[10px] px-1.5 py-0.5 rounded font-mono border border-slate-700">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Hardware Device Status Indicators (Scanner & Printer Mini) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* 1. Barcode Scanner Hardware Status */}
        <div
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#151c2c] border border-emerald-500/30 text-xs font-medium text-slate-200 shadow-sm"
          title="Status Barcode Scanner: Terhubung & Siap Pindai"
        >
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <Barcode className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline text-[11px] font-semibold text-emerald-400">Scanner Ready</span>
          <span className="sm:hidden text-[10px] text-emerald-400 font-bold">Scanner</span>
        </div>

        {/* 2. Printer Mini Thermal Status */}
        <div
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#151c2c] border border-emerald-500/30 text-xs font-medium text-slate-200 shadow-sm"
          title="Status Mesin Cetak Struk Mini 58mm: Terhubung & Siap Cetak"
        >
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <Printer className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline text-[11px] font-semibold text-emerald-400">Printer Mini Ready</span>
          <span className="sm:hidden text-[10px] text-emerald-400 font-bold">Printer</span>
        </div>

        {/* Sync/Refresh Data Button */}
        <button
          onClick={() => fetchMasterData()}
          className="p-2 sm:p-2.5 rounded-xl bg-[#151c2c] hover:bg-[#1e293b] border border-[#232d42] text-slate-400 hover:text-cyan-400 transition-all active:scale-95 min-h-[38px] min-w-[38px] flex items-center justify-center"
          title="Segarkan Data Master Toko"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
