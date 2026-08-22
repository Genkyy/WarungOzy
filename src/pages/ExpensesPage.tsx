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

    setIsSubmitting(true);
    try {
      await repository.createExpense({
        category,
        description: description.trim(),
        amount: parseFloat(amount) || 0,
        expense_date: expenseDate,
        notes: notes.trim()
      });

      showToast('Pengeluaran berhasil dicatat!', 'success');
      setDescription('');
      setAmount('');
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0b0f19] space-y-4 sm:space-y-6 h-[calc(100vh-4rem)] pb-28 ipad:pb-6 select-none">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-rose-400" />
            Pencatatan Pengeluaran Warung
          </h1>
          <p className="text-xs text-slate-400">Catat Uang Keluar untuk Kulakan Stok, Listrik, Kebersihan, & Operasional</p>
        </div>

        <div className="bg-[#151c2c] px-4 py-2 rounded-xl border border-rose-500/30 text-right self-start sm:self-auto">
          <span className="text-[10px] text-slate-400 block uppercase">Total Pengeluaran</span>
          <span className="text-lg font-black text-rose-400 font-mono">Rp {totalExpenseAmount.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Form Add Expense (1 Col) */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-[#232d42] space-y-4">
          <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" />
            Input Pengeluaran Baru
          </h2>

          <form onSubmit={handleCreateExpense} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Kategori Pengeluaran</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#0b0f19] border border-[#232d42] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="belanja_barang">Kulakan / Belanja Stok Barang</option>
                <option value="operasional">Operasional (Listrik, Air, Kebersihan)</option>
                <option value="gaji">Gaji Karyawan / Kasir</option>
                <option value="lainnya">Pengeluaran Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Keterangan Pengeluaran *</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Misal: Beli Beras 50kg & Minyak 2 Dus"
                className="w-full bg-[#0b0f19] border border-[#232d42] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nominal (Rp) *</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="150000"
                className="w-full bg-[#0b0f19] border border-[#232d42] rounded-xl px-3 py-2 text-xs font-bold text-rose-400 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tanggal Pengeluaran</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-[#0b0f19] border border-[#232d42] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Catatan Tambahan</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan nota/kwitansi..."
                className="w-full bg-[#0b0f19] border border-[#232d42] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
            </button>
          </form>
        </div>

        {/* Expenses List (2 Cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 sm:p-5 border border-[#232d42] space-y-4">
          <h2 className="text-xs sm:text-sm font-bold text-white">Daftar Pengeluaran Terdaftar</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#151c2c] text-slate-400 font-semibold border-b border-[#232d42]">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3">Nominal</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232d42]/60 text-slate-300">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">Belum ada pengeluaran tercatat</td>
                  </tr>
                ) : (
                  expenses.map((item) => (
                    <tr key={item.id} className="hover:bg-[#151c2c]/50 transition-all">
                      <td className="p-3 text-slate-400 whitespace-nowrap">{item.expense_date}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-[#232d42] text-slate-300 text-[10px] uppercase font-bold">
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-semibold text-white">{item.description}</td>
                      <td className="p-3 font-bold text-rose-400 font-mono">Rp {item.amount.toLocaleString('id-ID')}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteExpense(item.id!)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-all"
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
