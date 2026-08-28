import React, { useEffect, useState } from 'react';
import { repository } from '../services/supabaseRepository';
import { Expense, MenuItem } from '../types';
import { usePOSStore } from '../store/usePOSStore';
import { TrendingDown, Plus, Trash2, PackageCheck, CheckCircle2 } from 'lucide-react';
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

  // Smart Restock Popup Candidate State (For both existing and unlisted products)
  const [restockCandidate, setRestockCandidate] = useState<{
    matchedProduct?: MenuItem;
    unlistedName?: string;
    qty: number;
    unit: string;
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
    const numericAmount = parseRupiah(amount);
    if (!description.trim() || numericAmount <= 0) {
      showToast('Keterangan dan nominal pengeluaran wajib diisi!', 'error');
      return;
    }

    let finalNotes = notes.trim();
    if (category === 'belanja_barang' && itemUnit) {
      const unitInfo = itemQty.trim() ? `${itemQty} ${itemUnit}` : itemUnit;
      finalNotes = finalNotes ? `${finalNotes} | Satuan: ${unitInfo}` : `Satuan: ${unitInfo}`;
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

      const qtyNum = parseInt(itemQty, 10) || 1;
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
            qty: qtyNum,
            unit: itemUnit,
            isNew: false
          });
        } else {
          // Trigger Smart Popup Modal for Unlisted Product!
          setRestockCandidate({
            unlistedName: description.trim(),
            qty: qtyNum,
            unit: itemUnit,
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
          showToast('Pengeluaran dihapus', 'success');
          await loadExpenses();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF7F2] space-y-4 sm:space-y-6 h-[calc(100vh-4rem)] pb-28 ipad:pb-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#2A2622] flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-[#B84B3E]" />
            Pencatatan Pengeluaran Warung
          </h1>
          <p className="text-xs text-[#8A8175]">Catat Uang Keluar untuk Kulakan Stok, Listrik, Kebersihan, & Operasional</p>
        </div>

        <div className="bg-white px-4 py-2 rounded-xl border border-[#E8E2D8] text-right self-start sm:self-auto shadow-sm">
          <span className="text-[10px] text-[#8A8175] block uppercase font-bold">Total Pengeluaran</span>
          <span className="text-lg font-bold text-[#B84B3E]">Rp {totalExpenseAmount.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Form Add Expense (1 Col) */}
        <div className="paper-panel rounded-xl p-4 sm:p-5 border border-[#E8E2D8] space-y-4 bg-white shadow-sm">
          <h2 className="text-xs sm:text-sm font-bold text-[#2A2622] flex items-center gap-2 pb-2 border-b border-[#E8E2D8]">
            <Plus className="w-4 h-4 text-[#D97706]" />
            Input Pengeluaran Baru
          </h2>

          <form onSubmit={handleCreateExpense} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Kategori Pengeluaran</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
              >
                <option value="belanja_barang">Kulakan / Belanja Stok Barang</option>
                <option value="operasional">Operasional (Listrik, Air, Kebersihan)</option>
                <option value="gaji">Gaji Karyawan / Kasir</option>
                <option value="lainnya">Pengeluaran Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">
                Keterangan Pengeluaran / Nama Barang Kulakan *
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
              <div className="p-3 rounded-xl bg-[#FEF3C7]/50 border border-[#D97706]/30 space-y-2 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2">
                  {/* 1. JUMLAH KUANTITAS */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#2A2622] mb-1">
                      Jumlah Kuantitas *
                    </label>
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

                  {/* 2. TIPE SATUAN BARANG */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-[#2A2622] mb-1">
                      Tipe Satuan Barang
                    </label>
                    <select
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value)}
                      className="w-full bg-white border border-[#E8E2D8] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#2A2622] focus:outline-none focus:border-[#D97706]"
                    >
                      {['Dus', 'Renteng', 'Kg', 'Pcs', 'Botol', 'Liter', 'Bal', 'Karung', 'Bungkus', 'Karton', 'Top Up', 'Voucher'].map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
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
                  if (!raw) {
                    setAmount('');
                    return;
                  }
                  setAmount(formatRupiah(raw, true));
                }}
                onFocus={(e) => e.target.select()}
                placeholder="Rp 150.000"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs font-bold text-[#B84B3E] focus:outline-none focus:border-[#D97706] select-text"
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
                onFocus={(e) => e.target.select()}
                placeholder="Catatan nota/kwitansi..."
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-sm transition-all min-h-[44px]"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </button>
          </form>
        </div>

        {/* Expenses List (2 Cols) */}
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
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-[#8A8175]">Belum ada pengeluaran tercatat</td>
                  </tr>
                ) : (
                  expenses.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF7F2] transition-all">
                      <td className="p-3 text-[#8A8175] whitespace-nowrap">{item.expense_date}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-[#FAF7F2] border border-[#E8E2D8] text-[#2A2622] text-[10px] uppercase font-bold">
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-[#2A2622]">{item.description}</td>
                      <td className="p-3 font-bold text-[#B84B3E]">Rp {item.amount.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteExpense(item.id!)}
                          className="p-1.5 rounded-lg text-[#8A8175] hover:text-[#B84B3E] transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Smart Restock Confirmation Pop-Up Modal (Handles both Found and Unlisted products) */}
      {restockCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl shrink-0 ${
                restockCandidate.isNew
                  ? 'bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/30'
                  : 'bg-[#F0F7F2] text-[#059669] border border-[#059669]/30'
              }`}>
                <PackageCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-[#2A2622]">
                  {restockCandidate.isNew
                    ? 'Produk Belum Terdaftar di Stok Warung'
                    : 'Produk Terdeteksi di Master Stok!'}
                </h3>
                <p className="text-xs text-[#8A8175]">
                  {restockCandidate.isNew
                    ? 'Barang baru belum ada di daftar master stok'
                    : 'Pengeluaran cocok dengan produk terdaftar'}
                </p>
              </div>
            </div>

            {!restockCandidate.isNew && restockCandidate.matchedProduct ? (
              /* Case A: Product Found in Master Stock */
              <div className="bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8E2D8] space-y-1">
                <p className="text-xs font-bold text-[#2A2622]">{restockCandidate.matchedProduct.name}</p>
                <p className="text-[11px] text-[#8A8175]">
                  Stok saat ini: <span className="font-extrabold text-[#D97706]">{isDigitalUnit(restockCandidate.matchedProduct.unit) ? 'Digital (—)' : `${restockCandidate.matchedProduct.stock} ${restockCandidate.matchedProduct.unit}`}</span>
                </p>
                {isDigitalUnit(restockCandidate.matchedProduct.unit) ? (
                  <p className="text-xs text-[#2563EB] font-bold mt-1">
                    Produk ini bertipe {restockCandidate.matchedProduct.unit} (Digital - Tanpa Stok Fisik).
                  </p>
                ) : (
                  <p className="text-xs text-[#059669] font-bold mt-1">
                    Apakah Anda ingin menambahkan <span className="underline">+ {restockCandidate.qty} {restockCandidate.unit}</span> ke stok produk ini sebagai Restok?
                  </p>
                )}
              </div>
            ) : (
              /* Case B: Product NOT Found in Master Stock */
              <div className="bg-[#FEF3C7]/40 p-3.5 rounded-xl border border-[#D97706]/30 space-y-1">
                <p className="text-xs font-extrabold text-[#2A2622]">"{restockCandidate?.unlistedName}"</p>
                <p className="text-xs text-[#D97706] font-bold">
                  Barang ini belum terdaftar. Apakah Anda ingin mendaftarkan produk ini ke Master Stok warung?
                </p>
                <p className="text-[10px] text-[#8A8175] mt-1">
                  Pengeluaran telah dicatat. Mengklik "Ya" akan membuka form untuk melengkapi harga jual & modal.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRestockCandidate(null);
                  showToast('Pengeluaran dicatat (Tanpa update stok)', 'info');
                }}
                className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] bg-white text-[#8A8175] hover:text-[#2A2622] text-xs font-semibold"
              >
                Tidak, Hanya Catat
              </button>

              {!restockCandidate.isNew && restockCandidate.matchedProduct ? (
                !isDigitalUnit(restockCandidate.matchedProduct.unit) && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await repository.adjustStock(restockCandidate.matchedProduct!.id!, restockCandidate.qty, 'adjustment_in');
                        await fetchMasterData();
                        showToast(`Stok '${restockCandidate.matchedProduct!.name}' bertambah +${restockCandidate.qty} ${restockCandidate.unit}!`, 'success');
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setRestockCandidate(null);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 min-h-[40px]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ya, Tambahkan Stok (+{restockCandidate.qty})</span>
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setNewProductDraft({
                      name: restockCandidate.unlistedName,
                      stock: restockCandidate.qty.toString(),
                      unit: restockCandidate.unit
                    });
                    setAddProductModalOpen(true);
                    setRestockCandidate(null);
                    showToast('Pengeluaran dicatat. Silakan lengkapi harga jual & modal produk!', 'info');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 min-h-[40px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ya, Buat Produk Baru</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
