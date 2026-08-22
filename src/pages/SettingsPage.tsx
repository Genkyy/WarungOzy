import React, { useState } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { repository } from '../services/indexedDBRepository';
import { Settings, Save, RotateCcw, Store, Percent, AlertCircle, FileText } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, fetchMasterData, showToast, showConfirm } = usePOSStore();

  const [outletName, setOutletName] = useState(settings.outlet_name);
  const [taxRate, setTaxRate] = useState(settings.tax_rate);
  const [receiptFooter, setReceiptFooter] = useState(settings.receipt_footer);
  const [lowStockThreshold, setLowStockThreshold] = useState(settings.low_stock_threshold);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await repository.updateSettings({
        outlet_name: outletName.trim(),
        tax_rate: taxRate.trim(),
        currency: 'IDR',
        receipt_footer: receiptFooter.trim(),
        low_stock_threshold: lowStockThreshold.trim()
      });

      await fetchMasterData();
      showToast('Pengaturan toko berhasil diperbarui!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSeedData = () => {
    showConfirm({
      title: 'Reset Basis Data Pabrik (Seed Data)',
      message: 'PERINGATAN: Seluruh data produk, riwayat nota penjualan, dan pengeluaran akan di-reset ulang ke data bawaan awal Warung Ozy. Tindakan ini tidak dapat dibatalkan.',
      type: 'danger',
      confirmText: 'Ya, Reset Basis Data',
      cancelText: 'Batal',
      onConfirm: async () => {
        try {
          await repository.resetDatabaseWithSeedData();
          await fetchMasterData();
          showToast('Basis data berhasil di-reset ke Seed Data Warung Ozy!', 'success');
        } catch (err) {
          console.error(err);
          showToast('Gagal reset basis data', 'error');
        }
      }
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-[#0b0f19] space-y-6 h-[calc(100vh-4rem)]">
      {/* Title Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Pengaturan Toko & POS
        </h1>
        <p className="text-xs text-slate-400">Konfigurasi nama toko/warung, tarif PPN, pesan struk, dan reset data</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Settings Form */}
        <form onSubmit={handleSaveSettings} className="glass-panel rounded-2xl p-6 border border-[#232d42] space-y-4">
          <h2 className="text-sm font-bold text-white mb-2 pb-2 border-b border-[#232d42]">Informasi Outlet Warung</h2>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-cyan-400" />
              Nama Toko / Outlet
            </label>
            <input
              type="text"
              required
              value={outletName}
              onChange={(e) => setOutletName(e.target.value)}
              className="w-full bg-[#0b0f19] border border-[#232d42] rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-cyan-400" />
                Tarif Pajak PPN (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="0"
                className="w-full bg-[#0b0f19] border border-[#232d42] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Default 0% untuk toko kelontong / warung eceran</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Batas Minimum Stok Menipis
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="5"
                className="w-full bg-[#0b0f19] border border-[#232d42] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              Pesan Footnote Struk Pembelian
            </label>
            <input
              type="text"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full bg-[#0b0f19] border border-[#232d42] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-4 border-t border-[#232d42] flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </form>

        {/* Database Management & Seed Reset */}
        <div className="glass-panel rounded-2xl p-6 border border-rose-900/30 bg-rose-950/10 space-y-3">
          <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset Data Bawaan Pabrik (Seed Data)
          </h2>
          <p className="text-xs text-slate-400">
            Mengisi ulang basis data IndexedDB iPad dengan data sampel produk warung Indonesia (Aqua, Indomie, Teh Botol, Beras, Minyak, dll).
          </p>

          <button
            onClick={handleResetSeedData}
            className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 font-bold text-xs flex items-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset ke Seed Data Bawaan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
