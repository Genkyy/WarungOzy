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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#151c2c] border border-[#232d42] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#232d42] flex items-center justify-between bg-[#0f172a]">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white">Penyesuaian Stok Barang</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#232d42]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-4 bg-[#0b0f19]">
          <div className="bg-[#151c2c] p-3 rounded-xl border border-[#232d42]">
            <h3 className="font-bold text-sm text-white">{product.name}</h3>
            <p className="text-xs text-slate-400">Stok Saat Ini: <span className="font-mono font-bold text-cyan-400">{product.stock} {product.unit}</span></p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Tipe Penyesuaian</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setAdjustType('add');
                  setReason('adjustment_in');
                }}
                className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  adjustType === 'add'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-[#151c2c] border-[#232d42] text-slate-400'
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
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                    : 'bg-[#151c2c] border-[#232d42] text-slate-400'
                }`}
              >
                <Minus className="w-4 h-4" />
                <span>Kurangi Stok (-)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Jumlah Perubahan ({product.unit})</label>
            <input
              type="number"
              min="1"
              required
              value={deltaInput}
              onChange={(e) => setDeltaInput(e.target.value)}
              className="w-full bg-[#151c2c] border border-[#232d42] rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Alasan Penyesuaian</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full bg-[#151c2c] border border-[#232d42] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="adjustment_in">Kulakan / Stok Masuk Tambahan</option>
              <option value="adjustment_out">Barang Rusak / Kadaluarsa</option>
              <option value="initial">Inventarisasi Ulang (Stock Opname)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-[#232d42] flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-[#232d42] bg-[#151c2c] text-slate-400 text-xs font-semibold">
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20"
            >
              {isSubmitting ? 'Simpan...' : 'Update Stok'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
