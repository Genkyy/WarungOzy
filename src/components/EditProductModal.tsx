import React, { useState } from 'react';
import { repository } from '../services/supabaseRepository';
import { usePOSStore } from '../store/usePOSStore';
import { openFoodFactsService } from '../services/openFoodFactsService';
import { MenuItem } from '../types';
import { X, Pencil, Sparkles, Loader2, Image as ImageIcon, Trash2, Save, PackageCheck, RotateCcw } from 'lucide-react';
import { formatRupiah, parseRupiah } from '../utils/formatCurrency';

export interface EditProductModalProps {
  product: MenuItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({ product, onClose, onSuccess }) => {
  const { categories, showToast, showConfirm, fetchMasterData } = usePOSStore();

  const [name, setName] = useState(product.name);
  const [categoryId, setCategoryId] = useState<number | string>(product.category_id);
  const [price, setPrice] = useState<string>(formatRupiah(product.price, true));
  const [costPrice, setCostPrice] = useState<string>(product.cost_price ? formatRupiah(product.cost_price, true) : '');
  const [barcode, setBarcode] = useState(product.barcode || '');
  const [stock, setStock] = useState<string>(product.stock.toString());
  const [unit, setUnit] = useState(product.unit || 'Pcs');
  const [description, setDescription] = useState(product.description || '');
  const [imagePath, setImagePath] = useState(product.image_path || '');
  const [isFetchingOFF, setIsFetchingOFF] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFetchPhotoHD = async () => {
    setIsFetchingOFF(true);
    try {
      if (barcode.trim()) {
        const res = await openFoodFactsService.fetchByBarcode(barcode.trim());
        if (res.success && res.imageUrl) {
          setImagePath(res.imageUrl);
          if (res.name && !name.trim()) setName(res.name);
          showToast('Foto HD & Nama Produk ditemukan via Barcode!', 'success');
          return;
        }
      }
      const suggestedUrl = openFoodFactsService.suggestPhotoByName(name);
      setImagePath(suggestedUrl);
      showToast('Foto HD berhasil dicocokkan otomatis!', 'success');
    } catch (err) {
      showToast('Gagal mencocokkan foto produk', 'error');
    } finally {
      setIsFetchingOFF(false);
    }
  };

  const handleQuickAdjustStock = (delta: number) => {
    const current = parseInt(stock, 10) || 0;
    const nextVal = Math.max(0, current + delta);
    setStock(nextVal.toString());
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Hapus Produk dari Master Stok',
      message: `Apakah Anda yakin ingin menghapus produk "${product.name}" secara permanen? Produk ini tidak dapat dipindai lagi di kasir.`,
      type: 'danger',
      confirmText: 'Ya, Hapus Produk',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          await repository.deleteMenuItem(product.id!);
          await fetchMasterData();
          showToast(`Produk '${product.name}' berhasil dihapus!`, 'success');
          onSuccess();
          onClose();
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus produk', 'error');
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseRupiah(price);
    const numCostPrice = parseRupiah(costPrice);

    if (!name.trim() || numPrice <= 0) {
      showToast('Nama dan harga produk wajib diisi!', 'error');
      return;
    }

    const newStockNum = parseInt(stock, 10) || 0;
    const oldStockNum = product.stock || 0;
    const stockDelta = newStockNum - oldStockNum;

    setIsSubmitting(true);
    try {
      // 1. Update MenuItem
      await repository.updateMenuItem(product.id!, {
        name: name.trim(),
        category_id: categoryId,
        price: numPrice,
        cost_price: numCostPrice,
        barcode: barcode.trim(),
        stock: newStockNum,
        unit: unit,
        description: description.trim(),
        image_path: imagePath.trim()
      });

      // 2. Track Stock Movement if stock was adjusted
      if (stockDelta !== 0) {
        await repository.adjustStock(
          product.id!,
          stockDelta,
          stockDelta > 0 ? 'adjustment_in' : 'adjustment_out'
        );
      }

      await fetchMasterData();
      showToast(`Data produk '${name}' berhasil diperbarui!`, 'success');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan perubahan produk', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E2D8] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#2A2622]">Edit Produk & Stok Barang</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-[#8A8175] hover:text-[#2A2622] bg-white border border-[#E8E2D8]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto bg-white">
          {/* 1. Nama Produk */}
          <div>
            <label className="block text-xs font-semibold text-[#2A2622] mb-1">Nama Produk / Barang *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Indomie Goreng Spesial 85g"
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#2A2622] font-bold focus:outline-none focus:border-[#D97706]"
            />
          </div>

          {/* 2. Kategori & Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Kategori Produk</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Satuan Fisik</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
              >
                {['Pcs', 'Kg', 'Botol', 'Bungkus', 'Liter', 'Renteng', 'Dus', 'Bal', 'Karung', 'Top Up', 'Voucher'].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Harga Jual & Modal HPP */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Harga Jual (Rp) *</label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={price}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setPrice(raw ? formatRupiah(raw, true) : '');
                }}
                placeholder="Rp 3.500"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#D97706] focus:outline-none focus:border-[#D97706] select-text"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Modal HPP (Rp)</label>
              <input
                type="text"
                inputMode="numeric"
                value={costPrice}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setCostPrice(raw ? formatRupiah(raw, true) : '');
                }}
                placeholder="Rp 2.800"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#8A8175] focus:outline-none focus:border-[#D97706] select-text"
              />
            </div>
          </div>

          {/* 4. PROMINENT STOK EDITOR WITH ORIGINAL STOCK & LIVE DIFFERENCE BADGE */}
          <div className="p-3.5 rounded-xl bg-[#FEF3C7]/50 border border-[#D97706]/40 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs font-extrabold text-[#2A2622] flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-[#D97706]" />
                <span>Jumlah Stok Fisik Warung Saat Ini</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#8A8175] bg-white px-2 py-0.5 rounded border border-[#E8E2D8]" title="Jumlah stok barang sebelum diedit">
                  Stok Awal: <b className="text-[#2A2622]">{product.stock} {unit}</b>
                </span>
                {parseInt(stock, 10) !== product.stock && (
                  <button
                    type="button"
                    onClick={() => setStock(product.stock.toString())}
                    className="text-[10px] font-bold text-[#B84B3E] hover:text-white bg-white hover:bg-[#B84B3E] px-2 py-0.5 rounded border border-[#B84B3E]/30 flex items-center gap-1 transition-all"
                    title="Kembalikan nilai ke stok awal sebelum diedit"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset ({product.stock})</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                required
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full bg-white border border-[#D97706]/50 rounded-xl px-3.5 py-2.5 text-lg font-black text-[#2A2622] focus:outline-none focus:border-[#D97706] shadow-xs"
              />
              <span className="text-xs font-bold text-[#8A8175] shrink-0">{unit}</span>
            </div>

            {/* Difference / Change Indicator Card */}
            {(() => {
              const currentVal = parseInt(stock, 10) || 0;
              const diff = currentVal - product.stock;
              if (diff === 0) return null;
              return (
                <div className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-between ${
                  diff > 0
                    ? 'bg-[#F0F7F2] border-[#3F7D4F]/30 text-[#3F7D4F]'
                    : 'bg-[#FDF2F0] border-[#B84B3E]/30 text-[#B84B3E]'
                }`}>
                  <span>Pratinjau Perubahan Stok:</span>
                  <span>{diff > 0 ? `+${diff}` : diff} {unit} (Stok Baru: {currentVal})</span>
                </div>
              );
            })()}

          </div>

          {/* 5. Barcode Pabrik */}
          <div>
            <label className="block text-xs font-semibold text-[#2A2622] mb-1">Kode Barcode / QR Produk</label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Barcode (Misal: 899...)"
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#D97706] focus:outline-none focus:border-[#D97706]"
            />
          </div>

          {/* 6. URL Foto HD & Auto Sync Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#2A2622] flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Foto Produk HD</span>
              </label>
              <button
                type="button"
                onClick={handleFetchPhotoHD}
                disabled={isFetchingOFF}
                className="text-[11px] font-bold text-[#D97706] bg-[#FEF3C7] hover:bg-[#D97706] hover:text-white px-2 py-0.5 rounded-lg border border-[#D97706]/30 flex items-center gap-1 transition-all disabled:opacity-50"
                title="Auto sync & cari foto HD dari database pabrik"
              >
                {isFetchingOFF ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>Auto-Sync Foto HD</span>
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={imagePath}
                onChange={(e) => setImagePath(e.target.value)}
                placeholder="https://images.openfoodfacts.org/..."
                className="flex-1 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
              />
              {imagePath && (
                <div className="w-10 h-10 rounded-xl bg-white border border-[#E8E2D8] overflow-hidden shrink-0">
                  <img src={imagePath} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* 7. Deskripsi */}
          <div>
            <label className="block text-xs font-semibold text-[#2A2622] mb-1">Deskripsi Singkat</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan tambahan produk..."
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className="px-3 py-2.5 rounded-xl bg-[#FDF2F0] hover:bg-[#B84B3E] text-[#B84B3E] hover:text-white border border-[#B84B3E]/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Produk</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] bg-white text-[#8A8175] hover:text-[#2A2622] text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-sm transition-all min-h-[42px]"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
