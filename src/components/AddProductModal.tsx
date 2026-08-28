import React, { useEffect, useState } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { repository } from '../services/supabaseRepository';
import { openFoodFactsService } from '../services/openFoodFactsService';
import { X, Plus, PackagePlus, Sparkles, Loader2, Image as ImageIcon, Zap } from 'lucide-react';
import { formatRupiah, parseRupiah } from '../utils/formatCurrency';
import { isDigitalUnit } from '../utils/productUtils';

export const AddProductModal: React.FC = () => {
  const {
    isAddProductModalOpen,
    setAddProductModalOpen,
    newProductDraft,
    setNewProductDraft,
    categories,
    fetchMasterData,
    showToast
  } = usePOSStore();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | string>(categories[0]?.id || 1);
  const [price, setPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [barcode, setBarcode] = useState('');
  const [stock, setStock] = useState<string>('10');
  const [unit, setUnit] = useState('Pcs');
  const [description, setDescription] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingOFF, setIsFetchingOFF] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (isAddProductModalOpen && newProductDraft) {
      if (newProductDraft.name) setName(newProductDraft.name);
      if (newProductDraft.stock) setStock(newProductDraft.stock);
      if (newProductDraft.unit) setUnit(newProductDraft.unit);
      setNewProductDraft(null); // Clear draft after loading
    }
  }, [isAddProductModalOpen, newProductDraft, setNewProductDraft]);

  useEffect(() => {
    if (isAddProductModalOpen && categories.length > 0) {
      const exists = categories.some(c => String(c.id) === String(categoryId));
      if (!exists && categories[0]?.id) {
        setCategoryId(categories[0].id);
      }
    }
  }, [isAddProductModalOpen, categories, categoryId]);

  if (!isAddProductModalOpen) return null;

  const handleGenerateBarcode = () => {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setBarcode(`899${timestamp}${random}`);
  };

  const handleAutoSuggestPhoto = () => {
    if (!name.trim()) {
      showToast('Ketik Nama Produk terlebih dahulu!', 'error');
      return;
    }
    const suggestedUrl = openFoodFactsService.suggestPhotoByName(name);
    setImagePath(suggestedUrl);
    if (!barcode.trim()) {
      const newBarcode = openFoodFactsService.generateInternalBarcode();
      setBarcode(newBarcode);
    }
    showToast('Foto HD & Barcode unik berhasil diisikan!', 'success');
  };

  const handleSelectSearchResult = (prod: any) => {
    if (prod.name || prod.product_name) setName(prod.name || prod.product_name);
    if (prod.imageUrl || prod.image_url) setImagePath(prod.imageUrl || prod.image_url);
    if (prod.barcode) setBarcode(prod.barcode);
    setSearchResults([]);
    showToast('Data produk berhasil diisikan dari database Open Food Facts!', 'success');
  };

  const handleSearchByName = async () => {
    if (!name.trim()) {
      showToast('Ketik Nama Produk terlebih dahulu!', 'error');
      return;
    }

    setIsFetchingOFF(true);
    try {
      const results = await openFoodFactsService.searchByName(name.trim());
      if (results && results.length > 0) {
        if (results.length === 1) {
          const res = results[0];
          if (res.name) setName(res.name);
          if (res.imageUrl) setImagePath(res.imageUrl);
          if (res.barcode) setBarcode(res.barcode);
          showToast('Data produk ditemukan via Open Food Facts!', 'success');
        } else {
          setSearchResults(results);
        }
      } else {
        handleAutoSuggestPhoto();
      }
    } catch (err) {
      showToast('Gagal menghubungi Open Food Facts', 'error');
    } finally {
      setIsFetchingOFF(false);
    }
  };

  const handleSelectCandidate = (candidate: any) => {
    if (candidate.name) setName(candidate.name);
    if (candidate.barcode) setBarcode(candidate.barcode);
    if (candidate.imageUrl) setImagePath(candidate.imageUrl);
    setSearchResults([]);
    showToast(`Barcode Pabrik (${candidate.barcode}) & foto berhasil diisikan (${candidate.source || 'Public DB'})!`, 'success');
  };

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
    const numPrice = parseRupiah(price);
    const numCostPrice = parseRupiah(costPrice);

    if (!name.trim() || numPrice <= 0) {
      showToast('Nama dan harga jual produk wajib diisi dengan benar!', 'error');
      return;
    }

    const finalBarcode = barcode.trim() || openFoodFactsService.generateInternalBarcode();

    let targetCategoryId = categoryId;
    if (categories.length > 0) {
      const matched = categories.find(c => String(c.id) === String(categoryId));
      if (matched && matched.id !== undefined) {
        targetCategoryId = matched.id;
      } else if (categories[0]?.id !== undefined) {
        targetCategoryId = categories[0].id;
      }
    }

    setIsSubmitting(true);
    try {
      await repository.createMenuItem({
        name: name.trim(),
        category_id: targetCategoryId,
        price: numPrice,
        cost_price: numCostPrice,
        barcode: finalBarcode,
        stock: isDigitalUnit(unit) ? 0 : (parseInt(stock, 10) || 0),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#2A2622]">Nama Produk / Barang *</label>
              <button
                type="button"
                onClick={handleSearchByName}
                disabled={isFetchingOFF || !name.trim()}
                className="text-[11px] font-bold text-[#D97706] bg-[#FEF3C7] hover:bg-[#D97706] hover:text-white px-2 py-0.5 rounded-lg border border-[#D97706]/30 flex items-center gap-1 transition-all disabled:opacity-50"
                title="Cari foto & barcode dari database Open Food Facts berdasarkan Nama Barang"
              >
                {isFetchingOFF ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>Cari Data via Nama</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Misal: Autan Lotion 50g atau Indomie Goreng 85g"
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
            />

            {/* Candidate Search Results Panel */}
            {searchResults.length > 0 && (
              <div className="mt-2 p-2 bg-[#FAF7F2] border border-[#D97706]/30 rounded-xl space-y-2 max-h-48 overflow-y-auto shadow-sm">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-bold text-[#D97706]">
                    Varian Barcode Pabrik Ditemukan ({searchResults.length}):
                  </p>
                  <button type="button" onClick={() => setSearchResults([])} className="text-[#8A8175] hover:text-[#2A2622] text-[10px] font-bold">
                    Tutup
                  </button>
                </div>
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectCandidate(item)}
                    className="w-full text-left p-2 rounded-lg bg-white border border-[#E8E2D8] hover:border-[#D97706] hover:bg-[#FEF3C7]/40 transition-all flex items-center gap-2.5"
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-[#E8E2D8] shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center text-[#D97706] font-bold text-xs shrink-0">
                        OFF
                      </div>
                    )}
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-[#2A2622] truncate">{item.name}</p>
                        {item.source && (
                          <span className="px-1.5 py-0.2 bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30 text-[9px] font-bold rounded shrink-0">
                            {item.source}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#D97706] font-mono font-bold mt-0.5">Barcode Pabrik: {item.barcode}</p>
                    </div>
                    <span className="px-2 py-1 bg-[#D97706] text-white text-[10px] font-bold rounded-lg shrink-0 shadow-xs">
                      Pilih Barcode
                    </span>
                  </button>
                ))}
              </div>
            )}
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
                type="text"
                inputMode="numeric"
                required
                value={price}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setPrice(raw ? formatRupiah(raw, true) : '');
                }}
                onFocus={(e) => e.target.select()}
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
                onFocus={(e) => e.target.select()}
                placeholder="Rp 2.800"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#8A8175] focus:outline-none focus:border-[#D97706] select-text"
              />
            </div>
          </div>

          {/* Barcode Field with Open Food Facts Lookup Button */}
          <div>
            <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
              <label className="block text-xs font-semibold text-[#2A2622]">Barcode Pabrik / Kode Unik (Opsional)</label>
              <button
                type="button"
                onClick={handleFetchOpenFoodFacts}
                disabled={isFetchingOFF || !barcode.trim()}
                className="text-[11px] font-bold text-[#D97706] bg-[#FEF3C7] hover:bg-[#D97706] hover:text-white px-2 py-0.5 rounded-lg border border-[#D97706]/30 flex items-center gap-1 transition-all disabled:opacity-50"
                title="Cari Foto & Nama Produk dari Barcode"
              >
                {isFetchingOFF ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                <span>Cari via Barcode</span>
              </button>
            </div>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onFocus={(e) => e.target.select()}
              placeholder="Arahkan scanner Bluetooth atau ketik kode barcode (Misal: 899...)"
              data-barcode-input="true"
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#D97706] focus:outline-none focus:border-[#D97706]"
            />
          </div>

          {/* DEDICATED STOK FIELD OR DIGITAL ITEM BADGE */}
          {isDigitalUnit(unit) ? (
            <div className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#3B82F6]/30 space-y-1 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-[#1D4ED8] flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#3B82F6]" />
                  <span>Produk Digital ({unit})</span>
                </label>
                <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider bg-[#DBEAFE] px-2 py-0.5 rounded border border-[#3B82F6]/30">
                  Tanpa Stok Fisik
                </span>
              </div>
              <p className="text-[11px] text-[#2563EB] font-medium">
                Produk bertipe {unit} tidak memiliki batas stok fisik (Stok Tanpa Batas / Unlimited).
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#FEF3C7]/40 border border-[#D97706]/30 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold text-[#2A2622] flex items-center gap-1.5">
                  <PackagePlus className="w-4 h-4 text-[#D97706]" />
                  <span>Jumlah Total Stok Awal Barang *</span>
                </label>
                <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#D97706]/30">
                  Stok Toko
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  placeholder="Misal: 10 atau 50"
                  className="w-full bg-white border border-[#D97706]/50 rounded-xl px-4 py-2.5 text-sm font-black text-[#2A2622] focus:outline-none focus:border-[#D97706] shadow-xs"
                />
                <span className="text-xs font-bold text-[#8A8175] px-2 shrink-0">{unit}</span>
              </div>
              <p className="text-[10px] text-[#8A8175]">
                Jumlah fisik unit barang yang siap dijual di warung saat ini (Stok Awal).
              </p>
            </div>
          )}

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
