import React, { useState } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { repository } from '../services/indexedDBRepository';
import { Settings, Save, RotateCcw, Store, Percent, AlertCircle, FileText, Bluetooth, Sliders, QrCode, Download, Upload } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, fetchMasterData, showToast, showConfirm, setBluetoothModalOpen, scannerConnectionStatus } = usePOSStore();

  const [outletName, setOutletName] = useState(settings.outlet_name);
  const [taxRate, setTaxRate] = useState(settings.tax_rate);
  const [receiptFooter, setReceiptFooter] = useState(settings.receipt_footer);
  const [lowStockThreshold, setLowStockThreshold] = useState(settings.low_stock_threshold);
  const [qrisImageUrl, setQrisImageUrl] = useState(settings.qris_image_url || '');
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
        low_stock_threshold: lowStockThreshold.trim(),
        qris_image_url: qrisImageUrl.trim()
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
      title: 'Reset Data Pabrik (Seed Data)',
      message: 'PERINGATAN: Seluruh data produk, riwayat nota penjualan, dan pengeluaran akan di-reset ulang ke data sampel bawaan Warung Ozy. Tindakan ini tidak dapat dibatalkan.',
      type: 'danger',
      confirmText: 'Ya, Reset Data Toko',
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

  const handleExportBackup = async () => {
    try {
      const jsonStr = await repository.exportDatabaseJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_warung_ozy_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Cadangan Database (.json) berhasil diunduh!', 'success');
    } catch (err) {
      showToast('Gagal mengunduh cadangan database', 'error');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showConfirm({
      title: 'Pulihkan Database dari File Backup',
      message: 'Apakah Anda yakin ingin memulihkan database dari file cadangan ini? Data lokal saat ini akan diperbarui dengan data dari file backup.',
      type: 'warning',
      confirmText: 'Ya, Pulihkan Database',
      cancelText: 'Batal',
      onConfirm: () => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const content = event.target?.result as string;
            await repository.importDatabaseJSON(content);
            await fetchMasterData();
            showToast('Database berhasil dipulihkan dari file backup!', 'success');
          } catch (err) {
            console.error(err);
            showToast('Gagal memulihkan database. File backup tidak valid.', 'error');
          }
        };
        reader.readAsText(file);
      }
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAF7F2] space-y-6 h-[calc(100vh-4rem)] pb-24">
      {/* Title Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-[#2A2622] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#D97706]" />
          Pengaturan Toko & POS
        </h1>
        <p className="text-xs text-[#8A8175]">Kelola info warung, batas stok menipis, footnote struk, dan reset data sampel</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Single-Column Grouped Form Layout (desain.md 5.5) */}
        <form onSubmit={handleSaveSettings} className="paper-panel rounded-xl p-5 sm:p-6 border border-[#E8E2D8] space-y-5 shadow-sm bg-white">
          <h2 className="text-sm font-bold text-[#2A2622] pb-2 border-b border-[#E8E2D8]">
            Informasi Outlet Toko
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#2A2622] mb-1.5 flex items-center gap-1.5">
              <Store className="w-4 h-4 text-[#D97706]" />
              Nama Toko / Outlet
            </label>
            <input
              type="text"
              required
              value={outletName}
              onChange={(e) => setOutletName(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-sm text-[#2A2622] font-semibold focus:outline-none focus:border-[#D97706] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1.5 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-[#D97706]" />
                Tarif Pajak PPN (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="0"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-sm text-[#2A2622] focus:outline-none focus:border-[#D97706] focus:bg-white"
              />
              <p className="text-[10px] text-[#8A8175] mt-1">Isi 0% untuk warung kelontong / retail biasa</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#2A2622] mb-1.5 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-[#D4A017]" />
                Batas Minimum Stok Menipis
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="5"
                className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-sm text-[#2A2622] focus:outline-none focus:border-[#D97706] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A2622] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#D97706]" />
              Footnote Struk Pembelian
            </label>
            <input
              type="text"
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-sm text-[#2A2622] focus:outline-none focus:border-[#D97706] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A2622] mb-1.5 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-[#D97706]" />
              URL Gambar Kode QRIS Resmi Toko / Warung (Opsional)
            </label>
            <input
              type="text"
              value={qrisImageUrl}
              onChange={(e) => setQrisImageUrl(e.target.value)}
              placeholder="https://... (URL Foto QRIS BCA/Mandiri/DANA/OVO Warung Anda)"
              className="w-full bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#2A2622] focus:outline-none focus:border-[#D97706] focus:bg-white"
            />
            <p className="text-[10px] text-[#8A8175] mt-1">
              Jika diisi, gambar QRIS resmi warung Anda akan langsung muncul di layar kasir saat pelanggan memilih pembayaran QRIS.
            </p>
          </div>

          {/* Bluetooth & Hardware Scanner Settings Card */}
          <div className="pt-4 border-t border-[#E8E2D8] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-[#2A2622] flex items-center gap-2">
                <Bluetooth className="w-4 h-4 text-[#D97706]" />
                <span>Perangkat Scanner Bluetooth & Barcode</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                  scannerConnectionStatus === 'connected'
                    ? 'bg-[#F0FDF4] border-[#DCFCE7] text-[#15803D]'
                    : scannerConnectionStatus === 'standby'
                    ? 'bg-[#FEF3C7] border-[#FDE68A] text-[#D97706]'
                    : 'bg-[#FDF2F0] border-[#F87171]/30 text-[#B84B3E]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    scannerConnectionStatus === 'connected' ? 'bg-[#16A34A] animate-pulse' : scannerConnectionStatus === 'standby' ? 'bg-[#D97706]' : 'bg-[#B84B3E]'
                  }`}></span>
                  <span>{scannerConnectionStatus === 'connected' ? 'Connected' : scannerConnectionStatus === 'standby' ? 'Standby' : 'Off'}</span>
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setBluetoothModalOpen(true)}
                className="text-xs font-bold text-[#D97706] bg-[#FEF3C7] hover:bg-[#D97706] hover:text-white px-3 py-1.5 rounded-xl border border-[#D97706]/30 flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Uji Coba & Konfigurasi Scanner</span>
              </button>
            </div>
            <p className="text-xs text-[#8A8175]">
              WarungOzy mendukung pemindai nirkabel Bluetooth HID (Keyboard Wedge) dan USB Barcode Gun. Saat barcode dipindai, produk otomatis masuk keranjang POS disertai suara bip khas kasir.
            </p>
          </div>

          {/* Solid Amber Sticky Save Button (desain.md 5.5) */}
          <div className="pt-4 border-t border-[#E8E2D8] flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-sm transition-all min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Pengaturan'}</span>
            </button>
          </div>
        </form>

        {/* Database Backup & Restore Panel (For Long-Term Data Safety) */}
        <div className="paper-panel rounded-xl p-5 sm:p-6 border border-[#E8E2D8] bg-white space-y-3 shadow-sm">
          <h2 className="text-sm font-bold text-[#2A2622] flex items-center gap-2">
            <Download className="w-4 h-4 text-[#D97706]" />
            Cadangan & Pemulihan Database Toko (Backup & Restore .json)
          </h2>
          <p className="text-xs text-[#8A8175]">
            Unduh seluruh data produk, riwayat nota transaksi, mutasi stok, dan pengeluaran ke dalam file cadangan (`.json`). File ini dapat dipulihkan kapan saja atau dipindahkan ke iPad/HP baru.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-4 py-2.5 rounded-xl bg-[#FEF3C7] hover:bg-[#D97706] text-[#D97706] hover:text-white border border-[#D97706]/30 font-bold text-xs flex items-center gap-2 transition-all min-h-[42px]"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Cadangan Database (.json)</span>
            </button>

            <label className="px-4 py-2.5 rounded-xl bg-[#F0F7F2] hover:bg-[#3F7D4F] text-[#3F7D4F] hover:text-white border border-[#3F7D4F]/30 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer min-h-[42px]">
              <Upload className="w-4 h-4" />
              <span>Pulihkan Database dari File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Reset Seed Data Panel */}
        <div className="paper-panel rounded-xl p-5 sm:p-6 border border-[#B84B3E]/30 bg-white space-y-3 shadow-sm">
          <h2 className="text-sm font-bold text-[#B84B3E] flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset Data Bawaan Pabrik (Seed Data)
          </h2>
          <p className="text-xs text-[#8A8175]">
            Mengisi ulang basis data IndexedDB lokal dengan sampel produk asli warung kelontong Indonesia (Indomie, Aqua, Teh Botol, Beras, Minyak, dll).
          </p>

          <button
            onClick={handleResetSeedData}
            className="px-4 py-2.5 rounded-xl bg-[#FDF2F0] hover:bg-[#B84B3E] text-[#B84B3E] hover:text-white border border-[#B84B3E]/30 font-bold text-xs flex items-center gap-2 transition-all min-h-[42px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Data Toko</span>
          </button>
        </div>
      </div>
    </div>
  );
};
