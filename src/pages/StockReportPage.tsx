import React, { useEffect, useState } from 'react';
import { repository } from '../services/indexedDBRepository';
import { MenuItem, StockMovement } from '../types';
import { usePOSStore } from '../store/usePOSStore';
import { StockAdjustModal } from '../components/StockAdjustModal';
import {
  PackageCheck,
  Search,
  Plus,
  ArrowUpDown
} from 'lucide-react';

export const StockReportPage: React.FC = () => {
  const { products, settings, fetchMasterData, setAddProductModalOpen } = usePOSStore();
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'movements'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [adjustingProduct, setAdjustingProduct] = useState<MenuItem | null>(null);

  const lowStockThreshold = parseInt(settings.low_stock_threshold, 10) || 5;

  const loadMovements = async () => {
    const data = await repository.getStockMovements();
    setMovements(data);
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold);
  const outOfStockProducts = products.filter((p) => p.stock <= 0);

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      (Boolean(p.barcode) && p.barcode!.includes(q))
    );
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0b0f19] space-y-4 sm:space-y-6 h-[calc(100vh-4rem)] pb-20 ipad:pb-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-cyan-400" />
            Laporan Stok & Audit Mutasi
          </h1>
          <p className="text-xs text-slate-400">Pantau sisa stok barang, peringatan stok menipis, dan riwayat mutasi</p>
        </div>

        <button
          onClick={() => setAddProductModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="glass-card p-4 rounded-2xl border border-[#232d42]">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Total Produk Ritel</span>
          <span className="text-xl sm:text-2xl font-black text-white">{products.length} <span className="text-xs sm:text-sm font-normal text-slate-400">SKU</span></span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-amber-500/30 bg-amber-950/10">
          <span className="text-xs text-amber-400 font-semibold block uppercase">Stok Menipis (&le; {lowStockThreshold})</span>
          <span className="text-xl sm:text-2xl font-black text-amber-400">{lowStockProducts.length} <span className="text-xs sm:text-sm font-normal text-amber-300">Produk</span></span>
        </div>
        <div className="glass-card p-4 rounded-2xl border border-rose-500/30 bg-rose-950/10">
          <span className="text-xs text-rose-400 font-semibold block uppercase">Stok Habis (0)</span>
          <span className="text-xl sm:text-2xl font-black text-rose-400">{outOfStockProducts.length} <span className="text-xs sm:text-sm font-normal text-rose-300">Produk</span></span>
        </div>
      </div>

      {/* Sub Tabs: Inventory vs Movements Log */}
      <div className="flex items-center gap-2 sm:gap-3 border-b border-[#232d42] pb-3">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[42px] ${
            activeSubTab === 'inventory'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Master Stok Barang
        </button>
        <button
          onClick={() => {
            setActiveSubTab('movements');
            loadMovements();
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[42px] ${
            activeSubTab === 'movements'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Riwayat Mutasi Stok
        </button>
      </div>

      {/* SUB TAB 1: Inventory Table */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk atau barcode..."
              className="w-full bg-[#151c2c] border border-[#232d42] rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="glass-panel rounded-2xl border border-[#232d42] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#151c2c] text-slate-400 font-semibold border-b border-[#232d42]">
                  <tr>
                    <th className="p-3.5">Nama Produk</th>
                    <th className="p-3.5">Barcode</th>
                    <th className="p-3.5">Modal HPP</th>
                    <th className="p-3.5">Harga Jual</th>
                    <th className="p-3.5">Sisa Stok</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232d42]/60 text-slate-300">
                  {filteredProducts.map((prod) => {
                    const isOut = prod.stock <= 0;
                    const isLow = prod.stock > 0 && prod.stock <= lowStockThreshold;
                    return (
                      <tr key={prod.id} className="hover:bg-[#151c2c]/50 transition-all">
                        <td className="p-3.5 font-semibold text-white">{prod.name}</td>
                        <td className="p-3.5 font-mono text-cyan-400">{prod.barcode || '-'}</td>
                        <td className="p-3.5 text-slate-400 font-mono">Rp {prod.cost_price.toLocaleString('id-ID')}</td>
                        <td className="p-3.5 font-bold text-white font-mono">Rp {prod.price.toLocaleString('id-ID')}</td>
                        <td className="p-3.5 font-extrabold text-white">{prod.stock} {prod.unit}</td>
                        <td className="p-3.5">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">Habis</span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">Menipis</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">Aman</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => setAdjustingProduct(prod)}
                            className="px-3 py-1.5 rounded-lg bg-[#151c2c] hover:bg-slate-700 border border-[#232d42] text-cyan-400 text-[11px] font-medium transition-all"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5 inline mr-1" />
                            Adjust Stok
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB TAB 2: Movements Log */}
      {activeSubTab === 'movements' && (
        <div className="glass-panel rounded-2xl border border-[#232d42] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151c2c] text-slate-400 font-semibold border-b border-[#232d42]">
                <tr>
                  <th className="p-3.5">Waktu</th>
                  <th className="p-3.5">Nama Produk</th>
                  <th className="p-3.5">Perubahan (Delta)</th>
                  <th className="p-3.5">Alasan Mutasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232d42]/60 text-slate-300">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500">Belum ada riwayat mutasi stok</td>
                  </tr>
                ) : (
                  movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-[#151c2c]/50">
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">{new Date(mov.created_at).toLocaleString('id-ID')}</td>
                      <td className="p-3.5 font-semibold text-white">{mov.product_name}</td>
                      <td className={`p-3.5 font-bold ${mov.delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {mov.delta > 0 ? `+${mov.delta}` : mov.delta}
                      </td>
                      <td className="p-3.5 uppercase text-[10px] font-bold text-slate-400">
                        {mov.reason === 'sale'
                          ? 'Penjualan Kasir'
                          : mov.reason === 'return'
                          ? 'Retur / Void Transaksi'
                          : mov.reason === 'adjustment_in'
                          ? 'Kulakan / Stok Masuk'
                          : mov.reason === 'adjustment_out'
                          ? 'Barang Rusak / Keluar'
                          : 'Stok Awal'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <StockAdjustModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSuccess={async () => {
            await fetchMasterData();
            await loadMovements();
          }}
        />
      )}
    </div>
  );
};
