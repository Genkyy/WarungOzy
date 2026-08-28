import React, { useEffect, useState } from 'react';
import { repository } from '../services/supabaseRepository';
import { Expense, MenuItem } from '../types';
import { usePOSStore } from '../store/usePOSStore';
import { TrendingDown, Plus, Trash2, PackageCheck, CheckCircle2, Calculator } from 'lucide-react';
import { formatRupiah, parseRupiah } from '../utils/formatCurrency';
import { isDigitalUnit } from '../utils/productUtils';

export const ExpensesPage: React.FC = () => {
  const {
    products,
    fetchMasterData,
    showToast,
    showConfirm,
    setAddProductModalOpen,
    setNewProductDraft
  } = usePOSStore();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('belanja_barang');
  const [itemUnit, setItemUnit] = useState('Dus');
  const [itemQty, setItemQty] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live calculated unit price (Harga Satuan Modal = Nominal / Kuantitas)
  const numericAmount = parseRupiah(amount);
  const qtyNum = parseInt(itemQty, 10) || 0;
  const calculatedUnitPrice = (numericAmount > 0 && qtyNum > 0) ? Math.round(numericAmount / qtyNum) : 0;

  // Smart Restock Popup Candidate State (For both existing and unlisted products)
  const [restockCandidate, setRestockCandidate] = useState<{
    matchedProduct?: MenuItem;
    unlistedName?: string;
    qty: number;
    unit: string;
    unitPrice?: number;
    isNew: boolean;
  } | null>(null);

  const loadExpenses = async () => {
    const data = await repository.getExpenses();
    setExpenses(data);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || numericAmount <= 0) {
      showToast('Keterangan dan nominal pengeluaran wajib diisi!', 'error');
      return;
    }

    let finalNotes = notes.trim();
    if (category === 'belanja_barang' && itemUnit) {
      const unitInfo = itemQty.trim() ? `${itemQty} ${itemUnit}` : itemUnit;
      const priceInfo = calculatedUnitPrice > 0 ? ` (@ Rp ${calculatedUnitPrice.toLocaleString('id-ID')}/${itemUnit})` : '';
      finalNotes = finalNotes ? `${finalNotes} | Satuan: ${unitInfo}${priceInfo}` : `Satuan: ${unitInfo}${priceInfo}`;
    }

    setIsSubmitting(true);
    try {
      await repository.createExpense({
        category,
        description: description.trim(),
        amount: numericAmount,
        expense_date: expenseDate,
        notes: finalNotes
      });

      const finalQtyNum = parseInt(itemQty, 10) || 1;
      const descLower = description.trim().toLowerCase();

      // Smart Product Matching: Check if description matches any product in Master Stock
      if (category === 'belanja_barang') {
        const matched = products.find((p) => {
          const prodName = p.name.toLowerCase();
          return prodName.includes(descLower) || descLower.includes(prodName);
        });

        if (matched) {
          // Trigger Smart Restock Popup Modal for Existing Product!
          setRestockCandidate({
            matchedProduct: matched,
            qty: finalQtyNum,
            unit: itemUnit,
            unitPrice: calculatedUnitPrice,
            isNew: false
          });
        } else {
          // Trigger Smart Popup Modal for Unlisted Product!
          setRestockCandidate({
            unlistedName: description.trim(),
            qty: finalQtyNum,
            unit: itemUnit,
            unitPrice: calculatedUnitPrice,
            isNew: true
          });
        }
      } else {
        showToast('Pengeluaran berhasil dicatat!', 'success');
      }

      setDescription('');
      setAmount('');
      setItemQty('');
      setNotes('');
      await loadExpenses();
    } catch (err) {
      console.error(err);
      showToast('Gagal mencatat pengeluaran', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = (id: number | string) => {
    showConfirm({
      title: 'Hapus Catatan Pengeluaran',
      message: 'Apakah Anda yakin ingin menghapus data pengeluaran ini dari laporan keuangan?',
      type: 'warning',
      confirmText: 'Hapus Pengeluaran',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          await repository.deleteExpense(id);
          await loadExpenses();
          showToast('Pengeluaran berhasil dihapus', 'info');
        } catch (err) {
          console.error(err);
          showToast('Gagal menghapus pengeluaran', 'error');
        }
      }
    });
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF7F2] space-y-6 h-[calc(100vh-4rem)] pb-24">
      {/* Title Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-[#2A2622] flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-[#B84B3E]" />
          Pencatatan Pengeluaran & Kulakan
        </h1>
        <p className="text-xs text-[#8A8175]">Catat biaya operasional, tagihan listrik, gaji, serta belanja stok toko (restok)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Add Expense (1 Col) */}
        <div className="paper-panel rounded-xl p-4 sm:p-5 border border-[#E8E2D8] space-y-4 bg-white shadow-sm h-fit">
          <h2 className="text-xs sm:text-sm font-bold text-[#2A2622] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#D97706]" />
            Tambah Pengeluaran Baru
          </h2>

          <form onSubmit={handleCreateExpense} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Kategori Pengeluaran *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Expense['category'])}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#2A2622] font-semibold focus:outline-none focus:border-[#D97706]"
              >
                <option value="belanja_barang">Belanja Stok Barang / Kulakan</option>
                <option value="operasional">Operasional (Listrik, Air, Wifi, Plastik)</option>
                <option value="gaji">Gaji Karyawan / Bonus</option>
                <option value="sewa">Sewa Tempat / Bangunan</option>
                <option value="lain_lain">Lain-lain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">
                {category === 'belanja_barang' ? 'Nama Barang / Produk yang Dibeli *' : 'Keterangan Pengeluaran *'}
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={(e) => e.target.select()}
                placeholder="Misal: Autan Lotion 50g atau Indomie Goreng"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#2A2622] focus:outline-none focus:border-[#D97706]"
              />
            </div>

            {/* Dynamic Quantity & Unit Dropdown for Kulakan / Belanja Stok Barang */}
            {category === 'belanja_barang' && (
              <div className="p-3 rounded-xl bg-[#FEF3C7]/50 border border-[#D97706]/30 space-y-2.5 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#2A2622] mb-1">Jumlah Kuantitas *</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="Misal: 50"
                      className="w-full bg-white border border-[#E8E2D8] rounded-xl px-2.5 py-1.5 text-xs font-black text-[#2A2622] focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#2A2622] mb-1">Tipe Satuan Barang</label>
                    <select
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value)}
                      className="w-full bg-white border border-[#E8E2D8] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#2A2622] focus:outline-none focus:border-[#D97706]"
                    >
                      {['Dus', 'Renteng', 'Kg', 'Pcs', 'Botol', 'Liter', 'Bal', 'Karung', 'Bungkus', 'Karton', 'Top Up', 'Voucher'].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. LIVE CALCULATED UNIT PRICE BADGE (HARGA SATUAN) */}
                <div className="p-2.5 rounded-xl bg-white border border-[#E8E2D8] space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-[#059669] flex items-center gap-1">
                      <Calculator className="w-3.5 h-3.5 text-[#059669]" />
                      Harga Satuan (Modal per {itemUnit}):
                    </span>
                    {calculatedUnitPrice > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#059669] text-white text-[9px] font-extrabold">Otomatis</span>
                    )}
                  </div>
                  {calculatedUnitPrice > 0 ? (
                    <div className="flex items-baseline justify-between pt-0.5">
                      <span className="text-[11px] text-[#8A8175] font-medium">Rp {numericAmount.toLocaleString('id-ID')} ÷ {qtyNum} {itemUnit}</span>
                      <span className="text-xs sm:text-sm font-black text-[#059669]">Rp {calculatedUnitPrice.toLocaleString('id-ID')} <span className="text-[10px] text-[#8A8175] font-normal">/ {itemUnit}</span></span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#8A8175] italic">Lengkapi jumlah kuantitas & nominal pengeluaran untuk melihat kalkulasi harga modal per {itemUnit}.</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Nominal Pengeluaran (Rp) *</label>
              <input
                type="text"
                inputMode="numeric"
                required
                value={amount}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setAmount(raw ? formatRupiah(raw, true) : '');
                }}
                onFocus={(e) => e.target.select()}
                placeholder="Rp 150.000"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#B84B3E] focus:outline-none focus:border-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Tanggal Pengeluaran</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Catatan Tambahan</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan nota/kwitansi..."
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-sm transition-all"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-2 paper-panel rounded-xl p-4 sm:p-5 border border-[#E8E2D8] space-y-4 bg-white shadow-sm">
          <h2 className="text-xs sm:text-sm font-bold text-[#2A2622]">Daftar Pengeluaran Terdaftar</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] text-[#8A8175] font-bold border-b border-[#E8E2D8]">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3">Nominal</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D8] text-[#2A2622]">
                {expenses.length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-[#8A8175]">Belum ada data</td></tr>
                ) : (
                  expenses.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF7F2]">
                      <td className="p-3 text-[#8A8175] whitespace-nowrap">{item.expense_date}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E8E2D8] text-[10px] uppercase font-bold">{item.category.replace('_', ' ')}</span></td>
                      <td className="p-3 space-y-0.5">
                        <p className="font-semibold text-[#2A2622]">{item.description}</p>
                        {item.notes && <p className="text-[10px] text-[#8A8175] font-normal">{item.notes}</p>}
                      </td>
                      <td className="p-3 font-bold text-[#B84B3E]">Rp {item.amount.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDeleteExpense(item.id!)} className="p-1.5 rounded-lg text-[#8A8175] hover:text-[#B84B3E]"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Smart Restock Popup */}
      {restockCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${restockCandidate.isNew ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#F0F7F2] text-[#059669]'}`}>
                <PackageCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#2A2622]">{restockCandidate.isNew ? 'Produk Baru' : 'Produk Terdeteksi'}</h3>
              </div>
            </div>

            {!restockCandidate.isNew && restockCandidate.matchedProduct ? (
              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8E2D8] space-y-1.5">
                <p className="text-xs font-bold text-[#2A2622]">{restockCandidate.matchedProduct.name}</p>
                <p className="text-[11px] text-[#8A8175]">Stok saat ini: <span className="font-extrabold text-[#D97706]">{isDigitalUnit(restockCandidate.matchedProduct.unit) ? 'Digital' : `${restockCandidate.matchedProduct.stock} ${restockCandidate.matchedProduct.unit}`}</span></p>
                {restockCandidate.unitPrice && restockCandidate.unitPrice > 0 && (
                  <p className="text-[11px] text-[#059669] font-extrabold">Estimasi Harga Satuan: Rp {restockCandidate.unitPrice.toLocaleString('id-ID')} / {restockCandidate.unit}</p>
                )}
                {!isDigitalUnit(restockCandidate.matchedProduct.unit) && (
                  <p className="text-xs text-[#059669] font-bold mt-1">Tambahkan <span className="underline">+ {restockCandidate.qty} {restockCandidate.unit}</span>?</p>
                )}
              </div>
            ) : (
              <div className="bg-[#FEF3C7]/40 p-3.5 rounded-xl border border-[#D97706]/30 space-y-1.5">
                <p className="text-xs font-extrabold text-[#2A2622]">"{restockCandidate?.unlistedName}"</p>
                {restockCandidate?.unitPrice && restockCandidate.unitPrice > 0 && (
                  <p className="text-[11px] text-[#D97706] font-black">Estimasi Modal HPP: Rp {restockCandidate.unitPrice.toLocaleString('id-ID')} / {restockCandidate.unit}</p>
                )}
                <p className="text-xs text-[#D97706] font-bold">Barang ini belum terdaftar. Daftarkan ke Master Stok?</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button type="button" onClick={() => setRestockCandidate(null)} className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] text-xs font-semibold">Tidak</button>
              {!restockCandidate.isNew && restockCandidate.matchedProduct ? (
                !isDigitalUnit(restockCandidate.matchedProduct.unit) && (
                  <button type="button" onClick={async () => {
                    await repository.adjustStock(restockCandidate.matchedProduct!.id!, restockCandidate.qty, 'adjustment_in');
                    await fetchMasterData();
                    setRestockCandidate(null);
                  }} className="px-5 py-2.5 rounded-xl bg-[#059669] text-white font-extrabold text-xs">Ya, Tambahkan Stok</button>
                )
              ) : (
                <button type="button" onClick={() => {
                  setNewProductDraft({
                    name: restockCandidate.unlistedName,
                    stock: restockCandidate.qty.toString(),
                    unit: restockCandidate.unit,
                    costPrice: restockCandidate.unitPrice ? formatRupiah(restockCandidate.unitPrice.toString(), true) : ''
                  });
                  setAddProductModalOpen(true);
                  setRestockCandidate(null);
                }} className="px-5 py-2.5 rounded-xl bg-[#D97706] text-white font-extrabold text-xs">Ya, Buat Baru</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
