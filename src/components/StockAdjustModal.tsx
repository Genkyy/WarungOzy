import React, { useState } from 'react';
import { repository } from '../services/indexedDBRepository';
import { usePOSStore } from '../store/usePOSStore';
import { MenuItem } from '../types';
import { X, PackageCheck, Plus, Minus } from 'lucide-react';

interface StockAdjustModalProps {
  product: MenuItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({ product, onClose, onSuccess }) => {
  const { showToast, fetchMasterData } = usePOSStore();
  const [deltaInput, setDeltaInput] = useState<string>('5');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [reason, setReason] = useState<'adjustment_in' | 'adjustment_out' | 'initial'>('adjustment_in');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(deltaInput, 10) || 0;
    if (qty <= 0) {
      showToast('Jumlah perubahan stok harus lebih dari 0', 'error');
      return;
    }

    const delta = adjustType === 'add' ? qty : -qty;

    setIsSubmitting(true);
    try {
      await repository.adjustStock(product.id!, delta, reason);
      await fetchMasterData();
      showToast(`Stok ${product.name} berhasil disesuaikan (${delta > 0 ? '+' : ''}${delta})`, 'success');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Gagal menyesuaikan stok', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E2D8] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#2A2622]">Penyesuaian Stok Barang</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-[#8A8175] hover:text-[#2A2622] bg-white border border-[#E8E2D8]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4 bg-white">
          <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E2D8]">
            <h3 className="font-bold text-sm text-[#2A2622]">{product.name}</h3>
            <p className="text-xs text-[#8A8175]">Stok Saat Ini: <span className="font-bold text-[#D97706]">{product.stock} {product.unit}</span></p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A2622] mb-2">Tipe Penyesuaian</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAdjustType('add');
                  setReason('adjustment_in');
                }}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  adjustType === 'add'
                    ? 'bg-[#F0F7F2] border-[#3F7D4F]/40 text-[#3F7D4F]'
                    : 'bg-[#FAF7F2] border-[#E8E2D8] text-[#8A8175]'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Stok (+)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustType('subtract');
                  setReason('adjustment_out');
                }}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  adjustType === 'subtract'
                    ? 'bg-[#FDF2F0] border-[#B84B3E]/40 text-[#B84B3E]'
                    : 'bg-[#FAF7F2] border-[#E8E2D8] text-[#8A8175]'
                }`}
              >
                <Minus className="w-4 h-4" />
                <span>Kurangi Stok (-)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A2622] mb-1">Jumlah Perubahan ({product.unit})</label>
            <input
              type="number"
              min="1"
              required
              value={deltaInput}
              onChange={(e) => setDeltaInput(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#2A2622] focus:outline-none focus:border-[#D97706]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A2622] mb-1">Alasan Penyesuaian</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
            >
              <option value="adjustment_in">Kulakan / Stok Masuk Tambahan</option>
              <option value="adjustment_out">Barang Rusak / Kadaluarsa</option>
              <option value="initial">Inventarisasi Ulang (Stock Opname)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-[#E8E2D8] flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-[#E8E2D8] bg-white text-[#8A8175] hover:text-[#2A2622] text-xs font-semibold">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-sm transition-all min-h-[40px]"
            >
              {isSubmitting ? 'Simpan...' : 'Update Stok'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
