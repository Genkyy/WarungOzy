import React, { useEffect } from 'react';
import { Search, Barcode, Printer, RefreshCw, Camera } from 'lucide-react';
import { usePOSStore } from '../store/usePOSStore';

export const Header: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    fetchMasterData,
    setCameraScannerOpen,
    setBluetoothModalOpen,
    scannerConnectionStatus
  } = usePOSStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('main-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isConnected = scannerConnectionStatus === 'connected';
  const isStandby = scannerConnectionStatus === 'standby';

  return (
    <header className="h-16 bg-white border-b border-[#E8E2D8] px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 z-10 shrink-0 select-none shadow-sm">
      {/* Search Input Bar */}
      <div className="flex-1 max-w-xl relative">
        <Search className="w-4 h-4 text-[#8A8175] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="main-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari produk atau scan barcode... (Ctrl+K)"
          className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl pl-9 pr-8 sm:pr-24 py-2 text-xs sm:text-sm text-[#2A2622] placeholder-[#8A8175] focus:outline-none focus:border-[#D97706] focus:bg-white transition-all"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => setBluetoothModalOpen(true)}
            className="px-2 py-1 rounded-lg bg-[#FEF3C7] hover:bg-[#D97706] text-[#D97706] hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all border border-[#D97706]/30"
            title="Uji coba & konfigurasi Scanner Bluetooth"
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Scanner BT</span>
          </button>
          <kbd className="bg-white text-[#8A8175] text-[10px] px-1.5 py-0.5 rounded font-mono border border-[#E8E2D8]">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Hardware Device Status Indicators */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* 1. Dynamic Barcode Scanner Connection Status Badge */}
        <button
          onClick={() => setBluetoothModalOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
            isConnected
              ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D] hover:border-[#16A34A]'
              : isStandby
              ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706] hover:border-[#D97706]'
              : 'bg-[#FDF2F0] border-[#F87171]/30 text-[#B84B3E] hover:border-[#B84B3E]'
          }`}
          title={`Status Scanner Bluetooth: ${
            isConnected
              ? '🟢 Terhubung & Siap Pindai'
              : isStandby
              ? '🟡 Standby / Siap'
              : '🔴 Terputus / Nonaktif'
          } (Klik untuk Kelola)`}
        >
          <div className="relative flex items-center justify-center">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-ping absolute opacity-75"></span>
                <span className="w-2 h-2 rounded-full bg-[#16A34A] relative"></span>
              </>
            ) : isStandby ? (
              <span className="w-2 h-2 rounded-full bg-[#D97706]"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-[#B84B3E]"></span>
            )}
          </div>
          <Barcode className={`w-4 h-4 ${isConnected ? 'text-[#16A34A]' : isStandby ? 'text-[#D97706]' : 'text-[#B84B3E]'}`} />
          <span className="hidden sm:inline text-[11px] font-bold">
            {isConnected ? 'BT Scanner Con.' : isStandby ? 'BT Scanner Standby' : 'BT Scanner Off'}
          </span>
          <span className="sm:hidden text-[10px] font-bold">
            {isConnected ? 'BT Con' : isStandby ? 'BT Standby' : 'BT Off'}
          </span>
        </button>

        {/* 2. Printer Mini Thermal Status (Realistic Standby / Disconnected Indicator) */}
        <div
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] text-xs font-medium text-[#8A8175]"
          title="Status Mesin Cetak Struk Mini 58mm: Belum Terhubung (Standby / Off)"
        >
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#8A8175]"></span>
          </div>
          <Printer className="w-4 h-4 text-[#8A8175]" />
          <span className="hidden sm:inline text-[11px] font-bold text-[#8A8175]">Printer Standby</span>
          <span className="sm:hidden text-[10px] text-[#8A8175] font-bold">Printer Off</span>
        </div>

        {/* Sync/Refresh Data Button */}
        <button
          onClick={() => fetchMasterData()}
          className="p-2 sm:p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#E8E2D8] border border-[#E8E2D8] text-[#8A8175] hover:text-[#2A2622] transition-all active:scale-95 min-h-[38px] min-w-[38px] flex items-center justify-center"
          title="Segarkan Data Master Toko"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
