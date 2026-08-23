import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { usePOSStore } from '../store/usePOSStore';
import { repository } from '../services/indexedDBRepository';
import { X, Camera, AlertCircle } from 'lucide-react';

export const CameraScannerModal: React.FC = () => {
  const { isCameraScannerOpen, setCameraScannerOpen, addToCart, showToast } = usePOSStore();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isCameraScannerOpen) return;

    let isScanning = true;
    const scannerId = 'reader';

    const startScanner = async () => {
      try {
        const html5QrcodeScanner = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrcodeScanner;

        await html5QrcodeScanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          async (decodedText) => {
            if (!isScanning) return;
            isScanning = false;

            try {
              const product = await repository.findProductByBarcode(decodedText);
              if (product) {
                addToCart(product, 1);
                showToast(`Barcode Scanned: ${product.name}`, 'success');
                stopScanner();
                setCameraScannerOpen(false);
              } else {
                showToast(`Barcode '${decodedText}' tidak ditemukan`, 'error');
                setTimeout(() => {
                  isScanning = true;
                }, 2000);
              }
            } catch (err) {
              console.error(err);
              isScanning = true;
            }
          },
          () => { }
        );
      } catch (err) {
        console.error('Camera Scanner error:', err);
      }
    };

    setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      stopScanner();
    };
  }, [isCameraScannerOpen]);

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          scannerRef.current?.clear();
          scannerRef.current = null;
        })
        .catch(() => { });
    }
  };

  if (!isCameraScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn select-none">
      <div className="bg-white border border-[#E8E2D8] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E8E2D8] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#D97706]" />
            <h2 className="text-sm font-bold text-[#2A2622]">Scanner Kamera Tablet</h2>
          </div>
          <button
            onClick={() => {
              stopScanner();
              setCameraScannerOpen(false);
            }}
            className="p-1.5 rounded-xl text-[#8A8175] hover:text-[#2A2622] bg-white border border-[#E8E2D8]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Viewport */}
        <div className="p-6 flex flex-col items-center justify-center bg-white">
          <div className="w-full max-w-sm rounded-xl overflow-hidden border-2 border-[#D97706] shadow-md relative bg-slate-900 min-h-[260px]">
            <div id="reader" className="w-full h-full"></div>
          </div>
          <p className="mt-4 text-xs text-[#8A8175] text-center flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-4 h-4 text-[#D97706]" />
            Arahkan barcode kemasan produk ke dalam kotak pemindai kamera
          </p>
        </div>
      </div>
    </div>
  );
};
