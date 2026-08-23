import React, { useState } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { repository } from '../services/indexedDBRepository';
import { X, Plus, PackagePlus } from 'lucide-react';

export const AddProductModal: React.FC = () => {
  const {
    isAddProductModalOpen,
    setAddProductModalOpen,
    categories,
    fetchMasterData,
    showToast
  } = usePOSStore();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [price, setPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [barcode, setBarcode] = useState('');
  const [stock, setStock] = useState<string>('10');
  const [unit, setUnit] = useState('Pcs');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddProductModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      showToast('Nama dan harga produk wajib diisi!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await repository.createMenuItem({
        name: name.trim(),
        category_id: categoryId,
        price: parseFloat(price) || 0,
        cost_price: parseFloat(costPrice) || 0,
        barcode: barcode.trim(),
        stock: parseInt(stock, 10) || 0,
        unit,
        description: description.trim(),
        is_available: true,
        sort_order: 99,
        image_path: '' // Clean empty image path for honest category icon fallback (desain.md Section 4)
      });

      await fetchMasterData();
      showToast(`Produk '${name}' berhasil ditambahkan!`, 'success');
      setAddProductModalOpen(false);

      setName('');
      setPrice('');
      setCostPrice('');
      setBarcode('');
      setStock('10');
      setDescription('');
    } catch (err) {
      console.error(err);
      showToast('Gagal menambahkan produk', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E2D8] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#2A2622]">Tambah Produk Baru</h2>
          </div>
          <button
            onClick={() => setAddProductModalOpen(false)}
            className="p-1.5 rounded-xl text-[#8A8175] hover:text-[#2A2622] bg-white border border-[#E8E2D8]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] bg-white">
          <div>
            <label className="block text-xs font-semibold text-[#2A2622] mb-1">Nama Produk / Barang *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Indomie Ayam Bawang 85g"
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(Number(e.target.value))}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
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
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
              >
                {['Pcs', 'Kg', 'Botol', 'Bungkus', 'Liter', 'Renteng', 'Dus'].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Harga Jual (Rp) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="3500"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#D97706] focus:outline-none focus:border-[#D97706]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Modal HPP (Rp)</label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="2800"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#8A8175] focus:outline-none focus:border-[#D97706]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Barcode Pabrik</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="8992388213148"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#D97706] focus:outline-none focus:border-[#D97706]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Stok Awal</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#2A2622] focus:outline-none focus:border-[#D97706]"
              />
            </div>
          </div>

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

          <div className="pt-4 border-t border-[#E8E2D8] flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAddProductModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] bg-white text-[#8A8175] hover:text-[#2A2622] text-xs font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-sm transition-all min-h-[42px]"
            >
              <Plus className="w-4 h-4" />
              <span>Simpan Produk</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
