import React, { useState } from 'react';
import { usePOSStore } from '../store/usePOSStore';
import { repository } from '../services/indexedDBRepository';
import { audioBeep } from '../utils/audioBeep';
import {
  X,
  Bluetooth,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Barcode,
  Keyboard,
  Info,
  Sliders,
  Play
} from 'lucide-react';

export const BluetoothScannerModal: React.FC = () => {
  const {
    isBluetoothModalOpen,
    setBluetoothModalOpen,
    settings,
    fetchMasterData,
    showToast,
    lastScannedBarcode,
    setLastScannedBarcode,
    scannerConnectionStatus,
    setScannerConnectionStatus,
    scannerDeviceName
  } = usePOSStore();

  const [testInput, setTestInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [testScanResult, setTestScanResult] = useState<{
    code: string;
    productName?: string;
    price?: number;
    stock?: number;
    speedMs?: number;
    status: 'success' | 'not_found' | 'idle';
  }>({
    code: '',
    status: 'idle'
  });

  const [beepSound, setBeepSound] = useState(settings.scanner_beep_sound !== 'false');
  const [enableScanner, setEnableScanner] = useState(settings.enable_bluetooth_scanner !== 'false');
  const [maxDelay, setMaxDelay] = useState(settings.scanner_max_delay || '80');

  if (!isBluetoothModalOpen) return null;

  const isConnected = scannerConnectionStatus === 'connected';
  const isStandby = scannerConnectionStatus === 'standby';
  const isDisconnected = scannerConnectionStatus === 'disconnected';

  const handleTestBeep = () => {
    audioBeep.playBeep('success');
    showToast('Suara bip scanner diputar! 🔊', 'info');
  };

  const handleManualTestScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;

    const barcode = testInput.trim();
    setTestInput('');

    try {
      const product = await repository.findProductByBarcode(barcode);
      if (product) {
        if (beepSound) audioBeep.playBeep('success');
        setTestScanResult({
          code: barcode,
          productName: product.name,
          price: product.price,
          stock: product.stock,
          speedMs: 12,
          status: 'success'
        });
        setLastScannedBarcode({
          barcode,
          timestamp: Date.now(),
          success: true,
          productName: product.name,
          scanSpeedMs: 12
        });
        setScannerConnectionStatus('connected');
        showToast(`Tes Barcode Berhasil: ${product.name}`, 'success');
      } else {
        if (beepSound) audioBeep.playBeep('error');
        setTestScanResult({
          code: barcode,
          status: 'not_found'
        });
        setLastScannedBarcode({
          barcode,
          timestamp: Date.now(),
          success: false
        });
        showToast(`Barcode '${barcode}' tidak ada di database produk`, 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveScannerSettings = async () => {
    setIsSaving(true);
    try {
      await repository.updateSettings({
        scanner_beep_sound: beepSound ? 'true' : 'false',
        enable_bluetooth_scanner: enableScanner ? 'true' : 'false',
        scanner_max_delay: maxDelay.trim() || '80'
      });

      if (!enableScanner) {
        setScannerConnectionStatus('disconnected');
      } else {
        setScannerConnectionStatus('connected');
      }

      await fetchMasterData();
      showToast('Pengaturan Scanner Bluetooth berhasil disimpan!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan pengaturan scanner', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePairWebBluetooth = async () => {
    if (!('bluetooth' in navigator)) {
      showToast('Web Bluetooth API tidak didukung oleh browser ini. Gunakan Bluetooth HID Keyboard Mode (bawaan Windows/Android).', 'error');
      return;
    }

    try {
      showToast('Membuka dialog pencarian perangkat Bluetooth...', 'info');
      await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true
      });
      setScannerConnectionStatus('connected');
      showToast('Perangkat Bluetooth berhasil dipasangkan!', 'success');
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        console.error(err);
        showToast('Proses koneksi Bluetooth dibatalkan atau tidak responsif', 'info');
      }
    }
  };

  const handleToggleConnect = async () => {
    setEnableScanner(true);
    setScannerConnectionStatus('connected');
    try {
      await repository.updateSettings({ enable_bluetooth_scanner: 'true' });
      await fetchMasterData();
      showToast('Perangkat Scanner Bluetooth berhasil dihubungkan! 🟢', 'success');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleDisconnect = async () => {
    setEnableScanner(false);
    setScannerConnectionStatus('disconnected');
    try {
      await repository.updateSettings({ enable_bluetooth_scanner: 'false' });
      await fetchMasterData();
      showToast('Perangkat Scanner Bluetooth diputuskan (Disconnected) 🔴', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#E8E2D8] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] border border-[#D97706]/30 flex items-center justify-center text-[#D97706]">
              <Bluetooth className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#2A2622]">Konfigurasi & Status Scanner Bluetooth</h2>
              <p className="text-[11px] text-[#8A8175]">Scanner nirkabel Bluetooth HID & USB Barcode Wedge</p>
            </div>
          </div>
          <button
            onClick={() => setBluetoothModalOpen(false)}
            className="p-1.5 rounded-xl text-[#8A8175] hover:text-[#2A2622] bg-white border border-[#E8E2D8]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto bg-white flex-1">
          {/* Dynamic Connection Status Indicator Card */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isConnected
              ? 'bg-[#F0FDF4] border-[#DCFCE7]'
              : isStandby
              ? 'bg-[#FEF3C7]/60 border-[#FDE68A]'
              : 'bg-[#FDF2F0] border-[#F87171]/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center shrink-0">
                {isConnected ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#16A34A] animate-ping absolute opacity-75"></span>
                    <span className="w-3.5 h-3.5 rounded-full bg-[#16A34A] relative"></span>
                  </>
                ) : isStandby ? (
                  <span className="w-3.5 h-3.5 rounded-full bg-[#D97706]"></span>
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full bg-[#B84B3E]"></span>
                )}
              </div>
              <div>
                <p className={`text-xs font-bold flex items-center gap-1.5 ${
                  isConnected ? 'text-[#15803D]' : isStandby ? 'text-[#D97706]' : 'text-[#B84B3E]'
                }`}>
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                      <span>STATUS: TERHUBUNG & AKTIF (Connected)</span>
                    </>
                  ) : isStandby ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-[#D97706]" />
                      <span>STATUS: SIAP (Standby)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-[#B84B3E]" />
                      <span>STATUS: TERPUTUS / NONAKTIF (Disconnected)</span>
                    </>
                  )}
                </p>
                <p className="text-[11px] text-[#8A8175] mt-0.5 font-medium">
                  Perangkat: <span className="font-semibold text-[#2A2622]">{scannerDeviceName}</span>
                </p>
              </div>
            </div>

            {/* Quick Status Control Buttons */}
            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={handleToggleConnect}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  isConnected ? 'bg-[#16A34A] text-white border-[#16A34A]' : 'bg-white text-[#16A34A] border-[#16A34A]/30 hover:bg-[#F0FDF4]'
                }`}
              >
                🟢 Connected
              </button>
              <button
                type="button"
                onClick={handleToggleDisconnect}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  isDisconnected ? 'bg-[#B84B3E] text-white border-[#B84B3E]' : 'bg-white text-[#B84B3E] border-[#B84B3E]/30 hover:bg-[#FDF2F0]'
                }`}
              >
                🔴 Disconnected
              </button>
              <button
                type="button"
                onClick={handleTestBeep}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-[#16A34A]/30 bg-[#DCFCE7] text-[#15803D] hover:bg-[#16A34A] hover:text-white transition-all flex items-center gap-1"
                title="Uji coba suara bip scanner"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Tes Bip</span>
              </button>
            </div>
          </div>

          {/* Interactive Live Scanner Test Bench */}
          <div className="paper-panel rounded-xl p-4 border border-[#E8E2D8] bg-[#FAF7F2] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#2A2622] flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-[#D97706]" />
                Uji Coba Pemindaian Barcode Langsung
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#8A8175] border border-[#E8E2D8]">
                Arahkan scanner ke barcode
              </span>
            </div>

            <form onSubmit={handleManualTestScan} className="flex gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                data-barcode-input="true"
                placeholder="Scan barcode dengan alat Bluetooth Anda di sini..."
                className="flex-1 bg-white border border-[#E8E2D8] rounded-xl px-3.5 py-2.5 text-xs text-[#2A2622] font-mono focus:outline-none focus:border-[#D97706]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Tes Scan</span>
              </button>
            </form>

            {/* Test Scan Result Box */}
            {(testScanResult.status !== 'idle' || lastScannedBarcode) && (
              <div className="p-3 rounded-xl bg-white border border-[#E8E2D8] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8A8175] font-medium">Barcode Terdeteksi:</span>
                  <span className="font-mono font-bold text-[#D97706]">
                    {testScanResult.code || lastScannedBarcode?.barcode}
                  </span>
                </div>

                {(testScanResult.productName || lastScannedBarcode?.productName) ? (
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#E8E2D8]">
                    <span className="font-bold text-[#15803D] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {testScanResult.productName || lastScannedBarcode?.productName}
                    </span>
                    {testScanResult.price && (
                      <span className="font-bold text-[#D97706]">
                        Rp {testScanResult.price.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-[#B84B3E] font-medium pt-1 border-t border-[#E8E2D8]">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Produk belum terdaftar di database warung</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Settings Toggles */}
          <div className="space-y-3 pt-2 border-t border-[#E8E2D8]">
            <h3 className="text-xs font-bold text-[#2A2622] flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-[#D97706]" />
              Pengaturan Fitur Pemindai
            </h3>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] cursor-pointer hover:bg-white transition-all">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-[#D97706]" />
                  <div>
                    <span className="text-xs font-bold text-[#2A2622] block">Suara Bip Audio (Beep Sound)</span>
                    <span className="text-[11px] text-[#8A8175]">Bunyi bip khas kasir saat barcode berhasil dipindai</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={beepSound}
                  onChange={(e) => setBeepSound(e.target.checked)}
                  className="w-4 h-4 accent-[#D97706] rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] cursor-pointer hover:bg-white transition-all">
                <div className="flex items-center gap-2.5">
                  <Keyboard className="w-4 h-4 text-[#D97706]" />
                  <div>
                    <span className="text-xs font-bold text-[#2A2622] block">Aktifkan Auto-Scan POS</span>
                    <span className="text-[11px] text-[#8A8175]">Otomatis menambah produk ke keranjang saat dipindai</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={enableScanner}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    setEnableScanner(checked);
                    if (!checked) {
                      handleToggleDisconnect();
                    } else {
                      handleToggleConnect();
                    }
                  }}
                  className="w-4 h-4 accent-[#D97706] rounded cursor-pointer"
                />
              </label>

              <div className="p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2A2622]">Sensitivitas Delay Pengetikan (ms)</span>
                  <span className="text-xs font-mono font-bold text-[#D97706]">{maxDelay} ms</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="200"
                  step="5"
                  value={maxDelay}
                  onChange={(e) => setMaxDelay(e.target.value)}
                  className="w-full accent-[#D97706]"
                />
                <p className="text-[10px] text-[#8A8175]">
                  Perangkat scanner Bluetooth mengetik karakter di bawah 50-80ms.
                </p>
              </div>
            </div>
          </div>

          {/* Web Bluetooth Pair Button */}
          <div className="pt-2 border-t border-[#E8E2D8] flex items-center justify-between">
            <button
              type="button"
              onClick={handlePairWebBluetooth}
              className="px-3.5 py-2 rounded-xl bg-[#FEF3C7] hover:bg-[#D97706] text-[#D97706] hover:text-white border border-[#D97706]/30 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sandingkan Web Bluetooth Device</span>
            </button>
          </div>

          {/* Instructions Guide */}
          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D8] space-y-2 text-xs">
            <h4 className="font-bold text-[#2A2622] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#D97706]" />
              Panduan Pemakaian Scanner Bluetooth:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-[#8A8175] text-[11px] leading-relaxed">
              <li>Nyalakan Bluetooth pada perangkat PC / Laptop / Tablet Anda.</li>
              <li>Pastikan alat Scanner Bluetooth dalam mode **HID (Human Interface Device / Keyboard)**.</li>
              <li>Sandingkan (*Pairing*) scanner Bluetooth Anda melalui menu Bluetooth bawaan Windows/Android.</li>
              <li>Buka halaman **Kasir POS** WarungOzy dan arahkan sinar laser ke barcode produk.</li>
              <li>Produk akan otomatis dimasukkan ke keranjang kasir disertai suara *bip!*</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E8E2D8] bg-[#FAF7F2] flex items-center justify-end gap-2">
          <button
            onClick={() => setBluetoothModalOpen(false)}
            className="px-4 py-2.5 rounded-xl border border-[#E8E2D8] bg-white text-[#8A8175] hover:text-[#2A2622] text-xs font-bold"
          >
            Tutup
          </button>
          <button
            onClick={handleSaveScannerSettings}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 min-h-[42px]"
          >
            <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Scanner'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
