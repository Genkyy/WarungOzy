import React, { useEffect, useState } from 'react';
import { repository } from '../services/indexedDBRepository';
import { Expense } from '../types';
import { usePOSStore } from '../store/usePOSStore';
import { TrendingDown, Plus, Trash2 } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { showToast, showConfirm } = usePOSStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('belanja_barang');
  const [itemUnit, setItemUnit] = useState('Dus');
  const [itemQty, setItemQty] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadExpenses = async () => {
    const data = await repository.getExpenses();
    setExpenses(data);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) {
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
        amount: parseFloat(amount) || 0,
        expense_date: expenseDate,
        notes: finalNotes
      });

      showToast('Pengeluaran berhasil dicatat!', 'success');
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

  const handleDeleteExpense = (id: number) => {
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF7F2] space-y-4 sm:space-y-6 h-[calc(100vh-4rem)] pb-28 ipad:pb-6 select-none">
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

            {/* Dynamic Unit Dropdown & Quantity for Kulakan / Belanja Stok Barang */}
            {category === 'belanja_barang' && (
              <div className="p-3 rounded-xl bg-[#FEF3C7]/50 border border-[#D97706]/30 space-y-2 animate-fadeIn">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-[#D97706] mb-1">Tipe Satuan Barang</label>
                    <select
                      value={itemUnit}
                      onChange={(e) => setItemUnit(e.target.value)}
                      className="w-full bg-white border border-[#E8E2D8] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#2A2622] focus:outline-none focus:border-[#D97706]"
                    >
                      {['Dus', 'Renteng', 'Kg', 'Pcs', 'Botol', 'Liter', 'Bal', 'Karung', 'Bungkus', 'Karton'].map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#D97706] mb-1">Jumlah Kuantitas</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      placeholder="Misal: 5"
                      className="w-full bg-white border border-[#E8E2D8] rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#2A2622] focus:outline-none focus:border-[#D97706]"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-[#8A8175]">
                  Pilih tipe satuan barang kulakan warung (Dus, Renteng, Kg, dll).
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Keterangan Pengeluaran *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Misal: Beli Beras 50kg & Minyak 2 Dus"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1">Nominal (Rp) *</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="150000"
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
    </div>
  );
};
