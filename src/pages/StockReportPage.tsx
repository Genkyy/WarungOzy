import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { repository } from '../services/indexedDBRepository';
import { MenuItem, StockMovement } from '../types';
import { usePOSStore } from '../store/usePOSStore';
import { openFoodFactsService } from '../services/openFoodFactsService';
import { StockAdjustModal } from '../components/StockAdjustModal';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  PackageCheck,
  Search,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  Loader2,
  Trash2,
  Pencil
} from 'lucide-react';

interface SwipeableStockCardProps {
  prod: MenuItem;
  totalIn: number;
  totalOut: number;
  isOut: boolean;
  isLow: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

const SwipeableStockCard: React.FC<SwipeableStockCardProps> = ({
  prod,
  totalIn,
  totalOut,
  isOut,
  isLow,
  onEdit,
  onDelete
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative rounded-2xl border border-[#E8E2D8] bg-[#FAF7F2] overflow-hidden shadow-xs">
      {/* Revealed action buttons on swipe left */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-2.5 gap-2 bg-[#FAF7F2] z-0">
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            onEdit();
          }}
          className="h-10 px-3.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all min-h-[40px]"
        >
          <Pencil className="w-4 h-4" />
          <span>Edit</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            onDelete();
          }}
          className="h-10 px-3.5 rounded-xl bg-[#B84B3E] hover:bg-[#993A2E] text-white text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all min-h-[40px]"
        >
          <Trash2 className="w-4 h-4" />
          <span>Hapus</span>
        </button>
      </div>

      {/* Swipeable Card Surface */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={0.05}
        animate={{ x: isOpen ? -160 : 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -40 || info.velocity.x < -200) {
            setIsOpen(true);
          } else if (info.offset.x > 30 || info.velocity.x > 200) {
            setIsOpen(false);
          }
        }}
        onClick={() => {
          if (isOpen) setIsOpen(false);
        }}
        className="bg-white relative z-10 p-3.5 sm:p-4 flex items-center justify-between gap-3 touch-pan-y cursor-grab active:cursor-grabbing select-none"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-[#2A2622] truncate">{prod.name}</h3>
            {isOut ? (
              <span className="px-2 py-0.5 rounded-[6px] bg-[#B84B3E] text-white text-[10px] font-bold shrink-0">Habis</span>
            ) : isLow ? (
              <span className="px-2 py-0.5 rounded-[6px] bg-[#D4A017] text-white text-[10px] font-bold shrink-0">Menipis</span>
            ) : (
              <span className="px-2 py-0.5 rounded-[6px] bg-[#3F7D4F] text-white text-[10px] font-bold shrink-0">Aman</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#8A8175]">
            <span className="font-mono text-[#D97706] font-semibold">{prod.barcode || 'Tanpa Barcode'}</span>
            <span>•</span>
            <span>Jual: <strong className="text-[#D97706]">Rp {prod.price.toLocaleString('id-ID')}</strong></span>
            {prod.cost_price > 0 && (
              <>
                <span>•</span>
                <span>HPP: Rp {prod.cost_price.toLocaleString('id-ID')}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 text-right">
          <div>
            <div className="text-sm font-extrabold text-[#2A2622]">
              {prod.stock} <span className="text-xs font-normal text-[#8A8175]">{prod.unit}</span>
            </div>
            <div className="text-[10px] text-[#8A8175]">
              <span className="text-[#3F7D4F]">+{totalIn}</span> / <span className="text-[#B84B3E]">-{totalOut}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-[10px] text-[#8A8175] font-bold border-l border-[#E8E2D8] pl-2 min-w-[40px]">
            <span>{isOpen ? 'Tutup ➔' : 'Geser ←'}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const StockReportPage: React.FC = () => {
  const { products, categories, fetchMasterData, setAddProductModalOpen, showToast, showConfirm } = usePOSStore();
  const lowStockThreshold = 5;
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'movements'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [adjustingProduct, setAdjustingProduct] = useState<MenuItem | null>(null);
  const [isSyncingPhotos, setIsSyncingPhotos] = useState(false);

  const handleDeleteProduct = (prod: MenuItem) => {
    showConfirm({
      title: 'Hapus Produk dari Master Stok',
      message: `PERINGATAN: Apakah Anda yakin ingin menghapus produk "${prod.name}" (Barcode: ${prod.barcode || '-'}) dari master stok toko? Produk ini tidak dapat dipindai lagi di kasir.`,
      type: 'danger',
      confirmText: 'Ya, Hapus Produk',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          await repository.deleteMenuItem(prod.id!);
          await fetchMasterData();
          showToast(`Produk '${prod.name}' berhasil dihapus dari stok!`, 'success');
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus produk', 'error');
        }
      }
    });
  };

  // Fast Filter State for Summary Cards ('all' | 'low' | 'out')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Pagination States (Strictly 10 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [movementsPage, setMovementsPage] = useState<number>(1);
  const itemsPerPage = 10;

  const loadMovements = async () => {
    const data = await repository.getStockMovements();
    setMovements(data);
  };

  useEffect(() => {
    fetchMasterData();
    loadMovements();
  }, []);

  const handleSyncOpenFoodFacts = async () => {
    setIsSyncingPhotos(true);
    showToast('Memulai auto-sync foto produk via Open Food Facts...', 'info');
    let updatedCount = 0;
    let notFoundCount = 0;

    try {
      for (const prod of products) {
        if (prod.barcode && prod.barcode.trim()) {
          const res = await openFoodFactsService.fetchByBarcode(prod.barcode);
          if (res.success && res.imageUrl) {
            await repository.updateMenuItem(prod.id!, { image_path: res.imageUrl });
            updatedCount++;
          } else {
            notFoundCount++;
          }
        }
      }

      await fetchMasterData();
      if (updatedCount > 0) {
        showToast(`Berhasil memperbarui ${updatedCount} foto produk via Open Food Facts!`, 'success');
      } else if (notFoundCount > 0) {
        showToast(`Selesai diproses. ${notFoundCount} produk tidak ditemukan di Open Food Facts database.`, 'info');
      } else {
        showToast('Tidak ada produk ber-barcode yang dapat disinkronkan.', 'info');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat sinkronisasi foto', 'error');
    } finally {
      setIsSyncingPhotos(false);
    }
  };

  // Reset pagination when search, filter, category, or tab changes
  useEffect(() => {
    setCurrentPage(1);
    setMovementsPage(1);
  }, [searchQuery, activeSubTab, stockFilter, selectedCategoryId]);

  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= lowStockThreshold);
  const outOfStockProducts = products.filter((p) => p.stock <= 0);

  // Filter Products by Search Query, Category, AND Clickable Summary Card Fast Filter
  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (Boolean(p.barcode) && p.barcode!.includes(q));

    const matchesCategory = selectedCategoryId === 0 || p.category_id === selectedCategoryId;

    let matchesFilter = true;
    if (stockFilter === 'low') {
      matchesFilter = p.stock > 0 && p.stock <= lowStockThreshold;
    } else if (stockFilter === 'out') {
      matchesFilter = p.stock <= 0;
    }

    return matchesSearch && matchesCategory && matchesFilter;
  });

  // Calculate Paginated Data for Master Stock
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate Paginated Data for Movements Log
  const totalMovementsPages = Math.ceil(movements.length / itemsPerPage) || 1;
  const paginatedMovements = movements.slice(
    (movementsPage - 1) * itemsPerPage,
    movementsPage * itemsPerPage
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF7F2] space-y-4 sm:space-y-6 h-[calc(100vh-4rem)] pb-20 ipad:pb-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#2A2622] flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#D97706]" />
            Laporan Stok & Audit Mutasi
          </h1>
          <p className="text-xs text-[#8A8175]">Pantau sisa stok barang, peringatan stok menipis, dan riwayat mutasi</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSyncOpenFoodFacts}
            disabled={isSyncingPhotos}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#FEF3C7] hover:bg-[#D97706] text-[#D97706] hover:text-white font-bold text-xs border border-[#D97706]/30 shadow-xs transition-all disabled:opacity-50 min-h-[44px]"
            title="Cari & perbarui foto semua barang ber-barcode secara otomatis dari database Open Food Facts"
          >
            {isSyncingPhotos ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#D97706]" />
            )}
            <span>{isSyncingPhotos ? 'Sinkronisasi Foto...' : 'Auto-Sync Foto (Open Food Facts)'}</span>
          </button>

          <button
            onClick={() => setAddProductModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-sm transition-all active:scale-95 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Clickable Fast Filter Summary Cards (desain.md 4.2) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Total Produk */}
        <button
          onClick={() => setStockFilter('all')}
          className={`paper-card p-4 rounded-xl border text-left transition-all ${
            stockFilter === 'all'
              ? 'border-[#D97706] bg-[#FEF3C7] shadow-sm ring-1 ring-[#D97706]'
              : 'border-[#E8E2D8] bg-white hover:border-[#D97706]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#8A8175] font-bold uppercase tracking-wider block">Total Produk Ritel</span>
            {stockFilter === 'all' && <Filter className="w-3.5 h-3.5 text-[#D97706]" />}
          </div>
          <span className="text-xl sm:text-2xl font-bold text-[#2A2622] mt-1 block">
            {products.length} <span className="text-xs sm:text-sm font-normal text-[#8A8175]">SKU</span>
          </span>
          <span className="text-[10px] text-[#D97706] font-semibold mt-1 inline-block">Klik untuk tampilkan semua</span>
        </button>

        {/* Card 2: Stok Menipis */}
        <button
          onClick={() => setStockFilter('low')}
          className={`paper-card p-4 rounded-xl border text-left transition-all ${
            stockFilter === 'low'
              ? 'border-[#D4A017] bg-[#FFFBEB] shadow-sm ring-1 ring-[#D4A017]'
              : 'border-[#E8E2D8] bg-white hover:border-[#D4A017]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#D4A017] font-bold uppercase tracking-wider block">Stok Menipis (&le; {lowStockThreshold})</span>
            {stockFilter === 'low' && <Filter className="w-3.5 h-3.5 text-[#D4A017]" />}
          </div>
          <span className="text-xl sm:text-2xl font-bold text-[#D4A017] mt-1 block">
            {lowStockProducts.length} <span className="text-xs sm:text-sm font-normal text-[#8A8175]">Produk</span>
          </span>
          <span className="text-[10px] text-[#D4A017] font-semibold mt-1 inline-block">Klik untuk menyaring stok menipis</span>
        </button>

        {/* Card 3: Stok Habis */}
        <button
          onClick={() => setStockFilter('out')}
          className={`paper-card p-4 rounded-xl border text-left transition-all ${
            stockFilter === 'out'
              ? 'border-[#B84B3E] bg-[#FDF2F0] shadow-sm ring-1 ring-[#B84B3E]'
              : 'border-[#E8E2D8] bg-white hover:border-[#B84B3E]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#B84B3E] font-bold uppercase tracking-wider block">Stok Habis (0)</span>
            {stockFilter === 'out' && <Filter className="w-3.5 h-3.5 text-[#B84B3E]" />}
          </div>
          <span className="text-xl sm:text-2xl font-bold text-[#B84B3E] mt-1 block">
            {outOfStockProducts.length} <span className="text-xs sm:text-sm font-normal text-[#8A8175]">Produk</span>
          </span>
          <span className="text-[10px] text-[#B84B3E] font-semibold mt-1 inline-block">Klik untuk menyaring stok habis</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 sm:gap-3 border-b border-[#E8E2D8] pb-3">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[42px] ${
            activeSubTab === 'inventory'
              ? 'bg-[#D97706] text-white shadow-sm'
              : 'bg-white text-[#8A8175] hover:text-[#2A2622] border border-[#E8E2D8]'
          }`}
        >
          Master Stok Barang
        </button>
        <button
          onClick={() => {
            setActiveSubTab('movements');
            loadMovements();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[42px] ${
            activeSubTab === 'movements'
              ? 'bg-[#D97706] text-white shadow-sm'
              : 'bg-white text-[#8A8175] hover:text-[#2A2622] border border-[#E8E2D8]'
          }`}
        >
          Riwayat Mutasi Stok
        </button>
      </div>

      {/* SUB TAB 1: Inventory Table */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 text-[#8A8175] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama produk atau barcode..."
                className="w-full bg-white border border-[#E8E2D8] rounded-xl pl-10 pr-4 py-2 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
              />
            </div>
          </div>

          {/* Category Filter Pills Bar (Lists ALL Active Categories regardless of item count) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategoryId(0)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                selectedCategoryId === 0
                  ? 'bg-[#D97706] text-white shadow-sm'
                  : 'bg-white text-[#8A8175] hover:text-[#2A2622] border border-[#E8E2D8]'
              }`}
            >
              <span>Semua Kategori</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {products.length}
              </span>
            </button>

            {categories.map((cat) => {
              const catProdCount = products.filter((p) => p.category_id === cat.id).length;
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id || cat.name}
                  onClick={() => setSelectedCategoryId(cat.id || 0)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#D97706] text-white shadow-sm'
                      : 'bg-white text-[#8A8175] hover:text-[#2A2622] border border-[#E8E2D8]'
                  }`}
                >
                  <CategoryIcon iconName={cat.icon} categoryName={cat.name} className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#FAF7F2] text-[#8A8175] font-bold border border-[#E8E2D8]'
                  }`}>
                    {catProdCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* DUAL DISPLAY SYSTEM: Desktop Table (lg:block) vs iPad 10 & Mobile Swipeable Cards (lg:hidden) */}
          <div className="space-y-4">
            {/* 1. DESKTOP & LAPTOP VIEW: Clean 100% Aligned Standard Table */}
            <div className="hidden lg:block paper-panel rounded-xl border border-[#E8E2D8] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] text-[#8A8175] font-bold border-b border-[#E8E2D8]">
                    <tr>
                      <th className="p-3.5">Nama Produk</th>
                      <th className="p-3.5">Barcode</th>
                      <th className="p-3.5">Modal HPP</th>
                      <th className="p-3.5">Harga Jual</th>
                      <th className="p-3.5">Masuk</th>
                      <th className="p-3.5">Keluar</th>
                      <th className="p-3.5">Sisa Stok</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E2D8] text-[#2A2622]">
                    {paginatedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-[#8A8175] space-y-2">
                          <p className="font-bold text-sm text-[#2A2622]">Belum ada produk di kategori terpilih</p>
                          <p className="text-xs text-[#8A8175]">Kategori ini belum memiliki daftar barang di master stok toko.</p>
                          <button
                            onClick={() => setAddProductModalOpen(true)}
                            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D97706] text-white text-xs font-bold shadow-xs hover:bg-[#B45309] transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Produk Baru</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      paginatedProducts.map((prod) => {
                        const isOut = prod.stock <= 0;
                        const isLow = prod.stock > 0 && prod.stock <= lowStockThreshold;

                        const itemMovements = movements.filter((m) => m.product_id === prod.id);
                        const totalIn = itemMovements
                          .filter((m) => m.delta > 0)
                          .reduce((sum, m) => sum + m.delta, 0);
                        const totalOut = itemMovements
                          .filter((m) => m.delta < 0)
                          .reduce((sum, m) => sum + Math.abs(m.delta), 0);

                        return (
                          <tr key={prod.id} className="hover:bg-[#FAF7F2] transition-all">
                            <td className="p-3.5 font-bold text-[#2A2622]">{prod.name}</td>
                            <td className="p-3.5 font-mono text-[#D97706]">{prod.barcode || '-'}</td>
                            <td className="p-3.5 text-[#8A8175]">Rp {prod.cost_price.toLocaleString('id-ID')}</td>
                            <td className="p-3.5 font-bold text-[#2A2622]">Rp {prod.price.toLocaleString('id-ID')}</td>
                            <td className="p-3.5 text-[#3F7D4F] font-semibold">+{totalIn}</td>
                            <td className="p-3.5 text-[#B84B3E] font-semibold">-{totalOut}</td>
                            <td className="p-3.5 font-bold text-[#2A2622]">{prod.stock} {prod.unit}</td>
                            <td className="p-3.5">
                              {isOut ? (
                                <span className="px-2 py-0.5 rounded-[6px] bg-[#B84B3E] text-white text-[10px] font-bold">Habis</span>
                              ) : isLow ? (
                                <span className="px-2 py-0.5 rounded-[6px] bg-[#D4A017] text-white text-[10px] font-bold">Menipis</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-[6px] bg-[#3F7D4F] text-white text-[10px] font-bold">Aman</span>
                              )}
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setAdjustingProduct(prod)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#FEF3C7] border border-[#E8E2D8] text-[#D97706] text-[11px] font-bold transition-all flex items-center gap-1"
                                  title="Edit Nama, Harga, Barcode, & Stok Barang"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod)}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#FDF2F0] hover:bg-[#B84B3E] hover:text-white border border-[#B84B3E]/30 text-[#B84B3E] text-[11px] font-bold transition-all flex items-center gap-1"
                                  title="Hapus Produk dari Master Stok Warung"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. IPAD 10 & MOBILE TOUCHSCREEN VIEW: Modern Swipeable Card List */}
            <div className="lg:hidden space-y-2.5">
              <div className="flex items-center justify-between px-1 text-xs text-[#8A8175]">
                <span className="font-bold text-[#2A2622]">Daftar Produk ({filteredProducts.length})</span>
                <span className="flex items-center gap-1 text-[11px] text-[#D97706] font-bold bg-[#FEF3C7] px-2.5 py-1 rounded-lg border border-[#D97706]/30">
                  💡 Geser (swipe) kartu ke kiri untuk Edit / Hapus
                </span>
              </div>

              {paginatedProducts.length === 0 ? (
                <div className="paper-panel rounded-xl p-8 text-center text-[#8A8175] space-y-2 bg-white border border-[#E8E2D8]">
                  <p className="font-bold text-sm text-[#2A2622]">Belum ada produk di kategori terpilih</p>
                  <p className="text-xs text-[#8A8175]">Kategori ini belum memiliki daftar barang di master stok toko.</p>
                  <button
                    onClick={() => setAddProductModalOpen(true)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D97706] text-white text-xs font-bold shadow-xs hover:bg-[#B45309] transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Produk Baru</span>
                  </button>
                </div>
              ) : (
                paginatedProducts.map((prod) => {
                  const isOut = prod.stock <= 0;
                  const isLow = prod.stock > 0 && prod.stock <= lowStockThreshold;

                  const itemMovements = movements.filter((m) => m.product_id === prod.id);
                  const totalIn = itemMovements
                    .filter((m) => m.delta > 0)
                    .reduce((sum, m) => sum + m.delta, 0);
                  const totalOut = itemMovements
                    .filter((m) => m.delta < 0)
                    .reduce((sum, m) => sum + Math.abs(m.delta), 0);

                  return (
                    <SwipeableStockCard
                      key={prod.id}
                      prod={prod}
                      totalIn={totalIn}
                      totalOut={totalOut}
                      isOut={isOut}
                      isLow={isLow}
                      onEdit={() => setAdjustingProduct(prod)}
                      onDelete={() => handleDeleteProduct(prod)}
                    />
                  );
                })
              )}
            </div>
          </div>

            {/* Pagination Controls Bar */}
            {filteredProducts.length > 0 && (
              <div className="p-3.5 bg-[#FAF7F2] border-t border-[#E8E2D8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-[#8A8175]">
                  Menampilkan <span className="font-bold text-[#2A2622]">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-bold text-[#2A2622]">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> dari <span className="font-bold text-[#2A2622]">{filteredProducts.length}</span> produk
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D8] text-[#8A8175] hover:text-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all min-h-[36px]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          currentPage === pageNum
                            ? 'bg-[#D97706] text-white shadow-sm'
                            : 'bg-white text-[#8A8175] hover:text-[#2A2622] border border-[#E8E2D8]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D8] text-[#8A8175] hover:text-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all min-h-[36px]"
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      {/* SUB TAB 2: Movements Log */}
      {activeSubTab === 'movements' && (
        <div className="paper-panel rounded-xl border border-[#E8E2D8] overflow-hidden shadow-sm flex flex-col justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#8A8175] font-bold border-b border-[#E8E2D8]">
                <tr>
                  <th className="p-3.5">Waktu</th>
                  <th className="p-3.5">Nama Produk</th>
                  <th className="p-3.5">Perubahan (+/-)</th>
                  <th className="p-3.5">Alasan Mutasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8] text-[#2A2622]">
                {paginatedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-[#8A8175]">Belum ada riwayat mutasi stok</td>
                  </tr>
                ) : (
                  paginatedMovements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-[#FAF7F2]">
                      <td className="p-3.5 text-[#8A8175] whitespace-nowrap">{new Date(mov.created_at).toLocaleString('id-ID')}</td>
                      <td className="p-3.5 font-bold text-[#2A2622]">{mov.product_name}</td>
                      <td className={`p-3.5 font-bold ${mov.delta > 0 ? 'text-[#3F7D4F]' : 'text-[#B84B3E]'}`}>
                        {mov.delta > 0 ? `+${mov.delta}` : mov.delta}
                      </td>
                      <td className="p-3.5 uppercase text-[10px] font-bold text-[#8A8175]">
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

          {/* Movements Pagination Controls Bar */}
          {movements.length > 0 && (
            <div className="p-3.5 bg-[#FAF7F2] border-t border-[#E8E2D8] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-[#8A8175]">
                Menampilkan <span className="font-bold text-[#2A2622]">{((movementsPage - 1) * itemsPerPage) + 1}</span> - <span className="font-bold text-[#2A2622]">{Math.min(movementsPage * itemsPerPage, movements.length)}</span> dari <span className="font-bold text-[#2A2622]">{movements.length}</span> mutasi
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={movementsPage === 1}
                  onClick={() => setMovementsPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D8] text-[#8A8175] hover:text-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all min-h-[36px]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalMovementsPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setMovementsPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                        movementsPage === pageNum
                          ? 'bg-[#D97706] text-white shadow-sm'
                          : 'bg-white text-[#8A8175] hover:text-[#2A2622] border border-[#E8E2D8]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  disabled={movementsPage >= totalMovementsPages}
                  onClick={() => setMovementsPage((p) => Math.min(totalMovementsPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D8] text-[#8A8175] hover:text-[#D97706] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all min-h-[36px]"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stock Adjust Modal */}
      {adjustingProduct && (
        <StockAdjustModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSuccess={() => {
            fetchMasterData();
            loadMovements();
          }}
        />
      )}
    </div>
  );
};
