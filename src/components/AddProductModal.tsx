import React, { useState } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { repository } from '../services/indexedDBRepository';
import { openFoodFactsService } from '../services/openFoodFactsService';
import { X, Plus, PackagePlus, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';

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
  const [imagePath, setImagePath] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingOFF, setIsFetchingOFF] = useState(false);

  if (!isAddProductModalOpen) return null;

  const handleFetchOpenFoodFacts = async () => {
    if (!barcode.trim()) {
      showToast('Masukkan Barcode terlebih dahulu!', 'error');
      return;
    }

    setIsFetchingOFF(true);
    try {
      const res = await openFoodFactsService.fetchByBarcode(barcode);
      if (res.success) {
        if (res.imageUrl) {
          setImagePath(res.imageUrl);
        }
        if (res.name && !name.trim()) {
          setName(res.name);
        }
        showToast('Foto & data produk berhasil ditemukan via Open Food Facts!', 'success');
      } else {
        showToast(res.error || 'Produk tidak ditemukan di database Open Food Facts', 'error');
      }
    } catch (err) {
      showToast('Gagal menghubungi Open Food Facts', 'error');
    } finally {
      setIsFetchingOFF(false);
    }
  };

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
        stock: parseInt(stock) || 0,
        unit: unit,
        description: description.trim(),
        image_path: imagePath.trim(),
        is_available: true,
        sort_order: 99
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
      setImagePath('');
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
              placeholder="Misal: Indomie Goreng Spesial 85g"
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
                {['Pcs', 'Kg', 'Botol', 'Bungkus', 'Liter', 'Renteng', 'Dus', 'Top Up', 'Voucher'].map((u) => (
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
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#8A8175] focus:outline-none focus:border-[#D97706]"
              />
            </div>
          </div>

          {/* Barcode Field with Open Food Facts Auto-Lookup Button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#2A2622]">Barcode Pabrik</label>
              <button
                type="button"
                onClick={handleFetchOpenFoodFacts}
                disabled={isFetchingOFF || !barcode.trim()}
                className="text-[11px] font-bold text-[#D97706] bg-[#FEF3C7] hover:bg-[#D97706] hover:text-white px-2 py-0.5 rounded-lg border border-[#D97706]/30 flex items-center gap-1 transition-all disabled:opacity-50"
                title="Cari Foto & Nama Produk Otomatis dari Database Open Food Facts"
              >
                {isFetchingOFF ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>Auto-Fetch Open Food Facts</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="8992388213148"
                className="col-span-2 bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#D97706] focus:outline-none focus:border-[#D97706]"
              />
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Stok Awal (10)"
                className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2.5 text-xs font-bold text-[#2A2622] focus:outline-none focus:border-[#D97706]"
              />
            </div>
          </div>

          {/* Product Image URL Field & Live Preview */}
          <div>
            <label className="block text-xs font-semibold text-[#2A2622] mb-1 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-[#D97706]" />
              <span>URL Foto Produk (Otomatis / Custom)</span>
            </label>
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
